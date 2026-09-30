// Performance Tracking Engine: Agent Call Latency & UI Responsiveness Monitor
// Monitors Gemini/Agent API durations, Time-To-First-Token, active background tasks, and main-thread UI hitches.

export interface AgentCallRecord {
  id: string;
  agentId: string;
  agentName: string;
  taskName: string;
  startTime: number;
  durationMs: number;
  ttftMs?: number;
  status: 'pending' | 'success' | 'error';
  error?: string;
  timestamp: string;
}

export interface BackgroundTaskRecord {
  id: string;
  label: string;
  startTime: number;
  durationMs?: number;
  status: 'running' | 'completed' | 'failed';
  timestamp: string;
}

export interface UIHitchRecord {
  id: string;
  timestamp: string;
  durationMs: number;
  severity: 'minor' | 'major';
}

export interface PerformanceSnapshot {
  averageLatencyMs: number;
  p95LatencyMs: number;
  averageTtftMs: number;
  totalAgentCalls: number;
  activeBackgroundTasksCount: number;
  currentFps: number;
  responsivenessScore: number; // 0 - 100%
  recentAgentCalls: AgentCallRecord[];
  activeBackgroundTasks: BackgroundTaskRecord[];
  recentHitches: UIHitchRecord[];
}

export type PerformanceListener = (snapshot: PerformanceSnapshot) => void;

class PerformanceTrackerEngine {
  private agentCalls: AgentCallRecord[] = [];
  private backgroundTasks: Map<string, BackgroundTaskRecord> = new Map();
  private hitches: UIHitchRecord[] = [];
  private listeners: Set<PerformanceListener> = new Set();

