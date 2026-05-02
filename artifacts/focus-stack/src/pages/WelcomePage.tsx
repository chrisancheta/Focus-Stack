import React from 'react';
import { Link } from 'wouter';
import { Command } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function WelcomePage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-md bg-card border border-border rounded-[10px] p-8 text-center shadow-sm">
        <div className="mx-auto w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-6">
          <Command className="h-6 w-6 text-primary-foreground" />
        </div>
        
        <h1 className="text-2xl font-semibold mb-2">Focus Stack</h1>
        <p className="text-muted-foreground mb-8">Set better priorities, faster. A quiet personal planning tool for your daily ritual.</p>
        
        <div className="flex flex-col gap-4 w-full">
          <Button asChild size="lg" className="w-full rounded-full" data-testid="button-start">
            <Link href="/setup">Start</Link>
          </Button>
          
          <Button variant="ghost" asChild className="text-sm text-muted-foreground w-full" data-testid="button-customize">
            <Link href="/setup">Customize settings first</Link>
          </Button>
        </div>
        
        <p className="mt-8 text-xs text-muted-foreground/60">Local-first · No account required</p>
      </div>
    </div>
  );
}
