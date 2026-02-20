import { useState } from 'react';
import { useAppStore } from '@/store';
import { generateId } from '@/lib/id';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { Plus, ClipboardList, Check, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
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
  const { currentUser, decisions, addDecision, approveDecision, rejectDecision, deleteDecision, users, children } = useAppStore();
  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<DecisionCategory>('other');
  const [childId, setChildId] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState<DecisionStatus | 'all'>('all');

  const filtered = decisions
    .filter(d => filterStatus === 'all' || d.status === filterStatus)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  function handleAdd() {
    if (!currentUser || !title.trim() || !description.trim()) return;
    addDecision({
      id: generateId('dec'),
      childId: childId || undefined,
      title: title.trim(),
      description: description.trim(),
      category,
      decidedAt: new Date().toISOString(),
      proposedBy: currentUser.id,
      approvedBy: [],
      status: 'proposed',
      validFrom: validFrom || undefined,
      validUntil: validUntil || undefined,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    });
    setAddOpen(false);
    setTitle('');
    setDescription('');
    setCategory('other');
    setChildId('');
    setValidFrom('');
    setValidUntil('');
    setNotes('');
    toast.success('Beslutning tilføjet');
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
    <div className="space-y-4 py-1">
      <div className="flex items-center justify-between">
        <h1 className="text-[1.35rem] font-bold tracking-[-0.02em] text-[#2f2f2d]">Beslutningslog</h1>
        <Button
          onClick={() => setAddOpen(true)}
          className="h-9 gap-1.5 rounded-2xl bg-[#2f2f2f] px-4 text-sm text-white hover:bg-[#1a1a1a]"
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
              'flex-1 rounded-xl py-1.5 text-[12px] font-semibold transition-all',
              filterStatus === s
                ? 'bg-[#2f2f2f] text-white'
                : 'bg-[#ecebe5] text-[#5f5d56] hover:bg-[#e0deda]'
            )}
          >
            {s === 'all' ? 'Alle' : s === 'proposed' ? 'Foreslået' : s === 'approved' ? 'Godkendt' : 'Afvist'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-[#d0cec5] bg-[#faf9f6] py-16 text-center">
          <ClipboardList className="h-10 w-10 text-[#c8c6bc]" />
          <div>
            <p className="text-sm font-semibold text-[#3f3e3a]">Ingen beslutninger endnu</p>
            <p className="mt-1 text-[12px] text-[#78766d]">Dokumentér vigtige beslutninger om børnene</p>
          </div>
          <Button
            variant="outline"
            className="mt-1 h-9 rounded-2xl border-[#d0cec5] px-4 text-sm"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Tilføj beslutning
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(decision => {
            const badge = statusBadge(decision.status);
            const BadgeIcon = badge.icon;
            const proposer = users.find(u => u.id === decision.proposedBy);
            const child = children.find(c => c.id === decision.childId);
            const canApprove = currentUser && decision.status === 'proposed' && !decision.approvedBy.includes(currentUser.id) && currentUser.id !== decision.proposedBy;

            return (
              <div
                key={decision.id}
                className="rounded-2xl border border-[#e8e7e0] bg-white px-4 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn('inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-semibold', badge.className)}>
                        <BadgeIcon className="h-3 w-3" />
                        {badge.label}
                      </span>
                      <span className="rounded-lg bg-[#ecebe5] px-2 py-0.5 text-[11px] font-medium text-[#5f5d56]">
                        {categoryOptions.find(c => c.value === decision.category)?.label}
                      </span>
                      {child && (
                        <span className="text-[11px] text-[#78766d]">{child.name}</span>
                      )}
                    </div>
                    <p className="mt-1.5 text-[14px] font-semibold text-[#2f2f2d]">{decision.title}</p>
                    <p className="mt-0.5 text-[12px] text-[#4a4945] leading-relaxed">{decision.description}</p>
                    {decision.notes && (
                      <p className="mt-1 text-[12px] text-[#78766d] italic">{decision.notes}</p>
                    )}
                    <div className="mt-2 flex items-center gap-3 text-[11px] text-[#78766d]">
                      <span>Foreslået af {proposer?.name ?? 'ukendt'}</span>
                      <span>{format(new Date(decision.createdAt), 'd. MMM yyyy', { locale: da })}</span>
                    </div>
                    {(decision.validFrom || decision.validUntil) && (
                      <div className="mt-1 text-[11px] text-[#78766d]">
                        Gyldig: {decision.validFrom ? format(new Date(decision.validFrom), 'd. MMM yyyy', { locale: da }) : '—'}
                        {decision.validUntil ? ` → ${format(new Date(decision.validUntil), 'd. MMM yyyy', { locale: da })}` : ''}
                      </div>
                    )}
                  </div>
                </div>

                {decision.status === 'proposed' && (
                  <div className="mt-3 flex gap-2 border-t border-[#f0efe8] pt-3">
                    {canApprove && (
                      <Button
                        size="sm"
                        className="flex-1 h-8 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-[12px]"
                        onClick={() => handleApprove(decision.id)}
                      >
                        <Check className="mr-1 h-3.5 w-3.5" /> Godkend
                      </Button>
                    )}
                    {currentUser?.id === decision.proposedBy && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-8 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 text-[12px]"
                        onClick={() => handleReject(decision.id)}
                      >
                        <X className="mr-1 h-3.5 w-3.5" /> Træk tilbage
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 rounded-xl px-2 text-[#c8c6bc] hover:text-rose-500"
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

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm rounded-3xl border-[#d8d7cf] bg-[#faf9f6]">
          <DialogHeader>
            <DialogTitle className="text-[1rem] tracking-[-0.01em] text-[#2f2f2d]">Ny beslutning</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="dec-title" className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#78766d]">Titel</Label>
              <Input
                id="dec-title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="f.eks. Skift af dagpleje"
                className="rounded-xl border-[#d8d7cf] bg-white"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="dec-desc" className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#78766d]">Beskrivelse</Label>
              <Textarea
                id="dec-desc"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Beskriv beslutningen og baggrunden..."
                className="min-h-[80px] resize-none rounded-xl border-[#d8d7cf] bg-white text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="dec-category" className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#78766d]">Kategori</Label>
                <Select value={category} onValueChange={v => setCategory(v as DecisionCategory)}>
                  <SelectTrigger id="dec-category" className="rounded-xl border-[#d8d7cf] bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {children.length > 0 && (
                <div className="space-y-1">
                  <Label htmlFor="dec-child" className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#78766d]">Barn</Label>
                  <Select value={childId} onValueChange={setChildId}>
                    <SelectTrigger id="dec-child" className="rounded-xl border-[#d8d7cf] bg-white">
                      <SelectValue placeholder="Ingen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Ingen</SelectItem>
                      {children.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="dec-from" className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#78766d]">Gyldig fra</Label>
                <Input
                  id="dec-from"
                  type="date"
                  value={validFrom}
                  onChange={e => setValidFrom(e.target.value)}
                  className="rounded-xl border-[#d8d7cf] bg-white"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="dec-until" className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#78766d]">Gyldig til</Label>
                <Input
                  id="dec-until"
                  type="date"
                  value={validUntil}
                  onChange={e => setValidUntil(e.target.value)}
                  className="rounded-xl border-[#d8d7cf] bg-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="dec-notes" className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#78766d]">Noter (valgfrit)</Label>
              <Textarea
                id="dec-notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Supplerende bemærkninger..."
                className="min-h-[50px] resize-none rounded-xl border-[#d8d7cf] bg-white text-sm"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1 rounded-2xl border-[#d8d7cf]" onClick={() => setAddOpen(false)}>
                Annuller
              </Button>
              <Button
                className="flex-1 rounded-2xl bg-[#2f2f2f] text-white hover:bg-[#1a1a1a]"
                onClick={handleAdd}
                disabled={!title.trim() || !description.trim()}
              >
                Gem beslutning
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
