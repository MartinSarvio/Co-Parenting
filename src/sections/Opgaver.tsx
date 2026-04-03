import { useEffect, useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import { useAppStore } from '@/store';
import { useApiActions } from '@/hooks/useApiActions';
import { cn, getTaskCategoryLabel } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectSheet } from '@/components/custom/SelectSheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { BottomSheet } from '@/components/custom/BottomSheet';
import { ConfirmCloseDialog } from '@/components/custom/ConfirmCloseDialog';
import { SavingOverlay } from '@/components/custom/SavingOverlay';
import { OpgaverSidePanel } from '@/components/custom/OpgaverSidePanel';
import type { OpgaverSubTab } from '@/components/custom/OpgaverSidePanel';
import {
  Plus,
  CheckCircle2,
  Calendar,
  User,
  Tag,
  ShoppingCart,
  Trash2,
  Home,
  X,
  Layout,
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import { parseISO, isToday, isTomorrow, format } from 'date-fns';
import { da } from 'date-fns/locale';
import { toast } from 'sonner';
import type { Task } from '@/types';

const categories = [
  { value: 'all', label: 'Alle', icon: Tag },
  { value: 'general', label: 'Generel', icon: CheckCircle2 },
  { value: 'shopping', label: 'Indkøb', icon: ShoppingCart },
  { value: 'child', label: 'Barn', icon: User },
  { value: 'handover', label: 'Aflevering', icon: Calendar },
  { value: 'cleaning', label: 'Rengøring', icon: Home },
];

// Shopping sidebar uses same categories as tasks — "child" label adapts to child count
const shoppingCategoryDefs = [
  { value: 'all',       label: 'Alle',       icon: Tag,          color: '#2f2f2f', desc: 'Vis alle kategorier' },
  { value: 'general',   label: 'Generel',    icon: CheckCircle2, color: '#4caf50', desc: 'Daglige opgaver' },
  { value: 'shopping',  label: 'Indkøb',     icon: ShoppingCart,  color: '#f58a2d', desc: 'Indkøbsliste' },
  { value: 'child',     label: 'Barn',       icon: User,          color: '#2196f3', desc: 'Børnerelateret' },
  { value: 'handover',  label: 'Aflevering', icon: Calendar,      color: '#e67e22', desc: 'Skift & afhentning' },
  { value: 'cleaning',  label: 'Rengøring',  icon: Home,          color: '#9e9b93', desc: 'Rengøringsopgaver' },
];

const cleaningTemplates = [
  { title: 'Støvsug fællesrum', area: 'Stue', weekday: 5, recurringPattern: 'weekly' },
  { title: 'Tør støv af overflader', area: 'Hele hjemmet', weekday: 2, recurringPattern: 'weekly' },
  { title: 'Vask bad og toilet', area: 'Badeværelse', weekday: 6, recurringPattern: 'weekly' }
];

const weekdayNames = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag'];

function getRecurringLabel(pattern?: string): string {
  const labels: Record<string, string> = {
    weekly: 'Hver uge',
    biweekly: 'Hver 2. uge',
    monthly: 'Månedlig'
  };
  return labels[pattern || ''] || 'Efter behov';
}

function SwipeableTaskCard({ children, onDelete }: { children: React.ReactNode; onDelete: () => void }) {
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [-100, -40, 0], [1, 0.6, 0]);

  return (
    <div className="relative overflow-hidden rounded-[8px]">
      <motion.div
        className="absolute inset-y-0 right-0 flex w-[80px] items-center justify-center bg-[#ef4444] rounded-r-[8px]"
        style={{ opacity: deleteOpacity }}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="flex flex-col items-center gap-0.5 text-white"
        >
          <Trash2 className="h-5 w-5" />
          <span className="text-[10px] font-semibold">Slet</span>
        </button>
      </motion.div>
      <motion.div
        drag="x"
        dragConstraints={{ left: -80, right: 0 }}
        dragElastic={0.1}
        style={{ x }}
        onDragEnd={(_: unknown, info: PanInfo) => {
          if (info.offset.x < -150) onDelete();
        }}
        className="relative z-10"
      >
        {children}
      </motion.div>
    </div>
  );
}

