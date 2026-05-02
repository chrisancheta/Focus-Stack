import React, { useState, useLayoutEffect, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/storeContext';

interface FocusTimerWidgetProps {
  initialMinutes?: number;
  priorityId?: string;
}

// ── Clock geometry ─────────────────────────────────────────────────────────────
const SVG_SIZE    = 340;
const CENTER      = SVG_SIZE / 2;        // 170
const TICK_R_OUT  = 156;
const TICK_R_LONG = 140;
const TICK_R_SHORT= 149;
const PROGRESS_R  = 128;
const PROGRESS_C  = 2 * Math.PI * PROGRESS_R;

// BG_R = radius of the fully-opaque masking circle.
// Right edge in SVG space = 170 + 162 = 332  (leaving 8 px to SVG edge)
const BG_R = 162;

// ── Crescent geometry ──────────────────────────────────────────────────────────
// OVERLAP_PX  : how far the crescent panel slides behind the clock (negative margin)
// Panel left in SVG space = 340 − 90 = 250
// Circle overlaps panel by: (170+162) − 250 = 82 px  at the vertical centre
const OVERLAP_PX = 90;
const PANEL_W    = 136;    // total panel width
const PANEL_H    = 168;    // fixed panel height (3 × btn40 + 2 × gap14 + 2 × top/bot22 = 168)

// Circle centre in the panel's own coordinate space
const CX_IN_PANEL = 170 - (SVG_SIZE - OVERLAP_PX);   // = 170 − 250 = −80

/**
 * Returns a CSS clip-path path() string whose left edge is the concave arc of
 * the clock circle, producing a true crescent silhouette.
 */
function crescentPath(w: number, h: number): string {
  const halfH = h / 2;
  const disc  = BG_R * BG_R - halfH * halfH;
  const xArc  = disc > 0 ? Math.max(0, CX_IN_PANEL + Math.sqrt(disc)) : 0;
  const x     = xArc.toFixed(2);
  // Arc: start (x, 0) → sweep clockwise (right-bulging) → (x, h)
  // This creates the concave-left, convex-right crescent edge.
  return `path('M ${x} 0 A ${BG_R} ${BG_R} 0 0 1 ${x} ${h} L ${w} ${h} L ${w} 0 Z')`;
}

function polarToXY(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export function FocusTimerWidget({ initialMinutes = 30, priorityId }: FocusTimerWidgetProps) {
  const { state } = useAppStore();
  const [customInput, setCustomInput]         = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [timeLeft, setTimeLeft]               = useState(initialMinutes * 60);
  const [isRunning, setIsRunning]             = useState(false);
  const [duration, setDuration]               = useState(initialMinutes);
  const [clipPath, setClipPath]               = useState(() => crescentPath(PANEL_W, PANEL_H));
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const crescentRef = useRef<HTMLDivElement>(null);

  const updateClip = useCallback(() => {
    if (crescentRef.current) {
      const h = crescentRef.current.offsetHeight;
      setClipPath(crescentPath(PANEL_W, h));
    }
  }, []);

  useLayoutEffect(() => {
    updateClip();
    window.addEventListener('resize', updateClip);
    return () => window.removeEventListener('resize', updateClip);
  }, [updateClip, showCustomInput]);

  useEffect(() => { setTimeLeft(duration * 60); setIsRunning(false); }, [duration]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) { clearInterval(timerRef.current!); setIsRunning(false); return 0; }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) clearInterval(timerRef.current);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRunning]);

  const mins       = Math.floor(timeLeft / 60);
  const secs       = timeLeft % 60;
  const totalSecs  = duration * 60;
  const elapsed    = totalSecs - timeLeft;
  const progress   = totalSecs > 0 ? elapsed / totalSecs : 0;
  const dashOffset = PROGRESS_C * (1 - progress);

  const linked    = priorityId ? state.priorities.find(p => p.id === priorityId) : null;
  const isCustom  = ![30, 60].includes(duration);
  const statusLabel = linked
    ? (linked.title.length > 18 ? linked.title.slice(0, 18) + '…' : linked.title)
    : isRunning ? 'IN FOCUS' : progress > 0 ? 'PAUSED' : 'READY';

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

  // Button preset content
  const presets: Array<{ label: string; value: number | 'custom' }> = [
    { label: '30m', value: 30 },
    { label: '60m', value: 60 },
    { label: isCustom ? `${duration}m` : '···', value: 'custom' },
  ];

  return (
    <div className="flex items-center justify-center select-none">
      <div className="flex items-center">

        {/* ── Clock face ──────────────────────────────────────────────── */}
        <div className="relative z-10" style={{ flexShrink: 0 }}>
          <svg
            width={SVG_SIZE} height={SVG_SIZE}
            viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
            style={{ filter: 'drop-shadow(0 8px 32px rgba(34,37,39,0.14))', overflow: 'visible' }}
          >
            <defs>
              {/* Fully-opaque gradient — masks the crescent panel completely */}
              <radialGradient id="clockBg" cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor="#F5F7F4" stopOpacity="1" />
                <stop offset="65%"  stopColor="#E8EDE6" stopOpacity="1" />
                <stop offset="100%" stopColor="#D8DFD5" stopOpacity="1" />
              </radialGradient>
            </defs>

            {/* Masking fill */}
            <circle cx={CENTER} cy={CENTER} r={BG_R} fill="url(#clockBg)" />
            {/* Rim */}
            <circle cx={CENTER} cy={CENTER} r={BG_R}
              fill="none" stroke="rgba(255,255,255,0.80)" strokeWidth="1.5" />

            {/* 60 tick marks */}
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
              fill="none" stroke="#222527" strokeWidth="4" strokeLinecap="round"
              strokeDasharray={PROGRESS_C} strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${CENTER} ${CENTER})`}
              style={{ transition: 'stroke-dashoffset 0.9s linear' }}
            />

            {/* Countdown */}
            <text x={CENTER} y={CENTER - 10}
              textAnchor="middle" dominantBaseline="middle"
              fontSize="50" fontWeight="300"
              fontFamily="'DM Sans', sans-serif"
              fill="#222527" letterSpacing="-2"
            >
              {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </text>

            {/* Status */}
            <text x={CENTER} y={CENTER + 28}
              textAnchor="middle" dominantBaseline="middle"
              fontSize="11" fontWeight="400"
              fontFamily="'DM Sans', sans-serif"
              fill="rgba(34,37,39,0.40)" letterSpacing="1.4"
            >
              {statusLabel}
            </text>
          </svg>

          {/* Controls */}
          <div className="flex justify-center items-center gap-4 mt-5">
            <button
              onClick={() => { setIsRunning(false); setTimeLeft(duration * 60); }}
              className="w-11 h-11 rounded-full flex items-center justify-center text-[#222527]/65 hover:text-[#222527] transition-all"
              style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.65)' }}
              title="Reset"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsRunning(!isRunning)}
              className="w-16 h-16 rounded-full flex items-center justify-center text-white transition-all hover:opacity-85 active:scale-95"
              style={{ background: '#222527', boxShadow: '0 6px 24px rgba(34,37,39,0.28)' }}
            >
              {isRunning ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
            </button>
            <div className="w-11 h-11" />
          </div>
        </div>

        {/* ── Crescent preset panel ─────────────────────────────────────────
            clip-path cuts the mathematically precise concave left arc.
            Buttons are absolutely positioned flush-right so they're always
            inside the visible crescent strip regardless of panel left padding.
        ──────────────────────────────────────────────────────────────────── */}
        <div
          ref={crescentRef}
          className="z-0 relative"
          style={{
            marginLeft: `-${OVERLAP_PX}px`,
            width: `${PANEL_W}px`,
            height: `${PANEL_H}px`,
            background: 'rgba(255,255,255,0.46)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            clipPath,
            borderRadius: '0 22px 22px 0',
            border: '1px solid rgba(255,255,255,0.60)',
            borderLeft: 'none',
          }}
        >
          {/* Buttons pinned to the right inside the visible crescent strip */}
          <div
            className="absolute flex flex-col gap-3.5"
            style={{ right: '12px', top: '50%', transform: 'translateY(-50%)' }}
          >
            {!showCustomInput ? (
              presets.map(({ label, value }) => {
                const isActive = value === 'custom' ? isCustom : duration === value && !isCustom;
                return (
                  <button
                    key={String(value)}
                    onClick={() => {
                      if (value === 'custom') { setShowCustomInput(true); }
                      else { setDuration(value); setShowCustomInput(false); }
                    }}
                    disabled={isRunning}
                    className={cn(
                      'w-10 h-10 rounded-xl text-sm font-medium transition-all disabled:opacity-40',
                      isActive
                        ? 'bg-[#222527] text-white shadow-sm'
                        : 'text-[#222527]/75 hover:bg-white/80',
                    )}
                    style={isActive ? {} : {
                      background: 'rgba(255,255,255,0.60)',
                      border: '1px solid rgba(255,255,255,0.75)',
                    }}
                  >
                    {label}
                  </button>
                );
              })
            ) : (
              <>
                <input
                  type="number" min="1" max="240"
                  value={customInput}
                  onChange={e => setCustomInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSetCustom();
                    if (e.key === 'Escape') setShowCustomInput(false);
                  }}
                  placeholder="min"
                  className="w-10 h-10 rounded-xl text-[11px] text-center text-[#222527] outline-none"
                  style={{ background: 'rgba(255,255,255,0.90)', border: '1px solid rgba(144,157,146,0.45)' }}
                  autoFocus
                />
                <button
                  onClick={handleSetCustom}
                  className="w-10 h-8 rounded-lg text-[11px] font-medium text-[#222527]/70 hover:text-[#222527] transition-colors"
                  style={{ background: 'rgba(255,255,255,0.60)', border: '1px solid rgba(255,255,255,0.75)' }}
                >
                  Set
                </button>
                <button
                  onClick={() => setShowCustomInput(false)}
                  className="w-10 h-8 rounded-lg text-[11px] text-[#222527]/50 hover:text-[#222527] transition-colors"
                >
                  ✕
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
