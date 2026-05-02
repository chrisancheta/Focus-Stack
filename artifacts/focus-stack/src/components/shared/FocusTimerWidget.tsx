import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/storeContext';

interface FocusTimerWidgetProps {
  initialMinutes?: number;
  priorityId?: string;
}

// ── Clock SVG geometry ────────────────────────────────────────────────────────
const SVG_SIZE    = 340;
const CENTER      = SVG_SIZE / 2;
const TICK_R_OUT  = 156;
const TICK_R_LONG = 140;
const TICK_R_SHORT= 149;
const PROGRESS_R  = 128;
const PROGRESS_C  = 2 * Math.PI * PROGRESS_R;
const BG_R        = 162;

// ── Orbital button layout ─────────────────────────────────────────────────────
const CONTAINER  = 440;
const CX         = CONTAINER / 2;               // 220
const CY         = CONTAINER / 2;               // 220
const SVG_OFFSET = (CONTAINER - SVG_SIZE) / 2;  // 50
const ORBIT_R    = 196;
const BTN_S      = 44;

function clockPos(hour: number, btnSize: number) {
  const rad = (hour * 30 * Math.PI) / 180;
  const x   = CX + ORBIT_R * Math.sin(rad);
  const y   = CY - ORBIT_R * Math.cos(rad);
  return { left: x - btnSize / 2, top: y - btnSize / 2 };
}

function polarToXY(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/** Synthesise a soft 3-note chime using the Web Audio API. */
function playChime() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const notes = [
      { freq: 523.25, delay: 0.0 },    // C5
      { freq: 659.25, delay: 0.28 },   // E5
      { freq: 783.99, delay: 0.56 },   // G5
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
      gain.gain.linearRampToValueAtTime(0.30, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.8);
      osc.start(t);
      osc.stop(t + 1.8);
    });
  } catch (_) {
    // Web Audio not available — silent fail
  }
}

const ghostStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.55)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,255,255,0.70)',
};

