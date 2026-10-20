import type { RiskLevel } from './types';

export const RISK_ORDER: RiskLevel[] = ['LOW', 'MODERATE', 'HIGH', 'SEVERE'];

export const riskTheme: Record<
  string,
  {
    label: string;
    text: string;
    bg: string;
    border: string;
    ring: string;
    dot: string;
    hex: string;
    gradient: string;
  }
> = {
  LOW: {
    label: 'Low',
    text: 'text-emerald-300',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-400/30',
    ring: 'ring-emerald-400/30',
    dot: 'bg-emerald-400',
    hex: '#34D399',
    gradient: 'from-emerald-400 to-teal-500',
  },
  MODERATE: {
    label: 'Moderate',
    text: 'text-yellow-300',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-400/30',
    ring: 'ring-yellow-400/30',
    dot: 'bg-yellow-400',
    hex: '#FACC15',
    gradient: 'from-yellow-300 to-amber-500',
  },
  HIGH: {
    label: 'High',
    text: 'text-orange-300',
    bg: 'bg-orange-500/10',
    border: 'border-orange-400/30',
    ring: 'ring-orange-400/30',
    dot: 'bg-orange-400',
    hex: '#FB923C',
    gradient: 'from-orange-400 to-rose-500',
  },
  SEVERE: {
    label: 'Severe',
    text: 'text-rose-300',
    bg: 'bg-rose-500/10',
    border: 'border-rose-400/30',
    ring: 'ring-rose-400/30',
    dot: 'bg-rose-400',
    hex: '#FB7185',
    gradient: 'from-rose-400 to-red-500',
  },
  UNKNOWN: {
    label: 'Unknown',
    text: 'text-slate-300',
    bg: 'bg-slate-500/10',
    border: 'border-slate-400/30',
    ring: 'ring-slate-400/30',
    dot: 'bg-slate-400',
    hex: '#94A3B8',
    gradient: 'from-slate-400 to-slate-600',
  },
};

export function themeFor(level?: string | null) {
  return riskTheme[(level || 'UNKNOWN').toUpperCase()] ?? riskTheme.UNKNOWN;
}

export function scoreColor(score?: number | null) {
  if (score === null || score === undefined) return 'text-slate-300';
  if (score >= 75) return 'text-rose-300';
  if (score >= 50) return 'text-orange-300';
  if (score >= 25) return 'text-yellow-300';
  return 'text-emerald-300';
}

export function scoreStroke(score?: number | null) {
  if (score === null || score === undefined) return '#94A3B8';
  if (score >= 75) return '#FB7185';
  if (score >= 50) return '#FB923C';
  if (score >= 25) return '#FACC15';
  return '#34D399';
}

export function riskFromScore(score?: number | null): RiskLevel {
  if (score === null || score === undefined) return 'UNKNOWN';
  if (score >= 75) return 'SEVERE';
  if (score >= 50) return 'HIGH';
  if (score >= 25) return 'MODERATE';
  return 'LOW';
}

export function formatMm(value?: number | null, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${Number(value).toFixed(digits)} mm`;
}

export function formatDelta(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  if (Math.abs(value) < 0.05) return { label: 'steady', positive: false };
  return {
    label: `${value > 0 ? '+' : ''}${value.toFixed(1)} mm`,
    positive: value > 0,
  };
}

export function formatDate(value?: string | null, options?: Intl.DateTimeFormatOptions) {
  if (!value) return '—';
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options,
  });
}

export function formatShortDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

export function formatDateTime(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function relativeTime(value?: string | null) {
  if (!value) return 'unknown';
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return 'unknown';
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function shortHash(value?: string | null, head = 10, tail = 8) {
  if (!value) return '—';
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

export function pct(value: number, total: number) {
  if (!total) return 0;
  return Math.max(0, Math.min(100, (value / total) * 100));
}
