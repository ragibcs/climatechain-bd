import React from 'react';
import { themeFor } from '@/lib/risk';

interface RiskBadgeProps {
  level?: string | null;
  label?: string;
  className?: string;
  pulse?: boolean;
}

export default function RiskBadge({
  level,
  label,
  className = '',
  pulse = false,
}: RiskBadgeProps) {
  const theme = themeFor(level);
  return (
    <span
      className={`chip ${theme.bg} ${theme.border} ${theme.text} ${className}`}
      title={`Risk level: ${theme.label}`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {pulse && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full ${theme.dot} opacity-60`}
          />
        )}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${theme.dot}`} />
      </span>
      {label || `${theme.label} risk`}
    </span>
  );
}
