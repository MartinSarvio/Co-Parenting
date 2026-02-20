import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/store';
import { eventId, calendarSourceId, templateId } from '@/lib/id';
import { cn, formatTime, getEventTypeLabel } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { getPlanFeatures } from '@/lib/subscription';
import type { CalendarEvent, EventType } from '@/types';

import {
  CloudDownload,
  ChevronLeft,
  ChevronRight,
  Link2,
  Loader2,
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
  Palette,
  Timer,
  UserCircle,
  ChevronDown,
  Lock,
  Share2,
  Users,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isSameDay, parseISO, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
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
    <div key={eId} className="relative overflow-hidden rounded-xl">
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
        className="relative z-10 bg-white"
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
  { value: 'all', label: 'Alle', color: 'bg-[#8b8677]', icon: Calendar },
  { value: 'school', label: 'Skole', color: 'bg-[#2f2f2f]', icon: GraduationCap },
  { value: 'activity', label: 'Aktivitet', color: 'bg-[#8b8677]', icon: Zap },
  { value: 'handover', label: 'Aflevering', color: 'bg-[#f58a2d]', icon: UserCircle },
  { value: 'appointment', label: 'Aftale', color: 'bg-[#4a90d9]', icon: Calendar },
  { value: 'work', label: 'Arbejde', color: 'bg-[#4d4a42]', icon: Briefcase },
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
    events, users, children, currentUser, addEvent, updateEvent, deleteEvent, household, setHousehold,
    eventTemplates, addEventTemplate, deleteEventTemplate,
    calendarColorPreferences, setCalendarColorPreference, resetCalendarColorPreferences,
    calendarSharing, requestCalendarSharing, respondToCalendarSharing,
  } = useAppStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const syncCalendarSourceRef = useRef<
    ((source: { id: string; name: string; type: CalendarSourceType; url: string; enabled: boolean; autoSync: boolean; lastSyncedAt?: string }, showToast?: boolean) => Promise<void>) | null
  >(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filter, setFilter] = useState('all');
  const [personFilter, setPersonFilter] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSourceDialogOpen, setIsSourceDialogOpen] = useState(false);
  const [syncingSourceId, setSyncingSourceId] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    type: 'school',
    startDate: '',
    endDate: '',
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
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [allUpcomingOpen, setAllUpcomingOpen] = useState(false);
  const [eventDetailOpen, setEventDetailOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [templateUseOpen, setTemplateUseOpen] = useState(false);
  const [templateToUse, setTemplateToUse] = useState<typeof eventTemplates[0] | null>(null);
  const [templateStartTime, setTemplateStartTime] = useState('');
  const [templateNotifyPartner, setTemplateNotifyPartner] = useState(false);
  const [templateStartTimer, setTemplateStartTimer] = useState(false);

  const _features = getPlanFeatures(household);
  void _features;
  const currentChild = children[0];
  const warmParent = users.find((user) => user.role === 'parent' && user.color === 'warm');
  const coolParent = users.find((user) => user.role === 'parent' && user.color === 'cool');
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

  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return events.filter(e => {
      const eventDate = parseISO(e.startDate);
      if (!isSameDay(eventDate, day)) return false;
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

  // Navigate months
  const goToPreviousMonth = () => setCurrentDate(addMonths(currentDate, -1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Get weekday names starting from Monday
  const weekdayNames = ['Man', 'Tirs', 'Ons', 'Tors', 'Fre', 'Lør', 'Søn'];

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
          updateEvent(existingEvent.id, payload);
          updatedCount += 1;
          return;
        }

        addEvent({
          id: `ext-${source.id}-${encodeURIComponent(externalEvent.uid)}`,
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
      .forEach((event) => deleteEvent(event.id));
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

  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.startDate) return;

    addEvent({
      id: eventId(),
      title: newEvent.title,
      type: newEvent.type as EventType,
      startDate: new Date(newEvent.startDate).toISOString(),
      endDate: newEvent.endDate
        ? new Date(newEvent.endDate).toISOString()
        : new Date(newEvent.startDate).toISOString(),
      location: newEvent.location,
      description: newEvent.description,
      createdBy: users[0]?.id || 'u1',
      childId: currentChild?.id,
    });

    setIsAddDialogOpen(false);
    setNewEvent({
      title: '',
      type: 'school',
      startDate: '',
      endDate: '',
      location: '',
      description: '',
    });
  };

  // All upcoming events (hide partner events when sharing not accepted)
  const allUpcoming = events
    .filter(e => {
      if (parseISO(e.startDate) < new Date()) return false;
      if (!canSeePartnerEvents && otherParent && e.createdBy === otherParent.id) return false;
      return true;
    })
    .sort((a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime());

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
  const handleConfirmTemplateUse = () => {
    if (!templateToUse || !templateStartTime) return;
    const start = new Date(templateStartTime);
    const endDate = new Date(start.getTime() + templateToUse.duration * 60000);
    const user = users.find(u => u.role === 'parent');
    addEvent({
      id: eventId(),
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
    <div className="space-y-4 p-1">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-[1.3rem] font-semibold leading-tight text-[#2f2f2d]">Fælles kalender</h1>
          <p className="text-xs text-[#75736b]">Koordiner aktiviteter og aftaler</p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <Dialog open={isSourceDialogOpen} onOpenChange={setIsSourceDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-10 flex-1 sm:flex-none">
                <CloudDownload className="w-4 h-4 mr-2" />
                Synk kalender
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Eksterne kalenderkilder</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
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
                    <Select
                      value={newCalendarSource.type}
                      onValueChange={(value: CalendarSourceType) => setNewCalendarSource((prev) => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="work">Arbejde</SelectItem>
                        <SelectItem value="personal">Privat</SelectItem>
                        <SelectItem value="school">Skole</SelectItem>
                        <SelectItem value="other">Andet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>iCal URL (ICS)</Label>
                  <Input
                    value={newCalendarSource.url}
                    onChange={(e) => setNewCalendarSource((prev) => ({ ...prev, url: e.target.value }))}
                    placeholder="https://.../calendar.ics"
                  />
                  <p className="text-xs text-slate-500">
                    Brug en iCal/ICS-link fra fx Google, Outlook eller din arbejdskalender.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <Checkbox
                      checked={newCalendarSource.enabled}
                      onCheckedChange={(checked) => setNewCalendarSource((prev) => ({ ...prev, enabled: checked as boolean }))}
                    />
                    Kilde aktiv
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700">
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

                <div className="space-y-2">
                  {calendarSources.length === 0 && (
                    <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-500">
                      Ingen kalenderkilder endnu.
                    </p>
                  )}
                  {calendarSources.map((source) => (
                    <div key={source.id} className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-slate-900">{source.name}</p>
                          <p className="text-xs text-slate-500">
                            {source.type === 'work' ? 'Arbejde' : source.type === 'personal' ? 'Privat' : source.type === 'school' ? 'Skole' : 'Andet'}
                            {source.lastSyncedAt
                              ? ` · synk: ${format(parseISO(source.lastSyncedAt), 'dd/MM HH:mm', { locale: da })}`
                              : ' · ikke synkroniseret endnu'}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => {
                              void syncCalendarSource(source);
                            }}
                          >
                            {syncingSourceId === source.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            className="text-[#d37628] hover:text-[#b7621b]"
                            onClick={() => removeCalendarSource(source.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-xs text-slate-600">
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
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-10 flex-1 bg-[#f58a2d] text-white hover:bg-[#e47921] sm:flex-none">
                <Plus className="w-4 h-4 mr-2" />
                Ny aftale
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Tilføj ny aftale</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
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
                  <Select
                    value={newEvent.type}
                    onValueChange={(v) => setNewEvent({...newEvent, type: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypes.filter(t => t.value !== 'all').map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getEventInlineColor(type.value) }} />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start</Label>
                    <Input
                      type="datetime-local"
                      value={newEvent.startDate}
                      onChange={(e) => setNewEvent({...newEvent, startDate: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Slut</Label>
                    <Input
                      type="datetime-local"
                      value={newEvent.endDate}
                      onChange={(e) => setNewEvent({...newEvent, endDate: e.target.value})}
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
                <Button onClick={handleAddEvent} className="w-full">
                  Tilføj aftale
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Person filter dropdown + calendar sharing gate */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="flex items-center gap-2"
      >
        <Select
          value={personFilter ?? 'all'}
          onValueChange={(v) => setPersonFilter(v === 'all' ? null : v)}
        >
          <SelectTrigger className="h-10 flex-1 rounded-xl border-[#d8d7cf] bg-white text-sm font-medium text-[#2f2f2d]">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[#78766d]" />
              <SelectValue placeholder="Alle personer" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#8b8677]" />
                Alle
              </div>
            </SelectItem>
            {coolParent && (
              <SelectItem value={coolParent.id}>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-[#2f2f2f]" />
                  {coolParent.name}
                </div>
              </SelectItem>
            )}
            {warmParent && canSeePartnerEvents && (
              <SelectItem value={warmParent.id}>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-[#f58a2d]" />
                  {warmParent.name}
                </div>
              </SelectItem>
            )}
          </SelectContent>
        </Select>

        {/* Calendar sharing prompt for separated families */}
        {!isTogether && !isSharingAccepted && (
          <button
            onClick={() => {
              if (!isSharingPending && currentUser) {
                requestCalendarSharing(currentUser.id);
                toast.info('Anmodning om kalenderdeling sendt til din partner');
              }
            }}
            className={cn(
              "flex h-10 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-colors whitespace-nowrap",
              isSharingPending
                ? "border-[#f3c59d] bg-[#fff8f0] text-[#cc6f1f]"
                : "border-[#d8d7cf] bg-white text-[#78766d] hover:bg-[#faf9f6]"
            )}
            title={isSharingPending ? 'Afventer accept fra partner' : 'Anmod om kalenderdeling'}
          >
            {isSharingPending ? (
              <>
                <Clock className="h-3.5 w-3.5" />
                Afventer
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5" />
                Del kalender
              </>
            )}
          </button>
        )}
      </motion.div>

      {/* Calendar sharing invitation banner (if pending and current user didn't request) */}
      {!isTogether && isSharingPending && calendarSharing?.requestedBy !== currentUser?.id && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-[#f3c59d] bg-[#fff8f0] p-3"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f58a2d]/10">
              <Share2 className="h-4 w-4 text-[#f58a2d]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[#2f2f2d]">Anmodning om kalenderdeling</p>
              <p className="text-[11px] text-[#78766d] mt-0.5">
                {users.find(u => u.id === calendarSharing.requestedBy)?.name ?? 'Din partner'} ønsker at dele kalender med dig.
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => { respondToCalendarSharing(true); toast.success('Kalenderdeling accepteret'); }}
                  className="rounded-lg bg-[#f58a2d] px-3 py-1 text-[11px] font-semibold text-white hover:bg-[#e47921]"
                >
                  Acceptér
                </button>
                <button
                  onClick={() => { respondToCalendarSharing(false); toast.info('Kalenderdeling afvist'); }}
                  className="rounded-lg border border-[#d8d7cf] bg-white px-3 py-1 text-[11px] font-semibold text-[#4a4945] hover:bg-[#faf9f6]"
                >
                  Afvis
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Partner events hidden notice */}
      {!isTogether && !canSeePartnerEvents && otherParent && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2.5 rounded-xl border border-[#e8e7e0] bg-[#faf9f6] px-3 py-2"
        >
          <Lock className="h-4 w-4 shrink-0 text-[#a09e96]" />
          <p className="text-[11px] text-[#78766d]">
            {otherParent.name}s kalender er skjult. Del kalender for at se hinandens aftaler.
          </p>
        </motion.div>
      )}

      {/* Month Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center justify-between bg-white rounded-xl border border-slate-200 p-2"
      >
        <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="text-center">
          <p className="font-semibold text-slate-900">
            {format(currentDate, 'MMMM yyyy', { locale: da })}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={goToToday}>
            I dag
          </Button>
          <Button variant="ghost" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </motion.div>

      {/* Filter dropdown + Palette button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex items-center gap-2"
      >
        <div className="relative flex-1">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex w-full items-center justify-between rounded-xl border border-[#d8d7cf] bg-white px-3 py-2.5 text-sm font-medium text-[#2f2f2d] hover:bg-[#faf9f6] transition-colors"
          >
            <span className="flex items-center gap-2">
              {(() => {
                const activeType = eventTypes.find(t => t.value === filter);
                if (!activeType) return null;
                const Icon = activeType.icon;
                return (
                  <>
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: filter === 'all' ? '#8b8677' : getCustomEventColor(filter) }} />
                    <Icon className="h-4 w-4 text-[#78766d]" />
                    {activeType.label}
                  </>
                );
              })()}
            </span>
            <ChevronDown className={cn("h-4 w-4 text-[#78766d] transition-transform", isFilterOpen && "rotate-180")} />
          </button>
          {isFilterOpen && (
            <div className="absolute z-20 mt-1 w-full rounded-xl border border-[#d8d7cf] bg-white py-1 shadow-lg">
              {eventTypes.map(type => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    onClick={() => { setFilter(type.value); setIsFilterOpen(false); }}
                    className={cn(
                      "flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors",
                      filter === type.value ? "bg-[#f0efe8] font-semibold text-[#2f2f2d]" : "text-[#4a4945] hover:bg-[#faf9f6]"
                    )}
                  >
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: type.value === 'all' ? '#8b8677' : getCustomEventColor(type.value) }} />
                    <Icon className="h-4 w-4" />
                    {type.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <button
          onClick={() => setIsColorDialogOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d8d7cf] bg-white text-[#78766d] hover:bg-[#faf9f6] transition-colors"
          title="Tilpas farver"
        >
          <Palette className="h-4 w-4" />
        </button>
      </motion.div>

      {/* Calendar Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-slate-200 overflow-hidden">
          <CardContent className="p-0">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 border-b border-slate-100">
              {weekdayNames.map((day, index) => (
                <div
                  key={day}
                  className={cn(
                    "py-2 text-center text-sm font-medium",
                    index >= 5 ? "text-[#d37628]" : "text-slate-600"
                  )}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7">
              {Array.from({ length: getDay(monthStart) === 0 ? 6 : getDay(monthStart) - 1 }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[80px] border-b border-r border-slate-50 bg-slate-50/30" />
              ))}
              {monthDays.map((day) => {
                const dayEvents = getEventsForDay(day);
                const isToday = isSameDay(day, new Date());
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isWeekend = getDay(day) === 0 || getDay(day) === 6;

                return (
                  <div
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "min-h-[80px] p-1 border-b border-r border-slate-100 cursor-pointer transition-colors hover:bg-slate-50",
                      isWeekend && "bg-slate-50/30",
                      isSelected && "bg-[#fff2e6]"
                    )}
                  >
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium mb-1",
                      isToday
                        ? "bg-[#f58a2d] text-white"
                        : "text-slate-700"
                    )}>
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          className="h-1.5 rounded-full"
                          style={{ backgroundColor: getCustomEventColor(event.type) }}
                        />
                      ))}
                      {dayEvents.length > 2 && (
                        <p className="text-xs text-slate-400">+{dayEvents.length - 2}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
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
                  <div className="space-y-3">
                    {getEventsForDay(selectedDate).map((event) => (
                      <button
                        key={event.id}
                        onClick={() => { setSelectedEvent(event); setEventDetailOpen(true); }}
                        className="flex w-full items-start gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-left"
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
        <div className="rounded-2xl border border-[#e8e7e0] bg-white px-4 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <p className="mb-3 text-[0.95rem] font-semibold tracking-[-0.01em] text-[#2f2f2d]">Kommende aftaler</p>
          <div className="space-y-2">
            {allUpcoming
              .slice(0, 4)
              .map((event) => (
                <button
                  key={event.id}
                  onClick={() => { setSelectedEvent(event); setEventDetailOpen(true); }}
                  className="flex w-full items-start gap-3 rounded-xl border border-[#f0efe8] bg-[#faf9f6] px-3 py-2.5 text-left hover:bg-[#f5f4ef] transition-colors"
                >
                  <div className="flex flex-col items-center min-w-[38px]">
                    <span className="text-[9px] font-semibold uppercase tracking-[0.05em] text-[#78766d]">
                      {format(parseISO(event.startDate), 'MMM', { locale: da })}
                    </span>
                    <span className="text-[18px] font-bold leading-tight text-[#2f2f2d]">
                      {format(parseISO(event.startDate), 'd')}
                    </span>
                  </div>
                  <div className="w-0.5 rounded-full self-stretch" style={{ backgroundColor: getCustomEventColor(event.type) }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#2f2f2d]">{event.title}</p>
                    <div className="flex items-center gap-2 text-[11px] text-[#78766d]">
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
                  <span className="shrink-0 rounded-lg bg-[#ecebe5] px-2 py-0.5 text-[10px] font-semibold text-[#5f5d56]">
                    {getEventTypeLabel(event.type)}
                  </span>
                </button>
              ))}
            {allUpcoming.length === 0 && (
              <p className="py-4 text-center text-[12px] text-[#78766d]">Ingen kommende aftaler</p>
            )}
            {allUpcoming.length > 4 && (
              <button
                onClick={() => setAllUpcomingOpen(true)}
                className="w-full rounded-xl border border-[#d8d7cf] bg-[#faf9f6] py-2 text-center text-[12px] font-semibold text-[#5f5d56] hover:bg-[#f0efe8] transition-colors"
              >
                Se alle ({allUpcoming.length} aftaler)
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Event templates */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <div className="rounded-2xl border border-[#e8e7e0] bg-white px-4 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[0.95rem] font-semibold tracking-[-0.01em] text-[#2f2f2d]">Aftale-skabeloner</p>
            <button
              onClick={() => setIsTemplateDialogOpen(true)}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ecebe5] text-[#5f5d56] hover:bg-[#e0deda]"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {eventTemplates.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <LayoutTemplate className="h-8 w-8 text-[#c8c6bc]" />
              <p className="text-[12px] text-[#78766d]">Ingen skabeloner endnu. Tilføj genbrugelige aftaletyper.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {eventTemplates.map(tmpl => (
                <div key={tmpl.id} className="flex items-center justify-between rounded-xl border border-[#f0efe8] bg-[#faf9f6] px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#2f2f2d]">{tmpl.title}</p>
                    <p className="text-[11px] text-[#78766d]">
                      {getEventTypeLabel(tmpl.type)} · {tmpl.duration} min{tmpl.location ? ` · ${tmpl.location}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUseTemplate(tmpl)}
                      className="rounded-lg bg-[#ecebe5] px-2.5 py-1 text-[11px] font-semibold text-[#3f3e3a] hover:bg-[#e0deda]"
                    >
                      Brug
                    </button>
                    <button
                      onClick={() => { deleteEventTemplate(tmpl.id); toast.success('Skabelon slettet'); }}
                      className="rounded-full p-1 text-[#c8c6bc] hover:text-rose-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Template create dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="max-w-sm rounded-3xl border-[#d8d7cf] bg-[#faf9f6]">
          <DialogHeader>
            <DialogTitle className="text-[1rem] tracking-[-0.01em] text-[#2f2f2d]">Ny skabelon</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="tpl-title" className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#78766d]">Navn</Label>
              <Input
                id="tpl-title"
                value={newTemplate.title}
                onChange={e => setNewTemplate(prev => ({ ...prev, title: e.target.value }))}
                placeholder="f.eks. Fodboldtræning"
                className="rounded-xl border-[#d8d7cf] bg-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="tpl-type" className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#78766d]">Type</Label>
                <Select value={newTemplate.type} onValueChange={v => setNewTemplate(prev => ({ ...prev, type: v as EventType }))}>
                  <SelectTrigger id="tpl-type" className="rounded-xl border-[#d8d7cf] bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.filter(et => et.value !== 'all').map(et => (
                      <SelectItem key={et.value} value={et.value}>{et.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="tpl-duration" className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#78766d]">Varighed (min)</Label>
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
                  className="rounded-xl border-[#d8d7cf] bg-white"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="tpl-location" className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#78766d]">Sted (valgfrit)</Label>
              <Input
                id="tpl-location"
                value={newTemplate.location}
                onChange={e => setNewTemplate(prev => ({ ...prev, location: e.target.value }))}
                placeholder="f.eks. Idrætscenter"
                className="rounded-xl border-[#d8d7cf] bg-white"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1 rounded-2xl border-[#d8d7cf]" onClick={() => setIsTemplateDialogOpen(false)}>
                Annuller
              </Button>
              <Button
                className="flex-1 rounded-2xl bg-[#2f2f2f] text-white hover:bg-[#1a1a1a]"
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
        </DialogContent>
      </Dialog>

      {/* Template use configuration dialog */}
      <Dialog open={templateUseOpen} onOpenChange={setTemplateUseOpen}>
        <DialogContent className="max-w-sm rounded-3xl border-[#d8d7cf] bg-[#faf9f6]">
          <DialogHeader>
            <DialogTitle className="text-[1rem] tracking-[-0.01em] text-[#2f2f2d]">
              Brug skabelon: {templateToUse?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="tmpl-start" className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#78766d]">Starttidspunkt</Label>
              <Input
                id="tmpl-start"
                type="datetime-local"
                value={templateStartTime}
                onChange={e => setTemplateStartTime(e.target.value)}
                className="rounded-xl border-[#d8d7cf] bg-white"
              />
            </div>
            {templateToUse && (
              <div className="rounded-xl border border-[#e8e7e0] bg-white px-3 py-2 text-[12px] text-[#4a4945]">
                Varighed: {templateToUse.duration} min
                {templateToUse.location ? ` · Sted: ${templateToUse.location}` : ''}
              </div>
            )}
            <label className="flex items-center gap-2.5 text-sm text-[#2f2f2d]">
              <Checkbox
                checked={templateNotifyPartner}
                onCheckedChange={(c) => setTemplateNotifyPartner(c as boolean)}
              />
              Send notifikation til partner
            </label>
            <label className="flex items-center gap-2.5 text-sm text-[#2f2f2d]">
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
              <Button variant="outline" className="flex-1 rounded-2xl border-[#d8d7cf]" onClick={() => setTemplateUseOpen(false)}>
                Annuller
              </Button>
              <Button
                className="flex-1 rounded-2xl bg-[#f58a2d] text-white hover:bg-[#e47921]"
                onClick={handleConfirmTemplateUse}
                disabled={!templateStartTime}
              >
                Opret aftale
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Color Configuration Dialog */}
      <Dialog open={isColorDialogOpen} onOpenChange={(open) => { setIsColorDialogOpen(open); if (!open) setColorEditCategory(null); }}>
        <DialogContent className="max-w-sm rounded-3xl border-[#d8d7cf] bg-[#faf9f6]">
          <DialogHeader>
            <DialogTitle className="text-[1rem] tracking-[-0.01em] text-[#2f2f2d]">
              {colorEditCategory ? (
                <button
                  onClick={() => setColorEditCategory(null)}
                  className="flex items-center gap-1.5 text-[1rem] font-semibold text-[#2f2f2d] hover:text-[#f58a2d] transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  {eventTypes.find(t => t.value === colorEditCategory)?.label ?? 'Kategori'}
                </button>
              ) : 'Tilpas kategorifarver'}
            </DialogTitle>
          </DialogHeader>

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
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-[#f0efe8]"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: currentColor + '22' }}>
                      <Icon className="h-4 w-4" style={{ color: currentColor }} />
                    </div>
                    <span className="flex-1 text-sm font-medium text-[#2f2f2d]">{type.label}</span>
                    <div className="h-5 w-5 rounded-full border border-[#e0dfd8]" style={{ backgroundColor: currentColor }} />
                    <ChevronRight className="h-4 w-4 text-[#a3a299]" />
                  </button>
                );
              })}
              <div className="flex gap-2 pt-3">
                <Button
                  variant="outline"
                  className="flex-1 rounded-2xl border-[#d8d7cf] text-[12px]"
                  onClick={() => { resetCalendarColorPreferences(); toast.success('Farver nulstillet'); }}
                >
                  Nulstil alle farver
                </Button>
                <Button
                  className="flex-1 rounded-2xl bg-[#2f2f2f] text-white hover:bg-[#1a1a1a] text-[12px]"
                  onClick={() => setIsColorDialogOpen(false)}
                >
                  Færdig
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
                <div className="space-y-4">
                  {/* Preview */}
                  <div className="flex flex-col items-center gap-2 py-2">
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-2xl transition-colors"
                      style={{ backgroundColor: currentColor + '22' }}
                    >
                      <Icon className="h-7 w-7 transition-colors" style={{ color: currentColor }} />
                    </div>
                    <span className="text-xs text-[#8a897e]">{currentColor}</span>
                  </div>

                  {/* Color grid */}
                  <div className="flex flex-wrap justify-center gap-2.5">
                    {COLOR_PALETTE.map(color => (
                      <button
                        key={color}
                        onClick={() => setCalendarColorPreference(colorEditCategory, color)}
                        className={cn(
                          "w-9 h-9 rounded-xl transition-all",
                          currentColor === color
                            ? "ring-2 ring-[#f58a2d] ring-offset-2 ring-offset-[#faf9f6] scale-110"
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
                      className="flex-1 rounded-2xl border-[#d8d7cf] text-[12px]"
                      onClick={() => setColorEditCategory(null)}
                    >
                      ← Tilbage
                    </Button>
                    <Button
                      className="flex-1 rounded-2xl bg-[#2f2f2f] text-white hover:bg-[#1a1a1a] text-[12px]"
                      onClick={() => { setColorEditCategory(null); setIsColorDialogOpen(false); }}
                    >
                      Færdig
                    </Button>
                  </div>
                </div>
              );
            })()
          )}
        </DialogContent>
      </Dialog>

      {/* All Upcoming Events Sheet */}
      <Sheet open={allUpcomingOpen} onOpenChange={setAllUpcomingOpen}>
        <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl bg-[#faf9f6]">
          <SheetHeader>
            <SheetTitle className="text-[1rem] text-[#2f2f2d]">
              Alle kommende aftaler ({allUpcoming.length})
            </SheetTitle>
          </SheetHeader>
          <p className="px-1 pb-1 text-[11px] text-[#8a897e]">Swipe til venstre for at slette</p>
          <div className="overflow-y-auto space-y-2 px-1 pb-6">
            {allUpcoming.map(event => (
              <SwipeableEventRow
                key={event.id}
                eventId={event.id}
                onDelete={() => { deleteEvent(event.id); toast.success('Aftale slettet'); }}
              >
                <button
                  onClick={() => { setSelectedEvent(event); setEventDetailOpen(true); setAllUpcomingOpen(false); }}
                  className="flex w-full items-start gap-3 rounded-xl border border-[#f0efe8] bg-white px-3 py-2.5 text-left hover:bg-[#faf9f6] transition-colors"
                >
                  <div className="flex flex-col items-center min-w-[38px]">
                    <span className="text-[9px] font-semibold uppercase tracking-[0.05em] text-[#78766d]">
                      {format(parseISO(event.startDate), 'MMM', { locale: da })}
                    </span>
                    <span className="text-[18px] font-bold leading-tight text-[#2f2f2d]">
                      {format(parseISO(event.startDate), 'd')}
                    </span>
                  </div>
                  <div className="w-0.5 rounded-full self-stretch" style={{ backgroundColor: getCustomEventColor(event.type) }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#2f2f2d]">{event.title}</p>
                    <div className="flex items-center gap-2 text-[11px] text-[#78766d]">
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
                  <span className="shrink-0 rounded-lg bg-[#ecebe5] px-2 py-0.5 text-[10px] font-semibold text-[#5f5d56]">
                    {getEventTypeLabel(event.type)}
                  </span>
                </button>
              </SwipeableEventRow>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Event Detail Dialog */}
      <Dialog open={eventDetailOpen} onOpenChange={setEventDetailOpen}>
        <DialogContent className="max-w-sm rounded-3xl border-[#d8d7cf] bg-[#faf9f6]">
          <DialogHeader>
            <DialogTitle className="text-[1rem] tracking-[-0.01em] text-[#2f2f2d]">Aftaledetaljer</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getCustomEventColor(selectedEvent.type) }} />
                <p className="text-[15px] font-semibold text-[#2f2f2d]">{selectedEvent.title}</p>
              </div>
              <div className="rounded-xl border border-[#e8e7e0] bg-white p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm text-[#4a4945]">
                  <Clock className="h-4 w-4 text-[#78766d]" />
                  <span>
                    {format(parseISO(selectedEvent.startDate), 'EEEE d. MMMM yyyy · HH:mm', { locale: da })}
                    {selectedEvent.endDate && selectedEvent.endDate !== selectedEvent.startDate && (
                      <> – {format(parseISO(selectedEvent.endDate), 'HH:mm', { locale: da })}</>
                    )}
                  </span>
                </div>
                {selectedEvent.location && (
                  <div className="flex items-center gap-2 text-sm text-[#4a4945]">
                    <MapPin className="h-4 w-4 text-[#78766d]" />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-[#4a4945]">
                  <Calendar className="h-4 w-4 text-[#78766d]" />
                  <span>{getEventTypeLabel(selectedEvent.type)}</span>
                </div>
              </div>
              {selectedEvent.description && (
                <div className="rounded-xl border border-[#e8e7e0] bg-white p-3">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#78766d] mb-1">Beskrivelse</p>
                  <p className="text-sm text-[#4a4945] whitespace-pre-wrap">{selectedEvent.description}</p>
                </div>
              )}
              {selectedEvent.createdBy && (
                <p className="text-[11px] text-[#78766d]">
                  Oprettet af {users.find(u => u.id === selectedEvent.createdBy)?.name ?? 'ukendt'}
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-2xl border-red-200 text-red-600 hover:bg-red-50"
                  onClick={() => {
                    if (selectedEvent) {
                      deleteEvent(selectedEvent.id);
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
                  className="flex-1 rounded-2xl bg-[#2f2f2f] text-white hover:bg-[#1a1a1a]"
                  onClick={() => setEventDetailOpen(false)}
                >
                  Luk
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
