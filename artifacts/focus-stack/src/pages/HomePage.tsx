import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/storeContext';
import { PriorityCard } from '@/components/priority/PriorityCard';
import { QuickAddInput } from '@/components/priority/QuickAddInput';
import { PriorityDetailModal } from '@/components/priority/PriorityDetailModal';
import { CheckInModal } from '@/components/shared/CheckInModal';
import { CollapsibleSection } from '@/components/shared/CollapsibleSection';
import { generateId, getTodayISODate } from '@/lib/utils';
import { DayPlan } from '@/lib/store';

const GLASS = {
  background: 'rgba(255,255,255,0.45)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.58)',
};

const GLASS_SUBTLE = {
  background: 'rgba(255,255,255,0.28)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.38)',
};

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
  const [selectedPriorityId, setSelectedPriorityId] = useState<string | null>(null);
  const [showCheckIn, setShowCheckIn] = useState(false);

  const today = getTodayISODate();
  const todayPlan = state.dayPlans.find(dp => dp.date === today);
  const priorities = state.priorities;

  // Auto-inject recurring priorities into today's plan whenever priorities change
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

  // Only show priorities actually recorded as completed today — avoid leaking
  // globally-completed priorities from previous days into the current list.
  const completedPriorities = todayPlan
    ? priorities.filter(p => todayPlan.completedPriorityIds.includes(p.id))
    : [];

  const handleQuickAdd = (title: string) => {
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

  const handleComplete = (id: string) => updatePriority(id, { status: 'completed', progressPercent: 100 });

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

  const handleCheckInSave = (updates: { id: string; action: 'done' | 'carryover' | 'drop' | null }[]) => {
    const newCompletedIds: string[] = [];
    updates.forEach(({ id, action }) => {
      if (action === 'done') {
        updatePriority(id, { status: 'completed', progressPercent: 100, isCarryover: false });
        newCompletedIds.push(id);
      } else if (action === 'carryover') {
        updatePriority(id, { isCarryover: true });
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

  const isZeroDay = !!(todayPlan?.zeroPriorityDay && todayPlan.selectedPriorityIds.length === 0);
  const isEmpty = !isZeroDay && (!todayPlan || todayPlan.selectedPriorityIds.length === 0);

  return (
    <div className="space-y-4">
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
            <h2 className="text-lg font-semibold text-[#222527] tracking-tight mb-1">Set Today's Priorities</h2>
            <p className="text-sm text-[#222527]/50 mb-5">What needs your attention most today?</p>
            <QuickAddInput
              onAdd={handleQuickAdd}
              placeholder="Finish strategy assignment tonight, 1 hour, due Friday"
              className="text-sm"
            />
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={handleKeepOpen}
                className="text-xs text-[#222527]/45 hover:text-[#222527]/70 transition-colors underline-offset-2 hover:underline"
              >
                Keep today open
              </button>
            </div>
          </div>

          <div className="rounded-2xl p-5" style={GLASS_SUBTLE}>
            <p className="text-sm font-medium text-[#222527]/60 mb-1">No priorities selected yet.</p>
            <p className="text-xs text-[#222527]/40">Add one above or keep today open for focused work.</p>
            <div className="flex gap-2 flex-wrap mt-4">
              <button
                onClick={() => document.querySelector<HTMLInputElement>('input[placeholder]')?.focus()}
                className="text-xs px-3 py-1.5 rounded-full font-medium text-[#222527]/60 hover:text-[#222527] transition-all"
                style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.65)' }}
              >
                Add your first priority
              </button>
              <button
                onClick={handleKeepOpen}
                className="text-xs px-3 py-1.5 rounded-full font-medium text-[#222527]/60 hover:text-[#222527] transition-all"
                style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.65)' }}
              >
                Keep today open
              </button>
            </div>
          </div>

          <div className="rounded-2xl p-4" style={GLASS_SUBTLE}>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#222527]/40 mb-3">Today</p>
            <div className="flex items-end justify-between gap-4">
              <div className="flex gap-6 text-sm text-[#222527]/60">
                <div><span className="text-xl font-light text-[#222527]">0</span><br /><span className="text-xs">selected</span></div>
                <div><span className="text-xl font-light text-[#222527]">{carryoverPriorities.length}</span><br /><span className="text-xs">carryover</span></div>
                <div>
                  <span className="text-sm font-medium text-[#222527]/70">
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
                <div className="w-1.5 h-1.5 rounded-full bg-red-400/70" />
                <h3 className="text-xs font-semibold uppercase tracking-widest text-[#222527]/50">
                  Needs Attention
                </h3>
              </div>
              {carryoverPriorities.map(p => (
                <div key={p.id} className="relative">
                  <PriorityCard
                    priority={p}
                    onClick={() => setSelectedPriorityId(p.id)}
                    onComplete={() => handleComplete(p.id)}
                  />
                  <div
                    className="absolute bottom-3 right-3 flex gap-1.5"
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      onClick={() => dismissCarryover(p.id)}
                      className="text-[10px] px-2.5 py-1 rounded-full font-medium text-[#222527]/50 hover:text-[#222527]/80 transition-colors"
                      style={{ background: 'rgba(255,255,255,0.50)', border: '1px solid rgba(255,255,255,0.60)' }}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-[#222527]/50">Today's Priorities</h3>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full text-[#222527]/70"
                  style={{ background: 'rgba(255,255,255,0.50)' }}
                >
                  {selectedPriorities.length}
                </span>
              </div>
              <span className="text-[11px] text-[#222527]/35">Recommended: 3–5</span>
            </div>
            <div className="space-y-2">
              {selectedPriorities.map(p => (
                <PriorityCard
                  key={p.id}
                  priority={p}
                  onClick={() => setSelectedPriorityId(p.id)}
                  onComplete={() => handleComplete(p.id)}
                  onMoveUp={() => handleMoveUp(p.id)}
                  onMoveDown={() => handleMoveDown(p.id)}
                  showMoveControls
                />
              ))}
            </div>
          </div>

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
                      />
                    ))}
                  </div>
                </CollapsibleSection>
              )}
              {completedPriorities.length > 0 && (
                <CollapsibleSection title="Completed Today" count={completedPriorities.length}>
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
            <p className="text-xs font-semibold uppercase tracking-widest text-[#222527]/40 mb-3">Today</p>
            <div className="flex items-end justify-between gap-4">
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="text-xl font-light text-[#222527]">{selectedPriorities.length}</span>
                  <br /><span className="text-xs text-[#222527]/50">selected</span>
                </div>
                <div>
                  <span className="text-xl font-light text-[#222527]">{carryoverPriorities.length}</span>
                  <br /><span className="text-xs text-[#222527]/50">carryover</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-[#222527]/70">
                    {state.settings?.reminderTimeLocal
                      ? (() => {
                          const [h, m] = state.settings.reminderTimeLocal.split(':').map(Number);
                          const d = new Date(); d.setHours(h, m);
                          return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                        })()
                      : '4:45 PM'}
                  </span>
                  <br /><span className="text-xs text-[#222527]/50">check-in</span>
                </div>
              </div>

              {todayPlan && (
                <button
                  onClick={() => setShowCheckIn(true)}
                  className="shrink-0 h-9 px-4 rounded-full text-xs font-semibold transition-all hover:opacity-85"
                  style={{
                    background: todayPlan.checkInCompleted
                      ? 'rgba(107,143,110,0.15)'
                      : '#222527',
                    color: todayPlan.checkInCompleted
                      ? '#6B8F6E'
                      : 'white',
                    border: todayPlan.checkInCompleted
                      ? '1px solid rgba(107,143,110,0.30)'
                      : 'none',
                  }}
                >
                  {todayPlan.checkInCompleted ? '✓ Checked in' : 'Check In'}
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
        onSave={handleCheckInSave}
      />
    </div>
  );
}
