import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useAppStore } from '@/lib/storeContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SetupPage() {
  const [, setLocation] = useLocation();
  const { updateSettings, loadDemoData } = useAppStore();
  
  const [weekStart, setWeekStart] = useState<"0"|"1">("1");
  const [reminder, setReminder] = useState("16:45");
  const [duration, setDuration] = useState("25");
  const [carryover, setCarryover] = useState(true);

  const handleSave = () => {
    updateSettings({
      weekStartDay: parseInt(weekStart) as 0 | 1,
      reminderTimeLocal: reminder,
      importanceWeight: 0.5,
      urgencyWeight: 0.5,
      defaultFocusMinutes: parseInt(duration),
      calendarImportEnabled: false,
      carryoverEnabled: carryover,
      recurringPromptEnabled: true,
      themeMode: 'light',
      retentionMode: 'rolling',
      rollingWindowWeeks: 12,
      locale: 'en-US'
    });
    setLocation('/home');
  };

  const handleLoadDemo = () => {
    loadDemoData();
    setLocation('/home');
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh] px-4 py-8">
      <div className="w-full max-w-md bg-card border border-border rounded-[10px] p-6 sm:p-8 shadow-sm">
        <h1 className="text-xl font-semibold mb-6">Quick Setup</h1>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Week starts on</Label>
            <Select value={weekStart} onValueChange={(v: "0"|"1") => setWeekStart(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Sunday</SelectItem>
                <SelectItem value="1">Monday</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Daily check-in time</Label>
            <Select value={reminder} onValueChange={setReminder}>
              <SelectTrigger>
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
          </div>
          
          <div className="space-y-2">
            <Label>Default focus duration</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25 minutes (Pomodoro)</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">60 minutes</SelectItem>
                <SelectItem value="90">90 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Carryover incomplete items</Label>
              <p className="text-xs text-muted-foreground">Automatically move unfinished tasks to tomorrow</p>
            </div>
            <Switch checked={carryover} onCheckedChange={setCarryover} />
          </div>
        </div>
        
        <div className="mt-8 flex flex-col gap-3">
          <Button onClick={handleSave} size="lg" className="w-full rounded-full" data-testid="button-continue-setup">
            Continue to Focus Stack
          </Button>
          <Button onClick={handleLoadDemo} variant="outline" className="w-full rounded-full" data-testid="button-load-demo">
            Load Demo Data
          </Button>
        </div>
      </div>
    </div>
  );
}
