/**
 * useApiActions — hook der wrapper store-actions med backend API-kald.
 *
 * Pattern: "Optimistic update" — opdater store først, sync til server bagefter.
 * Hvis API fejler, kan vi rulle tilbage (eller vise en toast).
 *
 * Brug: Sektioner importerer denne hook i stedet for at kalde store-actions direkte
 * for CRUD operationer der skal synces til backend.
 */

import { useCallback } from 'react';
import { useAppStore } from '@/store';
import { api } from '@/lib/api';
import {
  mapEvent,
  mapTask,
  mapExpense,
  mapDocument,
  mapMealPlan,
  mapThread,
  mapMessage,
  mapChild,
  mapDiaryEntry,
  mapKeyDate,
  mapDecisionLog,
  mapMilestone,
} from '@/lib/mappers';
import type {
  ApiCalendarEvent,
  ApiTask,
  ApiExpense,
  ApiDocument,
  ApiMealPlan,
  ApiThread,
  ApiMessage,
  ApiChild,
  ApiDiaryEntry,
  ApiKeyDate,
  ApiDecisionLog,
  ApiMilestone,
} from '@/lib/mappers';
import type { CalendarEvent, Task, Expense, MealPlan, Child, DiaryEntry, KeyDate, DecisionLog, Milestone } from '@/types';
import { toast } from 'sonner';

function handleError(err: unknown, fallbackMsg: string) {
  console.error(fallbackMsg, err);
  const message = err instanceof Error ? err.message : fallbackMsg;
  toast.error(message);
}

