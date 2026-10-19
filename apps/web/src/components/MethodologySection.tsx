'use client';

import React from 'react';
import { BookOpen, ShieldAlert, Cpu, Network, CheckCircle } from 'lucide-react';

export default function MethodologySection() {
  return (
    <div className="bg-[#111827] border border-gray-800 rounded-xl p-5 shadow-lg space-y-5">
      <div className="pb-3 border-b border-gray-800">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-sky-400" />
          Scientific Methodology, Sourcing & Honest Disclaimers
        </h3>
        <p className="text-xs text-gray-400">
          Transparent technical disclosure for the IEEE ClimateChain Global Hackathon
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {/* Box 1: Data Sourcing */}
        <div className="bg-[#0B0F19] p-4 rounded-lg border border-gray-800 space-y-2">
          <div className="font-semibold text-sky-300 flex items-center gap-1.5">
            <Cpu className="w-4 h-4" /> 1. Climate Observation Sourcing
          </div>
          <p className="text-gray-300 leading-relaxed">
            Observations are sourced from ECMWF / ERA5 reanalysis and high-resolution numerical weather prediction via the Open-Meteo API. Data includes 24h daily precipitation sums (mm) for coordinates across Sylhet Sadar, Sunamganj, Kanaighat, and Zakiganj.
          </p>
          <div className="text-[11px] text-gray-400 font-mono pt-1">
            Licence: CC BY 4.0 / ODbL Open Database
          </div>
        </div>

        {/* Box 2: Target Decision */}
        <div className="bg-[#0B0F19] p-4 rounded-lg border border-gray-800 space-y-2">
          <div className="font-semibold text-amber-300 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4" /> 2. Target Gate & No Fabricated Data
          </div>
          <p className="text-gray-300 leading-relaxed">
            Verified machine-readable flood extent ground truth is not published as an open REST API by BWDB/FFWC. Following the core safety rule in <code className="text-amber-200">CLAUDE.md</code>, we implement a transparent <strong>Rainfall Risk Indicator (SRRI)</strong> rather than fabricating artificial flood classification labels.
          </p>
          <div className="text-[11px] text-gray-400 font-mono pt-1">
            Strictly past-only rolling windows
          </div>
        </div>

        {/* Box 3: Blockchain Provenance */}
        <div className="bg-[#0B0F19] p-4 rounded-lg border border-gray-800 space-y-2">
          <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
            <Network className="w-4 h-4" /> 3. Cryptographic Provenance
          </div>
          <p className="text-gray-300 leading-relaxed">
            Report content is normalized into canonical deterministic JSON and hashed using domain-separated SHA-256 into a <code className="text-emerald-200">bytes32</code> commitment registered on the EVM <code className="text-emerald-200">ClimateProvenance</code> smart contract. A single altered byte triggers an immediate <code className="text-rose-300 font-semibold">MISMATCH</code>.
          </p>
          <div className="text-[11px] text-gray-400 font-mono pt-1">
            Contract: ClimateProvenance.sol
          </div>
        </div>
      </div>
    </div>
  );
}
