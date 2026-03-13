import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore } from '@/store';
import { useApiActions } from '@/hooks/useApiActions';
import { calendarSourceId, templateId } from '@/lib/id';
import { cn, formatTime, getEventTypeLabel } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';
import { ShareCalendarFlow } from '@/components/custom/ShareCalendarFlow';
import { isDeviceCalendarAvailable, requestCalendarAccess, listDeviceCalendars, importDeviceEvents } from '@/lib/deviceCalendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectSheet } from '@/components/custom/SelectSheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { getPlanFeatures } from '@/lib/subscription';
import { SavingOverlay } from '@/components/custom/SavingOverlay';
import type { CalendarEvent, EventType } from '@/types';

import {
  ArrowLeft,
  CloudDownload,
  ChevronLeft,
  ChevronRight,
  Link2,
  ListFilter,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Clock,
  MapPin,
  X,
  Trash2,
  LayoutTemplate,
  GraduationCap,
  Zap,
  Calendar,
  Briefcase,
  User,
  Timer,
  UserCircle,
  Lock,
  Share2,
  Users,
  FileText,
  ShoppingBag,
  Smartphone,
  CalendarRange,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isSameDay, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay, getISOWeek } from 'date-fns';
import { da } from 'date-fns/locale';

/* ── Swipeable event row with delete ── */
function SwipeableEventRow({ children, onDelete, eventId: eId }: { children: React.ReactNode; onDelete: () => void; eventId: string }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const swiping = useRef(false);
  const threshold = 80;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    currentX.current = 0;
    swiping.current = true;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swiping.current || !rowRef.current) return;
    const diff = startX.current - e.touches[0].clientX;
    currentX.current = Math.max(0, Math.min(diff, 120));
    rowRef.current.style.transform = `translateX(-${currentX.current}px)`;
    rowRef.current.style.transition = 'none';
  }, []);

  const handleTouchEnd = useCallback(() => {
    swiping.current = false;
    if (!rowRef.current) return;
    if (currentX.current >= threshold) {
      rowRef.current.style.transition = 'transform 0.25s ease';
      rowRef.current.style.transform = 'translateX(-120px)';
    } else {
      rowRef.current.style.transition = 'transform 0.2s ease';
      rowRef.current.style.transform = 'translateX(0)';
    }
    currentX.current = 0;
  }, []);

  const resetSwipe = useCallback(() => {
    if (rowRef.current) {
      rowRef.current.style.transition = 'transform 0.2s ease';
      rowRef.current.style.transform = 'translateX(0)';
    }
  }, []);

  return (
    <div key={eId} className="relative overflow-hidden rounded-[8px]">
      {/* Delete background */}
      <div className="absolute inset-y-0 right-0 flex w-[120px] items-center justify-center rounded-r-xl bg-red-500">
        <button
          onClick={() => { onDelete(); resetSwipe(); }}
          className="flex flex-col items-center gap-0.5 text-white"
        >
          <Trash2 className="h-5 w-5" />
          <span className="text-[10px] font-semibold">Slet</span>
        </button>
      </div>
      {/* Swipeable content */}
      <div
        ref={rowRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative z-10 bg-card"
        style={{ transform: 'translateX(0)' }}
      >
        {children}
      </div>
    </div>
  );
}

// Color palette for category customization (16 curated colors)
const COLOR_PALETTE = [
  '#2f2f2f', '#4a4945', '#78766d', '#8b8677',
  '#f58a2d', '#e47921', '#d37628', '#cc6f1f',
  '#4a90d9', '#5ba0e0', '#3b82f6', '#2563eb',
  '#16a34a', '#22c55e', '#ef4444', '#a855f7',
];

const DEFAULT_EVENT_COLORS: Record<string, string> = {
  school: '#2f2f2f',
  activity: '#8b8677',
  handover: '#f58a2d',
  appointment: '#4a90d9',
  work: '#4a4945',
  personal: '#a855f7',
};

type EventTypeIcon = typeof GraduationCap;

const eventTypes: { value: string; label: string; color: string; icon: EventTypeIcon }[] = [
  { value: 'all', label: 'Alle', color: 'bg-muted-foreground', icon: Calendar },
  { value: 'school', label: 'Skole', color: 'bg-primary', icon: GraduationCap },
  { value: 'activity', label: 'Aktivitet', color: 'bg-muted-foreground', icon: Zap },
  { value: 'handover', label: 'Aflevering', color: 'bg-[#f58a2d]', icon: UserCircle },
  { value: 'appointment', label: 'Aftale', color: 'bg-[#4a90d9]', icon: Calendar },
  { value: 'work', label: 'Arbejde', color: 'bg-primary', icon: Briefcase },
  { value: 'personal', label: 'Privat', color: 'bg-[#a855f7]', icon: User },
];

type CalendarSourceType = 'work' | 'personal' | 'school' | 'other';

type ParsedCalendarEvent = {
  uid: string;
  title: string;
  startDate: string;
  endDate: string;
  location?: string;
  description?: string;
};

function decodeIcsValue(value: string): string {
  return value
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .trim();
}

