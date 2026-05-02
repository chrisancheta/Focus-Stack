import React, {
  createContext, useContext, useState, useEffect,
  useRef, useCallback, ReactNode,
} from 'react';
import { useAppStore } from './storeContext';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface TimerContextType {
  timeLeft:         number;
  isRunning:        boolean;
  isDone:           boolean;
  duration:         number;        // minutes
  linkedPriorityId: string | null;
  toggle:           () => void;    // start / pause / reset-after-done
  reset:            () => void;
  setDuration:      (minutes: number) => void;
  linkPriority:     (id: string | null) => void;
}

const TimerContext = createContext<TimerContextType | null>(null);

// ── Chime ─────────────────────────────────────────────────────────────────────
function playChime() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const notes = [
      { freq: 523.25, delay: 0.0 },
      { freq: 659.25, delay: 0.28 },
      { freq: 783.99, delay: 0.56 },
    ];
    notes.forEach(({ freq, delay }) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = ctx.currentTime + delay;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.28, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.8);
      osc.start(t);
      osc.stop(t + 1.8);
    });
  } catch (_) { /* silent */ }
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function TimerProvider({ children }: { children: ReactNode }) {
  const { state, addFocusSession } = useAppStore();
  const defaultMins = state.settings?.defaultFocusMinutes ?? 30;

  const [duration,         setDurationState]  = useState(defaultMins);
  const [timeLeft,         setTimeLeft]       = useState(defaultMins * 60);
  const [isRunning,        setIsRunning]      = useState(false);
  const [isDone,           setIsDone]         = useState(false);
  const [linkedPriorityId, setLinkedPriorityId] = useState<string | null>(null);

  // Refs used to read current values inside callbacks without stale closures
  const durationRef         = useRef(duration);
  const linkedPriorityIdRef = useRef(linkedPriorityId);
  const intervalRef         = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef        = useRef(false);   // signals the completion effect
  const sessionRef          = useRef<{
    startedAt: string;
    duration:  number;
    linkedId:  string | null;
  } | null>(null);

  useEffect(() => { durationRef.current         = duration;         }, [duration]);
  useEffect(() => { linkedPriorityIdRef.current = linkedPriorityId; }, [linkedPriorityId]);

  // ── Countdown interval — lives at provider level so navigation never stops it
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          intervalRef.current  = null;
          completedRef.current = true;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    };
  }, [isRunning]);

  // ── Completion side-effects (fires once when timeLeft hits 0)
  useEffect(() => {
    if (!completedRef.current || timeLeft !== 0) return;
    completedRef.current = false;

    setIsRunning(false);
    setIsDone(true);
    playChime();

    // Persist session to store (only when setup is complete)
    if (state.settings && sessionRef.current) {
      const s = sessionRef.current;
      sessionRef.current = null;
      addFocusSession({
        id:              crypto.randomUUID(),
        startedAt:       s.startedAt,
        endedAt:         new Date().toISOString(),
        plannedMinutes:  s.duration,
        linkedPriorityId: s.linkedId ?? undefined,
        manualStart:     true,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const toggle = useCallback(() => {
    if (isDone) {
      // After completion — clicking resets
      setTimeLeft(durationRef.current * 60);
      setIsDone(false);
      sessionRef.current = null;
      return;
    }
    setIsRunning(running => {
      if (!running && !sessionRef.current) {
        // Starting a fresh session — record start metadata
        sessionRef.current = {
          startedAt: new Date().toISOString(),
          duration:  durationRef.current,
          linkedId:  linkedPriorityIdRef.current,
        };
      }
      return !running;
    });
  }, [isDone]);

  const reset = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    completedRef.current = false;
    sessionRef.current   = null;
    setIsRunning(false);
    setIsDone(false);
    setTimeLeft(durationRef.current * 60);
  }, []);

  const setDuration = useCallback((minutes: number) => {
    // Refuse duration change mid-session
    if (isRunning) return;
    durationRef.current = minutes;
    setDurationState(minutes);
    setTimeLeft(minutes * 60);
    setIsDone(false);
    sessionRef.current = null;
  }, [isRunning]);

  const linkPriority = useCallback((id: string | null) => {
    linkedPriorityIdRef.current = id;
    setLinkedPriorityId(id);
  }, []);

  return (
    <TimerContext.Provider value={{
      timeLeft, isRunning, isDone, duration, linkedPriorityId,
      toggle, reset, setDuration, linkPriority,
    }}>
      {children}
    </TimerContext.Provider>
  );
}

export const useTimer = (): TimerContextType => {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error('useTimer must be used within TimerProvider');
  return ctx;
};
