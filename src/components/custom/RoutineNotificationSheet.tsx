import { useState, useEffect } from 'react';
import { useAppStore } from '@/store';
import { BottomSheet } from '@/components/custom/BottomSheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';
import { scheduleRoutineReminders } from '@/lib/routineNotifications';
import type { RoutineNotificationConfig } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  childId: string;
  childName: string;
}

export function RoutineNotificationSheet({ open, onOpenChange, childId, childName }: Props) {
  const { routineNotificationConfigs, setRoutineNotificationConfig, children } = useAppStore();
  const existing = routineNotificationConfigs.find(c => c.childId === childId);

  const [enabled, setEnabled] = useState(false);
  const [morgenTime, setMorgenTime] = useState('07:30');
  const [dagTime, setDagTime] = useState('12:00');
  const [aftenTime, setAftenTime] = useState('18:00');

  useEffect(() => {
    if (open && existing) {
      setEnabled(existing.enabled);
      setMorgenTime(existing.morgenTime ?? '07:30');
      setDagTime(existing.dagTime ?? '12:00');
      setAftenTime(existing.aftenTime ?? '18:00');
    }
  }, [open, existing]);

  async function handleSave() {
    const config: RoutineNotificationConfig = {
      childId,
      morgenTime,
      dagTime,
      aftenTime,
      enabled,
    };
    setRoutineNotificationConfig(config);

    // Build childNames map for all configs
    const allConfigs = [
      ...routineNotificationConfigs.filter(c => c.childId !== childId),
      config,
    ];
    const childNames: Record<string, string> = {};
    for (const c of children) childNames[c.id] = c.name;
    await scheduleRoutineReminders(allConfigs, childNames);

    onOpenChange(false);
    toast.success(enabled ? 'Påmindelser aktiveret' : 'Påmindelser deaktiveret');
  }

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Rutine-påmindelser">
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-[4px] border border-border bg-card px-4 py-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="text-[13px] font-medium text-foreground">Påmindelser for {childName}</span>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        {enabled && (
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-[12px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                ☀️ Morgenrutine
              </Label>
              <Input
                type="time"
                value={morgenTime}
                onChange={e => setMorgenTime(e.target.value)}
                className="rounded-[4px] border-border bg-card"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[12px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                🌤️ Dagsrutine
              </Label>
              <Input
                type="time"
                value={dagTime}
                onChange={e => setDagTime(e.target.value)}
                className="rounded-[4px] border-border bg-card"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[12px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                🌙 Aftenrutine
              </Label>
              <Input
                type="time"
                value={aftenTime}
                onChange={e => setAftenTime(e.target.value)}
                className="rounded-[4px] border-border bg-card"
              />
            </div>
          </div>
        )}

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
