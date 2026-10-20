'use client';

import React from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Database,
  Droplets,
  Gauge,
  Info,
  MapPin,
  Mountain,
  ShieldCheck,
  Sparkles,
  Waves,
} from 'lucide-react';
import type { Observation, RiskReport, Station } from '@/lib/types';
import {
  formatDelta,
  formatMm,
  pct,
  scoreColor,
  themeFor,
} from '@/lib/risk';
import RiskBadge from './ui/RiskBadge';
import ScoreRing from './ui/ScoreRing';
import Sparkline from './ui/Sparkline';
import SectionHeader from './ui/SectionHeader';

interface RiskOverviewProps {
  report: RiskReport | null;
  observations: Observation[];
  stations: Station[];
  selectedStationId: string;
  onSelectStation: (id: string) => void;
  loading: boolean;
}

const thresholds = [
  { label: '24h', value: 88, caption: 'BMD very heavy' },
  { label: '3d', value: 200, caption: 'catchment saturation' },
  { label: '7d', value: 350, caption: 'haor storage fill' },
];

export default function RiskOverview({
  report,
  observations,
  stations,
  selectedStationId,
  onSelectStation,
  loading,
}: RiskOverviewProps) {
  const theme = themeFor(report?.risk_level);
  const factors = report?.explanation?.factors ?? [];
  const delta = formatDelta(report?.metrics?.rainfall_delta_1d_mm);
  const trendValues = (report?.trend ?? observations.slice(-14)).map((point: any) => Number(point.rainfall_mm ?? 0));
  const activeStation = stations.find((station) => station.id === selectedStationId);
  const isSevere = report?.risk_level === 'SEVERE';
  const isHistorical = report?.data_mode === 'HISTORICAL_REANALYSIS';
  const isOfflineQuality =
    report?.data_quality === 'DEGRADED_OFFLINE_CACHE' ||
    report?.data_quality === 'CACHED_SAMPLE';

  return (
    <section id="overview" className="panel overflow-hidden">
      <div className="p-5 sm:p-6">
        <SectionHeader
          icon={Gauge}
          eyebrow="Risk intelligence"
          title="Station risk assessment"
          description="A transparent 24h / 3-day / 7-day rainfall index with weighted contribution attribution."
          action={
            <div className="flex flex-wrap items-center gap-2">
              {isHistorical && (
                <span className="chip border-amber-400/25 bg-amber-400/10 text-amber-300">
                  Historical scenario
                </span>
              )}
              {isOfflineQuality && (
                <span className="chip border-amber-400/25 bg-amber-400/10 text-amber-300">
                  Cached sample — not a live observation
                </span>
              )}
              <span className="chip border-emerald-400/20 bg-emerald-400/5 text-emerald-300/90">
                <ShieldCheck className="h-3 w-3" />
                Past-only features
              </span>
            </div>
          }
        />

        {/* Compact station switcher */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
          <span className="shrink-0 text-[10px] font-medium text-slate-500">Station</span>
          {stations.map((station) => {
            const selected = station.id === selectedStationId;
            return (
              <button
                key={station.id}
                onClick={() => onSelectStation(station.id)}
                className={`shrink-0 rounded-lg border px-3 py-1.5 text-[11px] font-medium transition ${
                  selected
                    ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200'
                    : 'border-climate-border/70 bg-white/[0.02] text-slate-400 hover:border-cyan-400/25 hover:text-white'
                }`}
                aria-pressed={selected}
              >
                {station.name}
              </button>
            );
          })}
        </div>

        {loading && !report ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-[340px_1fr]">
            <div className="skeleton h-[360px]" />
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[0, 1, 2, 3].map((index) => (
                  <div key={index} className="skeleton h-24" />
                ))}
              </div>
              <div className="skeleton h-40" />
            </div>
          </div>
        ) : (
          <div className="mt-5 grid gap-5 lg:grid-cols-[340px_1fr]">
            {/* Score card */}
            <div className="relative overflow-hidden rounded-xl border border-climate-border/70 bg-[#091120]/90 p-5">
              <div
                className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${theme.bg} to-transparent opacity-60`}
              />
              <div className="relative flex flex-col items-center text-center">
                <div className="mb-3 flex w-full items-center justify-between">
                  <span className="eyebrow">SRRI</span>
                  <RiskBadge level={report?.risk_level} pulse={isSevere} />
                </div>

                <ScoreRing
                  score={report?.score}
                  level={report?.risk_level}
                  size={188}
                  subtitle="Sylhet Rainfall Risk Index"
                />

                <p className={`mt-2 text-sm font-semibold ${theme.text}`}>
                  {report?.severity_label ?? 'Awaiting assessment'}
                </p>
                <p className="mt-1 max-w-[240px] text-[11px] leading-relaxed text-slate-500">
                  {report?.location_name ?? activeStation?.name ?? 'Sylhet station'} ·{' '}
                  {report?.station?.river ?? activeStation?.river ?? 'Surma River'}
                </p>

                <div className="mt-4 grid w-full grid-cols-2 gap-2 border-t border-climate-border/60 pt-3 text-left">
                  <div>
                    <p className="stat-label">Evaluation date</p>
                    <p className="mt-0.5 text-[11px] font-medium text-slate-300">
                      {report?.as_of ?? '—'}
                    </p>
                  </div>
                  <div>
                    <p className="stat-label">Data quality</p>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-slate-300">
                      <Database className="h-3 w-3 text-cyan-300" />
                      {report?.data_quality === 'VALID' || report?.data_quality === 'LIVE_OBSERVED'
                        ? 'Validated'
                        : report?.data_quality?.replaceAll('_', ' ') ?? '—'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Metrics and attribution */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                <MetricCard
                  icon={Droplets}
                  label="24h rainfall"
                  value={formatMm(report?.metrics?.rainfall_1d_mm)}
                  sub="Acute flash potential"
                  threshold={thresholds[0]}
                  valueMm={report?.metrics?.rainfall_1d_mm ?? 0}
                  delta={delta}
                  accent="text-sky-300"
                />
                <MetricCard
                  icon={Waves}
                  label="3-day cumulative"
                  value={formatMm(report?.metrics?.rainfall_3d_mm)}
                  sub="Catchment inflow"
                  threshold={thresholds[1]}
                  valueMm={report?.metrics?.rainfall_3d_mm ?? 0}
                  accent="text-amber-300"
                />
                <MetricCard
                  icon={Mountain}
                  label="7-day cumulative"
                  value={formatMm(report?.metrics?.rainfall_7d_mm)}
                  sub="Haor saturation"
                  threshold={thresholds[2]}
                  valueMm={report?.metrics?.rainfall_7d_mm ?? 0}
                  accent="text-purple-300"
                />
                <div className="card-inset p-3">
                  <div className="flex items-center justify-between">
                    <span className="stat-label">Danger level</span>
                    <Mountain className="h-3.5 w-3.5 text-slate-500" />
                  </div>
                  <p className="mt-2 text-lg font-bold text-slate-200">
                    {report?.metrics?.danger_level_m ?? activeStation?.danger_level_m ?? '—'}
                    <span className="ml-1 text-[10px] font-normal text-slate-500">m</span>
                  </p>
                  <p className="mt-1 text-[9px] text-slate-500">BWDB benchmark</p>
                  <p className="mt-1 text-[9px] text-amber-300/80">Gauge level not fabricated</p>
                </div>
              </div>

              <div className="card-inset p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-white">Risk drivers & attribution</p>
                    <p className="mt-0.5 text-[10px] text-slate-500">
                      Weighted contribution to the final SRRI score
                    </p>
                  </div>
                  <span className="chip border-slate-500/20 bg-white/[0.03] text-slate-400">
                    <Sparkles className="h-3 w-3" />
                    Score {report?.score?.toFixed(1) ?? '—'}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {factors.length === 0 && (
                    <p className="text-[11px] text-slate-500">No factor attribution available.</p>
                  )}
                  {factors.map((factor, index) => {
                    const colors = ['from-sky-400 to-cyan-500', 'from-amber-400 to-orange-500', 'from-purple-400 to-fuchsia-500'];
                    const value = Math.min(100, factor.contribution_pct);
                    return (
                      <div key={factor.name}>
                        <div className="mb-1 flex items-center justify-between gap-3 text-[10px]">
                          <span className="font-medium text-slate-300">{factor.name}</span>
                          <span className="font-mono text-slate-400">
                            {formatMm(factor.value_mm)} · {factor.contribution_pct.toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/5">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${colors[index % colors.length]} transition-all duration-700`}
                            style={{ width: `${value}%` }}
                          />
                        </div>
                        <p className="mt-1 text-[9px] leading-relaxed text-slate-500">
                          {factor.interpretation}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-[1fr_170px]">
                <div className="card-inset p-4">
                  <div className="flex items-start gap-2">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                    <div>
                      <p className="text-xs font-semibold text-white">Assessment summary</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                        {report?.explanation?.summary ?? 'Standard meteorological assessment in progress.'}
                      </p>
                    </div>
                  </div>
                  {isSevere && (
                    <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-400/25 bg-rose-500/10 p-2.5">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-300" />
                      <p className="text-[10px] leading-relaxed text-rose-200/90">
                        Severe rainfall indicator. This is <strong>not</strong> an official
                        evacuation order — consult FFWC/BMD for life-safety action.
                      </p>
                    </div>
                  )}
                </div>
                <div className="card-inset p-4">
                  <p className="stat-label">14-day rainfall trend</p>
                  <Sparkline values={trendValues} color={theme.hex} height={56} className="mt-2 w-full" />
                  <p className="mt-1 text-[9px] text-slate-500">
                    Peak 3-day {formatMm(report?.metrics?.peak_3d_mm ?? report?.metrics?.rainfall_3d_mm)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-climate-border/60 bg-white/[0.015] px-5 py-3 text-[10px] text-slate-500 sm:px-6">
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3 w-3" />
          {activeStation
            ? `${activeStation.latitude.toFixed(4)}°N, ${activeStation.longitude.toFixed(4)}°E · ${activeStation.river}`
            : 'Surma–Kushiyara basin, Sylhet Division'}
        </span>
        <span className="flex items-center gap-1.5">
          <Database className="h-3 w-3" />
          Source: Open-Meteo / ECMWF ERA5 · SRRI v1
        </span>
      </div>
    </section>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  threshold,
  valueMm,
  delta,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  threshold: { label: string; value: number; caption: string };
  valueMm: number;
  delta?: { label: string; positive: boolean } | null;
  accent: string;
}) {
  const fill = pct(valueMm, threshold.value);
  return (
    <div className="card-inset p-3">
      <div className="flex items-center justify-between">
        <span className="stat-label">{label}</span>
        <Icon className={`h-3.5 w-3.5 ${accent}`} />
      </div>
      <p className={`mt-2 text-lg font-bold ${accent}`}>{value}</p>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-teal-400 transition-all duration-700"
          style={{ width: `${fill}%` }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[9px] text-slate-500">
        <span>{sub}</span>
        {delta ? (
          <span className={delta.positive ? 'text-orange-300' : 'text-slate-500'}>
            {delta.positive ? <ArrowUpRight className="mr-0.5 inline h-2.5 w-2.5" /> : <ArrowDownRight className="mr-0.5 inline h-2.5 w-2.5" />}
            {delta.label}
          </span>
        ) : (
          <span>{threshold.caption}</span>
        )}
      </div>
    </div>
  );
}
