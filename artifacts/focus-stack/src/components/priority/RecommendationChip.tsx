import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface RecommendationChipProps {
  label: 'do-now' | 'schedule' | 'reconsider' | 'deprioritize';
  className?: string;
}

export function RecommendationChip({ label, className }: RecommendationChipProps) {
  const config = {
    'do-now': { text: 'Do Now', styles: 'bg-primary text-primary-foreground border-transparent' },
    'schedule': { text: 'Schedule', styles: 'bg-accent text-accent-foreground border-transparent' },
    'reconsider': { text: 'Reconsider', styles: 'bg-muted text-muted-foreground border-border' },
    'deprioritize': { text: 'Deprioritize', styles: 'bg-transparent text-muted-foreground border-border opacity-70' }
  };

  const { text, styles } = config[label];

  return (
    <Badge variant="outline" className={cn("text-[10px] uppercase font-bold tracking-wider rounded-sm px-1.5 py-0.5", styles, className)}>
      {text}
    </Badge>
  );
}
