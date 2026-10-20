'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  CloudRain,
  Code2,
  Database,
  ExternalLink,
  FileCheck2,
  FlaskConical,
  Gauge,
  Info,
  Link2,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Sigma,
  Workflow,
} from 'lucide-react';
import type { DatasetResponse } from '@/lib/types';
import { formatDate, shortHash } from '@/lib/risk';
import CopyButton from './ui/CopyButton';
import SectionHeader from './ui/SectionHeader';

interface MethodologySectionProps {
  datasets: DatasetResponse | null;
}

type Tab = 'data' | 'model' | 'provenance' | 'ethics';

const tabs: Array<{ key: Tab; label: string; icon: React.ElementType }> = [
  { key: 'data', label: 'Data pipeline', icon: Database },
  { key: 'model', label: 'SRRI model', icon: Sigma },
  { key: 'provenance', label: 'Provenance protocol', icon: Link2 },
  { key: 'ethics', label: 'Limits & ethics', icon: Scale },
];

const weights = [
  {
    name: '24h precipitation',
    weight: '50%',
    saturation: '100 mm',
    rationale: 'Cloudburst and acute flash-flood potential (BMD Heavy >44 mm, Very Heavy >88 mm).',
    color: 'from-sky-400 to-cyan-500',
  },
  {
    name: '3-day cumulative',
    weight: '30%',
    saturation: '200 mm',
    rationale: 'Surma catchment inflow, urban drainage congestion, and upstream runoff.',
    color: 'from-amber-400 to-orange-500',
  },
  {
    name: '7-day cumulative',
    weight: '20%',
    saturation: '350 mm',
    rationale: 'Antecedent haor wetland storage and regional saturation headroom.',
    color: 'from-purple-400 to-fuchsia-500',
  },
];

const bmd = [
  { label: 'Light', range: '1–10 mm', tone: 'text-emerald-300' },
  { label: 'Moderate', range: '11–22 mm', tone: 'text-cyan-300' },
  { label: 'Moderately heavy', range: '23–43 mm', tone: 'text-yellow-300' },
  { label: 'Heavy', range: '44–88 mm', tone: 'text-orange-300' },
  { label: 'Very heavy', range: '> 88 mm', tone: 'text-rose-300' },
];

const verificationStates = [
  { state: 'VERIFIED', meaning: 'Computed hash matches the committed hash exactly.', tone: 'text-emerald-300' },
  { state: 'MISMATCH', meaning: 'Payload altered; computed hash differs from the commitment.', tone: 'text-rose-300' },
  { state: 'NOT_FOUND', meaning: 'No commitment exists for the deterministic report ID.', tone: 'text-amber-300' },
  { state: 'UNAVAILABLE', meaning: 'RPC unavailable; the API refuses to guess a verdict.', tone: 'text-slate-300' },
  { state: 'PENDING', meaning: 'Transaction submitted but not yet confirmed.', tone: 'text-cyan-300' },
];

