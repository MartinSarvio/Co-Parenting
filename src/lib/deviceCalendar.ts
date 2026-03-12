import { Capacitor, registerPlugin } from '@capacitor/core';

export interface DeviceCalendar {
  id: string;
  title: string;
  color: string;
  isWritable: boolean;
}

export interface DeviceCalendarEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  location?: string;
  notes?: string;
  calendarId: string;
}

// Plugin interface for @capacitor-community/calendar
interface CalendarPlugin {
  requestPermission(): Promise<{ result: string }>;
  listCalendars(): Promise<{ calendars: Array<{ id: string; title?: string; color?: string; allowsContentModifications?: boolean }> }>;
  getEventsFromCalendar(options: { calendarId: string; startDate: string; endDate: string }): Promise<{
    events: Array<{ id?: string; title?: string; startDate: string; endDate?: string; location?: string; notes?: string }>;
  }>;
}

// Lazy reference — only resolves if the native plugin is actually registered
let calendarPlugin: CalendarPlugin | null = null;

function getCalendarPlugin(): CalendarPlugin | null {
  if (calendarPlugin) return calendarPlugin;
  if (!Capacitor.isNativePlatform()) return null;
  try {
    if (Capacitor.isPluginAvailable('CapacitorCalendar')) {
      calendarPlugin = registerPlugin<CalendarPlugin>('CapacitorCalendar');
      return calendarPlugin;
    }
  } catch {
    // plugin not installed
  }
  return null;
}

/**
 * Check if the device calendar plugin is available.
 * Returns false on web or when the plugin is not installed.
 */
export function isDeviceCalendarAvailable(): boolean {
  return getCalendarPlugin() !== null;
}

/**
 * Request calendar access from the user.
 * Falls back to false if not on a native platform.
 */
export async function requestCalendarAccess(): Promise<boolean> {
  const plugin = getCalendarPlugin();
  if (!plugin) return false;

  try {
    const result = await plugin.requestPermission();
    return result.result === 'granted';
  } catch {
    return false;
  }
}

/**
 * List device calendars.
 * Returns empty array if not available.
 */
export async function listDeviceCalendars(): Promise<DeviceCalendar[]> {
  const plugin = getCalendarPlugin();
  if (!plugin) return [];

  try {
    const result = await plugin.listCalendars();
    return (result.calendars || []).map((cal) => ({
      id: cal.id,
      title: cal.title || 'Ukendt kalender',
      color: cal.color || '#8b8677',
      isWritable: cal.allowsContentModifications ?? false,
    }));
  } catch {
    return [];
  }
}

/**
 * Import events from a device calendar within a date range.
 * Deduplicates based on title + startDate.
 */
export async function importDeviceEvents(
  calendarId: string,
  start: Date,
  end: Date
): Promise<DeviceCalendarEvent[]> {
  const plugin = getCalendarPlugin();
  if (!plugin) return [];

  try {
    const result = await plugin.getEventsFromCalendar({
      calendarId,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    });

    const seen = new Set<string>();
    return (result.events || [])
      .map((evt) => ({
        id: evt.id || `${calendarId}-${evt.title}-${evt.startDate}`,
        title: evt.title || 'Uden titel',
        startDate: evt.startDate,
        endDate: evt.endDate || evt.startDate,
        location: evt.location,
        notes: evt.notes,
        calendarId,
      }))
      .filter((evt) => {
        const key = `${evt.title}|${evt.startDate}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  } catch {
    return [];
  }
}
