'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowRight,
  Binary,
  CheckCircle2,
  Clock,
  Database,
  Download,
  ExternalLink,
  FileCode2,
  Fingerprint,
  History,
  KeyRound,
  Link as LinkIcon,
  RotateCw,
  ShieldAlert,
  ShieldCheck,
  Sigma,
  Terminal,
  XCircle,
  Zap,
} from 'lucide-react';
import type {
  RegistrationRecord,
  RegistryResponse,
  RiskReport,
  VerificationResult,
} from '@/lib/types';
import { formatDateTime, relativeTime, shortHash } from '@/lib/risk';
import { registryModeLabel, registryModeTitle, registryModeTone } from '@/lib/registry';
import CopyButton from './ui/CopyButton';
import RiskBadge from './ui/RiskBadge';
import SectionHeader from './ui/SectionHeader';

interface ProvenanceSectionProps {
  report: RiskReport | null;
  onRefresh?: () => void;
  notify?: (toast: {
    title: string;
    description?: string;
    tone?: 'success' | 'error' | 'info';
  }) => void;
}

const STATUS_META: Record<
  string,
  {
    label: string;
    description: string;
    className: string;
    icon: React.ElementType;
  }
> = {
  VERIFIED: {
    label: 'VERIFIED',
    description: 'Computed hash matches the stored commitment byte-for-byte.',
    className: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300',
    icon: CheckCircle2,
  },
  MISMATCH: {
    label: 'MISMATCH',
    description: 'Tampering detected. The payload no longer matches the stored commitment.',
    className: 'border-rose-400/30 bg-rose-500/10 text-rose-300',
    icon: XCircle,
  },
  NOT_FOUND: {
    label: 'NOT_FOUND',
    description: 'No commitment exists for this report ID yet. Register it first.',
    className: 'border-amber-400/30 bg-amber-500/10 text-amber-300',
    icon: Clock,
  },
  UNAVAILABLE: {
    label: 'UNAVAILABLE',
    description: 'Registry/RPC unavailable. The system refuses to guess a verdict.',
    className: 'border-slate-400/30 bg-slate-500/10 text-slate-300',
    icon: ShieldAlert,
  },
  PENDING: {
    label: 'PENDING',
    description: 'Transaction submitted; awaiting confirmation.',
    className: 'border-cyan-400/30 bg-cyan-500/10 text-cyan-300',
    icon: RotateCw,
  },
};

