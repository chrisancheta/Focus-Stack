import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/storeContext';
import { KpiWidget } from '@/components/shared/KpiWidget';
import { WeeklyBarChart } from '@/components/shared/WeeklyBarChart';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPlan } from '@/lib/store';

const GLASS = {
  background: 'rgba(255,255,255,0.45)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.58)',
};

const GLASS_DARK = {
  background: 'rgba(34,37,39,0.80)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.10)',
};

const DOW_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getWeekDates(weekStartDay: 0 | 1, offset: number): string[] {
  const today = new Date();
  const dow = today.getDay();
  const daysSinceStart = (dow - weekStartDay + 7) % 7;
  const start = new Date(today);
  start.setDate(today.getDate() - daysSinceStart + offset * 7);
  start.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d.toISOString().split('T')[0];
  });
}

function computeStreakDetails(dayPlans: DayPlan[]): {
  streak: number;
  gapDays: number;
  lastActiveDaysAgo: number | null;
} {
  const active = new Set(
    dayPlans
      .filter(dp => dp.selectedPriorityIds.length > 0 || dp.zeroPriorityDay)
      .map(dp => dp.date)
  );
  const today = new Date();
  let streak = 0;
  let gapDays = 0;
  let lastActiveDaysAgo: number | null = null;
  let foundFirst = false;

  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().split('T')[0];

    if (active.has(key)) {
      if (!foundFirst) { foundFirst = true; lastActiveDaysAgo = i; }
      streak++;
    } else {
      if (!foundFirst) {
        if (i > 0) gapDays++;     // today empty doesn't count as gap
        if (gapDays > 60) break;
      } else {
        break;                     // streak broken
      }
    }
  }
  return { streak, gapDays, lastActiveDaysAgo };
}

function weekLabel(offset: number): string {
  if (offset === 0) return 'This Week';
  if (offset === -1) return 'Last Week';
  return `${Math.abs(offset)} Weeks Ago`;
}

function buildInsight(
  completionPct: number,
  focusedDays: number,
  carryover: number,
  totalPlanned: number,
  zeroDays: number,
): string {
  if (totalPlanned === 0 && zeroDays > 0) {
    return `${zeroDays} day${zeroDays > 1 ? 's' : ''} intentionally kept open this week.`;
  }
  if (totalPlanned === 0) {
    return 'No priorities recorded for this week yet. Head to Home to add your first task.';
  }
  const lines: string[] = [];
  if (completionPct >= 80) {
    lines.push(`Strong week — you hit ${completionPct}% completion.`);
  } else if (completionPct >= 50) {
    lines.push(`You completed ${completionPct}% of your priorities this week.`);
  } else {
    lines.push(`Completion was ${completionPct}% — a lower-output week.`);
  }
  if (focusedDays >= 5) {
    lines.push(`${focusedDays} of 7 days landed in the 3–5 item sweet spot.`);
  } else if (focusedDays > 0) {
    lines.push(`${focusedDays} day${focusedDays > 1 ? 's' : ''} had a focused 3–5 item plan.`);
  }
  if (carryover > 2) {
    lines.push(`${carryover} items carried over — consider trimming your list on heavier days.`);
  } else if (carryover > 0) {
    lines.push(`${carryover} item${carryover > 1 ? 's' : ''} carried over.`);
  }
  return lines.join(' ');
}

