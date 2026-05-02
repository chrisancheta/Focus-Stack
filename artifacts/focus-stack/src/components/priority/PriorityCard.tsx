import React from 'react';
import { PriorityCard as PriorityType } from '@/lib/store';
import { BucketBadge } from './BucketBadge';
import { RecommendationChip } from './RecommendationChip';
import { Clock, Calendar, CheckCircle2, Circle, MoreVertical, Play, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PriorityCardProps {
  priority: PriorityType;
  onClick?: () => void;
  onComplete?: () => void;
  onDefer?: () => void;
  onStartFocus?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  showMoveControls?: boolean;
}

export function PriorityCard({
  priority,
  onClick,
  onComplete,
  onDefer,
  onStartFocus,
  onMoveUp,
  onMoveDown,
  showMoveControls
}: PriorityCardProps) {
  const isCompleted = priority.status === 'completed';

  return (
    <div 
      className={cn(
        "group relative bg-card border rounded-lg p-3 sm:p-4 transition-all hover:border-primary/30 hover:shadow-sm cursor-pointer",
        isCompleted ? "opacity-60 bg-muted/50 border-border" : "border-card-border",
        priority.isCarryover && !isCompleted ? "border-l-4 border-l-destructive/50" : ""
      )}
      onClick={onClick}
      data-testid={`priority-card-${priority.id}`}
    >
      <div className="flex gap-3">
        {showMoveControls && (
          <div className="flex flex-col justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
            <button onClick={onMoveUp} className="text-muted-foreground hover:text-foreground p-0.5"><ArrowUp className="h-3 w-3" /></button>
            <button onClick={onMoveDown} className="text-muted-foreground hover:text-foreground p-0.5"><ArrowDown className="h-3 w-3" /></button>
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <BucketBadge bucket={priority.bucket} />
            {!isCompleted && priority.recommendationLabel && (
              <RecommendationChip label={priority.recommendationLabel} />
            )}
            {priority.isCarryover && !isCompleted && (
              <span className="text-[10px] font-medium text-destructive px-1.5 py-0.5 bg-destructive/10 rounded-sm">Carryover</span>
            )}
          </div>
          
          <h4 className={cn("text-sm sm:text-base font-medium leading-tight mb-1", isCompleted && "line-through text-muted-foreground")}>
            {priority.title}
          </h4>
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            {priority.estimatedMinutes && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{priority.estimatedMinutes}m</span>
              </div>
            )}
            {priority.dueDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{priority.dueDate}</span>
              </div>
            )}
            {!isCompleted && priority.recommendationReason && (
              <span className="text-muted-foreground/70 truncate max-w-[200px] sm:max-w-xs block">
                • {priority.recommendationReason}
              </span>
            )}
          </div>
          
          {priority.status === 'in-progress' && priority.progressPercent > 0 && priority.progressPercent < 100 && (
            <div className="mt-2 h-1 w-full bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all" 
                style={{ width: `${priority.progressPercent}%` }}
              />
            </div>
          )}
        </div>

        <div className="flex flex-col items-end justify-between" onClick={e => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground -mr-2 -mt-2">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!isCompleted && <DropdownMenuItem onClick={onComplete}><CheckCircle2 className="h-4 w-4 mr-2" /> Mark Complete</DropdownMenuItem>}
              {!isCompleted && <DropdownMenuItem onClick={onDefer}>Defer to Tomorrow</DropdownMenuItem>}
              {!isCompleted && <DropdownMenuItem onClick={onStartFocus}><Play className="h-4 w-4 mr-2" /> Start Focus Timer</DropdownMenuItem>}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {!isCompleted && (
            <button 
              onClick={(e) => { e.stopPropagation(); onComplete?.(); }}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Circle className="h-5 w-5" />
            </button>
          )}
          {isCompleted && (
            <CheckCircle2 className="h-5 w-5 text-primary" />
          )}
        </div>
      </div>
    </div>
  );
}
