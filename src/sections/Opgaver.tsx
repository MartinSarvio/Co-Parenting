import { useState } from 'react';
import { useAppStore } from '@/store';
import { taskId, shoppingItemId } from '@/lib/id';
import { cn, getTaskCategoryLabel } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Home
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

export function Opgaver() {
  const { 
    tasks, 
    shoppingItems, 
    users, 
    currentUser, 
    addTask, 
    updateTask, 
    deleteTask,
    addShoppingItem,
    updateShoppingItem,
    deleteShoppingItem
  } = useAppStore();
  
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

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.category === filter;
  });

  const pendingTasks = filteredTasks.filter(t => !t.completed);
  const completedTasks = filteredTasks.filter(t => t.completed);

  const pendingShopping = shoppingItems.filter(i => !i.purchased);
  const purchasedShopping = shoppingItems.filter(i => i.purchased);

  const handleAddTask = () => {
    if (!newTask.title) return;
    
    addTask({
      id: taskId(),
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

  const toggleTask = (taskId: string, completed: boolean) => {
    updateTask(taskId, { 
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
      updateTask(task.id, { completed: true, completedAt });
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

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Opgaver & Indkøb</h1>
          <p className="text-slate-500">Hold styr på jeres opgaver</p>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 gap-0">
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Opgaver
            {pendingTasks.length > 0 && (
              <Badge variant="secondary" className="ml-1">{pendingTasks.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="shopping" className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Indkøb
            {pendingShopping.length > 0 && (
              <Badge variant="secondary" className="ml-1">{pendingShopping.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4 mt-4">
          {/* Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat.value}
                onClick={() => setFilter(cat.value)}
                className={cn(
                  "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                  filter === cat.value
                    ? "bg-slate-800 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
                )}
              >
                <cat.icon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            ))}
          </div>

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
                              onClick={() => deleteTask(task.id)}
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
        </TabsContent>

        {/* Shopping Tab */}
        <TabsContent value="shopping" className="space-y-4 mt-4">
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
        </TabsContent>
      </Tabs>
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
