import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { LayoutDashboard, Timer, BarChart2, Settings, MoreHorizontal, Menu } from 'lucide-react';
import { useTimer } from '@/lib/timerContext';
import { useAppStore } from '@/lib/storeContext';
import { useWindowMode, WindowMode } from '@/lib/windowMode';

export function TopNav({ effectiveMode }: { effectiveMode: WindowMode }) {
  const [location] = useLocation();
  const { isRunning, isDone, linkedPriorityId } = useTimer();
  const { state } = useAppStore();
  const { setMode } = useWindowMode();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const linked = linkedPriorityId
    ? state.priorities.find(p => p.id === linkedPriorityId)
    : null;

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

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

  const timerRunningOffPage = isRunning && !isDone && location !== '/focus';

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
        <div style={{ position: 'relative', flexShrink: 0 }} ref={menuRef}>
          <button
            onClick={() => setMenuOpen(o => !o)}
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

          {menuOpen && (
            <div style={DROPDOWN_STYLE}>
              {navItems.map(({ href, label, Icon }) => (
                <NavDropdownItem
                  key={href}
                  href={href}
                  label={label}
                  Icon={Icon}
                  isActive={location === href}
                  showDot={href === '/focus' && timerRunningOffPage}
                  onClick={() => setMenuOpen(false)}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    );
  }

  // ── PLANNING / EXPANDED MODE: logo + hamburger ──────────────────────────────
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
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img
            src="/logo.png"
            alt="Focus Stack"
            style={{ height: 23, width: 23, objectFit: 'contain' }}
          />
        </div>

        {/* Hamburger */}
        <div style={{ position: 'relative' }} ref={menuRef}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, borderRadius: 10,
              color: menuOpen ? '#222527' : 'rgba(34,37,39,0.48)',
              background: menuOpen ? 'rgba(34,37,39,0.07)' : 'transparent',
              border: menuOpen ? '1px solid rgba(34,37,39,0.10)' : '1px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s',
              position: 'relative',
            }}
            title="Menu"
            aria-label="Open navigation menu"
          >
            <Menu style={{ width: 16, height: 16 }} />
            {/* Timer running dot */}
            {timerRunningOffPage && (
              <span style={{
                position: 'absolute', top: 4, right: 4,
                width: 6, height: 6, borderRadius: '50%',
                background: '#5a7d5d',
                boxShadow: '0 0 4px rgba(90,125,93,0.60)',
              }} />
            )}
          </button>

          {menuOpen && (
            <div style={{ ...DROPDOWN_STYLE, minWidth: 172 }}>
              {navItems.map(({ href, label, Icon }) => (
                <NavDropdownItem
                  key={href}
                  href={href}
                  label={label}
                  Icon={Icon}
                  isActive={location === href}
                  showDot={href === '/focus' && timerRunningOffPage}
                  onClick={() => setMenuOpen(false)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

// ── Shared dropdown styles ──────────────────────────────────────────────────────

const DROPDOWN_STYLE: React.CSSProperties = {
  position: 'absolute', top: '100%', right: 0, marginTop: 6,
  background: 'rgba(246,249,246,0.98)',
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.85)',
  boxShadow: '0 10px 28px rgba(34,37,39,0.16)',
  overflow: 'hidden', zIndex: 50,
};

function NavDropdownItem({
  href, label, Icon, isActive, showDot, onClick,
}: {
  href: string;
  label: string;
  Icon: React.ElementType;
  isActive: boolean;
  showDot: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 16px', fontSize: 13,
        color: isActive ? '#222527' : 'rgba(34,37,39,0.58)',
        fontWeight: isActive ? 600 : 400,
        textDecoration: 'none',
        position: 'relative',
      }}
    >
      <span style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Icon style={{ width: 14, height: 14, opacity: isActive ? 0.80 : 0.50, flexShrink: 0 }} />
        {showDot && (
          <span style={{
            position: 'absolute', top: -2, right: -3,
            width: 5, height: 5, borderRadius: '50%',
            background: '#5a7d5d',
          }} />
        )}
      </span>
      {label}
      {isActive && (
        <span style={{
          marginLeft: 'auto',
          width: 5, height: 5, borderRadius: '50%',
          background: 'rgba(34,37,39,0.22)',
          flexShrink: 0,
        }} />
      )}
    </Link>
  );
}
