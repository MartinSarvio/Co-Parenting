import { useState } from 'react';
import { useAppStore } from '@/store';
import { useFamilyContext } from '@/hooks/useFamilyContext';
import {
  startOfYear, endOfYear, eachMonthOfInterval,
  startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, format, isSameDay, isToday, getISOWeek,
} from 'date-fns';
import { da } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const { users, events } = useAppStore();
  const { currentChild, custodyPlan, parents } = useFamilyContext();
  const [year, setYear] = useState(new Date().getFullYear());

  const parent1 = parents[0] ?? null;
  const parent2 = parents[1] ?? null;

  // Colors
  const p1Color = 'bg-[#a8d5b5]'; // soft green
  const p2Color = 'bg-[#a8c7e8]'; // soft blue
  const holidayColor = 'bg-[#f5c08a]'; // orange for holidays

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
    <div className="space-y-4 py-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[1.35rem] font-bold tracking-[-0.02em] text-[#2f2f2d]">Årskalender</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setYear(y => y - 1)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ecebe5] text-[#5f5d56] hover:bg-[#e0deda]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="w-12 text-center text-[14px] font-bold text-[#2f2f2d]">{year}</span>
          <button
            onClick={() => setYear(y => y + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ecebe5] text-[#5f5d56] hover:bg-[#e0deda]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Legend */}
      {parent1 && parent2 && (
        <div className="flex items-center gap-4 rounded-2xl border border-[#e8e7e0] bg-white px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
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
        <div className="flex items-center gap-2 rounded-2xl bg-[#faf9f6] px-4 py-2.5 border border-[#e8e7e0]">
          <Sun className="h-4 w-4 text-[#f58a2d]" />
          <span className="text-[13px] font-medium text-[#3f3e3a]">
            Samværsplan for <span className="font-bold">{currentChild.name}</span>
            {custodyPlan ? ` – ${custodyPlan.name}` : ''}
          </span>
        </div>
      )}

      {!custodyPlan && (
        <div className="rounded-2xl border border-dashed border-[#d0cec5] bg-[#faf9f6] px-4 py-6 text-center">
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
            <div key={month.toISOString()} className="rounded-2xl border border-[#e8e7e0] bg-white px-3 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <p className="mb-2 text-center text-[12px] font-bold tracking-[-0.01em] text-[#2f2f2d] capitalize">
                {format(month, 'MMMM', { locale: da })}
              </p>
              {/* Weekday headers */}
              <div className="mb-1 grid grid-cols-7 gap-px">
                {['M', 'T', 'O', 'T', 'F', 'L', 'S'].map((d, i) => (
                  <div key={i} className="text-center text-[9px] font-semibold text-[#b0ae a6]">{d}</div>
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
              <div key={h.id} className="flex items-center justify-between rounded-2xl border border-[#e8e7e0] bg-white px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
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
    </div>
  );
}
