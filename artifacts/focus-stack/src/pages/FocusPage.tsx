import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Link2, Coffee, Zap, RotateCcw, Play, Pause, ArrowRight } from 'lucide-react';
import { FocusTimerWidget } from '@/components/shared/FocusTimerWidget';
import { RecommendationChip } from '@/components/priority/RecommendationChip';
import { useAppStore } from '@/lib/storeContext';
import { useTimer } from '@/lib/timerContext';
import { getTodayISODate } from '@/lib/utils';
import type { PriorityCard } from '@/lib/store';

const GLASS = {
  background: 'rgba(255,255,255,0.55)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1.5px solid rgba(255,255,255,0.76)',
  boxShadow: '0 2px 16px rgba(34,37,39,0.07)',
};

const GLASS_SUBTLE = {
  background: 'rgba(255,255,255,0.38)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.52)',
};

export default function FocusPage() {
  const { state } = useAppStore();
  const { linkedPriorityId, linkPriority, isRunning, isDone, toggle, reset, timeLeft, duration } = useTimer();
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const today = getTodayISODate();
  const todayPlan = state.dayPlans.find(dp => dp.date === today) ?? null;
  const todayRankedIds = todayPlan?.selectedPriorityIds ?? [];

  const todayActivePriorities = todayRankedIds
    .map(id => state.priorities.find(p => p.id === id))
    .filter((p): p is PriorityCard =>
      !!p && p.status !== 'completed' && p.status !== 'dropped' && p.status !== 'deferred'
    );

  const topTodayPriority  = todayActivePriorities[0] ?? null;
  const nextTodayPriority = todayActivePriorities[1] ?? null;

  const activePriorities  = state.priorities.filter(
    p => p.status !== 'completed' && p.status !== 'dropped' && p.status !== 'deferred'
  );
  const offPlanPriorities = activePriorities.filter(p => !todayRankedIds.includes(p.id));

  const linked = linkedPriorityId
    ? state.priorities.find(p => p.id === linkedPriorityId)
    : null;

  const linkedRankInToday = linked && todayRankedIds.includes(linked.id)
    ? todayRankedIds.indexOf(linked.id) + 1
    : 0;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    if (showPicker) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showPicker]);

  const todaySessions    = state.focusSessions.filter(s => s.startedAt.slice(0, 10) === today);
  const completedCount   = todaySessions.length;
  const setSize          = 4;
  const positionInSet    = completedCount % setSize;
  const completedSets    = Math.floor(completedCount / setSize);
  const isLongBreakDue   = isDone && positionInSet === 0 && completedCount > 0;
  const isShortBreakDue  = isDone && positionInSet !== 0;
  const totalFocusedMins = todaySessions.reduce((acc, s) => acc + s.plannedMinutes, 0);
  const nextBreakType    = positionInSet === 3 ? 'Long break' : 'Short break';
  const isPaused         = !isRunning && !isDone && timeLeft < duration * 60;
  const isIdle           = !isRunning && !isDone && timeLeft === duration * 60;
  const sessionLabel     = `Session ${positionInSet + 1} of 4`;

  const doneCount    = todayPlan ? todayPlan.completedPriorityIds.length : 0;
  const totalInPlan  = todayActivePriorities.length + doneCount;

  return (
    <div className="flex flex-col items-center gap-3 pb-8 max-w-md mx-auto w-full">

      {/* ── Session context bar ─────────────────────────────────────────── */}
      <div className="w-full flex items-center justify-between px-1 pt-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: setSize }).map((_, i) => {
              const filled = i < positionInSet;
              const isNext = i === positionInSet && !isDone;
              return (
                <span key={i} style={{
                  display: 'block',
                  width:   filled ? 9 : isNext ? 7 : 6,
                  height:  filled ? 9 : isNext ? 7 : 6,
                  borderRadius: '50%',
                  background: filled ? '#222527' : isNext ? 'rgba(34,37,39,0.28)' : 'rgba(34,37,39,0.12)',
                  border: isNext ? '1.5px solid rgba(34,37,39,0.35)' : 'none',
                  transition: 'all 0.3s',
                }} />
              );
            })}
          </div>
          <span className="text-xs font-medium text-[#222527]/55">{sessionLabel}</span>
          {completedSets > 0 && (
            <span className="text-[11px] text-[#222527]/35">
              · {completedSets} {completedSets === 1 ? 'set' : 'sets'} done
            </span>
          )}
        </div>
        {!isDone && (
          <div
            className="flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11px] font-medium"
            style={{ background: 'rgba(255,255,255,0.42)', border: '1px solid rgba(255,255,255,0.60)', color: 'rgba(34,37,39,0.50)' }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full inline-block"
              style={{ background: positionInSet === 3 ? '#6B8F6E' : 'rgba(34,37,39,0.28)' }}
            />
            Next: {nextBreakType}
          </div>
        )}
      </div>

      {/* ── Timer widget ───────────────────────────────────────────────── */}
      <div className="w-full flex justify-center" style={{ marginTop: '-44px', marginBottom: '-44px' }}>
        <div style={{ transform: 'scale(0.82)', transformOrigin: 'center' }}>
          <FocusTimerWidget />
        </div>
      </div>

      {/* ── Task linkage ───────────────────────────────────────────────── */}
      <div className="w-full relative" ref={pickerRef}>

        {linked ? (
          /* Linked card — recommendation vocabulary + rank */
          <div className="w-full rounded-2xl overflow-hidden" style={GLASS}>
            <div
              className="flex items-center gap-2 px-4 py-2.5"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.55)' }}
            >
              <Link2 className="h-3 w-3 text-[#6B8F6E] shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#222527]/36">Focusing on</span>
              {linkedRankInToday > 0 && (
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: linkedRankInToday === 1 ? '#222527' : 'rgba(34,37,39,0.10)',
                    color:      linkedRankInToday === 1 ? '#fff'    : 'rgba(34,37,39,0.52)',
                  }}
                >
                  #{linkedRankInToday} today
                </span>
              )}
              <RecommendationChip label={linked.recommendationLabel} />
              <div className="flex-1" />
              {!isRunning && (
                <button
                  onClick={() => linkPriority(null)}
                  className="p-1 rounded-lg text-[#222527]/28 hover:text-[#222527]/56 transition-colors"
                  title="Unlink task"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="px-4 py-3.5">
              <p className="text-[15px] font-semibold text-[#222527] leading-snug mb-1.5">{linked.title}</p>
              {linked.recommendationReason && (
                <p className="text-[11px] text-[#222527]/42 leading-snug mb-2">{linked.recommendationReason}</p>
              )}
              {linkedRankInToday === 1 && nextTodayPriority && (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] text-[#222527]/28">Up next:</span>
                  <span className="text-[10px] font-medium text-[#222527]/48 truncate max-w-[170px]">
                    {nextTodayPriority.title}
                  </span>
                  <RecommendationChip label={nextTodayPriority.recommendationLabel} />
                </div>
              )}
            </div>
          </div>

        ) : topTodayPriority && !showPicker ? (
          /* Suggested — top-ranked task from today's plan */
          <div className="w-full rounded-2xl overflow-hidden" style={GLASS}>
            <div
              className="flex items-center justify-between gap-2 px-4 py-2.5"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.55)' }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                  style={{ background: '#222527', color: '#fff' }}
                >1</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#222527]/36">
                  Suggested for this session
                </span>
                <RecommendationChip label={topTodayPriority.recommendationLabel} />
              </div>
              <button
                onClick={() => !isRunning && setShowPicker(true)}
                disabled={isRunning}
                className="text-[10px] text-[#222527]/34 hover:text-[#222527]/58 transition-colors disabled:opacity-30 shrink-0"
              >
                Change
              </button>
            </div>
            <button
              onClick={() => !isRunning && linkPriority(topTodayPriority.id)}
              disabled={isRunning}
              className="w-full px-4 py-3.5 text-left transition-all hover:bg-white/25 disabled:opacity-50"
            >
              <p className="text-[15px] font-semibold text-[#222527] leading-snug mb-1">
                {topTodayPriority.title}
              </p>
              {topTodayPriority.recommendationReason && (
                <p className="text-[11px] text-[#222527]/42 leading-snug">
                  {topTodayPriority.recommendationReason}
                </p>
              )}
              {nextTodayPriority && (
                <div className="flex items-center gap-1.5 mt-2.5">
                  <span className="text-[10px] text-[#222527]/26">Up next:</span>
                  <span className="text-[10px] font-medium text-[#222527]/44 truncate max-w-[160px]">
                    {nextTodayPriority.title}
                  </span>
                  <RecommendationChip label={nextTodayPriority.recommendationLabel} />
                </div>
              )}
            </button>
          </div>

        ) : !showPicker ? (
          /* No plan, no link */
          <button
            onClick={() => !isRunning && setShowPicker(v => !v)}
            disabled={isRunning}
            className="w-full rounded-2xl px-4 py-3.5 flex items-center gap-3 transition-all hover:opacity-80 disabled:opacity-40"
            style={GLASS_SUBTLE}
          >
            <div
              className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(107,143,110,0.15)', border: '1px solid rgba(107,143,110,0.22)' }}
            >
              <Link2 className="h-4 w-4 text-[#6B8F6E]" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-[#222527]/65">Link a task to this session</p>
              <p className="text-xs text-[#222527]/35">Choose from your Eisenhower priorities</p>
            </div>
            <ChevronDown className="h-4 w-4 text-[#222527]/35" />
          </button>
        ) : null}

        {/* Picker dropdown */}
        {showPicker && (
          <div
            className="absolute top-full mt-2 left-0 right-0 rounded-2xl overflow-hidden z-50"
            style={{
              background: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.80)',
              boxShadow: '0 8px 32px rgba(34,37,39,0.12)',
            }}
          >
            <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#222527]/40">Choose a task</p>
              <button
                onClick={() => setShowPicker(false)}
                className="text-[10px] text-[#222527]/34 hover:text-[#222527]/58 transition-colors"
              >
                Cancel
              </button>
            </div>
            {activePriorities.length === 0 ? (
              <div className="px-4 pb-4 py-3 text-center">
                <p className="text-sm text-[#222527]/50">No active tasks yet.</p>
                <p className="text-xs text-[#222527]/35 mt-0.5">Add priorities on the Eisenhower screen.</p>
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto py-1">
                {todayActivePriorities.length > 0 && (
                  <>
                    <p className="px-4 pt-1 pb-1 text-[9px] font-bold uppercase tracking-widest text-[#222527]/30">
                      Today's plan
                    </p>
                    {todayActivePriorities.map((p, i) => (
                      <button
                        key={p.id}
                        onClick={() => { linkPriority(p.id); setShowPicker(false); }}
                        className="w-full text-left px-4 py-2.5 hover:bg-white/60 transition-colors flex items-center gap-3"
                      >
                        <span
                          className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                          style={{
                            background: i === 0 ? '#222527' : 'rgba(34,37,39,0.10)',
                            color:      i === 0 ? '#fff'    : 'rgba(34,37,39,0.52)',
                          }}
                        >
                          {i + 1}
                        </span>
                        <p className="text-sm text-[#222527] flex-1 truncate">{p.title}</p>
                        <RecommendationChip label={p.recommendationLabel} />
                      </button>
                    ))}
                  </>
                )}
                {offPlanPriorities.length > 0 && (
                  <>
                    <p className="px-4 pt-2 pb-1 text-[9px] font-bold uppercase tracking-widest text-[#222527]/28">
                      {todayActivePriorities.length > 0 ? 'Other tasks' : 'All tasks'}
                    </p>
                    {offPlanPriorities.map(p => (
                      <button
                        key={p.id}
                        onClick={() => { linkPriority(p.id); setShowPicker(false); }}
                        className="w-full text-left px-4 py-2.5 hover:bg-white/60 transition-colors flex items-center gap-3"
                      >
                        <span
                          className="shrink-0 h-1.5 w-1.5 rounded-full mt-0.5"
                          style={{ background: 'rgba(34,37,39,0.24)' }}
                        />
                        <p className="text-sm text-[#222527] flex-1 truncate">{p.title}</p>
                        <RecommendationChip label={p.recommendationLabel} />
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Primary CTA ───────────────────────────────────────────────── */}
      {isDone ? (
        <div className="w-full flex items-center gap-2">
          <div
            className="flex-1 h-12 rounded-2xl flex items-center justify-center gap-2"
            style={{ background: 'rgba(107,143,110,0.15)', border: '1px solid rgba(107,143,110,0.28)' }}
          >
            <span className="text-sm font-semibold text-[#5a7d5d]">Session complete</span>
          </div>
          <button
            onClick={reset}
            className="h-12 w-12 rounded-2xl flex items-center justify-center transition-all hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.50)', border: '1px solid rgba(255,255,255,0.68)' }}
            title="Reset timer"
          >
            <RotateCcw className="h-4 w-4 text-[#222527]/60" />
          </button>
        </div>
      ) : (isRunning || isPaused) ? (
        <button
          onClick={toggle}
          className="w-full h-12 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2.5 transition-all hover:opacity-90 active:scale-[0.98]"
          style={{
            background: isRunning ? 'rgba(255,255,255,0.50)' : '#222527',
            color:      isRunning ? 'rgba(34,37,39,0.70)'    : '#fff',
            border:     isRunning ? '1px solid rgba(255,255,255,0.68)' : 'none',
            boxShadow:  isRunning ? 'none' : '0 4px 20px rgba(34,37,39,0.22)',
          }}
        >
          {isRunning
            ? <><Pause className="h-4 w-4" />Pause session</>
            : <><Play  className="h-4 w-4" />Resume session</>
          }
        </button>
      ) : isIdle && activePriorities.length === 0 ? (
        /* Coaching nudge — no tasks at all */
        <div
          className="w-full rounded-2xl px-4 py-3.5 flex items-start gap-3"
          style={{ background: 'rgba(107,143,110,0.10)', border: '1px solid rgba(107,143,110,0.22)' }}
        >
          <div
            className="h-7 w-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: 'rgba(107,143,110,0.20)' }}
          >
            <ArrowRight className="h-3.5 w-3.5 text-[#5a7d5d]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#222527] mb-0.5">Start on Eisenhower first</p>
            <p className="text-xs text-[#222527]/50 leading-snug">
              Add priorities, get a Do Now / Do Today recommendation, then tap "Start My Day" — the timer links to your top-ranked task automatically.
            </p>
          </div>
        </div>
      ) : null}

      {/* ── Break suggestion ───────────────────────────────────────────── */}
      {(isShortBreakDue || isLongBreakDue) && (
        <div
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={isLongBreakDue
            ? { background: 'rgba(107,143,110,0.14)', border: '1px solid rgba(107,143,110,0.28)', color: '#4a7a4d' }
            : { ...GLASS_SUBTLE, color: 'rgba(34,37,39,0.65)' }}
        >
          {isLongBreakDue ? (
            <>
              <Coffee className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">You've earned a long break — step away for 15 minutes</span>
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 shrink-0 opacity-40" />
              <span className="text-sm font-medium opacity-70">
                Good session — short break, then continue with your next task
              </span>
            </>
          )}
        </div>
      )}

      {/* ── Stats strip ────────────────────────────────────────────────── */}
      <div className="w-full grid grid-cols-3 gap-2">
        {[
          {
            value: totalFocusedMins > 0 ? `${totalFocusedMins}m` : '—',
            label: 'Focused today',
            sub:   completedCount > 0
              ? `${completedCount} session${completedCount !== 1 ? 's' : ''}`
              : 'Start your first',
          },
          {
            value: totalInPlan > 0 ? `${doneCount}/${totalInPlan}` : '—',
            label: 'Tasks done',
            sub:   todayPlan
              ? (doneCount === totalInPlan && totalInPlan > 0 ? 'Day complete!' : `${totalInPlan - doneCount} remaining`)
              : 'No plan today',
          },
          {
            value: completedSets > 0 ? String(completedSets) : '—',
            label: 'Full sets',
            sub:   completedSets > 0 ? `${completedSets * setSize} sessions` : 'Complete 4 to score',
          },
        ].map(({ value, label, sub }) => (
          <div key={label} className="rounded-xl px-3 py-2.5 text-center" style={GLASS_SUBTLE}>
            <p className="text-lg font-light text-[#222527]">{value}</p>
            <p className="text-[10px] text-[#222527]/45 mt-0.5 leading-tight">{label}</p>
            <p className="text-[9px] text-[#222527]/30 mt-0.5 leading-tight">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Session history ────────────────────────────────────────────── */}
      {todaySessions.length > 0 && (
        <div className="w-full rounded-2xl overflow-hidden" style={GLASS_SUBTLE}>
          <div className="px-4 pt-3 pb-1 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#222527]/40">Today's sessions</p>
            <p className="text-[10px] text-[#222527]/30">{todaySessions.length} recorded</p>
          </div>
          <div className="px-4 pb-3 space-y-0">
            {todaySessions.slice(-5).reverse().map((session, i) => {
              const priority = session.linkedPriorityId
                ? state.priorities.find(p => p.id === session.linkedPriorityId)
                : null;
              const started    = new Date(session.startedAt);
              const ended      = session.endedAt ? new Date(session.endedAt) : null;
              const actualMins = ended
                ? Math.round((ended.getTime() - started.getTime()) / 60000)
                : null;
              return (
                <div
                  key={session.id}
                  className="flex items-start justify-between py-2.5"
                  style={{ borderBottom: i < Math.min(todaySessions.length, 5) - 1 ? '1px solid rgba(255,255,255,0.45)' : 'none' }}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div
                      className="h-6 w-6 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-semibold text-[#222527]/50 mt-0.5"
                      style={{ background: 'rgba(255,255,255,0.50)' }}
                    >
                      {session.plannedMinutes}
                    </div>
                    <div className="min-w-0">
                      {priority ? (
                        <>
                          <p className="text-xs font-medium text-[#222527]/70 truncate max-w-[148px] leading-snug">
                            {priority.title}
                          </p>
                          <div className="mt-1">
                            <RecommendationChip label={priority.recommendationLabel} />
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-[#222527]/35 italic mt-0.5">Unlinked session</p>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right ml-2">
                    <p className="text-[11px] text-[#222527]/45">
                      {started.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </p>
                    {actualMins !== null && actualMins !== session.plannedMinutes && (
                      <p className="text-[10px] text-[#222527]/30">{actualMins}m actual</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
