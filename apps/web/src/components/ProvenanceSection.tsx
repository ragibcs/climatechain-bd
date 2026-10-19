'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Database,
  Link as LinkIcon,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCw,
  ExternalLink,
  Edit3
} from 'lucide-react';

interface ProvenanceSectionProps {
  report: any;
  onRefresh?: () => void;
}

export default function ProvenanceSection({ report, onRefresh }: ProvenanceSectionProps) {
  const [registering, setRegistering] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [registrationRecord, setRegistrationRecord] = useState<any>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isTampered, setIsTampered] = useState(false);
  const [tamperedScore, setTamperedScore] = useState<number>(0.0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!report) return;
    setRegistering(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/provenance/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Registration failed');
      }
      setRegistrationRecord(data.record);
      // Auto verify after registration
      await handleVerify(data.record);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error communicating with blockchain provider');
    } finally {
      setRegistering(false);
    }
  };

  const handleVerify = async (recordOverride?: any) => {
    if (!report) return;
    setVerifying(true);
    setErrorMsg(null);

    // Payload to verify: either authentic report or tampered test payload
    const payloadToVerify = { ...report };
    if (isTampered) {
      payloadToVerify.score = Number(tamperedScore);
      payloadToVerify.risk_level = 'LOW';
    }

    try {
      const res = await fetch('/api/provenance/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report: payloadToVerify })
      });
      const data = await res.json();
      setVerificationResult(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to verify provenance');
    } finally {
      setVerifying(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-4 h-4" /> VERIFIED (100% Byte Match)
          </span>
        );
      case 'MISMATCH':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <XCircle className="w-4 h-4" /> MISMATCH (Tampering Detected!)
          </span>
        );
      case 'NOT_FOUND':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Clock className="w-4 h-4" /> NOT REGISTERED ON-CHAIN
          </span>
        );
      case 'UNAVAILABLE':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-700/50 text-gray-300 border border-gray-600">
            <ShieldAlert className="w-4 h-4" /> RPC UNAVAILABLE
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-[#111827] border border-gray-800 rounded-xl p-5 shadow-lg space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-gray-800 gap-2">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            Blockchain Provenance & Report Integrity
          </h3>
          <p className="text-xs text-gray-400">
            Cryptographic commitment registered to EVM smart contract (ClimateProvenance.sol)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {verificationResult && getStatusBadge(verificationResult.status)}
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-950/40 border border-rose-800/60 text-rose-300 p-3 rounded-lg text-xs">
          {errorMsg}
        </div>
      )}

      {/* Provenance Metadata Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
        <div className="bg-[#0B0F19] p-3.5 rounded-lg border border-gray-800 space-y-1.5">
          <span className="text-gray-400 block text-[10px] uppercase tracking-wider font-sans">
            Deterministic Report ID (bytes32)
          </span>
          <div className="text-sky-300 break-all select-all">
            {report?.report_id || 'Generating...'}
          </div>
        </div>

        <div className="bg-[#0B0F19] p-3.5 rounded-lg border border-gray-800 space-y-1.5">
          <span className="text-gray-400 block text-[10px] uppercase tracking-wider font-sans">
            Target EVM Network
          </span>
          <div className="text-white flex items-center justify-between">
            <span>Sepolia Testnet (Chain ID: 11155111)</span>
            <span className="text-[10px] px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded">
              Active Registry
            </span>
          </div>
        </div>

        <div className="bg-[#0B0F19] p-3.5 rounded-lg border border-gray-800 space-y-1.5">
          <span className="text-gray-400 block text-[10px] uppercase tracking-wider font-sans">
            Off-chain Model Version
          </span>
          <div className="text-gray-200">
            {report?.model_version || 'rainfall-indicator-v1'}
          </div>
        </div>

        <div className="bg-[#0B0F19] p-3.5 rounded-lg border border-gray-800 space-y-1.5">
          <span className="text-gray-400 block text-[10px] uppercase tracking-wider font-sans">
            Transaction Hash / Receipt
          </span>
          <div className="text-amber-400 break-all select-all text-[11px]">
            {registrationRecord?.transaction_hash ||
              (verificationResult?.record?.transaction_hash ?? 'Not yet registered in this session')}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          onClick={handleRegister}
          disabled={registering}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-2 shadow-sm transition-colors"
        >
          {registering ? (
            <RotateCw className="w-4 h-4 animate-spin" />
          ) : (
            <Database className="w-4 h-4" />
          )}
          {registering ? 'Broadcasting Tx...' : 'Register Report On-Chain'}
        </button>

        <button
          onClick={() => handleVerify()}
          disabled={verifying}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-2 shadow-sm transition-colors"
        >
          {verifying ? (
            <RotateCw className="w-4 h-4 animate-spin" />
          ) : (
            <ShieldCheck className="w-4 h-4" />
          )}
          {verifying ? 'Checking Contract...' : 'Verify Report Hash'}
        </button>

        {/* Tamper Simulation Toggle */}
        <div className="flex items-center gap-2 ml-auto text-xs bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-lg">
          <Edit3 className="w-3.5 h-3.5 text-rose-400" />
          <label className="text-gray-300 cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={isTampered}
              onChange={(e) => {
                setIsTampered(e.target.checked);
                setVerificationResult(null);
              }}
              className="rounded bg-gray-800 border-gray-700 text-rose-500 focus:ring-rose-500"
            />
            <span>Simulate Report Tampering (Alters Score to 0)</span>
          </label>
        </div>
      </div>

      {/* Verification Output Details */}
      {verificationResult && (
        <div
          className={`p-4 rounded-lg border text-xs space-y-2 ${
            verificationResult.status === 'VERIFIED'
              ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
              : verificationResult.status === 'MISMATCH'
              ? 'bg-rose-950/20 border-rose-800/40 text-rose-200'
              : 'bg-gray-900 border-gray-800 text-gray-300'
          }`}
        >
          <div className="font-semibold flex items-center gap-2 text-sm">
            {verificationResult.status === 'VERIFIED' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            )}
            Verification Outcome: {verificationResult.status}
          </div>
          <p className="leading-relaxed">{verificationResult.reason}</p>
          {verificationResult.computed_hash && (
            <div className="font-mono text-[11px] pt-1 space-y-1">
              <div>Computed Local Hash: <span className="select-all text-sky-300">{verificationResult.computed_hash}</span></div>
              {verificationResult.onchain_hash && (
                <div>On-Chain Stored Hash: <span className="select-all text-emerald-300">{verificationResult.onchain_hash}</span></div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
