import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTimer } from '@/lib/timerContext';
import { useAppStore } from '@/lib/storeContext';

// ── Geometry ──────────────────────────────────────────────────────────────────

const SVG_SIZE  = 340;
const CENTER    = SVG_SIZE / 2;   // 170

const DISC_R    = 154;
const HALO_R    = 168;
const ARC_R     = 130;
const ARC_C     = 2 * Math.PI * ARC_R;

// Orbital preset-button layout (full mode only)
const CONTAINER  = 440;
const CX         = CONTAINER / 2;
const CY         = CONTAINER / 2;
const SVG_OFFSET = (CONTAINER - SVG_SIZE) / 2;
const ORBIT_R    = 196;
const BTN_S      = 44;

const CHECK_D   = `M 148 172 L 164 188 L 196 151`;
const CHECK_LEN = 73;

function clockPos(hour: number, btnSize: number) {
  const rad = (hour * 30 * Math.PI) / 180;
  return {
    left: CX + ORBIT_R * Math.sin(rad) - btnSize / 2,
    top:  CY - ORBIT_R * Math.cos(rad) - btnSize / 2,
  };
}

const ghostStyle: React.CSSProperties = {
  background:           'rgba(255,255,255,0.55)',
  backdropFilter:       'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border:               '1px solid rgba(255,255,255,0.70)',
};

// ── Animations ────────────────────────────────────────────────────────────────

const KEYFRAMES = `
  @keyframes breathe {
    0%, 100% { transform: scale(1);    opacity: 0.20; }
    50%       { transform: scale(1.08); opacity: 0.07; }
  }
  @keyframes bloom {
    0%   { transform: scale(0.98); opacity: 0.55; }
    100% { transform: scale(1.38); opacity: 0;    }
  }
  @keyframes checkDraw {
    from { stroke-dashoffset: ${CHECK_LEN}; }
    to   { stroke-dashoffset: 0; }
  }
  .halo-ring {
    transform-box: fill-box;
    transform-origin: center;
  }
  .halo-ring.breathing {
    animation: breathe 4s ease-in-out infinite;
  }
  .bloom-ring {
    transform-box: fill-box;
    transform-origin: center;
    animation: bloom 1s cubic-bezier(0.2, 0, 0.4, 1) forwards;
  }
  .check-path {
    stroke-dasharray: ${CHECK_LEN};
    animation: checkDraw 0.45s cubic-bezier(0.4, 0, 0.2, 1) 0.1s forwards;
  }
`;

// ── SVG ring face (shared between full and mini modes) ────────────────────────

