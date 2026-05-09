import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Play, X, ArrowRight, ChevronDown } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAppStore } from '@/lib/storeContext';
import { useTimer } from '@/lib/timerContext';
import { PriorityCard } from '@/components/priority/PriorityCard';
import { RecommendationChip } from '@/components/priority/RecommendationChip';
import { QuickAddInput } from '@/components/priority/QuickAddInput';
import { PriorityDetailModal } from '@/components/priority/PriorityDetailModal';
import { CheckInModal } from '@/components/shared/CheckInModal';
import { CollapsibleSection } from '@/components/shared/CollapsibleSection';
import { SuggestMyDayModal } from '@/components/shared/SuggestMyDayModal';
import { generateId, getTodayISODate } from '@/lib/utils';
import { DayPlan } from '@/lib/store';
import { findSimilar } from '@/lib/similarity';
import type { SimilarMatch } from '@/lib/similarity';
import { useWindowMode } from '@/lib/windowMode';

const PLACEHOLDER_EXAMPLES = [
  'Finish the project proposal before Friday',
  'Call the insurance company back',
  "Prep slides for tomorrow's standup",
  'Clear my inbox from this week',
  'Review the draft contract',
  'Block time for deep work this afternoon',
];

const EXAMPLE_ENTRIES = [
  'Finish project proposal draft',
  'Prep for Friday client meeting',
  'Follow up on open invoices',
] as const;

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

const COMPANION_STYLE = {
  background: 'rgba(255,255,255,0.76)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1.5px solid rgba(255,255,255,0.96)',
  boxShadow: '0 8px 32px rgba(34,37,39,0.13), 0 2px 8px rgba(34,37,39,0.06)',
};


