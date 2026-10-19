'use client';

import React from 'react';
import { MapPin, AlertCircle, Info, Waves } from 'lucide-react';

interface Station {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  elevation_m: number;
  river: string;
  danger_level_m: number;
}

interface SylhetMapProps {
  stations: Station[];
  selectedStationId: string;
  onSelectStation: (id: string) => void;
  currentRiskLevel?: string;
}

export default function SylhetMap({
  stations,
  selectedStationId,
  onSelectStation,
  currentRiskLevel = 'LOW'
}: SylhetMapProps) {
  // Bounding box for Sylhet region:
  // Lat: 24.7 to 25.3 (height ~0.6 deg)
  // Lon: 91.2 to 92.6 (width ~1.4 deg)
  const minLat = 24.65;
  const maxLat = 25.25;
  const minLon = 21.20; // coordinate space projection
  const lonSpan = 1.4;
  const latSpan = 0.6;

  // Project lat/lon to percentage in SVG viewBox (0-800 x 0-450)
  const project = (lat: number, lon: number) => {
    // lon 91.2 -> 92.6 => x: 50 -> 750
    const x = ((lon - 91.2) / 1.3) * 700 + 50;
    // lat 24.7 -> 25.2 => y: 400 -> 50 (inverted y)
    const y = 400 - ((lat - 24.7) / 0.5) * 350;
    return { x, y };
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'SEVERE': return '#EF4444';
      case 'HIGH': return '#F97316';
      case 'MODERATE': return '#EAB308';
      default: return '#10B981';
    }
  };

  return (
    <div className="relative w-full bg-[#111827] border border-gray-800 rounded-xl p-5 overflow-hidden shadow-lg">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-gray-800 mb-4 gap-2">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Waves className="w-5 h-5 text-sky-400" />
            Surma-Kushiyara Basin Station Map (Sylhet Division)
          </h3>
          <p className="text-xs text-gray-400">
            Real geographic coordinates & station hydrologic network
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-800 text-gray-300 rounded-md">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Active Station
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-950/60 text-amber-300 border border-amber-800/60 rounded-md">
            <AlertCircle className="w-3.5 h-3.5" /> Gauge Unmonitored
          </span>
        </div>
      </div>

      <div className="relative w-full aspect-[16/9] max-h-[380px] bg-[#0B0F19] rounded-lg border border-gray-800/80 p-2 overflow-hidden">
        <svg viewBox="0 0 800 450" className="w-full h-full select-none">
          {/* Subtle regional territory boundary */}
          <path
            d="M 60,340 Q 120,400 240,410 T 520,420 Q 680,390 740,320 T 730,120 Q 640,60 480,50 T 220,80 Q 90,140 60,340 Z"
            fill="#131D31"
            stroke="#1E293B"
            strokeWidth="2"
            strokeDasharray="4 4"
          />

          {/* Surma River corridor */}
          <path
            d="M 720,240 Q 650,220 560,200 T 380,215 T 160,180"
            fill="none"
            stroke="#0284C7"
            strokeWidth="5"
            strokeLinecap="round"
            opacity="0.8"
          />
          <text x="560" y="190" fill="#38BDF8" fontSize="11" fontWeight="500">
            Surma River →
          </text>

          {/* Kushiyara River corridor */}
          <path
            d="M 730,280 Q 660,320 540,330 T 360,350 T 180,320"
            fill="none"
            stroke="#0369A1"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.7"
          />
          <text x="540" y="345" fill="#0284C7" fontSize="11" fontWeight="500">
            Kushiyara River →
          </text>

          {/* Station Markers */}
          {stations.map((st) => {
            const { x, y } = project(st.latitude, st.longitude);
            const isSelected = st.id === selectedStationId;
            const markerColor = isSelected ? getRiskColor(currentRiskLevel) : '#38BDF8';

            return (
              <g
                key={st.id}
                onClick={() => onSelectStation(st.id)}
                className="cursor-pointer transition-transform hover:scale-110"
              >
                {/* Selection pulse ring */}
                {isSelected && (
                  <circle
                    cx={x}
                    cy={y}
                    r="20"
                    fill={markerColor}
                    opacity="0.25"
                    className="animate-ping"
                  />
                )}
                {/* Station base pin */}
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? "11" : "8"}
                  fill={markerColor}
                  stroke="#0B0F19"
                  strokeWidth="2.5"
                />
                <circle cx={x} cy={y} r="3" fill="#FFFFFF" />

                {/* Station Label Box */}
                <rect
                  x={x - 55}
                  y={y + 14}
                  width="110"
                  height="34"
                  rx="5"
                  fill="#111827"
                  stroke={isSelected ? markerColor : '#374151'}
                  strokeWidth={isSelected ? '1.5' : '1'}
                  opacity="0.95"
                />
                <text
                  x={x}
                  y={y + 28}
                  fill="#F9FAFB"
                  fontSize="11"
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {st.name}
                </text>
                <text
                  x={x}
                  y={y + 42}
                  fill="#9CA3AF"
                  fontSize="9"
                  textAnchor="middle"
                >
                  {st.latitude.toFixed(2)}°N, {st.longitude.toFixed(2)}°E
                </text>
              </g>
            );
          })}
        </svg>

        {/* Coverage Gap Banner */}
        <div className="absolute bottom-2 left-2 right-2 bg-gray-900/90 backdrop-blur-sm border border-gray-800 rounded-md p-2 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-sky-400 shrink-0" />
            <span>
              Real ERA5/ECMWF weather telemetry active. River gauge levels default to unmonitored to prevent falsification.
            </span>
          </div>
          <span className="hidden sm:inline font-mono text-[10px] text-gray-500">
            Sylhet Basin Polygon 24.8°N - 25.1°N
          </span>
        </div>
      </div>
    </div>
  );
}
