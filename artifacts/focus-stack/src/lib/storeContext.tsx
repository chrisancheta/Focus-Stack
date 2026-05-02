import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { store, AppState, PriorityCard, DayPlan, FocusSession, Settings } from './store';
import { getDemoData } from './demoData';

interface StoreContextType {
  state: AppState;
  updateSettings: (settings: Settings) => void;
  addPriority: (priority: PriorityCard) => void;
  updatePriority: (id: string, updates: Partial<PriorityCard>) => void;
  updateDayPlan: (id: string, updates: Partial<DayPlan>) => void;
  addFocusSession: (session: FocusSession) => void;
  clearData: () => void;
  loadDemoData: () => void;
  resetApp: () => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

export const AppStoreProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AppState>(store.load());

  useEffect(() => {
    store.save(state);
  }, [state]);

  const updateSettings = (settings: Settings) => {
    setState(prev => ({ ...prev, settings }));
  };

  const addPriority = (priority: PriorityCard) => {
    setState(prev => ({ ...prev, priorities: [...prev.priorities, priority] }));
  };

  const updatePriority = (id: string, updates: Partial<PriorityCard>) => {
    setState(prev => ({
      ...prev,
      priorities: prev.priorities.map(p => p.id === id ? { ...p, ...updates } : p)
    }));
  };

  const updateDayPlan = (id: string, updates: Partial<DayPlan>) => {
    setState(prev => ({
      ...prev,
      dayPlans: prev.dayPlans.map(dp => dp.id === id ? { ...dp, ...updates } : dp)
    }));
  };

  const addFocusSession = (session: FocusSession) => {
    setState(prev => ({ ...prev, focusSessions: [...prev.focusSessions, session] }));
  };

  const clearData = () => {
    const defaultState = store.load();
    defaultState.priorities = [];
    defaultState.dayPlans = [];
    defaultState.checkIns = [];
    defaultState.weeklySummaries = [];
    defaultState.focusSessions = [];
    setState(defaultState);
  };

  const loadDemoData = () => {
    setState(getDemoData());
  };

  const resetApp = () => {
    store.clear();
    setState({
      priorities: [],
      dayPlans: [],
      checkIns: [],
      weeklySummaries: [],
      focusSessions: [],
      settings: null
    });
  };

  return (
    <StoreContext.Provider value={{
      state,
      updateSettings,
      addPriority,
      updatePriority,
      updateDayPlan,
      addFocusSession,
      clearData,
      loadDemoData,
      resetApp
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useAppStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useAppStore must be used within AppStoreProvider");
  return ctx;
};
