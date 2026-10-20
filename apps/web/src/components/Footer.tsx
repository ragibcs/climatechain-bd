import React from 'react';
import { Github, Heart, ShieldCheck, Waves } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-climate-border/60 bg-[#050912]/80">
      <div className="shell py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-md">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-cyan-500 to-teal-400">
                <Waves className="h-4 w-4 text-slate-950" />
              </span>
              <span className="text-sm font-bold text-white">
                ClimateChain <span className="text-cyan-300">BD</span>
              </span>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
              Transparent rainfall risk intelligence with independently verifiable EVM
              provenance for the Surma–Kushiyara basin, Sylhet Division, Bangladesh.
            </p>
            <p className="mt-2 flex items-center gap-1 text-[10px] text-slate-600">
              <Heart className="h-3 w-3 text-rose-400/70" />
              IEEE ClimateChain Global Hackathon · Climate Data &amp; Environmental Monitoring
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-10 gap-y-2 text-[10px] sm:grid-cols-3">
            <div className="space-y-1.5">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">Product</p>
              <a href="#overview" className="block text-slate-400 transition hover:text-cyan-300">Risk overview</a>
              <a href="#stations" className="block text-slate-400 transition hover:text-cyan-300">Stations</a>
              <a href="#forecast" className="block text-slate-400 transition hover:text-cyan-300">Forecast</a>
            </div>
            <div className="space-y-1.5">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">Trust</p>
              <a href="#provenance" className="block text-slate-400 transition hover:text-cyan-300">Provenance</a>
              <a href="#methodology" className="block text-slate-400 transition hover:text-cyan-300">Methodology</a>
              <a
                href="/api/datasets"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-slate-400 transition hover:text-cyan-300"
              >
                Dataset manifests
              </a>
            </div>
            <div className="space-y-1.5">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">Project</p>
              <a
                href="https://github.com/ragibcs/climatechain-bd"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-slate-400 transition hover:text-cyan-300"
              >
                <Github className="h-3 w-3" />
                GitHub
              </a>
              <a
                href="/api/health"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-slate-400 transition hover:text-cyan-300"
              >
                <ShieldCheck className="h-3 w-3" />
                API health
              </a>
              <a
                href="https://ffwc.gov.bd/"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-slate-400 transition hover:text-cyan-300"
              >
                FFWC advisories
              </a>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 border-t border-climate-border/50 pt-4 text-[9px] text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Research prototype · not an official flood warning system · MIT licence
          </p>
          <p className="font-mono">SRRI v1 · ClimateProvenance.sol · Sepolia 11155111</p>
        </div>
      </div>
    </footer>
  );
}
