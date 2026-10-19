'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import PrototypeNotice from '@/components/PrototypeNotice';
import RiskOverview from '@/components/RiskOverview';
import SylhetMap from '@/components/SylhetMap';
import ObservationChart from '@/components/ObservationChart';
import ProvenanceSection from '@/components/ProvenanceSection';
import MethodologySection from '@/components/MethodologySection';

export default function Home() {
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('sylhet-sadar');
  const [report, setReport] = useState<any>(null);
  const [observations, setObservations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [apiStatus, setApiStatus] = useState<string>('connecting');

  // Fallback initial stations if API takes a second to answer
  const fallbackStations = [
    {
      id: 'sylhet-sadar',
      name: 'Sylhet Sadar',
      latitude: 24.8949,
      longitude: 91.8687,
      elevation_m: 20.0,
      river: 'Surma River',
      danger_level_m: 10.80
    },
    {
      id: 'sunamganj',
      name: 'Sunamganj Sadar',
      latitude: 25.0667,
      longitude: 91.4000,
      elevation_m: 11.0,
      river: 'Surma River (Haor Basin)',
      danger_level_m: 7.80
    },
    {
      id: 'kanaighat',
      name: 'Kanaighat',
      latitude: 25.0000,
      longitude: 92.2667,
      elevation_m: 23.0,
      river: 'Upper Surma River',
      danger_level_m: 12.75
    },
    {
      id: 'zakiganj',
      name: 'Zakiganj',
      latitude: 24.8833,
      longitude: 92.3667,
      elevation_m: 21.0,
      river: 'Kushiyara River (Sheola)',
      danger_level_m: 12.50
    }
  ];

  // Fetch initial health and locations
  useEffect(() => {
    async function init() {
      try {
        const healthRes = await fetch('/api/health');
        if (healthRes.ok) {
          const hData = await healthRes.json();
          setApiStatus(hData.status || 'healthy');
        } else {
          setApiStatus('degraded');
        }

        const locRes = await fetch('/api/locations');
        if (locRes.ok) {
          const locData = await locRes.json();
          setLocations(locData);
        } else {
          setLocations(fallbackStations);
        }
      } catch (err) {
        console.warn('API connection offline; using fallback stations', err);
        setApiStatus('offline');
        setLocations(fallbackStations);
      }
    }
    init();
  }, []);

  // Fetch risk report and observations whenever selectedLocationId changes
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Fetch risk report
        const riskRes = await fetch(`/api/risk?location_id=${selectedLocationId}`);
        if (riskRes.ok) {
          const rData = await riskRes.json();
          setReport(rData);
        }

        // Fetch observations
        const obsRes = await fetch(`/api/observations?location_id=${selectedLocationId}&limit=30`);
        if (obsRes.ok) {
          const oData = await obsRes.json();
          setObservations(oData.observations || []);
        }
      } catch (err) {
        console.error('Error fetching station data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedLocationId]);

  const activeStations = locations.length > 0 ? locations : fallbackStations;
  const currentStation = activeStations.find((s) => s.id === selectedLocationId) || activeStations[0];

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 flex flex-col">
      <Navbar apiStatus={apiStatus} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6 flex-1">
        {/* Persistent Prototype Disclaimer */}
        <PrototypeNotice />

        {/* Primary Risk Overview & Station Tabs */}
        <RiskOverview
          report={report}
          stations={activeStations}
          selectedStationId={selectedLocationId}
          onSelectStation={setSelectedLocationId}
          loading={loading}
        />

        {/* Interactive Geographical Map & Precipitation Observation Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <SylhetMap
            stations={activeStations}
            selectedStationId={selectedLocationId}
            onSelectStation={setSelectedLocationId}
            currentRiskLevel={report?.risk_level}
          />
          <ObservationChart
            observations={observations}
            locationName={currentStation?.name || 'Sylhet Station'}
          />
        </div>

        {/* Blockchain Cryptographic Provenance Section */}
        <ProvenanceSection
          report={report}
          onRefresh={() => setSelectedLocationId(selectedLocationId)}
        />

        {/* Scientific Methodology & Ethical Disclosure */}
        <MethodologySection />
      </main>

      <footer className="border-t border-gray-800 bg-[#0B0F19] py-6 text-center text-xs text-gray-500">
        <p>
          ClimateChain BD — Developed for IEEE ClimateChain Global Hackathon (Climate Data & Environmental Monitoring).
        </p>
        <p className="mt-1">
          Surma River Basin, Sylhet Division, Bangladesh. Open Data & Open Source.
        </p>
      </footer>
    </div>
  );
}
