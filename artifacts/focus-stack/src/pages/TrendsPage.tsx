import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/storeContext';
import { WeeklyBarChart } from '@/components/shared/WeeklyBarChart';
import { RecommendationChip } from '@/components/priority/RecommendationChip';
import {
  ChevronLeft, ChevronRight, Layers, RotateCcw, CalendarX,
  TrendingUp, CheckCircle2, Activity, Target, ArrowRight, Flame,
} from 'lucide-react';
import { DayPlan, PriorityCard } from '@/lib/store';
import { getTodayISODate } from '@/lib/utils';

// ── Design tokens ──────────────────────────────────────────────────────────────

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

const DOW_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ── Coaching card config ────────────────────────────────────────────────────────

const SEV_STYLES = {
  warning: {
    bg:          'rgba(194,130,0,0.10)',
    border:      'rgba(194,130,0,0.26)',
    indicator:   'rgba(194,130,0,0.82)',
    iconBg:      'rgba(194,130,0,0.14)',
    iconColor:   '#7a5000',
    actionColor: '#6b4800',
  },
  positive: {
    bg:          'rgba(107,143,110,0.12)',
    border:      'rgba(107,143,110,0.28)',
    indicator:   'rgba(107,143,110,0.82)',
    iconBg:      'rgba(107,143,110,0.18)',
    iconColor:   '#2a4e2d',
    actionColor: '#2a4e2d',
  },
  info: {
    bg:          'rgba(255,255,255,0.44)',
    border:      'rgba(255,255,255,0.62)',
    indicator:   'rgba(144,157,146,0.65)',
    iconBg:      'rgba(144,157,146,0.18)',
    iconColor:   'rgba(34,37,39,0.60)',
    actionColor: 'rgba(34,37,39,0.62)',
  },
};

type Severity = 'warning' | 'positive' | 'info';

interface Recommendation {
  id:       string;
  IconComp: React.ElementType;
  title:    string;
  body:     string;
  action:   string;
  severity: Severity;
}

// ── Pure logic ─────────────────────────────────────────────────────────────────

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

function computeStreakDetails(dayPlans: DayPlan[], activeDays: number[]) {
  const plannedDates = new Set(
    dayPlans
      .filter(dp => dp.selectedPriorityIds.length > 0 || dp.zeroPriorityDay)
      .map(dp => dp.date)
  );
  const activeDaySet = new Set(activeDays.length > 0 ? activeDays : [0,1,2,3,4,5,6]);
  const today = new Date();
  let streak = 0, gapDays = 0, lastActiveDaysAgo: number | null = null;
  let foundFirst = false;

  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const dow = d.getDay();
    if (!activeDaySet.has(dow)) continue;
    if (plannedDates.has(key)) {
      if (!foundFirst) { foundFirst = true; lastActiveDaysAgo = i; }
      streak++;
    } else {
      if (!foundFirst) { if (i > 0) gapDays++; if (gapDays > 60) break; }
      else break;
    }
  }
  return { streak, gapDays, lastActiveDaysAgo };
}

function weekLabel(offset: number): string {
  if (offset === 0) return 'This Week';
  if (offset === -1) return 'Last Week';
  return `${Math.abs(offset)} Weeks Ago`;
}

