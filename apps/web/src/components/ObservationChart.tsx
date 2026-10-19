'use client';

import React from 'react';
import { BarChart3, Calendar, CloudRain } from 'lucide-react';

interface Observation {
  date: string;
  rainfall_mm: number;
  rainfall_3d_mm: number;
  rainfall_7d_mm: number;
  quality_flag?: string;
}

interface ObservationChartProps {
  observations: Observation[];
  locationName: string;
}

export default function ObservationChart({ observations, locationName }: ObservationChartProps) {
  if (!observations || observations.length === 0) {
    return (
      <div className="bg-[#111827] border border-gray-800 rounded-xl p-6 text-center text-gray-400">
        No observation records available for this station.
      </div>
    );
  }

  // Recent 20 observations for chart
  const recents = observations.slice(-20);
  const maxRain = Math.max(...recents.map(o => Math.max(o.rainfall_mm, o.rainfall_3d_mm / 3, 20)));

  return (
    <div className="bg-[#111827] border border-gray-800 rounded-xl p-5 shadow-lg space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-gray-800 gap-2">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-400" />
            Precipitation Observations ({locationName})
          </h3>
          <p className="text-xs text-gray-400">
            Daily rainfall (bars) vs. 3-day and 7-day cumulative saturation (past-only)
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-sky-400">
            <span className="w-3 h-3 bg-sky-500 rounded-sm"></span> 24h Rain (mm)
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <span className="w-3 h-1 bg-amber-400 rounded"></span> Trailing 3-Day
          </span>
          <span className="flex items-center gap-1 text-purple-400">
            <span className="w-3 h-1 bg-purple-400 rounded"></span> Trailing 7-Day
          </span>
        </div>
      </div>

      {/* Bar Chart Container */}
      <div className="h-64 flex items-end gap-1.5 pt-6 pb-2 px-2 overflow-x-auto">
        {recents.map((item, idx) => {
          const barHeight = Math.min(100, Math.max(4, (item.rainfall_mm / maxRain) * 100));
          const isHeavy = item.rainfall_mm >= 44.0; // BMD Heavy rain threshold
          const isVeryHeavy = item.rainfall_mm >= 88.0; // BMD Very Heavy

          return (
            <div
              key={item.date || idx}
              className="flex-1 min-w-[28px] max-w-[48px] h-full flex flex-col justify-end items-center group relative cursor-pointer"
            >
              {/* Tooltip on hover */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-16 z-20 pointer-events-none bg-gray-950 border border-gray-700 text-white rounded p-2 text-[10px] whitespace-nowrap shadow-xl">
                <div className="font-semibold text-sky-400">{item.date}</div>
                <div>24h Rain: {item.rainfall_mm} mm</div>
                <div>3d Rolling: {item.rainfall_3d_mm} mm</div>
                <div>7d Rolling: {item.rainfall_7d_mm} mm</div>
              </div>

              {/* Bar */}
              <div
                style={{ height: `${barHeight}%` }}
                className={`w-full rounded-t-sm transition-all duration-300 ${
                  isVeryHeavy
                    ? 'bg-rose-500 hover:bg-rose-400'
                    : isHeavy
                    ? 'bg-amber-500 hover:bg-amber-400'
                    : 'bg-sky-500 hover:bg-sky-400'
                }`}
              />
              
              {/* Date label */}
              <span className="text-[9px] text-gray-500 mt-1 truncate w-full text-center">
                {item.date ? item.date.slice(5) : ''}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer stats */}
      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-800 text-xs">
        <div className="bg-[#0B0F19] p-2.5 rounded-lg border border-gray-800">
          <span className="text-gray-400 block text-[11px]">Latest 24h Rainfall</span>
          <span className="text-base font-bold text-white">
            {recents[recents.length - 1]?.rainfall_mm ?? 0} mm
          </span>
        </div>
        <div className="bg-[#0B0F19] p-2.5 rounded-lg border border-gray-800">
          <span className="text-gray-400 block text-[11px]">Trailing 3-Day Sum</span>
          <span className="text-base font-bold text-amber-400">
            {recents[recents.length - 1]?.rainfall_3d_mm ?? 0} mm
          </span>
        </div>
        <div className="bg-[#0B0F19] p-2.5 rounded-lg border border-gray-800">
          <span className="text-gray-400 block text-[11px]">Trailing 7-Day Sum</span>
          <span className="text-base font-bold text-purple-400">
            {recents[recents.length - 1]?.rainfall_7d_mm ?? 0} mm
          </span>
        </div>
      </div>
    </div>
  );
}
