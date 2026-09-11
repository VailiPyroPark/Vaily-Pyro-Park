'use client';

import React from 'react';
import { Sparkles, Flame } from 'lucide-react';

export const StorefrontCatalogLoader: React.FC = () => {
  return (
    <div className="space-y-4 font-sans animate-in fade-in duration-200">
      {/* 1. ANIMATED BRAND EMBLEM CARD */}
      <div className="bg-white rounded-3xl border border-amber-500/20 p-8 sm:p-10 text-center shadow-2xs relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-tr from-amber-500/10 via-orange-500/10 to-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center justify-center">
          {/* Glowing Animated Emblem */}
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 mb-4 flex items-center justify-center">
            {/* Outer spinning ring with gradient */}
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-amber-500 border-r-rose-500 border-b-amber-400 animate-spin" />
            
            {/* Inner pulsing glow circle */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/30 animate-pulse">
              <img
                src="/logo.png"
                alt="Vaili Pyro Park"
                className="w-9 h-9 sm:w-10 sm:h-10 object-contain drop-shadow"
              />
            </div>

            {/* Sparkle badge */}
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-xs animate-bounce">
              <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
            </div>

            {/* Flame badge */}
            <div className="absolute -bottom-1 -left-1 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xs animate-pulse">
              <Flame className="w-3.5 h-3.5 fill-white" />
            </div>
          </div>

          {/* Heading & Subtext */}
          <h3 className="text-base sm:text-lg font-black text-slate-950 font-heading tracking-tight mb-1">
            Loading Fireworks Catalog...
          </h3>
          <p className="text-xs text-slate-500 font-medium max-w-sm mb-4">
            Fetching direct factory wholesale rates &amp; live cracker inventory from Sivakasi
          </p>

          {/* Sleek Animated Progress Bar */}
          <div className="w-48 sm:w-60 h-1.5 bg-slate-100 rounded-full overflow-hidden relative shadow-inner">
            <div className="absolute inset-y-0 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 rounded-full w-3/4 animate-pulse" />
          </div>
        </div>
      </div>

      {/* 2. REALISTIC SHIMMER SKELETON RATE CARD */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Banner Skeleton */}
        <div className="bg-red-700/90 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white/20 animate-pulse" />
            <div className="h-4 bg-white/30 rounded w-32 sm:w-44 animate-pulse" />
          </div>
          <div className="h-4 bg-white/20 rounded-full w-14 animate-pulse" />
        </div>

        {/* Table Header Skeleton */}
        <div className="bg-slate-100 border-b border-slate-200 py-2.5 px-3 flex items-center justify-between text-xs font-bold text-slate-400">
          <div className="w-8 h-3 bg-slate-200 rounded animate-pulse" />
          <div className="w-24 h-3 bg-slate-200 rounded animate-pulse" />
          <div className="w-12 h-3 bg-slate-200 rounded animate-pulse" />
          <div className="w-12 h-3 bg-slate-200 rounded animate-pulse" />
          <div className="w-10 h-3 bg-slate-200 rounded animate-pulse" />
          <div className="w-12 h-3 bg-slate-200 rounded animate-pulse" />
        </div>

        {/* Rows Skeleton */}
        <div className="divide-y divide-slate-100">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-2.5 sm:p-3 flex items-center justify-between gap-3 animate-pulse">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-slate-100 shrink-0" />
              <div className="flex-1 min-w-0 space-y-1.5">
                <div
                  className="h-3.5 bg-slate-200/80 rounded"
                  style={{ width: `${55 + (i % 3) * 18}%` }}
                />
                <div className="h-2.5 bg-slate-100 rounded w-20" />
              </div>
              <div className="w-10 sm:w-14 h-3.5 bg-red-50 rounded shrink-0" />
              <div className="w-10 sm:w-14 h-4 bg-slate-200/80 rounded shrink-0" />
              <div className="w-8 sm:w-12 h-7 bg-slate-100 border border-slate-200/60 rounded shrink-0" />
              <div className="w-10 sm:w-14 h-3.5 bg-slate-200/60 rounded shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
