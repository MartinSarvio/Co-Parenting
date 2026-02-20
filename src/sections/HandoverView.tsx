import { useState } from 'react';
import { useAppStore } from '@/store';
import { cn, getParentColor } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CheckCircle2, 
  Circle,
  ArrowRight, 
  Package, 
  Stethoscope, 
  BookOpen, 
  Heart,
  MessageSquare,
  Send,
  History,
  Plus,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { da } from 'date-fns/locale';
import { toast } from 'sonner';

const checklistIcons: Record<string, React.ReactNode> = {
  'Skoletaske': <BookOpen className="w-4 h-4" />,
  'Tandbørste': <Stethoscope className="w-4 h-4" />,
  'Medicin': <Stethoscope className="w-4 h-4" />,
  'Favorit bamse': <Heart className="w-4 h-4" />,
  'default': <Package className="w-4 h-4" />,
};

const checklistCategoryOptions = [
  { value: 'school', label: 'Skole' },
  { value: 'clothing', label: 'Tøj' },
  { value: 'health', label: 'Sundhed' },
  { value: 'toys', label: 'Legetøj' },
  { value: 'other', label: 'Andet' },
] as const;

const checklistCategoryLabels = checklistCategoryOptions.reduce<Record<string, string>>((result, option) => {
  result[option.value] = option.label;
  return result;
}, {});

const createChecklistId = (handoverId: string, checklistIds: string[]) => {
  const maxIndex = checklistIds.reduce((max, id) => {
    const match = id.match(new RegExp(`^check-${handoverId}-(\\d+)$`));
    if (!match) return max;
    const index = Number.parseInt(match[1], 10);
    return Number.isNaN(index) ? max : Math.max(max, index);
  }, 0);

  return `check-${handoverId}-${maxIndex + 1}`;
};

