import React from 'react';
import { PriorityCard as PriorityType } from '@/lib/store';
import { BucketBadge } from './BucketBadge';
import { RecommendationChip } from './RecommendationChip';
import { Clock, Calendar, CheckCircle2, Circle, MoreVertical, Play, ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  showMoveControls,
}: PriorityCardProps) {
  const isCompleted = priority.status === 'completed';

  return (
    <div
      className={cn(
        "group relative rounded-2xl p-4 cursor-pointer transition-all",
        isCompleted ? "opacity-55" : ""
      )}
      style={{
        background: isCompleted
          ? 'rgba(255,255,255,0.25)'
          : priority.isCarryover
            ? 'rgba(255,255,255,0.38)'
            : 'rgba(255,255,255,0.45)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: priority.isCarryover && !isCompleted
          ? '1px solid rgba(239,68,68,0.25)'
          : '1px solid rgba(255,255,255,0.55)',
        borderLeft: priority.isCarryover && !isCompleted ? '3px solid rgba(239,68,68,0.45)' : undefined,
      }}
      onClick={onClick}
      data-testid={`priority-card-${priority.id}`}
    >
      <div className="flex gap-3 items-start">
        {showMoveControls && (
          <div
            className="flex flex-col justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={onMoveUp}
              className="text-[#222527]/30 hover:text-[#222527]/70 p-0.5 transition-colors"
            >
              <ArrowUp className="h-3 w-3" />
            </button>
            <button
              onClick={onMoveDown}
              className="text-[#222527]/30 hover:text-[#222527]/70 p-0.5 transition-colors"
            >
              <ArrowDown className="h-3 w-3" />
            </button>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            <BucketBadge bucket={priority.bucket} />
            {!isCompleted && priority.recommendationLabel && (
              <RecommendationChip label={priority.recommendationLabel} />
            )}
            {priority.isCarryover && !isCompleted && (
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                style={{ background: 'rgba(239,68,68,0.10)', color: 'rgba(239,68,68,0.80)' }}
              >
                Carryover
              </span>
            )}
            {priority.recurrenceType && priority.recurrenceType !== 'none' && !isCompleted && (
              <span
                className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                style={{ background: 'rgba(107,143,110,0.12)', color: 'rgba(107,143,110,0.90)' }}
              >
                <RefreshCw className="h-2.5 w-2.5" />
                {priority.recurrenceType === 'daily' ? 'Daily' : 'Weekly'}
              </span>
            )}
          </div>

          <h4
            className={cn(
              "text-sm font-medium leading-snug mb-1.5 text-[#222527]",
              isCompleted && "line-through opacity-50"
            )}
          >
            {priority.title}
          </h4>

          <div className="flex items-center gap-3 flex-wrap">
            {priority.estimatedMinutes && (
              <div className="flex items-center gap-1 text-xs text-[#222527]/45">
                <Clock className="h-3 w-3" />
                <span>{priority.estimatedMinutes}m</span>
              </div>
            )}
            {priority.dueDate && (
              <div className="flex items-center gap-1 text-xs text-[#222527]/45">
                <Calendar className="h-3 w-3" />
                <span>{priority.dueDate}</span>
              </div>
            )}
            {!isCompleted && priority.recommendationReason && (
              <span className="text-xs text-[#222527]/40 truncate max-w-[220px]">
                {priority.recommendationReason}
              </span>
            )}
          </div>

          {priority.status === 'in-progress' && priority.progressPercent > 0 && priority.progressPercent < 100 && (
            <div className="mt-2.5 h-1 w-full rounded-full overflow-hidden" style={{ background: 'rgba(144,157,146,0.25)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${priority.progressPercent}%`, background: 'rgba(34,37,39,0.55)' }}
              />
            </div>
          )}
        </div>

        <div
          className="flex flex-col items-end justify-between gap-2 shrink-0"
          onClick={e => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-[#222527]/30 hover:text-[#222527]/70 transition-colors p-0.5 -mr-1 -mt-1">
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-sm">
              {!isCompleted && onComplete && (
                <DropdownMenuItem onClick={onComplete}>
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Mark Complete
                </DropdownMenuItem>
              )}
              {!isCompleted && onDefer && (
                <DropdownMenuItem onClick={onDefer}>Defer to Tomorrow</DropdownMenuItem>
              )}
              {!isCompleted && onStartFocus && (
                <DropdownMenuItem onClick={onStartFocus}>
                  <Play className="h-4 w-4 mr-2" /> Start Focus Timer
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {!isCompleted ? (
            <button
              onClick={e => { e.stopPropagation(); onComplete?.(); }}
              className="text-[#222527]/25 hover:text-[#222527]/70 transition-colors"
            >
              <Circle className="h-5 w-5" />
            </button>
          ) : (
            <CheckCircle2 className="h-5 w-5 text-[#222527]/50" />
          )}
        </div>
      </div>
    </div>
  );
}
