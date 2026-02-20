import { useState } from 'react';
import { useAppStore } from '@/store';
import { useApiActions } from '@/hooks/useApiActions';
import { milestoneId } from '@/lib/id';
import { cn, formatDate, getDocumentTypeLabel } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Plus, 
  Calendar, 
  FileText, 
  Stethoscope, 
  GraduationCap, 
  Users,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { motion } from 'framer-motion';
import { differenceInYears, differenceInMonths, parseISO } from 'date-fns';
import { toast } from 'sonner';
import type { DocumentType, Milestone } from '@/types';

const milestoneCategories = [
  { value: 'health', label: 'Sundhed', icon: Stethoscope, color: 'bg-rose-100 text-rose-600' },
  { value: 'school', label: 'Skole', icon: GraduationCap, color: 'bg-blue-100 text-blue-600' },
  { value: 'development', label: 'Udvikling', icon: CheckCircle2, color: 'bg-green-100 text-green-600' },
  { value: 'social', label: 'Social', icon: Users, color: 'bg-purple-100 text-purple-600' },
];

const documentTypes = [
  { value: 'contract', label: 'Kontrakt' },
  { value: 'medical', label: 'Medicinsk' },
  { value: 'school', label: 'Skole' },
  { value: 'insurance', label: 'Forsikring' },
  { value: 'other', label: 'Andet' },
];