export default function TrendsPage() {
  const { state } = useAppStore();
  const [weekOffset, setWeekOffset] = useState(0);

  const weekStartDay: 0 | 1 = state.settings?.weekStartDay ?? 1;

  const weekDates = useMemo(
    () => getWeekDates(weekStartDay, weekOffset),
    [weekStartDay, weekOffset],
  );

  const planByDate = useMemo(() => {
    const map = new Map<string, DayPlan>();
    state.dayPlans.forEach(dp => map.set(dp.date, dp));
    return map;
  }, [state.dayPlans]);

  const chartData = useMemo(() =>
    weekDates.map(dateStr => {
      const dp = planByDate.get(dateStr);
      const dow = new Date(dateStr + 'T12:00:00').getDay();
      return {
        day: DOW_SHORT[dow],
        planned:   dp ? dp.selectedPriorityIds.length   : 0,
        completed: dp ? dp.completedPriorityIds.length  : 0,
      };
    }),
    [weekDates, planByDate],
  );

  const { totalPlanned, totalCompleted, focusedDays, zeroDays } = useMemo(() => {
    let planned = 0, completed = 0, focused = 0, zero = 0;
    weekDates.forEach(d => {
      const dp = planByDate.get(d);
      if (!dp) return;
      if (dp.zeroPriorityDay && dp.selectedPriorityIds.length === 0) { zero++; return; }
      planned   += dp.selectedPriorityIds.length;
      completed += dp.completedPriorityIds.length;
      const n = dp.selectedPriorityIds.length;
      if (n >= 3 && n <= 5) focused++;
    });
    return { totalPlanned: planned, totalCompleted: completed, focusedDays: focused, zeroDays: zero };
  }, [weekDates, planByDate]);

  const completionPct = totalPlanned > 0
    ? Math.round((totalCompleted / totalPlanned) * 100)
    : 0;

  const carryoverCount = useMemo(
    () => state.priorities.filter(p => p.isCarryover && p.status !== 'completed').length,
    [state.priorities],
  );

  const { streak, gapDays, lastActiveDaysAgo } = useMemo(
    () => computeStreakDetails(state.dayPlans),
    [state.dayPlans],
  );

  const streakSubtitle = (() => {
    if (streak > 0)                         return 'Days planned';
    if (lastActiveDaysAgo === null)          return 'No plans yet';
    if (gapDays === 1)                       return 'Missed yesterday';
    if (gapDays <= 6)                        return `Gap: ${gapDays} days`;
    return `Last: ${lastActiveDaysAgo}d ago`;
  })();

  const streakSubtitleStyle: React.CSSProperties = (() => {
    if (streak > 0 || lastActiveDaysAgo === null) return {};
    if (gapDays <= 3) return { color: 'rgba(180,120,40,0.85)' };
    return { color: 'rgba(180,70,60,0.80)' };
  })();

  const insightText = buildInsight(completionPct, focusedDays, carryoverCount, totalPlanned, zeroDays);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-base font-semibold text-[#222527] tracking-tight">Trends</h2>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setWeekOffset(o => o - 1)}
            className="p-1.5 rounded-full text-[#222527]/50 hover:text-[#222527] transition-colors"
            style={{ background: 'rgba(255,255,255,0.40)', border: '1px solid rgba(255,255,255,0.55)' }}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span
            className="text-xs font-semibold text-[#222527]/60 px-3 py-1.5 rounded-full min-w-[90px] text-center"
            style={{ background: 'rgba(255,255,255,0.40)', border: '1px solid rgba(255,255,255,0.55)' }}
          >
            {weekLabel(weekOffset)}
          </span>
          <button
            onClick={() => setWeekOffset(o => Math.min(0, o + 1))}
            disabled={weekOffset === 0}
            className="p-1.5 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-30 text-[#222527]/50 hover:text-[#222527]"
            style={{ background: 'rgba(255,255,255,0.30)', border: '1px solid rgba(255,255,255,0.40)' }}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="rounded-3xl p-5" style={GLASS}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#222527]/40 mb-1">Completion</p>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-light text-[#222527]">{completionPct}%</span>
              <span className="text-sm text-[#222527]/45 mb-1.5">
                {weekOffset === 0 ? 'this week' : weekLabel(weekOffset).toLowerCase()}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#222527]/40 mb-1">Carryover</p>
            <div className="flex items-end gap-2 justify-end">
              <span className="text-4xl font-light text-[#222527]">{carryoverCount}</span>
              <span className="text-sm text-[#222527]/45 mb-1.5">items</span>
            </div>
          </div>
        </div>

        <WeeklyBarChart data={chartData} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiWidget title="Streak" value={streak} subtitle={streakSubtitle} subtitleStyle={streakSubtitleStyle} />
        <KpiWidget title="Planned"      value={totalPlanned}   subtitle="Priorities set"     />
        <KpiWidget title="Completed"    value={totalCompleted} subtitle="Priorities finished" />
        <KpiWidget title="Focused Days" value={focusedDays}    subtitle="Days with 3–5 items" />
      </div>

      <div className="rounded-2xl p-5" style={GLASS}>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#222527]/40 mb-3">Insights</p>
        <p className="text-sm text-[#222527]/65 leading-relaxed">{insightText}</p>
      </div>
    </div>
  );
}
