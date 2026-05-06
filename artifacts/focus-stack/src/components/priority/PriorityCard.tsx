import React, { useState, useRef } from 'react';
import { PriorityCard as PriorityType } from '@/lib/store';
import { BucketBadge } from './BucketBadge';
import { RecommendationChip } from './RecommendationChip';
import {
  Clock, Calendar, CheckCircle2, Circle, MoreVertical, Play,
  ArrowUp, ArrowDown, RefreshCw, StickyNote, ChevronDown, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ── Tier visual config ─────────────────────────────────────────────────────────

interface TierConfig {
  bg: string;
  border: string;
  shadow: string;
  indicatorColor: string;
  indicatorWidth: number;
  contentPaddingLeft: string;
  padding: string;
  titleSize: string;
  titleWeight: string;
  titleOpacity: string;
}

function getTierConfig(
  bucket: PriorityType['bucket'],
  isCarryover: boolean,
  isCompleted: boolean,
): TierConfig {
  if (isCompleted) return {
    bg: 'rgba(255,255,255,0.24)',
    border: '1px solid rgba(255,255,255,0.40)',
    shadow: 'none',
    indicatorColor: 'rgba(34,37,39,0.14)',
    indicatorWidth: 3,
    contentPaddingLeft: 'pl-5',
    padding: 'pt-3.5 pr-4 pb-3.5',
    titleSize: 'text-sm',
    titleWeight: 'font-medium',
    titleOpacity: 'opacity-38',
  };

  if (isCarryover) return {
    bg: 'rgba(254,226,226,0.50)',
    border: '1px solid rgba(220,38,38,0.28)',
    shadow: '0 2px 12px rgba(220,38,38,0.08)',
    indicatorColor: 'rgba(220,38,38,0.80)',
    indicatorWidth: 4,
    contentPaddingLeft: 'pl-6',
    padding: 'pt-4 pr-4 pb-4',
    titleSize: 'text-sm',
    titleWeight: 'font-medium',
    titleOpacity: '',
  };

  if (bucket === 'must-do') return {
    bg: 'rgba(255,255,255,0.68)',
    border: '1.5px solid rgba(255,255,255,0.88)',
    shadow: '0 4px 24px rgba(34,37,39,0.10)',
    indicatorColor: 'rgba(34,37,39,0.92)',
    indicatorWidth: 4,
    contentPaddingLeft: 'pl-6',
    padding: 'pt-5 pr-5 pb-4',
    titleSize: 'text-base',
    titleWeight: 'font-semibold',
    titleOpacity: '',
  };

  if (bucket === 'should-do') return {
    bg: 'rgba(255,255,255,0.54)',
    border: '1px solid rgba(255,255,255,0.72)',
    shadow: '0 2px 12px rgba(34,37,39,0.06)',
    indicatorColor: 'rgba(107,143,110,0.88)',
    indicatorWidth: 3,
    contentPaddingLeft: 'pl-5',
    padding: 'pt-4 pr-4 pb-4',
    titleSize: 'text-sm',
    titleWeight: 'font-medium',
    titleOpacity: '',
  };

  // could-do
  return {
    bg: 'rgba(255,255,255,0.38)',
    border: '1px solid rgba(255,255,255,0.52)',
    shadow: 'none',
    indicatorColor: 'rgba(34,37,39,0.28)',
    indicatorWidth: 3,
    contentPaddingLeft: 'pl-5',
    padding: 'pt-4 pr-4 pb-4',
    titleSize: 'text-sm',
    titleWeight: 'font-normal',
    titleOpacity: 'opacity-75',
  };
}

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
  if (label === 'Must Do')   return { background: 'rgba(34,37,39,0.10)',    color: 'rgba(34,37,39,0.80)' };
  if (label === 'Schedule')  return { background: 'rgba(70,110,180,0.12)',  color: '#2a3e72' };
  if (label === 'Delegate')  return { background: 'rgba(194,130,0,0.13)',   color: '#6b4800' };
  return                            { background: 'rgba(180,50,50,0.10)',   color: 'rgba(150,35,35,0.78)' };
}

