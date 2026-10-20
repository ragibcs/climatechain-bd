'use client';

import React from 'react';
import { ArrowUpRight, Droplets, MapPin, Waves } from 'lucide-react';
import type { Overview } from '@/lib/types';
import { formatDelta, formatDate, formatMm, scoreColor, themeFor } from '@/lib/risk';
import RiskBadge from './ui/RiskBadge';
import Sparkline from './ui/Sparkline';
import SectionHeader from './ui/SectionHeader';

interface StationGridProps {
  overview: Overview | null;
  selectedStationId: string;
  onSelectStation: (id: string) => void;
  loading: boolean;
}

export default function StationGrid({
  overview,
  selectedStationId,
  onSelectStation,
  loading,
}: StationGridProps) {
  const stations = overview?.stations ?? [];

  return (
    <section id="stations" className="panel p-5 sm:p-6">
      <SectionHeader
        icon={MapPin}
        eyebrow="Station network"
        title="Four sentinels on the Surma–Kushiyara"
        description="Every card is computed from the same past-only feature pipeline and re-ranked on each scenario change."
        action={
          <span className="hidden items-center gap-1.5 rounded-lg border border-climate-border/70 bg-white/[0.02] px-2.5 py-1.5 text-[10px] text-slate-400 sm:flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
            {overview?.as_of ? `Synced ${formatDate(overview.as_of)}` : 'Syncing…'}
          </span>
        }
      />

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {loading && stations.length === 0
          ? [0, 1, 2, 3].map((index) => (
              <div key={index} className="card-inset h-[228px] p-4">
                <div className="skeleton h-4 w-24" />
                <div className="skeleton mt-3 h-10 w-20" />
                <div className="skeleton mt-4 h-10 w-full" />
                <div className="skeleton mt-4 h-12 w-full" />
              </div>
            ))
          : stations.map((station) => {
              const theme = themeFor(station.risk_level);
              const selected = station.id === selectedStationId;
              const delta = formatDelta(station.rainfall_delta_1d_mm);
              return (
                <button
                  key={station.id}
                  onClick={() => onSelectStation(station.id)}
                  aria-pressed={selected}
                  className={`group relative overflow-hidden rounded-xl border p-4 text-left transition duration-300 ${
                    selected
                      ? 'border-cyan-400/50 bg-cyan-400/[0.06] shadow-glow'
                      : 'border-climate-border/70 bg-[#091120]/80 hover:-translate-y-0.5 hover:border-cyan-400/25 hover:bg-[#0B1628]'
                  }`}
                >
                  <div
                    className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${theme.gradient} ${
                      selected ? 'opacity-100' : 'opacity-50'
                    }`}
                  />
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-white">{station.name}</p>
                      <p className="mt-0.5 truncate text-[10px] text-slate-500">{station.river}</p>
                    </div>
                    <RiskBadge level={station.risk_level} />
                  </div>

                  <div className="mt-4 flex items-end justify-between gap-2">
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className={`text-3xl font-black tabular-nums ${scoreColor(station.score)}`}>
                          {station.score === null ? '—' : station.score.toFixed(1)}
                        </span>
                        <span className="text-[10px] text-slate-500">/100</span>
                      </div>
                      <p className="mt-0.5 text-[10px] text-slate-500">SRRI score</p>
                    </div>
                    <div className="w-[92px]">
                      <Sparkline
                        values={station.sparkline.map((point) => point.rainfall_mm)}
                        color={theme.hex}
                        height={34}
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-1.5 border-t border-climate-border/60 pt-3">
                    <div>
                      <p className="stat-label">24h</p>
                      <p className="mt-0.5 text-[11px] font-semibold text-sky-300">
                        {formatMm(station.rainfall_1d_mm)}
                      </p>
                    </div>
                    <div>
                      <p className="stat-label">3d</p>
                      <p className="mt-0.5 text-[11px] font-semibold text-amber-300">
                        {formatMm(station.rainfall_3d_mm)}
                      </p>
                    </div>
                    <div>
                      <p className="stat-label">7d</p>
                      <p className="mt-0.5 text-[11px] font-semibold text-purple-300">
                        {formatMm(station.rainfall_7d_mm)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[9px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Waves className="h-3 w-3" />
                      {station.district || 'Sylhet Division'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Droplets className="h-3 w-3" />
                      {delta ? delta.label : '—'}
                      <ArrowUpRight className="h-3 w-3 opacity-0 transition group-hover:opacity-100" />
                    </span>
                  </div>
                </button>
              );
            })}
      </div>
    </section>
  );
}
