'use client';

import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CopyButtonProps {
  value?: string | null;
  label?: string;
  className?: string;
}

export default function CopyButton({
  value,
  label = 'Copy',
  className = '',
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = value;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <button
      type="button"
      onClick={copy}
      disabled={!value}
      aria-label={copied ? 'Copied' : label}
      className={`inline-flex items-center gap-1 rounded-md border border-climate-border/80 bg-white/[0.03] px-2 py-1 text-[10px] font-medium text-slate-400 transition hover:border-cyan-400/30 hover:text-cyan-300 disabled:opacity-40 ${className}`}
    >
      {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Copied' : label}
    </button>
  );
}
