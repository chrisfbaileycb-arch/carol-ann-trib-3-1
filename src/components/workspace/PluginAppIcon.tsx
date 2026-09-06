import React from 'react';
import {
  Globe, Mail, Calendar, FolderGit2, MessageSquare, FileText,
  Palette, ShoppingBag, DollarSign, CreditCard, Zap, Share2,
  Video, CheckSquare, Clock, Cloud, Briefcase, BarChart3, Building
} from 'lucide-react';
import type { MCPPlugin } from '@/data/mcpPlugins';

interface PluginAppIconProps {
  iconType: MCPPlugin['iconType'];
  size?: number;
  className?: string;
}

export const PluginAppIcon: React.FC<PluginAppIconProps> = ({ iconType, size = 36, className = '' }) => {
  const pixelSize = `${size}px`;

  switch (iconType) {
    case 'instagram':
      return (
        <div
          style={{ width: pixelSize, height: pixelSize }}
          className={`grid place-items-center rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-sm ${className}`}
        >
          <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
          </svg>
        </div>
      );

    case 'facebook':
      return (
        <div
          style={{ width: pixelSize, height: pixelSize }}
          className={`grid place-items-center rounded-xl bg-[#1877F2] text-white shadow-sm ${className}`}
        >
          <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        </div>
      );

    case 'tiktok':
      return (
        <div
          style={{ width: pixelSize, height: pixelSize }}
          className={`grid place-items-center rounded-xl bg-black text-white border border-white/20 shadow-sm ${className}`}
        >
          <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.066-.089a2.895 2.895 0 0 1 2.372-4.551c.367 0 .72.07 1.042.2V9.42a6.34 6.34 0 0 0-1.042-.086 6.34 6.34 0 0 0-6.335 6.34 6.34 6.34 0 0 0 10.82 4.482l.067-.066a6.32 6.32 0 0 0 1.788-4.416V8.625a8.196 8.196 0 0 0 4.77 1.527V6.707a4.83 4.83 0 0 1-1-.021z"/>
          </svg>
        </div>
      );

    case 'youtube':
      return (
        <div
          style={{ width: pixelSize, height: pixelSize }}
          className={`grid place-items-center rounded-xl bg-[#FF0000] text-white shadow-sm ${className}`}
        >
          <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        </div>
      );

    case 'tripadvisor':
      return (
        <div
          style={{ width: pixelSize, height: pixelSize }}
          className={`grid place-items-center rounded-xl bg-[#00AF87] text-white shadow-sm ${className}`}
        >
          <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="currentColor">
            <circle cx="6.5" cy="14" r="3.5" fill="none" stroke="currentColor" strokeWidth="2"/>
            <circle cx="17.5" cy="14" r="3.5" fill="none" stroke="currentColor" strokeWidth="2"/>
            <circle cx="6.5" cy="14" r="1.5" fill="currentColor"/>
            <circle cx="17.5" cy="14" r="1.5" fill="currentColor"/>
            <path d="M12 7c-4 0-7 2-9 4.5h18C19 9 16 7 12 7z"/>
            <polygon points="12,12 10.5,14 13.5,14" fill="currentColor"/>
          </svg>
        </div>
      );

    case 'yelp':
      return (
        <div
          style={{ width: pixelSize, height: pixelSize }}
          className={`grid place-items-center rounded-xl bg-[#D32323] text-white shadow-sm ${className}`}
        >
          <span className="font-bold text-xs font-serif tracking-tighter">yelp</span>
        </div>
      );

    case 'google':
      return (
        <div
          style={{ width: pixelSize, height: pixelSize }}
          className={`grid place-items-center rounded-xl bg-white text-slate-800 border border-slate-200 shadow-sm ${className}`}
        >
          <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.94 0 12s.45 3.84 1.24 5.42l4.04-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
          </svg>
        </div>
      );

    case 'shopify':
      return (
        <div
          style={{ width: pixelSize, height: pixelSize }}
          className={`grid place-items-center rounded-xl bg-[#95BF47] text-white shadow-sm ${className}`}
        >
          <ShoppingBag className="h-5 w-5 text-white" />
        </div>
      );

    case 'quickbooks':
      return (
        <div
          style={{ width: pixelSize, height: pixelSize }}
          className={`grid place-items-center rounded-xl bg-[#2CA01C] text-white shadow-sm ${className}`}
        >
          <span className="font-black text-sm tracking-tighter">qb</span>
        </div>
      );

    case 'stripe':
      return (
        <div
          style={{ width: pixelSize, height: pixelSize }}
          className={`grid place-items-center rounded-xl bg-[#635BFF] text-white shadow-sm ${className}`}
        >
          <CreditCard className="h-5 w-5 text-white" />
        </div>
      );

    case 'zapier':
      return (
        <div
          style={{ width: pixelSize, height: pixelSize }}
          className={`grid place-items-center rounded-xl bg-[#FF4F00] text-white shadow-sm ${className}`}
        >
          <Zap className="h-5 w-5 text-white fill-white" />
        </div>
      );

    case 'gmail':
      return (
        <div
          style={{ width: pixelSize, height: pixelSize }}
          className={`grid place-items-center rounded-xl bg-[#EA4335] text-white shadow-sm ${className}`}
        >
          <Mail className="h-5 w-5 text-white" />
        </div>
      );

    case 'gdrive':
      return (
        <div
          style={{ width: pixelSize, height: pixelSize }}
          className={`grid place-items-center rounded-xl bg-[#0F9D58] text-white shadow-sm ${className}`}
        >
          <Cloud className="h-5 w-5 text-white" />
        </div>
      );

    case 'gcalendar':
      return (
        <div
          style={{ width: pixelSize, height: pixelSize }}
          className={`grid place-items-center rounded-xl bg-[#4285F4] text-white shadow-sm ${className}`}
        >
          <Calendar className="h-5 w-5 text-white" />
        </div>
      );

    case 'github':
      return (
        <div
          style={{ width: pixelSize, height: pixelSize }}
          className={`grid place-items-center rounded-xl bg-[#24292e] text-white shadow-sm ${className}`}
        >
          <FolderGit2 className="h-5 w-5 text-white" />
        </div>
      );

    case 'slack':
      return (
        <div
          style={{ width: pixelSize, height: pixelSize }}
          className={`grid place-items-center rounded-xl bg-[#4A154B] text-white shadow-sm ${className}`}
        >
          <MessageSquare className="h-5 w-5 text-white" />
        </div>
      );

    case 'notion':
      return (
        <div
          style={{ width: pixelSize, height: pixelSize }}
          className={`grid place-items-center rounded-xl bg-black text-white border border-white/20 shadow-sm ${className}`}
        >
          <span className="font-serif font-black text-sm">N</span>
        </div>
      );

    case 'canva':
      return (
        <div
          style={{ width: pixelSize, height: pixelSize }}
          className={`grid place-items-center rounded-xl bg-gradient-to-r from-[#00C4CC] to-[#7D2AE8] text-white shadow-sm ${className}`}
        >
          <Palette className="h-5 w-5 text-white" />
        </div>
      );

    case 'hubspot':
      return (
        <div
          style={{ width: pixelSize, height: pixelSize }}
          className={`grid place-items-center rounded-xl bg-[#FF7A59] text-white shadow-sm ${className}`}
        >
          <Building className="h-5 w-5 text-white" />
        </div>
      );

    case 'wordpress':
      return (
        <div
          style={{ width: pixelSize, height: pixelSize }}
          className={`grid place-items-center rounded-xl bg-[#21759B] text-white shadow-sm ${className}`}
        >
          <span className="font-serif font-black text-sm">W</span>
        </div>
      );

    case 'trello':
      return (
        <div
          style={{ width: pixelSize, height: pixelSize }}
          className={`grid place-items-center rounded-xl bg-[#0079BF] text-white shadow-sm ${className}`}
        >
          <CheckSquare className="h-5 w-5 text-white" />
        </div>
      );

    case 'asana':
      return (
        <div
          style={{ width: pixelSize, height: pixelSize }}
          className={`grid place-items-center rounded-xl bg-[#F06A6A] text-white shadow-sm ${className}`}
        >
          <div className="flex gap-0.5">
            <span className="h-2 w-2 rounded-full bg-white" />
            <span className="h-2 w-2 rounded-full bg-white" />
          </div>
        </div>
      );

    case 'monday':
      return (
        <div
          style={{ width: pixelSize, height: pixelSize }}
          className={`grid place-items-center rounded-xl bg-[#FF3D57] text-white shadow-sm ${className}`}
        >
          <BarChart3 className="h-5 w-5 text-white" />
        </div>
      );

    case 'box':
      return (
        <div
          style={{ width: pixelSize, height: pixelSize }}
          className={`grid place-items-center rounded-xl bg-[#0061D5] text-white shadow-sm ${className}`}
        >
          <Cloud className="h-5 w-5 text-white" />
        </div>
      );

    case 'clickup':
      return (
        <div
          style={{ width: pixelSize, height: pixelSize }}
          className={`grid place-items-center rounded-xl bg-gradient-to-tr from-[#7B68EE] to-[#FF007F] text-white shadow-sm ${className}`}
        >
          <CheckSquare className="h-5 w-5 text-white" />
        </div>
      );

    case 'coda':
      return (
        <div
          style={{ width: pixelSize, height: pixelSize }}
          className={`grid place-items-center rounded-xl bg-[#F05537] text-white shadow-sm ${className}`}
        >
          <FileText className="h-5 w-5 text-white" />
        </div>
      );

    case 'plaid':
      return (
        <div
          style={{ width: pixelSize, height: pixelSize }}
          className={`grid place-items-center rounded-xl bg-[#000000] text-white border border-white/20 shadow-sm ${className}`}
        >
          <DollarSign className="h-5 w-5 text-emerald-400" />
        </div>
      );

    case 'ibkr':
      return (
        <div
          style={{ width: pixelSize, height: pixelSize }}
          className={`grid place-items-center rounded-xl bg-[#D3122A] text-white shadow-sm ${className}`}
        >
          <span className="font-bold text-[10px] tracking-tight">IBKR</span>
        </div>
      );

    case 'expensify':
      return (
        <div
          style={{ width: pixelSize, height: pixelSize }}
          className={`grid place-items-center rounded-xl bg-[#03D47C] text-slate-900 shadow-sm ${className}`}
        >
          <DollarSign className="h-5 w-5 text-slate-900" />
        </div>
      );

    case 'wave':
      return (
        <div
          style={{ width: pixelSize, height: pixelSize }}
          className={`grid place-items-center rounded-xl bg-[#1C538C] text-white shadow-sm ${className}`}
        >
          <Briefcase className="h-5 w-5 text-white" />
        </div>
      );

    default:
      return (
        <div
          style={{ width: pixelSize, height: pixelSize }}
          className={`grid place-items-center rounded-xl bg-white/10 text-white shadow-sm ${className}`}
        >
          <Globe className="h-5 w-5" />
        </div>
      );
  }
};
