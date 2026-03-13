import { useCallback, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore } from '@/store';
import { cn, getCurrentParentForChild, getEffectiveColor, weekdayNames } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ArrowRightLeft,
  X
} from 'lucide-react';
import { CustodyConfig } from './CustodyConfig';
import { useIsFamilyMember } from '@/hooks/useIsFamilyMember';
import { ShareCustodyPlan } from '@/components/custom/ShareCustodyPlan';
import { motion, AnimatePresence } from 'framer-motion';
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

const toWeekdayIndex = (day: Date): number => {
  const jsDay = day.getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
};

const getParentDayPalette = (color: 'warm' | 'cool' | 'neutral') => {
  if (color === 'warm') {
    return {
      card: 'border-[#f4c89f] bg-orange-tint',
      text: 'text-[#cc6f1f]',
      avatarClass: 'bg-[#f58a2d] text-white',
    };
  }

  if (color === 'cool') {
    return {
      card: 'border-primary bg-primary',
      text: 'text-white',
      avatarClass: 'bg-primary text-white',
    };
  }

  return {
    card: 'border-border bg-card',
    text: 'text-[#5f5c53]',
    avatarClass: 'bg-muted text-[#5f5c53]',
  };
};

export function Samversplan() {
  const { users, children, custodyPlans, currentUser, sideMenuOpen, setSideMenuOpen, sideMenuContext, setSideMenuContext, setSwapRequestDate, setActiveTab } = useAppStore();
  const { isFamilyMember } = useIsFamilyMember();
  const custodyPlan = custodyPlans[0];
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

  const currentChild = children[0];
  // Perspektiv-baseret: indlogget bruger = sort, anden forælder = orange
  const meParent = currentUser;
  const rawOtherParentId = currentChild
    ? (currentChild.parent1Id === currentUser?.id
        ? currentChild.parent2Id
        : currentChild.parent2Id === currentUser?.id
          ? currentChild.parent1Id
          : currentChild.parent2Id)
    : undefined;
  // Guard: hvis "anden forælder" er mig selv, er der ingen rigtig forælder 2
  const otherParentId = rawOtherParentId && rawOtherParentId !== currentUser?.id
    ? rawOtherParentId : undefined;
  const otherParent = otherParentId
    ? users.find(u => u.id === otherParentId)
    : undefined;

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
    custodyPlan?.customWeekConfig?.handoverDays?.length
      ? custodyPlan.customWeekConfig.handoverDays
      : [custodyPlan?.swapDay ?? 4]
  ), [custodyPlan]);

  const getParentForDay = useCallback((day: Date) => {
    if (!custodyPlan || !currentChild) return null;
    // Brug __parent2__ som placeholder når parent2 = parent1 (ingen reel forælder 2)
    const p2Id = currentChild.parent2Id && currentChild.parent2Id !== currentChild.parent1Id
      ? currentChild.parent2Id
      : '__parent2__';
    const parentId = getCurrentParentForChild(
      currentChild.id,
      custodyPlan,
      currentChild.parent1Id,
      p2Id,
      day
    );
    const found = users.find(u => u.id === parentId);
    if (found) return found;
    // Placeholder for forælder der ikke er tilknyttet endnu
    if (parentId) {
      const isMe = parentId === currentUser?.id;
      return {
        id: parentId,
        name: isMe ? (currentUser?.name || 'Dig') : 'Forælder 2',
        email: '',
        color: (isMe ? 'cool' : 'warm') as 'warm' | 'cool' | 'neutral',
        role: 'parent' as const,
      };
    }
    return null;
  }, [custodyPlan, currentChild, users, currentUser]);

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
    if (isFamilyMember) return; // View-only for family members
    setSwapRequestDate(day);
    setActiveTab('swap-request');
  };


  // Debug: log pattern ved render
  console.log('[Samversplan] custodyPlan pattern:', custodyPlan?.pattern, 'customWeekConfig:', custodyPlan?.customWeekConfig?.evenWeekAssignments);

  return (
    <div className="space-y-1.5 py-1">
      {/* ─── Side panel: CustodyConfig full-screen — portal ─── */}
      {createPortal(
      <AnimatePresence>
        {sideMenuOpen && sideMenuContext === 'samversplan' && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[9998] bg-black/30"
              onClick={() => setSideMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="fixed inset-y-0 left-0 z-[9999] w-full bg-card flex flex-col"
              style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
            >
              <div className="flex items-center justify-between px-5 py-3">
                <h2 className="text-[17px] font-bold text-foreground">Indstillinger</h2>
                <button
                  onClick={() => setSideMenuOpen(false)}
                  className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom,0px)]">
                <CustodyConfig />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body
      )}

      {/* Konfigurationsbanner hvis plan ikke er konfigureret */}
      {custodyPlan && !custodyPlan.customWeekConfig && (
        <Card className="border-orange-tint bg-orange-tint">
          <CardContent className="p-4 text-center space-y-2">
            <p className="text-[14px] font-semibold text-foreground">
              Bekræft din samværsplan
            </p>
            <p className="text-[13px] text-muted-foreground">
              Åbn indstillinger for at konfigurere hvem der har barnet hvornår.
            </p>
            <Button
              onClick={() => { setSideMenuContext('samversplan'); setSideMenuOpen(true); }}
              className="bg-primary text-white hover:bg-primary"
            >
              Konfigurer plan
            </Button>
          </CardContent>
        </Card>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 gap-2 sm:grid-cols-2"
      >
        {meParent && (
          <div className="flex items-center gap-2 rounded-[12px] border border-border bg-primary px-3 py-2">
            <Avatar className="h-7 w-7">
              <AvatarImage src={meParent.avatar} />
              <AvatarFallback className="bg-primary text-xs text-white">
                {meParent.name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{meParent.name}</p>
              <p className="text-xs text-muted-foreground">Sort</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2 rounded-[12px] border border-orange-tint bg-orange-tint px-3 py-2">
          <Avatar className="h-7 w-7">
            {otherParent && <AvatarImage src={otherParent.avatar} />}
            <AvatarFallback className="bg-[#f58a2d] text-xs text-white">
              {otherParent ? otherParent.name[0] : '?'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[#cc6f1f]">
              {otherParent ? otherParent.name : 'Forælder 2'}
            </p>
            <p className="text-xs text-[#d0792e]">
              {otherParent ? 'Orange' : 'Ikke tilknyttet'}
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-between rounded-[8px] border border-border bg-card p-2"
      >
        <Button variant="ghost" size="icon" onClick={goToPrevious}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <button
          type="button"
          onClick={() => setViewMode((prev) => (prev === 'week' ? 'month' : 'week'))}
          className="rounded-[8px] px-3 py-1 text-center transition-colors hover:bg-card"
        >
          {viewMode === 'week' ? (
            <>
              <p className="font-semibold text-foreground">Uge {format(currentDate, 'w', { locale: da })}</p>
              <p className="text-sm text-muted-foreground">
                {format(weekStart, 'dd. MMM', { locale: da })} - {format(addDays(weekStart, 6), 'dd. MMM', { locale: da })}
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold capitalize text-foreground">
                {format(currentDate, 'MMMM yyyy', { locale: da })}
              </p>
              <p className="text-sm text-muted-foreground">Tryk for at skifte tilbage til ugevisning</p>
            </>
          )}
        </button>
        <div className="flex items-center gap-1">
          {!isFamilyMember && custodyPlan && currentChild && (
            <ShareCustodyPlan plan={custodyPlan} child={currentChild} />
          )}
          <Button variant="ghost" size="icon" onClick={goToNext}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {viewMode === 'week' ? (
          <Card className="overflow-hidden border-border">
            <CardContent className="p-0">
              <div className="grid grid-cols-7 divide-x divide-border">
                {weekDays.map((day, index) => {
                  const parent = getParentForDay(day);
                  const isToday = isSameDay(day, new Date());
                  const isWeekend = index >= 5;
                  const isHandoverDay = handoverDays.includes(toWeekdayIndex(day));
                  const palette = getParentDayPalette(parent ? getEffectiveColor(parent, currentUser?.id) : 'neutral');

                  return (
                    <div
                      key={day.toISOString()}
                      role={parent ? "button" : undefined}
                      tabIndex={parent ? 0 : undefined}
                      onClick={() => parent && openSwapDialog(day)}
                      onKeyDown={(event) => {
                        if (parent && (event.key === 'Enter' || event.key === ' ')) {
                          event.preventDefault();
                          openSwapDialog(day);
                        }
                      }}
                      className={cn(
                        "min-h-[120px] p-1.5 transition-colors",
                        parent ? "cursor-pointer hover:bg-card" : "cursor-default opacity-50",
                        isWeekend && "bg-card/65"
                      )}
                    >
                      <div className={cn(
                        "mb-2 rounded-[8px] py-1 text-center",
                        isToday && "bg-orange-tint"
                      )}>
                        <p className={cn(
                          "text-xs font-medium",
                          isToday ? "text-[#f58a2d]" : "text-[#77756c]"
                        )}>
                          {weekdayNames[index]}
                        </p>
                        <p className={cn(
                          "text-lg font-semibold",
                          isToday ? "text-[#f58a2d]" : "text-foreground"
                        )}>
                          {format(day, 'd')}
                        </p>
                      </div>

                      {isHandoverDay && parent && (
                        <div className="flex items-center justify-center mb-1">
                          <ArrowRightLeft className="h-3 w-3 text-[#f58a2d]" />
                        </div>
                      )}

                      {parent && (
                        <div className={cn(
                          "rounded-[8px] border p-1.5 text-center",
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
              {!isFamilyMember && (
                <p className="border-t border-border bg-card px-3 py-2 text-xs text-muted-foreground">
                  Tryk på en dag for at sende bytteanmodning.
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden border-border">
            <CardContent className="p-0">
              <div className="grid grid-cols-7 border-b border-border">
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
                        className="min-h-[84px] border-b border-r border-border bg-card"
                      />
                    );
                  }

                  const parent = getParentForDay(day);
                  const palette = getParentDayPalette(parent ? getEffectiveColor(parent, currentUser?.id) : 'neutral');
                  const isToday = isSameDay(day, new Date());
                  const isCurrentMonthDay = isSameMonth(day, currentDate);
                  const isHandoverDay = handoverDays.includes(toWeekdayIndex(day));

                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      onClick={() => parent && openSwapDialog(day)}
                      disabled={!parent}
                      className={cn(
                        "min-h-[84px] border-b border-r border-border px-1.5 py-1.5 text-left transition-colors",
                        parent ? "hover:bg-card" : "cursor-default opacity-50",
                        !isCurrentMonthDay && "bg-card"
                      )}
                    >
                      <div className="mb-1 flex items-center gap-0.5">
                        <div className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                          isToday ? "bg-[#f58a2d] text-white" : "text-foreground"
                        )}>
                          {format(day, 'd')}
                        </div>
                        {isHandoverDay && parent && (
                          <ArrowRightLeft className="h-2.5 w-2.5 text-[#f58a2d]" />
                        )}
                      </div>
                      {parent && (
                        <div className={cn("flex items-center gap-1 rounded-[8px] border px-1 py-1", palette.card)}>
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
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              Kommende skiftedage
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {transitionsInVisibleRange.map(({ day, transition }) => {
                if (!transition) return null;
                return (
                  <div
                    key={day.toISOString()}
                    className="flex items-center gap-3 p-3 border-b border-border"
                  >
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[8px] bg-secondary">
                      <span className="text-base font-semibold text-foreground">
                        {format(day, 'd')}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">{format(day, 'EEEE', { locale: da })}</p>
                      <p className="text-sm text-[#6f6c64]">
                        Aflevering fra {transition.fromParent.name} til {transition.toParent.name}
                        {custodyPlan?.customWeekConfig?.handoverContext === 'after_daycare'
                          ? ' (efter vuggestue)'
                          : ` kl. ${custodyPlan?.customWeekConfig?.handoverTime || custodyPlan?.swapTime || '16:00'}`}
                      </p>
                    </div>
                    <Badge variant="outline" className="flex items-center gap-1 border-border text-foreground">
                      <CheckCircle2 className="h-3 w-3" />
                      Bekræftet
                    </Badge>
                  </div>
                );
              })}
              {transitionsInVisibleRange.length === 0 && (
                <div className="rounded-[8px] border border-dashed border-border bg-card p-4 text-sm text-[#747168]">
                  Ingen skiftedage i den valgte periode.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

    </div>
  );
}
