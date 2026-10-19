'use client';

import React from 'react';
import {
  CloudLightning,
  AlertTriangle,
  Info,
  Calendar,
  Compass,
  ArrowUpRight,
  Shield
} from 'lucide-react';

interface RiskOverviewProps {
  report: any;
  stations: any[];
  selectedStationId: string;
  onSelectStation: (id: string) => void;
  loading: boolean;
}

export default function RiskOverview({
  report,
  stations,
  selectedStationId,
  onSelectStation,
  loading
}: RiskOverviewProps) {
  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'SEVERE':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'MODERATE':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-rose-400';
    if (score >= 50) return 'text-amber-400';
    if (score >= 25) return 'text-yellow-400';
    return 'text-emerald-400';
  };

  return (
    <div className="bg-[#111827] border border-gray-800 rounded-xl p-5 shadow-lg space-y-5">
      {/* Station Selector Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-gray-800">
        <span className="text-xs text-gray-400 font-medium whitespace-nowrap mr-2">
          Select Station:
        </span>
        {stations.map((st) => (
          <button
            key={st.id}
            onClick={() => onSelectStation(st.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              st.id === selectedStationId
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {st.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-44 flex items-center justify-center text-gray-400 text-xs">
          Computing real-time rainfall risk intelligence...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Main Risk Gauge / Score */}
          <div className="bg-[#0B0F19] p-5 rounded-xl border border-gray-800 flex flex-col items-center justify-center text-center space-y-2 relative overflow-hidden">
            <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
              Sylhet Rainfall Risk Index (SRRI)
            </span>
            <div className="flex items-baseline gap-1">
              <span className={`text-5xl font-black ${getScoreColor(report?.score ?? 0)}`}>
                {report?.score ?? 0}
              </span>
              <span className="text-gray-500 text-sm font-semibold">/100</span>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wide ${getRiskBadge(
                report?.risk_level ?? 'LOW'
              )}`}
            >
              {report?.risk_level ?? 'LOW'} RISK
            </div>
            <span className="text-[11px] text-gray-400">
              {report?.severity_label ?? 'Low Rainfall Risk'}
            </span>
          </div>

          {/* Meteorological Metrics Breakdown */}
          <div className="md:col-span-2 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-[#0B0F19] p-3 rounded-lg border border-gray-800">
                <span className="text-[10px] text-gray-400 block">24h Rainfall</span>
                <span className="text-lg font-bold text-sky-400">
                  {report?.metrics?.rainfall_1d_mm ?? 0} mm
                </span>
                <span className="text-[9px] text-gray-500 block">BMD Very Heavy &gt;88mm</span>
              </div>

              <div className="bg-[#0B0F19] p-3 rounded-lg border border-gray-800">
                <span className="text-[10px] text-gray-400 block">3-Day Cumulative</span>
                <span className="text-lg font-bold text-amber-400">
                  {report?.metrics?.rainfall_3d_mm ?? 0} mm
                </span>
                <span className="text-[9px] text-gray-500 block">Surma Inflow</span>
              </div>

              <div className="bg-[#0B0F19] p-3 rounded-lg border border-gray-800">
                <span className="text-[10px] text-gray-400 block">7-Day Cumulative</span>
                <span className="text-lg font-bold text-purple-400">
                  {report?.metrics?.rainfall_7d_mm ?? 0} mm
                </span>
                <span className="text-[9px] text-gray-500 block">Haor Saturation</span>
              </div>

              <div className="bg-[#0B0F19] p-3 rounded-lg border border-gray-800">
                <span className="text-[10px] text-gray-400 block">Station Danger Level</span>
                <span className="text-lg font-bold text-gray-200">
                  {report?.metrics?.danger_level_m ?? 'N/A'} m
                </span>
                <span className="text-[9px] text-gray-500 block">BWDB Benchmark</span>
              </div>
            </div>

            {/* Natural language explanation summary */}
            <div className="bg-[#0B0F19] p-3.5 rounded-lg border border-gray-800 text-xs text-gray-300 space-y-1">
              <div className="font-semibold text-white flex items-center gap-1.5">
                <Info className="w-4 h-4 text-sky-400" />
                Assessment Summary & Interpretation:
              </div>
              <p className="leading-relaxed">
                {report?.explanation?.summary || 'Standard meteorological assessment in progress.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
