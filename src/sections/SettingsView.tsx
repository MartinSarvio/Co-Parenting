import { useMemo, useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { requestNotificationPermission, scheduleAllHandoverReminders } from '@/lib/notifications';
import { paymentAccountId, userId as generateUserId } from '@/lib/id';
import {
  BadgeCheck,
  Bell,
  Camera,
  Check,
  CreditCard,
  Link2,
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
  User,
  Handshake,
  UserCircle,
  Shield,
} from 'lucide-react';
import { SavingOverlay } from '@/components/custom/SavingOverlay';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { useAppStore } from '@/store';
import { useApiActions } from '@/hooks/useApiActions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectSheet } from '@/components/custom/SelectSheet';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { IOSSwitch } from '@/components/ui/ios-switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { getPlanFeatures, getSubscriptionPlan, normalizeSubscription } from '@/lib/subscription';
import type { BillingModel, FamilyMemberRole, HouseholdMode, SubscriptionPlan } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Trash2, ShieldAlert, BarChart3, Tag, Newspaper } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EU_ALLERGENS_DA } from '@/lib/allergenMatch';
import { supabase } from '@/lib/supabase';
import { startCheckout, openBillingPortal, fetchStripeStatus, PLAN_PRICES } from '@/lib/stripe';
import type { StripePlan, BillingInterval } from '@/lib/stripe';
import { AdminPanel } from '@/sections/AdminPanel';
import { PlatformAnalyseView } from '@/sections/PlatformAnalyseView';
import { TilbudAdminView } from '@/sections/TilbudAdminView';
import { NyhederAdminView } from '@/sections/NyhederAdminView';

