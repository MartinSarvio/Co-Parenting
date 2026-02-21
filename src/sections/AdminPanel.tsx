import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Trash2,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  role: string;
  isAdmin: boolean;
  createdAt: string;
}

export function AdminPanel() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'parent',
    isAdmin: false,
  });

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get<{ users: AdminUser[] }>('/api/admin/users');
      setUsers(data.users);
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
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error('Udfyld navn, email og adgangskode');
      return;
    }
    if (newUser.password.length < 6) {
      toast.error('Adgangskode skal være mindst 6 tegn');
      return;
    }

    setIsCreating(true);
    try {
      await api.post('/api/admin/users', {
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        isAdmin: newUser.isAdmin,
      });
      toast.success(`Bruger ${newUser.name} oprettet`);
      setCreateOpen(false);
      setNewUser({ name: '', email: '', password: '', role: 'parent', isAdmin: false });
      fetchUsers();
    } catch {
      toast.error('Kunne ikke oprette bruger');
    } finally {
      setIsCreating(false);
    }
  };

  const handleMakeAdmin = async (email: string, name: string) => {
    try {
      await api.post('/api/admin/make-admin', { email });
      toast.success(`${name} er nu admin`);
      fetchUsers();
    } catch {
      toast.error('Kunne ikke gøre bruger til admin');
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Er du sikker på at du vil slette ${name}? Dette kan ikke fortrydes.`)) {
      return;
    }
    try {
      await api.delete(`/api/admin/users/${id}`);
      toast.success(`${name} slettet`);
      fetchUsers();
    } catch {
      toast.error('Kunne ikke slette bruger');
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'parent': return 'Forælder';
      case 'guardian': return 'Værge';
      case 'professional': return 'Professionel';
      default: return role;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Alle brugere
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchUsers} disabled={isLoading}>
                <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                Opdater
              </Button>
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <UserPlus className="h-3.5 w-3.5 mr-1" />
                Opret
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-center py-8 text-sm text-slate-500">Ingen brugere fundet</p>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 rounded-xl border border-[#d8d7cf] bg-[#faf9f6] px-3 py-2.5"
              >
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarImage src={user.avatar ?? undefined} />
                  <AvatarFallback className="bg-[#ecebe5] text-sm text-[#4a4945]">
                    {user.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-[#2f2f2d]">{user.name}</p>
                    {user.isAdmin && (
                      <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 text-[10px] px-1.5 py-0">
                        Admin
                      </Badge>
                    )}
                  </div>
                  <p className="truncate text-xs text-[#75736b]">
                    {user.email} · {getRoleLabel(user.role)} · {formatDate(user.createdAt)}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {!user.isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-[#75736b] hover:text-orange-600"
                      title="Gør til admin"
                      onClick={() => handleMakeAdmin(user.email, user.name)}
                    >
                      <ShieldCheck className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-[#c8c6bc] hover:text-rose-500"
                    title="Slet bruger"
                    onClick={() => handleDeleteUser(user.id, user.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-sm rounded-3xl border-[#d8d7cf] bg-[#faf9f6]">
          <DialogHeader>
            <DialogTitle className="text-[1rem] text-[#2f2f2d]">Opret ny bruger</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#78766d]">Navn</Label>
              <Input
                value={newUser.name}
                onChange={(e) => setNewUser((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Fulde navn"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#78766d]">Email</Label>
              <Input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="email@eksempel.dk"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#78766d]">Adgangskode</Label>
              <Input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="Mindst 6 tegn"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#78766d]">Rolle</Label>
              <Select
                value={newUser.role}
                onValueChange={(v) => setNewUser((prev) => ({ ...prev, role: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parent">Forælder</SelectItem>
                  <SelectItem value="guardian">Værge</SelectItem>
                  <SelectItem value="professional">Professionel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-[#d8d7cf] bg-white px-3 py-2">
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
                className="flex-1 rounded-2xl border-[#d8d7cf]"
                onClick={() => setCreateOpen(false)}
                disabled={isCreating}
              >
                Annuller
              </Button>
              <Button
                className="flex-1 rounded-2xl bg-[#2f2f2f] text-white hover:bg-[#1a1a1a]"
                disabled={isCreating || !newUser.name || !newUser.email || !newUser.password}
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
