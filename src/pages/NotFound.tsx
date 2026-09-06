import React, { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';

const NotFound: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    console.warn('404 Route Encountered:', location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-4 select-none relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-pink-500/15 blur-[120px] pointer-events-none" />

      <div className="relative z-10 text-center max-w-md p-8 rounded-3xl border border-white/12 bg-white/[0.04] backdrop-blur-2xl shadow-2xl">
        <span className="inline-grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-pink-500/20 to-violet-500/20 text-pink-300 border border-white/10 mb-5">
          <Compass className="h-7 w-7" />
        </span>
        <h1 className="font-display text-4xl font-bold tracking-tight text-white mb-2">404</h1>
        <p className="text-sm font-semibold text-white/90 mb-1">Path not found</p>
        <p className="text-xs text-white/50 mb-6 font-mono">
          {location.pathname}
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-semibold text-black hover:bg-white/90 transition shadow-lg"
        >
          <Home className="h-4 w-4" />
          <span>Return to Workspace</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