function TimerFace({
  progress, arcStroke, arcOpacity, arcEndX, arcEndY,
  isRunning, isPaused, isDone, mins, secs, statusLabel,
  timeTextFill, labelFill, onClick,
}: {
  progress: number; arcStroke: string; arcOpacity: number;
  arcEndX: number; arcEndY: number;
  isRunning: boolean; isPaused: boolean; isDone: boolean;
  mins: number; secs: number; statusLabel: string;
  timeTextFill: string; labelFill: string;
  onClick: () => void;
}) {
  const dashOff = ARC_C * (1 - progress);

  return (
    <div style={{ cursor: 'pointer' }} onClick={onClick}>
      <svg
        width={SVG_SIZE}
        height={SVG_SIZE}
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        overflow="visible"
        style={{ filter: 'drop-shadow(0 6px 28px rgba(34,37,39,0.11))' }}
      >
        <defs>
          <radialGradient id="discGrad" cx="38%" cy="32%" r="72%">
            <stop offset="0%"   stopColor="#F8FAF7" />
            <stop offset="55%"  stopColor="#EFF2ED" />
            <stop offset="100%" stopColor="#E4E9E1" />
          </radialGradient>
        </defs>

        <circle
          cx={CENTER} cy={CENTER}
          r={HALO_R + 10}
          fill="rgba(144,157,146,0.09)"
          stroke="rgba(144,157,146,0.24)"
          strokeWidth="1.5"
          className={`halo-ring${isRunning ? ' breathing' : ''}`}
          style={{ opacity: isRunning ? undefined : 0, transition: 'opacity 0.8s ease' }}
        />

        {isDone && (
          <circle
            key="bloom"
            cx={CENTER} cy={CENTER}
            r={DISC_R}
            fill="none"
            stroke="rgba(107,143,110,0.38)"
            strokeWidth="3"
            className="bloom-ring"
          />
        )}

        <circle cx={CENTER} cy={CENTER} r={DISC_R} fill="url(#discGrad)" />
        <circle cx={CENTER} cy={CENTER} r={DISC_R} fill="none" stroke="rgba(255,255,255,0.88)" strokeWidth="1.5" />
        <circle cx={CENTER} cy={CENTER} r={DISC_R - 1} fill="none" stroke="rgba(34,37,39,0.04)" strokeWidth="3" />

        <circle cx={CENTER} cy={CENTER} r={ARC_R} fill="none" stroke="rgba(144,157,146,0.13)" strokeWidth="6" />

        <circle
          cx={CENTER} cy={CENTER}
          r={ARC_R}
          fill="none"
          stroke={arcStroke}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={ARC_C}
          strokeDashoffset={dashOff}
          transform={`rotate(-90 ${CENTER} ${CENTER})`}
          style={{ opacity: arcOpacity, transition: 'stroke-dashoffset 0.95s linear, stroke 0.55s ease, opacity 0.40s ease' }}
        />

        {isRunning && progress > 0.005 && progress < 0.998 && (
          <circle
            cx={arcEndX} cy={arcEndY}
            r={3.5}
            fill="#222527"
            style={{ filter: 'drop-shadow(0 1px 3px rgba(34,37,39,0.28))', transition: 'cx 0.95s linear, cy 0.95s linear' }}
          />
        )}

        {isDone ? (
          <path
            d={CHECK_D}
            fill="none"
            stroke="#6B8F6E"
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="check-path"
            style={{ strokeDashoffset: CHECK_LEN }}
          />
        ) : (
          <text
            x={CENTER} y={CENTER - 8}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="50"
            fontWeight="300"
            fontFamily="'DM Sans', sans-serif"
            fill={timeTextFill}
            letterSpacing="-2"
            style={{ transition: 'fill 0.40s ease' }}
          >
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </text>
        )}

        <text
          x={CENTER}
          y={isDone ? CENTER + 22 : CENTER + 30}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="9.5"
          fontWeight="500"
          fontFamily="'DM Sans', sans-serif"
          fill={labelFill}
          letterSpacing="2"
          style={{ transition: 'fill 0.40s ease, y 0.40s ease' }}
        >
          {statusLabel}
        </text>
      </svg>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function FocusTimerWidget({ miniMode = false }: { miniMode?: boolean }) {
  const { state } = useAppStore();
  const {
    timeLeft, isRunning, isDone, duration,
    linkedPriorityId, toggle, reset, setDuration,
  } = useTimer();

  const [customInput,     setCustomInput]     = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // ── Derived ────────────────────────────────────────────────────────────────

  const mins      = Math.floor(timeLeft / 60);
  const secs      = timeLeft % 60;
  const totalSecs = duration * 60;
  const progress  = totalSecs > 0 ? (totalSecs - timeLeft) / totalSecs : 0;
  const isPaused  = !isRunning && !isDone && timeLeft < totalSecs;
  const isCustom  = ![30, 60].includes(duration);

  const arcEndAngleDeg = -90 + progress * 360;
  const arcEndRad      = (arcEndAngleDeg * Math.PI) / 180;
  const arcEndX        = CENTER + ARC_R * Math.cos(arcEndRad);
  const arcEndY        = CENTER + ARC_R * Math.sin(arcEndRad);

  const arcStroke    = isDone  ? '#6B8F6E' : '#222527';
  const arcOpacity   = isPaused ? 0.38 : 1;
  const timeTextFill = isDone   ? '#6B8F6E' : isPaused ? 'rgba(34,37,39,0.40)' : '#222527';
  const labelFill    = isDone   ? '#6B8F6E' : isPaused ? 'rgba(34,37,39,0.30)' : 'rgba(34,37,39,0.36)';

  let statusLabel: string;
  if (isDone)        statusLabel = 'DONE';
  else if (isRunning) statusLabel = 'IN FOCUS';
  else if (isPaused)  statusLabel = 'PAUSED';
  else                statusLabel = 'CLICK TO START';

  const handleSetCustom = () => {
    const v = parseInt(customInput);
    if (v > 0 && v <= 240) { setDuration(v); setShowCustomInput(false); setCustomInput(''); }
  };

  const presets: [string, number, number | 'custom'][] = [
    ['30m', 2, 30],
    ['60m', 3, 60],
    [isCustom ? `${duration}m` : '···', 4, 'custom'],
  ];

  // ── Mini mode: compact ring-only, no orbital controls ─────────────────────

  if (miniMode) {
    return (
      <div className="flex items-center justify-center select-none">
        <style>{KEYFRAMES}</style>
        <TimerFace
          progress={progress} arcStroke={arcStroke} arcOpacity={arcOpacity}
          arcEndX={arcEndX} arcEndY={arcEndY}
          isRunning={isRunning} isPaused={isPaused} isDone={isDone}
          mins={mins} secs={secs} statusLabel={statusLabel}
          timeTextFill={timeTextFill} labelFill={labelFill}
          onClick={toggle}
        />
      </div>
    );
  }

  // ── Full mode: orbital preset buttons + reset ──────────────────────────────

  return (
    <div className="flex items-center justify-center select-none">
      <style>{KEYFRAMES}</style>
      <div className="relative" style={{ width: CONTAINER, height: CONTAINER }}>

        <div
          className="absolute"
          style={{ left: SVG_OFFSET, top: SVG_OFFSET }}
          title={isDone ? 'Click to reset' : isRunning ? 'Click to pause' : 'Click to start'}
        >
          <TimerFace
            progress={progress} arcStroke={arcStroke} arcOpacity={arcOpacity}
            arcEndX={arcEndX} arcEndY={arcEndY}
            isRunning={isRunning} isPaused={isPaused} isDone={isDone}
            mins={mins} secs={secs} statusLabel={statusLabel}
            timeTextFill={timeTextFill} labelFill={labelFill}
            onClick={toggle}
          />
        </div>

        {/* Preset duration buttons — 2, 3, 4 o'clock */}
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
                    if (e.key === 'Enter')  handleSetCustom();
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
                else { setDuration(value as number); setShowCustomInput(false); }
              }}
              disabled={isRunning}
              className={cn(
                'absolute rounded-full text-sm font-medium transition-all disabled:opacity-40 flex items-center justify-center',
                isActive ? 'text-white' : 'text-[#222527]/70 hover:text-[#222527]',
              )}
              style={{
                ...pos, width: BTN_S, height: BTN_S,
                ...(isActive
                  ? { background: '#222527', boxShadow: '0 4px 16px rgba(34,37,39,0.28)' }
                  : ghostStyle),
              }}
            >
              {label}
            </button>
          );
        })}

        {/* Reset — 8 o'clock */}
        <button
          onClick={reset}
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
