/**
 * useApiActions — hook der wrapper store-actions med Supabase-kald.
 *
 * Pattern: "Optimistic update" — opdater store først, sync til Supabase bagefter.
 */

import { useCallback } from 'react';
import { useAppStore } from '@/store';
import { supabase } from '@/lib/supabase';
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
  mapShoppingItem,
  mapShoppingList,
  mapUserRecipe,
  mapProfessionalCase,
  mapRiskAssessment,
  mapCaseActivity,
} from '@/lib/mappers';
import type {
  DbCalendarEvent,
  DbTask,
  DbExpense,
  DbDocument,
  DbMealPlan,
  DbThread,
  DbMessage,
  DbChild,
  DbDiaryEntry,
  DbKeyDate,
  DbDecisionLog,
  DbMilestone,
  DbShoppingItem,
  DbShoppingList,
  DbUserRecipe,
  DbProfessionalCase,
  DbRiskAssessment,
  DbCaseActivity,
} from '@/lib/mappers';
import type { CalendarEvent, Task, Expense, MealPlan, Child, DiaryEntry, KeyDate, DecisionLog, Milestone, ShoppingItem, ShoppingList, Recipe, ProfessionalCase, RiskAssessment, CaseActivity } from '@/types';
import { shoppingItemId, shoppingListId, generateId, professionalCaseId, riskAssessmentId, caseActivityId } from '@/lib/id';
import { toast } from 'sonner';

function handleError(err: unknown, fallbackMsg: string) {
  console.error(fallbackMsg, err);
  const message = err instanceof Error ? err.message : fallbackMsg;
  toast.error(message);
}

function getCurrentUserId(): string {
  return useAppStore.getState().currentUser?.id || '';
}

function getHouseholdId(): string {
  return useAppStore.getState().household?.id || '';
}

