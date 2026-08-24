import React from 'react';
import '@/styles/agents.css';
import type { AgentSkin } from '@/data/agents';


/**
 * Tiny animated character for an agent — a cute, bobbing little creature
 * (Smurf-ish silhouette) rendered as inline SVG so it costs nothing to load.
 */
const AgentAvatar: React.FC<{
  skin: AgentSkin;
  size?: number;
  active?: boolean;
  className?: string;
}> = ({ skin, size = 56, active = false, className = '' }) => {
  const gid = React.useId().replace(/:/g, '');
  const [a, b] = skin.body;

  return (
    <span
      className={`m-agent-bob relative inline-grid place-items-center ${className}`}
      style={{ width: size, height: size, animationDuration: active ? '1.6s' : '2.8s' }}
      aria-hidden
    >
      <svg viewBox="0 0 64 64" width={size} height={size}>
        <defs>
          <radialGradient id={`bd${gid}`} cx="35%" cy="28%">
            <stop offset="0%" stopColor={b} />
            <stop offset="100%" stopColor={a} />
          </radialGradient>
        </defs>

        {/* shadow */}
        <ellipse cx="32" cy="57" rx="15" ry="3.4" fill="rgba(0,0,0,0.35)" />

        {/* body */}
        <path d="M32 20c9 0 15 8 15 18 0 9-6 14-15 14s-15-5-15-14c0-10 6-18 15-18z" fill={`url(#bd${gid})`} />

        {/* arms */}
        <circle cx="15" cy="40" r="4.2" fill={a} className="m-agent-arm-l" />
        <circle cx="49" cy="40" r="4.2" fill={a} className="m-agent-arm-r" />

        {/* face */}
        <ellipse cx="32" cy="33" rx="11.5" ry="10" fill="#FFF6F0" opacity="0.96" />
        <circle cx="27.6" cy="32.4" r="2.1" fill="#1F2937" className="m-agent-blink" />
        <circle cx="36.4" cy="32.4" r="2.1" fill="#1F2937" className="m-agent-blink" />
        <circle cx="24" cy="37" r="2.4" fill="#FDA4AF" opacity="0.75" />
        <circle cx="40" cy="37" r="2.4" fill="#FDA4AF" opacity="0.75" />
        <path d="M28.5 37.6q3.5 3.4 7 0" stroke="#1F2937" strokeWidth="1.6" strokeLinecap="round" fill="none" />

        {/* props */}
        {skin.prop === 'hat' && (
          <path d="M18 23c2-8 8-12 14-12s12 4 14 12c-4-3-9-4-14-4s-10 1-14 4z" fill={skin.hat} />
        )}
        {skin.prop === 'cap' && (
          <>
            <path d="M19 23c1-8 7-12 13-12s12 4 13 12z" fill={skin.hat} />
            <rect x="42" y="21" width="12" height="3.2" rx="1.6" fill={skin.hat} />
          </>
        )}
        {skin.prop === 'bow' && (
          <>
            <path d="M19 22c1-7 7-11 13-11s12 4 13 11z" fill={skin.hat} opacity="0.9" />
            <path d="M40 15l7-4v9z" fill="#FB7185" />
            <path d="M48 15l7-4v9z" fill="#F472B6" />
          </>
        )}
        {skin.prop === 'halo' && (
          <ellipse cx="32" cy="14" rx="12" ry="3.6" fill="none" stroke={skin.hat} strokeWidth="2.6" className="m-agent-halo" />
        )}
        {skin.prop === 'headset' && (
          <>
            <path d="M19 26a13 13 0 0126 0" fill="none" stroke={skin.hat} strokeWidth="3" strokeLinecap="round" />
            <rect x="15.5" y="24" width="5.5" height="8" rx="2.4" fill={skin.hat} />
            <rect x="43" y="24" width="5.5" height="8" rx="2.4" fill={skin.hat} />
          </>
        )}
        {skin.prop === 'glasses' && (
          <>
            <circle cx="27.6" cy="32.4" r="4.4" fill="none" stroke={skin.hat} strokeWidth="1.7" />
            <circle cx="36.4" cy="32.4" r="4.4" fill="none" stroke={skin.hat} strokeWidth="1.7" />
            <path d="M32 32h0.4" stroke={skin.hat} strokeWidth="1.7" />
          </>
        )}
        {skin.prop === 'visor' && (
          <path d="M19 26h26a2 2 0 012 2v2H17v-2a2 2 0 012-2z" fill={skin.hat} />
        )}
      </svg>

      {active && (
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400 ring-2 ring-[#101118]" />
      )}
    </span>
  );
};

export default AgentAvatar;
