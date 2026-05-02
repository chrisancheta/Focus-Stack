export interface PriorityCard {
  id: string;
  title: string;
  notes?: string;
  bucket: 'must-do' | 'should-do' | 'could-do';
  recommendationLabel: 'do-now' | 'schedule' | 'reconsider' | 'deprioritize';
  recommendationReason: string;
  dueDate?: string;
  estimatedMinutes?: number;
  status: 'not-started' | 'in-progress' | 'completed' | 'deferred' | 'dropped';
  progressPercent: 0 | 25 | 50 | 75 | 100;
  importanceScore: 1 | 2 | 3 | 4 | 5;
  urgencyScore: 1 | 2 | 3 | 4 | 5;
  category?: string;
  recurrenceType?: 'none' | 'daily' | 'weekly';
  assignedFocusTime?: number;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  isCarryover?: boolean;
}

export interface DayPlan {
  id: string;
  date: string;
  weekStartDay: 0 | 1;
  planningStartedAt?: string;
  planningCompletedAt?: string;
  selectedPriorityIds: string[];
  candidatePriorityIds: string[];
  completedPriorityIds: string[];
  checkInCompleted: boolean;
  checkInCompletedAt?: string;
  zeroPriorityDay: boolean;
}

export interface CheckInEntry {
  id: string;
  dayPlanId: string;
  priorityCardId: string;
  finalStatus: string;
  finalProgressPercent: number;
  missReason?: 'underestimated-time' | 'interrupted' | 'low-energy' | 'priority-changed' | 'unclear' | 'avoided' | 'other';
}

export interface WeeklySummary {
  id: string;
  weekStartDate: string;
  completionRate: number;
  carryoverCount: number;
  streakDays: number;
  plannedCount: number;
  completedCount: number;
  topMissReason?: string;
  within35DaysCount: number;
  summaryText: string;
}

export interface Settings {
  weekStartDay: 0 | 1;
  reminderTimeLocal: string;
  importanceWeight: number;
  urgencyWeight: number;
  defaultFocusMinutes: number;
  calendarImportEnabled: boolean;
  carryoverEnabled: boolean;
  recurringPromptEnabled: boolean;
  themeMode: 'light' | 'dark' | 'system';
  retentionMode: 'rolling';
  rollingWindowWeeks: number;
  locale: string;
}

export interface FocusSession {
  id: string;
  startedAt: string;
  endedAt?: string;
  plannedMinutes: number;
  linkedPriorityId?: string;
  manualStart: boolean;
}

export interface AppState {
  priorities: PriorityCard[];
  dayPlans: DayPlan[];
  checkIns: CheckInEntry[];
  weeklySummaries: WeeklySummary[];
  focusSessions: FocusSession[];
  settings: Settings | null;
}

const STORAGE_KEY = 'focus-stack-data';

export const store = {
  load(): AppState {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error("Failed to load store", e);
    }
    return {
      priorities: [],
      dayPlans: [],
      checkIns: [],
      weeklySummaries: [],
      focusSessions: [],
      settings: null
    };
  },

  save(state: AppState): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error("Failed to save store", e);
    }
  },

  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
};
