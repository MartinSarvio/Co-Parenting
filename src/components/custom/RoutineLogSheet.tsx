import { useState, useEffect } from 'react';
import { useAppStore } from '@/store';
import { routineLogId } from '@/lib/id';
import { BottomSheet } from '@/components/custom/BottomSheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { RoutineItem, RoutineLog } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: RoutineItem | null;
  log?: RoutineLog;
  dateStr: string;
}

export function RoutineLogSheet({ open, onOpenChange, item, log, dateStr }: Props) {
  const { currentUser, addRoutineLog, updateRoutineLog } = useAppStore();
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (open) {
      setTime(log?.time ?? format(new Date(), 'HH:mm'));
      setNote(log?.note ?? '');
    }
  }, [open, log]);

  if (!item) return null;

  function handleSave() {
    if (!currentUser || !item) return;
    if (log) {
      updateRoutineLog(log.id, {
        time: time || undefined,
        note: note.trim() || undefined,
        completed: true,
        completedAt: log.completedAt || new Date().toISOString(),
        completedBy: log.completedBy || currentUser.id,
      });
    } else {
      addRoutineLog({
        id: routineLogId(),
        routineItemId: item.id,
        childId: item.childId,
        date: dateStr,
        completed: true,
        completedAt: new Date().toISOString(),
        completedBy: currentUser.id,
        time: time || format(new Date(), 'HH:mm'),
        note: note.trim() || undefined,
      });
    }
    onOpenChange(false);
    toast.success('Gemt');
  }

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={`${item.emoji} ${item.label}`}>
      <div className="space-y-3">
        <div className="space-y-1">
          <Label className="text-[12px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">Tidspunkt</Label>
          <Input
            type="time"
            value={time}
            onChange={e => setTime(e.target.value)}
            className="rounded-[4px] border-border bg-card"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-[12px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">Note (valgfrit)</Label>
          <Textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="f.eks. Spiste godt, drak 200ml..."
            className="min-h-[60px] resize-none rounded-[4px] border-border bg-card text-sm"
            maxLength={500}
          />
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 rounded-[4px] border-border" onClick={() => onOpenChange(false)}>
            Annuller
          </Button>
          <Button className="flex-1 rounded-[4px] bg-primary text-white hover:bg-primary" onClick={handleSave}>
            Gem
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
