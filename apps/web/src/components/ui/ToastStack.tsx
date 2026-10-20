'use client';

import React from 'react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';

export interface Toast {
  id: number;
  title: string;
  description?: string;
  tone?: 'success' | 'error' | 'info';
}

interface ToastStackProps {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}

const toneStyles = {
  success: {
    icon: CheckCircle2,
    iconClass: 'text-emerald-400',
    border: 'border-emerald-400/30',
    bar: 'bg-emerald-400',
  },
  error: {
    icon: XCircle,
    iconClass: 'text-rose-400',
    border: 'border-rose-400/30',
    bar: 'bg-rose-400',
  },
  info: {
    icon: Info,
    iconClass: 'text-cyan-400',
    border: 'border-cyan-400/30',
    bar: 'bg-cyan-400',
  },
};

export default function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  if (!toasts.length) return null;
  return (
    <div
      className="fixed bottom-5 right-5 z-[80] flex w-[min(92vw,360px)] flex-col gap-2"
      role="status"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const tone = toneStyles[toast.tone || 'info'];
        const Icon = tone.icon;
        return (
          <div
            key={toast.id}
            className={`animate-fade-up overflow-hidden rounded-xl border ${tone.border} bg-[#0C1524]/95 shadow-2xl backdrop-blur-md`}
          >
            <div className={`h-0.5 w-full ${tone.bar}`} />
            <div className="flex items-start gap-3 p-3.5">
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${tone.iconClass}`} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white">{toast.title}</p>
                {toast.description && (
                  <p className="mt-0.5 text-[11px] leading-relaxed text-slate-400">
                    {toast.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => onDismiss(toast.id)}
                className="rounded p-0.5 text-slate-500 transition hover:text-white"
                aria-label="Dismiss notification"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
