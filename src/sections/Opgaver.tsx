import { useMemo, useState } from 'react';
import { useAppStore } from '@/store';
import { useApiActions } from '@/hooks/useApiActions';
import { shoppingItemId } from '@/lib/id';
import { cn, getTaskCategoryLabel } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// Tabs replaced by underline-style tabs
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
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
  Menu,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

export function Opgaver() {
  const {
    tasks,
    shoppingItems,
    users,
    children,
    currentUser,
    addShoppingItem,
    updateShoppingItem,
    deleteShoppingItem
  } = useAppStore();

  // Build shopping categories with dynamic child label
  const shoppingCategories = shoppingCategoryDefs.map(cat =>
    cat.value === 'child'
      ? { ...cat, label: children.length > 1 ? 'Børn' : 'Barn' }
      : cat
  );
  const { createTask, updateTask, deleteTask } = useApiActions();
  
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
  const [newShoppingItem, setNewShoppingItem] = useState({
    name: '',
    quantity: '',
    category: 'Dagligvarer',
  });
  const [isCategoryPanelOpen, setIsCategoryPanelOpen] = useState(false);
  const [isAddCleaningOpen, setIsAddCleaningOpen] = useState(false);
  const [newCleaning, setNewCleaning] = useState({
    title: '',
    area: '',
    assignedTo: currentUser?.id || users[0]?.id || '',
    weekday: '5',
    recurringPattern: 'weekly'
  });

  // Filter tasks by selected category
  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.category === filter;
  });

  const pendingTasks = filteredTasks.filter(t => !t.completed);
  const completedTasks = filteredTasks.filter(t => t.completed);

  // Shopping uses same filter — "shopping" category shows all shopping items,
  // other categories filter by matching shopping item category
  const pendingShopping = shoppingItems.filter(i => !i.purchased);
  const purchasedShopping = shoppingItems.filter(i => i.purchased);

  const handleAddTask = async () => {
    if (!newTask.title) return;

    await createTask({
      title: newTask.title,
      category: newTask.category,
      assignedTo: newTask.assignedTo || currentUser?.id || 'u1',
      createdBy: currentUser?.id || 'u1',
      deadline: newTask.deadline || undefined,
      completed: false,
    });

    setIsAddTaskOpen(false);
    setNewTask({ title: '', category: 'general', assignedTo: '', deadline: '' });
    toast.success('Opgave tilføjet');
  };

  const handleAddShoppingItem = () => {
    if (!newShoppingItem.name) return;
    
    addShoppingItem({
      id: shoppingItemId(),
      name: newShoppingItem.name,
      quantity: newShoppingItem.quantity,
      category: newShoppingItem.category,
      purchased: false,
      addedBy: currentUser?.id || 'u1',
    });
    
    setIsAddShoppingOpen(false);
    setNewShoppingItem({ name: '', quantity: '', category: 'Dagligvarer' });
    toast.success('Vare tilføjet til indkøbslisten');
  };

  const toggleTask = (id: string, completed: boolean) => {
    void updateTask(id, {
      completed,
      completedAt: completed ? new Date().toISOString() : undefined
    });

    if (completed) {
      toast.success('Opgave fuldført!');
    }
  };

  const toggleShoppingItem = (itemId: string, purchased: boolean) => {
    updateShoppingItem(itemId, {
      purchased,
      purchasedBy: purchased ? currentUser?.id : undefined,
      purchasedAt: purchased ? new Date().toISOString() : undefined
    });
  };

  const markAllPendingTasksComplete = () => {
    if (pendingTasks.length === 0) return;
    const completedAt = new Date().toISOString();
    pendingTasks.forEach((task) => {
      void updateTask(task.id, { completed: true, completedAt });
    });
    toast.success(`${pendingTasks.length} opgaver markeret som fuldført`);
  };

  const markAllPendingShoppingPurchased = () => {
    if (pendingShopping.length === 0) return;
    const purchasedAt = new Date().toISOString();
    const purchasedBy = currentUser?.id || users[0]?.id || 'u1';
    pendingShopping.forEach((item) => {
      updateShoppingItem(item.id, { purchased: true, purchasedAt, purchasedBy });
    });
    toast.success(`${pendingShopping.length} varer markeret som købt`);
  };

  const resetAllPurchasedShopping = () => {
    if (purchasedShopping.length === 0) return;
    purchasedShopping.forEach((item) => {
      updateShoppingItem(item.id, { purchased: false, purchasedBy: undefined, purchasedAt: undefined });
    });
    toast.success('Købte varer er nulstillet');
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

  const handleAddCleaningTask = () => {
    if (!newCleaning.title.trim() || !newCleaning.assignedTo) {
      toast.error('Skriv opgave og vælg person');
      return;
    }
    void createTask({
      title: newCleaning.title.trim(),
      area: newCleaning.area.trim() || undefined,
      assignedTo: newCleaning.assignedTo,
      createdBy: currentUser?.id || users[0]?.id || 'p1',
      completed: false,
      category: 'cleaning',
      isRecurring: true,
      recurringPattern: newCleaning.recurringPattern,
      plannedWeekday: Number(newCleaning.weekday)
    });
    setIsAddCleaningOpen(false);
    setNewCleaning({
      title: '',
      area: '',
      assignedTo: currentUser?.id || users[0]?.id || '',
      weekday: '5',
      recurringPattern: 'weekly'
    });
    toast.success('Rengøringsopgave oprettet');
  };

  const addTemplateCleaningTask = (template: { title: string; area: string; weekday: number; recurringPattern: string }) => {
    void createTask({
      title: template.title,
      area: template.area,
      assignedTo: currentUser?.id || users[0]?.id || 'p1',
      createdBy: currentUser?.id || users[0]?.id || 'p1',
      completed: false,
      category: 'cleaning',
      isRecurring: true,
      recurringPattern: template.recurringPattern,
      plannedWeekday: template.weekday
    });
    toast.success(`${template.title} tilføjet`);
  };

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Opgaver & Hjem</h1>
        </div>
      </motion.div>

      {/* Underline-style Tabs + filter icon */}
      <div className="sticky top-0 z-10 bg-[#faf9f6] pb-0">
        <div className="flex items-center border-b border-[#e5e3dc]">
          {[
            { value: 'tasks', label: 'Opgaver' },
            { value: 'cleaning', label: 'Rengøring' },
            { value: 'shopping', label: 'Indkøb' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'relative flex-1 py-3 text-center text-[14px] font-semibold transition-colors flex items-center justify-center gap-1.5',
                activeTab === tab.value ? 'text-[#2f2f2d]' : 'text-[#b0ada4]'
              )}
            >
              {tab.label}
              {tab.value === 'tasks' && pendingTasks.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1 text-[10px]">{pendingTasks.length}</Badge>
              )}
              {tab.value === 'cleaning' && cleaningTasks.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1 text-[10px]">{completedCleaning}/{cleaningTasks.length}</Badge>
              )}
              {tab.value === 'shopping' && pendingShopping.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1 text-[10px]">{pendingShopping.length}</Badge>
              )}
              {activeTab === tab.value && (
                <motion.div
                  layoutId="opgaver-underline"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#2f2f2d] rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          ))}
          {/* Filter icon — right side */}
          <button
            type="button"
            onClick={() => setIsCategoryPanelOpen(true)}
            className={cn(
              "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ml-1",
              filter !== 'all'
                ? "bg-[#2f2f2f] text-white"
                : "hover:bg-[#eceae2] text-[#75736b]"
            )}
          >
            <Menu className="h-5 w-5" />
            {filter !== 'all' && (
              <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#f58a2d] border-2 border-[#faf9f6]" />
            )}
          </button>
        </div>
      </div>

      {/* Category side panel overlay */}
      <AnimatePresence>
        {isCategoryPanelOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/30"
              onClick={() => setIsCategoryPanelOpen(false)}
            />
            {/* Panel — slides from left (matches Settings/Mere panel) */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="fixed inset-y-0 left-0 z-50 w-[280px] bg-white shadow-[4px_0_24px_rgba(0,0,0,0.1)] flex flex-col"
              style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
            >
              {/* Panel header — matches Settings "Mere" */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#eeedea]">
                <h2 className="text-[17px] font-bold text-[#2f2f2d]">Kategorier</h2>
                <button
                  onClick={() => setIsCategoryPanelOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f2f1ed] text-[#5f5d56]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {/* Category list — matches Settings item style */}
              <div className="flex-1 overflow-y-auto py-2">
                {(() => {
                  // Build items with dividers: first 3 items, divider, next 3
                  const items: (typeof shoppingCategories[0] | null)[] = [];
                  shoppingCategories.forEach((cat, idx) => {
                    items.push(cat);
                    if (idx === 2) items.push(null); // divider after Indkøb
                  });
                  return items.map((item, idx) => {
                    if (item === null) {
                      return <div key={`div-${idx}`} className="my-2 mx-5 border-t border-[#eeedea]" />;
                    }
                    const isActive = filter === item.value;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.value}
                        onClick={() => {
                          setFilter(item.value);
                          setIsCategoryPanelOpen(false);
                        }}
                        className={cn(
                          'flex w-full items-center gap-3.5 px-5 py-3 text-left transition-colors',
                          isActive
                            ? 'bg-[#f7f6f2]'
                            : 'hover:bg-[#faf9f6]'
                        )}
                      >
                        <div className={cn(
                          'flex h-9 w-9 items-center justify-center rounded-xl',
                          isActive ? 'bg-[#fff2e6]' : 'bg-[#f2f1ed]'
                        )}>
                          <Icon className={cn('h-[18px] w-[18px]', isActive ? 'text-[#f58a2d]' : 'text-[#7a786f]')} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-[14px] font-semibold', isActive ? 'text-[#2f2f2d]' : 'text-[#4a4945]')}>
                            {item.label}
                          </p>
                          <p className="text-[11px] text-[#9a978f] truncate">{item.desc}</p>
                        </div>
                        {isActive && (
                          <div className="h-2 w-2 rounded-full bg-[#f58a2d] shrink-0" />
                        )}
                      </button>
                    );
                  });
                })()}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <div className="space-y-4 mt-4">
          {/* Active filter chip — shown when not "all" */}
          {filter !== 'all' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilter('all')}
                className="flex items-center gap-1.5 rounded-full bg-[#2f2f2f] px-3 py-1.5 text-sm font-medium text-white transition-all"
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

          {/* Add Task Button */}
          <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Ny opgave
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tilføj ny opgave</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Titel</Label>
                  <Input 
                    value={newTask.title}
                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                    placeholder="F.eks. Køb skolebøger"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kategori</Label>
                  <Select 
                    value={newTask.category} 
                    onValueChange={(v) => setNewTask({...newTask, category: v as Task['category']})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.filter(c => c.value !== 'all').map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tildelt til</Label>
                  <Select 
                    value={newTask.assignedTo} 
                    onValueChange={(v) => setNewTask({...newTask, assignedTo: v})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Vælg person" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="w-5 h-5">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback className="text-xs">{user.name[0]}</AvatarFallback>
                            </Avatar>
                            {user.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Deadline</Label>
                  <Input 
                    type="date"
                    value={newTask.deadline}
                    onChange={(e) => setNewTask({...newTask, deadline: e.target.value})}
                  />
                </div>
                <Button onClick={handleAddTask} className="w-full">
                  Tilføj opgave
                </Button>
              </div>
            </DialogContent>
          </Dialog>

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
                <CardContent className="p-6 text-center">
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
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="border-slate-200 hover:border-slate-300 transition-colors">
                        <CardContent className="p-3">
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
                                    <AvatarImage src={users.find(u => u.id === task.assignedTo)?.avatar} />
                                    <AvatarFallback className="text-[8px]">
                                      {users.find(u => u.id === task.assignedTo)?.name[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs text-slate-500">
                                    {users.find(u => u.id === task.assignedTo)?.name}
                                  </span>
                                </div>
                              </div>
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
                        </CardContent>
                      </Card>
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
                  <Card key={task.id} className="border-slate-200 bg-slate-50/50">
                    <CardContent className="p-3">
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
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cleaning (Rengøring) Tab */}
      {activeTab === 'cleaning' && (
        <div className="space-y-4 mt-4">
          {/* ── Status card ── */}
          <div className="rounded-2xl border border-[#e5e3dc] bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#75736b]">Status denne uge</p>
                <p className="mt-1 text-2xl font-bold text-[#2f2f2d]">
                  {completedCleaning}<span className="text-[#b0ada4]">/{cleaningTasks.length}</span>
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
                    <span className="text-xs font-bold text-[#2f2f2d]">
                      {cleaningTasks.length > 0 ? Math.round((completedCleaning / cleaningTasks.length) * 100) : 0}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Action cards ── */}
          <div className="grid grid-cols-2 gap-2.5">
            <Dialog open={isAddCleaningOpen} onOpenChange={setIsAddCleaningOpen}>
              <DialogTrigger asChild>
                <button className="flex items-center gap-2.5 rounded-2xl border-2 border-[#f3c59d] bg-[#fff2e6] p-3 text-left shadow-[0_2px_12px_rgba(245,138,45,0.12)] transition-all active:scale-[0.98]">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f58a2d]">
                    <Plus className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-[13px] font-bold text-[#bf6722]">Ny pligt</span>
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tilføj huslig pligt</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>Opgave</Label>
                    <Input
                      value={newCleaning.title}
                      onChange={(e) => setNewCleaning((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="Fx vask gulv i køkken"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Område</Label>
                    <Input
                      value={newCleaning.area}
                      onChange={(e) => setNewCleaning((prev) => ({ ...prev, area: e.target.value }))}
                      placeholder="Fx køkken"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Ansvarlig</Label>
                      <Select
                        value={newCleaning.assignedTo}
                        onValueChange={(value) => setNewCleaning((prev) => ({ ...prev, assignedTo: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Vælg person" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Dag</Label>
                      <Select
                        value={newCleaning.weekday}
                        onValueChange={(value) => setNewCleaning((prev) => ({ ...prev, weekday: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {weekdayNames.map((day, index) => (
                            <SelectItem key={day} value={String(index)}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Hyppighed</Label>
                    <Select
                      value={newCleaning.recurringPattern}
                      onValueChange={(value) => setNewCleaning((prev) => ({ ...prev, recurringPattern: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Hver uge</SelectItem>
                        <SelectItem value="biweekly">Hver 2. uge</SelectItem>
                        <SelectItem value="monthly">Månedlig</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full" onClick={handleAddCleaningTask}>
                    Tilføj pligt
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {cleaningTemplates.map((template) => (
              <button
                key={template.title}
                onClick={() => addTemplateCleaningTask(template)}
                className="flex items-center gap-2.5 rounded-2xl border-2 border-[#e5e3dc] bg-white p-3 text-left transition-all hover:border-[#cccbc3] active:scale-[0.98]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f0efe8]">
                  <Plus className="h-4 w-4 text-[#75736b]" />
                </div>
                <span className="text-[13px] font-bold text-[#2f2f2d]">{template.title}</span>
              </button>
            ))}
          </div>

          {cleaningByWeekday.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d8d7cf] bg-[#faf9f6] py-8 text-center text-sm text-[#78766d]">
              Ingen rengøringsplan endnu. Tilføj første huslige pligt.
            </div>
          ) : (
            <div className="space-y-5">
              {cleaningByWeekday.map(([weekdayIndex, dayTasks]) => (
                <div key={weekdayIndex}>
                  <p className="mb-2 text-[13px] font-bold uppercase tracking-[0.06em] text-[#78766d]">
                    {weekdayNames[Number(weekdayIndex)]}
                  </p>
                  <div className="space-y-2">
                    {dayTasks.map((task) => (
                      <div key={task.id} className="flex items-center gap-3 rounded-2xl border border-[#e8e7e0] bg-white px-3 py-3">
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={(checked) => {
                            void updateTask(task.id, {
                              completed: checked as boolean,
                              completedAt: checked ? new Date().toISOString() : undefined
                            });
                          }}
                          className="h-5 w-5 shrink-0 rounded-md"
                        />
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            'text-[14px] font-medium text-[#2f2f2d]',
                            task.completed && 'line-through text-[#9b9a93]'
                          )}>
                            {task.title}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            {task.area && (
                              <span className="text-[11px] text-[#78766d]">{task.area}</span>
                            )}
                            {task.area && <span className="text-[11px] text-[#d0cec5]">·</span>}
                            <span className="text-[11px] text-[#78766d]">{getRecurringLabel(task.recurringPattern)}</span>
                            <span className="text-[11px] text-[#d0cec5]">·</span>
                            <span className="text-[11px] text-[#78766d]">
                              {users.find((user) => user.id === task.assignedTo)?.name || 'Ukendt'}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => void deleteTask(task.id)}
                          className="shrink-0 p-1.5 text-[#c5c4be] hover:text-[#ef4444] transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Shopping Tab */}
      {activeTab === 'shopping' && (
        <div className="space-y-4 mt-4">
          {/* Add Shopping Item */}
          <Dialog open={isAddShoppingOpen} onOpenChange={setIsAddShoppingOpen}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Tilføj vare
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tilføj til indkøbslisten</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Vare</Label>
                  <Input 
                    value={newShoppingItem.name}
                    onChange={(e) => setNewShoppingItem({...newShoppingItem, name: e.target.value})}
                    placeholder="F.eks. Mælk"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mængde (valgfri)</Label>
                  <Input 
                    value={newShoppingItem.quantity}
                    onChange={(e) => setNewShoppingItem({...newShoppingItem, quantity: e.target.value})}
                    placeholder="F.eks. 2 liter"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kategori</Label>
                  <Select 
                    value={newShoppingItem.category} 
                    onValueChange={(v) => setNewShoppingItem({...newShoppingItem, category: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dagligvarer">Dagligvarer</SelectItem>
                      <SelectItem value="Skole">Skole</SelectItem>
                      <SelectItem value="Fritid">Fritid</SelectItem>
                      <SelectItem value="Medicin">Medicin</SelectItem>
                      <SelectItem value="Andet">Andet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddShoppingItem} className="w-full">
                  Tilføj til listen
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Pending Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-slate-700">Mangler ({pendingShopping.length})</h3>
              <div className="flex items-center gap-2">
                {pendingShopping.length > 1 && (
                  <Button variant="outline" size="sm" onClick={markAllPendingShoppingPurchased}>
                    Afkryds alle
                  </Button>
                )}
                {purchasedShopping.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={resetAllPurchasedShopping}>
                    Nulstil
                  </Button>
                )}
              </div>
            </div>
            {pendingShopping.length === 0 ? (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-6 text-center">
                  <ShoppingCart className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <p className="text-green-700 font-medium">Indkøbslisten er tom!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {pendingShopping.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="border-[#d8d7cf] bg-[#fcfbf8] shadow-[0_2px_10px_rgba(15,15,15,0.04)] transition-colors hover:border-[#cfcdbf]">
                        <CardContent className="p-3.5">
                          <div className="flex items-start gap-3.5">
                            <Checkbox 
                              checked={item.purchased}
                              onCheckedChange={(checked) => toggleShoppingItem(item.id, checked as boolean)}
                              className="mt-1 h-5 w-5 rounded-md"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-[1.02rem] font-semibold leading-tight text-[#1f1f1d]">{item.name}</p>
                              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                {item.quantity && (
                                  <Badge variant="secondary" className="rounded-full border-[#ddd9cf] bg-[#ece9df] px-2.5 py-0.5 text-[11px] text-[#4d4a43]">
                                    {item.quantity}
                                  </Badge>
                                )}
                                <Badge variant="outline" className="rounded-full border-[#d8d7cf] bg-white px-2.5 py-0.5 text-[11px] text-[#58554d]">
                                  {item.category}
                                </Badge>
                                {item.neededForDate && (
                                  <Badge variant="outline" className="rounded-full border-[#f1d3b7] bg-[#fff1e3] px-2.5 py-0.5 text-[11px] text-[#9a622f]">
                                    {isToday(parseISO(item.neededForDate))
                                      ? 'I dag'
                                      : isTomorrow(parseISO(item.neededForDate))
                                        ? 'I morgen'
                                        : format(parseISO(item.neededForDate), 'dd. MMM', { locale: da })}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-9 w-9 rounded-full text-[#9b9a93] hover:bg-[#efece3] hover:text-[#2f2f2d]"
                              onClick={() => deleteShoppingItem(item.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Purchased Items */}
          {purchasedShopping.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-slate-700">Købt ({purchasedShopping.length})</h3>
              <div className="space-y-2">
                {purchasedShopping.slice(0, 3).map((item) => (
                  <Card key={item.id} className="border-slate-200 bg-slate-50/50">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-500 line-through">{item.name}</p>
                          {item.purchasedBy && (
                            <p className="text-xs text-slate-400">
                              Købt af {users.find(u => u.id === item.purchasedBy)?.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
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
