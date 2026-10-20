'use client';

import React from 'react';
import {
  ArrowDownRight,
  ArrowRight,
  BadgeCheck,
  CloudRain,
  Database,
  Landmark,
  Radio,
  ScanSearch,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import type { HealthResponse, Overview, ScenarioKey } from '@/lib/types';
import { formatDate, scoreColor, themeFor } from '@/lib/risk';
import { registryModeLabel, registryModeTitle, registryModeTone } from '@/lib/registry';
import Sparkline from './ui/Sparkline';
import RiskBadge from './ui/RiskBadge';

interface HeroProps {
  overview: Overview | null;
  health: HealthResponse | null;
  offline: boolean;
  onLoadScenario: (scenario: ScenarioKey) => void;
}

const stats = [
  {
    label: 'Monitoring stations',
    value: '04',
    detail: 'Surma–Kushiyara basin',
    icon: Radio,
  },
  {
    label: 'Rainfall windows',
    value: '1d · 3d · 7d',
    detail: 'Strictly past-only',
    icon: CloudRain,
  },
  {
    label: 'Verification states',
    value: '05',
    detail: 'Including graceful RPC failure',
    icon: ShieldCheck,
  },
  {
    label: 'Dataset integrity',
    value: 'SHA-256',
    detail: 'Manifested & re-checked',
    icon: Database,
  },
];

export default function Hero({ overview, health, offline, onLoadScenario }: HeroProps) {
  const basinScore = overview?.basin_score ?? null;
  const theme = themeFor(overview?.basin_risk_level);
  const stations = overview?.stations ?? [];
  const severeCount = stations.filter((station) => station.risk_level === 'SEVERE').length;
  const registryTone = registryModeTone(health?.environment?.provenance_mode);
  const activeMode =
    offline || overview?.data_mode === 'OFFLINE_CACHE'
      ? 'Cached'
      : overview?.data_mode === 'HISTORICAL_REANALYSIS'
      ? 'Historical'
      : overview?.data_mode === 'LIVE_OBSERVED'
      ? 'Live'
      : 'Connecting';

  return (
    <section id="top" className="relative overflow-hidden pt-10 sm:pt-14">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[420px] w-[900px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute -left-24 top-32 h-64 w-64 animate-float rounded-full bg-teal-400/10 blur-3xl" />
        <div className="absolute -right-20 top-24 h-72 w-72 animate-float rounded-full bg-sky-500/10 blur-3xl [animation-delay:1.4s]" />
      </div>

      <div className="shell">
        <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="animate-fade-up">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="chip border-cyan-400/25 bg-cyan-400/10 text-cyan-300">
                <Sparkles className="h-3 w-3" />
                IEEE ClimateChain Global Hackathon
              </span>
              <span className="chip border-slate-500/20 bg-white/[0.03] text-slate-400">
                Climate Data & Environmental Monitoring
              </span>
              {offline && (
                <span className="chip border-amber-400/30 bg-amber-400/10 text-amber-300">
                  Offline demo snapshot
                </span>
              )}
            </div>

            <h1 className="text-balance text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Climate risk you can <span className="text-gradient">prove.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
              ClimateChain BD turns open ECMWF/ERA5 rainfall data for the
              Surma–Kushiyara basin into a transparent risk index — then commits each
              assessment to a tamper-evident registry, so a single altered byte becomes
              visible to anyone.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a href="#overview" className="button-primary">
                Explore basin risk
                <ArrowRight className="h-4 w-4" />
              </a>
              <a href="#provenance" className="button-secondary">
                <ScanSearch className="h-4 w-4" />
                Run the tamper test
              </a>
              <button
                onClick={() => onLoadScenario('monsoon-2024')}
                className="button-ghost"
              >
                <ArrowDownRight className="h-4 w-4 text-rose-300" />
                Load June 2024 monsoon
              </button>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="card-inset px-3 py-3 transition hover:border-cyan-400/25"
                >
                  <stat.icon className="mb-2 h-3.5 w-3.5 text-cyan-300" strokeWidth={1.8} />
                  <p className="text-sm font-bold text-white">{stat.value}</p>
                  <p className="mt-0.5 text-[10px] font-medium text-slate-400">{stat.label}</p>
                  <p className="mt-1 text-[9px] leading-tight text-slate-600">{stat.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="animate-fade-up [animation-delay:120ms]">
            <div className="panel relative overflow-hidden p-5 sm:p-6">
              <div className="grid-surface pointer-events-none absolute inset-0 opacity-40" />
              <div className="relative">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="eyebrow">Basin pulse</p>
                    <h2 className="mt-1 text-sm font-semibold text-white">
                      Surma–Kushiyara aggregate
                    </h2>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {overview?.as_of ? `As of ${formatDate(overview.as_of)}` : 'Connecting to stations…'}
                    </p>
                  </div>
                  <RiskBadge level={overview?.basin_risk_level} pulse />
                </div>

                <div className="mt-5 flex items-end justify-between gap-4">
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-5xl font-black tabular-nums ${scoreColor(basinScore)}`}>
                        {basinScore === null ? '—' : basinScore.toFixed(1)}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">/100</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">mean station SRRI</p>
                  </div>
                  <div className="w-32">
                    <Sparkline
                      values={stations.map((station) => station.score ?? 0)}
                      color={theme.hex}
                      height={44}
                    />
                    <p className="mt-1 text-right text-[9px] text-slate-600">station spread</p>
                  </div>
                </div>

                <div className="mt-5 space-y-2.5">
                  {stations.length === 0 && (
                    <div className="space-y-2">
                      {[0, 1, 2, 3].map((index) => (
                        <div key={index} className="skeleton h-8 w-full" />
                      ))}
                    </div>
                  )}
                  {stations.map((station) => {
                    const stationTheme = themeFor(station.risk_level);
                    return (
                      <div key={station.id} className="flex items-center gap-3">
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${stationTheme.dot}`} />
                        <span className="w-24 truncate text-[11px] text-slate-300">
                          {station.name}
                        </span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${stationTheme.gradient} transition-all duration-700`}
                            style={{ width: `${station.score ?? 0}%` }}
                          />
                        </div>
                        <span className={`w-9 text-right font-mono text-[10px] ${stationTheme.text}`}>
                          {station.score?.toFixed(1) ?? '—'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2 border-t border-climate-border/70 pt-4">
                  <div>
                    <p className="stat-label">Severe stations</p>
                    <p className="mt-1 text-sm font-bold text-white">
                      {severeCount}
                      <span className="text-[10px] font-normal text-slate-500"> / {stations.length || 4}</span>
                    </p>
                  </div>
                  <div title={registryModeTitle(health?.environment?.provenance_mode)}>
                    <p className="stat-label">Registry</p>
                    <p className="mt-1 flex items-center gap-1 text-sm font-bold text-white">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          registryTone === 'emerald'
                            ? 'bg-emerald-400'
                            : registryTone === 'cyan'
                            ? 'bg-cyan-400'
                            : 'bg-amber-400'
                        }`}
                      />
                      {registryModeLabel(health?.environment?.provenance_mode)}
                    </p>
                  </div>
                  <div>
                    <p className="stat-label">Mode</p>
                    <p className="mt-1 flex items-center gap-1 text-sm font-bold text-white">
                      <BadgeCheck className="h-3.5 w-3.5 text-cyan-300" />
                      {activeMode}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between rounded-xl border border-climate-border/60 bg-white/[0.02] px-4 py-2.5 text-[10px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <Landmark className="h-3.5 w-3.5 text-slate-400" />
                Built for relief audit, parametric insurance & civic planning
              </span>
              <span className="hidden font-mono text-slate-600 sm:inline">SRRI v1</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
