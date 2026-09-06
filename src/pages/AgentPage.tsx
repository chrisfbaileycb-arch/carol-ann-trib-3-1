import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bot, Sparkles } from 'lucide-react';
import AgentStudio from '@/components/agents/AgentStudio';
import { useCarol } from '@/contexts/CarolContext';
import { isLightTheme } from '@/data/intake';
import WallpaperBackground from '@/components/workspace/WallpaperBackground';

/** Dedicated /agent route — agent studio with creation, tuning, memory erase and personality controls. */
const AgentPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, stickers } = useCarol();
  const isLight = isLightTheme(profile);

  return (
    <div className={`relative flex h-screen w-full flex-col bg-transparent select-none overflow-hidden transition-colors ${
      isLight ? 'text-slate-800' : 'text-white'
    }`}>
      {/* Shared Wallpaper Atmospheric Background */}
      <WallpaperBackground profile={profile} stickers={stickers} />

      {/* Top Route Navigation Bar */}
      <div className={`relative z-20 flex shrink-0 items-center justify-between border-b px-5 py-3 backdrop-blur-md ${
        isLight ? 'border-rose-200/60 bg-white/75' : 'border-white/10 bg-zinc-950/75'
      }`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold shadow-sm transition ${
              isLight
                ? 'border-rose-200 bg-white text-slate-800 hover:bg-rose-50'
                : 'border-white/12 bg-white/[0.05] text-white hover:bg-white/15'
            }`}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Workspace</span>
          </button>
          <span className={`h-4 w-px ${isLight ? 'bg-slate-200' : 'bg-white/15'}`} />
          <div className="flex items-center gap-2">
            <span className={`grid h-7 w-7 place-items-center rounded-lg border ${
              isLight ? 'border-pink-200 bg-pink-50 text-pink-600' : 'border-white/10 bg-pink-500/20 text-pink-300'
            }`}>
              <Bot className="h-4 w-4" />
            </span>
            <div>
              <p className={`font-display text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Agent Studio
              </p>
              <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                Sovereign Specialists & Cloud Sub-Agents
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`rounded-full border px-3 py-1 text-[11px] ${
            isLight ? 'border-rose-200 bg-white/80 text-slate-600' : 'border-white/12 bg-white/[0.04] text-white/70'
          }`}>
            Path: <code className={`font-mono font-semibold ${isLight ? 'text-pink-600' : 'text-pink-300'}`}>/agent</code>
          </span>
        </div>
      </div>

      {/* Main Agent Studio Content */}
      <div className="relative z-10 min-h-0 flex-1 overflow-y-auto">
        <AgentStudio
          onOpenChat={(agentId) => {
            navigate(`/?agent=${encodeURIComponent(agentId)}`);
          }}
        />
      </div>
    </div>
  );
};

export default AgentPage;