function estimateDuration(urgency: number, importance: number): string {
  const score = urgency + importance;
  if (score >= 9) return '~45m';
  if (score >= 7) return '~30m';
  if (score >= 5) return '~20m';
  return '~15m';
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
  const { linkPriority } = useTimer();
  const [, setLocation] = useLocation();
  const [selectedPriorityId, setSelectedPriorityId] = useState<string | null>(null);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [justCompleted, setJustCompleted] = useState<string | null>(null);
  const { setMode } = useWindowMode();
  const [pendingAdd, setPendingAdd] = useState<{ title: string; match: SimilarMatch } | null>(null);
  const [showAllTasks, setShowAllTasks] = useState(false);

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

  const checkInTimeStr = state.settings?.reminderTimeLocal
    ? (() => {
        const [h, m] = state.settings!.reminderTimeLocal.split(':').map(Number);
        const d = new Date(); d.setHours(h, m);
        return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      })()
    : '4:45 PM';

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
    }
    setMode('active');
    setFocusMode(true);
    setShowAllTasks(false);
  };

  const handleExitFocusMode = () => { setMode('planning'); setFocusMode(false); setJustCompleted(null); };

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

  // ── Shared dedup banner (shown in both planning and active-day) ─────────────
  const dedupBanner = pendingAdd && (
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
  );

  // ── Shared modals ───────────────────────────────────────────────────────────
  const modals = (
    <>
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
    </>
  );

  // ══════════════════════════════════════════════════════════════════════════════
  // ACTIVE-DAY STATE — committed focus companion
  // ══════════════════════════════════════════════════════════════════════════════
  if (focusMode && !isEmpty && topPriority) {
    const topDuration  = estimateDuration(topPriority.urgencyScore ?? 3, topPriority.importanceScore ?? 3);
    const nextDuration = nextPriority ? estimateDuration(nextPriority.urgencyScore ?? 3, nextPriority.importanceScore ?? 3) : null;

    const handleDoneWithFlash = () => {
      const next = nextPriority;
      handleComplete(topPriority.id);
      if (next) linkPriority(next.id);
      setJustCompleted(
        next
          ? `Up next: ${next.title.slice(0, 38)}${next.title.length > 38 ? '…' : ''}`
          : 'All done today!'
      );
      setTimeout(() => setJustCompleted(null), 2500);
    };

    return (
      <>
          <div className="space-y-3">
            {dedupBanner}

            {/* ── Companion card ─────────────────────────────────────────── */}
            <div className="rounded-2xl overflow-hidden" style={COMPANION_STYLE}>

              {/* Header */}
              <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid rgba(34,37,39,0.06)' }}>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#5a7d5d' }} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#222527]/45">Day started</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setLocation('/focus')}
                    className="flex items-center gap-1 h-7 px-2.5 rounded-full text-[11px] font-medium transition-all hover:opacity-80"
                    style={{ background: 'rgba(34,37,39,0.07)', color: 'rgba(34,37,39,0.50)', border: '1px solid rgba(34,37,39,0.09)' }}
                  >
                    Pomodoro <ArrowRight className="h-3 w-3" />
                  </button>
                  <button
                    onClick={handleExitFocusMode}
                    className="h-7 px-2.5 rounded-full text-[11px] font-medium transition-all hover:opacity-80"
                    style={{ background: 'rgba(255,255,255,0.62)', color: 'rgba(34,37,39,0.46)', border: '1px solid rgba(255,255,255,0.82)' }}
                  >
                    Exit
                  </button>
                </div>
              </div>

              {/* Top task */}
              <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(34,37,39,0.06)' }}>
                <div className="flex items-start gap-3">
                  <span
                    className="text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: '#222527', color: '#fff' }}
                  >
                    1
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      {topPriority.recommendationLabel && (
                        <RecommendationChip label={topPriority.recommendationLabel} />
                      )}
                      <span className="text-[10px] text-[#222527]/30">{topDuration}</span>
                    </div>
                    <p className="font-bold text-[#222527] leading-tight mb-1" style={{ fontSize: '18px', lineHeight: '1.25' }}>
                      {topPriority.title}
                    </p>
                    {topPriority.recommendationReason && (
                      <p className="text-[11px] text-[#222527]/44 leading-snug">{topPriority.recommendationReason}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="px-5 py-4" style={{ borderBottom: nextPriority ? '1px solid rgba(34,37,39,0.06)' : undefined }}>
                {justCompleted ? (
                  <div
                    className="h-12 rounded-2xl flex items-center justify-center gap-2 transition-all duration-300"
                    style={{ background: 'rgba(107,143,110,0.18)', border: '1px solid rgba(107,143,110,0.30)' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" style={{ color: '#5a7d5d' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span className="text-sm font-semibold text-[#2a4e2d] truncate">{justCompleted}</span>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => { linkPriority(topPriority.id); setLocation('/focus'); }}
                      className="flex-1 h-12 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
                      style={{ background: '#222527', color: '#fff', boxShadow: '0 4px 18px rgba(34,37,39,0.22)' }}
                    >
                      <Play className="h-4 w-4" />
                      Begin Focus
                    </button>
                    <button
                      onClick={handleDoneWithFlash}
                      className="h-12 w-12 rounded-2xl flex items-center justify-center transition-all hover:opacity-80 active:scale-[0.98]"
                      style={{ background: 'rgba(255,255,255,0.50)', border: '1px solid rgba(255,255,255,0.68)' }}
                      title="Mark done"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" style={{ color: 'rgba(34,37,39,0.55)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Up Next */}
              {nextPriority && (
                <div className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(34,37,39,0.09)', color: 'rgba(34,37,39,0.46)' }}
                    >
                      2
                    </span>
                    <p className="text-[13px] text-[#222527]/55 flex-1 truncate">{nextPriority.title}</p>
                    {nextPriority.recommendationLabel && <RecommendationChip label={nextPriority.recommendationLabel} />}
                    {nextDuration && <span className="text-[10px] text-[#222527]/28 shrink-0">{nextDuration}</span>}
                  </div>
                </div>
              )}
            </div>

            {/* ── Remaining tasks ────────────────────────────────────────── */}
            {activePriorities.length > 2 && (
              <div className="rounded-2xl overflow-hidden" style={GLASS_SUBTLE}>
                {showAllTasks ? (
                  <div className="px-4 py-3">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#222527]/36">Remaining</p>
                      <button onClick={() => setShowAllTasks(false)} className="text-[10px] text-[#222527]/34 hover:text-[#222527]/56 transition-colors">
                        Collapse
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {activePriorities.slice(2).map((p, i) => (
                        <div key={p.id} className="flex items-center gap-2.5 py-1 cursor-pointer group" onClick={() => setSelectedPriorityId(p.id)}>
                          <span className="text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(34,37,39,0.08)', color: 'rgba(34,37,39,0.42)' }}>
                            {i + 3}
                          </span>
                          <p className="text-xs text-[#222527]/52 flex-1 truncate group-hover:text-[#222527]/75 transition-colors">{p.title}</p>
                          {p.recommendationLabel && <RecommendationChip label={p.recommendationLabel} />}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAllTasks(true)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-xs transition-colors"
                    style={{ color: 'rgba(34,37,39,0.36)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'rgba(34,37,39,0.58)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(34,37,39,0.36)')}
                  >
                    <span>{activePriorities.length - 2} more</span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                  </button>
                )}
              </div>
            )}

            {/* ── Command strip ──────────────────────────────────────────── */}
            <div className="rounded-2xl px-4 py-2.5 flex items-center justify-between" style={GLASS_SUBTLE}>
              <p className="text-[11px] text-[#222527]/34">
                {completedPriorities.length > 0
                  ? `${completedPriorities.length} done · ${activePriorities.length} left · ${checkInTimeStr}`
                  : `${activePriorities.length} tasks · check-in ${checkInTimeStr}`
                }
              </p>
              {todayPlan && (
                <button
                  onClick={() => setShowCheckIn(true)}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-full transition-all hover:opacity-80"
                  style={{
                    background: todayPlan.checkInCompleted ? 'rgba(107,143,110,0.14)' : 'rgba(34,37,39,0.07)',
                    color: todayPlan.checkInCompleted ? '#5a7d5d' : 'rgba(34,37,39,0.46)',
                    border: todayPlan.checkInCompleted ? '1px solid rgba(107,143,110,0.25)' : '1px solid rgba(34,37,39,0.09)',
                  }}
                >
                  {todayPlan.checkInCompleted ? '✓ Checked in' : 'Check In'}
                </button>
              )}
            </div>
          </div>

        {modals}
      </>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // PLANNING STATE + EMPTY STATE + ZERO-DAY STATE
  // ══════════════════════════════════════════════════════════════════════════════
  return (
    <>
      <div className="space-y-4">
        {dedupBanner}

        {/* ── Zero-day state ──────────────────────────────────────── */}
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

          // ── EMPTY STATE ──────────────────────────────────────────────────────
          <div className="flex flex-col gap-3">
            <div className="rounded-3xl px-6 pt-6 pb-5" style={GLASS}>

              <div className="mb-5">
                <h2 className="text-base font-semibold text-[#222527] tracking-tight mb-1.5">
                  What needs your attention today?
                </h2>
                <p className="text-sm text-[#222527]/52 leading-relaxed">
                  Add 3–5 priorities in plain language — work, life, or admin.
                  We'll score each for urgency and importance, then surface what actually matters.
                </p>
              </div>

              <div
                className="rounded-xl px-4 pt-3 pb-2.5 mb-4"
                style={{
                  background: 'rgba(255,255,255,0.65)',
                  border: '1px solid rgba(255,255,255,0.90)',
                  boxShadow: '0 1px 6px rgba(34,37,39,0.05)',
                }}
              >
                <QuickAddInput
                  onAdd={handleQuickAdd}
                  placeholder={`e.g. ${PLACEHOLDER_EXAMPLES[placeholderIdx]}`}
                  className="text-sm"
                  formId="quick-add-main"
                  hideButton
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-[11px] text-[#222527]/32">
                    Press Enter to add · 3–5 tasks recommended
                  </p>
                  <button
                    type="submit"
                    form="quick-add-main"
                    className="h-6 w-6 rounded-full flex items-center justify-center transition-all hover:opacity-80 active:scale-95 shrink-0"
                    style={{ background: 'rgba(34,37,39,0.78)', color: '#fff' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#222527]/28 mb-2">
                  Try adding
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {EXAMPLE_ENTRIES.map(ex => (
                    <button
                      key={ex}
                      onClick={() => handleQuickAdd(ex)}
                      className="flex items-center gap-1.5 text-xs text-[#222527]/52 hover:text-[#222527]/80 px-2.5 py-1.5 rounded-lg transition-all hover:scale-[1.02] active:scale-95"
                      style={{ background: 'rgba(255,255,255,0.52)', border: '1px solid rgba(255,255,255,0.80)' }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 opacity-40 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      {ex}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-5" style={{ borderTop: '1px solid rgba(255,255,255,0.58)' }} />

              <button
                onClick={() => setShowSuggestModal(true)}
                className="w-full h-12 rounded-2xl font-semibold text-sm tracking-wide transition-all hover:opacity-90 active:scale-[0.99] flex items-center justify-center gap-2 mb-2"
                style={{ background: '#222527', color: '#fff', boxShadow: '0 4px 20px rgba(34,37,39,0.24)' }}
              >
                <Sparkles className="h-4 w-4 opacity-75" />
                Suggest My Day
              </button>
              <p className="text-[11px] text-[#222527]/36 text-center mb-5 leading-snug">
                3 questions → ranked priorities in 30 seconds
              </p>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    const input = document.querySelector<HTMLInputElement>('form[id="quick-add-main"] input');
                    input?.focus();
                  }}
                  className="text-xs font-medium text-[#222527]/45 hover:text-[#222527]/72 transition-colors"
                >
                  I'll choose manually
                </button>
                <span className="text-[#222527]/20">·</span>
                <button
                  onClick={handleKeepOpen}
                  className="text-xs text-[#222527]/30 hover:text-[#222527]/52 transition-colors"
                >
                  Nothing planned today
                </button>
              </div>
            </div>

            {carryoverPriorities.length > 0 && (
              <div
                className="rounded-2xl px-4 py-3 flex items-center gap-3"
                style={{
                  background: 'rgba(254,226,226,0.45)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(220,38,38,0.18)',
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-400/80 shrink-0" />
                <p className="text-xs text-[#222527]/60 flex-1">
                  <span className="font-semibold text-[#222527]/70">
                    {carryoverPriorities.length} {carryoverPriorities.length === 1 ? 'item' : 'items'} carrying over
                  </span>
                  {' '}from a previous day — add them above to reprioritize.
                </p>
              </div>
            )}
          </div>

        ) : (

          // ── PLANNING STATE ───────────────────────────────────────────────────
          <>
            {/* Quick-add strip */}
            <div className="rounded-2xl px-4 pt-3 pb-2.5" style={GLASS_SUBTLE}>
              <QuickAddInput onAdd={handleQuickAdd} placeholder="Add another priority..." />
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-[10px] text-[#222527]/32">
                  {activePriorities.length < 3
                    ? `${activePriorities.length} added · aim for 3–5`
                    : activePriorities.length <= 5
                      ? `${activePriorities.length} tasks · looking good`
                      : `${activePriorities.length} tasks · consider trimming to 5`}
                </p>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className="w-1 h-1 rounded-full"
                      style={{
                        background: i < Math.min(activePriorities.length, 5)
                          ? activePriorities.length > 5 ? 'rgba(194,130,0,0.55)' : 'rgba(90,125,93,0.55)'
                          : 'rgba(34,37,39,0.12)',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Carryover items */}
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

            {/* Planning mode header + ranked priorities */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-[#222527]/22 shrink-0" />
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#222527]/50">
                      Planning
                    </h3>
                  </div>
                  <span
                    className="text-[11px] font-bold px-2 py-0.5 rounded-full text-[#222527]/65"
                    style={{ background: 'rgba(255,255,255,0.60)', border: '1px solid rgba(255,255,255,0.75)' }}
                  >
                    {selectedPriorities.length}
                  </span>
                </div>
                <span className="text-[11px] text-[#222527]/40">Recommended: 3–5</span>
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

            {/* Start My Day CTA */}
            {activePriorities.length > 0 && (
              <div className="pt-1">
                <button
                  onClick={handleStartMyDay}
                  className="w-full h-12 rounded-2xl font-semibold text-sm tracking-wide transition-all hover:opacity-90 active:scale-[0.98] flex items-center justify-center"
                  style={{ background: '#222527', color: '#fff', boxShadow: '0 4px 18px rgba(34,37,39,0.22)' }}
                >
                  Start My Day
                </button>
              </div>
            )}

            {/* Candidates + Completed */}
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

            {/* Stats panel */}
            <div className="rounded-2xl p-4" style={GLASS_SUBTLE}>
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#222527]/50 mb-3">Today</p>
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
                    <span className="text-xl font-light text-[#222527]">{checkInTimeStr}</span>
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
      </div>
      {modals}
    </>
  );
}
