import React from 'react';
import { cn } from '@/lib/utils';

interface KpiWidgetProps {
  title: string;
  value: string | number;
  subtitle?: string;
  className?: string;
}

export function KpiWidget({ title, value, subtitle, className }: KpiWidgetProps) {
  return (
    <div
      className={cn("rounded-2xl p-4 flex flex-col gap-1", className)}
      style={{
        background: 'rgba(255,255,255,0.35)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: '1px solid rgba(255,255,255,0.45)',
      }}
    >
      <span className="text-xs font-medium text-[#222527]/50 uppercase tracking-widest leading-tight">{title}</span>
      <span className="text-3xl font-light text-[#222527] leading-none">{value}</span>
      {subtitle && (
        <span className="text-xs text-[#222527]/45 leading-tight mt-0.5">{subtitle}</span>
      )}
    </div>
  );
}
