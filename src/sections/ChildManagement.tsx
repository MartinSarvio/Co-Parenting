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
import { BottomSheet } from '@/components/custom/BottomSheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const CHILD_AVATAR_SEEDS = [
  'Maria', 'Anders', 'Sofie', 'Lars', 'Emma', 'Mikkel',
  'Anne', 'Thomas', 'Camilla', 'Frederik', 'Julie', 'Oliver',
];

export function ChildManagement() {
  const {
    currentUser,
    users,
    children,
    institutions,
    custodyPlans,
    household,
    currentChildId,
    setCurrentChildId,
  } = useAppStore();
  const { createChild, updateChild, deleteChild } = useApiActions();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
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
  const maxChildren = getMaxChildren(household);
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

    const parent1 = currentUser?.id || parents[0]?.id || '';

    if (!parent1 || !household?.id) {
      toast.error('Mangler bruger- eller husstandsdata. Prøv at logge ind igen.');
      return;
    }

    const childAvatar = newChild.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(newChild.name)}`;

    await createChild({
      name: newChild.name,
      birthDate: newChild.birthDate,
      parent1Id: newChild.parent1Id || parent1,
      parent2Id: newChild.parent2Id || parent1, // Default to same parent if no second parent
      householdId: household.id,
      allergies: newChild.allergies ? newChild.allergies.split(',').map(s => s.trim()) : [],
      medications: newChild.medications ? newChild.medications.split(',').map(s => s.trim()) : [],
      avatar: childAvatar,
    });

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
    toast.success('Barn tilføjet');
  };

  const handleEditChild = (childId: string) => {
    const child = children.find(c => c.id === childId);
    if (!child) return;

    const childInst = institutions.find(i => child.institutions?.includes(i.id));

    setEditingChild(childId);
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
    setIsEditOpen(true);
  };

  const handleUpdateChild = async () => {
    if (!editingChild) return;

    const editAvatar = newChild.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(newChild.name)}`;

    await updateChild(editingChild, {
      name: newChild.name,
      birthDate: newChild.birthDate,
      parent1Id: newChild.parent1Id,
      parent2Id: newChild.parent2Id,
      allergies: newChild.allergies ? newChild.allergies.split(',').map(s => s.trim()) : [],
      medications: newChild.medications ? newChild.medications.split(',').map(s => s.trim()) : [],
      institutionName: newChild.institutionName || undefined,
      institutionType: newChild.institutionType !== 'none' ? newChild.institutionType as any : undefined,
      avatar: editAvatar,
    });

    setIsEditOpen(false);
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
    <div className="space-y-2 py-1">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-semibold text-[#2f2f2d]">Børn</h1>
        </div>
        <Button disabled={!canAddChild} onClick={() => setIsAddOpen(true)}>
          <Plus className="w-4 h-4 mr-1" />
          {canAddChild ? 'Tilføj' : 'Maks nået'}
        </Button>
        <BottomSheet open={isAddOpen} onOpenChange={setIsAddOpen} title="Tilføj nyt barn">
            <div className="space-y-4 pt-4">
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
              {/* Avatar picker */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-[#75736b]">Eller vælg en avatar</Label>
                <div className="grid grid-cols-4 gap-3">
                  {CHILD_AVATAR_SEEDS.map(seed => {
                    const url = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(seed)}`;
                    const isSelected = newChild.avatar === url;
                    return (
                      <button
                        key={seed}
                        type="button"
                        onClick={() => setNewChild({...newChild, avatar: url})}
                        className={cn(
                          'flex flex-col items-center gap-1 rounded-xl p-2 transition-all',
                          isSelected ? 'bg-[#fff2e6] ring-2 ring-[#f58a2d]' : 'hover:bg-[#f0efe8]'
                        )}
                      >
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={url} />
                          <AvatarFallback>{seed[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-[10px] text-[#78766d]">{seed}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Forælder 1</Label>
                <Select
                  value={newChild.parent1Id}
                  onValueChange={(v) => setNewChild({...newChild, parent1Id: v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vælg forælder" />
                  </SelectTrigger>
                  <SelectContent>
                    {parents.filter(p => p.id).map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Forælder 2 <span className="text-xs text-slate-400 font-normal">(valgfrit)</span></Label>
                <Select
                  value={newChild.parent2Id || '__none__'}
                  onValueChange={(v) => setNewChild({...newChild, parent2Id: v === '__none__' ? '' : v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ingen valgt" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Ingen</SelectItem>
                    {parents.filter(p => p.id).map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Select
                  value={newChild.institutionType}
                  onValueChange={(v) => setNewChild({...newChild, institutionType: v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vælg institutionstype" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vuggestue">Vuggestue</SelectItem>
                    <SelectItem value="børnehave">Børnehave</SelectItem>
                    <SelectItem value="skole">Skole</SelectItem>
                    <SelectItem value="sfo">SFO/Fritidsordning</SelectItem>
                    <SelectItem value="none">Ingen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Samværsordning</Label>
                <Select
                  value={newChild.custodyArrangement}
                  onValueChange={(v) => setNewChild({...newChild, custodyArrangement: v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vælg samværsordning" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7/7">7/7 ordning</SelectItem>
                    <SelectItem value="10/4">10/4 ordning</SelectItem>
                    <SelectItem value="14/0">14/0 (fuld forældremyndighed)</SelectItem>
                    <SelectItem value="custom">Individuel aftale</SelectItem>
                    <SelectItem value="none">Ikke fastlagt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            <Button onClick={handleAddChild} className="w-full">
              Tilføj barn
            </Button>
          </div>
        </BottomSheet>
    </motion.div>


      {/* Children List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-3"
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
                    "border-slate-200 cursor-pointer transition-all",
                    isSelected && "border-[#f3c59d] ring-2 ring-[#ffe7d2]"
                  )}
                  onClick={() => setCurrentChildId(child.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-14 h-14 border-2 border-white shadow-sm">
                        <AvatarImage src={child.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(child.name)}`} />
                        <AvatarFallback className="bg-[#fff2e6] text-[#bf6722] text-lg">
                          {child.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">{child.name}</p>
                            <p className="text-sm text-slate-500">
                              Født {formatDate(child.birthDate)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {isSelected && (
                              <Badge className="bg-[#2f2f2f] text-white hover:bg-[#2f2f2f]">Valgt</Badge>
                            )}
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuId(openMenuId === child.id ? null : child.id);
                                }}
                                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#f0efe8] transition-colors"
                              >
                                <MoreVertical className="h-4 w-4 text-[#75736b]" />
                              </button>
                              {openMenuId === child.id && (
                                <>
                                  <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); }} />
                                  <div className="absolute right-0 top-9 z-50 w-40 rounded-xl border border-[#e5e3dc] bg-white py-1.5 shadow-lg">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenMenuId(null);
                                        handleEditChild(child.id);
                                      }}
                                      className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] font-medium text-[#2f2f2d] hover:bg-[#f7f6f2] transition-colors"
                                    >
                                      <Edit3 className="h-3.5 w-3.5 text-[#7a786f]" />
                                      Rediger
                                    </button>
                                    <div className="mx-3 border-t border-[#eeedea]" />
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenMenuId(null);
                                        handleRemoveChild(child.id);
                                      }}
                                      className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] font-medium text-[#ef4444] hover:bg-[#fef2f2] transition-colors"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                      Slet
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
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
                              {custodyPlan.name}
                            </Badge>
                          </div>
                        )}

                        {/* Alerts */}
                        {(child.allergies?.length || child.medications?.length) && (
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

                        {/* ⋯ Menu */}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </motion.div>

      {/* Edit BottomSheet */}
      <BottomSheet open={isEditOpen} onOpenChange={setIsEditOpen} title="Rediger barn">
          <div className="space-y-4 pt-4">
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
            {/* Avatar picker (edit) */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-[#75736b]">Eller vælg en avatar</Label>
              <div className="grid grid-cols-4 gap-3">
                {CHILD_AVATAR_SEEDS.map(seed => {
                  const url = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(seed)}`;
                  const isSelected = newChild.avatar === url;
                  return (
                    <button
                      key={seed}
                      type="button"
                      onClick={() => setNewChild({...newChild, avatar: url})}
                      className={cn(
                        'flex flex-col items-center gap-1 rounded-xl p-2 transition-all',
                        isSelected ? 'bg-[#fff2e6] ring-2 ring-[#f58a2d]' : 'hover:bg-[#f0efe8]'
                      )}
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={url} />
                        <AvatarFallback>{seed[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-[10px] text-[#78766d]">{seed}</span>
                    </button>
                  );
                })}
              </div>
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
              <Select
                value={newChild.institutionType}
                onValueChange={(v) => setNewChild({...newChild, institutionType: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vælg institutionstype" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vuggestue">Vuggestue</SelectItem>
                  <SelectItem value="børnehave">Børnehave</SelectItem>
                  <SelectItem value="skole">Skole</SelectItem>
                  <SelectItem value="sfo">SFO/Fritidsordning</SelectItem>
                  <SelectItem value="none">Ingen</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Samværsordning</Label>
              <Select
                value={newChild.custodyArrangement}
                onValueChange={(v) => setNewChild({...newChild, custodyArrangement: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vælg samværsordning" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7/7">7/7 ordning</SelectItem>
                  <SelectItem value="10/4">10/4 ordning</SelectItem>
                  <SelectItem value="14/0">14/0 (fuld forældremyndighed)</SelectItem>
                  <SelectItem value="custom">Individuel aftale</SelectItem>
                  <SelectItem value="none">Ikke fastlagt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleUpdateChild} className="w-full">
              Gem ændringer
            </Button>
          </div>
      </BottomSheet>
    </div>
  );
}
