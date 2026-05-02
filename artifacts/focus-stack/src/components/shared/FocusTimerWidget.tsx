import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/storeContext';

interface FocusTimerWidgetProps {
  initialMinutes?: number;
  priorityId?: string;
}

const SVG_SIZE = 340;
const CENTER = SVG_SIZE / 2;
const TICK_OUTER_R = 156;
const TICK_LONG_INNER_R = 140;
const TICK_SHORT_INNER_R = 149;
const PROGRESS_R = 128;
const PROGRESS_CIRC = 2 * Math.PI * PROGRESS_R;
const BG_CIRCLE_R = 150;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export function FocusTimerWidget({ initialMinutes = 30, priorityId }: FocusTimerWidgetProps) {
  const { state } = useAppStore();
  const [customInput, setCustomInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [duration, setDuration] = useState(initialMinutes);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setTimeLeft(duration * 60);
    setIsRunning(false);
  }, [duration]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
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

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const totalSeconds = duration * 60;
  const elapsed = totalSeconds - timeLeft;
  const progress = totalSeconds > 0 ? elapsed / totalSeconds : 0;
  const progressOffset = PROGRESS_CIRC * (1 - progress);

  const secondsElapsed = elapsed % 60;
  const handAngle = secondsElapsed * 6;
  const handPos = polarToCartesian(CENTER, CENTER, TICK_OUTER_R - 2, handAngle);

  const linkedPriority = priorityId ? state.priorities.find(p => p.id === priorityId) : null;

  const ticks = Array.from({ length: 60 }, (_, i) => {
    const angleDeg = i * 6;
    const isLong = i % 5 === 0;
    const innerR = isLong ? TICK_LONG_INNER_R : TICK_SHORT_INNER_R;
    const inner = polarToCartesian(CENTER, CENTER, innerR, angleDeg);
    const outer = polarToCartesian(CENTER, CENTER, TICK_OUTER_R, angleDeg);
    return { inner, outer, isLong };
  });

  const handleSetCustom = () => {
    const mins = parseInt(customInput);
    if (mins > 0 && mins <= 240) {
      setDuration(mins);
      setShowCustomInput(false);
      setCustomInput('');
    }
  };

  const isCustom = !([30, 60].includes(duration));
  const statusLabel = linkedPriority
    ? linkedPriority.title.length > 18 ? linkedPriority.title.slice(0, 18) + '…' : linkedPriority.title
    : isRunning ? 'In Focus' : progress > 0 ? 'Paused' : 'Ready';

  return (
    <div className="flex items-center justify-center select-none">
      <div className="relative flex items-center">
        <div className="relative z-10">
          <svg
            width={SVG_SIZE}
            height={SVG_SIZE}
            viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
            style={{ filter: 'drop-shadow(0 8px 32px rgba(34,37,39,0.12))' }}
          >
            <defs>
              <radialGradient id="clockBg" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.72)" />
                <stop offset="100%" stopColor="rgba(221,227,214,0.60)" />
              </radialGradient>
              <filter id="softShadow">
                <feDropShadow dx="0" dy="4" stdDeviation="12" floodOpacity="0.10" />
              </filter>
            </defs>

            <circle cx={CENTER} cy={CENTER} r={BG_CIRCLE_R} fill="url(#clockBg)" />
            <circle
              cx={CENTER}
              cy={CENTER}
              r={BG_CIRCLE_R}
              fill="none"
              stroke="rgba(255,255,255,0.70)"
              strokeWidth="1"
            />

            {ticks.map((t, i) => (
              <line
                key={i}
                x1={t.inner.x}
                y1={t.inner.y}
                x2={t.outer.x}
                y2={t.outer.y}
                stroke={t.isLong ? 'rgba(34,37,39,0.45)' : 'rgba(34,37,39,0.18)'}
                strokeWidth={t.isLong ? 2 : 1}
                strokeLinecap="round"
              />
            ))}

            <circle
              cx={CENTER}
              cy={CENTER}
              r={PROGRESS_R}
              fill="none"
              stroke="rgba(144,157,146,0.20)"
              strokeWidth="4"
            />

            <circle
              cx={CENTER}
              cy={CENTER}
              r={PROGRESS_R}
              fill="none"
              stroke="#222527"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={PROGRESS_CIRC}
              strokeDashoffset={progressOffset}
              transform={`rotate(-90 ${CENTER} ${CENTER})`}
              style={{ transition: 'stroke-dashoffset 0.9s linear' }}
            />

            {isRunning && elapsed > 0 && (
              <line
                x1={CENTER}
                y1={CENTER}
                x2={handPos.x}
                y2={handPos.y}
                stroke="rgba(34,37,39,0.60)"
                strokeWidth="1.5"
                strokeLinecap="round"
                style={{ transition: 'x2 0.9s linear, y2 0.9s linear' }}
              />
            )}

            <circle cx={CENTER} cy={CENTER} r="3" fill="rgba(34,37,39,0.50)" />

            <text
              x={CENTER}
              y={CENTER - 10}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="48"
              fontWeight="300"
              fontFamily="'DM Sans', sans-serif"
              fill="#222527"
              letterSpacing="-2"
            >
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </text>

            <text
              x={CENTER}
              y={CENTER + 30}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="12"
              fontWeight="400"
              fontFamily="'DM Sans', sans-serif"
              fill="rgba(34,37,39,0.48)"
              letterSpacing="0.8"
            >
              {statusLabel.toUpperCase()}
            </text>
          </svg>

          <div className="flex justify-center items-center gap-4 mt-5">
            <button
              onClick={() => { setIsRunning(false); setTimeLeft(duration * 60); }}
              className="w-11 h-11 rounded-full flex items-center justify-center text-[#222527]/70 hover:text-[#222527] transition-all"
              style={{
                background: 'rgba(255,255,255,0.50)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.60)',
              }}
              data-testid="timer-reset"
              title="Reset"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            <button
              onClick={() => setIsRunning(!isRunning)}
              className="w-16 h-16 rounded-full flex items-center justify-center text-white transition-all hover:opacity-85 active:scale-95"
              style={{ background: '#222527', boxShadow: '0 6px 24px rgba(34,37,39,0.28)' }}
              data-testid="timer-play-pause"
            >
              {isRunning
                ? <Pause className="h-6 w-6" />
                : <Play className="h-6 w-6 ml-0.5" />
              }
            </button>

            <div className="w-11 h-11" />
          </div>
        </div>

        <div
          className="flex flex-col gap-2.5 -ml-5 z-0"
          style={{
            background: 'rgba(255,255,255,0.38)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            borderRadius: '0 1.5rem 1.5rem 0',
            padding: '18px 18px 18px 26px',
            border: '1px solid rgba(255,255,255,0.50)',
            borderLeft: 'none',
          }}
        >
          {[30, 60].map(min => (
            <button
              key={min}
              onClick={() => { setDuration(min); setShowCustomInput(false); }}
              disabled={isRunning}
              className={cn(
                "w-14 h-11 rounded-xl text-sm font-medium transition-all disabled:opacity-40",
                duration === min && !isCustom
                  ? "bg-[#222527] text-white shadow-sm"
                  : "text-[#222527]/80 hover:bg-white/70 hover:text-[#222527]"
              )}
              style={duration === min && !isCustom ? {} : {
                background: 'rgba(255,255,255,0.40)',
                border: '1px solid rgba(255,255,255,0.55)',
              }}
              data-testid={`timer-preset-${min}`}
            >
              {min}m
            </button>
          ))}

          {showCustomInput ? (
            <div className="flex flex-col items-center gap-1.5">
              <input
                type="number"
                min="1"
                max="240"
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSetCustom(); if (e.key === 'Escape') setShowCustomInput(false); }}
                placeholder="min"
                className="w-14 h-11 rounded-xl text-sm text-center text-[#222527] outline-none"
                style={{
                  background: 'rgba(255,255,255,0.80)',
                  border: '1px solid rgba(144,157,146,0.50)',
                }}
                autoFocus
                data-testid="timer-custom-input"
              />
              <button
                onClick={handleSetCustom}
                className="text-[10px] font-medium text-[#222527]/60 hover:text-[#222527] transition-colors"
              >
                Set
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowCustomInput(true)}
              disabled={isRunning}
              className={cn(
                "w-14 h-11 rounded-xl text-xs font-medium transition-all disabled:opacity-40",
                isCustom
                  ? "bg-[#222527] text-white shadow-sm"
                  : "text-[#222527]/80 hover:bg-white/70 hover:text-[#222527]"
              )}
              style={isCustom ? {} : {
                background: 'rgba(255,255,255,0.40)',
                border: '1px solid rgba(255,255,255,0.55)',
              }}
              data-testid="timer-preset-custom"
            >
              {isCustom ? `${duration}m` : 'Custom'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
