import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { TopNav } from './TopNav';
import { useLocation } from 'wouter';
import { useAppStore } from '@/lib/storeContext';
import { CheckInModal } from '@/components/shared/CheckInModal';
import { getTodayISODate } from '@/lib/utils';
import { useWindowMode, WindowMode } from '@/lib/windowMode';
import { useTimer } from '@/lib/timerContext';

// ── Timer-driven mode sync ─────────────────────────────────────────────────────
function TimerModeSync() {
  const { isRunning } = useTimer();
  const { mode, setMode } = useWindowMode();
  const autoMinimizedRef = useRef(false);

  useEffect(() => {
    if (isRunning && mode === 'active') {
      autoMinimizedRef.current = true;
      setMode('mini');
    } else if (!isRunning && mode === 'mini' && autoMinimizedRef.current) {
      autoMinimizedRef.current = false;
      setMode('active');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  return null;
}

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
      const merged = Array.from(new Set([...todayPlan.completedPriorityIds, ...newCompletedIds]));
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

export { CheckInTrigger };

const PANEL_WIDTHS: Record<WindowMode, number> = {
  mini:     296,
  active:   432,
  planning: 524,
  expanded: 640,
};

const DESKTOP_BG =
  'linear-gradient(148deg, #c2cfc4 0%, #b5c5b8 30%, #abc0ae 60%, #a4baa6 100%)';

const PANEL_BG =
  'linear-gradient(168deg, #ECF1EC 0%, #E5EDE6 55%, #E1EAE2 100%)';

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { mode } = useWindowMode();

  const hideNav = location === '/welcome' || location === '/setup';

  const effectiveMode: WindowMode =
    mode === 'mini' ? 'mini' :
    (location === '/trends' || location === '/settings' || location === '/home') ? 'expanded' :
    mode;

  const panelWidth = PANEL_WIDTHS[effectiveMode];

  if (hideNav) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          background: DESKTOP_BG,
          fontFamily: "'DM Sans', sans-serif",
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: DESKTOP_BG,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Floating companion panel */}
      <div
        style={{
          position: 'fixed',
          top: 22,
          left: '50%',
          transform: 'translateX(-50%)',
          width: panelWidth,
          maxHeight: 'calc(100dvh - 44px)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.30s cubic-bezier(0.22, 1, 0.36, 1)',
          zIndex: 10,
        }}
      >
        <div
          style={{
            borderRadius: 20,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            background: PANEL_BG,
            border: '1px solid rgba(255,255,255,0.80)',
            boxShadow:
              '0 28px 64px rgba(34,37,39,0.22), 0 8px 20px rgba(34,37,39,0.10), 0 2px 6px rgba(34,37,39,0.06), inset 0 1px 0 rgba(255,255,255,0.65)',
            maxHeight: '100%',
          }}
        >
          {effectiveMode !== 'mini' && <TopNav effectiveMode={effectiveMode} />}

          <div
            style={{
              overflowY: 'auto',
              overflowX: 'hidden',
              flex: 1,
              minHeight: 0,
            }}
          >
            <div
              style={{
                padding: effectiveMode === 'mini'
                  ? '14px 12px 18px'
                  : effectiveMode === 'active'
                    ? '14px 13px 18px'
                    : '16px 14px 22px',
              }}
            >
              {children}
            </div>
          </div>
        </div>
      </div>

      <TimerModeSync />
      <CheckInTrigger />
    </div>
  );
}
