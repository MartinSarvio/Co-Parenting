import { useState } from 'react';
import { useAppStore } from '@/store';
import { generateId } from '@/lib/id';
import { format, differenceInDays, parseISO } from 'date-fns';
import { da } from 'date-fns/locale';
import { Plus, CalendarHeart, Trash2, Bell } from 'lucide-react';
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
import type { KeyDate } from '@/types';

type DateType = KeyDate['type'];
type Recurrence = KeyDate['recurrence'];

const typeOptions: { value: DateType; label: string; color: string }[] = [
  { value: 'birthday', label: 'Fødselsdag', color: 'bg-pink-100 text-pink-700' },
  { value: 'vaccination', label: 'Vaccination', color: 'bg-blue-100 text-blue-700' },
  { value: 'school', label: 'Skole', color: 'bg-amber-100 text-amber-700' },
  { value: 'appointment', label: 'Aftale', color: 'bg-purple-100 text-purple-700' },
  { value: 'anniversary', label: 'Mærkedag', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'other', label: 'Andet', color: 'bg-[#ecebe5] text-[#5f5d56]' },
];

function typeInfo(type: DateType) {
  return typeOptions.find(t => t.value === type) ?? typeOptions[typeOptions.length - 1];
}

function daysUntil(dateStr: string, recurrence: Recurrence): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = parseISO(dateStr);

  if (recurrence === 'yearly') {
    let next = new Date(today.getFullYear(), date.getMonth(), date.getDate());
    if (next < today) next = new Date(today.getFullYear() + 1, date.getMonth(), date.getDate());
    return differenceInDays(next, today);
  }
  return differenceInDays(date, today);
}

function nextOccurrence(dateStr: string, recurrence: Recurrence): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = parseISO(dateStr);

  if (recurrence === 'yearly') {
    let next = new Date(today.getFullYear(), date.getMonth(), date.getDate());
    if (next < today) next = new Date(today.getFullYear() + 1, date.getMonth(), date.getDate());
    return next;
  }
  return date;
}