const MALE_AVATARS = ['Anders', 'Lars', 'Mikkel', 'Thomas', 'Frederik', 'Oliver'];
const FEMALE_AVATARS = ['Maria', 'Sofie', 'Emma', 'Anne', 'Camilla', 'Julie'];

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
    children,
    household,
    paymentAccounts,
    documents,
    events,
    isProfessionalView,
    setProfessionalView,
    isFamilyMemberView,
    setFamilyMemberView,
    updateUser,
    updateChild,
    setHousehold,
    addPaymentAccount,
    updatePaymentAccount,
    addFamilyMember,
    removeFamilyMember,
    sideMenuOpen,
    setSideMenuOpen,
    sideMenuContext,
    notificationPreferences,
    activeSettingsTab,
    setActiveSettingsTab,
    settingsDetailView,
    setSettingsDetailView,
  } = useAppStore();
  const { createDocument, saveNotificationPreferences } = useApiActions();

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [profileDraft, setProfileDraft] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    birthDate: (currentUser as any)?.birthDate || '',
    address: (currentUser as any)?.address || '',
    zipCode: (currentUser as any)?.zipCode || '',
    city: (currentUser as any)?.city || '',
    country: (currentUser as any)?.country || 'Danmark',
    organization: currentUser?.organization || '',
    municipality: currentUser?.municipality || '',
    gender: currentUser?.gender || '',
  });
  const [visibilityDraft, setVisibilityDraft] = useState({
    showEmail: currentUser?.profileVisibility?.showEmail ?? false,
    showPhone: currentUser?.profileVisibility?.showPhone ?? false,
    showAddress: currentUser?.profileVisibility?.showAddress ?? false,
    bio: currentUser?.profileVisibility?.bio ?? '',
  });
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const avatarFileRef = useRef<HTMLInputElement>(null);
  const [paymentDraft, setPaymentDraft] = useState({
    provider: 'mobilepay',
    accountLabel: '',
    accountHandle: ''
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
  const sidePanelOpen = sideMenuOpen && sideMenuContext === 'settings';
  const [feedbackDraft, setFeedbackDraft] = useState({
    rating: 0,
    category: 'general',
    message: '',
  });
  const [partnerInviteEmail, setPartnerInviteEmail] = useState('');

  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setNotifPermission(Notification.permission);
    }
  }, []);

  // Keyboard-aware: listen for keyboard show/hide on native
  useEffect(() => {
    let showListener: { remove: () => void } | undefined;
    let hideListener: { remove: () => void } | undefined;
    const setup = async () => {
      try {
        const { Keyboard } = await import('@capacitor/keyboard');
        showListener = await Keyboard.addListener('keyboardWillShow', (info) => {
          setKeyboardHeight(info.keyboardHeight);
        });
        hideListener = await Keyboard.addListener('keyboardWillHide', () => {
          setKeyboardHeight(0);
        });
      } catch {
        // Not on native — ignore
      }
    };
    setup();
    return () => {
      showListener?.remove();
      hideListener?.remove();
    };
  }, []);

  const subscription = normalizeSubscription(household);
  const plan = getSubscriptionPlan(household);
  const features = getPlanFeatures(household, currentUser?.isAdmin);
  const currentMode = household?.familyMode || 'co_parenting';
  const isTogetherMode = currentMode === 'together';
  const allowProfessionalTools = currentUser?.isAdmin === true || currentUser?.role === 'professional';

  const myPaymentAccounts = useMemo(() => {
    if (!currentUser) return [];
    return paymentAccounts.filter((account) => account.userId === currentUser.id);
  }, [paymentAccounts, currentUser]);


  const visibleAvatars = useMemo(() => {
    if (currentUser?.isAdmin) return [...MALE_AVATARS, ...FEMALE_AVATARS];
    if (currentUser?.gender === 'female') return FEMALE_AVATARS;
    if (currentUser?.gender === 'male') return MALE_AVATARS;
    return [...MALE_AVATARS, ...FEMALE_AVATARS]; // fallback: vis alle hvis køn ikke er sat
  }, [currentUser?.isAdmin, currentUser?.gender]);

  const evidenceDocuments = useMemo(() => {
    return documents.filter((document) => (
      document.type === 'authority_document' || document.type === 'court_order'
    ));
  }, [documents]);

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    setIsSaving(true);
    try {
      const profileData = {
        name: profileDraft.name.trim(),
        email: profileDraft.email.trim(),
        phone: profileDraft.phone.trim() || undefined,
        birthDate: profileDraft.birthDate || undefined,
        address: profileDraft.address.trim() || undefined,
        zipCode: profileDraft.zipCode.trim() || undefined,
        city: profileDraft.city.trim() || undefined,
        country: profileDraft.country.trim() || undefined,
        organization: profileDraft.organization.trim() || undefined,
        municipality: profileDraft.municipality.trim() || undefined,
        profileVisibility: {
          showEmail: visibilityDraft.showEmail,
          showPhone: visibilityDraft.showPhone,
          showAddress: visibilityDraft.showAddress,
          bio: visibilityDraft.bio.trim() || undefined,
        },
      };
      updateUser(currentUser.id, profileData as any);
      // Persist profile to Supabase
      await supabase.from('profiles').update(profileData).eq('id', currentUser.id);
      toast.success('Profil gemt');
    } catch {
      toast.error('Kunne ikke gemme profil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarPreset = (seed: string) => {
    if (!currentUser) return;
    const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
    updateUser(currentUser.id, { avatar: url });
    // Persist avatar to Supabase
    supabase.from('profiles').update({ avatar: url }).eq('id', currentUser.id).then(() => {}, () => {});
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

  const handleSaveField = (fields: Record<string, unknown>) => async () => {
    if (!currentUser) return;
    setIsSaving(true);
    try {
      updateUser(currentUser.id, fields as any);
      await supabase.from('profiles').update(fields).eq('id', currentUser.id);
      toast.success('Gemt');
      setSettingsDetailView(null);
    } catch {
      toast.error('Kunne ikke gemme');
    } finally {
      setIsSaving(false);
    }
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
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');

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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Du skal være logget ind for at opgradere');
        setCheckoutLoading(false);
        return;
      }
      await startCheckout(nextPlan as StripePlan, billingInterval);
      // User is redirected to Stripe — this code won't run
    } catch (err: any) {
      console.error('Stripe checkout error:', err);
      const msg = err?.message || 'Ukendt fejl';
      if (msg.includes('401') || msg.includes('udløbet')) {
        toast.error('Din session er udløbet — log ind igen');
      } else {
        toast.error(`Betaling fejlede: ${msg}`);
      }
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
        const currentPlan = household?.subscription?.plan;
        const currentStatus = household?.subscription?.status;
        if (household && status.plan !== 'free' && (status.plan !== currentPlan || currentStatus !== 'active')) {
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

    createDocument({
      title: evidenceDraft.title.trim(),
      type: 'authority_document',
      url: evidenceDraft.url.trim(),
      sharedWith: [currentUser.id],
      isOfficial: true,
    });

    setEvidenceDraft({ title: '', url: '', description: '' });
    toast.success('Dokumentation gemt i arkivet');
  };

  return (
    <div className="space-y-1.5 py-1">
      {/* ─── Side panel (OverblikSidePanel-stil) — portal to escape max-w container ─── */}
      {createPortal(
      <AnimatePresence>
        {sidePanelOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[9998] bg-black/30"
              onClick={() => setSideMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="fixed inset-y-0 left-0 z-[9999] w-full bg-card flex flex-col"
              style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
            >
              <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                <h2 className="text-[17px] font-bold text-foreground">Indstillinger</h2>
                <button
                  onClick={() => setSideMenuOpen(false)}
                  className="flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-2 pb-[env(safe-area-inset-bottom,0px)]">
                {[
                  { value: 'profile', label: 'Konto', icon: User },
                  { value: 'subscription', label: 'Abonnement', icon: BadgeCheck },
                  { value: 'notifications', label: 'Notifikationer', icon: Bell },
                  // Følgende tabs skjules i professionelt mode
                  ...(!isProfessionalView ? [
                    { value: 'familytype', label: 'Familietype', icon: Home },
                    { value: 'appearance', label: 'Visning', icon: Eye },
                    { value: 'payments', label: 'Betaling', icon: CreditCard },
                    { value: 'members', label: 'Medlemmer', icon: Users },
                  ] : []),
                  { value: 'feedback', label: 'Feedback', icon: MessageSquare },
                  { value: 'info', label: 'Info', icon: Shield },
                  ...(!isProfessionalView && currentUser?.isAdmin
                    ? [
                        { value: 'platform-analyse', label: 'Analyse', icon: BarChart3 },
                        { value: 'tilbud-admin', label: 'Tilbuds-admin', icon: Tag },
                        { value: 'nyheder-admin', label: 'Nyheder', icon: Newspaper },
                        { value: 'admin', label: 'Admin', icon: ShieldAlert },
                      ]
                    : []),
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSettingsTab === item.value;
                  return (
                    <button
                      key={item.value}
                      onClick={() => {
                        setActiveSettingsTab(item.value);
                        setSettingsDetailView(null);
                        setSideMenuOpen(false);
                      }}
                      className={cn(
                        'flex w-full items-center gap-3.5 px-5 py-3.5 text-left transition-colors',
                        isActive ? 'bg-transparent' : 'hover:bg-card'
                      )}
                    >
                      <Icon className={cn('h-5 w-5 shrink-0', isActive ? 'text-[#f58a2d]' : 'text-muted-foreground')} />
                      <p className={cn(
                        'flex-1 min-w-0 text-[15px] font-semibold',
                        isActive ? 'text-foreground' : 'text-foreground'
                      )}>
                        {item.label}
                      </p>
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
      </AnimatePresence>,
      document.body
      )}

      <Tabs value={activeSettingsTab} onValueChange={setActiveSettingsTab} className="space-y-2">

        <TabsContent value="profile" className="space-y-2">
          {/* Avatar section — only on main page */}
          {!settingsDetailView && (
          <div className="flex flex-col items-center gap-3 py-5">
              <button
                onClick={() => setAvatarDialogOpen(true)}
                className="group relative"
              >
                <Avatar className="h-20 w-20 border-2 border-border shadow-sm">
                  <AvatarImage src={currentUser?.avatar} />
                  <AvatarFallback className="bg-secondary text-2xl font-semibold text-foreground">
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
          </div>
          )}

          {/* Avatar picker dialog */}
          <Dialog open={avatarDialogOpen} onOpenChange={setAvatarDialogOpen}>
            <DialogContent className="max-w-sm rounded-3xl border-border bg-card">
              <DialogHeader>
                <DialogTitle className="text-[1rem] text-foreground">Vælg profilbillede</DialogTitle>
              </DialogHeader>
              <div className="space-y-2">
                {/* Upload own photo */}
                <button
                  onClick={() => avatarFileRef.current?.click()}
                  className="flex w-full items-center gap-3 rounded-[8px] border-2 border-dashed border-border bg-card px-4 py-3 text-left transition-colors hover:border-[#f58a2d] hover:bg-orange-tint-light"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-tint">
                    <Upload className="h-5 w-5 text-[#f58a2d]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Upload eget billede</p>
                    <p className="text-[11px] text-muted-foreground">JPG eller PNG, maks 2 MB</p>
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
                  <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">Eller vælg en avatar</p>
                  <div className="grid grid-cols-4 gap-3">
                    {visibleAvatars.map(seed => {
                      const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
                      const isSelected = currentUser?.avatar === url;
                      return (
                        <button
                          key={seed}
                          onClick={() => handleAvatarPreset(seed)}
                          className={cn(
                            "flex flex-col items-center gap-1 rounded-[8px] p-2 transition-all",
                            isSelected
                              ? "bg-orange-tint ring-2 ring-ring"
                              : "hover:bg-muted"
                          )}
                        >
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={url} />
                            <AvatarFallback>{seed[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-[10px] text-muted-foreground">{seed}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <AnimatePresence mode="wait">
          {!settingsDetailView ? (
            <motion.div
              key="profile-main"
              initial={{ x: 0, opacity: 1 }}
              exit={{ x: -60, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="space-y-2"
            >
              {/* ─── Profil navigation list ─── */}
              <div className="divide-y divide-border">
                {[
                  { id: 'edit-name', label: 'Navn', value: profileDraft.name || '–' },
                  { id: 'edit-email', label: 'Email', value: profileDraft.email || '–' },
                  { id: 'edit-phone', label: 'Telefon', value: profileDraft.phone || '–' },
                  { id: 'edit-birthday', label: 'Fødselsdag', value: profileDraft.birthDate ? (calculateAge(profileDraft.birthDate) !== null ? `${profileDraft.birthDate} (${calculateAge(profileDraft.birthDate)} år)` : profileDraft.birthDate) : '–' },
                  { id: 'edit-gender', label: 'Køn', value: profileDraft.gender === 'male' ? 'Mand' : profileDraft.gender === 'female' ? 'Kvinde' : '–' },
                  { id: 'edit-address', label: 'Adresse', value: [profileDraft.address, profileDraft.zipCode, profileDraft.city].filter(Boolean).join(', ') || '–' },
                  { id: 'edit-country', label: 'Land', value: profileDraft.country || '–' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSettingsDetailView(item.id)}
                    className="flex w-full items-center justify-between py-3.5 px-1 text-left transition-colors hover:bg-card"
                  >
                    <div className="min-w-0">
                      <p className="text-[15px] font-medium text-foreground">{item.label}</p>
                      <p className="text-[13px] text-muted-foreground truncate">{item.value}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                  </button>
                ))}
              </div>

              <div className="border-t border-border" />

              {/* ─── Familiens allergener — single nav row ─── */}
              <div className="divide-y divide-border">
                <button
                  onClick={() => setSettingsDetailView('allergen-list')}
                  className="flex w-full items-center justify-between py-3.5 px-1 text-left transition-colors hover:bg-card"
                >
                  <div>
                    <p className="text-[15px] font-medium text-foreground">Familiens allergener</p>
                    <p className="text-[13px] text-muted-foreground">Administrer allergener for hele familien</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                </button>
              </div>

              <div className="border-t border-border" />

              <div className="divide-y divide-border">
                  <button
                    onClick={() => setSettingsDetailView('edit-export')}
                    className="flex w-full items-center justify-between py-3.5 px-1 text-left transition-colors hover:bg-card"
                  >
                    <div>
                      <p className="text-[15px] font-medium text-foreground">Eksporter mine data</p>
                      <p className="text-[13px] text-muted-foreground">Download alle dine data (GDPR)</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                  <button
                    onClick={() => setSettingsDetailView('edit-delete')}
                    className="flex w-full items-center justify-between py-3.5 px-1 text-left transition-colors hover:bg-card"
                  >
                    <div>
                      <p className="text-[15px] font-medium text-foreground">Slet min konto</p>
                      <p className="text-[13px] text-muted-foreground">Alle persondata anonymiseres permanent</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
              </div>

              {/* ─── Log ud ─── */}
              <button
                onClick={async () => {
                  const { logoutUser } = await import('@/lib/auth');
                  await logoutUser();
                  window.location.reload();
                }}
                className="flex w-full items-center justify-center py-3.5 text-[15px] font-semibold text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950/20 mt-4 rounded-[8px]"
              >
                Log ud
              </button>
            </motion.div>
          ) : (
            <motion.div
              key={settingsDetailView}
              initial={{ x: 60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 60, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              {/* ─── edit-name ─── */}
              {settingsDetailView === 'edit-name' && (
                <div className="min-h-[calc(100vh-280px)] flex flex-col" style={{ paddingBottom: keyboardHeight > 0 ? keyboardHeight : undefined }}>
                  <div className="space-y-4">
                    <h2 className="text-[28px] font-bold text-foreground pb-2">Navn</h2>
                    <Input value={profileDraft.name} onChange={(e) => setProfileDraft(prev => ({ ...prev, name: e.target.value }))} className="rounded-[12px] border-border bg-card px-4 py-3 text-[15px]" />
                  </div>
                  <div className="flex-1 flex items-center justify-center py-8">
                    <svg width="260" height="200" viewBox="0 0 260 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="n-skin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFDDAA"/><stop offset="1" stopColor="#FFBB77"/></linearGradient>
                        <linearGradient id="n-skin2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#FFDDAA"/><stop offset="1" stopColor="#FFBB77"/></linearGradient>
                        <linearGradient id="n-hair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8D6E63"/><stop offset="1" stopColor="#5D4037"/></linearGradient>
                        <linearGradient id="n-shirt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFB74D"/><stop offset="0.5" stopColor="#F5A623"/><stop offset="1" stopColor="#E8841A"/></linearGradient>
                        <linearGradient id="n-pants" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5C6BC0"/><stop offset="1" stopColor="#3949AB"/></linearGradient>
                        <linearGradient id="n-badge" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF"/><stop offset="1" stopColor="#FFF3E0"/></linearGradient>
                        <linearGradient id="n-badgeTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFB74D"/><stop offset="1" stopColor="#F5A623"/></linearGradient>
                        <filter id="n-shadow"><feDropShadow dx="0" dy="5" stdDeviation="7" floodOpacity="0.15"/></filter>
                        <filter id="n-softshadow"><feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.1"/></filter>
                      </defs>
                      {/* Background sparkles */}
                      <rect x="30" y="40" width="7" height="7" rx="1" fill="#FFB74D" opacity="0.25" transform="rotate(45 33 43)"/>
                      <circle cx="220" cy="55" r="4" fill="#F5A623" opacity="0.2"/>
                      <rect x="200" y="160" width="6" height="6" rx="1" fill="#FFB74D" opacity="0.2" transform="rotate(45 203 163)"/>
                      <circle cx="40" cy="150" r="3" fill="#FFA726" opacity="0.2"/>
                      <rect x="215" y="110" width="5" height="5" rx="1" fill="#F5A623" opacity="0.18" transform="rotate(45 217 112)"/>
                      {/* Ground shadow */}
                      <ellipse cx="128" cy="191" rx="58" ry="7" fill="#000" opacity="0.08"/>
                      {/* Left arm (behind body, holding badge) */}
                      <path d="M103 132 Q82 142 70 158" stroke="url(#n-skin2)" strokeWidth="13" strokeLinecap="round" fill="none"/>
                      {/* Name badge held in left hand */}
                      <rect x="40" y="148" width="58" height="44" rx="9" fill="url(#n-badge)" stroke="#F5A623" strokeWidth="2" filter="url(#n-softshadow)"/>
                      <rect x="40" y="148" width="58" height="14" rx="9" fill="url(#n-badgeTop)"/>
                      <rect x="40" y="157" width="58" height="5" fill="url(#n-badgeTop)"/>
                      {/* Badge lanyard hole */}
                      <circle cx="69" cy="148" r="4" fill="white" stroke="#F5A623" strokeWidth="1.5"/>
                      {/* Badge lines */}
                      <rect x="48" y="172" width="34" height="5" rx="2.5" fill="#FFB74D" opacity="0.7"/>
                      <rect x="48" y="181" width="24" height="4" rx="2" fill="#FFE0B2" opacity="0.8"/>
                      {/* Badge shine */}
                      <rect x="44" y="150" width="12" height="5" rx="2" fill="white" opacity="0.25"/>
                      {/* Pants */}
                      <rect x="104" y="160" width="16" height="26" rx="8" fill="url(#n-pants)"/>
                      <rect x="126" y="160" width="16" height="26" rx="8" fill="url(#n-pants)"/>
                      <rect x="104" y="160" width="38" height="6" rx="3" fill="#3949AB" opacity="0.5"/>
                      {/* Shoes */}
                      <rect x="101" y="182" width="22" height="9" rx="5" fill="#212121"/>
                      <rect x="123" y="182" width="22" height="9" rx="5" fill="#212121"/>
                      <rect x="103" y="182" width="14" height="3" rx="1.5" fill="white" opacity="0.12"/>
                      <rect x="125" y="182" width="14" height="3" rx="1.5" fill="white" opacity="0.12"/>
                      {/* Body/shirt */}
                      <rect x="100" y="120" width="56" height="46" rx="16" fill="url(#n-shirt)" filter="url(#n-shadow)"/>
                      {/* Shirt collar */}
                      <path d="M118 120 L128 132 L138 120" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.4"/>
                      {/* Shirt sleeve folds */}
                      <path d="M100 135 Q96 138 95 143" stroke="#E8841A" strokeWidth="1.5" fill="none" opacity="0.5"/>
                      <path d="M156 135 Q160 138 161 143" stroke="#E8841A" strokeWidth="1.5" fill="none" opacity="0.5"/>
                      {/* Shirt shine */}
                      <ellipse cx="115" cy="128" rx="8" ry="5" fill="white" opacity="0.12"/>
                      {/* Right arm */}
                      <path d="M154 132 Q172 140 178 152" stroke="url(#n-skin2)" strokeWidth="13" strokeLinecap="round" fill="none"/>
                      {/* Right hand */}
                      <circle cx="178" cy="154" r="7" fill="url(#n-skin)"/>
                      {/* Left hand */}
                      <circle cx="70" cy="160" r="7" fill="url(#n-skin)"/>
                      {/* Neck */}
                      <rect x="120" y="114" width="16" height="10" rx="4" fill="url(#n-skin)"/>
                      {/* Ears */}
                      <ellipse cx="103" cy="100" rx="5" ry="7" fill="#FFCC88"/>
                      <ellipse cx="149" cy="100" rx="5" ry="7" fill="#FFCC88"/>
                      <ellipse cx="103" cy="100" rx="3" ry="5" fill="#FFB870" opacity="0.6"/>
                      <ellipse cx="149" cy="100" rx="3" ry="5" fill="#FFB870" opacity="0.6"/>
                      {/* Head */}
                      <circle cx="126" cy="98" r="26" fill="url(#n-skin)" filter="url(#n-shadow)"/>
                      {/* Head highlight */}
                      <circle cx="118" cy="89" r="8" fill="white" opacity="0.18"/>
                      {/* Hair — back layer */}
                      <ellipse cx="126" cy="76" rx="24" ry="12" fill="#5D4037"/>
                      {/* Hair — main */}
                      <ellipse cx="126" cy="75" rx="23" ry="11" fill="url(#n-hair)"/>
                      <rect x="103" y="75" width="12" height="18" rx="6" fill="url(#n-hair)"/>
                      <rect x="137" y="75" width="12" height="18" rx="6" fill="url(#n-hair)"/>
                      {/* Hair highlight stripe */}
                      <path d="M115 68 Q124 64 133 68" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.15"/>
                      {/* Eyebrows */}
                      <path d="M114 91 Q117 88 120 91" stroke="#5D4037" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                      <path d="M132 91 Q135 88 138 91" stroke="#5D4037" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                      {/* Eyes */}
                      <circle cx="117" cy="97" r="4" fill="#2C1810"/>
                      <circle cx="135" cy="97" r="4" fill="#2C1810"/>
                      <circle cx="119" cy="95" r="1.5" fill="white" opacity="0.9"/>
                      <circle cx="137" cy="95" r="1.5" fill="white" opacity="0.9"/>
                      {/* Mouth — teeth hint behind smile */}
                      <path d="M119 108 Q126 114 133 108" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.5"/>
                      <path d="M119 108 Q126 115 133 108" stroke="#C67B3A" strokeWidth="2" strokeLinecap="round" fill="none"/>
                      {/* Cheeks */}
                      <ellipse cx="111" cy="104" rx="5" ry="3" fill="#FFB0A0" opacity="0.35"/>
                      <ellipse cx="141" cy="104" rx="5" ry="3" fill="#FFB0A0" opacity="0.35"/>
                    </svg>
                  </div>
                  <Button onClick={handleSaveField({ name: profileDraft.name.trim() })} className="w-full shrink-0 rounded-[12px] py-3" disabled={isSaving}>
                    Gem
                  </Button>
                </div>
              )}

              {/* ─── edit-email ─── */}
              {settingsDetailView === 'edit-email' && (
                <div className="min-h-[calc(100vh-280px)] flex flex-col" style={{ paddingBottom: keyboardHeight > 0 ? keyboardHeight : undefined }}>
                  <div className="space-y-4">
                    <h2 className="text-[28px] font-bold text-foreground pb-2">Email</h2>
                    <Input type="email" value={profileDraft.email} onChange={(e) => setProfileDraft(prev => ({ ...prev, email: e.target.value }))} className="rounded-[12px] border-border bg-card px-4 py-3 text-[15px]" />
                  </div>
                  <div className="flex-1 flex items-center justify-center py-8">
                    <svg width="260" height="200" viewBox="0 0 260 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="em-skin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFDDAA"/><stop offset="1" stopColor="#FFBB77"/></linearGradient>
                        <linearGradient id="em-skin2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#FFDDAA"/><stop offset="1" stopColor="#FFBB77"/></linearGradient>
                        <linearGradient id="em-hair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8D6E63"/><stop offset="1" stopColor="#5D4037"/></linearGradient>
                        <linearGradient id="em-shirt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#64B5F6"/><stop offset="0.5" stopColor="#42A5F5"/><stop offset="1" stopColor="#1565C0"/></linearGradient>
                        <linearGradient id="em-pants" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#37474F"/><stop offset="1" stopColor="#263238"/></linearGradient>
                        <linearGradient id="em-env" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E3F2FD"/><stop offset="1" stopColor="#BBDEFB"/></linearGradient>
                        <filter id="em-shadow"><feDropShadow dx="0" dy="5" stdDeviation="7" floodOpacity="0.15"/></filter>
                        <filter id="em-softshadow"><feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.1"/></filter>
                      </defs>
                      {/* Background sparkles */}
                      <rect x="28" y="50" width="7" height="7" rx="1" fill="#42A5F5" opacity="0.2" transform="rotate(45 31 53)"/>
                      <circle cx="225" cy="65" r="4" fill="#64B5F6" opacity="0.25"/>
                      <rect x="210" y="155" width="6" height="6" rx="1" fill="#1E88E5" opacity="0.2" transform="rotate(45 213 158)"/>
                      <circle cx="32" cy="148" r="3" fill="#42A5F5" opacity="0.2"/>
                      {/* Ground shadow */}
                      <ellipse cx="107" cy="191" rx="54" ry="7" fill="#000" opacity="0.08"/>
                      {/* Left arm down */}
                      <path d="M83 132 Q66 142 62 156" stroke="url(#em-skin2)" strokeWidth="13" strokeLinecap="round" fill="none"/>
                      {/* Pants */}
                      <rect x="86" y="160" width="15" height="26" rx="8" fill="url(#em-pants)"/>
                      <rect x="106" y="160" width="15" height="26" rx="8" fill="url(#em-pants)"/>
                      <rect x="86" y="160" width="35" height="6" rx="3" fill="#1A2327" opacity="0.5"/>
                      {/* Shoes */}
                      <rect x="83" y="181" width="21" height="9" rx="5" fill="#111"/>
                      <rect x="104" y="181" width="21" height="9" rx="5" fill="#111"/>
                      <rect x="85" y="181" width="13" height="3" rx="1.5" fill="white" opacity="0.12"/>
                      <rect x="106" y="181" width="13" height="3" rx="1.5" fill="white" opacity="0.12"/>
                      {/* Body/shirt */}
                      <rect x="80" y="120" width="54" height="46" rx="16" fill="url(#em-shirt)" filter="url(#em-shadow)"/>
                      {/* Collar */}
                      <path d="M97 120 L107 131 L117 120" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.35"/>
                      {/* Shirt shine */}
                      <ellipse cx="94" cy="130" rx="7" ry="4" fill="white" opacity="0.12"/>
                      {/* Sleeve folds */}
                      <path d="M80 137 Q76 141 76 146" stroke="#1565C0" strokeWidth="1.5" fill="none" opacity="0.45"/>
                      {/* Right arm reaching toward envelope */}
                      <path d="M132 127 Q152 121 165 126" stroke="url(#em-skin2)" strokeWidth="13" strokeLinecap="round" fill="none"/>
                      {/* Right hand */}
                      <circle cx="165" cy="128" r="7" fill="url(#em-skin)"/>
                      {/* Left hand */}
                      <circle cx="62" cy="157" r="7" fill="url(#em-skin)"/>
                      {/* Flying envelope — 3D */}
                      <rect x="148" y="96" width="76" height="54" rx="10" fill="url(#em-env)" stroke="#64B5F6" strokeWidth="2" filter="url(#em-softshadow)"/>
                      {/* Envelope flap */}
                      <path d="M148 106 L186 129 L224 106" stroke="#64B5F6" strokeWidth="2.5" fill="none"/>
                      <path d="M148 150 L172 133" stroke="#90CAF9" strokeWidth="1.8" fill="none"/>
                      <path d="M224 150 L200 133" stroke="#90CAF9" strokeWidth="1.8" fill="none"/>
                      {/* Envelope shine */}
                      <rect x="152" y="99" width="20" height="6" rx="3" fill="white" opacity="0.3"/>
                      {/* @ symbol on envelope */}
                      <circle cx="186" cy="122" r="10" stroke="#42A5F5" strokeWidth="2" fill="none"/>
                      <circle cx="186" cy="122" r="4.5" fill="#42A5F5" opacity="0.3"/>
                      <path d="M190 118 L191 126" stroke="#42A5F5" strokeWidth="2" strokeLinecap="round"/>
                      {/* Motion lines */}
                      <path d="M137 108 L147 108" stroke="#42A5F5" strokeWidth="2" strokeDasharray="3 2" opacity="0.5"/>
                      <path d="M135 118 L147 118" stroke="#42A5F5" strokeWidth="2" strokeDasharray="3 2" opacity="0.35"/>
                      <path d="M138 128 L147 128" stroke="#42A5F5" strokeWidth="2" strokeDasharray="3 2" opacity="0.25"/>
                      {/* Neck */}
                      <rect x="99" y="114" width="16" height="10" rx="4" fill="url(#em-skin)"/>
                      {/* Ears */}
                      <ellipse cx="82" cy="99" rx="5" ry="7" fill="#FFCC88"/>
                      <ellipse cx="128" cy="99" rx="5" ry="7" fill="#FFCC88"/>
                      <ellipse cx="82" cy="99" rx="3" ry="5" fill="#FFB870" opacity="0.6"/>
                      <ellipse cx="128" cy="99" rx="3" ry="5" fill="#FFB870" opacity="0.6"/>
                      {/* Head */}
                      <circle cx="105" cy="97" r="26" fill="url(#em-skin)" filter="url(#em-shadow)"/>
                      <circle cx="97" cy="88" r="9" fill="white" opacity="0.18"/>
                      {/* Hair — back */}
                      <ellipse cx="105" cy="75" rx="24" ry="12" fill="#5D4037"/>
                      {/* Hair — main */}
                      <ellipse cx="105" cy="74" rx="23" ry="11" fill="url(#em-hair)"/>
                      <rect x="82" y="74" width="12" height="18" rx="6" fill="url(#em-hair)"/>
                      <rect x="117" y="74" width="12" height="18" rx="6" fill="url(#em-hair)"/>
                      {/* Hair highlight */}
                      <path d="M94 67 Q103 63 112 67" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.15"/>
                      {/* Eyebrows */}
                      <path d="M93 90 Q96 87 99 90" stroke="#5D4037" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                      <path d="M111 90 Q114 87 117 90" stroke="#5D4037" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                      {/* Eyes */}
                      <circle cx="96" cy="96" r="4" fill="#2C1810"/>
                      <circle cx="114" cy="96" r="4" fill="#2C1810"/>
                      <circle cx="98" cy="94" r="1.5" fill="white" opacity="0.9"/>
                      <circle cx="116" cy="94" r="1.5" fill="white" opacity="0.9"/>
                      {/* Mouth */}
                      <path d="M98 107 Q105 113 112 107" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.4"/>
                      <path d="M98 107 Q105 114 112 107" stroke="#C67B3A" strokeWidth="2" strokeLinecap="round" fill="none"/>
                      {/* Cheeks */}
                      <ellipse cx="90" cy="103" rx="5" ry="3" fill="#FFB0A0" opacity="0.35"/>
                      <ellipse cx="120" cy="103" rx="5" ry="3" fill="#FFB0A0" opacity="0.35"/>
                    </svg>
                  </div>
                  <Button onClick={handleSaveField({ email: profileDraft.email.trim() })} className="w-full shrink-0 rounded-[12px] py-3" disabled={isSaving}>
                    Gem
                  </Button>
                </div>
              )}

              {/* ─── edit-phone ─── */}
              {settingsDetailView === 'edit-phone' && (
                <div className="min-h-[calc(100vh-280px)] flex flex-col" style={{ paddingBottom: keyboardHeight > 0 ? keyboardHeight : undefined }}>
                  <div className="space-y-4">
                    <h2 className="text-[28px] font-bold text-foreground pb-2">Telefon</h2>
                    <Input value={profileDraft.phone} onChange={(e) => setProfileDraft(prev => ({ ...prev, phone: e.target.value }))} placeholder="+45 ..." className="rounded-[12px] border-border bg-card px-4 py-3 text-[15px]" />
                  </div>
                  <div className="flex-1 flex items-center justify-center py-8">
                    <svg width="260" height="200" viewBox="0 0 260 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="ph-skin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFDDAA"/><stop offset="1" stopColor="#FFBB77"/></linearGradient>
                        <linearGradient id="ph-skin2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#FFDDAA"/><stop offset="1" stopColor="#FFBB77"/></linearGradient>
                        <linearGradient id="ph-hair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8D6E63"/><stop offset="1" stopColor="#5D4037"/></linearGradient>
                        <linearGradient id="ph-shirt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9FA8DA"/><stop offset="0.5" stopColor="#7986CB"/><stop offset="1" stopColor="#3F51B5"/></linearGradient>
                        <linearGradient id="ph-pants" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4A148C"/><stop offset="1" stopColor="#311B92"/></linearGradient>
                        <linearGradient id="ph-phone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ECEFF1"/><stop offset="1" stopColor="#B0BEC5"/></linearGradient>
                        <linearGradient id="ph-screen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E8EAF6"/><stop offset="1" stopColor="#C5CAE9"/></linearGradient>
                        <filter id="ph-shadow"><feDropShadow dx="0" dy="5" stdDeviation="7" floodOpacity="0.15"/></filter>
                        <filter id="ph-softshadow"><feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.1"/></filter>
                      </defs>
                      {/* Background sparkles */}
                      <rect x="32" y="42" width="7" height="7" rx="1" fill="#7986CB" opacity="0.22" transform="rotate(45 35 45)"/>
                      <circle cx="226" cy="72" r="4" fill="#5C6BC0" opacity="0.2"/>
                      <rect x="28" y="148" width="6" height="6" rx="1" fill="#9FA8DA" opacity="0.22" transform="rotate(45 31 151)"/>
                      <circle cx="218" cy="160" r="3" fill="#7986CB" opacity="0.2"/>
                      <rect x="215" y="48" width="5" height="5" rx="1" fill="#5C6BC0" opacity="0.18" transform="rotate(45 217 50)"/>
                      {/* Ground shadow */}
                      <ellipse cx="115" cy="191" rx="56" ry="7" fill="#000" opacity="0.08"/>
                      {/* Left arm down */}
                      <path d="M92 132 Q74 142 70 156" stroke="url(#ph-skin2)" strokeWidth="13" strokeLinecap="round" fill="none"/>
                      {/* Left hand */}
                      <circle cx="70" cy="157" r="7" fill="url(#ph-skin)"/>
                      {/* Pants */}
                      <rect x="96" y="161" width="16" height="26" rx="8" fill="url(#ph-pants)"/>
                      <rect x="117" y="161" width="16" height="26" rx="8" fill="url(#ph-pants)"/>
                      <rect x="96" y="161" width="37" height="6" rx="3" fill="#1A0050" opacity="0.5"/>
                      {/* Shoes */}
                      <rect x="93" y="182" width="22" height="9" rx="5" fill="#111"/>
                      <rect x="114" y="182" width="22" height="9" rx="5" fill="#111"/>
                      <rect x="95" y="182" width="14" height="3" rx="1.5" fill="white" opacity="0.12"/>
                      <rect x="116" y="182" width="14" height="3" rx="1.5" fill="white" opacity="0.12"/>
                      {/* Body/shirt */}
                      <rect x="88" y="120" width="56" height="47" rx="16" fill="url(#ph-shirt)" filter="url(#ph-shadow)"/>
                      {/* Collar V */}
                      <path d="M106 120 L116 132 L126 120" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.35"/>
                      {/* Shirt shine */}
                      <ellipse cx="102" cy="130" rx="7" ry="4" fill="white" opacity="0.12"/>
                      {/* Sleeve fold */}
                      <path d="M88 138 Q84 142 84 147" stroke="#3F51B5" strokeWidth="1.5" fill="none" opacity="0.45"/>
                      {/* Right arm raised holding phone */}
                      <path d="M142 126 Q162 117 166 106" stroke="url(#ph-skin2)" strokeWidth="13" strokeLinecap="round" fill="none"/>
                      {/* Right hand */}
                      <circle cx="166" cy="104" r="7" fill="url(#ph-skin)"/>
                      {/* Smartphone — 3D body */}
                      <rect x="149" y="52" width="58" height="96" rx="13" fill="url(#ph-phone)" stroke="#7986CB" strokeWidth="2" filter="url(#ph-softshadow)"/>
                      {/* Phone side highlight */}
                      <rect x="149" y="55" width="5" height="90" rx="3" fill="white" opacity="0.15"/>
                      {/* Phone notch / camera bar */}
                      <rect x="167" y="57" width="22" height="4" rx="2" fill="#9FA8DA"/>
                      <circle cx="176" cy="59" r="2" fill="#7986CB"/>
                      {/* Phone screen */}
                      <rect x="155" y="67" width="46" height="68" rx="5" fill="url(#ph-screen)"/>
                      {/* Screen shine */}
                      <rect x="157" y="69" width="16" height="4" rx="2" fill="white" opacity="0.3"/>
                      {/* Home button */}
                      <circle cx="178" cy="148" r="5" stroke="#7986CB" strokeWidth="2" fill="none"/>
                      {/* Chat bubbles on screen */}
                      <rect x="158" y="73" width="30" height="15" rx="7.5" fill="#7986CB"/>
                      <circle cx="159" cy="88" r="4" fill="#7986CB"/>
                      <rect x="163" y="96" width="26" height="14" rx="7" fill="white" stroke="#C5CAE9" strokeWidth="1"/>
                      <circle cx="188" cy="110" r="4" fill="white" stroke="#C5CAE9" strokeWidth="1"/>
                      <rect x="158" y="117" width="22" height="12" rx="6" fill="#7986CB" opacity="0.7"/>
                      {/* Chat text lines */}
                      <rect x="162" y="77" width="18" height="2.5" rx="1.25" fill="white" opacity="0.6"/>
                      <rect x="162" y="82" width="12" height="2.5" rx="1.25" fill="white" opacity="0.4"/>
                      {/* Signal arcs */}
                      <path d="M210 62 Q219 54 228 62" stroke="#7986CB" strokeWidth="2" fill="none" opacity="0.5"/>
                      <path d="M207 54 Q219 43 231 54" stroke="#7986CB" strokeWidth="2" fill="none" opacity="0.3"/>
                      {/* Neck */}
                      <rect x="107" y="114" width="16" height="10" rx="4" fill="url(#ph-skin)"/>
                      {/* Ears */}
                      <ellipse cx="89" cy="99" rx="5" ry="7" fill="#FFCC88"/>
                      <ellipse cx="141" cy="99" rx="5" ry="7" fill="#FFCC88"/>
                      <ellipse cx="89" cy="99" rx="3" ry="5" fill="#FFB870" opacity="0.6"/>
                      <ellipse cx="141" cy="99" rx="3" ry="5" fill="#FFB870" opacity="0.6"/>
                      {/* Head */}
                      <circle cx="115" cy="97" r="26" fill="url(#ph-skin)" filter="url(#ph-shadow)"/>
                      <circle cx="107" cy="88" r="9" fill="white" opacity="0.18"/>
                      {/* Hair back */}
                      <ellipse cx="115" cy="75" rx="24" ry="12" fill="#5D4037"/>
                      {/* Hair main */}
                      <ellipse cx="115" cy="74" rx="23" ry="11" fill="url(#ph-hair)"/>
                      <rect x="92" y="74" width="12" height="18" rx="6" fill="url(#ph-hair)"/>
                      <rect x="127" y="74" width="12" height="18" rx="6" fill="url(#ph-hair)"/>
                      {/* Hair highlight */}
                      <path d="M104 67 Q113 63 122 67" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.15"/>
                      {/* Eyebrows */}
                      <path d="M103 90 Q106 87 109 90" stroke="#5D4037" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                      <path d="M121 90 Q124 87 127 90" stroke="#5D4037" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                      {/* Eyes */}
                      <circle cx="106" cy="96" r="4" fill="#2C1810"/>
                      <circle cx="124" cy="96" r="4" fill="#2C1810"/>
                      <circle cx="108" cy="94" r="1.5" fill="white" opacity="0.9"/>
                      <circle cx="126" cy="94" r="1.5" fill="white" opacity="0.9"/>
                      {/* Mouth */}
                      <path d="M108 107 Q115 113 122 107" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.4"/>
                      <path d="M108 107 Q115 114 122 107" stroke="#C67B3A" strokeWidth="2" strokeLinecap="round" fill="none"/>
                      {/* Cheeks */}
                      <ellipse cx="100" cy="103" rx="5" ry="3" fill="#FFB0A0" opacity="0.35"/>
                      <ellipse cx="130" cy="103" rx="5" ry="3" fill="#FFB0A0" opacity="0.35"/>
                    </svg>
                  </div>
                  <Button onClick={handleSaveField({ phone: profileDraft.phone.trim() || undefined })} className="w-full shrink-0 rounded-[12px] py-3" disabled={isSaving}>
                    Gem
                  </Button>
                </div>
              )}

              {/* ─── edit-birthday ─── */}
              {settingsDetailView === 'edit-birthday' && (
                <div className="min-h-[calc(100vh-280px)] flex flex-col" style={{ paddingBottom: keyboardHeight > 0 ? keyboardHeight : undefined }}>
                  <div className="space-y-4">
                    <h2 className="text-[28px] font-bold text-foreground pb-2">Fødselsdato</h2>
                    <Input type="date" value={profileDraft.birthDate} onChange={(e) => setProfileDraft(prev => ({ ...prev, birthDate: e.target.value }))} className="rounded-[12px] border-border bg-card px-4 py-3 text-[15px]" />
                    {profileDraft.birthDate && calculateAge(profileDraft.birthDate) !== null && (
                      <p className="text-[13px] text-muted-foreground px-1">{calculateAge(profileDraft.birthDate)} år</p>
                    )}
                  </div>
                  <div className="flex-1 flex items-center justify-center py-8">
                    <svg width="260" height="200" viewBox="0 0 260 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="bd-skin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFDDAA"/><stop offset="1" stopColor="#FFBB77"/></linearGradient>
                        <linearGradient id="bd-skin2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#FFDDAA"/><stop offset="1" stopColor="#FFBB77"/></linearGradient>
                        <linearGradient id="bd-hair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8D6E63"/><stop offset="1" stopColor="#5D4037"/></linearGradient>
                        <linearGradient id="bd-shirt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F48FB1"/><stop offset="0.5" stopColor="#EC407A"/><stop offset="1" stopColor="#C2185B"/></linearGradient>
                        <linearGradient id="bd-pants" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#880E4F"/><stop offset="1" stopColor="#4A0030"/></linearGradient>
                        <linearGradient id="bd-cake1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFE0C8"/><stop offset="1" stopColor="#FFAB91"/></linearGradient>
                        <linearGradient id="bd-cake2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FF8A65"/><stop offset="1" stopColor="#E64A19"/></linearGradient>
                        <linearGradient id="bd-cake3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F06292"/><stop offset="1" stopColor="#E91E63"/></linearGradient>
                        <filter id="bd-shadow"><feDropShadow dx="0" dy="5" stdDeviation="7" floodOpacity="0.15"/></filter>
                        <filter id="bd-softshadow"><feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.1"/></filter>
                      </defs>
                      {/* Confetti / sparkles */}
                      <rect x="30" y="50" width="8" height="4" rx="2" fill="#F48FB1" opacity="0.7" transform="rotate(-20 30 50)"/>
                      <rect x="212" y="45" width="8" height="4" rx="2" fill="#64B5F6" opacity="0.7" transform="rotate(18 212 45)"/>
                      <circle cx="40" cy="90" r="4" fill="#FFD54F" opacity="0.6"/>
                      <circle cx="222" cy="82" r="4" fill="#81C784" opacity="0.55"/>
                      <rect x="32" y="140" width="6" height="3" rx="1.5" fill="#CE93D8" opacity="0.6" transform="rotate(30 32 140)"/>
                      <rect x="215" y="148" width="6" height="3" rx="1.5" fill="#EF5350" opacity="0.5" transform="rotate(-25 215 148)"/>
                      {/* Ground shadow */}
                      <ellipse cx="124" cy="191" rx="62" ry="7" fill="#000" opacity="0.08"/>
                      {/* Left arm out */}
                      <path d="M103 128 Q84 134 72 144" stroke="url(#bd-skin2)" strokeWidth="13" strokeLinecap="round" fill="none"/>
                      {/* Right arm out */}
                      <path d="M151 128 Q170 134 180 144" stroke="url(#bd-skin2)" strokeWidth="13" strokeLinecap="round" fill="none"/>
                      {/* Left hand */}
                      <circle cx="72" cy="145" r="7" fill="url(#bd-skin)"/>
                      {/* Right hand */}
                      <circle cx="180" cy="145" r="7" fill="url(#bd-skin)"/>
                      {/* Cake — bottom tier */}
                      <rect x="66" y="144" width="116" height="34" rx="10" fill="url(#bd-cake1)" filter="url(#bd-softshadow)"/>
                      <rect x="66" y="144" width="116" height="8" rx="10" fill="white" opacity="0.25"/>
                      {/* Cake — middle tier */}
                      <rect x="80" y="116" width="88" height="30" rx="8" fill="url(#bd-cake2)" filter="url(#bd-softshadow)"/>
                      {/* Frosting drips on middle */}
                      <path d="M80 116 Q88 109 96 116 Q104 109 112 116 Q120 109 128 116 Q136 109 144 116 Q152 109 160 116 Q164 110 168 116" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.85"/>
                      {/* Cake — top tier */}
                      <rect x="96" y="96" width="56" height="22" rx="7" fill="url(#bd-cake3)"/>
                      {/* Frosting drips on top */}
                      <path d="M96 96 Q102 90 108 96 Q114 90 120 96 Q126 90 132 96 Q138 90 144 96 Q148 91 152 96" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.7"/>
                      {/* Cake shine */}
                      <rect x="70" y="146" width="24" height="5" rx="2.5" fill="white" opacity="0.2"/>
                      <rect x="84" y="118" width="18" height="4" rx="2" fill="white" opacity="0.2"/>
                      {/* Candles */}
                      <rect x="101" y="76" width="8" height="22" rx="4" fill="#64B5F6"/>
                      <rect x="103" y="76" width="3" height="10" rx="1.5" fill="white" opacity="0.2"/>
                      <ellipse cx="105" cy="74" rx="5" ry="6" fill="#FFD54F"/>
                      <ellipse cx="105" cy="71" rx="2" ry="4" fill="#FFF59D"/>
                      <rect x="120" y="70" width="8" height="28" rx="4" fill="#F48FB1"/>
                      <rect x="122" y="70" width="3" height="12" rx="1.5" fill="white" opacity="0.2"/>
                      <ellipse cx="124" cy="68" rx="5" ry="6" fill="#FFD54F"/>
                      <ellipse cx="124" cy="65" rx="2" ry="4" fill="#FFF59D"/>
                      <rect x="139" y="76" width="8" height="22" rx="4" fill="#81C784"/>
                      <rect x="141" y="76" width="3" height="10" rx="1.5" fill="white" opacity="0.2"/>
                      <ellipse cx="143" cy="74" rx="5" ry="6" fill="#FFD54F"/>
                      <ellipse cx="143" cy="71" rx="2" ry="4" fill="#FFF59D"/>
                      {/* Party hat */}
                      <path d="M114 72 L124 40 L134 72Z" fill="#F48FB1"/>
                      <path d="M118 68 L124 48 L130 68Z" fill="#EC407A" opacity="0.5"/>
                      <path d="M114 68 Q124 72 134 68" stroke="white" strokeWidth="1" fill="none" opacity="0.4"/>
                      <circle cx="124" cy="38" r="5" fill="#FFD54F"/>
                      <rect x="113" y="69" width="22" height="6" rx="3" fill="#CE93D8"/>
                      {/* Pants */}
                      <rect x="106" y="162" width="15" height="26" rx="8" fill="url(#bd-pants)"/>
                      <rect x="128" y="162" width="15" height="26" rx="8" fill="url(#bd-pants)"/>
                      <rect x="106" y="162" width="37" height="6" rx="3" fill="#2E0020" opacity="0.5"/>
                      {/* Shoes */}
                      <rect x="103" y="182" width="21" height="9" rx="5" fill="#111"/>
                      <rect x="125" y="182" width="21" height="9" rx="5" fill="#111"/>
                      <rect x="105" y="182" width="13" height="3" rx="1.5" fill="white" opacity="0.12"/>
                      <rect x="127" y="182" width="13" height="3" rx="1.5" fill="white" opacity="0.12"/>
                      {/* Body/shirt */}
                      <rect x="100" y="120" width="56" height="48" rx="16" fill="url(#bd-shirt)" filter="url(#bd-shadow)"/>
                      {/* Collar */}
                      <path d="M118 120 L128 131 L138 120" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.35"/>
                      {/* Shirt shine */}
                      <ellipse cx="113" cy="130" rx="7" ry="4" fill="white" opacity="0.14"/>
                      {/* Neck */}
                      <rect x="120" y="112" width="16" height="12" rx="4" fill="url(#bd-skin)"/>
                      {/* Ears */}
                      <ellipse cx="101" cy="90" rx="5" ry="7" fill="#FFCC88"/>
                      <ellipse cx="147" cy="90" rx="5" ry="7" fill="#FFCC88"/>
                      <ellipse cx="101" cy="90" rx="3" ry="5" fill="#FFB870" opacity="0.6"/>
                      <ellipse cx="147" cy="90" rx="3" ry="5" fill="#FFB870" opacity="0.6"/>
                      {/* Head */}
                      <circle cx="124" cy="88" r="26" fill="url(#bd-skin)" filter="url(#bd-shadow)"/>
                      <circle cx="116" cy="78" r="9" fill="white" opacity="0.18"/>
                      {/* Hair back */}
                      <ellipse cx="124" cy="65" rx="23" ry="12" fill="#5D4037"/>
                      {/* Hair main */}
                      <ellipse cx="124" cy="64" rx="22" ry="11" fill="url(#bd-hair)"/>
                      <rect x="102" y="64" width="12" height="18" rx="6" fill="url(#bd-hair)"/>
                      <rect x="136" y="64" width="12" height="18" rx="6" fill="url(#bd-hair)"/>
                      {/* Hair highlight */}
                      <path d="M113 57 Q122 53 131 57" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.15"/>
                      {/* Eyebrows */}
                      <path d="M112 82 Q115 79 118 82" stroke="#5D4037" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                      <path d="M130 82 Q133 79 136 82" stroke="#5D4037" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                      {/* Eyes — happy squint */}
                      <path d="M112 88 Q115 85 118 88" stroke="#2C1810" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                      <path d="M130 88 Q133 85 136 88" stroke="#2C1810" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                      {/* Eye highlights */}
                      <circle cx="115" cy="87" r="1.5" fill="white" opacity="0.8"/>
                      <circle cx="133" cy="87" r="1.5" fill="white" opacity="0.8"/>
                      {/* Big smile */}
                      <path d="M116 98 Q124 107 132 98" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none" opacity="0.4"/>
                      <path d="M116 98 Q124 108 132 98" stroke="#C67B3A" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                      {/* Cheeks */}
                      <ellipse cx="110" cy="96" rx="6" ry="4" fill="#FFB0A0" opacity="0.45"/>
                      <ellipse cx="138" cy="96" rx="6" ry="4" fill="#FFB0A0" opacity="0.45"/>
                    </svg>
                  </div>
                  <Button onClick={handleSaveField({ birthDate: profileDraft.birthDate || undefined })} className="w-full shrink-0 rounded-[12px] py-3" disabled={isSaving}>
                    Gem
                  </Button>
                </div>
              )}

              {/* ─── edit-gender ─── */}
              {settingsDetailView === 'edit-gender' && (
                <div className="min-h-[calc(100vh-280px)] flex flex-col" style={{ paddingBottom: keyboardHeight > 0 ? keyboardHeight : undefined }}>
                  <div className="space-y-4">
                    <h2 className="text-[28px] font-bold text-foreground pb-2">Køn</h2>
                    <p className="text-[13px] text-muted-foreground px-1">Vælg dit køn — dette bestemmer hvilke avatarer du ser</p>
                    <div className="space-y-2">
                      {([{ value: 'male', label: 'Mand' }, { value: 'female', label: 'Kvinde' }] as const).map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setProfileDraft(prev => ({ ...prev, gender: opt.value }))}
                          className={cn(
                            "flex w-full items-center justify-between rounded-[12px] border-2 px-4 py-3.5 text-left transition-all",
                            profileDraft.gender === opt.value ? "border-[#f58a2d] bg-orange-tint-light" : "border-border bg-card"
                          )}
                        >
                          <span className="text-[15px] font-medium text-foreground">{opt.label}</span>
                          {profileDraft.gender === opt.value && <Check className="h-5 w-5 text-[#f58a2d]" />}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 flex items-center justify-center py-8">
                    <svg width="260" height="200" viewBox="0 0 260 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="gn-skin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFDDAA"/><stop offset="1" stopColor="#FFBB77"/></linearGradient>
                        <linearGradient id="gn-skin2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#FFDDAA"/><stop offset="1" stopColor="#FFBB77"/></linearGradient>
                        <linearGradient id="gn-hairB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1E88E5"/><stop offset="1" stopColor="#0D47A1"/></linearGradient>
                        <linearGradient id="gn-hairP" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E91E8C"/><stop offset="1" stopColor="#880E4F"/></linearGradient>
                        <linearGradient id="gn-shirtB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#64B5F6"/><stop offset="0.5" stopColor="#42A5F5"/><stop offset="1" stopColor="#1565C0"/></linearGradient>
                        <linearGradient id="gn-shirtP" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F48FB1"/><stop offset="0.5" stopColor="#EC407A"/><stop offset="1" stopColor="#AD1457"/></linearGradient>
                        <linearGradient id="gn-pantsB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1A237E"/><stop offset="1" stopColor="#0D1457"/></linearGradient>
                        <linearGradient id="gn-pantsP" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4A148C"/><stop offset="1" stopColor="#2E0060"/></linearGradient>
                        <linearGradient id="gn-heart" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#EF5350"/><stop offset="1" stopColor="#B71C1C"/></linearGradient>
                        <filter id="gn-shadow"><feDropShadow dx="0" dy="5" stdDeviation="6" floodOpacity="0.15"/></filter>
                        <filter id="gn-softshadow"><feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.1"/></filter>
                      </defs>
                      {/* Background sparkles */}
                      <rect x="20" y="80" width="6" height="6" rx="1" fill="#42A5F5" opacity="0.22" transform="rotate(45 23 83)"/>
                      <rect x="234" y="78" width="6" height="6" rx="1" fill="#EC407A" opacity="0.22" transform="rotate(45 237 81)"/>
                      <circle cx="128" cy="22" r="4" fill="#EF5350" opacity="0.3"/>
                      <rect x="125" y="18" width="6" height="6" rx="1" fill="#EF5350" opacity="0.15" transform="rotate(45 128 21)"/>
                      {/* Ground shadows */}
                      <ellipse cx="87" cy="191" rx="44" ry="6" fill="#000" opacity="0.08"/>
                      <ellipse cx="173" cy="191" rx="44" ry="6" fill="#000" opacity="0.08"/>
                      {/* ── Blue person (left) ── */}
                      {/* Blue left arm */}
                      <path d="M65 133 Q52 141 47 153" stroke="url(#gn-skin2)" strokeWidth="11" strokeLinecap="round" fill="none"/>
                      {/* Blue left hand */}
                      <circle cx="47" cy="154" r="6" fill="url(#gn-skin)"/>
                      {/* Blue pants */}
                      <rect x="67" y="161" width="13" height="25" rx="7" fill="url(#gn-pantsB)"/>
                      <rect x="84" y="161" width="13" height="25" rx="7" fill="url(#gn-pantsB)"/>
                      <rect x="67" y="161" width="30" height="6" rx="3" fill="#060B28" opacity="0.5"/>
                      {/* Blue shoes */}
                      <rect x="64" y="181" width="19" height="8" rx="4" fill="#111"/>
                      <rect x="82" y="181" width="19" height="8" rx="4" fill="#111"/>
                      <rect x="66" y="181" width="11" height="3" rx="1.5" fill="white" opacity="0.12"/>
                      <rect x="84" y="181" width="11" height="3" rx="1.5" fill="white" opacity="0.12"/>
                      {/* Blue shirt body */}
                      <rect x="62" y="123" width="50" height="44" rx="14" fill="url(#gn-shirtB)" filter="url(#gn-shadow)"/>
                      {/* Blue collar */}
                      <path d="M79 123 L87 133 L95 123" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.35"/>
                      {/* Blue shirt shine */}
                      <ellipse cx="75" cy="131" rx="6" ry="3.5" fill="white" opacity="0.12"/>
                      {/* Blue right arm toward heart */}
                      <path d="M112 131 Q120 128 124 136" stroke="url(#gn-skin2)" strokeWidth="11" strokeLinecap="round" fill="none"/>
                      <circle cx="124" cy="137" r="6" fill="url(#gn-skin)"/>
                      {/* Blue neck */}
                      <rect x="80" y="116" width="14" height="10" rx="4" fill="url(#gn-skin)"/>
                      {/* Blue ears */}
                      <ellipse cx="63" cy="103" rx="4.5" ry="6.5" fill="#FFCC88"/>
                      <ellipse cx="63" cy="103" rx="2.5" ry="4.5" fill="#FFB870" opacity="0.6"/>
                      <ellipse cx="101" cy="103" rx="4.5" ry="6.5" fill="#FFCC88"/>
                      <ellipse cx="101" cy="103" rx="2.5" ry="4.5" fill="#FFB870" opacity="0.6"/>
                      {/* Blue head */}
                      <circle cx="82" cy="102" r="23" fill="url(#gn-skin)" filter="url(#gn-shadow)"/>
                      <circle cx="75" cy="93" r="8" fill="white" opacity="0.18"/>
                      {/* Blue hair back */}
                      <ellipse cx="82" cy="82" rx="21" ry="11" fill="#0D47A1"/>
                      {/* Blue hair main */}
                      <ellipse cx="82" cy="81" rx="20" ry="10" fill="url(#gn-hairB)"/>
                      <rect x="63" y="81" width="10" height="14" rx="5" fill="url(#gn-hairB)"/>
                      <rect x="93" y="81" width="10" height="14" rx="5" fill="url(#gn-hairB)"/>
                      {/* Blue hair highlight */}
                      <path d="M73 74 Q81 70 89 74" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.15"/>
                      {/* Blue eyebrows */}
                      <path d="M71 95 Q74 92 77 95" stroke="#5D4037" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
                      <path d="M87 95 Q90 92 93 95" stroke="#5D4037" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
                      {/* Blue eyes */}
                      <circle cx="75" cy="101" r="3.5" fill="#2C1810"/>
                      <circle cx="89" cy="101" r="3.5" fill="#2C1810"/>
                      <circle cx="77" cy="99" r="1.2" fill="white" opacity="0.9"/>
                      <circle cx="91" cy="99" r="1.2" fill="white" opacity="0.9"/>
                      {/* Blue smile */}
                      <path d="M77 109 Q82 115 87 109" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.4"/>
                      <path d="M77 109 Q82 116 87 109" stroke="#C67B3A" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                      {/* Blue cheeks */}
                      <ellipse cx="70" cy="106" rx="4.5" ry="3" fill="#FFB0A0" opacity="0.35"/>
                      <ellipse cx="94" cy="106" rx="4.5" ry="3" fill="#FFB0A0" opacity="0.35"/>
                      {/* ── Heart in center ── */}
                      <path d="M118 118 C118 107 129 102 132 111 C135 102 146 107 146 118 C146 133 132 142 132 142 C132 142 118 133 118 118Z" fill="url(#gn-heart)" filter="url(#gn-softshadow)"/>
                      <ellipse cx="127" cy="112" rx="5" ry="3" fill="white" opacity="0.25"/>
                      <circle cx="132" cy="113" r="4" fill="white" opacity="0.12"/>
                      {/* ── Pink person (right) ── */}
                      {/* Pink right arm */}
                      <path d="M195 133 Q208 141 213 153" stroke="url(#gn-skin2)" strokeWidth="11" strokeLinecap="round" fill="none"/>
                      <circle cx="213" cy="154" r="6" fill="url(#gn-skin)"/>
                      {/* Pink pants */}
                      <rect x="163" y="161" width="13" height="25" rx="7" fill="url(#gn-pantsP)"/>
                      <rect x="180" y="161" width="13" height="25" rx="7" fill="url(#gn-pantsP)"/>
                      <rect x="163" y="161" width="30" height="6" rx="3" fill="#1A0040" opacity="0.5"/>
                      {/* Pink shoes */}
                      <rect x="160" y="181" width="19" height="8" rx="4" fill="#111"/>
                      <rect x="178" y="181" width="19" height="8" rx="4" fill="#111"/>
                      <rect x="162" y="181" width="11" height="3" rx="1.5" fill="white" opacity="0.12"/>
                      <rect x="180" y="181" width="11" height="3" rx="1.5" fill="white" opacity="0.12"/>
                      {/* Pink shirt body */}
                      <rect x="158" y="123" width="50" height="44" rx="14" fill="url(#gn-shirtP)" filter="url(#gn-shadow)"/>
                      {/* Pink collar */}
                      <path d="M175 123 L183 133 L191 123" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.35"/>
                      {/* Pink shirt shine */}
                      <ellipse cx="171" cy="131" rx="6" ry="3.5" fill="white" opacity="0.12"/>
                      {/* Pink left arm toward heart */}
                      <path d="M158 131 Q148 128 144 136" stroke="url(#gn-skin2)" strokeWidth="11" strokeLinecap="round" fill="none"/>
                      <circle cx="143" cy="137" r="6" fill="url(#gn-skin)"/>
                      {/* Pink neck */}
                      <rect x="176" y="116" width="14" height="10" rx="4" fill="url(#gn-skin)"/>
                      {/* Pink ears */}
                      <ellipse cx="159" cy="103" rx="4.5" ry="6.5" fill="#FFCC88"/>
                      <ellipse cx="159" cy="103" rx="2.5" ry="4.5" fill="#FFB870" opacity="0.6"/>
                      <ellipse cx="197" cy="103" rx="4.5" ry="6.5" fill="#FFCC88"/>
                      <ellipse cx="197" cy="103" rx="2.5" ry="4.5" fill="#FFB870" opacity="0.6"/>
                      {/* Pink head */}
                      <circle cx="178" cy="102" r="23" fill="url(#gn-skin)" filter="url(#gn-shadow)"/>
                      <circle cx="170" cy="93" r="8" fill="white" opacity="0.18"/>
                      {/* Pink hair back (longer) */}
                      <ellipse cx="178" cy="80" rx="21" ry="12" fill="#880E4F"/>
                      <rect x="157" y="80" width="10" height="24" rx="5" fill="#880E4F"/>
                      <rect x="191" y="80" width="10" height="24" rx="5" fill="#880E4F"/>
                      {/* Pink hair main */}
                      <ellipse cx="178" cy="79" rx="20" ry="11" fill="url(#gn-hairP)"/>
                      <rect x="158" y="79" width="9" height="22" rx="4.5" fill="url(#gn-hairP)"/>
                      <rect x="193" y="79" width="9" height="22" rx="4.5" fill="url(#gn-hairP)"/>
                      {/* Pink hair highlight */}
                      <path d="M169 72 Q177 68 185 72" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.15"/>
                      {/* Pink eyebrows */}
                      <path d="M167 95 Q170 92 173 95" stroke="#5D4037" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
                      <path d="M183 95 Q186 92 189 95" stroke="#5D4037" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
                      {/* Pink eyes */}
                      <circle cx="171" cy="101" r="3.5" fill="#2C1810"/>
                      <circle cx="185" cy="101" r="3.5" fill="#2C1810"/>
                      <circle cx="173" cy="99" r="1.2" fill="white" opacity="0.9"/>
                      <circle cx="187" cy="99" r="1.2" fill="white" opacity="0.9"/>
                      {/* Pink smile */}
                      <path d="M173 109 Q178 115 183 109" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.4"/>
                      <path d="M173 109 Q178 116 183 109" stroke="#C67B3A" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                      {/* Pink cheeks */}
                      <ellipse cx="166" cy="106" rx="4.5" ry="3" fill="#FFB0A0" opacity="0.4"/>
                      <ellipse cx="190" cy="106" rx="4.5" ry="3" fill="#FFB0A0" opacity="0.4"/>
                    </svg>
                  </div>
                  <Button onClick={handleSaveField({ gender: profileDraft.gender || undefined })} className="w-full shrink-0 rounded-[12px] py-3" disabled={isSaving}>
                    Gem
                  </Button>
                </div>
              )}

              {/* ─── edit-address ─── */}
              {settingsDetailView === 'edit-address' && (
                <div className="min-h-[calc(100vh-280px)] flex flex-col" style={{ paddingBottom: keyboardHeight > 0 ? keyboardHeight : undefined }}>
                  <div className="space-y-4">
                    <h2 className="text-[28px] font-bold text-foreground pb-2">Adresse</h2>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-[13px]">Gadenavn og nr.</Label>
                        <Input value={profileDraft.address} onChange={(e) => setProfileDraft(prev => ({ ...prev, address: e.target.value }))} placeholder="Gadenavn og nr." className="rounded-[12px] border-border bg-card px-4 py-3 text-[15px]" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-[13px]">Postnummer</Label>
                          <Input value={profileDraft.zipCode} onChange={(e) => setProfileDraft(prev => ({ ...prev, zipCode: e.target.value }))} placeholder="F.eks. 2100" className="rounded-[12px] border-border bg-card px-4 py-3 text-[15px]" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[13px]">By</Label>
                          <Input value={profileDraft.city} onChange={(e) => setProfileDraft(prev => ({ ...prev, city: e.target.value }))} placeholder="F.eks. København" className="rounded-[12px] border-border bg-card px-4 py-3 text-[15px]" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 flex items-center justify-center py-8">
                    <svg width="260" height="200" viewBox="0 0 260 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="ad-skin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFDDAA"/><stop offset="1" stopColor="#FFBB77"/></linearGradient>
                        <linearGradient id="ad-skin2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#FFDDAA"/><stop offset="1" stopColor="#FFBB77"/></linearGradient>
                        <linearGradient id="ad-hair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8D6E63"/><stop offset="1" stopColor="#5D4037"/></linearGradient>
                        <linearGradient id="ad-shirt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#A5D6A7"/><stop offset="0.5" stopColor="#66BB6A"/><stop offset="1" stopColor="#2E7D32"/></linearGradient>
                        <linearGradient id="ad-pants" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4E342E"/><stop offset="1" stopColor="#2C1810"/></linearGradient>
                        <linearGradient id="ad-house" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFF8F0"/><stop offset="1" stopColor="#FFE0B2"/></linearGradient>
                        <linearGradient id="ad-roof" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FF8A65"/><stop offset="1" stopColor="#E64A19"/></linearGradient>
                        <linearGradient id="ad-door" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#A1887F"/><stop offset="1" stopColor="#6D4C41"/></linearGradient>
                        <linearGradient id="ad-pin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#EF5350"/><stop offset="1" stopColor="#B71C1C"/></linearGradient>
                        <filter id="ad-shadow"><feDropShadow dx="0" dy="5" stdDeviation="7" floodOpacity="0.15"/></filter>
                        <filter id="ad-softshadow"><feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.1"/></filter>
                      </defs>
                      {/* Background sparkles */}
                      <rect x="28" y="55" width="7" height="7" rx="1" fill="#66BB6A" opacity="0.22" transform="rotate(45 31 58)"/>
                      <circle cx="225" cy="150" r="4" fill="#4CAF50" opacity="0.2"/>
                      <circle cx="30" cy="145" r="3" fill="#81C784" opacity="0.22"/>
                      <rect x="210" y="50" width="5" height="5" rx="1" fill="#EF5350" opacity="0.2" transform="rotate(45 212 52)"/>
                      {/* Ground — green grass hint */}
                      <ellipse cx="128" cy="191" rx="108" ry="10" fill="#C8E6C9" opacity="0.5"/>
                      <ellipse cx="128" cy="191" rx="58" ry="7" fill="#000" opacity="0.07"/>
                      {/* House body */}
                      <rect x="148" y="108" width="78" height="66" rx="5" fill="url(#ad-house)" stroke="#F5A623" strokeWidth="1.5" filter="url(#ad-softshadow)"/>
                      {/* House shine */}
                      <rect x="152" y="111" width="18" height="5" rx="2.5" fill="white" opacity="0.3"/>
                      {/* Roof */}
                      <path d="M140 115 L187 74 L234 115Z" fill="url(#ad-roof)" filter="url(#ad-softshadow)"/>
                      {/* Roof ridge shine */}
                      <path d="M167 96 L187 77 L207 96" stroke="white" strokeWidth="1.5" fill="none" opacity="0.2"/>
                      {/* Door */}
                      <rect x="172" y="137" width="22" height="37" rx="4" fill="url(#ad-door)"/>
                      <circle cx="191" cy="157" r="2.5" fill="#FFD54F"/>
                      {/* Door shine */}
                      <rect x="174" y="139" width="5" height="14" rx="2.5" fill="white" opacity="0.15"/>
                      {/* Windows */}
                      <rect x="151" y="118" width="15" height="15" rx="3" fill="#BBDEFB" stroke="#64B5F6" strokeWidth="1"/>
                      <line x1="158.5" y1="118" x2="158.5" y2="133" stroke="#90CAF9" strokeWidth="1"/>
                      <line x1="151" y1="125.5" x2="166" y2="125.5" stroke="#90CAF9" strokeWidth="1"/>
                      <rect x="203" y="118" width="15" height="15" rx="3" fill="#BBDEFB" stroke="#64B5F6" strokeWidth="1"/>
                      <line x1="210.5" y1="118" x2="210.5" y2="133" stroke="#90CAF9" strokeWidth="1"/>
                      <line x1="203" y1="125.5" x2="218" y2="125.5" stroke="#90CAF9" strokeWidth="1"/>
                      {/* Location pin */}
                      <path d="M187 34 C175 34 166 43 166 54 C166 69 187 88 187 88 C187 88 208 69 208 54 C208 43 199 34 187 34Z" fill="url(#ad-pin)" filter="url(#ad-softshadow)"/>
                      <circle cx="187" cy="53" r="9" fill="white"/>
                      <circle cx="187" cy="53" r="5" fill="#EF5350" opacity="0.4"/>
                      {/* Pin shine */}
                      <ellipse cx="182" cy="42" rx="5" ry="3" fill="white" opacity="0.25"/>
                      {/* Left arm */}
                      <path d="M74 132 Q58 142 53 156" stroke="url(#ad-skin2)" strokeWidth="13" strokeLinecap="round" fill="none"/>
                      <circle cx="53" cy="157" r="7" fill="url(#ad-skin)"/>
                      {/* Pants */}
                      <rect x="79" y="163" width="14" height="26" rx="8" fill="url(#ad-pants)"/>
                      <rect x="98" y="163" width="14" height="26" rx="8" fill="url(#ad-pants)"/>
                      <rect x="79" y="163" width="33" height="6" rx="3" fill="#1A0B08" opacity="0.5"/>
                      {/* Shoes */}
                      <rect x="76" y="183" width="20" height="8" rx="5" fill="#111"/>
                      <rect x="96" y="183" width="20" height="8" rx="5" fill="#111"/>
                      <rect x="78" y="183" width="12" height="3" rx="1.5" fill="white" opacity="0.12"/>
                      <rect x="98" y="183" width="12" height="3" rx="1.5" fill="white" opacity="0.12"/>
                      {/* Body/shirt */}
                      <rect x="72" y="122" width="54" height="47" rx="16" fill="url(#ad-shirt)" filter="url(#ad-shadow)"/>
                      {/* Collar */}
                      <path d="M89 122 L99 133 L109 122" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.35"/>
                      {/* Shirt shine */}
                      <ellipse cx="85" cy="131" rx="7" ry="4" fill="white" opacity="0.12"/>
                      {/* Right arm pointing */}
                      <path d="M124 129 Q144 119 150 122" stroke="url(#ad-skin2)" strokeWidth="13" strokeLinecap="round" fill="none"/>
                      <circle cx="150" cy="123" r="7" fill="url(#ad-skin)"/>
                      {/* Neck */}
                      <rect x="91" y="115" width="16" height="11" rx="4" fill="url(#ad-skin)"/>
                      {/* Ears */}
                      <ellipse cx="73" cy="101" rx="5" ry="7" fill="#FFCC88"/>
                      <ellipse cx="73" cy="101" rx="3" ry="5" fill="#FFB870" opacity="0.6"/>
                      <ellipse cx="117" cy="101" rx="5" ry="7" fill="#FFCC88"/>
                      <ellipse cx="117" cy="101" rx="3" ry="5" fill="#FFB870" opacity="0.6"/>
                      {/* Head */}
                      <circle cx="95" cy="99" r="25" fill="url(#ad-skin)" filter="url(#ad-shadow)"/>
                      <circle cx="87" cy="90" r="9" fill="white" opacity="0.18"/>
                      {/* Hair back */}
                      <ellipse cx="95" cy="77" rx="23" ry="12" fill="#5D4037"/>
                      {/* Hair main */}
                      <ellipse cx="95" cy="76" rx="22" ry="11" fill="url(#ad-hair)"/>
                      <rect x="73" y="76" width="11" height="17" rx="5.5" fill="url(#ad-hair)"/>
                      <rect x="106" y="76" width="11" height="17" rx="5.5" fill="url(#ad-hair)"/>
                      {/* Hair highlight */}
                      <path d="M84 69 Q93 65 102 69" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.15"/>
                      {/* Eyebrows */}
                      <path d="M83 92 Q86 89 89 92" stroke="#5D4037" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                      <path d="M101 92 Q104 89 107 92" stroke="#5D4037" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                      {/* Eyes */}
                      <circle cx="86" cy="98" r="3.8" fill="#2C1810"/>
                      <circle cx="104" cy="98" r="3.8" fill="#2C1810"/>
                      <circle cx="88" cy="96" r="1.4" fill="white" opacity="0.9"/>
                      <circle cx="106" cy="96" r="1.4" fill="white" opacity="0.9"/>
                      {/* Mouth */}
                      <path d="M88 108 Q95 115 102 108" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.4"/>
                      <path d="M88 108 Q95 116 102 108" stroke="#C67B3A" strokeWidth="2" strokeLinecap="round" fill="none"/>
                      {/* Cheeks */}
                      <ellipse cx="80" cy="105" rx="5" ry="3" fill="#FFB0A0" opacity="0.35"/>
                      <ellipse cx="110" cy="105" rx="5" ry="3" fill="#FFB0A0" opacity="0.35"/>
                    </svg>
                  </div>
                  <Button onClick={handleSaveField({ address: profileDraft.address.trim() || undefined, zipCode: profileDraft.zipCode.trim() || undefined, city: profileDraft.city.trim() || undefined })} className="w-full shrink-0 rounded-[12px] py-3" disabled={isSaving}>
                    Gem
                  </Button>
                </div>
              )}

              {/* ─── edit-country ─── */}
              {settingsDetailView === 'edit-country' && (
                <div className="min-h-[calc(100vh-280px)] flex flex-col" style={{ paddingBottom: keyboardHeight > 0 ? keyboardHeight : undefined }}>
                  <div className="space-y-4">
                    <h2 className="text-[28px] font-bold text-foreground pb-2">Land</h2>
                    <Input value={profileDraft.country} onChange={(e) => setProfileDraft(prev => ({ ...prev, country: e.target.value }))} placeholder="Danmark" className="rounded-[12px] border-border bg-card px-4 py-3 text-[15px]" />
                  </div>
                  <div className="flex-1 flex items-center justify-center py-8">
                    <svg width="260" height="200" viewBox="0 0 260 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="co-skin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFDDAA"/><stop offset="1" stopColor="#FFBB77"/></linearGradient>
                        <linearGradient id="co-skin2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#FFDDAA"/><stop offset="1" stopColor="#FFBB77"/></linearGradient>
                        <linearGradient id="co-hair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8D6E63"/><stop offset="1" stopColor="#5D4037"/></linearGradient>
                        <linearGradient id="co-shirt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#64B5F6"/><stop offset="0.5" stopColor="#42A5F5"/><stop offset="1" stopColor="#1565C0"/></linearGradient>
                        <linearGradient id="co-pants" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#455A64"/><stop offset="1" stopColor="#263238"/></linearGradient>
                        <linearGradient id="co-globe" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#E3F2FD"/><stop offset="0.5" stopColor="#90CAF9"/><stop offset="1" stopColor="#42A5F5"/></linearGradient>
                        <filter id="co-shadow"><feDropShadow dx="0" dy="5" stdDeviation="7" floodOpacity="0.15"/></filter>
                        <filter id="co-softshadow"><feDropShadow dx="0" dy="3" stdDeviation="5" floodOpacity="0.12"/></filter>
                      </defs>
                      {/* Background sparkles */}
                      <rect x="28" y="46" width="7" height="7" rx="1" fill="#42A5F5" opacity="0.22" transform="rotate(45 31 49)"/>
                      <circle cx="222" cy="58" r="4" fill="#90CAF9" opacity="0.25"/>
                      <rect x="210" y="155" width="6" height="6" rx="1" fill="#1E88E5" opacity="0.2" transform="rotate(45 213 158)"/>
                      <circle cx="30" cy="160" r="3" fill="#81C784" opacity="0.25"/>
                      <rect x="215" y="105" width="5" height="5" rx="1" fill="#64B5F6" opacity="0.18" transform="rotate(45 217 107)"/>
                      {/* Ground shadow */}
                      <ellipse cx="114" cy="191" rx="58" ry="7" fill="#000" opacity="0.08"/>
                      {/* Left arm raised holding globe */}
                      <path d="M91 130 Q74 122 63 115" stroke="url(#co-skin2)" strokeWidth="13" strokeLinecap="round" fill="none"/>
                      <circle cx="62" cy="114" r="7" fill="url(#co-skin)"/>
                      {/* Right arm raised holding globe */}
                      <path d="M139 130 Q156 122 167 115" stroke="url(#co-skin2)" strokeWidth="13" strokeLinecap="round" fill="none"/>
                      <circle cx="168" cy="114" r="7" fill="url(#co-skin)"/>
                      {/* Pants */}
                      <rect x="95" y="162" width="15" height="27" rx="8" fill="url(#co-pants)"/>
                      <rect x="116" y="162" width="15" height="27" rx="8" fill="url(#co-pants)"/>
                      <rect x="95" y="162" width="36" height="6" rx="3" fill="#151F24" opacity="0.5"/>
                      {/* Shoes */}
                      <rect x="92" y="183" width="21" height="9" rx="5" fill="#111"/>
                      <rect x="113" y="183" width="21" height="9" rx="5" fill="#111"/>
                      <rect x="94" y="183" width="13" height="3" rx="1.5" fill="white" opacity="0.12"/>
                      <rect x="115" y="183" width="13" height="3" rx="1.5" fill="white" opacity="0.12"/>
                      {/* Body/shirt */}
                      <rect x="88" y="120" width="56" height="48" rx="16" fill="url(#co-shirt)" filter="url(#co-shadow)"/>
                      {/* Collar */}
                      <path d="M105 120 L116 132 L127 120" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.35"/>
                      {/* Shirt shine */}
                      <ellipse cx="101" cy="130" rx="7" ry="4" fill="white" opacity="0.12"/>
                      {/* Globe — 3D sphere */}
                      <circle cx="115" cy="82" r="45" fill="url(#co-globe)" stroke="#64B5F6" strokeWidth="2" filter="url(#co-softshadow)"/>
                      {/* Globe rim light */}
                      <circle cx="115" cy="82" r="45" fill="none" stroke="white" strokeWidth="6" opacity="0.08"/>
                      {/* Globe grid — equator */}
                      <ellipse cx="115" cy="82" rx="45" ry="17" stroke="#90CAF9" strokeWidth="1.2" fill="none" opacity="0.7"/>
                      {/* Globe grid — tropic lines */}
                      <ellipse cx="115" cy="65" rx="38" ry="8" stroke="#90CAF9" strokeWidth="1" fill="none" opacity="0.4"/>
                      <ellipse cx="115" cy="99" rx="38" ry="8" stroke="#90CAF9" strokeWidth="1" fill="none" opacity="0.4"/>
                      {/* Globe grid — meridians */}
                      <ellipse cx="115" cy="82" rx="18" ry="45" stroke="#90CAF9" strokeWidth="1" fill="none" opacity="0.5"/>
                      <line x1="70" y1="82" x2="160" y2="82" stroke="#90CAF9" strokeWidth="1" opacity="0.6"/>
                      <line x1="115" y1="37" x2="115" y2="127" stroke="#90CAF9" strokeWidth="1" opacity="0.6"/>
                      {/* Continents */}
                      <ellipse cx="99" cy="68" rx="16" ry="11" fill="#81C784" opacity="0.75"/>
                      <ellipse cx="133" cy="74" rx="12" ry="16" fill="#81C784" opacity="0.75"/>
                      <ellipse cx="104" cy="95" rx="13" ry="9" fill="#81C784" opacity="0.65"/>
                      <ellipse cx="130" cy="95" rx="6" ry="5" fill="#81C784" opacity="0.5"/>
                      {/* Globe shine */}
                      <circle cx="96" cy="59" r="14" fill="white" opacity="0.12"/>
                      <ellipse cx="90" cy="54" rx="8" ry="5" fill="white" opacity="0.1"/>
                      {/* Neck */}
                      <rect x="107" y="117" width="16" height="7" rx="4" fill="url(#co-skin)"/>
                      {/* Ears */}
                      <ellipse cx="90" cy="142" rx="5" ry="7" fill="#FFCC88"/>
                      <ellipse cx="90" cy="142" rx="3" ry="5" fill="#FFB870" opacity="0.6"/>
                      <ellipse cx="138" cy="142" rx="5" ry="7" fill="#FFCC88"/>
                      <ellipse cx="138" cy="142" rx="3" ry="5" fill="#FFB870" opacity="0.6"/>
                      {/* Head — below globe, peeking out */}
                      <circle cx="114" cy="140" r="25" fill="url(#co-skin)" filter="url(#co-shadow)"/>
                      <circle cx="106" cy="131" r="9" fill="white" opacity="0.18"/>
                      {/* Hair back */}
                      <ellipse cx="114" cy="118" rx="23" ry="12" fill="#5D4037"/>
                      {/* Hair main */}
                      <ellipse cx="114" cy="117" rx="22" ry="11" fill="url(#co-hair)"/>
                      <rect x="92" y="117" width="11" height="16" rx="5.5" fill="url(#co-hair)"/>
                      <rect x="125" y="117" width="11" height="16" rx="5.5" fill="url(#co-hair)"/>
                      {/* Hair highlight */}
                      <path d="M103 110 Q112 106 121 110" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.15"/>
                      {/* Eyebrows */}
                      <path d="M102 133 Q105 130 108 133" stroke="#5D4037" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                      <path d="M120 133 Q123 130 126 133" stroke="#5D4037" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                      {/* Eyes */}
                      <circle cx="105" cy="139" r="4" fill="#2C1810"/>
                      <circle cx="123" cy="139" r="4" fill="#2C1810"/>
                      <circle cx="107" cy="137" r="1.5" fill="white" opacity="0.9"/>
                      <circle cx="125" cy="137" r="1.5" fill="white" opacity="0.9"/>
                      {/* Mouth */}
                      <path d="M107 149 Q114 156 121 149" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.4"/>
                      <path d="M107 149 Q114 157 121 149" stroke="#C67B3A" strokeWidth="2" strokeLinecap="round" fill="none"/>
                      {/* Cheeks */}
                      <ellipse cx="99" cy="145" rx="5" ry="3" fill="#FFB0A0" opacity="0.35"/>
                      <ellipse cx="129" cy="145" rx="5" ry="3" fill="#FFB0A0" opacity="0.35"/>
                    </svg>
                  </div>
                  <Button onClick={handleSaveField({ country: profileDraft.country.trim() || undefined })} className="w-full shrink-0 rounded-[12px] py-3" disabled={isSaving}>
                    Gem
                  </Button>
                </div>
              )}

              {/* ─── allergen sub-pages ─── */}
              {settingsDetailView?.startsWith('allergen-') && (() => {
                const targetId = settingsDetailView.replace('allergen-', '');
                const isCurrentUser = targetId === currentUser?.id;
                const person = isCurrentUser ? currentUser : children.find(c => c.id === targetId);
                if (!person) return null;
                const allergies = person.allergies ?? [];
                return (
                  <div className="min-h-[calc(100vh-280px)] flex flex-col" style={{ paddingBottom: keyboardHeight > 0 ? keyboardHeight : undefined }}>
                    <div className="space-y-4">
                      <h2 className="text-[28px] font-bold text-foreground pb-2">
                        Allergener — {person.name}
                      </h2>
                      <p className="text-[13px] text-muted-foreground px-1">Tryk på en allergen for at tilføje/fjerne</p>
                      <div className="flex flex-wrap gap-2">
                        {EU_ALLERGENS_DA.map(allergen => {
                          const active = allergies.includes(allergen);
                          return (
                            <button
                              key={allergen}
                              onClick={() => {
                                const next = active ? allergies.filter(a => a !== allergen) : [...allergies, allergen];
                                if (isCurrentUser) {
                                  updateUser(currentUser!.id, { allergies: next });
                                } else {
                                  updateChild(targetId, { allergies: next });
                                }
                              }}
                              className={cn(
                                "rounded-full px-3 py-1.5 text-[13px] font-semibold transition-colors",
                                active ? "bg-[#f58a2d] text-white" : "bg-muted text-muted-foreground"
                              )}
                            >
                              {allergen}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex-1 flex items-center justify-center py-8">
                      <svg width="260" height="200" viewBox="0 0 260 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <linearGradient id="al-skin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFDDAA"/><stop offset="1" stopColor="#FFBB77"/></linearGradient>
                          <linearGradient id="al-skin2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#FFDDAA"/><stop offset="1" stopColor="#FFBB77"/></linearGradient>
                          <linearGradient id="al-hair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8D6E63"/><stop offset="1" stopColor="#5D4037"/></linearGradient>
                          <linearGradient id="al-shirtA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFB74D"/><stop offset="0.5" stopColor="#F5A623"/><stop offset="1" stopColor="#E65100"/></linearGradient>
                          <linearGradient id="al-shirtB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#64B5F6"/><stop offset="0.5" stopColor="#42A5F5"/><stop offset="1" stopColor="#1565C0"/></linearGradient>
                          <linearGradient id="al-pantsA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4E342E"/><stop offset="1" stopColor="#2C1810"/></linearGradient>
                          <linearGradient id="al-shield" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFF8F0"/><stop offset="0.5" stopColor="#FFE0B2"/><stop offset="1" stopColor="#FFB74D"/></linearGradient>
                          <filter id="al-shadow"><feDropShadow dx="0" dy="5" stdDeviation="6" floodOpacity="0.15"/></filter>
                          <filter id="al-softshadow"><feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.1"/></filter>
                        </defs>
                        {/* Background sparkles */}
                        <rect x="22" y="55" width="7" height="7" rx="1" fill="#F5A623" opacity="0.22" transform="rotate(45 25 58)"/>
                        <circle cx="228" cy="62" r="4" fill="#4CAF50" opacity="0.22"/>
                        <rect x="220" y="152" width="6" height="6" rx="1" fill="#42A5F5" opacity="0.2" transform="rotate(45 223 155)"/>
                        <circle cx="24" cy="155" r="3" fill="#FFD54F" opacity="0.3"/>
                        {/* Ground shadows */}
                        <ellipse cx="82" cy="191" rx="44" ry="6" fill="#000" opacity="0.07"/>
                        <ellipse cx="172" cy="191" rx="34" ry="5" fill="#000" opacity="0.07"/>
                        {/* ── Parent (left, bigger) ── */}
                        {/* Parent left arm */}
                        <path d="M58 134 Q46 140 43 151" stroke="url(#al-skin2)" strokeWidth="12" strokeLinecap="round" fill="none"/>
                        <circle cx="43" cy="152" r="7" fill="url(#al-skin)"/>
                        {/* Parent pants */}
                        <rect x="62" y="165" width="13" height="24" rx="7" fill="url(#al-pantsA)"/>
                        <rect x="80" y="165" width="13" height="24" rx="7" fill="url(#al-pantsA)"/>
                        <rect x="62" y="165" width="31" height="6" rx="3" fill="#1A0B08" opacity="0.5"/>
                        {/* Parent shoes */}
                        <rect x="59" y="183" width="19" height="8" rx="4" fill="#111"/>
                        <rect x="78" y="183" width="19" height="8" rx="4" fill="#111"/>
                        <rect x="61" y="183" width="11" height="3" rx="1.5" fill="white" opacity="0.12"/>
                        <rect x="80" y="183" width="11" height="3" rx="1.5" fill="white" opacity="0.12"/>
                        {/* Parent shirt */}
                        <rect x="55" y="123" width="52" height="48" rx="15" fill="url(#al-shirtA)" filter="url(#al-shadow)"/>
                        {/* Parent collar */}
                        <path d="M72 123 L81 133 L90 123" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.35"/>
                        {/* Parent shirt shine */}
                        <ellipse cx="68" cy="131" rx="7" ry="4" fill="white" opacity="0.12"/>
                        {/* Parent right arm toward shield */}
                        <path d="M107 131 Q120 125 128 119" stroke="url(#al-skin2)" strokeWidth="12" strokeLinecap="round" fill="none"/>
                        <circle cx="129" cy="118" r="7" fill="url(#al-skin)"/>
                        {/* Parent neck */}
                        <rect x="73" y="117" width="14" height="10" rx="4" fill="url(#al-skin)"/>
                        {/* Parent ears */}
                        <ellipse cx="58" cy="103" rx="5" ry="7" fill="#FFCC88"/>
                        <ellipse cx="58" cy="103" rx="3" ry="5" fill="#FFB870" opacity="0.6"/>
                        <ellipse cx="100" cy="103" rx="5" ry="7" fill="#FFCC88"/>
                        <ellipse cx="100" cy="103" rx="3" ry="5" fill="#FFB870" opacity="0.6"/>
                        {/* Parent head */}
                        <circle cx="79" cy="101" r="24" fill="url(#al-skin)" filter="url(#al-shadow)"/>
                        <circle cx="71" cy="92" r="9" fill="white" opacity="0.18"/>
                        {/* Parent hair back */}
                        <ellipse cx="79" cy="80" rx="22" ry="11" fill="#5D4037"/>
                        {/* Parent hair main */}
                        <ellipse cx="79" cy="79" rx="21" ry="10" fill="url(#al-hair)"/>
                        <rect x="59" y="79" width="10" height="16" rx="5" fill="url(#al-hair)"/>
                        <rect x="90" y="79" width="10" height="16" rx="5" fill="url(#al-hair)"/>
                        {/* Parent hair highlight */}
                        <path d="M69 72 Q78 68 87 72" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.15"/>
                        {/* Parent eyebrows */}
                        <path d="M68 94 Q71 91 74 94" stroke="#5D4037" strokeWidth="1.7" strokeLinecap="round" fill="none"/>
                        <path d="M84 94 Q87 91 90 94" stroke="#5D4037" strokeWidth="1.7" strokeLinecap="round" fill="none"/>
                        {/* Parent eyes */}
                        <circle cx="71" cy="100" r="3.5" fill="#2C1810"/>
                        <circle cx="87" cy="100" r="3.5" fill="#2C1810"/>
                        <circle cx="73" cy="98" r="1.3" fill="white" opacity="0.9"/>
                        <circle cx="89" cy="98" r="1.3" fill="white" opacity="0.9"/>
                        {/* Parent smile */}
                        <path d="M73 108 Q79 114 85 108" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.4"/>
                        <path d="M73 108 Q79 115 85 108" stroke="#C67B3A" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                        {/* Parent cheeks */}
                        <ellipse cx="65" cy="105" rx="5" ry="3" fill="#FFB0A0" opacity="0.35"/>
                        <ellipse cx="93" cy="105" rx="5" ry="3" fill="#FFB0A0" opacity="0.35"/>
                        {/* ── Child (right, smaller) ── */}
                        {/* Child pants */}
                        <rect x="153" y="168" width="11" height="21" rx="6" fill="#1A237E"/>
                        <rect x="169" y="168" width="11" height="21" rx="6" fill="#1A237E"/>
                        <rect x="153" y="168" width="27" height="5" rx="2.5" fill="#0D1457" opacity="0.5"/>
                        {/* Child shoes */}
                        <rect x="150" y="184" width="16" height="7" rx="3.5" fill="#111"/>
                        <rect x="167" y="184" width="16" height="7" rx="3.5" fill="#111"/>
                        {/* Child shirt */}
                        <rect x="148" y="138" width="42" height="36" rx="12" fill="url(#al-shirtB)" filter="url(#al-softshadow)"/>
                        {/* Child collar */}
                        <path d="M161 138 L169 147 L177 138" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.3"/>
                        {/* Child shirt shine */}
                        <ellipse cx="156" cy="145" rx="5" ry="3" fill="white" opacity="0.12"/>
                        {/* Child neck */}
                        <rect x="162" y="133" width="12" height="9" rx="4" fill="url(#al-skin)"/>
                        {/* Child ears */}
                        <ellipse cx="149" cy="124" rx="4" ry="5.5" fill="#FFCC88"/>
                        <ellipse cx="149" cy="124" rx="2.5" ry="4" fill="#FFB870" opacity="0.6"/>
                        <ellipse cx="183" cy="124" rx="4" ry="5.5" fill="#FFCC88"/>
                        <ellipse cx="183" cy="124" rx="2.5" ry="4" fill="#FFB870" opacity="0.6"/>
                        {/* Child head */}
                        <circle cx="166" cy="122" r="20" fill="url(#al-skin)" filter="url(#al-softshadow)"/>
                        <circle cx="159" cy="114" r="7" fill="white" opacity="0.18"/>
                        {/* Child hair back */}
                        <ellipse cx="166" cy="104" rx="18" ry="9" fill="#5D4037"/>
                        {/* Child hair main */}
                        <ellipse cx="166" cy="103" rx="17" ry="8" fill="url(#al-hair)"/>
                        <rect x="149" y="103" width="8" height="13" rx="4" fill="url(#al-hair)"/>
                        <rect x="181" y="103" width="8" height="13" rx="4" fill="url(#al-hair)"/>
                        {/* Child hair highlight */}
                        <path d="M158 97 Q165 94 172 97" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.15"/>
                        {/* Child eyebrows */}
                        <path d="M157 117 Q160 114 163 117" stroke="#5D4037" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                        <path d="M169 117 Q172 114 175 117" stroke="#5D4037" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                        {/* Child eyes */}
                        <circle cx="160" cy="122" r="3" fill="#2C1810"/>
                        <circle cx="172" cy="122" r="3" fill="#2C1810"/>
                        <circle cx="161.5" cy="120.5" r="1.1" fill="white" opacity="0.9"/>
                        <circle cx="173.5" cy="120.5" r="1.1" fill="white" opacity="0.9"/>
                        {/* Child smile */}
                        <path d="M161 129 Q166 135 171 129" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.4"/>
                        <path d="M161 129 Q166 135 171 129" stroke="#C67B3A" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
                        {/* Child cheeks */}
                        <ellipse cx="155" cy="126" rx="4" ry="2.5" fill="#FFB0A0" opacity="0.4"/>
                        <ellipse cx="177" cy="126" rx="4" ry="2.5" fill="#FFB0A0" opacity="0.4"/>
                        {/* ── Shield in center ── */}
                        <path d="M130 55 L157 71 L157 104 C157 124 142 137 130 144 C118 137 103 124 103 104 L103 71 Z" fill="url(#al-shield)" stroke="#F5A623" strokeWidth="2.5" filter="url(#al-shadow)"/>
                        {/* Shield inner */}
                        <path d="M130 67 L150 80 L150 105 C150 121 139 132 130 137 C121 132 110 121 110 105 L110 80 Z" fill="#FFE0B2" opacity="0.7"/>
                        {/* Shield shine */}
                        <ellipse cx="121" cy="68" rx="10" ry="5" fill="white" opacity="0.25"/>
                        {/* Check mark on shield */}
                        <path d="M118 103 L127 112 L144 91" stroke="#4CAF50" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M119 103 L127 111 L143 92" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3"/>
                      </svg>
                    </div>
                  </div>
                );
              })()}

              {/* ─── edit-export ─── */}
              {settingsDetailView === 'edit-export' && (
                <div className="min-h-[calc(100vh-280px)] flex flex-col" style={{ paddingBottom: keyboardHeight > 0 ? keyboardHeight : undefined }}>
                  <div className="space-y-4">
                    <h2 className="text-[28px] font-bold text-foreground pb-2">Eksporter mine data</h2>
                    <div className="rounded-[12px] bg-muted/50 p-4 space-y-2">
                      <p className="text-[14px] font-medium text-foreground">GDPR Data-export</p>
                      <p className="text-[13px] text-muted-foreground">Du kan downloade alle dine persondata som en JSON-fil. Dette inkluderer din profil, børnedata, begivenheder, beskeder og dokumenter.</p>
                    </div>
                  </div>
                  <div className="flex-1 flex items-center justify-center py-8">
                    <svg width="260" height="200" viewBox="0 0 260 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="ex-skin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFDDAA"/><stop offset="1" stopColor="#FFBB77"/></linearGradient>
                        <linearGradient id="ex-skin2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#FFDDAA"/><stop offset="1" stopColor="#FFBB77"/></linearGradient>
                        <linearGradient id="ex-hair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8D6E63"/><stop offset="1" stopColor="#5D4037"/></linearGradient>
                        <linearGradient id="ex-shirt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9FA8DA"/><stop offset="0.5" stopColor="#7986CB"/><stop offset="1" stopColor="#3F51B5"/></linearGradient>
                        <linearGradient id="ex-pants" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#37474F"/><stop offset="1" stopColor="#263238"/></linearGradient>
                        <linearGradient id="ex-box" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ECEFF1"/><stop offset="0.5" stopColor="#E8EAF6"/><stop offset="1" stopColor="#C5CAE9"/></linearGradient>
                        <linearGradient id="ex-btn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9FA8DA"/><stop offset="1" stopColor="#5C6BC0"/></linearGradient>
                        <filter id="ex-shadow"><feDropShadow dx="0" dy="5" stdDeviation="7" floodOpacity="0.15"/></filter>
                        <filter id="ex-softshadow"><feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.1"/></filter>
                      </defs>
                      {/* Background sparkles */}
                      <circle cx="36" cy="38" r="5" fill="#FFD54F" opacity="0.45"/>
                      <rect x="33" y="35" width="6" height="6" rx="1" fill="#FFD54F" opacity="0.2" transform="rotate(45 36 38)"/>
                      <circle cx="192" cy="34" r="4" fill="#7986CB" opacity="0.35"/>
                      <circle cx="192" cy="118" r="4" fill="#C5CAE9" opacity="0.35"/>
                      <rect x="210" y="155" width="6" height="6" rx="1" fill="#9FA8DA" opacity="0.2" transform="rotate(45 213 158)"/>
                      {/* Ground shadow */}
                      <ellipse cx="116" cy="191" rx="58" ry="7" fill="#000" opacity="0.08"/>
                      {/* Arms raised holding box */}
                      <path d="M91 130 Q74 120 65 110" stroke="url(#ex-skin2)" strokeWidth="13" strokeLinecap="round" fill="none"/>
                      <circle cx="64" cy="109" r="7" fill="url(#ex-skin)"/>
                      <path d="M141 130 Q158 120 165 110" stroke="url(#ex-skin2)" strokeWidth="13" strokeLinecap="round" fill="none"/>
                      <circle cx="166" cy="109" r="7" fill="url(#ex-skin)"/>
                      {/* Download box — 3D */}
                      <rect x="58" y="44" width="108" height="68" rx="12" fill="url(#ex-box)" stroke="#7986CB" strokeWidth="2" filter="url(#ex-softshadow)"/>
                      {/* Box shine */}
                      <rect x="62" y="47" width="26" height="6" rx="3" fill="white" opacity="0.3"/>
                      {/* Box side face (3D depth) */}
                      <path d="M166 44 L176 52 L176 120 L166 112 Z" fill="#B0BEC5" opacity="0.35"/>
                      <path d="M58 44 L68 52 L176 52 L166 44 Z" fill="white" opacity="0.2"/>
                      {/* Document icon inside box */}
                      <rect x="78" y="60" width="70" height="8" rx="4" fill="#9FA8DA"/>
                      <rect x="78" y="74" width="52" height="7" rx="3.5" fill="#9FA8DA"/>
                      <rect x="78" y="88" width="60" height="7" rx="3.5" fill="#9FA8DA"/>
                      {/* Doc icon line highlights */}
                      <rect x="80" y="62" width="14" height="2" rx="1" fill="white" opacity="0.3"/>
                      <rect x="80" y="76" width="10" height="2" rx="1" fill="white" opacity="0.3"/>
                      {/* Download arrow circle */}
                      <circle cx="114" cy="130" r="20" fill="url(#ex-btn)" filter="url(#ex-softshadow)"/>
                      <circle cx="114" cy="130" r="20" fill="none" stroke="white" strokeWidth="1" opacity="0.2"/>
                      <path d="M114 119 L114 139" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                      <path d="M107 133 L114 140 L121 133" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                      {/* Arrow shine */}
                      <ellipse cx="109" cy="122" rx="5" ry="3" fill="white" opacity="0.2"/>
                      {/* Pants */}
                      <rect x="96" y="163" width="15" height="26" rx="8" fill="url(#ex-pants)"/>
                      <rect x="117" y="163" width="15" height="26" rx="8" fill="url(#ex-pants)"/>
                      <rect x="96" y="163" width="36" height="6" rx="3" fill="#151F24" opacity="0.5"/>
                      {/* Shoes */}
                      <rect x="93" y="183" width="21" height="9" rx="5" fill="#111"/>
                      <rect x="114" y="183" width="21" height="9" rx="5" fill="#111"/>
                      <rect x="95" y="183" width="13" height="3" rx="1.5" fill="white" opacity="0.12"/>
                      <rect x="116" y="183" width="13" height="3" rx="1.5" fill="white" opacity="0.12"/>
                      {/* Body/shirt */}
                      <rect x="89" y="121" width="56" height="48" rx="16" fill="url(#ex-shirt)" filter="url(#ex-shadow)"/>
                      {/* Collar */}
                      <path d="M106 121 L117 133 L128 121" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.35"/>
                      {/* Shirt shine */}
                      <ellipse cx="102" cy="131" rx="7" ry="4" fill="white" opacity="0.12"/>
                      {/* Neck */}
                      <rect x="109" y="115" width="16" height="10" rx="4" fill="url(#ex-skin)"/>
                      {/* Ears */}
                      <ellipse cx="91" cy="100" rx="5" ry="7" fill="#FFCC88"/>
                      <ellipse cx="91" cy="100" rx="3" ry="5" fill="#FFB870" opacity="0.6"/>
                      <ellipse cx="139" cy="100" rx="5" ry="7" fill="#FFCC88"/>
                      <ellipse cx="139" cy="100" rx="3" ry="5" fill="#FFB870" opacity="0.6"/>
                      {/* Head */}
                      <circle cx="115" cy="98" r="26" fill="url(#ex-skin)" filter="url(#ex-shadow)"/>
                      <circle cx="107" cy="89" r="9" fill="white" opacity="0.18"/>
                      {/* Hair back */}
                      <ellipse cx="115" cy="76" rx="24" ry="12" fill="#5D4037"/>
                      {/* Hair main */}
                      <ellipse cx="115" cy="75" rx="23" ry="11" fill="url(#ex-hair)"/>
                      <rect x="92" y="75" width="11" height="17" rx="5.5" fill="url(#ex-hair)"/>
                      <rect x="126" y="75" width="11" height="17" rx="5.5" fill="url(#ex-hair)"/>
                      {/* Hair highlight */}
                      <path d="M104 68 Q113 64 122 68" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.15"/>
                      {/* Eyebrows */}
                      <path d="M103 91 Q106 88 109 91" stroke="#5D4037" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                      <path d="M121 91 Q124 88 127 91" stroke="#5D4037" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                      {/* Eyes */}
                      <circle cx="106" cy="97" r="4" fill="#2C1810"/>
                      <circle cx="124" cy="97" r="4" fill="#2C1810"/>
                      <circle cx="108" cy="95" r="1.5" fill="white" opacity="0.9"/>
                      <circle cx="126" cy="95" r="1.5" fill="white" opacity="0.9"/>
                      {/* Mouth */}
                      <path d="M108 107 Q115 113 122 107" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.4"/>
                      <path d="M108 107 Q115 114 122 107" stroke="#C67B3A" strokeWidth="2" strokeLinecap="round" fill="none"/>
                      {/* Cheeks */}
                      <ellipse cx="100" cy="103" rx="5" ry="3" fill="#FFB0A0" opacity="0.35"/>
                      <ellipse cx="130" cy="103" rx="5" ry="3" fill="#FFB0A0" opacity="0.35"/>
                    </svg>
                  </div>
                  <Button
                    className="w-full shrink-0 rounded-[12px] py-3"
                    onClick={async () => {
                      try {
                        const { exportAllData } = await import('@/lib/export');
                        await exportAllData();
                        toast.success('Data eksporteret');
                      } catch {
                        toast.error('Kunne ikke eksportere data');
                      }
                    }}
                  >
                    Eksporter
                  </Button>
                </div>
              )}

              {/* ─── edit-delete ─── */}
              {settingsDetailView === 'edit-delete' && (
                <div className="min-h-[calc(100vh-280px)] flex flex-col" style={{ paddingBottom: keyboardHeight > 0 ? keyboardHeight : undefined }}>
                  <div className="space-y-4">
                    <h2 className="text-[28px] font-bold text-foreground pb-2">Slet min konto</h2>
                    <div className="rounded-[12px] bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 p-4 space-y-2">
                      <p className="text-[14px] font-semibold text-red-600">Advarsel</p>
                      <p className="text-[13px] text-red-600/80">Denne handling er permanent og kan IKKE fortrydes. Alle dine persondata, profil, beskeder og dokumenter vil blive slettet.</p>
                    </div>
                  </div>
                  <div className="flex-1 flex items-center justify-center py-8">
                    <svg width="260" height="200" viewBox="0 0 260 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="dl-skin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFDDAA"/><stop offset="1" stopColor="#FFBB77"/></linearGradient>
                        <linearGradient id="dl-skin2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#FFDDAA"/><stop offset="1" stopColor="#FFBB77"/></linearGradient>
                        <linearGradient id="dl-hair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8D6E63"/><stop offset="1" stopColor="#5D4037"/></linearGradient>
                        <linearGradient id="dl-shirt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFCDD2"/><stop offset="0.5" stopColor="#EF9A9A"/><stop offset="1" stopColor="#C62828"/></linearGradient>
                        <linearGradient id="dl-pants" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4A148C"/><stop offset="1" stopColor="#2E0060"/></linearGradient>
                        <linearGradient id="dl-sign" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFF8F8"/><stop offset="1" stopColor="#FFCDD2"/></linearGradient>
                        <filter id="dl-shadow"><feDropShadow dx="0" dy="5" stdDeviation="7" floodOpacity="0.15"/></filter>
                        <filter id="dl-softshadow"><feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.1"/></filter>
                      </defs>
                      {/* Background sparkles */}
                      <rect x="26" y="48" width="7" height="7" rx="1" fill="#EF5350" opacity="0.22" transform="rotate(45 29 51)"/>
                      <circle cx="220" cy="55" r="4" fill="#EF9A9A" opacity="0.25"/>
                      <rect x="210" y="158" width="6" height="6" rx="1" fill="#E57373" opacity="0.2" transform="rotate(45 213 161)"/>
                      <circle cx="28" cy="155" r="3" fill="#EF5350" opacity="0.2"/>
                      {/* Ground shadow */}
                      <ellipse cx="115" cy="191" rx="58" ry="7" fill="#000" opacity="0.08"/>
                      {/* Left arm raised — stop gesture */}
                      <path d="M91 130 Q72 119 62 108" stroke="url(#dl-skin2)" strokeWidth="13" strokeLinecap="round" fill="none"/>
                      {/* Stop hand — palm facing out */}
                      <ellipse cx="60" cy="106" rx="9" ry="10" fill="url(#dl-skin)" stroke="#FFBB77" strokeWidth="1"/>
                      {/* Fingers on palm */}
                      <rect x="56" y="97" width="4" height="9" rx="2" fill="url(#dl-skin)"/>
                      <rect x="62" y="95" width="4" height="11" rx="2" fill="url(#dl-skin)"/>
                      <rect x="68" y="97" width="4" height="9" rx="2" fill="url(#dl-skin)"/>
                      {/* Right arm down */}
                      <path d="M142 133 Q160 141 164 156" stroke="url(#dl-skin2)" strokeWidth="13" strokeLinecap="round" fill="none"/>
                      <circle cx="164" cy="157" r="7" fill="url(#dl-skin)"/>
                      {/* Warning sign — 3D triangle */}
                      <path d="M150 22 L202 115 L98 115 Z" fill="url(#dl-sign)" stroke="#EF5350" strokeWidth="3" filter="url(#dl-softshadow)"/>
                      {/* Sign side (3D depth) */}
                      <path d="M202 115 L210 121 L106 121 L98 115 Z" fill="#FFCDD2" opacity="0.6"/>
                      {/* Sign shine */}
                      <path d="M138 35 L152 25 L166 46" stroke="white" strokeWidth="2" fill="none" opacity="0.25"/>
                      {/* Exclamation mark */}
                      <rect x="146" y="52" width="8" height="34" rx="4" fill="#EF5350"/>
                      <rect x="147" y="52" width="3" height="16" rx="1.5" fill="white" opacity="0.2"/>
                      <circle cx="150" cy="99" r="5.5" fill="#EF5350"/>
                      <circle cx="151" cy="97" r="2" fill="white" opacity="0.25"/>
                      {/* Pants */}
                      <rect x="96" y="165" width="15" height="26" rx="8" fill="url(#dl-pants)"/>
                      <rect x="117" y="165" width="15" height="26" rx="8" fill="url(#dl-pants)"/>
                      <rect x="96" y="165" width="36" height="6" rx="3" fill="#1A0040" opacity="0.5"/>
                      {/* Shoes */}
                      <rect x="93" y="185" width="21" height="9" rx="5" fill="#111"/>
                      <rect x="114" y="185" width="21" height="9" rx="5" fill="#111"/>
                      <rect x="95" y="185" width="13" height="3" rx="1.5" fill="white" opacity="0.12"/>
                      <rect x="116" y="185" width="13" height="3" rx="1.5" fill="white" opacity="0.12"/>
                      {/* Body/shirt */}
                      <rect x="90" y="123" width="56" height="48" rx="16" fill="url(#dl-shirt)" filter="url(#dl-shadow)"/>
                      {/* Collar */}
                      <path d="M107 123 L118 134 L129 123" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.35"/>
                      {/* Shirt shine */}
                      <ellipse cx="103" cy="132" rx="7" ry="4" fill="white" opacity="0.12"/>
                      {/* Neck */}
                      <rect x="110" y="117" width="16" height="10" rx="4" fill="url(#dl-skin)"/>
                      {/* Ears */}
                      <ellipse cx="91" cy="102" rx="5" ry="7" fill="#FFCC88"/>
                      <ellipse cx="91" cy="102" rx="3" ry="5" fill="#FFB870" opacity="0.6"/>
                      <ellipse cx="139" cy="102" rx="5" ry="7" fill="#FFCC88"/>
                      <ellipse cx="139" cy="102" rx="3" ry="5" fill="#FFB870" opacity="0.6"/>
                      {/* Head */}
                      <circle cx="115" cy="100" r="26" fill="url(#dl-skin)" filter="url(#dl-shadow)"/>
                      <circle cx="107" cy="91" r="9" fill="white" opacity="0.18"/>
                      {/* Hair back */}
                      <ellipse cx="115" cy="78" rx="24" ry="12" fill="#5D4037"/>
                      {/* Hair main */}
                      <ellipse cx="115" cy="77" rx="23" ry="11" fill="url(#dl-hair)"/>
                      <rect x="92" y="77" width="11" height="17" rx="5.5" fill="url(#dl-hair)"/>
                      <rect x="126" y="77" width="11" height="17" rx="5.5" fill="url(#dl-hair)"/>
                      {/* Hair highlight */}
                      <path d="M104 70 Q113 66 122 70" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.15"/>
                      {/* Eyebrows — worried / inner-up */}
                      <path d="M104 93 Q107 90 110 93" stroke="#8D6E63" strokeWidth="2" strokeLinecap="round" fill="none"/>
                      <path d="M120 93 Q123 90 126 93" stroke="#8D6E63" strokeWidth="2" strokeLinecap="round" fill="none"/>
                      {/* Eyes — worried wide */}
                      <circle cx="107" cy="100" r="4.2" fill="#2C1810"/>
                      <circle cx="123" cy="100" r="4.2" fill="#2C1810"/>
                      <circle cx="109" cy="98" r="1.5" fill="white" opacity="0.9"/>
                      <circle cx="125" cy="98" r="1.5" fill="white" opacity="0.9"/>
                      {/* Worried mouth — frown */}
                      <path d="M109 111 Q116 106 123 111" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.4"/>
                      <path d="M109 111 Q116 107 123 111" stroke="#C67B3A" strokeWidth="2" strokeLinecap="round" fill="none"/>
                      {/* Sweat drop */}
                      <path d="M131 90 Q134 85 137 90 Q137 94 134 94 Q131 94 131 90Z" fill="#90CAF9" opacity="0.6"/>
                      {/* Cheeks — stressed pink */}
                      <ellipse cx="100" cy="106" rx="5.5" ry="3.5" fill="#FFB0A0" opacity="0.45"/>
                      <ellipse cx="130" cy="106" rx="5.5" ry="3.5" fill="#FFB0A0" opacity="0.45"/>
                    </svg>
                  </div>
                  <Button
                    variant="destructive"
                    className="w-full shrink-0 rounded-[12px] py-3"
                    onClick={async () => {
                      if (!window.confirm('Er du sikker? Din konto og alle persondata slettes permanent. Denne handling kan IKKE fortrydes.')) return;
                      if (!window.confirm('Sidste chance — bekræft at du vil slette din konto permanent.')) return;
                      try {
                        const { deleteAccount } = await import('@/lib/auth');
                        await deleteAccount();
                        window.location.reload();
                      } catch (err: unknown) {
                        toast.error((err as Error)?.message || 'Kontosletning fejlede');
                      }
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Slet min konto
                  </Button>
                </div>
              )}
            </motion.div>
          )}
          </AnimatePresence>

        </TabsContent>

        <TabsContent value="family" className="space-y-2">
          {/* Quick link to family type setting */}
          <button
            onClick={() => setActiveSettingsTab('familytype')}
            className="flex w-full items-center justify-between rounded-[8px] border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-card"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-background">
                <Home className="h-[18px] w-[18px] text-muted-foreground" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-foreground">{familyModeLabels[currentMode]}</p>
                <p className="text-[11px] text-muted-foreground">Tryk for at ændre familietype</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>

          {/* Samboende / Co-parenting section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Heart className="h-4 w-4" />
                {isTogetherMode ? 'Samboende' : 'Co-parenting'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {(() => {
                // Find partner: other parent in household
                const partnerUser = users.find(u =>
                  u.role === 'parent' && u.id !== currentUser?.id
                );
                if (partnerUser) {
                  return (
                    <div className="flex items-center gap-3 rounded-[8px] border border-border bg-card p-3">
                      <Avatar className="h-10 w-10 border border-white shadow-sm">
                        <AvatarImage src={partnerUser.avatar} />
                        <AvatarFallback className="bg-secondary text-foreground text-sm">
                          {partnerUser.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-medium text-foreground">{partnerUser.name}</p>
                        <p className="text-[13px] text-muted-foreground">{partnerUser.email}</p>
                      </div>
                      <Badge variant="outline" className="text-xs border-green-300 text-green-700 bg-green-50">
                        Tilknyttet
                      </Badge>
                    </div>
                  );
                }
                return (
                  <div className="space-y-2">
                    <div className="rounded-[8px] border border-dashed border-border bg-card p-4 text-center">
                      <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {isTogetherMode
                          ? 'Ingen samboende tilknyttet endnu.'
                          : 'Ingen medforælder tilknyttet endnu.'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Inviter {isTogetherMode ? 'din samboende' : 'din medforælder'} til appen
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={partnerInviteEmail}
                        onChange={(e) => setPartnerInviteEmail(e.target.value)}
                        placeholder="Email på medforælder"
                        className="flex-1 rounded-[8px] border-border"
                      />
                      <Button
                        className="rounded-[8px] bg-primary text-white hover:bg-primary"
                        disabled={!partnerInviteEmail.trim() || !partnerInviteEmail.includes('@') || !household?.id}
                        onClick={async () => {
                          try {
                            const email = partnerInviteEmail.toLowerCase().trim();
                            const { data: partner } = await supabase
                              .from('profiles')
                              .select('id')
                              .eq('email', email)
                              .single();
                            if (partner) {
                              await supabase.from('household_members').insert({
                                user_id: partner.id,
                                household_id: household!.id,
                                role: 'parent',
                              });
                              toast.success(`${partnerInviteEmail} tilføjet til husstanden`);
                            } else {
                              toast.error('Bruger ikke fundet — de skal registrere sig først');
                            }
                            setPartnerInviteEmail('');
                          } catch (err: any) {
                            toast.error(err?.message || 'Kunne ikke sende invitation');
                          }
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

          {!isTogetherMode && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck className="h-4 w-4" />
                  Enlig forsørger støtte
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <div className="flex items-center justify-between rounded-[8px] border border-border bg-card px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">Dokumentationsarkiv</p>
                    <p className="text-[13px] text-muted-foreground">Gem kvitteringer og beviser centralt</p>
                  </div>
                  <IOSSwitch
                    checked={Boolean(household?.singleParentSupport?.evidenceVaultEnabled)}
                    disabled={!features.singleParentEvidence}
                    onCheckedChange={(value) => handleUpdateSingleParentSetting('evidenceVaultEnabled', value)}
                  />
                </div>
                <div className="flex items-center justify-between rounded-[8px] border border-border bg-card px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">Auto-arkiver kvitteringer</p>
                    <p className="text-[13px] text-muted-foreground">Udgiftskvitteringer samles automatisk</p>
                  </div>
                  <IOSSwitch
                    checked={Boolean(household?.singleParentSupport?.autoArchiveReceipts)}
                    disabled={!features.singleParentEvidence}
                    onCheckedChange={(value) => handleUpdateSingleParentSetting('autoArchiveReceipts', value)}
                  />
                </div>

                <div className="rounded-[8px] border border-border bg-card p-3">
                  <p className="mb-1 text-sm font-medium">Del med din advokat</p>
                  <p className="text-[13px] text-muted-foreground">
                    Eksportér dokumenter fra Dokumenter-sektionen og del dem sikkert med din advokat via email eller besked.
                  </p>
                </div>

                <div className="rounded-[8px] border border-border bg-card p-3">
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
                    <div key={doc.id} className="flex items-center justify-between rounded-[8px] border border-border bg-card px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{doc.title}</p>
                        <p className="truncate text-[13px] text-muted-foreground">{doc.url}</p>
                      </div>
                      <Badge variant="outline">Dok</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="subscription" className="space-y-2">
          {isProfessionalView ? (
            /* Read-only licens-status for professionelle */
            <Card className="border border-border rounded-[8px]">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[8px] bg-green-tint flex items-center justify-center">
                    <BadgeCheck className="h-5 w-5 text-[#1a7a3a]" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Aktiv licens</p>
                    <p className="text-xs text-muted-foreground">
                      Administreres af din organisation
                    </p>
                  </div>
                </div>
                {currentUser?.organization && (
                  <p className="text-sm text-muted-foreground">
                    Organisation: {currentUser.organization}
                  </p>
                )}
                {currentUser?.municipality && (
                  <p className="text-sm text-muted-foreground">
                    Kommune: {currentUser.municipality}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Kontakt din administrator for ændringer i abonnement.
                </p>
              </CardContent>
            </Card>
          ) : (
          <>
          {/* Interval toggle */}
          <div className="flex rounded-[8px] border-2 border-border bg-card p-1">
            {([
              { value: 'monthly' as BillingInterval, label: 'Månedlig' },
              { value: 'annual' as BillingInterval, label: 'Årlig (spar 17%)' },
            ]).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setBillingInterval(opt.value)}
                className={cn(
                  'flex-1 rounded-[3px] py-2 text-[13px] font-semibold transition-all',
                  billingInterval === opt.value
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

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
              price: billingInterval === 'monthly'
                ? `${PLAN_PRICES.family_plus.monthly} kr/md`
                : `${PLAN_PRICES.family_plus.annual} kr/år`,
              description: billingInterval === 'annual'
                ? `Svarer til ${PLAN_PRICES.family_plus.annualMonthly} kr/md`
                : 'Alt til den aktive familie',
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
              price: billingInterval === 'monthly'
                ? `${PLAN_PRICES.single_parent_plus.monthly} kr/md`
                : `${PLAN_PRICES.single_parent_plus.annual} kr/år`,
              description: billingInterval === 'annual'
                ? `Svarer til ${PLAN_PRICES.single_parent_plus.annualMonthly} kr/md`
                : 'Fuld dokumentation + juridisk',
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
                  'relative w-full rounded-[8px] border-2 p-4 text-left transition-all',
                  isActive
                    ? 'border-[#f58a2d] bg-orange-tint-light shadow-[0_2px_12px_rgba(245,138,45,0.12)]'
                    : 'border-border bg-card hover:border-border',
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
                      <p className="text-lg font-bold text-foreground">{planCard.name}</p>
                      {isActive && <BadgeCheck className="h-5 w-5 text-[#f58a2d]" />}
                    </div>
                    <p className="text-[13px] text-muted-foreground">{planCard.description}</p>
                  </div>
                  <p className="text-right">
                    <span className="text-lg font-bold text-foreground">{planCard.price.split('/')[0]}</span>
                    <span className="text-[13px] text-muted-foreground">/{planCard.price.split('/')[1]}</span>
                  </p>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-1">
                  {planCard.features.map((f) => (
                    <div key={f.label} className="flex items-center gap-2">
                      {f.included ? (
                        <Check className="h-3.5 w-3.5 shrink-0 text-[#f58a2d]" />
                      ) : (
                        <XIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      )}
                      <span className={cn('text-[13px]', f.included ? 'text-foreground' : 'text-muted-foreground')}>
                        {f.label}
                      </span>
                    </div>
                  ))}
                </div>
                {isActive && (
                  <div className="mt-3 rounded-[8px] bg-[#f58a2d]/10 px-3 py-1.5 text-center text-[13px] font-semibold text-[#f58a2d]">
                    Aktiv plan
                  </div>
                )}
              </button>
            );
          })}

          {/* "Skift plan" CTA for free users */}
          {plan === 'free' && (
            <div className="rounded-[8px] border-2 border-dashed border-orange-tint bg-orange-tint-light p-5 text-center">
              <Star className="h-8 w-8 text-[#f58a2d] mx-auto mb-2" />
              <p className="text-base font-bold text-foreground">Opgrader din plan</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Få adgang til flere børn, udgiftsmodul, indkøbsscanner og meget mere.
              </p>
              <Button
                className="rounded-[8px] bg-[#f58a2d] text-white hover:bg-[#e47921] px-8"
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
            <div className="p-5 text-center space-y-2">
              <p className="text-sm font-semibold text-foreground">Administrer dit abonnement</p>
              <p className="text-xs text-muted-foreground">
                Ændr betalingsmetode, se fakturaer eller annuller dit abonnement.
              </p>
              <Button
                variant="outline"
                className="rounded-[8px] border-border text-[13px]"
                onClick={handleManageSubscription}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Åbn abonnementsstyring
              </Button>
            </div>
          )}
          </>
          )}
        </TabsContent>

        <TabsContent value="payments" className="space-y-0">
          <AnimatePresence mode="wait">
          {!settingsDetailView ? (
            <motion.div
              key="payments-main"
              initial={{ x: 0, opacity: 1 }}
              exit={{ x: -60, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="space-y-2"
            >
              <div className="px-1 pt-2 pb-4">
                <p className="text-[13px] text-muted-foreground">
                  Administrer betalingsmetoder, gavekort og kreditter.
                </p>
              </div>

              {/* ─── Gavekort, Kreditter, Indløs kode ─── */}
              <div className="divide-y divide-border">
                <button
                  onClick={() => setSettingsDetailView('payment-giftcard')}
                  className="flex w-full items-center justify-between py-3.5 px-1 text-left transition-colors hover:bg-card"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-orange-tint">
                      <CreditCard className="h-[18px] w-[18px] text-[#f58a2d]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[15px] font-medium text-foreground">Gavekort</p>
                      <p className="text-[13px] text-muted-foreground">Giv en gave til en ven eller familiemedlem</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                </button>
                <button
                  onClick={() => setSettingsDetailView('payment-credits')}
                  className="flex w-full items-center justify-between py-3.5 px-1 text-left transition-colors hover:bg-card"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[#E8F5E9]">
                      <Star className="h-[18px] w-[18px] text-[#66BB6A]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[15px] font-medium text-foreground">Kreditter</p>
                      <p className="text-[13px] text-muted-foreground">Optjen kreditter ved at invitere venner</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-[13px] font-semibold text-muted-foreground">0 kr</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
                <button
                  onClick={() => setSettingsDetailView('payment-redeem')}
                  className="flex w-full items-center justify-between py-3.5 px-1 text-left transition-colors hover:bg-card"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[#EDE7F6]">
                      <ArrowRight className="h-[18px] w-[18px] text-[#7E57C2]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[15px] font-medium text-foreground">Indløs kode</p>
                      <p className="text-[13px] text-muted-foreground">Indløs gavekort eller kampagnekode</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                </button>
              </div>

              <div className="border-t border-border" />

              {/* ─── Betalingskonti ─── */}
              <div className="pt-2">
                <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide px-1 pb-2">Betalingskonti</p>

                {myPaymentAccounts.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {myPaymentAccounts.map((account) => (
                      <div key={account.id} className="flex items-center justify-between rounded-[8px] border-2 border-border bg-card px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-background">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-semibold text-foreground">{account.accountLabel}</p>
                            <p className="truncate text-[11px] text-muted-foreground">{account.accountHandle}</p>
                          </div>
                        </div>
                        {account.isPrimary ? (
                          <span className="shrink-0 rounded-[8px] bg-orange-tint border border-orange-tint px-2.5 py-1 text-[11px] font-semibold text-[#f58a2d]">Primær</span>
                        ) : (
                          <button
                            onClick={() => handleSetPrimaryPayment(account.id)}
                            className="shrink-0 rounded-[8px] border-2 border-border px-2.5 py-1 text-[11px] font-semibold text-muted-foreground transition-all active:scale-[0.96]"
                          >
                            Sæt primær
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Tilføj ny konto */}
                <div className="rounded-[8px] border-2 border-border bg-card p-4 space-y-3">
                  <p className="text-[13px] font-semibold text-foreground">Tilføj betalingskonto</p>
                  <SelectSheet
                    value={paymentDraft.provider}
                    onValueChange={(value) => setPaymentDraft((prev) => ({ ...prev, provider: value }))}
                    title="Betalingstype"
                    options={[
                      { value: 'mobilepay', label: 'MobilePay' },
                      { value: 'bank', label: 'Bankkonto' },
                      { value: 'card', label: 'Kort' },
                      { value: 'other', label: 'Andet' },
                    ]}
                    className="rounded-[8px] border-border"
                  />
                  <Input
                    value={paymentDraft.accountLabel}
                    onChange={(e) => setPaymentDraft((prev) => ({ ...prev, accountLabel: e.target.value }))}
                    placeholder="Kontonavn (fx 'Min MobilePay')"
                    className="rounded-[8px] border-border"
                  />
                  <Input
                    value={paymentDraft.accountHandle}
                    onChange={(e) => setPaymentDraft((prev) => ({ ...prev, accountHandle: e.target.value }))}
                    placeholder="Telefonnr. eller kontonummer"
                    className="rounded-[8px] border-border"
                  />
                  <button
                    onClick={handleAddPaymentAccount}
                    disabled={!features.inAppPayments}
                    className={cn(
                      "w-full rounded-[8px] py-2.5 text-[13px] font-semibold transition-all active:scale-[0.98]",
                      features.inAppPayments
                        ? "bg-primary text-white"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    Tilføj konto
                  </button>
                  {!features.inAppPayments && (
                    <p className="text-[11px] text-muted-foreground text-center">
                      Opgrader til Family Plus for betalingsfunktioner
                    </p>
                  )}
                </div>

                {myPaymentAccounts.length === 0 && (
                  <div className="mt-3 rounded-[8px] border-2 border-dashed border-border bg-card p-4 text-center">
                    <CreditCard className="mx-auto h-6 w-6 text-muted-foreground mb-1.5" />
                    <p className="text-[12px] text-muted-foreground">Ingen betalingskonti tilføjet endnu</p>
                  </div>
                )}
              </div>

              {/* Abonnementsmodel info */}
              <div className="mt-4 rounded-[8px] border-2 border-border bg-card px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">Abonnementsmodel</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {isTogetherMode
                        ? 'Samboende: abonnement deles automatisk'
                        : 'Skilt/co-parenting: separat abonnement pr. bruger'}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-[8px] bg-background px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                    {isTogetherMode ? 'Delt' : 'Separat'}
                  </span>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={settingsDetailView}
              initial={{ x: 60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 60, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              {/* ─── Gavekort ─── */}
              {settingsDetailView === 'payment-giftcard' && (
                <div className="min-h-[calc(100vh-280px)] flex flex-col" style={{ paddingBottom: keyboardHeight > 0 ? keyboardHeight : undefined }}>
                  <div className="space-y-4">
                    <h2 className="text-[28px] font-bold text-foreground pb-2">Gavekort</h2>
                    <p className="text-[13px] text-muted-foreground">Vælg et beløb og send et gavekort til en ven eller familiemedlem.</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[50, 100, 200, 500].map(amount => (
                        <button
                          key={amount}
                          className="rounded-[12px] border-2 border-border bg-card px-4 py-4 text-center transition-all hover:border-[#f58a2d] hover:bg-orange-tint-light active:scale-[0.97]"
                        >
                          <p className="text-[20px] font-bold text-foreground">{amount} kr</p>
                          <p className="text-[12px] text-muted-foreground mt-1">Gavekort</p>
                        </button>
                      ))}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[13px]">Personlig besked (valgfrit)</Label>
                      <Input placeholder="Tillykke med fødselsdagen!" className="rounded-[12px] border-border bg-card px-4 py-3 text-[15px]" />
                    </div>
                  </div>
                  <div className="flex-1 flex items-center justify-center py-8">
                    <svg width="260" height="200" viewBox="0 0 260 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="gc-skin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFDDAA"/><stop offset="1" stopColor="#FFBB77"/></linearGradient>
                        <linearGradient id="gc-skin2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#FFDDAA"/><stop offset="1" stopColor="#FFBB77"/></linearGradient>
                        <linearGradient id="gc-hair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8D6E63"/><stop offset="1" stopColor="#5D4037"/></linearGradient>
                        <linearGradient id="gc-hairR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E91E8C"/><stop offset="1" stopColor="#880E4F"/></linearGradient>
                        <linearGradient id="gc-shirtA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFB74D"/><stop offset="0.5" stopColor="#F5A623"/><stop offset="1" stopColor="#E65100"/></linearGradient>
                        <linearGradient id="gc-shirtB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#A5D6A7"/><stop offset="0.5" stopColor="#66BB6A"/><stop offset="1" stopColor="#2E7D32"/></linearGradient>
                        <linearGradient id="gc-pantsA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4E342E"/><stop offset="1" stopColor="#2C1810"/></linearGradient>
                        <linearGradient id="gc-pantsB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1A237E"/><stop offset="1" stopColor="#0D1457"/></linearGradient>
                        <linearGradient id="gc-box" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFF8F0"/><stop offset="0.6" stopColor="#FFE0B2"/><stop offset="1" stopColor="#FFCC80"/></linearGradient>
                        <linearGradient id="gc-ribbon" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#EF5350"/><stop offset="1" stopColor="#B71C1C"/></linearGradient>
                        <filter id="gc-shadow"><feDropShadow dx="0" dy="5" stdDeviation="6" floodOpacity="0.15"/></filter>
                        <filter id="gc-softshadow"><feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.1"/></filter>
                      </defs>
                      {/* Background sparkles */}
                      <rect x="18" y="70" width="7" height="7" rx="1" fill="#F5A623" opacity="0.2" transform="rotate(45 21 73)"/>
                      <rect x="230" y="68" width="7" height="7" rx="1" fill="#66BB6A" opacity="0.2" transform="rotate(45 233 71)"/>
                      <circle cx="130" cy="18" r="5" fill="#EF5350" opacity="0.3"/>
                      <circle cx="22" cy="160" r="3" fill="#FFD54F" opacity="0.3"/>
                      <circle cx="237" cy="160" r="3" fill="#81C784" opacity="0.3"/>
                      {/* Ground shadows */}
                      <ellipse cx="75" cy="191" rx="44" ry="6" fill="#000" opacity="0.07"/>
                      <ellipse cx="185" cy="191" rx="44" ry="6" fill="#000" opacity="0.07"/>
                      {/* ── Giver (left) ── */}
                      {/* Giver left arm */}
                      <path d="M48 136 Q34 143 30 155" stroke="url(#gc-skin2)" strokeWidth="12" strokeLinecap="round" fill="none"/>
                      <circle cx="30" cy="156" r="7" fill="url(#gc-skin)"/>
                      {/* Giver pants */}
                      <rect x="53" y="165" width="13" height="22" rx="7" fill="url(#gc-pantsA)"/>
                      <rect x="71" y="165" width="13" height="22" rx="7" fill="url(#gc-pantsA)"/>
                      <rect x="53" y="165" width="31" height="6" rx="3" fill="#1A0B08" opacity="0.5"/>
                      {/* Giver shoes */}
                      <rect x="50" y="181" width="19" height="8" rx="4" fill="#111"/>
                      <rect x="69" y="181" width="19" height="8" rx="4" fill="#111"/>
                      <rect x="52" y="181" width="11" height="3" rx="1.5" fill="white" opacity="0.12"/>
                      <rect x="71" y="181" width="11" height="3" rx="1.5" fill="white" opacity="0.12"/>
                      {/* Giver shirt */}
                      <rect x="46" y="127" width="52" height="44" rx="14" fill="url(#gc-shirtA)" filter="url(#gc-shadow)"/>
                      {/* Giver collar */}
                      <path d="M63 127 L72 137 L81 127" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.35"/>
                      <ellipse cx="59" cy="135" rx="6" ry="3.5" fill="white" opacity="0.12"/>
                      {/* Giver right arm extending gift */}
                      <path d="M98 133 Q116 123 124 117" stroke="url(#gc-skin2)" strokeWidth="12" strokeLinecap="round" fill="none"/>
                      <circle cx="125" cy="116" r="7" fill="url(#gc-skin)"/>
                      {/* Giver neck */}
                      <rect x="65" y="120" width="14" height="10" rx="4" fill="url(#gc-skin)"/>
                      {/* Giver ears */}
                      <ellipse cx="49" cy="107" rx="4.5" ry="6.5" fill="#FFCC88"/>
                      <ellipse cx="49" cy="107" rx="2.5" ry="4.5" fill="#FFB870" opacity="0.6"/>
                      <ellipse cx="91" cy="107" rx="4.5" ry="6.5" fill="#FFCC88"/>
                      <ellipse cx="91" cy="107" rx="2.5" ry="4.5" fill="#FFB870" opacity="0.6"/>
                      {/* Giver head */}
                      <circle cx="70" cy="105" r="24" fill="url(#gc-skin)" filter="url(#gc-shadow)"/>
                      <circle cx="62" cy="96" r="9" fill="white" opacity="0.18"/>
                      {/* Giver hair back */}
                      <ellipse cx="70" cy="83" rx="22" ry="11" fill="#5D4037"/>
                      {/* Giver hair main */}
                      <ellipse cx="70" cy="82" rx="21" ry="10" fill="url(#gc-hair)"/>
                      <rect x="49" y="82" width="10" height="15" rx="5" fill="url(#gc-hair)"/>
                      <rect x="81" y="82" width="10" height="15" rx="5" fill="url(#gc-hair)"/>
                      <path d="M60 75 Q69 71 78 75" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.15"/>
                      {/* Giver eyebrows */}
                      <path d="M59 98 Q62 95 65 98" stroke="#5D4037" strokeWidth="1.7" strokeLinecap="round" fill="none"/>
                      <path d="M75 98 Q78 95 81 98" stroke="#5D4037" strokeWidth="1.7" strokeLinecap="round" fill="none"/>
                      {/* Giver eyes */}
                      <circle cx="62" cy="104" r="3.5" fill="#2C1810"/>
                      <circle cx="78" cy="104" r="3.5" fill="#2C1810"/>
                      <circle cx="64" cy="102" r="1.3" fill="white" opacity="0.9"/>
                      <circle cx="80" cy="102" r="1.3" fill="white" opacity="0.9"/>
                      {/* Giver smile */}
                      <path d="M64 112 Q70 118 76 112" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.4"/>
                      <path d="M64 112 Q70 119 76 112" stroke="#C67B3A" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                      <ellipse cx="57" cy="109" rx="4.5" ry="3" fill="#FFB0A0" opacity="0.35"/>
                      <ellipse cx="83" cy="109" rx="4.5" ry="3" fill="#FFB0A0" opacity="0.35"/>
                      {/* ── Gift box — 3D ── */}
                      <rect x="110" y="100" width="52" height="40" rx="9" fill="url(#gc-box)" stroke="#F5A623" strokeWidth="2" filter="url(#gc-softshadow)"/>
                      {/* Box lid */}
                      <rect x="110" y="100" width="52" height="15" rx="9" fill="#FFE0B2"/>
                      <rect x="110" y="109" width="52" height="6" fill="#FFE0B2"/>
                      {/* Box side (3D depth) */}
                      <path d="M162 100 L170 107 L170 147 L162 140 Z" fill="#FFCC80" opacity="0.5"/>
                      <path d="M110 100 L118 107 L170 107 L162 100 Z" fill="white" opacity="0.2"/>
                      {/* Box shine */}
                      <rect x="114" y="102" width="16" height="4" rx="2" fill="white" opacity="0.3"/>
                      {/* Ribbon vertical */}
                      <rect x="132" y="100" width="7" height="40" fill="url(#gc-ribbon)" opacity="0.7"/>
                      {/* Ribbon horizontal on lid */}
                      <rect x="110" y="107" width="52" height="7" fill="url(#gc-ribbon)" opacity="0.5"/>
                      {/* Bow loops */}
                      <ellipse cx="129" cy="98" rx="11" ry="8" fill="url(#gc-ribbon)"/>
                      <ellipse cx="141" cy="98" rx="11" ry="8" fill="url(#gc-ribbon)"/>
                      <circle cx="135" cy="100" r="5" fill="#C62828"/>
                      <circle cx="132" cy="96" r="3" fill="white" opacity="0.2"/>
                      {/* ── Receiver (right) ── */}
                      {/* Receiver right arm */}
                      <path d="M212 135 Q226 143 230 155" stroke="url(#gc-skin2)" strokeWidth="12" strokeLinecap="round" fill="none"/>
                      <circle cx="230" cy="156" r="7" fill="url(#gc-skin)"/>
                      {/* Receiver pants */}
                      <rect x="173" y="165" width="13" height="22" rx="7" fill="url(#gc-pantsB)"/>
                      <rect x="191" y="165" width="13" height="22" rx="7" fill="url(#gc-pantsB)"/>
                      <rect x="173" y="165" width="31" height="6" rx="3" fill="#060B28" opacity="0.5"/>
                      {/* Receiver shoes */}
                      <rect x="170" y="181" width="19" height="8" rx="4" fill="#111"/>
                      <rect x="189" y="181" width="19" height="8" rx="4" fill="#111"/>
                      <rect x="172" y="181" width="11" height="3" rx="1.5" fill="white" opacity="0.12"/>
                      <rect x="191" y="181" width="11" height="3" rx="1.5" fill="white" opacity="0.12"/>
                      {/* Receiver shirt */}
                      <rect x="168" y="127" width="52" height="44" rx="14" fill="url(#gc-shirtB)" filter="url(#gc-shadow)"/>
                      {/* Receiver collar */}
                      <path d="M185 127 L194 137 L203 127" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.35"/>
                      <ellipse cx="180" cy="135" rx="6" ry="3.5" fill="white" opacity="0.12"/>
                      {/* Receiver left arm reaching */}
                      <path d="M168 133 Q151 123 144 117" stroke="url(#gc-skin2)" strokeWidth="12" strokeLinecap="round" fill="none"/>
                      <circle cx="143" cy="116" r="7" fill="url(#gc-skin)"/>
                      {/* Receiver neck */}
                      <rect x="187" y="120" width="14" height="10" rx="4" fill="url(#gc-skin)"/>
                      {/* Receiver ears */}
                      <ellipse cx="169" cy="107" rx="4.5" ry="6.5" fill="#FFCC88"/>
                      <ellipse cx="169" cy="107" rx="2.5" ry="4.5" fill="#FFB870" opacity="0.6"/>
                      <ellipse cx="211" cy="107" rx="4.5" ry="6.5" fill="#FFCC88"/>
                      <ellipse cx="211" cy="107" rx="2.5" ry="4.5" fill="#FFB870" opacity="0.6"/>
                      {/* Receiver head */}
                      <circle cx="190" cy="105" r="24" fill="url(#gc-skin)" filter="url(#gc-shadow)"/>
                      <circle cx="182" cy="96" r="9" fill="white" opacity="0.18"/>
                      {/* Receiver hair back (longer, different color) */}
                      <ellipse cx="190" cy="83" rx="22" ry="12" fill="#880E4F"/>
                      <rect x="168" y="83" width="10" height="22" rx="5" fill="#880E4F"/>
                      <rect x="202" y="83" width="10" height="22" rx="5" fill="#880E4F"/>
                      {/* Receiver hair main */}
                      <ellipse cx="190" cy="82" rx="21" ry="11" fill="url(#gc-hairR)"/>
                      <rect x="169" y="82" width="9" height="20" rx="4.5" fill="url(#gc-hairR)"/>
                      <rect x="203" y="82" width="9" height="20" rx="4.5" fill="url(#gc-hairR)"/>
                      <path d="M181 75 Q189 71 197 75" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.15"/>
                      {/* Receiver eyebrows */}
                      <path d="M179 98 Q182 95 185 98" stroke="#5D4037" strokeWidth="1.7" strokeLinecap="round" fill="none"/>
                      <path d="M195 98 Q198 95 201 98" stroke="#5D4037" strokeWidth="1.7" strokeLinecap="round" fill="none"/>
                      {/* Receiver eyes */}
                      <circle cx="182" cy="104" r="3.5" fill="#2C1810"/>
                      <circle cx="198" cy="104" r="3.5" fill="#2C1810"/>
                      <circle cx="184" cy="102" r="1.3" fill="white" opacity="0.9"/>
                      <circle cx="200" cy="102" r="1.3" fill="white" opacity="0.9"/>
                      {/* Receiver big smile */}
                      <path d="M184 112 Q190 120 196 112" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.4"/>
                      <path d="M184 112 Q190 121 196 112" stroke="#C67B3A" strokeWidth="2" strokeLinecap="round" fill="none"/>
                      <ellipse cx="177" cy="109" rx="4.5" ry="3" fill="#FFB0A0" opacity="0.4"/>
                      <ellipse cx="203" cy="109" rx="4.5" ry="3" fill="#FFB0A0" opacity="0.4"/>
                    </svg>
                  </div>
                  <Button className="w-full shrink-0 rounded-[12px] py-3">
                    Køb gavekort
                  </Button>
                </div>
              )}

              {/* ─── Kreditter ─── */}
              {settingsDetailView === 'payment-credits' && (
                <div className="min-h-[calc(100vh-280px)] flex flex-col" style={{ paddingBottom: keyboardHeight > 0 ? keyboardHeight : undefined }}>
                  <div className="space-y-4">
                    <h2 className="text-[28px] font-bold text-foreground pb-2">Kreditter</h2>
                    <div className="rounded-[12px] bg-[#E8F5E9] p-4 text-center">
                      <p className="text-[32px] font-bold text-[#2E7D32]">0 kr</p>
                      <p className="text-[13px] text-[#4CAF50] mt-1">Din nuværende saldo</p>
                    </div>
                    <div className="rounded-[12px] bg-muted/50 p-4 space-y-2">
                      <p className="text-[14px] font-medium text-foreground">Inviter venner & optjen kreditter</p>
                      <p className="text-[13px] text-muted-foreground">For hver ven eller familiemedlem der tilmelder sig via dit link, optjener du 25 kr i kreditter.</p>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full rounded-[12px] py-3 border-[#f58a2d] text-[#f58a2d]"
                      onClick={() => {
                        navigator.clipboard?.writeText('https://huska.dk/invite/demo');
                        toast.success('Link kopieret!');
                      }}
                    >
                      <Send className="mr-2 h-4 w-4" /> Del invitationslink
                    </Button>
                    <div className="pt-2">
                      <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide px-1 pb-2">Historik</p>
                      <div className="rounded-[12px] border border-dashed border-border bg-card p-4 text-center">
                        <p className="text-[13px] text-muted-foreground">Ingen kreditter optjent endnu</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 flex items-center justify-center py-8">
                    <svg width="260" height="200" viewBox="0 0 260 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="cr-skin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFDDAA"/><stop offset="1" stopColor="#FFBB77"/></linearGradient>
                        <linearGradient id="cr-skin2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#FFDDAA"/><stop offset="1" stopColor="#FFBB77"/></linearGradient>
                        <linearGradient id="cr-hair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8D6E63"/><stop offset="1" stopColor="#5D4037"/></linearGradient>
                        <linearGradient id="cr-shirt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#A5D6A7"/><stop offset="0.5" stopColor="#66BB6A"/><stop offset="1" stopColor="#1B5E20"/></linearGradient>
                        <linearGradient id="cr-pants" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#37474F"/><stop offset="1" stopColor="#1C313A"/></linearGradient>
                        <linearGradient id="cr-coin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFEE58"/><stop offset="0.5" stopColor="#FFD54F"/><stop offset="1" stopColor="#F9A825"/></linearGradient>
                        <filter id="cr-shadow"><feDropShadow dx="0" dy="5" stdDeviation="7" floodOpacity="0.15"/></filter>
                        <filter id="cr-coinshadow"><feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.18"/></filter>
                      </defs>
                      {/* Star sparkles */}
                      <path d="M36 56 L39 47 L42 56 L36 52 L42 52Z" fill="#66BB6A" opacity="0.6"/>
                      <path d="M213 50 L216 41 L219 50 L213 46 L219 46Z" fill="#66BB6A" opacity="0.6"/>
                      <rect x="28" y="150" width="6" height="6" rx="1" fill="#FFD54F" opacity="0.3" transform="rotate(45 31 153)"/>
                      <rect x="220" y="148" width="6" height="6" rx="1" fill="#FFD54F" opacity="0.3" transform="rotate(45 223 151)"/>
                      {/* Ground shadow */}
                      <ellipse cx="121" cy="191" rx="58" ry="7" fill="#000" opacity="0.08"/>
                      {/* Arms raised catching coins */}
                      <path d="M97 132 Q78 120 69 106" stroke="url(#cr-skin2)" strokeWidth="13" strokeLinecap="round" fill="none"/>
                      <circle cx="68" cy="104" r="7" fill="url(#cr-skin)"/>
                      <path d="M145 132 Q163 120 172 106" stroke="url(#cr-skin2)" strokeWidth="13" strokeLinecap="round" fill="none"/>
                      <circle cx="173" cy="104" r="7" fill="url(#cr-skin)"/>
                      {/* Falling coins — 3D with depth lines */}
                      {/* Big center coin */}
                      <circle cx="121" cy="44" r="20" fill="url(#cr-coin)" stroke="#F9A825" strokeWidth="2" filter="url(#cr-coinshadow)"/>
                      <circle cx="121" cy="44" r="14" stroke="#FFB300" strokeWidth="1.5" fill="none"/>
                      <circle cx="115" cy="37" r="6" fill="white" opacity="0.2"/>
                      {/* Small text on coin */}
                      <path d="M116 44 Q121 40 126 44 Q121 48 116 44Z" fill="#F9A825" opacity="0.6"/>
                      {/* Left coin */}
                      <circle cx="65" cy="68" r="15" fill="url(#cr-coin)" stroke="#F9A825" strokeWidth="2" filter="url(#cr-coinshadow)"/>
                      <circle cx="65" cy="68" r="10" stroke="#FFB300" strokeWidth="1.2" fill="none"/>
                      <circle cx="60" cy="62" r="5" fill="white" opacity="0.18"/>
                      {/* Right coin */}
                      <circle cx="177" cy="60" r="17" fill="url(#cr-coin)" stroke="#F9A825" strokeWidth="2" filter="url(#cr-coinshadow)"/>
                      <circle cx="177" cy="60" r="11" stroke="#FFB300" strokeWidth="1.2" fill="none"/>
                      <circle cx="171" cy="53" r="6" fill="white" opacity="0.18"/>
                      {/* Small coins */}
                      <circle cx="146" cy="88" r="11" fill="url(#cr-coin)" stroke="#F9A825" strokeWidth="1.5"/>
                      <circle cx="146" cy="88" r="7" stroke="#FFB300" strokeWidth="1" fill="none"/>
                      <circle cx="96" cy="94" r="10" fill="url(#cr-coin)" stroke="#F9A825" strokeWidth="1.5"/>
                      <circle cx="96" cy="94" r="6.5" stroke="#FFB300" strokeWidth="1" fill="none"/>
                      {/* Motion dashes */}
                      <path d="M121 24 L121 32" stroke="#FFB300" strokeWidth="2" strokeDasharray="2 2" opacity="0.6"/>
                      <path d="M65 50 L65 57" stroke="#FFB300" strokeWidth="1.5" strokeDasharray="2 2" opacity="0.6"/>
                      <path d="M177 41 L177 48" stroke="#FFB300" strokeWidth="1.5" strokeDasharray="2 2" opacity="0.6"/>
                      {/* Pants */}
                      <rect x="101" y="167" width="15" height="26" rx="8" fill="url(#cr-pants)"/>
                      <rect x="122" y="167" width="15" height="26" rx="8" fill="url(#cr-pants)"/>
                      <rect x="101" y="167" width="36" height="6" rx="3" fill="#0E1B20" opacity="0.5"/>
                      {/* Shoes */}
                      <rect x="98" y="187" width="21" height="9" rx="5" fill="#111"/>
                      <rect x="119" y="187" width="21" height="9" rx="5" fill="#111"/>
                      <rect x="100" y="187" width="13" height="3" rx="1.5" fill="white" opacity="0.12"/>
                      <rect x="121" y="187" width="13" height="3" rx="1.5" fill="white" opacity="0.12"/>
                      {/* Body/shirt */}
                      <rect x="95" y="124" width="56" height="49" rx="16" fill="url(#cr-shirt)" filter="url(#cr-shadow)"/>
                      {/* Collar */}
                      <path d="M112 124 L123 136 L134 124" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.35"/>
                      {/* Shirt shine */}
                      <ellipse cx="108" cy="133" rx="7" ry="4" fill="white" opacity="0.12"/>
                      {/* Neck */}
                      <rect x="115" y="118" width="16" height="10" rx="4" fill="url(#cr-skin)"/>
                      {/* Ears */}
                      <ellipse cx="97" cy="104" rx="5" ry="7" fill="#FFCC88"/>
                      <ellipse cx="97" cy="104" rx="3" ry="5" fill="#FFB870" opacity="0.6"/>
                      <ellipse cx="145" cy="104" rx="5" ry="7" fill="#FFCC88"/>
                      <ellipse cx="145" cy="104" rx="3" ry="5" fill="#FFB870" opacity="0.6"/>
                      {/* Head */}
                      <circle cx="121" cy="102" r="26" fill="url(#cr-skin)" filter="url(#cr-shadow)"/>
                      <circle cx="113" cy="93" r="9" fill="white" opacity="0.18"/>
                      {/* Hair back */}
                      <ellipse cx="121" cy="80" rx="24" ry="12" fill="#5D4037"/>
                      {/* Hair main */}
                      <ellipse cx="121" cy="79" rx="23" ry="11" fill="url(#cr-hair)"/>
                      <rect x="98" y="79" width="11" height="17" rx="5.5" fill="url(#cr-hair)"/>
                      <rect x="132" y="79" width="11" height="17" rx="5.5" fill="url(#cr-hair)"/>
                      <path d="M110 72 Q119 68 128 72" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.15"/>
                      {/* Eyebrows — happy raised */}
                      <path d="M109 95 Q112 92 115 95" stroke="#5D4037" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                      <path d="M127 95 Q130 92 133 95" stroke="#5D4037" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                      {/* Eyes — wide excited */}
                      <circle cx="112" cy="101" r="4.5" fill="#2C1810"/>
                      <circle cx="130" cy="101" r="4.5" fill="#2C1810"/>
                      <circle cx="114" cy="99" r="1.7" fill="white" opacity="0.9"/>
                      <circle cx="132" cy="99" r="1.7" fill="white" opacity="0.9"/>
                      {/* Big excited smile */}
                      <path d="M112 111 Q121 120 130 111" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.4"/>
                      <path d="M112 111 Q121 121 130 111" stroke="#C67B3A" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                      {/* Cheeks — excited */}
                      <ellipse cx="105" cy="108" rx="6" ry="4" fill="#FFB0A0" opacity="0.45"/>
                      <ellipse cx="137" cy="108" rx="6" ry="4" fill="#FFB0A0" opacity="0.45"/>
                    </svg>
                  </div>
                </div>
              )}

              {/* ─── Indløs kode ─── */}
              {settingsDetailView === 'payment-redeem' && (
                <div className="min-h-[calc(100vh-280px)] flex flex-col" style={{ paddingBottom: keyboardHeight > 0 ? keyboardHeight : undefined }}>
                  <div className="space-y-4">
                    <h2 className="text-[28px] font-bold text-foreground pb-2">Indløs kode</h2>
                    <p className="text-[13px] text-muted-foreground">Indtast en gavekort-, kampagne- eller henvisningskode for at indløse den.</p>
                    <Input placeholder="Indtast kode" className="rounded-[12px] border-border bg-card px-4 py-3 text-[15px] text-center tracking-[0.15em] uppercase" />
                  </div>
                  <div className="flex-1 flex items-center justify-center py-8">
                    <svg width="260" height="200" viewBox="0 0 260 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="rd-skin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFDDAA"/><stop offset="1" stopColor="#FFBB77"/></linearGradient>
                        <linearGradient id="rd-skin2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#FFDDAA"/><stop offset="1" stopColor="#FFBB77"/></linearGradient>
                        <linearGradient id="rd-hair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8D6E63"/><stop offset="1" stopColor="#5D4037"/></linearGradient>
                        <linearGradient id="rd-shirt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#CE93D8"/><stop offset="0.5" stopColor="#AB47BC"/><stop offset="1" stopColor="#6A1B9A"/></linearGradient>
                        <linearGradient id="rd-pants" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4A148C"/><stop offset="1" stopColor="#2E0060"/></linearGradient>
                        <linearGradient id="rd-ticket" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F3E5F5"/><stop offset="0.5" stopColor="#E1BEE7"/><stop offset="1" stopColor="#CE93D8"/></linearGradient>
                        <filter id="rd-shadow"><feDropShadow dx="0" dy="5" stdDeviation="7" floodOpacity="0.15"/></filter>
                        <filter id="rd-softshadow"><feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.1"/></filter>
                      </defs>
                      {/* Sparkles */}
                      <path d="M185 46 L189 36 L193 46 L187 42 L193 42Z" fill="#FFD54F" opacity="0.9"/>
                      <circle cx="189" cy="41" r="3.5" fill="#FFF176" opacity="0.8"/>
                      <path d="M33 52 L37 44 L41 52 L35 48 L41 48Z" fill="#CE93D8" opacity="0.7"/>
                      <circle cx="220" cy="70" r="5" fill="#7E57C2" opacity="0.28"/>
                      <circle cx="34" cy="148" r="4" fill="#FFD54F" opacity="0.35"/>
                      <circle cx="188" cy="140" r="4" fill="#CE93D8" opacity="0.35"/>
                      {/* Ground shadow */}
                      <ellipse cx="115" cy="191" rx="58" ry="7" fill="#000" opacity="0.08"/>
                      {/* Arms holding ticket up */}
                      <path d="M91 133 Q74 123 63 112" stroke="url(#rd-skin2)" strokeWidth="13" strokeLinecap="round" fill="none"/>
                      <circle cx="62" cy="111" r="7" fill="url(#rd-skin)"/>
                      <path d="M141 133 Q158 123 167 112" stroke="url(#rd-skin2)" strokeWidth="13" strokeLinecap="round" fill="none"/>
                      <circle cx="168" cy="111" r="7" fill="url(#rd-skin)"/>
                      {/* Ticket — 3D */}
                      <rect x="48" y="62" width="134" height="64" rx="12" fill="url(#rd-ticket)" stroke="#7E57C2" strokeWidth="2.5" filter="url(#rd-softshadow)"/>
                      {/* Ticket 3D depth */}
                      <path d="M182 62 L192 70 L192 134 L182 126 Z" fill="#B39DDB" opacity="0.35"/>
                      <path d="M48 62 L58 70 L192 70 L182 62 Z" fill="white" opacity="0.18"/>
                      {/* Ticket shine */}
                      <rect x="52" y="65" width="28" height="5" rx="2.5" fill="white" opacity="0.3"/>
                      {/* Notch left */}
                      <circle cx="48" cy="94" r="11" fill="white" stroke="#7E57C2" strokeWidth="2.5"/>
                      {/* Notch right */}
                      <circle cx="182" cy="94" r="11" fill="white" stroke="#7E57C2" strokeWidth="2.5"/>
                      {/* Dashed center divider */}
                      <line x1="72" y1="94" x2="158" y2="94" stroke="#B39DDB" strokeWidth="1.8" strokeDasharray="6 3"/>
                      {/* Barcode bars on ticket (top half) */}
                      <rect x="65" y="70" width="4" height="18" rx="2" fill="#9C27B0" opacity="0.5"/>
                      <rect x="72" y="70" width="7" height="18" rx="2" fill="#9C27B0" opacity="0.5"/>
                      <rect x="82" y="70" width="3" height="18" rx="1.5" fill="#9C27B0" opacity="0.5"/>
                      <rect x="88" y="70" width="6" height="18" rx="2" fill="#9C27B0" opacity="0.5"/>
                      <rect x="97" y="70" width="4" height="18" rx="2" fill="#9C27B0" opacity="0.5"/>
                      <rect x="104" y="70" width="8" height="18" rx="2" fill="#9C27B0" opacity="0.5"/>
                      <rect x="115" y="70" width="3" height="18" rx="1.5" fill="#9C27B0" opacity="0.5"/>
                      <rect x="121" y="70" width="5" height="18" rx="2" fill="#9C27B0" opacity="0.5"/>
                      <rect x="129" y="70" width="4" height="18" rx="2" fill="#9C27B0" opacity="0.5"/>
                      <rect x="136" y="70" width="7" height="18" rx="2" fill="#9C27B0" opacity="0.5"/>
                      {/* Code text on bottom half */}
                      <rect x="72" y="104" width="66" height="13" rx="5" fill="#B39DDB"/>
                      <rect x="74" y="106" width="20" height="3" rx="1.5" fill="white" opacity="0.3"/>
                      {/* Pants */}
                      <rect x="96" y="167" width="15" height="26" rx="8" fill="url(#rd-pants)"/>
                      <rect x="117" y="167" width="15" height="26" rx="8" fill="url(#rd-pants)"/>
                      <rect x="96" y="167" width="36" height="6" rx="3" fill="#1A0040" opacity="0.5"/>
                      {/* Shoes */}
                      <rect x="93" y="187" width="21" height="9" rx="5" fill="#111"/>
                      <rect x="114" y="187" width="21" height="9" rx="5" fill="#111"/>
                      <rect x="95" y="187" width="13" height="3" rx="1.5" fill="white" opacity="0.12"/>
                      <rect x="116" y="187" width="13" height="3" rx="1.5" fill="white" opacity="0.12"/>
                      {/* Body/shirt */}
                      <rect x="89" y="125" width="56" height="48" rx="16" fill="url(#rd-shirt)" filter="url(#rd-shadow)"/>
                      {/* Collar */}
                      <path d="M106 125 L117 136 L128 125" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.35"/>
                      {/* Shirt shine */}
                      <ellipse cx="102" cy="134" rx="7" ry="4" fill="white" opacity="0.12"/>
                      {/* Neck */}
                      <rect x="109" y="119" width="16" height="10" rx="4" fill="url(#rd-skin)"/>
                      {/* Ears */}
                      <ellipse cx="91" cy="104" rx="5" ry="7" fill="#FFCC88"/>
                      <ellipse cx="91" cy="104" rx="3" ry="5" fill="#FFB870" opacity="0.6"/>
                      <ellipse cx="139" cy="104" rx="5" ry="7" fill="#FFCC88"/>
                      <ellipse cx="139" cy="104" rx="3" ry="5" fill="#FFB870" opacity="0.6"/>
                      {/* Head */}
                      <circle cx="115" cy="102" r="26" fill="url(#rd-skin)" filter="url(#rd-shadow)"/>
                      <circle cx="107" cy="93" r="9" fill="white" opacity="0.18"/>
                      {/* Hair back */}
                      <ellipse cx="115" cy="80" rx="24" ry="12" fill="#5D4037"/>
                      {/* Hair main */}
                      <ellipse cx="115" cy="79" rx="23" ry="11" fill="url(#rd-hair)"/>
                      <rect x="92" y="79" width="11" height="17" rx="5.5" fill="url(#rd-hair)"/>
                      <rect x="126" y="79" width="11" height="17" rx="5.5" fill="url(#rd-hair)"/>
                      <path d="M104 72 Q113 68 122 72" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.15"/>
                      {/* Eyebrows */}
                      <path d="M103 95 Q106 92 109 95" stroke="#5D4037" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                      <path d="M121 95 Q124 92 127 95" stroke="#5D4037" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                      {/* Eyes */}
                      <circle cx="106" cy="101" r="4" fill="#2C1810"/>
                      <circle cx="124" cy="101" r="4" fill="#2C1810"/>
                      <circle cx="108" cy="99" r="1.5" fill="white" opacity="0.9"/>
                      <circle cx="126" cy="99" r="1.5" fill="white" opacity="0.9"/>
                      {/* Smile */}
                      <path d="M108 111 Q115 118 122 111" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.4"/>
                      <path d="M108 111 Q115 119 122 111" stroke="#C67B3A" strokeWidth="2" strokeLinecap="round" fill="none"/>
                      {/* Cheeks */}
                      <ellipse cx="100" cy="108" rx="5" ry="3" fill="#FFB0A0" opacity="0.35"/>
                      <ellipse cx="130" cy="108" rx="5" ry="3" fill="#FFB0A0" opacity="0.35"/>
                    </svg>
                  </div>
                  <Button className="w-full shrink-0 rounded-[12px] py-3">
                    Indløs
                  </Button>
                </div>
              )}
            </motion.div>
          )}
          </AnimatePresence>
        </TabsContent>

        {currentUser?.isAdmin && (
          <TabsContent value="admin" className="space-y-2">
            <AdminPanel />
          </TabsContent>
        )}

        {currentUser?.isAdmin && (
          <TabsContent value="platform-analyse" className="space-y-2">
            <PlatformAnalyseView />
          </TabsContent>
        )}

        {currentUser?.isAdmin && (
          <TabsContent value="tilbud-admin" className="space-y-2">
            <TilbudAdminView />
          </TabsContent>
        )}

        {currentUser?.isAdmin && (
          <TabsContent value="nyheder-admin" className="space-y-2">
            <NyhederAdminView />
          </TabsContent>
        )}

        <TabsContent value="members" className="space-y-2">
              {!features.familyMembers ? (
                <div className="rounded-[8px] border border-orange-tint bg-orange-tint-light p-4 text-center">
                  <p className="text-sm font-semibold text-[#f58a2d] dark:text-[#f5a55d]">Opgrader til Family Plus</p>
                  <p className="mt-1 text-xs text-[#f5a55d]">
                    Tilføj familiemedlemmer som teenagere, bedsteforældre og bonusforældre med Family Plus eller Enlig Plus.
                  </p>
                  <Button
                    className="mt-3 rounded-[8px] bg-[#f58a2d] text-white hover:bg-[#e47921]"
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
                      <div key={member.id} className="flex items-center justify-between rounded-[8px] border border-border bg-card px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-[15px] font-medium text-foreground">{member.name}</p>
                          <p className="text-[13px] text-muted-foreground">
                            {member.familyMemberRole === 'teenager' ? 'Teenager' :
                             member.familyMemberRole === 'grandparent' ? 'Bedsteforælder' :
                             member.familyMemberRole === 'step_parent' ? 'Bonusforælder' : 'Øvrigt familiemedlem'}
                            {member.email ? ` · ${member.email}` : ''}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-muted-foreground hover:text-rose-500"
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
                      <p className="rounded-[8px] border border-dashed border-border bg-card p-3 text-sm text-muted-foreground">
                        Ingen ekstra familiemedlemmer endnu.
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Maks {features.maxFamilyMembers} familiemedlemmer med dit abonnement.
                  </p>
                  <Button
                    className="w-full rounded-[8px]"
                    variant="outline"
                    disabled={users.filter(u => u.familyMemberRole).length >= features.maxFamilyMembers}
                    onClick={() => setFamilyMemberOpen(true)}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Tilføj familiemedlem
                  </Button>

                </>
              )}

        </TabsContent>

        {/* ─── Notifikationer (fra sidepanel) ─── */}
        <TabsContent value="notifications" className="space-y-0">
          {!settingsDetailView ? (
            <>
              {/* Push-notifikationer status */}
              <div className="px-1 pt-2 pb-3">
                <p className="text-[13px] text-muted-foreground">
                  Modtag notifikationer om afleveringer, beskeder og opdateringer.
                </p>
              </div>

              {notifPermission === 'granted' ? (
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between px-1 py-2">
                    <p className="text-[15px] font-medium text-foreground">Push-notifikationer</p>
                    <BadgeCheck className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="space-y-1.5 px-1">
                    <Label htmlFor="reminder-minutes" className="text-[13px] text-muted-foreground">Påmind mig (minutter før aflevering)</Label>
                    <SelectSheet
                      value={String(notificationPreferences.handoverReminderMinutes)}
                      onValueChange={(v) => saveNotificationPreferences({ handoverReminderMinutes: Number(v) })}
                      title="Påmindelsestid"
                      options={[
                        { value: '15', label: '15 minutter' },
                        { value: '30', label: '30 minutter' },
                        { value: '60', label: '1 time' },
                        { value: '120', label: '2 timer' },
                      ]}
                      className="rounded-[8px] border-border"
                    />
                  </div>
                  <Button
                    className="w-full rounded-[8px]"
                    onClick={() => {
                      const handoverEvents = events.filter(e => e.type === 'handover');
                      scheduleAllHandoverReminders(handoverEvents, notificationPreferences.handoverReminderMinutes);
                      toast.success(`Påmindelser planlagt ${notificationPreferences.handoverReminderMinutes} min. før aflevering`);
                    }}
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    Planlæg påmindelser
                  </Button>
                </div>
              ) : notifPermission === 'denied' ? (
                <Button
                  variant="outline"
                  className="w-full rounded-[8px] mb-4 text-[#f58a2d] dark:text-[#f5a55d] border-orange-tint"
                  onClick={() => toast.error('Notifikationer er blokeret. Tillad dem i enhedens indstillinger.')}
                >
                  <Bell className="mr-2 h-4 w-4" />
                  Notifikationer blokeret
                </Button>
              ) : (
                <Button
                  className="w-full rounded-[8px] mb-4"
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

              {/* ─── Kategori-rækker ─── */}
              <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-muted-foreground px-1 pb-2">Kategorier</p>
              <div className="divide-y divide-border">
                {[
                  { id: 'notif-samvaer', label: 'Samvær & Afleveringer' },
                  { id: 'notif-kalender', label: 'Kalender & Datoer' },
                  { id: 'notif-opgaver', label: 'Opgaver' },
                  { id: 'notif-oekonomi', label: 'Økonomi' },
                  { id: 'notif-beskeder', label: 'Beskeder' },
                  { id: 'notif-hjem', label: 'Hjem & Mad' },
                  { id: 'notif-dokumenter', label: 'Dokumenter & Beslutninger' },
                  { id: 'notif-dagbog', label: 'Dagbog & Trivsel' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSettingsDetailView(cat.id)}
                    className="flex w-full items-center justify-between py-3.5 px-1 text-left transition-colors hover:bg-card"
                  >
                    <p className="text-[15px] font-medium text-foreground">{cat.label}</p>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>

            </>
          ) : (
            <>
              {/* ─── Notifikations-undersider ─── */}

              {settingsDetailView === 'notif-samvaer' && (
                <div className="space-y-0">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-muted-foreground px-1 pb-2">Samvær & Afleveringer</p>
                  <div className="divide-y divide-border">
                    <div className="flex items-center justify-between py-3 px-1">
                      <div>
                        <p className="text-[15px] font-medium text-foreground">Afleveringspåmindelser</p>
                        <p className="text-[13px] text-muted-foreground">Før hver aflevering</p>
                      </div>
                      <IOSSwitch checked={notificationPreferences.handoverReminders} onCheckedChange={(v) => saveNotificationPreferences({ handoverReminders: v })} />
                    </div>
                    <div className="flex items-center justify-between py-3 px-1">
                      <div>
                        <p className="text-[15px] font-medium text-foreground">Samværsændringer</p>
                        <p className="text-[13px] text-muted-foreground">Bytteanmodninger & planændringer</p>
                      </div>
                      <IOSSwitch checked={notificationPreferences.scheduleChanges} onCheckedChange={(v) => saveNotificationPreferences({ scheduleChanges: v })} />
                    </div>
                  </div>
                </div>
              )}

              {settingsDetailView === 'notif-kalender' && (
                <div className="space-y-0">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-muted-foreground px-1 pb-2">Kalender & Datoer</p>
                  <div className="divide-y divide-border">
                    <div className="flex items-center justify-between py-3 px-1">
                      <div>
                        <p className="text-[15px] font-medium text-foreground">Kalenderbegivenheder</p>
                        <p className="text-[13px] text-muted-foreground">Nye events & ændringer</p>
                      </div>
                      <IOSSwitch checked={notificationPreferences.eventReminders} onCheckedChange={(v) => saveNotificationPreferences({ eventReminders: v })} />
                    </div>
                    <div className="flex items-center justify-between py-3 px-1">
                      <div>
                        <p className="text-[15px] font-medium text-foreground">Vigtige datoer</p>
                        <p className="text-[13px] text-muted-foreground">Fødselsdage, vaccinationer, skole</p>
                      </div>
                      <IOSSwitch checked={notificationPreferences.importantDates} onCheckedChange={(v) => saveNotificationPreferences({ importantDates: v })} />
                    </div>
                  </div>
                </div>
              )}

              {settingsDetailView === 'notif-opgaver' && (
                <div className="space-y-0">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-muted-foreground px-1 pb-2">Opgaver</p>
                  <div className="divide-y divide-border">
                    <div className="flex items-center justify-between py-3 px-1">
                      <div>
                        <p className="text-[15px] font-medium text-foreground">Opgavetildeling</p>
                        <p className="text-[13px] text-muted-foreground">Når du får en ny opgave</p>
                      </div>
                      <IOSSwitch checked={notificationPreferences.taskAssigned} onCheckedChange={(v) => saveNotificationPreferences({ taskAssigned: v })} />
                    </div>
                    <div className="flex items-center justify-between py-3 px-1">
                      <div>
                        <p className="text-[15px] font-medium text-foreground">Deadlines</p>
                        <p className="text-[13px] text-muted-foreground">Forfaldne & kommende opgaver</p>
                      </div>
                      <IOSSwitch checked={notificationPreferences.taskDeadline} onCheckedChange={(v) => saveNotificationPreferences({ taskDeadline: v })} />
                    </div>
                  </div>
                </div>
              )}

              {settingsDetailView === 'notif-oekonomi' && (
                <div className="space-y-0">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-muted-foreground px-1 pb-2">Økonomi</p>
                  <div className="divide-y divide-border">
                    <div className="flex items-center justify-between py-3 px-1">
                      <div>
                        <p className="text-[15px] font-medium text-foreground">Nye udgifter</p>
                        <p className="text-[13px] text-muted-foreground">Afventer din godkendelse</p>
                      </div>
                      <IOSSwitch checked={notificationPreferences.expensePending} onCheckedChange={(v) => saveNotificationPreferences({ expensePending: v })} />
                    </div>
                    <div className="flex items-center justify-between py-3 px-1">
                      <div>
                        <p className="text-[15px] font-medium text-foreground">Udgiftsopdateringer</p>
                        <p className="text-[13px] text-muted-foreground">Godkendt, afvist, anfægtet</p>
                      </div>
                      <IOSSwitch checked={notificationPreferences.expenseUpdates} onCheckedChange={(v) => saveNotificationPreferences({ expenseUpdates: v })} />
                    </div>
                  </div>
                </div>
              )}

              {settingsDetailView === 'notif-beskeder' && (
                <div className="space-y-0">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-muted-foreground px-1 pb-2">Beskeder</p>
                  <div className="divide-y divide-border">
                    <div className="flex items-center justify-between py-3 px-1">
                      <div>
                        <p className="text-[15px] font-medium text-foreground">Nye beskeder</p>
                        <p className="text-[13px] text-muted-foreground">Kommunikation & dagbog</p>
                      </div>
                      <IOSSwitch checked={notificationPreferences.newMessages} onCheckedChange={(v) => saveNotificationPreferences({ newMessages: v })} />
                    </div>
                    <div className="flex items-center justify-between py-3 px-1">
                      <div>
                        <p className="text-[15px] font-medium text-foreground">Professionelle beskeder</p>
                        <p className="text-[13px] text-muted-foreground">Fra fagpersoner</p>
                      </div>
                      <IOSSwitch checked={notificationPreferences.professionalMessages} onCheckedChange={(v) => saveNotificationPreferences({ professionalMessages: v })} />
                    </div>
                  </div>
                </div>
              )}

              {settingsDetailView === 'notif-hjem' && (
                <div className="space-y-0">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-muted-foreground px-1 pb-2">Hjem & Mad</p>
                  <div className="divide-y divide-border">
                    <div className="flex items-center justify-between py-3 px-1">
                      <div>
                        <p className="text-[15px] font-medium text-foreground">Madplan</p>
                        <p className="text-[13px] text-muted-foreground">Daglig påmindelse om aftensmad</p>
                      </div>
                      <IOSSwitch checked={notificationPreferences.mealPlanReminder} onCheckedChange={(v) => saveNotificationPreferences({ mealPlanReminder: v })} />
                    </div>
                    <div className="flex items-center justify-between py-3 px-1">
                      <div>
                        <p className="text-[15px] font-medium text-foreground">Indkøb</p>
                        <p className="text-[13px] text-muted-foreground">Ugentlig indkøbspåmindelse</p>
                      </div>
                      <IOSSwitch checked={notificationPreferences.shoppingReminder} onCheckedChange={(v) => saveNotificationPreferences({ shoppingReminder: v })} />
                    </div>
                    <div className="flex items-center justify-between py-3 px-1">
                      <div>
                        <p className="text-[15px] font-medium text-foreground">Rengøring</p>
                        <p className="text-[13px] text-muted-foreground">Rengøringsopgave-påmindelser</p>
                      </div>
                      <IOSSwitch checked={notificationPreferences.cleaningReminder} onCheckedChange={(v) => saveNotificationPreferences({ cleaningReminder: v })} />
                    </div>
                  </div>
                </div>
              )}

              {settingsDetailView === 'notif-dokumenter' && (
                <div className="space-y-0">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-muted-foreground px-1 pb-2">Dokumenter & Beslutninger</p>
                  <div className="divide-y divide-border">
                    <div className="flex items-center justify-between py-3 px-1">
                      <div>
                        <p className="text-[15px] font-medium text-foreground">Delte dokumenter</p>
                        <p className="text-[13px] text-muted-foreground">Nye filer delt med dig</p>
                      </div>
                      <IOSSwitch checked={notificationPreferences.documentShared} onCheckedChange={(v) => saveNotificationPreferences({ documentShared: v })} />
                    </div>
                    <div className="flex items-center justify-between py-3 px-1">
                      <div>
                        <p className="text-[15px] font-medium text-foreground">Beslutningsforslag</p>
                        <p className="text-[13px] text-muted-foreground">Nye forslag der kræver svar</p>
                      </div>
                      <IOSSwitch checked={notificationPreferences.decisionProposed} onCheckedChange={(v) => saveNotificationPreferences({ decisionProposed: v })} />
                    </div>
                  </div>
                </div>
              )}

              {settingsDetailView === 'notif-dagbog' && (
                <div className="space-y-0">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-muted-foreground px-1 pb-2">Dagbog & Trivsel</p>
                  <div className="divide-y divide-border">
                    <div className="flex items-center justify-between py-3 px-1">
                      <div>
                        <p className="text-[15px] font-medium text-foreground">Dagbogspåmindelse</p>
                        <p className="text-[13px] text-muted-foreground">Daglig påmindelse om at logge</p>
                      </div>
                      <IOSSwitch checked={notificationPreferences.diaryReminder} onCheckedChange={(v) => saveNotificationPreferences({ diaryReminder: v })} />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* ─── Familietype (fra sidepanel) ─── */}
        <TabsContent value="familytype" className="space-y-0">
          <div className="px-1 pt-2 pb-4">
            <p className="text-[13px] text-muted-foreground">
              Vælg den familietype der passer bedst til jeres situation.
            </p>
          </div>

          <div className="space-y-2">
            {([
              { value: 'together' as HouseholdMode, label: 'Samboende familie', desc: 'Deler ét abonnement og ser alt sammen', Icon: Home },
              { value: 'co_parenting' as HouseholdMode, label: 'Skilt / Co-parenting', desc: 'Separate abonnementer, deler udvalgt data', Icon: Handshake },
              { value: 'blended' as HouseholdMode, label: 'Bonusfamilie', desc: 'Udvidet familie med fælles overblik', Icon: Users },
              { value: 'single_parent' as HouseholdMode, label: 'Enlig forsørger', desc: 'Dokumentation og advokatværktøj', Icon: UserCircle },
            ]).map((option) => (
              <button
                key={option.value}
                onClick={() => handleFamilyModeChange(option.value)}
                className={cn(
                  "flex w-full items-center gap-3.5 p-4 text-left transition-all active:scale-[0.98] border-b border-border",
                  currentMode === option.value && "bg-orange-tint-light"
                )}
              >
                <option.Icon className={cn("h-6 w-6 shrink-0", currentMode === option.value ? "text-[#f58a2d]" : "text-foreground")} />
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-[14px] font-semibold",
                    currentMode === option.value ? "text-[#f58a2d] dark:text-[#f5a55d]" : "text-foreground"
                  )}>{option.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{option.desc}</p>
                </div>
                {currentMode === option.value && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f58a2d]">
                    <Check className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </TabsContent>

        {/* ─── Feedback (fra sidepanel) ─── */}
        <TabsContent value="feedback" className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Vi vil gerne høre din mening! Hjælp os med at forbedre appen.
              </p>

              {/* Star rating */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-[0.05em] text-muted-foreground">
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
                            : 'text-muted-foreground'
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                  Kategori
                </Label>
                <SelectSheet
                  value={feedbackDraft.category}
                  onValueChange={(v) => setFeedbackDraft(prev => ({ ...prev, category: v }))}
                  title="Feedback-kategori"
                  options={[
                    { value: 'general', label: 'Generelt' },
                    { value: 'bug', label: 'Fejl / Bug' },
                    { value: 'feature', label: 'Ny funktion' },
                    { value: 'design', label: 'Design / Brugervenlighed' },
                    { value: 'calendar', label: 'Kalender / Samvær' },
                    { value: 'expenses', label: 'Udgifter / Økonomi' },
                  ]}
                  className="rounded-[8px] border-border"
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                  Din besked
                </Label>
                <Textarea
                  value={feedbackDraft.message}
                  onChange={(e) => setFeedbackDraft(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Fortæl os hvad du synes, eller hvad vi kan forbedre..."
                  rows={5}
                  className="rounded-[8px] border-border"
                />
              </div>

              <Button
                className="w-full rounded-[8px] bg-primary text-white hover:bg-primary"
                disabled={!feedbackDraft.message.trim() || feedbackDraft.rating === 0}
                onClick={() => {
                  toast.success('Tak for din feedback! Vi sætter stor pris på det.');
                  setFeedbackDraft({ rating: 0, category: 'general', message: '' });
                }}
              >
                <Send className="mr-2 h-4 w-4" />
                Send feedback
              </Button>
        </TabsContent>

        {/* ─── Info / GDPR (fra sidepanel) ─── */}
        <TabsContent value="info" className="space-y-3">
          {!settingsDetailView ? (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Shield className="h-4 w-4" />
                    Databeskyttelse & Privatliv
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Hos Hverdag tager vi beskyttelsen af dine og dine børns persondata alvorligt. Herunder kan du læse om, hvordan vi indsamler, behandler og beskytter dine oplysninger i overensstemmelse med EU&apos;s persondataforordning (GDPR).
                  </p>
                </CardHeader>
              </Card>

              {/* Kategori 1 */}
              <div className="space-y-1 px-1">
                <p className="text-sm font-bold text-foreground">For at levere vores tjeneste til dig</p>
                <p className="text-xs text-foreground leading-relaxed">
                  Vi indsamler og behandler persondata for at kunne levere Hverdag-appen til dig — herunder samværsplaner, kalender, kommunikation, opgavestyring og dokumenthåndtering.
                </p>
                <button onClick={() => setSettingsDetailView('tjeneste')} className="text-xs font-semibold text-[#2f82de] flex items-center gap-0.5 pt-0.5">
                  Læs mere <ChevronRight className="h-3 w-3" />
                </button>
              </div>
              <div className="border-t border-border" />

              {/* Kategori 2 */}
              <div className="space-y-1 px-1">
                <p className="text-sm font-bold text-foreground">For at beskytte dine børns data</p>
                <p className="text-xs text-foreground leading-relaxed">
                  Vi behandler børns data med særlig omhu og ekstra sikkerhedsforanstaltninger. Forældre giver samtykke på vegne af børn under 13 år, og børnedata deles aldrig med tredjeparter.
                </p>
                <button onClick={() => setSettingsDetailView('boernedata')} className="text-xs font-semibold text-[#2f82de] flex items-center gap-0.5 pt-0.5">
                  Læs mere <ChevronRight className="h-3 w-3" />
                </button>
              </div>
              <div className="border-t border-border" />

              {/* Kategori 3 */}
              <div className="space-y-1 px-1">
                <p className="text-sm font-bold text-foreground">For at holde dine data sikre</p>
                <p className="text-xs text-foreground leading-relaxed">
                  Vi bruger kryptering, adgangskontrol og sikker cloud-lagring i EU for at beskytte dine personlige oplysninger, dokumenter og samværsplaner.
                </p>
                <button onClick={() => setSettingsDetailView('sikkerhed')} className="text-xs font-semibold text-[#2f82de] flex items-center gap-0.5 pt-0.5">
                  Læs mere <ChevronRight className="h-3 w-3" />
                </button>
              </div>
              <div className="border-t border-border" />

              {/* Kategori 4 */}
              <div className="space-y-1 px-1">
                <p className="text-sm font-bold text-foreground">For at kommunikere med dig</p>
                <p className="text-xs text-foreground leading-relaxed">
                  Vi bruger dine kontaktoplysninger til at sende dig notifikationer om afleveringer, beskeder, opgaver og vigtige opdateringer i din husstand.
                </p>
                <button onClick={() => setSettingsDetailView('kommunikation')} className="text-xs font-semibold text-[#2f82de] flex items-center gap-0.5 pt-0.5">
                  Læs mere <ChevronRight className="h-3 w-3" />
                </button>
              </div>
              <div className="border-t border-border" />

              {/* Kategori 5 */}
              <div className="space-y-1 px-1">
                <p className="text-sm font-bold text-foreground">Dine rettigheder som bruger</p>
                <p className="text-xs text-foreground leading-relaxed">
                  Du har ret til at se, rette, slette og eksportere dine data. Vi respekterer alle dine rettigheder under GDPR og gør det nemt for dig at udøve dem.
                </p>
                <button onClick={() => setSettingsDetailView('rettigheder')} className="text-xs font-semibold text-[#2f82de] flex items-center gap-0.5 pt-0.5">
                  Læs mere <ChevronRight className="h-3 w-3" />
                </button>
              </div>
              <div className="border-t border-border" />

              {/* Kategori 6 */}
              <div className="space-y-1 px-1">
                <p className="text-sm font-bold text-foreground">Hvem vi deler data med</p>
                <p className="text-xs text-foreground leading-relaxed">
                  Vi bruger betroede databehandlere til at drive appen sikkert. Dine data deles aldrig med tredjeparter til markedsføring eller reklameformål.
                </p>
                <button onClick={() => setSettingsDetailView('databehandlere')} className="text-xs font-semibold text-[#2f82de] flex items-center gap-0.5 pt-0.5">
                  Læs mere <ChevronRight className="h-3 w-3" />
                </button>
              </div>
              <div className="border-t border-border" />

              {/* Kategori 7 */}
              <div className="space-y-1 px-1">
                <p className="text-sm font-bold text-foreground">Sådan sletter du dine data</p>
                <p className="text-xs text-foreground leading-relaxed">
                  Du kan til enhver tid slette din konto. Alle persondata anonymiseres permanent ved sletning, og vi informerer dig om hele processen.
                </p>
                <button onClick={() => setSettingsDetailView('sletning')} className="text-xs font-semibold text-[#2f82de] flex items-center gap-0.5 pt-0.5">
                  Læs mere <ChevronRight className="h-3 w-3" />
                </button>
              </div>

              <div className="border-t border-border mt-2" />
              <p className="text-[10px] text-center text-muted-foreground pb-4 pt-2">
                Dataansvarlig: Hverdag ApS · support@hverdag.app<br />
                Senest opdateret: Februar 2026 · Hverdag v1.0
              </p>
            </>
          ) : (
            <>
              {settingsDetailView === 'tjeneste' && (
                <div className="space-y-4 px-1">
                  <p className="text-base font-bold text-foreground">For at levere vores tjeneste til dig</p>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Hvilke data indsamler vi</p>
                    <p className="text-xs text-foreground leading-relaxed">For at levere Hverdag-appen indsamler vi følgende persondata:</p>
                    <ul className="list-disc list-inside space-y-1 ml-1 text-xs text-foreground leading-relaxed">
                      <li><span className="font-semibold">Kontooplysninger:</span> Navn, email, telefonnummer, profilbillede, fødselsdato, adresse</li>
                      <li><span className="font-semibold">Familieforhold:</span> Husstandstype (samboende, co-parenting, bonusfamilie, enlig forsørger), familiemedlemmer og deres roller</li>
                      <li><span className="font-semibold">Børnedata:</span> Navn, fødselsdato, allergier, medicin, institutioner, forældretilknytning</li>
                      <li><span className="font-semibold">Samværsplaner:</span> Samværsmodel (7/7, 10/4, tilpasset), ugefordeling, ferieaftaler</li>
                      <li><span className="font-semibold">Kalenderdata:</span> Begivenheder, påmindelser, skemaskabeloner</li>
                      <li><span className="font-semibold">Kommunikation:</span> Beskeder mellem husstandsmedlemmer, dagbogsindlæg</li>
                      <li><span className="font-semibold">Dokumenter:</span> Uploadede filer (samværsaftaler, retsdokumenter, vaccinationskort)</li>
                      <li><span className="font-semibold">Økonomi:</span> Udgifter, betalingskonti (MobilePay-/kontonumre), budgetmål</li>
                      <li><span className="font-semibold">Sundhedsdata:</span> Børns humør-, søvn- og appetitlogs, kaloriedagbog</li>
                      <li><span className="font-semibold">Opgaver:</span> Opgavelister, madplaner, indkøbslister, rengøringsplaner</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Hvordan vi bruger dataene</p>
                    <ul className="list-disc list-inside space-y-1 ml-1 text-xs text-foreground leading-relaxed">
                      <li>Samværsplaner beregnes lokalt på din enhed og synkroniseres krypteret til cloud</li>
                      <li>Kalenderdata bruges til at vise din families samlede overblik og sende påmindelser</li>
                      <li>Beskeder leveres til husstandsmedlemmer via krypterede kanaler</li>
                      <li>Udgifter bruges til at beregne fordelinger og generere oversigter</li>
                      <li>Sundhedsdata vises kun for din husstand og bruges til at spore trivsel over tid</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Behandlingsgrundlag</p>
                    <p className="text-xs text-foreground leading-relaxed">Vi behandler dine data på følgende juridiske grundlag i henhold til GDPR:</p>
                    <ul className="list-disc list-inside space-y-1 ml-1 text-xs text-foreground leading-relaxed">
                      <li><span className="font-semibold">Art. 6(1)(b) — Kontrakt:</span> Behandling er nødvendig for at levere den tjeneste, du har tilmeldt dig</li>
                      <li><span className="font-semibold">Art. 9(2)(a) — Eksplicit samtykke:</span> For følsomme data som sundhedsoplysninger og børns data</li>
                      <li><span className="font-semibold">Art. 6(1)(f) — Legitim interesse:</span> For at forbedre appens funktionalitet og sikkerhed</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Opbevaringsperiode</p>
                    <p className="text-xs text-foreground leading-relaxed">
                      Dine data opbevares, så længe din konto er aktiv. Ved kontosletning anonymiseres alle persondata inden for 30 dage. Anonymiserede, aggregerede data (uden personhenførbarhed) kan opbevares til statistiske formål.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Datalagring</p>
                    <p className="text-xs text-foreground leading-relaxed">
                      Alle data lagres i en Supabase PostgreSQL-database hostet i EU-regionen (Frankfurt, Tyskland). Data forlader aldrig EU. Databasen er krypteret at-rest med AES-256 og in-transit med TLS 1.3.
                    </p>
                  </div>
                </div>
              )}

              {settingsDetailView === 'boernedata' && (
                <div className="space-y-4 px-1">
                  <p className="text-base font-bold text-foreground">For at beskytte dine børns data</p>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Særlig beskyttelse af børns data</p>
                    <p className="text-xs text-foreground leading-relaxed">
                      Hverdag behandler børns persondata med den højeste grad af omhu. Børns data er underlagt strengere beskyttelse end voksnes data i henhold til GDPR art. 8 og den danske databeskyttelseslov.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Samtykke</p>
                    <p className="text-xs text-foreground leading-relaxed">
                      Forældre eller værger giver samtykke på vegne af børn under 13 år. Begge forældre i en co-parenting-husstand har adgang til barnets data. Samtykket kan til enhver tid trækkes tilbage.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Hvilke børnedata behandles</p>
                    <ul className="list-disc list-inside space-y-1 ml-1 text-xs text-foreground leading-relaxed">
                      <li><span className="font-semibold">Identifikation:</span> Navn, fødselsdato, profilbillede</li>
                      <li><span className="font-semibold">Sundhed:</span> Allergier, medicin, humør/søvn/appetit-logs</li>
                      <li><span className="font-semibold">Institution:</span> Vuggestue, børnehave eller skole</li>
                      <li><span className="font-semibold">Samvær:</span> Hvilken forælder barnet er hos på en given dag</li>
                      <li><span className="font-semibold">Fotos:</span> Billeder delt i familiens fotoalbum</li>
                      <li><span className="font-semibold">Milestones:</span> Udviklingsmæssige milepæle</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Hvem kan se børnedata</p>
                    <p className="text-xs text-foreground leading-relaxed">
                      Kun husstandens voksne medlemmer kan se børnedata. Hverdag som virksomhed har ikke adgang til individuelle børns data. Børnedata deles aldrig med tredjeparter — hverken til markedsføring, forskning eller andre formål.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Sletning af børnedata</p>
                    <p className="text-xs text-foreground leading-relaxed">
                      Børnedata kan fjernes fra appen af enhver forælder med adgang. Ved kontosletning anonymiseres alle børnedata tilknyttet kontoen. Hvis begge forældre sletter deres konti, slettes alle børnedata permanent.
                    </p>
                  </div>
                </div>
              )}

              {settingsDetailView === 'sikkerhed' && (
                <div className="space-y-4 px-1">
                  <p className="text-base font-bold text-foreground">For at holde dine data sikre</p>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Kryptering</p>
                    <ul className="list-disc list-inside space-y-1 ml-1 text-xs text-foreground leading-relaxed">
                      <li>Adgangskoder krypteres med bcrypt (salt rounds 12) og gemmes aldrig i klartekst</li>
                      <li>Al kommunikation foregår via HTTPS med TLS 1.3-kryptering</li>
                      <li>Databasen er krypteret at-rest med AES-256</li>
                      <li>Samværsplaner og dokumenter gemmes krypteret i cloud-storage</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Adgangskontrol</p>
                    <p className="text-xs text-foreground leading-relaxed">
                      Hverdag bruger household-baseret adgangskontrol, hvilket betyder at kun godkendte husstandsmedlemmer kan se jeres data. Hvert dataobjekt er knyttet til en specifik husstand og kan ikke tilgås af andre brugere.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Autentificering</p>
                    <p className="text-xs text-foreground leading-relaxed">
                      Vi bruger Supabase Auth til sikker brugerautentificering med JWT-tokens. Sessions udløber automatisk, og tokens fornyes sikkert. Push notification tokens slettes automatisk ved kontosletning.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Databrud</p>
                    <p className="text-xs text-foreground leading-relaxed">
                      Ved et sikkerhedsbrud følger vi GDPR art. 33 og 34: Vi notificerer Datatilsynet inden 72 timer og informerer berørte brugere direkte via email og/eller push-notifikation med information om bruddet, de berørte data og de tiltag vi har iværksat.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Cookies & lokal lagring</p>
                    <p className="text-xs text-foreground leading-relaxed">
                      Appen bruger localStorage til session-data (login-token og app-tilstand). Dette er teknisk nødvendigt for appens funktion. Vi bruger ingen tredjeparts-cookies og ingen tracking- eller reklame-cookies.
                    </p>
                  </div>
                </div>
              )}

              {settingsDetailView === 'kommunikation' && (
                <div className="space-y-4 px-1">
                  <p className="text-base font-bold text-foreground">For at kommunikere med dig</p>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Push-notifikationer</p>
                    <p className="text-xs text-foreground leading-relaxed">
                      Vi sender push-notifikationer via Apple Push Notification Service (APNs) for at informere dig om vigtige hændelser. Du kan styre hvilke typer notifikationer du modtager under Indstillinger → Notifikationer. Dine device-tokens gemmes i vores database og slettes ved kontosletning.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Hvilke notifikationer sender vi</p>
                    <ul className="list-disc list-inside space-y-1 ml-1 text-xs text-foreground leading-relaxed">
                      <li>Afleveringspåmindelser og samværsændringer</li>
                      <li>Nye beskeder fra husstandsmedlemmer</li>
                      <li>Opgavetildelinger og deadlines</li>
                      <li>Udgifter der afventer godkendelse</li>
                      <li>Kalenderbegivenheder og vigtige datoer</li>
                      <li>Madplan- og indkøbspåmindelser</li>
                      <li>Nye delte dokumenter og beslutningsforslag</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Email-kommunikation</p>
                    <p className="text-xs text-foreground leading-relaxed">
                      Din email bruges til kontoverifikation, adgangskodegendannelse og vigtige kontorelaterede meddelelser. Vi sender ikke markedsføringsemails medmindre du eksplicit tilmelder dig.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Dine kontaktpræferencer</p>
                    <p className="text-xs text-foreground leading-relaxed">
                      Du kan til enhver tid ændre dine notifikationsindstillinger i appen. Du kan slå individuelle kategorier til og fra, og du kan helt fravælge push-notifikationer i din enheds indstillinger.
                    </p>
                  </div>
                </div>
              )}

              {settingsDetailView === 'rettigheder' && (
                <div className="space-y-4 px-1">
                  <p className="text-base font-bold text-foreground">Dine rettigheder som bruger</p>
                  <p className="text-xs text-foreground leading-relaxed">
                    Som bruger af Hverdag har du en række rettigheder i henhold til GDPR. Vi gør det nemt for dig at udøve disse rettigheder direkte i appen eller ved at kontakte os.
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Ret til indsigt (art. 15)</p>
                    <p className="text-xs text-foreground leading-relaxed">
                      Du kan se alle dine persondata direkte i appen under din profil og i de forskellige sektioner. Du kan også anmode om en komplet oversigt over alle data vi har om dig ved at kontakte os.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Ret til berigtigelse (art. 16)</p>
                    <p className="text-xs text-foreground leading-relaxed">
                      Du kan rette dine personoplysninger direkte under Indstillinger → Konto. Dette omfatter dit navn, email, telefonnummer, adresse og andre profiloplysninger.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Ret til sletning (art. 17)</p>
                    <p className="text-xs text-foreground leading-relaxed">
                      Du kan slette din konto under Indstillinger → Konto → Slet konto. Ved sletning anonymiseres alle dine persondata permanent. Se afsnittet &quot;Sådan sletter du dine data&quot; for detaljer.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Ret til begrænsning af behandling (art. 18)</p>
                    <p className="text-xs text-foreground leading-relaxed">
                      Du kan anmode om, at vi begrænser behandlingen af dine data i visse situationer, fx mens en indsigelse behandles. Kontakt os på support@hverdag.app.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Ret til dataportabilitet (art. 20)</p>
                    <p className="text-xs text-foreground leading-relaxed">
                      Du har ret til at modtage dine persondata i et struktureret, almindeligt anvendt og maskinlæsbart format (JSON). Kontakt os på support@hverdag.app for at anmode om dataeksport.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Ret til indsigelse (art. 21)</p>
                    <p className="text-xs text-foreground leading-relaxed">
                      Du kan gøre indsigelse mod behandling af dine data, der er baseret på legitim interesse. Vi stopper behandlingen, medmindre vi kan påvise tvingende legitime grunde.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Klage til tilsynsmyndighed</p>
                    <p className="text-xs text-foreground leading-relaxed">
                      Du har ret til at klage til Datatilsynet, hvis du mener, at vi behandler dine persondata i strid med GDPR. Datatilsynet kan kontaktes på dt@datatilsynet.dk eller via datatilsynet.dk.
                    </p>
                  </div>
                  <div className="space-y-2 pt-1">
                    <p className="text-sm font-semibold text-foreground">Kontakt</p>
                    <p className="text-xs text-foreground leading-relaxed">
                      Dataansvarlig: Hverdag ApS<br />
                      Email: support@hverdag.app<br />
                      Vi bestræber os på at besvare alle henvendelser inden for 30 dage.
                    </p>
                  </div>
                </div>
              )}

              {settingsDetailView === 'databehandlere' && (
                <div className="space-y-4 px-1">
                  <p className="text-base font-bold text-foreground">Hvem vi deler data med</p>
                  <p className="text-xs text-foreground leading-relaxed">
                    Vi deler aldrig dine persondata med tredjeparter til markedsføring, reklame eller andre kommercielle formål. Vi bruger kun betroede databehandlere, der er nødvendige for at drive appen.
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Supabase — Database & Autentificering</p>
                    <ul className="list-disc list-inside space-y-1 ml-1 text-xs text-foreground leading-relaxed">
                      <li>Lagrer alle appdata (brugerprofiler, samværsplaner, beskeder, dokumenter etc.)</li>
                      <li>Håndterer brugerautentificering og session-management</li>
                      <li>Hostet i EU-region (Frankfurt, Tyskland)</li>
                      <li>SOC 2 Type II-certificeret</li>
                      <li>Databehandleraftale (DPA) indgået i henhold til GDPR art. 28</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Stripe — Betalingshåndtering</p>
                    <ul className="list-disc list-inside space-y-1 ml-1 text-xs text-foreground leading-relaxed">
                      <li>Håndterer abonnementsbetalinger og fakturering</li>
                      <li>PCI DSS Level 1-compliant (højeste sikkerhedsniveau for betalingsdata)</li>
                      <li>Vi gemmer aldrig kreditkortoplysninger — Stripe håndterer det direkte</li>
                      <li>Databehandleraftale (DPA) indgået</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Apple Push Notification Service (APNs)</p>
                    <ul className="list-disc list-inside space-y-1 ml-1 text-xs text-foreground leading-relaxed">
                      <li>Leverer push-notifikationer til din iPhone/iPad</li>
                      <li>Vi sender kun notifikationsindhold — Apple kan ikke læse beskederne</li>
                      <li>Device-tokens slettes ved kontosletning</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Ingen andre databehandlere</p>
                    <p className="text-xs text-foreground leading-relaxed">
                      Vi bruger ingen analytics-tjenester (Google Analytics, Mixpanel etc.), ingen reklame-netværk, ingen social media-trackers og ingen AI/ML-tjenester til at behandle dine data. Dine data forbliver inden for de ovennævnte tjenester.
                    </p>
                  </div>
                </div>
              )}

              {settingsDetailView === 'sletning' && (
                <div className="space-y-4 px-1">
                  <p className="text-base font-bold text-foreground">Sådan sletter du dine data</p>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Sletning af din konto</p>
                    <p className="text-xs text-foreground leading-relaxed">
                      Du kan slette din konto under Indstillinger → Konto → Slet konto. Sletningen er permanent og kan ikke fortrydes.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Hvad sker der ved sletning</p>
                    <p className="text-xs text-foreground leading-relaxed">Ved kontosletning anonymiseres alle dine persondata:</p>
                    <ul className="list-disc list-inside space-y-1 ml-1 text-xs text-foreground leading-relaxed">
                      <li>Dit navn erstattes med &quot;Slettet bruger&quot;</li>
                      <li>Din email anonymiseres (fx slettet_a1b2c3@anon.hverdag.app)</li>
                      <li>Telefonnummer, adresse og andre kontaktoplysninger fjernes</li>
                      <li>Dit profilbillede slettes</li>
                      <li>Push notification tokens slettes fra vores database</li>
                      <li>Personlige beskeder anonymiseres (afsender vises som &quot;Slettet bruger&quot;)</li>
                      <li>Dagbogsindlæg og private noter slettes</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Hvad bevares (anonymiseret)</p>
                    <p className="text-xs text-foreground leading-relaxed">
                      For at bevare husstandens historik anonymiseres visse data i stedet for at slettes fuldstændigt. Dette inkluderer delte udgifter, beslutningslog-indlæg og mødereferater, hvor dit navn erstattes med &quot;Slettet bruger&quot;. Disse data kan ikke føres tilbage til dig som person.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Tidsramme</p>
                    <p className="text-xs text-foreground leading-relaxed">
                      Anonymiseringen sker inden for 30 dage efter anmodning om kontosletning. Betalingsdata hos Stripe bevares i overensstemmelse med Stripes egne opbevaringsregler og lovkrav om regnskabsopbevaring.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Sletning af specifikke data</p>
                    <p className="text-xs text-foreground leading-relaxed">
                      Du behøver ikke slette hele din konto for at fjerne data. Du kan slette individuelle elementer direkte i appen: børneprofiler, dokumenter, dagbogsindlæg, fotos, udgifter og beskeder kan alle fjernes enkeltvist.
                    </p>
                  </div>
                </div>
              )}

              <div className="border-t border-border mt-4" />
              <p className="text-[10px] text-center text-muted-foreground pb-4 pt-2">
                Dataansvarlig: Hverdag ApS · support@hverdag.app<br />
                Senest opdateret: Februar 2026 · Hverdag v1.0
              </p>
            </>
          )}
        </TabsContent>

        {/* ─── Visning (fra sidepanel) ─── */}
        <TabsContent value="appearance" className="space-y-2">
              {/* Dark mode toggle */}
              <div className="space-y-2">
                <p className="text-[15px] font-medium text-foreground dark:text-slate-200">Farvetema</p>
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
                      className={`flex flex-1 flex-col items-center gap-1 rounded-[8px] border py-2.5 px-2 text-xs font-medium transition-colors ${
                        theme === value
                          ? 'border-orange-400 bg-orange-50 text-orange-700 dark:border-orange-400 dark:bg-orange-950 dark:text-orange-300'
                          : 'border-border bg-card text-muted-foreground dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-[8px] border border-border bg-card px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
                <div>
                  <p className="text-[15px] font-medium text-foreground dark:text-slate-200">Professionel visning</p>
                  <p className="text-[13px] text-muted-foreground dark:text-slate-400">
                    {allowProfessionalTools ? 'Kan slås til/fra' : 'Kun tilgængelig for professionelle brugere og administratorer'}
                  </p>
                </div>
                <IOSSwitch
                  checked={isProfessionalView && allowProfessionalTools}
                  disabled={!allowProfessionalTools}
                  onCheckedChange={(value) => {
                    setProfessionalView(value);
                    if (value) setFamilyMemberView(false);
                  }}
                />
              </div>

              <div className="flex items-center justify-between rounded-[8px] border border-[#d8d7cf] bg-[#faf9f6] px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
                <div>
                  <p className="text-[15px] font-medium text-[#2f2f2d] dark:text-slate-200">Familiemedlem visning</p>
                  <p className="text-[13px] text-[#75736b] dark:text-slate-400">
                    {allowProfessionalTools ? 'Se appen som et familiemedlem' : 'Kun tilgængelig for administratorer'}
                  </p>
                </div>
                <IOSSwitch
                  checked={isFamilyMemberView && allowProfessionalTools}
                  disabled={!allowProfessionalTools}
                  onCheckedChange={(value) => {
                    setFamilyMemberView(value);
                    if (value) setProfessionalView(false);
                  }}
                />
              </div>
        </TabsContent>
      </Tabs>

      {/* Family Member Dialog */}
      <Dialog open={familyMemberOpen} onOpenChange={setFamilyMemberOpen}>
        <DialogContent className="max-w-sm rounded-3xl border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-[1rem] tracking-[-0.01em] text-foreground">Tilføj familiemedlem</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-[12px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">Navn</Label>
              <Input
                value={familyMemberDraft.name}
                onChange={e => setFamilyMemberDraft(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Fulde navn"
                className="rounded-[8px] border-border bg-card"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[12px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">Email (valgfrit)</Label>
              <Input
                value={familyMemberDraft.email}
                onChange={e => setFamilyMemberDraft(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@eksempel.dk"
                className="rounded-[8px] border-border bg-card"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[12px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">Rolle</Label>
              <SelectSheet
                value={familyMemberDraft.role}
                onValueChange={(v) => setFamilyMemberDraft(prev => ({ ...prev, role: v as FamilyMemberRole }))}
                title="Rolle"
                options={[
                  { value: 'teenager', label: 'Teenager' },
                  { value: 'grandparent', label: 'Bedsteforælder' },
                  { value: 'step_parent', label: 'Bonusforælder' },
                  { value: 'other_relative', label: 'Øvrigt familiemedlem' },
                ]}
                className="rounded-[8px] border-border bg-card"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1 rounded-[8px] border-border" onClick={() => setFamilyMemberOpen(false)}>
                Annuller
              </Button>
              <Button
                className="flex-1 rounded-[8px] bg-primary text-white hover:bg-primary"
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



      <SavingOverlay open={isSaving} />
    </div>
  );
}
