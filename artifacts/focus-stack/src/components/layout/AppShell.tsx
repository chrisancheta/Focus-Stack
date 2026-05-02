import React, { ReactNode, useEffect, useState } from 'react';
import { TopNav } from './TopNav';
import { useLocation } from 'wouter';
import { useAppStore } from '@/lib/storeContext';
import { CheckInModal } from '@/components/shared/CheckInModal';
import { getTodayISODate } from '@/lib/utils';

type Action = 'done' | 'carryover' | 'drop' | null;

function CheckInTrigger() {
  const { state, updateDayPlan, updatePriority } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [promptedToday, setPromptedToday] = useState(false);

  useEffect(() => {
    if (!state.settings || promptedToday) return;
    const today = getTodayISODate();
    const todayPlan = state.dayPlans.find(dp => dp.date === today);
    if (!todayPlan || todayPlan.checkInCompleted) return;

    const checkTime = () => {
      const now = new Date();
      const [th, tm] = state.settings!.reminderTimeLocal.split(':').map(Number);
      if (now.getHours() > th || (now.getHours() === th && now.getMinutes() >= tm)) {
        setShowModal(true);
        setPromptedToday(true);
      }
    };
    checkTime();
    const interval = setInterval(checkTime, 60_000);
    return () => clearInterval(interval);
  }, [state.settings, state.dayPlans, promptedToday]);

  const today = getTodayISODate();
  const todayPlan = state.dayPlans.find(dp => dp.date === today);
  const prioritiesToCheck = todayPlan
    ? state.priorities.filter(p => todayPlan.selectedPriorityIds.includes(p.id))
    : [];

  const handleSave = (updates: { id: string; action: Action }[]) => {
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
      const merged = Array.from(
        new Set([...todayPlan.completedPriorityIds, ...newCompletedIds])
      );
      updateDayPlan(todayPlan.id, {
        checkInCompleted: true,
        checkInCompletedAt: new Date().toISOString(),
        completedPriorityIds: merged,
      });
    }
  };

  return (
    <CheckInModal
      isOpen={showModal}
      onClose={() => setShowModal(false)}
      priorities={prioritiesToCheck}
      onSave={handleSave}
    />
  );
}

// Exported so HomePage can open the modal manually
export { CheckInTrigger };

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const hideNav = location === '/welcome' || location === '/setup';

  return (
    <div className="min-h-[100dvh] flex flex-col font-sans" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {!hideNav && <TopNav />}
      {!hideNav && <CheckInTrigger />}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-5">
        {children}
      </main>
    </div>
  );
}