export function useApiActions() {
  const store = useAppStore();

  // ── Events ──────────────────────────────────────────────

  const createEvent = useCallback(
    async (data: Omit<CalendarEvent, 'id'>) => {
      try {
        const raw = await api.post<ApiCalendarEvent>('/api/events', {
          title: data.title,
          description: data.description,
          startDate: data.startDate,
          endDate: data.endDate,
          type: data.type,
          childId: data.childId,
          location: data.location,
          assignedTo: data.assignedTo,
          isRecurring: data.isRecurring,
        });
        const event = mapEvent(raw);
        store.addEvent(event);
        return event;
      } catch (err) {
        handleError(err, 'Kunne ikke oprette begivenhed');
        return null;
      }
    },
    [store],
  );

  const updateEvent = useCallback(
    async (id: string, data: Partial<CalendarEvent>) => {
      // Optimistic update
      store.updateEvent(id, data);
      try {
        await api.patch(`/api/events/${id}`, {
          ...data,
          ...(data.startDate && { startDate: data.startDate }),
          ...(data.endDate && { endDate: data.endDate }),
        });
      } catch (err) {
        handleError(err, 'Kunne ikke opdatere begivenhed');
      }
    },
    [store],
  );

  const deleteEvent = useCallback(
    async (id: string) => {
      store.deleteEvent(id);
      try {
        await api.delete(`/api/events/${id}`);
      } catch (err) {
        handleError(err, 'Kunne ikke slette begivenhed');
      }
    },
    [store],
  );

  // ── Tasks ───────────────────────────────────────────────

  const createTask = useCallback(
    async (data: Omit<Task, 'id'>) => {
      try {
        const raw = await api.post<ApiTask>('/api/tasks', {
          title: data.title,
          description: data.description,
          assignedTo: data.assignedTo,
          deadline: data.deadline,
          category: data.category,
          isRecurring: data.isRecurring,
          plannedWeekday: data.plannedWeekday,
          area: data.area,
        });
        const task = mapTask(raw);
        store.addTask(task);
        return task;
      } catch (err) {
        handleError(err, 'Kunne ikke oprette opgave');
        return null;
      }
    },
    [store],
  );

  const updateTask = useCallback(
    async (id: string, data: Partial<Task>) => {
      store.updateTask(id, data);
      try {
        await api.patch(`/api/tasks/${id}`, {
          ...data,
          ...(data.deadline && { deadline: data.deadline }),
        });
      } catch (err) {
        handleError(err, 'Kunne ikke opdatere opgave');
      }
    },
    [store],
  );

  const deleteTask = useCallback(
    async (id: string) => {
      store.deleteTask(id);
      try {
        await api.delete(`/api/tasks/${id}`);
      } catch (err) {
        handleError(err, 'Kunne ikke slette opgave');
      }
    },
    [store],
  );

  // ── Expenses ────────────────────────────────────────────

  const createExpense = useCallback(
    async (data: Omit<Expense, 'id' | 'createdAt'>) => {
      try {
        const raw = await api.post<ApiExpense>('/api/expenses', {
          title: data.title,
          description: data.description,
          amount: data.amount,
          currency: data.currency,
          category: data.category,
          splitWith: data.splitWith,
          splitAmounts: data.splitAmounts,
          splitType: data.splitType,
          date: data.date,
          receiptUrl: data.receiptUrl,
          isRecurring: data.isRecurring,
        });
        const expense = mapExpense(raw);
        store.addExpense(expense);
        return expense;
      } catch (err) {
        handleError(err, 'Kunne ikke oprette udgift');
        return null;
      }
    },
    [store],
  );

  const updateExpense = useCallback(
    async (id: string, data: Partial<Expense>) => {
      store.updateExpense(id, data);
      try {
        await api.patch(`/api/expenses/${id}`, data);
      } catch (err) {
        handleError(err, 'Kunne ikke opdatere udgift');
      }
    },
    [store],
  );

  const approveExpense = useCallback(
    async (id: string, userId: string) => {
      store.approveExpense(id, userId);
      try {
        await api.post(`/api/expenses/${id}/approve`);
      } catch (err) {
        handleError(err, 'Kunne ikke godkende udgift');
      }
    },
    [store],
  );

  const deleteExpense = useCallback(
    async (id: string) => {
      store.deleteExpense(id);
      try {
        await api.delete(`/api/expenses/${id}`);
      } catch (err) {
        handleError(err, 'Kunne ikke slette udgift');
      }
    },
    [store],
  );

  // ── Documents ───────────────────────────────────────────

  const createDocument = useCallback(
    async (data: { title: string; type: string; url: string; sharedWith?: string[]; isOfficial?: boolean; validFrom?: string; validUntil?: string }) => {
      try {
        const raw = await api.post<ApiDocument>('/api/documents', data);
        const doc = mapDocument(raw);
        store.addDocument(doc);
        return doc;
      } catch (err) {
        handleError(err, 'Kunne ikke oprette dokument');
        return null;
      }
    },
    [store],
  );

  const deleteDocument = useCallback(
    async (id: string) => {
      // Remove from store (no local deleteDocument action exists, so filter manually)
      try {
        await api.delete(`/api/documents/${id}`);
        // Reload documents
        const raw = await api.get<ApiDocument[]>('/api/documents');
        store.hydrateFromServer({ documents: raw.map(mapDocument) });
      } catch (err) {
        handleError(err, 'Kunne ikke slette dokument');
      }
    },
    [store],
  );

  // ── MealPlans ───────────────────────────────────────────

  const createMealPlan = useCallback(
    async (data: Omit<MealPlan, 'id' | 'createdAt' | 'createdBy'>) => {
      try {
        const raw = await api.post<ApiMealPlan>('/api/meal-plans', {
          date: data.date,
          mealType: data.mealType,
          title: data.title,
          notes: data.notes,
          recipe: data.recipe,
        });
        const meal = mapMealPlan(raw);
        store.addMealPlan(meal);
        return meal;
      } catch (err) {
        handleError(err, 'Kunne ikke oprette madplan');
        return null;
      }
    },
    [store],
  );

  const updateMealPlan = useCallback(
    async (id: string, data: Partial<MealPlan>) => {
      store.updateMealPlan(id, data);
      try {
        await api.patch(`/api/meal-plans/${id}`, data);
      } catch (err) {
        handleError(err, 'Kunne ikke opdatere madplan');
      }
    },
    [store],
  );

  const deleteMealPlan = useCallback(
    async (id: string) => {
      store.deleteMealPlan(id);
      try {
        await api.delete(`/api/meal-plans/${id}`);
      } catch (err) {
        handleError(err, 'Kunne ikke slette madplan');
      }
    },
    [store],
  );

  // ── Messages ────────────────────────────────────────────

  const createThread = useCallback(
    async (data: { title: string; participants: string[]; childId?: string }) => {
      try {
        const raw = await api.post<ApiThread>('/api/messages/threads', data);
        const thread = mapThread(raw);
        store.addThread(thread);
        return thread;
      } catch (err) {
        handleError(err, 'Kunne ikke oprette samtale');
        return null;
      }
    },
    [store],
  );

  const sendMessage = useCallback(
    async (threadId: string, content: string) => {
      try {
        const raw = await api.post<ApiMessage>(`/api/messages/threads/${threadId}/messages`, { content });
        const message = mapMessage(raw);
        store.addMessage(message);
        return message;
      } catch (err) {
        handleError(err, 'Kunne ikke sende besked');
        return null;
      }
    },
    [store],
  );

  const deleteThread = useCallback(
    async (threadId: string, userId: string) => {
      store.deleteThread(threadId, userId);
      try {
        await api.delete(`/api/messages/threads/${threadId}`);
      } catch (err) {
        handleError(err, 'Kunne ikke slette samtale');
      }
    },
    [store],
  );

  // ── Children ────────────────────────────────────────────

  const createChild = useCallback(
    async (data: { name: string; birthDate: string; parent1Id: string; parent2Id?: string; householdId: string; allergies?: string[]; medications?: string[] }) => {
      try {
        const raw = await api.post<ApiChild>('/api/children', data);
        const child = mapChild(raw);
        store.addChild(child);
        return child;
      } catch (err) {
        handleError(err, 'Kunne ikke oprette barn');
        return null;
      }
    },
    [store],
  );

  const updateChild = useCallback(
    async (id: string, data: Partial<Child>) => {
      store.updateChild(id, data);
      try {
        await api.patch(`/api/children/${id}`, data);
      } catch (err) {
        handleError(err, 'Kunne ikke opdatere barn');
      }
    },
    [store],
  );

  const deleteChild = useCallback(
    async (id: string) => {
      store.removeChild(id);
      try {
        await api.delete(`/api/children/${id}`);
      } catch (err) {
        handleError(err, 'Kunne ikke slette barn');
      }
    },
    [store],
  );

  // ── Diary Entries ─────────────────────────────────────────

  const createDiaryEntry = useCallback(
    async (data: Omit<DiaryEntry, 'id' | 'createdAt' | 'writtenBy'>) => {
      try {
        const raw = await api.post<ApiDiaryEntry>('/api/diary', data);
        const entry = mapDiaryEntry(raw);
        store.addDiaryEntry(entry);
        return entry;
      } catch (err) {
        handleError(err, 'Kunne ikke oprette dagbogsindlæg');
        return null;
      }
    },
    [store],
  );

  const updateDiaryEntry = useCallback(
    async (id: string, data: Partial<DiaryEntry>) => {
      store.updateDiaryEntry(id, data);
      try {
        await api.patch(`/api/diary/${id}`, data);
      } catch (err) {
        handleError(err, 'Kunne ikke opdatere dagbogsindlæg');
      }
    },
    [store],
  );

  const deleteDiaryEntry = useCallback(
    async (id: string) => {
      store.deleteDiaryEntry(id);
      try {
        await api.delete(`/api/diary/${id}`);
      } catch (err) {
        handleError(err, 'Kunne ikke slette dagbogsindlæg');
      }
    },
    [store],
  );

  // ── Key Dates ───────────────────────────────────────────

  const createKeyDate = useCallback(
    async (data: Omit<KeyDate, 'id' | 'createdAt' | 'addedBy'>) => {
      try {
        const raw = await api.post<ApiKeyDate>('/api/key-dates', data);
        const keyDate = mapKeyDate(raw);
        store.addKeyDate(keyDate);
        return keyDate;
      } catch (err) {
        handleError(err, 'Kunne ikke oprette vigtig dato');
        return null;
      }
    },
    [store],
  );

  const updateKeyDate = useCallback(
    async (id: string, data: Partial<KeyDate>) => {
      store.updateKeyDate(id, data);
      try {
        await api.patch(`/api/key-dates/${id}`, data);
      } catch (err) {
        handleError(err, 'Kunne ikke opdatere vigtig dato');
      }
    },
    [store],
  );

  const deleteKeyDate = useCallback(
    async (id: string) => {
      store.deleteKeyDate(id);
      try {
        await api.delete(`/api/key-dates/${id}`);
      } catch (err) {
        handleError(err, 'Kunne ikke slette vigtig dato');
      }
    },
    [store],
  );

  // ── Decisions ───────────────────────────────────────────

  const createDecision = useCallback(
    async (data: Omit<DecisionLog, 'id' | 'createdAt' | 'proposedBy'>) => {
      try {
        const raw = await api.post<ApiDecisionLog>('/api/decisions', data);
        const decision = mapDecisionLog(raw);
        store.addDecision(decision);
        return decision;
      } catch (err) {
        handleError(err, 'Kunne ikke oprette beslutning');
        return null;
      }
    },
    [store],
  );

  const updateDecision = useCallback(
    async (id: string, data: Partial<DecisionLog>) => {
      store.updateDecision(id, data);
      try {
        await api.patch(`/api/decisions/${id}`, data);
      } catch (err) {
        handleError(err, 'Kunne ikke opdatere beslutning');
      }
    },
    [store],
  );

  const deleteDecision = useCallback(
    async (id: string) => {
      store.deleteDecision(id);
      try {
        await api.delete(`/api/decisions/${id}`);
      } catch (err) {
        handleError(err, 'Kunne ikke slette beslutning');
      }
    },
    [store],
  );

  // ── Milestones ──────────────────────────────────────────

  const createMilestone = useCallback(
    async (data: Omit<Milestone, 'id'>) => {
      try {
        const raw = await api.post<ApiMilestone>('/api/milestones', data);
        const milestone = mapMilestone(raw);
        store.addMilestone(milestone);
        return milestone;
      } catch (err) {
        handleError(err, 'Kunne ikke oprette milepæl');
        return null;
      }
    },
    [store],
  );

  return {
    // Events
    createEvent,
    updateEvent,
    deleteEvent,
    // Tasks
    createTask,
    updateTask,
    deleteTask,
    // Expenses
    createExpense,
    updateExpense,
    approveExpense,
    deleteExpense,
    // Documents
    createDocument,
    deleteDocument,
    // MealPlans
    createMealPlan,
    updateMealPlan,
    deleteMealPlan,
    // Messages
    createThread,
    sendMessage,
    deleteThread,
    // Children
    createChild,
    updateChild,
    deleteChild,
    // Diary
    createDiaryEntry,
    updateDiaryEntry,
    deleteDiaryEntry,
    // Key Dates
    createKeyDate,
    updateKeyDate,
    deleteKeyDate,
    // Decisions
    createDecision,
    updateDecision,
    deleteDecision,
    // Milestones
    createMilestone,
  };
}
