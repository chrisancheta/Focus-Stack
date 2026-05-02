import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface BucketBadgeProps {
  bucket: 'must-do' | 'should-do' | 'could-do';
  className?: string;
}

export function BucketBadge({ bucket, className }: BucketBadgeProps) {
  const config = {
    'must-do': { text: 'Must Do', styles: 'bg-destructive/10 text-destructive border-destructive/20' },
    'should-do': { text: 'Should Do', styles: 'bg-primary/10 text-primary border-primary/20' },
    'could-do': { text: 'Could Do', styles: 'bg-muted text-muted-foreground border-border' }
  };

  const { text, styles } = config[bucket];

  return (
    <Badge variant="outline" className={cn("text-[10px] uppercase font-bold tracking-wider rounded-sm px-1.5 py-0.5", styles, className)}>
      {text}
    </Badge>
  );
}
