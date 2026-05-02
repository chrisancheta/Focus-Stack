import React from 'react';
import { Link } from 'wouter';

export default function WelcomePage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[100dvh] px-4">
      <div
        className="w-full max-w-sm rounded-3xl p-10 text-center"
        style={{
          background: 'rgba(255,255,255,0.50)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.65)',
          boxShadow: '0 20px 60px rgba(34,37,39,0.10)',
        }}
      >
        <div
          className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-7"
          style={{ background: '#222527' }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="1.5" />
            <path d="M12 7v5l3 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>

        <h1
          className="text-2xl font-semibold text-[#222527] mb-2 tracking-tight"
        >
          Focus Stack
        </h1>
        <p className="text-sm text-[#222527]/55 leading-relaxed mb-9">
          Set better priorities, faster. A quiet daily ritual for deciding what actually matters today.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/setup"
            className="block w-full py-3 rounded-full text-sm font-semibold text-white text-center transition-opacity hover:opacity-85"
            style={{ background: '#222527' }}
            data-testid="button-start"
          >
            Start
          </Link>
          <Link
            href="/setup"
            className="block w-full py-2.5 rounded-full text-sm font-medium text-[#222527]/60 text-center hover:text-[#222527] transition-colors"
            data-testid="button-customize"
          >
            Customize settings first
          </Link>
        </div>

        <p className="mt-8 text-xs text-[#222527]/35 tracking-wide">
          Local-first · No account required
        </p>
      </div>
    </div>
  );
}
