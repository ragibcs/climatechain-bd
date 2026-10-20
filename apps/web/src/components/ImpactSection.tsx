'use client';

import React from 'react';
import {
  ArrowUpRight,
  BadgeCheck,
  Building2,
  Coins,
  HeartHandshake,
  Layers,
  LineChart,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react';
import SectionHeader from './ui/SectionHeader';

const useCases = [
  {
    icon: Coins,
    title: 'Parametric climate insurance',
    detail:
      'A rainfall threshold can trigger a payout while the canonical event report remains independently auditable — reducing dispute friction after a disaster.',
    tag: 'Payout integrity',
  },
  {
    icon: HeartHandshake,
    title: 'Relief & grant accountability',
    detail:
      'Donors and auditors can verify that the rainfall snapshot behind a needs assessment was not quietly rewritten before funds were released.',
    tag: 'Audit trail',
  },
  {
    icon: Building2,
    title: 'Civic planning & research',
    detail:
      'Planners get a transparent, reproducible rainfall-risk baseline for the haor belt, with limitations and data lineage exposed instead of hidden.',
    tag: 'Open baseline',
  },
];

const judging = [
  {
    label: 'Climate relevance',
    value: 'Surma–Kushiyara flash-flood corridor',
    detail: 'Station-level risk for Sylhet Sadar, Sunamganj, Kanaighat and Zakiganj.',
    icon: Layers,
  },
  {
    label: 'Data credibility',
    value: 'Real ECMWF / ERA5 rainfall',
    detail: 'Open-Meteo ingestion with committed SHA-256 manifests and integrity re-checks.',
    icon: BadgeCheck,
  },
  {
    label: 'Technical novelty',
    value: 'Verifiable provenance layer',
    detail: 'Canonical JSON + domain-separated hashing + EVM commitment + five-state verification.',
    icon: ShieldCheck,
  },
  {
    label: 'Demo quality',
    value: 'One-click tamper simulation',
    detail: 'Judges can see a report flip from VERIFIED to MISMATCH in seconds.',
    icon: Sparkles,
  },
];

export default function ImpactSection() {
  return (
    <section className="panel overflow-hidden">
      <div className="p-5 sm:p-6">
        <SectionHeader
          icon={HeartHandshake}
          eyebrow="Why it matters"
          title="From open rainfall data to trusted climate action"
          description="The same verifiable primitive can support insurance, relief accountability, and long-horizon adaptation planning."
          action={
            <a
              href="https://github.com/ragibcs/climatechain-bd"
              target="_blank"
              rel="noopener noreferrer"
              className="button-secondary hidden sm:inline-flex"
            >
              Explore the repository
              <ArrowUpRight className="h-4 w-4" />
            </a>
          }
        />

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {useCases.map((useCase) => (
            <div
              key={useCase.title}
              className="group rounded-xl border border-climate-border/70 bg-[#091120]/80 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-cyan-400/25 hover:bg-[#0B1628]"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                  <useCase.icon className="h-4 w-4" />
                </span>
                <span className="chip border-slate-500/20 bg-white/[0.03] text-slate-400">
                  {useCase.tag}
                </span>
              </div>
              <p className="mt-3 text-xs font-semibold text-white">{useCase.title}</p>
              <p className="mt-1.5 text-[10px] leading-relaxed text-slate-400">{useCase.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-xl border border-climate-border/70 bg-[#091120]/80 p-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-300" />
              <p className="text-xs font-semibold text-white">Built to be judged — and re-run</p>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {judging.map((item) => (
                <div key={item.label} className="rounded-lg border border-climate-border/60 bg-white/[0.02] p-3">
                  <div className="flex items-center gap-1.5">
                    <item.icon className="h-3 w-3 text-cyan-300" />
                    <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                      {item.label}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11px] font-semibold text-white">{item.value}</p>
                  <p className="mt-1 text-[9px] leading-relaxed text-slate-500">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.04] p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-300" />
                <p className="text-xs font-semibold text-white">Designed for non-experts</p>
              </div>
              <p className="mt-1.5 text-[10px] leading-relaxed text-slate-400">
                Plain-language summaries, explicit limitations, and no black-box claims. A
                journalist, relief coordinator, or judge can follow the evidence chain without
                reading Solidity.
              </p>
            </div>
            <div className="rounded-xl border border-climate-border/70 bg-[#091120]/80 p-4">
              <div className="flex items-center gap-2">
                <LineChart className="h-4 w-4 text-cyan-300" />
                <p className="text-xs font-semibold text-white">Scalable next steps</p>
              </div>
              <div className="mt-2 space-y-1.5 text-[10px] text-slate-400">
                <div className="flex items-center justify-between gap-2">
                  <span>FFWC / BWDB gauge adapter</span>
                  <span className="chip border-cyan-400/20 bg-cyan-400/5 text-cyan-300">Q1</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span>IPFS-pinned report payloads</span>
                  <span className="chip border-slate-500/20 bg-white/[0.03] text-slate-400">Q2</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span>Parametric trigger contract</span>
                  <span className="chip border-slate-500/20 bg-white/[0.03] text-slate-400">R&amp;D</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