export function VigtigeDatoer() {
  const { currentUser, keyDates, addKeyDate, deleteKeyDate, children } = useAppStore();
  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState<DateType>('birthday');
  const [recurrence, setRecurrence] = useState<Recurrence>('yearly');
  const [reminderDays, setReminderDays] = useState('3');
  const [notes, setNotes] = useState('');
  const [childId, setChildId] = useState<string>('');

  // Sort by upcoming
  const sortedDates = [...keyDates]
    .filter(kd => {
      if (kd.recurrence === 'once' && daysUntil(kd.date, 'once') < 0) return false;
      return true;
    })
    .sort((a, b) => daysUntil(a.date, a.recurrence) - daysUntil(b.date, b.recurrence));

  function handleAdd() {
    if (!currentUser || !title.trim() || !date) return;
    addKeyDate({
      id: generateId('kd'),
      childId: childId && childId !== 'none' ? childId : undefined,
      title: title.trim(),
      date,
      type,
      recurrence,
      reminderDaysBefore: parseInt(reminderDays) || 3,
      notes: notes.trim() || undefined,
      addedBy: currentUser.id,
      createdAt: new Date().toISOString(),
    });
    setAddOpen(false);
    setTitle('');
    setDate('');
    setType('birthday');
    setRecurrence('yearly');
    setReminderDays('3');
    setNotes('');
    setChildId('');
    toast.success('Vigtig dato tilføjet');
  }

  return (
    <div className="space-y-4 py-1">
      <div className="flex items-center justify-between">
        <h1 className="text-[1.35rem] font-bold tracking-[-0.02em] text-[#2f2f2d]">Vigtige datoer</h1>
        <Button
          onClick={() => setAddOpen(true)}
          className="h-9 gap-1.5 rounded-2xl bg-[#2f2f2f] px-4 text-sm text-white hover:bg-[#1a1a1a]"
        >
          <Plus className="h-4 w-4" />
          Tilføj
        </Button>
      </div>

      {sortedDates.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-[#d0cec5] bg-[#faf9f6] py-16 text-center">
          <CalendarHeart className="h-10 w-10 text-[#c8c6bc]" />
          <div>
            <p className="text-sm font-semibold text-[#3f3e3a]">Ingen vigtige datoer endnu</p>
            <p className="mt-1 text-[12px] text-[#78766d]">Tilføj fødselsdage, vaccinationer og mærkedage</p>
          </div>
          <Button
            variant="outline"
            className="mt-1 h-9 rounded-2xl border-[#d0cec5] px-4 text-sm"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Opret dato
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedDates.map(kd => {
            const info = typeInfo(kd.type);
            const days = daysUntil(kd.date, kd.recurrence);
            const next = nextOccurrence(kd.date, kd.recurrence);
            const child = children.find(c => c.id === kd.childId);
            const isToday = days === 0;
            const isSoon = days <= kd.reminderDaysBefore && days >= 0;

            return (
              <div
                key={kd.id}
                className={cn(
                  'flex items-center gap-3 rounded-2xl border px-4 py-3.5',
                  isToday
                    ? 'border-[#f5bf8f] bg-[#fff8f0]'
                    : 'border-[#e8e7e0] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn('rounded-lg px-2 py-0.5 text-[11px] font-semibold', info.color)}>{info.label}</span>
                    {isSoon && !isToday && (
                      <Bell className="h-3.5 w-3.5 text-[#f58a2d]" />
                    )}
                  </div>
                  <p className="mt-1 text-[14px] font-semibold text-[#2f2f2d]">{kd.title}</p>
                  {child && (
                    <p className="text-[11px] text-[#78766d]">{child.name}</p>
                  )}
                  {kd.notes && (
                    <p className="mt-0.5 text-[12px] text-[#78766d]">{kd.notes}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="text-right">
                    <p className="text-[12px] font-medium text-[#4a4945]">
                      {format(next, 'd. MMM', { locale: da })}
                    </p>
                    <p className={cn('text-[11px] font-semibold', isToday ? 'text-[#f58a2d]' : 'text-[#78766d]')}>
                      {isToday ? 'I dag!' : days === 1 ? 'I morgen' : `Om ${days} dage`}
                    </p>
                  </div>
                  <button
                    onClick={() => { deleteKeyDate(kd.id); toast.success('Dato slettet'); }}
                    className="rounded-full p-1 text-[#c8c6bc] hover:text-rose-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm rounded-3xl border-[#d8d7cf] bg-[#faf9f6]">
          <DialogHeader>
            <DialogTitle className="text-[1rem] tracking-[-0.01em] text-[#2f2f2d]">Tilføj vigtig dato</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="kd-title" className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#78766d]">Titel</Label>
              <Input
                id="kd-title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="f.eks. Mias fødselsdag"
                className="rounded-xl border-[#d8d7cf] bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="kd-type" className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#78766d]">Type</Label>
                <Select value={type} onValueChange={v => setType(v as DateType)}>
                  <SelectTrigger id="kd-type" className="rounded-xl border-[#d8d7cf] bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="kd-recurrence" className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#78766d]">Gentagelse</Label>
                <Select value={recurrence} onValueChange={v => setRecurrence(v as Recurrence)}>
                  <SelectTrigger id="kd-recurrence" className="rounded-xl border-[#d8d7cf] bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yearly">Hvert år</SelectItem>
                    <SelectItem value="once">Én gang</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="kd-date" className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#78766d]">Dato</Label>
              <Input
                id="kd-date"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="rounded-xl border-[#d8d7cf] bg-white"
              />
            </div>

            {children.length > 0 && (
              <div className="space-y-1">
                <Label htmlFor="kd-child" className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#78766d]">Tilknyt barn (valgfrit)</Label>
                <Select value={childId} onValueChange={setChildId}>
                  <SelectTrigger id="kd-child" className="rounded-xl border-[#d8d7cf] bg-white">
                    <SelectValue placeholder="Ingen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ingen</SelectItem>
                    {children.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="kd-reminder" className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#78766d]">Påmind X dage før</Label>
              <Input
                id="kd-reminder"
                type="number"
                min={0}
                max={30}
                value={reminderDays}
                onChange={e => setReminderDays(e.target.value)}
                className="rounded-xl border-[#d8d7cf] bg-white"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="kd-notes" className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#78766d]">Noter (valgfrit)</Label>
              <Textarea
                id="kd-notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="f.eks. Husk at bestille kage"
                className="min-h-[60px] resize-none rounded-xl border-[#d8d7cf] bg-white text-sm"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1 rounded-2xl border-[#d8d7cf]" onClick={() => setAddOpen(false)}>
                Annuller
              </Button>
              <Button
                className="flex-1 rounded-2xl bg-[#2f2f2f] text-white hover:bg-[#1a1a1a]"
                onClick={handleAdd}
                disabled={!title.trim() || !date}
              >
                Gem dato
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
