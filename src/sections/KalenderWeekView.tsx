import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore } from '@/store';
import { cn, formatTime } from '@/lib/utils';
import { useApiActions } from '@/hooks/useApiActions';
import {
  addDays,
  addWeeks,
  eachDayOfInterval,
  endOfWeek,
  format,
  getDate,
  getISOWeek,
  isSameDay,
  parseISO,
  startOfWeek,
} from 'date-fns';
import { da } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, X, Plus, Clock, MapPin, Calendar, Trash2 } from 'lucide-react';
import { SavingOverlay } from '@/components/custom/SavingOverlay';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectSheet } from '@/components/custom/SelectSheet';
import { toast } from 'sonner';
import type { CalendarEvent, EventType } from '@/types';

const WEEKS_BUFFER = 26;
const MAX_TOTAL_WEEKS = 156; // ~3 years max
const PREPEND_COOLDOWN_MS = 500;

const DEFAULT_EVENT_COLORS: Record<string, string> = {
  school: '#2f2f2f',
  activity: '#8b8677',
  handover: '#f58a2d',
  appointment: '#4a90d9',
  work: '#4a4945',
  personal: '#a855f7',
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  school: 'Skole',
  activity: 'Aktivitet',
  handover: 'Overlevering',
  appointment: 'Aftale',
  work: 'Arbejde',
  personal: 'Personlig',
};

const EVENT_TYPES = [
  { value: 'school', label: 'Skole' },
  { value: 'activity', label: 'Aktivitet' },
  { value: 'handover', label: 'Overlevering' },
  { value: 'appointment', label: 'Aftale' },
  { value: 'work', label: 'Arbejde' },
  { value: 'personal', label: 'Personlig' },
];

function generateWeeks(center: Date, before: number, after: number) {
  const centerWeekStart = startOfWeek(center, { weekStartsOn: 1 });
  const weeks: Date[] = [];
  for (let i = -before; i <= after; i++) {
    weeks.push(addWeeks(centerWeekStart, i));
  }
  return weeks;
}