export function Opgaver() {
  const {
    tasks,
    shoppingItems,
    users,
    children,
    currentUser,
    household,
    shoppingLists,
  } = useAppStore();
  // Multi-deltager opgaver for samboende og bonusfamilier
  const useMultiParticipant = household?.familyMode === 'together' || household?.familyMode === 'blended';

  // Build shopping categories with dynamic child label
  const shoppingCategories = shoppingCategoryDefs.map(cat =>
    cat.value === 'child'
      ? { ...cat, label: children.length > 1 ? 'Børn' : 'Barn' }
      : cat
  );
  const { createTask, updateTask, deleteTask, claimTask, createShoppingList, deleteShoppingList } = useApiActions();
  const opgaverAction = useAppStore(s => s.opgaverAction);

  const [activeTab, setActiveTab] = useState('tasks');
  const [filter, setFilter] = useState('all');
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isAddShoppingOpen, setIsAddShoppingOpen] = useState(false);
  const [newTask, setNewTask] = useState<{
    title: string;
    category: Task['category'];
    assignedTo: string;
    deadline: string;
  }>({
    title: '',
    category: 'general',
    assignedTo: '',
    deadline: '',
  });
  const [newListName, setNewListName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [isAddCleaningOpen, setIsAddCleaningOpen] = useState(false);
  const [newCleaning, setNewCleaning] = useState({
    title: '',
    area: '',
    assignedTo: currentUser?.id || users[0]?.id || '',
    weekday: '5',
    recurringPattern: 'weekly',
    participants: [] as string[],
  });

  // Handle TopBar-triggered "+" action
  useEffect(() => {
    if (!opgaverAction) return;
    if (opgaverAction === 'add') {
      if (activeTab === 'tasks') setIsAddTaskOpen(true);
      else if (activeTab === 'cleaning') setIsAddCleaningOpen(true);
      else if (activeTab === 'shopping') setIsAddShoppingOpen(true);
      else if (activeTab === 'templates') setIsAddCleaningOpen(true);
    }
    useAppStore.getState().setOpgaverAction(null);
  }, [opgaverAction, activeTab]);

  // Filter tasks by selected category
  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.category === filter;
  });

  const pendingTasks = filteredTasks.filter(t => !t.completed);
  const completedTasks = filteredTasks.filter(t => t.completed);

  const handleAddTask = async () => {
    if (!newTask.title) return;
    setIsSaving(true);
    try {
      await createTask({
        title: newTask.title,
        category: newTask.category,
        assignedTo: newTask.assignedTo || currentUser?.id || 'u1',
        createdBy: currentUser?.id || 'u1',
        deadline: newTask.deadline || undefined,
        completed: false,
      });
      toast.success('Opgave tilføjet');
      setIsAddTaskOpen(false);
      setNewTask({ title: '', category: 'general', assignedTo: '', deadline: '' });
    } catch {
      toast.error('Kunne ikke tilføje opgave');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateShoppingList = async () => {
    if (!newListName.trim()) return;
    setIsSaving(true);
    try {
      await createShoppingList({
        name: newListName.trim(),
      });
      toast.success('Indkøbsliste oprettet');
      setNewListName('');
      setIsAddShoppingOpen(false);
    } catch {
      toast.error('Kunne ikke oprette liste');
    } finally {
      setIsSaving(false);
    }
  };

  const rewardLabel = (val: number) => {
    const type = household?.rewardsType ?? 'point';
    if (type === 'stjerne') return `${val} ⭐`;
    if (type === 'kr') return `${val} kr.`;
    return `${val} point`;
  };

  const scoreboard = useMemo(() =>
    users.map(u => ({
      user: u,
      score: tasks
        .filter(t => t.completed && (t.claimedBy === u.id || (!t.claimedBy && t.assignedTo === u.id)))
        .reduce((sum, t) => sum + (t.rewardValue ?? household?.rewardsValue ?? 10), 0),
    })).sort((a, b) => b.score - a.score),
    [tasks, users, household]
  );

  const toggleTask = (id: string, completed: boolean) => {
    const task = tasks.find(t => t.id === id);
    void updateTask(id, {
      completed,
      completedAt: completed ? new Date().toISOString() : undefined,
    });

    if (completed) {
      const val = task?.rewardValue ?? household?.rewardsValue ?? 10;
      toast.success(`Opgave fuldført! +${rewardLabel(val)}`);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f58a2d', '#f0c080', '#fff7ed', '#1a1a1a'],
        disableForReducedMotion: true,
      });
    }
  };

  const markAllPendingTasksComplete = () => {
    if (pendingTasks.length === 0) return;
    const completedAt = new Date().toISOString();
    pendingTasks.forEach((task) => {
      void updateTask(task.id, { completed: true, completedAt });
    });
    toast.success(`${pendingTasks.length} opgaver markeret som fuldført`);
  };

  // ── Cleaning (Rengøring) ──
  const cleaningTasks = useMemo(() => {
    return tasks.filter((task) => task.category === 'cleaning');
  }, [tasks]);

  const cleaningByWeekday = useMemo(() => {
    const groups = cleaningTasks.reduce<Record<string, typeof cleaningTasks>>((acc, task) => {
      const key = String(task.plannedWeekday ?? 0);
      if (!acc[key]) acc[key] = [];
      acc[key].push(task);
      return acc;
    }, {});
    return Object.entries(groups).sort(([a], [b]) => Number(a) - Number(b));
  }, [cleaningTasks]);

  const completedCleaning = cleaningTasks.filter((task) => task.completed).length;

  const handleAddCleaningTask = async () => {
    if (!newCleaning.title.trim() || (!useMultiParticipant && !newCleaning.assignedTo) || (useMultiParticipant && newCleaning.participants.length === 0)) {
      toast.error(useMultiParticipant ? 'Skriv opgave og vælg deltagere' : 'Skriv opgave og vælg person');
      return;
    }
    setIsSaving(true);
    try {
      await createTask({
        title: newCleaning.title.trim(),
        area: newCleaning.area.trim() || undefined,
        assignedTo: useMultiParticipant ? newCleaning.participants[0] : newCleaning.assignedTo,
        createdBy: currentUser?.id || users[0]?.id || 'p1',
        completed: false,
        category: 'cleaning',
        isRecurring: true,
        recurringPattern: newCleaning.recurringPattern,
        plannedWeekday: Number(newCleaning.weekday),
        participants: useMultiParticipant && newCleaning.participants.length > 0 ? newCleaning.participants : undefined,
      });
      toast.success('Rengøringsopgave oprettet');
      setIsAddCleaningOpen(false);
      setNewCleaning({
        title: '',
        area: '',
        assignedTo: currentUser?.id || users[0]?.id || '',
        weekday: '5',
        recurringPattern: 'weekly',
        participants: [],
      });
    } catch {
      toast.error('Kunne ikke oprette rengøringsopgave');
    } finally {
      setIsSaving(false);
    }
  };

  const addTemplateCleaningTask = (template: { title: string; area: string; weekday: number; recurringPattern: string }) => {
    createTask({
      title: template.title,
      area: template.area,
      assignedTo: currentUser?.id || users[0]?.id || 'p1',
      createdBy: currentUser?.id || users[0]?.id || 'p1',
      completed: false,
      category: 'cleaning',
      isRecurring: true,
      recurringPattern: template.recurringPattern,
      plannedWeekday: template.weekday
    }).catch(() => {});
    toast.success(`${template.title} tilføjet`);
  };

  return (
    <div className="space-y-1.5 py-1">
      {/* Opgaver side panel (opened via hamburger in TopBar) */}
      <OpgaverSidePanel
        activeSubTab={activeTab}
        onSelectSubTab={(tab: OpgaverSubTab) => setActiveTab(tab)}
      />

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <div className="space-y-2 mt-4">
          {/* Active filter chip — shown when not "all" */}
          {filter !== 'all' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilter('all')}
                className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-sm font-medium text-white transition-all"
              >
                {(() => {
                  const cat = shoppingCategories.find(c => c.value === filter);
                  const Icon = cat?.icon || Tag;
                  return <Icon className="h-3.5 w-3.5" />;
                })()}
                {shoppingCategories.find(c => c.value === filter)?.label || filter}
                <X className="ml-1 h-3 w-3 opacity-70" />
              </button>
            </div>
          )}

          {/* Add Task BottomSheet (triggered by TopBar +) */}
          <ConfirmCloseDialog
            open={confirmClose}
            onCancel={() => setConfirmClose(false)}
            onConfirm={() => { setConfirmClose(false); setIsAddTaskOpen(false); setNewTask({ title: '', category: 'general', assignedTo: '', deadline: '' }); }}
          />
          <BottomSheet open={isAddTaskOpen} onOpenChange={(open) => {
            if (!open && newTask.title.trim()) {
              setConfirmClose(true);
            } else {
              setIsAddTaskOpen(open);
            }
          }} title="Tilføj ny opgave">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-[12px] font-semibold text-muted-foreground">Titel</Label>
                <Input
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  placeholder="F.eks. Køb skolebøger"
                  className="rounded-[8px] border-border bg-card focus:border-[#f58a2d]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px] font-semibold text-muted-foreground">Kategori</Label>
                <SelectSheet
                  value={newTask.category}
                  onValueChange={(v) => setNewTask({...newTask, category: v as Task['category']})}
                  title="Kategori"
                  options={categories.filter(c => c.value !== 'all').map(cat => ({ value: cat.value, label: cat.label }))}
                  className="rounded-[8px] border-border bg-card"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px] font-semibold text-muted-foreground">Tildelt til</Label>
                <SelectSheet
                  value={newTask.assignedTo}
                  onValueChange={(v) => setNewTask({...newTask, assignedTo: v})}
                  title="Tildelt til"
                  placeholder="Vælg person"
                  options={users.map(user => ({
                    value: user.id,
                    label: user.name,
                    icon: <Avatar className="w-5 h-5"><AvatarImage src={user.avatar} /><AvatarFallback className="text-xs">{user.name[0]}</AvatarFallback></Avatar>,
                  }))}
                  className="rounded-[8px] border-border bg-card"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px] font-semibold text-muted-foreground">Deadline</Label>
                <Input
                  type="date"
                  value={newTask.deadline}
                  onChange={(e) => setNewTask({...newTask, deadline: e.target.value})}
                  className="rounded-[8px] border-border bg-card focus:border-[#f58a2d]"
                />
              </div>
              <button
                onClick={handleAddTask}
                disabled={!newTask.title.trim() || isSaving}
                className="w-full flex items-center justify-center gap-2 rounded-[8px] bg-[#f58a2d] py-4 text-[15px] font-bold text-white active:scale-[0.98] transition-transform disabled:opacity-40"
              >
                Tilføj opgave
              </button>
            </div>
          </BottomSheet>

          {/* Pending Tasks */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-slate-700">Ventende ({pendingTasks.length})</h3>
              {pendingTasks.length > 1 && (
                <Button variant="outline" size="sm" onClick={markAllPendingTasksComplete}>
                  Afkryds alle
                </Button>
              )}
            </div>
            {pendingTasks.length === 0 ? (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4 text-center">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <p className="text-green-700 font-medium">Alle opgaver er klaret!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {pendingTasks.map((task, index) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <SwipeableTaskCard onDelete={() => void deleteTask(task.id)}>
                        <div className="border-b border-border transition-colors">
                          <div className="p-3">
                            <div className="flex items-start gap-3">
                              <Checkbox
                                checked={task.completed}
                                onCheckedChange={(checked) => toggleTask(task.id, checked as boolean)}
                                className="mt-1"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-900">{task.title}</p>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <Badge variant="outline" className="text-xs">
                                    {getTaskCategoryLabel(task.category)}
                                  </Badge>
                                  {task.deadline && (
                                    <span className={cn(
                                      "text-xs flex items-center gap-1",
                                      isToday(parseISO(task.deadline)) ? "text-rose-500" : "text-slate-500"
                                    )}>
                                      <Calendar className="w-3 h-3" />
                                      {isToday(parseISO(task.deadline)) ? 'I dag' :
                                       isTomorrow(parseISO(task.deadline)) ? 'I morgen' :
                                       format(parseISO(task.deadline), 'dd. MMM', { locale: da })}
                                    </span>
                                  )}
                                  <div className="flex items-center gap-1">
                                    <Avatar className="w-4 h-4">
                                      <AvatarImage src={users.find(u => u.id === (task.claimedBy || task.assignedTo))?.avatar} />
                                      <AvatarFallback className="text-[8px]">
                                        {users.find(u => u.id === (task.claimedBy || task.assignedTo))?.name[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs text-slate-500">
                                      {task.claimedBy
                                        ? users.find(u => u.id === task.claimedBy)?.name
                                        : users.find(u => u.id === task.assignedTo)?.name}
                                    </span>
                                  </div>
                                  <span className="text-[11px] font-semibold text-[#f58a2d]">
                                    +{rewardLabel(task.rewardValue ?? household?.rewardsValue ?? 10)}
                                  </span>
                                </div>
                                {!task.claimedBy && task.assignedTo !== currentUser?.id && currentUser && (
                                  <button
                                    onClick={() => void claimTask(task.id, currentUser.id)}
                                    className="mt-1.5 text-[12px] font-semibold text-[#f58a2d] underline underline-offset-2"
                                  >
                                    Tag opgave
                                  </button>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-rose-500"
                                onClick={() => void deleteTask(task.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </SwipeableTaskCard>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-slate-700">Fuldført ({completedTasks.length})</h3>
              <div className="space-y-2">
                {completedTasks.slice(0, 3).map((task) => (
                  <div key={task.id} className="border-b border-border">
                    <div className="p-3">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-500 line-through">{task.title}</p>
                          {task.completedAt && (
                            <p className="text-xs text-slate-400">
                              Fuldført {formatRelative(task.completedAt).toLowerCase()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cleaning (Rengøring) Tab */}
      {activeTab === 'cleaning' && (
        <div className="space-y-2 mt-4">
          {/* ── Status card ── */}
          <div className="rounded-[8px] border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status denne uge</p>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  {completedCleaning}<span className="text-muted-foreground">/{cleaningTasks.length}</span>
                </p>
                <p className="text-[11px] text-[#9e9b93]">opgaver fuldført</p>
              </div>
              {cleaningTasks.length > 0 && (
                <div className="relative h-14 w-14">
                  <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="24" fill="none" strokeWidth="4" stroke="#f0efe8" />
                    <circle cx="28" cy="28" r="24" fill="none" strokeWidth="4" stroke="#f58a2d"
                      strokeLinecap="round"
                      strokeDasharray={`${(completedCleaning / cleaningTasks.length) * 150.8} 150.8`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-foreground">
                      {cleaningTasks.length > 0 ? Math.round((completedCleaning / cleaningTasks.length) * 100) : 0}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Add Cleaning BottomSheet (triggered by TopBar +) */}
          <BottomSheet open={isAddCleaningOpen} onOpenChange={setIsAddCleaningOpen} title="Tilføj huslig pligt">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-[12px] font-semibold text-muted-foreground">Opgave</Label>
                <Input
                  value={newCleaning.title}
                  onChange={(e) => setNewCleaning((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Fx vask gulv i køkken"
                  className="rounded-[8px] border-border bg-card focus:border-[#f58a2d]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px] font-semibold text-muted-foreground">Område</Label>
                <Input
                  value={newCleaning.area}
                  onChange={(e) => setNewCleaning((prev) => ({ ...prev, area: e.target.value }))}
                  placeholder="Fx køkken"
                  className="rounded-[8px] border-border bg-card focus:border-[#f58a2d]"
                />
              </div>
              {useMultiParticipant ? (
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-semibold text-muted-foreground">Deltagere</Label>
                  <div className="space-y-1.5 rounded-[8px] border border-border p-2">
                    {users.map((user) => (
                      <label key={user.id} className="flex items-center gap-2.5 rounded-[8px] px-2 py-1.5 text-[13px] hover:bg-card transition-colors">
                        <Checkbox
                          checked={newCleaning.participants.includes(user.id)}
                          onCheckedChange={(checked) => {
                            setNewCleaning((prev) => ({
                              ...prev,
                              participants: checked
                                ? [...prev.participants, user.id]
                                : prev.participants.filter((id) => id !== user.id),
                            }));
                          }}
                          className="h-4 w-4"
                        />
                        {user.name}
                      </label>
                    ))}
                    {children.filter(c => {
                      const birthYear = c.birthDate ? new Date(c.birthDate).getFullYear() : null;
                      const age = birthYear ? new Date().getFullYear() - birthYear : null;
                      return age !== null && age >= 6;
                    }).map((child) => {
                      const birthYear = child.birthDate ? new Date(child.birthDate).getFullYear() : null;
                      const age = birthYear ? new Date().getFullYear() - birthYear : null;
                      return (
                        <label key={child.id} className="flex items-center gap-2.5 rounded-[8px] px-2 py-1.5 text-[13px] hover:bg-card transition-colors">
                          <Checkbox
                            checked={newCleaning.participants.includes(child.id)}
                            onCheckedChange={(checked) => {
                              setNewCleaning((prev) => ({
                                ...prev,
                                participants: checked
                                  ? [...prev.participants, child.id]
                                  : prev.participants.filter((id) => id !== child.id),
                              }));
                            }}
                            className="h-4 w-4"
                          />
                          {child.name} {age !== null && <span className="text-muted-foreground">({age} år)</span>}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-semibold text-muted-foreground">Ansvarlig</Label>
                  <SelectSheet
                    value={newCleaning.assignedTo}
                    onValueChange={(value) => setNewCleaning((prev) => ({ ...prev, assignedTo: value }))}
                    title="Ansvarlig"
                    placeholder="Vælg person"
                    options={users.map((user) => ({ value: user.id, label: user.name }))}
                    className="rounded-[8px] border-border bg-card"
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-semibold text-muted-foreground">Dag</Label>
                  <SelectSheet
                    value={newCleaning.weekday}
                    onValueChange={(value) => setNewCleaning((prev) => ({ ...prev, weekday: value }))}
                    title="Dag"
                    options={weekdayNames.map((day, index) => ({ value: String(index), label: day }))}
                    className="rounded-[8px] border-border bg-card"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-semibold text-muted-foreground">Hyppighed</Label>
                  <SelectSheet
                    value={newCleaning.recurringPattern}
                    onValueChange={(value) => setNewCleaning((prev) => ({ ...prev, recurringPattern: value }))}
                    title="Hyppighed"
                    options={[
                      { value: 'weekly', label: 'Hver uge' },
                      { value: 'biweekly', label: 'Hver 2. uge' },
                      { value: 'monthly', label: 'Månedlig' },
                    ]}
                    className="rounded-[8px] border-border bg-card"
                  />
                </div>
              </div>
              <button
                onClick={handleAddCleaningTask}
                disabled={!newCleaning.title.trim()}
                className="w-full rounded-[8px] bg-[#f58a2d] py-4 text-[15px] font-bold text-white active:scale-[0.98] transition-transform disabled:opacity-40"
              >
                Tilføj pligt
              </button>
            </div>
          </BottomSheet>

          {cleaningByWeekday.length === 0 ? (
            <div className="rounded-[8px] border border-dashed border-border bg-card py-8 text-center text-sm text-muted-foreground">
              Ingen rengøringsplan endnu. Tilføj første huslige pligt.
            </div>
          ) : (
            <div className="space-y-5">
              {cleaningByWeekday.map(([weekdayIndex, dayTasks]) => (
                <div key={weekdayIndex}>
                  <p className="mb-2 text-[13px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
                    {weekdayNames[Number(weekdayIndex)]}
                  </p>
                  <div className="space-y-2">
                    {dayTasks.map((task) => (
                      <SwipeableTaskCard key={task.id} onDelete={() => void deleteTask(task.id)}>
                        <div className="flex items-center gap-3 border-b border-border px-3 py-3">
                          <Checkbox
                            checked={task.completed}
                            onCheckedChange={(checked) => {
                              void updateTask(task.id, {
                                completed: checked as boolean,
                                completedAt: checked ? new Date().toISOString() : undefined
                              });
                            }}
                            className="size-4 shrink-0 rounded-[8px]"
                          />
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              'text-[14px] font-medium text-foreground',
                              task.completed && 'line-through text-muted-foreground'
                            )}>
                              {task.title}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              {task.area && (
                                <span className="text-[11px] text-muted-foreground">{task.area}</span>
                              )}
                              {task.area && <span className="text-[11px] text-muted-foreground">·</span>}
                              <span className="text-[11px] text-muted-foreground">{getRecurringLabel(task.recurringPattern)}</span>
                              <span className="text-[11px] text-muted-foreground">·</span>
                              <span className="text-[11px] text-muted-foreground">
                                {users.find((user) => user.id === task.assignedTo)?.name || 'Ukendt'}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => void deleteTask(task.id)}
                            className="shrink-0 p-1.5 text-muted-foreground hover:text-[#ef4444] transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </SwipeableTaskCard>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Shopping Tab — shows shopping lists (not individual items) */}
      {activeTab === 'shopping' && (() => {
        // Build display lists: real lists + virtual "Dagligvarer" for orphan items
        const orphanItems = shoppingItems.filter(i => !i.listId);
        const displayLists = [...shoppingLists];
        if (orphanItems.length > 0 && !displayLists.some(l => l.name === 'Dagligvarer')) {
          displayLists.unshift({
            id: '__dagligvarer__',
            name: 'Dagligvarer',
            createdAt: new Date().toISOString(),
            createdBy: currentUser?.id ?? '',
          });
        }

        return (
          <div className="space-y-3 mt-4">
            {/* Create list BottomSheet (triggered by TopBar +) */}
            <AnimatePresence>
              {isAddShoppingOpen && (
                <motion.div
                  initial={{ opacity: 0, y: '100%' }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: '100%' }}
                  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                  className="fixed inset-0 z-[9999] flex flex-col bg-card"
                  style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
                    <button
                      onClick={() => { setIsAddShoppingOpen(false); setNewListName(''); }}
                      className="flex items-center gap-1 text-[15px] font-medium text-muted-foreground active:opacity-70"
                    >
                      <X className="h-5 w-5" />
                    </button>
                    <h2 className="text-[16px] font-bold text-foreground">Opret indkøbsliste</h2>
                    <button
                      onClick={handleCreateShoppingList}
                      disabled={!newListName.trim() || isSaving}
                      className="text-[15px] font-bold text-[#f58a2d] disabled:opacity-40 active:opacity-70"
                    >
                      Gem
                    </button>
                  </div>
                  {/* Content */}
                  <div className="flex-1 px-4 pt-6 space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-[12px] font-semibold text-muted-foreground">Navn</Label>
                      <Input
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        placeholder="F.eks. Weekendindkøb"
                        className="rounded-[8px] border-border bg-card focus:border-[#f58a2d]"
                        autoFocus
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Create list button */}
            <button
              onClick={() => setIsAddShoppingOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-[8px] border-2 border-dashed border-border bg-card py-4 text-[14px] font-semibold text-foreground transition-all hover:border-border active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              Opret indkøbsliste
            </button>

            {/* Shopping list cards */}
            {displayLists.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-[8px] bg-background">
                  <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-foreground">Ingen indkøbslister</p>
                  <p className="text-[13px] text-muted-foreground mt-1">Opret en liste eller tilføj varer i Mad & Hjem</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {displayLists.map((list) => {
                  const listItems = list.id === '__dagligvarer__'
                    ? orphanItems
                    : shoppingItems.filter(i => i.listId === list.id);
                  const purchased = listItems.filter(i => i.purchased).length;
                  const total = listItems.length;
                  const pct = total > 0 ? Math.round((purchased / total) * 100) : 0;

                  return (
                    <motion.div
                      key={list.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="rounded-[8px] border border-border bg-card p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-[15px] font-bold text-foreground truncate">{list.name}</p>
                            <p className="text-[12px] text-muted-foreground mt-0.5">
                              {total === 0
                                ? 'Ingen varer endnu'
                                : `${purchased}/${total} varer afkrydset`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {total > 0 && (
                              <span className="text-[13px] font-bold text-foreground">{pct}%</span>
                            )}
                            {list.id !== '__dagligvarer__' && (
                              <button
                                onClick={() => deleteShoppingList(list.id)}
                                className="shrink-0 text-muted-foreground hover:text-red-500 transition-colors active:scale-95"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                        {total > 0 && (
                          <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#22c55e] transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* Templates (Skabeloner) Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-3 mt-4">
          {/* Add Cleaning from Template BottomSheet */}
          <BottomSheet open={isAddCleaningOpen} onOpenChange={setIsAddCleaningOpen} title="Tilføj skabelon som opgave">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-[12px] font-semibold text-muted-foreground">Opgave</Label>
                <Input
                  value={newCleaning.title}
                  onChange={(e) => setNewCleaning((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Fx vask gulv i køkken"
                  className="rounded-[8px] border-border bg-card focus:border-[#f58a2d]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px] font-semibold text-muted-foreground">Område</Label>
                <Input
                  value={newCleaning.area}
                  onChange={(e) => setNewCleaning((prev) => ({ ...prev, area: e.target.value }))}
                  placeholder="Fx køkken"
                  className="rounded-[8px] border-border bg-card focus:border-[#f58a2d]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-semibold text-muted-foreground">Dag</Label>
                  <SelectSheet
                    value={newCleaning.weekday}
                    onValueChange={(value) => setNewCleaning((prev) => ({ ...prev, weekday: value }))}
                    title="Dag"
                    options={weekdayNames.map((day, index) => ({ value: String(index), label: day }))}
                    className="rounded-[8px] border-border bg-card"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-semibold text-muted-foreground">Hyppighed</Label>
                  <SelectSheet
                    value={newCleaning.recurringPattern}
                    onValueChange={(value) => setNewCleaning((prev) => ({ ...prev, recurringPattern: value }))}
                    title="Hyppighed"
                    options={[
                      { value: 'weekly', label: 'Hver uge' },
                      { value: 'biweekly', label: 'Hver 2. uge' },
                      { value: 'monthly', label: 'Månedlig' },
                    ]}
                    className="rounded-[8px] border-border bg-card"
                  />
                </div>
              </div>
              <button
                onClick={handleAddCleaningTask}
                disabled={!newCleaning.title.trim()}
                className="w-full rounded-[8px] bg-[#f58a2d] py-4 text-[15px] font-bold text-white active:scale-[0.98] transition-transform disabled:opacity-40"
              >
                Tilføj som opgave
              </button>
            </div>
          </BottomSheet>

          <p className="text-[13px] text-muted-foreground">Tryk på en skabelon for at tilføje den som rengøringsopgave.</p>

          <div className="space-y-2">
            {cleaningTemplates.map((template) => (
              <button
                key={template.title}
                onClick={() => addTemplateCleaningTask(template)}
                className="flex w-full items-center gap-3 rounded-[8px] border border-border bg-card p-4 text-left transition-all hover:border-border active:scale-[0.98]"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-muted">
                  <Layout className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-foreground">{template.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px] text-muted-foreground">{template.area}</span>
                    <span className="text-[11px] text-muted-foreground">&middot;</span>
                    <span className="text-[11px] text-muted-foreground">{weekdayNames[template.weekday]}</span>
                    <span className="text-[11px] text-muted-foreground">&middot;</span>
                    <span className="text-[11px] text-muted-foreground">{getRecurringLabel(template.recurringPattern)}</span>
                  </div>
                </div>
                <Plus className="h-5 w-5 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Scoreboard Tab */}
      {activeTab === 'scoreboard' && (
        <div className="space-y-3 mt-4">
          <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide px-1">Point optjent ved opgaver</p>
          {scoreboard.length === 0 || scoreboard.every(s => s.score === 0) ? (
            <div className="text-center py-12 text-muted-foreground text-[14px]">Ingen point endnu — fuldfør opgaver for at optjene point</div>
          ) : (
            <div className="space-y-2">
              {scoreboard.map(({ user, score }, i) => (
                <div key={user.id} className="flex items-center gap-3 rounded-[8px] bg-card border border-border px-4 py-3">
                  <span className="text-[13px] font-bold text-muted-foreground w-5">{i + 1}.</span>
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="text-[11px] bg-orange-tint text-[#bf6722]">{user.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-[14px] font-semibold text-foreground">{user.name.split(' ')[0]}</p>
                    <p className="text-[12px] text-muted-foreground">{tasks.filter(t => t.completed && (t.claimedBy === user.id || (!t.claimedBy && t.assignedTo === user.id))).length} opgaver</p>
                  </div>
                  <p className="text-[16px] font-bold text-[#f58a2d]">{rewardLabel(score)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <SavingOverlay open={isSaving} />
    </div>
  );
}

// Helper function for formatting relative time
function formatRelative(date: string): string {
  const d = parseISO(date);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'I dag';
  if (diffDays === 1) return 'I går';
  return `For ${diffDays} dage siden`;
}