function MiniMatrix({ row, col }: { row: number; col: number }) {
  const S = 10; const G = 2; const T = 2 * S + G;
  return (
    <svg width={T} height={T} viewBox={`0 0 ${T} ${T}`} className="shrink-0">
      {([0, 1] as const).flatMap(r =>
        ([0, 1] as const).map(c => (
          <rect key={`${r}${c}`}
            x={c * (S + G)} y={r * (S + G)} width={S} height={S} rx={2}
            fill={r === row && c === col ? 'rgba(34,37,39,0.72)' : 'rgba(34,37,39,0.12)'}
          />
        ))
      )}
    </svg>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-[#222527]/55">{label}</span>
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="w-3 h-1.5 rounded-full"
            style={{ background: i < score ? 'rgba(34,37,39,0.65)' : 'rgba(34,37,39,0.13)' }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────

interface PriorityCardProps {
  priority: PriorityType;
  rank?: number;              // 1–3 for top-priority emphasis
  onClick?: () => void;
  onComplete?: () => void;
  onDefer?: () => void;
  onStartFocus?: () => void;
  onNoteChange?: (note: string) => void;
  onDismiss?: () => void;     // for carryover "Needs Attention" cards
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  showMoveControls?: boolean;
}

export function PriorityCard({
  priority,
  rank,
  onClick,
  onComplete,
  onDefer,
  onStartFocus,
  onNoteChange,
  onDismiss,
  onMoveUp,
  onMoveDown,
  showMoveControls,
}: PriorityCardProps) {
  const isCompleted = priority.status === 'completed';
  const isCarryover = !!priority.isCarryover && !isCompleted;

  const [noteOpen, setNoteOpen] = useState(false);
  const [noteValue, setNoteValue] = useState(priority.notes ?? '');
  const [whyOpen, setWhyOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const tier     = getTierConfig(priority.bucket, isCarryover, isCompleted);
  const quadrant = getQuadrant(priority.importanceScore, priority.urgencyScore);
  const isHighImportance = priority.importanceScore >= 4;
  const isHighUrgency    = priority.urgencyScore >= 4;
  const tooltipText = `${isHighImportance ? 'High' : 'Low'} importance · ${isHighUrgency ? 'High' : 'Low'} urgency`;

  React.useEffect(() => { setNoteValue(priority.notes ?? ''); }, [priority.notes]);

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

  // Extra elevation for top rank
  const rankShadow = rank === 1
    ? '0 6px 32px rgba(34,37,39,0.14), 0 0 0 1.5px rgba(34,37,39,0.10)'
    : tier.shadow;

  return (
    <div
      className={cn(
        'group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-200',
        isCompleted && 'opacity-55',
      )}
      style={{
        background: tier.bg,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: tier.border,
        boxShadow: rankShadow,
      }}
      onClick={onClick}
      data-testid={`priority-card-${priority.id}`}
    >
      {/* ── Left tier indicator ───────────────────────────────────── */}
      <div
        className="absolute left-0 top-0 bottom-0 rounded-l-sm"
        style={{ width: tier.indicatorWidth, background: tier.indicatorColor }}
      />

      {/* ── Main content ─────────────────────────────────────────── */}
      <div className={cn(tier.padding, tier.contentPaddingLeft)}>
        <div className="flex gap-3 items-start">

          {/* Reorder handles */}
          {showMoveControls && (
            <div
              className="flex flex-col justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 shrink-0"
              onClick={e => e.stopPropagation()}
            >
              <button onClick={onMoveUp} className="text-[#222527]/40 hover:text-[#222527]/75 p-0.5">
                <ArrowUp className="h-3 w-3" />
              </button>
              <button onClick={onMoveDown} className="text-[#222527]/40 hover:text-[#222527]/75 p-0.5">
                <ArrowDown className="h-3 w-3" />
              </button>
            </div>
          )}

          <div className="flex-1 min-w-0">

            {/* ── Chip row + rank badge ──────────────────────────── */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <BucketBadge bucket={priority.bucket} />
                {!isCompleted && priority.recommendationLabel && (
                  <RecommendationChip label={priority.recommendationLabel} />
                )}
                {isCarryover && (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                    style={{ background: 'rgba(220,38,38,0.16)', color: '#991b1b', border: '1px solid rgba(220,38,38,0.30)' }}
                  >
                    ⚠ Carryover
                  </span>
                )}
                {priority.recurrenceType && priority.recurrenceType !== 'none' && !isCompleted && (
                  <span
                    className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                    style={{ background: 'rgba(107,143,110,0.18)', color: '#2a4e2d', border: '1px solid rgba(107,143,110,0.32)' }}
                  >
                    <RefreshCw className="h-2.5 w-2.5" />
                    {priority.recurrenceType === 'daily' ? 'Daily' : 'Weekly'}
                  </span>
                )}
              </div>

              {/* Rank badge + menu */}
              <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                {rank && rank <= 3 && (
                  <span
                    className="text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={rank === 1
                      ? { background: '#222527', color: '#fff' }
                      : { background: 'rgba(34,37,39,0.12)', color: 'rgba(34,37,39,0.65)' }}
                    title={`Priority #${rank}`}
                  >
                    {rank}
                  </span>
                )}
                {onNoteChange && noteValue && (
                  <button
                    onClick={handleNoteToggle}
                    className="text-[#6B8F6E]/80 hover:text-[#6B8F6E] p-0.5 transition-colors"
                    title="Note"
                  >
                    <StickyNote className="h-3.5 w-3.5" />
                  </button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="text-[#222527]/30 hover:text-[#222527]/65 transition-colors p-0.5 opacity-0 group-hover:opacity-100">
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
              </div>
            </div>

            {/* ── Title ─────────────────────────────────────────── */}
            <h4
              className={cn(
                'leading-snug text-[#222527]',
                tier.titleSize,
                tier.titleWeight,
                tier.titleOpacity,
                isCompleted && 'line-through',
              )}
            >
              {priority.title}
            </h4>

            {/* ── Recommendation reason — always visible ─────────── */}
            {!isCompleted && priority.recommendationReason && (
              <p className="text-[11px] text-[#222527]/55 mt-1.5 leading-snug line-clamp-2">
                {priority.recommendationReason}
              </p>
            )}

            {/* ── Meta row ──────────────────────────────────────── */}
            <div className="flex items-center gap-2 flex-wrap mt-2">
              {priority.estimatedMinutes && (
                <div className="flex items-center gap-1 text-xs text-[#222527]/55">
                  <Clock className="h-3 w-3" />
                  <span>{priority.estimatedMinutes}m</span>
                </div>
              )}
              {priority.dueDate && (
                <div className="flex items-center gap-1 text-xs text-[#222527]/55">
                  <Calendar className="h-3 w-3" />
                  <span>{priority.dueDate}</span>
                </div>
              )}
              {!isCompleted && (
                <span
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                  style={quadrantStyle(quadrant.label)}
                >
                  {quadrant.label}
                </span>
              )}
            </div>

            {/* ── Progress bar ──────────────────────────────────── */}
            {priority.status === 'in-progress' && priority.progressPercent > 0 && priority.progressPercent < 100 && (
              <div className="mt-2.5 h-1 w-full rounded-full overflow-hidden" style={{ background: 'rgba(144,157,146,0.28)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${priority.progressPercent}%`, background: 'rgba(34,37,39,0.60)' }}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Inline note ───────────────────────────────────────────── */}
        {noteOpen && onNoteChange && (
          <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.52)' }} onClick={e => e.stopPropagation()}>
            <textarea
              ref={textareaRef}
              value={noteValue}
              onChange={e => setNoteValue(e.target.value)}
              onBlur={handleNoteBlur}
              onKeyDown={e => { if (e.key === 'Escape') { handleNoteBlur(); setNoteOpen(false); } }}
              placeholder="Add a note, blocker, or link…"
              rows={2}
              className="w-full resize-none text-xs text-[#222527]/80 placeholder:text-[#222527]/35 bg-transparent outline-none leading-relaxed"
            />
          </div>
        )}
        {!noteOpen && noteValue && onNoteChange && (
          <div
            className="mt-2 pt-2 cursor-text"
            style={{ borderTop: '1px solid rgba(255,255,255,0.45)' }}
            onClick={e => { e.stopPropagation(); setNoteOpen(true); setTimeout(() => textareaRef.current?.focus(), 50); }}
          >
            <p className="text-xs text-[#222527]/60 line-clamp-2 leading-relaxed">{noteValue}</p>
          </div>
        )}

        {/* ── Bottom action strip ───────────────────────────────────── */}
        {!isCompleted && (
          <div
            className="mt-3 pt-2.5 flex items-center justify-between gap-2"
            style={{ borderTop: '1px solid rgba(255,255,255,0.50)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Left: primary actions */}
            <div className="flex items-center gap-1.5">
              {onStartFocus && (
                <button
                  onClick={onStartFocus}
                  className="flex items-center gap-1.5 h-7 px-3 rounded-full text-[11px] font-semibold transition-all hover:opacity-85 active:scale-95"
                  style={priority.bucket === 'must-do'
                    ? { background: '#222527', color: '#fff' }
                    : { background: 'rgba(255,255,255,0.65)', color: 'rgba(34,37,39,0.70)', border: '1px solid rgba(255,255,255,0.80)' }}
                >
                  <Play className="h-3 w-3" />
                  Start Focus
                </button>
              )}
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="flex items-center gap-1 h-7 px-2.5 rounded-full text-[11px] font-medium text-[#222527]/45 hover:text-[#222527]/70 transition-all"
                  style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.72)' }}
                >
                  <X className="h-3 w-3" />
                  Dismiss
                </button>
              )}
            </div>

            {/* Right: Why this? + complete */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWhyOpen(w => !w)}
                className="flex items-center gap-0.5 text-[11px] text-[#222527]/45 hover:text-[#222527]/70 transition-colors"
              >
                <ChevronDown className={cn('h-3 w-3 transition-transform duration-200', whyOpen && 'rotate-180')} />
                Why this?
              </button>
              {onComplete && (
                <button
                  onClick={onComplete}
                  className="text-[#222527]/30 hover:text-[#222527]/70 transition-colors"
                  title="Mark complete"
                >
                  <Circle className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Completed state indicator */}
        {isCompleted && (
          <div className="flex items-center gap-1.5 mt-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#222527]/35" />
            <span className="text-xs text-[#222527]/35">Done</span>
          </div>
        )}

        {/* ── Why this? accordion ────────────────────────────────── */}
        {whyOpen && (
          <div className="mt-3 pt-2.5 flex items-start gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.45)' }}>
            <MiniMatrix row={quadrant.row} col={quadrant.col} />
            <div className="flex flex-col gap-2">
              <div className="flex gap-4">
                <ScoreBar label="Importance" score={priority.importanceScore} />
                <ScoreBar label="Urgency" score={priority.urgencyScore} />
              </div>
              <p className="text-[10px] text-[#222527]/50 leading-relaxed max-w-[230px]">{tooltipText}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
