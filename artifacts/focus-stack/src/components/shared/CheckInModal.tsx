import React, { useState, useEffect } from 'react';
import { CheckCircle2, ArrowRight, X, Moon, Flame, ChevronRight, AlertTriangle } from 'lucide-react';
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
  background: 'rgba(255,255,255,0.72)',
  backdropFilter: 'blur(28px)',
  WebkitBackdropFilter: 'blur(28px)',
  border: '1px solid rgba(255,255,255,0.75)',
  boxShadow: '0 24px 64px rgba(34,37,39,0.16)',
};

const GLASS_ITEM = {
  background: 'rgba(255,255,255,0.50)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.65)',
};

const REFLECTION_CHOICES = [
  { id: 'interrupted', label: 'Got interrupted' },
  { id: 'time', label: 'Ran out of time' },
  { id: 'unclear', label: 'Tasks felt unclear' },
  { id: 'energy', label: 'Low energy' },
  { id: 'shifted', label: 'Priorities shifted' },
  { id: 'smooth', label: 'Nothing — smooth day!' },
];

const TIME_BLOCKS = [
  { id: 'morning', label: 'Morning', sub: '6–10am' },
  { id: 'midday', label: 'Midday', sub: '10am–1pm' },
  { id: 'afternoon', label: 'Afternoon', sub: '1–5pm' },
  { id: 'evening', label: 'Evening', sub: '5pm+' },
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
  if (p.status === 'dropped') return 'drop';
  if (p.isCarryover) return 'carryover';
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
  if (deferredHighImpact >= 2) return `You deferred ${deferredHighImpact} high-impact tasks. Try tackling your hardest item first tomorrow.`;
  if (deferredHighImpact === 1) return 'You deferred 1 high-impact task. Starting your day with it tomorrow builds momentum.';
  if (total > 0 && doneCount === total) return "Perfect execution today. You're building real momentum — keep it going.";
  if (total > 0 && doneCount / total >= 0.75) return 'Strong day. Small planning refinements will get you to 100%.';
  if (doneCount === 0 && total > 0) return 'Rough day? That happens. Reflection like this is what separates consistent performers.';
  return 'Every check-in builds the habit. Tomorrow, start fresh with your top 3.';
}

