'use client';

import React from 'react';
import { Waves, ShieldCheck, Github, Activity } from 'lucide-react';

interface NavbarProps {
  apiStatus: string;
}

export default function Navbar({ apiStatus }: NavbarProps) {
  return (
    <header className="w-full bg-[#111827]/90 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Waves className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              ClimateChain BD
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                Sylhet Scope
              </span>
            </h1>
            <p className="text-[11px] text-gray-400">
              EVM Blockchain-Verified Climate & Rainfall Risk Intelligence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-[#0B0F19] border border-gray-800 rounded-lg text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                apiStatus === 'healthy' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="text-gray-300">API Status:</span>
            <span className="font-semibold text-white capitalize">{apiStatus}</span>
          </div>

          <a
            href="https://github.com/ragibcs/climatechain-bd"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-medium border border-gray-700 transition-colors"
          >
            <Github className="w-4 h-4" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </div>
    </header>
  );
}
