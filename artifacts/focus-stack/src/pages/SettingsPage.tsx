import React, { useState } from 'react';
import { useAppStore } from '@/lib/storeContext';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { useToast } from '@/hooks/use-toast';
import {
  ListChecks, Timer, Sliders, CalendarDays, ShieldCheck, ArrowUpDown,
} from 'lucide-react';

// ── Design tokens ──────────────────────────────────────────────────────────────

const GLASS = {
  background: 'rgba(255,255,255,0.55)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.72)',
  boxShadow: '0 2px 16px rgba(34,37,39,0.07)',
};

const GLASS_ELEVATED = {
  background: 'rgba(255,255,255,0.68)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1.5px solid rgba(255,255,255,0.88)',
  boxShadow: '0 4px 24px rgba(34,37,39,0.10)',
};

const GLASS_SUBTLE = {
  background: 'rgba(255,255,255,0.38)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.52)',
};

// ── Helper components ──────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  title,
  description,
  elevated,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  elevated?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div
        className="p-2 rounded-xl shrink-0 mt-0.5"
        style={{ background: elevated ? 'rgba(34,37,39,0.09)' : 'rgba(34,37,39,0.07)' }}
      >
        <Icon className={`h-4 w-4 ${elevated ? 'text-[#222527]/80' : 'text-[#222527]/55'}`} />
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#222527]/65 mb-0.5">{title}</p>
        {description && (
          <p className="text-xs text-[#222527]/50 leading-relaxed">{description}</p>
        )}
      </div>
    </div>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[#222527]">{label}</p>
        {description && (
          <p className="text-xs text-[#222527]/50 mt-0.5 leading-tight">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

// ── Recommendation Logic sub-components ───────────────────────────────────────

function WeightSplitBar({ iw, uw }: { iw: number; uw: number }) {
  const total = iw + uw || 1;
  const iPct = Math.round((iw / total) * 100);
  const uPct = 100 - iPct;

  return (
    <div className="space-y-1.5">
      <div className="flex rounded-xl overflow-hidden h-6 gap-px">
        <div
          className="flex items-center justify-center text-[10px] font-bold text-white transition-all duration-300 ease-out min-w-[32px]"
          style={{ width: `${iPct}%`, background: '#222527' }}
        >
          {iPct}%
        </div>
        <div
          className="flex items-center justify-center text-[10px] font-bold transition-all duration-300 ease-out min-w-[32px]"
          style={{ width: `${uPct}%`, background: 'rgba(107,143,110,0.72)', color: '#1a3e1d' }}
        >
          {uPct}%
        </div>
      </div>
      <div className="flex justify-between text-[10px] text-[#222527]/40 px-0.5">
        <span>Importance</span>
        <span>Urgency</span>
      </div>
    </div>
  );
}

const PREVIEW_TASKS = [
  { id: 'a', title: 'Quarterly strategy review', importance: 5, urgency: 1, iTag: 'I:5', uTag: 'U:1' },
  { id: 'b', title: 'Client escalation call',    importance: 3, urgency: 5, iTag: 'I:3', uTag: 'U:5' },
  { id: 'c', title: 'Team standup prep',          importance: 2, urgency: 3, iTag: 'I:2', uTag: 'U:3' },
];

function LiveRankingPreview({ iw, uw }: { iw: number; uw: number }) {
  const maxPossible = 5 * iw + 5 * uw || 1;

  const ranked = [...PREVIEW_TASKS]
    .map(t => ({ ...t, score: t.importance * iw + t.urgency * uw }))
    .sort((a, b) => b.score - a.score);

  const rankStyle = (idx: number) =>
    idx === 0
      ? { background: '#222527', color: '#fff' }
      : { background: 'rgba(34,37,39,0.10)', color: 'rgba(34,37,39,0.55)' };

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={GLASS_SUBTLE}
    >
      <div
        className="px-4 py-2.5 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.55)' }}
      >
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#222527]/55">
          Live Ranking Preview
        </p>
        <p className="text-[10px] text-[#222527]/38">Move sliders to see changes</p>
      </div>

      <div className="px-4 py-1 divide-y divide-white/35">
        {ranked.map((t, i) => {
          const barPct = (t.score / maxPossible) * 100;
          return (
            <div key={t.id} className="flex items-center gap-3 py-2.5">
              {/* Rank badge */}
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-all duration-300"
                style={rankStyle(i)}
              >
                {i + 1}
              </span>

              {/* Title + score bar */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-medium text-[#222527] truncate">{t.title}</span>
                  <div className="flex gap-1 shrink-0">
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md"
                      style={{ background: 'rgba(34,37,39,0.09)', color: 'rgba(34,37,39,0.55)' }}>
                      {t.iTag}
                    </span>
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md"
                      style={{ background: 'rgba(107,143,110,0.15)', color: '#2a4e2d' }}>
                      {t.uTag}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(34,37,39,0.10)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-300 ease-out"
                    style={{
                      width: `${barPct}%`,
                      background: i === 0 ? 'rgba(34,37,39,0.80)' : 'rgba(34,37,39,0.35)',
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-4 py-2" style={{ borderTop: '1px solid rgba(255,255,255,0.50)' }}>
        <p className="text-[10px] text-[#222527]/40 leading-relaxed">
          Rankings are based on: <span className="font-semibold text-[#222527]/55">score = importance × {Math.round(iw * 100)}% + urgency × {Math.round(uw * 100)}%</span>
        </p>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

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
    toast({ title: 'History cleared', description: 'Completed tasks and session history removed.' });
  };

  const handleResetApp = () => {
    resetApp();
    setShowResetConfirm(false);
    window.location.reload();
  };

  const DOW_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="space-y-4 pb-12">

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="px-1">
        <h2 className="text-base font-semibold text-[#222527] tracking-tight">Settings</h2>
        <p className="text-xs text-[#222527]/45 mt-0.5">Changes save instantly · everything stays on this device</p>
      </div>

      {/* ── Planning ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl p-5" style={GLASS}>
        <SectionHeader icon={ListChecks} title="Planning" />
        <div className="divide-y divide-white/35">

          <SettingRow label="Week starts on">
            <Select
              value={s.weekStartDay.toString()}
              onValueChange={v => handleChange('weekStartDay', parseInt(v))}
            >
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

          <SettingRow label="Active days" description="Counts toward streak and weekly stats">
            <div className="flex gap-1">
              {DOW_LABELS.map((label, dow) => {
                const active = (s.activeDays ?? [1,2,3,4,5]).includes(dow);
                return (
                  <button
                    key={dow}
                    onClick={() => {
                      const cur = s.activeDays ?? [1,2,3,4,5];
                      const next = active
                        ? cur.filter(d => d !== dow)
                        : [...cur, dow].sort();
                      if (next.length > 0) handleChange('activeDays', next);
                    }}
                    className="w-7 h-7 rounded-lg text-[11px] font-semibold transition-all hover:opacity-85"
                    style={{
                      background: active ? '#222527' : 'rgba(255,255,255,0.55)',
                      color:      active ? 'white'   : 'rgba(34,37,39,0.45)',
                      border:     active ? 'none'    : '1px solid rgba(255,255,255,0.68)',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </SettingRow>

          <SettingRow label="Daily check-in time" description="When you review your day">
            <Select
              value={s.reminderTimeLocal}
              onValueChange={v => handleChange('reminderTimeLocal', v)}
            >
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

          <SettingRow
            label="Carry over incomplete items"
            description="Move unfinished tasks to tomorrow automatically"
          >
            <Switch
              checked={s.carryoverEnabled}
              onCheckedChange={v => handleChange('carryoverEnabled', v)}
              data-testid="toggle-carryover"
            />
          </SettingRow>

          <SettingRow
            label="Recurring item daily prompt"
            description="Ask each morning whether to include recurring tasks"
          >
            <Switch
              checked={s.recurringPromptEnabled}
              onCheckedChange={v => handleChange('recurringPromptEnabled', v)}
              data-testid="toggle-recurring"
            />
          </SettingRow>

        </div>
      </div>

      {/* ── Focus Timer ──────────────────────────────────────────────── */}
      <div className="rounded-2xl p-5" style={GLASS}>
        <SectionHeader icon={Timer} title="Focus Timer" />
        <SettingRow label="Default session length" description="How long each focus block runs">
          <Select
            value={s.defaultFocusMinutes.toString()}
            onValueChange={v => handleChange('defaultFocusMinutes', parseInt(v))}
          >
            <SelectTrigger
              className="w-28 h-9 text-xs border-0 shadow-none rounded-xl"
              style={GLASS_SUBTLE}
              data-testid="select-focus-duration"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25 minutes</SelectItem>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="45">45 minutes</SelectItem>
              <SelectItem value="60">60 minutes</SelectItem>
              <SelectItem value="90">90 minutes</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
      </div>

      {/* ── Prioritization Engine ─────────────────────────────────────── */}
      <div className="rounded-2xl p-5" style={GLASS_ELEVATED}>
        <SectionHeader
          icon={Sliders}
          title="Prioritization Engine"
          description="When you rate a task's importance and urgency, these weights determine how the two scores are combined into a ranking recommendation. Adjust to favor strategic depth or time-sensitive responsiveness."
          elevated
        />

        {/* Weight split bar */}
        <div className="mb-5">
          <WeightSplitBar iw={s.importanceWeight} uw={s.urgencyWeight} />
        </div>

        {/* Importance slider */}
        <div className="space-y-2 mb-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#222527]">Importance weight</p>
              <p className="text-[10px] text-[#222527]/45 mt-0.5">Rewards long-term, goal-aligned work</p>
            </div>
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full text-[#222527]/70"
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
          <div className="flex justify-between text-[10px] text-[#222527]/35 px-0.5">
            <span>Not weighted</span>
            <span>Heavily weighted</span>
          </div>
        </div>

        {/* Urgency slider */}
        <div className="space-y-2 mb-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#222527]">Urgency weight</p>
              <p className="text-[10px] text-[#222527]/45 mt-0.5">Rewards deadline-driven, time-sensitive work</p>
            </div>
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full text-[#222527]/70"
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
          <div className="flex justify-between text-[10px] text-[#222527]/35 px-0.5">
            <span>Not weighted</span>
            <span>Heavily weighted</span>
          </div>
        </div>

        {/* Live preview */}
        <LiveRankingPreview iw={s.importanceWeight} uw={s.urgencyWeight} />
      </div>

      {/* ── Calendar ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl p-5" style={GLASS}>
        <SectionHeader icon={CalendarDays} title="Calendar" />
        <SettingRow
          label="Enable calendar import"
          description="Import events as draft priority cards"
        >
          <Switch
            checked={s.calendarImportEnabled}
            onCheckedChange={v => handleChange('calendarImportEnabled', v)}
            data-testid="toggle-calendar"
          />
        </SettingRow>
        {s.calendarImportEnabled && (
          <div
            className="mt-2 rounded-xl px-4 py-3 text-xs text-[#222527]/55 leading-relaxed"
            style={GLASS_SUBTLE}
          >
            Calendar provider connection coming soon. Events are parsed on-device — nothing is sent to external servers.
          </div>
        )}
      </div>

      {/* ── Privacy & Data ───────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: 'rgba(34,37,39,0.06)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(34,37,39,0.10)',
        }}
      >
        <SectionHeader icon={ShieldCheck} title="Privacy & Data" />

        {/* Privacy statement */}
        <div
          className="rounded-2xl p-4 mb-4"
          style={{
            background: 'rgba(255,255,255,0.48)',
            border: '1px solid rgba(255,255,255,0.65)',
          }}
        >
          <p className="text-sm font-semibold text-[#222527] mb-1.5">Focus Stack is fully local-first</p>
          <p className="text-xs text-[#222527]/60 leading-relaxed mb-3">
            No account required. No sync. No analytics. Everything you create here lives only in your browser's local storage and is never transmitted anywhere.
          </p>
          <div className="space-y-1">
            {[
              'Tasks and priorities',
              'Focus sessions and timers',
              'Weekly trends and patterns',
              'All settings and preferences',
            ].map(item => (
              <div key={item} className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full shrink-0" style={{ background: 'rgba(107,143,110,0.80)' }} />
                <span className="text-xs text-[#222527]/55">{item}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] font-semibold text-[#222527]/45 mt-3">
            All of the above → stored on this device only
          </p>
        </div>

        {/* Data management */}
        <div className="space-y-2">
          <button
            onClick={() => setShowClearConfirm(true)}
            className="w-full h-10 rounded-xl text-sm font-medium text-[#222527]/65 hover:text-[#222527] transition-colors"
            style={{
              background: 'rgba(255,255,255,0.45)',
              border: '1px solid rgba(255,255,255,0.62)',
            }}
            data-testid="button-clear-history"
          >
            Clear completed history
          </button>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-full h-10 rounded-xl text-sm font-medium transition-colors hover:opacity-90"
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.22)',
              color: 'rgba(220,38,38,0.80)',
            }}
            data-testid="button-reset-app"
          >
            Reset Focus Stack
          </button>
          <p className="text-[10px] text-[#222527]/35 text-center pt-1">
            Reset removes all data and settings permanently
          </p>
        </div>
      </div>

      <ConfirmModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearData}
        title="Clear local data?"
        description="This removes all completed priorities, day plans, and trend history. Active tasks are kept."
        confirmText="Clear data"
      />
      <ConfirmModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleResetApp}
        title="Reset completely?"
        description="This wipes all settings and data. You will be taken back to the initial setup screen."
        confirmText="Reset app"
      />
    </div>
  );
}
