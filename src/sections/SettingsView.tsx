import { useMemo, useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { requestNotificationPermission, scheduleAllHandoverReminders } from '@/lib/notifications';
import { paymentAccountId, userId as generateUserId, documentId } from '@/lib/id';
import {
  BadgeCheck,
  Bell,
  Briefcase,
  Camera,
  CreditCard,
  Link2,
  Moon,
  Save,
  ShieldCheck,
  Sun,
  SunMoon,
  Upload,
  UserPlus
} from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { useAppStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { getPlanFeatures, getSubscriptionPlan, normalizeSubscription } from '@/lib/subscription';
import type { BillingModel, FamilyMemberRole, HouseholdMode, SubscriptionPlan } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const AVATAR_PRESETS = [
  'Maria', 'Anders', 'Sofie', 'Lars', 'Emma', 'Mikkel',
  'Anne', 'Thomas', 'Camilla', 'Frederik', 'Julie', 'Oliver',
];

const subscriptionPlanLabels: Record<SubscriptionPlan, string> = {
  free: 'Gratis',
  family_plus: 'Family Plus',
  single_parent_plus: 'Enlig Plus'
};

const familyModeLabels: Record<HouseholdMode, string> = {
  together: 'Samboende familie',
  co_parenting: 'Skilt / Co-parenting',
  blended: 'Bonusfamilie',
  single_parent: 'Enlig forsørger'
};

export function SettingsView() {
  const { theme, setTheme } = useTheme();
  const {
    currentUser,
    users,
    household,
    paymentAccounts,
    documents,
    events,
    isProfessionalView,
    setProfessionalView,
    updateUser,
    setHousehold,
    addPaymentAccount,
    updatePaymentAccount,
    addUser,
    addDocument,
    addFamilyMember,
    removeFamilyMember,
  } = useAppStore();

  const [profileDraft, setProfileDraft] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || ''
  });
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const avatarFileRef = useRef<HTMLInputElement>(null);
  const [paymentDraft, setPaymentDraft] = useState({
    provider: 'mobilepay',
    accountLabel: '',
    accountHandle: ''
  });
  const [lawyerDraft, setLawyerDraft] = useState({
    name: '',
    email: ''
  });
  const [evidenceDraft, setEvidenceDraft] = useState({
    title: '',
    url: '',
    description: ''
  });
  const [familyMemberOpen, setFamilyMemberOpen] = useState(false);
  const [familyMemberDraft, setFamilyMemberDraft] = useState({
    name: '',
    email: '',
    role: 'grandparent' as FamilyMemberRole,
  });
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(() => {
    if (typeof Notification === 'undefined') return 'denied';
    return Notification.permission;
  });
  const [handoverReminderMinutes, setHandoverReminderMinutes] = useState(30);

  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setNotifPermission(Notification.permission);
    }
  }, []);

  const subscription = normalizeSubscription(household);
  const plan = getSubscriptionPlan(household);
  const features = getPlanFeatures(household);
  const currentMode = household?.familyMode || 'co_parenting';
  const isTogetherMode = currentMode === 'together';
  const isSingleParentMode = currentMode === 'single_parent';
  const allowProfessionalTools = !isTogetherMode;

  const myPaymentAccounts = useMemo(() => {
    if (!currentUser) return [];
    return paymentAccounts.filter((account) => account.userId === currentUser.id);
  }, [paymentAccounts, currentUser]);

  const lawyerUsers = useMemo(() => {
    const lawyerIds = household?.singleParentSupport?.lawyerIds || [];
    return users.filter((user) => lawyerIds.includes(user.id));
  }, [household, users]);

  const evidenceDocuments = useMemo(() => {
    return documents.filter((document) => (
      document.type === 'authority_document' || document.type === 'court_order'
    ));
  }, [documents]);

  const handleSaveProfile = () => {
    if (!currentUser) return;
    updateUser(currentUser.id, {
      name: profileDraft.name.trim(),
      email: profileDraft.email.trim(),
      phone: profileDraft.phone.trim() || undefined
    });
    toast.success('Profil gemt');
  };

  const handleAvatarPreset = (seed: string) => {
    if (!currentUser) return;
    const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
    updateUser(currentUser.id, { avatar: url });
    setAvatarDialogOpen(false);
    toast.success('Avatar opdateret');
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Billedet er for stort (maks 2 MB)');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      updateUser(currentUser.id, { avatar: reader.result as string });
      setAvatarDialogOpen(false);
      toast.success('Profilbillede opdateret');
    };
    reader.readAsDataURL(file);
  };

  const handleFamilyModeChange = (mode: HouseholdMode) => {
    if (!household) return;
    const nextBillingModel: BillingModel = mode === 'together' ? 'shared' : 'separate';
    setHousehold({
      ...household,
      familyMode: mode,
      subscription: {
        ...subscription,
        billingModel: nextBillingModel
      },
      singleParentSupport: household.singleParentSupport || {
        evidenceVaultEnabled: false,
        autoArchiveReceipts: false,
        lawyerIds: []
      }
    });
    toast.success(`Familiemode sat til ${familyModeLabels[mode]}`);
  };

  const handlePlanChange = (nextPlan: SubscriptionPlan) => {
    if (!household) return;
    setHousehold({
      ...household,
      subscription: {
        ...subscription,
        plan: nextPlan,
        billingModel: household.familyMode === 'together' ? 'shared' : subscription.billingModel
      }
    });
    toast.success(`Abonnement opdateret til ${subscriptionPlanLabels[nextPlan]}`);
  };

  const handleAddPaymentAccount = () => {
    if (!currentUser) return;
    if (!paymentDraft.accountLabel.trim() || !paymentDraft.accountHandle.trim()) {
      toast.error('Udfyld kontonavn og konto-oplysninger');
      return;
    }
    addPaymentAccount({
      id: paymentAccountId(),
      userId: currentUser.id,
      provider: paymentDraft.provider as 'mobilepay' | 'bank' | 'card' | 'other',
      accountLabel: paymentDraft.accountLabel.trim(),
      accountHandle: paymentDraft.accountHandle.trim(),
      isPrimary: myPaymentAccounts.length === 0,
      createdAt: new Date().toISOString()
    });
    setPaymentDraft({ provider: 'mobilepay', accountLabel: '', accountHandle: '' });
    toast.success('Betalingskonto tilføjet');
  };

  const handleSetPrimaryPayment = (accountId: string) => {
    const account = myPaymentAccounts.find((item) => item.id === accountId);
    if (!account) return;
    myPaymentAccounts.forEach((item) => {
      if (item.id === account.id) {
        updatePaymentAccount(item.id, { isPrimary: true });
      } else if (item.userId === account.userId && item.isPrimary) {
        updatePaymentAccount(item.id, { isPrimary: false });
      }
    });
    toast.success('Primær betalingskonto opdateret');
  };

  const handleUpdateSingleParentSetting = (key: 'evidenceVaultEnabled' | 'autoArchiveReceipts', value: boolean) => {
    if (!household) return;
    const current = household.singleParentSupport || {
      evidenceVaultEnabled: false,
      autoArchiveReceipts: false,
      lawyerIds: []
    };
    setHousehold({
      ...household,
      singleParentSupport: {
        ...current,
        [key]: value
      }
    });
  };

  const handleInviteLawyer = () => {
    if (!household) return;
    if (!features.lawyerAccess) {
      toast.error('Advokatadgang kræver Enlig Plus abonnement');
      return;
    }
    if (!lawyerDraft.name.trim() || !lawyerDraft.email.trim()) {
      toast.error('Udfyld navn og email');
      return;
    }

    const lawyerId = generateUserId();
    addUser({
      id: lawyerId,
      name: lawyerDraft.name.trim(),
      email: lawyerDraft.email.trim(),
      role: 'professional',
      professionalType: 'lawyer',
      organization: 'Ekstern advokat',
      color: 'neutral',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(lawyerDraft.name.trim())}`
    });

    const support = household.singleParentSupport || {
      evidenceVaultEnabled: true,
      autoArchiveReceipts: true,
      lawyerIds: []
    };

    setHousehold({
      ...household,
      singleParentSupport: {
        ...support,
        lawyerIds: [...support.lawyerIds, lawyerId]
      }
    });

    setLawyerDraft({ name: '', email: '' });
    toast.success('Advokat inviteret og fået adgang');
  };

  const handleAddEvidence = () => {
    if (!currentUser || !household) return;
    if (!features.singleParentEvidence) {
      toast.error('Dokumentationsarkiv kræver Enlig Plus abonnement');
      return;
    }
    if (!evidenceDraft.title.trim() || !evidenceDraft.url.trim()) {
      toast.error('Tilføj titel og link');
      return;
    }

    const support = household.singleParentSupport || {
      evidenceVaultEnabled: true,
      autoArchiveReceipts: true,
      lawyerIds: []
    };

    addDocument({
      id: documentId(),
      title: evidenceDraft.title.trim(),
      type: 'authority_document',
      url: evidenceDraft.url.trim(),
      uploadedBy: currentUser.id,
      uploadedAt: new Date().toISOString(),
      sharedWith: [currentUser.id, ...support.lawyerIds],
      isOfficial: true,
      authorityReference: evidenceDraft.description.trim() || 'Dokumentation'
    });

    setEvidenceDraft({ title: '', url: '', description: '' });
    toast.success('Dokumentation gemt i arkivet');
  };

  return (
    <div className="space-y-4 p-1">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-semibold text-[#2f2f2d]">Indstillinger</h1>
        <p className="text-sm text-[#75736b]">
          Familietype, abonnement, betaling og dokumentation
        </p>
      </motion.div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="flex w-full justify-start overflow-x-auto rounded-2xl p-1.5">
          <TabsTrigger value="profile" className="flex-none min-w-[92px]">Konto</TabsTrigger>
          <TabsTrigger value="family" className="flex-none min-w-[92px]">Familie</TabsTrigger>
          <TabsTrigger value="subscription" className="flex-none min-w-[126px]">Abonnement</TabsTrigger>
          <TabsTrigger value="payments" className="flex-none min-w-[108px]">Betaling</TabsTrigger>
          <TabsTrigger value="members" className="flex-none min-w-[120px]">Medlemmer</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          {/* Avatar section */}
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-5">
              <button
                onClick={() => setAvatarDialogOpen(true)}
                className="group relative"
              >
                <Avatar className="h-20 w-20 border-2 border-[#e8e7e0] shadow-sm">
                  <AvatarImage src={currentUser?.avatar} />
                  <AvatarFallback className="bg-[#ecebe5] text-2xl font-semibold text-[#4a4945]">
                    {currentUser?.name?.[0] ?? '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera className="h-5 w-5 text-white" />
                </div>
              </button>
              <button
                onClick={() => setAvatarDialogOpen(true)}
                className="text-[12px] font-medium text-[#f58a2d] hover:underline"
              >
                Skift profilbillede
              </button>
            </CardContent>
          </Card>

          {/* Avatar picker dialog */}
          <Dialog open={avatarDialogOpen} onOpenChange={setAvatarDialogOpen}>
            <DialogContent className="max-w-sm rounded-3xl border-[#d8d7cf] bg-[#faf9f6]">
              <DialogHeader>
                <DialogTitle className="text-[1rem] text-[#2f2f2d]">Vælg profilbillede</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Upload own photo */}
                <button
                  onClick={() => avatarFileRef.current?.click()}
                  className="flex w-full items-center gap-3 rounded-2xl border-2 border-dashed border-[#d8d7cf] bg-white px-4 py-3 text-left transition-colors hover:border-[#f58a2d] hover:bg-[#fff8f0]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff2e6]">
                    <Upload className="h-5 w-5 text-[#f58a2d]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#2f2f2d]">Upload eget billede</p>
                    <p className="text-[11px] text-[#78766d]">JPG eller PNG, maks 2 MB</p>
                  </div>
                </button>
                <input
                  ref={avatarFileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />

                {/* Preset avatars */}
                <div>
                  <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#78766d]">Eller vælg en avatar</p>
                  <div className="grid grid-cols-4 gap-3">
                    {AVATAR_PRESETS.map(seed => {
                      const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
                      const isSelected = currentUser?.avatar === url;
                      return (
                        <button
                          key={seed}
                          onClick={() => handleAvatarPreset(seed)}
                          className={cn(
                            "flex flex-col items-center gap-1 rounded-xl p-2 transition-all",
                            isSelected
                              ? "bg-[#fff2e6] ring-2 ring-[#f58a2d]"
                              : "hover:bg-[#f0efe8]"
                          )}
                        >
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={url} />
                            <AvatarFallback>{seed[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-[10px] text-[#78766d]">{seed}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Min profil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="space-y-2">
                <Label>Navn</Label>
                <Input
                  value={profileDraft.name}
                  onChange={(e) => setProfileDraft((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={profileDraft.email}
                  onChange={(e) => setProfileDraft((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefon</Label>
                <Input
                  value={profileDraft.phone}
                  onChange={(e) => setProfileDraft((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="+45 ..."
                />
              </div>
              <Button onClick={handleSaveProfile} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Gem profil
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Visning</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {/* Dark mode toggle */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-[#2f2f2d] dark:text-slate-200">Farvetema</p>
                <div className="flex gap-2">
                  {([
                    { value: 'light', label: 'Lys', Icon: Sun },
                    { value: 'system', label: 'Auto', Icon: SunMoon },
                    { value: 'dark', label: 'Mørk', Icon: Moon },
                  ] as const).map(({ value, label, Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setTheme(value)}
                      aria-pressed={theme === value}
                      className={`flex flex-1 flex-col items-center gap-1 rounded-xl border py-2.5 px-2 text-xs font-medium transition-colors ${
                        theme === value
                          ? 'border-orange-400 bg-orange-50 text-orange-700 dark:border-orange-400 dark:bg-orange-950 dark:text-orange-300'
                          : 'border-[#d8d7cf] bg-[#faf9f6] text-[#75736b] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-[#d8d7cf] bg-[#faf9f6] px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
                <div>
                  <p className="text-sm font-medium text-[#2f2f2d] dark:text-slate-200">Professionel visning</p>
                  <p className="text-xs text-[#75736b] dark:text-slate-400">
                    {allowProfessionalTools ? 'Kan slås til/fra' : 'Skjult i samboende mode'}
                  </p>
                </div>
                <Switch
                  checked={isProfessionalView && allowProfessionalTools}
                  disabled={!allowProfessionalTools}
                  onCheckedChange={(value) => setProfessionalView(value)}
                />
              </div>
              <div className="rounded-xl border border-[#d8d7cf] bg-[#f8f7f3] p-3">
                <p className="text-sm text-[#4d4a43]">
                  Aktuel familietype: <strong>{familyModeLabels[currentMode]}</strong>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="h-4 w-4" />
                Push-notifikationer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <p className="text-xs text-[#75736b] dark:text-slate-400">
                Modtag en notifikation inden aflevering. Kræver at appen er åben i browseren.
              </p>
              {notifPermission === 'granted' ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-xl border border-[#d8d7cf] bg-[#faf9f6] px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
                    <p className="text-sm font-medium text-[#2f2f2d] dark:text-slate-200">Notifikationer aktiveret</p>
                    <BadgeCheck className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reminder-minutes">Påmind mig (minutter før aflevering)</Label>
                    <Select
                      value={String(handoverReminderMinutes)}
                      onValueChange={(v) => setHandoverReminderMinutes(Number(v))}
                    >
                      <SelectTrigger id="reminder-minutes">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutter</SelectItem>
                        <SelectItem value="30">30 minutter</SelectItem>
                        <SelectItem value="60">1 time</SelectItem>
                        <SelectItem value="120">2 timer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => {
                      const handoverEvents = events.filter(e => e.type === 'handover');
                      scheduleAllHandoverReminders(handoverEvents, handoverReminderMinutes);
                      toast.success(`Påmindelser planlagt ${handoverReminderMinutes} min. før aflevering`);
                    }}
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    Planlæg påmindelser
                  </Button>
                </div>
              ) : notifPermission === 'denied' ? (
                <div className="rounded-xl border border-[#f3c59d] bg-[#fff6ef] p-3">
                  <p className="text-sm text-[#b96424]">
                    Notifikationer er blokeret af browseren. Tillad dem i browserens indstillinger og genindlæs siden.
                  </p>
                </div>
              ) : (
                <Button
                  className="w-full"
                  onClick={async () => {
                    const granted = await requestNotificationPermission();
                    setNotifPermission(granted ? 'granted' : 'denied');
                    if (granted) {
                      toast.success('Notifikationer aktiveret!');
                    } else {
                      toast.error('Notifikationer afvist af browseren');
                    }
                  }}
                >
                  <Bell className="mr-2 h-4 w-4" />
                  Aktiver notifikationer
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="family" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Familiemode</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="space-y-2">
                <Label>Vælg mode</Label>
                <Select value={currentMode} onValueChange={(value: HouseholdMode) => handleFamilyModeChange(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="together">Samboende familie</SelectItem>
                    <SelectItem value="co_parenting">Skilt / Co-parenting</SelectItem>
                    <SelectItem value="blended">Bonusfamilie</SelectItem>
                    <SelectItem value="single_parent">Enlig forsørger</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-xl border border-[#d8d7cf] bg-[#f8f7f3] p-3 text-sm text-[#55524a]">
                {isTogetherMode
                  ? 'Samboende familier deler ét abonnement.'
                  : 'Skilte familier bruger separate abonnementer.'}
              </div>
            </CardContent>
          </Card>

          {isSingleParentMode && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck className="h-4 w-4" />
                  Enlig forsørger støtte
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="flex items-center justify-between rounded-xl border border-[#d8d7cf] bg-[#faf9f6] px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">Dokumentationsarkiv</p>
                    <p className="text-xs text-[#75736b]">Gem kvitteringer og beviser centralt</p>
                  </div>
                  <Switch
                    checked={Boolean(household?.singleParentSupport?.evidenceVaultEnabled)}
                    disabled={!features.singleParentEvidence}
                    onCheckedChange={(value) => handleUpdateSingleParentSetting('evidenceVaultEnabled', value)}
                  />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-[#d8d7cf] bg-[#faf9f6] px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">Auto-arkiver kvitteringer</p>
                    <p className="text-xs text-[#75736b]">Udgiftskvitteringer samles automatisk</p>
                  </div>
                  <Switch
                    checked={Boolean(household?.singleParentSupport?.autoArchiveReceipts)}
                    disabled={!features.singleParentEvidence}
                    onCheckedChange={(value) => handleUpdateSingleParentSetting('autoArchiveReceipts', value)}
                  />
                </div>

                <div className="rounded-xl border border-[#d8d7cf] bg-[#f8f7f3] p-3">
                  <p className="mb-2 text-sm font-medium">Inviter advokat</p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Input
                      value={lawyerDraft.name}
                      onChange={(e) => setLawyerDraft((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Navn"
                    />
                    <Input
                      value={lawyerDraft.email}
                      onChange={(e) => setLawyerDraft((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="Email"
                    />
                  </div>
                  <Button className="mt-2 w-full" variant="outline" onClick={handleInviteLawyer}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Tilføj advokatadgang
                  </Button>
                </div>

                <div className="space-y-2">
                  {lawyerUsers.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-[#d8d7cf] bg-[#f8f7f3] p-3 text-sm text-[#75736b]">
                      Ingen advokater tilknyttet endnu.
                    </p>
                  ) : (
                    lawyerUsers.map((lawyer) => (
                      <div key={lawyer.id} className="rounded-xl border border-[#d8d7cf] bg-[#faf9f6] p-3">
                        <p className="font-medium">{lawyer.name}</p>
                        <p className="text-xs text-[#75736b]">{lawyer.email}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="rounded-xl border border-[#d8d7cf] bg-[#f8f7f3] p-3">
                  <p className="mb-2 text-sm font-medium">Upload vigtigt materiale</p>
                  <div className="space-y-2">
                    <Input
                      value={evidenceDraft.title}
                      onChange={(e) => setEvidenceDraft((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="Titel"
                    />
                    <Input
                      value={evidenceDraft.url}
                      onChange={(e) => setEvidenceDraft((prev) => ({ ...prev, url: e.target.value }))}
                      placeholder="Link/fil-reference"
                    />
                    <Textarea
                      value={evidenceDraft.description}
                      onChange={(e) => setEvidenceDraft((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Kort beskrivelse"
                    />
                    <Button className="w-full" onClick={handleAddEvidence}>
                      <Link2 className="mr-2 h-4 w-4" />
                      Gem i dokumentation
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {evidenceDocuments.slice(0, 5).map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between rounded-xl border border-[#d8d7cf] bg-[#faf9f6] px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{doc.title}</p>
                        <p className="truncate text-xs text-[#75736b]">{doc.url}</p>
                      </div>
                      <Badge variant="outline">Dok</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="subscription" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Abonnement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="grid grid-cols-1 gap-2">
                {(['free', 'family_plus', 'single_parent_plus'] as SubscriptionPlan[]).map((planId) => (
                  <button
                    key={planId}
                    type="button"
                    onClick={() => handlePlanChange(planId)}
                    className={`rounded-xl border p-3 text-left transition-colors ${
                      plan === planId
                        ? 'border-[#f3c59d] bg-[#fff2e6]'
                        : 'border-[#d8d7cf] bg-[#f8f7f3] hover:bg-[#efeee8]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{subscriptionPlanLabels[planId]}</p>
                      {plan === planId ? <BadgeCheck className="h-4 w-4 text-[#f58a2d]" /> : null}
                    </div>
                    <p className="mt-1 text-xs text-[#75736b]">
                      {planId === 'free' && 'Basis app uden premiumfunktioner'}
                      {planId === 'family_plus' && 'Flere børn, scanning, udgifter, faste betalinger'}
                      {planId === 'single_parent_plus' && 'Alle plus-funktioner + advokat og dokumentation'}
                    </p>
                  </button>
                ))}
              </div>

              <div className="rounded-xl border border-[#d8d7cf] bg-[#f8f7f3] p-3">
                <p className="text-sm font-medium">Aktiv plan: {subscriptionPlanLabels[plan]}</p>
                <p className="text-xs text-[#75736b]">
                  Fakturering: {isTogetherMode ? 'Delt abonnement' : subscription.billingModel === 'shared' ? 'Delt' : 'Separat'}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <FeaturePill active={features.multipleChildren} label="Flere børn" />
                <FeaturePill active={features.shoppingScanner} label="Scanning til indkøb" />
                <FeaturePill active={features.expenses} label="Udgiftsmodul" />
                <FeaturePill active={features.inAppPayments} label="Send/anmod penge" />
                <FeaturePill active={features.recurringExpenses} label="Faste udgifter" />
                <FeaturePill active={features.lawyerAccess} label="Advokatadgang" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-4 w-4" />
                Betalingskonti
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Select
                  value={paymentDraft.provider}
                  onValueChange={(value) => setPaymentDraft((prev) => ({ ...prev, provider: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mobilepay">MobilePay</SelectItem>
                    <SelectItem value="bank">Bankkonto</SelectItem>
                    <SelectItem value="card">Kort</SelectItem>
                    <SelectItem value="other">Andet</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={paymentDraft.accountLabel}
                  onChange={(e) => setPaymentDraft((prev) => ({ ...prev, accountLabel: e.target.value }))}
                  placeholder="Kontonavn"
                />
                <Input
                  value={paymentDraft.accountHandle}
                  onChange={(e) => setPaymentDraft((prev) => ({ ...prev, accountHandle: e.target.value }))}
                  placeholder="Kontonr./link"
                />
              </div>
              <Button
                className="w-full"
                variant="outline"
                disabled={!features.inAppPayments}
                onClick={handleAddPaymentAccount}
              >
                Tilføj konto
              </Button>

              <div className="space-y-2">
                {myPaymentAccounts.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-[#d8d7cf] bg-[#f8f7f3] p-3 text-sm text-[#75736b]">
                    Ingen betalingskonti tilføjet endnu.
                  </p>
                ) : (
                  myPaymentAccounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between rounded-xl border border-[#d8d7cf] bg-[#faf9f6] p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{account.accountLabel}</p>
                        <p className="truncate text-xs text-[#75736b]">{account.accountHandle}</p>
                      </div>
                      <Button
                        size="sm"
                        variant={account.isPrimary ? 'secondary' : 'outline'}
                        onClick={() => handleSetPrimaryPayment(account.id)}
                      >
                        {account.isPrimary ? 'Primær' : 'Sæt primær'}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Briefcase className="h-4 w-4" />
                Abonnementsmodel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <p className="text-sm text-[#56534b]">
                {isTogetherMode
                  ? 'Samboende: abonnement deles automatisk.'
                  : 'Skilt/co-parenting: separat abonnement pr. bruger.'}
              </p>
              <Badge variant="outline">
                {isTogetherMode ? 'Delt abonnement' : 'Separat abonnement'}
              </Badge>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" />
                Familiemedlemmer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {!features.familyMembers ? (
                <div className="rounded-xl border border-[#f3c59d] bg-[#fff6ef] p-4 text-center">
                  <p className="text-sm font-semibold text-[#b96424]">Opgrader til Family Plus</p>
                  <p className="mt-1 text-xs text-[#cc8a4f]">
                    Tilføj familiemedlemmer som teenagere, bedsteforældre og bonusforældre med Family Plus eller Enlig Plus.
                  </p>
                  <Button
                    className="mt-3 rounded-2xl bg-[#f58a2d] text-white hover:bg-[#e47921]"
                    size="sm"
                    onClick={() => handlePlanChange('family_plus')}
                  >
                    Opgrader nu
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {users.filter(u => u.familyMemberRole).map(member => (
                      <div key={member.id} className="flex items-center justify-between rounded-xl border border-[#d8d7cf] bg-[#faf9f6] px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[#2f2f2d]">{member.name}</p>
                          <p className="text-xs text-[#75736b]">
                            {member.familyMemberRole === 'teenager' ? 'Teenager' :
                             member.familyMemberRole === 'grandparent' ? 'Bedsteforælder' :
                             member.familyMemberRole === 'step_parent' ? 'Bonusforælder' : 'Øvrigt familiemedlem'}
                            {member.email ? ` · ${member.email}` : ''}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-[#c8c6bc] hover:text-rose-500"
                          onClick={() => {
                            removeFamilyMember(member.id);
                            toast.success('Familiemedlem fjernet');
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {users.filter(u => u.familyMemberRole).length === 0 && (
                      <p className="rounded-xl border border-dashed border-[#d8d7cf] bg-[#f8f7f3] p-3 text-sm text-[#75736b]">
                        Ingen ekstra familiemedlemmer endnu.
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-[#78766d]">
                    Maks {features.maxFamilyMembers} familiemedlemmer med dit abonnement.
                  </p>
                  <Button
                    className="w-full rounded-2xl"
                    variant="outline"
                    disabled={users.filter(u => u.familyMemberRole).length >= features.maxFamilyMembers}
                    onClick={() => setFamilyMemberOpen(true)}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Tilføj familiemedlem
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Family Member Dialog */}
      <Dialog open={familyMemberOpen} onOpenChange={setFamilyMemberOpen}>
        <DialogContent className="max-w-sm rounded-3xl border-[#d8d7cf] bg-[#faf9f6]">
          <DialogHeader>
            <DialogTitle className="text-[1rem] tracking-[-0.01em] text-[#2f2f2d]">Tilføj familiemedlem</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#78766d]">Navn</Label>
              <Input
                value={familyMemberDraft.name}
                onChange={e => setFamilyMemberDraft(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Fulde navn"
                className="rounded-xl border-[#d8d7cf] bg-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#78766d]">Email (valgfrit)</Label>
              <Input
                value={familyMemberDraft.email}
                onChange={e => setFamilyMemberDraft(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@eksempel.dk"
                className="rounded-xl border-[#d8d7cf] bg-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#78766d]">Rolle</Label>
              <Select
                value={familyMemberDraft.role}
                onValueChange={(v) => setFamilyMemberDraft(prev => ({ ...prev, role: v as FamilyMemberRole }))}
              >
                <SelectTrigger className="rounded-xl border-[#d8d7cf] bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="teenager">Teenager</SelectItem>
                  <SelectItem value="grandparent">Bedsteforælder</SelectItem>
                  <SelectItem value="step_parent">Bonusforælder</SelectItem>
                  <SelectItem value="other_relative">Øvrigt familiemedlem</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1 rounded-2xl border-[#d8d7cf]" onClick={() => setFamilyMemberOpen(false)}>
                Annuller
              </Button>
              <Button
                className="flex-1 rounded-2xl bg-[#2f2f2f] text-white hover:bg-[#1a1a1a]"
                disabled={!familyMemberDraft.name.trim()}
                onClick={() => {
                  const memberId = generateUserId();
                  addFamilyMember({
                    id: memberId,
                    name: familyMemberDraft.name.trim(),
                    email: familyMemberDraft.email.trim() || '',
                    role: 'family_member',
                    color: 'neutral',
                    familyMemberRole: familyMemberDraft.role,
                    invitedBy: currentUser?.id,
                    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(familyMemberDraft.name.trim())}`,
                  });
                  setFamilyMemberOpen(false);
                  setFamilyMemberDraft({ name: '', email: '', role: 'grandparent' });
                  toast.success('Familiemedlem tilføjet');
                }}
              >
                Tilføj
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FeaturePill({ active, label }: { active: boolean; label: string }) {
  return (
    <div
      className={`rounded-xl border px-3 py-2 text-sm ${
        active
          ? 'border-[#f3c59d] bg-[#fff2e6] text-[#9d5d23]'
          : 'border-[#d8d7cf] bg-[#f8f7f3] text-[#77746b]'
      }`}
    >
      {label}
    </div>
  );
}
