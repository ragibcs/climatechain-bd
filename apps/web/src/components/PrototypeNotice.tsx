'use client';

import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export default function PrototypeNotice() {
  return (
    <div className="w-full bg-amber-950/40 border border-amber-600/40 rounded-xl p-4 my-4 flex items-start gap-3 shadow-md">
      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
      <div className="space-y-1 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-amber-200 uppercase tracking-wider text-[11px]">
            IEEE Hackathon Research Prototype — Non-Official System
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-900/60 text-amber-300 border border-amber-700/50">
            Sylhet Division Scope
          </span>
        </div>
        <p className="text-gray-300 leading-relaxed">
          This platform demonstrates <strong>AI-assisted meteorological rainfall risk indexing combined with cryptographic blockchain provenance registration</strong>. It is <strong>NOT</strong> an official flood forecasting or evacuation warning system. Ground-truth flood extent labels were unverified in open public APIs; risk metrics represent empirical precipitation indicators calibrated to Bangladesh Meteorological Department (BMD) thresholds rather than validated hydrological flood probabilities. For official flood alerts and river level bulletins, consult the{' '}
          <a
            href="https://ffwc.gov.bd/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-400 underline hover:text-sky-300"
          >
            Flood Forecasting and Warning Centre (FFWC)
          </a>{' '}
          and the Bangladesh Meteorological Department.
        </p>
      </div>
    </div>
  );
}
