/**
 * Supabase Realtime — live-opdateringer af data.
 *
 * Lytter på INSERT/UPDATE/DELETE events og opdaterer Zustand store.
 * Kun de mest kritiske tabeller abonneres: messages, calendar_events, tasks, expenses.
 */

import { supabase } from './supabase';
import { useAppStore } from '@/store';
import {
  mapMessage,
  mapEvent,
  mapTask,
  mapExpense,
} from './mappers';
import type {
  DbMessage,
  DbCalendarEvent,
  DbTask,
  DbExpense,
} from './mappers';

let channel: ReturnType<typeof supabase.channel> | null = null;

/** Start realtime subscriptions for alle vigtige tabeller */
export function startRealtimeSync() {
  // Undgå dobbelt-subscription
  if (channel) return;

  const store = useAppStore.getState;

  channel = supabase
    .channel('app-realtime')

    // ── Nye beskeder ────────────────────────────────────────
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload) => {
        const currentUser = store().currentUser;
        if (!currentUser) return;
        // Ignorer egne beskeder (allerede optimistisk tilføjet)
        if ((payload.new as DbMessage).sender_id === currentUser.id) return;
        const message = mapMessage(payload.new as DbMessage);
        store().addMessage(message);
      },
    )

    // ── Kalender events ─────────────────────────────────────
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'calendar_events' },
      (payload) => {
        const currentUser = store().currentUser;
        if (!currentUser) return;
        if ((payload.new as DbCalendarEvent).created_by === currentUser.id) return;
        const event = mapEvent(payload.new as DbCalendarEvent);
        store().addEvent(event);
      },
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'calendar_events' },
      (payload) => {
        const event = mapEvent(payload.new as DbCalendarEvent);
        store().updateEvent(event.id, event);
      },
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'calendar_events' },
      (payload) => {
        const id = (payload.old as { id: string }).id;
        if (id) store().deleteEvent(id);
      },
    )

    // ── Opgaver ─────────────────────────────────────────────
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'tasks' },
      (payload) => {
        const currentUser = store().currentUser;
        if (!currentUser) return;
        if ((payload.new as DbTask).created_by === currentUser.id) return;
        const task = mapTask(payload.new as DbTask);
        store().addTask(task);
      },
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'tasks' },
      (payload) => {
        const task = mapTask(payload.new as DbTask);
        store().updateTask(task.id, task);
      },
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'tasks' },
      (payload) => {
        const id = (payload.old as { id: string }).id;
        if (id) store().deleteTask(id);
      },
    )

    // ── Udgifter ────────────────────────────────────────────
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'expenses' },
      (payload) => {
        const currentUser = store().currentUser;
        if (!currentUser) return;
        if ((payload.new as DbExpense).paid_by === currentUser.id) return;
        const expense = mapExpense(payload.new as DbExpense);
        store().addExpense(expense);
      },
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'expenses' },
      (payload) => {
        const expense = mapExpense(payload.new as DbExpense);
        store().updateExpense(expense.id, expense);
      },
    )

    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[Realtime] Subscribed to live updates');
      } else if (status === 'CHANNEL_ERROR') {
        console.warn('[Realtime] Channel error — retrying...');
      }
    });
}

/** Stop realtime subscriptions */
export function stopRealtimeSync() {
  if (channel) {
    supabase.removeChannel(channel);
    channel = null;
  }
}
