import type { AppState } from './store';
import { generateId, getTodayISODate } from './utils';

export const getDemoData = (): AppState => {
  const today = getTodayISODate();
  
  return {
    settings: {
      weekStartDay: 1,
      reminderTimeLocal: "16:45",
      importanceWeight: 0.6,
      urgencyWeight: 0.4,
      defaultFocusMinutes: 25,
      calendarImportEnabled: false,
      carryoverEnabled: true,
      recurringPromptEnabled: true,
      themeMode: 'light',
      retentionMode: 'rolling',
      rollingWindowWeeks: 12,
      locale: 'en-US'
    },
    priorities: [
      {
        id: "p1", title: "Finish literature review draft", bucket: 'must-do', recommendationLabel: 'do-now',
        dueDate: "2025-10-10", estimatedMinutes: 90, status: 'in-progress', progressPercent: 50,
        importanceScore: 5, urgencyScore: 5, recommendationReason: "Important + due soon",
        createdAt: today, updatedAt: today
      },
      {
        id: "p2", title: "Reply to advisor feedback email", bucket: 'must-do', recommendationLabel: 'do-now',
        estimatedMinutes: 15, status: 'not-started', progressPercent: 0,
        importanceScore: 5, urgencyScore: 4, recommendationReason: "High importance + low estimated time",
        createdAt: today, updatedAt: today
      },
      {
        id: "p3", title: "Review stats chapter notes", bucket: 'should-do', recommendationLabel: 'schedule',
        estimatedMinutes: 45, status: 'not-started', progressPercent: 0,
        importanceScore: 4, urgencyScore: 3, recommendationReason: "Scheduled study block",
        createdAt: today, updatedAt: today
      },
      {
        id: "p4", title: "Update CV with recent conference", bucket: 'could-do', recommendationLabel: 'reconsider',
        estimatedMinutes: 30, status: 'not-started', progressPercent: 0,
        importanceScore: 2, urgencyScore: 2, recommendationReason: "Low urgency",
        createdAt: today, updatedAt: today
      },
      {
        id: "p5", title: "Read recommended paper on methodology", bucket: 'could-do', recommendationLabel: 'deprioritize',
        estimatedMinutes: 60, status: 'not-started', progressPercent: 0,
        importanceScore: 2, urgencyScore: 1, recommendationReason: "Low importance, high effort",
        createdAt: today, updatedAt: today
      },
      {
        id: "p6", title: "Morning standup notes", bucket: 'should-do', recommendationLabel: 'do-now',
        estimatedMinutes: 15, status: 'completed', progressPercent: 100,
        importanceScore: 3, urgencyScore: 3, recommendationReason: "Routine",
        createdAt: today, updatedAt: today
      },
      {
        id: "p7", title: "Submit IRB amendment form", bucket: 'must-do', recommendationLabel: 'do-now',
        estimatedMinutes: 30, status: 'not-started', progressPercent: 0,
        importanceScore: 5, urgencyScore: 5, recommendationReason: "Carried over from yesterday",
        createdAt: today, updatedAt: today, isCarryover: true
      }
    ],
    dayPlans: [
      {
        id: "dp1",
        date: today,
        weekStartDay: 1,
        selectedPriorityIds: ["p1", "p2", "p3", "p7"],
        candidatePriorityIds: ["p4", "p5"],
        completedPriorityIds: ["p6"],
        checkInCompleted: false,
        zeroPriorityDay: false
      }
    ],
    checkIns: [],
    weeklySummaries: [
      {
        id: "ws1",
        weekStartDate: "2025-10-01",
        completionRate: 0.71,
        carryoverCount: 3,
        streakDays: 4,
        plannedCount: 28,
        completedCount: 20,
        within35DaysCount: 5,
        summaryText: "You completed at least 70% of your priorities on 5 of 7 days. Carryover was highest on days when you selected more than 5 items — consider keeping it to 3 on high-effort days."
      }
    ],
    focusSessions: []
  };
};