function parseIcsDate(input: string): string | null {
  const raw = input.trim();
  if (/^\d{8}$/.test(raw)) {
    const year = raw.slice(0, 4);
    const month = raw.slice(4, 6);
    const day = raw.slice(6, 8);
    return `${year}-${month}-${day}T00:00:00`;
  }

  if (/^\d{8}T\d{6}Z$/.test(raw)) {
    const year = raw.slice(0, 4);
    const month = raw.slice(4, 6);
    const day = raw.slice(6, 8);
    const hour = raw.slice(9, 11);
    const minute = raw.slice(11, 13);
    const second = raw.slice(13, 15);
    return `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
  }

  if (/^\d{8}T\d{6}$/.test(raw)) {
    const year = raw.slice(0, 4);
    const month = raw.slice(4, 6);
    const day = raw.slice(6, 8);
    const hour = raw.slice(9, 11);
    const minute = raw.slice(11, 13);
    const second = raw.slice(13, 15);
    return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
  }

  return null;
}

function parseIcsEvents(icsContent: string): ParsedCalendarEvent[] {
  const unfoldedLines = icsContent
    .replace(/\r\n/g, '\n')
    .split('\n')
    .reduce<string[]>((result, line) => {
      if ((line.startsWith(' ') || line.startsWith('\t')) && result.length > 0) {
        result[result.length - 1] += line.slice(1);
      } else {
        result.push(line);
      }
      return result;
    }, []);

  const events: ParsedCalendarEvent[] = [];
  let current: Record<string, string> | null = null;

  unfoldedLines.forEach((line) => {
    if (line === 'BEGIN:VEVENT') {
      current = {};
      return;
    }
    if (line === 'END:VEVENT' && current) {
      const uid = current.UID || `${current.SUMMARY || 'event'}-${current.DTSTART || Date.now()}`;
      const startDate = current.DTSTART ? parseIcsDate(current.DTSTART) : null;
      const endDate = current.DTEND ? parseIcsDate(current.DTEND) : null;
      if (startDate) {
        const start = new Date(startDate);
        const fallbackEnd = new Date(start);
        fallbackEnd.setHours(fallbackEnd.getHours() + 1);
        events.push({
          uid,
          title: decodeIcsValue(current.SUMMARY || 'Ekstern kalenderaftale'),
          startDate: start.toISOString(),
          endDate: endDate ? new Date(endDate).toISOString() : fallbackEnd.toISOString(),
          location: current.LOCATION ? decodeIcsValue(current.LOCATION) : undefined,
          description: current.DESCRIPTION ? decodeIcsValue(current.DESCRIPTION) : undefined
        });
      }
      current = null;
      return;
    }
    if (!current || !line.includes(':')) return;

    const [rawKey, rawValue] = line.split(/:(.+)/);
    const baseKey = rawKey.split(';')[0];
    current[baseKey] = rawValue;
  });

  return events;
}

export function Kalender() {
  const {
    events, users, children, currentUser, household, setHousehold,
    eventTemplates, addEventTemplate, deleteEventTemplate,
    calendarColorPreferences, setCalendarColorPreference,
    calendarSharing, respondToCalendarSharing,
    sideMenuOpen, setSideMenuOpen, sideMenuContext,
    pendingCalendarAction, setPendingCalendarAction,
    calendarDate: currentDate,
    calendarAddOpen, setCalendarAddOpen,
    setFullScreenOverlayOpen,
    setCalendarWeekViewDate, setActiveTab,
  } = useAppStore();
  const { createEvent, updateEvent, deleteEvent } = useApiActions();
  const { permissions, isLinked } = usePermissions();
  const isSingleParent = household?.familyMode === 'single_parent';
  const syncCalendarSourceRef = useRef<
    ((source: { id: string; name: string; type: CalendarSourceType; url: string; enabled: boolean; autoSync: boolean; lastSyncedAt?: string }, showToast?: boolean) => Promise<void>) | null
  >(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filter, setFilter] = useState('all');
  const [personFilter, setPersonFilter] = useState<string | null>(null);
  const isAddDialogOpen = calendarAddOpen;
  const setIsAddDialogOpen = setCalendarAddOpen;
  const [isSourceDialogOpen, setIsSourceDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [syncingSourceId, setSyncingSourceId] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    type: 'school',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    location: '',
    description: '',
  });
  const [newCalendarSource, setNewCalendarSource] = useState({
    name: '',
    type: 'work' as CalendarSourceType,
    url: '',
    enabled: true,
    autoSync: true,
  });
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ title: '', type: 'school' as EventType, duration: 60, location: '' });
  const [isColorDialogOpen, setIsColorDialogOpen] = useState(false);
  const [colorEditCategory, setColorEditCategory] = useState<string | null>(null);
  const [allUpcomingOpen, setAllUpcomingOpen] = useState(false);
  const calSidePanelOpen = sideMenuOpen && sideMenuContext === 'kalender';
  const setCalSidePanelOpen = setSideMenuOpen;
  const [shareCalendarOpen, setShareCalendarOpen] = useState(false);
  const [templateFormOpen, setTemplateFormOpen] = useState(false);
  const [syncSheetOpen, setSyncSheetOpen] = useState(false);
  const [colorsSheetOpen, setColorsSheetOpen] = useState(false);
  const [newSideTemplate, setNewSideTemplate] = useState({ title: '', type: 'school' as EventType, duration: 60, location: '', notes: '' });
  const [connectDiaryOpen, setConnectDiaryOpen] = useState(false);
  const [connectMealsOpen, setConnectMealsOpen] = useState(false);
  const [diaryCalendarId, setDiaryCalendarId] = useState<string>('main');
  const [mealsCalendarId, setMealsCalendarId] = useState<string>('main');
  const [eventDetailOpen, setEventDetailOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [templateUseOpen, setTemplateUseOpen] = useState(false);
  const [templateToUse, setTemplateToUse] = useState<typeof eventTemplates[0] | null>(null);
  const [templateStartTime, setTemplateStartTime] = useState('');
  const [templateNotifyPartner, setTemplateNotifyPartner] = useState(false);
  const [templateStartTimer, setTemplateStartTimer] = useState(false);
  const [categoriesSheetOpen, setCategoriesSheetOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [calendarsSheetOpen, setCalendarsSheetOpen] = useState(false);
  const [dayViewDate, setDayViewDate] = useState<Date | null>(null);
  const [deviceSyncLoading, setDeviceSyncLoading] = useState(false);
  const deviceCalendarAvailable = isDeviceCalendarAvailable();

  // Handle pending calendar action from Aarskalender side panel
  useEffect(() => {
    if (!pendingCalendarAction) return;
    const actions: Record<string, () => void> = {
      share: () => setShareCalendarOpen(true),
      colors: () => setColorsSheetOpen(true),
      categories: () => setCategoriesSheetOpen(true),
      calendars: () => setCalendarsSheetOpen(true),
      upcoming: () => setAllUpcomingOpen(true),
      templates: () => setTemplateFormOpen(true),
      diary: () => setConnectDiaryOpen(true),
      meals: () => setConnectMealsOpen(true),
    };
    actions[pendingCalendarAction]?.();
    setPendingCalendarAction(null);
  }, [pendingCalendarAction]);

  const features = getPlanFeatures(household, currentUser?.isAdmin);
  const currentChild = children[0];
  // Perspektiv-baseret: indlogget bruger = sort, anden forælder = orange
  const warmParent = users.find((user) => user.role === 'parent' && user.id !== currentUser?.id);
  const calendarSources = household?.calendarSources || [];

  // Calendar sharing logic for separated families
  const isTogether = household?.familyMode === 'together';
  const isSharingAccepted = calendarSharing?.status === 'accepted';
  const isSharingPending = calendarSharing?.status === 'pending';
  // For separated/single_parent families, partner events are hidden unless sharing is accepted
  const canSeePartnerEvents = isTogether || isSharingAccepted;
  const otherParent = users.find(u => u.role === 'parent' && u.id !== currentUser?.id);

  // Get month days
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get custom color for event type
  const getCustomEventColor = (eventType: string): string => {
    return calendarColorPreferences[eventType] || DEFAULT_EVENT_COLORS[eventType] || '#8b8677';
  };

  // Safe parseISO — returns null on invalid/missing input
  const safeParse = (dateStr: string | undefined | null): Date | null => {
    if (!dateStr) return null;
    try {
      const d = parseISO(dateStr);
      return isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  };

  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return events.filter(e => {
      const eventDate = safeParse(e.startDate);
      if (!eventDate || !isSameDay(eventDate, day)) return false;
      if (filter !== 'all' && e.type !== filter) return false;
      if (personFilter && e.createdBy !== personFilter) return false;
      // Hide partner's events if calendar sharing is not accepted (separated families)
      if (!canSeePartnerEvents && otherParent && e.createdBy === otherParent.id) return false;
      return true;
    });
  };

  const getEventInlineColor = (eventType: string): string => {
    return getCustomEventColor(eventType);
  };

  // Get weekday names starting from Monday (single-letter like iOS Calendar)
  const weekdayNames = ['M', 'T', 'O', 'T', 'F', 'L', 'S'];

  const updateCalendarSources = (nextSources: typeof calendarSources) => {
    if (!household) return;
    setHousehold({
      ...household,
      calendarSources: nextSources
    });
  };

  const sourceTypeToEventType: Record<CalendarSourceType, EventType> = {
    work: 'work',
    personal: 'personal',
    school: 'school',
    other: 'meeting'
  };

  const syncCalendarSource = async (
    source: {
      id: string;
      name: string;
      type: CalendarSourceType;
      url: string;
      enabled: boolean;
      autoSync: boolean;
      lastSyncedAt?: string;
    },
    showToast: boolean = true
  ) => {
    if (!household) return;

    try {
      setSyncingSourceId(source.id);
      const response = await fetch(source.url);
      if (!response.ok) {
        throw new Error('Kunne ikke hente kalenderdata');
      }

      const calendarContent = await response.text();
      const parsedEvents = parseIcsEvents(calendarContent);
      let createdCount = 0;
      let updatedCount = 0;

      parsedEvents.forEach((externalEvent) => {
        const existingEvent = events.find(
          (event) =>
            event.sourceCalendarId === source.id &&
            event.sourceEventId === externalEvent.uid
        );

        const payload: Partial<CalendarEvent> = {
          title: externalEvent.title,
          description: externalEvent.description,
          startDate: externalEvent.startDate,
          endDate: externalEvent.endDate,
          type: sourceTypeToEventType[source.type],
          location: externalEvent.location,
          sourceCalendarId: source.id,
          sourceEventId: externalEvent.uid,
          isExternal: true,
          assignedTo: users.map((user) => user.id),
          childId: currentChild?.id
        };

        if (existingEvent) {
          void updateEvent(existingEvent.id, payload);
          updatedCount += 1;
          return;
        }

        createEvent({
          title: payload.title || 'Ekstern kalenderaftale',
          description: payload.description,
          startDate: payload.startDate || new Date().toISOString(),
          endDate: payload.endDate || payload.startDate || new Date().toISOString(),
          type: payload.type || 'meeting',
          location: payload.location,
          sourceCalendarId: payload.sourceCalendarId,
          sourceEventId: payload.sourceEventId,
          isExternal: true,
          assignedTo: payload.assignedTo,
          childId: payload.childId,
          createdBy: users[0]?.id || 'u1'
        });
        createdCount += 1;
      });

      const syncedAt = new Date().toISOString();
      const updatedSources = calendarSources.some((item) => item.id === source.id)
        ? calendarSources.map((item) =>
            item.id === source.id
              ? { ...item, lastSyncedAt: syncedAt }
              : item
          )
        : [...calendarSources, { ...source, lastSyncedAt: syncedAt }];
      updateCalendarSources(updatedSources);

      if (showToast) {
        toast.success(`Synkroniseret: ${createdCount} nye og ${updatedCount} opdaterede aftaler`);
      }
    } catch {
      if (showToast) {
        toast.error('Synkronisering fejlede. Tjek URL eller kalenderadgang.');
      }
    } finally {
      setSyncingSourceId(null);
    }
  };

  syncCalendarSourceRef.current = syncCalendarSource;

  const handleDeviceSync = async () => {
    setDeviceSyncLoading(true);
    try {
      const granted = await requestCalendarAccess();
      if (!granted) {
        toast.error('Kalenderadgang afvist. Åbn Indstillinger for at give adgang.');
        return;
      }
      const calendars = await listDeviceCalendars();
      if (calendars.length === 0) {
        toast.info('Ingen enhedskalendere fundet');
        return;
      }

      // Import events from all calendars for the next 3 months
      const now = new Date();
      const threeMonthsLater = new Date(now);
      threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

      let totalImported = 0;
      for (const cal of calendars) {
        const events = await importDeviceEvents(cal.id, now, threeMonthsLater);
        for (const evt of events) {
          // Check if event already exists (dedup by title + start date)
          const isDuplicate = useAppStore.getState().events.some(
            (e) => e.title === evt.title && e.startDate === evt.startDate
          );
          if (!isDuplicate) {
            createEvent({
              title: evt.title,
              type: 'activity',
              startDate: evt.startDate,
              endDate: evt.endDate,
              location: evt.location,
              description: evt.notes,
              createdBy: currentUser?.id || '',
            });
            totalImported++;
          }
        }
      }
      toast.success(`${totalImported} begivenheder importeret fra ${calendars.length} kalender${calendars.length > 1 ? 'e' : ''}`);
    } catch {
      toast.error('Fejl ved synkronisering af enhedskalender');
    } finally {
      setDeviceSyncLoading(false);
    }
  };

  const addCalendarSource = async () => {
    if (!newCalendarSource.name.trim() || !newCalendarSource.url.trim()) {
      toast.error('Udfyld navn og kalender-URL');
      return;
    }

    if (!household) {
      toast.error('Kunne ikke gemme kalenderkilde');
      return;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(newCalendarSource.url.trim());
    } catch {
      toast.error('Ugyldig URL-format');
      return;
    }
    if (!['https:', 'webcal:'].includes(parsedUrl.protocol)) {
      toast.error('Kun HTTPS og WebCal URLs er tilladt');
      return;
    }
    const hostname = parsedUrl.hostname;
    if (hostname === 'localhost' || hostname.startsWith('127.') || hostname.startsWith('192.168.') || hostname.startsWith('10.')) {
      toast.error('Privat netværksadresse er ikke tilladt');
      return;
    }

    const sourceId = calendarSourceId();
    const source = {
      id: sourceId,
      name: newCalendarSource.name.trim(),
      type: newCalendarSource.type,
      url: newCalendarSource.url.trim(),
      enabled: newCalendarSource.enabled,
      autoSync: newCalendarSource.autoSync,
      lastSyncedAt: undefined
    };

    updateCalendarSources([...calendarSources, source]);
    setNewCalendarSource({
      name: '',
      type: 'work',
      url: '',
      enabled: true,
      autoSync: true
    });
    setIsSourceDialogOpen(false);

    if (source.enabled) {
      await syncCalendarSource(source, false);
    }

    toast.success('Kalenderkilde tilføjet');
  };

  const removeCalendarSource = (sourceId: string) => {
    updateCalendarSources(calendarSources.filter((source) => source.id !== sourceId));
    events
      .filter((event) => event.sourceCalendarId === sourceId)
      .forEach((event) => void deleteEvent(event.id));
    toast.success('Kalenderkilde fjernet');
  };

  useEffect(() => {
    const autoSyncSources = calendarSources.filter((source) => source.enabled && source.autoSync);
    if (autoSyncSources.length === 0) {
      return;
    }

    const intervalId = window.setInterval(() => {
      autoSyncSources.forEach((source) => {
        void syncCalendarSourceRef.current?.(source, false);
      });
    }, 5 * 60 * 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [calendarSources]);

  // Pre-populate date/time when add-event page opens
  useEffect(() => {
    if (isAddDialogOpen) {
      const now = new Date();
      const nextHour = new Date(now);
      nextHour.setMinutes(0, 0, 0);
      nextHour.setHours(nextHour.getHours() + 1);
      const endHour = new Date(nextHour);
      endHour.setHours(endHour.getHours() + 1);
      setNewEvent(prev => ({
        ...prev,
        startDate: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(nextHour, 'yyyy-MM-dd'),
        startTime: format(nextHour, 'HH:mm'),
        endDate: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(nextHour, 'yyyy-MM-dd'),
        endTime: format(endHour, 'HH:mm'),
      }));
    }
  }, [isAddDialogOpen]);

  // Hide BottomNav when full-screen overlay is open
  useEffect(() => {
    setFullScreenOverlayOpen(!!dayViewDate || isAddDialogOpen);
    return () => setFullScreenOverlayOpen(false);
  }, [dayViewDate, isAddDialogOpen, setFullScreenOverlayOpen]);

  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.startDate || !newEvent.startTime) return;
    setIsSaving(true);
    try {
      const startDateTime = new Date(`${newEvent.startDate}T${newEvent.startTime}:00`);
      const endDateTime = newEvent.endDate && newEvent.endTime
        ? new Date(`${newEvent.endDate}T${newEvent.endTime}:00`)
        : startDateTime;

      await createEvent({
        title: newEvent.title,
        type: newEvent.type as EventType,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        location: newEvent.location,
        description: newEvent.description,
        createdBy: users[0]?.id || 'u1',
        childId: currentChild?.id,
      });

      toast.success('Begivenhed tilføjet');
      setIsAddDialogOpen(false);
      setNewEvent({
        title: '',
        type: 'school',
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
        location: '',
        description: '',
      });
    } catch {
      toast.error('Kunne ikke tilføje begivenhed');
    } finally {
      setIsSaving(false);
    }
  };

  // All upcoming events (hide partner events when sharing not accepted)
  const allUpcoming = events
    .filter(e => {
      const d = safeParse(e.startDate);
      if (!d || d < new Date()) return false;
      if (!canSeePartnerEvents && otherParent && e.createdBy === otherParent.id) return false;
      return true;
    })
    .sort((a, b) => (safeParse(a.startDate)?.getTime() ?? 0) - (safeParse(b.startDate)?.getTime() ?? 0));

  // Handle template use: open config dialog
  const handleUseTemplate = (tmpl: typeof eventTemplates[0]) => {
    setTemplateToUse(tmpl);
    const now = new Date();
    setTemplateStartTime(now.toISOString().slice(0, 16));
    setTemplateNotifyPartner(tmpl.notifyPartner ?? false);
    setTemplateStartTimer(tmpl.autoTimer ?? false);
    setTemplateUseOpen(true);
  };

  // Confirm template use
  const handleConfirmTemplateUse = async () => {
    if (!templateToUse || !templateStartTime) return;
    const start = new Date(templateStartTime);
    const endDate = new Date(start.getTime() + templateToUse.duration * 60000);
    const user = users.find(u => u.role === 'parent');
    await createEvent({
      title: templateToUse.title,
      type: templateToUse.type,
      startDate: start.toISOString(),
      endDate: endDate.toISOString(),
      location: templateToUse.location,
      description: templateToUse.notes,
      createdBy: user?.id ?? '',
    });

    if (templateNotifyPartner) {
      toast.info(`Notifikation sendt til partner om "${templateToUse.title}"`);
    }

    if (templateStartTimer && templateToUse.duration > 0) {
      const durationMs = templateToUse.duration * 60000;
      toast.success(`Timer startet: ${templateToUse.duration} min for "${templateToUse.title}"`);
      setTimeout(() => {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`⏰ Tid udløbet: ${templateToUse.title}`, {
            body: `${templateToUse.duration} minutter er gået.`,
          });
        }
        toast.info(`⏰ Tid udløbet for "${templateToUse.title}"!`);
      }, durationMs);
    }

    toast.success(`Oprettet fra skabelon: ${templateToUse.title}`);
    setTemplateUseOpen(false);
    setTemplateToUse(null);
  };

  return (
    <div className="space-y-1.5 py-1">
      {/* ─── Side panel (OverblikSidePanel-stil) — rendered via portal ─── */}
      {createPortal(
      <AnimatePresence>
        {calSidePanelOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[9998] bg-black/30"
              onClick={() => setCalSidePanelOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="fixed inset-y-0 left-0 z-[9999] w-full bg-card flex flex-col"
              style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
            >
              <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                <h2 className="text-[17px] font-bold text-foreground">Kalender</h2>
                <button
                  onClick={() => setCalSidePanelOpen(false)}
                  className="flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-2 pb-[env(safe-area-inset-bottom,0px)]">
                {[
                  { label: 'Årskalender', icon: CalendarRange, action: () => { setActiveTab('aarskalender'); setCalSidePanelOpen(false); } },
                  ...(!isSingleParent ? [{ label: 'Del kalender', icon: Share2, action: () => {
                    if (isTogether) {
                      toast.info('Kalenderen deles automatisk i sammen-familier');
                      setCalSidePanelOpen(false);
                      return;
                    }
                    if (permissions.requiresLinkingForSharing && !isLinked) {
                      toast.error('Forbind med din co-parent først for at dele kalenderen');
                      setCalSidePanelOpen(false);
                      return;
                    }
                    setShareCalendarOpen(true); setCalSidePanelOpen(false);
                  } }] : []),
                  { label: 'Farver', icon: Calendar, action: () => { setColorsSheetOpen(true); setCalSidePanelOpen(false); } },
                  { label: 'Kategorier', icon: ListFilter, action: () => { setCategoriesSheetOpen(true); setCalSidePanelOpen(false); } },
                  { label: 'Deling og kilder', icon: Users, action: () => { setCalendarsSheetOpen(true); setCalSidePanelOpen(false); } },
                  { label: 'Kommende aftaler', icon: Clock, action: () => { setAllUpcomingOpen(true); setCalSidePanelOpen(false); } },
                  { label: 'Aftale-skabeloner', icon: LayoutTemplate, action: () => { setTemplateFormOpen(true); setCalSidePanelOpen(false); } },
                  { label: 'Dagbog', icon: FileText, action: () => { setConnectDiaryOpen(true); setCalSidePanelOpen(false); } },
                  { label: 'Indkøb & måltider', icon: ShoppingBag, action: () => { setConnectMealsOpen(true); setCalSidePanelOpen(false); } },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      onClick={item.action}
                      className="flex w-full items-center gap-3.5 px-5 py-3.5 text-left transition-colors hover:bg-card"
                    >
                      <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                      <p className="flex-1 min-w-0 text-[15px] font-semibold text-foreground">{item.label}</p>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body
      )}

      {/* ─── 2-trins Del Kalender flow ─── */}
      <ShareCalendarFlow open={shareCalendarOpen} onOpenChange={setShareCalendarOpen} />

      {/* ─── Aftale-skabeloner popup ─── */}
      <Sheet open={templateFormOpen} onOpenChange={setTemplateFormOpen}>
        <SheetContent side="bottom" hideClose className="flex max-h-[85vh] flex-col rounded-t-[28px] border-border bg-background shadow-[0_-18px_40px_rgba(0,0,0,0.2)]">
          <div aria-hidden="true" className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted shrink-0" />
          <SheetHeader className="px-4 pb-2 shrink-0">
            <SheetTitle className="text-center text-[1.05rem] text-foreground">Aftale-skabeloner</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom,0px)+24px)] space-y-2">
            {/* Existing templates list */}
            {eventTemplates.length > 0 && (
              <div className="space-y-2 mb-3">
                {eventTemplates.map(tmpl => (
                  <div key={tmpl.id} className="flex items-center justify-between rounded-[8px] border border-[#f0efe8] bg-card px-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-foreground">{tmpl.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {getEventTypeLabel(tmpl.type)} · {tmpl.duration} min{tmpl.location ? ` · ${tmpl.location}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => { handleUseTemplate(tmpl); setTemplateFormOpen(false); }}
                        className="rounded-[8px] bg-secondary px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-muted"
                      >
                        Brug
                      </button>
                      <button
                        onClick={() => { deleteEventTemplate(tmpl.id); toast.success('Skabelon slettet'); }}
                        className="rounded-full p-1 text-muted-foreground hover:text-rose-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {eventTemplates.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <LayoutTemplate className="h-8 w-8 text-muted-foreground" />
                <p className="text-[12px] text-muted-foreground">Ingen skabeloner endnu.</p>
              </div>
            )}

            <div className="border-t border-border pt-3">
              <p className="text-[13px] font-semibold text-foreground mb-2">Ny skabelon</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-semibold text-muted-foreground">Titel</Label>
              <Input
                value={newSideTemplate.title}
                onChange={(e) => setNewSideTemplate(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Fx Lægebesøg, SFO-hentning"
                className="rounded-[8px] border-border bg-card text-[13px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-semibold text-muted-foreground">Type</Label>
              <SelectSheet
                value={newSideTemplate.type}
                onValueChange={(v) => setNewSideTemplate(prev => ({ ...prev, type: v as EventType }))}
                title="Type"
                options={[
                  { value: 'school', label: 'Skole' },
                  { value: 'medical', label: 'Læge' },
                  { value: 'activity', label: 'Aktivitet' },
                  { value: 'handover', label: 'Aflevering' },
                  { value: 'birthday', label: 'Fødselsdag' },
                  { value: 'other', label: 'Andet' },
                ]}
                className="rounded-[8px] border-border"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[12px] font-semibold text-muted-foreground">Varighed (min.)</Label>
                <Input
                  type="number"
                  value={newSideTemplate.duration || ''}
                  onChange={(e) => setNewSideTemplate(prev => ({ ...prev, duration: e.target.value === '' ? 0 : Number(e.target.value) }))}
                  className="rounded-[8px] border-border bg-card text-[13px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px] font-semibold text-muted-foreground">Sted</Label>
                <Input
                  value={newSideTemplate.location}
                  onChange={(e) => setNewSideTemplate(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Valgfrit"
                  className="rounded-[8px] border-border bg-card text-[13px]"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-semibold text-muted-foreground">Noter</Label>
              <Input
                value={newSideTemplate.notes}
                onChange={(e) => setNewSideTemplate(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Valgfri bemærkninger"
                className="rounded-[8px] border-border bg-card text-[13px]"
              />
            </div>
            <button
              onClick={() => {
                if (!newSideTemplate.title.trim()) { toast.error('Tilføj en titel'); return; }
                toast.success(`Skabelon "${newSideTemplate.title}" oprettet`);
                setNewSideTemplate({ title: '', type: 'school', duration: 60, location: '', notes: '' });
                setTemplateFormOpen(false);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-[8px] bg-[#f58a2d] px-4 py-3 text-[14px] font-bold text-white shadow-[0_2px_12px_rgba(245,138,45,0.25)] transition-all active:scale-[0.98]"
            >
              Gem skabelon
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ─── Dagbog → Forbind til kalender popup ─── */}
      <Sheet open={connectDiaryOpen} onOpenChange={setConnectDiaryOpen}>
        <SheetContent side="bottom" hideClose className="flex max-h-[85vh] flex-col rounded-t-[28px] border-border bg-background shadow-[0_-18px_40px_rgba(0,0,0,0.2)]">
          <div aria-hidden="true" className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted shrink-0" />
          <SheetHeader className="px-4 pb-2 shrink-0">
            <SheetTitle className="text-center text-[1.05rem] text-foreground">Forbind dagbog til kalender</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom,0px)+24px)] space-y-2">
            <p className="text-[13px] text-muted-foreground">
              Vælg hvilken kalender dagbogsnotater skal vises i.
            </p>
            <div className="space-y-2">
              {[
                { id: 'main', label: 'Hovedkalender', desc: 'Din primære kalender' },
                { id: 'shared', label: 'Delt kalender', desc: 'Synlig for begge forældre' },
                { id: 'none', label: 'Ingen', desc: 'Dagbog vises ikke i kalender' },
              ].map((cal) => (
                <button
                  key={cal.id}
                  onClick={() => setDiaryCalendarId(cal.id)}
                  className={cn(
                    'flex w-full items-center gap-3.5 rounded-[8px] border-2 px-4 py-3 text-left transition-all',
                    diaryCalendarId === cal.id
                      ? 'border-orange-tint bg-orange-tint'
                      : 'border-border bg-card hover:border-border'
                  )}
                >
                  <div className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-xl',
                    diaryCalendarId === cal.id ? 'bg-[#f58a2d]' : 'bg-background'
                  )}>
                    <FileText className={cn('h-[18px] w-[18px]', diaryCalendarId === cal.id ? 'text-white' : 'text-muted-foreground')} />
                  </div>
                  <div className="flex-1">
                    <p className={cn('text-[14px] font-semibold', diaryCalendarId === cal.id ? 'text-[#bf6722]' : 'text-foreground')}>{cal.label}</p>
                    <p className="text-[11px] text-muted-foreground">{cal.desc}</p>
                  </div>
                  {diaryCalendarId === cal.id && <div className="h-2 w-2 rounded-full bg-[#f58a2d] shrink-0" />}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                toast.success(`Dagbog forbundet til ${diaryCalendarId === 'main' ? 'hovedkalender' : diaryCalendarId === 'shared' ? 'delt kalender' : 'ingen kalender'}`);
                setConnectDiaryOpen(false);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-[8px] bg-[#f58a2d] px-4 py-3 text-[14px] font-bold text-white shadow-[0_2px_12px_rgba(245,138,45,0.25)] transition-all active:scale-[0.98]"
            >
              Gem forbindelse
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ─── Indkøb & Måltider → Forbind til kalender popup ─── */}
      <Sheet open={connectMealsOpen} onOpenChange={setConnectMealsOpen}>
        <SheetContent side="bottom" hideClose className="flex max-h-[85vh] flex-col rounded-t-[28px] border-border bg-background shadow-[0_-18px_40px_rgba(0,0,0,0.2)]">
          <div aria-hidden="true" className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted shrink-0" />
          <SheetHeader className="px-4 pb-2 shrink-0">
            <SheetTitle className="text-center text-[1.05rem] text-foreground">Forbind måltider til kalender</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom,0px)+24px)] space-y-2">
            <p className="text-[13px] text-muted-foreground">
              Vælg hvilken kalender madplan og indkøb skal synkroniseres med.
            </p>
            <div className="space-y-2">
              {[
                { id: 'main', label: 'Hovedkalender', desc: 'Måltider vises i din kalender' },
                { id: 'shared', label: 'Delt kalender', desc: 'Synlig for begge forældre' },
                { id: 'none', label: 'Ingen', desc: 'Måltider vises ikke i kalender' },
              ].map((cal) => (
                <button
                  key={cal.id}
                  onClick={() => setMealsCalendarId(cal.id)}
                  className={cn(
                    'flex w-full items-center gap-3.5 rounded-[8px] border-2 px-4 py-3 text-left transition-all',
                    mealsCalendarId === cal.id
                      ? 'border-orange-tint bg-orange-tint'
                      : 'border-border bg-card hover:border-border'
                  )}
                >
                  <div className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-xl',
                    mealsCalendarId === cal.id ? 'bg-[#f58a2d]' : 'bg-background'
                  )}>
                    <ShoppingBag className={cn('h-[18px] w-[18px]', mealsCalendarId === cal.id ? 'text-white' : 'text-muted-foreground')} />
                  </div>
                  <div className="flex-1">
                    <p className={cn('text-[14px] font-semibold', mealsCalendarId === cal.id ? 'text-[#bf6722]' : 'text-foreground')}>{cal.label}</p>
                    <p className="text-[11px] text-muted-foreground">{cal.desc}</p>
                  </div>
                  {mealsCalendarId === cal.id && <div className="h-2 w-2 rounded-full bg-[#f58a2d] shrink-0" />}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                toast.success(`Måltider forbundet til ${mealsCalendarId === 'main' ? 'hovedkalender' : mealsCalendarId === 'shared' ? 'delt kalender' : 'ingen kalender'}`);
                setConnectMealsOpen(false);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-[8px] bg-[#f58a2d] px-4 py-3 text-[14px] font-bold text-white shadow-[0_2px_12px_rgba(245,138,45,0.25)] transition-all active:scale-[0.98]"
            >
              Gem forbindelse
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Large month title (iOS Calendar style) */}
      <h1
        className="text-[2rem] font-bold leading-tight text-foreground px-1 capitalize cursor-pointer hover:text-[#f58a2d] transition-colors"
        onClick={() => { setCalendarWeekViewDate(new Date()); setActiveTab('kalender-week'); }}
      >
        {format(currentDate, 'MMMM', { locale: da })}
      </h1>

      {/* Add event full-page (triggered by TopBar + button) */}
      <AnimatePresence>
        {isAddDialogOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            drag="x"
            dragConstraints={{ left: 0 }}
            dragElastic={0.15}
            onDragEnd={(_: unknown, info: { offset: { x: number } }) => { if (info.offset.x > 100) setIsAddDialogOpen(false); }}
            className="fixed inset-0 z-50 bg-background flex flex-col"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <button
                onClick={() => setIsAddDialogOpen(false)}
                className="flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h2 className="text-[17px] font-bold text-foreground">Tilføj ny aftale</h2>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 pb-[calc(env(safe-area-inset-bottom,0px)+24px)]">
              <div className="max-w-[430px] mx-auto space-y-4">
                <div className="space-y-2">
                  <Label>Titel</Label>
                  <Input
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                    placeholder="F.eks. Fodboldtræning"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <SelectSheet
                    value={newEvent.type}
                    onValueChange={(v) => setNewEvent({...newEvent, type: v})}
                    title="Type"
                    options={eventTypes.filter(t => t.value !== 'all').map(type => ({
                      value: type.value,
                      label: type.label,
                      icon: <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getEventInlineColor(type.value) }} />,
                    }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 overflow-hidden">
                  <div className="space-y-2 min-w-0 overflow-hidden">
                    <Label>Startdato</Label>
                    <Input
                      type="date"
                      value={newEvent.startDate}
                      onChange={(e) => setNewEvent({...newEvent, startDate: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2 min-w-0 overflow-hidden">
                    <Label>Starttid</Label>
                    <Input
                      type="time"
                      value={newEvent.startTime}
                      onChange={(e) => setNewEvent({...newEvent, startTime: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 overflow-hidden">
                  <div className="space-y-2 min-w-0 overflow-hidden">
                    <Label>Slutdato</Label>
                    <Input
                      type="date"
                      value={newEvent.endDate}
                      onChange={(e) => setNewEvent({...newEvent, endDate: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2 min-w-0 overflow-hidden">
                    <Label>Sluttid</Label>
                    <Input
                      type="time"
                      value={newEvent.endTime}
                      onChange={(e) => setNewEvent({...newEvent, endTime: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Sted</Label>
                  <Input
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                    placeholder="F.eks. Idrætshallen"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Beskrivelse</Label>
                  <Input
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                    placeholder="Valgfri beskrivelse"
                  />
                </div>
                <Button onClick={handleAddEvent} className="w-full flex items-center justify-center gap-2" disabled={isSaving}>
                  Tilføj aftale
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Day View — full-page iOS-style time grid */}
      <AnimatePresence>
        {dayViewDate && createPortal(
          <motion.div
            key="day-view"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            drag="x"
            dragConstraints={{ left: 0 }}
            dragElastic={0.15}
            onDragEnd={(_: unknown, info: { offset: { x: number } }) => { if (info.offset.x > 100) setDayViewDate(null); }}
            className="fixed inset-0 z-50 bg-background flex flex-col"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <button
                onClick={() => setDayViewDate(null)}
                className="flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h2 className="text-[17px] font-bold text-foreground capitalize">
                {format(dayViewDate, 'EEEE d. MMMM', { locale: da })}
              </h2>
              <button
                onClick={() => { setSelectedDate(dayViewDate); setIsAddDialogOpen(true); }}
                className="ml-auto flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>

            {/* Time grid */}
            <div className="flex-1 overflow-y-auto">
              <div className="relative" style={{ height: `${17 * 60}px` }}>
                {/* Hour lines 06:00 - 22:00 */}
                {Array.from({ length: 17 }, (_, i) => {
                  const hour = i + 6;
                  return (
                    <div key={hour} className="absolute inset-x-0" style={{ top: `${i * 60}px` }}>
                      <div className="flex items-start">
                        <span className="w-14 shrink-0 pr-2 text-right text-[11px] text-muted-foreground -mt-[7px]">
                          {`${hour.toString().padStart(2, '0')}:00`}
                        </span>
                        <div className="flex-1 border-t border-border" />
                      </div>
                    </div>
                  );
                })}

                {/* Events as positioned blocks */}
                <div className="absolute inset-0 ml-14">
                  {getEventsForDay(dayViewDate).map((event) => {
                    const start = safeParse(event.startDate) ?? new Date();
                    const end = safeParse(event.endDate) ?? new Date(start.getTime() + 60 * 60000);
                    const startMinutes = start.getHours() * 60 + start.getMinutes();
                    const endMinutes = end.getHours() * 60 + end.getMinutes();
                    const top = ((startMinutes - 6 * 60) / 60) * 60;
                    const height = Math.max(((endMinutes - startMinutes) / 60) * 60, 24);
                    const color = getCustomEventColor(event.type);

                    return (
                      <button
                        key={event.id}
                        onClick={() => { setSelectedEvent(event); setEventDetailOpen(true); }}
                        className="absolute left-1 right-2 rounded-[8px] px-2.5 py-1.5 text-left overflow-hidden"
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                          backgroundColor: color + '18',
                          borderLeft: `3px solid ${color}`,
                        }}
                      >
                        <p className="text-[12px] font-semibold truncate" style={{ color }}>{event.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {format(start, 'HH:mm')} – {format(end, 'HH:mm')}
                        </p>
                        {event.location && (
                          <p className="text-[10px] text-muted-foreground truncate">{event.location}</p>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Current time indicator */}
                {isSameDay(dayViewDate, new Date()) && (() => {
                  const now = new Date();
                  const nowMinutes = now.getHours() * 60 + now.getMinutes();
                  const nowTop = ((nowMinutes - 6 * 60) / 60) * 60;
                  if (nowTop < 0 || nowTop > 17 * 60) return null;
                  return (
                    <div className="absolute inset-x-0 ml-12 flex items-center" style={{ top: `${nowTop}px` }}>
                      <div className="h-2.5 w-2.5 rounded-full bg-[#f58a2d]" />
                      <div className="flex-1 border-t-2 border-[#f58a2d]" />
                    </div>
                  );
                })()}
              </div>
            </div>
          </motion.div>,
          document.body
        )}
      </AnimatePresence>

      {/* Category filter moved to side panel */}

      {/* Farver Sheet */}
      <Sheet open={colorsSheetOpen} onOpenChange={setColorsSheetOpen}>
        <SheetContent side="bottom" hideClose className="flex max-h-[85vh] flex-col rounded-t-[28px] border-border bg-background shadow-[0_-18px_40px_rgba(0,0,0,0.2)]">
          <div aria-hidden="true" className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted shrink-0" />
          <SheetHeader className="px-4 pb-2 shrink-0">
            <SheetTitle className="text-center text-[1.05rem] text-foreground">Farver</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom,0px)+24px)] space-y-1">
            {eventTypes.filter(t => t.value !== 'all').map(type => {
              const TypeIcon = type.icon;
              const currentColor = getCustomEventColor(type.value);
              return (
                <button
                  key={type.value}
                  onClick={() => { setColorEditCategory(type.value); setIsColorDialogOpen(true); }}
                  className="flex w-full items-center gap-3 rounded-[8px] px-3 py-2.5 text-left transition-colors hover:bg-muted"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-[8px]" style={{ backgroundColor: currentColor + '22' }}>
                    <TypeIcon className="h-4 w-4" style={{ color: currentColor }} />
                  </div>
                  <span className="flex-1 text-sm font-medium text-foreground">{type.label}</span>
                  <div className="h-5 w-5 rounded-full border border-border" style={{ backgroundColor: currentColor }} />
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              );
            })}
            <button
              onClick={() => { toast.success('Farver gemt'); setColorsSheetOpen(false); }}
              className="mt-2 w-full rounded-[8px] border border-border bg-primary py-2 text-center text-[12px] font-semibold text-white hover:bg-primary transition-colors"
            >
              Gem farver
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Kategorier Sheet */}
      <Sheet open={categoriesSheetOpen} onOpenChange={setCategoriesSheetOpen}>
        <SheetContent side="bottom" hideClose className="flex max-h-[85vh] flex-col rounded-t-[28px] border-border bg-background shadow-[0_-18px_40px_rgba(0,0,0,0.2)]">
          <div aria-hidden="true" className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted shrink-0" />
          <SheetHeader className="px-4 pb-2 shrink-0">
            <SheetTitle className="text-center text-[1.05rem] text-foreground">Kategorier</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom,0px)+24px)] space-y-1">
            {eventTypes.map(type => {
              const TypeIcon = type.icon;
              const currentColor = type.value === 'all' ? '#8b8677' : getCustomEventColor(type.value);
              const isEditing = editingCategory === type.value;
              return (
                <div
                  key={type.value}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-[8px] px-3 py-2.5 transition-colors',
                    filter === type.value ? 'bg-orange-tint' : 'hover:bg-muted'
                  )}
                >
                  <button
                    onClick={() => { setFilter(type.value); setCategoriesSheetOpen(false); }}
                    className="flex flex-1 items-center gap-3 text-left min-w-0"
                  >
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: currentColor }} />
                    <div className="flex h-8 w-8 items-center justify-center rounded-[8px] shrink-0" style={{ backgroundColor: currentColor + '22' }}>
                      <TypeIcon className="h-4 w-4" style={{ color: currentColor }} />
                    </div>
                    {isEditing ? (
                      <Input
                        value={editingCategoryName}
                        onChange={(e) => setEditingCategoryName(e.target.value)}
                        onBlur={() => { toast.success(`Kategori omdøbt til "${editingCategoryName}"`); setEditingCategory(null); }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { toast.success(`Kategori omdøbt til "${editingCategoryName}"`); setEditingCategory(null); } }}
                        className="h-8 flex-1 text-sm"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className={cn('flex-1 text-sm font-medium truncate', filter === type.value ? 'font-semibold text-foreground' : 'text-foreground')}>
                        {type.label}
                      </span>
                    )}
                  </button>
                  {type.value !== 'all' && !isEditing && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => { setEditingCategory(type.value); setEditingCategoryName(type.label); }}
                        className="flex h-7 w-7 items-center justify-center rounded-[8px] text-muted-foreground hover:bg-muted"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => { toast.success(`"${type.label}" slettet`); }}
                        className="flex h-7 w-7 items-center justify-center rounded-[8px] text-muted-foreground hover:text-rose-500 hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            <button
              onClick={() => {
                if (!features.unlimitedCategories && eventTypes.length >= 5) {
                  toast.error('Opgrader til et betalt abonnement for at tilføje flere kategorier');
                  return;
                }
                toast.info('Tilføj kategori (kommer snart)');
              }}
              className="flex w-full items-center justify-center gap-2 rounded-[8px] border-2 border-dashed border-border bg-card px-4 py-3 text-[13px] font-semibold text-muted-foreground hover:border-[#f58a2d] hover:bg-orange-tint-light transition-colors mt-2"
            >
              <Plus className="h-4 w-4" />
              Tilføj kategori
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Deling og kilder Sheet */}
      <Sheet open={calendarsSheetOpen} onOpenChange={setCalendarsSheetOpen}>
        <SheetContent side="bottom" hideClose className="flex max-h-[85vh] flex-col rounded-t-[28px] border-border bg-background shadow-[0_-18px_40px_rgba(0,0,0,0.2)]">
          <div aria-hidden="true" className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted shrink-0" />
          <SheetHeader className="px-4 pb-2 shrink-0">
            <SheetTitle className="text-center text-[1.05rem] text-foreground">Deling og kilder</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom,0px)+24px)] space-y-4">
            {/* ── Section: Deling ── */}
            {!isSingleParent && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Deling</p>

                {/* Sharing status */}
                {isTogether ? (
                  <div className="flex items-center gap-2.5 rounded-xl border border-[#c8e6c9] bg-green-tint p-3">
                    <Share2 className="h-4 w-4 text-[#4caf50] shrink-0" />
                    <p className="text-[13px] font-medium text-[#2e7d32]">Kalenderen deles automatisk</p>
                  </div>
                ) : isSharingAccepted ? (
                  <div className="flex items-center gap-2.5 rounded-xl border border-[#c8e6c9] bg-green-tint p-3">
                    <Share2 className="h-4 w-4 text-[#4caf50] shrink-0" />
                    <div className="flex-1">
                      <p className="text-[13px] font-medium text-[#2e7d32]">Deler med {warmParent?.name || 'co-parent'}</p>
                    </div>
                  </div>
                ) : isSharingPending && calendarSharing?.requestedBy !== currentUser?.id ? (
                  <div className="rounded-xl border border-orange-tint bg-orange-tint-light p-3">
                    <p className="text-[13px] font-semibold text-foreground">Anmodning om kalenderdeling</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {users.find(u => u.id === calendarSharing?.requestedBy)?.name ?? 'Din partner'} ønsker at dele kalender.
                    </p>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => { respondToCalendarSharing(true); toast.success('Kalenderdeling accepteret'); setCalendarsSheetOpen(false); }}
                        className="rounded-lg bg-[#f58a2d] px-3 py-1.5 text-[11px] font-semibold text-white"
                      >
                        Acceptér
                      </button>
                      <button
                        onClick={() => { respondToCalendarSharing(false); toast.info('Afvist'); setCalendarsSheetOpen(false); }}
                        className="rounded-lg border border-border bg-card px-3 py-1.5 text-[11px] font-semibold text-foreground"
                      >
                        Afvis
                      </button>
                    </div>
                  </div>
                ) : !isSharingAccepted && !isSharingPending ? (
                  <button
                    onClick={() => {
                      if (!features.calendarSharing) {
                        toast.error('Opgrader til et betalt abonnement for kalenderdeling');
                        return;
                      }
                      if (permissions.requiresLinkingForSharing && !isLinked) {
                        toast.error('Forbind med din co-parent først');
                        return;
                      }
                      setCalendarsSheetOpen(false);
                      setShareCalendarOpen(true);
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-card px-4 py-3 text-[13px] font-semibold text-muted-foreground hover:border-[#f58a2d] hover:bg-orange-tint-light transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Del kalender
                  </button>
                ) : null}
              </div>
            )}

            {/* ── Section: Kilder ── */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Kilder</p>
              {calendarSources.length === 0 ? (
                <p className="text-[12px] text-muted-foreground py-2">Ingen eksterne kalendere tilføjet.</p>
              ) : (
                calendarSources.map((source) => (
                  <div key={source.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-foreground truncate">{source.name}</p>
                      <p className="text-[10px] text-muted-foreground">{source.type}</p>
                    </div>
                    {source.enabled && (
                      <span className="text-[10px] font-semibold text-[#4caf50]">Aktiv</span>
                    )}
                  </div>
                ))
              )}
              <button
                onClick={() => { setCalendarsSheetOpen(false); setSyncSheetOpen(true); }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-card px-4 py-3 text-[13px] font-semibold text-muted-foreground hover:border-[#f58a2d] hover:bg-orange-tint-light transition-colors"
              >
                <CloudDownload className="h-4 w-4" />
                Tilføj kalenderkilde
              </button>
              {deviceCalendarAvailable ? (
                <button
                  onClick={() => { setCalendarsSheetOpen(false); handleDeviceSync(); }}
                  disabled={deviceSyncLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-[13px] font-semibold text-muted-foreground hover:bg-card transition-colors disabled:opacity-50"
                >
                  <Smartphone className="h-4 w-4" />
                  {deviceSyncLoading ? 'Synkroniserer...' : 'Synkroniser fra enhed'}
                </button>
              ) : (
                <p className="text-center text-[11px] text-muted-foreground py-1">
                  Enhedssynkronisering er kun tilgængelig i appen.
                </p>
              )}
            </div>

            {/* ── Section: Filter ── */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Filter</p>
              <button
                onClick={() => { setPersonFilter(null); setCalendarsSheetOpen(false); }}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors',
                  !personFilter ? 'bg-orange-tint font-semibold text-foreground' : 'text-foreground hover:bg-card'
                )}
              >
                <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground shrink-0" />
                Alle kalendere
              </button>
              <button
                onClick={() => { setPersonFilter(currentUser?.id || 'me'); setCalendarsSheetOpen(false); }}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors',
                  personFilter === (currentUser?.id || 'me') ? 'bg-orange-tint font-semibold text-foreground' : 'text-foreground hover:bg-card'
                )}
              >
                <span className="h-2.5 w-2.5 rounded-full bg-primary shrink-0" />
                {currentUser?.name || 'Mig'} (min)
              </button>
              {warmParent && canSeePartnerEvents && (
                <button
                  onClick={() => { setPersonFilter(warmParent.id); setCalendarsSheetOpen(false); }}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors',
                    personFilter === warmParent.id ? 'bg-orange-tint font-semibold text-foreground' : 'text-foreground hover:bg-card'
                  )}
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-[#f58a2d] shrink-0" />
                  {warmParent.name}
                </button>
              )}

              {/* Partner hidden notice */}
              {!isTogether && !canSeePartnerEvents && otherParent && (
                <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
                  <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <p className="text-[11px] text-muted-foreground">{otherParent.name}s kalender er skjult.</p>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Synk Sheet */}
      <Sheet open={syncSheetOpen} onOpenChange={setSyncSheetOpen}>
        <SheetContent side="bottom" hideClose className="flex max-h-[85vh] flex-col rounded-t-[28px] border-border bg-background shadow-[0_-18px_40px_rgba(0,0,0,0.2)]">
          <div aria-hidden="true" className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted shrink-0" />
          <SheetHeader className="px-4 pb-2 shrink-0">
            <SheetTitle className="text-center text-[1.05rem] text-foreground">Synkronisering</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom,0px)+24px)] space-y-2">
            <button
              onClick={() => setIsSourceDialogOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-[8px] border-2 border-dashed border-border bg-card px-4 py-3 text-[13px] font-semibold text-muted-foreground hover:border-[#f58a2d] hover:bg-orange-tint-light transition-colors"
            >
              <CloudDownload className="h-4 w-4" />
              Tilføj kalenderkilde
            </button>

            {calendarSources.length === 0 ? (
              <p className="rounded-[8px] border border-dashed border-border bg-card p-4 text-center text-[12px] text-muted-foreground">
                Ingen kalenderkilder endnu. Tilføj en iCal/ICS-kilde fra Google, Outlook eller din arbejdskalender.
              </p>
            ) : (
              calendarSources.map((source) => (
                <div key={source.id} className="rounded-[8px] border border-border bg-card p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-foreground">{source.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {source.type === 'work' ? 'Arbejde' : source.type === 'personal' ? 'Privat' : source.type === 'school' ? 'Skole' : 'Andet'}
                        {source.lastSyncedAt
                          ? ` · synk: ${format(safeParse(source.lastSyncedAt) ?? new Date(), 'dd/MM HH:mm', { locale: da })}`
                          : ' · ikke synkroniseret endnu'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => void syncCalendarSource(source)}
                        className="flex h-8 w-8 items-center justify-center rounded-[8px] text-muted-foreground hover:bg-muted"
                      >
                        {syncingSourceId === source.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => removeCalendarSource(source.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-[8px] text-muted-foreground hover:text-rose-500 hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                    <label className="flex items-center gap-1.5">
                      <Checkbox
                        checked={source.enabled}
                        onCheckedChange={(checked) => {
                          updateCalendarSources(
                            calendarSources.map((item) =>
                              item.id === source.id ? { ...item, enabled: checked as boolean } : item
                            )
                          );
                        }}
                      />
                      Aktiv
                    </label>
                    <label className="flex items-center gap-1.5">
                      <Checkbox
                        checked={source.autoSync}
                        onCheckedChange={(checked) => {
                          updateCalendarSources(
                            calendarSources.map((item) =>
                              item.id === source.id ? { ...item, autoSync: checked as boolean } : item
                            )
                          );
                        }}
                      />
                      Auto-sync
                    </label>
                  </div>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Calendar Grid — iOS Calendar style */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="overflow-hidden rounded-[8px] border border-border bg-card">
          {/* Weekday headers */}
          <div className="grid grid-cols-[20px_repeat(7,1fr)] border-b border-border">
            <div />
            {weekdayNames.map((day, index) => (
              <div
                key={`${day}-${index}`}
                className={cn(
                  "py-1.5 text-center text-[11px] font-semibold",
                  index >= 5 ? "text-[#b0876a]" : "text-muted-foreground"
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar weeks with week numbers */}
          {(() => {
            const leadingEmpties = getDay(monthStart) === 0 ? 6 : getDay(monthStart) - 1;
            const allCells: (Date | null)[] = [
              ...Array.from({ length: leadingEmpties }, () => null),
              ...monthDays,
            ];
            const trailingEmpties = (7 - (allCells.length % 7)) % 7;
            allCells.push(...Array.from({ length: trailingEmpties }, () => null));

            const weeks: (Date | null)[][] = [];
            for (let i = 0; i < allCells.length; i += 7) {
              weeks.push(allCells.slice(i, i + 7));
            }

            return weeks.map((week, weekIdx) => {
              const firstDay = week.find(d => d !== null);
              const weekNum = firstDay ? getISOWeek(firstDay) : '';
              return (
                <div key={weekIdx} className="grid grid-cols-[20px_repeat(7,1fr)] border-b border-[#f0efe8] last:border-b-0">
                  {/* Week number */}
                  <div className="flex items-start justify-center pt-1.5 text-[9px] font-medium text-muted-foreground">
                    {weekNum}
                  </div>
                  {/* Day cells */}
                  {week.map((day, dayIdx) => {
                    if (!day) {
                      return <div key={`empty-${weekIdx}-${dayIdx}`} className="min-h-[88px] border-r border-border bg-card/50" />;
                    }
                    const dayEvents = getEventsForDay(day);
                    const dayIsToday = isSameDay(day, new Date());
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isWeekend = dayIdx >= 5;

                    return (
                      <div
                        key={day.toISOString()}
                        onClick={() => { setCalendarWeekViewDate(day); setActiveTab('kalender-week'); }}
                        className={cn(
                          "min-h-[88px] border-r border-border p-0.5 cursor-pointer transition-colors",
                          isWeekend && "bg-card/50",
                          isSelected && "bg-orange-tint-light"
                        )}
                      >
                        <div className="flex justify-center mb-0.5">
                          <div className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-[13px] font-semibold",
                            dayIsToday
                              ? "bg-[#f58a2d] text-white"
                              : isWeekend ? "text-[#b0876a]" : "text-foreground"
                          )}>
                            {format(day, 'd')}
                          </div>
                        </div>
                        <div className="space-y-px">
                          {dayEvents.slice(0, 3).map((event) => {
                            const color = getCustomEventColor(event.type);
                            return (
                              <div
                                key={event.id}
                                className="rounded-[3px] px-[3px] py-[1px] text-[7.5px] font-semibold leading-[1.2] truncate"
                                style={{
                                  backgroundColor: color + '20',
                                  color: color,
                                  borderLeft: `2px solid ${color}`,
                                }}
                                title={`${event.title} ${formatTime(event.startDate)}`}
                              >
                                {event.title}
                              </div>
                            );
                          })}
                          {dayEvents.length > 3 && (
                            <p className="text-[7px] text-center text-muted-foreground">+{dayEvents.length - 3}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            });
          })()}
        </div>
      </motion.div>

      {/* Selected Day Events */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {format(selectedDate, 'EEEE d. MMMM', { locale: da })}
                  </CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedDate(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {getEventsForDay(selectedDate).length === 0 ? (
                  <p className="text-center text-slate-400 py-4">Ingen aftaler denne dag</p>
                ) : (
                  <div className="space-y-2">
                    {getEventsForDay(selectedDate).map((event) => (
                      <button
                        key={event.id}
                        onClick={() => { setSelectedEvent(event); setEventDetailOpen(true); }}
                        className="flex w-full items-start gap-3 p-3 rounded-[8px] bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                      >
                        <div
                          className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                          style={{ backgroundColor: getCustomEventColor(event.type) }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900">{event.title}</p>
                          <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(event.startDate)}
                            </span>
                            {event.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {event.location}
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {getEventTypeLabel(event.type)}
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upcoming Events List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="rounded-[8px] border border-border bg-card px-4 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <p className="mb-3 text-[0.95rem] font-semibold tracking-[-0.01em] text-foreground">Kommende aftaler</p>
          <div className="space-y-2">
            {allUpcoming
              .slice(0, 4)
              .map((event) => (
                <button
                  key={event.id}
                  onClick={() => { setSelectedEvent(event); setEventDetailOpen(true); }}
                  className="flex w-full items-start gap-3 rounded-[8px] border border-[#f0efe8] bg-card px-3 py-2.5 text-left hover:bg-card transition-colors"
                >
                  <div className="flex flex-col items-center min-w-[38px]">
                    <span className="text-[9px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                      {format(safeParse(event.startDate) ?? new Date(), 'MMM', { locale: da })}
                    </span>
                    <span className="text-[18px] font-bold leading-tight text-foreground">
                      {format(safeParse(event.startDate) ?? new Date(), 'd')}
                    </span>
                  </div>
                  <div className="w-0.5 rounded-full self-stretch" style={{ backgroundColor: getCustomEventColor(event.type) }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-foreground">{event.title}</p>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatTime(event.startDate)}</span>
                      {event.location && (
                        <>
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{event.location}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-[8px] bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {getEventTypeLabel(event.type)}
                  </span>
                </button>
              ))}
            {allUpcoming.length === 0 && (
              <p className="py-4 text-center text-[12px] text-muted-foreground">Ingen kommende aftaler</p>
            )}
            {allUpcoming.length > 4 && (
              <button
                onClick={() => setAllUpcomingOpen(true)}
                className="w-full rounded-[8px] border border-border bg-card py-2 text-center text-[12px] font-semibold text-muted-foreground hover:bg-muted transition-colors"
              >
                Se alle ({allUpcoming.length} aftaler)
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Template create sheet */}
      <Sheet open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <SheetContent side="bottom" hideClose className="flex max-h-[85vh] flex-col rounded-t-[28px] border-border bg-background shadow-[0_-18px_40px_rgba(0,0,0,0.2)]">
          <div aria-hidden="true" className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted shrink-0" />
          <SheetHeader className="px-4 pb-2 shrink-0">
            <SheetTitle className="text-center text-[1.05rem] text-foreground">Ny skabelon</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom,0px)+24px)] space-y-2">
            <div className="space-y-1">
              <Label htmlFor="tpl-title" className="text-[12px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">Navn</Label>
              <Input
                id="tpl-title"
                value={newTemplate.title}
                onChange={e => setNewTemplate(prev => ({ ...prev, title: e.target.value }))}
                placeholder="f.eks. Fodboldtræning"
                className="rounded-[8px] border-border bg-card"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="tpl-type" className="text-[12px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">Type</Label>
                <SelectSheet
                  value={newTemplate.type}
                  onValueChange={v => setNewTemplate(prev => ({ ...prev, type: v as EventType }))}
                  title="Type"
                  options={eventTypes.filter(et => et.value !== 'all').map(et => ({ value: et.value, label: et.label }))}
                  className="rounded-[8px] border-border bg-card"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="tpl-duration" className="text-[12px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">Varighed (min)</Label>
                <Input
                  id="tpl-duration"
                  type="number"
                  min={5}
                  max={480}
                  value={newTemplate.duration}
                  onChange={e => {
                    const val = parseInt(e.target.value, 10);
                    if (isNaN(val)) return;
                    setNewTemplate(prev => ({ ...prev, duration: Math.max(5, Math.min(480, val)) }));
                  }}
                  className="rounded-[8px] border-border bg-card"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="tpl-location" className="text-[12px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">Sted (valgfrit)</Label>
              <Input
                id="tpl-location"
                value={newTemplate.location}
                onChange={e => setNewTemplate(prev => ({ ...prev, location: e.target.value }))}
                placeholder="f.eks. Idrætscenter"
                className="rounded-[8px] border-border bg-card"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1 rounded-[8px] border-border" onClick={() => setIsTemplateDialogOpen(false)}>
                Annuller
              </Button>
              <Button
                className="flex-1 rounded-[8px] bg-primary text-white hover:bg-primary"
                disabled={!newTemplate.title.trim()}
                onClick={() => {
                  const user = users.find(u => u.role === 'parent');
                  addEventTemplate({
                    id: templateId(),
                    title: newTemplate.title.trim(),
                    type: newTemplate.type,
                    duration: newTemplate.duration,
                    location: newTemplate.location.trim() || undefined,
                    createdBy: user?.id ?? '',
                    createdAt: new Date().toISOString(),
                  });
                  setIsTemplateDialogOpen(false);
                  setNewTemplate({ title: '', type: 'school', duration: 60, location: '' });
                  toast.success('Skabelon gemt');
                }}
              >
                Gem skabelon
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Template use configuration sheet */}
      <Sheet open={templateUseOpen} onOpenChange={setTemplateUseOpen}>
        <SheetContent side="bottom" hideClose className="flex max-h-[85vh] flex-col rounded-t-[28px] border-border bg-background shadow-[0_-18px_40px_rgba(0,0,0,0.2)]">
          <div aria-hidden="true" className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted shrink-0" />
          <SheetHeader className="px-4 pb-2 shrink-0">
            <SheetTitle className="text-center text-[1.05rem] text-foreground">
              Brug skabelon: {templateToUse?.title}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom,0px)+24px)] space-y-2">
            <div className="space-y-1">
              <Label htmlFor="tmpl-start" className="text-[12px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">Starttidspunkt</Label>
              <Input
                id="tmpl-start"
                type="datetime-local"
                value={templateStartTime}
                onChange={e => setTemplateStartTime(e.target.value)}
                className="rounded-[8px] border-border bg-card"
              />
            </div>
            {templateToUse && (
              <div className="rounded-[8px] border border-border bg-card px-3 py-2 text-[12px] text-foreground">
                Varighed: {templateToUse.duration} min
                {templateToUse.location ? ` · Sted: ${templateToUse.location}` : ''}
              </div>
            )}
            <label className="flex items-center gap-2.5 text-sm text-foreground">
              <Checkbox
                checked={templateNotifyPartner}
                onCheckedChange={(c) => setTemplateNotifyPartner(c as boolean)}
              />
              Send notifikation til partner
            </label>
            <label className="flex items-center gap-2.5 text-sm text-foreground">
              <Checkbox
                checked={templateStartTimer}
                onCheckedChange={(c) => setTemplateStartTimer(c as boolean)}
              />
              <span className="flex items-center gap-1">
                <Timer className="h-3.5 w-3.5" />
                Start timer ({templateToUse?.duration ?? 0} min)
              </span>
            </label>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1 rounded-[8px] border-border" onClick={() => setTemplateUseOpen(false)}>
                Annuller
              </Button>
              <Button
                className="flex-1 rounded-[8px] bg-[#f58a2d] text-white hover:bg-[#e47921]"
                onClick={handleConfirmTemplateUse}
                disabled={!templateStartTime}
              >
                Opret aftale
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Calendar Source Sheet */}
      <Sheet open={isSourceDialogOpen} onOpenChange={setIsSourceDialogOpen}>
        <SheetContent side="bottom" hideClose className="flex max-h-[85vh] flex-col rounded-t-[28px] border-border bg-background shadow-[0_-18px_40px_rgba(0,0,0,0.2)]">
          <div aria-hidden="true" className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted shrink-0" />
          <SheetHeader className="px-4 pb-2 shrink-0">
            <SheetTitle className="text-center text-[1.05rem] text-foreground">Tilføj kalenderkilde</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom,0px)+24px)] space-y-2">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Navn</Label>
                <Input
                  value={newCalendarSource.name}
                  onChange={(e) => setNewCalendarSource((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Fx Arbejdskalender"
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <SelectSheet
                  value={newCalendarSource.type}
                  onValueChange={(value) => setNewCalendarSource((prev) => ({ ...prev, type: value as CalendarSourceType }))}
                  title="Type"
                  options={[
                    { value: 'work', label: 'Arbejde' },
                    { value: 'personal', label: 'Privat' },
                    { value: 'school', label: 'Skole' },
                    { value: 'other', label: 'Andet' },
                  ]}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>iCal URL (ICS)</Label>
              <Input
                value={newCalendarSource.url}
                onChange={(e) => setNewCalendarSource((prev) => ({ ...prev, url: e.target.value }))}
                placeholder="https://.../calendar.ics"
              />
              <p className="text-xs text-muted-foreground">
                Brug en iCal/ICS-link fra fx Google, Outlook eller din arbejdskalender.
              </p>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <Checkbox
                  checked={newCalendarSource.enabled}
                  onCheckedChange={(checked) => setNewCalendarSource((prev) => ({ ...prev, enabled: checked as boolean }))}
                />
                Kilde aktiv
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <Checkbox
                  checked={newCalendarSource.autoSync}
                  onCheckedChange={(checked) => setNewCalendarSource((prev) => ({ ...prev, autoSync: checked as boolean }))}
                />
                Automatisk synkronisering (hvert 5. minut)
              </label>
            </div>
            <Button onClick={addCalendarSource} className="w-full">
              <Link2 className="w-4 h-4 mr-2" />
              Tilføj kalenderkilde
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Color Configuration Sheet */}
      <Sheet open={isColorDialogOpen} onOpenChange={(open) => { setIsColorDialogOpen(open); if (!open) setColorEditCategory(null); }}>
        <SheetContent side="bottom" hideClose className="flex max-h-[85vh] flex-col rounded-t-[28px] border-border bg-background shadow-[0_-18px_40px_rgba(0,0,0,0.2)]">
          <div aria-hidden="true" className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted shrink-0" />
          <SheetHeader className="px-4 pb-2 shrink-0">
            <SheetTitle className="text-center text-[1.05rem] text-foreground">
              {colorEditCategory ? (
                <button
                  onClick={() => setColorEditCategory(null)}
                  className="flex items-center gap-1.5 mx-auto text-[1rem] font-semibold text-foreground hover:text-[#f58a2d] transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  {eventTypes.find(t => t.value === colorEditCategory)?.label ?? 'Kategori'}
                </button>
              ) : 'Tilpas kategorifarver'}
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom,0px)+24px)]">
          {!colorEditCategory ? (
            /* Category list view */
            <div className="space-y-1">
              {eventTypes.filter(t => t.value !== 'all').map(type => {
                const Icon = type.icon;
                const currentColor = getCustomEventColor(type.value);
                return (
                  <button
                    key={type.value}
                    onClick={() => setColorEditCategory(type.value)}
                    className="flex w-full items-center gap-3 rounded-[8px] px-3 py-2.5 text-left transition-colors hover:bg-muted"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-[8px]" style={{ backgroundColor: currentColor + '22' }}>
                      <Icon className="h-4 w-4" style={{ color: currentColor }} />
                    </div>
                    <span className="flex-1 text-sm font-medium text-foreground">{type.label}</span>
                    <div className="h-5 w-5 rounded-full border border-border" style={{ backgroundColor: currentColor }} />
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                );
              })}
              <div className="flex gap-2 pt-3">
                <Button
                  variant="outline"
                  className="flex-1 rounded-[8px] border-border text-[12px]"
                  onClick={() => setIsColorDialogOpen(false)}
                >
                  Annuller
                </Button>
                <Button
                  className="flex-1 rounded-[8px] bg-primary text-white hover:bg-primary text-[12px]"
                  onClick={() => { toast.success('Farver gemt'); setIsColorDialogOpen(false); }}
                >
                  Gem farver
                </Button>
              </div>
            </div>
          ) : (
            /* Color picker for the selected category */
            (() => {
              const selectedType = eventTypes.find(t => t.value === colorEditCategory);
              const Icon = selectedType?.icon ?? Calendar;
              const currentColor = getCustomEventColor(colorEditCategory);
              return (
                <div className="space-y-2">
                  {/* Preview */}
                  <div className="flex flex-col items-center gap-2 py-2">
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-[8px] transition-colors"
                      style={{ backgroundColor: currentColor + '22' }}
                    >
                      <Icon className="h-7 w-7 transition-colors" style={{ color: currentColor }} />
                    </div>
                    <span className="text-xs text-muted-foreground">{currentColor}</span>
                  </div>

                  {/* Color grid */}
                  <div className="flex flex-wrap justify-center gap-2.5">
                    {COLOR_PALETTE.map(color => (
                      <button
                        key={color}
                        onClick={() => setCalendarColorPreference(colorEditCategory, color)}
                        className={cn(
                          "w-9 h-9 rounded-[8px] transition-all",
                          currentColor === color
                            ? "ring-2 ring-ring ring-offset-2 ring-offset-[#faf9f6] scale-110"
                            : "hover:scale-110"
                        )}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>

                  {/* Back / Done buttons */}
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      className="flex-1 rounded-[8px] border-border text-[12px]"
                      onClick={() => setColorEditCategory(null)}
                    >
                      ← Tilbage
                    </Button>
                    <Button
                      className="flex-1 rounded-[8px] bg-primary text-white hover:bg-primary text-[12px]"
                      onClick={() => { setColorEditCategory(null); setIsColorDialogOpen(false); }}
                    >
                      Færdig
                    </Button>
                  </div>
                </div>
              );
            })()
          )}
          </div>
        </SheetContent>
      </Sheet>

      {/* All Upcoming Events Sheet */}
      <Sheet open={allUpcomingOpen} onOpenChange={setAllUpcomingOpen}>
        <SheetContent side="bottom" hideClose className="flex max-h-[85vh] flex-col rounded-t-[28px] border-border bg-background shadow-[0_-18px_40px_rgba(0,0,0,0.2)]">
          <div aria-hidden="true" className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted shrink-0" />
          <SheetHeader className="px-4 pb-2 shrink-0">
            <SheetTitle className="text-center text-[1.05rem] text-foreground">
              Alle kommende aftaler ({allUpcoming.length})
            </SheetTitle>
          </SheetHeader>
          <p className="px-4 pb-1 text-[11px] text-muted-foreground">Swipe til venstre for at slette</p>
          <div className="flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom,0px)+24px)] space-y-2">
            {allUpcoming.map(event => (
              <SwipeableEventRow
                key={event.id}
                eventId={event.id}
                onDelete={() => { void deleteEvent(event.id); toast.success('Aftale slettet'); }}
              >
                <button
                  onClick={() => { setSelectedEvent(event); setEventDetailOpen(true); setAllUpcomingOpen(false); }}
                  className="flex w-full items-start gap-3 rounded-[8px] border border-[#f0efe8] bg-card px-3 py-2.5 text-left hover:bg-card transition-colors"
                >
                  <div className="flex flex-col items-center min-w-[38px]">
                    <span className="text-[9px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                      {format(safeParse(event.startDate) ?? new Date(), 'MMM', { locale: da })}
                    </span>
                    <span className="text-[18px] font-bold leading-tight text-foreground">
                      {format(safeParse(event.startDate) ?? new Date(), 'd')}
                    </span>
                  </div>
                  <div className="w-0.5 rounded-full self-stretch" style={{ backgroundColor: getCustomEventColor(event.type) }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-foreground">{event.title}</p>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatTime(event.startDate)}</span>
                      {event.location && (
                        <>
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{event.location}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-[8px] bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {getEventTypeLabel(event.type)}
                  </span>
                </button>
              </SwipeableEventRow>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Event Detail Sheet */}
      <Sheet open={eventDetailOpen} onOpenChange={setEventDetailOpen}>
        <SheetContent side="bottom" hideClose className="flex max-h-[85vh] flex-col rounded-t-[28px] border-border bg-background shadow-[0_-18px_40px_rgba(0,0,0,0.2)]">
          <div aria-hidden="true" className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted shrink-0" />
          <SheetHeader className="px-4 pb-2 shrink-0">
            <SheetTitle className="text-center text-[1.05rem] text-foreground">Aftaledetaljer</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom,0px)+24px)]">
          {selectedEvent && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getCustomEventColor(selectedEvent.type) }} />
                <p className="text-[15px] font-semibold text-foreground">{selectedEvent.title}</p>
              </div>
              <div className="rounded-[8px] border border-border bg-card p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {format(safeParse(selectedEvent.startDate) ?? new Date(), 'EEEE d. MMMM yyyy · HH:mm', { locale: da })}
                    {selectedEvent.endDate && selectedEvent.endDate !== selectedEvent.startDate && (
                      <> – {format(safeParse(selectedEvent.endDate) ?? new Date(), 'HH:mm', { locale: da })}</>
                    )}
                  </span>
                </div>
                {selectedEvent.location && (
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{getEventTypeLabel(selectedEvent.type)}</span>
                </div>
              </div>
              {selectedEvent.description && (
                <div className="rounded-[8px] border border-border bg-card p-3">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-muted-foreground mb-1">Beskrivelse</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{selectedEvent.description}</p>
                </div>
              )}
              {selectedEvent.createdBy && (
                <p className="text-[11px] text-muted-foreground">
                  Oprettet af {users.find(u => u.id === selectedEvent.createdBy)?.name ?? 'ukendt'}
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-[8px] border-red-200 text-red-600 hover:bg-red-50"
                  onClick={() => {
                    if (selectedEvent) {
                      void deleteEvent(selectedEvent.id);
                      toast.success('Aftale slettet');
                      setEventDetailOpen(false);
                      setSelectedEvent(null);
                    }
                  }}
                >
                  <Trash2 className="mr-1.5 h-4 w-4" />
                  Slet
                </Button>
                <Button
                  className="flex-1 rounded-[8px] bg-primary text-white hover:bg-primary"
                  onClick={() => setEventDetailOpen(false)}
                >
                  Luk
                </Button>
              </div>
            </div>
          )}
          </div>
        </SheetContent>
      </Sheet>
      <SavingOverlay open={isSaving} />
    </div>
  );
}
