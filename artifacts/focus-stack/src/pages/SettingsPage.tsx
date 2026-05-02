import React, { useState } from 'react';
import { useAppStore } from '@/lib/storeContext';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { useToast } from '@/hooks/use-toast';

const GLASS = {
  background: 'rgba(255,255,255,0.45)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.58)',
};

const GLASS_SUBTLE = {
  background: 'rgba(255,255,255,0.30)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.40)',
};

const DIVIDER = <div className="border-t border-white/40 my-1" />;

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[#222527]">{label}</p>
        {description && <p className="text-xs text-[#222527]/45 mt-0.5 leading-tight">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function SectionGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={GLASS}>
      <div className="px-5 pt-4 pb-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#222527]/40">{title}</p>
      </div>
      <div className="px-5 pb-3 divide-y divide-white/30">
        {children}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { state, updateSettings, clearData, resetApp } = useAppStore();
  const { toast } = useToast();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const DEFAULT_SETTINGS = {
    weekStartDay: 1 as const,
    activeDays: [1, 2, 3, 4, 5],
    reminderTimeLocal: '16:45',
    importanceWeight: 0.6,
    urgencyWeight: 0.4,
    defaultFocusMinutes: 30 as const,
    calendarImportEnabled: false,
    carryoverEnabled: true,
    recurringPromptEnabled: true,
    themeMode: 'light' as const,
    retentionMode: 'rolling' as const,
    rollingWindowWeeks: 12,
    locale: 'en-US',
  };
  const s = state.settings ?? DEFAULT_SETTINGS;

  const handleChange = (key: keyof typeof s, value: any) => updateSettings({ ...s, [key]: value });

  const handleClearData = () => {
    clearData();
    setShowClearConfirm(false);
    toast({ title: 'Data cleared', description: 'Your history has been removed.' });
  };

  const handleResetApp = () => {
    resetApp();
    setShowResetConfirm(false);
    window.location.reload();
  };

  return (
    <div className="space-y-4 pb-10">
      <h2 className="text-base font-semibold text-[#222527] tracking-tight px-1">Settings</h2>

      <SectionGroup title="Planning">
        <SettingRow label="Week starts on">
          <Select value={s.weekStartDay.toString()} onValueChange={v => handleChange('weekStartDay', parseInt(v))}>
            <SelectTrigger
              className="w-32 h-9 text-xs border-0 shadow-none rounded-xl"
              style={GLASS_SUBTLE}
              data-testid="select-week-start"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Sunday</SelectItem>
              <SelectItem value="1">Monday</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>

        <SettingRow label="Active days" description="Only these days count toward streak and stats">
          <div className="flex gap-1">
            {[
              { label: 'S', dow: 0 },
              { label: 'M', dow: 1 },
              { label: 'T', dow: 2 },
              { label: 'W', dow: 3 },
              { label: 'T', dow: 4 },
              { label: 'F', dow: 5 },
              { label: 'S', dow: 6 },
            ].map(({ label, dow }) => {
              const active = (s.activeDays ?? [1,2,3,4,5]).includes(dow);
              return (
                <button
                  key={dow}
                  onClick={() => {
                    const current = s.activeDays ?? [1,2,3,4,5];
                    const next = active
                      ? current.filter(d => d !== dow)
                      : [...current, dow].sort();
                    if (next.length > 0) handleChange('activeDays', next);
                  }}
                  className="w-7 h-7 rounded-lg text-[11px] font-semibold transition-all"
                  style={{
                    background: active ? '#222527' : 'rgba(255,255,255,0.45)',
                    color: active ? 'white' : 'rgba(34,37,39,0.45)',
                    border: active ? 'none' : '1px solid rgba(255,255,255,0.60)',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </SettingRow>

        <SettingRow label="Daily check-in">
          <Select value={s.reminderTimeLocal} onValueChange={v => handleChange('reminderTimeLocal', v)}>
            <SelectTrigger
              className="w-28 h-9 text-xs border-0 shadow-none rounded-xl"
              style={GLASS_SUBTLE}
              data-testid="select-reminder-time"
            >
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
        </SettingRow>

        <SettingRow label="Carryover incomplete items" description="Move unfinished tasks to tomorrow">
          <Switch
            checked={s.carryoverEnabled}
            onCheckedChange={v => handleChange('carryoverEnabled', v)}
            data-testid="toggle-carryover"
          />
        </SettingRow>

        <SettingRow label="Recurring item daily prompt" description="Ask each day whether to include recurring items">
          <Switch
            checked={s.recurringPromptEnabled}
            onCheckedChange={v => handleChange('recurringPromptEnabled', v)}
            data-testid="toggle-recurring"
          />
        </SettingRow>
      </SectionGroup>

      <SectionGroup title="Focus">
        <SettingRow label="Default focus duration">
          <Select value={s.defaultFocusMinutes.toString()} onValueChange={v => handleChange('defaultFocusMinutes', parseInt(v))}>
            <SelectTrigger
              className="w-28 h-9 text-xs border-0 shadow-none rounded-xl"
              style={GLASS_SUBTLE}
              data-testid="select-focus-duration"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="45">45 minutes</SelectItem>
              <SelectItem value="60">60 minutes</SelectItem>
              <SelectItem value="90">90 minutes</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
      </SectionGroup>

      <SectionGroup title="Recommendation Logic">
        <div className="py-3 space-y-5">
          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-medium text-[#222527]">Importance Weight</Label>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full text-[#222527]/60"
                style={GLASS_SUBTLE}
              >
                {Math.round(s.importanceWeight * 100)}%
              </span>
            </div>
            <Slider
              value={[s.importanceWeight * 100]}
              max={100}
              step={5}
              onValueChange={v => handleChange('importanceWeight', v[0] / 100)}
              data-testid="slider-importance"
            />
          </div>
          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-medium text-[#222527]">Urgency Weight</Label>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full text-[#222527]/60"
                style={GLASS_SUBTLE}
              >
                {Math.round(s.urgencyWeight * 100)}%
              </span>
            </div>
            <Slider
              value={[s.urgencyWeight * 100]}
              max={100}
              step={5}
              onValueChange={v => handleChange('urgencyWeight', v[0] / 100)}
              data-testid="slider-urgency"
            />
          </div>
        </div>
      </SectionGroup>

      <SectionGroup title="Calendar">
        <SettingRow label="Enable calendar import" description="Import events as draft priority cards">
          <Switch
            checked={s.calendarImportEnabled}
            onCheckedChange={v => handleChange('calendarImportEnabled', v)}
            data-testid="toggle-calendar"
          />
        </SettingRow>
        {s.calendarImportEnabled && (
          <div className="py-3">
            <p className="text-xs text-[#222527]/45">
              Calendar provider connection coming soon. Your events stay private and are never sent to external servers.
            </p>
          </div>
        )}
      </SectionGroup>

      <SectionGroup title="Data & Privacy">
        <div className="py-3 space-y-4">
          <div
            className="rounded-xl px-4 py-3 text-xs text-[#222527]/55 leading-relaxed"
            style={GLASS_SUBTLE}
          >
            All data is stored locally on this device. Nothing is sent to external servers.
          </div>
          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => setShowClearConfirm(true)}
              className="w-full h-10 rounded-xl text-sm font-medium text-[#222527]/70 hover:text-[#222527] transition-colors"
              style={GLASS_SUBTLE}
              data-testid="button-clear-history"
            >
              Clear completed history
            </button>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full h-10 rounded-xl text-sm font-medium transition-colors"
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.18)',
                color: 'rgba(220,38,38,0.75)',
              }}
              data-testid="button-reset-app"
            >
              Reset Focus Stack
            </button>
          </div>
        </div>
      </SectionGroup>

      <ConfirmModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearData}
        title="Clear local data?"
        description="This will remove all completed priorities, day plans, and historical trends. Active priorities will be kept."
        confirmText="Clear data"
      />
      <ConfirmModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleResetApp}
        title="Reset completely?"
        description="This will wipe all settings and data. You will be taken back to the initial setup screen."
        confirmText="Reset app"
      />
    </div>
  );
}