export function Borneoverblik() {
  const {
    currentUser,
    users,
    children,
    milestones,
    documents,
    addMilestone,
  } = useAppStore();
  const { createDocument } = useApiActions();
  
  const [activeTab, setActiveTab] = useState('milestones');
  const [isAddMilestoneOpen, setIsAddMilestoneOpen] = useState(false);
  const [isAddDocumentOpen, setIsAddDocumentOpen] = useState(false);
  const [newMilestone, setNewMilestone] = useState<{
    title: string;
    description: string;
    date: string;
    category: Milestone['category'];
  }>({
    title: '',
    description: '',
    date: '',
    category: 'development',
  });
  const [newDocument, setNewDocument] = useState<{
    title: string;
    type: DocumentType;
    url: string;
  }>({
    title: '',
    type: 'other',
    url: '',
  });

  const currentChild = children[0];
  const parent1 = users.find(u => u.id === currentChild?.parent1Id);
  const parent2 = users.find(u => u.id === currentChild?.parent2Id);

  // Calculate age
  const getAge = () => {
    if (!currentChild) return '';
    const birthDate = parseISO(currentChild.birthDate);
    const years = differenceInYears(new Date(), birthDate);
    const months = differenceInMonths(new Date(), birthDate) % 12;
    
    if (years === 0) return `${months} måneder`;
    if (months === 0) return `${years} år`;
    return `${years} år og ${months} måneder`;
  };

  const handleAddMilestone = () => {
    if (!newMilestone.title || !newMilestone.date || !currentChild) return;
    
    addMilestone({
      id: milestoneId(),
      childId: currentChild.id,
      title: newMilestone.title,
      description: newMilestone.description,
      date: newMilestone.date,
      category: newMilestone.category,
      addedBy: currentUser?.id || 'u1',
    });
    
    setIsAddMilestoneOpen(false);
    setNewMilestone({ title: '', description: '', date: '', category: 'development' });
    toast.success('Milepæl tilføjet');
  };

  const handleAddDocument = () => {
    if (!newDocument.title.trim() || !currentChild) {
      toast.error('Tilføj en titel');
      return;
    }
    if (!newDocument.url.trim()) {
      toast.error('Tilføj filreference eller link');
      return;
    }
    
    void createDocument({
      title: newDocument.title.trim(),
      type: newDocument.type,
      url: newDocument.url.trim(),
      sharedWith: [parent1?.id, parent2?.id].filter(Boolean) as string[],
    });
    
    setIsAddDocumentOpen(false);
    setNewDocument({ title: '', type: 'other', url: '' });
    toast.success('Dokument tilføjet');
  };

  if (!currentChild) {
    return (
      <div className="p-4 text-center">
        <p className="text-slate-500">Intet barn fundet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Header with child info */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-white shadow-xl">
          <AvatarImage src={currentChild.avatar} />
          <AvatarFallback className="text-3xl bg-[#eceae2] text-[#2f2f2f]">
            {currentChild.name[0]}
          </AvatarFallback>
        </Avatar>
        <h1 className="text-2xl font-bold text-slate-900">{currentChild.name}</h1>
        <p className="text-slate-500">{getAge()} gammel</p>
        <p className="text-sm text-slate-400">Født {formatDate(currentChild.birthDate)}</p>
      </motion.div>

      {/* Parents */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex justify-center gap-4"
      >
        {parent1 && (
          <div className={cn(
            "flex items-center gap-2 rounded-full border px-4 py-2",
            parent1.color === 'warm'
              ? 'border-[#f4c89f] bg-[#fff2e6]'
              : 'border-[#2f2f2f] bg-[#2f2f2f]'
          )}>
            <Avatar className="w-8 h-8">
              <AvatarImage src={parent1.avatar} />
              <AvatarFallback className={cn(
                "text-xs",
                parent1.color === 'warm' ? 'bg-[#f58a2d] text-white' : 'bg-[#4f4b45] text-white'
              )}>
                {parent1.name[0]}
              </AvatarFallback>
            </Avatar>
            <span className={cn("text-sm font-medium", parent1.color === 'warm' ? 'text-[#cc6f1f]' : 'text-white')}>{parent1.name}</span>
          </div>
        )}
        {parent2 && (
          <div className={cn(
            "flex items-center gap-2 rounded-full border px-4 py-2",
            parent2.color === 'warm'
              ? 'border-[#f4c89f] bg-[#fff2e6]'
              : 'border-[#2f2f2f] bg-[#2f2f2f]'
          )}>
            <Avatar className="w-8 h-8">
              <AvatarImage src={parent2.avatar} />
              <AvatarFallback className={cn(
                "text-xs",
                parent2.color === 'warm' ? 'bg-[#f58a2d] text-white' : 'bg-[#4f4b45] text-white'
              )}>
                {parent2.name[0]}
              </AvatarFallback>
            </Avatar>
            <span className={cn("text-sm font-medium", parent2.color === 'warm' ? 'text-[#cc6f1f]' : 'text-white')}>{parent2.name}</span>
          </div>
        )}
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 gap-0">
          <TabsTrigger value="milestones" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Milepæle
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Dokumenter
          </TabsTrigger>
        </TabsList>

        {/* Milestones Tab */}
        <TabsContent value="milestones" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-slate-700">Milepæle & Begivenheder</h3>
            <Dialog open={isAddMilestoneOpen} onOpenChange={setIsAddMilestoneOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-1" />
                  Tilføj
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tilføj milepæl</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Titel</Label>
                    <Input 
                      value={newMilestone.title}
                      onChange={(e) => setNewMilestone({...newMilestone, title: e.target.value})}
                      placeholder="F.eks. Første skoledag"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Beskrivelse (valgfri)</Label>
                    <Textarea 
                      value={newMilestone.description}
                      onChange={(e) => setNewMilestone({...newMilestone, description: e.target.value})}
                      placeholder="Beskriv begivenheden..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Dato</Label>
                    <Input 
                      type="date"
                      value={newMilestone.date}
                      onChange={(e) => setNewMilestone({...newMilestone, date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Kategori</Label>
                    <Select 
                      value={newMilestone.category} 
                      onValueChange={(v) => setNewMilestone({...newMilestone, category: v as Milestone['category']})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {milestoneCategories.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            <div className="flex items-center gap-2">
                              <cat.icon className="w-4 h-4" />
                              {cat.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddMilestone} className="w-full">
                    Tilføj milepæl
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {milestones
              .filter(m => m.childId === currentChild.id)
              .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())
              .map((milestone, index) => {
                const category = milestoneCategories.find(c => c.value === milestone.category);
                const addedBy = users.find(u => u.id === milestone.addedBy);
                
                return (
                  <motion.div
                    key={milestone.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="border-slate-200">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                            category?.color || 'bg-slate-100 text-slate-600'
                          )}>
                            {category ? <category.icon className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-semibold text-slate-900">{milestone.title}</p>
                                {milestone.description && (
                                  <p className="text-sm text-slate-500 mt-1">{milestone.description}</p>
                                )}
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {formatDate(milestone.date)}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <Avatar className="w-5 h-5">
                                <AvatarImage src={addedBy?.avatar} />
                                <AvatarFallback className="text-[8px]">{addedBy?.name[0]}</AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-slate-400">
                                Tilføjet af {addedBy?.name}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            
            {milestones.filter(m => m.childId === currentChild.id).length === 0 && (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Ingen milepæle endnu</p>
                <p className="text-sm text-slate-400">Tilføj vigtige begivenheder i dit barns liv</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-slate-700">Dokumenter</h3>
            <Dialog open={isAddDocumentOpen} onOpenChange={setIsAddDocumentOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-1" />
                  Tilføj
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tilføj dokument</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Titel</Label>
                    <Input 
                      value={newDocument.title}
                      onChange={(e) => setNewDocument({...newDocument, title: e.target.value})}
                      placeholder="F.eks. Vaccinationskort"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select 
                      value={newDocument.type} 
                      onValueChange={(v) => setNewDocument({...newDocument, type: v as DocumentType})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {documentTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Fil eller link</Label>
                    <Input
                      value={newDocument.url}
                      onChange={(e) => setNewDocument({ ...newDocument, url: e.target.value })}
                      placeholder="https://... eller fx vaccinationskort.pdf"
                    />
                    <p className="text-xs text-slate-500">
                      Du kan gemme et link eller en filreference.
                    </p>
                  </div>
                  <Button onClick={handleAddDocument} className="w-full">
                    Tilføj dokument
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {documents
              .filter(d => d.childId === currentChild.id || d.childId === undefined)
              .sort((a, b) => parseISO(b.uploadedAt).getTime() - parseISO(a.uploadedAt).getTime())
              .map((document, index) => {
                const uploadedBy = users.find(u => u.id === document.uploadedBy);
                
                return (
                  <motion.div
                    key={document.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="cursor-pointer border-[#d8d7cf] bg-[#faf9f5] transition-colors hover:border-[#f3c59d]">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#fff2e6]">
                            <FileText className="h-5 w-5 text-[#f58a2d]" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-semibold text-slate-900">{document.title}</p>
                                <p className="text-sm text-slate-500">{getDocumentTypeLabel(document.type)}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  const raw = document.url.trim();
                                  const normalized = /^https?:\/\//i.test(raw)
                                    ? raw
                                    : (raw.includes('.') ? `https://${raw}` : '');

                                  if (!normalized) {
                                    toast.message('Ingen klikbart link på dokumentet endnu');
                                    return;
                                  }
                                  window.open(normalized, '_blank', 'noopener,noreferrer');
                                }}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <Avatar className="w-5 h-5">
                                <AvatarImage src={uploadedBy?.avatar} />
                                <AvatarFallback className="text-[8px]">{uploadedBy?.name[0]}</AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-slate-400">
                                Uploadet {formatDate(document.uploadedAt)} af {uploadedBy?.name}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            
            {documents.filter(d => d.childId === currentChild.id || d.childId === undefined).length === 0 && (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Ingen dokumenter endnu</p>
                <p className="text-sm text-slate-400">Tilføj vigtige dokumenter som vaccinationskort, kontrakter mv.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
