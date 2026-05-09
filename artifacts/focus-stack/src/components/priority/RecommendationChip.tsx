import React from 'react';
import { cn } from '@/lib/utils';

/*
  Actionable recommendation labels — one per card, no ambiguity:
  do-now       → "Do Now"         amber  — take action immediately
  schedule     → "Do Today"       sage   — plan this for today's work
  reconsider   → "Schedule Later" slate  — worth doing, but not today
  deprioritize → "Defer"          neutral — low priority, revisit later
*/
const CHIP_CONFIG = {
  'do-now': {
    label: 'Do Now',
    bg: 'rgba(194,130,0,0.13)',
    color: '#6b4800',
    border: 'rgba(194,130,0,0.30)',
  },
  'schedule': {
    label: 'Do Today',
    bg: 'rgba(107,143,110,0.18)',
    color: '#2a4e2d',
    border: 'rgba(107,143,110,0.36)',
  },
  'reconsider': {
    label: 'Schedule Later',
    bg: 'rgba(70,110,180,0.10)',
    color: '#2a3e72',
    border: 'rgba(70,110,180,0.22)',
  },
  'deprioritize': {
    label: 'Defer',
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
