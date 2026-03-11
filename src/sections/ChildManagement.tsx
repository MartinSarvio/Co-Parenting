import { useState } from 'react';
import { useAppStore } from '@/store';
import { useApiActions } from '@/hooks/useApiActions';
// ID generation handled by backend via useApiActions
import { cn, formatDate } from '@/lib/utils';
import { getMaxChildren } from '@/lib/subscription';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { SelectSheet } from '@/components/custom/SelectSheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Plus,
  Baby,
  Trash2,
  Edit3,
  AlertTriangle,
  Heart,
  Building2,
  GraduationCap,
  MoreVertical,
  ArrowLeft,
  ChevronDown,
} from 'lucide-react';
import { SavingOverlay } from '@/components/custom/SavingOverlay';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const CHILD_AVATAR_PRESETS = [
  'Baby1', 'Lily', 'Milo', 'Rosie', 'Felix', 'Daisy',
  'Teddy', 'Poppy', 'Alfie', 'Bella', 'Charlie', 'Sophie',
  'Liam', 'Zoe', 'Max', 'Ruby',
];

export function ChildManagement() {
  const {
    users,
    children,
    institutions,
    custodyPlans,
    household,
    currentUser,
    currentChildId,
    setCurrentChildId,
  } = useAppStore();
  const { createChild, updateChild, deleteChild } = useApiActions();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingChild, setEditingChild] = useState<string | null>(null);
  const [menuOpenForChild, setMenuOpenForChild] = useState<string | null>(null);
  const [selectOpen, setSelectOpen] = useState<null | 'institutionType' | 'custodyArrangement'>(null);
  const [newChild, setNewChild] = useState({
    name: '',
    birthDate: '',
    parent1Id: '',
    parent2Id: '',
    allergies: '',
    medications: '',
    institutionName: '',
    institutionType: 'none',
    custodyArrangement: 'none',
    avatar: '',
  });

  const parents = users.filter(u => u.role === 'parent');
  const maxChildren = getMaxChildren(household, currentUser?.isAdmin);
  const isAtChildLimit = children.length >= maxChildren;
  const canAddChild = !isAtChildLimit;

  const handleAddChild = async () => {
    if (!canAddChild) {
      toast.error('Din plan tillader ikke flere børn. Opgrader abonnement for at tilføje flere.');
      return;
    }

    if (!newChild.name || !newChild.birthDate) {
      toast.error('Navn og fødselsdato er påkrævet');
      return;
    }

    setIsSaving(true);
    try {
      const parent1 = parents[0]?.id || '';

      await createChild({
        name: newChild.name,
        birthDate: newChild.birthDate,
        parent1Id: newChild.parent1Id || parent1,
        ...(newChild.parent2Id ? { parent2Id: newChild.parent2Id } : {}),
        householdId: household?.id || '',
        allergies: newChild.allergies ? newChild.allergies.split(',').map(s => s.trim()) : [],
        medications: newChild.medications ? newChild.medications.split(',').map(s => s.trim()) : [],
        avatar: newChild.avatar || undefined,
      });

      toast.success('Barn tilføjet');
      setIsAddOpen(false);
      setNewChild({
        name: '',
        birthDate: '',
        parent1Id: '',
        parent2Id: '',
        allergies: '',
        medications: '',
        institutionName: '',
        institutionType: 'none',
        custodyArrangement: 'none',
        avatar: '',
      });
    } catch {
      toast.error('Kunne ikke tilføje barn');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditChild = (childId: string) => {
    const child = children.find(c => c.id === childId);
    if (!child) return;

    const childInst = institutions.find(i => child.institutions?.includes(i.id));

    setNewChild({
      name: child.name,
      birthDate: child.birthDate,
      parent1Id: child.parent1Id,
      parent2Id: child.parent2Id,
      allergies: child.allergies?.join(', ') || '',
      medications: child.medications?.join(', ') || '',
      institutionName: child.institutionName || (childInst ? childInst.name : ''),
      institutionType: child.institutionType || (childInst ? childInst.type : 'none'),
      custodyArrangement: custodyPlans.find(cp => cp.childId === childId)?.pattern || 'none',
      avatar: child.avatar || '',
    });
    setEditingChild(childId);
  };

  const handleUpdateChild = async () => {
    if (!editingChild) return;

    await updateChild(editingChild, {
      name: newChild.name,
      birthDate: newChild.birthDate,
      parent1Id: newChild.parent1Id,
      parent2Id: newChild.parent2Id,
      allergies: newChild.allergies ? newChild.allergies.split(',').map(s => s.trim()) : [],
      medications: newChild.medications ? newChild.medications.split(',').map(s => s.trim()) : [],
      institutionName: newChild.institutionName || undefined,
      institutionType: newChild.institutionType !== 'none' ? newChild.institutionType as any : undefined,
      avatar: newChild.avatar || undefined,
    });

    setEditingChild(null);
    toast.success('Barn opdateret');
  };

  const handleRemoveChild = (childId: string) => {
    if (confirm('Er du sikker på at du vil fjerne dette barn?')) {
      void deleteChild(childId);
      toast.success('Barn fjernet');
    }
  };

  const getChildInstitutions = (child: typeof children[0]) => {
    return institutions.filter(i => child.institutions?.includes(i.id));
  };

  const getChildCustodyPlan = (child: typeof children[0]) => {
    return custodyPlans.find(cp => cp.childId === child.id);
  };

  const getInstitutionTypeLabel = (type?: string) => {
    switch (type) {
      case 'vuggestue': return 'Vuggestue';
      case 'børnehave': return 'Børnehave';
      case 'skole': return 'Skole';
      case 'sfo': return 'SFO/Fritidsordning';
      default: return '';
    }
  };

  return (
    <div className="space-y-1.5 py-1">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-semibold text-[#2f2f2d]">Børn</h1>
          <p className="text-[#75736b]">Administrer dine børn</p>
        </div>
        <Button disabled={!canAddChild} onClick={() => setIsAddOpen(true)}>
          <Plus className="w-4 h-4 mr-1" />
          {canAddChild ? 'Tilføj' : 'Maks nået'}
        </Button>
    </motion.div>


      {/* Children List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-2"
      >
        {children.length === 0 ? (
          <div className="text-center py-12">
            <Baby className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Ingen børn tilføjet endnu</p>
            <p className="text-sm text-slate-400">Tilføj dit første barn for at komme i gang</p>
          </div>
        ) : (
          children.map((child, index) => {
            const isSelected = child.id === currentChildId;
            const childInstitutions = getChildInstitutions(child);
            const custodyPlan = getChildCustodyPlan(child);
            const parent1 = users.find(u => u.id === child.parent1Id);
            const parent2 = users.find(u => u.id === child.parent2Id);

            return (
              <motion.div
                key={child.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className={cn(
                    "border-slate-200 bg-white cursor-pointer transition-all",
                    isSelected && "border-[#f3c59d] ring-2 ring-[#ffe7d2]"
                  )}
                  onClick={() => setCurrentChildId(child.id)}
                >
                  <CardContent className="p-4 relative">
                    <div className="absolute top-3 right-3 z-10">
                      <button
                        onClick={(e) => { e.stopPropagation(); setMenuOpenForChild(menuOpenForChild === child.id ? null : child.id); }}
                        className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[#78766d] hover:bg-[#f0efe8] transition-colors"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {/* Dropdown popover */}
                      {menuOpenForChild === child.id && (
                        <div className="absolute right-0 top-full mt-1 w-40 rounded-[8px] bg-white shadow-lg border border-[#e5e3dc] z-20 overflow-hidden">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEditChild(child.id); setMenuOpenForChild(null); }}
                            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-[#faf9f6] transition-colors"
                          >
                            <Edit3 className="h-3.5 w-3.5 text-[#f58a2d]" />
                            <span className="text-[13px] font-medium text-[#2f2f2d]">Rediger</span>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRemoveChild(child.id); setMenuOpenForChild(null); }}
                            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-[#faf9f6] transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-[#e53e3e]" />
                            <span className="text-[13px] font-medium text-[#e53e3e]">Fjern</span>
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-start gap-3">
                      <Avatar className="w-14 h-14 border-2 border-white shadow-sm">
                        <AvatarImage src={child.avatar} />
                        <AvatarFallback className="bg-[#fff2e6] text-[#bf6722] text-lg">
                          {child.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between pr-8">
                          <div>
                            <p className="font-semibold text-slate-900">{child.name}</p>
                            <p className="text-sm text-slate-500">
                              Født {formatDate(child.birthDate)}
                            </p>
                          </div>
                          {isSelected && (
                            <Badge className="bg-[#2f2f2f] text-white hover:bg-[#2f2f2f]">Valgt</Badge>
                          )}
                        </div>

                        {/* Parents */}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-slate-500">Forældre:</span>
                          <div className="flex -space-x-1">
                            {[parent1, parent2].filter((p, i, arr) => p && (i === 0 || p.id !== arr[0]?.id)).map((p, i) => (
                              <Avatar key={i} className="w-5 h-5 border border-white">
                                <AvatarImage src={p?.avatar} />
                                <AvatarFallback className="text-[8px]">{p?.name[0]}</AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                        </div>

                        {/* Institutions */}
                        {childInstitutions.length > 0 && (
                          <div className="flex items-center gap-2 mt-2">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            <span className="text-xs text-slate-500">
                              {childInstitutions.map(i => i.name).join(', ')}
                            </span>
                          </div>
                        )}

                        {/* Institution (direct on child) */}
                        {child.institutionName && (
                          <div className="flex items-center gap-2 mt-2">
                            <GraduationCap className="w-3 h-3 text-slate-400" />
                            <span className="text-xs text-slate-500">
                              {child.institutionName}{child.institutionType && child.institutionType !== 'none' ? ` (${getInstitutionTypeLabel(child.institutionType)})` : ''}
                            </span>
                          </div>
                        )}

                        {/* Custody Plan */}
                        {custodyPlan && (
                          <div className="mt-2">
                            <Badge variant="outline" className="text-xs">
                              {{ '7/7': '7/7', '10/4': '10/4', '14/0': '14/0', 'custom': 'Tilpasset', 'alternating': 'Skiftevis', 'weekday-weekend': 'Hverdag/weekend', 'supervised': 'Overvåget', 'supervised_limited': 'Begrænset' }[custodyPlan.pattern] || custodyPlan.name}
                            </Badge>
                          </div>
                        )}

                        {/* Alerts */}
                        {((child.allergies?.length ?? 0) > 0 || (child.medications?.length ?? 0) > 0) && (
                          <div className="flex gap-2 mt-2">
                            {child.allergies && child.allergies.length > 0 && (
                              <div className="flex items-center gap-1 text-amber-600 text-xs">
                                <AlertTriangle className="w-3 h-3" />
                                <span>{child.allergies.length} allergi(er)</span>
                              </div>
                            )}
                            {child.medications && child.medications.length > 0 && (
                              <div className="flex items-center gap-1 text-[#bf6722] text-xs">
                                <Heart className="w-3 h-3" />
                                <span>{child.medications.length} medicin</span>
                              </div>
                            )}
                          </div>
                        )}

                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </motion.div>

      {/* Full-page Edit View */}
      {editingChild && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={(_: unknown, info: { offset: { x: number } }) => { if (info.offset.x > 100) setEditingChild(null); }}
          className="fixed inset-0 z-50 bg-[#f7f6f2] flex flex-col"
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#eeedea]">
            <button onClick={() => setEditingChild(null)} className="flex items-center justify-center text-[#5f5d56] hover:text-[#2f2f2d] transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h2 className="text-[17px] font-bold text-[#2f2f2d]">Rediger barn</h2>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 pb-[calc(env(safe-area-inset-bottom,0px)+100px)]">
            <div className="max-w-[430px] mx-auto space-y-3">
              <div className="space-y-2">
                <Label>Avatar</Label>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                  {CHILD_AVATAR_PRESETS.map(seed => {
                    const url = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(seed)}`;
                    const isSelected = newChild.avatar === url;
                    return (
                      <button key={seed} type="button"
                        onClick={() => setNewChild(prev => ({ ...prev, avatar: url }))}
                        className={cn("flex flex-col items-center gap-0.5 rounded-lg p-1.5 shrink-0 transition-all",
                          isSelected ? "bg-[#fff2e6] ring-2 ring-[#f58a2d]" : "hover:bg-[#f0efe8]"
                        )}>
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={url} />
                          <AvatarFallback>{seed[0]}</AvatarFallback>
                        </Avatar>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Navn</Label>
                <Input
                  value={newChild.name}
                  onChange={(e) => setNewChild({...newChild, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Fødselsdato</Label>
                <Input
                  type="date"
                  max={new Date().toISOString().slice(0, 10)}
                  value={newChild.birthDate}
                  onChange={(e) => setNewChild({...newChild, birthDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Allergier (kommasepareret)</Label>
                <Input
                  value={newChild.allergies}
                  onChange={(e) => setNewChild({...newChild, allergies: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Medicin (kommasepareret)</Label>
                <Input
                  value={newChild.medications}
                  onChange={(e) => setNewChild({...newChild, medications: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Institutionsnavn</Label>
                <Input
                  value={newChild.institutionName}
                  onChange={(e) => setNewChild({...newChild, institutionName: e.target.value})}
                  placeholder="F.eks. Børnehaven Solstrålen"
                />
              </div>
              <div className="space-y-2">
                <Label>Institutionstype</Label>
                <button
                  onClick={() => setSelectOpen('institutionType')}
                  className="w-full flex items-center justify-between rounded-[8px] border border-[#e5e3dc] bg-[#faf9f6] px-3 py-2.5 text-left text-[14px]"
                >
                  <span className={newChild.institutionType === 'none' ? 'text-[#9a978f]' : 'text-[#2f2f2d]'}>
                    {getInstitutionTypeLabel(newChild.institutionType) || 'Vælg institutionstype'}
                  </span>
                  <ChevronDown className="h-4 w-4 text-[#9a978f]" />
                </button>
              </div>
              <div className="space-y-2">
                <Label>Samværsordning</Label>
                <button
                  onClick={() => setSelectOpen('custodyArrangement')}
                  className="w-full flex items-center justify-between rounded-[8px] border border-[#e5e3dc] bg-[#faf9f6] px-3 py-2.5 text-left text-[14px]"
                >
                  <span className={newChild.custodyArrangement === 'none' ? 'text-[#9a978f]' : 'text-[#2f2f2d]'}>
                    {newChild.custodyArrangement === '7/7' ? '7/7 ordning' : newChild.custodyArrangement === '10/4' ? '10/4 ordning' : newChild.custodyArrangement === '14/0' ? '14/0 (fuld forældremyndighed)' : newChild.custodyArrangement === 'custom' ? 'Individuel aftale' : 'Vælg samværsordning'}
                  </span>
                  <ChevronDown className="h-4 w-4 text-[#9a978f]" />
                </button>
              </div>
              <Button onClick={handleUpdateChild} className="w-full">
                Gem ændringer
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Full-page Add View */}
      {isAddOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={(_: unknown, info: { offset: { x: number } }) => { if (info.offset.x > 100) setIsAddOpen(false); }}
          className="fixed inset-0 z-50 bg-[#f7f6f2] flex flex-col"
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#eeedea]">
            <button onClick={() => setIsAddOpen(false)} className="flex items-center justify-center text-[#5f5d56] hover:text-[#2f2f2d] transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h2 className="text-[17px] font-bold text-[#2f2f2d]">Tilføj nyt barn</h2>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 pb-[calc(env(safe-area-inset-bottom,0px)+100px)]">
            <div className="max-w-[430px] mx-auto space-y-3">
              <div className="space-y-2">
                <Label>Avatar</Label>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                  {CHILD_AVATAR_PRESETS.map(seed => {
                    const url = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(seed)}`;
                    const isSelected = newChild.avatar === url;
                    return (
                      <button key={seed} type="button"
                        onClick={() => setNewChild(prev => ({ ...prev, avatar: url }))}
                        className={cn("flex flex-col items-center gap-0.5 rounded-lg p-1.5 shrink-0 transition-all",
                          isSelected ? "bg-[#fff2e6] ring-2 ring-[#f58a2d]" : "hover:bg-[#f0efe8]"
                        )}>
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={url} />
                          <AvatarFallback>{seed[0]}</AvatarFallback>
                        </Avatar>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Navn</Label>
                <Input
                  value={newChild.name}
                  onChange={(e) => setNewChild({...newChild, name: e.target.value})}
                  placeholder="F.eks. Emma"
                />
              </div>
              <div className="space-y-2">
                <Label>Fødselsdato</Label>
                <Input
                  type="date"
                  max={new Date().toISOString().slice(0, 10)}
                  value={newChild.birthDate}
                  onChange={(e) => setNewChild({...newChild, birthDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Forælder 1</Label>
                <SelectSheet
                  value={newChild.parent1Id}
                  onValueChange={(v) => setNewChild({...newChild, parent1Id: v})}
                  title="Forælder 1"
                  placeholder="Vælg forælder"
                  options={parents.map(p => ({ value: p.id, label: p.name }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Forælder 2 <span className="text-xs text-slate-400 font-normal">(valgfrit)</span></Label>
                <SelectSheet
                  value={newChild.parent2Id || '__none__'}
                  onValueChange={(v) => setNewChild({...newChild, parent2Id: v === '__none__' ? '' : v})}
                  title="Forælder 2"
                  placeholder="Ingen valgt"
                  options={[{ value: '__none__', label: 'Ingen' }, ...parents.map(p => ({ value: p.id, label: p.name }))]}
                />
              </div>
              <div className="space-y-2">
                <Label>Allergier (kommasepareret)</Label>
                <Input
                  value={newChild.allergies}
                  onChange={(e) => setNewChild({...newChild, allergies: e.target.value})}
                  placeholder="F.eks. nødder, mælk"
                />
              </div>
              <div className="space-y-2">
                <Label>Medicin (kommasepareret)</Label>
                <Input
                  value={newChild.medications}
                  onChange={(e) => setNewChild({...newChild, medications: e.target.value})}
                  placeholder="F.eks. astmaspray"
                />
              </div>
              <div className="space-y-2">
                <Label>Institutionsnavn</Label>
                <Input
                  value={newChild.institutionName}
                  onChange={(e) => setNewChild({...newChild, institutionName: e.target.value})}
                  placeholder="F.eks. Børnehaven Solstrålen"
                />
              </div>
              <div className="space-y-2">
                <Label>Institutionstype</Label>
                <button
                  onClick={() => setSelectOpen('institutionType')}
                  className="w-full flex items-center justify-between rounded-[8px] border border-[#e5e3dc] bg-[#faf9f6] px-3 py-2.5 text-left text-[14px]"
                >
                  <span className={newChild.institutionType === 'none' ? 'text-[#9a978f]' : 'text-[#2f2f2d]'}>
                    {getInstitutionTypeLabel(newChild.institutionType) || 'Vælg institutionstype'}
                  </span>
                  <ChevronDown className="h-4 w-4 text-[#9a978f]" />
                </button>
              </div>
              <div className="space-y-2">
                <Label>Samværsordning</Label>
                <button
                  onClick={() => setSelectOpen('custodyArrangement')}
                  className="w-full flex items-center justify-between rounded-[8px] border border-[#e5e3dc] bg-[#faf9f6] px-3 py-2.5 text-left text-[14px]"
                >
                  <span className={newChild.custodyArrangement === 'none' ? 'text-[#9a978f]' : 'text-[#2f2f2d]'}>
                    {newChild.custodyArrangement === '7/7' ? '7/7 ordning' : newChild.custodyArrangement === '10/4' ? '10/4 ordning' : newChild.custodyArrangement === '14/0' ? '14/0 (fuld forældremyndighed)' : newChild.custodyArrangement === 'custom' ? 'Individuel aftale' : 'Vælg samværsordning'}
                  </span>
                  <ChevronDown className="h-4 w-4 text-[#9a978f]" />
                </button>
              </div>
              <Button onClick={handleAddChild} className="w-full flex items-center justify-center gap-2" disabled={isSaving}>
                Tilføj barn
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Click-outside handler for dropdown menu */}
      {menuOpenForChild && (
        <div className="fixed inset-0 z-[9]" onClick={() => setMenuOpenForChild(null)} />
      )}

      {/* Popup for institutionstype */}
      <AnimatePresence>
        {selectOpen === 'institutionType' && (
          <>
            <motion.div
              className="fixed inset-0 z-[80] bg-black/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectOpen(null)}
            />
            <motion.div
              className="fixed inset-x-4 bottom-4 z-[81] rounded-xl bg-white shadow-xl border border-[#e5e3dc] max-w-[400px] mx-auto max-h-[80vh] overflow-y-auto"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
            >
              <p className="px-4 pt-3.5 pb-2 text-[13px] font-semibold text-[#78766d]">Institutionstype</p>
              {[
                { value: 'vuggestue', label: 'Vuggestue' },
                { value: 'børnehave', label: 'Børnehave' },
                { value: 'skole', label: 'Skole' },
                { value: 'sfo', label: 'SFO/Fritidsordning' },
                { value: 'none', label: 'Ingen' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setNewChild(prev => ({ ...prev, institutionType: opt.value })); setSelectOpen(null); }}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#faf9f6] transition-colors",
                    newChild.institutionType === opt.value && "bg-[#fff2e6]"
                  )}
                >
                  <span className="text-[14px] font-semibold text-[#2f2f2d]">{opt.label}</span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Popup for samværsordning */}
      <AnimatePresence>
        {selectOpen === 'custodyArrangement' && (
          <>
            <motion.div
              className="fixed inset-0 z-[80] bg-black/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectOpen(null)}
            />
            <motion.div
              className="fixed inset-x-4 bottom-4 z-[81] rounded-xl bg-white shadow-xl border border-[#e5e3dc] max-w-[400px] mx-auto max-h-[80vh] overflow-y-auto"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
            >
              <p className="px-4 pt-3.5 pb-2 text-[13px] font-semibold text-[#78766d]">Samværsordning</p>
              {[
                { value: '7/7', label: '7/7 ordning' },
                { value: '10/4', label: '10/4 ordning' },
                { value: '14/0', label: '14/0 (fuld forældremyndighed)' },
                { value: 'custom', label: 'Individuel aftale' },
                { value: 'none', label: 'Ikke fastlagt' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setNewChild(prev => ({ ...prev, custodyArrangement: opt.value })); setSelectOpen(null); }}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#faf9f6] transition-colors",
                    newChild.custodyArrangement === opt.value && "bg-[#fff2e6]"
                  )}
                >
                  <span className="text-[14px] font-semibold text-[#2f2f2d]">{opt.label}</span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <SavingOverlay open={isSaving} />
    </div>
  );
}
