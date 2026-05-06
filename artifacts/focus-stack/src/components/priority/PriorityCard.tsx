import React, { useState, useRef } from 'react';
import { PriorityCard as PriorityType } from '@/lib/store';
import { BucketBadge } from './BucketBadge';
import { RecommendationChip } from './RecommendationChip';
import { Clock, Calendar, CheckCircle2, Circle, MoreVertical, Play, ArrowUp, ArrowDown, RefreshCw, StickyNote, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Eisenhower helpers ─────────────────────────────────────────────────────────

function getQuadrant(importanceScore: number, urgencyScore: number) {
  const hi = importanceScore >= 4;
  const hu = urgencyScore >= 4;
  if (hi && hu)  return { label: 'Must Do',   row: 0, col: 0 };
  if (hi && !hu) return { label: 'Schedule',  row: 0, col: 1 };
  if (!hi && hu) return { label: 'Delegate',  row: 1, col: 0 };
  return            { label: 'Eliminate', row: 1, col: 1 };
}

function quadrantStyle(label: string): React.CSSProperties {
  if (label === 'Must Do')   return { background: 'rgba(34,37,39,0.09)',   color: 'rgba(34,37,39,0.72)' };
  if (label === 'Schedule')  return { background: 'rgba(107,143,110,0.13)', color: 'rgba(90,125,93,0.90)' };
  if (label === 'Delegate')  return { background: 'rgba(194,154,60,0.13)',  color: 'rgba(150,110,20,0.85)' };
  return                            { background: 'rgba(239,68,68,0.09)',   color: 'rgba(180,40,40,0.72)' };
}

function MiniMatrix({ row, col }: { row: number; col: number }) {
  const S = 10; const G = 2; const T = 2 * S + G;
  return (
    <svg width={T} height={T} viewBox={`0 0 ${T} ${T}`} className="shrink-0">
      {([0, 1] as const).flatMap(r =>
        ([0, 1] as const).map(c => (
          <rect key={`${r}${c}`}
            x={c * (S + G)} y={r * (S + G)} width={S} height={S} rx={2}
            fill={r === row && c === col ? 'rgba(34,37,39,0.68)' : 'rgba(34,37,39,0.10)'}
          />
        ))
      )}
    </svg>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-[#222527]/40">{label}</span>
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="w-3 h-1.5 rounded-full"
            style={{ background: i < score ? 'rgba(34,37,39,0.58)' : 'rgba(34,37,39,0.11)' }}
          />
        ))}
      </div>
    </div>
  );
}
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
  onNoteChange?: (note: string) => void;
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
  onNoteChange,
  onMoveUp,
  onMoveDown,
  showMoveControls,
}: PriorityCardProps) {
  const isCompleted = priority.status === 'completed';
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteValue, setNoteValue] = useState(priority.notes ?? '');
  const [whyOpen, setWhyOpen] = useState(false);

  const quadrant = getQuadrant(priority.importanceScore, priority.urgencyScore);
  const isHighImportance = priority.importanceScore >= 4;
  const isHighUrgency = priority.urgencyScore >= 4;
  const tooltipText = `Based on your input, this task is ${isHighImportance ? 'high' : 'low'} importance and ${isHighUrgency ? 'high' : 'low'} urgency`;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Keep local value in sync if the priority is updated externally
  React.useEffect(() => {
    setNoteValue(priority.notes ?? '');
  }, [priority.notes]);

  const handleNoteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const opening = !noteOpen;
    setNoteOpen(opening);
    if (opening) setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleNoteBlur = () => {
    onNoteChange?.(noteValue);
    if (!noteValue) setNoteOpen(false);
  };

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
              {onNoteChange && (
                <DropdownMenuItem onClick={handleNoteToggle}>
                  <StickyNote className="h-4 w-4 mr-2" /> {noteOpen ? 'Hide note' : 'Add note'}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {onNoteChange && (
            <button
              onClick={handleNoteToggle}
              title="Quick note"
              className={cn(
                "transition-colors p-0.5",
                noteValue
                  ? "text-[#6B8F6E]/80 hover:text-[#6B8F6E]"
                  : "text-[#222527]/20 opacity-0 group-hover:opacity-100 hover:text-[#222527]/60"
              )}
            >
              <StickyNote className="h-3.5 w-3.5" />
            </button>
          )}

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

      {/* ── Why this priority? ────────────────────────────────────────── */}
      {!isCompleted && (
        <div
          className="mt-3 pt-2.5"
          style={{ borderTop: '1px solid rgba(255,255,255,0.45)' }}
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={() => setWhyOpen(w => !w)}
            className="flex items-center gap-1 text-[11px] text-[#222527]/40 hover:text-[#222527]/65 transition-colors"
          >
            <ChevronDown className={cn('h-3 w-3 transition-transform duration-200', whyOpen && 'rotate-180')} />
            Why this priority?
          </button>

          {whyOpen && (
            <div className="mt-2.5 flex items-start gap-3">
              <div title={tooltipText} className="mt-0.5">
                <MiniMatrix row={quadrant.row} col={quadrant.col} />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex gap-4">
                  <ScoreBar label="Importance" score={priority.importanceScore} />
                  <ScoreBar label="Urgency" score={priority.urgencyScore} />
                </div>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-md self-start"
                  style={quadrantStyle(quadrant.label)}
                >
                  {quadrant.label}
                </span>
                <p className="text-[10px] text-[#222527]/35 leading-relaxed max-w-[230px]">
                  {tooltipText}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Inline quick-note ─────────────────────────────────────────── */}
      {noteOpen && onNoteChange && (
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.50)' }} onClick={e => e.stopPropagation()}>
          <textarea
            ref={textareaRef}
            value={noteValue}
            onChange={e => setNoteValue(e.target.value)}
            onBlur={handleNoteBlur}
            onKeyDown={e => { if (e.key === 'Escape') { handleNoteBlur(); setNoteOpen(false); } }}
            placeholder="Add a note, blocker, or link…"
            rows={2}
            className="w-full resize-none text-xs text-[#222527]/80 placeholder:text-[#222527]/30 bg-transparent outline-none leading-relaxed"
          />
        </div>
      )}

      {/* ── Collapsed note preview (when closed but note exists) ─────── */}
      {!noteOpen && noteValue && (
        <div
          className="mt-2 pt-2 cursor-text"
          style={{ borderTop: '1px solid rgba(255,255,255,0.40)' }}
          onClick={e => { e.stopPropagation(); setNoteOpen(true); setTimeout(() => textareaRef.current?.focus(), 50); }}
        >
          <p className="text-xs text-[#222527]/50 line-clamp-2 leading-relaxed">{noteValue}</p>
        </div>
      )}
    </div>
  );
}