export default function MethodologySection({ datasets }: MethodologySectionProps) {
  const [tab, setTab] = useState<Tab>('data');
  const verified = datasets?.integrity_verified_count ?? 0;
  const total = datasets?.dataset_count ?? 0;

  return (
    <section id="methodology" className="panel overflow-hidden">
      <div className="p-5 sm:p-6">
        <SectionHeader
          icon={BookOpen}
          eyebrow="Scientific methodology"
          title="Transparent by construction"
          description="The data lineage, formula, assumptions, and ethical boundaries behind every SRRI score."
          action={
            <a
              href="https://github.com/ragibcs/climatechain-bd/tree/main/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="button-secondary hidden sm:inline-flex"
            >
              <FileCheck2 className="h-4 w-4" />
              Full docs
            </a>
          }
        />

        <div className="mt-4 flex gap-1 overflow-x-auto rounded-lg border border-climate-border/70 bg-[#091120] p-1">
          {tabs.map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-[10px] font-semibold transition ${
                tab === item.key
                  ? 'bg-cyan-400/15 text-cyan-300 ring-1 ring-cyan-400/20'
                  : 'text-slate-400 hover:text-white'
              }`}
              aria-pressed={tab === item.key}
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {tab === 'data' && (
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-3">
                <InfoCard
                  icon={CloudRain}
                  title="Open, reproducible rainfall data"
                  tone="cyan"
                >
                  Daily precipitation is fetched from Open-Meteo&apos;s ECMWF/ERA5 reanalysis
                  archive and high-resolution forecast API for four Sylhet stations. No API key,
                  no scraping, no synthetic flood masks.
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {['ERA5 reanalysis', 'ECMWF NWP', 'CC BY 4.0', 'Open-Meteo'].map((tag) => (
                      <span key={tag} className="chip border-cyan-400/20 bg-cyan-400/5 text-cyan-300/90">
                        {tag}
                      </span>
                    ))}
                  </div>
                </InfoCard>

                <div className="rounded-xl border border-climate-border/70 bg-[#091120]/80 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-cyan-300" />
                      <p className="text-xs font-semibold text-white">Committed dataset manifests</p>
                    </div>
                    <span
                      className={`chip ${
                        total > 0 && verified === total
                          ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300'
                          : 'border-amber-400/25 bg-amber-400/10 text-amber-300'
                      }`}
                    >
                      <ShieldCheck className="h-3 w-3" />
                      {verified}/{total} integrity checks
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5">
                    {(datasets?.datasets ?? []).map((dataset) => (
                      <div
                        key={dataset.location_id}
                        className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-climate-border/60 bg-white/[0.02] px-3 py-2 text-[10px]"
                      >
                        <span className="flex items-center gap-1.5 font-medium text-slate-200">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              dataset.integrity_verified ? 'bg-emerald-400' : 'bg-amber-400'
                            }`}
                          />
                          {dataset.location_id}
                        </span>
                        <span className="text-slate-500">
                          {dataset.record_count ?? '—'} records ·{' '}
                          {dataset.coverage?.start ? formatDate(dataset.coverage.start, { year: undefined }) : '—'} –{' '}
                          {dataset.coverage?.end ? formatDate(dataset.coverage.end, { year: undefined }) : '—'}
                        </span>
                        <span className="ml-auto flex items-center gap-1 font-mono text-slate-500">
                          {shortHash(dataset.sha256, 8, 6)}
                          <CopyButton value={dataset.sha256} label="" />
                        </span>
                      </div>
                    ))}
                    {(!datasets || datasets.datasets.length === 0) && (
                      <p className="rounded-lg border border-dashed border-climate-border/70 px-3 py-4 text-center text-[10px] text-slate-500">
                        Manifest metadata unavailable. The API will surface these when reachable.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <InfoCard icon={Workflow} title="Pipeline guarantees" tone="emerald">
                  <ul className="mt-2 space-y-1.5">
                    {[
                      'Chronological sorting + duplicate-date removal',
                      'Range checks: negative and >500 mm flagged',
                      'Trailing 3d/7d windows reference past records only',
                      'Seed ingest writes a sample + SHA-256 manifest; API reads never rewrite it',
                      'Nullable river levels and flood labels — never fabricated',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-1.5 text-[10px] text-slate-400">
                        <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </InfoCard>

                <InfoCard icon={FlaskConical} title="What this is not" tone="amber">
                  No flood extent labels, no river gauge values, and no official warning status are
                  invented. Where a verified open source is missing, the field stays <code className="text-amber-200">null</code>{' '}
                  and the limitation is disclosed at the API and UI layers.
                </InfoCard>
              </div>
            </div>
          )}

          {tab === 'model' && (
            <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-3">
                <div className="rounded-xl border border-climate-border/70 bg-[#091120]/80 p-4">
                  <div className="flex items-center gap-2">
                    <Sigma className="h-4 w-4 text-cyan-300" />
                    <p className="text-xs font-semibold text-white">Sylhet Rainfall Risk Index (SRRI)</p>
                    <span className="chip border-slate-500/20 bg-white/[0.03] text-slate-400">v1</span>
                  </div>
                  <div className="mt-3 rounded-lg border border-cyan-400/15 bg-[#050A12] p-3 font-mono text-[10px] leading-relaxed text-cyan-200/90">
                    SRRI = 0.50·min(100, R₁d/100·100)
                    <br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ 0.30·min(100, R₃d/200·100)
                    <br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ 0.20·min(100, R₇d/350·100)
                  </div>
                  <div className="mt-3 space-y-2.5">
                    {weights.map((item) => (
                      <div key={item.name}>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-medium text-slate-300">{item.name}</span>
                          <span className="font-mono text-slate-500">
                            {item.weight} · sat. {item.saturation}
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/5">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${item.color}`}
                            style={{ width: item.weight }}
                          />
                        </div>
                        <p className="mt-1 text-[9px] text-slate-500">{item.rationale}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { label: 'LOW', range: '0–24', tone: 'text-emerald-300', detail: 'Minimal stress' },
                    { label: 'MODERATE', range: '25–49', tone: 'text-yellow-300', detail: 'Localized waterlogging' },
                    { label: 'HIGH', range: '50–74', tone: 'text-orange-300', detail: 'Overflow risk' },
                    { label: 'SEVERE', range: '75–100', tone: 'text-rose-300', detail: 'Flash-flood indicator' },
                  ].map((item) => (
                    <div key={item.label} className="card-inset p-2.5">
                      <p className={`text-[10px] font-bold ${item.tone}`}>{item.label}</p>
                      <p className="mt-0.5 font-mono text-[10px] text-slate-400">{item.range}</p>
                      <p className="mt-1 text-[9px] leading-tight text-slate-600">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-climate-border/70 bg-[#091120]/80 p-4">
                  <div className="flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-amber-300" />
                    <p className="text-xs font-semibold text-white">BMD rainfall calibration</p>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {bmd.map((row) => (
                      <div
                        key={row.label}
                        className="flex items-center justify-between rounded-md border border-climate-border/50 bg-white/[0.02] px-2.5 py-1.5 text-[10px]"
                      >
                        <span className="text-slate-400">{row.label}</span>
                        <span className={`font-mono font-semibold ${row.tone}`}>{row.range}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-[9px] leading-relaxed text-slate-600">
                    Thresholds are rainfall intensity classes, not calibrated flood probabilities.
                  </p>
                </div>

                <InfoCard icon={Info} title="Why rule-based?" tone="cyan">
                  With no verified machine-readable flood ground truth, a transparent rule-based
                  index is more defensible than a black-box classifier trained on fabricated labels.
                  Every factor and contribution is exposed to the user.
                </InfoCard>
              </div>
            </div>
          )}

          {tab === 'provenance' && (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                <div className="rounded-xl border border-climate-border/70 bg-[#091120]/80 p-4">
                  <div className="flex items-center gap-2">
                    <Code2 className="h-4 w-4 text-emerald-300" />
                    <p className="text-xs font-semibold text-white">Canonicalization rules</p>
                  </div>
                  <ul className="mt-3 space-y-1.5">
                    {[
                      'Recursively sort object keys',
                      'Normalize floats to 4 decimal places',
                      'Compact UTF-8 JSON with no whitespace',
                      'Prefix with a domain-separation tag',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-1.5 text-[10px] text-slate-400">
                        <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 rounded-lg border border-emerald-400/15 bg-[#050A12] p-3 font-mono text-[9px] leading-relaxed text-emerald-200/80">
                    CLIMATECHAIN_BD_PREDICTION_REPORT_V1:
                    <br />
                    {'{"as_of":"2024-06-19","location_id":"sylhet-sadar",…}'}
                    <br />
                    → sha256 → 0x…
                  </div>
                </div>

                <InfoCard icon={Database} title="On-chain record" tone="emerald">
                  <div className="mt-2 grid grid-cols-2 gap-2 text-[9px]">
                    {[
                      ['reportId', 'bytes32'],
                      ['dataHash', 'bytes32'],
                      ['reportHash', 'bytes32'],
                      ['modelVersion', 'string'],
                      ['metadataUri', 'string'],
                      ['registeredAt', 'uint256'],
                      ['submitter', 'address'],
                    ].map(([field, type]) => (
                      <div key={field} className="rounded border border-climate-border/50 bg-white/[0.02] px-2 py-1.5">
                        <p className="font-mono text-slate-300">{field}</p>
                        <p className="text-slate-600">{type}</p>
                      </div>
                    ))}
                  </div>
                </InfoCard>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-climate-border/70 bg-[#091120]/80 p-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-cyan-300" />
                    <p className="text-xs font-semibold text-white">Five-state verification engine</p>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {verificationStates.map((item) => (
                      <div
                        key={item.state}
                        className="rounded-md border border-climate-border/50 bg-white/[0.02] px-2.5 py-2"
                      >
                        <p className={`font-mono text-[10px] font-semibold ${item.tone}`}>{item.state}</p>
                        <p className="mt-0.5 text-[9px] leading-relaxed text-slate-500">{item.meaning}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <InfoCard icon={ShieldAlert} title="Failure honesty" tone="amber">
                  If the RPC is unavailable, verification returns <code className="text-amber-200">UNAVAILABLE</code> — never a false
                  <code className="text-emerald-200"> VERIFIED</code>. Duplicate report IDs and zero hashes revert on-chain.
                </InfoCard>

                <a
                  href="https://sepolia.etherscan.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl border border-climate-border/70 bg-white/[0.02] px-3 py-2.5 text-[10px] text-slate-400 transition hover:border-cyan-400/30 hover:text-white"
                >
                  <span className="flex items-center gap-2">
                    <ExternalLink className="h-3.5 w-3.5 text-cyan-300" />
                    Inspect Sepolia testnet
                  </span>
                  <span className="font-mono text-slate-600">chain 11155111</span>
                </a>
              </div>
            </div>
          )}

          {tab === 'ethics' && (
            <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
              <div className="space-y-3">
                <InfoCard icon={ShieldAlert} title="Research prototype — not an official warning" tone="amber">
                  ClimateChain BD is an academic proof-of-concept for the IEEE ClimateChain Global
                  Hackathon. It is <strong>not</strong> an official flood forecasting or evacuation
                  system. For life-safety decisions, consult FFWC and BMD advisories.
                </InfoCard>
                <InfoCard icon={Info} title="No fabricated ground truth" tone="cyan">
                  Machine-readable daily flood extent polygons and real-time BWDB gauge APIs were
                  not available as open REST services. Rather than invent flood labels, the project
                  implements a clearly-labelled rainfall-risk indicator.
                </InfoCard>
                <InfoCard icon={Scale} title="Model limits" tone="rose">
                  SRRI does not model upstream dam releases (e.g. Barak basin), river siltation,
                  embankment breaches, tidal backwater, or local drainage capacity. It is an
                  empirical meteorological indicator, not a calibrated probability.
                </InfoCard>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-climate-border/70 bg-[#091120]/80 p-4">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="h-4 w-4 text-emerald-300" />
                    <p className="text-xs font-semibold text-white">What a winning submission gets right</p>
                  </div>
                  <ul className="mt-3 space-y-2">
                    {[
                      ['Real data lineage', 'Open ECMWF/ERA5 rainfall data with SHA-256 manifests.'],
                      ['Defensible target', 'Rainfall risk instead of fake flood labels.'],
                      ['Independent verifiability', 'Anyone can recompute and compare hashes.'],
                      ['Graceful failure', 'UNAVAILABLE / PENDING are explicit states.'],
                      ['Reproducibility', 'Makefile, Docker, tests, and sample snapshots.'],
                    ].map(([title, detail]) => (
                      <li key={title} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                        <span>
                          <span className="block text-[10px] font-semibold text-slate-200">{title}</span>
                          <span className="block text-[9px] leading-relaxed text-slate-500">{detail}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-climate-border/70 bg-[#091120]/80 p-4">
                  <p className="text-xs font-semibold text-white">Future roadmap</p>
                  <div className="mt-2 space-y-2 text-[10px] text-slate-400">
                    <RoadmapItem label="FFWC / BWDB gauge adapter" status="Next" />
                    <RoadmapItem label="IPFS-pinned full report payloads" status="Planned" />
                    <RoadmapItem label="Multi-station basin hydrodynamic features" status="Research" />
                    <RoadmapItem label="Parametric trigger smart contract" status="Research" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-climate-border/60 bg-white/[0.015] px-5 py-3 text-[9px] text-slate-500 sm:px-6">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="h-3 w-3 text-emerald-400" />
          Open source · MIT licence · reproducible by design
        </span>
        <span className="flex items-center gap-1.5">
          <CloudRain className="h-3 w-3" />
          BMD-calibrated rainfall semantics · SRRI v1
        </span>
      </div>
    </section>
  );
}

function InfoCard({
  icon: Icon,
  title,
  tone,
  children,
}: {
  icon: React.ElementType;
  title: string;
  tone: 'cyan' | 'emerald' | 'amber' | 'rose';
  children: React.ReactNode;
}) {
  const styles = {
    cyan: 'border-cyan-400/20 bg-cyan-400/[0.04] text-cyan-300',
    emerald: 'border-emerald-400/20 bg-emerald-400/[0.04] text-emerald-300',
    amber: 'border-amber-400/20 bg-amber-400/[0.04] text-amber-300',
    rose: 'border-rose-400/20 bg-rose-400/[0.04] text-rose-300',
  }[tone];
  return (
    <div className={`rounded-xl border p-4 ${styles}`}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <p className="text-[11px] font-semibold text-white">{title}</p>
      </div>
      <div className="mt-2 text-[10px] leading-relaxed text-slate-400">{children}</div>
    </div>
  );
}

function RoadmapItem({ label, status }: { label: string; status: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-climate-border/50 bg-white/[0.02] px-2.5 py-1.5">
      <span>{label}</span>
      <span className="chip border-slate-500/20 bg-white/[0.03] text-slate-400">{status}</span>
    </div>
  );
}
