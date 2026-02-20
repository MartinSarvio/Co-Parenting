import { useAppStore } from '@/store';
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
} from 'lucide-react';
import { motion } from 'framer-motion';
import { parseISO, isToday, isTomorrow, format } from 'date-fns';
import { da } from 'date-fns/locale';

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
    setActiveTab
  } = useAppStore();
  const custodyPlan = custodyPlans[0];
  const isTogether = household?.familyMode === 'together';

  const currentChild = children[0];
  
  // Get current custody status
  const currentParentId = custodyPlan && currentChild 
    ? getCurrentParentForChild(
        currentChild.id, 
        custodyPlan, 
        currentChild.parent1Id, 
        currentChild.parent2Id
      )
    : null;
  
  const currentParent = users.find(u => u.id === currentParentId);
  const isWithCurrentUser = currentParentId === currentUser?.id;
  
  // Get next handover
  const nextHandover = custodyPlan 
    ? getNextHandoverDate(custodyPlan)
    : null;
  
  // Get today's events
  const todaysEvents = events.filter(e => {
    const eventDate = parseISO(e.startDate);
    return isToday(eventDate);
  }).sort((a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime());
  
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

  return (
    <div className="space-y-4 p-1">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5 px-1"
      >
        <h1 className="text-[2.05rem] font-semibold leading-[0.96] tracking-[-0.03em] text-[#262623]">
          {getGreeting()}, {currentUser?.name}
        </h1>
        <p className="mt-1 text-sm text-[#7e7c74]">Her er dagens overblik</p>
      </motion.div>

      {/* Status Card – Family overview (together) or custody status (separated) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {isTogether ? (
          /* ── Together mode: show all family member avatars ── */
          <Card className="overflow-hidden border border-[#d8d7d1] bg-[#faf8f3]">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 shrink-0 rounded-2xl border border-[#d5d4cc] bg-[#f0eee8] flex items-center justify-center">
                  <Users className="h-7 w-7 text-[#2f2f2f]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="mb-1.5 text-sm text-[#74726a]">Vores familie</p>
                  <div className="flex -space-x-2">
                    {users.map((u) => (
                      <Avatar key={u.id} className="h-10 w-10 border-2 border-white shadow-sm">
                        <AvatarImage src={u.avatar} />
                        <AvatarFallback className="bg-[#eceae2] text-xs text-[#4e4d47]">
                          {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {children.map((c) => (
                      <Avatar key={c.id} className="h-10 w-10 border-2 border-white shadow-sm">
                        <AvatarImage src={c.avatar} />
                        <AvatarFallback className="bg-[#eceae2] text-xs text-[#4e4d47]">
                          {c.name[0]}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  <p className="mt-1.5 text-[11px] text-[#a09e96]">
                    {users.length + children.length} familiemedlemmer
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* ── Separated / co-parenting / single parent: custody status ── */
          <Card className={cn(
            "overflow-hidden border transition-all duration-300",
            isWithCurrentUser
              ? "border-[#d8d7d1] bg-[#faf8f3]"
              : "border-[#d8d7d1] bg-[#f7f6f2]"
          )}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl border border-[#d5d4cc] bg-[#f0eee8] flex items-center justify-center">
                    {isWithCurrentUser ? (
                      <Home className="h-7 w-7 text-[#2f2f2f]" />
                    ) : (
                      <User className="h-7 w-7 text-[#2f2f2f]" />
                    )}
                  </div>
                  <div>
                    <p className="mb-1 text-sm text-[#74726a]">{currentChild?.name} er hos</p>
                    <p className="text-2xl font-semibold tracking-[-0.02em] text-[#2f2f2d]">
                      {isWithCurrentUser ? 'Dig' : currentParent?.name}
                    </p>
                    {nextHandover && (
                      <div className="mt-1 flex items-center gap-1 text-sm text-[#7b796f]">
                        <Clock className="h-4 w-4" />
                        <span>
                          {isWithCurrentUser ? 'Aflevering' : 'Afhentning'} {formatRelative(nextHandover).toLowerCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <Avatar className="h-14 w-14 border-2 border-white shadow-md">
                  <AvatarImage src={currentChild?.avatar} />
                  <AvatarFallback className="bg-[#eceae2] text-lg text-[#4e4d47]">
                    {currentChild?.name[0]}
                  </AvatarFallback>
                </Avatar>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-4 gap-2"
      >
        {[
          { label: 'Aftale', icon: CalendarPlus, tab: 'kalender', accent: true },
          { label: 'Opgave', icon: CheckSquare, tab: 'opgaver', accent: false },
          { label: 'Besked', icon: MessageCircle, tab: 'kommunikation', accent: false },
          { label: 'Mad', icon: UtensilsCrossed, tab: 'mad-hjem', accent: false },
        ].map(({ label, icon: Icon, tab, accent }) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex flex-col items-center gap-2 rounded-2xl border border-[#d8d7d1] bg-[#f8f7f3] py-3 transition-colors hover:bg-[#efeee9] active:scale-95"
          >
            <div className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full',
              accent ? 'bg-[#f58a2d] text-white' : 'bg-[#eceae2] text-[#4f4d45]'
            )}>
              <Icon className="h-5 w-5" />
            </div>
            <span className="text-[11px] font-semibold text-[#4a4945]">{label}</span>
          </button>
        ))}
      </motion.div>

      {/* Today's Schedule */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-[#d8d7d1] bg-[#f8f7f3]">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[0.95rem] font-semibold tracking-[-0.01em] text-[#2f2f2d]">
                Dagens program
              </CardTitle>
              <button
                onClick={() => setActiveTab('kalender')}
                className="flex items-center gap-0.5 text-xs font-medium text-[#f58a2d]"
              >
                Se alle <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {todaysEvents.length === 0 ? (
              <p className="py-5 text-center text-sm text-[#a09e96]">Ingen planer i dag</p>
            ) : (
              <div className="space-y-2">
                {todaysEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 rounded-2xl border border-[#deddd5] bg-white p-3"
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
            <CardContent className="space-y-3 pt-0">
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
                className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-[#d8d7d1] bg-white py-2.5 text-sm font-medium text-[#2f2f2d] transition-colors hover:bg-[#f0efe9]"
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
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#eceae2]">
                  <CheckCircle2 className="h-5 w-5 text-[#2f2f2f]" />
                </div>
                <p className="text-sm text-[#a09e96]">Alle opgaver er klaret</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 rounded-2xl border border-[#deddd5] bg-white p-3"
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
