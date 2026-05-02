import React from 'react';
import { cn } from '@/lib/utils';

interface SectionCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function SectionCard({ title, children, className, action }: SectionCardProps) {
  return (
    <div className={cn("bg-card border border-border rounded-xl p-4 shadow-sm", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h3 className="font-semibold text-lg">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
