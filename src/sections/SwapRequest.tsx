import { useState } from 'react';
import { useAppStore } from '@/store';
import { useApiActions } from '@/hooks/useApiActions';
import { notificationId } from '@/lib/id';
import { cn, getEffectiveColor } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, X } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { toast } from 'sonner';

export function SwapRequest() {
  const {
    swapRequestDate,
    setSwapRequestDate,
    setActiveTab,
    currentUser,
    users,
    children,
    addNotification,
  } = useAppStore();

  const { createEvent } = useApiActions();

  const currentChild = children[0];
  const otherParents = users.filter(
    (user) => user.role === 'parent' && user.id !== currentUser?.id
  );

  const [selectedRecipient, setSelectedRecipient] = useState(otherParents[0]?.id || '');
  const [reason, setReason] = useState('');

  const handleBack = () => {
    setSwapRequestDate(null);
    setActiveTab('samversplan');
  };

  const handleSubmit = () => {
    if (!swapRequestDate || !currentUser || !currentChild) {
      toast.error('Vælg en dag først');
      return;
    }
    if (!selectedRecipient) {
      toast.error('Vælg hvem du vil sende anmodningen til');
      return;
    }

    const recipient = users.find((user) => user.id === selectedRecipient);
    const startAt = new Date(swapRequestDate);
    startAt.setHours(12, 0, 0, 0);
    const endAt = new Date(swapRequestDate);
    endAt.setHours(12, 30, 0, 0);

    createEvent({
      title: `Bytteanmodning · ${format(swapRequestDate, 'EEE d. MMM', { locale: da })}`,
      description: `${currentUser.name} ønsker at bytte samvær.\nBegrundelse: ${reason.trim() || 'Ikke angivet'}`,
      type: 'handover',
      startDate: startAt.toISOString(),
      endDate: endAt.toISOString(),
      childId: currentChild.id,
      createdBy: currentUser.id,
      assignedTo: [currentUser.id, selectedRecipient],
    });

    addNotification({
      id: notificationId(),
      type: 'schedule_change',
      title: 'Ny bytteanmodning',
      message: `${currentUser.name} vil bytte ${format(swapRequestDate, 'EEEE d. MMMM', { locale: da })}`,
      recipientId: selectedRecipient,
      read: false,
      createdAt: new Date().toISOString(),
    });

    toast.success(`Bytteanmodning sendt til ${recipient?.name || 'forælder'}`);
    setSwapRequestDate(null);
    setActiveTab('samversplan');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header: ← centreret titel X */}
      <div className="sticky top-0 z-30 flex items-center border-b border-border bg-background/95 px-4 py-3 backdrop-blur-sm"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
      >
        <button
          onClick={handleBack}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="flex-1 text-center text-[17px] font-bold text-foreground">Anmod om bytte</h1>
        <button
          onClick={handleBack}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary transition-colors"
        >
          <X className="h-4.5 w-4.5" />
        </button>
      </div>

      <div className="mx-auto max-w-[430px] space-y-5 px-4 py-5">
        {/* Selected date */}
        {swapRequestDate && (
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Valgt dag</p>
            <p className="mt-1 text-lg font-bold text-foreground">
              {format(swapRequestDate, 'EEEE d. MMMM yyyy', { locale: da })}
            </p>
          </div>
        )}

        {/* Recipient picker */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Send til</p>
          <div className="flex flex-col gap-2">
            {otherParents.map((user) => {
              const isSelected = selectedRecipient === user.id;
              const color = getEffectiveColor(user, currentUser?.id);
              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => setSelectedRecipient(user.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-3 transition-colors",
                    isSelected
                      ? "border-orange-tint bg-orange-tint"
                      : "border-border bg-card hover:bg-background"
                  )}
                >
                  <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback
                      className="text-sm font-semibold"
                      style={{
                        backgroundColor: color + '25',
                        color: color,
                      }}
                    >
                      {user.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-[14px] font-semibold text-foreground">{user.name}</span>
                  {isSelected && (
                    <span className="ml-auto text-xs font-semibold text-[#f58a2d]">Valgt</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Reason */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Begrundelse</p>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Fx arbejde torsdag eftermiddag, ønsker bytte med fredag."
            rows={4}
            className="rounded-xl border-border bg-card"
          />
        </div>

        {/* Submit button */}
        <Button
          className="w-full rounded-xl py-6 text-[15px] font-semibold"
          onClick={handleSubmit}
        >
          Send bytteanmodning
        </Button>
      </div>
    </div>
  );
}
