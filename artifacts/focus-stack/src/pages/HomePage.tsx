import React, { useState } from 'react';
import { useAppStore } from '@/lib/storeContext';
import { Button } from '@/components/ui/button';
import { SectionCard } from '@/components/shared/SectionCard';
import { PriorityCard } from '@/components/priority/PriorityCard';
import { QuickAddInput } from '@/components/priority/QuickAddInput';
import { PriorityDetailModal } from '@/components/priority/PriorityDetailModal';
import { generateId, getTodayISODate } from '@/lib/utils';
import { CollapsibleSection } from '@/components/shared/CollapsibleSection';

export default function HomePage() {
  const { state, addPriority, updatePriority, updateDayPlan } = useAppStore();
  const [selectedPriorityId, setSelectedPriorityId] = useState<string | null>(null);

  const today = getTodayISODate();
  const todayPlan = state.dayPlans.find(dp => dp.date === today);

  const priorities = state.priorities;
  const carryoverPriorities = priorities.filter(p => p.isCarryover && p.status !== 'completed');
  
  const selectedPriorities = todayPlan 
    ? priorities.filter(p => todayPlan.selectedPriorityIds.includes(p.id))
    : carryoverPriorities; // Fallback to carryover if no plan

  const candidatePriorities = todayPlan
    ? priorities.filter(p => todayPlan.candidatePriorityIds.includes(p.id))
    : [];

  const completedPriorities = todayPlan
    ? priorities.filter(p => todayPlan.completedPriorityIds.includes(p.id) || p.status === 'completed')
    : priorities.filter(p => p.status === 'completed');

  const handleQuickAdd = (title: string) => {
    const newPriority = {
      id: generateId(),
      title,
      bucket: 'should-do' as const,
      recommendationLabel: 'schedule' as const,
      recommendationReason: "Added just now",
      status: 'not-started' as const,
      progressPercent: 0 as const,
      importanceScore: 3 as const,
      urgencyScore: 3 as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    addPriority(newPriority);
    
    // Add to today's plan if it exists
    if (todayPlan) {
      updateDayPlan(todayPlan.id, {
        selectedPriorityIds: [...todayPlan.selectedPriorityIds, newPriority.id]
      });
    } else {
      // Create new plan
      updateDayPlan(generateId(), {
        date: today,
        weekStartDay: state.settings?.weekStartDay || 1,
        selectedPriorityIds: [newPriority.id],
        candidatePriorityIds: [],
        completedPriorityIds: [],
        checkInCompleted: false,
        zeroPriorityDay: false
      });
    }
  };

  const handleComplete = (id: string) => {
    updatePriority(id, { status: 'completed', progressPercent: 100 });
  };

  const handleMoveUp = (id: string) => {
    if (!todayPlan) return;
    const ids = [...todayPlan.selectedPriorityIds];
    const index = ids.indexOf(id);
    if (index > 0) {
      [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
      updateDayPlan(todayPlan.id, { selectedPriorityIds: ids });
    }
  };

  const handleMoveDown = (id: string) => {
    if (!todayPlan) return;
    const ids = [...todayPlan.selectedPriorityIds];
    const index = ids.indexOf(id);
    if (index < ids.length - 1) {
      [ids[index + 1], ids[index]] = [ids[index], ids[index + 1]];
      updateDayPlan(todayPlan.id, { selectedPriorityIds: ids });
    }
  };

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold mb-2">Ready to plan your day?</h2>
      <p className="text-muted-foreground mb-6 max-w-md">Add a few priorities or generate a suggested plan based on your tasks.</p>
      
      <div className="w-full max-w-md bg-card border border-border p-2 rounded-full mb-6">
        <QuickAddInput onAdd={handleQuickAdd} placeholder="e.g. Draft research proposal, 2h" className="px-2" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {!todayPlan || todayPlan.selectedPriorityIds.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          <SectionCard className="bg-accent/30 border-transparent">
            <QuickAddInput onAdd={handleQuickAdd} placeholder="What needs focus today?" />
          </SectionCard>

          {carryoverPriorities.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-destructive flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-destructive" />
                Needs Attention (Carryover)
              </h3>
              {carryoverPriorities.map(p => (
                <PriorityCard 
                  key={p.id} 
                  priority={p} 
                  onClick={() => setSelectedPriorityId(p.id)}
                  onComplete={() => handleComplete(p.id)}
                />
              ))}
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Today's Priorities</h3>
              <span className="text-xs text-muted-foreground">Recommended: 3-5</span>
            </div>
            
            <div className="space-y-2">
              {selectedPriorities.map(p => (
                <PriorityCard 
                  key={p.id} 
                  priority={p} 
                  onClick={() => setSelectedPriorityId(p.id)}
                  onComplete={() => handleComplete(p.id)}
                  onMoveUp={() => handleMoveUp(p.id)}
                  onMoveDown={() => handleMoveDown(p.id)}
                  showMoveControls={true}
                />
              ))}
            </div>
          </div>

          {(candidatePriorities.length > 0 || completedPriorities.length > 0) && (
            <div className="space-y-2 pt-4 border-t border-border">
              {candidatePriorities.length > 0 && (
                <CollapsibleSection title="Other Candidates" count={candidatePriorities.length}>
                  <div className="space-y-2 mt-2">
                    {candidatePriorities.map(p => (
                      <PriorityCard 
                        key={p.id} 
                        priority={p} 
                        onClick={() => setSelectedPriorityId(p.id)}
                      />
                    ))}
                  </div>
                </CollapsibleSection>
              )}
              
              {completedPriorities.length > 0 && (
                <CollapsibleSection title="Completed Today" count={completedPriorities.length}>
                  <div className="space-y-2 mt-2">
                    {completedPriorities.map(p => (
                      <PriorityCard 
                        key={p.id} 
                        priority={p} 
                        onClick={() => setSelectedPriorityId(p.id)}
                      />
                    ))}
                  </div>
                </CollapsibleSection>
              )}
            </div>
          )}
        </>
      )}

      <PriorityDetailModal
        priority={priorities.find(p => p.id === selectedPriorityId) || null}
        isOpen={!!selectedPriorityId}
        onClose={() => setSelectedPriorityId(null)}
        onSave={updatePriority}
        onDelete={() => { /* impl */ }}
      />
    </div>
  );
}
