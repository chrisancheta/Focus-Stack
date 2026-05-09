import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { LayoutDashboard, Timer, BarChart2, Settings, MoreHorizontal, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTimer } from '@/lib/timerContext';
import { useAppStore } from '@/lib/storeContext';
import { useWindowMode, WindowMode } from '@/lib/windowMode';

export function TopNav({ effectiveMode }: { effectiveMode: WindowMode }) {
  const [location] = useLocation();
  const { isRunning, isDone, linkedPriorityId } = useTimer();
  const { state } = useAppStore();
  const { setMode } = useWindowMode();
  const [overflowOpen, setOverflowOpen] = useState(false);
  const overflowRef = useRef<HTMLDivElement>(null);

  const linked = linkedPriorityId
    ? state.priorities.find(p => p.id === linkedPriorityId)
    : null;

  useEffect(() => {
    if (!overflowOpen) return;
    const handler = (e: MouseEvent) => {
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
        setOverflowOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [overflowOpen]);

  const timerDot =
    isRunning ? '#5a7d5d' :
    isDone    ? '#5a7d5d' :
    'rgba(34,37,39,0.22)';

  const modeLabel =
    isDone    ? 'Done'     :
    isRunning ? 'In Focus' :
    'Paused';

  const navItems = [
    { href: '/home',     label: 'Eisenhower', Icon: LayoutDashboard },
    { href: '/focus',    label: 'Pomodoro',   Icon: Timer           },
    { href: '/trends',   label: 'Trends',     Icon: BarChart2       },
    { href: '/settings', label: 'Settings',   Icon: Settings        },
  ];

  const overflowItems = [
    { href: '/focus',    label: 'Pomodoro',  Icon: Timer     },
    { href: '/trends',   label: 'Trends',    Icon: BarChart2 },
    { href: '/settings', label: 'Settings',  Icon: Settings  },
  ];

  // ── ACTIVE MODE: compact single-row header ──────────────────────────────────
  if (effectiveMode === 'active') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '10px 13px',
          borderBottom: '1px solid rgba(34,37,39,0.07)',
          background: 'rgba(255,255,255,0.26)',
          flexShrink: 0,
          minWidth: 0,
        }}
      >
        {/* Status dot */}
        <span
          style={{
            width: 7, height: 7, borderRadius: '50%',
            background: timerDot, flexShrink: 0,
            boxShadow: isRunning ? '0 0 5px rgba(90,125,93,0.50)' : 'none',
            transition: 'background 0.3s, box-shadow 0.3s',
          }}
        />

        {/* Mode label */}
        <span
          style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.09em',
            color: 'rgba(34,37,39,0.40)', textTransform: 'uppercase',
            flexShrink: 0,
          }}
        >
          {modeLabel}
        </span>

        {/* Task title */}
        {linked ? (
          <>
            <span style={{ color: 'rgba(34,37,39,0.16)', fontSize: 10, flexShrink: 0 }}>·</span>
            <span
              style={{
                fontSize: 11, fontWeight: 500, color: 'rgba(34,37,39,0.50)',
                flex: 1, minWidth: 0,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}
            >
              {linked.title}
            </span>
          </>
        ) : (
          <span style={{ flex: 1 }} />
        )}

        {/* Overflow menu */}
        <div style={{ position: 'relative', flexShrink: 0 }} ref={overflowRef}>
          <button
            onClick={() => setOverflowOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 26, height: 26, borderRadius: 8,
              color: 'rgba(34,37,39,0.36)', background: 'transparent',
              cursor: 'pointer',
            }}
            title="More options"
          >
            <MoreHorizontal style={{ width: 14, height: 14 }} />
          </button>

          {overflowOpen && (
            <div
              style={{
                position: 'absolute', top: '100%', right: 0, marginTop: 6,
                background: 'rgba(246,249,246,0.98)',
                borderRadius: 14,
                border: '1px solid rgba(255,255,255,0.85)',
                boxShadow: '0 10px 28px rgba(34,37,39,0.16)',
                overflow: 'hidden', zIndex: 50, width: 148,
              }}
            >
              {overflowItems.map(({ href, label, Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOverflowOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    padding: '9px 14px', fontSize: 13,
                    color: location === href ? '#222527' : 'rgba(34,37,39,0.60)',
                    fontWeight: location === href ? 600 : 400,
                    textDecoration: 'none',
                  }}
                >
                  <Icon style={{ width: 13, height: 13, opacity: 0.55, flexShrink: 0 }} />
                  {label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Expand button */}
        <button
          onClick={() => setMode('planning')}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 9px', borderRadius: 99,
            fontSize: 10, fontWeight: 600,
            background: 'rgba(34,37,39,0.07)', color: 'rgba(34,37,39,0.46)',
            border: '1px solid rgba(34,37,39,0.09)',
            flexShrink: 0, cursor: 'pointer',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          <Maximize2 style={{ width: 10, height: 10 }} />
          Expand
        </button>
      </div>
    );
  }

  // ── PLANNING / EXPANDED MODE: full nav ──────────────────────────────────────
  return (
    <nav
      style={{
        borderBottom: '1px solid rgba(34,37,39,0.07)',
        background: 'rgba(255,255,255,0.26)',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: '0 13px',
          display: 'flex',
          height: 48,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <img
            src="/logo.png"
            alt="Focus Stack"
            style={{ height: 23, width: 23, objectFit: 'contain' }}
          />
          <span
            style={{
              fontWeight: 600, color: '#222527', fontSize: 13.5,
              letterSpacing: '-0.01em',
            }}
          >
            Focus Stack
          </span>
        </div>

        {/* Nav tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {navItems.map(({ href, label, Icon }) => {
            const isActive = location === href || (location === '/home' && href === '/home');
            const showDot  = href === '/focus' && isRunning && !isDone && location !== '/focus';

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'relative flex items-center gap-1 px-2 py-1.5 rounded-full transition-all',
                  isActive
                    ? 'bg-[#222527] text-white'
                    : 'text-[#222527]/55 hover:text-[#222527] hover:bg-white/40',
                )}
                style={{ fontSize: 11, fontWeight: 500 }}
                data-testid={`nav-${label.toLowerCase()}`}
              >
                <Icon className="h-3 w-3" />
                <span>{label}</span>
                {showDot && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                    <span className="animate-ping absolute h-full w-full rounded-full bg-[#6B8F6E] opacity-70" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#6B8F6E]" />
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
