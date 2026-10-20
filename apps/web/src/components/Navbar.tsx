'use client';

import React, { useState } from 'react';
import {
  Activity,
  Github,
  Menu,
  RefreshCw,
  ShieldCheck,
  Waves,
  X,
} from 'lucide-react';
import {
  registryModeLabel,
  registryModeTitle,
  registryModeTone,
} from '@/lib/registry';

interface NavbarProps {
  apiStatus: string;
  provenanceMode?: string;
  lastSynced?: string | null;
  refreshing?: boolean;
  onRefresh: () => void;
}

const links = [
  { href: '#overview', label: 'Overview' },
  { href: '#stations', label: 'Stations' },
  { href: '#forecast', label: 'Forecast' },
  { href: '#provenance', label: 'Provenance' },
  { href: '#methodology', label: 'Methodology' },
];

export default function Navbar({
  apiStatus,
  provenanceMode,
  lastSynced,
  refreshing = false,
  onRefresh,
}: NavbarProps) {
  const [open, setOpen] = useState(false);
  const isHealthy = apiStatus === 'healthy' || apiStatus === 'online';
  const registryTone = registryModeTone(provenanceMode);

  return (
    <header className="sticky top-0 z-50 border-b border-climate-border/60 bg-[#070B14]/80 backdrop-blur-xl">
      <div className="shell flex h-16 items-center justify-between gap-4">
        <a href="#top" className="group flex min-w-0 items-center gap-3" aria-label="ClimateChain BD home">
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-400 shadow-lg shadow-cyan-500/25">
            <Waves className="h-5 w-5 text-slate-950" strokeWidth={2.4} />
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#070B14] bg-emerald-400" />
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-2">
              <span className="truncate text-sm font-bold tracking-tight text-white sm:text-base">
                ClimateChain <span className="text-cyan-300">BD</span>
              </span>
              <span className="hidden rounded border border-cyan-400/25 bg-cyan-400/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-cyan-300 md:inline">
                Sylhet
              </span>
            </span>
            <span className="hidden truncate text-[10px] text-slate-500 sm:block">
              Verifiable climate risk intelligence · Surma Basin
            </span>
          </span>
        </a>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div
            className="hidden items-center gap-2 rounded-lg border border-climate-border/80 bg-white/[0.03] px-2.5 py-1.5 text-[10px] md:flex"
            title={lastSynced ? `Last synced ${lastSynced}` : 'API connection status'}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isHealthy ? 'animate-pulse bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span className="text-slate-400">API</span>
            <span className="font-semibold capitalize text-slate-200">{apiStatus}</span>
          </div>

          <div
            className="hidden items-center gap-1.5 rounded-lg border border-climate-border/80 bg-white/[0.03] px-2.5 py-1.5 text-[10px] xl:flex"
            title={registryModeTitle(provenanceMode)}
          >
            <ShieldCheck
              className={`h-3.5 w-3.5 ${
                registryTone === 'emerald'
                  ? 'text-emerald-400'
                  : registryTone === 'cyan'
                  ? 'text-cyan-400'
                  : 'text-amber-400'
              }`}
            />
            <span className="text-slate-400">Registry</span>
            <span
              className={`font-semibold ${
                registryTone === 'emerald'
                  ? 'text-emerald-300'
                  : registryTone === 'cyan'
                  ? 'text-cyan-300'
                  : 'text-amber-300'
              }`}
            >
              {registryModeLabel(provenanceMode)}
            </span>
          </div>

          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="button-ghost h-9 w-9 !px-0"
            aria-label="Refresh climate data"
            title="Refresh climate data"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <a
            href="https://github.com/ragibcs/climatechain-bd"
            target="_blank"
            rel="noopener noreferrer"
            className="button-secondary hidden h-9 !px-3 sm:inline-flex"
          >
            <Github className="h-4 w-4" />
            <span className="hidden xl:inline">Repository</span>
          </a>

          <a href="#provenance" className="button-primary hidden h-9 !px-3 md:inline-flex">
            <Activity className="h-4 w-4" />
            <span className="hidden xl:inline">Verify report</span>
          </a>

          <button
            onClick={() => setOpen((value) => !value)}
            className="button-ghost h-9 w-9 !px-0 lg:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-climate-border/60 bg-[#070B14]/95 lg:hidden">
          <nav className="shell grid grid-cols-2 gap-2 py-4" aria-label="Mobile navigation">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg border border-climate-border/70 bg-white/[0.02] px-3 py-2.5 text-xs font-medium text-slate-300 transition hover:border-cyan-400/30 hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
