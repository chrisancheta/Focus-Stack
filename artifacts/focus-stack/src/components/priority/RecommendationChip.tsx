import React from 'react';
import { cn } from '@/lib/utils';

const CHIP_CONFIG = {
  'do-now': {
    label: 'Do now',
    bg: 'rgba(34,37,39,0.10)',
    color: 'rgba(34,37,39,0.75)',
    border: 'rgba(34,37,39,0.15)',
  },
  'schedule': {
    label: 'Schedule',
    bg: 'rgba(144,157,146,0.22)',
    color: 'rgba(34,37,39,0.65)',
    border: 'rgba(144,157,146,0.35)',
  },
  'reconsider': {
    label: 'Reconsider',
    bg: 'rgba(255,255,255,0.35)',
    color: 'rgba(34,37,39,0.50)',
    border: 'rgba(255,255,255,0.50)',
  },
  'deprioritize': {
    label: 'Deprioritize',
    bg: 'transparent',
    color: 'rgba(34,37,39,0.35)',
    border: 'rgba(34,37,39,0.12)',
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
      className={cn("inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-md tracking-wide", className)}
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}
    >
      {c.label}
    </span>
  );
}
