import React from 'react';
import { useAppStore } from '@/lib/storeContext';
import { KpiWidget } from '@/components/shared/KpiWidget';
import { WeeklyBarChart } from '@/components/shared/WeeklyBarChart';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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

export default function TrendsPage() {
  const { state } = useAppStore();
  const summary = state.weeklySummaries[0];

  const chartData = [
    { day: 'Mon', planned: 4, completed: 3 },
    { day: 'Tue', planned: 5, completed: 3 },
    { day: 'Wed', planned: 3, completed: 3 },
    { day: 'Thu', planned: 4, completed: 4 },
    { day: 'Fri', planned: 5, completed: 3 },
    { day: 'Sat', planned: 2, completed: 2 },
    { day: 'Sun', planned: 3, completed: 2 },
  ];

  const completionPct = summary ? Math.round(summary.completionRate * 100) : 71;
  const carryoverCount = summary?.carryoverCount ?? 3;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-base font-semibold text-[#222527] tracking-tight">Trends</h2>
        <div className="flex items-center gap-1.5">
          <button
            className="p-1.5 rounded-full text-[#222527]/50 hover:text-[#222527] transition-colors"
            style={{ background: 'rgba(255,255,255,0.40)', border: '1px solid rgba(255,255,255,0.55)' }}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span
            className="text-xs font-semibold text-[#222527]/60 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.40)', border: '1px solid rgba(255,255,255,0.55)' }}
          >
            This Week
          </span>
          <button
            className="p-1.5 rounded-full text-[#222527]/25 cursor-not-allowed"
            style={{ background: 'rgba(255,255,255,0.30)', border: '1px solid rgba(255,255,255,0.40)' }}
            disabled
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div
        className="rounded-3xl p-5"
        style={GLASS}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#222527]/40 mb-1">Completion</p>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-light text-[#222527]">{completionPct}%</span>
              <span className="text-sm text-[#222527]/45 mb-1.5">this week</span>
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
        <KpiWidget
          title="Streak"
          value={summary?.streakDays ?? 4}
          subtitle="Days planned"
        />
        <KpiWidget
          title="Planned"
          value={summary?.plannedCount ?? 28}
          subtitle="Priorities set"
        />
        <KpiWidget
          title="Completed"
          value={summary?.completedCount ?? 20}
          subtitle="Priorities finished"
        />
        <KpiWidget
          title="Focused Days"
          value={summary?.within35DaysCount ?? 5}
          subtitle="Days with 3–5 items"
        />
      </div>

      {summary?.summaryText && (
        <div className="rounded-2xl p-5" style={GLASS}>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#222527]/40 mb-3">Insights</p>
          <p className="text-sm text-[#222527]/65 leading-relaxed">
            {summary.summaryText}
          </p>
        </div>
      )}

      {!summary?.summaryText && (
        <div className="rounded-2xl p-5" style={GLASS}>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#222527]/40 mb-3">Insights</p>
          <p className="text-sm text-[#222527]/65 leading-relaxed">
            You completed at least 70% of your priorities on 5 of 7 days. Carryover was highest on days when you selected more than 5 items — consider keeping it to 3 on high-effort days.
          </p>
        </div>
      )}

      <button
        className="w-full h-12 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-80"
        style={GLASS_DARK}
      >
        View full history
      </button>
    </div>
  );
}
