import { useState, useMemo } from 'react';
import { useAppStore } from '@/store';
import { useFamilyContext } from '@/hooks/useFamilyContext';
import { OverblikSidePanel } from '@/components/custom/OverblikSidePanel';
import { RoutineSetupSheet } from '@/components/custom/RoutineSetupSheet';
import { RoutineLogSheet } from '@/components/custom/RoutineLogSheet';
import { RoutineNotificationSheet } from '@/components/custom/RoutineNotificationSheet';
import { format, addDays, subDays } from 'date-fns';
import { da } from 'date-fns/locale';
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  ListChecks,
  Share2,
  CheckCircle2,
  Circle,
  Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { routineLogId } from '@/lib/id';
import type { RoutineItem, RoutineLog, RoutineCategory } from '@/types';

const CATEGORY_META: Record<RoutineCategory, { label: string; emoji: string }> = {
  morgen: { label: 'Morgenrutine', emoji: '☀️' },
  dag: { label: 'Dagsrutine', emoji: '🌤️' },
  aften: { label: 'Aftenrutine', emoji: '🌙' },
};

const CATEGORY_ORDER: RoutineCategory[] = ['morgen', 'dag', 'aften'];

export function RutinerView() {
  const { currentUser, routineItems, routineLogs, children, currentChildId, addRoutineLog, updateRoutineLog } = useAppStore();
  const { currentChild } = useFamilyContext();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [setupOpen, setSetupOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [logSheetItem, setLogSheetItem] = useState<{ item: RoutineItem; log?: RoutineLog } | null>(null);

  const child = currentChild ?? children.find(c => c.id === currentChildId) ?? children[0] ?? null;
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');

  // Get active routine items for this child
  const activeItems = useMemo(() =>
    routineItems
      .filter(i => i.childId === child?.id && i.isActive)
      .sort((a, b) => a.order - b.order),
    [routineItems, child?.id]
  );

  // Get logs for selected date
  const todayLogs = useMemo(() =>
    routineLogs.filter(l => l.childId === child?.id && l.date === dateStr),
    [routineLogs, child?.id, dateStr]
  );

  // Group items by category
  const grouped = useMemo(() => {
    const map = new Map<RoutineCategory, { item: RoutineItem; log?: RoutineLog }[]>();
    for (const cat of CATEGORY_ORDER) map.set(cat, []);
    for (const item of activeItems) {
      const log = todayLogs.find(l => l.routineItemId === item.id);
      map.get(item.category)?.push({ item, log });
    }
    return map;
  }, [activeItems, todayLogs]);

  const totalItems = activeItems.length;
  const completedCount = todayLogs.filter(l => l.completed).length;

  function handleToggle(item: RoutineItem, existingLog?: RoutineLog) {
    if (!currentUser || !child) return;
    if (existingLog) {
      updateRoutineLog(existingLog.id, {
        completed: !existingLog.completed,
        completedAt: !existingLog.completed ? new Date().toISOString() : undefined,
        completedBy: !existingLog.completed ? currentUser.id : undefined,
        time: !existingLog.completed ? format(new Date(), 'HH:mm') : undefined,
      });
    } else {
      addRoutineLog({
        id: routineLogId(),
        routineItemId: item.id,
        childId: child.id,
        date: dateStr,
        completed: true,
        completedAt: new Date().toISOString(),
        completedBy: currentUser.id,
        time: format(new Date(), 'HH:mm'),
      });
    }
  }

  function handleShare() {
    const lines: string[] = [];
    lines.push(`Rutiner for ${child?.name ?? 'barn'} — ${format(selectedDate, 'EEEE d. MMMM', { locale: da })}`);
    lines.push('');
    for (const cat of CATEGORY_ORDER) {
      const items = grouped.get(cat) ?? [];
      if (items.length === 0) continue;
      lines.push(`${CATEGORY_META[cat].emoji} ${CATEGORY_META[cat].label}`);
      for (const { item, log } of items) {
        const check = log?.completed ? '✅' : '⬜';
        const timeStr = log?.time ? ` (kl. ${log.time})` : '';
        lines.push(`${check} ${item.emoji} ${item.label}${timeStr}`);
        if (log?.note) lines.push(`   📝 ${log.note}`);
      }
      lines.push('');
    }
    lines.push(`${completedCount}/${totalItems} rutiner gennemført`);
    const text = lines.join('\n');

    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      toast.success('Kopieret til udklipsholder');
    }
  }

  // Empty state — no routines configured
  if (activeItems.length === 0) {
    return (
      <div className="space-y-1.5 py-1">
        <OverblikSidePanel />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[1.35rem] font-bold tracking-[-0.02em] text-[#2f2f2d]">Rutiner</h1>
            {child && <p className="text-[13px] text-[#78766d]">{child.name}</p>}
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-[#d0cec5] bg-[#faf9f6] py-16 text-center">
          <ListChecks className="h-10 w-10 text-[#c8c6bc]" />
          <div>
            <p className="text-sm font-semibold text-[#3f3e3a]">Ingen rutiner opsat endnu</p>
            <p className="mt-1 text-[12px] text-[#78766d]">Opsæt morgen-, dags- og aftenrutiner for {child?.name ?? 'dit barn'}</p>
          </div>
          <Button
            className="mt-1 h-9 rounded-[4px] bg-[#2f2f2f] px-6 text-sm text-white hover:bg-[#1a1a1a]"
            onClick={() => setSetupOpen(true)}
          >
            Opsæt rutiner
          </Button>
        </div>
        <RoutineSetupSheet open={setupOpen} onOpenChange={setSetupOpen} childId={child?.id ?? ''} />
      </div>
    );
  }

  return (
    <div className="space-y-1.5 py-1">
      <OverblikSidePanel />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[1.35rem] font-bold tracking-[-0.02em] text-[#2f2f2d]">Rutiner</h1>
          {child && <p className="text-[13px] text-[#78766d]">{child.name}</p>}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setNotifOpen(true)}
            className="rounded-full p-2 text-[#78766d] hover:bg-[#f2f1ed] transition-colors"
          >
            <Bell className="h-5 w-5" />
          </button>
          <button
            onClick={() => setSetupOpen(true)}
            className="rounded-full p-2 text-[#78766d] hover:bg-[#f2f1ed] transition-colors"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Date navigator */}
      <div className="flex items-center justify-between rounded-[4px] border border-[#e8e7e0] bg-white px-3 py-2">
        <button onClick={() => setSelectedDate(d => subDays(d, 1))} className="rounded-full p-1 hover:bg-[#f2f1ed]">
          <ChevronLeft className="h-5 w-5 text-[#5f5d56]" />
        </button>
        <button
          onClick={() => setSelectedDate(new Date())}
          className="text-[14px] font-semibold text-[#2f2f2d]"
        >
          {isToday ? 'I dag' : format(selectedDate, 'EEEE d. MMM', { locale: da })}
        </button>
        <button onClick={() => setSelectedDate(d => addDays(d, 1))} className="rounded-full p-1 hover:bg-[#f2f1ed]">
          <ChevronRight className="h-5 w-5 text-[#5f5d56]" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full bg-[#ecebe5] overflow-hidden">
          <div
            className="h-full rounded-full bg-[#4caf50] transition-all duration-300"
            style={{ width: totalItems > 0 ? `${(completedCount / totalItems) * 100}%` : '0%' }}
          />
        </div>
        <span className="text-[12px] font-semibold text-[#78766d]">{completedCount}/{totalItems}</span>
      </div>

      {/* Routine categories */}
      {CATEGORY_ORDER.map(cat => {
        const items = grouped.get(cat) ?? [];
        if (items.length === 0) return null;
        const catCompleted = items.filter(({ log }) => log?.completed).length;
        const allDone = catCompleted === items.length;

        return (
          <div key={cat} className="space-y-1">
            <div className="flex items-center justify-between">
              <h2 className="text-[13px] font-bold uppercase tracking-[0.05em] text-[#78766d]">
                {CATEGORY_META[cat].emoji} {CATEGORY_META[cat].label}
              </h2>
              {allDone && (
                <span className="text-[11px] font-semibold text-[#4caf50]">Færdig!</span>
              )}
            </div>
            <div className="space-y-1">
              {items.map(({ item, log }) => {
                const done = log?.completed ?? false;
                return (
                  <div
                    key={item.id}
                    className={cn(
                      'flex items-center gap-3 rounded-[4px] border px-4 py-3 transition-all',
                      done
                        ? 'border-[#c8e6c9] bg-[#f1f8f1]'
                        : 'border-[#e8e7e0] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.03)]'
                    )}
                  >
                    <button
                      onClick={() => handleToggle(item, log)}
                      className="shrink-0"
                    >
                      {done ? (
                        <CheckCircle2 className="h-6 w-6 text-[#4caf50]" />
                      ) : (
                        <Circle className="h-6 w-6 text-[#c8c6bc]" />
                      )}
                    </button>
                    <button
                      className="flex-1 min-w-0 text-left"
                      onClick={() => setLogSheetItem({ item, log })}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[15px]">{item.emoji}</span>
                        <span className={cn(
                          'text-[14px] font-medium',
                          done ? 'text-[#78766d] line-through' : 'text-[#2f2f2d]'
                        )}>
                          {item.label}
                        </span>
                      </div>
                      {log?.time && (
                        <p className="mt-0.5 text-[11px] text-[#9b9a93]">
                          Kl. {log.time}
                          {log.note && ` — ${log.note}`}
                        </p>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Share button */}
      <Button
        variant="outline"
        className="w-full rounded-[4px] border-[#d8d7cf] text-[13px] text-[#5f5d56]"
        onClick={handleShare}
      >
        <Share2 className="mr-2 h-4 w-4" />
        Del overblik
      </Button>

      <RoutineSetupSheet open={setupOpen} onOpenChange={setSetupOpen} childId={child?.id ?? ''} />
      <RoutineLogSheet
        open={!!logSheetItem}
        onOpenChange={(open) => { if (!open) setLogSheetItem(null); }}
        item={logSheetItem?.item ?? null}
        log={logSheetItem?.log}
        dateStr={dateStr}
      />
      <RoutineNotificationSheet
        open={notifOpen}
        onOpenChange={setNotifOpen}
        childId={child?.id ?? ''}
        childName={child?.name ?? ''}
      />
    </div>
  );
}
