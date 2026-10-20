import type { Overview, RiskReport, StationSummary, Station } from './types';

/**
 * Last-resort demo snapshot derived from the committed, SHA-256-manifested
 * June 2024 monsoon sample. It is *only* used when the API cannot be reached,
 * and every surface that renders it labels the data as cached/offline.
 */
export const fallbackStations: Station[] = [
  {
    id: 'sylhet-sadar',
    name: 'Sylhet Sadar',
    division: 'Sylhet',
    district: 'Sylhet',
    latitude: 24.8949,
    longitude: 91.8687,
    elevation_m: 20.0,
    river: 'Surma River',
    bwdb_station_id: 'SW267',
    danger_level_m: 10.8,
    description: 'Sylhet metropolitan area and urban drainage basin along the Surma River.',
  },
  {
    id: 'sunamganj',
    name: 'Sunamganj Sadar',
    division: 'Sylhet',
    district: 'Sunamganj',
    latitude: 25.0667,
    longitude: 91.4,
    elevation_m: 11.0,
    river: 'Surma River (Haor Basin)',
    bwdb_station_id: 'SW268',
    danger_level_m: 7.8,
    description: 'Critical low-lying haor wetland basin vulnerable to early monsoon flash floods.',
  },
  {
    id: 'kanaighat',
    name: 'Kanaighat',
    division: 'Sylhet',
    district: 'Sylhet',
    latitude: 25.0,
    longitude: 92.2667,
    elevation_m: 23.0,
    river: 'Upper Surma River',
    bwdb_station_id: 'SW266',
    danger_level_m: 12.75,
    description: 'Upstream Surma entry corridor receiving transboundary runoff from Meghalaya.',
  },
  {
    id: 'zakiganj',
    name: 'Zakiganj',
    division: 'Sylhet',
    district: 'Sylhet',
    latitude: 24.8833,
    longitude: 92.3667,
    elevation_m: 21.0,
    river: 'Kushiyara River (Sheola)',
    bwdb_station_id: 'SW172',
    danger_level_m: 12.5,
    description: 'Barak bifurcation into Surma and Kushiyara at the India–Bangladesh border.',
  },
];

const fallbackSeed: Array<{
  id: string;
  score: number;
  r1: number;
  r3: number;
  r7: number;
}> = [
  { id: 'sylhet-sadar', score: 93.0, r1: 85.9, r3: 269.8, r7: 460.0 },
  { id: 'sunamganj', score: 86.0, r1: 72.1, r3: 263.5, r7: 485.9 },
  { id: 'kanaighat', score: 82.9, r1: 65.8, r3: 219.1, r7: 372.2 },
  { id: 'zakiganj', score: 75.6, r1: 60.7, r3: 179.1, r7: 321.6 },
];

export const fallbackStationSummaries: StationSummary[] = fallbackStations.map((station) => {
  const seed = fallbackSeed.find((s) => s.id === station.id)!;
  return {
    id: station.id,
    name: station.name,
    river: station.river,
    district: station.district,
    latitude: station.latitude,
    longitude: station.longitude,
    elevation_m: station.elevation_m,
    danger_level_m: station.danger_level_m,
    score: seed.score,
    risk_level: 'SEVERE',
    severity_label: 'Severe Rainfall & Flash Flood Alert',
    rainfall_1d_mm: seed.r1,
    rainfall_3d_mm: seed.r3,
    rainfall_7d_mm: seed.r7,
    rainfall_delta_1d_mm: 0,
    as_of: '2024-06-19',
    data_quality: 'DEGRADED_OFFLINE_CACHE',
    data_mode: 'OFFLINE_CACHE',
    sparkline: [],
  };
});

export const fallbackOverview: Overview = {
  generated_at: new Date().toISOString(),
  as_of: '2024-06-19',
  basin_score: 84.4,
  basin_risk_level: 'SEVERE',
  highest_risk_station: 'sylhet-sadar',
  station_count: fallbackStations.length,
  data_mode: 'OFFLINE_CACHE',
  stations: fallbackStationSummaries,
};

export const fallbackReport: RiskReport = {
  report_id: 'REP-SYLHET-SADAR-2024-06-19',
  location_id: 'sylhet-sadar',
  location_name: 'Sylhet Sadar',
  coordinates: { latitude: 24.8949, longitude: 91.8687 },
  as_of: '2024-06-19',
  generated_at: new Date().toISOString(),
  target: 'rainfall_risk_indicator',
  model_version: 'rainfall-indicator-v1',
  risk_level: 'SEVERE',
  severity_label: 'Severe Rainfall & Flash Flood Alert',
  score: 93.0,
  metrics: {
    rainfall_1d_mm: 85.9,
    rainfall_3d_mm: 269.8,
    rainfall_7d_mm: 460.0,
    danger_level_m: 10.8,
    river_level_m: null,
    peak_3d_mm: 269.8,
    rainfall_delta_1d_mm: 12.4,
  },
  data_quality: 'DEGRADED_OFFLINE_CACHE',
  data_mode: 'OFFLINE_CACHE',
  data_source: 'Committed June 2024 Open-Meteo / ERA5 sample (offline cache)',
  station: {
    river: 'Surma River',
    district: 'Sylhet',
    elevation_m: 20,
    bwdb_station_id: 'SW267',
    danger_level_m: 10.8,
  },
  explanation: {
    summary:
      'SRRI score is 93.0/100 (SEVERE). Observed 24h rainfall: 85.9mm; 3-day: 269.8mm; 7-day: 460.0mm. This offline demo snapshot uses the committed June 2024 monsoon sample.',
    factors: [
      {
        name: '24h Precipitation',
        value_mm: 85.9,
        contribution_pct: 46.2,
        interpretation:
          'Immediate flash flood / cloudburst potential (BMD Heavy >44mm, Very Heavy >88mm)',
      },
      {
        name: 'Trailing 3-Day Cumulative',
        value_mm: 269.8,
        contribution_pct: 32.3,
        interpretation: 'Surma river catchment inflow & urban drainage congestion',
      },
      {
        name: 'Trailing 7-Day Cumulative',
        value_mm: 460.0,
        contribution_pct: 21.5,
        interpretation: 'Haor basin saturation and regional wetland absorption limit',
      },
    ],
  },
  limitations: [
    'Offline demo snapshot: the API could not be reached, so this report is read from the committed sample.',
    'Research prototype developed for the IEEE ClimateChain Global Hackathon.',
    'Not an official flood forecasting or evacuation warning system. Follow BMD and FFWC advisories.',
  ],
};
