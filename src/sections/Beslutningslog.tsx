import { useState, useRef } from 'react';
import { useAppStore } from '@/store';
import { useApiActions } from '@/hooks/useApiActions';
import { OverblikSidePanel } from '@/components/custom/OverblikSidePanel';
import { SavingOverlay } from '@/components/custom/SavingOverlay';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { Plus, ClipboardList, Check, X, Clock, FileText, Paperclip, Send, Upload, Loader2, Info, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { SelectSheet } from '@/components/custom/SelectSheet';
import { cn } from '@/lib/utils';
import { ConfirmCloseDialog } from '@/components/custom/ConfirmCloseDialog';
import type { DecisionLog } from '@/types';

type DecisionStatus = DecisionLog['status'];
type DecisionCategory = DecisionLog['category'];

const categoryOptions: { value: DecisionCategory; label: string }[] = [
  { value: 'school', label: 'Skole' },
  { value: 'health', label: 'Helbred' },
  { value: 'activity', label: 'Aktivitet' },
  { value: 'travel', label: 'Rejse' },
  { value: 'finance', label: 'Økonomi' },
  { value: 'other', label: 'Andet' },
];

function statusBadge(status: DecisionStatus) {
  if (status === 'approved') return { label: 'Godkendt', className: 'bg-emerald-100 text-emerald-700', icon: Check };
  if (status === 'rejected') return { label: 'Afvist', className: 'bg-rose-100 text-rose-700', icon: X };
  return { label: 'Foreslået', className: 'bg-amber-100 text-amber-700', icon: Clock };
}

export function Beslutningslog() {
  const { currentUser, decisions, approveDecision, rejectDecision, users, children, documents } = useAppStore();
  const { createDecision, deleteDecision, createDocument } = useApiActions();
  const [addOpen, setAddOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<DecisionCategory>('other');
  const [childId, setChildId] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<DecisionStatus | 'all'>('all');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Filen er for stor (maks 10 MB)');
      return;
    }
    setIsUploading(true);
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      const doc = await createDocument({
        title: file.name.replace(/\.[^.]+$/, ''),
        type: 'other',
        url: dataUrl,
        sharedWith: users.map(u => u.id),
        isOfficial: false,
      });
      if (doc) {
        setSelectedDocIds(prev => [...prev, doc.id]);
        toast.success('Dokument uploadet');
      }
    } catch {
      toast.error('Kunne ikke uploade dokument');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Co-parent detektion
  const otherParent = users.find(u => u.role === 'parent' && u.id !== currentUser?.id);
  const hasCoParentOnApp = !!otherParent && otherParent.id !== '__parent2__';

  const filtered = decisions
    .filter(d => filterStatus === 'all' || d.status === filterStatus)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  async function handleAdd() {
    if (!currentUser || !title.trim() || !description.trim()) return;
    setIsSaving(true);
    try {
      await createDecision({
        childId: childId && childId !== 'none' ? childId : undefined,
        title: title.trim(),
        description: description.trim(),
        category,
        decidedAt: new Date().toISOString(),
        approvedBy: [],
        status: 'proposed',
        validFrom: validFrom || undefined,
        validUntil: validUntil || undefined,
        notes: notes.trim() || undefined,
        documentIds: selectedDocIds.length > 0 ? selectedDocIds : undefined,
      });
      toast.success('Beslutning tilføjet');
      setAddOpen(false);
      setTitle('');
      setDescription('');
      setCategory('other');
      setChildId('');
      setValidFrom('');
      setValidUntil('');
      setNotes('');
      setSelectedDocIds([]);
    } catch {
      toast.error('Kunne ikke tilføje beslutning');
    } finally {
      setIsSaving(false);
    }
  }

  function handleApprove(id: string) {
    if (!currentUser) return;
    approveDecision(id, currentUser.id);
    toast.success('Beslutning godkendt');
  }

  function handleReject(id: string) {
    rejectDecision(id);
    toast.success('Beslutning afvist');
  }

  return (
    <div className="space-y-1.5 py-1">
      <OverblikSidePanel />
      <div className="flex items-center justify-between">
        <h1 className="text-[1.35rem] font-bold tracking-[-0.02em] text-foreground">Beslutningslog</h1>
        <Button
          onClick={() => setAddOpen(true)}
          className="h-9 gap-1.5 rounded-[8px] bg-primary px-4 text-sm text-white hover:bg-primary"
        >
          <Plus className="h-4 w-4" />
          Ny beslutning
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(['all', 'proposed', 'approved', 'rejected'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={cn(
              'flex-1 rounded-[8px] py-1.5 text-[12px] font-semibold transition-all',
              filterStatus === s
                ? 'bg-primary text-white'
                : 'bg-secondary text-muted-foreground hover:bg-muted'
            )}
          >
            {s === 'all' ? 'Alle' : s === 'proposed' ? 'Foreslået' : s === 'approved' ? 'Godkendt' : 'Afvist'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border bg-card py-16 text-center">
          <ClipboardList className="h-10 w-10 text-muted-foreground" />
          <div>
            <p className="text-sm font-semibold text-foreground">Ingen beslutninger endnu</p>
            <p className="mt-1 text-[12px] text-muted-foreground">Dokumentér vigtige beslutninger om børnene</p>
          </div>
          <Button
            variant="outline"
            className="mt-1 h-9 rounded-[8px] border-border px-4 text-sm"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Tilføj beslutning
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {!hasCoParentOnApp && (
            <div className="rounded-[8px] bg-amber-50 border border-amber-200 p-3 flex items-center gap-2">
              <Info className="h-4 w-4 text-amber-600 shrink-0" />
              <p className="text-[13px] text-amber-800">
                Modparten er ikke tilknyttet appen — beslutninger gemmes kun lokalt.
              </p>
            </div>
          )}
          {filtered.map(decision => {
            const badge = statusBadge(decision.status);
            const BadgeIcon = badge.icon;
            const proposer = users.find(u => u.id === decision.proposedBy);
            const child = children.find(c => c.id === decision.childId);
            const canApprove = currentUser && decision.status === 'proposed' && !decision.approvedBy.includes(currentUser.id) && currentUser.id !== decision.proposedBy;
            const isMyProposal = currentUser?.id === decision.proposedBy;

            return (
              <div
                key={decision.id}
                className={cn(
                  "rounded-[8px] border border-border bg-card px-4 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border-l-[3px]",
                  isMyProposal ? "border-l-[#2f2f2f]" : "border-l-[#f58a2d]"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn('inline-flex items-center gap-1 rounded-[8px] px-2 py-0.5 text-[11px] font-semibold', badge.className)}>
                        <BadgeIcon className="h-3 w-3" />
                        {badge.label}
                      </span>
                      <span className="rounded-[8px] bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {categoryOptions.find(c => c.value === decision.category)?.label}
                      </span>
                      {child && (
                        <span className="text-[11px] text-muted-foreground">{child.name}</span>
                      )}
                    </div>
                    <p className="mt-1.5 text-[14px] font-semibold text-foreground">{decision.title}</p>
                    <p className="mt-0.5 text-[12px] text-foreground leading-relaxed">{decision.description}</p>
                    {decision.notes && (
                      <p className="mt-1 text-[12px] text-muted-foreground italic">{decision.notes}</p>
                    )}
                    <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className={cn("font-semibold", isMyProposal ? "text-foreground" : "text-[#f58a2d]")}>
                        {isMyProposal ? 'Dit forslag' : `${proposer?.name ?? 'Ukendt'}s forslag`}
                      </span>
                      <span>{format(new Date(decision.createdAt), 'd. MMM yyyy', { locale: da })}</span>
                      {hasCoParentOnApp && decision.status === 'proposed' && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#4caf50]">
                          <Send className="h-3 w-3" />
                          Sendt til {otherParent?.name}
                        </span>
                      )}
                      {!hasCoParentOnApp && decision.status === 'proposed' && (
                        <span className="text-[11px] text-muted-foreground italic">
                          Co-parent ikke tilknyttet
                        </span>
                      )}
                    </div>
                    {(decision.validFrom || decision.validUntil) && (
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        Gyldig: {decision.validFrom ? format(new Date(decision.validFrom), 'd. MMM yyyy', { locale: da }) : '—'}
                        {decision.validUntil ? ` → ${format(new Date(decision.validUntil), 'd. MMM yyyy', { locale: da })}` : ''}
                      </div>
                    )}
                    {decision.documentIds && decision.documentIds.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {decision.documentIds.map(docId => {
                          const doc = documents.find(d => d.id === docId);
                          if (!doc) return null;
                          return (
                            <span key={docId} className="inline-flex items-center gap-1 rounded-md bg-background px-2 py-0.5 text-[11px] text-muted-foreground">
                              <Paperclip className="h-3 w-3" />
                              {doc.title}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {decision.status === 'proposed' && (
                  <div className="mt-3 flex gap-2 border-t border-[#f0efe8] pt-3">
                    {canApprove && (
                      <>
                        <Button
                          size="sm"
                          className="flex-1 h-8 rounded-[8px] bg-emerald-600 text-white hover:bg-emerald-700 text-[12px]"
                          onClick={() => handleApprove(decision.id)}
                        >
                          <Check className="mr-1 h-3.5 w-3.5" /> Godkend
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-8 rounded-[8px] border-rose-200 text-rose-600 hover:bg-rose-50 text-[12px]"
                          onClick={() => handleReject(decision.id)}
                        >
                          <X className="mr-1 h-3.5 w-3.5" /> Afvis
                        </Button>
                      </>
                    )}
                    {isMyProposal && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-8 rounded-[8px] border-rose-200 text-rose-600 hover:bg-rose-50 text-[12px]"
                        onClick={() => handleReject(decision.id)}
                      >
                        <X className="mr-1 h-3.5 w-3.5" /> Træk tilbage
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 rounded-[8px] px-2 text-muted-foreground hover:text-rose-500"
                      onClick={() => { deleteDecision(decision.id); toast.success('Beslutning slettet'); }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmCloseDialog
        open={confirmClose}
        onCancel={() => setConfirmClose(false)}
        onConfirm={() => { setConfirmClose(false); setAddOpen(false); setTitle(''); setDescription(''); setCategory('other'); setChildId(''); setValidFrom(''); setValidUntil(''); setNotes(''); setSelectedDocIds([]); }}
      />

      {/* Ny beslutning — fullscreen page */}
      {addOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-background"
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
          {/* Header: < | Ny beslutning | Gem */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <button
              onClick={() => {
                if (title.trim() || description.trim() || notes.trim()) {
                  setConfirmClose(true);
                } else {
                  setAddOpen(false);
                }
              }}
              className="w-9 flex items-center justify-center text-foreground"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-[17px] font-semibold text-foreground">Ny beslutning</h2>
            <button
              onClick={handleAdd}
              disabled={!title.trim() || !description.trim() || isSaving}
              className="text-[15px] font-semibold text-foreground disabled:opacity-30"
            >
              Gem
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-4 py-6 mx-auto w-full max-w-[430px]">

            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="dec-title" className="text-[12px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">Titel</Label>
                <Input
                  id="dec-title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="f.eks. Skift af dagpleje"
                  className="rounded-[8px] border-border bg-card"
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="dec-desc" className="text-[12px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">Beskrivelse</Label>
                <Textarea
                  id="dec-desc"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Beskriv beslutningen og baggrunden..."
                  className="min-h-[80px] resize-none rounded-[8px] border-border bg-card text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="dec-category" className="text-[12px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">Kategori</Label>
                  <SelectSheet
                    value={category}
                    onValueChange={v => setCategory(v as DecisionCategory)}
                    title="Kategori"
                    options={categoryOptions.map(c => ({ value: c.value, label: c.label }))}
                    className="rounded-[8px] border-border bg-card"
                  />
                </div>
                {children.length > 0 && (
                  <div className="space-y-1">
                    <Label htmlFor="dec-child" className="text-[12px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">Barn</Label>
                    <SelectSheet
                      value={childId}
                      onValueChange={setChildId}
                      title="Barn"
                      placeholder="Ingen"
                      options={[{ value: 'none', label: 'Ingen' }, ...children.map(c => ({ value: c.id, label: c.name }))]}
                      className="rounded-[8px] border-border bg-card"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 overflow-hidden">
                <div className="space-y-1 min-w-0 overflow-hidden">
                  <Label htmlFor="dec-from" className="text-[12px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">Gyldig fra</Label>
                  <Input
                    id="dec-from"
                    type="date"
                    value={validFrom}
                    onChange={e => setValidFrom(e.target.value)}
                    className="rounded-[8px] border-border bg-card"
                  />
                </div>
                <div className="space-y-1 min-w-0 overflow-hidden">
                  <Label htmlFor="dec-until" className="text-[12px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">Gyldig til</Label>
                  <Input
                    id="dec-until"
                    type="date"
                    value={validUntil}
                    onChange={e => setValidUntil(e.target.value)}
                    className="rounded-[8px] border-border bg-card"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="dec-notes" className="text-[12px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">Noter (valgfrit)</Label>
                <Textarea
                  id="dec-notes"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Supplerende bemærkninger..."
                  className="min-h-[50px] resize-none rounded-[8px] border-border bg-card text-sm"
                />
              </div>

              {/* Vedhæft dokumenter */}
              <div className="space-y-1.5">
                <Label className="text-[12px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">Vedhæft dokumenter</Label>
                {documents.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {documents.map(doc => {
                      const isSelected = selectedDocIds.includes(doc.id);
                      return (
                        <button
                          key={doc.id}
                          type="button"
                          onClick={() => setSelectedDocIds(prev =>
                            isSelected ? prev.filter(id => id !== doc.id) : [...prev, doc.id]
                          )}
                          className={cn(
                            "flex items-center gap-1.5 rounded-[8px] px-2.5 py-1.5 text-[12px] font-medium transition-all",
                            isSelected
                              ? "bg-orange-tint border border-orange-tint text-[#f58a2d]"
                              : "bg-background border border-transparent text-muted-foreground hover:bg-muted"
                          )}
                        >
                          <FileText className="h-3 w-3" />
                          {doc.title}
                        </button>
                      );
                    })}
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.heic"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-[8px] border border-dashed border-border bg-card px-3 py-2 text-[12px] font-medium text-muted-foreground hover:bg-background transition-all disabled:opacity-50"
                >
                  {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  {isUploading ? 'Uploader...' : 'Upload dokument'}
                </button>
              </div>

              {/* Co-parent status */}
              {hasCoParentOnApp ? (
                <p className="flex items-center gap-1.5 text-[12px] text-[#4caf50]">
                  <Send className="h-3.5 w-3.5" />
                  Beslutningen sendes automatisk til {otherParent?.name}
                </p>
              ) : (
                <p className="text-[12px] text-muted-foreground italic">
                  Co-parent ikke tilknyttet — beslutningen gemmes kun lokalt
                </p>
              )}
            </div>
          </div>

          <SavingOverlay open={isSaving} />
        </div>
      )}

      <SavingOverlay open={isSaving} />
    </div>
  );
}
