'use client';

import React, { useEffect, useState } from 'react';
import { scoreColor, scoreStroke, themeFor } from '@/lib/risk';

interface ScoreRingProps {
  score: number | null | undefined;
  level?: string | null;
  size?: number;
  stroke?: number;
  subtitle?: string;
}

export default function ScoreRing({
  score,
  level,
  size = 176,
  stroke = 12,
  subtitle,
}: ScoreRingProps) {
  const [progress, setProgress] = useState(0);
  const safeScore = Math.max(0, Math.min(100, score ?? 0));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const theme = themeFor(level);
  const offset = circumference - (progress / 100) * circumference;

  useEffect(() => {
    const id = window.setTimeout(() => setProgress(safeScore), 120);
    return () => window.clearTimeout(id);
  }, [safeScore]);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`SRRI score ${score ?? 0} out of 100, ${theme.label} risk`}
    >
      <div
        className="absolute inset-3 rounded-full opacity-30 blur-2xl"
        style={{ backgroundColor: theme.hex }}
      />
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(148,163,184,0.13)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={scoreStroke(score)}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className={`text-5xl font-black tabular-nums tracking-tight ${scoreColor(score)}`}>
          {score === null || score === undefined ? '—' : Number(score).toFixed(1)}
        </span>
        <span className="-mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          of 100
        </span>
        {subtitle && <span className="mt-1 text-[10px] text-slate-400">{subtitle}</span>}
      </div>
    </div>
  );
}
