/**
 * Gemini Live Voice Audio Engine & Real-Time Analyzer
 * Handles:
 * 1. Live microphone stream capture with noise suppression & gain control
 * 2. High-precision Web Audio Analyser for real-time waveform and frequency reactions
 * 3. 16kHz PCM downsampling and WebSocket streaming to /api/gemini/live
 * 4. 24kHz raw PCM synthesis playback for Gemini's voice response with seamless queueing
 * 5. Low-latency interruption handling (barge-in)
 */

export type LiveAudioState =
  | 'idle'
  | 'requesting_mic'
  | 'connecting'
  | 'listening'
  | 'speaking'
  | 'interrupted'
  | 'error';

export interface AudioMetrics {
  rms: number;           // 0.0 to 1.0 root-mean-square
  decibels: number;      // -90 to 0 dB
  peak: number;          // 0.0 to 1.0 peak amplitude
  isSpeaking: boolean;   // true if user speaking above noise gate
  frequencies: Uint8Array; // FFT frequency bins
  timeDomain: Uint8Array;  // Raw oscillating waveform samples
}

type MetricsCallback = (metrics: AudioMetrics) => void;
type StateCallback = (state: LiveAudioState, error?: string) => void;
type TranscriptCallback = (text: string, isModel: boolean) => void;

function floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  let offset = 0;
  for (let i = 0; i < float32Array.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  return buffer;
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export class GeminiLiveAudioEngine {
  private state: LiveAudioState = 'idle';
  private errorMessage: string | null = null;
  private ws: WebSocket | null = null;
  private mediaStream: MediaStream | null = null;

  // Input Audio (Mic -> 16kHz)
  private inputAudioCtx: AudioContext | null = null;
  private inputAnalyser: AnalyserNode | null = null;
  private inputProcessor: ScriptProcessorNode | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;

  // Output Audio (Gemini Speech -> 24kHz)
  private outputAudioCtx: AudioContext | null = null;
  private outputAnalyser: AnalyserNode | null = null;
  private nextPlayTime: number = 0;
  private activeAudioSources: AudioBufferSourceNode[] = [];

  // Metrics animation frame
  private animationFrameId: number | null = null;
  private metricsSubscribers = new Set<MetricsCallback>();
  private stateSubscribers = new Set<StateCallback>();
  private transcriptSubscribers = new Set<TranscriptCallback>();

  // Cached buffers for zero-allocation loops
  private freqData = new Uint8Array(64);
  private timeData = new Uint8Array(128);

  public getState(): LiveAudioState {
    return this.state;
  }

  public getErrorMessage(): string | null {
    return this.errorMessage;
  }

  public subscribeMetrics(callback: MetricsCallback): () => void {
    this.metricsSubscribers.add(callback);
    return () => this.metricsSubscribers.delete(callback);
  }

  public subscribeState(callback: StateCallback): () => void {
    this.stateSubscribers.add(callback);
    callback(this.state, this.errorMessage ?? undefined);
    return () => this.stateSubscribers.delete(callback);
  }

  public subscribeTranscript(callback: TranscriptCallback): () => void {
    this.transcriptSubscribers.add(callback);
    return () => this.transcriptSubscribers.delete(callback);
  }

  private setState(newState: LiveAudioState, error?: string) {
    this.state = newState;
    this.errorMessage = error ?? null;
    this.stateSubscribers.forEach((cb) => cb(newState, error));
  }

  /**
   * Starts a live session: requests mic, connects WebSocket to /api/gemini/live,
   * streams 16kHz PCM audio, and plays 24kHz model voice output.
   */
  public async start(options?: { voiceName?: string }): Promise<void> {
    if (this.state !== 'idle' && this.state !== 'error') {
      return;
    }

    try {
      this.setState('requesting_mic');

      // 1. Request Microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      this.mediaStream = stream;

      // 2. Initialize Input Web Audio Context
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const inputCtx = new AudioContextClass({ sampleRate: 16000 });
      this.inputAudioCtx = inputCtx;

      if (inputCtx.state === 'suspended') {
        await inputCtx.resume();
      }

      // Input Analyser for real-time waveform reactivity
      const analyser = inputCtx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.65;
      this.inputAnalyser = analyser;

      const source = inputCtx.createMediaStreamSource(stream);
      this.inputSource = source;
      source.connect(analyser);

      // Script Processor to stream 16-bit PCM @ 16kHz
      const processor = inputCtx.createScriptProcessor(2048, 1, 1);
      this.inputProcessor = processor;
      source.connect(processor);

      // Silent gain node to avoid local echo
      const muteGain = inputCtx.createGain();
      muteGain.gain.value = 0;
      processor.connect(muteGain);
      muteGain.connect(inputCtx.destination);

      // 3. Initialize Output Audio Context (24kHz for Gemini Live speech)
      const outputCtx = new AudioContextClass({ sampleRate: 24000 });
      this.outputAudioCtx = outputCtx;
      if (outputCtx.state === 'suspended') {
        await outputCtx.resume();
      }

      const outAnalyser = outputCtx.createAnalyser();
      outAnalyser.fftSize = 128;
      outAnalyser.smoothingTimeConstant = 0.7;
      outAnalyser.connect(outputCtx.destination);
      this.outputAnalyser = outAnalyser;

      this.setState('connecting');

      // 4. Connect WebSocket to /api/gemini/live
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/gemini/live`;
      const ws = new WebSocket(wsUrl);
      this.ws = ws;

      ws.onopen = () => {
        this.setState('listening');
        if (options?.voiceName) {
          try {
            ws.send(JSON.stringify({ config: { voiceName: options.voiceName } }));
          } catch {
            // Ignore config handshake error
          }
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'connected') {
            this.setState('listening');
          }

          if (data.audio) {
            this.handleIncomingAudio(data.audio);
          }

          if (data.text) {
            this.transcriptSubscribers.forEach((cb) => cb(data.text, true));
          }

          if (data.interrupted) {
            this.handleInterruption();
          }

          if (data.error) {
            console.warn('[Gemini Live Audio] Server reported error:', data.error);
            this.setState('error', data.error);
          }
        } catch (err) {
          console.error('[Gemini Live Audio] Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = () => {
        this.setState('error', 'Unable to connect to Gemini Live voice orchestrator.');
      };

      ws.onclose = () => {
        if (this.state !== 'idle') {
          this.stop();
        }
      };

      // 5. Audio Processing Pipeline: stream PCM to WebSocket
      processor.onaudioprocess = (e) => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          const pcm16 = floatTo16BitPCM(inputData);
          const base64 = arrayBufferToBase64(pcm16);
          try {
            this.ws.send(JSON.stringify({ audio: base64 }));
          } catch (err) {
            console.warn('[Gemini Live Audio] Failed to send audio chunk:', err);
          }
        }
      };

      // 6. Start continuous Metrics Animation Loop for waveform
      this.startMetricsLoop();
    } catch (err) {
      console.error('[Gemini Live Audio] Initialization failed:', err);
      const msg = err instanceof Error ? err.message : 'Microphone access denied or audio failed.';
      this.setState('error', msg);
      this.stop();
    }
  }

  /**
   * Schedules and plays 24kHz raw PCM audio chunks received from Gemini Live
   */
  private handleIncomingAudio(base64Audio: string) {
    if (!this.outputAudioCtx || !this.outputAnalyser) return;

    try {
      const pcmBuffer = base64ToArrayBuffer(base64Audio);
      const dataView = new DataView(pcmBuffer);
      const numSamples = pcmBuffer.byteLength / 2;
      const float32 = new Float32Array(numSamples);

      for (let i = 0; i < numSamples; i++) {
        const int16 = dataView.getInt16(i * 2, true);
        float32[i] = int16 / 32768.0;
      }

      const audioBuffer = this.outputAudioCtx.createBuffer(1, numSamples, 24000);
      audioBuffer.getChannelData(0).set(float32);

      const source = this.outputAudioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.outputAnalyser);

      const currentTime = this.outputAudioCtx.currentTime;
      if (this.nextPlayTime < currentTime) {
        this.nextPlayTime = currentTime;
      }

      source.start(this.nextPlayTime);
      this.nextPlayTime += audioBuffer.duration;

      this.activeAudioSources.push(source);
      source.onended = () => {
        const idx = this.activeAudioSources.indexOf(source);
        if (idx !== -1) {
          this.activeAudioSources.splice(idx, 1);
        }
        if (this.activeAudioSources.length === 0 && this.state === 'speaking') {
          this.setState('listening');
        }
      };

      if (this.state !== 'speaking') {
        this.setState('speaking');
      }
    } catch (err) {
      console.error('[Gemini Live Audio] Playback chunk error:', err);
    }
  }

  /**
   * Handles user barge-in / interruption
   */
  public handleInterruption() {
    this.activeAudioSources.forEach((src) => {
      try {
        src.stop();
        src.disconnect();
      } catch {
        // Source might have already ended
      }
    });
    this.activeAudioSources = [];
    if (this.outputAudioCtx) {
      this.nextPlayTime = this.outputAudioCtx.currentTime;
    }
    this.setState('interrupted');
    setTimeout(() => {
      if (this.state === 'interrupted') {
        this.setState('listening');
      }
    }, 400);
  }

  /**
   * Continuous high-frequency metrics loop measuring live audio parameters
   */
  private startMetricsLoop() {
    const loop = () => {
      // Pick analyser: if model is currently speaking, show output frequencies;
      // otherwise show user's microphone frequencies
      const isModelSpeaking = this.state === 'speaking';
      const activeAnalyser = isModelSpeaking && this.outputAnalyser ? this.outputAnalyser : this.inputAnalyser;

      if (activeAnalyser) {
        if (this.freqData.length !== activeAnalyser.frequencyBinCount) {
          this.freqData = new Uint8Array(activeAnalyser.frequencyBinCount);
        }
        if (this.timeData.length !== activeAnalyser.fftSize) {
          this.timeData = new Uint8Array(activeAnalyser.fftSize);
        }

        activeAnalyser.getByteFrequencyData(this.freqData);
        activeAnalyser.getByteTimeDomainData(this.timeData);

        // Compute RMS and Peak from time domain
        let sumSquares = 0;
        let peakVal = 0;
        const len = this.timeData.length;
        for (let i = 0; i < len; i++) {
          const sample = (this.timeData[i] - 128) / 128;
          const abs = Math.abs(sample);
          if (abs > peakVal) peakVal = abs;
          sumSquares += sample * sample;
        }

        const rms = Math.sqrt(sumSquares / len);
        // Decibels range from -90 dB to 0 dB
        const decibels = Math.max(-90, Math.min(0, Math.round(20 * Math.log10(rms || 0.0001))));
        const isSpeaking = rms > 0.025;

        const metrics: AudioMetrics = {
          rms,
          decibels,
          peak: peakVal,
          isSpeaking,
          frequencies: this.freqData,
          timeDomain: this.timeData,
        };

        this.metricsSubscribers.forEach((cb) => cb(metrics));
      }

      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  /**
   * Stops the live session, releases microphone and audio contexts
   */
  public stop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.ws) {
      try {
        if (this.ws.readyState === WebSocket.OPEN) {
          this.ws.close();
        }
      } catch {
        // Ignore close errors
      }
      this.ws = null;
    }

    if (this.inputProcessor) {
      this.inputProcessor.disconnect();
      this.inputProcessor.onaudioprocess = null;
      this.inputProcessor = null;
    }

    if (this.inputSource) {
      this.inputSource.disconnect();
      this.inputSource = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.inputAudioCtx) {
      void this.inputAudioCtx.close();
      this.inputAudioCtx = null;
    }

    this.activeAudioSources.forEach((src) => {
      try {
        src.stop();
        src.disconnect();
      } catch {
        // Ignore
      }
    });
    this.activeAudioSources = [];

    if (this.outputAudioCtx) {
      void this.outputAudioCtx.close();
      this.outputAudioCtx = null;
    }

    this.setState('idle');
  }
}

// Global singleton instance for app-wide live session orchestration
export const liveAudioEngine = new GeminiLiveAudioEngine();
