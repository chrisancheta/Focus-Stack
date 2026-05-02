import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useAppStore } from '@/lib/storeContext';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const GLASS_INPUT = {
  background: 'rgba(255,255,255,0.55)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,255,255,0.65)',
};

export default function SetupPage() {
  const [, setLocation] = useLocation();
  const { updateSettings, loadDemoData } = useAppStore();

  const [weekStart, setWeekStart] = useState<'0' | '1'>('1');
  const [reminder, setReminder] = useState('16:45');
  const [durationMins, setDurationMins] = useState<30 | 45 | 60>(30);
  const [carryover, setCarryover] = useState(true);

  const handleSave = () => {
    updateSettings({
      weekStartDay: parseInt(weekStart) as 0 | 1,
      reminderTimeLocal: reminder,
      importanceWeight: 0.6,
      urgencyWeight: 0.4,
      defaultFocusMinutes: durationMins,
      calendarImportEnabled: false,
      carryoverEnabled: carryover,
      recurringPromptEnabled: true,
      themeMode: 'light',
      retentionMode: 'rolling',
      rollingWindowWeeks: 12,
      locale: 'en-US',
    });
    setLocation('/home');
  };

  const handleLoadDemo = () => {
    loadDemoData();
    setLocation('/home');
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[100dvh] px-4 py-10">
      <div
        className="w-full max-w-md rounded-3xl p-8"
        style={{
          background: 'rgba(255,255,255,0.50)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.65)',
          boxShadow: '0 20px 60px rgba(34,37,39,0.10)',
        }}
      >
        <h1 className="text-xl font-semibold text-[#222527] tracking-tight mb-1">Quick Setup</h1>
        <p className="text-sm text-[#222527]/50 mb-7">You can change any of these later in Settings.</p>

        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#222527]/60 uppercase tracking-wider">Week starts on</label>
            <div style={GLASS_INPUT} className="rounded-xl overflow-hidden">
              <Select value={weekStart} onValueChange={(v: '0' | '1') => setWeekStart(v)}>
                <SelectTrigger className="border-0 bg-transparent shadow-none h-11 text-[#222527] font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sunday</SelectItem>
                  <SelectItem value="1">Monday</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#222527]/60 uppercase tracking-wider">Daily check-in time</label>
            <div style={GLASS_INPUT} className="rounded-xl overflow-hidden">
              <Select value={reminder} onValueChange={setReminder}>
                <SelectTrigger className="border-0 bg-transparent shadow-none h-11 text-[#222527] font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="16:00">4:00 PM</SelectItem>
                  <SelectItem value="16:30">4:30 PM</SelectItem>
                  <SelectItem value="16:45">4:45 PM</SelectItem>
                  <SelectItem value="17:00">5:00 PM</SelectItem>
                  <SelectItem value="17:30">5:30 PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#222527]/60 uppercase tracking-wider">Default focus duration</label>
            <div className="flex gap-2">
              {([30, 45, 60] as const).map(min => (
                <button
                  key={min}
                  onClick={() => setDurationMins(min)}
                  className={cn(
                    "flex-1 h-11 rounded-xl text-sm font-medium transition-all",
                    durationMins === min
                      ? "bg-[#222527] text-white shadow-sm"
                      : "text-[#222527]/70 hover:text-[#222527]"
                  )}
                  style={durationMins === min ? {} : GLASS_INPUT}
                  data-testid={`duration-${min}`}
                >
                  {min}m
                </button>
              ))}
            </div>
          </div>

          <div
            className="flex items-center justify-between p-4 rounded-xl"
            style={GLASS_INPUT}
          >
            <div>
              <p className="text-sm font-medium text-[#222527]">Carryover incomplete items</p>
              <p className="text-xs text-[#222527]/45 mt-0.5">Move unfinished tasks to tomorrow</p>
            </div>
            <Switch
              checked={carryover}
              onCheckedChange={setCarryover}
              data-testid="toggle-carryover"
            />
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={handleSave}
            className="w-full h-12 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-85"
            style={{ background: '#222527' }}
            data-testid="button-continue-setup"
          >
            Continue to Focus Stack
          </button>
          <button
            onClick={handleLoadDemo}
            className="w-full h-11 rounded-full text-sm font-medium text-[#222527]/70 hover:text-[#222527] transition-colors"
            style={{
              background: 'rgba(255,255,255,0.35)',
              border: '1px solid rgba(255,255,255,0.55)',
            }}
            data-testid="button-load-demo"
          >
            Load Demo Data
          </button>
        </div>
      </div>
    </div>
  );
}
