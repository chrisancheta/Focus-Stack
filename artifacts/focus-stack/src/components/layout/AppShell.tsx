import React, { ReactNode, useEffect, useState } from 'react';
import { TopNav } from './TopNav';
import { useLocation } from 'wouter';
import { useAppStore } from '@/lib/storeContext';
import { CheckInModal } from '@/components/shared/CheckInModal';
import { getTodayISODate } from '@/lib/utils';

function CheckInTrigger() {
  const { state, updateDayPlan, updatePriority } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [checkedToday, setCheckedToday] = useState(false);

  useEffect(() => {
    if (!state.settings || checkedToday) return;

    const today = getTodayISODate();
    const todayPlan = state.dayPlans.find(dp => dp.date === today);

    if (todayPlan && !todayPlan.checkInCompleted) {
      const checkTime = () => {
        const now = new Date();
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        const [targetHours, targetMinutes] = state.settings!.reminderTimeLocal.split(':').map(Number);
        if (currentHours > targetHours || (currentHours === targetHours && currentMinutes >= targetMinutes)) {
          setShowModal(true);
          setCheckedToday(true);
        }
      };
      checkTime();
      const interval = setInterval(checkTime, 60000);
      return () => clearInterval(interval);
    }
  }, [state.settings, state.dayPlans, checkedToday]);

  const handleSaveCheckIn = (updates: { id: string; status: string; progress: number; reason?: string }[]) => {
    const today = getTodayISODate();
    const todayPlan = state.dayPlans.find(dp => dp.date === today);
    updates.forEach(u => {
      updatePriority(u.id, { status: u.status as any, progressPercent: u.progress as any });
    });
    if (todayPlan) {
      updateDayPlan(todayPlan.id, { checkInCompleted: true, checkInCompletedAt: new Date().toISOString() });
    }
  };

  const today = getTodayISODate();
  const todayPlan = state.dayPlans.find(dp => dp.date === today);
  const prioritiesToCheck = todayPlan ? state.priorities.filter(p => todayPlan.selectedPriorityIds.includes(p.id)) : [];

  return (
    <CheckInModal
      isOpen={showModal}
      onClose={() => setShowModal(false)}
      priorities={prioritiesToCheck}
      onSave={handleSaveCheckIn}
    />
  );
}

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