export function CheckInModal({ isOpen, onClose, priorities, dayPlans, onSave }: CheckInModalProps) {
  const [step, setStep] = useState<'decisions' | 'reflection'>('decisions');
  const [actions, setActions] = useState<Record<string, Action>>({});
  const [schedules, setSchedules] = useState<Record<string, Schedule>>({});
  const [schedulingFor, setSchedulingFor] = useState<string | null>(null);
  const [reflectionChoice, setReflectionChoice] = useState<string | null>(null);
  const [reflectionText, setReflectionText] = useState('');

  const scheduleDays = getScheduleDays();

  useEffect(() => {
    if (isOpen) {
      setStep('decisions');
      setActions(Object.fromEntries(priorities.map(p => [p.id, defaultAction(p)])));
      setSchedules({});
      setSchedulingFor(null);
      setReflectionChoice(null);
      setReflectionText('');
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

  const doneCount = Object.values(actions).filter(a => a === 'done').length;
  const deferredCount = Object.values(actions).filter(a => a === 'carryover').length;
  const total = priorities.length;
  const allDecided = Object.values(actions).every(a => a !== null);

  const deferredHighImpact = priorities.filter(p =>
    actions[p.id] === 'carryover' && p.importanceScore >= 4
  ).length;

  const prevStreak = computeStreak(dayPlans);
  const todayStreak = prevStreak + 1;
  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const handleContinue = () => setStep('reflection');

  const handleCloseMyDay = () => {
    const updates: CheckInUpdate[] = Object.entries(actions).map(([id, action]) => ({
      id,
      action,
      ...(schedules[id]?.day ? { scheduledDay: schedules[id].day } : {}),
      ...(schedules[id]?.timeBlock ? { scheduledTimeBlock: schedules[id].timeBlock } : {}),
    }));
    const reflection: Reflection | undefined = reflectionChoice
      ? { choice: reflectionChoice, notes: reflectionText }
      : undefined;
    onSave(updates, reflection);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(34,37,39,0.28)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-3xl overflow-hidden flex flex-col"
        style={{ ...GLASS_PANEL, maxHeight: '92dvh' }}
      >
        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="px-6 pt-6 pb-3 flex items-start justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Moon className="h-4 w-4 text-[#222527]/50" />
              <p className="text-xs font-semibold uppercase tracking-widest text-[#222527]/40">EOD Check-In</p>
              {step === 'reflection' && (
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(107,143,110,0.15)', color: '#5a7d5d', border: '1px solid rgba(107,143,110,0.25)' }}
                >
                  Step 2 of 2
                </span>
              )}
            </div>
            <h2 className="text-xl font-semibold text-[#222527] tracking-tight">
              {step === 'decisions' ? 'How did today go?' : 'Reflect & close'}
            </h2>
            <p className="text-xs text-[#222527]/45 mt-0.5">{todayLabel}</p>
          </div>
          <button onClick={onClose} className="text-[#222527]/35 hover:text-[#222527]/70 transition-colors p-1 -mr-1 -mt-1">
            <X className="h-4 w-4" />
          </button>
        </div>

        {step === 'decisions' ? (
          <>
            {/* ── Progress bar ──────────────────────────────────────── */}
            <div className="px-6 pb-3 shrink-0">
              <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'rgba(34,37,39,0.10)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${total > 0 ? (doneCount / total) * 100 : 0}%`, background: '#6B8F6E' }}
                />
              </div>
              <p className="text-[11px] text-[#222527]/40 mt-1.5">{doneCount} of {total} marked done</p>
            </div>

            {/* ── Priority list ─────────────────────────────────────── */}
            <div className="overflow-y-auto flex-1 px-6 pb-2 space-y-2.5">
              {priorities.length === 0 && (
                <div className="py-6 text-center">
                  <p className="text-sm text-[#222527]/50">No priorities to review.</p>
                </div>
              )}

              {priorities.map(p => {
                const action = actions[p.id] ?? null;
                const sched = schedules[p.id];
                const isScheduling = schedulingFor === p.id;

                return (
                  <div key={p.id} className="rounded-2xl overflow-hidden" style={GLASS_ITEM}>
                    <div className="p-4">
                      <p className={cn(
                        'text-sm font-medium text-[#222527] leading-snug mb-3',
                        action === 'done' && 'line-through opacity-50',
                        action === 'drop' && 'opacity-40',
                      )}>
                        {p.title}
                      </p>

                      <div className="flex gap-2">
                        {/* Done */}
                        <button
                          onClick={() => { set(p.id, 'done'); setSchedulingFor(null); }}
                          className={cn('flex-1 h-9 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5',
                            action === 'done' ? 'text-white shadow-sm' : 'text-[#222527]/60 hover:text-[#222527]')}
                          style={action === 'done'
                            ? { background: '#222527' }
                            : { background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.70)' }}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Done
                        </button>

                        {/* Tomorrow */}
                        <button
                          onClick={() => handleTomorrow(p.id)}
                          className={cn('flex-1 h-9 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5',
                            action === 'carryover' ? 'text-white shadow-sm' : 'text-[#222527]/60 hover:text-[#222527]')}
                          style={action === 'carryover'
                            ? { background: '#6B8F6E' }
                            : { background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.70)' }}
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                          Tomorrow
                        </button>

                        {/* Drop */}
                        <button
                          onClick={() => { set(p.id, 'drop'); setSchedulingFor(null); }}
                          className={cn('h-9 w-9 rounded-xl text-xs font-semibold transition-all flex items-center justify-center shrink-0',
                            action === 'drop' ? 'shadow-sm' : 'text-[#222527]/40 hover:text-[#222527]/70')}
                          title="Drop this item"
                          style={action === 'drop'
                            ? { background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.30)', color: 'rgba(220,38,38,0.80)' }
                            : { background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.70)' }}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* ── Inline scheduling prompt ───────────────────── */}
                    {isScheduling && (
                      <div
                        className="px-4 pb-4 pt-0"
                        style={{ borderTop: '1px solid rgba(255,255,255,0.50)' }}
                      >
                        <p className="text-xs font-semibold text-[#222527]/60 pt-3 mb-2.5">
                          When specifically will you do this?
                        </p>

                        {/* Day options */}
                        <div className="flex flex-wrap gap-1.5 mb-2.5">
                          {scheduleDays.map(d => (
                            <button
                              key={d.value}
                              onClick={() => handleScheduleDay(p.id, d.value, d.label)}
                              className="h-7 px-3 rounded-full text-xs font-medium transition-all hover:opacity-80"
                              style={{ background: 'rgba(107,143,110,0.12)', color: '#5a7d5d', border: '1px solid rgba(107,143,110,0.22)' }}
                            >
                              {d.label}
                            </button>
                          ))}
                        </div>

                        {/* Time block options */}
                        <div className="flex gap-1.5 mb-3">
                          {TIME_BLOCKS.map(tb => (
                            <button
                              key={tb.id}
                              onClick={() => handleScheduleTimeBlock(p.id, tb.id)}
                              className="flex-1 py-1.5 rounded-xl text-center transition-all hover:opacity-80"
                              style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.70)' }}
                            >
                              <div className="text-[11px] font-semibold text-[#222527]/70">{tb.label}</div>
                              <div className="text-[10px] text-[#222527]/35">{tb.sub}</div>
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={() => handleSkipSchedule(p.id)}
                          className="text-[11px] text-[#222527]/35 hover:text-[#222527]/55 transition-colors"
                        >
                          Skip scheduling →
                        </button>
                      </div>
                    )}

                    {/* ── Post-selection badges ──────────────────────── */}
                    {!isScheduling && action === 'carryover' && sched && (
                      <div
                        className="px-4 pb-3"
                        style={{ borderTop: '1px solid rgba(255,255,255,0.45)' }}
                      >
                        {sched.skipped ? (
                          <div className="flex items-center gap-1.5 pt-2.5">
                            <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                            <p className="text-[11px] text-amber-700/70">
                              Unscheduled tasks are less likely to be completed
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
                              className="text-[11px] text-[#222527]/35 hover:text-[#222527]/60 transition-colors"
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

            {/* ── Footer step 1 ─────────────────────────────────────── */}
            <div className="px-6 pt-3 pb-6 shrink-0 flex flex-col gap-2">
              <button
                onClick={handleContinue}
                disabled={(!allDecided && total > 0) || schedulingFor !== null}
                className="w-full h-12 rounded-full text-sm font-semibold text-white transition-opacity flex items-center justify-center gap-2"
                style={{ background: (allDecided || total === 0) && !schedulingFor ? '#222527' : 'rgba(34,37,39,0.35)' }}
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </button>
              {!allDecided && total > 0 && !schedulingFor && (
                <p className="text-center text-[11px] text-[#222527]/35">Decide each task to continue</p>
              )}
              {schedulingFor && (
                <p className="text-center text-[11px] text-[#222527]/35">Schedule or skip the open task above</p>
              )}
              <button onClick={onClose} className="w-full h-9 rounded-full text-xs text-[#222527]/45 hover:text-[#222527]/70 transition-colors">
                Remind me later
              </button>
            </div>
          </>
        ) : (
          <div className="overflow-y-auto flex-1 flex flex-col">
            <div className="flex-1 px-6 pb-2 space-y-3">

              {/* ── Summary ─────────────────────────────────────────── */}
              <div className="rounded-2xl p-4 space-y-1.5" style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.70)' }}>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#222527]/40 mb-2">Summary</p>
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full flex items-center justify-center shrink-0" style={{ background: doneCount > 0 ? 'rgba(107,143,110,0.18)' : 'rgba(34,37,39,0.06)' }}>
                    <CheckCircle2 className="h-3.5 w-3.5" style={{ color: doneCount > 0 ? '#6B8F6E' : 'rgba(34,37,39,0.30)' }} />
                  </div>
                  <p className="text-sm text-[#222527]/80">
                    You completed <span className="font-semibold text-[#222527]">{doneCount}</span> of <span className="font-semibold text-[#222527]">{total}</span> {total === 1 ? 'priority' : 'priorities'}
                  </p>
                </div>
                {deferredCount > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full flex items-center justify-center shrink-0" style={{ background: deferredHighImpact > 0 ? 'rgba(245,158,11,0.12)' : 'rgba(34,37,39,0.06)' }}>
                      <ArrowRight className="h-3.5 w-3.5" style={{ color: deferredHighImpact > 0 ? 'rgba(180,120,0,0.75)' : 'rgba(34,37,39,0.30)' }} />
                    </div>
                    <p className="text-sm text-[#222527]/80">
                      You deferred <span className="font-semibold text-[#222527]">{deferredCount}</span>{' '}
                      {deferredHighImpact > 0 && <span className="text-amber-700/70">({deferredHighImpact} high-impact)</span>}
                      {' '}{deferredCount === 1 ? 'task' : 'tasks'}
                    </p>
                  </div>
                )}
              </div>

              {/* ── Streak ──────────────────────────────────────────── */}
              <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'rgba(255,240,200,0.55)', border: '1px solid rgba(245,200,80,0.30)' }}>
                <div className="h-10 w-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(245,158,11,0.15)' }}>
                  <Flame className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#222527]">
                    {todayStreak === 1 ? 'Check-in streak started!' : `${todayStreak} days of consistent check-ins`}
                  </p>
                  <p className="text-xs text-[#222527]/45 mt-0.5">
                    {todayStreak >= 7 ? 'Incredible consistency. Keep it up.' : todayStreak >= 3 ? "You're building a strong habit." : 'Every day counts. Keep going.'}
                  </p>
                </div>
              </div>

              {/* ── Reflection ──────────────────────────────────────── */}
              <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.70)' }}>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#222527]/40 mb-3">What got in the way today?</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {REFLECTION_CHOICES.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setReflectionChoice(prev => prev === c.id ? null : c.id)}
                      className="h-8 px-3 rounded-full text-xs font-medium transition-all"
                      style={reflectionChoice === c.id
                        ? { background: '#222527', color: '#fff', border: '1px solid #222527' }
                        : { background: 'rgba(255,255,255,0.60)', color: 'rgba(34,37,39,0.65)', border: '1px solid rgba(255,255,255,0.75)' }}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={reflectionText}
                  onChange={e => setReflectionText(e.target.value)}
                  placeholder="Anything else on your mind? (optional)"
                  rows={2}
                  className="w-full text-xs resize-none rounded-xl px-3 py-2.5 outline-none transition-all placeholder:text-[#222527]/30 text-[#222527]/70"
                  style={{ background: 'rgba(255,255,255,0.50)', border: '1px solid rgba(255,255,255,0.70)' }}
                />
              </div>

              {/* ── Micro-insight ───────────────────────────────────── */}
              <div className="rounded-2xl p-4 flex gap-3" style={{ background: 'rgba(220,230,215,0.45)', border: '1px solid rgba(107,143,110,0.22)' }}>
                <div className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(107,143,110,0.18)' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" style={{ color: '#6B8F6E' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#5a7d5d]/70 mb-1">Insight</p>
                  <p className="text-xs leading-relaxed text-[#222527]/65">{getMicroInsight(doneCount, total, deferredHighImpact)}</p>
                </div>
              </div>

            </div>

            {/* ── Footer step 2 ─────────────────────────────────────── */}
            <div className="px-6 pt-3 pb-6 shrink-0">
              <button
                onClick={handleCloseMyDay}
                className="w-full h-12 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-85"
                style={{ background: '#222527' }}
              >
                Close My Day
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
