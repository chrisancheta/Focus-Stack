import React from 'react';
import { FocusTimerWidget } from '@/components/shared/FocusTimerWidget';
import { useAppStore } from '@/lib/storeContext';

export default function FocusPage() {
  const { state } = useAppStore();
  const defaultFocusMinutes = state.settings?.defaultFocusMinutes || 30;

  const todaySessions = state.focusSessions.filter(
    s => new Date(s.startedAt).toISOString().split('T')[0] === new Date().toISOString().split('T')[0]
  );

  return (
    <div className="flex flex-col items-center gap-8 py-4">
      <FocusTimerWidget initialMinutes={defaultFocusMinutes} />

      {todaySessions.length > 0 && (
        <div
          className="w-full max-w-sm rounded-2xl p-5"
          style={{
            background: 'rgba(255,255,255,0.40)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            border: '1px solid rgba(255,255,255,0.52)',
          }}
        >
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[#222527]/45 mb-4">
            Today's Sessions
          </h3>
          <div className="space-y-3">
            {todaySessions.map(session => {
              const priority = session.linkedPriorityId
                ? state.priorities.find(p => p.id === session.linkedPriorityId)
                : null;
              const ended = session.endedAt ? new Date(session.endedAt) : null;
              const started = new Date(session.startedAt);
              const actualMins = ended
                ? Math.round((ended.getTime() - started.getTime()) / 60000)
                : null;

              return (
                <div
                  key={session.id}
                  className="flex justify-between items-center py-2 border-b border-white/30 last:border-0"
                >
                  <div>
                    <span className="text-sm font-medium text-[#222527]">
                      {session.plannedMinutes} min
                    </span>
                    {priority && (
                      <p className="text-xs text-[#222527]/50 mt-0.5 truncate max-w-[160px]">
                        {priority.title}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-[#222527]/50">
                      {started.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {actualMins !== null && (
                      <p className="text-xs text-[#222527]/40">{actualMins}m actual</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!state.settings && (
        <p className="text-sm text-[#222527]/50 text-center">
          Complete setup to save session history.
        </p>
      )}
    </div>
  );
}
