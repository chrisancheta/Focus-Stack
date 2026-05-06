import React from 'react';
import { cn } from '@/lib/utils';

/*
  Semantic colour system — each chip communicates a distinct action signal:
  do-now     → Warm amber   — "take action immediately"
  schedule   → Blue-slate   — "plan and book time"
  reconsider → Ochre/yellow — "pause and question this"
  deprioritize → Muted red  — "consider dropping"
*/
const CHIP_CONFIG = {
  'do-now': {
    label: 'Do now',
    bg: 'rgba(194,130,0,0.13)',
    color: '#6b4800',
    border: 'rgba(194,130,0,0.30)',
  },
  'schedule': {
    label: 'Schedule',
    bg: 'rgba(70,110,180,0.11)',
    color: '#2a3e72',
    border: 'rgba(70,110,180,0.25)',
  },
  'reconsider': {
    label: 'Reconsider',
    bg: 'rgba(175,148,0,0.12)',
    color: '#5a4900',
    border: 'rgba(175,148,0,0.26)',
  },
  'deprioritize': {
    label: 'Deprioritize',
    bg: 'rgba(180,50,50,0.10)',
    color: 'rgba(150,35,35,0.78)',
    border: 'rgba(180,50,50,0.22)',
  },
};

interface RecommendationChipProps {
  label: 'do-now' | 'schedule' | 'reconsider' | 'deprioritize';
  className?: string;
}

export function RecommendationChip({ label, className }: RecommendationChipProps) {
  const c = CHIP_CONFIG[label];
  return (
    <span
      className={cn("inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-md tracking-wide", className)}
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}
    >
      {c.label}
    </span>
  );
}
