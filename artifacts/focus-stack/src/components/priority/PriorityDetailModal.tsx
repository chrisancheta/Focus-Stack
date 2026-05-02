import React, { useState } from 'react';
import { PriorityCard as PriorityType } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';

interface PriorityDetailModalProps {
  priority: PriorityType | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<PriorityType>) => void;
  onDelete: (id: string) => void;
}

export function PriorityDetailModal({ priority, isOpen, onClose, onSave, onDelete }: PriorityDetailModalProps) {
  const [formData, setFormData] = useState<Partial<PriorityType>>(priority || {});

  React.useEffect(() => {
    if (priority) setFormData(priority);
  }, [priority]);

  if (!priority) return null;

  const handleChange = (field: keyof PriorityType, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(priority.id, formData);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Edit Priority</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input 
              value={formData.title || ''} 
              onChange={e => handleChange('title', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Bucket</Label>
              <Select value={formData.bucket} onValueChange={v => handleChange('bucket', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="must-do">Must Do</SelectItem>
                  <SelectItem value="should-do">Should Do</SelectItem>
                  <SelectItem value="could-do">Could Do</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={v => handleChange('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="not-started">Not Started</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="deferred">Deferred</SelectItem>
                  <SelectItem value="dropped">Dropped</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Est. Minutes</Label>
              <Input 
                type="number" 
                value={formData.estimatedMinutes || ''} 
                onChange={e => handleChange('estimatedMinutes', parseInt(e.target.value))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Progress</Label>
              <Select value={formData.progressPercent?.toString()} onValueChange={v => handleChange('progressPercent', parseInt(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0%</SelectItem>
                  <SelectItem value="25">25%</SelectItem>
                  <SelectItem value="50">50%</SelectItem>
                  <SelectItem value="75">75%</SelectItem>
                  <SelectItem value="100">100%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Repeats</Label>
            <Select value={formData.recurrenceType || 'none'} onValueChange={v => handleChange('recurrenceType', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="daily">Every day</SelectItem>
                <SelectItem value="weekly">Every week (same day)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea 
              value={formData.notes || ''} 
              onChange={e => handleChange('notes', e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <SheetFooter className="mt-8 flex flex-col sm:flex-row gap-2">
          <Button variant="destructive" className="w-full sm:w-auto" onClick={() => { onDelete(priority.id); onClose(); }}>
            Delete
          </Button>
          <Button variant="outline" className="w-full sm:w-auto" onClick={onClose}>
            Cancel
          </Button>
          <Button className="w-full sm:w-auto" onClick={handleSave}>
            Save Changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