function buildRecommendations(data: {
  completionPct: number;
  totalPlanned: number;
  totalCompleted: number;
  avgDailyLoad: number;
  carryoverCount: number;
  unplannedActiveDays: number;
  focusedDays: number;
  highLoadDays: number;
  streak: number;
  weekOffset: number;
  zeroDays: number;
}): Recommendation[] {
  const {
    completionPct, totalPlanned, avgDailyLoad, carryoverCount,
    unplannedActiveDays, focusedDays, highLoadDays, weekOffset,
    zeroDays, totalCompleted,
  } = data;

  const recs: Recommendation[] = [];

  if (totalPlanned === 0 && zeroDays === 0) {
    recs.push({
      id: 'no-data', IconComp: Target,
      title: weekOffset === 0 ? 'No priorities this week yet' : 'No data for this week',
      body: weekOffset === 0
        ? 'Add priorities on the Eisenhower screen. Tracking even one day improves next week.'
        : 'Nothing recorded for this period.',
      action: '',
      severity: 'info',
    });
    return recs;
  }

  // Overplanning — too many tasks/day driving down completion
  if (avgDailyLoad > 5.5 || highLoadDays >= 2) {
    recs.push({
      id: 'overplanning', IconComp: Layers,
      title: `Cut the list — ${avgDailyLoad.toFixed(1)} tasks/day is too many`,
      body: `Heavy days end in carryover, not completion. The gap between bars shows exactly where this hurts.`,
      action: `Max 5 per day. Move the rest to "Could do" and only promote when you finish early.`,
      severity: 'warning',
    });
  }

  // Carryover buildup
  if (carryoverCount >= 3 && completionPct < 70) {
    recs.push({
      id: 'carryover', IconComp: RotateCcw,
      title: `Stop adding. Clear ${carryoverCount} carryovers first.`,
      body: `Below 70% means tasks pile up faster than you resolve them. Adding more makes this worse.`,
      action: `For each carryover: do it now, set a real date, or drop it. Don't carry it again.`,
      severity: 'warning',
    });
  } else if (carryoverCount >= 1 && completionPct < 60) {
    recs.push({
      id: 'carryover-mild', IconComp: RotateCcw,
      title: `Clear carryover first — ${completionPct}% rate`,
      body: `${carryoverCount} task${carryoverCount > 1 ? 's' : ''} deferred at below-average completion. Don't add more until these are handled.`,
      action: `Each carryover: do it, set a concrete date, or drop it. This week, not "later."`,
      severity: 'info',
    });
  }

  // Gaps — unplanned active days
  if (unplannedActiveDays >= 2) {
    recs.push({
      id: 'unplanned', IconComp: CalendarX,
      title: `${unplannedActiveDays} days with no plan`,
      body: `Unplanned days mean invisible output — you may have worked, but nothing tracked here.`,
      action: `Open Focus Stack before starting work. Name 1–3 priorities first, every day.`,
      severity: 'info',
    });
  }

  // Under-capacity — finishing well but under-challenging self
  if (totalPlanned > 0 && avgDailyLoad < 2.5 && completionPct >= 80) {
    recs.push({
      id: 'undercapacity', IconComp: TrendingUp,
      title: `You have headroom — raise the bar`,
      body: `${completionPct}% on ${avgDailyLoad.toFixed(1)} tasks/day means higher-value work is sitting undone.`,
      action: `Add 1–2 harder tasks next week. You're completing everything — use that.`,
      severity: 'positive',
    });
  }

  // Low completion, not overplanning
  if (completionPct < 50 && avgDailyLoad <= 5 && totalPlanned >= 5 && carryoverCount < 3) {
    recs.push({
      id: 'low-completion', IconComp: Activity,
      title: `Momentum problem — ${completionPct}% on a reasonable list`,
      body: `${totalPlanned} planned, ${totalCompleted} done. List size isn't the issue — execution is.`,
      action: `Name your #1 task first thing. Finish it before you open anything else.`,
      severity: 'warning',
    });
  }

  // Great week
  if (completionPct >= 80 && focusedDays >= 3 && carryoverCount <= 1) {
    recs.push({
      id: 'great-week', IconComp: CheckCircle2,
      title: `Repeat this — ${completionPct}%, ${focusedDays} days in range`,
      body: `Planning matched execution this week. This is your calibration point.`,
      action: `Keep the same daily load. Use this week as your benchmark.`,
      severity: 'positive',
    });
  }

  // Catch-all: always provide one concrete recommendation if there is any data
  if (recs.length === 0 && (totalPlanned > 0 || streak > 0)) {
    recs.push({
      id: 'default', IconComp: Target,
      title: 'Commit to your top task first',
      body: `Pick 3–5 priorities, then clear the top one before anything else. That habit compounds faster than any other.`,
      action: 'Tomorrow: name your #1 before opening any messages. Protect the first hour.',
      severity: 'info',
    });
  }

  // Sort: warnings first, then info, then positive
  const order: Record<Severity, number> = { warning: 0, info: 1, positive: 2 };
  recs.sort((a, b) => order[a.severity] - order[b.severity]);

  return recs.slice(0, 2);
}

// ── Sub-components ─────────────────────────────────────────────────────────────

interface KpiTileProps {
  label: string;
  value: string | number;
  sub: string;
  accent?: 'positive' | 'warning' | 'neutral' | 'streak';
  subtitleStyle?: React.CSSProperties;
}

