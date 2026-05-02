import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Link2, Coffee, Zap } from 'lucide-react';
import { FocusTimerWidget } from '@/components/shared/FocusTimerWidget';
import { useAppStore } from '@/lib/storeContext';
import { useTimer } from '@/lib/timerContext';
import { getTodayISODate } from '@/lib/utils';

export default function FocusPage() {
  const { state } = useAppStore();
  const { linkedPriorityId, linkPriority, isRunning, isDone } = useTimer();
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const activePriorities = state.priorities.filter(
    p => p.status !== 'completed' && p.status !== 'dropped' && p.status !== 'deferred'
  );
  const linked = linkedPriorityId
    ? state.priorities.find(p => p.id === linkedPriorityId)
    : null;

  // Close picker when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    if (showPicker) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showPicker]);

  const today = getTodayISODate();
  const todaySessions = state.focusSessions.filter(
    s => s.startedAt.slice(0, 10) === today
  );

  // ── Pomodoro counter ────────────────────────────────────────────────────────
  const completedCount  = todaySessions.length;
  const setSize         = 4;
  const positionInSet   = completedCount % setSize;          // 0-3
  const completedSets   = Math.floor(completedCount / setSize);
  const isLongBreakDue  = isDone && positionInSet === 0 && completedCount > 0;
  const isShortBreakDue = isDone && positionInSet !== 0;

  const bucketLabel: Record<string, string> = {
    'must-do': 'Must do',
    'should-do': 'Should do',
    'could-do': 'Could do',
  };

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <FocusTimerWidget />

      {/* ── Pomodoro counter ────────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-3">
        {/* Session dots */}
        <div className="flex items-center gap-2">
          {Array.from({ length: setSize }).map((_, i) => {
            const filled = i < positionInSet;
            const isNext = i === positionInSet && !isDone;
            return (
              <span
                key={i}
                className="transition-all"
                style={{
                  display: 'block',
                  width: filled ? 10 : isNext ? 8 : 7,
                  height: filled ? 10 : isNext ? 8 : 7,
                  borderRadius: '50%',
                  background: filled
                    ? '#222527'
                    : isNext
                      ? 'rgba(34,37,39,0.30)'
                      : 'rgba(34,37,39,0.12)',
                  border: isNext ? '1.5px solid rgba(34,37,39,0.35)' : 'none',
                }}
              />
            );
          })}
        </div>

        {/* Label */}
        <p className="text-xs text-[#222527]/45 font-medium">
          {completedCount === 0
            ? 'Session 1 of 4'
            : isLongBreakDue
              ? `Set ${completedSets} done · ${completedCount} today`
              : `Session ${positionInSet + 1} of 4 · ${completedCount} today`}
        </p>

        {/* Break suggestion — appears after timer completes */}
        {(isShortBreakDue || isLongBreakDue) && (
          <div
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-sm font-medium"
            style={{
              background: isLongBreakDue
                ? 'rgba(107,143,110,0.14)'
                : 'rgba(255,255,255,0.52)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              border: isLongBreakDue
                ? '1px solid rgba(107,143,110,0.28)'
                : '1px solid rgba(255,255,255,0.65)',
              color: isLongBreakDue ? '#4a7a4d' : '#222527',
            }}
          >
            {isLongBreakDue ? (
              <>
                <Coffee className="h-4 w-4 shrink-0" />
                <span>Time for a long break — you earned it!</span>
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 shrink-0 text-[#222527]/50" />
                <span className="text-[#222527]/70">Take a short break, then keep going</span>
              </>
            )}
          </div>
        )}

        {/* Completed sets badge */}
        {completedSets > 0 && (
          <p className="text-[11px] text-[#222527]/35">
            {completedSets} full {completedSets === 1 ? 'set' : 'sets'} completed today
          </p>
        )}
      </div>

      {/* ── Priority link ───────────────────────────────────────────────── */}
      <div className="relative" ref={pickerRef}>
        {linked ? (
          /* Linked state: show task name with unlink button */
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-[#222527]"
            style={{
              background: 'rgba(255,255,255,0.55)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              border: '1px solid rgba(255,255,255,0.70)',
              boxShadow: '0 2px 10px rgba(34,37,39,0.06)',
            }}
          >
            <Link2 className="h-3.5 w-3.5 text-[#6B8F6E]" />
            <span className="max-w-[180px] truncate">{linked.title}</span>
            {!isRunning && (
              <button
                onClick={() => linkPriority(null)}
                className="ml-1 text-[#222527]/40 hover:text-[#222527] transition-colors"
                title="Unlink task"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ) : (
          /* Unlinked state: show picker trigger */
          <button
            onClick={() => !isRunning && setShowPicker(v => !v)}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm text-[#222527]/55 hover:text-[#222527] disabled:opacity-40 transition-all"
            style={{
              background: 'rgba(255,255,255,0.42)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              border: '1px solid rgba(255,255,255,0.60)',
            }}
          >
            <Link2 className="h-3.5 w-3.5" />
            <span>Focus on a task…</span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showPicker ? 'rotate-180' : ''}`} />
          </button>
        )}

        {/* Dropdown list */}
        {showPicker && activePriorities.length > 0 && (
          <div
            className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-72 rounded-2xl overflow-hidden z-50"
            style={{
              background: 'rgba(255,255,255,0.80)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.75)',
              boxShadow: '0 8px 32px rgba(34,37,39,0.12)',
            }}
          >
            <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-[#222527]/40">
              Link to task
            </p>
            <div className="max-h-52 overflow-y-auto py-1">
              {activePriorities.map(p => (
                <button
                  key={p.id}
                  onClick={() => { linkPriority(p.id); setShowPicker(false); }}
                  className="w-full text-left px-4 py-2.5 hover:bg-white/60 transition-colors flex items-start gap-3"
                >
                  <span
                    className="mt-0.5 shrink-0 text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded"
                    style={{
                      background: p.bucket === 'must-do'
                        ? 'rgba(34,37,39,0.12)' : 'rgba(144,157,146,0.25)',
                      color: '#222527',
                    }}
                  >
                    {bucketLabel[p.bucket]}
                  </span>
                  <span className="text-sm text-[#222527] leading-snug">{p.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {showPicker && activePriorities.length === 0 && (
          <div
            className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-60 rounded-2xl px-5 py-4 z-50 text-center"
            style={{
              background: 'rgba(255,255,255,0.80)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.75)',
            }}
          >
            <p className="text-sm text-[#222527]/55">No active tasks yet.</p>
            <p className="text-xs text-[#222527]/35 mt-1">Add tasks on the Home screen.</p>
          </div>
        )}
      </div>

      {/* ── Today's sessions ────────────────────────────────────────────── */}
      {todaySessions.length > 0 && (
        <div
          className="w-full max-w-sm rounded-2xl p-5"
          style={{
            background: 'rgba(255,255,255,0.40)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            border: '1px solid rgba(255,255,255,0.52)',
          }}
        >
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[#222527]/45 mb-4">
            Today's Sessions
          </h3>
          <div className="space-y-3">
            {todaySessions.map(session => {
              const priority = session.linkedPriorityId
                ? state.priorities.find(p => p.id === session.linkedPriorityId)
                : null;
              const ended   = session.endedAt ? new Date(session.endedAt) : null;
              const started = new Date(session.startedAt);
              const actualMins = ended
                ? Math.round((ended.getTime() - started.getTime()) / 60000)
                : null;

              return (
                <div
                  key={session.id}
                  className="flex justify-between items-center py-2 border-b border-white/30 last:border-0"
                >
                  <div>
                    <span className="text-sm font-medium text-[#222527]">
                      {session.plannedMinutes} min
                    </span>
                    {priority && (
                      <p className="text-xs text-[#222527]/50 mt-0.5 truncate max-w-[160px]">
                        {priority.title}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-[#222527]/50">
                      {started.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {actualMins !== null && (
                      <p className="text-xs text-[#222527]/40">{actualMins}m actual</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!state.settings && (
        <p className="text-sm text-[#222527]/50 text-center">
          Complete setup to save session history.
        </p>
      )}
    </div>
  );
}