export function FocusTimerWidget({ initialMinutes = 30, priorityId }: FocusTimerWidgetProps) {
  const { state } = useAppStore();
  const [customInput, setCustomInput]         = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [timeLeft, setTimeLeft]               = useState(initialMinutes * 60);
  const [isRunning, setIsRunning]             = useState(false);
  const [isDone, setIsDone]                   = useState(false);
  const [duration, setDuration]               = useState(initialMinutes);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset when duration changes
  useEffect(() => {
    setTimeLeft(duration * 60);
    setIsRunning(false);
    setIsDone(false);
  }, [duration]);

  // Countdown tick
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            setIsDone(true);
            playChime();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRunning]);

  const mins       = Math.floor(timeLeft / 60);
  const secs       = timeLeft % 60;
  const totalSecs  = duration * 60;
  const elapsed    = totalSecs - timeLeft;
  const progress   = totalSecs > 0 ? elapsed / totalSecs : 0;
  const dashOffset = PROGRESS_C * (1 - progress);

  const linked   = priorityId ? state.priorities.find(p => p.id === priorityId) : null;
  const isCustom = ![30, 60].includes(duration);

  // Status label shown below the countdown
  let statusLabel: string;
  if (linked) {
    const t = linked.title;
    statusLabel = t.length > 18 ? t.slice(0, 18) + '…' : t;
  } else if (isDone) {
    statusLabel = 'DONE';
  } else if (isRunning) {
    statusLabel = 'IN FOCUS';
  } else if (progress > 0) {
    statusLabel = 'CLICK TO RESUME';
  } else {
    statusLabel = 'CLICK TO START';
  }

  // Clicking the clock face starts / pauses / resets after done
  const handleClockClick = useCallback(() => {
    if (isDone) {
      // Reset
      setTimeLeft(duration * 60);
      setIsDone(false);
      setIsRunning(false);
    } else {
      setIsRunning(r => !r);
    }
  }, [isDone, duration]);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setIsDone(false);
    setTimeLeft(duration * 60);
  }, [duration]);

  const ticks = Array.from({ length: 60 }, (_, i) => {
    const isLong = i % 5 === 0;
    return {
      inner: polarToXY(CENTER, CENTER, isLong ? TICK_R_LONG : TICK_R_SHORT, i * 6),
      outer: polarToXY(CENTER, CENTER, TICK_R_OUT, i * 6),
      isLong,
    };
  });

  const handleSetCustom = () => {
    const v = parseInt(customInput);
    if (v > 0 && v <= 240) { setDuration(v); setShowCustomInput(false); setCustomInput(''); }
  };

  const presets: [string, number, number | 'custom'][] = [
    ['30m', 2, 30],
    ['60m', 3, 60],
    [isCustom ? `${duration}m` : '···', 4, 'custom'],
  ];

  return (
    <div className="flex items-center justify-center select-none">
      <div className="relative" style={{ width: CONTAINER, height: CONTAINER }}>

        {/* ── Clock face ────────────────────────────────────────────────── */}
        <div
          className="absolute"
          style={{ left: SVG_OFFSET, top: SVG_OFFSET, cursor: 'pointer' }}
          onClick={handleClockClick}
          title={isDone ? 'Click to reset' : isRunning ? 'Click to pause' : 'Click to start'}
        >
          <svg
            width={SVG_SIZE} height={SVG_SIZE}
            viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
            style={{ filter: 'drop-shadow(0 8px 32px rgba(34,37,39,0.13))' }}
          >
            <defs>
              <radialGradient id="clockBg" cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor="#F5F7F4" stopOpacity="1" />
                <stop offset="65%"  stopColor="#E8EDE6" stopOpacity="1" />
                <stop offset="100%" stopColor="#D8DFD5" stopOpacity="1" />
              </radialGradient>
            </defs>

            <circle cx={CENTER} cy={CENTER} r={BG_R} fill="url(#clockBg)" />
            <circle cx={CENTER} cy={CENTER} r={BG_R}
              fill="none" stroke="rgba(255,255,255,0.80)" strokeWidth="1.5" />

            {ticks.map((t, i) => (
              <line key={i}
                x1={t.inner.x} y1={t.inner.y}
                x2={t.outer.x} y2={t.outer.y}
                stroke={t.isLong ? 'rgba(34,37,39,0.38)' : 'rgba(34,37,39,0.14)'}
                strokeWidth={t.isLong ? 2 : 1}
                strokeLinecap="round"
              />
            ))}

            {/* Progress track */}
            <circle cx={CENTER} cy={CENTER} r={PROGRESS_R}
              fill="none" stroke="rgba(144,157,146,0.18)" strokeWidth="4" />

            {/* Progress arc */}
            <circle cx={CENTER} cy={CENTER} r={PROGRESS_R}
              fill="none"
              stroke={isDone ? '#6B8F6E' : '#222527'}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={PROGRESS_C}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${CENTER} ${CENTER})`}
              style={{ transition: 'stroke-dashoffset 0.9s linear' }}
            />

            {/* Countdown */}
            <text x={CENTER} y={CENTER - 10}
              textAnchor="middle" dominantBaseline="middle"
              fontSize="50" fontWeight="300"
              fontFamily="'DM Sans', sans-serif"
              fill={isDone ? '#6B8F6E' : '#222527'}
              letterSpacing="-2"
            >
              {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </text>

            {/* Status / call-to-action */}
            <text x={CENTER} y={CENTER + 30}
              textAnchor="middle" dominantBaseline="middle"
              fontSize="10" fontWeight="400"
              fontFamily="'DM Sans', sans-serif"
              fill={isDone ? '#6B8F6E' : 'rgba(34,37,39,0.42)'}
              letterSpacing="1.4"
            >
              {statusLabel.toUpperCase()}
            </text>
          </svg>
        </div>

        {/* ── Preset buttons — 2, 3, 4 o'clock ─────────────────────────── */}
        {presets.map(([label, hour, value]) => {
          const pos      = clockPos(hour, BTN_S);
          const isActive = value === 'custom' ? isCustom : duration === value && !isCustom;

          if (value === 'custom' && showCustomInput) {
            return (
              <div
                key="custom-input"
                className="absolute flex flex-col items-center gap-1"
                style={{ ...clockPos(hour, 56), width: 56 }}
              >
                <input
                  type="number" min="1" max="240"
                  value={customInput}
                  onChange={e => setCustomInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSetCustom();
                    if (e.key === 'Escape') setShowCustomInput(false);
                  }}
                  placeholder="min"
                  className="w-11 h-11 rounded-full text-[11px] text-center text-[#222527] outline-none"
                  style={{ background: 'rgba(255,255,255,0.90)', border: '1px solid rgba(144,157,146,0.45)' }}
                  autoFocus
                />
                <button
                  onClick={handleSetCustom}
                  className="text-[10px] font-medium text-[#222527]/60 hover:text-[#222527] transition-colors leading-none"
                >
                  Set
                </button>
              </div>
            );
          }

          return (
            <button
              key={String(value)}
              onClick={() => {
                if (value === 'custom') setShowCustomInput(true);
                else { setDuration(value); setShowCustomInput(false); }
              }}
              disabled={isRunning}
              className={cn(
                'absolute rounded-full text-sm font-medium transition-all disabled:opacity-40 flex items-center justify-center',
                isActive ? 'text-white shadow-md' : 'text-[#222527]/70 hover:text-[#222527]',
              )}
              style={{
                ...pos,
                width: BTN_S, height: BTN_S,
                ...(isActive
                  ? { background: '#222527', boxShadow: '0 4px 16px rgba(34,37,39,0.28)' }
                  : ghostStyle),
              }}
            >
              {label}
            </button>
          );
        })}

        {/* ── Reset — 8 o'clock ─────────────────────────────────────────── */}
        <button
          onClick={handleReset}
          className="absolute rounded-full flex items-center justify-center text-[#222527]/65 hover:text-[#222527] transition-all"
          style={{ ...clockPos(8, BTN_S), width: BTN_S, height: BTN_S, ...ghostStyle }}
          title="Reset"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

      </div>
    </div>
  );
}
