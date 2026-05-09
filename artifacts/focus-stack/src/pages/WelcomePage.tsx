import React from 'react';
import { Link } from 'wouter';

export default function WelcomePage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[100dvh] px-4">
      <div
        className="w-full max-w-[520px] rounded-3xl p-8 text-center"
        style={{
          background: 'rgba(255,255,255,0.50)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.65)',
          boxShadow: '0 20px 60px rgba(34,37,39,0.10)',
        }}
      >
        <img
          src="/logo-full.png"
          alt="Focus Stack"
          className="mx-auto mb-7 h-14 w-auto object-contain"
        />
        <p className="text-xl text-[#222527]/55 leading-relaxed mb-9">
          Start your day with clarity.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/setup"
            className="block w-full py-3 rounded-full text-sm font-semibold text-white text-center transition-opacity hover:opacity-85"
            style={{ background: '#222527' }}
            data-testid="button-start"
          >
            Start My Day
          </Link>
          <Link
            href="/setup"
            className="block w-full py-2.5 rounded-full text-sm font-medium text-[#222527]/60 text-center hover:text-[#222527] transition-colors"
            data-testid="button-customize"
          >
            Settings
          </Link>
        </div>

        <p className="mt-5 text-xs text-[#222527]/35 tracking-wide">
          Local-first · No account required
        </p>
      </div>
    </div>
  );
}
