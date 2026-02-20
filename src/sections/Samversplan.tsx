import { useCallback, useMemo, useState } from 'react';
import { useAppStore } from '@/store';
import { eventId, notificationId } from '@/lib/id';
import { cn, getCurrentParentForChild, weekdayNames } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Settings,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek
} from 'date-fns';
import { da } from 'date-fns/locale';
import { toast } from 'sonner';

const toWeekdayIndex = (day: Date): number => {
  const jsDay = day.getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
};

const getParentDayPalette = (color: 'warm' | 'cool' | 'neutral') => {
  if (color === 'warm') {
    return {
      card: 'border-[#f4c89f] bg-[#fff2e6]',
      text: 'text-[#cc6f1f]',
      avatarClass: 'bg-[#f58a2d] text-white',
    };
  }

  if (color === 'cool') {
    return {
      card: 'border-[#2f2f2f] bg-[#2f2f2f]',
      text: 'text-white',
      avatarClass: 'bg-[#4f4b45] text-white',
    };
  }

  return {
    card: 'border-[#d8d7cf] bg-[#f4f3ee]',
    text: 'text-[#5f5c53]',
    avatarClass: 'bg-[#dfddd5] text-[#5f5c53]',
  };
};

export function Samversplan() {
  const { users, children, custodyPlans, currentUser, addEvent, addNotification, setActiveTab } = useAppStore();
  const custodyPlan = custodyPlans[0];
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [isSwapDialogOpen, setIsSwapDialogOpen] = useState(false);
  const [selectedSwapDate, setSelectedSwapDate] = useState<Date | null>(null);
  const [swapReason, setSwapReason] = useState('');
  const [swapRequestedTo, setSwapRequestedTo] = useState('');

  const currentChild = children[0];
  const parent1 = users.find(u => u.id === currentChild?.parent1Id);
  const parent2 = users.find(u => u.id === currentChild?.parent2Id);
  const warmParent = [parent1, parent2].find((parent) => parent?.color === 'warm') || parent1 || parent2;
  const coolParent = [parent1, parent2].find((parent) => parent?.color === 'cool') || parent2 || parent1;

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const monthLeadingEmptyDays = (getDay(monthStart) + 6) % 7;
  const monthTrailingEmptyDays = (7 - ((monthLeadingEmptyDays + monthDays.length) % 7)) % 7;
  const monthGridDays: Array<Date | null> = [
    ...Array.from({ length: monthLeadingEmptyDays }, () => null),
    ...monthDays,
    ...Array.from({ length: monthTrailingEmptyDays }, () => null),
  ];

  const handoverDays = useMemo(() => (
    custodyPlan?.pattern === 'custom' && custodyPlan?.customWeekConfig?.handoverDays?.length
      ? custodyPlan.customWeekConfig.handoverDays
      : [custodyPlan?.swapDay ?? 4]
  ), [custodyPlan]);

  const getParentForDay = useCallback((day: Date) => {
    if (!custodyPlan || !currentChild) return null;
    const parentId = getCurrentParentForChild(
      currentChild.id,
      custodyPlan,
      currentChild.parent1Id,
      currentChild.parent2Id,
      day
    );
    return users.find(u => u.id === parentId);
  }, [custodyPlan, currentChild, users]);

  const getHandoverTransition = useCallback((day: Date) => {
    const previousParent = getParentForDay(addDays(day, -1));
    const currentParent = getParentForDay(day);
    const nextParent = getParentForDay(addDays(day, 1));

    if (!currentParent) return null;

    if (currentParent.id === nextParent?.id && previousParent && previousParent.id !== currentParent.id) {
      return { fromParent: previousParent, toParent: currentParent };
    }

    if (nextParent && currentParent.id !== nextParent.id) {
      return { fromParent: currentParent, toParent: nextParent };
    }

    return null;
  }, [getParentForDay]);

  const visibleRangeDays = useMemo(() => {
    if (viewMode === 'week') return weekDays;
    return monthDays;
  }, [viewMode, weekDays, monthDays]);

  const transitionsInVisibleRange = useMemo(() => {
    return visibleRangeDays
      .filter((day) => handoverDays.includes(toWeekdayIndex(day)))
      .map((day) => ({ day, transition: getHandoverTransition(day) }))
      .filter((item) => Boolean(item.transition))
      .slice(0, 8);
  }, [visibleRangeDays, handoverDays, getHandoverTransition]);

  const goToPrevious = () => {
    setCurrentDate((prev) => (
      viewMode === 'week' ? addDays(prev, -7) : addMonths(prev, -1)
    ));
  };

  const goToNext = () => {
    setCurrentDate((prev) => (
      viewMode === 'week' ? addDays(prev, 7) : addMonths(prev, 1)
    ));
  };

  const openSwapDialog = (day: Date) => {
    const currentDayParent = getParentForDay(day);
    const fallbackRecipient = users.find((user) => (
      user.role === 'parent' && user.id !== currentUser?.id
    ))?.id || '';

    setSelectedSwapDate(day);
    setSwapReason('');
    setSwapRequestedTo(
      currentDayParent?.id && currentDayParent.id !== currentUser?.id
        ? currentDayParent.id
        : fallbackRecipient
    );
    setIsSwapDialogOpen(true);
  };

  const createSwapRequest = () => {
    if (!selectedSwapDate || !currentUser || !currentChild) {
      toast.error('Vælg en dag først');
      return;
    }
    if (!swapRequestedTo) {
      toast.error('Vælg hvem du vil sende anmodningen til');
      return;
    }

    const recipient = users.find((user) => user.id === swapRequestedTo);
    const startAt = new Date(selectedSwapDate);
    startAt.setHours(12, 0, 0, 0);
    const endAt = new Date(selectedSwapDate);
    endAt.setHours(12, 30, 0, 0);

    addEvent({
      id: eventId(),
      title: `Bytteanmodning · ${format(selectedSwapDate, 'EEE d. MMM', { locale: da })}`,
      description: `${currentUser.name} ønsker at bytte samvær.\nBegrundelse: ${swapReason.trim() || 'Ikke angivet'}`,
      type: 'handover',
      startDate: startAt.toISOString(),
      endDate: endAt.toISOString(),
      childId: currentChild.id,
      createdBy: currentUser.id,
      assignedTo: [currentUser.id, swapRequestedTo],
    });

    addNotification({
      id: notificationId(),
      type: 'schedule_change',
      title: 'Ny bytteanmodning',
      message: `${currentUser.name} vil bytte ${format(selectedSwapDate, 'EEEE d. MMMM', { locale: da })}`,
      recipientId: swapRequestedTo,
      read: false,
      createdAt: new Date().toISOString(),
    });

    toast.success(`Bytteanmodning sendt til ${recipient?.name || 'forælder'}`);
    setIsSwapDialogOpen(false);
    setSwapReason('');
  };

  return (
    <div className="space-y-4 p-1">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-[1.35rem] font-bold tracking-[-0.02em] text-[#2f2f2d]">Samværsplan</h1>
          <p className="text-[13px] text-[#78766d] max-w-[260px] truncate">
            {custodyPlan?.name || 'Ingen plan'}
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setActiveTab('samversconfig')}
          className="border-[#d9d8d1] bg-[#f8f7f3] hover:bg-[#efeee8]"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 gap-2 sm:grid-cols-2"
      >
        {warmParent && (
          <div className="flex items-center gap-2 rounded-xl border border-[#f3c59d] bg-[#fff2e6] px-3 py-2">
            <Avatar className="h-7 w-7">
              <AvatarImage src={warmParent.avatar} />
              <AvatarFallback className="bg-[#f58a2d] text-xs text-white">
                {warmParent.name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[#cc6f1f]">{warmParent.name}</p>
              <p className="text-xs text-[#d0792e]">Orange</p>
            </div>
          </div>
        )}
        {coolParent && (
          <div className="flex items-center gap-2 rounded-xl border border-[#32302b] bg-[#2f2f2f] px-3 py-2">
            <Avatar className="h-7 w-7">
              <AvatarImage src={coolParent.avatar} />
              <AvatarFallback className="bg-[#4f4b45] text-xs text-white">
                {coolParent.name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{coolParent.name}</p>
              <p className="text-xs text-[#e2e1dc]">Sort</p>
            </div>
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-between rounded-xl border border-[#d8d7cf] bg-[#f8f7f3] p-2"
      >
        <Button variant="ghost" size="icon" onClick={goToPrevious}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <button
          type="button"
          onClick={() => setViewMode((prev) => (prev === 'week' ? 'month' : 'week'))}
          className="rounded-xl px-3 py-1 text-center transition-colors hover:bg-[#efeee8]"
        >
          {viewMode === 'week' ? (
            <>
              <p className="font-semibold text-[#2f2f2d]">Uge {format(currentDate, 'w', { locale: da })}</p>
              <p className="text-sm text-[#75736b]">
                {format(weekStart, 'dd. MMM', { locale: da })} - {format(addDays(weekStart, 6), 'dd. MMM', { locale: da })}
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold capitalize text-[#2f2f2d]">
                {format(currentDate, 'MMMM yyyy', { locale: da })}
              </p>
              <p className="text-sm text-[#75736b]">Tryk for at skifte tilbage til ugevisning</p>
            </>
          )}
        </button>
        <Button variant="ghost" size="icon" onClick={goToNext}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {viewMode === 'week' ? (
          <Card className="overflow-hidden border-[#d8d7cf]">
            <CardContent className="p-0">
              <div className="grid grid-cols-7 divide-x divide-[#e7e6df]">
                {weekDays.map((day, index) => {
                  const parent = getParentForDay(day);
                  const isToday = isSameDay(day, new Date());
                  const isWeekend = index >= 5;
                  const palette = getParentDayPalette(parent?.color || 'neutral');

                  return (
                    <div
                      key={day.toISOString()}
                      role="button"
                      tabIndex={0}
                      onClick={() => openSwapDialog(day)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          openSwapDialog(day);
                        }
                      }}
                      className={cn(
                        "min-h-[120px] cursor-pointer p-1.5 transition-colors hover:bg-[#f4f2ec]",
                        isWeekend && "bg-[#f1f0ea]/65"
                      )}
                    >
                      <div className={cn(
                        "mb-2 rounded-lg py-1 text-center",
                        isToday && "bg-[#fff2e6]"
                      )}>
                        <p className={cn(
                          "text-xs font-medium",
                          isToday ? "text-[#f58a2d]" : "text-[#77756c]"
                        )}>
                          {weekdayNames[index]}
                        </p>
                        <p className={cn(
                          "text-lg font-semibold",
                          isToday ? "text-[#f58a2d]" : "text-[#2f2f2d]"
                        )}>
                          {format(day, 'd')}
                        </p>
                      </div>

                      {parent && (
                        <div className={cn(
                          "rounded-lg border p-1.5 text-center",
                          palette.card
                        )}>
                          <Avatar className="mx-auto mb-1 h-6 w-6">
                            <AvatarImage src={parent.avatar} />
                            <AvatarFallback className={cn("text-[10px]", palette.avatarClass)}>
                              {parent.name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <p className={cn("truncate text-[10px] font-semibold", palette.text)}>
                            {parent.name.split(' ')[0]}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="border-t border-[#ecebe4] bg-[#f8f7f3] px-3 py-2 text-xs text-[#75736b]">
                Tryk på en dag for at sende bytteanmodning.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden border-[#d8d7cf]">
            <CardContent className="p-0">
              <div className="grid grid-cols-7 border-b border-[#e7e6df]">
                {weekdayNames.map((day) => (
                  <div key={day} className="py-2 text-center text-xs font-semibold text-[#726f67]">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {monthGridDays.map((day, idx) => {
                  if (!day) {
                    return (
                      <div
                        key={`empty-${idx}`}
                        className="min-h-[84px] border-b border-r border-[#ecebe4] bg-[#f3f2ec]"
                      />
                    );
                  }

                  const parent = getParentForDay(day);
                  const palette = getParentDayPalette(parent?.color || 'neutral');
                  const isToday = isSameDay(day, new Date());
                  const isCurrentMonthDay = isSameMonth(day, currentDate);

                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      onClick={() => openSwapDialog(day)}
                      className={cn(
                        "min-h-[84px] border-b border-r border-[#ecebe4] px-1.5 py-1.5 text-left transition-colors hover:bg-[#f1efe8]",
                        !isCurrentMonthDay && "bg-[#f3f2ec]"
                      )}
                    >
                      <div className={cn(
                        "mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                        isToday ? "bg-[#f58a2d] text-white" : "text-[#5d5a52]"
                      )}>
                        {format(day, 'd')}
                      </div>
                      {parent && (
                        <div className={cn("flex items-center gap-1 rounded-md border px-1 py-1", palette.card)}>
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={parent.avatar} />
                            <AvatarFallback className={cn("text-[9px]", palette.avatarClass)}>
                              {parent.name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className={cn("truncate text-[10px] font-semibold", palette.text)}>
                            {parent.name.split(' ')[0]}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>


      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="border-[#d8d7cf]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-[#6f6b62]" />
              Kommende skiftedage
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {transitionsInVisibleRange.map(({ day, transition }) => {
                if (!transition) return null;
                return (
                  <div
                    key={day.toISOString()}
                    className="flex items-center gap-3 rounded-xl border border-[#e2e1d9] bg-[#f8f7f3] p-3"
                  >
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#eceae2]">
                      <span className="text-base font-semibold text-[#504d45]">
                        {format(day, 'd')}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[#2f2f2d]">{format(day, 'EEEE', { locale: da })}</p>
                      <p className="text-sm text-[#6f6c64]">
                        Aflevering fra {transition.fromParent.name} til {transition.toParent.name}
                        {custodyPlan?.customWeekConfig?.handoverContext === 'after_daycare'
                          ? ' (efter vuggestue)'
                          : ` kl. ${custodyPlan?.customWeekConfig?.handoverTime || custodyPlan?.swapTime || '16:00'}`}
                      </p>
                    </div>
                    <Badge variant="outline" className="flex items-center gap-1 border-[#d7d6cd] text-[#625f57]">
                      <CheckCircle2 className="h-3 w-3" />
                      Bekræftet
                    </Badge>
                  </div>
                );
              })}
              {transitionsInVisibleRange.length === 0 && (
                <div className="rounded-xl border border-dashed border-[#d1d0c8] bg-[#f4f3ee] p-4 text-sm text-[#747168]">
                  Ingen skiftedage i den valgte periode.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={isSwapDialogOpen} onOpenChange={setIsSwapDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Anmod om bytte</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <p className="text-sm text-[#5f5c53]">
              {selectedSwapDate
                ? `Du anmoder om bytte for ${format(selectedSwapDate, 'EEEE d. MMMM', { locale: da })}.`
                : 'Vælg en dag i samværskalenderen først.'}
            </p>
            <div className="space-y-2">
              <p className="text-xs font-medium text-[#6f6c64]">Sendes til</p>
              <div className="flex flex-wrap gap-2">
                {users
                  .filter((user) => user.role === 'parent' && user.id !== currentUser?.id)
                  .map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => setSwapRequestedTo(user.id)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium",
                        swapRequestedTo === user.id
                          ? "border-[#f3c59d] bg-[#fff2e6] text-[#2f2f2d]"
                          : "border-[#d8d7cf] bg-[#f8f7f3] text-[#6f6c64]"
                      )}
                    >
                      {user.name}
                    </button>
                  ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-[#6f6c64]">Begrundelse</p>
              <Textarea
                value={swapReason}
                onChange={(event) => setSwapReason(event.target.value)}
                placeholder="Fx arbejde torsdag eftermiddag, ønsker bytte med fredag."
                rows={3}
              />
            </div>
            <Button className="w-full" onClick={createSwapRequest}>
              Send bytteanmodning
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
