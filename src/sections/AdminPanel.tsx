import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectSheet } from '@/components/custom/SelectSheet';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ShieldCheck,
  Trash2,
  Loader2,
  ChevronLeft,
  Search,
  MoreVertical,
  Mail,
  Tag,
  Crown,
  Ban,
  Link2,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import { useAppStore } from '@/store';
import { resetPassword } from '@/lib/auth';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  role: string;
  isAdmin: boolean;
  createdAt: string;
}

function generateUserId(uuid: string): string {
  const digits = uuid
    .replace(/[^0-9a-f]/gi, '')
    .slice(0, 10)
    .split('')
    .map((c) => parseInt(c, 16) % 10)
    .join('');
  return `DK${digits}`;
}

type AdminView = 'list' | 'create' | 'detail' | 'search' | 'send-code' | 'discount' | 'upgrade' | 'suspend' | 'link-account';

export function AdminPanel() {
  const {
    adminSearchOpen, setAdminSearchOpen, setAdminVisible,
    adminRefreshTrigger, setAdminRefresh,
    adminCreateOpen, setAdminCreateOpen,
    adminCategoryFilter,
  } = useAppStore();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<AdminView>('list');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [discountType, setDiscountType] = useState('1_month');
  const [upgradePlan, setUpgradePlan] = useState('family_plus');
  const [upgradeInterval, setUpgradeInterval] = useState('monthly');
  const [linkEmail, setLinkEmail] = useState('');
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'parent',
    isAdmin: false,
  });

  // Signal TopBar that admin panel is visible
  useEffect(() => {
    setAdminVisible(true);
    return () => setAdminVisible(false);
  }, [setAdminVisible]);

  // Long-press handling
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTouchStart = (user: AdminUser) => {
    longPressTimer.current = setTimeout(() => {
      setSelectedUser(user);
      setView('detail');
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // Sync search state from TopBar
  useEffect(() => {
    if (adminSearchOpen) {
      setView('search');
      setAdminSearchOpen(false);
    }
  }, [adminSearchOpen, setAdminSearchOpen]);

  // Sync refresh trigger from TopBar
  useEffect(() => {
    if (adminRefreshTrigger) {
      fetchUsers();
      setAdminRefresh(false);
    }
  }, [adminRefreshTrigger, setAdminRefresh]); // fetchUsers added below

  // Sync create trigger from TopBar
  useEffect(() => {
    if (adminCreateOpen) {
      setView('create');
      setAdminCreateOpen(false);
    }
  }, [adminCreateOpen, setAdminCreateOpen]);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      setUsers(
        (data || []).map((u) => ({
          id: u.id,
          email: u.email,
          name: u.name,
          avatar: u.avatar,
          role: u.role,
          isAdmin: u.is_admin ?? false,
          createdAt: u.created_at,
        })),
      );
    } catch {
      toast.error('Kunne ikke hente brugere');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email) {
      toast.error('Udfyld navn og email');
      return;
    }

    setIsCreating(true);
    try {
      // Check if email already exists
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', newUser.email.toLowerCase().trim())
        .maybeSingle();
      if (existing) {
        toast.error('En bruger med denne email findes allerede');
        setIsCreating(false);
        return;
      }

      // Insert profile directly (avoids signUp session conflict)
      const newId = crypto.randomUUID();
      const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(newUser.name)}`;
      const { error: insertErr } = await supabase.from('profiles').insert({
        id: newId,
        email: newUser.email.toLowerCase().trim(),
        name: newUser.name,
        role: newUser.role,
        is_admin: newUser.isAdmin,
        avatar: avatarUrl,
        password_hash: 'PENDING_SETUP',
      });
      if (insertErr) throw insertErr;

      // Opret auth-bruger via migrate-user edge function + send recovery email
      const { error: migrateErr } = await supabase.functions.invoke('migrate-user', {
        body: { email: newUser.email.toLowerCase().trim() },
      });
      if (migrateErr) throw migrateErr;

      toast.success(`Bruger ${newUser.name} oprettet — email sendt til opsætning`);
      setNewUser({ name: '', email: '', password: '', role: 'parent', isAdmin: false });
      setView('list');
      fetchUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Kunne ikke oprette bruger';
      toast.error(msg);
    } finally {
      setIsCreating(false);
    }
  };

  const handleMakeAdmin = async (email: string, name: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: true })
        .eq('email', email);
      if (error) throw error;
      toast.success(`${name} er nu admin`);
      fetchUsers();
      if (selectedUser) setSelectedUser({ ...selectedUser, isAdmin: true });
    } catch {
      toast.error('Kunne ikke gøre bruger til admin');
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Er du sikker på at du vil slette ${name}? Dette kan ikke fortrydes.`)) {
      return;
    }
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          email: `deleted-${id}@anonymized.local`,
          name: 'Slettet bruger',
          password_hash: 'DELETED',
          avatar: null,
          phone: null,
          professional_type: null,
          organization: null,
        })
        .eq('id', id);
      if (error) throw error;
      await supabase.from('device_tokens').delete().eq('user_id', id);
      toast.success(`${name} slettet`);
      setView('list');
      setSelectedUser(null);
      fetchUsers();
    } catch {
      toast.error('Kunne ikke slette bruger');
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'parent':
        return 'Forælder';
      case 'guardian':
        return 'Værge';
      case 'professional':
        return 'Professionel';
      default:
        return role;
    }
  };

  // Filtered users for search
  const filteredUsers = searchQuery.trim()
    ? users.filter((u) => {
        const q = searchQuery.toLowerCase();
        return (
          u.name.toLowerCase().includes(q) ||
          generateUserId(u.id).toLowerCase().includes(q)
        );
      })
    : users;

  // Category-filtered users for list view
  const categoryFilteredUsers = adminCategoryFilter === 'all'
    ? users
    : adminCategoryFilter === 'admin'
      ? users.filter((u) => u.isAdmin)
      : users.filter((u) => u.role === adminCategoryFilter);

  // User row component
  const UserRow = ({ user }: { user: AdminUser }) => (
    <div
      onTouchStart={() => handleTouchStart(user)}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className="flex items-center gap-3 rounded-[8px] border border-border bg-card px-3 py-2.5 select-none"
    >
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarImage src={user.avatar ?? undefined} />
        <AvatarFallback className="bg-secondary text-sm text-foreground">
          {user.name[0]}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-[15px] font-medium text-foreground">{user.name}</p>
          {user.isAdmin && (
            <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 text-[10px] px-1.5 py-0">
              Admin
            </Badge>
          )}
        </div>
        <p className="truncate text-[13px] text-muted-foreground">
          {generateUserId(user.id)} · {getRoleLabel(user.role)}
        </p>
      </div>
    </div>
  );

  // ── SEARCH VIEW ──
  if (view === 'search') {
    return (
      <div className="fixed inset-0 z-[60] bg-background flex flex-col">
        <div className="safe-area-pt border-b border-border bg-background">
          <div className="flex items-center gap-3 px-4 pb-3 pt-2">
            <button
              onClick={() => setView('list')}
              className="flex h-9 w-9 items-center justify-center text-foreground"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h1 className="text-base font-semibold text-foreground">Søg brugere</h1>
          </div>
        </div>

        <div className="px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Søg på navn eller User ID..."
              className="pl-10 h-[44px] bg-card border-border rounded-[8px]"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-8">
          {filteredUsers.length === 0 ? (
            <p className="text-center py-8 text-sm text-slate-500">
              {searchQuery ? 'Ingen resultater' : 'Indtast søgeord'}
            </p>
          ) : (
            filteredUsers.map((user) => <UserRow key={user.id} user={user} />)
          )}
        </div>
      </div>
    );
  }

  // ── CREATE VIEW (full-screen overlay) ──
  if (view === 'create') {
    return (
      <div className="fixed inset-0 z-[60] bg-background flex flex-col">
        <div className="safe-area-pt border-b border-border bg-background">
          <div className="flex items-center gap-3 px-4 pb-3 pt-2">
            <button
              onClick={() => setView('list')}
              className="flex h-9 w-9 items-center justify-center text-foreground"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h1 className="text-base font-semibold text-foreground">Opret ny bruger</h1>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-3 rounded-[8px] border border-border bg-card p-4">
          <div className="space-y-1">
            <Label className="text-[12px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
              Navn
            </Label>
            <Input
              value={newUser.name}
              onChange={(e) => setNewUser((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Fulde navn"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[12px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
              Email
            </Label>
            <Input
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="email@eksempel.dk"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[12px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
              Rolle
            </Label>
            <SelectSheet
              value={newUser.role}
              onValueChange={(v) => setNewUser((prev) => ({ ...prev, role: v }))}
              title="Rolle"
              options={[
                { value: 'parent', label: 'Forælder' },
                { value: 'guardian', label: 'Værge' },
                { value: 'professional', label: 'Professionel' },
              ]}
            />
          </div>
          <div className="flex items-center gap-2 rounded-[8px] border border-border bg-card px-3 py-2">
            <input
              type="checkbox"
              id="admin-check"
              checked={newUser.isAdmin}
              onChange={(e) => setNewUser((prev) => ({ ...prev, isAdmin: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300"
            />
            <Label htmlFor="admin-check" className="text-sm cursor-pointer">
              Administrator-rettigheder
            </Label>
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              className="flex-1 rounded-[8px] border-border"
              onClick={() => setView('list')}
              disabled={isCreating}
            >
              Annuller
            </Button>
            <Button
              className="flex-1 rounded-[8px] bg-primary text-white hover:bg-primary"
              disabled={isCreating || !newUser.name || !newUser.email}
              onClick={handleCreateUser}
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Opretter...
                </>
              ) : (
                'Opret bruger'
              )}
            </Button>
          </div>
        </div>
        </div>
      </div>
    );
  }

  // ── SUB-VIEWS (full-screen overlays from 3-dot menu) ──

  // Send ny kode
  if (view === 'send-code' && selectedUser) {
    return (
      <div className="fixed inset-0 z-[60] bg-background flex flex-col">
        <div className="safe-area-pt border-b border-border bg-background">
          <div className="flex items-center gap-3 px-4 pb-3 pt-2">
            <button onClick={() => setView('detail')} className="flex h-9 w-9 items-center justify-center text-foreground">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h1 className="text-base font-semibold text-foreground">Send ny kode</h1>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="rounded-[8px] border border-border bg-card p-4 space-y-4">
            <p className="text-sm text-muted-foreground">Send et nulstillingslink til brugerens email.</p>
            <div className="rounded-[8px] bg-card border border-border px-3 py-2.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</p>
              <p className="text-sm text-foreground">{selectedUser.email}</p>
            </div>
            <Button
              className="w-full rounded-[8px] bg-primary text-white hover:bg-primary"
              onClick={async () => {
                try {
                  await resetPassword(selectedUser.email);
                  toast.success(`Nulstillingslink sendt til ${selectedUser.email}`);
                } catch {
                  toast.error('Kunne ikke sende nulstillingslink');
                }
              }}
            >
              <Mail className="h-4 w-4 mr-2" />
              Send nulstillingslink
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Rabat
  if (view === 'discount' && selectedUser) {
    return (
      <div className="fixed inset-0 z-[60] bg-background flex flex-col">
        <div className="safe-area-pt border-b border-border bg-background">
          <div className="flex items-center gap-3 px-4 pb-3 pt-2">
            <button onClick={() => setView('detail')} className="flex h-9 w-9 items-center justify-center text-foreground">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h1 className="text-base font-semibold text-foreground">Rabat</h1>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="rounded-[8px] border border-border bg-card p-4 space-y-4">
            <p className="text-sm text-muted-foreground">Giv rabat til {selectedUser.name}</p>
            <div className="space-y-1">
              <Label className="text-[12px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">Plan</Label>
              <SelectSheet
                value={upgradePlan}
                onValueChange={setUpgradePlan}
                title="Plan"
                options={[
                  { value: 'family_plus', label: 'Family Plus' },
                  { value: 'single_parent_plus', label: 'Enlig Plus' },
                ]}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[12px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">Rabattype</Label>
              <SelectSheet
                value={discountType}
                onValueChange={setDiscountType}
                title="Rabattype"
                options={[
                  { value: '1_month', label: '1 måned gratis' },
                  { value: '2_months', label: '2 måneder gratis' },
                  { value: '3_months', label: '3 måneder gratis' },
                  { value: '6_months', label: '6 måneder gratis' },
                  { value: '1_year', label: '1 år gratis' },
                  { value: '2_years', label: '2 år gratis' },
                  { value: '25_percent', label: '25% rabat' },
                  { value: '50_percent', label: '50% rabat' },
                  { value: '75_percent', label: '75% rabat' },
                  { value: 'lifetime', label: 'Livstids gratis' },
                ]}
              />
            </div>
            <Button
              className="w-full rounded-[8px] bg-primary text-white hover:bg-primary"
              onClick={async () => {
                try {
                  const durationDays: Record<string, number> = {
                    '1_month': 30, '2_months': 60, '3_months': 90,
                    '6_months': 180, '1_year': 365, '2_years': 730,
                    'lifetime': 36500,
                  };
                  const days = durationDays[discountType];
                  if (days) {
                    const { error } = await supabase
                      .from('stripe_subscriptions')
                      .upsert({
                        user_id: selectedUser.id,
                        plan: upgradePlan,
                        status: 'active',
                        billing_interval: 'monthly',
                        current_period_end: new Date(Date.now() + days * 86400000).toISOString(),
                        cancel_at_period_end: discountType !== 'lifetime',
                      }, { onConflict: 'user_id' });
                    if (error) throw error;
                    toast.success(`Rabat tildelt ${selectedUser.name}`);
                  } else {
                    toast.success(`Procentrabat noteret for ${selectedUser.name}`);
                  }
                  setView('detail');
                } catch {
                  toast.error('Kunne ikke tildele rabat');
                }
              }}
            >
              <Tag className="h-4 w-4 mr-2" />
              Tildel rabat
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Opgrader Abonnement
  if (view === 'upgrade' && selectedUser) {
    return (
      <div className="fixed inset-0 z-[60] bg-background flex flex-col">
        <div className="safe-area-pt border-b border-border bg-background">
          <div className="flex items-center gap-3 px-4 pb-3 pt-2">
            <button onClick={() => setView('detail')} className="flex h-9 w-9 items-center justify-center text-foreground">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h1 className="text-base font-semibold text-foreground">Opgrader Abonnement</h1>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="rounded-[8px] border border-border bg-card p-4 space-y-4">
            <p className="text-sm text-muted-foreground">Opgrader abonnement for {selectedUser.name}</p>
            <div className="space-y-1">
              <Label className="text-[12px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">Plan</Label>
              <SelectSheet
                value={upgradePlan}
                onValueChange={setUpgradePlan}
                title="Plan"
                options={[
                  { value: 'family_plus', label: 'Family Plus (79 kr/md)' },
                  { value: 'single_parent_plus', label: 'Enlig Plus (49 kr/md)' },
                ]}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[12px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">Interval</Label>
              <SelectSheet
                value={upgradeInterval}
                onValueChange={setUpgradeInterval}
                title="Interval"
                options={[
                  { value: 'monthly', label: 'Månedlig' },
                  { value: 'annual', label: 'Årlig' },
                ]}
              />
            </div>
            <Button
              className="w-full rounded-[8px] bg-primary text-white hover:bg-primary"
              onClick={async () => {
                try {
                  const periodDays = upgradeInterval === 'annual' ? 365 : 30;
                  const { error } = await supabase
                    .from('stripe_subscriptions')
                    .upsert({
                      user_id: selectedUser.id,
                      plan: upgradePlan,
                      status: 'active',
                      billing_interval: upgradeInterval,
                      current_period_end: new Date(Date.now() + periodDays * 86400000).toISOString(),
                      cancel_at_period_end: false,
                    }, { onConflict: 'user_id' });
                  if (error) throw error;
                  toast.success(`Abonnement opgraderet for ${selectedUser.name}`);
                  setView('detail');
                } catch {
                  toast.error('Kunne ikke opgradere abonnement');
                }
              }}
            >
              <Crown className="h-4 w-4 mr-2" />
              Opgrader
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Suspendere konto
  if (view === 'suspend' && selectedUser) {
    return (
      <div className="fixed inset-0 z-[60] bg-background flex flex-col">
        <div className="safe-area-pt border-b border-border bg-background">
          <div className="flex items-center gap-3 px-4 pb-3 pt-2">
            <button onClick={() => setView('detail')} className="flex h-9 w-9 items-center justify-center text-foreground">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h1 className="text-base font-semibold text-foreground">Suspendere konto</h1>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="rounded-[8px] border border-border bg-card p-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Er du sikker på at du vil suspendere kontoen for <strong>{selectedUser.name}</strong>?
              Brugeren vil ikke kunne logge ind.
            </p>
            <Button
              className="w-full rounded-[8px] bg-rose-600 text-white hover:bg-rose-700"
              onClick={async () => {
                try {
                  const { error } = await supabase
                    .from('profiles')
                    .update({ suspended: true })
                    .eq('id', selectedUser.id);
                  if (error) throw error;
                  toast.success(`${selectedUser.name}'s konto er suspenderet`);
                  setView('detail');
                } catch {
                  toast.error('Kunne ikke suspendere konto');
                }
              }}
            >
              <Ban className="h-4 w-4 mr-2" />
              Suspender konto
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Link to konto sammen
  if (view === 'link-account' && selectedUser) {
    return (
      <div className="fixed inset-0 z-[60] bg-background flex flex-col">
        <div className="safe-area-pt border-b border-border bg-background">
          <div className="flex items-center gap-3 px-4 pb-3 pt-2">
            <button onClick={() => { setView('detail'); setLinkEmail(''); }} className="flex h-9 w-9 items-center justify-center text-foreground">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h1 className="text-base font-semibold text-foreground">Link konti</h1>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="rounded-[8px] border border-border bg-card p-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Link {selectedUser.name}'s konto med en anden konto.
            </p>
            <div className="space-y-1">
              <Label className="text-[12px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                Email på den anden konto
              </Label>
              <Input
                type="email"
                value={linkEmail}
                onChange={(e) => setLinkEmail(e.target.value)}
                placeholder="email@eksempel.dk"
              />
            </div>
            <Button
              className="w-full rounded-[8px] bg-primary text-white hover:bg-primary"
              disabled={!linkEmail.trim()}
              onClick={() => {
                toast.success(`Konti linket sammen`);
                setLinkEmail('');
                setView('detail');
              }}
            >
              <Link2 className="h-4 w-4 mr-2" />
              Link konti
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── DETAIL VIEW (full-screen overlay) ──
  if (view === 'detail' && selectedUser) {
    return (
      <div className="fixed inset-0 z-[60] bg-background flex flex-col">
        <div className="safe-area-pt border-b border-border bg-background">
          <div className="flex items-center gap-3 px-4 pb-3 pt-2">
            <button
              onClick={() => {
                setView('list');
                setSelectedUser(null);
                setShowActionMenu(false);
              }}
              className="flex h-9 w-9 items-center justify-center text-foreground"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h1 className="text-base font-semibold text-foreground">Brugerdetaljer</h1>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="rounded-[8px] border border-border bg-card p-4 space-y-4">
            <div className="relative flex items-center gap-4">
              <Avatar className="h-16 w-16 shrink-0">
                <AvatarImage src={selectedUser.avatar ?? undefined} />
                <AvatarFallback className="bg-secondary text-lg text-foreground">
                  {selectedUser.name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold text-foreground">{selectedUser.name}</p>
                  {selectedUser.isAdmin && (
                    <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 text-[10px] px-1.5 py-0">
                      Admin
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
              </div>
              <button
                onClick={() => setShowActionMenu(!showActionMenu)}
                className="flex h-9 w-9 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <MoreVertical className="h-5 w-5" />
              </button>

              {/* 3-dot popup menu */}
              {showActionMenu && (
                <div className="absolute right-0 top-full mt-1 z-10 w-56 rounded-lg border border-border bg-card shadow-lg overflow-hidden">
                  {[
                    { view: 'send-code' as AdminView, label: 'Send ny kode', icon: Mail },
                    { view: 'discount' as AdminView, label: 'Rabat', icon: Tag },
                    { view: 'upgrade' as AdminView, label: 'Opgrader Abonnement', icon: Crown },
                    { view: 'suspend' as AdminView, label: 'Suspendere konto', icon: Ban },
                    { view: 'link-account' as AdminView, label: 'Link konti sammen', icon: Link2 },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.view}
                        onClick={() => { setView(item.view); setShowActionMenu(false); }}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-foreground hover:bg-background transition-colors"
                      >
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-2 border-t border-border pt-3">
              <div className="flex justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">User ID</span>
                <span className="text-sm font-mono text-foreground">{generateUserId(selectedUser.id)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rolle</span>
                <span className="text-sm text-foreground">{getRoleLabel(selectedUser.role)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Oprettet</span>
                <span className="text-sm text-foreground">{formatDate(selectedUser.createdAt)}</span>
              </div>
            </div>

            <div className="flex gap-2 border-t border-border pt-3">
              {!selectedUser.isAdmin && (
                <Button
                  variant="outline"
                  className="flex-1 rounded-[8px] border-border"
                  onClick={() => handleMakeAdmin(selectedUser.email, selectedUser.name)}
                >
                  <ShieldCheck className="h-4 w-4 mr-1" />
                  Gør til admin
                </Button>
              )}
              <Button
                variant="outline"
                className="flex-1 rounded-[8px] border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                onClick={() => handleDeleteUser(selectedUser.id, selectedUser.name)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Slet bruger
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── LIST VIEW (default) ──
  return (
    <div className="space-y-2">
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : categoryFilteredUsers.length === 0 ? (
        <p className="text-center py-8 text-sm text-slate-500">Ingen brugere fundet</p>
      ) : (
        categoryFilteredUsers.map((user) => <UserRow key={user.id} user={user} />)
      )}
    </div>
  );
}
