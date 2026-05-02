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
    <div className={cn("bg-card border border-border rounded-xl p-4 flex flex-col", className)}>
      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">{title}</span>
      <span className="text-2xl font-semibold text-foreground">{value}</span>
      {subtitle && <span className="text-xs text-muted-foreground mt-1">{subtitle}</span>}
    </div>
  );
}
