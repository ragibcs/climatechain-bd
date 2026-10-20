export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE' | 'UNKNOWN';

export type DataMode =
  | 'LIVE_OBSERVED'
  | 'HISTORICAL_REANALYSIS'
  | 'OFFLINE_CACHE'
  | 'FORECAST'
  | 'UNKNOWN';

export interface Station {
  id: string;
  name: string;
  division?: string;
  district?: string;
  latitude: number;
  longitude: number;
  elevation_m: number;
  river: string;
  bwdb_station_id?: string;
  danger_level_m: number;
  description?: string;
}

export interface SparkPoint {
  date: string;
  rainfall_mm: number;
}

export interface StationSummary {
  id: string;
  name: string;
  river: string;
  district?: string;
  latitude: number;
  longitude: number;
  elevation_m?: number;
  danger_level_m?: number;
  score: number | null;
  risk_level: RiskLevel;
  severity_label: string;
  rainfall_1d_mm: number | null;
  rainfall_3d_mm: number | null;
  rainfall_7d_mm: number | null;
  rainfall_delta_1d_mm: number | null;
  as_of?: string;
  data_quality: string;
  data_mode: DataMode;
  sparkline: SparkPoint[];
}

export interface Overview {
  generated_at: string;
  as_of: string | null;
  basin_score: number | null;
  basin_risk_level: RiskLevel;
  highest_risk_station: string | null;
  station_count: number;
  data_mode?: DataMode;
  stations: StationSummary[];
}

export interface RiskFactor {
  name: string;
  value_mm: number;
  contribution_pct: number;
  interpretation: string;
}

export interface TrendPoint {
  date: string;
  rainfall_mm: number;
  rainfall_3d_mm: number;
  rainfall_7d_mm: number;
}

export interface RiskReport {
  report_id: string;
  location_id: string;
  location_name: string;
  coordinates: { latitude: number; longitude: number };
  as_of: string;
  generated_at: string;
  target: string;
  model_version: string;
  risk_level: RiskLevel;
  severity_label: string;
  score: number;
  metrics: {
    rainfall_1d_mm: number;
    rainfall_3d_mm: number;
    rainfall_7d_mm: number;
    danger_level_m: number | null;
    river_level_m: number | null;
    peak_3d_mm?: number;
    rainfall_delta_1d_mm?: number;
  };
  data_quality: string;
  data_mode?: DataMode;
  data_source?: string;
  station?: {
    river?: string;
    district?: string;
    elevation_m?: number;
    bwdb_station_id?: string;
    danger_level_m?: number | null;
  };
  explanation: {
    summary: string;
    factors: RiskFactor[];
  };
  trend?: TrendPoint[];
  limitations: string[];
}

export interface Observation {
  date: string;
  rainfall_mm: number;
  rainfall_3d_mm: number;
  rainfall_7d_mm: number;
  quality_flag?: string;
  source_id?: string;
}

export interface ForecastDay {
  date: string;
  rainfall_mm: number;
  precipitation_probability_pct: number | null;
  temperature_max_c: number | null;
  temperature_min_c: number | null;
  weather_code?: number | null;
}

export interface ForecastOutlook {
  available: boolean;
  location_id: string;
  location_name: string;
  generated_at?: string;
  data_mode?: DataMode;
  source?: string;
  days: number;
  total_mm?: number;
  peak_daily_mm?: number;
  peak_3d_mm?: number;
  wettest_day?: string;
  score?: number;
  risk_level?: RiskLevel;
  severity_label?: string;
  summary?: string;
  reason?: string;
  forecast: ForecastDay[];
}

export interface DatasetManifest {
  location_id: string;
  source?: string;
  citation?: string;
  retrieved_at?: string;
  record_count?: number;
  sha256?: string;
  computed_sha256?: string | null;
  integrity_verified: boolean;
  coverage?: { start?: string; end?: string } | null;
}

export interface DatasetResponse {
  generated_at: string;
  dataset_count: number;
  integrity_verified_count: number;
  datasets: DatasetManifest[];
}

export type VerificationStatus =
  | 'VERIFIED'
  | 'MISMATCH'
  | 'NOT_FOUND'
  | 'UNAVAILABLE'
  | 'PENDING';

export interface VerificationResult {
  status: VerificationStatus;
  reason: string;
  computed_hash?: string | null;
  onchain_hash?: string | null;
  verified?: boolean;
  report_id?: string;
  mode?: string;
  record?: Record<string, unknown>;
}

export interface RegistrationRecord {
  report_id: string;
  report_hash: string;
  data_hash: string;
  model_version: string;
  metadata_uri: string;
  transaction_hash: string;
  block_number: number;
  registered_at: string;
  submitter: string;
  network: string;
  mode?: 'ONCHAIN' | 'SIMULATED_FALLBACK' | 'LOCAL_SIMULATOR' | string;
}

export interface RegistryResponse {
  mode?: string;
  write_enabled?: boolean;
  network?: string;
  count: number;
  records: RegistrationRecord[];
}

export interface HealthResponse {
  status: string;
  version?: string;
  timestamp?: string;
  uptime_seconds?: number;
  environment?: {
    model_version?: string;
    target?: string;
    chain_id?: number;
    contract_configured?: boolean;
    provenance_mode?: string;
    provenance_write_enabled?: boolean;
    stations_supported?: number;
  };
  dependencies?: {
    blockchain_rpc_connected?: boolean;
    blockchain_ready?: boolean;
    blockchain_mode?: string;
    open_meteo_api?: string;
    open_meteo_last_checked?: string | null;
    open_meteo_last_error?: string | null;
  };
}

export type ScenarioKey = 'live' | 'monsoon-2024' | 'custom';

export interface Scenario {
  key: ScenarioKey;
  label: string;
  asOf: string | null;
  description: string;
}
