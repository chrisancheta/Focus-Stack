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
      className={cn("w-full rounded-2xl overflow-hidden", className)}
      style={{
        background: 'rgba(255,255,255,0.30)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.40)',
      }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[#222527]/50">{title}</h3>
          {count !== undefined && (
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-[#222527]/55"
              style={{ background: 'rgba(255,255,255,0.50)' }}
            >
              {count}
            </span>
          )}
        </div>
        <CollapsibleTrigger asChild>
          <button className="p-1 text-[#222527]/40 hover:text-[#222527]/70 transition-colors rounded-lg">
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="px-4 pb-4 space-y-2 animate-in slide-in-from-top-1">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
