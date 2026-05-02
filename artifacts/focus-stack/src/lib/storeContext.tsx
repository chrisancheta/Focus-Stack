import React, {
  createContext, useContext, useState, useEffect,
  useCallback, useRef, ReactNode,
} from 'react';
import { store, AppState, PriorityCard, DayPlan, FocusSession, Settings } from './store';
import { getDemoData } from './demoData';

interface StoreContextType {
  state: AppState;
  updateSettings:  (settings: Settings) => void;
  addPriority:     (priority: PriorityCard) => void;
  updatePriority:  (id: string, updates: Partial<PriorityCard>) => void;
  deletePriority:  (id: string) => void;
  addDayPlan:      (plan: DayPlan) => void;
  updateDayPlan:   (id: string, updates: Partial<DayPlan>) => void;
  addFocusSession: (session: FocusSession) => void;
  clearData:       () => void;
  loadDemoData:    () => void;
  resetApp:        () => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

export const AppStoreProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AppState>(store.load);

  // Skip the redundant first save (state was just loaded from localStorage)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    store.save(state);
  }, [state]);

  const updateSettings = useCallback((settings: Settings) => {
    setState(prev => ({ ...prev, settings }));
  }, []);

  const addPriority = useCallback((priority: PriorityCard) => {
    setState(prev => ({ ...prev, priorities: [...prev.priorities, priority] }));
  }, []);

  const updatePriority = useCallback((id: string, updates: Partial<PriorityCard>) => {
    setState(prev => ({
      ...prev,
      priorities: prev.priorities.map(p => p.id === id ? { ...p, ...updates } : p),
    }));
  }, []);

  const deletePriority = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      priorities: prev.priorities.filter(p => p.id !== id),
      dayPlans: prev.dayPlans.map(dp => ({
        ...dp,
        selectedPriorityIds:  dp.selectedPriorityIds.filter(pid => pid !== id),
        candidatePriorityIds: dp.candidatePriorityIds.filter(pid => pid !== id),
        completedPriorityIds: dp.completedPriorityIds.filter(pid => pid !== id),
      })),
    }));
  }, []);

  const addDayPlan = useCallback((plan: DayPlan) => {
    setState(prev => ({ ...prev, dayPlans: [...prev.dayPlans, plan] }));
  }, []);

  const updateDayPlan = useCallback((id: string, updates: Partial<DayPlan>) => {
    setState(prev => ({
      ...prev,
      dayPlans: prev.dayPlans.map(dp => dp.id === id ? { ...dp, ...updates } : dp),
    }));
  }, []);

  const addFocusSession = useCallback((session: FocusSession) => {
    setState(prev => ({ ...prev, focusSessions: [...prev.focusSessions, session] }));
  }, []);

  const clearData = useCallback(() => {
    setState(prev => ({
      ...prev,
      priorities: [],
      dayPlans: [],
      checkIns: [],
      weeklySummaries: [],
      focusSessions: [],
    }));
  }, []);

  const loadDemoData = useCallback(() => {
    setState(getDemoData());
  }, []);

  const resetApp = useCallback(() => {
    store.clear();
    setState({
      priorities: [],
      dayPlans: [],
      checkIns: [],
      weeklySummaries: [],
      focusSessions: [],
      settings: null,
    });
  }, []);

  return (
    <StoreContext.Provider value={{
      state,
      updateSettings,
      addPriority,
      updatePriority,
      deletePriority,
      addDayPlan,
      updateDayPlan,
      addFocusSession,
      clearData,
      loadDemoData,
      resetApp,
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export { StoreContext };

export const useAppStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useAppStore must be used within AppStoreProvider');
  return ctx;
};
