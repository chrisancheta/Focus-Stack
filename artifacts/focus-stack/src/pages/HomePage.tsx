import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Play, Pause, X, ArrowRight } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAppStore } from '@/lib/storeContext';
import { useTimer } from '@/lib/timerContext';
import { PriorityCard } from '@/components/priority/PriorityCard';
import { QuickAddInput } from '@/components/priority/QuickAddInput';
import { PriorityDetailModal } from '@/components/priority/PriorityDetailModal';
import { CheckInModal } from '@/components/shared/CheckInModal';
import { CollapsibleSection } from '@/components/shared/CollapsibleSection';
import { SuggestMyDayModal } from '@/components/shared/SuggestMyDayModal';
import { generateId, getTodayISODate } from '@/lib/utils';
import { DayPlan } from '@/lib/store';
import { findSimilar } from '@/lib/similarity';
import type { SimilarMatch } from '@/lib/similarity';

const PLACEHOLDER_EXAMPLES = [
  "What's on your mind today?",
  'Build-a-thon submission by 12a ET',
  "What feels urgent but maybe isn't?",
  'Work on MBA capstone project today',
  'What would make today successful?',
  'Research AI-powered PM tools this week',
];

const GLASS = {
  background: 'rgba(255,255,255,0.55)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.72)',
  boxShadow: '0 2px 16px rgba(34,37,39,0.07)',
};

