'use client';

import React from 'react';
import { Calendar, History, Radio, RotateCw } from 'lucide-react';
import type { RiskReport, ScenarioKey } from '@/lib/types';
import { formatDate, formatDateTime } from '@/lib/risk';

interface ScenarioBarProps {
  scenario: ScenarioKey;
  customDate: string;
  report: RiskReport | null;
  loading: boolean;
  offline: boolean;
  onChangeScenario: (scenario: ScenarioKey) => void;
  onChangeCustomDate: (value: string) => void;
  onRefresh: () => void;
}

const options: Array<{
  key: ScenarioKey;
  label: string;
  short: string;
  icon: React.ElementType;
  description: string;
}> = [
  {
    key: 'live',
    label: 'Latest data',
    short: 'Latest',
    icon: Radio,
    description: 'Most recent Open-Meteo reanalysis & forecast',
  },
  {
    key: 'monsoon-2024',
    label: 'Jun 2024 monsoon',
    short: 'Jun 2024',
    icon: History,
    description: 'Replays the 19 June 2024 Sylhet deluge',
  },
  {
    key: 'custom',
    label: 'Custom date',
    short: 'Custom',
    icon: Calendar,
    description: 'Evaluate any historical YYYY-MM-DD date',
  },
];

export default function ScenarioBar({
  scenario,
  customDate,
  report,
  loading,
  offline,
  onChangeScenario,
  onChangeCustomDate,
  onRefresh,
}: ScenarioBarProps) {
  const today = new Date().toISOString().slice(0, 10);
  const active = options.find((option) => option.key === scenario);
  const offlineQuality =
    report?.data_quality === 'DEGRADED_OFFLINE_CACHE' ||
    report?.data_quality === 'CACHED_SAMPLE';
  const modeLabel = !report
    ? 'Awaiting data'
    : offlineQuality
    ? 'Offline cached sample'
    : report.data_mode === 'HISTORICAL_REANALYSIS'
    ? 'Historical reanalysis'
    : report.data_mode === 'OFFLINE_CACHE'
    ? 'Offline cached sample'
    : report.data_mode === 'FORECAST'
    ? 'Forecast'
    : report.data_mode === 'LIVE_OBSERVED'
    ? 'Latest observed'
    : 'Mode unknown';

  return (
    <div className="panel p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <span className="eyebrow whitespace-nowrap">Scenario</span>
            <div className="flex rounded-lg border border-climate-border/80 bg-[#091120] p-1">
              {options.map((option) => {
                const selected = option.key === scenario;
                return (
                  <button
                    key={option.key}
                    onClick={() => onChangeScenario(option.key)}
                    className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[10px] font-semibold transition ${
                      selected
                        ? 'bg-cyan-400/15 text-cyan-300 shadow-sm ring-1 ring-cyan-400/25'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    aria-pressed={selected}
                    title={option.description}
                  >
                    <option.icon className="h-3 w-3" />
                    <span className="hidden sm:inline">{option.label}</span>
                    <span className="sm:hidden">{option.short}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {scenario === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customDate}
                max={today}
                onChange={(event) => onChangeCustomDate(event.target.value)}
                className="rounded-lg border border-climate-border/80 bg-[#091120] px-2.5 py-1.5 text-[11px] text-slate-200 outline-none transition focus:border-cyan-400/50"
                aria-label="Historical evaluation date"
              />
              {loading && <RotateCw className="h-3.5 w-3.5 animate-spin text-cyan-300" />}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                offline ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
            />
            {offline ? 'Offline snapshot' : 'API connected'}
          </span>
          {report?.as_of && (
            <span>
              Evaluation date <strong className="text-slate-300">{formatDate(report.as_of)}</strong>
            </span>
          )}
          {report?.generated_at && (
            <span className="hidden md:inline">
              Generated <strong className="text-slate-300">{formatDateTime(report.generated_at)}</strong>
            </span>
          )}
          <span
            className={`chip ${
              offlineQuality
                ? 'border-amber-400/25 bg-amber-400/5 text-amber-300'
                : 'border-cyan-400/20 bg-cyan-400/5 text-cyan-300/90'
            }`}
            title={active?.description}
          >
            {modeLabel}
          </span>
          <button onClick={onRefresh} className="button-ghost !px-2 !py-1 !text-[10px]">
            <RotateCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            Recompute
          </button>
        </div>
      </div>
    </div>
  );
}
