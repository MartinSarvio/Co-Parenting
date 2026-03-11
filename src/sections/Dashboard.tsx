import { useMemo, useState, useCallback, useEffect } from 'react';
import { useAppStore } from '@/store';
import useEmblaCarousel from 'embla-carousel-react';

import { cn, formatRelative, formatTime, getCurrentParentForChild, getNextHandoverDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  CalendarPlus,
  CheckSquare,
  MessageCircle,
  Clock,
  MapPin,
  ChevronRight,
  Home,
  User,
  CheckCircle2,
  UtensilsCrossed,
  Users,
  Repeat,
  Receipt,
  Camera,
  FileText,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { parseISO, isToday, isTomorrow, format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, startOfMonth, endOfMonth } from 'date-fns';
import { da } from 'date-fns/locale';

const QUICK_ACTIONS = [
  { id: 'kalender', label: 'Aftale', icon: CalendarPlus, tab: 'kalender', accent: true },
  { id: 'opgaver', label: 'Opgave', icon: CheckSquare, tab: 'opgaver', accent: false },
  { id: 'kommunikation', label: 'Besked', icon: MessageCircle, tab: 'kommunikation', accent: false },
  { id: 'mad-hjem', label: 'Mad', icon: UtensilsCrossed, tab: 'mad-hjem', accent: false },
  { id: 'samversplan', label: 'Samvær', icon: Repeat, tab: 'samversplan', accent: false },
  { id: 'expenses', label: 'Udgifter', icon: Receipt, tab: 'expenses', accent: false },
  { id: 'fotoalbum', label: 'Foto', icon: Camera, tab: 'fotoalbum', accent: false },
  { id: 'dokumenter', label: 'Dokument', icon: FileText, tab: 'dokumenter', accent: false },
];

const SCHEDULE_VIEWS = ['Dag', 'Uge', 'Måned'] as const;

function DotIndicator({ count, active }: { count: number; active: number }) {
  if (count <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-1.5 py-2">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={cn(
            "h-1.5 rounded-full transition-all duration-200",
            i === active ? "w-4 bg-[#f58a2d]" : "w-1.5 bg-[#d0cec5]"
          )}
        />
      ))}
    </div>
  );
}

