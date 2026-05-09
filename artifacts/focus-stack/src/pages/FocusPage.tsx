import React, { useState, useRef, useEffect } from 'react';
import { X, Link2, Coffee, Zap, RotateCcw, Play, Pause, ChevronDown } from 'lucide-react';
import { FocusTimerWidget } from '@/components/shared/FocusTimerWidget';
import { RecommendationChip } from '@/components/priority/RecommendationChip';
import { useAppStore } from '@/lib/storeContext';
import { useTimer } from '@/lib/timerContext';
import { getTodayISODate } from '@/lib/utils';
import type { PriorityCard } from '@/lib/store';
import { useWindowMode } from '@/lib/windowMode';

// ── Design tokens ──────────────────────────────────────────────────────────────

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

const QUICK_LABELS = ['Deep work', 'Study block', 'Reading', 'Planning', 'Admin', 'Learning'];

// ── Component ──────────────────────────────────────────────────────────────────

export default function FocusPage() {
  const { state }      = useAppStore();
  const { linkedPriorityId, linkPriority, isRunning, isDone, toggle, reset, timeLeft, duration } = useTimer();
  const { mode, setMode } = useWindowMode();

  // Set active mode when this page mounts
  useEffect(() => { setMode('active'); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Standalone session identity
  const [sessionName,    setSessionName]    = useState('');
  const [isEditingName,  setIsEditingName]  = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Task picker
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef    = useRef<HTMLDivElement>(null);

  // ── Derived data ────────────────────────────────────────────────────────────

  const today        = getTodayISODate();
  const todayPlan    = state.dayPlans.find(dp => dp.date === today) ?? null;
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

  // ── Timer math ──────────────────────────────────────────────────────────────

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
  const pomodoroPosLabel = `Session ${positionInSet + 1} of 4`;

  const doneCount   = todayPlan ? todayPlan.completedPriorityIds.length : 0;
  const totalInPlan = todayActivePriorities.length + doneCount;

  // ── Event handlers ──────────────────────────────────────────────────────────

  // Close picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    if (showPicker) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showPicker]);

  // Focus name input when editing starts
  useEffect(() => {
    if (isEditingName) nameInputRef.current?.focus();
  }, [isEditingName]);

  const commitName = () => setIsEditingName(false);

  // ── Render ──────────────────────────────────────────────────────────────────

  // ── Mini mode: compact timer + essential controls ────────────────────────────
  if (mode === 'mini') {
    return (
      <div className="flex flex-col items-center gap-3 py-2">
        <div style={{ transform: 'scale(0.80)', transformOrigin: 'center', marginTop: '-34px', marginBottom: '-34px' }}>
          <FocusTimerWidget miniMode />
        </div>
        {isDone ? (
          <button
            onClick={reset}
            className="w-full h-11 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
            style={{ background: 'rgba(107,143,110,0.14)', color: '#5a7d5d', border: '1px solid rgba(107,143,110,0.26)' }}
          >
            Session complete
          </button>
        ) : (
          <button
            onClick={toggle}
            className="w-full h-11 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
            style={{
              background: isRunning ? 'rgba(255,255,255,0.60)' : '#222527',
              color:      isRunning ? 'rgba(34,37,39,0.65)'    : '#fff',
              border:     isRunning ? '1px solid rgba(255,255,255,0.80)' : 'none',
              boxShadow:  isRunning ? 'none' : '0 4px 16px rgba(34,37,39,0.20)',
            }}
          >
            {isRunning
              ? <><Pause className="h-4 w-4" /> Pause</>
              : <><Play  className="h-4 w-4" /> Resume</>
            }
          </button>
        )}
        <button
          onClick={() => setMode('active')}
          className="text-[11px] hover:opacity-75 transition-opacity"
          style={{ color: 'rgba(34,37,39,0.36)' }}
        >
          ↗ Expand to full Pomodoro
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 pb-8 max-w-md mx-auto w-full">

      {/* ── Pomodoro context bar ───────────────────────────────────────── */}
      <div className="w-full flex items-center justify-between px-1 pt-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: setSize }).map((_, i) => {
              const filled = i < positionInSet;
              const isNext = i === positionInSet && !isDone;
              return (
                <span key={i} style={{
                  display:      'block',
                  width:        filled ? 9 : isNext ? 7 : 6,
                  height:       filled ? 9 : isNext ? 7 : 6,
                  borderRadius: '50%',
                  background:   filled ? '#222527' : isNext ? 'rgba(34,37,39,0.28)' : 'rgba(34,37,39,0.12)',
                  border:       isNext ? '1.5px solid rgba(34,37,39,0.35)' : 'none',
                  transition:   'all 0.3s',
                }} />
              );
            })}
          </div>
          <span className="text-xs font-medium text-[#222527]/55">{pomodoroPosLabel}</span>
          {completedSets > 0 && (
            <span className="text-[11px] text-[#222527]/35">
              · {completedSets} {completedSets === 1 ? 'set' : 'sets'} done
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
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
          <button
            onClick={() => setMode('mini')}
            className="h-6 px-2.5 rounded-full text-[10px] font-medium transition-all hover:opacity-75"
            style={{ background: 'rgba(34,37,39,0.06)', color: 'rgba(34,37,39,0.34)', border: '1px solid rgba(34,37,39,0.08)' }}
          >
            Mini
          </button>
        </div>
      </div>

      {/* ── Timer widget ───────────────────────────────────────────────── */}
      <div className="w-full flex justify-center" style={{ marginTop: '-44px', marginBottom: '-44px' }}>
        <div style={{ transform: 'scale(0.82)', transformOrigin: 'center' }}>
          <FocusTimerWidget />
        </div>
      </div>

      {/* ── Session identity card + picker ─────────────────────────────── */}
      <div className="w-full relative" ref={pickerRef}>

        {linked ? (
          /* ── MODE A: Linked — a priority is attached ─────────────────── */
          <div className="w-full rounded-2xl overflow-hidden" style={GLASS}>

            {/* Linked header — "Focusing on" appears ONLY here */}
            <div
              className="flex items-center gap-2 px-4 py-2.5"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.55)' }}
            >
              <Link2 className="h-3 w-3 text-[#6B8F6E] shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#222527]/36">
                Focusing on
              </span>
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
                  className="p-1 rounded-lg text-[#222527]/28 hover:text-[#222527]/55 transition-colors"
                  title="Detach task"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Task body */}
            <div className="px-4 py-3.5">
              <p className="text-[15px] font-semibold text-[#222527] leading-snug mb-1.5">
                {linked.title}
              </p>
              {linked.recommendationReason && (
                <p className="text-[11px] text-[#222527]/42 leading-snug mb-2">
                  {linked.recommendationReason}
                </p>
              )}
              {/* Up next — only when linked task is #1 in today's plan */}
              {linkedRankInToday === 1 && nextTodayPriority && (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] text-[#222527]/28">Up next:</span>
                  <span className="text-[10px] font-medium text-[#222527]/48 truncate max-w-[166px]">
                    {nextTodayPriority.title}
                  </span>
                  <RecommendationChip label={nextTodayPriority.recommendationLabel} />
                </div>
              )}
            </div>

            {/* Switch task — only when idle */}
            {!isRunning && activePriorities.length > 1 && (
              <div
                className="px-4 py-2"
                style={{ borderTop: '1px solid rgba(255,255,255,0.50)' }}
              >
                <button
                  onClick={() => setShowPicker(true)}
                  className="text-[10px] text-[#222527]/32 hover:text-[#222527]/56 transition-colors"
                >
                  Switch task →
                </button>
              </div>
            )}
          </div>

        ) : (
          /* ── MODE B: Standalone — no task linked ─────────────────────── */
          <div className="w-full rounded-2xl overflow-hidden" style={GLASS}>

            {/* Standalone header */}
            <div
              className="flex items-center justify-between px-4 py-2.5"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.55)' }}
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#222527]/36">
                Pomodoro
              </span>
            </div>

            {/* Session name / edit */}
            <div className="px-4 pt-3.5 pb-3">
              {isEditingName ? (
                <input
                  ref={nameInputRef}
                  value={sessionName}
                  onChange={e => setSessionName(e.target.value)}
                  onBlur={commitName}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') commitName(); }}
                  placeholder="Name this session…"
                  className="w-full text-[15px] font-semibold bg-transparent outline-none text-[#222527] placeholder:text-[#222527]/25 border-none"
                  style={{ caretColor: '#222527' }}
                />
              ) : sessionName ? (
                <p
                  className={`text-[15px] font-semibold leading-snug ${!isRunning ? 'cursor-pointer' : ''}`}
                  style={{ color: 'rgba(34,37,39,0.90)' }}
                  onClick={() => !isRunning && setIsEditingName(true)}
                >
                  {sessionName}
                </p>
              ) : null}

              {/* Quick-pick label chips */}
              {!isRunning && (
                <div className={`flex flex-wrap gap-1.5 ${sessionName ? 'mt-2.5' : ''}`}>
                  {QUICK_LABELS.map(label => {
                    const active = sessionName === label;
                    return (
                      <button
                        key={label}
                        onClick={() => { setSessionName(active ? '' : label); setIsEditingName(false); }}
                        className="text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-all hover:opacity-80"
                        style={{
                          background: active ? 'rgba(34,37,39,0.12)' : 'rgba(255,255,255,0.62)',
                          color:      active ? '#222527' : 'rgba(34,37,39,0.44)',
                          border:     active ? '1px solid rgba(34,37,39,0.20)' : '1px solid rgba(255,255,255,0.72)',
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Task affordance — secondary, optional */}
            {!isRunning && (
              <div
                className="px-4 py-2.5"
                style={{ borderTop: '1px solid rgba(255,255,255,0.50)' }}
              >
                {topTodayPriority ? (
                  /* Today's top-ranked task as a quiet "connect" row */
                  <button
                    onClick={() => linkPriority(topTodayPriority.id)}
                    className="w-full flex items-center gap-2 text-left group"
                  >
                    <RecommendationChip label={topTodayPriority.recommendationLabel} />
                    <span className="text-[11px] font-medium text-[#222527]/44 truncate flex-1 group-hover:text-[#222527]/65 transition-colors">
                      {topTodayPriority.title}
                    </span>
                    <span className="text-[10px] text-[#222527]/26 shrink-0 group-hover:text-[#222527]/46 transition-colors">
                      Connect →
                    </span>
                  </button>
                ) : activePriorities.length > 0 ? (
                  /* Generic link affordance when no day plan but priorities exist */
                  <button
                    onClick={() => setShowPicker(true)}
                    className="flex items-center gap-1.5 text-[10px] text-[#222527]/32 hover:text-[#222527]/55 transition-colors"
                  >
                    <Link2 className="h-2.5 w-2.5" />
                    Link to a priority →
                  </button>
                ) : null}
              </div>
            )}
          </div>
        )}

        {/* ── Task picker dropdown ─────────────────────────────────────── */}
        {showPicker && (
          <div
            className="absolute top-full mt-2 left-0 right-0 rounded-2xl overflow-hidden z-50"
            style={{
              background:           'rgba(255,255,255,0.92)',
              backdropFilter:       'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border:               '1px solid rgba(255,255,255,0.80)',
              boxShadow:            '0 8px 32px rgba(34,37,39,0.12)',
            }}
          >
            <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#222527]/40">
                Choose a task
              </p>
              <button
                onClick={() => setShowPicker(false)}
                className="text-[10px] text-[#222527]/34 hover:text-[#222527]/58 transition-colors"
              >
                Cancel
              </button>
            </div>

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
              {activePriorities.length === 0 && (
                <div className="px-4 py-4 text-center">
                  <p className="text-sm text-[#222527]/50">No active tasks yet.</p>
                  <p className="text-xs text-[#222527]/35 mt-0.5">
                    Add priorities on the Eisenhower screen.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Paused state context ──────────────────────────────────────── */}
      {isPaused && (
        <div
          className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.42)', border: '1px solid rgba(255,255,255,0.62)' }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: 'rgba(34,37,39,0.28)' }}
          />
          <p className="text-[11px] text-[#222527]/55 flex-1">
            Timer paused
            {timeLeft > 0 && (
              <span className="text-[#222527]/38">
                {' '}· {Math.ceil(timeLeft / 60)}m remaining
              </span>
            )}
          </p>
          <span className="text-[10px] font-semibold text-[#222527]/36">
            {Math.round(((duration * 60 - timeLeft) / (duration * 60)) * 100)}% done
          </span>
        </div>
      )}

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
                Good session — short break, then keep going
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
              : 'First session',
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
            sub:   completedSets > 0 ? `${completedSets * setSize} sessions` : 'Complete 4',
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
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#222527]/40">
              Today's sessions
            </p>
            <p className="text-[10px] text-[#222527]/30">
              {todaySessions.length} recorded
            </p>
          </div>
          <div className="px-4 pb-3">
            {todaySessions.slice(-5).reverse().map((session, i) => {
              const priority   = session.linkedPriorityId
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
                  style={{
                    borderBottom: i < Math.min(todaySessions.length, 5) - 1
                      ? '1px solid rgba(255,255,255,0.45)'
                      : 'none',
                  }}
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
                        <p className="text-xs font-medium text-[#222527]/42 mt-0.5">
                          Open focus session
                        </p>
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
