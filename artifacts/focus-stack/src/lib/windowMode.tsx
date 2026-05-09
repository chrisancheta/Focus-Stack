import React, { createContext, useContext, useState, ReactNode } from 'react';

export type WindowMode = 'planning' | 'active' | 'mini' | 'expanded';

interface Ctx {
  mode: WindowMode;
  setMode: (m: WindowMode) => void;
}

const WindowModeCtx = createContext<Ctx>({ mode: 'planning', setMode: () => {} });

export function WindowModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<WindowMode>('planning');
  return <WindowModeCtx.Provider value={{ mode, setMode }}>{children}</WindowModeCtx.Provider>;
}

export function useWindowMode() {
  return useContext(WindowModeCtx);
}
