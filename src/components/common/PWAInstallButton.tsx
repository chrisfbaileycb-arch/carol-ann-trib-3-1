import React, { useState } from 'react';
import { Download, CheckCircle2, Smartphone, Monitor, X, Share } from 'lucide-react';
import { usePWAInstall, useOnlineStatus } from '@/hooks/usePWAInstall';

interface PWAInstallButtonProps {
  isLight?: boolean;
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ isLight = false, compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return (
      <span
        className={`hidden xl:inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${
          isLight
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
        }`}
        title="Running as Installed Adaptive PWA"
      >
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
        <span>PWA Docked</span>
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={async () => {
          if (isInstallable) {
            await install();
          } else {
            setShowGuide(true);
          }
        }}
        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
          isLight
            ? 'border-indigo-200 bg-indigo-50/90 text-indigo-800 hover:bg-indigo-100 shadow-xs'
            : 'border-indigo-400/35 bg-indigo-500/15 text-indigo-200 hover:bg-indigo-500/25'
        }`}
        title="Install Carol Ann Adaptive PWA for Googlebook, Android Desktop, or Phone Co-Pilot"
      >
        <Download className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-300" />
        <span className={compact ? 'inline' : 'hidden sm:inline'}>
          {isIOS ? 'Install on iOS' : 'Install PWA'}
        </span>
      </button>

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
          <div
            className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl ${
              isLight
                ? 'border-rose-200 bg-white text-slate-900'
                : 'border-white/15 bg-[#14151F] text-white'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                  <Download className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="font-display text-sm font-bold">
                    Install Carol Ann Adaptive PWA
                  </h3>
                  <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-white/55'}`}>
                    Unified Googlebook, Android Desktop & Phone Co-Pilot Runtime
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              {isIOS ? (
                <div
                  className={`rounded-xl border p-3.5 space-y-2 ${
                    isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-white/[0.04]'
                  }`}
                >
                  <p className="font-bold flex items-center gap-1.5">
                    <Share className="h-3.5 w-3.5 text-indigo-400" /> Install on iPhone / iPad (Safari):
                  </p>
                  <ol className="list-decimal list-inside space-y-1 opacity-85">
                    <li>Tap the <strong>Share</strong> icon in the Safari toolbar.</li>
                    <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                    <li>Launch Carol Ann in standalone Phone Co-Pilot mode.</li>
                  </ol>
                </div>
              ) : (
                <>
                  <div
                    className={`rounded-xl border p-3.5 space-y-1.5 ${
                      isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-white/[0.04]'
                    }`}
                  >
                    <p className="font-bold flex items-center gap-1.5">
                      <Monitor className="h-3.5 w-3.5 text-sky-400" /> Googlebook / Chrome Desktop:
                    </p>
                    <p className="opacity-80 leading-relaxed">
                      Click the <strong>Install Carol Ann</strong> icon in your browser address bar (or open the app in a top-level tab outside the preview frame) to dock Carol Ann with native window controls and split-canvas orchestration.
                    </p>
                  </div>

                  <div
                    className={`rounded-xl border p-3.5 space-y-1.5 ${
                      isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-white/[0.04]'
                    }`}
                  >
                    <p className="font-bold flex items-center gap-1.5">
                      <Smartphone className="h-3.5 w-3.5 text-purple-400" /> Android Companion Phone:
                    </p>
                    <p className="opacity-80 leading-relaxed">
                      Tap the browser menu (<strong>⋮</strong>) and select <strong>Install app</strong> or <strong>Add to Home screen</strong> to use your phone as the Executive Mic, Voice Speaker & Remote Controller.
                    </p>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setShowGuide(false)}
              className="mt-4 w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2 text-xs font-bold text-white transition cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-12 left-4 z-50 flex items-center gap-2 rounded-xl border border-amber-400/40 bg-amber-950/95 px-3.5 py-2 text-xs font-semibold text-amber-200 shadow-xl backdrop-blur-md">
      <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
      <span>Offline Mode — PWA Service Worker cache active. Commands queued for sync.</span>
    </div>
  );
};
