import React from 'react';
import { Link, useLocation } from 'wouter';
import { LayoutDashboard, Timer, BarChart2, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTimer } from '@/lib/timerContext';

export function TopNav() {
  const [location]            = useLocation();
  const { isRunning, isDone } = useTimer();

  const navItems = [
    { href: '/home',     label: 'Eisenhower', icon: LayoutDashboard },
    { href: '/focus',    label: 'Pomodoro',   icon: Timer           },
    { href: '/trends',   label: 'Trends',   icon: BarChart2       },
    { href: '/settings', label: 'Settings', icon: Settings        },
  ];

  return (
    <nav
      className="sticky top-0 z-50 w-full"
      style={{
        background: 'rgba(255,255,255,0.22)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        borderBottom: '1px solid rgba(255,255,255,0.35)',
      }}
    >
      <div className="max-w-3xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Focus Stack" className="h-7 w-7 object-contain" />
          <span className="font-semibold text-[#222527] tracking-tight text-base">Focus Stack</span>
        </div>

        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location === item.href;

            // Show a pulsing dot on the Focus nav item when the timer is running
            // and the user is on a different page
            const showRunningDot =
              item.href === '/focus' &&
              isRunning &&
              !isDone &&
              location !== '/focus';

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                  isActive
                    ? "bg-[#222527] text-white shadow-sm"
                    : "text-[#222527]/70 hover:text-[#222527] hover:bg-white/40"
                )}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <item.icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline-block">{item.label}</span>

                {showRunningDot && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6B8F6E] opacity-70" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#6B8F6E]" />
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
