import React, { useState, useEffect } from 'react';
import { CheckCircle2, ArrowRight, X, Moon } from 'lucide-react';
import { PriorityCard as PriorityType } from '@/lib/store';
import { cn } from '@/lib/utils';

type Action = 'done' | 'carryover' | 'drop' | null;

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  priorities: PriorityType[];
  onSave: (updates: { id: string; action: Action }[]) => void;
}

const GLASS_PANEL = {
  background: 'rgba(255,255,255,0.72)',
  backdropFilter: 'blur(28px)',
  WebkitBackdropFilter: 'blur(28px)',
  border: '1px solid rgba(255,255,255,0.75)',
  boxShadow: '0 24px 64px rgba(34,37,39,0.16)',
};

const GLASS_ITEM = {
  background: 'rgba(255,255,255,0.50)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.65)',
};

function defaultAction(p: PriorityType): Action {
  if (p.status === 'completed') return 'done';
  if (p.status === 'dropped') return 'drop';
  if (p.isCarryover) return 'carryover';
  return null;
}

export function CheckInModal({ isOpen, onClose, priorities, onSave }: CheckInModalProps) {
  const [actions, setActions] = useState<Record<string, Action>>({});

  useEffect(() => {
    if (isOpen) {
      setActions(
        Object.fromEntries(priorities.map(p => [p.id, defaultAction(p)]))
      );
    }
  }, [isOpen, priorities]);

  if (!isOpen) return null;

  const set = (id: string, action: Action) =>
    setActions(prev => ({ ...prev, [id]: prev[id] === action ? null : action }));

  const doneCount = Object.values(actions).filter(a => a === 'done').length;
  const total = priorities.length;
  const allDecided = Object.values(actions).every(a => a !== null);

  const handleSave = () => {
    const updates = Object.entries(actions).map(([id, action]) => ({ id, action }));
    onSave(updates);
    onClose();
  };

  // Today's date, human-readable
  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(34,37,39,0.28)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-3xl overflow-hidden flex flex-col"
        style={{ ...GLASS_PANEL, maxHeight: '88dvh' }}
      >
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Moon className="h-4 w-4 text-[#222527]/50" />
              <p className="text-xs font-semibold uppercase tracking-widest text-[#222527]/40">
                Daily Check-In
              </p>
            </div>
            <h2 className="text-xl font-semibold text-[#222527] tracking-tight">
              How did today go?
            </h2>
            <p className="text-xs text-[#222527]/45 mt-0.5">{todayLabel}</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#222527]/35 hover:text-[#222527]/70 transition-colors p-1 -mr-1 -mt-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Progress bar ───────────────────────────────────────── */}
        <div className="px-6 pb-4 shrink-0">
          <div
            className="h-1.5 w-full rounded-full overflow-hidden"
            style={{ background: 'rgba(34,37,39,0.10)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${total > 0 ? (doneCount / total) * 100 : 0}%`,
                background: '#6B8F6E',
              }}
            />
          </div>
          <p className="text-[11px] text-[#222527]/40 mt-1.5">
            {doneCount} of {total} marked done
          </p>
        </div>

        {/* ── Priority list ──────────────────────────────────────── */}
        <div className="overflow-y-auto flex-1 px-6 pb-2 space-y-2.5">
          {priorities.length === 0 && (
            <div className="py-6 text-center">
              <p className="text-sm text-[#222527]/50">No priorities to review.</p>
            </div>
          )}

          {priorities.map(p => {
            const action = actions[p.id] ?? null;
            return (
              <div
                key={p.id}
                className="rounded-2xl p-4"
                style={GLASS_ITEM}
              >
                <p className={cn(
                  'text-sm font-medium text-[#222527] leading-snug mb-3',
                  action === 'done' && 'line-through opacity-50',
                  action === 'drop' && 'opacity-40',
                )}>
                  {p.title}
                </p>

                <div className="flex gap-2">
                  {/* Done */}
                  <button
                    onClick={() => set(p.id, 'done')}
                    className={cn(
                      'flex-1 h-9 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5',
                      action === 'done'
                        ? 'text-white shadow-sm'
                        : 'text-[#222527]/60 hover:text-[#222527]',
                    )}
                    style={action === 'done'
                      ? { background: '#222527' }
                      : { background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.70)' }
                    }
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Done
                  </button>

                  {/* Carry Over */}
                  <button
                    onClick={() => set(p.id, 'carryover')}
                    className={cn(
                      'flex-1 h-9 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5',
                      action === 'carryover'
                        ? 'text-white shadow-sm'
                        : 'text-[#222527]/60 hover:text-[#222527]',
                    )}
                    style={action === 'carryover'
                      ? { background: '#6B8F6E' }
                      : { background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.70)' }
                    }
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                    Tomorrow
                  </button>

                  {/* Drop */}
                  <button
                    onClick={() => set(p.id, 'drop')}
                    className={cn(
                      'h-9 w-9 rounded-xl text-xs font-semibold transition-all flex items-center justify-center shrink-0',
                      action === 'drop'
                        ? 'shadow-sm'
                        : 'text-[#222527]/40 hover:text-[#222527]/70',
                    )}
                    title="Drop this item"
                    style={action === 'drop'
                      ? { background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.30)', color: 'rgba(220,38,38,0.80)' }
                      : { background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.70)' }
                    }
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <div className="px-6 pt-3 pb-6 shrink-0 flex flex-col gap-2">
          <button
            onClick={handleSave}
            className="w-full h-12 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-85"
            style={{ background: '#222527' }}
          >
            {allDecided ? 'Wrap up day' : 'Save & close'}
          </button>
          <button
            onClick={onClose}
            className="w-full h-9 rounded-full text-xs text-[#222527]/45 hover:text-[#222527]/70 transition-colors"
          >
            Remind me later
          </button>
        </div>
      </div>
    </div>
  );
}
