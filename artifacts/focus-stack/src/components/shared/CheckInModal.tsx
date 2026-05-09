import React, { useState, useEffect } from 'react';
import { Check, CheckCircle2, ArrowRight, X, Moon, Flame, AlertTriangle, Lightbulb } from 'lucide-react';
import { PriorityCard as PriorityType, DayPlan } from '@/lib/store';
import { cn } from '@/lib/utils';

type Action = 'done' | 'carryover' | 'drop' | null;

interface Schedule {
  day?: string;
  dayLabel?: string;
  timeBlock?: string;
  skipped?: boolean;
}

export interface CheckInUpdate {
  id: string;
  action: Action;
  scheduledDay?: string;
  scheduledTimeBlock?: string;
}

interface Reflection {
  choice: string;
  notes: string;
}

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  priorities: PriorityType[];
  dayPlans: DayPlan[];
  onSave: (updates: CheckInUpdate[], reflection?: Reflection) => void;
}

const GLASS_PANEL = {
  background: 'rgba(255,255,255,0.76)',
  backdropFilter: 'blur(32px)',
  WebkitBackdropFilter: 'blur(32px)',
  border: '1px solid rgba(255,255,255,0.80)',
  boxShadow: '0 24px 64px rgba(34,37,39,0.18)',
};

const BUCKET_DOT: Record<string, string> = {
  'must-do':   '#222527',
  'should-do': '#6B8F6E',
  'could-do':  '#9BA89C',
};

const REFLECTION_CHOICES = [
  { id: 'interrupted', label: 'Got interrupted' },
  { id: 'time',        label: 'Ran out of time' },
  { id: 'unclear',     label: 'Activities felt unclear' },
  { id: 'energy',      label: 'Low energy' },
  { id: 'shifted',     label: 'Priorities shifted' },
  { id: 'smooth',      label: 'Smooth day ✓' },
];

const TIME_BLOCKS = [
  { id: 'morning',   label: 'Morning',   sub: '6–10am' },
  { id: 'midday',    label: 'Midday',    sub: '10–1pm' },
  { id: 'afternoon', label: 'Afternoon', sub: '1–5pm' },
  { id: 'evening',   label: 'Evening',   sub: '5pm+' },
];

function getScheduleDays(): { label: string; value: string }[] {
  const days: { label: string; value: string }[] = [];
  const d = new Date();
  for (let i = 1; i <= 5; i++) {
    d.setDate(d.getDate() + 1);
    const iso = d.toISOString().split('T')[0];
    const label = i === 1
      ? 'Tomorrow'
      : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    days.push({ label, value: iso });
  }
  return days;
}

function defaultAction(p: PriorityType): Action {
  if (p.status === 'completed') return 'done';
  if (p.status === 'dropped')   return 'drop';
  if (p.isCarryover)            return 'carryover';
  return null;
}

function computeStreak(dayPlans: DayPlan[] | undefined): number {
  if (!dayPlans) return 0;
  const checked = new Set(dayPlans.filter(dp => dp.checkInCompleted).map(dp => dp.date));
  let streak = 0;
  const d = new Date();
  d.setDate(d.getDate() - 1);
  for (let i = 0; i < 365; i++) {
    const iso = d.toISOString().split('T')[0];
    if (checked.has(iso)) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }
  return streak;
}

function getMicroInsight(doneCount: number, total: number, deferredHighImpact: number): string {
  if (deferredHighImpact >= 2)      return `${deferredHighImpact} high-impact activities moved to tomorrow. Tackle the hardest one first.`;
  if (deferredHighImpact === 1)     return 'One high-impact activity moved forward. Starting your day with it builds momentum.';
  if (total > 0 && doneCount === total) return 'Perfect execution. You\'re building real momentum — keep it going.';
  if (total > 0 && doneCount / total >= 0.75) return 'Strong day. Small planning tweaks will get you to 100%.';
  if (doneCount === 0 && total > 0) return 'Rough day? That happens. Reflection like this is what consistent people do.';
  return 'Every check-in builds the habit. Tomorrow, start with your top 3.';
}

