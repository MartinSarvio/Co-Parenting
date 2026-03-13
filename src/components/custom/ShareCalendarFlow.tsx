import { useState } from 'react';
import { getEffectiveColor } from '@/lib/utils';
import { useAppStore } from '@/store';
import { usePermissions } from '@/hooks/usePermissions';
import { getDefaultSharingLevel } from '@/lib/permissions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { SelectSheet } from '@/components/custom/SelectSheet';
import { ChevronLeft, Share2, Calendar, Check } from 'lucide-react';
import type { SharePermissionLevel } from '@/types';

interface ShareCalendarFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PERMISSION_LABELS: Record<SharePermissionLevel, string> = {
  none: 'Ingen adgang',
  busy_only: 'Kun optaget',
  titles_only: 'Kun titler',
  full: 'Fuld adgang',
};

export function ShareCalendarFlow({ open, onOpenChange }: ShareCalendarFlowProps) {
  const {
    currentUser,
    users,
    household,
    requestCalendarSharing,
    calendarSharing,
    addShareGrant,
    addSharePermission,
  } = useAppStore();
  usePermissions();
  const calendarSources = household?.calendarSources || [];

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [calendarPermissions, setCalendarPermissions] = useState<Record<string, SharePermissionLevel>>({});

  const otherParents = users.filter(
    (u) => u.role === 'parent' && u.id !== currentUser?.id
  );

  const isSharingAccepted = calendarSharing?.status === 'accepted';

  const defaultLevel = household?.familyMode
    ? getDefaultSharingLevel(household.familyMode)
    : 'none';

  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
    // Initialize permissions with defaults
    const defaults: Record<string, SharePermissionLevel> = {
      main: defaultLevel,
    };
    calendarSources.forEach((source) => {
      defaults[source.id] = defaultLevel;
    });
    setCalendarPermissions(defaults);
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSave = () => {
    if (!selectedUserId || !currentUser) return;

    // Create the share grant
    const grantId = `grant-${Date.now()}`;
    addShareGrant({
      id: grantId,
      grantorId: currentUser.id,
      granteeId: selectedUserId,
      householdId: household?.id || '',
      createdAt: new Date().toISOString(),
      status: 'active',
    });

    // Create permissions for each calendar
    Object.entries(calendarPermissions).forEach(([calendarSourceId, level]) => {
      addSharePermission({
        id: `perm-${Date.now()}-${calendarSourceId}`,
        shareGrantId: grantId,
        calendarSourceId: calendarSourceId === 'main' ? null : calendarSourceId,
        level,
      });
    });

    // Also trigger legacy sharing request for backwards compatibility
    if (!isSharingAccepted) {
      requestCalendarSharing(currentUser.id);
    }

    onOpenChange(false);
    setStep(1);
    setSelectedUserId(null);
  };

  const handleClose = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      setStep(1);
      setSelectedUserId(null);
    }
  };

  const selectedUser = users.find((u) => u.id === selectedUserId);

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" hideClose className="flex max-h-[85vh] flex-col rounded-t-[28px] border-border bg-background shadow-[0_-18px_40px_rgba(0,0,0,0.2)]">
        <div aria-hidden="true" className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted shrink-0" />
        <SheetHeader className="px-4 pb-2 shrink-0">
          <div className="flex items-center gap-3">
            {step === 2 && (
              <button
                onClick={handleBack}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            <SheetTitle className="flex-1 text-center text-[1.05rem] text-foreground">
              {step === 1 ? 'Del kalender' : 'Vælg kalendere'}
            </SheetTitle>
            {step === 2 && <div className="w-8" />}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom,0px)+24px)]">
          {step === 1 ? (
            /* ── Step 1: Choose recipient ── */
            <div className="space-y-3 py-2">
              <p className="text-[13px] text-muted-foreground">
                Vælg hvem du vil dele din kalender med.
              </p>
              {otherParents.map((user) => {
                const color = getEffectiveColor(user, currentUser?.id);
                return (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user.id)}
                    className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-card"
                  >
                    <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback
                        className="text-sm font-semibold"
                        style={{ backgroundColor: color + '25', color }}
                      >
                        {user.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="text-[14px] font-semibold text-foreground">{user.name}</p>
                      {user.email && (
                        <p className="text-[11px] text-muted-foreground">{user.email}</p>
                      )}
                    </div>
                    <Share2 className="h-4 w-4 text-muted-foreground" />
                  </button>
                );
              })}
              {otherParents.length === 0 && (
                <div className="py-6 text-center">
                  <p className="text-sm text-muted-foreground">Ingen co-parents at dele med.</p>
                </div>
              )}
            </div>
          ) : (
            /* ── Step 2: Choose calendars + permission levels ── */
            <div className="space-y-4 py-2">
              {selectedUser && (
                <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={selectedUser.avatar} />
                    <AvatarFallback className="text-xs">
                      {selectedUser.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-[13px] font-semibold text-foreground">
                    Deler med {selectedUser.name}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Kalendere</p>

                {/* Main calendar */}
                <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-foreground">Hovedkalender</p>
                  </div>
                  <SelectSheet
                    value={calendarPermissions.main || defaultLevel}
                    onValueChange={(v) => setCalendarPermissions((prev) => ({ ...prev, main: v as SharePermissionLevel }))}
                    title="Adgangsniveau"
                    options={Object.entries(PERMISSION_LABELS).map(([value, label]) => ({ value, label }))}
                    className="h-8 w-[120px] rounded-lg border-border text-[11px]"
                    size="sm"
                  />
                </div>

                {/* External calendar sources */}
                {calendarSources.map((source) => (
                  <div key={source.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-foreground truncate">{source.name}</p>
                      <p className="text-[10px] text-muted-foreground">{source.type}</p>
                    </div>
                    <SelectSheet
                      value={calendarPermissions[source.id] || defaultLevel}
                      onValueChange={(v) => setCalendarPermissions((prev) => ({ ...prev, [source.id]: v as SharePermissionLevel }))}
                      title="Adgangsniveau"
                      options={Object.entries(PERMISSION_LABELS).map(([value, label]) => ({ value, label }))}
                      className="h-8 w-[120px] rounded-lg border-border text-[11px]"
                      size="sm"
                    />
                  </div>
                ))}
              </div>

              <Button
                className="w-full rounded-xl py-5 text-[14px] font-semibold"
                onClick={handleSave}
              >
                <Check className="h-4 w-4 mr-2" />
                Gem delingsindstillinger
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