export function Dashboard() {
  const {
    currentUser,
    users,
    children,
    custodyPlans,
    events,
    tasks,
    handovers,
    household,
    setActiveTab,
    dashboardScheduleView,
    setDashboardScheduleView,
    setDashboardFamilyLabel,
  } = useAppStore();
  const custodyPlan = custodyPlans[0];
  const isTogether = household?.familyMode === 'together';

  // Get next handover
  const nextHandover = custodyPlan
    ? getNextHandoverDate(custodyPlan)
    : null;

  // Get today's events
  const todaysEvents = events.filter(e => {
    const eventDate = parseISO(e.startDate);
    return isToday(eventDate);
  }).sort((a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime());

  // Get this week's events (for week view)
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const weekEventCounts = useMemo(() =>
    weekDays.map((day) => ({
      day,
      count: events.filter((e) => isSameDay(parseISO(e.startDate), day)).length,
    })),
    [events, weekDays]
  );

  // Get this month's events (for month view)
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const monthEventDays = useMemo(() =>
    new Set(
      events
        .filter((e) => {
          const d = parseISO(e.startDate);
          return d >= monthStart && d <= monthEnd;
        })
        .map((e) => format(parseISO(e.startDate), 'yyyy-MM-dd'))
    ),
    [events]
  );

  // Get pending tasks
  const pendingTasks = tasks.filter(t => !t.completed).slice(0, 3);

  // Get active handover
  const activeHandover = handovers.find(h => h.status !== 'completed');
  const handoverProgress = activeHandover
    ? Math.round((activeHandover.checklist.filter(i => i.completed).length / activeHandover.checklist.length) * 100)
    : 0;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Godmorgen';
    if (hour < 17) return 'God eftermiddag';
    return 'Godaften';
  };

  // Quick actions carousel
  const actionPages = useMemo(() => {
    const pages: typeof QUICK_ACTIONS[] = [];
    for (let i = 0; i < QUICK_ACTIONS.length; i += 4) {
      pages.push(QUICK_ACTIONS.slice(i, i + 4));
    }
    return pages;
  }, []);

  const [actionEmblaRef, actionEmblaApi] = useEmblaCarousel({ loop: false });
  const [actionActiveIndex, setActionActiveIndex] = useState(0);

  const onActionSelect = useCallback(() => {
    if (!actionEmblaApi) return;
    setActionActiveIndex(actionEmblaApi.selectedScrollSnap());
  }, [actionEmblaApi]);

  useEffect(() => {
    if (!actionEmblaApi) return;
    actionEmblaApi.on('select', onActionSelect);
    return () => { actionEmblaApi.off('select', onActionSelect); };
  }, [actionEmblaApi, onActionSelect]);

  // Schedule pager carousel
  const [scheduleEmblaRef, scheduleEmblaApi] = useEmblaCarousel({
    loop: false,
    startIndex: SCHEDULE_VIEWS.indexOf(dashboardScheduleView === 'week' ? 'Uge' : dashboardScheduleView === 'month' ? 'Måned' : 'Dag'),
  });
  const [scheduleActiveIndex, setScheduleActiveIndex] = useState(
    SCHEDULE_VIEWS.indexOf(dashboardScheduleView === 'week' ? 'Uge' : dashboardScheduleView === 'month' ? 'Måned' : 'Dag')
  );

  const onScheduleSelect = useCallback(() => {
    if (!scheduleEmblaApi) return;
    const idx = scheduleEmblaApi.selectedScrollSnap();
    setScheduleActiveIndex(idx);
    const views = ['day', 'week', 'month'] as const;
    setDashboardScheduleView(views[idx]);
  }, [scheduleEmblaApi, setDashboardScheduleView]);

  useEffect(() => {
    if (!scheduleEmblaApi) return;
    scheduleEmblaApi.on('select', onScheduleSelect);
    return () => { scheduleEmblaApi.off('select', onScheduleSelect); };
  }, [scheduleEmblaApi, onScheduleSelect]);

  // Family/person pager carousel
  const [familyEmblaRef, familyEmblaApi] = useEmblaCarousel({ loop: false });
  const [familyActiveIndex, setFamilyActiveIndex] = useState(0);

  const onFamilySelect = useCallback(() => {
    if (!familyEmblaApi) return;
    const idx = familyEmblaApi.selectedScrollSnap();
    setFamilyActiveIndex(idx);
  }, [familyEmblaApi]);

  useEffect(() => {
    if (!familyEmblaApi) return;
    familyEmblaApi.on('select', onFamilySelect);
    return () => { familyEmblaApi.off('select', onFamilySelect); };
  }, [familyEmblaApi, onFamilySelect]);

  // Build family pages
  const familyMembers = useMemo(() => [...users, ...children], [users, children]);

  // Children visible to current user (filtered for non-together modes)
  const myChildren = useMemo(() => {
    if (isTogether) return children;
    return children.filter(c =>
      c.parent1Id === currentUser?.id || c.parent2Id === currentUser?.id
    );
  }, [children, currentUser?.id, isTogether]);

  // Members shown in overview card (page 0)
  const overviewMembers = useMemo(() => {
    if (isTogether) return [...users, ...children];
    const members: Array<{ id: string; name: string; avatar?: string }> = [];
    if (currentUser) members.push(currentUser);
    members.push(...myChildren);
    return members;
  }, [isTogether, users, children, currentUser, myChildren]);

  // Individual slides after page 0
  const individualSlides = isTogether ? familyMembers : myChildren;

  const familyPageCount = 1 + individualSlides.length; // page 0 = overview, page 1+ = individuals

  // Sync active family label to store for TopBar
  useEffect(() => {
    if (familyActiveIndex === 0) {
      setDashboardFamilyLabel(null); // show household name
    } else if (isTogether) {
      setDashboardFamilyLabel(familyMembers[familyActiveIndex - 1]?.name || null);
    } else {
      const child = myChildren[familyActiveIndex - 1];
      setDashboardFamilyLabel(child?.name || null);
    }
  }, [familyActiveIndex, isTogether, familyMembers, myChildren, setDashboardFamilyLabel]);

  // Reset label when leaving dashboard
  useEffect(() => {
    return () => { setDashboardFamilyLabel(null); };
  }, [setDashboardFamilyLabel]);

  const weekdayLabels = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];

  return (
    <div className="space-y-1.5 py-1">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-2 px-1"
      >
        <h1 className="text-[2.05rem] font-semibold leading-[0.96] tracking-[-0.03em] text-[#262623]">
          {getGreeting()}, {currentUser?.name}
        </h1>
      </motion.div>

      {/* Status Card – Family/person pager carousel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="overflow-hidden" ref={familyEmblaRef}>
          <div className="flex gap-4">
            {/* Page 0: Family/person overview (all modes) */}
            <div className="min-w-0 flex-[0_0_100%]">
              <Card className="overflow-hidden border border-[#d8d7d1] bg-[#faf8f3]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Users className="h-7 w-7 shrink-0 text-[#2f2f2f]" />
                    <div className="flex-1 min-w-0">
                      <div className="flex -space-x-2">
                        {overviewMembers.map((m) => (
                          <Avatar key={m.id} className="h-10 w-10 border-2 border-white shadow-sm">
                            <AvatarImage src={m.avatar} />
                            <AvatarFallback className="bg-[#eceae2] text-xs text-[#4e4d47]">
                              {m.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      <p className="mt-1.5 text-[11px] text-[#a09e96]">
                        {overviewMembers.length} familiemedlemmer
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Page 1+: Individual slides */}
            {isTogether ? (
              /* Together: all family members */
              familyMembers.map((member) => {
                const isChild = children.some(c => c.id === member.id);
                return (
                  <div key={member.id} className="min-w-0 flex-[0_0_100%]">
                    <Card className="overflow-hidden border border-[#d8d7d1] bg-[#faf8f3]">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-14 w-14 border-2 border-white shadow-md">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback className="bg-[#eceae2] text-lg text-[#4e4d47]">
                              {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-2xl font-semibold tracking-[-0.02em] text-[#2f2f2d]">
                              {member.name}
                            </p>
                            <p className="text-sm text-[#74726a]">
                              {isChild ? 'Barn' : 'Forælder'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })
            ) : (
              /* Separated: one page per child with custody info */
              myChildren.map((child) => {
                const childParentId = custodyPlan
                  ? getCurrentParentForChild(child.id, custodyPlan, child.parent1Id, child.parent2Id)
                  : null;
                const childParent = users.find(u => u.id === childParentId);
                const childIsWithCurrentUser = childParentId === currentUser?.id;
                return (
                  <div key={child.id} className="min-w-0 flex-[0_0_100%]">
                    <Card className={cn(
                      "overflow-hidden border transition-all duration-300",
                      childIsWithCurrentUser
                        ? "border-[#d8d7d1] bg-[#faf8f3]"
                        : "border-[#d8d7d1] bg-[#f7f6f2]"
                    )}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {childIsWithCurrentUser ? (
                              <Home className="h-7 w-7 shrink-0 text-[#2f2f2f]" />
                            ) : (
                              <User className="h-7 w-7 shrink-0 text-[#2f2f2f]" />
                            )}
                            <div>
                              <p className="mb-1 text-sm text-[#74726a]">{child.name} er hos</p>
                              <p className="text-2xl font-semibold tracking-[-0.02em] text-[#2f2f2d]">
                                {childIsWithCurrentUser ? 'Dig' : childParent?.name}
                              </p>
                              {nextHandover && (
                                <div className="mt-1 flex items-center gap-1 text-sm text-[#7b796f]">
                                  <Clock className="h-4 w-4" />
                                  <span>
                                    {childIsWithCurrentUser ? 'Aflevering' : 'Afhentning'} {formatRelative(nextHandover).toLowerCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <Avatar className="h-14 w-14 border-2 border-white shadow-md">
                            <AvatarImage src={child.avatar} />
                            <AvatarFallback className="bg-[#eceae2] text-lg text-[#4e4d47]">
                              {child.name[0]}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })
            )}
          </div>
        </div>
        <DotIndicator count={familyPageCount} active={familyActiveIndex} />
      </motion.div>

      {/* Quick Actions — Embla Carousel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="overflow-hidden" ref={actionEmblaRef}>
          <div className="flex">
            {actionPages.map((page, pageIdx) => (
              <div key={pageIdx} className="min-w-0 flex-[0_0_100%]">
                <div className="grid grid-cols-4 gap-2">
                  {page.map(({ id, label, icon: Icon, tab, accent }) => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(tab)}
                      className="flex flex-col items-center gap-2 rounded-[8px] border border-[#d8d7d1] bg-[#f8f7f3] py-3 transition-colors hover:bg-[#efeee9] active:scale-95"
                    >
                      <Icon className={cn('h-6 w-6', accent ? 'text-[#f58a2d]' : 'text-[#4f4d45]')} />
                      <span className="text-[11px] font-semibold text-[#4a4945]">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <DotIndicator count={actionPages.length} active={actionActiveIndex} />
      </motion.div>

      {/* Schedule Pager — Dag / Uge / Måned */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="overflow-hidden" ref={scheduleEmblaRef}>
          <div className="flex gap-4">
            {/* Slide 1: Dag */}
            <div className="min-w-0 flex-[0_0_100%]">
              <Card className="min-h-[320px] border-[#d8d7d1] bg-[#f8f7f3]">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-[0.95rem] font-semibold tracking-[-0.01em] text-[#2f2f2d]">
                      Dag
                    </CardTitle>
                    <button onClick={() => setActiveTab('kalender')}
                      className="flex items-center gap-0.5 text-xs font-medium text-[#f58a2d]">
                      Se alle <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  {todaysEvents.length === 0 ? (
                    <div className="py-6 text-center">
                      <CalendarPlus className="h-8 w-8 text-[#b0ada4] mx-auto mb-2" />
                      <p className="text-sm text-[#a09e96]">Ingen planer i dag</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {todaysEvents.map((event) => (
                        <div
                          key={event.id}
                          className="flex items-center gap-3 rounded-[8px] border border-[#deddd5] bg-white p-3"
                        >
                          <div className="flex w-[52px] shrink-0 flex-col items-center">
                            <span className="text-sm font-semibold text-[#2f2f2d]">{formatTime(event.startDate)}</span>
                            <span className="text-[11px] text-[#a09e96]">{formatTime(event.endDate)}</span>
                          </div>
                          <div className="h-8 w-px bg-[#e8e7e0]" />
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-semibold text-[#2f2f2d]">{event.title}</p>
                            {event.location && (
                              <div className="flex items-center gap-1 text-[11px] text-[#a09e96]">
                                <MapPin className="h-3 w-3" />
                                {event.location}
                              </div>
                            )}
                          </div>
                          <Badge className="shrink-0 bg-[#eceae2] text-[11px] font-medium text-[#4f4d45] hover:bg-[#eceae2]">
                            {event.type === 'school' ? 'Skole' :
                             event.type === 'activity' ? 'Aktivitet' :
                             event.type === 'handover' ? 'Aflevering' : 'Aftale'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Slide 2: Uge */}
            <div className="min-w-0 flex-[0_0_100%]">
              <Card className="min-h-[320px] border-[#d8d7d1] bg-[#f8f7f3]">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-[0.95rem] font-semibold tracking-[-0.01em] text-[#2f2f2d]">
                      Uge
                    </CardTitle>
                    <button onClick={() => setActiveTab('kalender')}
                      className="flex items-center gap-0.5 text-xs font-medium text-[#f58a2d]">
                      Se alle <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-1">
                    {weekEventCounts.map(({ day, count }, idx) => {
                      const dayIsToday = isSameDay(day, new Date());
                      return (
                        <div
                          key={day.toISOString()}
                          className={cn(
                            "flex flex-col items-center rounded-xl py-2 transition-colors",
                            dayIsToday ? "bg-[#fff2e6]" : "bg-white"
                          )}
                        >
                          <span className={cn(
                            "text-[10px] font-semibold",
                            dayIsToday ? "text-[#f58a2d]" : "text-[#75736b]"
                          )}>
                            {weekdayLabels[idx]}
                          </span>
                          <span className={cn(
                            "text-lg font-bold",
                            dayIsToday ? "text-[#f58a2d]" : "text-[#2f2f2d]"
                          )}>
                            {format(day, 'd')}
                          </span>
                          <div className="mt-1 flex gap-0.5">
                            {count > 0
                              ? Array.from({ length: Math.min(count, 3) }, (_, i) => (
                                  <div key={i} className="h-1.5 w-1.5 rounded-full bg-[#f58a2d]" />
                                ))
                              : <div className="h-1.5 w-1.5 rounded-full bg-transparent" />
                            }
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Slide 3: Måned */}
            <div className="min-w-0 flex-[0_0_100%]">
              <Card className="min-h-[320px] border-[#d8d7d1] bg-[#f8f7f3]">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-[0.95rem] font-semibold tracking-[-0.01em] text-[#2f2f2d]">
                      Måned
                    </CardTitle>
                    <button onClick={() => setActiveTab('kalender')}
                      className="flex items-center gap-0.5 text-xs font-medium text-[#f58a2d]">
                      Se alle <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="mb-2 text-center text-sm font-semibold text-[#2f2f2d] capitalize">
                    {format(new Date(), 'MMMM yyyy', { locale: da })}
                  </p>
                  <div className="grid grid-cols-7 gap-px">
                    {weekdayLabels.map((d) => (
                      <div key={d} className="py-1 text-center text-[9px] font-semibold text-[#75736b]">
                        {d}
                      </div>
                    ))}
                    {Array.from({ length: (monthStart.getDay() + 6) % 7 }, (_, i) => (
                      <div key={`pad-${i}`} />
                    ))}
                    {monthDays.map((day) => {
                      const dayIsToday = isSameDay(day, new Date());
                      const hasEvents = monthEventDays.has(format(day, 'yyyy-MM-dd'));
                      return (
                        <div
                          key={day.toISOString()}
                          className="flex flex-col items-center py-0.5"
                        >
                          <div className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold",
                            dayIsToday ? "bg-[#f58a2d] text-white" : "text-[#2f2f2d]"
                          )}>
                            {format(day, 'd')}
                          </div>
                          {hasEvents && (
                            <div className="mt-0.5 h-1 w-1 rounded-full bg-[#f58a2d]" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        <DotIndicator count={3} active={scheduleActiveIndex} />
      </motion.div>

      {/* Handover Progress */}
      {activeHandover && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-[#d8d7d1] bg-[#f8f7f3]">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[0.95rem] font-semibold tracking-[-0.01em] text-[#2f2f2d]">
                  Afleveringsstatus
                </CardTitle>
                <span className="text-sm font-semibold text-[#f58a2d]">{handoverProgress}%</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <Progress value={handoverProgress} className="h-1.5 bg-[#e8e7e0]" />
              <div className="space-y-2">
                {activeHandover.checklist.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center gap-2.5 text-sm">
                    <div className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                      item.completed ? 'bg-[#2f2f2f] text-white' : 'border-2 border-[#d0cfc7]'
                    )}>
                      {item.completed && <CheckCircle2 className="h-3 w-3" />}
                    </div>
                    <span className={cn(
                      'text-sm',
                      item.completed ? 'text-[#a09e96] line-through' : 'text-[#2f2f2d]'
                    )}>
                      {item.item}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setActiveTab('handover')}
                className="flex w-full items-center justify-center gap-1.5 rounded-[8px] border border-[#d8d7d1] bg-white py-2.5 text-sm font-medium text-[#2f2f2d] transition-colors hover:bg-[#f0efe9]"
              >
                Åbn aflevering
                <ChevronRight className="h-4 w-4" />
              </button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Pending Tasks */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="border-[#d8d7d1] bg-[#f8f7f3]">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[0.95rem] font-semibold tracking-[-0.01em] text-[#2f2f2d]">
                Åbne opgaver
              </CardTitle>
              <button
                onClick={() => setActiveTab('opgaver')}
                className="flex items-center gap-0.5 text-xs font-medium text-[#f58a2d]"
              >
                Se alle <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {pendingTasks.length === 0 ? (
              <div className="flex flex-col items-center py-5">
                <CheckCircle2 className="mb-2 h-6 w-6 text-[#2f2f2f]" />
                <p className="text-sm text-[#a09e96]">Alle opgaver er klaret</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 rounded-[8px] border border-[#deddd5] bg-white p-3"
                  >
                    <div className="h-5 w-5 shrink-0 rounded-full border-2 border-[#d0cfc7]" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-[#2f2f2d]">{task.title}</p>
                      {task.deadline && (
                        <p className="text-[11px] text-[#a09e96]">
                          {isToday(parseISO(task.deadline)) ? 'I dag' :
                           isTomorrow(parseISO(task.deadline)) ? 'I morgen' :
                           format(parseISO(task.deadline), 'dd. MMM', { locale: da })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
