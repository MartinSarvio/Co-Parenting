import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store';
import { useApiActions } from '@/hooks/useApiActions';
import { useFamilyContext } from '@/hooks/useFamilyContext';
import {
  startOfYear, endOfYear, eachMonthOfInterval,
  startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, format, isSameDay, isToday, getISOWeek,
} from 'date-fns';
import { da } from 'date-fns/locale';
import { ArrowLeft, ChevronLeft, ChevronRight, Sun, Plus, X, Calendar, Share2, ListFilter, Users, Clock, LayoutTemplate, FileText, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SelectSheet } from '@/components/custom/SelectSheet';
import type { EventType } from '@/types';

function getParentForDay(date: Date, custodyPlan: ReturnType<typeof useFamilyContext>['custodyPlan'], parent1Id: string, parent2Id: string): string | null {
  if (!custodyPlan) return null;

  // Check custom schedule first
  if (custodyPlan.customSchedule && custodyPlan.customSchedule.length > 0) {
    const dateStr = format(date, 'yyyy-MM-dd');
    const custom = custodyPlan.customSchedule.find(d => d.date === dateStr);
    if (custom) return custom.parentId;
  }

  // Check holidays
  if (custodyPlan.holidays) {
    for (const h of custodyPlan.holidays) {
      const start = new Date(h.startDate);
      const end = new Date(h.endDate);
      if (date >= start && date <= end) return h.parentId;
    }
  }

  // Weekly schedule
  if (custodyPlan.weeklySchedule && custodyPlan.weeklySchedule.length > 0) {
    // 0=Monday in our system, getDay() returns 0=Sunday
    const jsDay = getDay(date); // 0=Sun, 1=Mon...
    const ourDay = jsDay === 0 ? 6 : jsDay - 1; // convert to 0=Mon
    const daySchedule = custodyPlan.weeklySchedule.find(s => s.dayOfWeek === ourDay);
    if (daySchedule) {
      if (daySchedule.parent1.hasCustody) return parent1Id;
      if (daySchedule.parent2.hasCustody) return parent2Id;
    }
  }

  // CustomWeekConfig (even/odd weeks)
  if (custodyPlan.customWeekConfig) {
    const config = custodyPlan.customWeekConfig;
    const jsDay = getDay(date);
    const ourDay = jsDay === 0 ? 6 : jsDay - 1;
    const weekNum = getISOWeek(date);
    const assignments = weekNum % 2 === 0 ? config.evenWeekAssignments : config.oddWeekAssignments;
    if (assignments[ourDay]) return assignments[ourDay];
  }

  // Simple pattern: parent1Days / parent2Days
  if (custodyPlan.parent1Days && custodyPlan.parent2Days) {
    const jsDay = getDay(date);
    const ourDay = jsDay === 0 ? 6 : jsDay - 1;
    if (custodyPlan.parent1Days.includes(ourDay)) return parent1Id;
    if (custodyPlan.parent2Days.includes(ourDay)) return parent2Id;
  }

  return null;
}

