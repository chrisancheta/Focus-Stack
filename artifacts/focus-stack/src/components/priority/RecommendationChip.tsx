import React from 'react';
import { cn } from '@/lib/utils';

/*
  Differentiated recommendation labels — one per card:
  do-now       → "Must Do"    amber   — act on this today, no question
  schedule     → "Should Do"  sage    — important, plan it in today's stack
  reconsider   → "Can Wait"   slate   — worth doing, but not today's priority
  deprioritize → "Optional"   neutral — low signal, revisit when bandwidth allows
*/
const CHIP_CONFIG = {
  'do-now': {
    label: 'Must Do',
    bg: 'rgba(194,130,0,0.13)',
    color: '#6b4800',
    border: 'rgba(194,130,0,0.30)',
  },
  'schedule': {
    label: 'Should Do',
    bg: 'rgba(107,143,110,0.18)',
    color: '#2a4e2d',
    border: 'rgba(107,143,110,0.36)',
  },
  'reconsider': {
    label: 'Can Wait',
    bg: 'rgba(70,110,180,0.10)',
    color: '#2a3e72',
    border: 'rgba(70,110,180,0.22)',
  },
  'deprioritize': {
    label: 'Optional',
    bg: 'rgba(34,37,39,0.07)',
    color: 'rgba(34,37,39,0.48)',
    border: 'rgba(34,37,39,0.15)',
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
