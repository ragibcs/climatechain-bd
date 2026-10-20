'use client';

import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ExternalLink, ShieldCheck } from 'lucide-react';

export default function PrototypeNotice() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="panel border-amber-400/25 bg-amber-500/[0.04] p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-400/25 bg-amber-400/10 text-amber-300">
          <AlertTriangle className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-200">
              Research prototype · not an official warning system
            </p>
            <span className="chip border-amber-400/25 bg-amber-400/10 text-amber-300">
              <ShieldCheck className="h-3 w-3" />
              Sylhet Division scope
            </span>
            <button
              onClick={() => setExpanded((value) => !value)}
              className="ml-auto inline-flex items-center gap-1 text-[10px] font-medium text-amber-300/80 transition hover:text-amber-200"
              aria-expanded={expanded}
            >
              {expanded ? 'Less' : 'Read disclosure'}
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
              />
            </button>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
            SRRI is an empirical meteorological rainfall-risk indicator calibrated to BMD
            thresholds — <strong className="text-slate-300">not</strong> a validated
            hydrological flood probability. Machine-readable flood ground truth was unavailable,
            so no flood labels were fabricated.
          </p>
          {expanded && (
            <div className="mt-3 space-y-2 border-t border-amber-400/15 pt-3 text-[11px] leading-relaxed text-slate-400">
              <p>
                This platform demonstrates transparent, data-driven rainfall risk indexing
                combined with cryptographic blockchain provenance for the IEEE ClimateChain
                Global Hackathon.
                River gauge levels and flood extent labels remain <em>null</em> where no open,
                verifiable source exists.
              </p>
              <p>
                For life-safety advisories consult the{' '}
                <a
                  href="https://ffwc.gov.bd/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-cyan-300 underline decoration-cyan-400/40 hover:text-cyan-200"
                >
                  Flood Forecasting and Warning Centre (FFWC)
                  <ExternalLink className="h-3 w-3" />
                </a>{' '}
                and the Bangladesh Meteorological Department (BMD).
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
