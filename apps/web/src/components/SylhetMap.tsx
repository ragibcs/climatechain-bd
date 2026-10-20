'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowUpRight,
  Compass,
  Layers,
  MapPin,
  Waves,
} from 'lucide-react';
import type { Overview, Station } from '@/lib/types';
import { formatMm, scoreColor, themeFor } from '@/lib/risk';
import RiskBadge from './ui/RiskBadge';
import SectionHeader from './ui/SectionHeader';

interface SylhetMapProps {
  stations: Station[];
  overview: Overview | null;
  selectedStationId: string;
  onSelectStation: (id: string) => void;
}

export default function SylhetMap({
  stations,
  overview,
  selectedStationId,
  onSelectStation,
}: SylhetMapProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const summaries = overview?.stations ?? [];
  const selectedSummary =
    summaries.find((station) => station.id === selectedStationId) ??
    summaries[0] ??
    null;
  const selectedStation =
    stations.find((station) => station.id === selectedStationId) ?? stations[0];

  const project = (lat: number, lon: number) => ({
    x: ((lon - 91.15) / 1.35) * 710 + 55,
    y: ((25.28 - lat) / 0.68) * 360 + 45,
  });

  const activeHover = hovered
    ? summaries.find((station) => station.id === hovered)
    : null;

  return (
    <section className="panel overflow-hidden">
      <div className="p-5 sm:p-6">
        <SectionHeader
          icon={Compass}
          eyebrow="Surma–Kushiyara basin"
          title="Geospatial station network"
          description="Real coordinates, river corridors, and live SRRI color coding. Click a marker to reassess a station."
          action={
            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-1.5 rounded-lg border border-climate-border/70 bg-white/[0.02] px-2.5 py-1.5 text-[10px] text-slate-400 sm:flex">
                <Layers className="h-3 w-3 text-cyan-300" />
                24.65–25.28°N
              </span>
              <span className="chip border-cyan-400/20 bg-cyan-400/5 text-cyan-300/90">
                {overview?.station_count ?? stations.length} nodes
              </span>
            </div>
          }
        />

        <div className="relative mt-4 overflow-hidden rounded-xl border border-climate-border/70 bg-[#060C17]">
          <div className="grid-surface pointer-events-none absolute inset-0 opacity-30" />
          <svg
            viewBox="0 0 820 460"
            className="relative h-auto w-full select-none"
            role="img"
            aria-label="Map of Sylhet basin monitoring stations"
          >
            <defs>
              <linearGradient id="basin-fill" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0E2A3B" stopOpacity="0.9" />
                <stop offset="55%" stopColor="#0B2233" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0A1929" stopOpacity="0.9" />
              </linearGradient>
              <linearGradient id="surma-line" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.5" />
                <stop offset="50%" stopColor="#22D3EE" stopOpacity="1" />
                <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.7" />
              </linearGradient>
              <linearGradient id="kushiyara-line" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.5" />
                <stop offset="55%" stopColor="#14B8A6" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#0D9488" stopOpacity="0.6" />
              </linearGradient>
              <filter id="marker-glow" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Basin body */}
            <path
              d="M 85,300 Q 110,380 200,408 T 420,420 Q 610,414 712,342 T 760,178 Q 700,88 540,64 T 260,74 Q 130,110 85,220 Z"
              fill="url(#basin-fill)"
              stroke="#1E3A4C"
              strokeWidth="1.5"
              strokeDasharray="6 5"
            />

            {/* Internal district lines */}
            <g stroke="#173247" strokeWidth="1" strokeDasharray="2 6" opacity="0.7">
              <path d="M 300,90 L 290,400" />
              <path d="M 520,70 L 540,415" />
              <path d="M 110,240 Q 380,210 740,250" />
            </g>

            {/* River corridors */}
            <path
              d="M 700,196 C 612,208 566,236 486,252 C 406,268 300,264 214,236 C 158,218 118,196 92,168"
              fill="none"
              stroke="url(#surma-line)"
              strokeWidth="7"
              strokeLinecap="round"
              opacity="0.9"
            />
            <path
              d="M 714,282 C 646,302 590,302 520,312 C 438,324 360,346 278,344 C 200,342 138,328 104,312"
              fill="none"
              stroke="url(#kushiyara-line)"
              strokeWidth="5"
              strokeLinecap="round"
              opacity="0.8"
            />
            <path
              d="M 92,168 C 130,160 168,150 212,142"
              fill="none"
              stroke="#38BDF8"
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.5"
            />

            {/* River labels */}
            <g fontFamily="Inter, sans-serif">
              <text x="420" y="238" fill="#67E8F9" fontSize="10" fontWeight="600" opacity="0.9">
                SURMA RIVER →
              </text>
              <text x="438" y="338" fill="#5EEAD4" fontSize="10" fontWeight="600" opacity="0.85">
                KUSHIYARA RIVER →
              </text>
              <text x="606" y="94" fill="#475569" fontSize="9" fontWeight="500">
                MEGHALAYA PLATEAU
              </text>
              <text x="148" y="390" fill="#475569" fontSize="9" fontWeight="500">
                HAOR WETLANDS
              </text>
            </g>

            {/* Border marker */}
            <g opacity="0.65">
              <path d="M 756,92 L 756,404" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="8 6" />
              <text x="764" y="86" fill="#F59E0B" fontSize="8" fontWeight="600">
                INDIA
              </text>
              <text x="746" y="424" fill="#F59E0B" fontSize="8" fontWeight="600">
                BANGLADESH
              </text>
            </g>

            {/* Stations */}
            {summaries.map((summary) => {
              const station =
                stations.find((candidate) => candidate.id === summary.id) ??
                ({
                  id: summary.id,
                  name: summary.name,
                  latitude: summary.latitude,
                  longitude: summary.longitude,
                } as Station);
              const { x, y } = project(station.latitude, station.longitude);
              const selected = summary.id === selectedStationId;
              const theme = themeFor(summary.risk_level);
              const radius = summary.rainfall_3d_mm
                ? Math.min(42, 14 + Math.sqrt(summary.rainfall_3d_mm) * 1.5)
                : 14;
              const isHovered = hovered === summary.id;

              return (
                <g
                  key={summary.id}
                  onClick={() => onSelectStation(summary.id)}
                  onMouseEnter={() => setHovered(summary.id)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(summary.id)}
                  onBlur={() => setHovered(null)}
                  tabIndex={0}
                  role="button"
                  aria-label={`Select ${summary.name}, ${summary.risk_level} risk, SRRI ${summary.score ?? 'unknown'}`}
                  className="cursor-pointer outline-none"
                >
                  <circle
                    cx={x}
                    cy={y}
                    r={radius}
                    fill={theme.hex}
                    opacity={selected ? 0.18 : 0.1}
                    className="transition-opacity hover:opacity-25"
                  />
                  {selected && (
                    <circle
                      cx={x}
                      cy={y}
                      r={radius + 8}
                      fill="none"
                      stroke={theme.hex}
                      strokeWidth="1.5"
                      opacity="0.45"
                      className="animate-pulse-ring"
                    />
                  )}
                  {isHovered && (
                    <circle
                      cx={x}
                      cy={y}
                      r={radius + 3}
                      fill="none"
                      stroke={theme.hex}
                      strokeWidth="1"
                      opacity="0.5"
                    />
                  )}
                  <circle
                    cx={x}
                    cy={y}
                    r={selected ? 9 : 6.5}
                    fill={theme.hex}
                    stroke="#060C17"
                    strokeWidth="2.5"
                    filter={selected ? 'url(#marker-glow)' : undefined}
                  />
                  <circle cx={x} cy={y} r="2" fill="#F8FAFC" />

                  <g fontFamily="Inter, sans-serif" pointerEvents="none">
                    <rect
                      x={x - 66}
                      y={y + 15}
                      width="132"
                      height="38"
                      rx="7"
                      fill="#070E1B"
                      stroke={selected ? theme.hex : '#243449'}
                      strokeWidth={selected ? 1.4 : 1}
                      opacity="0.96"
                    />
                    <text
                      x={x}
                      y={y + 29}
                      fill="#F8FAFC"
                      fontSize="10.5"
                      fontWeight="650"
                      textAnchor="middle"
                    >
                      {summary.name}
                    </text>
                    <text
                      x={x}
                      y={y + 42}
                      fill={theme.hex}
                      fontSize="8.5"
                      fontWeight="600"
                      textAnchor="middle"
                    >
                      SRRI {summary.score?.toFixed(1) ?? '—'} · {summary.risk_level}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* North arrow */}
            <g transform="translate(782 40)" opacity="0.6">
              <path d="M 0,-12 L 5,6 L 0,3 L -5,6 Z" fill="#94A3B8" />
              <text x="0" y="20" fill="#64748B" fontSize="8" textAnchor="middle">
                N
              </text>
            </g>
          </svg>

          {/* Legend */}
          <div className="absolute left-3 top-3 rounded-lg border border-climate-border/70 bg-[#070E1B]/90 p-2.5 backdrop-blur">
            <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              SRRI legend
            </p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              {['LOW', 'MODERATE', 'HIGH', 'SEVERE'].map((level) => {
                const theme = themeFor(level);
                return (
                  <span key={level} className="flex items-center gap-1.5 text-[9px] text-slate-400">
                    <span className={`h-1.5 w-1.5 rounded-full ${theme.dot}`} />
                    {theme.label}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Hover tooltip */}
          {activeHover && (
            <div className="pointer-events-none absolute bottom-3 left-3 right-3 rounded-lg border border-cyan-400/20 bg-[#070E1B]/95 p-3 backdrop-blur sm:right-auto sm:w-[300px]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold text-white">{activeHover.name}</p>
                  <p className="mt-0.5 text-[9px] text-slate-500">{activeHover.river}</p>
                </div>
                <RiskBadge level={activeHover.risk_level} />
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 border-t border-climate-border/60 pt-2 text-[10px]">
                <span className="text-slate-400">
                  24h <strong className="text-sky-300">{formatMm(activeHover.rainfall_1d_mm)}</strong>
                </span>
                <span className="text-slate-400">
                  3d <strong className="text-amber-300">{formatMm(activeHover.rainfall_3d_mm)}</strong>
                </span>
                <span className="text-slate-400">
                  7d <strong className="text-purple-300">{formatMm(activeHover.rainfall_7d_mm)}</strong>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Selected station strip */}
        {selectedSummary && (
          <div className="mt-3 flex flex-col gap-3 rounded-xl border border-climate-border/70 bg-[#091120]/80 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-lg border ${themeFor(selectedSummary.risk_level).border} ${themeFor(selectedSummary.risk_level).bg}`}
              >
                <MapPin className={`h-4 w-4 ${themeFor(selectedSummary.risk_level).text}`} />
              </span>
              <div>
                <p className="text-[11px] font-semibold text-white">
                  {selectedStation?.name} · {selectedStation?.river}
                </p>
                <p className="text-[9px] text-slate-500">
                  {selectedStation?.latitude.toFixed(4)}°N, {selectedStation?.longitude.toFixed(4)}°E ·{' '}
                  {selectedStation?.bwdb_station_id ?? 'BWDB node'} ·{' '}
                  {selectedStation?.elevation_m ?? '—'} m elevation
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-[10px]">
              <span className="text-slate-500">
                SRRI <strong className={scoreColor(selectedSummary.score)}>{selectedSummary.score?.toFixed(1) ?? '—'}</strong>
              </span>
              <a href="#overview" className="button-ghost !py-1 !text-[10px]">
                Inspect assessment
                <ArrowUpRight className="h-3 w-3" />
              </a>
            </div>
          </div>
        )}

        <div className="mt-3 flex items-start gap-2 text-[10px] leading-relaxed text-slate-500">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400/80" />
          <span>
            Rainfall data is real ERA5/ECMWF via Open-Meteo. River gauge levels and
            flood-extent labels remain <strong className="text-slate-400">unmonitored/null</strong> where
            no verified open source exists — we do not fabricate hydrology.
          </span>
        </div>
      </div>
    </section>
  );
}
