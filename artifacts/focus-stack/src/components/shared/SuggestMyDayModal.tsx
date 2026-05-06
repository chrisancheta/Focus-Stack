import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';

interface Answers {
  must: string;
  stress: string;
  nagging: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (answers: Answers) => void;
}

const GLASS_MODAL: React.CSSProperties = {
  background: 'rgba(245,247,244,0.97)',
  backdropFilter: 'blur(28px)',
  WebkitBackdropFilter: 'blur(28px)',
  border: '1px solid rgba(255,255,255,0.72)',
};

const TEXTAREA_STYLE: React.CSSProperties = {
  background: 'rgba(34,37,39,0.045)',
  border: '1px solid rgba(255,255,255,0.55)',
};

function Question({
  label,
  hint,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-[#222527] mb-0.5 tracking-tight">{label}</p>
      <p className="text-xs text-[#222527]/40 mb-2">{hint}</p>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className="w-full resize-none rounded-2xl px-4 py-3 text-sm text-[#222527] placeholder:text-[#222527]/28 outline-none leading-relaxed"
        style={TEXTAREA_STYLE}
      />
    </div>
  );
}

export function SuggestMyDayModal({ isOpen, onClose, onSubmit }: Props) {
  const [must, setMust] = useState('');
  const [stress, setStress] = useState('');
  const [nagging, setNagging] = useState('');

  if (!isOpen) return null;

  const hasContent = must.trim() || stress.trim() || nagging.trim();

  const handleSubmit = () => {
    if (!hasContent) return;
    onSubmit({ must, stress, nagging });
    setMust('');
    setStress('');
    setNagging('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(34,37,39,0.22)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-3xl p-6 shadow-2xl" style={GLASS_MODAL}>

        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#222527]/55" />
            <h2 className="text-base font-semibold text-[#222527] tracking-tight">Suggest My Day</h2>
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-full flex items-center justify-center text-[#222527]/50 hover:text-[#222527] transition-colors"
            style={{ background: 'rgba(34,37,39,0.07)' }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <Question
            label="1. What must get done today?"
            hint="One item per line."
            value={must}
            onChange={setMust}
            placeholder="Submit the project proposal&#10;Call my manager back"
          />
          <Question
            label="2. What is stressing you out?"
            hint="Even if it feels vague — write it down."
            value={stress}
            onChange={setStress}
            placeholder="Haven't replied to client emails&#10;Dentist appointment overdue"
          />
          <Question
            label="3. What can wait but keeps nagging you?"
            hint="Things that linger in the background."
            value={nagging}
            onChange={setNagging}
            placeholder="Clean up my notes folder&#10;Read that article I saved"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!hasContent}
          className="mt-6 w-full py-3 rounded-full text-sm font-semibold text-white transition-opacity disabled:opacity-30 hover:opacity-85"
          style={{ background: '#222527' }}
        >
          Prioritize My Day
        </button>
      </div>
    </div>
  );
}
