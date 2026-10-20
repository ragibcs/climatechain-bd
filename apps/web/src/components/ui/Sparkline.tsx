import React from 'react';

interface SparklineProps {
  values: number[];
  color?: string;
  height?: number;
  className?: string;
  fill?: boolean;
  strokeWidth?: number;
}

export default function Sparkline({
  values,
  color = '#22D3EE',
  height = 40,
  className = 'w-full',
  fill = true,
  strokeWidth = 2,
}: SparklineProps) {
  const width = 160;
  if (!values.length) {
    return (
      <div
        className={`flex items-center justify-center text-[10px] text-slate-600 ${className}`}
        style={{ height }}
      >
        no trend data
      </div>
    );
  }

  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const points = values.map((value, index) => {
    const x = index * step;
    const y = height - 4 - ((value - min) / range) * (height - 8);
    return [x, y] as const;
  });
  const line = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `0,${height} ${line} ${width},${height}`;
  const gradientId = `spark-${color.replace('#', '')}-${values.length}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={className}
      style={{ height }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && points.length > 1 && <polygon points={area} fill={`url(#${gradientId})`} />}
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.length > 0 && (
        <circle
          cx={points[points.length - 1][0]}
          cy={points[points.length - 1][1]}
          r="2.5"
          fill={color}
        />
      )}
    </svg>
  );
}
