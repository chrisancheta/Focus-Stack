import React from 'react';
import { FocusTimerWidget } from '@/components/shared/FocusTimerWidget';
import { useAppStore } from '@/lib/storeContext';

export default function FocusPage() {
  const { state } = useAppStore();
  const defaultFocusMinutes = state.settings?.defaultFocusMinutes || 25;

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-md space-y-6">
        <FocusTimerWidget initialMinutes={defaultFocusMinutes} />
        
        {state.focusSessions.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h3 className="font-medium text-sm text-foreground/80 mb-4">Today's Sessions</h3>
            <div className="space-y-3">
              {state.focusSessions.filter(s => new Date(s.startedAt).toISOString().split('T')[0] === new Date().toISOString().split('T')[0]).map(session => {
                const priority = session.linkedPriorityId ? state.priorities.find(p => p.id === session.linkedPriorityId) : null;
                return (
                  <div key={session.id} className="flex justify-between items-center text-sm border-b border-border/50 pb-2 last:border-0">
                    <div className="flex flex-col">
                      <span className="font-medium">{session.plannedMinutes} min</span>
                      {priority && <span className="text-xs text-muted-foreground">{priority.title}</span>}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(session.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