export function CheckInModal({ isOpen, onClose, priorities, dayPlans, onSave }: CheckInModalProps) {
  const [step,             setStep]             = useState<'decisions' | 'reflection'>('decisions');
  const [actions,          setActions]          = useState<Record<string, Action>>({});
  const [schedules,        setSchedules]        = useState<Record<string, Schedule>>({});
  const [schedulingFor,    setSchedulingFor]    = useState<string | null>(null);
  const [reflectionChoice, setReflectionChoice] = useState<string | null>(null);

  const scheduleDays = getScheduleDays();

  useEffect(() => {
    if (isOpen) {
      setStep('decisions');
      setActions(Object.fromEntries(priorities.map(p => [p.id, defaultAction(p)])));
      setSchedules({});
      setSchedulingFor(null);
      setReflectionChoice(null);
    }
  }, [isOpen, priorities]);

  if (!isOpen) return null;

  const set = (id: string, action: Action) =>
    setActions(prev => ({ ...prev, [id]: prev[id] === action ? null : action }));

  const handleTomorrow = (id: string) => {
    if (actions[id] === 'carryover') {
      setActions(prev => ({ ...prev, [id]: null }));
      setSchedulingFor(null);
      setSchedules(prev => { const n = { ...prev }; delete n[id]; return n; });
    } else {
      setActions(prev => ({ ...prev, [id]: 'carryover' }));
      setSchedulingFor(id);
    }
  };

  const handleScheduleDay = (id: string, value: string, label: string) => {
    setSchedules(prev => ({ ...prev, [id]: { ...prev[id], day: value, dayLabel: label, skipped: false } }));
    setSchedulingFor(null);
  };

  const handleScheduleTimeBlock = (id: string, timeBlock: string) => {
    setSchedules(prev => ({ ...prev, [id]: { ...prev[id], timeBlock, skipped: false } }));
    setSchedulingFor(null);
  };

  const handleSkipSchedule = (id: string) => {
    setSchedules(prev => ({ ...prev, [id]: { skipped: true } }));
    setSchedulingFor(null);
  };

  const doneCount     = Object.values(actions).filter(a => a === 'done').length;
  const deferredCount = Object.values(actions).filter(a => a === 'carryover').length;
  const dropCount     = Object.values(actions).filter(a => a === 'drop').length;
  const total         = priorities.length;
  const allDecided    = total === 0 || Object.values(actions).every(a => a !== null);

  const deferredHighImpact = priorities.filter(p =>
    actions[p.id] === 'carryover' && p.importanceScore >= 4
  ).length;

  const prevStreak  = computeStreak(dayPlans);
  const todayStreak = prevStreak + 1;
  const todayLabel  = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const handleCloseMyDay = () => {
    const updates: CheckInUpdate[] = Object.entries(actions).map(([id, action]) => ({
      id,
      action,
      ...(schedules[id]?.day       ? { scheduledDay:       schedules[id].day }       : {}),
      ...(schedules[id]?.timeBlock ? { scheduledTimeBlock: schedules[id].timeBlock } : {}),
    }));
    const reflection: Reflection | undefined = reflectionChoice
      ? { choice: reflectionChoice, notes: '' }
      : undefined;
    onSave(updates, reflection);
    onClose();
  };

  /* ── shared header ────────────────────────────────────────────────────── */
  const Header = (
    <div className="px-5 pt-5 pb-0 flex items-start justify-between shrink-0">
      <div className="flex items-center gap-2">
        <div
          className="h-7 w-7 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(34,37,39,0.08)' }}
        >
          <Moon className="h-3.5 w-3.5 text-[#222527]/60" />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#222527]/40">EOD Check-In</p>
          <p className="text-[11px] text-[#222527]/35 leading-none mt-0.5">{todayLabel}</p>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        {/* Step dots */}
        <div className="flex items-center gap-1">
          <span className="h-1.5 w-4 rounded-full" style={{ background: '#222527' }} />
          <span className="h-1.5 w-1.5 rounded-full transition-all" style={{ background: step === 'reflection' ? '#222527' : 'rgba(34,37,39,0.18)' }} />
        </div>
        <button
          onClick={onClose}
          className="h-7 w-7 rounded-xl flex items-center justify-center text-[#222527]/35 hover:text-[#222527]/70 transition-colors"
          style={{ background: 'rgba(34,37,39,0.06)' }}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );

  /* ─────────────────────────────────────────────────────────────────────── */
  /* STEP 1: DECISIONS                                                        */
  /* ─────────────────────────────────────────────────────────────────────── */
  if (step === 'decisions') {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
        style={{ background: 'rgba(34,37,39,0.30)', backdropFilter: 'blur(6px)' }}
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <div className="w-full max-w-md rounded-3xl overflow-hidden flex flex-col" style={{ ...GLASS_PANEL, maxHeight: '90dvh' }}>

          {Header}

          {/* Title + per-task progress ───────────────────────────────────── */}
          <div className="px-5 pt-3 pb-4 shrink-0">
            <h2 className="text-xl font-semibold text-[#222527] tracking-tight mb-3">
              How did today go?
            </h2>

            {/* Per-task segment bar */}
            {total > 0 && (
              <>
                <div className="flex items-center gap-1 mb-1.5">
                  {priorities.map(p => {
                    const a = actions[p.id];
                    return (
                      <div
                        key={p.id}
                        className="h-1.5 flex-1 rounded-full transition-all duration-300"
                        style={{
                          background:
                            a === 'done'     ? '#222527' :
                            a === 'carryover'? '#6B8F6E' :
                            a === 'drop'     ? 'rgba(239,68,68,0.45)' :
                            'rgba(34,37,39,0.12)',
                        }}
                      />
                    );
                  })}
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  {doneCount > 0 && <span className="font-semibold text-[#222527]">{doneCount} done</span>}
                  {deferredCount > 0 && <span className="font-semibold text-[#6B8F6E]">{deferredCount} tomorrow</span>}
                  {dropCount > 0 && <span className="font-semibold text-red-400/75">{dropCount} dropped</span>}
                  {!allDecided && <span className="text-[#222527]/35">{total - doneCount - deferredCount - dropCount} to decide</span>}
                  {allDecided && total > 0 && <span className="font-semibold text-[#5a7d5d]">All decided ✓</span>}
                </div>
              </>
            )}
          </div>

          {/* Task list ────────────────────────────────────────────────────── */}
          <div className="overflow-y-auto flex-1 px-5 pb-2 space-y-2">
            {priorities.length === 0 && (
              <div className="py-8 text-center">
                <p className="text-sm text-[#222527]/45">No priorities to review.</p>
              </div>
            )}

            {priorities.map(p => {
              const action    = actions[p.id] ?? null;
              const sched     = schedules[p.id];
              const isScheduling = schedulingFor === p.id;

              const rowBg =
                action === 'done'      ? 'rgba(34,37,39,0.05)'  :
                action === 'carryover' ? 'rgba(107,143,110,0.07)' :
                action === 'drop'      ? 'rgba(239,68,68,0.05)' :
                'rgba(255,255,255,0.52)';

              return (
                <div
                  key={p.id}
                  className="rounded-2xl overflow-hidden transition-colors duration-200"
                  style={{ background: rowBg, border: '1px solid rgba(255,255,255,0.68)' }}
                >
                  {/* Main row */}
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    {/* Bucket dot */}
                    <span
                      className="shrink-0 h-2 w-2 rounded-full mt-px"
                      style={{ background: BUCKET_DOT[p.bucket] ?? '#9BA89C', opacity: action === 'drop' ? 0.3 : 1 }}
                    />

                    {/* Title */}
                    <p className={cn(
                      'flex-1 min-w-0 text-sm font-medium text-[#222527] leading-snug transition-all duration-200 truncate',
                      action === 'done' && 'line-through opacity-35',
                      action === 'drop' && 'line-through opacity-25',
                    )}>
                      {p.title}
                    </p>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Done */}
                      <button
                        onClick={() => { set(p.id, 'done'); setSchedulingFor(null); }}
                        title="Done"
                        className="h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-95"
                        style={action === 'done'
                          ? { background: '#222527', color: '#fff', boxShadow: '0 2px 8px rgba(34,37,39,0.22)' }
                          : { background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.80)', color: 'rgba(34,37,39,0.38)' }}
                      >
                        <Check className="h-4 w-4" />
                      </button>

                      {/* Tomorrow */}
                      <button
                        onClick={() => handleTomorrow(p.id)}
                        title="Move to tomorrow"
                        className="h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-95"
                        style={action === 'carryover'
                          ? { background: '#6B8F6E', color: '#fff', boxShadow: '0 2px 8px rgba(107,143,110,0.28)' }
                          : { background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.80)', color: 'rgba(34,37,39,0.38)' }}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </button>

                      {/* Drop */}
                      <button
                        onClick={() => { set(p.id, 'drop'); setSchedulingFor(null); }}
                        title="Drop this activity"
                        className="h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-95"
                        style={action === 'drop'
                          ? { background: 'rgba(239,68,68,0.14)', border: '1px solid rgba(239,68,68,0.32)', color: 'rgba(220,38,38,0.80)' }
                          : { background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.80)', color: 'rgba(34,37,39,0.38)' }}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Scheduling prompt (accordion) */}
                  {isScheduling && (
                    <div className="px-4 pb-4 pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.55)' }}>
                      <p className="text-[11px] font-semibold text-[#222527]/50 pt-2 mb-2.5">
                        When will you do this?
                      </p>

                      {/* Day chips */}
                      <div className="flex flex-wrap gap-1.5 mb-2.5">
                        {scheduleDays.map(d => (
                          <button
                            key={d.value}
                            onClick={() => handleScheduleDay(p.id, d.value, d.label)}
                            className="h-7 px-3 rounded-full text-[11px] font-semibold transition-all hover:opacity-80"
                            style={{ background: 'rgba(107,143,110,0.13)', color: '#5a7d5d', border: '1px solid rgba(107,143,110,0.22)' }}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>

                      {/* Time block grid */}
                      <div className="grid grid-cols-4 gap-1.5 mb-3">
                        {TIME_BLOCKS.map(tb => (
                          <button
                            key={tb.id}
                            onClick={() => handleScheduleTimeBlock(p.id, tb.id)}
                            className="py-2 rounded-xl text-center transition-all hover:opacity-80"
                            style={{ background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.80)' }}
                          >
                            <div className="text-[11px] font-semibold text-[#222527]/65">{tb.label}</div>
                            <div className="text-[9px] text-[#222527]/32">{tb.sub}</div>
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => handleSkipSchedule(p.id)}
                        className="text-[11px] text-[#222527]/30 hover:text-[#222527]/55 transition-colors"
                      >
                        Skip scheduling →
                      </button>
                    </div>
                  )}

                  {/* Schedule badges */}
                  {!isScheduling && action === 'carryover' && sched && (
                    <div className="px-4 pb-3" style={{ borderTop: '1px solid rgba(255,255,255,0.55)' }}>
                      {sched.skipped ? (
                        <div className="flex items-center gap-1.5 pt-2.5">
                          <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                          <p className="text-[11px] text-amber-700/65">
                            Unscheduled activities are less likely to be completed
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 pt-2.5 flex-wrap">
                          {sched.dayLabel && (
                            <span
                              className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full text-[11px] font-medium"
                              style={{ background: 'rgba(107,143,110,0.14)', color: '#5a7d5d', border: '1px solid rgba(107,143,110,0.22)' }}
                            >
                              📅 {sched.dayLabel}
                            </span>
                          )}
                          {sched.timeBlock && (
                            <span
                              className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full text-[11px] font-medium"
                              style={{ background: 'rgba(107,143,110,0.14)', color: '#5a7d5d', border: '1px solid rgba(107,143,110,0.22)' }}
                            >
                              🕐 {TIME_BLOCKS.find(t => t.id === sched.timeBlock)?.label}
                            </span>
                          )}
                          <button
                            onClick={() => setSchedulingFor(p.id)}
                            className="text-[11px] text-[#222527]/30 hover:text-[#222527]/55 transition-colors"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer ─────────────────────────────────────────────────────── */}
          <div className="px-5 pt-3 pb-5 shrink-0">
            {schedulingFor ? (
              <p className="text-center text-[11px] text-[#222527]/35 mb-2.5">
                Schedule or skip the open activity above
              </p>
            ) : !allDecided && total > 0 ? (
              <p className="text-center text-[11px] text-[#222527]/35 mb-2.5">
                Decide each activity to continue
              </p>
            ) : null}

            <button
              onClick={() => setStep('reflection')}
              disabled={(!allDecided && total > 0) || schedulingFor !== null}
              className="w-full h-12 rounded-2xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              style={{
                background: allDecided && !schedulingFor ? '#222527' : 'rgba(34,37,39,0.25)',
                boxShadow: allDecided && !schedulingFor ? '0 4px 20px rgba(34,37,39,0.20)' : 'none',
              }}
            >
              Continue
            </button>

            <button
              onClick={onClose}
              className="w-full mt-2 h-9 text-xs text-[#222527]/35 hover:text-[#222527]/60 transition-colors"
            >
              Remind me later
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  /* STEP 2: REFLECT & CLOSE                                                 */
  /* ─────────────────────────────────────────────────────────────────────── */
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(34,37,39,0.30)', backdropFilter: 'blur(6px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-3xl overflow-hidden flex flex-col" style={{ ...GLASS_PANEL, maxHeight: '90dvh' }}>

        {Header}

        {/* Achievement banner ────────────────────────────────────────────── */}
        <div
          className="mx-5 mt-4 mb-0 rounded-2xl px-4 py-4 shrink-0"
          style={{ background: 'rgba(107,143,110,0.12)', border: '1px solid rgba(107,143,110,0.22)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#5a7d5d]/65 mb-1">Day complete</p>
              <p className="text-2xl font-light text-[#222527] tracking-tight leading-none">
                {doneCount}
                <span className="text-base text-[#222527]/40 ml-1.5">of {total} done</span>
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                {deferredCount > 0 && (
                  <span className="text-[11px] font-medium text-[#6B8F6E]">{deferredCount} moving forward</span>
                )}
                {dropCount > 0 && (
                  <span className="text-[11px] text-[#222527]/35">{dropCount} dropped</span>
                )}
              </div>
            </div>
            {/* Streak */}
            <div
              className="flex flex-col items-center justify-center h-14 w-14 rounded-2xl shrink-0"
              style={{ background: 'rgba(245,158,11,0.13)', border: '1px solid rgba(245,158,11,0.25)' }}
            >
              <Flame className="h-5 w-5 text-amber-500" />
              <span className="text-sm font-bold text-amber-600 leading-none mt-0.5">{todayStreak}</span>
              <span className="text-[9px] text-amber-600/60 font-medium mt-0.5">
                {todayStreak === 1 ? 'day' : 'days'}
              </span>
            </div>
          </div>
          {todayStreak >= 3 && (
            <p className="text-xs text-[#5a7d5d]/70 mt-2.5 leading-snug">
              {todayStreak >= 7 ? 'Exceptional streak. You\'re building something real.' :
               todayStreak >= 3 ? 'A solid habit is forming — keep showing up.' :
               'Every check-in counts.'}
            </p>
          )}
        </div>

        {/* Scrollable body ───────────────────────────────────────────────── */}
        <div className="overflow-y-auto flex-1 px-5 pt-4 pb-2 space-y-3">

          {/* Micro-insight */}
          <div
            className="rounded-2xl px-4 py-3.5 flex gap-3 items-start"
            style={{ background: 'rgba(220,230,215,0.50)', border: '1px solid rgba(107,143,110,0.20)' }}
          >
            <div
              className="h-7 w-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: 'rgba(107,143,110,0.18)' }}
            >
              <Lightbulb className="h-3.5 w-3.5 text-[#6B8F6E]" />
            </div>
            <p className="text-sm leading-relaxed text-[#222527]/70">
              {getMicroInsight(doneCount, total, deferredHighImpact)}
            </p>
          </div>

          {/* Reflection */}
          <div
            className="rounded-2xl px-4 py-4"
            style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.72)' }}
          >
            <p className="text-xs font-semibold text-[#222527]/50 mb-3">What got in the way today?</p>
            <div className="flex flex-wrap gap-2">
              {REFLECTION_CHOICES.map(c => (
                <button
                  key={c.id}
                  onClick={() => setReflectionChoice(prev => prev === c.id ? null : c.id)}
                  className="h-8 px-3.5 rounded-full text-xs font-medium transition-all duration-150 active:scale-95"
                  style={reflectionChoice === c.id
                    ? { background: '#222527', color: '#fff' }
                    : { background: 'rgba(255,255,255,0.70)', color: 'rgba(34,37,39,0.60)', border: '1px solid rgba(255,255,255,0.85)' }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer ─────────────────────────────────────────────────────────── */}
        <div className="px-5 pt-3 pb-5 shrink-0">
          <button
            onClick={handleCloseMyDay}
            className="w-full h-12 rounded-2xl text-sm font-semibold text-white flex items-center justify-center gap-2.5 transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: '#222527', boxShadow: '0 4px 20px rgba(34,37,39,0.20)' }}
          >
            <CheckCircle2 className="h-4 w-4" />
            Close My Day
          </button>
        </div>
      </div>
    </div>
  );
}
