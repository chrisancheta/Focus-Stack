import React from 'react';
import { cn } from '@/lib/utils';

const BUCKET_CONFIG = {
  'must-do': {
    label: 'Must do',
    bg: 'rgba(34,37,39,0.85)',
    color: '#fff',
    border: 'transparent',
  },
  'should-do': {
    label: 'Should do',
    bg: 'rgba(144,157,146,0.32)',
    color: 'rgba(34,37,39,0.80)',
    border: 'rgba(144,157,146,0.42)',
  },
  'could-do': {
    label: 'Could do',
    bg: 'rgba(255,255,255,0.48)',
    color: 'rgba(34,37,39,0.52)',
    border: 'rgba(255,255,255,0.62)',
  },
};

interface BucketBadgeProps {
  bucket: 'must-do' | 'should-do' | 'could-do';
  className?: string;
}

export function BucketBadge({ bucket, className }: BucketBadgeProps) {
  const c = BUCKET_CONFIG[bucket];
  return (
    <span
      className={cn("inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-md tracking-wide", className)}
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}
    >
      {c.label}
    </span>
  );
}