export function Aarskalender() {
  const { users, events, currentUser, sideMenuOpen, setSideMenuOpen, sideMenuContext, setActiveTab, setPendingCalendarAction } = useAppStore();
  const { createEvent } = useApiActions();
  const { currentChild, custodyPlan, parents } = useFamilyContext();
  const calSidePanelOpen = sideMenuOpen && sideMenuContext === 'kalender';
  const setCalSidePanelOpen = setSideMenuOpen;
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
  const [quickAddDate, setQuickAddDate] = useState<Date | null>(null);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventType, setNewEventType] = useState<EventType>('personal');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [newEventStartTime, setNewEventStartTime] = useState('09:00');
  const [newEventEndTime, setNewEventEndTime] = useState('10:00');
  const [newEventLocation, setNewEventLocation] = useState('');

  const parent1 = parents[0] ?? null;
  const parent2 = parents[1] ?? null;

  // Perspektiv-baseret farver: mig = sort, anden forælder = orange
  const p1Color = parent1?.id === currentUser?.id ? 'bg-[#2f2f2f]/20' : 'bg-[#f58a2d]/20';
  const p2Color = parent2?.id === currentUser?.id ? 'bg-[#2f2f2f]/20' : 'bg-[#f58a2d]/20';
  const holidayColor = 'bg-[#f5c08a]';

  const months = eachMonthOfInterval({
    start: startOfYear(new Date(year, 0, 1)),
    end: endOfYear(new Date(year, 0, 1)),
  });

  function getDayColor(date: Date): string {
    if (!custodyPlan || !parent1 || !parent2) return '';
    const parentId = getParentForDay(date, custodyPlan, parent1.id, parent2.id);
    if (parentId === parent1.id) return p1Color;
    if (parentId === parent2.id) return p2Color;
    return '';
  }

  function isHoliday(date: Date): boolean {
    if (!custodyPlan?.holidays) return false;
    return custodyPlan.holidays.some(h => {
      const start = new Date(h.startDate);
      const end = new Date(h.endDate);
      return date >= start && date <= end;
    });
  }

  function hasEvent(date: Date): boolean {
    return events.some(e => isSameDay(new Date(e.startDate), date));
  }

  return (
    <div className="space-y-2 py-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[1.35rem] font-bold tracking-[-0.02em] text-[#2f2f2d]">Årskalender</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setYear(y => y - 1)}
            className="flex h-8 w-8 items-center justify-center text-[#5f5d56] transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="w-12 text-center text-[14px] font-bold text-[#2f2f2d]">{year}</span>
          <button
            onClick={() => setYear(y => y + 1)}
            className="flex h-8 w-8 items-center justify-center text-[#5f5d56] transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Legend */}
      {parent1 && parent2 && (
        <div className="flex items-center gap-4 rounded-[8px] border border-[#e8e7e0] bg-white px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2">
            <div className={cn('h-3.5 w-3.5 rounded-sm', p1Color)} />
            <span className="text-[12px] font-medium text-[#3f3e3a]">{parent1.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn('h-3.5 w-3.5 rounded-sm', p2Color)} />
            <span className="text-[12px] font-medium text-[#3f3e3a]">{parent2.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn('h-3.5 w-3.5 rounded-sm', holidayColor)} />
            <span className="text-[12px] font-medium text-[#3f3e3a]">Ferie</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-3.5 rounded-sm bg-[#f0efe8] ring-1 ring-[#f58a2d]" />
            <span className="text-[12px] font-medium text-[#3f3e3a]">Event</span>
          </div>
        </div>
      )}

      {/* Child info */}
      {currentChild && (
        <div className="flex items-center gap-2 rounded-[8px] bg-[#faf9f6] px-4 py-2.5 border border-[#e8e7e0]">
          <Sun className="h-4 w-4 text-[#f58a2d]" />
          <span className="text-[13px] font-medium text-[#3f3e3a]">
            Samværsplan for <span className="font-bold">{currentChild.name}</span>
            {custodyPlan ? ` – ${custodyPlan.name}` : ''}
          </span>
        </div>
      )}

      {!custodyPlan && (
        <div className="rounded-[8px] border border-dashed border-[#d0cec5] bg-[#faf9f6] px-4 py-6 text-center">
          <p className="text-[13px] text-[#78766d]">Ingen samværsplan oprettet endnu. Opret en plan under Samvær for at se fordelingen her.</p>
        </div>
      )}

      {/* Grid of months */}
      <div className="grid grid-cols-2 gap-3">
        {months.map(month => {
          const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
          // Day of week of first day (0=Mon)
          const firstDayJs = getDay(startOfMonth(month));
          const firstDay = firstDayJs === 0 ? 6 : firstDayJs - 1;

          return (
            <div
              key={month.toISOString()}
              className="rounded-[8px] border border-[#e8e7e0] bg-white px-3 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)] cursor-pointer hover:border-[#f58a2d]/40 transition-colors"
              onClick={() => setSelectedMonth(month)}
            >
              <p className="mb-2 text-center text-[12px] font-bold tracking-[-0.01em] text-[#2f2f2d] capitalize">
                {format(month, 'MMMM', { locale: da })}
              </p>
              {/* Weekday headers */}
              <div className="mb-1 grid grid-cols-7 gap-px">
                {['M', 'T', 'O', 'T', 'F', 'L', 'S'].map((d, i) => (
                  <div key={i} className="text-center text-[9px] font-semibold text-[#b0aea6]">{d}</div>
                ))}
              </div>
              {/* Days grid */}
              <div className="grid grid-cols-7 gap-px">
                {/* Empty cells for offset */}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {days.map(day => {
                  const holiday = isHoliday(day);
                  const dayColor = holiday ? holidayColor : getDayColor(day);
                  const todayDay = isToday(day);
                  const hasEv = hasEvent(day);

                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        'relative flex h-5 w-full items-center justify-center rounded-[3px] text-[9px] font-medium',
                        dayColor || 'bg-[#f0efe8]',
                        todayDay && 'ring-1 ring-[#f58a2d] ring-offset-0',
                      )}
                    >
                      <span className={cn(dayColor ? 'text-[#2f2f2d]' : 'text-[#78766d]')}>
                        {format(day, 'd')}
                      </span>
                      {hasEv && (
                        <div className="absolute bottom-0.5 right-0.5 h-1 w-1 rounded-full bg-[#f58a2d]" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Holidays summary */}
      {custodyPlan?.holidays && custodyPlan.holidays.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-[0.95rem] font-semibold tracking-[-0.01em] text-[#2f2f2d]">Ferieaftaler</h2>
          {custodyPlan.holidays.map(h => {
            const p = users.find(u => u.id === h.parentId);
            return (
              <div key={h.id} className="flex items-center justify-between rounded-[8px] border border-[#e8e7e0] bg-white px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <div>
                  <p className="text-[13px] font-semibold text-[#2f2f2d]">{h.name}</p>
                  <p className="text-[11px] text-[#78766d]">
                    {format(new Date(h.startDate), 'd. MMM', { locale: da })} – {format(new Date(h.endDate), 'd. MMM yyyy', { locale: da })}
                  </p>
                </div>
                {p && (
                  <span className="text-[12px] font-medium text-[#4a4945]">{p.name}</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Month detail — full-screen page */}
      <AnimatePresence>
        {selectedMonth && (() => {
          const monthDays = eachDayOfInterval({ start: startOfMonth(selectedMonth), end: endOfMonth(selectedMonth) });
          const firstDayJsDetail = getDay(startOfMonth(selectedMonth));
          const firstDayDetail = firstDayJsDetail === 0 ? 6 : firstDayJsDetail - 1;

          return (
            <motion.div
              key="month-detail"
              className="fixed inset-0 z-50 bg-[#faf9f6] flex flex-col overflow-hidden"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
              drag="x"
              dragConstraints={{ left: 0 }}
              dragElastic={0.15}
              onDragEnd={(_: unknown, info: { offset: { x: number } }) => { if (info.offset.x > 100) setSelectedMonth(null); }}
            >
              {/* Header */}
              <div className="shrink-0 flex items-center justify-between px-4 pt-[env(safe-area-inset-top,16px)] pb-3 bg-[#faf9f6] border-b border-[#e5e3dc]">
                <button
                  onClick={() => setSelectedMonth(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#f2f1ed] text-[#2f2f2d] active:scale-[0.92] transition-transform"
                >
                  <ArrowLeft className="h-[18px] w-[18px]" />
                </button>
                <h1 className="text-[17px] font-bold text-[#2f2f2d] capitalize">
                  {format(selectedMonth, 'MMMM yyyy', { locale: da })}
                </h1>
                <button
                  onClick={() => setQuickAddDate(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), new Date().getDate()))}
                  className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#f2f1ed] text-[#2f2f2d] active:scale-[0.92] transition-transform"
                >
                  <Plus className="h-[18px] w-[18px]" />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto">
                <div className="px-4 pt-4 pb-8 max-w-[430px] mx-auto">
                  {/* Weekday headers */}
                  <div className="mb-2 grid grid-cols-7 gap-1">
                    {['M', 'T', 'O', 'T', 'F', 'L', 'S'].map((d, i) => (
                      <div key={i} className="text-center text-[11px] font-semibold text-[#78766d]">{d}</div>
                    ))}
                  </div>

                  {/* Full month grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: firstDayDetail }).map((_, i) => (
                      <div key={`detail-empty-${i}`} className="h-10" />
                    ))}
                    {monthDays.map(day => {
                      const holiday = isHoliday(day);
                      const dayColor = holiday ? holidayColor : getDayColor(day);
                      const todayDay = isToday(day);
                      const dayEvents = events.filter(e => isSameDay(new Date(e.startDate), day));

                      return (
                        <button
                          key={day.toISOString()}
                          onClick={() => setQuickAddDate(day)}
                          className={cn(
                            'relative flex h-10 w-full flex-col items-center justify-center rounded-[8px] text-[13px] font-medium transition-colors hover:opacity-80',
                            dayColor || 'bg-[#f0efe8]',
                            todayDay && 'ring-1 ring-[#f58a2d] ring-offset-1',
                          )}
                        >
                          <span className={cn(dayColor ? 'text-[#2f2f2d]' : 'text-[#78766d]')}>
                            {format(day, 'd')}
                          </span>
                          {dayEvents.length > 0 && (
                            <div className="flex gap-0.5 mt-0.5">
                              {dayEvents.slice(0, 3).map((_ev, idx) => (
                                <div key={idx} className="h-1 w-1 rounded-full bg-[#f58a2d]" />
                              ))}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Events list for selected month */}
                  {(() => {
                    const monthEvents = events.filter(e => {
                      const eDate = new Date(e.startDate);
                      return eDate.getMonth() === selectedMonth.getMonth() && eDate.getFullYear() === selectedMonth.getFullYear();
                    });
                    if (monthEvents.length === 0) return null;
                    return (
                      <div className="mt-4 space-y-2">
                        <h3 className="text-[13px] font-semibold text-[#2f2f2d]">Begivenheder denne måned</h3>
                        {monthEvents.map(ev => (
                          <div key={ev.id} className="flex items-center gap-3 rounded-[8px] border border-[#e8e7e0] bg-white px-3 py-2 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                            <div className="h-2 w-2 rounded-full bg-[#f58a2d] flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-[13px] font-medium text-[#2f2f2d] truncate">{ev.title}</p>
                              <p className="text-[11px] text-[#78766d]">
                                {format(new Date(ev.startDate), 'd. MMM', { locale: da })} &middot; {ev.type}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Full-screen new event page */}
      <AnimatePresence>
        {quickAddDate && (
          <motion.div
            key="new-event"
            className="fixed inset-0 z-[55] bg-[#faf9f6] flex flex-col overflow-hidden"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            drag="x"
            dragConstraints={{ left: 0 }}
            dragElastic={0.15}
            onDragEnd={(_: unknown, info: { offset: { x: number } }) => { if (info.offset.x > 100) setQuickAddDate(null); }}
          >
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between px-4 pt-[env(safe-area-inset-top,16px)] pb-3 bg-[#faf9f6] border-b border-[#e5e3dc]">
              <button
                onClick={() => {
                  setQuickAddDate(null);
                  setNewEventTitle('');
                  setNewEventDescription('');
                  setNewEventType('personal');
                  setNewEventStartTime('09:00');
                  setNewEventEndTime('10:00');
                  setNewEventLocation('');
                }}
                className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#f2f1ed] text-[#2f2f2d] active:scale-[0.92] transition-transform"
              >
                <ArrowLeft className="h-[18px] w-[18px]" />
              </button>
              <h1 className="text-[17px] font-bold text-[#2f2f2d]">Ny begivenhed</h1>
              <div className="w-9" />
            </div>

            {/* Scrollable form */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-4 pt-4 pb-8 max-w-[430px] mx-auto space-y-4">
                {/* Date info */}
                <p className="text-[13px] text-[#78766d] capitalize">
                  {format(quickAddDate, 'EEEE d. MMMM yyyy', { locale: da })}
                </p>

                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-[12px] font-semibold text-[#78766d]">Titel *</label>
                  <input
                    type="text"
                    placeholder="Begivenhedens navn..."
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    autoFocus
                    className="w-full rounded-[8px] border border-[#e5e3dc] bg-white px-3 py-3 text-[14px] text-[#2f2f2d] placeholder:text-[#b0ada4] outline-none focus:border-[#f58a2d]"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-[12px] font-semibold text-[#78766d]">Beskrivelse</label>
                  <textarea
                    placeholder="Tilføj noter..."
                    value={newEventDescription}
                    onChange={(e) => setNewEventDescription(e.target.value)}
                    rows={3}
                    className="w-full rounded-[8px] border border-[#e5e3dc] bg-white px-3 py-3 text-[14px] text-[#2f2f2d] placeholder:text-[#b0ada4] outline-none focus:border-[#f58a2d] resize-none"
                  />
                </div>

                {/* Type */}
                <div className="space-y-1.5">
                  <label className="text-[12px] font-semibold text-[#78766d]">Type</label>
                  <SelectSheet
                    value={newEventType}
                    onValueChange={(val) => setNewEventType(val as EventType)}
                    title="Type"
                    placeholder="Vælg type"
                    options={[
                      { value: 'school', label: 'Skole' },
                      { value: 'activity', label: 'Aktivitet' },
                      { value: 'work', label: 'Arbejde' },
                      { value: 'personal', label: 'Personlig' },
                      { value: 'handover', label: 'Overlevering' },
                      { value: 'appointment', label: 'Aftale' },
                      { value: 'meeting', label: 'Møde' },
                      { value: 'institution', label: 'Institution' },
                    ]}
                    className="rounded-[8px] border-[#e5e3dc] bg-white text-[#2f2f2d]"
                  />
                </div>

                {/* Start + End time */}
                <div className="grid grid-cols-2 gap-3 overflow-hidden">
                  <div className="space-y-1.5 min-w-0 overflow-hidden">
                    <label className="text-[12px] font-semibold text-[#78766d]">Starttid</label>
                    <input
                      type="time"
                      value={newEventStartTime}
                      onChange={(e) => setNewEventStartTime(e.target.value)}
                      className="w-full min-w-0 max-w-full rounded-[8px] border border-[#e5e3dc] bg-white px-3 py-3 text-[14px] text-[#2f2f2d] outline-none focus:border-[#f58a2d]"
                    />
                  </div>
                  <div className="space-y-1.5 min-w-0 overflow-hidden">
                    <label className="text-[12px] font-semibold text-[#78766d]">Sluttid</label>
                    <input
                      type="time"
                      value={newEventEndTime}
                      onChange={(e) => setNewEventEndTime(e.target.value)}
                      className="w-full min-w-0 max-w-full rounded-[8px] border border-[#e5e3dc] bg-white px-3 py-3 text-[14px] text-[#2f2f2d] outline-none focus:border-[#f58a2d]"
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-1.5">
                  <label className="text-[12px] font-semibold text-[#78766d]">Lokation</label>
                  <input
                    type="text"
                    placeholder="Tilføj lokation..."
                    value={newEventLocation}
                    onChange={(e) => setNewEventLocation(e.target.value)}
                    className="w-full rounded-[8px] border border-[#e5e3dc] bg-white px-3 py-3 text-[14px] text-[#2f2f2d] placeholder:text-[#b0ada4] outline-none focus:border-[#f58a2d]"
                  />
                </div>

                {/* Save button */}
                <button
                  onClick={() => {
                    if (!quickAddDate || !newEventTitle.trim() || !currentUser) return;
                    const dateStr = format(quickAddDate, 'yyyy-MM-dd');
                    createEvent({
                      title: newEventTitle.trim(),
                      description: newEventDescription.trim() || undefined,
                      startDate: `${dateStr}T${newEventStartTime}:00`,
                      endDate: `${dateStr}T${newEventEndTime}:00`,
                      type: newEventType,
                      createdBy: currentUser.id,
                      childId: currentChild?.id,
                      location: newEventLocation.trim() || undefined,
                    }).catch(() => {});
                    setNewEventTitle('');
                    setNewEventDescription('');
                    setNewEventType('personal');
                    setNewEventStartTime('09:00');
                    setNewEventEndTime('10:00');
                    setNewEventLocation('');
                    setQuickAddDate(null);
                  }}
                  disabled={!newEventTitle.trim()}
                  className="w-full rounded-[8px] bg-[#2f2f2f] py-4 text-[15px] font-bold text-white active:scale-[0.98] transition-transform disabled:opacity-40"
                >
                  Gem begivenhed
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Side panel (kalender menu) — rendered via portal ─── */}
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
              className="fixed inset-y-0 left-0 z-[9999] w-full bg-white flex flex-col"
              style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
            >
              <div className="flex items-center justify-between px-5 py-3 border-b border-[#eeedea]">
                <h2 className="text-[17px] font-bold text-[#2f2f2d]">Kalender</h2>
                <button
                  onClick={() => setCalSidePanelOpen(false)}
                  className="flex items-center justify-center text-[#5f5d56] hover:text-[#2f2f2d] transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-2 pb-[env(safe-area-inset-bottom,0px)]">
                {[
                  { label: 'Kalender', icon: Calendar, action: () => { setActiveTab('kalender'); setCalSidePanelOpen(false); } },
                  { label: 'Del kalender', icon: Share2, action: () => { setPendingCalendarAction('share'); setActiveTab('kalender'); setCalSidePanelOpen(false); } },
                  { label: 'Farver', icon: Calendar, action: () => { setPendingCalendarAction('colors'); setActiveTab('kalender'); setCalSidePanelOpen(false); } },
                  { label: 'Kategorier', icon: ListFilter, action: () => { setPendingCalendarAction('categories'); setActiveTab('kalender'); setCalSidePanelOpen(false); } },
                  { label: 'Deling og kilder', icon: Users, action: () => { setPendingCalendarAction('calendars'); setActiveTab('kalender'); setCalSidePanelOpen(false); } },
                  { label: 'Kommende aftaler', icon: Clock, action: () => { setPendingCalendarAction('upcoming'); setActiveTab('kalender'); setCalSidePanelOpen(false); } },
                  { label: 'Aftale-skabeloner', icon: LayoutTemplate, action: () => { setPendingCalendarAction('templates'); setActiveTab('kalender'); setCalSidePanelOpen(false); } },
                  { label: 'Dagbog', icon: FileText, action: () => { setPendingCalendarAction('diary'); setActiveTab('kalender'); setCalSidePanelOpen(false); } },
                  { label: 'Indkøb & måltider', icon: ShoppingBag, action: () => { setPendingCalendarAction('meals'); setActiveTab('kalender'); setCalSidePanelOpen(false); } },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      onClick={item.action}
                      className="flex w-full items-center gap-3.5 px-5 py-3.5 text-left transition-colors hover:bg-[#faf9f6]"
                    >
                      <Icon className="h-5 w-5 shrink-0 text-[#7a786f]" />
                      <p className="flex-1 min-w-0 text-[15px] font-semibold text-[#4a4945]">{item.label}</p>
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
    </div>
  );
}
