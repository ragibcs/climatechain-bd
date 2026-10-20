'use client';

import React from 'react';
import {
  Cloud,
  CloudLightning,
  CloudRain,
  CloudSun,
  Cloudy,
  Droplets,
  Radio,
  Sun,
  Thermometer,
  Umbrella,
  Wind,
} from 'lucide-react';
import type { ForecastOutlook } from '@/lib/types';
import { formatDate, formatMm, scoreColor, themeFor } from '@/lib/risk';
import RiskBadge from './ui/RiskBadge';
import SectionHeader from './ui/SectionHeader';

interface ForecastStripProps {
  forecast: ForecastOutlook | null;
  locationName: string;
  loading: boolean;
  isHistorical: boolean;
  onLoadLive: () => void;
}

function weatherIcon(code?: number | null, rain = 0) {
  if (code === 95 || code === 96 || code === 99) return CloudLightning;
  if (rain >= 20 || (code !== null && code !== undefined && code >= 61 && code <= 67)) return CloudRain;
  if (rain >= 5 || (code !== null && code !== undefined && code >= 51 && code <= 57)) return Cloudy;
  if (code !== null && code !== undefined && code >= 1 && code <= 3) return CloudSun;
  if (code === 0) return Sun;
  return Cloud;
}

export default function ForecastStrip({
  forecast,
  locationName,
  loading,
  isHistorical,
  onLoadLive,
}: ForecastStripProps) {
  const theme = themeFor(forecast?.risk_level);
  const forecastDays = forecast?.forecast ?? [];
  const maxRain = Math.max(1, ...forecastDays.map((day) => day.rainfall_mm || 0));

  return (
    <section id="forecast" className="panel overflow-hidden">
      <div className="p-5 sm:p-6">
        <SectionHeader
          icon={Umbrella}
          eyebrow="7-day outlook"
          title={`Forecast rainfall · ${locationName}`}
          description="Numerical weather prediction is kept explicitly separate from observed risk and is never registered as historical provenance."
          action={
            <span className="chip border-cyan-400/20 bg-cyan-400/5 text-cyan-300/90">
              <Radio className="h-3 w-3" />
              {isHistorical ? 'Live-only feature' : 'Open-Meteo NWP'}
            </span>
          }
        />

        {isHistorical ? (
          <div className="mt-5 flex flex-col items-center justify-center rounded-xl border border-dashed border-climate-border/80 bg-[#07101F]/70 px-6 py-12 text-center">
            <Umbrella className="mb-3 h-8 w-8 text-slate-600" />
            <p className="text-sm font-semibold text-white">You are viewing a historical scenario</p>
            <p className="mt-1 max-w-md text-[11px] leading-relaxed text-slate-500">
              Forecasts only make sense for the present. Switch back to live mode to see the
              current 7-day precipitation outlook for {locationName}.
            </p>
            <button onClick={onLoadLive} className="button-primary mt-4">
              <Radio className="h-4 w-4" />
              Return to live forecast
            </button>
          </div>
        ) : loading && !forecast ? (
          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {[0, 1, 2, 3, 4, 5, 6].map((index) => (
              <div key={index} className="skeleton h-36" />
            ))}
          </div>
        ) : !forecast?.available || forecastDays.length === 0 ? (
          <div className="mt-5 flex flex-col items-center justify-center rounded-xl border border-dashed border-climate-border/80 bg-[#07101F]/70 px-6 py-10 text-center">
            <CloudRain className="mb-3 h-7 w-7 text-slate-600" />
            <p className="text-xs font-semibold text-slate-300">Forecast provider unavailable</p>
            <p className="mt-1 max-w-md text-[10px] leading-relaxed text-slate-500">
              {forecast?.reason || 'The upstream numerical weather prediction service did not respond.'}{' '}
              The latest available observation snapshot and basin risk remain visible; no forecast
              values are invented.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_300px]">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
                {forecastDays.map((day, index) => {
                  const Icon = weatherIcon(day.weather_code, day.rainfall_mm);
                  const isWettest = day.date === forecast.wettest_day && day.rainfall_mm > 0;
                  const probability = day.precipitation_probability_pct ?? 0;
                  return (
                    <div
                      key={day.date}
                      className={`group relative overflow-hidden rounded-xl border p-3 transition hover:-translate-y-0.5 ${
                        isWettest
                          ? 'border-cyan-400/40 bg-cyan-400/[0.06]'
                          : 'border-climate-border/70 bg-[#091120]/80 hover:border-cyan-400/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          {index === 0
                            ? 'Today'
                            : new Date(`${day.date}T00:00:00`).toLocaleDateString('en-GB', {
                                weekday: 'short',
                              })}
                        </p>
                        {isWettest && <Droplets className="h-3 w-3 text-cyan-300" />}
                      </div>
                      <p className="mt-0.5 text-[9px] text-slate-600">{formatDate(day.date, { year: undefined })}</p>
                      <Icon
                        className={`mt-3 h-6 w-6 ${day.rainfall_mm >= 20 ? 'text-sky-300' : 'text-slate-400'}`}
                        strokeWidth={1.6}
                      />
                      <p className="mt-2 text-sm font-bold text-white">
                        {formatMm(day.rainfall_mm)}
                      </p>
                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400"
                          style={{ width: `${Math.max(3, (day.rainfall_mm / maxRain) * 100)}%` }}
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[9px] text-slate-500">
                        <span className="flex items-center gap-0.5">
                          <Umbrella className="h-2.5 w-2.5" />
                          {probability}%
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Thermometer className="h-2.5 w-2.5" />
                          {day.temperature_max_c ?? '—'}°
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-xl border border-climate-border/70 bg-[#091120]/80 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="eyebrow">Forecast SRRI</p>
                    <p className="mt-1 text-[11px] text-slate-400">Horizon risk indicator</p>
                  </div>
                  <RiskBadge level={forecast.risk_level} />
                </div>
                <div className="mt-3 flex items-end gap-2">
                  <span className={`text-4xl font-black tabular-nums ${scoreColor(forecast.score)}`}>
                    {forecast.score?.toFixed(1) ?? '—'}
                  </span>
                  <span className="mb-1 text-[10px] text-slate-500">/100</span>
                </div>
                <p className={`mt-1 text-[11px] font-semibold ${theme.text}`}>
                  {forecast.severity_label}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-climate-border/60 pt-3">
                  <div>
                    <p className="stat-label">7-day total</p>
                    <p className="mt-0.5 text-sm font-bold text-sky-300">{formatMm(forecast.total_mm)}</p>
                  </div>
                  <div>
                    <p className="stat-label">Peak 24h</p>
                    <p className="mt-0.5 text-sm font-bold text-cyan-300">{formatMm(forecast.peak_daily_mm)}</p>
                  </div>
                  <div>
                    <p className="stat-label">Peak 3d</p>
                    <p className="mt-0.5 text-sm font-bold text-amber-300">{formatMm(forecast.peak_3d_mm)}</p>
                  </div>
                  <div>
                    <p className="stat-label">Wettest</p>
                    <p className="mt-0.5 text-[11px] font-bold text-slate-200">
                      {formatDate(forecast.wettest_day, { year: undefined })}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-start gap-1.5 rounded-lg border border-amber-400/20 bg-amber-400/5 p-2">
                  <Wind className="mt-0.5 h-3 w-3 shrink-0 text-amber-300" />
                  <p className="text-[9px] leading-relaxed text-amber-200/80">
                    Forecast values are model output, not observations. They are excluded from
                    provenance registration.
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-3 text-[9px] text-slate-600">
              Source: {forecast.source} · Generated {forecast.generated_at?.slice(0, 16).replace('T', ' ')} UTC
            </p>
          </>
        )}
      </div>
    </section>
  );
}
