import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Link2, Coffee, Zap, RotateCcw, Play, Pause } from 'lucide-react';
import { FocusTimerWidget } from '@/components/shared/FocusTimerWidget';
import { useAppStore } from '@/lib/storeContext';
import { useTimer } from '@/lib/timerContext';
import { getTodayISODate } from '@/lib/utils';

const GLASS = {
  background: 'rgba(255,255,255,0.45)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.58)',
};

const GLASS_SUBTLE = {
  background: 'rgba(255,255,255,0.30)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.42)',
};

const BUCKET_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  'must-do':   { bg: 'rgba(34,37,39,0.10)',    text: '#222527',  bar: '#222527' },
  'should-do': { bg: 'rgba(107,143,110,0.14)', text: '#5a7d5d',  bar: '#6B8F6E' },
  'could-do':  { bg: 'rgba(144,157,146,0.18)', text: '#6b7a6c',  bar: '#9BA89C' },
};

export default function FocusPage() {
  const { state } = useAppStore();
  const { linkedPriorityId, linkPriority, isRunning, isDone, toggle, reset, timeLeft, duration } = useTimer();
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const activePriorities = state.priorities.filter(
    p => p.status !== 'completed' && p.status !== 'dropped' && p.status !== 'deferred'
  );
  const linked = linkedPriorityId
    ? state.priorities.find(p => p.id === linkedPriorityId)
    : null;

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
  const todaySessions = state.focusSessions.filter(s => s.startedAt.slice(0, 10) === today);

  const completedCount  = todaySessions.length;
  const setSize         = 4;
  const positionInSet   = completedCount % setSize;
  const completedSets   = Math.floor(completedCount / setSize);
  const isLongBreakDue  = isDone && positionInSet === 0 && completedCount > 0;
  const isShortBreakDue = isDone && positionInSet !== 0;

  const totalFocusedMins = todaySessions.reduce((acc, s) => acc + s.plannedMinutes, 0);
  const nextBreakType    = positionInSet === 3 ? 'Long break' : 'Short break';
  const isPaused         = !isRunning && !isDone && timeLeft < duration * 60;
  const isIdle           = !isRunning && !isDone && timeLeft === duration * 60;

  const sessionLabel = completedCount === 0
    ? 'Session 1 of 4'
    : `Session ${positionInSet + 1} of 4`;

  const bucketLabel: Record<string, string> = {
    'must-do': 'Must do', 'should-do': 'Should do', 'could-do': 'Could do',
  };

  return (
    <div className="flex flex-col items-center gap-3 pb-8 max-w-md mx-auto w-full">

      {/* ── Session context bar ──────────────────────────────────────────── */}
      <div className="w-full flex items-center justify-between px-1 pt-1">
        <div className="flex items-center gap-3">
          {/* Dot progress */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: setSize }).map((_, i) => {
              const filled = i < positionInSet;
              const isNext = i === positionInSet && !isDone;
              return (
                <span key={i} style={{
                  display: 'block',
                  width:  filled ? 9 : isNext ? 7 : 6,
                  height: filled ? 9 : isNext ? 7 : 6,
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
            <span className="text-[11px] text-[#222527]/35">· {completedSets} {completedSets === 1 ? 'set' : 'sets'} done</span>
          )}
        </div>

        {/* What's next pill */}
        {!isDone && (
          <div
            className="flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11px] font-medium"
            style={{ background: 'rgba(255,255,255,0.42)', border: '1px solid rgba(255,255,255,0.60)', color: 'rgba(34,37,39,0.50)' }}
          >
            <span className="h-1.5 w-1.5 rounded-full inline-block" style={{ background: positionInSet === 3 ? '#6B8F6E' : 'rgba(34,37,39,0.28)' }} />
            Next: {nextBreakType}
          </div>
        )}
      </div>

      {/* ── Timer widget (scaled to reduce empty space) ───────────────────── */}
      <div className="w-full flex justify-center" style={{ marginTop: '-44px', marginBottom: '-44px' }}>
        <div style={{ transform: 'scale(0.82)', transformOrigin: 'center' }}>
          <FocusTimerWidget />
        </div>
      </div>

      {/* ── Linked activity card ──────────────────────────────────────────── */}
      <div className="w-full relative" ref={pickerRef}>
        {linked ? (
          <div
            className="w-full rounded-2xl overflow-hidden"
            style={{ ...GLASS, borderLeft: `3px solid ${BUCKET_COLORS[linked.bucket]?.bar ?? '#222527'}` }}
          >
            <div className="px-4 py-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link2 className="h-3 w-3 text-[#6B8F6E] shrink-0" />
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#222527]/40">Focusing on</p>
                    <span
                      className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded"
                      style={{ background: BUCKET_COLORS[linked.bucket]?.bg, color: BUCKET_COLORS[linked.bucket]?.text }}
                    >
                      {bucketLabel[linked.bucket]}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-[#222527] leading-snug">{linked.title}</p>
                </div>
                {!isRunning && (
                  <button
                    onClick={() => linkPriority(null)}
                    className="shrink-0 mt-0.5 p-1.5 rounded-lg text-[#222527]/35 hover:text-[#222527]/65 transition-colors"
                    style={{ background: 'rgba(255,255,255,0.50)' }}
                    title="Unlink activity"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
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
              <p className="text-sm font-semibold text-[#222527]/65">Focus On An Activity</p>
              <p className="text-xs text-[#222527]/35">Link this session to a task</p>
            </div>
            <ChevronDown className={`h-4 w-4 text-[#222527]/35 transition-transform ${showPicker ? 'rotate-180' : ''}`} />
          </button>
        )}

        {/* Activity picker dropdown */}
        {showPicker && (
          <div
            className="absolute top-full mt-2 left-0 right-0 rounded-2xl overflow-hidden z-50"
            style={{
              background: 'rgba(255,255,255,0.88)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.80)',
              boxShadow: '0 8px 32px rgba(34,37,39,0.12)',
            }}
          >
            <p className="px-4 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#222527]/40">
              Link to Activity
            </p>
            {activePriorities.length === 0 ? (
              <div className="px-4 pb-4 text-center py-3">
                <p className="text-sm text-[#222527]/50">No active tasks yet.</p>
                <p className="text-xs text-[#222527]/35 mt-0.5">Add tasks on the Home screen.</p>
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto py-1">
                {activePriorities.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { linkPriority(p.id); setShowPicker(false); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-white/60 transition-colors flex items-center gap-3"
                  >
                    <span
                      className="shrink-0 h-1.5 w-1.5 rounded-full mt-0.5"
                      style={{ background: BUCKET_COLORS[p.bucket]?.bar ?? '#222527' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#222527] leading-snug truncate">{p.title}</p>
                      <p className="text-[10px] text-[#222527]/40 mt-0.5">{bucketLabel[p.bucket]}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Primary CTA — Start / Resume / Done ──────────────────────────── */}
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
            color: isRunning ? 'rgba(34,37,39,0.70)' : '#fff',
            border: isRunning ? '1px solid rgba(255,255,255,0.68)' : 'none',
            boxShadow: isRunning ? 'none' : '0 4px 20px rgba(34,37,39,0.22)',
          }}
        >
          {isRunning ? (
            <><Pause className="h-4 w-4" />Pause Focus</>
          ) : (
            <><Play className="h-4 w-4" />Resume Focus</>
          )}
        </button>
      ) : null}

      {/* ── Break suggestion ──────────────────────────────────────────────── */}
      {(isShortBreakDue || isLongBreakDue) && (
        <div
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium"
          style={isLongBreakDue
            ? { background: 'rgba(107,143,110,0.14)', border: '1px solid rgba(107,143,110,0.28)', color: '#4a7a4d' }
            : { ...GLASS_SUBTLE, color: '#222527' }}
        >
          {isLongBreakDue ? (
            <><Coffee className="h-4 w-4 shrink-0" /><span>Time for a long break — you earned it!</span></>
          ) : (
            <><Zap className="h-4 w-4 shrink-0 opacity-50" /><span className="opacity-70">Take a short break, then keep going</span></>
          )}
        </div>
      )}

      {/* ── Productivity stats strip ──────────────────────────────────────── */}
      <div className="w-full grid grid-cols-3 gap-2">
        {[
          {
            value: totalFocusedMins > 0 ? `${totalFocusedMins}m` : '—',
            label: 'Focused today',
          },
          {
            value: completedCount > 0 ? String(completedCount) : '—',
            label: `Session${completedCount !== 1 ? 's' : ''} done`,
          },
          {
            value: completedSets > 0 ? String(completedSets) : '—',
            label: `Full ${completedSets !== 1 ? 'sets' : 'set'}`,
          },
        ].map(({ value, label }) => (
          <div
            key={label}
            className="rounded-xl px-3 py-2.5 text-center"
            style={GLASS_SUBTLE}
          >
            <p className="text-lg font-light text-[#222527]">{value}</p>
            <p className="text-[10px] text-[#222527]/45 mt-0.5 leading-tight">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Session history ───────────────────────────────────────────────── */}
      {todaySessions.length > 0 && (
        <div className="w-full rounded-2xl overflow-hidden" style={GLASS_SUBTLE}>
          <div className="px-4 pt-3 pb-1 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#222527]/40">
              Today's Sessions
            </p>
            <p className="text-[10px] text-[#222527]/30">{todaySessions.length} session{todaySessions.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="px-4 pb-3 space-y-0">
            {todaySessions.slice(-5).reverse().map((session, i) => {
              const priority = session.linkedPriorityId
                ? state.priorities.find(p => p.id === session.linkedPriorityId)
                : null;
              const started = new Date(session.startedAt);
              const ended   = session.endedAt ? new Date(session.endedAt) : null;
              const actualMins = ended ? Math.round((ended.getTime() - started.getTime()) / 60000) : null;

              return (
                <div
                  key={session.id}
                  className="flex items-center justify-between py-2"
                  style={{ borderBottom: i < Math.min(todaySessions.length, 5) - 1 ? '1px solid rgba(255,255,255,0.45)' : 'none' }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="h-6 w-6 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-semibold text-[#222527]/50"
                      style={{ background: 'rgba(255,255,255,0.50)' }}
                    >
                      {session.plannedMinutes}
                    </div>
                    <div className="min-w-0">
                      {priority ? (
                        <p className="text-xs font-medium text-[#222527]/70 truncate max-w-[160px]">{priority.title}</p>
                      ) : (
                        <p className="text-xs text-[#222527]/35 italic">No activity linked</p>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
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

      {!state.settings && (
        <p className="text-xs text-[#222527]/40 text-center">Complete setup to save session history.</p>
      )}
    </div>
  );
}
