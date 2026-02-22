import { useMemo, useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { requestNotificationPermission, scheduleAllHandoverReminders } from '@/lib/notifications';
import { paymentAccountId, userId as generateUserId } from '@/lib/id';
import {
  BadgeCheck,
  Bell,
  Briefcase,
  Camera,
  Check,
  CreditCard,
  Link2,
  Menu,
  Moon,
  Save,
  ShieldCheck,
  Sun,
  SunMoon,
  Upload,
  UserPlus,
  X as XIcon,
  ChevronRight,
  Eye,
  Home,
  MessageSquare,
  Heart,
  Star,
  Send,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { useAppStore } from '@/store';
import { useApiActions } from '@/hooks/useApiActions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { getPlanFeatures, getSubscriptionPlan, normalizeSubscription } from '@/lib/subscription';
import type { BillingModel, FamilyMemberRole, HouseholdMode, SubscriptionPlan } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Trash2, Receipt, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { startCheckout, openBillingPortal, fetchStripeStatus, PLAN_PRICES } from '@/lib/stripe';
import type { StripePlan } from '@/lib/stripe';
import { AdminPanel } from '@/sections/AdminPanel';

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

/** Calculate age from a date string (YYYY-MM-DD) */
function calculateAge(birthDateStr: string): number | null {
  if (!birthDateStr) return null;
  const birth = new Date(birthDateStr);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

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
    addFamilyMember,
    removeFamilyMember,
  } = useAppStore();
  const { createDocument } = useApiActions();

  const [profileDraft, setProfileDraft] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    birthDate: (currentUser as any)?.birthDate || '',
    address: (currentUser as any)?.address || '',
    zipCode: (currentUser as any)?.zipCode || '',
    city: (currentUser as any)?.city || '',
    country: (currentUser as any)?.country || 'Danmark',
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
  const [activeSettingsTab, setActiveSettingsTab] = useState('profile');
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [feedbackDraft, setFeedbackDraft] = useState({
    rating: 0,
    category: 'general',
    message: '',
  });
  const [partnerInviteEmail, setPartnerInviteEmail] = useState('');
  const [homeRemindersActive, setHomeRemindersActive] = useState(false);

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
    const profileData = {
      name: profileDraft.name.trim(),
      email: profileDraft.email.trim(),
      phone: profileDraft.phone.trim() || undefined,
      birthDate: profileDraft.birthDate || undefined,
      address: profileDraft.address.trim() || undefined,
      zipCode: profileDraft.zipCode.trim() || undefined,
      city: profileDraft.city.trim() || undefined,
      country: profileDraft.country.trim() || undefined,
    };
    updateUser(currentUser.id, profileData as any);
    // Persist profile to server
    api.patch(`/api/users/${currentUser.id}`, profileData).catch(() => {});
    toast.success('Profil gemt');
  };

  const handleAvatarPreset = (seed: string) => {
    if (!currentUser) return;
    const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
    updateUser(currentUser.id, { avatar: url });
    // Persist avatar to server
    api.patch(`/api/users/${currentUser.id}`, { avatar: url }).catch(() => {});
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

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [hasStripeCustomer, setHasStripeCustomer] = useState(false);

  const handlePlanChange = async (nextPlan: SubscriptionPlan) => {
    if (!household) return;

    // Free plan — update locally (if they have Stripe customer, open portal to cancel)
    if (nextPlan === 'free') {
      if (hasStripeCustomer) {
        try {
          await openBillingPortal();
        } catch {
          toast.error('Kunne ikke åbne abonnementsstyring');
        }
      } else {
        setHousehold({
          ...household,
          subscription: { ...subscription, plan: 'free' }
        });
        toast.success('Plan sat til Gratis');
      }
      return;
    }

    // Paid plan — redirect to Stripe Checkout
    setCheckoutLoading(true);
    try {
      await startCheckout(nextPlan as StripePlan, 'monthly');
      // User is redirected to Stripe — this code won't run
    } catch (err) {
      console.error('Stripe checkout error:', err);
      toast.error('Kunne ikke starte betaling. Prøv igen.');
      setCheckoutLoading(false);
    }
  };

  // Open billing portal for managing existing subscription
  const handleManageSubscription = async () => {
    try {
      await openBillingPortal();
    } catch {
      toast.error('Kunne ikke åbne abonnementsstyring');
    }
  };

  // Sync subscription status from Stripe on mount + after redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stripeResult = params.get('stripe');

    if (stripeResult === 'success') {
      toast.success('Betaling gennemført! Dit abonnement er nu aktivt.');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (stripeResult === 'cancel') {
      toast.info('Betaling annulleret');
      window.history.replaceState({}, '', window.location.pathname);
    }

    // Fetch real subscription status from Stripe
    fetchStripeStatus().then((status) => {
      if (status.stripeActive) {
        setHasStripeCustomer(true);
        if (household && status.plan !== 'free') {
          setHousehold({
            ...household,
            subscription: {
              ...subscription,
              plan: status.plan as SubscriptionPlan,
              status: 'active',
            }
          });
        }
      }
    }).catch(() => { /* ignore — fallback to local state */ });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

    void createDocument({
      title: evidenceDraft.title.trim(),
      type: 'authority_document',
      url: evidenceDraft.url.trim(),
      sharedWith: [currentUser.id, ...support.lawyerIds],
      isOfficial: true,
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
      </motion.div>

      {/* ─── Side panel (slides from left) ─── */}
      <AnimatePresence>
        {sidePanelOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[60] bg-black/30"
              onClick={() => setSidePanelOpen(false)}
            />
            {/* Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="fixed inset-y-0 left-0 z-[70] w-[280px] bg-white shadow-[4px_0_24px_rgba(0,0,0,0.1)] flex flex-col"
              style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
            >
              {/* Panel header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#eeedea]">
                <h2 className="text-[17px] font-bold text-[#2f2f2d]">Mere</h2>
                <button
                  onClick={() => setSidePanelOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f2f1ed] text-[#5f5d56]"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Panel items */}
              <div className="flex-1 overflow-y-auto py-2">
                {[
                  { value: 'notifications', label: 'Notifikationer', icon: Bell, desc: 'Push & påmindelser' },
                  { value: 'familytype', label: 'Familietype', icon: Home, desc: 'Samboende, skilt, enlig' },
                  { value: 'appearance', label: 'Visning', icon: Eye, desc: 'Tema & professionel visning', adminOnly: false },
                  null, // divider
                  { value: 'payments', label: 'Betaling', icon: CreditCard, desc: 'Betalingskonti' },
                  { value: 'members', label: 'Medlemmer', icon: Users, desc: 'Familiemedlemmer' },
                  null, // divider
                  { value: 'feedback', label: 'Feedback', icon: MessageSquare, desc: 'Giv os feedback' },
                  ...(currentUser?.isAdmin
                    ? [
                        null, // divider
                        { value: 'admin', label: 'Admin', icon: ShieldAlert, desc: 'Administration', adminOnly: true },
                      ]
                    : []),
                ].map((item, idx) => {
                  if (item === null) {
                    return <div key={`div-${idx}`} className="my-2 mx-5 border-t border-[#eeedea]" />;
                  }
                  const Icon = item.icon;
                  const isActive = activeSettingsTab === item.value;
                  return (
                    <button
                      key={item.value}
                      onClick={() => {
                        setActiveSettingsTab(item.value);
                        setSidePanelOpen(false);
                      }}
                      className={cn(
                        'flex w-full items-center gap-3.5 px-5 py-3 text-left transition-colors',
                        isActive
                          ? 'bg-[#f7f6f2]'
                          : 'hover:bg-[#faf9f6]'
                      )}
                    >
                      <div className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-xl',
                        isActive ? 'bg-[#fff2e6]' : 'bg-[#f2f1ed]'
                      )}>
                        <Icon className={cn('h-[18px] w-[18px]', isActive ? 'text-[#f58a2d]' : 'text-[#7a786f]')} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-[14px] font-semibold', isActive ? 'text-[#2f2f2d]' : 'text-[#4a4945]')}>
                          {item.label}
                        </p>
                        <p className="text-[11px] text-[#9a978f] truncate">{item.desc}</p>
                      </div>
                      {isActive && (
                        <div className="h-2 w-2 rounded-full bg-[#f58a2d] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Tabs value={activeSettingsTab} onValueChange={setActiveSettingsTab} className="space-y-4">
        {/* Threads-style tab bar: Konto | Familie | Abonnement | ≡ */}
        <div className="sticky top-0 z-10 bg-[#faf9f6] pb-0 pt-1">
          <div className="flex items-center border-b border-[#e5e3dc]">
            {/* Main tabs: Konto + Familie + Abonnement */}
            {[
              { value: 'profile', label: 'Konto' },
              { value: 'family', label: 'Familie' },
              { value: 'subscription', label: 'Abonnement' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveSettingsTab(tab.value)}
                className={cn(
                  'relative flex-1 py-3 text-center text-[14px] font-semibold transition-colors',
                  activeSettingsTab === tab.value
                    ? 'text-[#2f2f2d]'
                    : 'text-[#b0ada4]'
                )}
              >
                {tab.label}
                {activeSettingsTab === tab.value && (
                  <motion.div
                    layoutId="settings-underline"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#2f2f2d] rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </button>
            ))}

            {/* Hamburger icon (right side) */}
            <button
              onClick={() => setSidePanelOpen(true)}
              className="flex items-center justify-center w-11 py-3 text-[#7a786f] hover:text-[#2f2f2d] transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

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
              <div className="space-y-2">
                <Label>Fødselsdato</Label>
                <Input
                  type="date"
                  value={profileDraft.birthDate}
                  onChange={(e) => setProfileDraft((prev) => ({ ...prev, birthDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Alder</Label>
                <Input
                  readOnly
                  disabled
                  value={
                    profileDraft.birthDate
                      ? (calculateAge(profileDraft.birthDate) !== null
                          ? `${calculateAge(profileDraft.birthDate)} år`
                          : '')
                      : ''
                  }
                  placeholder="Beregnes automatisk fra fødselsdato"
                />
              </div>
              <div className="space-y-2">
                <Label>Adresse</Label>
                <Input
                  value={profileDraft.address}
                  onChange={(e) => setProfileDraft((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="Gadenavn og nr."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Postnummer</Label>
                  <Input
                    value={profileDraft.zipCode}
                    onChange={(e) => setProfileDraft((prev) => ({ ...prev, zipCode: e.target.value }))}
                    placeholder="F.eks. 2100"
                  />
                </div>
                <div className="space-y-2">
                  <Label>By</Label>
                  <Input
                    value={profileDraft.city}
                    onChange={(e) => setProfileDraft((prev) => ({ ...prev, city: e.target.value }))}
                    placeholder="F.eks. København"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Land</Label>
                <Input
                  value={profileDraft.country}
                  onChange={(e) => setProfileDraft((prev) => ({ ...prev, country: e.target.value }))}
                  placeholder="Danmark"
                />
              </div>
              <Button onClick={handleSaveProfile} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Gem profil
              </Button>
            </CardContent>
          </Card>

        </TabsContent>

        <TabsContent value="family" className="space-y-4">
          {/* Quick link to family type setting */}
          <button
            onClick={() => setActiveSettingsTab('familytype')}
            className="flex w-full items-center justify-between rounded-2xl border border-[#e5e3dc] bg-white px-4 py-3 text-left transition-colors hover:bg-[#faf9f6]"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f2f1ed]">
                <Home className="h-[18px] w-[18px] text-[#7a786f]" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-[#2f2f2d]">{familyModeLabels[currentMode]}</p>
                <p className="text-[11px] text-[#9a978f]">Tryk for at ændre familietype</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-[#b0ada4]" />
          </button>

          {/* Samboende / Co-parenting section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Heart className="h-4 w-4" />
                {isTogetherMode ? 'Samboende' : 'Co-parenting'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {(() => {
                // Find partner: other parent in household
                const partnerUser = users.find(u =>
                  u.role === 'parent' && u.id !== currentUser?.id
                );
                if (partnerUser) {
                  return (
                    <div className="flex items-center gap-3 rounded-xl border border-[#e5e3dc] bg-white p-3">
                      <Avatar className="h-10 w-10 border border-white shadow-sm">
                        <AvatarImage src={partnerUser.avatar} />
                        <AvatarFallback className="bg-[#ecebe5] text-[#4a4945] text-sm">
                          {partnerUser.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#2f2f2d]">{partnerUser.name}</p>
                        <p className="text-xs text-[#75736b]">{partnerUser.email}</p>
                      </div>
                      <Badge variant="outline" className="text-xs border-green-300 text-green-700 bg-green-50">
                        Tilknyttet
                      </Badge>
                    </div>
                  );
                }
                return (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-dashed border-[#d8d7cf] bg-[#f8f7f3] p-4 text-center">
                      <Users className="h-8 w-8 text-[#b0ada4] mx-auto mb-2" />
                      <p className="text-sm text-[#75736b]">
                        {isTogetherMode
                          ? 'Ingen samboende tilknyttet endnu.'
                          : 'Ingen medforælder tilknyttet endnu.'}
                      </p>
                      <p className="text-xs text-[#9a978f] mt-1">
                        Inviter {isTogetherMode ? 'din samboende' : 'din medforælder'} til appen
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={partnerInviteEmail}
                        onChange={(e) => setPartnerInviteEmail(e.target.value)}
                        placeholder="Email på medforælder"
                        className="flex-1 rounded-xl border-[#d8d7cf]"
                      />
                      <Button
                        className="rounded-xl bg-[#2f2f2f] text-white hover:bg-[#1a1a1a]"
                        disabled={!partnerInviteEmail.trim() || !partnerInviteEmail.includes('@')}
                        onClick={() => {
                          toast.success(`Invitation sendt til ${partnerInviteEmail}`);
                          setPartnerInviteEmail('');
                        }}
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Inviter
                      </Button>
                    </div>
                  </div>
                );
              })()}
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
          {/* Plan cards with included features */}
          {([
            {
              id: 'free' as SubscriptionPlan,
              name: 'Gratis',
              price: '0 kr/md',
              description: 'Grundlæggende co-parenting',
              features: [
                { label: '1 barn', included: true },
                { label: 'Samværsplan', included: true },
                { label: 'Kalender', included: true },
                { label: 'Kommunikation', included: true },
                { label: 'Flere børn', included: false },
                { label: 'Udgiftsmodul', included: false },
                { label: 'Indkøbsscanner', included: false },
              ],
            },
            {
              id: 'family_plus' as SubscriptionPlan,
              name: 'Family Plus',
              price: '49 kr/md',
              description: 'Alt til den aktive familie',
              badge: 'Populær',
              features: [
                { label: 'Op til 8 børn', included: true },
                { label: 'Udgiftsmodul', included: true },
                { label: 'Send/anmod penge', included: true },
                { label: 'Faste udgifter', included: true },
                { label: 'Indkøbsscanner', included: true },
                { label: 'Familiemedlemmer (6)', included: true },
                { label: 'Kalenderdeling', included: true },
                { label: 'Advokatadgang', included: false },
              ],
            },
            {
              id: 'single_parent_plus' as SubscriptionPlan,
              name: 'Enlig Plus',
              price: '79 kr/md',
              description: 'Fuld dokumentation + juridisk',
              features: [
                { label: 'Op til 8 børn', included: true },
                { label: 'Udgiftsmodul', included: true },
                { label: 'Send/anmod penge', included: true },
                { label: 'Faste udgifter', included: true },
                { label: 'Indkøbsscanner', included: true },
                { label: 'Familiemedlemmer (8)', included: true },
                { label: 'Kalenderdeling', included: true },
                { label: 'Advokatadgang', included: true },
                { label: 'Dokumentationsarkiv', included: true },
                { label: 'Auto-arkivér kvitteringer', included: true },
              ],
            },
          ]).map((planCard) => {
            const isActive = plan === planCard.id;
            return (
              <button
                key={planCard.id}
                type="button"
                disabled={checkoutLoading}
                onClick={() => handlePlanChange(planCard.id)}
                className={cn(
                  'relative w-full rounded-2xl border-2 p-4 text-left transition-all',
                  isActive
                    ? 'border-[#f58a2d] bg-[#fff8f0] shadow-[0_2px_12px_rgba(245,138,45,0.12)]'
                    : 'border-[#e0dfd8] bg-white hover:border-[#cccbc3]',
                  checkoutLoading && 'opacity-60 pointer-events-none'
                )}
              >
                {planCard.badge && (
                  <span className="absolute -top-2.5 right-4 rounded-full bg-[#f58a2d] px-3 py-0.5 text-[11px] font-bold text-white">
                    {planCard.badge}
                  </span>
                )}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-bold text-[#2f2f2d]">{planCard.name}</p>
                      {isActive && <BadgeCheck className="h-5 w-5 text-[#f58a2d]" />}
                    </div>
                    <p className="text-xs text-[#78766d]">{planCard.description}</p>
                  </div>
                  <p className="text-right">
                    <span className="text-lg font-bold text-[#2f2f2d]">{planCard.price.split('/')[0]}</span>
                    <span className="text-xs text-[#9b9a93]">/{planCard.price.split('/')[1]}</span>
                  </p>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-1">
                  {planCard.features.map((f) => (
                    <div key={f.label} className="flex items-center gap-2">
                      {f.included ? (
                        <Check className="h-3.5 w-3.5 shrink-0 text-[#f58a2d]" />
                      ) : (
                        <XIcon className="h-3.5 w-3.5 shrink-0 text-[#d0cec5]" />
                      )}
                      <span className={cn('text-xs', f.included ? 'text-[#4a4945]' : 'text-[#b5b3ab]')}>
                        {f.label}
                      </span>
                    </div>
                  ))}
                </div>
                {isActive && (
                  <div className="mt-3 rounded-lg bg-[#f58a2d]/10 px-3 py-1.5 text-center text-xs font-semibold text-[#b96424]">
                    Aktiv plan
                  </div>
                )}
              </button>
            );
          })}

          {/* "Skift plan" CTA for free users */}
          {plan === 'free' && (
            <div className="rounded-2xl border-2 border-dashed border-[#f3c59d] bg-[#fff8f0] p-5 text-center">
              <Star className="h-8 w-8 text-[#f58a2d] mx-auto mb-2" />
              <p className="text-base font-bold text-[#2f2f2d]">Opgrader din plan</p>
              <p className="text-sm text-[#78766d] mt-1 mb-4">
                Få adgang til flere børn, udgiftsmodul, indkøbsscanner og meget mere.
              </p>
              <Button
                className="rounded-2xl bg-[#f58a2d] text-white hover:bg-[#e47921] px-8"
                disabled={checkoutLoading}
                onClick={() => handlePlanChange('family_plus')}
              >
                {checkoutLoading ? (
                  <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <ArrowRight className="h-4 w-4 mr-2" />
                )}
                {checkoutLoading ? 'Åbner betaling...' : 'Skift plan'}
              </Button>
            </div>
          )}

          {/* Administrer abonnement — only when user has real Stripe subscription */}
          {hasStripeCustomer && (
            <div className="rounded-2xl border-2 border-[#e0dfd8] bg-white p-5 text-center space-y-3">
              <p className="text-sm font-semibold text-[#2f2f2d]">Administrer dit abonnement</p>
              <p className="text-xs text-[#78766d]">
                Ændr betalingsmetode, se fakturaer eller annuller dit abonnement.
              </p>
              <Button
                variant="outline"
                className="rounded-2xl border-[#d8d7cf] text-[13px]"
                onClick={handleManageSubscription}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Åbn abonnementsstyring
              </Button>
            </div>
          )}
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

        {currentUser?.isAdmin && (
          <TabsContent value="admin" className="space-y-4">
            <AdminPanel />
          </TabsContent>
        )}

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

        {/* ─── Notifikationer (fra sidepanel) ─── */}
        <TabsContent value="notifications" className="space-y-0">
          {/* Push-notifikationer status */}
          <div className="px-1 pt-2 pb-3">
            <p className="text-xs text-[#75736b]">
              Modtag notifikationer om afleveringer, beskeder og opdateringer.
            </p>
          </div>

          {notifPermission === 'granted' ? (
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between px-1 py-2">
                <p className="text-sm font-medium text-[#2f2f2d]">Push-notifikationer</p>
                <BadgeCheck className="h-4 w-4 text-green-600" />
              </div>
              <div className="space-y-1.5 px-1">
                <Label htmlFor="reminder-minutes" className="text-xs text-[#75736b]">Påmind mig (minutter før aflevering)</Label>
                <Select
                  value={String(handoverReminderMinutes)}
                  onValueChange={(v) => setHandoverReminderMinutes(Number(v))}
                >
                  <SelectTrigger id="reminder-minutes" className="rounded-xl border-[#d8d7cf]">
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
                className="w-full rounded-2xl"
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
            <div className="rounded-xl bg-[#fff6ef] p-3 mb-4">
              <p className="text-sm text-[#b96424]">
                Notifikationer er blokeret. Tillad dem i enhedens indstillinger.
              </p>
            </div>
          ) : (
            <Button
              className="w-full rounded-2xl mb-4"
              onClick={async () => {
                const granted = await requestNotificationPermission();
                setNotifPermission(granted ? 'granted' : 'denied');
                if (granted) {
                  toast.success('Notifikationer aktiveret!');
                } else {
                  toast.error('Notifikationer afvist');
                }
              }}
            >
              <Bell className="mr-2 h-4 w-4" />
              Aktiver notifikationer
            </Button>
          )}

          {/* Notifikationscenter — clean rows without Card wrappers */}
          <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#78766d] px-1 pb-2">Notifikationstyper</p>
          <div className="divide-y divide-[#e5e3dc]">
            <div className="flex items-center justify-between py-3 px-1">
              <div>
                <p className="text-sm font-medium text-[#2f2f2d]">Afleveringspåmindelser</p>
                <p className="text-xs text-[#75736b]">Før hver aflevering</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between py-3 px-1">
              <div>
                <p className="text-sm font-medium text-[#2f2f2d]">Nye beskeder</p>
                <p className="text-xs text-[#75736b]">Dagbog, beslutninger</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between py-3 px-1">
              <div>
                <p className="text-sm font-medium text-[#2f2f2d]">Udgifter & betalinger</p>
                <p className="text-xs text-[#75736b]">Anmodninger og godkendelser</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between py-3 px-1">
              <div>
                <p className="text-sm font-medium text-[#2f2f2d]">Kalenderopdateringer</p>
                <p className="text-xs text-[#75736b]">Nye begivenheder & ændringer</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between py-3 px-1">
              <div>
                <p className="text-sm font-medium text-[#2f2f2d]">Opgaver</p>
                <p className="text-xs text-[#75736b]">Tildelte og forfaldne</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>

          {/* ─── Opsæt påmindelser ─── */}
          <div className="mt-4 mb-2">
            <div className="rounded-2xl border-2 border-[#e5e3dc] bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff2e6]">
                  <Bell className="h-[18px] w-[18px] text-[#f58a2d]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-[#2f2f2d]">Opsæt påmindelser</p>
                  <p className="text-[11px] text-[#9a978f]">Faste notifikationer til madplan, indkøb og rengøring.</p>
                </div>
                <button
                  onClick={() => {
                    setHomeRemindersActive(true);
                    toast.success('Påmindelser aktiveret for madplan, indkøb og rengøring');
                  }}
                  disabled={homeRemindersActive}
                  className={cn(
                    "shrink-0 rounded-xl px-4 py-2 text-[12px] font-bold transition-all active:scale-[0.96]",
                    homeRemindersActive
                      ? "bg-[#e5e3dc] text-[#9a978f]"
                      : "bg-[#f58a2d] text-white"
                  )}
                >
                  {homeRemindersActive ? 'Aktiveret' : 'Aktiver'}
                </button>
              </div>
            </div>
          </div>

          {/* ─── Påmindelser ─── */}
          <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#78766d] px-1 pb-2 pt-3">Påmindelser</p>
          <div className="divide-y divide-[#e5e3dc]">
            <div className="flex items-center justify-between py-3 px-1">
              <div>
                <p className="text-sm font-medium text-[#2f2f2d]">Madplan</p>
                <p className="text-xs text-[#75736b]">Daglig påmindelse om aftensmad</p>
              </div>
              <Switch checked={homeRemindersActive ? true : undefined} defaultChecked />
            </div>
            <div className="flex items-center justify-between py-3 px-1">
              <div>
                <p className="text-sm font-medium text-[#2f2f2d]">Indkøb</p>
                <p className="text-xs text-[#75736b]">Ugentlig indkøbspåmindelse</p>
              </div>
              <Switch checked={homeRemindersActive ? true : undefined} defaultChecked />
            </div>
            <div className="flex items-center justify-between py-3 px-1">
              <div>
                <p className="text-sm font-medium text-[#2f2f2d]">Rengøring</p>
                <p className="text-xs text-[#75736b]">Påmindelser om rengøringsopgaver</p>
              </div>
              <Switch checked={homeRemindersActive ? true : undefined} defaultChecked />
            </div>
          </div>
        </TabsContent>

        {/* ─── Familietype (fra sidepanel) ─── */}
        <TabsContent value="familytype" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Home className="h-4 w-4" />
                Familietype
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="space-y-2">
                <Label>Vælg familietype</Label>
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
                  ? 'Samboende familier deler ét abonnement og ser alt sammen.'
                  : isSingleParentMode
                    ? 'Enlig forsørger har adgang til dokumentation og advokatværktøj.'
                    : 'Skilte familier bruger separate abonnementer og kan dele udvalgt data.'}
              </div>
              <div className="rounded-xl border border-[#f58a2d]/20 bg-[#fff8f0] p-3">
                <p className="text-sm font-medium text-[#b96424]">
                  Aktuel: {familyModeLabels[currentMode]}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Feedback (fra sidepanel) ─── */}
        <TabsContent value="feedback" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-4 w-4" />
                Feedback
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <p className="text-sm text-[#75736b]">
                Vi vil gerne høre din mening! Hjælp os med at forbedre appen.
              </p>

              {/* Star rating */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-[0.05em] text-[#78766d]">
                  Hvor tilfreds er du?
                </Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackDraft(prev => ({ ...prev, rating: star }))}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={cn(
                          'h-8 w-8 transition-colors',
                          star <= feedbackDraft.rating
                            ? 'fill-[#f58a2d] text-[#f58a2d]'
                            : 'text-[#d8d7cf]'
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-[0.05em] text-[#78766d]">
                  Kategori
                </Label>
                <Select
                  value={feedbackDraft.category}
                  onValueChange={(v) => setFeedbackDraft(prev => ({ ...prev, category: v }))}
                >
                  <SelectTrigger className="rounded-xl border-[#d8d7cf]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Generelt</SelectItem>
                    <SelectItem value="bug">Fejl / Bug</SelectItem>
                    <SelectItem value="feature">Ny funktion</SelectItem>
                    <SelectItem value="design">Design / Brugervenlighed</SelectItem>
                    <SelectItem value="calendar">Kalender / Samvær</SelectItem>
                    <SelectItem value="expenses">Udgifter / Økonomi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-[0.05em] text-[#78766d]">
                  Din besked
                </Label>
                <Textarea
                  value={feedbackDraft.message}
                  onChange={(e) => setFeedbackDraft(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Fortæl os hvad du synes, eller hvad vi kan forbedre..."
                  rows={5}
                  className="rounded-xl border-[#d8d7cf]"
                />
              </div>

              <Button
                className="w-full rounded-2xl bg-[#2f2f2f] text-white hover:bg-[#1a1a1a]"
                disabled={!feedbackDraft.message.trim() || feedbackDraft.rating === 0}
                onClick={() => {
                  toast.success('Tak for din feedback! Vi sætter stor pris på det.');
                  setFeedbackDraft({ rating: 0, category: 'general', message: '' });
                }}
              >
                <Send className="mr-2 h-4 w-4" />
                Send feedback
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Visning (fra sidepanel) ─── */}
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Eye className="h-4 w-4" />
                Visning
              </CardTitle>
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
