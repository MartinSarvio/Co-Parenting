/**
 * Data Sync — henter alt data fra backend og sætter det i Zustand store.
 *
 * Bruges ved login og session restore for at fylde store med server-data.
 */

import { api } from './api';
import {
  mapChild,
  mapHousehold,
  extractUsersFromHousehold,
  mapEvent,
  mapTask,
  mapExpense,
  mapDocument,
  mapMealPlan,
  mapThread,
  mapDecisionLog,
  mapKeyDate,
  mapDiaryEntry,
  mapMilestone,
} from './mappers';
import type {
  ApiHousehold,
  ApiChild,
  ApiCalendarEvent,
  ApiTask,
  ApiExpense,
  ApiDocument,
  ApiMealPlan,
  ApiThread,
  ApiDecisionLog,
  ApiKeyDate,
  ApiDiaryEntry,
  ApiMilestone,
} from './mappers';
import type {
  User,
  Child,
  Household,
  CalendarEvent,
  Task,
  Expense,
  Document,
  MealPlan,
  MessageThread,
  DecisionLog,
  KeyDate,
  DiaryEntry,
  Milestone,
} from '@/types';

export interface InitialData {
  users: User[];
  household: Household | null;
  children: Child[];
  events: CalendarEvent[];
  tasks: Task[];
  expenses: Expense[];
  documents: Document[];
  mealPlans: MealPlan[];
  threads: MessageThread[];
  decisions: DecisionLog[];
  keyDates: KeyDate[];
  diaryEntries: DiaryEntry[];
  milestones: Milestone[];
}

/**
 * Henter alt data parallelt fra backend og returnerer mapped data.
 * Kræver at brugeren er logget ind (token sat).
 */
export async function loadInitialData(): Promise<InitialData> {
  // Hent household først — det giver os users og children IDs
  const householdsRaw = await api.get<ApiHousehold[]>('/api/household');
  const household = householdsRaw.length > 0 ? mapHousehold(householdsRaw[0]) : null;
  const users = householdsRaw.length > 0 ? extractUsersFromHousehold(householdsRaw[0]) : [];

  // Hent resten parallelt
  const [
    childrenRaw,
    eventsRaw,
    tasksRaw,
    expensesRaw,
    documentsRaw,
    mealPlansRaw,
    threadsRaw,
    decisionsRaw,
    keyDatesRaw,
    diaryRaw,
    milestonesRaw,
  ] = await Promise.all([
    api.get<ApiChild[]>('/api/children').catch(() => [] as ApiChild[]),
    api.get<ApiCalendarEvent[]>('/api/events').catch(() => [] as ApiCalendarEvent[]),
    api.get<ApiTask[]>('/api/tasks').catch(() => [] as ApiTask[]),
    api.get<ApiExpense[]>('/api/expenses').catch(() => [] as ApiExpense[]),
    api.get<ApiDocument[]>('/api/documents').catch(() => [] as ApiDocument[]),
    api.get<ApiMealPlan[]>('/api/meal-plans').catch(() => [] as ApiMealPlan[]),
    api.get<ApiThread[]>('/api/messages/threads').catch(() => [] as ApiThread[]),
    api.get<ApiDecisionLog[]>('/api/decisions').catch(() => [] as ApiDecisionLog[]),
    api.get<ApiKeyDate[]>('/api/key-dates').catch(() => [] as ApiKeyDate[]),
    api.get<ApiDiaryEntry[]>('/api/diary').catch(() => [] as ApiDiaryEntry[]),
    api.get<ApiMilestone[]>('/api/milestones').catch(() => [] as ApiMilestone[]),
  ]);

  return {
    users,
    household,
    children: childrenRaw.map(mapChild),
    events: eventsRaw.map(mapEvent),
    tasks: tasksRaw.map(mapTask),
    expenses: expensesRaw.map(mapExpense),
    documents: documentsRaw.map(mapDocument),
    mealPlans: mealPlansRaw.map(mapMealPlan),
    threads: threadsRaw.map(mapThread),
    decisions: decisionsRaw.map(mapDecisionLog),
    keyDates: keyDatesRaw.map(mapKeyDate),
    diaryEntries: diaryRaw.map(mapDiaryEntry),
    milestones: milestonesRaw.map(mapMilestone),
  };
}