const GLASS_SUBTLE = {
  background: 'rgba(255,255,255,0.38)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.52)',
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function getRecurringIdsForToday(priorities: ReturnType<typeof useAppStore>['state']['priorities'], today: string): string[] {
  const todayDow = new Date(today + 'T12:00:00').getDay();
  return priorities
    .filter(p => {
      if (p.status === 'dropped') return false;
      if (p.recurrenceType === 'daily') return true;
      if (p.recurrenceType === 'weekly') {
        return new Date(p.createdAt).getDay() === todayDow;
      }
      return false;
    })
    .map(p => p.id);
}

export default function HomePage() {
  const { state, addPriority, updatePriority, deletePriority, addDayPlan, updateDayPlan } = useAppStore();
  const { linkPriority, toggle, isRunning, timeLeft, isDone } = useTimer();
  const [, setLocation] = useLocation();
  const [selectedPriorityId, setSelectedPriorityId] = useState<string | null>(null);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [autoStartPomodoro, setAutoStartPomodoro] = useState(true);
  const [pendingAdd, setPendingAdd] = useState<{ title: string; match: SimilarMatch } | null>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setPlaceholderIdx(i => (i + 1) % PLACEHOLDER_EXAMPLES.length);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const today = getTodayISODate();
  const todayPlan = state.dayPlans.find(dp => dp.date === today);
  const priorities = state.priorities;

  const injectedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!todayPlan) return;
    const recurringIds = getRecurringIdsForToday(state.priorities, today);
    const current = new Set(todayPlan.selectedPriorityIds);
    const missing = recurringIds.filter(id => {
      if (current.has(id)) return false;
      const key = `${todayPlan.id}:${id}`;
      if (injectedRef.current.has(key)) return false;
      return true;
    });
    if (missing.length > 0) {
      missing.forEach(id => injectedRef.current.add(`${todayPlan.id}:${id}`));
      updateDayPlan(todayPlan.id, {
        selectedPriorityIds: [...todayPlan.selectedPriorityIds, ...missing],
        zeroPriorityDay: false,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today, todayPlan?.id, state.priorities]);

  const carryoverPriorities = priorities.filter(p => p.isCarryover && p.status !== 'completed');

  const selectedPriorities = todayPlan
    ? priorities.filter(p => todayPlan.selectedPriorityIds.includes(p.id))
    : carryoverPriorities;

  const candidatePriorities = todayPlan
    ? priorities.filter(p => todayPlan.candidatePriorityIds.includes(p.id))
    : [];

  const completedPriorities = todayPlan
    ? priorities.filter(p => todayPlan.completedPriorityIds.includes(p.id))
    : [];

  const activePriorities = selectedPriorities.filter(p => p.status !== 'completed');
  const mustDoPriorities = activePriorities.filter(p => p.bucket === 'must-do');
  const topPriority = mustDoPriorities[0] ?? activePriorities[0] ?? null;
  const nextPriority = activePriorities[1] ?? null;

  const doAdd = (title: string) => {
    const newPriority = {
      id: generateId(),
      title,
      bucket: 'should-do' as const,
      recommendationLabel: 'schedule' as const,
      recommendationReason: 'Added just now',
      status: 'not-started' as const,
      progressPercent: 0 as const,
      importanceScore: 3 as const,
      urgencyScore: 3 as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addPriority(newPriority);
    if (todayPlan) {
      updateDayPlan(todayPlan.id, {
        selectedPriorityIds: [...todayPlan.selectedPriorityIds, newPriority.id],
        zeroPriorityDay: false,
      });
    } else {
      const recurringIds = getRecurringIdsForToday(state.priorities, today);
      const allIds = Array.from(new Set([...recurringIds, newPriority.id]));
      allIds.forEach(id => injectedRef.current.add(`${generateId()}:${id}`));
      const newPlan: DayPlan = {
        id: generateId(),
        date: today,
        weekStartDay: state.settings?.weekStartDay ?? 1,
        selectedPriorityIds: allIds,
        candidatePriorityIds: [],
        completedPriorityIds: [],
        checkInCompleted: false,
        zeroPriorityDay: false,
      };
      addDayPlan(newPlan);
    }
  };

  const handleQuickAdd = (title: string) => {
    const match = findSimilar(
      title,
      priorities.filter(p => p.status !== 'completed' && p.status !== 'dropped'),
    );
    if (match) {
      setPendingAdd({ title, match });
    } else {
      doAdd(title);
    }
  };

  const handleDedupCombine = () => { setPendingAdd(null); };
  const handleDedupKeepBoth = () => { if (pendingAdd) doAdd(pendingAdd.title); setPendingAdd(null); };

  const handleSuggestMyDay = ({ must, stress, nagging }: { must: string; stress: string; nagging: string }) => {
    const now = new Date().toISOString();
    const parse = (text: string) =>
      text.split('\n').map(l => l.trim().replace(/^[-•*]\s*/, '')).filter(s => s.length > 2);

    const newPriorities = [
      ...parse(must).map(title => ({
        id: generateId(), title,
        bucket: 'must-do' as const,
        recommendationLabel: 'do-now' as const,
        recommendationReason: 'Must get done today',
        status: 'not-started' as const,
        progressPercent: 0 as const,
        importanceScore: 5 as const,
        urgencyScore: 5 as const,
        createdAt: now, updatedAt: now,
      })),
      ...parse(stress).map(title => ({
        id: generateId(), title,
        bucket: 'must-do' as const,
        recommendationLabel: 'do-now' as const,
        recommendationReason: 'Flagged as stressful',
        status: 'not-started' as const,
        progressPercent: 0 as const,
        importanceScore: 4 as const,
        urgencyScore: 5 as const,
        createdAt: now, updatedAt: now,
      })),
      ...parse(nagging).map(title => ({
        id: generateId(), title,
        bucket: 'could-do' as const,
        recommendationLabel: 'schedule' as const,
        recommendationReason: 'On your mind but not urgent today',
        status: 'not-started' as const,
        progressPercent: 0 as const,
        importanceScore: 3 as const,
        urgencyScore: 2 as const,
        createdAt: now, updatedAt: now,
      })),
    ];

    if (newPriorities.length === 0) return;
    newPriorities.forEach(p => addPriority(p));
    const newIds = newPriorities.map(p => p.id);

    if (todayPlan) {
      updateDayPlan(todayPlan.id, {
        selectedPriorityIds: [...todayPlan.selectedPriorityIds, ...newIds],
        zeroPriorityDay: false,
      });
    } else {
      const recurringIds = getRecurringIdsForToday(state.priorities, today);
      const allIds = Array.from(new Set([...recurringIds, ...newIds]));
      addDayPlan({
        id: generateId(),
        date: today,
        weekStartDay: state.settings?.weekStartDay ?? 1,
        selectedPriorityIds: allIds,
        candidatePriorityIds: [],
        completedPriorityIds: [],
        checkInCompleted: false,
        zeroPriorityDay: false,
      });
    }
  };

  const handleComplete = (id: string) => updatePriority(id, { status: 'completed', progressPercent: 100 });

  const handleStartFocus = (id: string) => {
    linkPriority(id);
    setLocation('/focus');
  };

  const handleKeepOpen = () => {
    const recurringIds = getRecurringIdsForToday(state.priorities, today);
    if (todayPlan) {
      updateDayPlan(todayPlan.id, { zeroPriorityDay: true });
    } else {
      const planId = generateId();
      recurringIds.forEach(id => injectedRef.current.add(`${planId}:${id}`));
      addDayPlan({
        id: planId,
        date: today,
        weekStartDay: state.settings?.weekStartDay ?? 1,
        selectedPriorityIds: recurringIds,
        candidatePriorityIds: [],
        completedPriorityIds: [],
        checkInCompleted: false,
        zeroPriorityDay: true,
      });
    }
  };

  const handleCancelZeroDay = () => {
    if (todayPlan) updateDayPlan(todayPlan.id, { zeroPriorityDay: false });
  };

  const handleCheckInSave = (
    updates: { id: string; action: 'done' | 'carryover' | 'drop' | null; scheduledDay?: string; scheduledTimeBlock?: string }[],
    reflection?: { choice: string; notes: string },
  ) => {
    const newCompletedIds: string[] = [];
    updates.forEach(({ id, action, scheduledDay }) => {
      if (action === 'done') {
        updatePriority(id, { status: 'completed', progressPercent: 100, isCarryover: false });
        newCompletedIds.push(id);
      } else if (action === 'carryover') {
        updatePriority(id, { isCarryover: true, ...(scheduledDay ? { dueDate: scheduledDay } : {}) });
      } else if (action === 'drop') {
        updatePriority(id, { status: 'dropped', isCarryover: false });
      }
    });
    if (todayPlan) {
      const merged = Array.from(new Set([...todayPlan.completedPriorityIds, ...newCompletedIds]));
      updateDayPlan(todayPlan.id, {
        checkInCompleted: true,
        checkInCompletedAt: new Date().toISOString(),
        completedPriorityIds: merged,
        ...(reflection ? { reflectionChoice: reflection.choice, reflectionNotes: reflection.notes } : {}),
      });
    }
  };

  const handleMoveUp = (id: string) => {
    if (!todayPlan) return;
    const ids = [...todayPlan.selectedPriorityIds];
    const i = ids.indexOf(id);
    if (i > 0) { [ids[i - 1], ids[i]] = [ids[i], ids[i - 1]]; updateDayPlan(todayPlan.id, { selectedPriorityIds: ids }); }
  };

  const handleMoveDown = (id: string) => {
    if (!todayPlan) return;
    const ids = [...todayPlan.selectedPriorityIds];
    const i = ids.indexOf(id);
    if (i < ids.length - 1) { [ids[i + 1], ids[i]] = [ids[i], ids[i + 1]]; updateDayPlan(todayPlan.id, { selectedPriorityIds: ids }); }
  };

  const dismissCarryover = (id: string) => updatePriority(id, { isCarryover: false });

  const handleStartMyDay = () => {
    if (topPriority) {
      linkPriority(topPriority.id);
      if (autoStartPomodoro && !isRunning) toggle();
    }
    setFocusMode(true);
  };

  const handleExitFocusMode = () => setFocusMode(false);

  const handleClearCompleted = () => {
    if (!todayPlan) return;
    const completedSet = new Set(todayPlan.completedPriorityIds);
    updateDayPlan(todayPlan.id, {
      selectedPriorityIds: todayPlan.selectedPriorityIds.filter(id => !completedSet.has(id)),
      completedPriorityIds: [],
    });
  };

  const isZeroDay = !!(todayPlan?.zeroPriorityDay && todayPlan.selectedPriorityIds.length === 0);
  const isEmpty = !isZeroDay && (!todayPlan || todayPlan.selectedPriorityIds.length === 0);

  return (
    <div className="space-y-4">

      {/* ── Floating focus widget ────────────────────────────────────────────── */}
      {focusMode && topPriority && (
        <div
          className="fixed bottom-6 right-6 z-50 w-80 rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            border: '1.5px solid rgba(255,255,255,0.96)',
            boxShadow: '0 16px 48px rgba(34,37,39,0.20), 0 4px 16px rgba(34,37,39,0.10)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid rgba(34,37,39,0.07)' }}
          >
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  background: isRunning ? '#5a7d5d' : 'rgba(34,37,39,0.28)',
                  boxShadow: isRunning ? '0 0 6px rgba(90,125,93,0.55)' : 'none',
                }}
              />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#222527]/55">
                {isDone ? 'Session done' : isRunning ? 'In Focus' : 'Focus Mode'}
              </span>
            </div>
            <button
              onClick={handleExitFocusMode}
              className="text-[#222527]/35 hover:text-[#222527]/65 transition-colors p-0.5 rounded-lg hover:bg-black/5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Task */}
          <div className="px-4 pt-3 pb-2">
            <p className="text-sm font-semibold text-[#222527] leading-snug line-clamp-2 mb-0.5">
              {topPriority.title}
            </p>
            {topPriority.recommendationReason && (
              <p className="text-[11px] text-[#222527]/45 leading-snug">
                {topPriority.recommendationReason}
              </p>
            )}
          </div>

          {/* Timer block */}
          <div
            className="mx-4 mb-3 rounded-xl px-4 py-2.5 flex items-center justify-between"
            style={{
              background: isDone
                ? 'rgba(107,143,110,0.12)'
                : isRunning
                  ? 'rgba(34,37,39,0.05)'
                  : 'rgba(34,37,39,0.04)',
              border: '1px solid rgba(255,255,255,0.72)',
            }}
          >
            <span className="text-2xl font-light text-[#222527] tabular-nums tracking-tight">
              {isDone ? '0:00' : formatTime(timeLeft)}
            </span>
            {!isDone && (
              <button
                onClick={e => { e.stopPropagation(); toggle(); }}
                className="flex items-center gap-1.5 h-8 px-3.5 rounded-full text-xs font-semibold transition-all hover:opacity-85 active:scale-95"
                style={isRunning
                  ? { background: 'rgba(255,255,255,0.80)', color: 'rgba(34,37,39,0.68)', border: '1px solid rgba(34,37,39,0.12)' }
                  : { background: '#222527', color: '#fff', boxShadow: '0 2px 8px rgba(34,37,39,0.18)' }}
              >
                {isRunning
                  ? <><Pause className="h-3 w-3" />Pause</>
                  : <><Play className="h-3 w-3" />Resume</>
                }
              </button>
            )}
            {isDone && (
              <span className="text-xs font-semibold text-[#5a7d5d]">Complete!</span>
            )}
          </div>

          {/* Quick actions */}
          <div className="px-4 pb-4 flex gap-2">
            <button
              onClick={() => { handleComplete(topPriority.id); }}
              className="flex-1 h-8 rounded-xl text-xs font-semibold transition-all hover:opacity-85 active:scale-95"
              style={{
                background: 'rgba(107,143,110,0.16)',
                color: '#2a4e2d',
                border: '1px solid rgba(107,143,110,0.30)',
              }}
            >
              ✓ Done
            </button>
            <button
              onClick={() => setLocation('/focus')}
              className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold transition-all hover:opacity-85"
              style={{
                background: 'rgba(34,37,39,0.07)',
                color: 'rgba(34,37,39,0.60)',
                border: '1px solid rgba(34,37,39,0.10)',
              }}
            >
              Open timer
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {/* Next up */}
          {nextPriority && (
            <div
              className="px-4 py-2.5"
              style={{ borderTop: '1px solid rgba(34,37,39,0.06)' }}
            >
              <p className="text-[10px] text-[#222527]/38 leading-snug">
                <span className="font-semibold text-[#222527]/45">Next: </span>
                {nextPriority.title}
              </p>
            </div>
          )}
        </div>
      )}

      {pendingAdd && (
        <div
          className="rounded-2xl px-4 py-3.5 flex flex-col gap-2.5"
          style={{
            background: 'rgba(255,248,225,0.72)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(245,200,80,0.38)',
            boxShadow: '0 2px 12px rgba(200,160,0,0.10)',
          }}
        >
          <div className="flex items-start gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mt-0.5 shrink-0 text-amber-500/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-amber-800/80 mb-0.5">Looks similar to an existing task</p>
              <p className="text-xs text-amber-700/70 truncate">
                Existing: <span className="font-medium">"{pendingAdd.match.title}"</span>
              </p>
              <p className="text-xs text-amber-700/50 mt-0.5">
                New: <span className="font-medium">"{pendingAdd.title}"</span>
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDedupCombine}
              className="flex-1 h-8 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
              style={{ background: 'rgba(200,155,0,0.15)', color: '#92700a', border: '1px solid rgba(200,155,0,0.28)' }}
            >
              Use existing task
            </button>
            <button
              onClick={handleDedupKeepBoth}
              className="flex-1 h-8 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
              style={{ background: 'rgba(255,255,255,0.55)', color: 'rgba(34,37,39,0.65)', border: '1px solid rgba(255,255,255,0.70)' }}
            >
              Keep both
            </button>
          </div>
        </div>
      )}

      {isZeroDay ? (
        <div className="rounded-3xl p-6" style={GLASS}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-[#222527] tracking-tight mb-1">Today is open</h2>
              <p className="text-sm text-[#222527]/50">No tasks scheduled. Space to think.</p>
            </div>
            <span
              className="shrink-0 text-xs font-semibold px-3 py-1 rounded-full"
              style={{ background: 'rgba(107,143,110,0.15)', color: '#6B8F6E', border: '1px solid rgba(107,143,110,0.25)' }}
            >
              Open day
            </span>
          </div>
          <button
            onClick={handleCancelZeroDay}
            className="mt-5 text-xs text-[#222527]/40 hover:text-[#222527]/70 transition-colors underline-offset-2 hover:underline"
          >
            Add tasks instead
          </button>
        </div>
      ) : isEmpty ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-3xl p-6" style={GLASS}>
            <div className="flex items-start justify-between mb-1">
              <h2 className="text-lg font-semibold text-[#222527] tracking-tight">Add Today's Priorities</h2>
              <div className="flex items-center gap-2 shrink-0 ml-3 mt-0.5">
                <button
                  onClick={handleKeepOpen}
                  className="flex items-center text-xs font-medium text-[#222527]/60 hover:text-[#222527] transition-colors px-3 py-1.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.60)', border: '1px solid rgba(255,255,255,0.70)' }}
                >
                  Keep Today Open
                </button>
                <button
                  onClick={() => setShowSuggestModal(true)}
                  className="flex items-center gap-1.5 text-xs font-medium text-[#222527]/60 hover:text-[#222527] transition-colors px-3 py-1.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.60)', border: '1px solid rgba(255,255,255,0.70)' }}
                >
                  <Sparkles className="h-3 w-3" />
                  Suggest My Day
                </button>
              </div>
            </div>
            <QuickAddInput
              onAdd={handleQuickAdd}
              placeholder={PLACEHOLDER_EXAMPLES[placeholderIdx]}
              className="text-sm"
              formId="quick-add-main"
              hideButton
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-[#222527]/35">Write freely. We'll prioritize it for you.</p>
              <button
                type="submit"
                form="quick-add-main"
                className="h-7 w-7 rounded-full flex items-center justify-center transition-colors shrink-0"
                style={{ background: 'rgba(34,37,39,0.82)', color: '#fff' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="rounded-2xl p-5" style={GLASS_SUBTLE}>
            <p className="text-sm font-medium text-[#222527]/60 mb-1">No priorities selected yet.</p>
          </div>

          <div className="rounded-2xl p-4 mr-72" style={GLASS_SUBTLE}>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#222527]/40 mb-3">Today</p>
            <div className="flex items-end justify-between gap-4">
              <div className="flex gap-6 text-sm text-[#222527]/60">
                <div><span className="text-xl font-light text-[#222527]">0</span><br /><span className="text-xs">selected</span></div>
                <div><span className="text-xl font-light text-[#222527]">{carryoverPriorities.length}</span><br /><span className="text-xs">carryover</span></div>
                <div>
                  <span className="text-xl font-light text-[#222527]">
                    {state.settings?.reminderTimeLocal
                      ? (() => {
                          const [h, m] = state.settings.reminderTimeLocal.split(':').map(Number);
                          const d = new Date(); d.setHours(h, m);
                          return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                        })()
                      : '4:45 PM'}
                  </span>
                  <br /><span className="text-xs">check-in</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-2xl px-4 py-3" style={GLASS_SUBTLE}>
            <QuickAddInput onAdd={handleQuickAdd} placeholder="Add another priority..." />
          </div>

          {carryoverPriorities.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500/75" />
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#222527]/65">
                  Needs Attention
                </h3>
              </div>
              {carryoverPriorities.map(p => (
                <PriorityCard
                  key={p.id}
                  priority={p}
                  onClick={() => setSelectedPriorityId(p.id)}
                  onComplete={() => handleComplete(p.id)}
                  onStartFocus={() => handleStartFocus(p.id)}
                  onDismiss={() => dismissCarryover(p.id)}
                />
              ))}
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#222527]/65">Today's Priorities</h3>
                <span
                  className="text-[11px] font-bold px-2 py-0.5 rounded-full text-[#222527]/70"
                  style={{ background: 'rgba(255,255,255,0.60)', border: '1px solid rgba(255,255,255,0.75)' }}
                >
                  {selectedPriorities.length}
                </span>
              </div>
              <span className="text-[11px] text-[#222527]/45">Recommended: 3–5</span>
            </div>
            <div className="space-y-2">
              {(() => {
                const activeForRank = selectedPriorities.filter(p => p.status !== 'completed');
                const rankMap = new Map(activeForRank.slice(0, 3).map((p, i) => [p.id, i + 1]));
                return selectedPriorities.map(p => (
                  <PriorityCard
                    key={p.id}
                    priority={p}
                    rank={rankMap.get(p.id)}
                    onClick={() => setSelectedPriorityId(p.id)}
                    onComplete={() => handleComplete(p.id)}
                    onMoveUp={() => handleMoveUp(p.id)}
                    onMoveDown={() => handleMoveDown(p.id)}
                    onStartFocus={() => handleStartFocus(p.id)}
                    onNoteChange={note => updatePriority(p.id, { notes: note })}
                    showMoveControls
                  />
                ));
              })()}
            </div>
          </div>

          {/* ── Start My Day / Focus Mode CTA ───────────────────────── */}
          {activePriorities.length > 0 && (
            <div className="space-y-2 pt-1">
              {focusMode ? (
                /* Active day mode — focus widget is floating */
                <div className="flex items-center gap-2">
                  <div
                    className="flex-1 h-12 rounded-2xl flex items-center gap-3 px-4"
                    style={{
                      background: 'rgba(107,143,110,0.12)',
                      border: '1px solid rgba(107,143,110,0.25)',
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{
                        background: isRunning ? '#5a7d5d' : 'rgba(34,37,39,0.28)',
                        boxShadow: isRunning ? '0 0 6px rgba(90,125,93,0.50)' : 'none',
                      }}
                    />
                    <div>
                      <p className="text-sm font-semibold text-[#5a7d5d] leading-tight">
                        Focus Mode Active
                      </p>
                      <p className="text-[10px] text-[#5a7d5d]/65">
                        {isRunning ? `Timer running · ${formatTime(timeLeft)}` : 'Timer paused — widget in the corner'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleExitFocusMode}
                    className="h-12 px-4 rounded-2xl text-xs font-semibold transition-all hover:opacity-85"
                    style={{
                      background: 'rgba(255,255,255,0.55)',
                      color: 'rgba(34,37,39,0.58)',
                      border: '1px solid rgba(255,255,255,0.72)',
                    }}
                  >
                    Exit
                  </button>
                </div>
              ) : (
                /* Planning mode — ready to commit and start */
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleStartMyDay}
                      className="flex-1 h-12 rounded-2xl font-semibold text-sm tracking-wide transition-all hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2"
                      style={{ background: '#222527', color: '#fff', boxShadow: '0 4px 18px rgba(34,37,39,0.22)' }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-80" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                      Start My Day
                    </button>
                    <button
                      onClick={() => setAutoStartPomodoro(a => !a)}
                      title={autoStartPomodoro ? 'Auto-start timer on (click to turn off)' : 'Auto-start timer off (click to turn on)'}
                      className="h-12 px-4 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0"
                      style={{
                        background: autoStartPomodoro ? 'rgba(107,143,110,0.18)' : 'rgba(255,255,255,0.45)',
                        border: autoStartPomodoro ? '1px solid rgba(107,143,110,0.32)' : '1px solid rgba(255,255,255,0.58)',
                        color: autoStartPomodoro ? '#5a7d5d' : 'rgba(34,37,39,0.40)',
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                      </svg>
                      Timer
                    </button>
                  </div>
                  {/* Workflow hint */}
                  <p className="text-[10px] text-[#222527]/38 text-center leading-relaxed">
                    Commits your list · links timer to <span className="font-semibold text-[#222527]/48">{topPriority?.title?.slice(0, 28)}{(topPriority?.title?.length ?? 0) > 28 ? '…' : ''}</span> · focus widget appears
                  </p>
                </div>
              )}
            </div>
          )}

          {(candidatePriorities.length > 0 || completedPriorities.length > 0) && (
            <div className="space-y-2 pt-2">
              {candidatePriorities.length > 0 && (
                <CollapsibleSection title="Other Candidates" count={candidatePriorities.length}>
                  <div className="space-y-2 mt-2">
                    {candidatePriorities.map(p => (
                      <PriorityCard
                        key={p.id}
                        priority={p}
                        onClick={() => setSelectedPriorityId(p.id)}
                        onStartFocus={() => handleStartFocus(p.id)}
                        onNoteChange={note => updatePriority(p.id, { notes: note })}
                      />
                    ))}
                  </div>
                </CollapsibleSection>
              )}
              {completedPriorities.length > 0 && (
                <CollapsibleSection
                  title="Completed Today"
                  count={completedPriorities.length}
                  action={
                    <button
                      onClick={e => { e.stopPropagation(); handleClearCompleted(); }}
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all hover:opacity-75"
                      style={{ background: 'rgba(255,255,255,0.50)', color: 'rgba(34,37,39,0.50)', border: '1px solid rgba(255,255,255,0.65)' }}
                    >
                      Clear
                    </button>
                  }
                >
                  <div className="space-y-2 mt-2">
                    {completedPriorities.map(p => (
                      <PriorityCard
                        key={p.id}
                        priority={p}
                        onClick={() => setSelectedPriorityId(p.id)}
                      />
                    ))}
                  </div>
                </CollapsibleSection>
              )}
            </div>
          )}

          <div className="rounded-2xl p-4" style={GLASS_SUBTLE}>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#222527]/55 mb-3">Today</p>
            <div className="flex items-end justify-between gap-4">
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="text-xl font-light text-[#222527]">{selectedPriorities.length}</span>
                  <br /><span className="text-xs text-[#222527]/60">selected</span>
                </div>
                <div>
                  <span className="text-xl font-light text-[#222527]">{carryoverPriorities.length}</span>
                  <br /><span className="text-xs text-[#222527]/60">carryover</span>
                </div>
                <div>
                  <span className="text-xl font-light text-[#222527]">
                    {state.settings?.reminderTimeLocal
                      ? (() => {
                          const [h, m] = state.settings.reminderTimeLocal.split(':').map(Number);
                          const d = new Date(); d.setHours(h, m);
                          return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                        })()
                      : '4:45 PM'}
                  </span>
                  <br /><span className="text-xs text-[#222527]/60">check-in</span>
                </div>
              </div>

              {todayPlan && (
                <button
                  onClick={() => setShowCheckIn(true)}
                  className="shrink-0 h-9 px-4 rounded-full text-xs font-semibold transition-all hover:opacity-85"
                  style={{
                    background: todayPlan.checkInCompleted
                      ? 'rgba(107,143,110,0.15)'
                      : 'rgba(107,143,110,0.18)',
                    color: todayPlan.checkInCompleted ? '#5a7d5d' : '#2a4e2d',
                    border: todayPlan.checkInCompleted
                      ? '1px solid rgba(107,143,110,0.30)'
                      : '1px solid rgba(107,143,110,0.35)',
                  }}
                >
                  {todayPlan.checkInCompleted ? '✓ Checked in' : 'EOD Check In'}
                </button>
              )}
            </div>
          </div>
        </>
      )}

      <PriorityDetailModal
        priority={priorities.find(p => p.id === selectedPriorityId) || null}
        isOpen={!!selectedPriorityId}
        onClose={() => setSelectedPriorityId(null)}
        onSave={updatePriority}
        onDelete={(id) => { deletePriority(id); setSelectedPriorityId(null); }}
      />

      <CheckInModal
        isOpen={showCheckIn}
        onClose={() => setShowCheckIn(false)}
        priorities={todayPlan
          ? priorities.filter(p => todayPlan.selectedPriorityIds.includes(p.id))
          : []}
        dayPlans={state.dayPlans}
        onSave={handleCheckInSave}
      />

      <SuggestMyDayModal
        isOpen={showSuggestModal}
        onClose={() => setShowSuggestModal(false)}
        onSubmit={handleSuggestMyDay}
      />
    </div>
  );
}
