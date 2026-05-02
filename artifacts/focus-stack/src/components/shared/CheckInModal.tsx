import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PriorityCard as PriorityType } from '@/lib/store';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  priorities: PriorityType[];
  onSave: (updates: { id: string; status: string; progress: number; reason?: string }[]) => void;
}

export function CheckInModal({ isOpen, onClose, priorities, onSave }: CheckInModalProps) {
  const [updates, setUpdates] = useState<Record<string, { status: string; progress: number; reason?: string }>>(
    Object.fromEntries(priorities.map(p => [
      p.id, 
      { status: p.status, progress: p.progressPercent, reason: undefined }
    ]))
  );

  const handleChange = (id: string, field: string, value: any) => {
    setUpdates(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  const handleSave = () => {
    const updatesList = Object.entries(updates).map(([id, data]) => ({ id, ...data }));
    onSave(updatesList);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Wrap up today</DialogTitle>
          <DialogDescription>
            Review how your planned priorities went.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {priorities.map(p => {
            const current = updates[p.id] ?? { status: p.status, progress: p.progressPercent, reason: undefined };
            const isCompleted = current.status === 'completed';
            
            return (
              <div key={p.id} className="p-4 bg-muted/30 border border-border rounded-lg space-y-4">
                <div className="font-medium text-sm">{p.title}</div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Select value={current.status} onValueChange={(v) => {
                    handleChange(p.id, 'status', v);
                    if (v === 'completed') handleChange(p.id, 'progress', 100);
                  }}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not-started">Not Started</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="deferred">Deferred</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={current.progress.toString()} onValueChange={(v) => handleChange(p.id, 'progress', parseInt(v))} disabled={isCompleted}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0%</SelectItem>
                      <SelectItem value="25">25%</SelectItem>
                      <SelectItem value="50">50%</SelectItem>
                      <SelectItem value="75">75%</SelectItem>
                      <SelectItem value="100">100%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {!isCompleted && current.status !== 'not-started' && (
                  <Select value={current.reason} onValueChange={(v) => handleChange(p.id, 'reason', v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="What held you back?" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="underestimated-time">Underestimated time</SelectItem>
                      <SelectItem value="interrupted">Interrupted</SelectItem>
                      <SelectItem value="low-energy">Low energy</SelectItem>
                      <SelectItem value="priority-changed">Priority changed</SelectItem>
                      <SelectItem value="unclear">Unclear next steps</SelectItem>
                      <SelectItem value="avoided">Avoided it</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            );
          })}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-4">
          <Button variant="ghost" onClick={onClose} className="w-full sm:w-auto">Remind me next time</Button>
          <Button onClick={handleSave} className="w-full sm:w-auto">Save check-in</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