export default function ProvenanceSection({ report, onRefresh, notify }: ProvenanceSectionProps) {
  const [registering, setRegistering] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [registrationRecord, setRegistrationRecord] = useState<RegistrationRecord | null>(null);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [tamperEnabled, setTamperEnabled] = useState(false);
  const [tamperField, setTamperField] = useState<'score' | 'rainfall' | 'summary'>('score');
  const [error, setError] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);
  const [registry, setRegistry] = useState<RegistrationRecord[]>([]);
  const [registryMode, setRegistryMode] = useState<string>('');
  const [registryLoading, setRegistryLoading] = useState(true);

  const isOnchain = registryMode === 'ONCHAIN';
  const registryTone = registryModeTone(registryMode);
  const registryChipLabel = !registryMode
    ? 'Checking registry…'
    : registryMode === 'ONCHAIN'
    ? 'Sepolia · 11155111'
    : registryMode === 'ONCHAIN_READ_ONLY'
    ? 'Sepolia read-only'
    : `${registryModeLabel(registryMode)} · local`;

  const loadRegistry = useCallback(async () => {
    try {
      const response = await fetch('/api/provenance/registry');
      if (!response.ok) throw new Error('Registry unavailable');
      const data: RegistryResponse = await response.json();
      setRegistry(data.records || []);
      setRegistryMode(data.mode || '');
    } catch {
      setRegistry([]);
      setRegistryMode('');
    } finally {
      setRegistryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRegistry();
  }, [loadRegistry]);

  useEffect(() => {
    setVerification(null);
    setRegistrationRecord(null);
  }, [report?.report_id]);

  const tamperedReport = useCallback((): RiskReport | null => {
    if (!report) return null;
    if (!tamperEnabled) return report;
    const altered: RiskReport = JSON.parse(JSON.stringify(report));
    if (tamperField === 'score') {
      altered.score = 0;
      altered.risk_level = 'LOW';
      altered.severity_label = 'Low Rainfall Risk';
    } else if (tamperField === 'rainfall') {
      altered.metrics.rainfall_1d_mm = 0;
      altered.metrics.rainfall_3d_mm = 0;
      altered.metrics.rainfall_7d_mm = 0;
      altered.score = 0;
      altered.risk_level = 'LOW';
    } else {
      altered.explanation.summary =
        'Tampered demo payload: rainfall severity has been quietly rewritten before an insurance claim.';
    }
    return altered;
  }, [report, tamperEnabled, tamperField]);

  const status = verification?.status;
  const meta = status ? STATUS_META[status] : null;
  const StatusIcon = meta?.icon;

  const handleRegister = async () => {
    if (!report) return;
    setRegistering(true);
    setError(null);
    try {
      const response = await fetch('/api/provenance/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report,
          metadata_uri: `urn:climatechain:report:${report.location_id}:${report.as_of}`,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Registration failed');
      setRegistrationRecord(data.record);
      setRegistryMode(data.record.mode || data.mode || '');
      const recordOnchain = data.record.mode === 'ONCHAIN';
      notify?.({
        title: recordOnchain ? 'On-chain commitment registered' : 'Commitment stored in simulator',
        description: recordOnchain
          ? `Report ${shortHash(data.record.report_id, 8, 6)} committed at block ${data.record.block_number}.`
          : `Report ${shortHash(data.record.report_id, 8, 6)} stored in the labelled local simulator.`,
        tone: 'success',
      });
      await loadRegistry();
      await handleVerify(data.record, false);
    } catch (err: any) {
      const message = err?.message || 'Error communicating with the provenance registry';
      setError(message);
      notify?.({ title: 'Registration failed', description: message, tone: 'error' });
    } finally {
      setRegistering(false);
    }
  };

  const handleVerify = async (recordOverride?: RegistrationRecord | null, clearFirst = true) => {
    if (!report) return;
    if (clearFirst) setVerification(null);
    setVerifying(true);
    setError(null);

    const payload = tamperedReport();
    try {
      const response = await fetch('/api/provenance/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report: payload }),
      });
      const data: VerificationResult = await response.json();
      if (!response.ok) throw new Error((data as any).detail || 'Verification failed');
      setVerification(data);
      if (recordOverride) setRegistrationRecord(recordOverride);
      if (data.status === 'VERIFIED') {
        notify?.({
          title: 'Integrity verified',
          description: 'Canonical hash matches the registry commitment exactly.',
          tone: 'success',
        });
      } else if (data.status === 'MISMATCH') {
        notify?.({
          title: 'Tampering detected',
          description: 'The computed hash no longer matches the stored commitment.',
          tone: 'error',
        });
      } else if (data.status === 'NOT_FOUND') {
        notify?.({
          title: 'No commitment found',
          description: 'Register this report before running verification.',
          tone: 'info',
        });
      }
    } catch (err: any) {
      const message = err?.message || 'Failed to verify provenance';
      setError(message);
      notify?.({ title: 'Verification error', description: message, tone: 'error' });
    } finally {
      setVerifying(false);
    }
  };

  const downloadReport = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `climatechain-${report.location_id}-${report.as_of}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    notify?.({ title: 'Report downloaded', description: 'JSON payload exported for independent audit.', tone: 'info' });
  };

  return (
    <section id="provenance" className="panel overflow-hidden">
      <div className="p-5 sm:p-6">
        <SectionHeader
          icon={ShieldCheck}
          eyebrow="Trust layer"
          title="Blockchain provenance & tamper evidence"
          description="Canonical JSON → domain-separated SHA-256 → EVM-ready commitment. Change one byte and the verdict flips."
          action={
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`chip ${
                  registryTone === 'emerald'
                    ? 'border-emerald-400/25 bg-emerald-400/5 text-emerald-300'
                    : registryTone === 'cyan'
                    ? 'border-cyan-400/25 bg-cyan-400/5 text-cyan-300'
                    : 'border-amber-400/25 bg-amber-400/5 text-amber-300'
                }`}
                title={registryModeTitle(registryMode)}
              >
                <LinkIcon className="h-3 w-3" />
                {registryChipLabel}
              </span>
              {verification && (
                <span className={`chip ${meta?.className}`}>
                  {StatusIcon && <StatusIcon className="h-3 w-3" />}
                  {meta?.label}
                </span>
              )}
            </div>
          }
        />

        {/* Protocol steps */}
        <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
          {[
            { icon: FileCode2, title: 'Canonicalize', detail: 'Sorted keys · normalized floats' },
            { icon: Sigma, title: 'Hash', detail: 'Domain-separated SHA-256' },
            { icon: Database, title: 'Commit', detail: 'bytes32 commitment' },
            { icon: Fingerprint, title: 'Verify', detail: 'Recompute & compare every byte' },
          ].map((step, index) => (
            <div
              key={step.title}
              className="relative flex items-center gap-2.5 rounded-lg border border-climate-border/60 bg-white/[0.02] px-3 py-2.5"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-cyan-400/10 text-cyan-300">
                <step.icon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-white">
                  <span className="mr-1 text-slate-600">0{index + 1}</span>
                  {step.title}
                </p>
                <p className="truncate text-[9px] text-slate-500">{step.detail}</p>
              </div>
              {index < 3 && (
                <ArrowRight className="absolute -right-2 top-1/2 hidden h-3 w-3 -translate-y-1/2 text-slate-700 lg:block" />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-rose-400/30 bg-rose-500/10 p-3 text-[11px] text-rose-200">
            {error}
          </div>
        )}

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {/* Commitment metadata */}
          <div className="rounded-xl border border-climate-border/70 bg-[#091120]/80 p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-white">Report commitment</p>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  Deterministic identifiers for {report?.location_name ?? 'station'} · {report?.as_of ?? '—'}
                </p>
              </div>
              <Switch
                checked={showJson}
                onChange={setShowJson}
                label="JSON"
                icon={FileCode2}
              />
            </div>

            <div className="mt-4 space-y-2.5">
              <HashRow
                label="Commitment ID (bytes32)"
                value={verification?.report_id || registrationRecord?.report_id}
                icon={KeyRound}
                placeholder="Derived at registration"
              />
              <HashRow
                label="Report hash (committed)"
                value={verification?.onchain_hash || registrationRecord?.report_hash}
                icon={Fingerprint}
                placeholder="Not registered in this session"
              />
              <HashRow
                label="Data batch hash"
                value={registrationRecord?.data_hash}
                icon={Database}
                placeholder="Computed at registration"
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-climate-border/60 pt-3 text-[10px]">
              <div>
                <p className="stat-label">Model version</p>
                <p className="mt-0.5 font-mono text-slate-300">{report?.model_version ?? '—'}</p>
              </div>
              <div>
                <p className="stat-label">Canonical schema</p>
                <p className="mt-0.5 font-mono text-slate-300">climatechain-provenance-v1</p>
              </div>
              <div>
                <p className="stat-label">Registry</p>
                <p className="mt-0.5 text-slate-300">
                  {registrationRecord?.network ||
                    (isOnchain ? 'Sepolia testnet' : 'Local simulator')}
                </p>
              </div>
              <div>
                <p className="stat-label">Contract</p>
                <p className="mt-0.5 font-mono text-slate-300">
                  {isOnchain ? 'ClimateProvenance.sol' : 'Simulated commitment'}
                </p>
              </div>
            </div>

            {showJson && (
              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="stat-label">Report payload (pretty-printed)</p>
                  <div className="flex items-center gap-1">
                    <CopyButton value={report ? JSON.stringify(report, null, 2) : ''} />
                    <button onClick={downloadReport} className="button-ghost !px-2 !py-1 !text-[10px]">
                      <Download className="h-3 w-3" />
                      Download
                    </button>
                  </div>
                </div>
                <pre className="max-h-60 overflow-auto rounded-lg border border-climate-border/70 bg-[#050A12] p-3 font-mono text-[9px] leading-relaxed text-slate-400">
                  {report ? JSON.stringify(report, null, 2) : 'No report loaded.'}
                </pre>
              </div>
            )}

            {registrationRecord && (
              <div className="mt-4 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.04] p-3">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {registrationRecord.mode === 'ONCHAIN'
                    ? `Registered on-chain at block ${registrationRecord.block_number}`
                    : `Stored in the labelled simulator (record #${registrationRecord.block_number})`}
                </div>
                <div className="mt-2 space-y-1.5 font-mono text-[9px] text-slate-400">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500">
                      {registrationRecord.mode === 'ONCHAIN' ? 'tx' : 'receipt'}
                    </span>
                    <span className="truncate">{shortHash(registrationRecord.transaction_hash, 18, 10)}</span>
                    <CopyButton value={registrationRecord.transaction_hash} label="Copy" />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500">submitter</span>
                    <span className="truncate">{shortHash(registrationRecord.submitter, 10, 8)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500">time</span>
                    <span>{formatDateTime(registrationRecord.registered_at)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Integrity console */}
          <div className="rounded-xl border border-climate-border/70 bg-[#091120]/80 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-white">Integrity console</p>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  Register the commitment, then verify the exact payload.
                </p>
              </div>
              <span className="chip border-slate-500/20 bg-white/[0.03] text-slate-400">
                <Terminal className="h-3 w-3" />
                API console
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={handleRegister}
                disabled={registering || !report}
                className="button-primary"
              >
                {registering ? <RotateCw className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                {registering
                  ? isOnchain
                    ? 'Broadcasting…'
                    : 'Storing…'
                  : 'Register report'}
              </button>
              <button
                onClick={() => handleVerify()}
                disabled={verifying || !report}
                className="button-secondary"
              >
                {verifying ? <RotateCw className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                {verifying ? 'Checking…' : 'Verify report'}
              </button>
            </div>
            <p className="mt-2 text-[9px] leading-relaxed text-slate-500">
              {isOnchain
                ? 'Registration target: Sepolia testnet with the configured signer.'
                : 'Registration target: labelled local simulator — no transaction or gas is claimed.'}
            </p>

            {/* Tamper simulator */}
            <div
              className={`mt-3 rounded-lg border p-3 transition ${
                tamperEnabled
                  ? 'border-rose-400/30 bg-rose-500/[0.06]'
                  : 'border-climate-border/70 bg-white/[0.02]'
              }`}
            >
              <label className="flex cursor-pointer items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-md ${
                      tamperEnabled ? 'bg-rose-400/15 text-rose-300' : 'bg-white/5 text-slate-400'
                    }`}
                  >
                    <ShieldAlert className="h-3.5 w-3.5" />
                  </span>
                  <span>
                    <span className="block text-[10px] font-semibold text-slate-200">
                      Simulate report tampering
                    </span>
                    <span className="block text-[9px] text-slate-500">
                      Mutate the payload before re-verifying — the demo that wins audits.
                    </span>
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={tamperEnabled}
                  onChange={(event) => {
                    setTamperEnabled(event.target.checked);
                    setVerification(null);
                  }}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-rose-400 focus:ring-rose-400"
                />
              </label>

              {tamperEnabled && (
                <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-rose-400/15 pt-2.5">
                  <span className="text-[9px] text-rose-300/80">Alter:</span>
                  {[
                    { key: 'score', label: 'score → 0' },
                    { key: 'rainfall', label: 'rainfall → 0' },
                    { key: 'summary', label: 'summary text' },
                  ].map((option) => (
                    <button
                      key={option.key}
                      onClick={() => {
                        setTamperField(option.key as typeof tamperField);
                        setVerification(null);
                      }}
                      className={`rounded-md px-2 py-1 text-[9px] font-medium transition ${
                        tamperField === option.key
                          ? 'bg-rose-400/20 text-rose-200'
                          : 'bg-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                  <span className="ml-auto text-[9px] text-rose-300/70">payload altered</span>
                </div>
              )}
            </div>

            {/* Status */}
            {meta ? (
              <div className={`mt-3 rounded-lg border p-3 ${meta.className}`}>
                <div className="flex items-center gap-2 text-xs font-semibold">
                  {StatusIcon && <StatusIcon className="h-4 w-4" />}
                  {meta.label}
                </div>
                <p className="mt-1 text-[10px] leading-relaxed opacity-80">{verification?.reason || meta.description}</p>
                {verification?.computed_hash && (
                  <div className="mt-3 space-y-2 border-t border-current/10 pt-2">
                    <HashCompare
                      label="Computed locally"
                      value={verification.computed_hash}
                      matches={verification.status === 'VERIFIED'}
                    />
                    {verification.onchain_hash && (
                      <HashCompare
                        label="Stored commitment"
                        value={verification.onchain_hash}
                        matches={verification.status === 'VERIFIED'}
                      />
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-3 rounded-lg border border-dashed border-climate-border/80 bg-white/[0.015] p-4 text-center">
                <Binary className="mx-auto mb-2 h-5 w-5 text-slate-600" />
                <p className="text-[10px] text-slate-500">
                  Run verification to compare the local canonical hash against the registry.
                </p>
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[9px] text-slate-500">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {verification ? `Checked ${relativeTime(new Date().toISOString())}` : 'No verification in this session'}
              </span>
              <button onClick={onRefresh} className="button-ghost !px-2 !py-1 !text-[9px]">
                <RotateCw className="h-2.5 w-2.5" />
                Reload report
              </button>
            </div>
          </div>
        </div>

        {/* Audit trail */}
        <div className="mt-4 rounded-xl border border-climate-border/70 bg-[#091120]/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-cyan-300" />
              <div>
                <p className="text-xs font-semibold text-white">Registry audit trail</p>
                <p className="text-[9px] text-slate-500">
                  Commitments registered through this API instance (local simulator or RPC).
                </p>
              </div>
            </div>
            <span className="chip border-slate-500/20 bg-white/[0.03] text-slate-400">
              {registryLoading ? 'loading…' : `${registry.length} record${registry.length === 1 ? '' : 's'}`}
            </span>
          </div>

          <div className="mt-3 space-y-1.5">
            {!registryLoading && registry.length === 0 && (
              <p className="rounded-lg border border-dashed border-climate-border/70 px-3 py-4 text-center text-[10px] text-slate-500">
                No commitments yet. Register a report above to populate the audit trail.
              </p>
            )}
            {registry.slice(0, 5).map((record) => (
              <div
                key={record.report_id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-climate-border/60 bg-white/[0.02] px-3 py-2 text-[10px]"
              >
                <span className="flex items-center gap-1.5 font-mono text-cyan-300">
                  <Fingerprint className="h-3 w-3" />
                  {shortHash(record.report_id, 10, 6)}
                </span>
                <span className="text-slate-500">
                  {record.mode === 'ONCHAIN' ? `block ${record.block_number}` : `record #${record.block_number}`}
                </span>
                <span className="text-slate-500">{formatDateTime(record.registered_at)}</span>
                <span className="ml-auto text-slate-500">{record.network}</span>
                <CopyButton value={record.report_hash} label="Hash" />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[9px] text-slate-600">
          <span className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            <span className="font-mono">CLIMATECHAIN_BD_PREDICTION_REPORT_V1:</span> domain separation
          </span>
          <span className="flex items-center gap-1">
            <ExternalLink className="h-3 w-3" />
            PENDING / UNAVAILABLE are first-class states — no false VERIFIED verdicts.
          </span>
        </div>
      </div>
    </section>
  );
}

function HashRow({
  label,
  value,
  icon: Icon,
  placeholder = 'Available after registration',
}: {
  label: string;
  value?: string | null;
  icon: React.ElementType;
  placeholder?: string;
}) {
  return (
    <div className="rounded-lg border border-climate-border/60 bg-white/[0.02] p-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 text-[9px] font-medium uppercase tracking-wide text-slate-500">
          <Icon className="h-2.5 w-2.5" />
          {label}
        </span>
        <CopyButton value={value} />
      </div>
      <p className="mt-1 break-all font-mono text-[10px] leading-relaxed text-cyan-300/90">
        {value || <span className="text-slate-600">{placeholder}</span>}
      </p>
    </div>
  );
}

function HashCompare({
  label,
  value,
  matches,
}: {
  label: string;
  value: string;
  matches: boolean;
}) {
  return (
    <div className="flex items-start gap-2 text-[9px]">
      <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${matches ? 'bg-emerald-400' : 'bg-rose-400'}`} />
      <div className="min-w-0">
        <p className="text-slate-500">{label}</p>
        <p className="break-all font-mono text-slate-300">{value}</p>
      </div>
    </div>
  );
}

function Switch({
  checked,
  onChange,
  label,
  icon: Icon,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  icon: React.ElementType;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[9px] font-medium transition ${
        checked
          ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300'
          : 'border-climate-border/70 bg-white/[0.02] text-slate-400 hover:text-white'
      }`}
      aria-pressed={checked}
    >
      <Icon className="h-3 w-3" />
      {label}
    </button>
  );
}
