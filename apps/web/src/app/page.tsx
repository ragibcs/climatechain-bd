'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import PrototypeNotice from '@/components/PrototypeNotice';
import ScenarioBar from '@/components/ScenarioBar';
import RiskOverview from '@/components/RiskOverview';
import StationGrid from '@/components/StationGrid';
import SylhetMap from '@/components/SylhetMap';
import ObservationChart from '@/components/ObservationChart';
import ForecastStrip from '@/components/ForecastStrip';
import ProvenanceSection from '@/components/ProvenanceSection';
import ImpactSection from '@/components/ImpactSection';
import MethodologySection from '@/components/MethodologySection';
import Footer from '@/components/Footer';
import ToastStack, { type Toast } from '@/components/ui/ToastStack';
import {
  fallbackOverview,
  fallbackReport,
  fallbackStations,
  fallbackStationSummaries,
} from '@/lib/fallback';
import type {
  DatasetResponse,
  ForecastOutlook,
  HealthResponse,
  Observation,
  Overview,
  RiskReport,
  ScenarioKey,
  Station,
} from '@/lib/types';

const DEFAULT_STATION = 'sylhet-sadar';
const MONSOON_DATE = '2024-06-19';

async function getJSON<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    let detail = `${response.status} ${response.statusText}`;
    try {
      const body = await response.json();
      detail = body.detail || detail;
    } catch {
      // keep the status text
    }
    throw new Error(detail);
  }
  return response.json();
}

