import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface QuickAddInputProps {
  onAdd: (text: string) => void;
  placeholder?: string;
  className?: string;
}

export function QuickAddInput({ onAdd, placeholder = "Add a priority...", className }: QuickAddInputProps) {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onAdd(text.trim());
      setText('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`flex items-center gap-2 ${className}`}>
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0 px-0 placeholder:text-muted-foreground/60 text-lg"
      />
      <Button type="submit" size="icon" disabled={!text.trim()} className="h-8 w-8 rounded-full shrink-0">
        <Plus className="h-4 w-4" />
      </Button>
    </form>
  );
}