export function KalenderWeekView() {
  const {
    calendarWeekViewDate,
    setCalendarWeekViewDate,
    setActiveTab,
    events,
    calendarColorPreferences,
    users,
    children,
  } = useAppStore();

  const { createEvent, deleteEvent } = useApiActions();

  const baseDate = calendarWeekViewDate || new Date();
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasScrolledRef = useRef(false);
  const rafRef = useRef<number>(0);
  const lastPrependRef = useRef(0);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<number>(0);

  const [weekStarts, setWeekStarts] = useState(() =>
    generateWeeks(baseDate, WEEKS_BUFFER, WEEKS_BUFFER)
  );

  // Day view + event detail + add event state
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [dayViewDate, setDayViewDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [eventDetailOpen, setEventDetailOpen] = useState(false);
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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

  const currentChild = children[0];

  // Dynamic week row height — exactly 2 weeks visible
  const [weekRowHeight, setWeekRowHeight] = useState(250);
  useEffect(() => {
    const updateHeight = () => {
      const safeAreaTop = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sat') || '0') || 0;
      const available = window.innerHeight - safeAreaTop - 74;
      const separatorHeight = 28;
      const rowHeight = Math.floor((available - separatorHeight * 2) / 2);
      setWeekRowHeight(Math.max(rowHeight, 200));
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Long-press timer for adding events
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const prevDateRef = useRef(baseDate);
  useEffect(() => {
    // Skip regeneration when the date change came from scrolling —
    // only regenerate when the user navigates externally (e.g. calendar picker)
    if (isScrollingRef.current) return;
    const prev = prevDateRef.current;
    const curr = calendarWeekViewDate || new Date();
    if (!isSameDay(prev, curr)) {
      prevDateRef.current = curr;
      setWeekStarts(generateWeeks(curr, WEEKS_BUFFER, WEEKS_BUFFER));
      hasScrolledRef.current = false;
    }
  }, [calendarWeekViewDate]);

  const getEventColor = (eventType: string): string => {
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

  const getEventsForDay = useCallback((day: Date) =>
    events.filter((e) => {
      const eventDate = safeParse(e.startDate);
      return eventDate ? isSameDay(eventDate, day) : false;
    }), [events]);

  // Scroll to current week on mount
  useEffect(() => {
    if (hasScrolledRef.current) return;
    if (!scrollRef.current) return;
    const targetDate = calendarWeekViewDate || new Date();
    const targetWeekStart = startOfWeek(targetDate, { weekStartsOn: 1 });
    const idx = weekStarts.findIndex((ws) => isSameDay(ws, targetWeekStart));
    if (idx >= 0) {
      scrollRef.current.scrollTop = idx * weekRowHeight;
      hasScrolledRef.current = true;
    }
  }, [weekStarts, calendarWeekViewDate]);

  // Scroll handler — update month in TopBar + infinite scroll
  const handleScroll = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (!el) return;

      const topWeekIdx = Math.floor(el.scrollTop / weekRowHeight);
      const clampedIdx = Math.max(0, Math.min(topWeekIdx, weekStarts.length - 1));
      const topWeek = weekStarts[clampedIdx];

      if (topWeek) {
        const thursday = addDays(topWeek, 3);
        if (!calendarWeekViewDate || thursday.getMonth() !== calendarWeekViewDate.getMonth() || thursday.getFullYear() !== calendarWeekViewDate.getFullYear()) {
          // Mark as scroll-driven so the useEffect won't regenerate weekStarts
          isScrollingRef.current = true;
          clearTimeout(scrollTimeoutRef.current);
          scrollTimeoutRef.current = window.setTimeout(() => { isScrollingRef.current = false; }, 300);
          setCalendarWeekViewDate(thursday);
        }
      }

      // Prepend weeks (with cooldown to prevent iOS momentum runaway)
      const now = Date.now();
      if (el.scrollTop < weekRowHeight * 4 && now - lastPrependRef.current > PREPEND_COOLDOWN_MS) {
        setWeekStarts((prev) => {
          if (prev.length >= MAX_TOTAL_WEEKS) return prev;
          const firstWeek = prev[0];
          const newWeeks: Date[] = [];
          for (let i = 4; i >= 1; i--) {
            newWeeks.push(addWeeks(firstWeek, -i));
          }
          return [...newWeeks, ...prev];
        });
        el.scrollTop += 4 * weekRowHeight;
        lastPrependRef.current = now;
      }

      // Append weeks
      const distToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      if (distToBottom < weekRowHeight * 4) {
        setWeekStarts((prev) => {
          if (prev.length >= MAX_TOTAL_WEEKS) return prev;
          const lastWeek = prev[prev.length - 1];
          const newWeeks: Date[] = [];
          for (let i = 1; i <= 4; i++) {
            newWeeks.push(addWeeks(lastWeek, i));
          }
          return [...prev, ...newWeeks];
        });
      }
    });
  }, [weekStarts, calendarWeekViewDate, setCalendarWeekViewDate]);

  // Year boundary detection for separators
  const yearBoundaries = useMemo(() => {
    const boundaries = new Set<number>();
    let prevYear = -1;
    weekStarts.forEach((ws, idx) => {
      const thursday = addDays(ws, 3);
      const year = thursday.getFullYear();
      if (year !== prevYear) {
        boundaries.add(idx);
        prevYear = year;
      }
    });
    return boundaries;
  }, [weekStarts]);

  // Close everything and go back to calendar main
  const closeToCalendar = () => {
    setDayViewDate(null);
    setCalendarWeekViewDate(null);
    setActiveTab('kalender');
  };

  // Open add event form pre-filled with day view date
  const openAddEvent = () => {
    if (!dayViewDate) return;
    setNewEvent({
      title: '',
      type: 'school',
      startDate: format(dayViewDate, 'yyyy-MM-dd'),
      startTime: '09:00',
      endDate: format(dayViewDate, 'yyyy-MM-dd'),
      endTime: '10:00',
      location: '',
      description: '',
    });
    setAddEventOpen(true);
  };

  // Open add event form pre-filled with any given day (long-press)
  const openAddEventForDay = (day: Date) => {
    setNewEvent({
      title: '',
      type: 'school',
      startDate: format(day, 'yyyy-MM-dd'),
      startTime: '09:00',
      endDate: format(day, 'yyyy-MM-dd'),
      endTime: '10:00',
      location: '',
      description: '',
    });
    setAddEventOpen(true);
  };

  // Submit new event
  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.startDate || !newEvent.startTime) {
      toast.error('Udfyld titel, dato og tidspunkt');
      return;
    }
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

      toast.success('Begivenhed oprettet');
      setAddEventOpen(false);
      setNewEvent({ title: '', type: 'school', startDate: '', startTime: '', endDate: '', endTime: '', location: '', description: '' });
    } catch {
      toast.error('Kunne ikke oprette begivenhed');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* Week grid — edge-to-edge, no extra padding */}
      <div
        className="relative flex flex-col bg-card"
        style={{ height: 'calc(100svh - env(safe-area-inset-top, 0px) - 74px)' }}
      >
        {/* Scrollable weeks */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto overflow-x-hidden"
          style={{ overscrollBehavior: 'none', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          onScroll={handleScroll}
        >
          {weekStarts.map((weekStart, weekIdx) => {
            const days = eachDayOfInterval({
              start: weekStart,
              end: endOfWeek(weekStart, { weekStartsOn: 1 }),
            });
            const weekNum = getISOWeek(weekStart);
            const showYearSeparator = yearBoundaries.has(weekIdx) && weekIdx > 0;

            return (
              <div key={weekStart.toISOString()}>
                {/* Year separator */}
                {showYearSeparator && (
                  <div className="px-3 py-2 bg-card">
                    <p className="text-[13px] font-bold text-foreground">
                      {addDays(weekStart, 3).getFullYear()}
                    </p>
                  </div>
                )}

                {/* Week separator with week number */}
                <div className="flex items-center gap-2 px-3 py-1">
                  <div className="flex-1 h-px bg-muted" />
                  <span className="text-[10px] font-semibold text-[#f58a2d] whitespace-nowrap">
                    uge {weekNum}
                  </span>
                  <div className="flex-1 h-px bg-muted" />
                </div>

                {/* Week row — full width 7 columns */}
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    minHeight: `${weekRowHeight}px`,
                  }}
                >
                  {days.map((day, dayIdx) => {
                    const dayEvents = getEventsForDay(day);
                    const isToday = isSameDay(day, new Date());
                    const isWeekend = dayIdx >= 5;
                    const dayNum = getDate(day);
                    const isSelected = isSameDay(day, selectedDay);

                    return (
                      <div
                        key={day.toISOString()}
                        className={cn(
                          "p-1 min-h-[inherit] flex flex-col",
                          isWeekend && "bg-card",
                          isSelected && "bg-orange-tint-light"
                        )}
                        onPointerDown={() => {
                          longPressTimer.current = setTimeout(() => openAddEventForDay(day), 500);
                        }}
                        onPointerUp={() => {
                          if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
                        }}
                        onPointerLeave={() => {
                          if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
                        }}
                        onContextMenu={(e) => e.preventDefault()}
                      >
                        {/* Date header — tappable to select day */}
                        <button
                          onClick={() => setSelectedDay(day)}
                          className="flex justify-center shrink-0"
                        >
                          <div className={cn(
                            "w-9 h-9 rounded-full flex items-center justify-center text-[20px] font-bold",
                            isToday
                              ? "bg-[#f58a2d] text-white"
                              : dayNum === 1
                                ? "text-[#f58a2d] font-bold"
                                : isWeekend ? "text-[#b0876a]" : "text-foreground"
                          )}>
                            {dayNum}
                          </div>
                        </button>

                        {/* Date label (dd/mm) */}
                        <p className={cn(
                          "text-[8px] text-center mb-1 shrink-0",
                          isWeekend ? "text-[#c4a98e]" : "text-muted-foreground"
                        )}>
                          {format(day, 'dd/MM')}
                        </p>

                        {/* Events — tappable */}
                        <div className="flex-1 space-y-0.5 overflow-hidden">
                          {dayEvents.slice(0, 5).map((event) => {
                            const color = getEventColor(event.type);
                            return (
                              <button
                                key={event.id}
                                onClick={() => { setSelectedEvent(event); setEventDetailOpen(true); }}
                                className="w-full rounded-[8px] px-1 py-[2px] text-[7px] font-semibold leading-[1.3] truncate text-left"
                                style={{
                                  backgroundColor: color + '18',
                                  color,
                                }}
                                title={`${event.title} ${formatTime(event.startDate)}`}
                              >
                                <span className="opacity-70">{formatTime(event.startDate)}</span>{' '}
                                {event.title}
                              </button>
                            );
                          })}
                          {dayEvents.length > 5 && (
                            <p className="text-[7px] text-center text-muted-foreground">
                              +{dayEvents.length - 5}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Floating "Dag" button — bottom-left */}
        <button
          onClick={() => setDayViewDate(selectedDay)}
          className="absolute left-4 z-10 rounded-full bg-card/80 backdrop-blur-sm border border-border px-4 py-2 shadow-sm text-[13px] font-semibold text-foreground hover:bg-card/95 transition-colors"
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
        >
          Dag
        </button>
      </div>

      {/* Event Detail Bottom Sheet */}
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
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getEventColor(selectedEvent.type) }} />
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
                    <span>{EVENT_TYPE_LABELS[selectedEvent.type] || selectedEvent.type}</span>
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

      {/* ═══ Day View — full-page overlay ═══ */}
      {dayViewDate && createPortal(
        <AnimatePresence>
          <motion.div
            key="week-day-view"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.05}
            dragSnapToOrigin
            onDragEnd={(_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
              if (info.offset.x > 80 || info.velocity.x > 500) setDayViewDate(null);
            }}
            className="fixed inset-0 z-[55] bg-background flex flex-col"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
          >
            {/* Header: < (back to week) ... x (close to calendar) */}
            <div className="flex items-center px-4 py-3 border-b border-border">
              <button
                onClick={() => setDayViewDate(null)}
                className="flex h-9 w-9 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Tilbage til uge"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h2 className="flex-1 text-center text-[17px] font-bold text-foreground capitalize">
                {format(dayViewDate, 'EEEE d. MMMM', { locale: da })}
              </h2>
              <button
                onClick={closeToCalendar}
                className="flex h-9 w-9 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Luk til kalender"
              >
                <X className="h-5 w-5" />
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
                    const color = getEventColor(event.type);

                    return (
                      <button
                        key={event.id}
                        onClick={() => { setSelectedEvent(event); setEventDetailOpen(true); }}
                        className="absolute left-1 right-2 rounded-[8px] px-2.5 py-1.5 text-left overflow-hidden"
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                          backgroundColor: color + '18',
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

            {/* Floating "+" button — bottom-left (same spot as "Dag") */}
            <button
              onClick={openAddEvent}
              className="absolute left-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-lg hover:bg-primary transition-colors"
              style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
              aria-label="Tilføj begivenhed"
            >
              <Plus className="h-5 w-5" />
            </button>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}

      {/* ═══ Add Event — full-page overlay (slides over day view) ═══ */}
      {addEventOpen && createPortal(
        <AnimatePresence>
          <motion.div
            key="add-event-from-day"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="fixed inset-0 z-[60] bg-background flex flex-col"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <button
                onClick={() => setAddEventOpen(false)}
                className="flex h-9 w-9 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Tilbage"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h2 className="text-[17px] font-bold text-foreground">Ny begivenhed</h2>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto px-4 py-4 pb-[calc(env(safe-area-inset-bottom,0px)+24px)]">
              <div className="max-w-[430px] mx-auto space-y-4">
                <div className="space-y-2">
                  <Label>Titel</Label>
                  <Input
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder="F.eks. Fodboldtræning"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <SelectSheet
                    value={newEvent.type}
                    onValueChange={(v) => setNewEvent({ ...newEvent, type: v })}
                    title="Type"
                    options={EVENT_TYPES.map(type => ({
                      value: type.value,
                      label: type.label,
                      icon: <div className="w-3 h-3 rounded-full" style={{ backgroundColor: DEFAULT_EVENT_COLORS[type.value] || '#8b8677' }} />,
                    }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 overflow-hidden">
                  <div className="space-y-2 min-w-0 overflow-hidden">
                    <Label>Startdato</Label>
                    <Input
                      type="date"
                      className="w-full min-w-0 max-w-full"
                      value={newEvent.startDate}
                      onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 min-w-0 overflow-hidden">
                    <Label>Starttid</Label>
                    <Input
                      type="time"
                      className="w-full min-w-0 max-w-full"
                      value={newEvent.startTime}
                      onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 overflow-hidden">
                  <div className="space-y-2 min-w-0 overflow-hidden">
                    <Label>Slutdato</Label>
                    <Input
                      type="date"
                      className="w-full min-w-0 max-w-full"
                      value={newEvent.endDate}
                      onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 min-w-0 overflow-hidden">
                    <Label>Sluttid</Label>
                    <Input
                      type="time"
                      className="w-full min-w-0 max-w-full"
                      value={newEvent.endTime}
                      onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Sted</Label>
                  <Input
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    placeholder="F.eks. Idrætshallen"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Beskrivelse</Label>
                  <Input
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="Valgfri beskrivelse"
                  />
                </div>
                <Button onClick={() => void handleAddEvent()} className="w-full flex items-center justify-center gap-2" disabled={isSaving}>
                  Tilføj begivenhed
                </Button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}

      <SavingOverlay open={isSaving} />
    </>
  );
}
