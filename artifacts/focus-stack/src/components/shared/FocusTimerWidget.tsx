import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { Play, Pause, Square, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/storeContext';

interface FocusTimerWidgetProps {
  initialMinutes?: number;
  priorityId?: string;
}

export function FocusTimerWidget({ initialMinutes = 25, priorityId }: FocusTimerWidgetProps) {
  const [, setLocation] = useLocation();
  const { state } = useAppStore();
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [duration, setDuration] = useState(initialMinutes);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setTimeLeft(duration * 60);
    setIsRunning(false);
  }, [duration]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const toggleTimer = () => setIsRunning(!isRunning);
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(duration * 60);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  const linkedPriority = priorityId ? state.priorities.find(p => p.id === priorityId) : null;

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm max-w-md mx-auto w-full text-center">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold text-lg">Focus Timer</h3>
        {linkedPriority && (
          <div className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-md max-w-[150px] truncate">
            {linkedPriority.title}
          </div>
        )}
      </div>

      <div className="text-6xl font-bold tabular-nums tracking-tighter mb-8 text-foreground">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </div>

      <div className="flex justify-center gap-2 mb-8">
        {[25, 45, 60].map(min => (
          <Button 
            key={min}
            variant={duration === min ? "default" : "outline"} 
            size="sm"
            onClick={() => setDuration(min)}
            className="rounded-full"
            disabled={isRunning && duration !== min}
          >
            {min}m
          </Button>
        ))}
      </div>

      <div className="flex justify-center gap-4">
        <Button 
          variant={isRunning ? "outline" : "default"} 
          size="lg" 
          className="rounded-full w-32"
          onClick={toggleTimer}
        >
          {isRunning ? <Pause className="h-5 w-5 mr-2" /> : <Play className="h-5 w-5 mr-2" />}
          {isRunning ? 'Pause' : 'Start'}
        </Button>
        
        <Button 
          variant="outline" 
          size="lg" 
          className="rounded-full px-4"
          onClick={resetTimer}
        >
          <RotateCcw className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
