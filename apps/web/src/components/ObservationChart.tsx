'use client';

import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  CloudRain,
  Database,
  LineChart,
  TrendingUp,
} from 'lucide-react';
import type { Observation } from '@/lib/types';
import { formatDate, formatMm } from '@/lib/risk';
import SectionHeader from './ui/SectionHeader';

interface ObservationChartProps {
  observations: Observation[];
  locationName: string;
}

type View = 'daily' | 'cumulative';

const BMD_HEAVY = 44;
const BMD_VERY_HEAVY = 88;

export default function ObservationChart({ observations, locationName }: ObservationChartProps) {
  const [range, setRange] = useState(14);
  const [view, setView] = useState<View>('daily');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const recents = useMemo(() => observations.slice(-range), [observations, range]);
  const latest = recents[recents.length - 1];
  const maxDaily = Math.max(100, ...recents.map((item) => item.rainfall_mm || 0));
  const maxCumulative = Math.max(350, ...recents.map((item) => item.rainfall_7d_mm || 0));
  const wetDays = recents.filter((item) => item.rainfall_mm >= 1).length;
  const peak = Math.max(0, ...recents.map((item) => item.rainfall_mm || 0));
  const validCount = recents.filter((item) => item.quality_flag === 'VALID').length;
  const qualityPct = recents.length ? Math.round((validCount / recents.length) * 100) : 0;

  if (!observations || observations.length === 0) {
    return (
      <section className="panel p-6">
        <SectionHeader
          icon={BarChart3}
          eyebrow="Observations"
          title={`Precipitation record · ${locationName}`}
          description="No observation records are available for this station yet."
        />
        <div className="mt-6 flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-climate-border/80 text-center">
          <CloudRain className="mb-2 h-8 w-8 text-slate-600" />
          <p className="text-xs text-slate-400">No observation records available.</p>
          <p className="mt-1 text-[10px] text-slate-600">
            Try the live scenario or a historical monsoon date.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="panel overflow-hidden">
      <div className="p-5 sm:p-6">
        <SectionHeader
          icon={BarChart3}
          eyebrow="Observations"
          title={`Precipitation record · ${locationName}`}
          description="Real daily rainfall and strictly past-only 3-day / 7-day accumulations."
          action={
            <div className="flex items-center gap-1 rounded-lg border border-climate-border/80 bg-[#091120] p-1">
              {([
                { key: 'daily', label: 'Daily bars', icon: BarChart3 },
                { key: 'cumulative', label: 'Cumulative', icon: LineChart },
              ] as Array<{ key: View; label: string; icon: React.ElementType }>).map((option) => (
                <button
                  key={option.key}
                  onClick={() => setView(option.key)}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[10px] font-semibold transition ${
                    view === option.key
                      ? 'bg-cyan-400/15 text-cyan-300 ring-1 ring-cyan-400/25'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  aria-pressed={view === option.key}
                >
                  <option.icon className="h-3 w-3" />
                  <span className="hidden sm:inline">{option.label}</span>
                </button>
              ))}
            </div>
          }
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {[7, 14, 30].map((days) => (
              <button
                key={days}
                onClick={() => setRange(days)}
                className={`rounded-md px-2 py-1 text-[10px] font-medium transition ${
                  range === days
                    ? 'bg-white/10 text-white'
                    : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
                }`}
                aria-pressed={range === days}
              >
                {days}d
              </button>
            ))}
            <span className="ml-2 hidden items-center gap-1 text-[9px] text-slate-500 sm:flex">
              <CalendarDays className="h-3 w-3" />
              {formatDate(recents[0]?.date, { year: undefined })} – {formatDate(latest?.date, { year: undefined })}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[9px] text-slate-500">
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-sm bg-sky-400" /> rain
            </span>
            <span className="flex items-center gap-1">
              <span className="h-0.5 w-4 border-t border-dashed border-amber-400" /> heavy 44mm
            </span>
            <span className="flex items-center gap-1">
              <span className="h-0.5 w-4 border-t border-dashed border-rose-400" /> very heavy 88mm
            </span>
          </div>
        </div>

        {/* Chart */}
        <div className="relative mt-3 rounded-xl border border-climate-border/60 bg-[#07101F]/80 p-3 pt-5">
          {view === 'daily' ? (
            <div className="relative flex h-60 w-full">
              {/* Gridlines */}
              {[0, 25, 50, 75, 100].map((percent) => (
                <div
                  key={percent}
                  className="pointer-events-none absolute inset-x-0 flex items-center gap-2"
                  style={{ bottom: `calc(${percent}% - 1px)` }}
                >
                  <span className="w-8 shrink-0 text-right font-mono text-[8px] text-slate-600">
                    {Math.round((maxDaily * percent) / 100)}
                  </span>
                  <span className="h-px flex-1 bg-white/[0.05]" />
                </div>
              ))}

              {/* BMD threshold lines */}
              <div
                className="pointer-events-none absolute left-10 right-2 border-t border-dashed border-amber-400/50"
                style={{ bottom: `${(BMD_HEAVY / maxDaily) * 100}%` }}
              >
                <span className="absolute -top-3 right-0 text-[8px] font-medium text-amber-400/70">
                  Heavy 44mm
                </span>
              </div>
              <div
                className="pointer-events-none absolute left-10 right-2 border-t border-dashed border-rose-400/50"
                style={{ bottom: `${(BMD_VERY_HEAVY / maxDaily) * 100}%` }}
              >
                <span className="absolute -top-3 right-0 text-[8px] font-medium text-rose-400/70">
                  Very heavy 88mm
                </span>
              </div>

              <div className="z-10 ml-9 flex flex-1 items-end gap-1">
                {recents.map((item, index) => {
                  const height = Math.max(2, (item.rainfall_mm / maxDaily) * 100);
                  const isHeavy = item.rainfall_mm >= BMD_HEAVY;
                  const isVeryHeavy = item.rainfall_mm >= BMD_VERY_HEAVY;
                  const isHovered = hoverIndex === index;
                  return (
                    <div
                      key={`${item.date}-${index}`}
                      className="group relative flex h-full min-w-0 flex-1 flex-col justify-end"
                      onMouseEnter={() => setHoverIndex(index)}
                      onMouseLeave={() => setHoverIndex(null)}
                    >
                      {isHovered && (
                        <div className="absolute bottom-full left-1/2 z-30 mb-2 w-36 -translate-x-1/2 rounded-lg border border-climate-border bg-[#070E1B] p-2 text-[9px] shadow-2xl">
                          <p className="font-semibold text-white">{formatDate(item.date)}</p>
                          <p className="mt-1 text-sky-300">24h: {formatMm(item.rainfall_mm)}</p>
                          <p className="text-amber-300">3d: {formatMm(item.rainfall_3d_mm)}</p>
                          <p className="text-purple-300">7d: {formatMm(item.rainfall_7d_mm)}</p>
                        </div>
                      )}
                      <div
                        className={`w-full rounded-t-[3px] transition-all duration-300 ${
                          isVeryHeavy
                            ? 'bg-gradient-to-t from-rose-600 to-rose-400'
                            : isHeavy
                            ? 'bg-gradient-to-t from-amber-600 to-amber-400'
                            : 'bg-gradient-to-t from-sky-600 to-sky-400'
                        } ${isHovered ? 'brightness-125' : ''}`}
                        style={{ height: `${height}%` }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <CumulativeChart
              recents={recents}
              maxCumulative={maxCumulative}
              hoverIndex={hoverIndex}
              onHover={setHoverIndex}
            />
          )}

          {/* Date labels for daily view */}
          {view === 'daily' && (
            <div className="ml-9 mt-2 flex gap-1">
              {recents.map((item, index) => (
                <span
                  key={`${item.date}-label-${index}`}
                  className="min-w-0 flex-1 truncate text-center text-[8px] text-slate-600"
                >
                  {index % Math.max(1, Math.ceil(recents.length / 9)) === 0
                    ? item.date.slice(5)
                    : ''}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer stats */}
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
          <MiniStat label="Latest 24h" value={formatMm(latest?.rainfall_mm)} accent="text-sky-300" />
          <MiniStat label="Trailing 3d" value={formatMm(latest?.rainfall_3d_mm)} accent="text-amber-300" />
          <MiniStat label="Trailing 7d" value={formatMm(latest?.rainfall_7d_mm)} accent="text-purple-300" />
          <MiniStat label="Wet days" value={`${wetDays} / ${recents.length}`} accent="text-teal-300" />
          <div className="card-inset p-2.5">
            <div className="flex items-center justify-between">
              <span className="stat-label">Quality</span>
              <Database className="h-3 w-3 text-emerald-400" />
            </div>
            <p className="mt-1 text-sm font-bold text-white">{qualityPct}%</p>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/5">
              <div className="h-full rounded-full bg-emerald-400" style={{ width: `${qualityPct}%` }} />
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[9px] text-slate-500">
          <span className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Peak 24h in window: <strong className="text-slate-300">{formatMm(peak)}</strong>
          </span>
          <span>Past-only rolling windows · no future leakage</span>
        </div>
      </div>
    </section>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="card-inset p-2.5">
      <span className="stat-label">{label}</span>
      <p className={`mt-1 text-sm font-bold ${accent}`}>{value}</p>
    </div>
  );
}

function CumulativeChart({
  recents,
  maxCumulative,
  hoverIndex,
  onHover,
}: {
  recents: Observation[];
  maxCumulative: number;
  hoverIndex: number | null;
  onHover: (index: number | null) => void;
}) {
  const width = 720;
  const height = 240;
  const padding = { left: 34, right: 8, top: 16, bottom: 22 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;
  const n = recents.length;
  const x = (index: number) => padding.left + (n <= 1 ? plotW / 2 : (index / (n - 1)) * plotW);
  const y = (value: number) => padding.top + plotH - (value / maxCumulative) * plotH;

  const line = (key: 'rainfall_3d_mm' | 'rainfall_7d_mm') =>
    recents
      .map((item, index) => `${x(index).toFixed(1)},${y(item[key] || 0).toFixed(1)}`)
      .join(' ');

  const hovered = hoverIndex !== null ? recents[hoverIndex] : null;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-60 w-full" role="img" aria-label="Cumulative rainfall chart">
        <defs>
          <linearGradient id="cum-7d" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#A78BFA" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const value = Math.round(maxCumulative * ratio);
          const yy = y(value);
          return (
            <g key={ratio}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={yy}
                y2={yy}
                stroke="rgba(148,163,184,0.08)"
                strokeWidth="1"
              />
              <text x={padding.left - 6} y={yy + 3} fill="#475569" fontSize="8" textAnchor="end">
                {value}
              </text>
            </g>
          );
        })}

        {/* Saturation thresholds */}
        <line
          x1={padding.left}
          x2={width - padding.right}
          y1={y(200)}
          y2={y(200)}
          stroke="#F59E0B"
          strokeWidth="1"
          strokeDasharray="5 5"
          opacity="0.4"
        />
        <text x={width - padding.right} y={y(200) - 4} fill="#F59E0B" fontSize="8" textAnchor="end" opacity="0.7">
          3d saturation 200mm
        </text>
        <line
          x1={padding.left}
          x2={width - padding.right}
          y1={y(350)}
          y2={y(350)}
          stroke="#A78BFA"
          strokeWidth="1"
          strokeDasharray="5 5"
          opacity="0.4"
        />
        <text x={width - padding.right} y={y(350) - 4} fill="#A78BFA" fontSize="8" textAnchor="end" opacity="0.7">
          7d storage 350mm
        </text>

        <polygon
          points={`${x(0)},${padding.top + plotH} ${line('rainfall_7d_mm')} ${x(n - 1)},${padding.top + plotH}`}
          fill="url(#cum-7d)"
        />
        <polyline
          points={line('rainfall_7d_mm')}
          fill="none"
          stroke="#A78BFA"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points={line('rainfall_3d_mm')}
          fill="none"
          stroke="#FBBF24"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {recents.map((item, index) => (
          <g
            key={`${item.date}-point`}
            onMouseEnter={() => onHover(index)}
            onMouseLeave={() => onHover(null)}
          >
            <rect
              x={x(index) - plotW / Math.max(1, n) / 2}
              y={padding.top}
              width={plotW / Math.max(1, n)}
              height={plotH}
              fill="transparent"
            />
            <circle cx={x(index)} cy={y(item.rainfall_7d_mm || 0)} r="2.5" fill="#A78BFA" />
            <circle cx={x(index)} cy={y(item.rainfall_3d_mm || 0)} r="2" fill="#FBBF24" />
          </g>
        ))}

        {/* X labels */}
        {recents.map((item, index) =>
          index % Math.max(1, Math.ceil(n / 8)) === 0 ? (
            <text
              key={`${item.date}-x`}
              x={x(index)}
              y={height - 6}
              fill="#475569"
              fontSize="8"
              textAnchor="middle"
            >
              {item.date.slice(5)}
            </text>
          ) : null
        )}

        {hoverIndex !== null && (
          <line
            x1={x(hoverIndex)}
            x2={x(hoverIndex)}
            y1={padding.top}
            y2={padding.top + plotH}
            stroke="rgba(34,211,238,0.4)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        )}
      </svg>

      {hovered && (
        <div className="pointer-events-none absolute right-2 top-2 rounded-lg border border-climate-border bg-[#070E1B]/95 px-2.5 py-2 text-[9px] shadow-xl">
          <p className="font-semibold text-white">{formatDate(hovered.date)}</p>
          <p className="mt-0.5 text-amber-300">3d: {formatMm(hovered.rainfall_3d_mm)}</p>
          <p className="text-purple-300">7d: {formatMm(hovered.rainfall_7d_mm)}</p>
        </div>
      )}

      <div className="mt-1 flex items-center justify-center gap-4 text-[9px] text-slate-500">
        <span className="flex items-center gap-1">
          <span className="h-0.5 w-3 bg-amber-400" /> 3-day cumulative
        </span>
        <span className="flex items-center gap-1">
          <span className="h-0.5 w-3 bg-purple-400" /> 7-day cumulative
        </span>
        <span className="hidden sm:inline">Hover for daily detail</span>
      </div>
    </div>
  );
}
