/**
 * useApiActions — hook der wrapper store-actions med Supabase-kald.
 *
 * Pattern: "Optimistic update" — opdater store først, sync til Supabase bagefter.
 */

import { useCallback } from 'react';
import { useAppStore } from '@/store';
import { supabase } from '@/lib/supabase';
import {
  mapTask,
  mapExpense,
  mapMealPlan,
  mapThread,
  mapMessage,
  mapChild,
  mapMilestone,
  mapShoppingItem,
  mapShoppingList,
  mapUserRecipe,
  mapProfessionalCase,
  mapRiskAssessment,
  mapCaseActivity,
} from '@/lib/mappers';
import type {
  DbTask,
  DbExpense,
  DbMealPlan,
  DbThread,
  DbMessage,
  DbChild,
  DbMilestone,
  DbShoppingItem,
  DbShoppingList,
  DbUserRecipe,
  DbProfessionalCase,
  DbRiskAssessment,
  DbCaseActivity,
} from '@/lib/mappers';
import type { CalendarEvent, Task, Expense, MealPlan, Child, DiaryEntry, KeyDate, DecisionLog, Milestone, ShoppingItem, ShoppingList, Recipe, ProfessionalCase, RiskAssessment, CaseActivity, BudgetGoal, WishItem, FamilyPhoto, NotificationPreferences } from '@/types';
import { shoppingItemId, shoppingListId, generateId, professionalCaseId, riskAssessmentId, caseActivityId, diaryEntryId, keyDateId, decisionId, milestoneId, documentId, eventId } from '@/lib/id';
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
      const userId = getCurrentUserId();
      if (!userId) { toast.error('Du skal være logget ind'); return null; }
      const event: CalendarEvent = {
        id: eventId(),
        title: data.title,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        type: data.type,
        childId: data.childId,
        createdBy: userId,
        assignedTo: data.assignedTo || [],
        location: data.location,
        isRecurring: data.isRecurring || false,
      };
      store.addEvent(event);
      try {
        const { error } = await supabase.from('calendar_events').insert({
          id: event.id,
          title: event.title,
          description: event.description || null,
          start_date: event.startDate,
          end_date: event.endDate,
          type: event.type,
          child_id: event.childId || null,
          created_by: userId,
          location: event.location || null,
          assigned_to: event.assignedTo || [],
          is_recurring: event.isRecurring || false,
        });
        if (error) throw error;
      } catch (err) {
        handleError(err, 'Kunne ikke gemme begivenhed');
      }
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

  const claimTask = useCallback(
    async (taskId: string, userId: string) => {
      // Optimistic client-side update only — claimed_by column added via migration later
      store.updateTask(taskId, { claimedBy: userId });
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
      const userId = getCurrentUserId();
      if (!userId) { toast.error('Du skal være logget ind'); return null; }
      const doc: import('@/types').Document = {
        id: documentId(),
        title: data.title,
        type: data.type as import('@/types').DocumentType,
        url: data.url,
        uploadedBy: userId,
        uploadedAt: new Date().toISOString(),
        sharedWith: data.sharedWith || [],
        isOfficial: data.isOfficial || false,
        validFrom: data.validFrom,
        validUntil: data.validUntil,
      };
      store.addDocument(doc);
      try {
        const { error } = await supabase.from('documents').insert({
          id: doc.id,
          title: doc.title,
          type: doc.type,
          url: doc.url,
          uploaded_by: userId,
          shared_with: doc.sharedWith,
          is_official: doc.isOfficial || false,
          valid_from: doc.validFrom || null,
          valid_until: doc.validUntil || null,
        });
        if (error) throw error;
      } catch (err) {
        handleError(err, 'Kunne ikke gemme dokument');
      }
      return doc;
    },
    [store],
  );

  const deleteDocument = useCallback(
    (id: string) => {
      // Optimistic: remove from store immediately
      store.hydrateFromServer({ documents: store.documents.filter(d => d.id !== id) });
      // Sync to Supabase in background
      supabase.from('documents').delete().eq('id', id).then(({ error }) => {
        if (error) {
          console.error('Supabase sync failed for document delete:', error);
          toast.error('Kunne ikke slette dokument fra serveren');
        }
      });
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

  // ── Professional Messaging ──────────────────────────────

  const sendProfessionalMessage = useCallback(
    async (caseId: string, messageContent: string) => {
      const theCase = store.professionalCases.find(c => c.id === caseId);
      if (!theCase) throw new Error('Sagen blev ikke fundet');

      // Find household member IDs via householdId
      let participantIds: string[] = [getCurrentUserId()];
      if (theCase.householdId) {
        const { data: members } = await supabase
          .from('household_members')
          .select('user_id')
          .eq('household_id', theCase.householdId);
        if (members && members.length > 0) {
          participantIds = [...new Set([...participantIds, ...members.map((m: { user_id: string }) => m.user_id)])];
        }
      }

      const threadTitle = `Besked fra sagsbehandler – Sag ${theCase.caseNumber}`;

      // Create the professional thread
      const { data: raw, error } = await supabase
        .from('message_threads')
        .insert({
          title: threadTitle,
          participants: participantIds,
          is_professional_thread: true,
        })
        .select('*, messages(id, content, sender_id, created_at, read_by)')
        .single();
      if (error) throw error;
      const thread = mapThread(raw as unknown as import('@/lib/mappers').DbThread);
      store.addThread(thread);

      // Send the message in the new thread
      const { data: msgRaw, error: msgErr } = await supabase
        .from('messages')
        .insert({
          content: messageContent,
          sender_id: getCurrentUserId(),
          thread_id: thread.id,
        })
        .select()
        .single();
      if (msgErr) throw msgErr;
      store.addMessage(mapMessage(msgRaw as unknown as import('@/lib/mappers').DbMessage));

      return thread;
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
      const userId = getCurrentUserId();
      if (!userId) { toast.error('Du skal være logget ind'); return null; }
      const entry: DiaryEntry = {
        id: diaryEntryId(),
        childId: data.childId,
        handoverId: data.handoverId,
        date: data.date,
        mood: data.mood,
        sleep: data.sleep,
        appetite: data.appetite,
        note: data.note,
        writtenBy: userId,
        createdAt: new Date().toISOString(),
      };
      store.addDiaryEntry(entry);
      try {
        const { error } = await supabase.from('diary_entries').insert({
          id: entry.id,
          child_id: entry.childId,
          date: entry.date,
          mood: entry.mood,
          sleep: entry.sleep,
          appetite: entry.appetite,
          note: entry.note || null,
          written_by: userId,
        });
        if (error) throw error;
      } catch (err) {
        handleError(err, 'Kunne ikke gemme dagbogsindlæg');
      }
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
      const userId = getCurrentUserId();
      if (!userId) { toast.error('Du skal være logget ind'); return null; }
      const kd: KeyDate = {
        id: keyDateId(),
        childId: data.childId,
        title: data.title,
        date: data.date,
        type: data.type,
        recurrence: data.recurrence || 'once',
        reminderDaysBefore: data.reminderDaysBefore ?? 7,
        notes: data.notes,
        addedBy: userId,
        createdAt: new Date().toISOString(),
      };
      store.addKeyDate(kd);
      try {
        const { error } = await supabase.from('key_dates').insert({
          id: kd.id,
          child_id: kd.childId || null,
          title: kd.title,
          date: kd.date,
          type: kd.type,
          recurrence: kd.recurrence,
          reminder_days_before: kd.reminderDaysBefore,
          notes: kd.notes || null,
          added_by: userId,
        });
        if (error) throw error;
      } catch (err) {
        handleError(err, 'Kunne ikke gemme vigtig dato');
      }
      return kd;
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
      const userId = getCurrentUserId();
      if (!userId) { toast.error('Du skal være logget ind'); return null; }
      const decision: DecisionLog = {
        id: decisionId(),
        childId: data.childId,
        title: data.title,
        description: data.description,
        category: data.category,
        decidedAt: data.decidedAt,
        proposedBy: userId,
        approvedBy: data.approvedBy || [],
        status: data.status || 'proposed',
        validFrom: data.validFrom,
        validUntil: data.validUntil,
        notes: data.notes,
        documentIds: data.documentIds,
        createdAt: new Date().toISOString(),
      };
      store.addDecision(decision);
      try {
        const { error } = await supabase.from('decision_logs').insert({
          id: decision.id,
          child_id: decision.childId || null,
          title: decision.title,
          description: decision.description,
          category: decision.category,
          decided_at: decision.decidedAt,
          proposed_by: userId,
          approved_by: decision.approvedBy,
          status: decision.status,
          valid_from: decision.validFrom || null,
          valid_until: decision.validUntil || null,
          notes: decision.notes || null,
          document_ids: decision.documentIds || null,
        });
        if (error) throw error;
      } catch (err) {
        handleError(err, 'Kunne ikke gemme beslutning');
      }
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
      const userId = getCurrentUserId();
      if (!userId) { toast.error('Du skal være logget ind'); return null; }
      const milestone: Milestone = {
        id: milestoneId(),
        childId: data.childId,
        title: data.title,
        description: data.description,
        date: data.date,
        category: data.category,
        addedBy: data.addedBy || userId,
        photos: data.photos || [],
      };
      store.addMilestone(milestone);
      try {
        const { error } = await supabase.from('milestones').insert({
          id: milestone.id,
          child_id: milestone.childId,
          title: milestone.title,
          description: milestone.description || null,
          date: milestone.date,
          category: milestone.category,
          added_by: milestone.addedBy,
          photos: milestone.photos || [],
        });
        if (error) throw error;
      } catch (err) {
        handleError(err, 'Kunne ikke gemme milepæl');
      }
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

  // ── Custody Plans ──────────────────────────────────────

  const createCustodyPlan = useCallback(
    async (plan: import('@/types').CustodyPlan) => {
      store.addCustodyPlan(plan);
      try {
        const { error } = await supabase.from('custody_plans').insert({
          id: plan.id,
          household_id: getHouseholdId(),
          child_id: plan.childId,
          name: plan.name,
          pattern: plan.pattern,
          start_date: plan.startDate,
          swap_day: plan.swapDay,
          swap_time: plan.swapTime,
          swap_location: plan.swapLocation || null,
          parent1_weeks: plan.parent1Weeks ?? null,
          parent2_weeks: plan.parent2Weeks ?? null,
          parent1_days: plan.parent1Days,
          parent2_days: plan.parent2Days,
          weekly_schedule: plan.weeklySchedule || null,
          custom_week_config: plan.customWeekConfig || null,
          custom_schedule: plan.customSchedule || null,
          supervised_config: plan.supervisedConfig || null,
          holidays: plan.holidays || null,
          special_days: plan.specialDays || null,
          created_by: getCurrentUserId(),
        });
        if (error) throw error;
      } catch (err) {
        handleError(err, 'Kunne ikke gemme samværsplan');
      }
      return plan;
    },
    [store],
  );

  const updateCustodyPlan = useCallback(
    async (id: string, data: Partial<import('@/types').CustodyPlan>) => {
      store.updateCustodyPlan(id, data);
      try {
        const updateData: Record<string, unknown> = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.pattern !== undefined) updateData.pattern = data.pattern;
        if (data.startDate !== undefined) updateData.start_date = data.startDate;
        if (data.swapDay !== undefined) updateData.swap_day = data.swapDay;
        if (data.swapTime !== undefined) updateData.swap_time = data.swapTime;
        if (data.swapLocation !== undefined) updateData.swap_location = data.swapLocation || null;
        if (data.parent1Days !== undefined) updateData.parent1_days = data.parent1Days;
        if (data.parent2Days !== undefined) updateData.parent2_days = data.parent2Days;
        if (data.weeklySchedule !== undefined) updateData.weekly_schedule = data.weeklySchedule;
        if (data.customWeekConfig !== undefined) updateData.custom_week_config = data.customWeekConfig;
        if (data.customSchedule !== undefined) updateData.custom_schedule = data.customSchedule;
        if (data.supervisedConfig !== undefined) updateData.supervised_config = data.supervisedConfig;
        if (data.holidays !== undefined) updateData.holidays = data.holidays;
        if (data.specialDays !== undefined) updateData.special_days = data.specialDays;
        const { error } = await supabase.from('custody_plans').update(updateData).eq('id', id);
        if (error) throw error;
      } catch (err) {
        handleError(err, 'Kunne ikke opdatere samværsplan');
      }
    },
    [store],
  );

  // ── Fridge Items ──────────────────────────────────────

  const createFridgeItem = useCallback(
    async (item: import('@/types').FridgeItem) => {
      store.addFridgeItem(item);
      try {
        const { error } = await supabase.from('fridge_items').insert({
          id: item.id,
          household_id: getHouseholdId(),
          name: item.name,
          barcode: item.barcode || null,
          added_at: item.addedAt,
          added_by: item.addedBy,
          expires_at: item.expiresAt || null,
          nutrition_per_100g: item.nutritionPer100g || null,
          allergens: item.allergens || null,
        });
        if (error) throw error;
      } catch (err) {
        handleError(err, 'Kunne ikke gemme køleskabsvare');
      }
      return item;
    },
    [store],
  );

  const deleteFridgeItem = useCallback(
    async (id: string) => {
      store.removeFridgeItem(id);
      try {
        const { error } = await supabase.from('fridge_items').delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
        handleError(err, 'Kunne ikke slette køleskabsvare');
      }
    },
    [store],
  );

  const updateFridgeItem = useCallback(
    async (id: string, data: Partial<import('@/types').FridgeItem>) => {
      store.updateFridgeItem(id, data);
      try {
        const updateData: Record<string, unknown> = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.barcode !== undefined) updateData.barcode = data.barcode || null;
        if (data.expiresAt !== undefined) updateData.expires_at = data.expiresAt || null;
        if (data.nutritionPer100g !== undefined) updateData.nutrition_per_100g = data.nutritionPer100g || null;
        if (data.allergens !== undefined) updateData.allergens = data.allergens || null;
        const { error } = await supabase.from('fridge_items').update(updateData).eq('id', id);
        if (error) throw error;
      } catch (err) {
        handleError(err, 'Kunne ikke opdatere køleskabsvare');
      }
    },
    [store],
  );

  const archiveFridgeItem = useCallback(
    async (id: string, reason: 'used' | 'thrown_away') => {
      store.archiveFridgeItem(id, reason);
      try {
        const { error } = await supabase.from('fridge_items').delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
        handleError(err, 'Kunne ikke arkivere køleskabsvare');
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

  // ── Routines ──────────────────────────────────────────────

  const createRoutineItem = useCallback(
    async (data: import('@/types').RoutineItem) => {
      store.addRoutineItem(data);
      try {
        const { error } = await supabase.from('routine_items').insert({
          id: data.id,
          child_id: data.childId,
          category: data.category,
          type: data.type,
          label: data.label,
          emoji: data.emoji,
          'order': data.order,
          meal_key: data.mealKey || null,
          is_active: data.isActive,
          created_by: data.createdBy,
        });
        if (error) throw error;
      } catch (err) {
        handleError(err, 'Kunne ikke gemme rutine');
      }
      return data;
    },
    [store],
  );

  const deleteRoutineItem = useCallback(
    (id: string) => {
      store.deleteRoutineItem(id);
      supabase.from('routine_items').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('Supabase sync failed for routine_items delete:', error);
      });
    },
    [store],
  );

  const createRoutineLog = useCallback(
    async (data: import('@/types').RoutineLog) => {
      store.addRoutineLog(data);
      try {
        const { error } = await supabase.from('routine_logs').insert({
          id: data.id,
          routine_item_id: data.routineItemId,
          child_id: data.childId,
          date: data.date,
          completed: data.completed,
          completed_at: data.completedAt || null,
          completed_by: data.completedBy || null,
          time: data.time || null,
          note: data.note || null,
          linked_food_log_id: data.linkedFoodLogId || null,
        });
        if (error) throw error;
      } catch (err) {
        handleError(err, 'Kunne ikke gemme rutine-log');
      }
      return data;
    },
    [store],
  );

  const updateRoutineLog = useCallback(
    (id: string, data: Partial<import('@/types').RoutineLog>) => {
      store.updateRoutineLog(id, data);
      const updateData: Record<string, unknown> = {};
      if (data.completed !== undefined) updateData.completed = data.completed;
      if (data.completedAt !== undefined) updateData.completed_at = data.completedAt;
      if (data.completedBy !== undefined) updateData.completed_by = data.completedBy;
      if (data.time !== undefined) updateData.time = data.time;
      if (data.note !== undefined) updateData.note = data.note || null;
      supabase.from('routine_logs').update(updateData).eq('id', id).then(({ error }) => {
        if (error) console.error('Supabase sync failed for routine_logs update:', error);
      });
    },
    [store],
  );

  // ── Budget Goals ─────────────────────────────────────────

  const saveBudgetGoals = useCallback(
    async (goals: BudgetGoal[]) => {
      const householdId = getHouseholdId();
      const userId = getCurrentUserId();
      if (!householdId || !userId) return;

      store.setBudgetGoals(goals);

      try {
        // Delete existing then insert fresh
        await supabase.from('budget_goals').delete().eq('household_id', householdId);
        if (goals.length > 0) {
          await supabase.from('budget_goals').insert(
            goals.map(g => ({
              id: `bg_${householdId}_${g.category}`,
              household_id: householdId,
              category: g.category,
              monthly_amount: g.monthlyAmount,
              created_by: userId,
            }))
          );
        }
      } catch (err) {
        console.error('Failed to sync budget goals:', err);
      }
    },
    [store],
  );

  // ── Wish Items ──────────────────────────────────────────

  const createWishItem = useCallback(
    async (data: Omit<WishItem, 'id' | 'createdAt'>) => {
      const householdId = getHouseholdId();
      if (!householdId) { toast.error('Ingen husstand'); return null; }
      const item: WishItem = { ...data, id: `wish_${Date.now()}`, createdAt: new Date().toISOString() };
      store.addWishItem(item);
      const { error } = await supabase.from('wish_items').insert({
        id: item.id, household_id: householdId, title: item.title,
        price_estimate: item.priceEstimate, link: item.link, image_url: item.imageUrl,
        description: item.description, child_id: item.childId, added_by: item.addedBy,
        status: item.status, bought_by: item.boughtBy, created_at: item.createdAt,
      });
      if (error) { console.error('Supabase wish_items insert failed:', error); toast.error('Kunne ikke gemme ønske'); }
      return item;
    },
    [store],
  );

  const updateWishItem = useCallback(
    async (id: string, updates: Partial<WishItem>) => {
      store.updateWishItem(id, updates);
      const dbUpdates: Record<string, unknown> = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.priceEstimate !== undefined) dbUpdates.price_estimate = updates.priceEstimate;
      if (updates.link !== undefined) dbUpdates.link = updates.link;
      if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.boughtBy !== undefined) dbUpdates.bought_by = updates.boughtBy;
      if (Object.keys(dbUpdates).length > 0) {
        supabase.from('wish_items').update(dbUpdates).eq('id', id).then(({ error }) => {
          if (error) console.error('Supabase wish_items update failed:', error);
        });
      }
    },
    [store],
  );

  const deleteWishItem = useCallback(
    async (id: string) => {
      store.deleteWishItem(id);
      supabase.from('wish_items').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('Supabase wish_items delete failed:', error);
      });
    },
    [store],
  );

  // ── Photos ──────────────────────────────────────────────

  const createPhoto = useCallback(
    async (data: Omit<FamilyPhoto, 'id' | 'addedAt'>) => {
      const householdId = getHouseholdId();
      if (!householdId) return null;
      const photo: FamilyPhoto = { ...data, id: `photo_${Date.now()}`, addedAt: new Date().toISOString() };
      store.addPhoto(photo);
      const { error } = await supabase.from('family_photos').insert({
        id: photo.id, household_id: householdId, child_id: photo.childId,
        url: photo.url, caption: photo.caption, taken_at: photo.takenAt,
        added_by: photo.addedBy, added_at: photo.addedAt,
      });
      if (error) { console.error('Supabase family_photos insert failed:', error); }
      return photo;
    },
    [store],
  );

  const deletePhoto = useCallback(
    async (id: string) => {
      store.deletePhoto(id);
      supabase.from('family_photos').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('Supabase family_photos delete failed:', error);
      });
    },
    [store],
  );

  // ── Notification Preferences ────────────────────────────

  const saveNotificationPreferences = useCallback(
    async (prefs: Partial<NotificationPreferences>) => {
      const userId = getCurrentUserId();
      if (!userId) return;
      store.updateNotificationPreferences(prefs);
      const fullPrefs = useAppStore.getState().notificationPreferences;
      supabase.from('notification_preferences').upsert({
        user_id: userId,
        handover_reminders: fullPrefs.handoverReminders,
        handover_reminder_minutes: fullPrefs.handoverReminderMinutes,
        schedule_changes: fullPrefs.scheduleChanges,
        event_reminders: fullPrefs.eventReminders,
        important_dates: fullPrefs.importantDates,
        task_assigned: fullPrefs.taskAssigned,
        task_deadline: fullPrefs.taskDeadline,
        expense_pending: fullPrefs.expensePending,
        expense_updates: fullPrefs.expenseUpdates,
        new_messages: fullPrefs.newMessages,
        professional_messages: fullPrefs.professionalMessages,
        meal_plan_reminder: fullPrefs.mealPlanReminder,
        shopping_reminder: fullPrefs.shoppingReminder,
        cleaning_reminder: fullPrefs.cleaningReminder,
        document_shared: fullPrefs.documentShared,
        decision_proposed: fullPrefs.decisionProposed,
        diary_reminder: fullPrefs.diaryReminder,
      }, { onConflict: 'user_id' }).then(({ error }) => {
        if (error) console.error('Supabase notification_preferences upsert failed:', error);
      });
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
    claimTask,
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
    sendProfessionalMessage,
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
    // Custody Plans
    createCustodyPlan,
    updateCustodyPlan,
    // Fridge Items
    createFridgeItem,
    deleteFridgeItem,
    updateFridgeItem,
    archiveFridgeItem,
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
    // Routines
    createRoutineItem,
    deleteRoutineItem,
    createRoutineLog,
    updateRoutineLog,
    // Budget Goals
    saveBudgetGoals,
    // Wish Items
    createWishItem,
    updateWishItem,
    deleteWishItem,
    // Photos
    createPhoto,
    deletePhoto,
    // Notification Preferences
    saveNotificationPreferences,
  };
}
