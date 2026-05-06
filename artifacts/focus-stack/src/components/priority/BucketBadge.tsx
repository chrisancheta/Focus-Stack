import React from 'react';
import { cn } from '@/lib/utils';

const BUCKET_CONFIG = {
  'must-do': {
    label: 'Must do',
    bg: '#222527',
    color: '#fff',
    border: 'transparent',
  },
  'should-do': {
    label: 'Should do',
    bg: 'rgba(107,143,110,0.24)',
    color: '#2a4e2d',
    border: 'rgba(107,143,110,0.42)',
  },
  'could-do': {
    label: 'Could do',
    bg: 'rgba(144,157,146,0.22)',
    color: 'rgba(34,37,39,0.58)',
    border: 'rgba(144,157,146,0.38)',
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
      className={cn("inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md tracking-wide", className)}
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}
    >
      {c.label}
    </span>
  );
}