  private isRunning: boolean = false;
  private currentFps: number = 60;
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private fpsSampleStartTime: number = 0;
  private animFrameId: number | null = null;
  private longTaskObserver: PerformanceObserver | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initSampler();
    }
  }

  private initSampler() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.fpsSampleStartTime = performance.now();

    // 1. LongTask PerformanceObserver for modern browsers
    try {
      if (typeof PerformanceObserver !== 'undefined' && PerformanceObserver.supportedEntryTypes?.includes('longtask')) {
        this.longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const duration = Math.round(entry.duration);
            if (duration >= 50) {
              this.recordHitch(duration);
            }
          }
        });
        this.longTaskObserver.observe({ entryTypes: ['longtask'] });
      }
    } catch {
      // LongTask observer not supported in environment
    }

    // 2. RequestAnimationFrame Main-Thread Hitch & FPS Sampler
    const sample = (now: number) => {
      const delta = now - this.lastFrameTime;
      this.frameCount++;

      // Detect frame hitches > 50ms (equivalent to a frame dropping below 20fps)
      if (delta >= 50 && this.lastFrameTime > 0) {
        this.recordHitch(Math.round(delta));
      }

      this.lastFrameTime = now;

      // Recalculate FPS every 1000ms
      const elapsed = now - this.fpsSampleStartTime;
      if (elapsed >= 1000) {
        this.currentFps = Math.min(60, Math.round((this.frameCount * 1000) / elapsed));
        this.frameCount = 0;
        this.fpsSampleStartTime = now;
        this.notifyListeners();
      }

      if (this.isRunning) {
        this.animFrameId = requestAnimationFrame(sample);
      }
    };

    this.animFrameId = requestAnimationFrame(sample);
  }

  public recordHitch(durationMs: number) {
    const hitch: UIHitchRecord = {
      id: `hitch_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toLocaleTimeString(),
      durationMs,
      severity: durationMs > 100 ? 'major' : 'minor',
    };

    this.hitches = [hitch, ...this.hitches].slice(0, 30);
    this.notifyListeners();
  }

  /**
   * Tracks the start of an agent call
   */
  public startAgentCall(callId: string, agentId: string, agentName: string, taskName: string): AgentCallRecord {
    const record: AgentCallRecord = {
      id: callId,
      agentId,
      agentName,
      taskName,
      startTime: performance.now(),
      durationMs: 0,
      status: 'pending',
      timestamp: new Date().toLocaleTimeString(),
    };

    this.agentCalls = [record, ...this.agentCalls].slice(0, 50);
    this.notifyListeners();
    return record;
  }

  /**
   * Records time to first token (TTFT) for streaming responses
   */
  public recordTtft(callId: string) {
    const call = this.agentCalls.find((c) => c.id === callId);
    if (call && call.status === 'pending' && !call.ttftMs) {
      call.ttftMs = Math.round(performance.now() - call.startTime);
      this.notifyListeners();
    }
  }

  /**
   * Concludes an agent call
   */
  public endAgentCall(callId: string, outcome: { success: boolean; error?: string }): AgentCallRecord | null {
    const call = this.agentCalls.find((c) => c.id === callId);
    if (!call) return null;

    call.durationMs = Math.round(performance.now() - call.startTime);
    call.status = outcome.success ? 'success' : 'error';
    if (outcome.error) {
      call.error = outcome.error;
    }
    if (!call.ttftMs) {
      call.ttftMs = call.durationMs;
    }

    this.notifyListeners();
    return call;
  }

  /**
   * Measures a promise-based agent call automatically
   */
  public async measureAgentCall<T>(
    agentId: string,
    agentName: string,
    taskName: string,
    callFn: (onFirstChunk?: () => void) => Promise<T>
  ): Promise<T> {
    const callId = `call_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    this.startAgentCall(callId, agentId, agentName, taskName);

    try {
      const result = await callFn(() => {
        this.recordTtft(callId);
      });
      this.endAgentCall(callId, { success: true });
      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.endAgentCall(callId, { success: false, error: msg });
      throw err;
    }
  }

  /**
   * Tracks heavy background operations (e.g. DOM automation, batch memory indexing)
   */
  public startBackgroundTask(taskId: string, label: string): BackgroundTaskRecord {
    const task: BackgroundTaskRecord = {
      id: taskId,
      label,
      startTime: performance.now(),
      status: 'running',
      timestamp: new Date().toLocaleTimeString(),
    };

    this.backgroundTasks.set(taskId, task);
    this.notifyListeners();
    return task;
  }

  public endBackgroundTask(taskId: string, status: 'completed' | 'failed' = 'completed') {
    const task = this.backgroundTasks.get(taskId);
    if (task) {
      task.durationMs = Math.round(performance.now() - task.startTime);
      task.status = status;
      this.notifyListeners();

      // Clean up after 10 seconds from active map
      setTimeout(() => {
        this.backgroundTasks.delete(taskId);
        this.notifyListeners();
      }, 10000);
    }
  }

  /**
   * Calculates overall responsiveness score (0-100%)
   * Takes into account FPS, recent hitches, and active background strain
   */
  public getResponsivenessScore(): number {
    let score = 100;

    // Penalty for dropped FPS below 60
    if (this.currentFps < 60) {
      score -= (60 - this.currentFps) * 1.5;
    }

    // Penalty for major hitches in recent window
    const majorHitches = this.hitches.filter((h) => h.severity === 'major').length;
    score -= majorHitches * 5;

    // Penalty for minor hitches
    const minorHitches = this.hitches.filter((h) => h.severity === 'minor').length;
    score -= minorHitches * 2;

    return Math.max(10, Math.min(100, Math.round(score)));
  }

  /**
   * Provides current snapshot of metrics
   */
  public getSnapshot(): PerformanceSnapshot {
    const completedCalls = this.agentCalls.filter((c) => c.status === 'success' || c.status === 'error');
    const durations = completedCalls.map((c) => c.durationMs).sort((a, b) => a - b);
    const ttfts = completedCalls.filter((c) => c.ttftMs !== undefined).map((c) => c.ttftMs!);

    const averageLatencyMs = durations.length
      ? Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length)
      : 0;

    const p95Index = Math.floor(durations.length * 0.95);
    const p95LatencyMs = durations.length ? durations[p95Index] || durations[durations.length - 1] : 0;

    const averageTtftMs = ttfts.length
      ? Math.round(ttfts.reduce((sum, d) => sum + d, 0) / ttfts.length)
      : 0;

    return {
      averageLatencyMs,
      p95LatencyMs,
      averageTtftMs,
      totalAgentCalls: this.agentCalls.length,
      activeBackgroundTasksCount: Array.from(this.backgroundTasks.values()).filter((t) => t.status === 'running').length,
      currentFps: this.currentFps,
      responsivenessScore: this.getResponsivenessScore(),
      recentAgentCalls: [...this.agentCalls],
      activeBackgroundTasks: Array.from(this.backgroundTasks.values()),
      recentHitches: [...this.hitches],
    };
  }

  public subscribe(listener: PerformanceListener): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    const snap = this.getSnapshot();
    this.listeners.forEach((fn) => {
      try {
        fn(snap);
      } catch (err) {
        console.warn('[PerformanceTracker] listener error:', err);
      }
    });
  }

  /**
   * Stress-test / Benchmark helper: triggers a controlled background compute slice
   * so operators can test the UI responsiveness hitch detection live
   */
  public simulateHeavyBackgroundWork(durationMs = 250) {
    const taskId = `heavy_work_${Date.now()}`;
    this.startBackgroundTask(taskId, `Heavy Background Compute (${durationMs}ms)`);

    const start = performance.now();
    // Intentionally block main thread in short micro-bursts to trigger hitch detection
    while (performance.now() - start < durationMs) {
      Math.sin(Math.random()) * Math.cos(Math.random());
    }

    this.endBackgroundTask(taskId, 'completed');
  }

  public clearMetrics() {
    this.agentCalls = [];
    this.hitches = [];
    this.notifyListeners();
  }
}

export const performanceTracker = new PerformanceTrackerEngine();

// Window exposure for developer console inspection
if (typeof window !== 'undefined') {
  (window as unknown as { performanceTracker: PerformanceTrackerEngine }).performanceTracker = performanceTracker;
}
