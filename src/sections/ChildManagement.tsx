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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export function ChildManagement() {
  const {
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

    const parent1 = parents[0]?.id || '';

    await createChild({
      name: newChild.name,
      birthDate: newChild.birthDate,
      parent1Id: newChild.parent1Id || parent1,
      ...(newChild.parent2Id ? { parent2Id: newChild.parent2Id } : {}),
      householdId: household?.id || '',
      allergies: newChild.allergies ? newChild.allergies.split(',').map(s => s.trim()) : [],
      medications: newChild.medications ? newChild.medications.split(',').map(s => s.trim()) : [],
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
    });
    setIsEditOpen(true);
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
    <div className="space-y-4 p-4 max-w-lg mx-auto">
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
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button disabled={!canAddChild}>
              <Plus className="w-4 h-4 mr-1" />
              {canAddChild ? 'Tilføj' : 'Maks nået'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tilføj nyt barn</DialogTitle>
            </DialogHeader>
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
                  value={newChild.birthDate}
                  onChange={(e) => setNewChild({...newChild, birthDate: e.target.value})}
                />
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
                    {parents.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Forælder 2 <span className="text-xs text-slate-400 font-normal">(valgfrit)</span></Label>
                <Select
                  value={newChild.parent2Id}
                  onValueChange={(v) => setNewChild({...newChild, parent2Id: v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ingen valgt" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Ingen</SelectItem>
                    {parents.map(p => (
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
        </DialogContent>
      </Dialog>
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
                        <AvatarImage src={child.avatar} />
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

                        {/* Actions */}
                        <div className="flex gap-2 mt-3">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditChild(child.id);
                            }}
                          >
                            <Edit3 className="w-3 h-3 mr-1" />
                            Rediger
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-rose-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveChild(child.id);
                            }}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Fjern
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </motion.div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Rediger barn</DialogTitle>
          </DialogHeader>
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
