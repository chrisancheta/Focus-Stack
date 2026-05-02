import type { AppState } from './store';
import { generateId, getTodayISODate } from './utils';

function offsetDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export const getDemoData = (): AppState => {
  const today = getTodayISODate();

  return {
    settings: {
      weekStartDay: 1,
      reminderTimeLocal: '16:45',
      importanceWeight: 0.6,
      urgencyWeight: 0.4,
      defaultFocusMinutes: 30,
      calendarImportEnabled: false,
      carryoverEnabled: true,
      recurringPromptEnabled: true,
      themeMode: 'light',
      retentionMode: 'rolling',
      rollingWindowWeeks: 12,
      locale: 'en-US',
    },
    priorities: [
      {
        id: 'p1', title: 'Finish literature review draft', bucket: 'must-do',
        recommendationLabel: 'do-now', dueDate: offsetDate(3), estimatedMinutes: 90,
        status: 'in-progress', progressPercent: 50, importanceScore: 5, urgencyScore: 5,
        recommendationReason: 'Important + due soon', createdAt: today, updatedAt: today,
      },
      {
        id: 'p2', title: 'Reply to advisor feedback email', bucket: 'must-do',
        recommendationLabel: 'do-now', estimatedMinutes: 15,
        status: 'not-started', progressPercent: 0, importanceScore: 5, urgencyScore: 4,
        recommendationReason: 'High importance + low estimated time', createdAt: today, updatedAt: today,
      },
      {
        id: 'p3', title: 'Review stats chapter notes', bucket: 'should-do',
        recommendationLabel: 'schedule', estimatedMinutes: 45,
        status: 'not-started', progressPercent: 0, importanceScore: 4, urgencyScore: 3,
        recommendationReason: 'Scheduled study block', createdAt: today, updatedAt: today,
      },
      {
        id: 'p4', title: 'Update CV with recent conference', bucket: 'could-do',
        recommendationLabel: 'reconsider', estimatedMinutes: 30,
        status: 'not-started', progressPercent: 0, importanceScore: 2, urgencyScore: 2,
        recommendationReason: 'Low urgency', createdAt: today, updatedAt: today,
      },
      {
        id: 'p5', title: 'Read recommended paper on methodology', bucket: 'could-do',
        recommendationLabel: 'deprioritize', estimatedMinutes: 60,
        status: 'not-started', progressPercent: 0, importanceScore: 2, urgencyScore: 1,
        recommendationReason: 'Low importance, high effort', createdAt: today, updatedAt: today,
      },
      {
        id: 'p6', title: 'Morning standup notes', bucket: 'should-do',
        recommendationLabel: 'do-now', estimatedMinutes: 15,
        status: 'completed', progressPercent: 100, importanceScore: 3, urgencyScore: 3,
        recommendationReason: 'Routine', createdAt: today, updatedAt: today,
      },
      {
        id: 'p7', title: 'Submit IRB amendment form', bucket: 'must-do',
        recommendationLabel: 'do-now', estimatedMinutes: 30,
        status: 'not-started', progressPercent: 0, importanceScore: 5, urgencyScore: 5,
        recommendationReason: 'Carried over from yesterday', createdAt: today, updatedAt: today,
        isCarryover: true,
      },
      {
        id: 'p8', title: 'Prepare slides for lab meeting', bucket: 'must-do',
        recommendationLabel: 'do-now', estimatedMinutes: 60,
        status: 'completed', progressPercent: 100, importanceScore: 4, urgencyScore: 4,
        recommendationReason: 'Meeting tomorrow', createdAt: offsetDate(-3), updatedAt: offsetDate(-3),
      },
      {
        id: 'p9', title: 'Run data cleaning script', bucket: 'should-do',
        recommendationLabel: 'schedule', estimatedMinutes: 45,
        status: 'completed', progressPercent: 100, importanceScore: 3, urgencyScore: 3,
        recommendationReason: 'Blocked on this', createdAt: offsetDate(-4), updatedAt: offsetDate(-4),
      },
      {
        id: 'p10', title: 'Write introduction section', bucket: 'must-do',
        recommendationLabel: 'do-now', estimatedMinutes: 120,
        status: 'completed', progressPercent: 100, importanceScore: 5, urgencyScore: 4,
        recommendationReason: 'Chapter due end of week', createdAt: offsetDate(-5), updatedAt: offsetDate(-5),
      },
    ],
    dayPlans: [
      // Today
      {
        id: 'dp1', date: today, weekStartDay: 1,
        selectedPriorityIds: ['p1', 'p2', 'p3', 'p7'],
        candidatePriorityIds: ['p4', 'p5'],
        completedPriorityIds: ['p6'],
        checkInCompleted: false, zeroPriorityDay: false,
      },
      // Yesterday
      {
        id: 'dp2', date: offsetDate(-1), weekStartDay: 1,
        selectedPriorityIds: ['p8', 'p2', 'p3'],
        candidatePriorityIds: [],
        completedPriorityIds: ['p8', 'p3'],
        checkInCompleted: true, zeroPriorityDay: false,
      },
      // 2 days ago
      {
        id: 'dp3', date: offsetDate(-2), weekStartDay: 1,
        selectedPriorityIds: ['p9', 'p1', 'p3', 'p4'],
        candidatePriorityIds: ['p5'],
        completedPriorityIds: ['p9', 'p1'],
        checkInCompleted: true, zeroPriorityDay: false,
      },
      // 3 days ago
      {
        id: 'dp4', date: offsetDate(-3), weekStartDay: 1,
        selectedPriorityIds: ['p10', 'p2', 'p3'],
        candidatePriorityIds: [],
        completedPriorityIds: ['p10', 'p2', 'p3'],
        checkInCompleted: true, zeroPriorityDay: false,
      },
      // 4 days ago
      {
        id: 'dp5', date: offsetDate(-4), weekStartDay: 1,
        selectedPriorityIds: ['p1', 'p9', 'p7', 'p4', 'p5'],
        candidatePriorityIds: [],
        completedPriorityIds: ['p9'],
        checkInCompleted: true, zeroPriorityDay: false,
      },
      // 5 days ago
      {
        id: 'dp6', date: offsetDate(-5), weekStartDay: 1,
        selectedPriorityIds: ['p10', 'p2'],
        candidatePriorityIds: ['p4'],
        completedPriorityIds: ['p10'],
        checkInCompleted: true, zeroPriorityDay: false,
      },
    ],
    checkIns: [],
    weeklySummaries: [],
    focusSessions: [],
  };
};
