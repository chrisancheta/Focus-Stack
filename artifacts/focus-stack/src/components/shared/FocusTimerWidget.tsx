import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/storeContext';

interface FocusTimerWidgetProps {
  initialMinutes?: number;
  priorityId?: string;
}

// ── Clock geometry ─────────────────────────────────────────────────────────────
const SVG_SIZE    = 340;
const CENTER      = SVG_SIZE / 2;
const TICK_R_OUT  = 156;
const TICK_R_LONG = 140;
const TICK_R_SHORT= 149;
const PROGRESS_R  = 128;
const PROGRESS_C  = 2 * Math.PI * PROGRESS_R;
const BG_R        = 162;

// ── Crescent panel geometry ────────────────────────────────────────────────────
// The crescent is a standalone shape placed beside the clock with a small gap.
// It uses a decorative concave-left arc that echoes the clock circle's curvature.
const PANEL_W     = 84;    // total panel width (px)
const PANEL_H     = 160;   // total panel height (px)
const CONCAVITY   = 18;    // how deep the left arc dips into the panel (px) at centre
const ARC_R       = 162;   // arc radius – matches the clock circle visually

/**
 * Builds the crescent clip-path in the panel's own pixel coordinate space.
 *
 *  - Left edge: concave arc (mimics the clock circle's curvature)
 *  - Right edge: straight with rounded corners
 *  - The arc starts/ends where the virtual circle intersects the panel top/bottom.
 *
 * Virtual circle centre: x = CONCAVITY − ARC_R  (to the left of the panel),
 *                        y = panelH / 2          (vertically centred)
 */
function crescentClipPath(w: number, h: number): string {
  const halfH = h / 2;
  const vCX   = CONCAVITY - ARC_R;          // e.g. 18 − 162 = −144  (left of panel)
  // vertical distance from centre where virtual circle crosses x = 0
  const disc  = ARC_R * ARC_R - vCX * vCX;  // = R² − (R−concavity)²
  const dy    = disc > 0 ? Math.sqrt(disc) : 0;
  const yTop  = parseFloat(Math.max(0, halfH - dy).toFixed(2));
  const yBot  = parseFloat(Math.min(h, halfH + dy).toFixed(2));
  const cr    = 20; // corner radius on the right side

  // Arc: clockwise (sweep=1), short (large-arc=0) from (0,yTop) → (CONCAVITY,halfH) → (0,yBot)
  return (
    `path('` +
    `M 0 ${yTop} ` +
    `A ${ARC_R} ${ARC_R} 0 0 1 0 ${yBot} ` +
    `L ${w - cr} ${yBot} Q ${w} ${yBot} ${w} ${yBot - cr} ` +
    `L ${w} ${yTop + cr} Q ${w} ${yTop} ${w - cr} ${yTop} ` +
    `Z')`
  );
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
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // Pre-compute the crescent clip-path (static geometry)
  const clipPath = crescentClipPath(PANEL_W, PANEL_H);

  return (
    <div className="flex items-center justify-center select-none">
      {/* flex row: clock  ·gap·  crescent — both vertically centred */}
      <div className="flex items-center gap-3">

        {/* ── Clock face ──────────────────────────────────────────────── */}
        <div style={{ flexShrink: 0 }}>
          <svg
            width={SVG_SIZE} height={SVG_SIZE}
            viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
            style={{ filter: 'drop-shadow(0 8px 32px rgba(34,37,39,0.14))', overflow: 'visible' }}
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

            <circle cx={CENTER} cy={CENTER} r={PROGRESS_R}
              fill="none" stroke="rgba(144,157,146,0.18)" strokeWidth="4" />

            <circle cx={CENTER} cy={CENTER} r={PROGRESS_R}
              fill="none" stroke="#222527" strokeWidth="4" strokeLinecap="round"
              strokeDasharray={PROGRESS_C} strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${CENTER} ${CENTER})`}
              style={{ transition: 'stroke-dashoffset 0.9s linear' }}
            />

            <text x={CENTER} y={CENTER - 10}
              textAnchor="middle" dominantBaseline="middle"
              fontSize="50" fontWeight="300"
              fontFamily="'DM Sans', sans-serif"
              fill="#222527" letterSpacing="-2"
            >
              {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </text>

            <text x={CENTER} y={CENTER + 28}
              textAnchor="middle" dominantBaseline="middle"
              fontSize="11" fontWeight="400"
              fontFamily="'DM Sans', sans-serif"
              fill="rgba(34,37,39,0.40)" letterSpacing="1.4"
            >
              {statusLabel}
            </text>
          </svg>

          {/* Controls below the clock */}
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

        {/* ── Crescent preset panel ─────────────────────────────────────
            Standalone crescent shape beside the clock.
            clip-path: concave left arc + rounded right corners.
            Buttons are centred inside via absolute positioning.
        ──────────────────────────────────────────────────────────────── */}
        <div
          className="relative"
          style={{
            width: `${PANEL_W}px`,
            height: `${PANEL_H}px`,
            background: 'rgba(255,255,255,0.46)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            clipPath,
            boxShadow: '0 4px 20px rgba(34,37,39,0.08)',
          }}
        >
          {/* Buttons centred vertically, aligned toward the right */}
          <div
            className="absolute flex flex-col gap-3"
            style={{ right: '12px', top: '50%', transform: 'translateY(-50%)' }}
          >
            {!showCustomInput ? (
              <>
                {[30, 60].map(min => (
                  <button
                    key={min}
                    onClick={() => setDuration(min)}
                    disabled={isRunning}
                    className={cn(
                      'w-10 h-10 rounded-xl text-sm font-medium transition-all disabled:opacity-40',
                      duration === min && !isCustom
                        ? 'bg-[#222527] text-white shadow-sm'
                        : 'text-[#222527]/70 hover:bg-white/90',
                    )}
                    style={duration === min && !isCustom ? {} : {
                      background: 'rgba(255,255,255,0.65)',
                      border: '1px solid rgba(255,255,255,0.80)',
                    }}
                  >
                    {min}m
                  </button>
                ))}
                <button
                  onClick={() => setShowCustomInput(true)}
                  disabled={isRunning}
                  className={cn(
                    'w-10 h-10 rounded-xl text-xs font-medium transition-all disabled:opacity-40',
                    isCustom
                      ? 'bg-[#222527] text-white shadow-sm'
                      : 'text-[#222527]/70 hover:bg-white/90',
                  )}
                  style={isCustom ? {} : {
                    background: 'rgba(255,255,255,0.65)',
                    border: '1px solid rgba(255,255,255,0.80)',
                  }}
                >
                  {isCustom ? `${duration}m` : '···'}
                </button>
              </>
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
                  className="w-10 h-9 rounded-xl text-[11px] font-medium text-[#222527]/70 hover:text-[#222527] transition-colors"
                  style={{ background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.80)' }}
                >
                  Set
                </button>
                <button
                  onClick={() => setShowCustomInput(false)}
                  className="w-10 h-9 rounded-xl text-xs text-[#222527]/50 hover:text-[#222527] transition-colors"
                  style={{ background: 'rgba(255,255,255,0.50)', border: '1px solid rgba(255,255,255,0.70)' }}
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