export function HandoverView() {
  const { 
    currentUser, 
    users, 
    children, 
    handovers, 
    updateHandover,
    addHandover
  } = useAppStore();
  
  const [note, setNote] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [newChecklistCategory, setNewChecklistCategory] = useState<'clothing' | 'school' | 'health' | 'toys' | 'other'>('other');

  const currentChild = children[0];
  const otherParent = users.find(u => u.id !== currentUser?.id);
  
  // Get active handover or create a new one
  const activeHandover = handovers.find(h => h.status !== 'completed');
  const checklistCount = activeHandover?.checklist.length || 0;
  const completedChecklistCount = activeHandover?.checklist.filter(item => item.completed).length || 0;
  const handoverProgress = checklistCount > 0
    ? Math.round((completedChecklistCount / checklistCount) * 100)
    : 0;

  const toggleChecklistItem = (itemId: string) => {
    if (!activeHandover) return;
    
    const updatedChecklist = activeHandover.checklist.map(item => 
      item.id === itemId 
        ? { 
            ...item, 
            completed: !item.completed,
            completedBy: !item.completed ? currentUser?.id : undefined,
            completedAt: !item.completed ? new Date().toISOString() : undefined
          }
        : item
    );
    
    updateHandover(activeHandover.id, { 
      checklist: updatedChecklist,
      status: updatedChecklist.every(i => i.completed) ? 'in_progress' : 'pending'
    });
  };

  const addChecklistItem = () => {
    if (!activeHandover) return;
    const itemName = newChecklistItem.trim();

    if (!itemName) {
      toast.error('Skriv hvad der skal med i pakkelisten');
      return;
    }

    const alreadyExists = activeHandover.checklist.some(
      (existingItem) => existingItem.item.toLowerCase() === itemName.toLowerCase()
    );

    if (alreadyExists) {
      toast.error('Punktet findes allerede på listen');
      return;
    }

    const updatedChecklist = [
      ...activeHandover.checklist,
      {
        id: createChecklistId(activeHandover.id, activeHandover.checklist.map((item) => item.id)),
        item: itemName,
        completed: false,
        category: newChecklistCategory,
      },
    ];

    updateHandover(activeHandover.id, {
      checklist: updatedChecklist,
      status: 'pending',
    });

    setNewChecklistItem('');
    setNewChecklistCategory('other');
    toast.success('Tilføjet til pakkeliste');
  };

  const removeChecklistItem = (itemId: string) => {
    if (!activeHandover) return;

    const updatedChecklist = activeHandover.checklist.filter(item => item.id !== itemId);
    updateHandover(activeHandover.id, {
      checklist: updatedChecklist,
      status: updatedChecklist.length > 0 && updatedChecklist.every(item => item.completed) ? 'in_progress' : 'pending',
    });

    toast.success('Punkt fjernet');
  };

  const confirmHandover = () => {
    if (!activeHandover) return;
    
    updateHandover(activeHandover.id, {
      status: 'completed',
      completedDate: new Date().toISOString(),
      notes: note
    });
    
    toast.success('Aflevering bekræftet!');
  };

  const addNote = () => {
    if (!activeHandover || !note.trim()) return;
    
    updateHandover(activeHandover.id, {
      notes: note
    });
    
    setNote('');
    toast.success('Note tilføjet');
  };

  // If no active handover, show message
  if (!activeHandover) {
    return (
      <div className="space-y-4 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <div className="w-20 h-20 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Ingen aktiv aflevering</h2>
          <p className="text-slate-500 mb-6">Der er ingen aflevering planlagt i øjeblikket.</p>
          <Button 
            onClick={() => {
              if (!currentChild || !currentUser || !otherParent) return;
              addHandover({
                id: `h-${handovers.length + 1}`,
                childId: currentChild.id,
                fromParentId: currentUser.id,
                toParentId: otherParent.id,
                scheduledDate: new Date().toISOString(),
                status: 'pending',
                checklist: [
                  { id: 'default-1', item: 'Skoletaske', completed: false, category: 'school' },
                  { id: 'default-2', item: 'Tandbørste', completed: false, category: 'health' },
                  { id: 'default-3', item: 'Medicin', completed: false, category: 'health' },
                  { id: 'default-4', item: 'Favorit bamse', completed: false, category: 'toys' },
                ],
                notes: ''
              });
              toast.success('Ny aflevering oprettet');
            }}
          >
            Opret aflevering
          </Button>
        </motion.div>
      </div>
    );
  }

  const fromParent = users.find(u => u.id === activeHandover.fromParentId);
  const toParent = users.find(u => u.id === activeHandover.toParentId);

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-2xl font-bold text-slate-900">Aflevering</h1>
        <p className="text-slate-500">
          {format(parseISO(activeHandover.scheduledDate), 'EEEE d. MMMM', { locale: da })}
        </p>
      </motion.div>

      {/* Parent Transfer Visual */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-slate-200 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {/* From Parent */}
              <div className="flex flex-col items-center">
                <Avatar className="w-16 h-16 border-4 border-white shadow-lg mb-2">
                  <AvatarImage src={fromParent?.avatar} />
                  <AvatarFallback 
                    className="text-lg"
                    style={{ 
                      backgroundColor: fromParent ? getParentColor(fromParent.color) + '30' : undefined,
                      color: fromParent ? getParentColor(fromParent.color) : undefined
                    }}
                  >
                    {fromParent?.name[0]}
                  </AvatarFallback>
                </Avatar>
                <p className="font-semibold text-slate-900">{fromParent?.name}</p>
                <Badge variant="outline" className="mt-1">Fra</Badge>
              </div>

              {/* Arrow */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                  <ArrowRight className="w-8 h-8 text-slate-400" />
                </div>
                <Avatar className="w-10 h-10 border-2 border-white">
                  <AvatarImage src={currentChild?.avatar} />
                  <AvatarFallback className="bg-[#fff2e6] text-[#bf6722]">
                    {currentChild?.name[0]}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* To Parent */}
              <div className="flex flex-col items-center">
                <Avatar className="w-16 h-16 border-4 border-white shadow-lg mb-2">
                  <AvatarImage src={toParent?.avatar} />
                  <AvatarFallback 
                    className="text-lg"
                    style={{ 
                      backgroundColor: toParent ? getParentColor(toParent.color) + '30' : undefined,
                      color: toParent ? getParentColor(toParent.color) : undefined
                    }}
                  >
                    {toParent?.name[0]}
                  </AvatarFallback>
                </Avatar>
                <p className="font-semibold text-slate-900">{toParent?.name}</p>
                <Badge variant="outline" className="mt-1">Til</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="w-5 h-5 text-slate-500" />
                Pakkeliste
              </CardTitle>
              <Badge variant={handoverProgress === 100 ? 'default' : 'secondary'}>
                {handoverProgress}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <Progress value={handoverProgress} className="h-2" />
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <p className="mb-2 text-xs font-medium text-slate-800">Tilføj ting til pakkeliste</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_132px]">
                <Input
                  className="h-11 rounded-full text-sm"
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  placeholder="Fx Regntøj, ekstra skiftetøj, sut"
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addChecklistItem();
                    }
                  }}
                />
                <Select
                  value={newChecklistCategory}
                  onValueChange={(value: 'clothing' | 'school' | 'health' | 'toys' | 'other') => setNewChecklistCategory(value)}
                >
                  <SelectTrigger className="h-11 w-full rounded-full text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {checklistCategoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" className="h-11 rounded-full px-3 text-sm" onClick={addChecklistItem}>
                  <Plus className="w-4 h-4" />
                  Tilføj
                </Button>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Aflevering kan først bekræftes når alle punkter er markeret som leveret.
              </p>
            </div>
            <div className="space-y-2">
              {activeHandover.checklist.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  onClick={() => toggleChecklistItem(item.id)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all",
                    item.completed 
                      ? "bg-green-50 border border-green-200" 
                      : "bg-slate-50 border border-slate-200 hover:bg-slate-100"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center transition-all",
                    item.completed 
                      ? "bg-green-500 text-white" 
                      : "bg-slate-200 text-slate-400"
                  )}>
                    {item.completed ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Circle className="w-4 h-4" />
                    )}
                  </div>
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    item.completed ? "bg-green-100 text-green-600" : "bg-slate-200 text-slate-500"
                  )}>
                    {checklistIcons[item.item] || checklistIcons['default']}
                  </div>
                  <div className="flex-1">
                    <p className={cn(
                      "font-medium",
                      item.completed ? "text-green-700 line-through" : "text-slate-700"
                    )}>
                      {item.item}
                    </p>
                    <p className="text-xs text-slate-500">
                      {checklistCategoryLabels[item.category || 'other'] || checklistCategoryLabels.other}
                    </p>
                  </div>
                  {item.completed && item.completedBy && (
                    <span className="text-xs text-green-600">
                      {users.find(u => u.id === item.completedBy)?.name}
                    </span>
                  )}
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    className="text-slate-400 hover:text-rose-500"
                    onClick={(event) => {
                      event.stopPropagation();
                      removeChecklistItem(item.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-slate-500" />
              Noter til {toParent?.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            {activeHandover.notes && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-sm text-amber-800">{activeHandover.notes}</p>
              </div>
            )}
            <div className="flex gap-2">
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Tilføj en note..."
                className="flex-1 min-h-[80px]"
              />
            </div>
            <Button 
              onClick={addNote}
              disabled={!note.trim()}
              variant="outline"
              className="w-full"
            >
              <Send className="w-4 h-4 mr-2" />
              Tilføj note
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Confirm Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Button 
          onClick={confirmHandover}
          disabled={handoverProgress < 100}
          className={cn(
            "w-full h-14 text-lg font-semibold",
            handoverProgress === 100
              ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              : "bg-slate-300"
          )}
        >
          <CheckCircle2 className="w-5 h-5 mr-2" />
          {handoverProgress === 100 
            ? 'Bekræft aflevering' 
            : `Færdiggør pakkeliste (${activeHandover.checklist.filter(i => !i.completed).length} tilbage)`}
        </Button>
      </motion.div>

      {/* History Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Button 
          variant="ghost" 
          className="w-full"
          onClick={() => setShowHistory(!showHistory)}
        >
          <History className="w-4 h-4 mr-2" />
          {showHistory ? 'Skjul historik' : 'Vis historik'}
        </Button>
      </motion.div>

      {/* History */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Tidligere afleveringer</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {handovers
                    .filter(h => h.status === 'completed')
                    .map(handover => (
                      <div 
                        key={handover.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-slate-50"
                      >
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">
                            {format(parseISO(handover.scheduledDate), 'd. MMMM yyyy', { locale: da })}
                          </p>
                          <p className="text-sm text-slate-500">
                            {users.find(u => u.id === handover.fromParentId)?.name} → {users.find(u => u.id === handover.toParentId)?.name}
                          </p>
                        </div>
                        <Badge variant="outline">Afsluttet</Badge>
                      </div>
                    ))}
                  {handovers.filter(h => h.status === 'completed').length === 0 && (
                    <p className="text-center text-slate-400 py-4">Ingen afsluttede afleveringer endnu</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
