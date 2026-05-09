import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useAppStore } from '@/lib/storeContext';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { RecommendationChip } from '@/components/priority/RecommendationChip';
import { useToast } from '@/hooks/use-toast';
import { ChevronDown, ChevronRight } from 'lucide-react';

// ── Design tokens ──────────────────────────────────────────────────────────────

const GLASS = {
  background:           'rgba(255,255,255,0.55)',
  backdropFilter:       'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border:               '1px solid rgba(255,255,255,0.72)',
  boxShadow:            '0 2px 16px rgba(34,37,39,0.07)',
};

const GLASS_SUBTLE = {
  background:           'rgba(255,255,255,0.38)',
  backdropFilter:       'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border:               '1px solid rgba(255,255,255,0.52)',
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function AccordionSection({
  title,
  summary,
  open,
  onToggle,
  elevated,
  children,
}: {
  title:    string;
  summary?: string;
  open:     boolean;
  onToggle: () => void;
  elevated?: boolean;
  children: React.ReactNode;
}) {
  const style = elevated
    ? {
        background:           'rgba(255,255,255,0.68)',
        backdropFilter:       'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border:               '1.5px solid rgba(255,255,255,0.88)',
        boxShadow:            '0 4px 24px rgba(34,37,39,0.10)',
      }
    : GLASS;

  return (
    <div className="rounded-2xl overflow-hidden" style={style}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left transition-colors hover:bg-white/20"
      >
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#222527]/60">
          {title}
        </p>
        <div className="flex items-center gap-2.5 shrink-0 ml-3">
          {!open && summary && (
            <span className="text-[11px] font-medium text-[#222527]/40">{summary}</span>
          )}
          <ChevronDown
            className="h-3.5 w-3.5 text-[#222527]/32 transition-transform duration-200"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </div>
      </button>

      {open && (
        <div
          className="px-5 pb-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.50)' }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label:    string;
  hint?:    string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-[#222527] leading-tight">{label}</p>
        {hint && (
          <p className="text-[11px] text-[#222527]/42 mt-0.5 leading-tight">{hint}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

// ── Weight split bar ───────────────────────────────────────────────────────────

function WeightBar({ iw, uw }: { iw: number; uw: number }) {
  const total = iw + uw || 1;
  const iPct  = Math.round((iw / total) * 100);
  const uPct  = 100 - iPct;
  return (
    <div className="space-y-1">
      <div className="flex rounded-lg overflow-hidden h-5 gap-px">
        <div
          className="flex items-center justify-center text-[10px] font-bold text-white transition-all duration-300 min-w-[28px]"
          style={{ width: `${iPct}%`, background: '#222527' }}
        >
          {iPct}%
        </div>
        <div
          className="flex items-center justify-center text-[10px] font-bold transition-all duration-300 min-w-[28px]"
          style={{ width: `${uPct}%`, background: 'rgba(107,143,110,0.72)', color: '#1a3e1d' }}
        >
          {uPct}%
        </div>
      </div>
      <div className="flex justify-between text-[10px] text-[#222527]/36 px-0.5">
        <span>Importance</span>
        <span>Urgency</span>
      </div>
    </div>
  );
}

// ── Live ranking preview ───────────────────────────────────────────────────────

const PREVIEW_TASKS = [
  { id: 'a', title: 'Quarterly strategy review', importance: 5, urgency: 1 },
  { id: 'b', title: 'Client escalation call',    importance: 3, urgency: 5 },
  { id: 'c', title: 'Team standup prep',          importance: 2, urgency: 3 },
];
const RANK_LABEL: Record<number, 'do-now' | 'schedule' | 'reconsider'> = {
  0: 'do-now',
  1: 'schedule',
  2: 'reconsider',
};

function LivePreview({ iw, uw }: { iw: number; uw: number }) {
  const maxPossible = 5 * iw + 5 * uw || 1;
  const ranked = [...PREVIEW_TASKS]
    .map(t => ({ ...t, score: t.importance * iw + t.urgency * uw }))
    .sort((a, b) => b.score - a.score);

  return (
    <div className="rounded-xl overflow-hidden mt-3" style={GLASS_SUBTLE}>
      <div className="px-3.5 py-2 divide-y divide-white/35">
        {ranked.map((t, i) => (
          <div key={t.id} className="flex items-center gap-2.5 py-2">
            <span
              className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 transition-all duration-300"
              style={
                i === 0
                  ? { background: '#222527', color: '#fff' }
                  : { background: 'rgba(34,37,39,0.10)', color: 'rgba(34,37,39,0.50)' }
              }
            >
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[11px] font-medium text-[#222527] truncate">{t.title}</span>
                <RecommendationChip label={RANK_LABEL[i]} />
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(34,37,39,0.09)' }}>
                <div
                  className="h-full rounded-full transition-all duration-300 ease-out"
                  style={{
                    width:      `${(t.score / maxPossible) * 100}%`,
                    background: i === 0 ? 'rgba(34,37,39,0.75)' : 'rgba(34,37,39,0.28)',
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div
        className="px-3.5 py-2"
        style={{ borderTop: '1px solid rgba(255,255,255,0.48)' }}
      >
        <p className="text-[10px] text-[#222527]/38">
          score = importance × {Math.round(iw * 100)}% + urgency × {Math.round(uw * 100)}%
        </p>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

type Section = 'engine' | 'planning' | 'timer' | 'calendar';

const DEFAULT_SETTINGS = {
  weekStartDay:          1 as const,
  activeDays:            [1, 2, 3, 4, 5],
  reminderTimeLocal:     '16:45',
  importanceWeight:      0.6,
  urgencyWeight:         0.4,
  defaultFocusMinutes:   30 as const,
  calendarImportEnabled: false,
  carryoverEnabled:      true,
  recurringPromptEnabled: true,
  themeMode:             'light' as const,
  retentionMode:         'rolling' as const,
  rollingWindowWeeks:    12,
  locale:                'en-US',
};

export default function SettingsPage() {
  const { state, updateSettings, clearData, resetApp } = useAppStore();
  const { toast }  = useToast();
  const [, setLocation] = useLocation();

  const [openSection,      setOpenSection]      = useState<Section | null>(null);
  const [showPreview,      setShowPreview]       = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const s = state.settings ?? DEFAULT_SETTINGS;
  const set = (key: keyof typeof s, value: unknown) => updateSettings({ ...s, [key]: value });

  const toggleSection = (id: Section) =>
    setOpenSection(prev => (prev === id ? null : id));

  const handleClear = () => {
    clearData();
    setShowClearConfirm(false);
    toast({ title: 'History cleared', description: 'Completed activities and session history removed.' });
  };
  const handleReset = () => {
    resetApp();
    setShowResetConfirm(false);
    setLocation('/welcome');
  };

  // ── Collapsed summaries ──────────────────────────────────────────────────────

  const DOW  = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const activeDays = s.activeDays ?? [1, 2, 3, 4, 5];

  const iw = s.importanceWeight;
  const uw = s.urgencyWeight;
  const engineSummary =
    Math.abs(iw - uw) < 0.08
      ? 'Balanced'
      : `${Math.round(iw * 100)} / ${Math.round(uw * 100)} split`;

  const planSummary    = `${activeDays.length}d/wk · ${fmtTime(s.reminderTimeLocal)}`;
  const timerSummary   = `${s.defaultFocusMinutes} min`;
  const calendarSummary = s.calendarImportEnabled ? 'Enabled' : 'Off';

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-2 pb-3">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="px-1 pb-1">
        <h2 className="text-base font-semibold text-[#222527] tracking-tight">Settings</h2>
      </div>

      {/* ── 1. Prioritization Engine ─────────────────────────────────────── */}
      <AccordionSection
        title="Prioritization Engine"
        summary={engineSummary}
        open={openSection === 'engine'}
        onToggle={() => toggleSection('engine')}
        elevated
      >
        {/* Intro — one tight sentence */}
        <p className="text-[11px] text-[#222527]/50 leading-snug mt-3 mb-3">
          Rates your activities by combining importance × urgency into a ranked label. Adjust the split to favour strategic depth or deadline response.
        </p>

        {/* Weight bar */}
        <div className="mb-4">
          <WeightBar iw={iw} uw={uw} />
        </div>

        {/* Importance slider */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[13px] font-medium text-[#222527]">Importance weight</p>
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-full text-[#222527]/65"
              style={GLASS_SUBTLE}
            >
              {Math.round(iw * 100)}%
            </span>
          </div>
          <Slider
            value={[iw * 100]}
            max={100} step={5}
            onValueChange={v => set('importanceWeight', v[0] / 100)}
            data-testid="slider-importance"
          />
        </div>

        {/* Urgency slider */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[13px] font-medium text-[#222527]">Urgency weight</p>
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-full text-[#222527]/65"
              style={GLASS_SUBTLE}
            >
              {Math.round(uw * 100)}%
            </span>
          </div>
          <Slider
            value={[uw * 100]}
            max={100} step={5}
            onValueChange={v => set('urgencyWeight', v[0] / 100)}
            data-testid="slider-urgency"
          />
        </div>

        {/* Preview toggle */}
        <button
          onClick={() => setShowPreview(v => !v)}
          className="flex items-center gap-1.5 text-[11px] font-medium text-[#222527]/44 hover:text-[#222527]/68 transition-colors"
        >
          <ChevronRight
            className="h-3 w-3 transition-transform duration-150"
            style={{ transform: showPreview ? 'rotate(90deg)' : 'rotate(0deg)' }}
          />
          {showPreview ? 'Hide example' : 'Show example'}
        </button>

        {showPreview && <LivePreview iw={iw} uw={uw} />}
      </AccordionSection>

      {/* ── 2. Planning ─────────────────────────────────────────────────── */}
      <AccordionSection
        title="Planning"
        summary={planSummary}
        open={openSection === 'planning'}
        onToggle={() => toggleSection('planning')}
      >
        <div className="divide-y divide-white/35 mt-1">

          <Row label="Week starts on">
            <Select
              value={s.weekStartDay.toString()}
              onValueChange={v => set('weekStartDay', parseInt(v))}
            >
              <SelectTrigger
                className="w-28 h-8 text-xs border-0 shadow-none rounded-xl"
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
          </Row>

          <Row label="Active days">
            <div className="flex gap-1">
              {DOW.map((label, dow) => {
                const on = activeDays.includes(dow);
                return (
                  <button
                    key={dow}
                    onClick={() => {
                      const next = on
                        ? activeDays.filter(d => d !== dow)
                        : [...activeDays, dow].sort();
                      if (next.length > 0) set('activeDays', next);
                    }}
                    className="w-6 h-6 rounded-md text-[10px] font-bold transition-all hover:opacity-85"
                    style={{
                      background: on ? '#222527' : 'rgba(255,255,255,0.55)',
                      color:      on ? 'white'   : 'rgba(34,37,39,0.42)',
                      border:     on ? 'none'    : '1px solid rgba(255,255,255,0.68)',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </Row>

          <Row label="Daily check-in">
            <Select
              value={s.reminderTimeLocal}
              onValueChange={v => set('reminderTimeLocal', v)}
            >
              <SelectTrigger
                className="w-28 h-8 text-xs border-0 shadow-none rounded-xl"
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
          </Row>

          <Row label="Carry over unfinished items" hint="Move to tomorrow automatically">
            <Switch
              checked={s.carryoverEnabled}
              onCheckedChange={v => set('carryoverEnabled', v)}
              data-testid="toggle-carryover"
            />
          </Row>

          <Row label="Ask about recurring activities" hint="Prompted at the start of each day">
            <Switch
              checked={s.recurringPromptEnabled}
              onCheckedChange={v => set('recurringPromptEnabled', v)}
              data-testid="toggle-recurring"
            />
          </Row>

        </div>
      </AccordionSection>

      {/* ── 3. Focus Timer ──────────────────────────────────────────────── */}
      <AccordionSection
        title="Focus Timer"
        summary={timerSummary}
        open={openSection === 'timer'}
        onToggle={() => toggleSection('timer')}
      >
        <div className="mt-1">
          <Row label="Default session length" hint="Pomodoro block duration">
            <Select
              value={s.defaultFocusMinutes.toString()}
              onValueChange={v => set('defaultFocusMinutes', parseInt(v))}
            >
              <SelectTrigger
                className="w-28 h-8 text-xs border-0 shadow-none rounded-xl"
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
          </Row>
        </div>
      </AccordionSection>

      {/* ── 4. Calendar ─────────────────────────────────────────────────── */}
      <AccordionSection
        title="Calendar"
        summary={calendarSummary}
        open={openSection === 'calendar'}
        onToggle={() => toggleSection('calendar')}
      >
        <div className="mt-1">
          <Row label="Import calendar events" hint="Creates draft priority cards from events">
            <Switch
              checked={s.calendarImportEnabled}
              onCheckedChange={v => set('calendarImportEnabled', v)}
              data-testid="toggle-calendar"
            />
          </Row>
          {s.calendarImportEnabled && (
            <p className="text-[11px] text-[#222527]/48 leading-snug mt-1 pb-1">
              Provider connection coming soon. Events are parsed on-device — nothing leaves your browser.
            </p>
          )}
        </div>
      </AccordionSection>

      {/* ── 5. Privacy & Data ───────────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background:           'rgba(34,37,39,0.05)',
          backdropFilter:       'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border:               '1px solid rgba(34,37,39,0.09)',
        }}
      >
        {/* Trust statement */}
        <div className="px-5 py-3.5">
          <div className="flex items-start gap-2.5">
            <div
              className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
              style={{ background: 'rgba(107,143,110,0.80)' }}
            />
            <div>
              <p className="text-[13px] font-semibold text-[#222527]">Local-first · No sync · No analytics</p>
              <p className="text-[11px] text-[#222527]/48 mt-0.5 leading-snug">
                Everything you create lives only in your browser's local storage and is never transmitted anywhere.
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(34,37,39,0.08)' }} />

        {/* Destructive actions */}
        <div className="px-5 py-3 flex items-center gap-2.5">
          <button
            onClick={() => setShowClearConfirm(true)}
            className="flex-1 h-8 rounded-xl text-[12px] font-medium text-[#222527]/58 hover:text-[#222527] transition-colors"
            style={{
              background: 'rgba(255,255,255,0.42)',
              border:     '1px solid rgba(255,255,255,0.60)',
            }}
            data-testid="button-clear-history"
          >
            Clear history
          </button>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex-1 h-8 rounded-xl text-[12px] font-medium transition-colors hover:opacity-90"
            style={{
              background: 'rgba(239,68,68,0.07)',
              border:     '1px solid rgba(239,68,68,0.18)',
              color:      'rgba(220,38,38,0.75)',
            }}
            data-testid="button-reset-app"
          >
            Reset all data
          </button>
        </div>
      </div>

      {/* ── Footer credit ────────────────────────────────────────────────── */}
      <p className="text-center text-[10px] text-[#222527]/28 pt-2 pb-1 tracking-wide">
        Built by Chris Ancheta with Replit
      </p>

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClear}
        title="Clear local data?"
        description="This removes all completed priorities, day plans, and trend history. Active activities are kept."
        confirmText="Clear data"
      />
      <ConfirmModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleReset}
        title="Reset completely?"
        description="All activities, sessions, settings, and history will be permanently deleted. This cannot be undone."
        confirmText="Reset Focus Stack"
      />
    </div>
  );
}
