import React from 'react';
import { Link, useLocation } from 'wouter';
import { LayoutDashboard, Timer, BarChart2, Settings, Command } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TopNav() {
  const [location] = useLocation();

  const navItems = [
    { href: '/home', label: 'Home', icon: LayoutDashboard },
    { href: '/focus', label: 'Focus Timer', icon: Timer },
    { href: '/trends', label: 'Trends', icon: BarChart2 },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4 max-w-4xl">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <Command className="h-5 w-5" />
          <span>Focus Stack</span>
        </div>
        
        <div className="flex items-center space-x-1 sm:space-x-2 text-sm">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md transition-colors hover:bg-muted",
                  isActive ? "bg-muted font-medium text-foreground" : "text-muted-foreground"
                )}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden sm:inline-block">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