export function useApiActions() {
  const store = useAppStore();

  // ── Events ──────────────────────────────────────────────

  const createEvent = useCallback(
    async (data: Omit<CalendarEvent, 'id'>) => {
      const { data: raw, error } = await supabase
        .from('calendar_events')
        .insert({
          title: data.title,
          description: data.description || null,
          start_date: data.startDate,
          end_date: data.endDate,
          type: data.type,
          child_id: data.childId || null,
          created_by: getCurrentUserId(),
          location: data.location || null,
          assigned_to: data.assignedTo || [],
          is_recurring: data.isRecurring || false,
        })
        .select()
        .single();
      if (error) throw error;
      const event = mapEvent(raw as DbCalendarEvent);
      store.addEvent(event);
      return event;
    },
    [store],
  );

  const updateEvent = useCallback(
    async (id: string, data: Partial<CalendarEvent>) => {
      store.updateEvent(id, data);
      try {
        const updateData: Record<string, unknown> = {};
        if (data.title !== undefined) updateData.title = data.title;
        if (data.description !== undefined) updateData.description = data.description || null;
        if (data.startDate !== undefined) updateData.start_date = data.startDate;
        if (data.endDate !== undefined) updateData.end_date = data.endDate;
        if (data.type !== undefined) updateData.type = data.type;
        if (data.childId !== undefined) updateData.child_id = data.childId || null;
        if (data.location !== undefined) updateData.location = data.location || null;
        if (data.assignedTo !== undefined) updateData.assigned_to = data.assignedTo;
        if (data.isRecurring !== undefined) updateData.is_recurring = data.isRecurring;

        const { error } = await supabase.from('calendar_events').update(updateData).eq('id', id);
        if (error) throw error;
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
        const { error } = await supabase.from('calendar_events').delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
        handleError(err, 'Kunne ikke slette begivenhed');
      }
    },
    [store],
  );

  // ── Tasks ───────────────────────────────────────────────

  const createTask = useCallback(
    async (data: Omit<Task, 'id'>) => {
      const { data: raw, error } = await supabase
        .from('tasks')
        .insert({
          title: data.title,
          description: data.description || null,
          assigned_to: data.assignedTo,
          created_by: getCurrentUserId(),
          deadline: data.deadline || null,
          category: data.category || 'general',
          is_recurring: data.isRecurring || false,
          planned_weekday: data.plannedWeekday ?? null,
          area: data.area || null,
        })
        .select()
        .single();
      if (error) throw error;
      const task = mapTask(raw as DbTask);
      store.addTask(task);
      return task;
    },
    [store],
  );

  const updateTask = useCallback(
    async (id: string, data: Partial<Task>) => {
      store.updateTask(id, data);
      try {
        const updateData: Record<string, unknown> = {};
        if (data.title !== undefined) updateData.title = data.title;
        if (data.description !== undefined) updateData.description = data.description || null;
        if (data.assignedTo !== undefined) updateData.assigned_to = data.assignedTo;
        if (data.deadline !== undefined) updateData.deadline = data.deadline || null;
        if (data.completed !== undefined) {
          updateData.completed = data.completed;
          updateData.completed_at = data.completed ? new Date().toISOString() : null;
        }
        if (data.category !== undefined) updateData.category = data.category;
        if (data.isRecurring !== undefined) updateData.is_recurring = data.isRecurring;
        if (data.plannedWeekday !== undefined) updateData.planned_weekday = data.plannedWeekday;
        if (data.area !== undefined) updateData.area = data.area;

        const { error } = await supabase.from('tasks').update(updateData).eq('id', id);
        if (error) throw error;
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
        const { error } = await supabase.from('tasks').delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
        handleError(err, 'Kunne ikke slette opgave');
      }
    },
    [store],
  );

  // ── Expenses ────────────────────────────────────────────

  const createExpense = useCallback(
    async (data: Omit<Expense, 'id' | 'createdAt'>) => {
      const { data: raw, error } = await supabase
        .from('expenses')
        .insert({
          title: data.title,
          description: data.description || null,
          amount: data.amount,
          currency: data.currency || 'DKK',
          category: data.category,
          paid_by: getCurrentUserId(),
          split_with: data.splitWith || [],
          split_amounts: data.splitAmounts || {},
          split_type: data.splitType || 'equal',
          date: data.date,
          receipt_url: data.receiptUrl || null,
          is_recurring: data.isRecurring || false,
        })
        .select()
        .single();
      if (error) throw error;
      const expense = mapExpense(raw as DbExpense);
      store.addExpense(expense);
      return expense;
    },
    [store],
  );

  const updateExpense = useCallback(
    async (id: string, data: Partial<Expense>) => {
      store.updateExpense(id, data);
      try {
        const updateData: Record<string, unknown> = {};
        if (data.title !== undefined) updateData.title = data.title;
        if (data.description !== undefined) updateData.description = data.description || null;
        if (data.amount !== undefined) updateData.amount = data.amount;
        if (data.category !== undefined) updateData.category = data.category;
        if (data.date !== undefined) updateData.date = data.date;
        if (data.status !== undefined) updateData.status = data.status;

        const { error } = await supabase.from('expenses').update(updateData).eq('id', id);
        if (error) throw error;
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
        // Én atomisk RPC-lignende update via Supabase — undgår N+1
        const { error } = await supabase.rpc('approve_expense', {
          expense_id: id,
          approver_id: userId,
        });
        // Fallback: Hvis RPC-funktionen ikke findes endnu, kør legacy
        if (error && error.message?.includes('function')) {
          const { data: current, error: fetchErr } = await supabase
            .from('expenses')
            .select('approved_by, split_with')
            .eq('id', id)
            .single();
          if (fetchErr) throw fetchErr;

          const updatedApproved = [...(current.approved_by || []), userId];
          const allApproved = (current.split_with || []).every(
            (uid: string) => updatedApproved.includes(uid)
          );

          const { error: updateErr } = await supabase
            .from('expenses')
            .update({
              approved_by: updatedApproved,
              status: allApproved ? 'approved' : undefined,
            })
            .eq('id', id);
          if (updateErr) throw updateErr;
        } else if (error) {
          throw error;
        }
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
        const { error } = await supabase.from('expenses').delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
        handleError(err, 'Kunne ikke slette udgift');
      }
    },
    [store],
  );

  // ── Documents ───────────────────────────────────────────

  const createDocument = useCallback(
    async (data: { title: string; type: string; url: string; sharedWith?: string[]; isOfficial?: boolean; validFrom?: string; validUntil?: string }) => {
      const { data: raw, error } = await supabase
        .from('documents')
        .insert({
          title: data.title,
          type: data.type,
          url: data.url,
          uploaded_by: getCurrentUserId(),
          shared_with: data.sharedWith || [],
          is_official: data.isOfficial || false,
          valid_from: data.validFrom || null,
          valid_until: data.validUntil || null,
        })
        .select()
        .single();
      if (error) throw error;
      const doc = mapDocument(raw as DbDocument);
      store.addDocument(doc);
      return doc;
    },
    [store],
  );

  const deleteDocument = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase.from('documents').delete().eq('id', id);
        if (error) throw error;
        // Reload documents
        const { data: raw } = await supabase.from('documents').select('*');
        if (raw) {
          store.hydrateFromServer({ documents: (raw as DbDocument[]).map(mapDocument) });
        }
      } catch (err) {
        handleError(err, 'Kunne ikke slette dokument');
      }
    },
    [store],
  );

  // ── MealPlans ───────────────────────────────────────────

  const createMealPlan = useCallback(
    async (data: Omit<MealPlan, 'id' | 'createdAt' | 'createdBy'>) => {
      const { data: raw, error } = await supabase
        .from('meal_plans')
        .insert({
          date: data.date,
          meal_type: data.mealType,
          title: data.title,
          notes: data.notes || null,
          created_by: getCurrentUserId(),
          recipe: data.recipe || null,
        })
        .select()
        .single();
      if (error) throw error;
      const meal = mapMealPlan(raw as DbMealPlan);
      store.addMealPlan(meal);
      return meal;
    },
    [store],
  );

  const updateMealPlan = useCallback(
    async (id: string, data: Partial<MealPlan>) => {
      store.updateMealPlan(id, data);
      try {
        const updateData: Record<string, unknown> = {};
        if (data.date !== undefined) updateData.date = data.date;
        if (data.mealType !== undefined) updateData.meal_type = data.mealType;
        if (data.title !== undefined) updateData.title = data.title;
        if (data.notes !== undefined) updateData.notes = data.notes || null;
        if (data.recipe !== undefined) updateData.recipe = data.recipe;

        const { error } = await supabase.from('meal_plans').update(updateData).eq('id', id);
        if (error) throw error;
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
        const { error } = await supabase.from('meal_plans').delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
        handleError(err, 'Kunne ikke slette madplan');
      }
    },
    [store],
  );

  // ── Messages ────────────────────────────────────────────

  const createThread = useCallback(
    async (data: { title: string; participants: string[]; childId?: string }) => {
      const { data: raw, error } = await supabase
        .from('message_threads')
        .insert({
          title: data.title,
          participants: data.participants,
          child_id: data.childId || null,
        })
        .select('*, messages(id, content, sender_id, created_at, read_by)')
        .single();
      if (error) throw error;
      const thread = mapThread(raw as unknown as DbThread);
      store.addThread(thread);
      return thread;
    },
    [store],
  );

  const sendMessage = useCallback(
    async (threadId: string, content: string) => {
      const { data: raw, error } = await supabase
        .from('messages')
        .insert({
          content,
          sender_id: getCurrentUserId(),
          thread_id: threadId,
        })
        .select()
        .single();
      if (error) throw error;
      const message = mapMessage(raw as DbMessage);
      store.addMessage(message);
      return message;
    },
    [store],
  );

  const deleteThread = useCallback(
    async (threadId: string, userId: string) => {
      store.deleteThread(threadId, userId);
      try {
        // Soft delete med én query via Supabase array_append
        const { error } = await supabase.rpc('soft_delete_thread', {
          thread_id: threadId,
          deleter_id: userId,
        });
        // Fallback: Hvis RPC-funktionen ikke findes endnu, kør legacy
        if (error && error.message?.includes('function')) {
          const { data: current, error: fetchErr } = await supabase
            .from('message_threads')
            .select('deleted_by')
            .eq('id', threadId)
            .single();
          if (fetchErr) throw fetchErr;

          const { error: updateErr } = await supabase
            .from('message_threads')
            .update({ deleted_by: [...(current.deleted_by || []), userId] })
            .eq('id', threadId);
          if (updateErr) throw updateErr;
        } else if (error) {
          throw error;
        }
      } catch (err) {
        handleError(err, 'Kunne ikke slette samtale');
      }
    },
    [store],
  );

  // ── Children ────────────────────────────────────────────

  const createChild = useCallback(
    async (data: { name: string; birthDate: string; parent1Id: string; parent2Id?: string; householdId: string; allergies?: string[]; medications?: string[]; avatar?: string }) => {
      const { data: raw, error } = await supabase
        .from('children')
        .insert({
          name: data.name,
          birth_date: data.birthDate,
          parent1_id: data.parent1Id,
          parent2_id: data.parent2Id || data.parent1Id,
          household_id: data.householdId,
          allergies: data.allergies || [],
          medications: data.medications || [],
          ...(data.avatar ? { avatar: data.avatar } : {}),
        })
        .select()
        .single();
      if (error) throw error;
      const child = mapChild(raw as DbChild);
      store.addChild(child);
      return child;
    },
    [store],
  );

  const updateChild = useCallback(
    async (id: string, data: Partial<Child>) => {
      store.updateChild(id, data);
      try {
        const updateData: Record<string, unknown> = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.birthDate !== undefined) updateData.birth_date = data.birthDate;
        if (data.avatar !== undefined) updateData.avatar = data.avatar || null;
        if (data.allergies !== undefined) updateData.allergies = data.allergies;
        if (data.medications !== undefined) updateData.medications = data.medications;
        if (data.institutionName !== undefined) updateData.institution_name = data.institutionName || null;
        if (data.institutionType !== undefined) updateData.institution_type = data.institutionType || null;

        const { error } = await supabase.from('children').update(updateData).eq('id', id);
        if (error) throw error;
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
        const { error } = await supabase.from('children').delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
        handleError(err, 'Kunne ikke slette barn');
      }
    },
    [store],
  );

  // ── Diary Entries ─────────────────────────────────────────

  const createDiaryEntry = useCallback(
    async (data: Omit<DiaryEntry, 'id' | 'createdAt' | 'writtenBy'>) => {
      const { data: raw, error } = await supabase
        .from('diary_entries')
        .insert({
          child_id: data.childId,
          date: data.date,
          mood: data.mood,
          sleep: data.sleep,
          appetite: data.appetite,
          note: data.note || null,
          written_by: getCurrentUserId(),
        })
        .select()
        .single();
      if (error) throw error;
      const entry = mapDiaryEntry(raw as DbDiaryEntry);
      store.addDiaryEntry(entry);
      return entry;
    },
    [store],
  );

  const updateDiaryEntry = useCallback(
    async (id: string, data: Partial<DiaryEntry>) => {
      store.updateDiaryEntry(id, data);
      try {
        const updateData: Record<string, unknown> = {};
        if (data.mood !== undefined) updateData.mood = data.mood;
        if (data.sleep !== undefined) updateData.sleep = data.sleep;
        if (data.appetite !== undefined) updateData.appetite = data.appetite;
        if (data.note !== undefined) updateData.note = data.note || null;
        if (data.date !== undefined) updateData.date = data.date;

        const { error } = await supabase.from('diary_entries').update(updateData).eq('id', id);
        if (error) throw error;
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
        const { error } = await supabase.from('diary_entries').delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
        handleError(err, 'Kunne ikke slette dagbogsindlæg');
      }
    },
    [store],
  );

  // ── Key Dates ───────────────────────────────────────────

  const createKeyDate = useCallback(
    async (data: Omit<KeyDate, 'id' | 'createdAt' | 'addedBy'>) => {
      const { data: raw, error } = await supabase
        .from('key_dates')
        .insert({
          child_id: data.childId || null,
          title: data.title,
          date: data.date,
          type: data.type,
          recurrence: data.recurrence || 'once',
          reminder_days_before: data.reminderDaysBefore ?? 7,
          notes: data.notes || null,
          added_by: getCurrentUserId(),
        })
        .select()
        .single();
      if (error) throw error;
      const keyDate = mapKeyDate(raw as DbKeyDate);
      store.addKeyDate(keyDate);
      return keyDate;
    },
    [store],
  );

  const updateKeyDate = useCallback(
    async (id: string, data: Partial<KeyDate>) => {
      store.updateKeyDate(id, data);
      try {
        const updateData: Record<string, unknown> = {};
        if (data.title !== undefined) updateData.title = data.title;
        if (data.date !== undefined) updateData.date = data.date;
        if (data.type !== undefined) updateData.type = data.type;
        if (data.recurrence !== undefined) updateData.recurrence = data.recurrence;
        if (data.reminderDaysBefore !== undefined) updateData.reminder_days_before = data.reminderDaysBefore;
        if (data.notes !== undefined) updateData.notes = data.notes || null;

        const { error } = await supabase.from('key_dates').update(updateData).eq('id', id);
        if (error) throw error;
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
        const { error } = await supabase.from('key_dates').delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
        handleError(err, 'Kunne ikke slette vigtig dato');
      }
    },
    [store],
  );

  // ── Decisions ───────────────────────────────────────────

  const createDecision = useCallback(
    async (data: Omit<DecisionLog, 'id' | 'createdAt' | 'proposedBy'>) => {
      const { data: raw, error } = await supabase
        .from('decision_logs')
        .insert({
          child_id: data.childId || null,
          title: data.title,
          description: data.description,
          category: data.category,
          decided_at: data.decidedAt,
          proposed_by: getCurrentUserId(),
          status: data.status || 'proposed',
          notes: data.notes || null,
          document_ids: data.documentIds || null,
        })
        .select()
        .single();
      if (error) throw error;
      const decision = mapDecisionLog(raw as DbDecisionLog);
      store.addDecision(decision);
      return decision;
    },
    [store],
  );

  const updateDecision = useCallback(
    async (id: string, data: Partial<DecisionLog>) => {
      store.updateDecision(id, data);
      try {
        const updateData: Record<string, unknown> = {};
        if (data.title !== undefined) updateData.title = data.title;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.category !== undefined) updateData.category = data.category;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.notes !== undefined) updateData.notes = data.notes || null;

        const { error } = await supabase.from('decision_logs').update(updateData).eq('id', id);
        if (error) throw error;
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
        const { error } = await supabase.from('decision_logs').delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
        handleError(err, 'Kunne ikke slette beslutning');
      }
    },
    [store],
  );

  // ── Milestones ──────────────────────────────────────────

  const createMilestone = useCallback(
    async (data: Omit<Milestone, 'id'>) => {
      const { data: raw, error } = await supabase
        .from('milestones')
        .insert({
          child_id: data.childId,
          title: data.title,
          description: data.description || null,
          date: data.date,
          category: data.category,
          added_by: data.addedBy || getCurrentUserId(),
          photos: data.photos || [],
        })
        .select()
        .single();
      if (error) throw error;
      const milestone = mapMilestone(raw as DbMilestone);
      store.addMilestone(milestone);
      return milestone;
    },
    [store],
  );

  const updateMilestone = useCallback(
    async (id: string, data: Partial<Milestone>) => {
      try {
        const updateData: Record<string, unknown> = {};
        if (data.title !== undefined) updateData.title = data.title;
        if (data.description !== undefined) updateData.description = data.description || null;
        if (data.date !== undefined) updateData.date = data.date;
        if (data.category !== undefined) updateData.category = data.category;

        const { data: raw, error } = await supabase
          .from('milestones')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        const milestone = mapMilestone(raw as DbMilestone);
        store.updateMilestone(id, milestone);
        return milestone;
      } catch (err) {
        handleError(err, 'Kunne ikke opdatere milepæl');
        return null;
      }
    },
    [store],
  );

  const deleteMilestone = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase
          .from('milestones')
          .delete()
          .eq('id', id);
        if (error) throw error;
        store.deleteMilestone(id);
        return true;
      } catch (err) {
        handleError(err, 'Kunne ikke slette milepæl');
        return false;
      }
    },
    [store],
  );

  // ── Shopping Items ─────────────────────────────────────

  const createShoppingItem = useCallback(
    async (data: Omit<ShoppingItem, 'id'>) => {
      const id = shoppingItemId();
      const { data: raw, error } = await supabase
        .from('shopping_items')
        .insert({
          id,
          household_id: getHouseholdId(),
          list_id: data.listId || null,
          name: data.name,
          quantity: data.quantity || null,
          category: data.category || null,
          purchased: data.purchased || false,
          added_by: getCurrentUserId(),
        })
        .select()
        .single();
      if (error) throw error;
      const item = mapShoppingItem(raw as DbShoppingItem);
      store.addShoppingItem(item);
      return item;
    },
    [store],
  );

  const updateShoppingItem = useCallback(
    async (id: string, data: Partial<ShoppingItem>) => {
      store.updateShoppingItem(id, data);
      try {
        const updateData: Record<string, unknown> = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.quantity !== undefined) updateData.quantity = data.quantity || null;
        if (data.category !== undefined) updateData.category = data.category || null;
        if (data.purchased !== undefined) updateData.purchased = data.purchased;
        if (data.listId !== undefined) updateData.list_id = data.listId || null;

        const { error } = await supabase.from('shopping_items').update(updateData).eq('id', id);
        if (error) throw error;
      } catch (err) {
        handleError(err, 'Kunne ikke opdatere indkøbsvare');
      }
    },
    [store],
  );

  const deleteShoppingItem = useCallback(
    async (id: string) => {
      store.deleteShoppingItem(id);
      try {
        const { error } = await supabase.from('shopping_items').delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
        handleError(err, 'Kunne ikke slette indkøbsvare');
      }
    },
    [store],
  );

  // ── Shopping Lists ─────────────────────────────────────

  const createShoppingList = useCallback(
    async (data: Omit<ShoppingList, 'id' | 'createdAt' | 'createdBy'>) => {
      const id = shoppingListId();
      const { data: raw, error } = await supabase
        .from('shopping_lists')
        .insert({
          id,
          household_id: getHouseholdId(),
          name: data.name,
          created_by: getCurrentUserId(),
        })
        .select()
        .single();
      if (error) throw error;
      const list = mapShoppingList(raw as DbShoppingList);
      store.addShoppingList(list);
      return list;
    },
    [store],
  );

  const deleteShoppingList = useCallback(
    async (id: string) => {
      store.removeShoppingList(id);
      try {
        const { error } = await supabase.from('shopping_items').delete().eq('list_id', id);
        if (error) throw error;
        const { error: listErr } = await supabase.from('shopping_lists').delete().eq('id', id);
        if (listErr) throw listErr;
      } catch (err) {
        handleError(err, 'Kunne ikke slette indkøbsliste');
      }
    },
    [store],
  );

  // ── User Recipes ──────────────────────────────────────

  const createUserRecipe = useCallback(
    async (data: Partial<Recipe> & { name: string }) => {
      const id = generateId('recipe');
      const { data: raw, error } = await supabase
        .from('user_recipes')
        .insert({
          id,
          household_id: getHouseholdId(),
          name: data.name,
          ingredients: data.ingredients || [],
          instructions: data.steps?.map(s => s.description).join('\n') || '',
          image_url: null,
          category: data.category || null,
          shared_with_family: data.isShared || false,
          created_by: getCurrentUserId(),
        })
        .select()
        .single();
      if (error) throw error;
      const recipe = mapUserRecipe(raw as DbUserRecipe);
      store.addUserRecipe(recipe);
      return recipe;
    },
    [store],
  );

  const updateUserRecipe = useCallback(
    async (id: string, data: Partial<Recipe>) => {
      store.addUserRecipe({ ...store.userRecipes.find(r => r.id === id)!, ...data });
      try {
        const updateData: Record<string, unknown> = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.ingredients !== undefined) updateData.ingredients = data.ingredients;
        if (data.category !== undefined) updateData.category = data.category;
        if (data.isShared !== undefined) updateData.shared_with_family = data.isShared;

        const { error } = await supabase.from('user_recipes').update(updateData).eq('id', id);
        if (error) throw error;
      } catch (err) {
        handleError(err, 'Kunne ikke opdatere opskrift');
      }
    },
    [store],
  );

  const deleteUserRecipe = useCallback(
    async (id: string) => {
      store.removeUserRecipe(id);
      try {
        const { error } = await supabase.from('user_recipes').delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
        handleError(err, 'Kunne ikke slette opskrift');
      }
    },
    [store],
  );

  // ── Professional Cases ─────────────────────────────────

  const createProfessionalCase = useCallback(
    async (data: Omit<ProfessionalCase, 'id' | 'createdAt' | 'updatedAt'>) => {
      const id = professionalCaseId();
      const { data: raw, error } = await supabase
        .from('professional_cases')
        .insert({
          id,
          case_number: data.caseNumber,
          department_id: data.departmentId,
          municipality: data.municipality,
          family_name: data.familyName,
          parents: data.parents,
          child_name: data.childName,
          child_age: data.childAge,
          status: data.status || 'active',
          priority: data.priority || 'normal',
          risk_level: data.riskLevel || 'low',
          last_contact: data.lastContact || null,
          next_meeting: data.nextMeeting || null,
          unread_messages: data.unreadMessages || 0,
          pending_approvals: data.pendingApprovals || 0,
          notes: data.notes || '',
          assigned_to: getCurrentUserId(),
          household_id: data.householdId || null,
        })
        .select()
        .single();
      if (error) throw error;
      const c = mapProfessionalCase(raw as DbProfessionalCase);
      store.addProfessionalCase(c);
      return c;
    },
    [store],
  );

  const updateProfessionalCase = useCallback(
    async (id: string, data: Partial<ProfessionalCase>) => {
      store.updateProfessionalCase(id, data);
      try {
        const updateData: Record<string, unknown> = {};
        if (data.caseNumber !== undefined) updateData.case_number = data.caseNumber;
        if (data.departmentId !== undefined) updateData.department_id = data.departmentId;
        if (data.municipality !== undefined) updateData.municipality = data.municipality;
        if (data.familyName !== undefined) updateData.family_name = data.familyName;
        if (data.parents !== undefined) updateData.parents = data.parents;
        if (data.childName !== undefined) updateData.child_name = data.childName;
        if (data.childAge !== undefined) updateData.child_age = data.childAge;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.priority !== undefined) updateData.priority = data.priority;
        if (data.riskLevel !== undefined) updateData.risk_level = data.riskLevel;
        if (data.lastContact !== undefined) updateData.last_contact = data.lastContact || null;
        if (data.nextMeeting !== undefined) updateData.next_meeting = data.nextMeeting || null;
        if (data.unreadMessages !== undefined) updateData.unread_messages = data.unreadMessages;
        if (data.pendingApprovals !== undefined) updateData.pending_approvals = data.pendingApprovals;
        if (data.notes !== undefined) updateData.notes = data.notes;
        updateData.updated_at = new Date().toISOString();

        const { error } = await supabase.from('professional_cases').update(updateData).eq('id', id);
        if (error) throw error;
      } catch (err) {
        handleError(err, 'Kunne ikke opdatere sag');
      }
    },
    [store],
  );

  const deleteProfessionalCase = useCallback(
    async (id: string) => {
      store.deleteProfessionalCase(id);
      try {
        const { error } = await supabase.from('professional_cases').delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
        handleError(err, 'Kunne ikke slette sag');
      }
    },
    [store],
  );

  // ── Risk Assessments ─────────────────────────────────

  const createRiskAssessment = useCallback(
    async (data: Omit<RiskAssessment, 'id' | 'createdAt' | 'updatedAt'>) => {
      const id = riskAssessmentId();
      const { data: raw, error } = await supabase
        .from('risk_assessments')
        .insert({
          id,
          case_id: data.caseId,
          assessor_id: getCurrentUserId(),
          assessment_date: data.assessmentDate,
          risk_level: data.riskLevel,
          risk_factors: data.riskFactors || [],
          protective_factors: data.protectiveFactors || '',
          summary: data.summary || '',
          recommendations: data.recommendations || '',
          status: data.status || 'draft',
          sent_to: data.sentTo || [],
        })
        .select()
        .single();
      if (error) throw error;
      const assessment = mapRiskAssessment(raw as DbRiskAssessment);
      store.addRiskAssessment(assessment);
      return assessment;
    },
    [store],
  );

  const updateRiskAssessment = useCallback(
    async (id: string, data: Partial<RiskAssessment>) => {
      store.updateRiskAssessment(id, data);
      try {
        const updateData: Record<string, unknown> = {};
        if (data.riskLevel !== undefined) updateData.risk_level = data.riskLevel;
        if (data.riskFactors !== undefined) updateData.risk_factors = data.riskFactors;
        if (data.protectiveFactors !== undefined) updateData.protective_factors = data.protectiveFactors;
        if (data.summary !== undefined) updateData.summary = data.summary;
        if (data.recommendations !== undefined) updateData.recommendations = data.recommendations;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.sentTo !== undefined) updateData.sent_to = data.sentTo;
        updateData.updated_at = new Date().toISOString();

        const { error } = await supabase.from('risk_assessments').update(updateData).eq('id', id);
        if (error) throw error;
      } catch (err) {
        handleError(err, 'Kunne ikke opdatere risikovurdering');
      }
    },
    [store],
  );

  // ── Case Activities ──────────────────────────────────

  const createCaseActivity = useCallback(
    async (data: Omit<CaseActivity, 'id' | 'createdAt'>) => {
      const id = caseActivityId();
      const { data: raw, error } = await supabase
        .from('case_activity_log')
        .insert({
          id,
          case_id: data.caseId,
          type: data.type,
          title: data.title,
          description: data.description || '',
          related_id: data.relatedId || null,
          related_type: data.relatedType || null,
          created_by: getCurrentUserId(),
        })
        .select()
        .single();
      if (error) throw error;
      const activity = mapCaseActivity(raw as DbCaseActivity);
      store.addCaseActivity(activity);
      return activity;
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
    updateMilestone,
    deleteMilestone,
    // Shopping Items
    createShoppingItem,
    updateShoppingItem,
    deleteShoppingItem,
    // Shopping Lists
    createShoppingList,
    deleteShoppingList,
    // User Recipes
    createUserRecipe,
    updateUserRecipe,
    deleteUserRecipe,
    // Professional Cases
    createProfessionalCase,
    updateProfessionalCase,
    deleteProfessionalCase,
    // Risk Assessments
    createRiskAssessment,
    updateRiskAssessment,
    // Case Activities
    createCaseActivity,
  };
}
