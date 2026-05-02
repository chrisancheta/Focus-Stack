import React from 'react';
import { useAppStore } from '@/lib/storeContext';
import { KpiWidget } from '@/components/shared/KpiWidget';
import { WeeklyBarChart } from '@/components/shared/WeeklyBarChart';
import { SectionCard } from '@/components/shared/SectionCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Trends</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button className="p-1 hover:text-foreground transition-colors"><ChevronLeft className="h-4 w-4" /></button>
          <span className="font-medium">This Week</span>
          <button className="p-1 hover:text-foreground transition-colors opacity-50 cursor-not-allowed"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KpiWidget 
          title="Completion Rate" 
          value={summary ? `${Math.round(summary.completionRate * 100)}%` : '--'}
          subtitle="Of planned priorities"
        />
        <KpiWidget 
          title="Carryover" 
          value={summary?.carryoverCount || 0}
          subtitle="Items moved to next day"
        />
        <KpiWidget 
          title="Current Streak" 
          value={summary?.streakDays || 0}
          subtitle="Days planned"
        />
        <KpiWidget 
          title="Total Planned" 
          value={summary?.plannedCount || 0}
          subtitle="Priorities set"
        />
        <KpiWidget 
          title="Total Completed" 
          value={summary?.completedCount || 0}
          subtitle="Priorities finished"
        />
        <KpiWidget 
          title="Focused Days" 
          value={summary?.within35DaysCount || 0}
          subtitle="Days with 3-5 items"
        />
      </div>

      <SectionCard title="Weekly Volume">
        <WeeklyBarChart data={chartData} />
      </SectionCard>

      {summary?.summaryText && (
        <SectionCard title="Insights">
          <p className="text-muted-foreground leading-relaxed text-sm">
            {summary.summaryText}
          </p>
        </SectionCard>
      )}
    </div>
  );
}
