'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

export const PageLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6 text-white select-none animate-in fade-in duration-200">
      {/* Animated Glowing Emblem */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-slate-950 flex items-center justify-center shadow-2xl glow-gold animate-bounce">
          <Sparkles className="w-10 h-10 text-slate-950" />
        </div>
      </div>

      {/* Brand Title & Tagline */}
      <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-300 font-heading mb-1 text-center">
        VAILI PYRO PARK
      </h1>
      <p className="text-xs text-amber-200/80 font-medium uppercase tracking-widest mb-8 text-center">
        Sivakasi Direct Fireworks Outlet
      </p>

      {/* Shimmering Animated Loader Bar */}
      <div className="w-48 sm:w-56 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-amber-500/20 relative shadow-inner mb-3">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 rounded-full animate-pulse w-full" />
      </div>

      {/* Status Text */}
      <span className="text-[11px] text-slate-400 font-semibold tracking-wider animate-pulse">
        Loading Factory Catalog &amp; Rates...
      </span>
    </div>
  );
};
