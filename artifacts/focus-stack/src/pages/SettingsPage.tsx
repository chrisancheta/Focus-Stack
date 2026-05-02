import React, { useState } from 'react';
import { useAppStore } from '@/lib/storeContext';
import { SectionCard } from '@/components/shared/SectionCard';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { state, updateSettings, clearData, resetApp } = useAppStore();
  const { toast } = useToast();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const s = state.settings;
  if (!s) return null;

  const handleChange = (key: keyof typeof s, value: any) => {
    updateSettings({ ...s, [key]: value });
  };

  const handleClearData = () => {
    clearData();
    setShowClearConfirm(false);
    toast({ title: "Data cleared", description: "Your history has been removed." });
  };

  const handleResetApp = () => {
    resetApp();
    setShowResetConfirm(false);
    window.location.reload();
  };

  return (
    <div className="space-y-6 pb-12">
      <h2 className="text-xl font-semibold">Settings</h2>

      <SectionCard title="Planning">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Week starts on</Label>
              <Select value={s.weekStartDay.toString()} onValueChange={v => handleChange('weekStartDay', parseInt(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sunday</SelectItem>
                  <SelectItem value="1">Monday</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Daily check-in time</Label>
              <Select value={s.reminderTimeLocal} onValueChange={v => handleChange('reminderTimeLocal', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Carryover incomplete items</Label>
              <p className="text-xs text-muted-foreground">Move unfinished tasks to tomorrow automatically</p>
            </div>
            <Switch checked={s.carryoverEnabled} onCheckedChange={v => handleChange('carryoverEnabled', v)} />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Focus">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Default focus duration</Label>
            <Select value={s.defaultFocusMinutes.toString()} onValueChange={v => handleChange('defaultFocusMinutes', parseInt(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">60 minutes</SelectItem>
                <SelectItem value="90">90 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Recommendation Logic">
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <Label>Importance Weight</Label>
              <span className="text-xs text-muted-foreground">{Math.round(s.importanceWeight * 100)}%</span>
            </div>
            <Slider 
              value={[s.importanceWeight * 100]} 
              max={100} 
              step={5} 
              onValueChange={v => handleChange('importanceWeight', v[0] / 100)} 
            />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <Label>Urgency Weight</Label>
              <span className="text-xs text-muted-foreground">{Math.round(s.urgencyWeight * 100)}%</span>
            </div>
            <Slider 
              value={[s.urgencyWeight * 100]} 
              max={100} 
              step={5} 
              onValueChange={v => handleChange('urgencyWeight', v[0] / 100)} 
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Data & Privacy">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Data is stored locally on this device. No information is sent to external servers.
          </p>
          <div className="flex flex-col gap-3">
            <Button variant="outline" onClick={() => setShowClearConfirm(true)}>Clear Completed History</Button>
            <Button variant="destructive" onClick={() => setShowResetConfirm(true)}>Reset Focus Stack</Button>
          </div>
        </div>
      </SectionCard>

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