function shiftDate(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function buildFallbackReport(station: Station | undefined): RiskReport {
  if (!station || station.id === fallbackReport.location_id) return fallbackReport;
  const summary =
    fallbackStationSummaries.find((item) => item.id === station.id) ?? fallbackStationSummaries[0];
  return {
    ...fallbackReport,
    report_id: `REP-${station.id.toUpperCase()}-${summary.as_of}`,
    location_id: station.id,
    location_name: station.name,
    coordinates: { latitude: station.latitude, longitude: station.longitude },
    as_of: summary.as_of ?? fallbackReport.as_of,
    score: summary.score ?? fallbackReport.score,
    risk_level: summary.risk_level,
    severity_label: summary.severity_label,
    metrics: {
      ...fallbackReport.metrics,
      rainfall_1d_mm: summary.rainfall_1d_mm ?? 0,
      rainfall_3d_mm: summary.rainfall_3d_mm ?? 0,
      rainfall_7d_mm: summary.rainfall_7d_mm ?? 0,
      danger_level_m: summary.danger_level_m ?? null,
    },
    station: {
      ...fallbackReport.station,
      river: station.river,
      district: station.district,
      elevation_m: station.elevation_m,
      bwdb_station_id: station.bwdb_station_id,
      danger_level_m: station.danger_level_m,
    },
    explanation: {
      ...fallbackReport.explanation,
      summary: `Offline cached snapshot for ${station.name}: SRRI ${summary.score ?? '—'}/100 (${summary.risk_level}).`,
    },
  };
}

export default function Home() {
  const [stations, setStations] = useState<Station[]>(fallbackStations);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string>(DEFAULT_STATION);
  const [report, setReport] = useState<RiskReport | null>(null);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [forecast, setForecast] = useState<ForecastOutlook | null>(null);
  const [datasets, setDatasets] = useState<DatasetResponse | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [scenario, setScenario] = useState<ScenarioKey>('live');
  const [customDate, setCustomDate] = useState<string>(MONSOON_DATE);
  const [loading, setLoading] = useState<boolean>(true);
  const [overviewLoading, setOverviewLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [apiStatus, setApiStatus] = useState<string>('connecting');
  const [shellOffline, setShellOffline] = useState<boolean>(false);
  const [overviewOffline, setOverviewOffline] = useState<boolean>(false);
  const [stationOffline, setStationOffline] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastCounter = useRef(0);
  const overviewRequest = useRef(0);
  const stationRequest = useRef(0);

  const asOf =
    scenario === 'monsoon-2024'
      ? MONSOON_DATE
      : scenario === 'custom' && customDate
      ? customDate
      : null;

  // Any fallback surface is enough to show the offline disclosure. This avoids
  // a fast station request masking a failed basin overview.
  const offline = shellOffline || overviewOffline || stationOffline;

  const notify = useCallback(
    (toast: { title: string; description?: string; tone?: Toast['tone'] }) => {
      const id = ++toastCounter.current;
      setToasts((current) => [...current, { ...toast, id }]);
      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== id));
      }, 6500);
    },
    []
  );

  const loadShell = useCallback(async () => {
    const results = await Promise.allSettled([
      getJSON<HealthResponse>('/api/health'),
      getJSON<Station[]>('/api/locations'),
      getJSON<DatasetResponse>('/api/datasets'),
    ]);

    let anySuccess = false;

    if (results[0].status === 'fulfilled') {
      anySuccess = true;
      setHealth(results[0].value);
      setApiStatus(results[0].value.status || 'healthy');
    }
    if (results[1].status === 'fulfilled' && results[1].value.length > 0) {
      anySuccess = true;
      setStations(results[1].value);
    }
    if (results[2].status === 'fulfilled') {
      anySuccess = true;
      setDatasets(results[2].value);
    }

    if (!anySuccess) {
      setApiStatus('offline');
      setShellOffline(true);
      setStations(fallbackStations);
    } else {
      setShellOffline(false);
      if (results[0].status !== 'fulfilled') setApiStatus('degraded');
    }
  }, []);

  const loadOverview = useCallback(async (date: string | null, force = false) => {
    const requestId = ++overviewRequest.current;
    setOverviewLoading(true);
    try {
      const params = new URLSearchParams({ live: 'true' });
      if (date) params.set('as_of', date);
      if (force) params.set('refresh', 'true');
      const data = await getJSON<Overview>(`/api/overview?${params.toString()}`);
      if (requestId !== overviewRequest.current) return;
      setOverview(data);
      setOverviewOffline(
        data.stations.length === 0 ||
          data.stations.some(
            (station) =>
              station.data_quality === 'DEGRADED_OFFLINE_CACHE' ||
              station.data_quality === 'CACHED_SAMPLE'
          )
      );
      setLastSynced(new Date().toISOString());
    } catch {
      if (requestId !== overviewRequest.current) return;
      setOverview(fallbackOverview);
      setOverviewOffline(true);
      setApiStatus((current) => (current === 'connecting' ? 'offline' : current));
    } finally {
      if (requestId === overviewRequest.current) setOverviewLoading(false);
    }
  }, []);

  const loadStation = useCallback(async (locationId: string, date: string | null, force = false) => {
    const requestId = ++stationRequest.current;
    setLoading(true);
    const riskParams = new URLSearchParams({ location_id: locationId });
    if (date) riskParams.set('as_of', date);
    if (force) riskParams.set('_', String(Date.now()));

    const observationParams = new URLSearchParams({ location_id: locationId, limit: '30' });
    if (date) {
      observationParams.set('start_date', shiftDate(date, -16));
      observationParams.set('end_date', date);
      observationParams.set('limit', '60');
    }

    const requests: Array<Promise<unknown>> = [
      getJSON<RiskReport>(`/api/risk?${riskParams.toString()}`),
      getJSON<{ observations: Observation[] }>(`/api/observations?${observationParams.toString()}`),
    ];
    if (!date) {
      requests.push(getJSON<ForecastOutlook>(`/api/forecast?location_id=${locationId}&days=7`));
    }

    const results = await Promise.allSettled(requests);
    if (requestId !== stationRequest.current) return;
    const station = fallbackStations.find((item) => item.id === locationId);

    if (results[0].status === 'fulfilled') {
      const riskReport = results[0].value as RiskReport;
      setReport(riskReport);
      setStationOffline(
        riskReport.data_quality === 'DEGRADED_OFFLINE_CACHE' ||
          riskReport.data_quality === 'CACHED_SAMPLE'
      );
      setLastSynced(new Date().toISOString());
    } else {
      setReport(buildFallbackReport(station));
      setStationOffline(true);
    }

    if (results[1].status === 'fulfilled') {
      const payload = results[1].value as { observations: Observation[] };
      setObservations(payload.observations || []);
    } else {
      setObservations([]);
    }

    if (!date) {
      if (results[2]?.status === 'fulfilled') {
        setForecast(results[2].value as ForecastOutlook);
      } else {
        setForecast(null);
      }
    } else {
      setForecast(null);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadShell();
  }, [loadShell]);

  useEffect(() => {
    loadOverview(asOf);
  }, [asOf, loadOverview]);

  useEffect(() => {
    loadStation(selectedLocationId, asOf);
  }, [selectedLocationId, asOf, loadStation]);

  // Keep the live view fresh without disturbing a judge's historical scenario.
  useEffect(() => {
    if (scenario !== 'live') return;
    const interval = window.setInterval(() => {
      loadOverview(null);
      loadStation(selectedLocationId, null);
    }, 5 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, [scenario, selectedLocationId, loadOverview, loadStation]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadShell(), loadOverview(asOf, true), loadStation(selectedLocationId, asOf, true)]);
    setRefreshing(false);
    notify({
      title: 'Climate data refreshed',
      description: asOf ? `Recomputed the ${asOf} historical scenario.` : 'Pulled the latest basin snapshot.',
      tone: 'success',
    });
  }, [asOf, loadShell, loadOverview, loadStation, selectedLocationId, notify]);

  const handleScenario = useCallback(
    (next: ScenarioKey) => {
      setScenario(next);
      setReport(null);
      setObservations([]);
      setForecast(null);
      if (next === 'monsoon-2024') {
        notify({
          title: 'June 2024 monsoon loaded',
          description: 'Replaying the 19 June 2024 deluge across all four Surma basin stations.',
          tone: 'info',
        });
      } else if (next === 'custom') {
        notify({
          title: 'Custom historical date',
          description: 'Pick any date to recompute the index from ERA5 reanalysis.',
          tone: 'info',
        });
      }
    },
    [notify]
  );

  const activeStations = stations.length > 0 ? stations : fallbackStations;
  const currentStation =
    activeStations.find((station) => station.id === selectedLocationId) ?? activeStations[0];
  const currentName = report?.location_name || currentStation?.name || 'Sylhet Station';

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar
        apiStatus={apiStatus}
        provenanceMode={health?.environment?.provenance_mode}
        lastSynced={lastSynced}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />

      <main className="flex-1">
        <Hero
          overview={overview}
          health={health}
          offline={offline}
          onLoadScenario={handleScenario}
        />

        <div className="shell mt-6 space-y-5 pb-10 sm:mt-8">
          <PrototypeNotice />

          <ScenarioBar
            scenario={scenario}
            customDate={customDate}
            report={report}
            loading={loading || overviewLoading}
            offline={offline}
            onChangeScenario={handleScenario}
            onChangeCustomDate={setCustomDate}
            onRefresh={handleRefresh}
          />

          <RiskOverview
            report={report}
            observations={observations}
            stations={activeStations}
            selectedStationId={selectedLocationId}
            onSelectStation={setSelectedLocationId}
            loading={loading}
          />

          <StationGrid
            overview={overview}
            selectedStationId={selectedLocationId}
            onSelectStation={setSelectedLocationId}
            loading={overviewLoading}
          />

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 xl:items-start">
            <SylhetMap
              stations={activeStations}
              overview={overview}
              selectedStationId={selectedLocationId}
              onSelectStation={setSelectedLocationId}
            />
            <ObservationChart observations={observations} locationName={currentName} />
          </div>

          <ForecastStrip
            forecast={forecast}
            locationName={currentName}
            loading={loading}
            isHistorical={Boolean(asOf)}
            onLoadLive={() => handleScenario('live')}
          />

          <ProvenanceSection report={report} onRefresh={handleRefresh} notify={notify} />

          <ImpactSection />

          <MethodologySection datasets={datasets} />

          <div className="flex flex-col items-center justify-between gap-2 rounded-xl border border-climate-border/50 bg-white/[0.015] px-4 py-3 text-[9px] text-slate-600 sm:flex-row">
            <span>
              Built for the IEEE ClimateChain Global Hackathon · Climate Data &amp; Environmental Monitoring
            </span>
            <span className="font-mono">
              Next.js 14 · FastAPI · Solidity 0.8.24 · Open-Meteo / ECMWF
            </span>
          </div>
        </div>
      </main>

      <Footer />
      <ToastStack
        toasts={toasts}
        onDismiss={(id) => setToasts((current) => current.filter((item) => item.id !== id))}
      />
    </div>
  );
}