function KpiTile({ label, value, sub, accent = 'neutral', subtitleStyle }: KpiTileProps) {
  const valueColor =
    accent === 'positive' ? '#2a4e2d' :
    accent === 'warning'  ? '#7a5000' :
    accent === 'streak'   ? '#222527' :
    'rgba(34,37,39,0.85)';

  return (
    <div
      className="rounded-2xl p-3.5"
      style={{
        background: 'rgba(255,255,255,0.52)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.68)',
        boxShadow: '0 1px 8px rgba(34,37,39,0.05)',
      }}
    >
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#222527]/50 mb-1">{label}</p>
      <p className="text-2xl font-light leading-none mb-1" style={{ color: valueColor }}>{value}</p>
      <p className="text-[10px] text-[#222527]/48 leading-snug" style={subtitleStyle}>{sub}</p>
    </div>
  );
}

function CoachingCard({ rec }: { rec: Recommendation }) {
  const s = SEV_STYLES[rec.severity];
  const { IconComp } = rec;

  return (
    <div
      className="relative rounded-2xl overflow-hidden px-5 py-4"
      style={{
        background: s.bg,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: `1px solid ${s.border}`,
      }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-sm" style={{ background: s.indicator }} />
      <div className="flex items-start gap-3">
        <div
          className="shrink-0 p-1.5 rounded-xl mt-0.5"
          style={{ background: s.iconBg }}
        >
          <IconComp className="h-4 w-4" style={{ color: s.iconColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#222527] leading-snug mb-2">{rec.title}</p>
          {rec.action && (
            <div
              className="flex items-start gap-2 rounded-xl px-3 py-2 mb-2.5"
              style={{ background: 'rgba(255,255,255,0.55)', border: `1px solid ${s.border}` }}
            >
              <ArrowRight className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: s.actionColor }} />
              <p className="text-[12px] font-semibold leading-snug" style={{ color: s.actionColor }}>
                {rec.action}
              </p>
            </div>
          )}
          <p className="text-[11px] text-[#222527]/52 leading-snug">{rec.body}</p>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function TrendsPage() {
  const { state } = useAppStore();
  const [weekOffset, setWeekOffset] = useState(0);

  const weekStartDay: 0 | 1 = state.settings?.weekStartDay ?? 1;
  const activeDays: number[] = state.settings?.activeDays ?? [1, 2, 3, 4, 5];

  const weekDates = useMemo(
    () => getWeekDates(weekStartDay, weekOffset),
    [weekStartDay, weekOffset],
  );

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const planByDate = useMemo(() => {
    const map = new Map<string, DayPlan>();
    state.dayPlans.forEach(dp => map.set(dp.date, dp));
    return map;
  }, [state.dayPlans]);

  const activeDaySet = useMemo(
    () => new Set(activeDays.length > 0 ? activeDays : [0,1,2,3,4,5,6]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.settings?.activeDays],
  );

  const todayIndex = useMemo(
    () => weekDates.indexOf(todayStr),
    [weekDates, todayStr],
  );

  const chartData = useMemo(() =>
    weekDates.map(dateStr => {
      const dp = planByDate.get(dateStr);
      const dow = new Date(dateStr + 'T12:00:00').getDay();
      return {
        day:       DOW_SHORT[dow],
        planned:   dp ? dp.selectedPriorityIds.length  : 0,
        completed: dp ? dp.completedPriorityIds.length : 0,
      };
    }),
    [weekDates, planByDate],
  );

  const { totalPlanned, totalCompleted, focusedDays, zeroDays, highLoadDays, activePlannedDays } = useMemo(() => {
    let planned = 0, completed = 0, focused = 0, zero = 0, highLoad = 0, plannedDays = 0;
    weekDates.forEach(d => {
      const dow = new Date(d + 'T12:00:00').getDay();
      if (!activeDaySet.has(dow)) return;
      const dp = planByDate.get(d);
      if (!dp) return;
      if (dp.zeroPriorityDay && dp.selectedPriorityIds.length === 0) { zero++; return; }
      const n = dp.selectedPriorityIds.length;
      if (n > 0) { planned += n; completed += dp.completedPriorityIds.length; plannedDays++; }
      if (n >= 3 && n <= 5) focused++;
      if (n > 5) highLoad++;
    });
    return {
      totalPlanned: planned, totalCompleted: completed,
      focusedDays: focused, zeroDays: zero,
      highLoadDays: highLoad, activePlannedDays: plannedDays,
    };
  }, [weekDates, planByDate, activeDaySet]);

  const completionPct = totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0;
  const avgDailyLoad  = activePlannedDays > 0 ? totalPlanned / activePlannedDays : 0;

  const carryoverCount = useMemo(
    () => state.priorities.filter(p => p.isCarryover && p.status !== 'completed').length,
    [state.priorities],
  );

  // Unplanned active days that have passed (not today)
  const unplannedActiveDays = useMemo(() => {
    return weekDates.filter(d => {
      if (d >= todayStr) return false;
      const dow = new Date(d + 'T12:00:00').getDay();
      if (!activeDaySet.has(dow)) return false;
      const dp = planByDate.get(d);
      if (!dp) return true;
      return dp.selectedPriorityIds.length === 0 && !dp.zeroPriorityDay;
    }).length;
  }, [weekDates, planByDate, activeDaySet, todayStr]);

  const { streak, gapDays, lastActiveDaysAgo } = useMemo(
    () => computeStreakDetails(state.dayPlans, activeDays),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.dayPlans, state.settings?.activeDays],
  );

  const streakSub = streak > 0 ? 'Days planned' :
    lastActiveDaysAgo === null ? 'No plans yet' :
    gapDays === 1 ? 'Missed yesterday' :
    gapDays <= 6 ? `Gap: ${gapDays} days` :
    `Last: ${lastActiveDaysAgo}d ago`;

  const streakSubStyle: React.CSSProperties =
    streak > 0 || lastActiveDaysAgo === null ? {} :
    gapDays <= 3 ? { color: 'rgba(180,120,40,0.85)' } :
    { color: 'rgba(180,70,60,0.80)' };

  const completionAccent: KpiTileProps['accent'] =
    completionPct >= 80 ? 'positive' : completionPct > 0 && completionPct < 50 ? 'warning' : 'neutral';

  const carryoverAccent: KpiTileProps['accent'] =
    carryoverCount >= 3 ? 'warning' : carryoverCount === 0 ? 'positive' : 'neutral';

  const recommendations = useMemo(() => buildRecommendations({
    completionPct, totalPlanned, totalCompleted, avgDailyLoad,
    carryoverCount, unplannedActiveDays, focusedDays,
    highLoadDays, streak, weekOffset, zeroDays,
  }), [completionPct, totalPlanned, totalCompleted, avgDailyLoad, carryoverCount,
      unplannedActiveDays, focusedDays, highLoadDays, streak, weekOffset, zeroDays]);

  // ── Today bridge ─────────────────────────────────────────────────────────
  const todayStr2 = getTodayISODate();
  const todayPlan2 = state.dayPlans.find(dp => dp.date === todayStr2) ?? null;
  const todayRankedIds = todayPlan2?.selectedPriorityIds ?? [];
  const todayActivePriorities = todayRankedIds
    .map((id: string) => state.priorities.find((p: PriorityCard) => p.id === id))
    .filter((p: PriorityCard | undefined): p is PriorityCard =>
      !!p && p.status !== 'completed' && p.status !== 'dropped' && p.status !== 'deferred'
    );
  const todayTopPriority = todayActivePriorities[0] ?? null;
  const todayDoneCount   = todayPlan2?.completedPriorityIds.length ?? 0;
  const todayTotalCount  = todayActivePriorities.length + todayDoneCount;

  const todayModeLabel =
    !todayPlan2 || todayTotalCount === 0 ? 'No plan today' :
    todayDoneCount === todayTotalCount    ? 'Day complete' :
    todayDoneCount > 0                   ? 'In focus' :
    'Not started';

  const todayModeDot =
    todayDoneCount === todayTotalCount && todayTotalCount > 0 ? '#5a7d5d' :
    todayDoneCount > 0                                        ? '#5a7d5d' :
    todayTotalCount > 0                                       ? 'rgba(34,37,39,0.30)' :
    'rgba(34,37,39,0.16)';

  return (
    <div className="space-y-4">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-base font-semibold text-[#222527] tracking-tight">Trends</h2>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setWeekOffset(o => o - 1)}
            className="p-1.5 rounded-full text-[#222527]/50 hover:text-[#222527] transition-colors"
            style={{ background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.60)' }}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span
            className="text-xs font-semibold text-[#222527]/65 px-3 py-1.5 rounded-full min-w-[90px] text-center"
            style={{ background: 'rgba(255,255,255,0.52)', border: '1px solid rgba(255,255,255,0.68)' }}
          >
            {weekLabel(weekOffset)}
          </span>
          <button
            onClick={() => setWeekOffset(o => Math.min(0, o + 1))}
            disabled={weekOffset === 0}
            className="p-1.5 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-30 text-[#222527]/50 hover:text-[#222527]"
            style={{ background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.60)' }}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── Today bridge ───────────────────────────────────────────────── */}
      {weekOffset === 0 && (
        <div
          className="rounded-2xl px-4 py-3 flex items-center gap-3"
          style={GLASS_SUBTLE}
        >
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: todayModeDot }}
            />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#222527]/40">
              {todayModeLabel}
            </span>
          </div>
          <div className="w-px h-4 shrink-0" style={{ background: 'rgba(34,37,39,0.10)' }} />
          {todayTopPriority ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <RecommendationChip label={todayTopPriority.recommendationLabel} />
              <span className="text-[11px] font-medium text-[#222527]/55 truncate">
                {todayTopPriority.title}
              </span>
            </div>
          ) : (
            <span className="text-[11px] text-[#222527]/36">
              Add priorities on Eisenhower to start tracking
            </span>
          )}
          {todayTotalCount > 0 && (
            <span
              className="text-[10px] font-semibold shrink-0 px-2 py-0.5 rounded-full"
              style={{
                background: todayDoneCount === todayTotalCount ? 'rgba(107,143,110,0.16)' : 'rgba(34,37,39,0.07)',
                color:      todayDoneCount === todayTotalCount ? '#5a7d5d' : 'rgba(34,37,39,0.44)',
              }}
            >
              {todayDoneCount}/{todayTotalCount}
            </span>
          )}
        </div>
      )}

      {/* ── KPI strip ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-2.5">
        <KpiTile
          label="Completion"
          value={totalPlanned > 0 ? `${completionPct}%` : '—'}
          sub={totalPlanned > 0 ? `${totalCompleted} of ${totalPlanned}` : 'No plan yet'}
          accent={completionAccent}
        />
        <KpiTile
          label="Streak"
          value={streak}
          sub={streakSub}
          accent="streak"
          subtitleStyle={streakSubStyle}
        />
        <KpiTile
          label="Well-scoped"
          value={focusedDays}
          sub="Days in range"
          accent={focusedDays >= 3 ? 'positive' : 'neutral'}
        />
        <KpiTile
          label="Carryover"
          value={carryoverCount}
          sub={
            carryoverCount === 0
              ? 'Clear'
              : carryoverCount === 1 ? '1 task deferred' : `${carryoverCount} deferred`
          }
          accent={carryoverAccent}
        />
      </div>

      {/* ── Chart card ─────────────────────────────────────────────────── */}
      <div className="rounded-3xl p-5" style={GLASS}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#222527]/55 mb-0.5">
              Weekly Completion
            </p>
            <p className="text-xs text-[#222527]/45">
              {weekLabel(weekOffset).toLowerCase()} · avg {avgDailyLoad > 0 ? avgDailyLoad.toFixed(1) : '0'} tasks/day
            </p>
          </div>
          {totalPlanned > 0 && (
            <div className="text-right">
              <p className="text-3xl font-light text-[#222527] leading-none">{completionPct}%</p>
              <p className="text-[11px] text-[#222527]/50 mt-1">
                {totalCompleted} / {totalPlanned}
              </p>
            </div>
          )}
        </div>
        <WeeklyBarChart data={chartData} todayIndex={todayIndex >= 0 ? todayIndex : undefined} />
      </div>

      {/* ── Coaching section ───────────────────────────────────────────── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#222527]/65">
            What to change next week
          </h3>
          <span className="text-[11px] text-[#222527]/40">
            Based on {weekLabel(weekOffset).toLowerCase()}
          </span>
        </div>

        {recommendations.length > 0
          ? recommendations.map(rec => <CoachingCard key={rec.id} rec={rec} />)
          : (
            <div className="rounded-2xl p-4 text-center" style={GLASS_SUBTLE}>
              <p className="text-sm text-[#222527]/50">
                Keep logging your priorities — coaching insights will appear once there's data.
              </p>
            </div>
          )
        }
      </div>

    </div>
  );
}
