import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface CollapsibleSectionProps {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function CollapsibleSection({ title, count, defaultOpen = false, children, className }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn("w-full", className)}
    >
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm text-foreground/80">{title}</h3>
          {count !== undefined && (
            <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full">
              {count}
            </span>
          )}
        </div>
        <CollapsibleTrigger asChild>
          <button className="p-1 hover:bg-muted rounded-md text-muted-foreground transition-colors">
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="pt-2 pb-4 space-y-2 animate-in slide-in-from-top-1">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
