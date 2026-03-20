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
                        <linearGradient id="card-g" x1="40" y1="40" x2="220" y2="150" gradientUnits="userSpaceOnUse"><stop stopColor="#FFF8E1"/><stop offset="1" stopColor="#FFE0B2"/></linearGradient>
                        <linearGradient id="header-g" x1="40" y1="40" x2="220" y2="75" gradientUnits="userSpaceOnUse"><stop stopColor="#F5A623"/><stop offset="1" stopColor="#FB8C00"/></linearGradient>
                        <filter id="card-s"><feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.1"/></filter>
                      </defs>
                      <rect x="40" y="40" width="180" height="115" rx="18" fill="url(#card-g)" filter="url(#card-s)" stroke="#F5A623" strokeWidth="1.5"/>
                      <rect x="40" y="40" width="180" height="38" rx="18" fill="url(#header-g)"/>
                      <rect x="40" y="62" width="180" height="16" fill="url(#header-g)"/>
                      <circle cx="82" cy="112" r="22" fill="#FFCC80" opacity="0.7"/>
                      <circle cx="82" cy="106" r="9" fill="#FFE0B2"/>
                      <ellipse cx="82" cy="125" rx="15" ry="9" fill="#FFE0B2"/>
                      <rect x="114" y="100" width="85" height="9" rx="4.5" fill="#FFD180"/>
                      <rect x="114" y="116" width="58" height="7" rx="3.5" fill="#FFE0B2"/>
                      <rect x="114" y="130" width="68" height="7" rx="3.5" fill="#FFE0B2"/>
                      <g transform="translate(198, 22) rotate(45)">
                        <rect x="0" y="0" width="9" height="52" rx="2.5" fill="#42A5F5"/>
                        <rect x="1" y="2" width="7" height="48" rx="2" fill="#64B5F6"/>
                        <polygon points="0,52 4.5,65 9,52" fill="#FFD54F"/>
                        <rect x="0" y="0" width="9" height="9" rx="1.5" fill="#EF5350"/>
                      </g>
                      <circle cx="28" cy="168" r="5" fill="#FFCC80" opacity="0.4"/><circle cx="46" cy="182" r="3.5" fill="#90CAF9" opacity="0.35"/>
                      <circle cx="222" cy="168" r="6" fill="#F5A623" opacity="0.25"/><circle cx="238" cy="184" r="3.5" fill="#FFCC80" opacity="0.35"/>
                      <path d="M25 50 L30 45 L35 50 L30 55Z" fill="#90CAF9" opacity="0.25"/>
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
                        <linearGradient id="email-env-g" x1="45" y1="55" x2="215" y2="160" gradientUnits="userSpaceOnUse"><stop stopColor="#E3F2FD"/><stop offset="1" stopColor="#BBDEFB"/></linearGradient>
                        <linearGradient id="email-flap-g" x1="45" y1="55" x2="215" y2="105" gradientUnits="userSpaceOnUse"><stop stopColor="#90CAF9"/><stop offset="1" stopColor="#64B5F6"/></linearGradient>
                        <linearGradient id="email-at-g" x1="112" y1="78" x2="148" y2="118" gradientUnits="userSpaceOnUse"><stop stopColor="#42A5F5"/><stop offset="1" stopColor="#1565C0"/></linearGradient>
                        <filter id="email-s"><feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.12"/></filter>
                      </defs>
                      {/* Envelope body */}
                      <rect x="45" y="58" width="170" height="102" rx="16" fill="url(#email-env-g)" filter="url(#email-s)" stroke="#64B5F6" strokeWidth="1.5"/>
                      {/* Flap fold */}
                      <path d="M45 74 L130 124 L215 74 L215 58 Q215 58 205 58 L55 58 Q45 58 45 68Z" fill="url(#email-flap-g)" opacity="0.6"/>
                      {/* Fold lines */}
                      <path d="M45 160 L102 122" stroke="#90CAF9" strokeWidth="1.5" fill="none"/>
                      <path d="M215 160 L158 122" stroke="#90CAF9" strokeWidth="1.5" fill="none"/>
                      {/* @ circle outer */}
                      <circle cx="130" cy="103" r="20" stroke="url(#email-at-g)" strokeWidth="2.5" fill="white" opacity="0.9"/>
                      {/* @ inner circle */}
                      <circle cx="130" cy="103" r="9" stroke="url(#email-at-g)" strokeWidth="2" fill="none"/>
                      {/* @ tail */}
                      <path d="M139 103 C139 93 147 91 147 103 C147 116 139 113 139 103" stroke="url(#email-at-g)" strokeWidth="2" fill="none" strokeLinecap="round"/>
                      {/* Decorative flowers */}
                      <g transform="translate(30, 36)">
                        <circle cx="0" cy="-5" r="5" fill="#F8BBD0"/>
                        <circle cx="5" cy="-2" r="5" fill="#F48FB1"/>
                        <circle cx="-5" cy="-2" r="5" fill="#F48FB1"/>
                        <circle cx="3" cy="-9" r="4.5" fill="#F8BBD0"/>
                        <circle cx="-3" cy="-9" r="4.5" fill="#FCE4EC"/>
                        <circle cx="0" cy="-5" r="3.5" fill="#FFD54F"/>
                      </g>
                      <g transform="translate(234, 40)">
                        <circle cx="0" cy="-5" r="4.5" fill="#C5E1A5"/>
                        <circle cx="4.5" cy="-2" r="4.5" fill="#AED581"/>
                        <circle cx="-4.5" cy="-2" r="4.5" fill="#AED581"/>
                        <circle cx="0" cy="-9" r="4" fill="#DCEDC8"/>
                        <circle cx="0" cy="-5" r="3" fill="#FFE082"/>
                      </g>
                      <circle cx="55" cy="180" r="3" fill="#64B5F6" opacity="0.35"/>
                      <circle cx="205" cy="176" r="4" fill="#F48FB1" opacity="0.3"/>
                      <circle cx="242" cy="170" r="2.5" fill="#90CAF9" opacity="0.3"/>
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
                        <linearGradient id="phone-body-g" x1="90" y1="20" x2="170" y2="170" gradientUnits="userSpaceOnUse"><stop stopColor="#E8EAF6"/><stop offset="1" stopColor="#C5CAE9"/></linearGradient>
                        <linearGradient id="phone-bubble1-g" x1="102" y1="48" x2="147" y2="72" gradientUnits="userSpaceOnUse"><stop stopColor="#9FA8DA"/><stop offset="1" stopColor="#7986CB"/></linearGradient>
                        <linearGradient id="phone-bubble2-g" x1="120" y1="78" x2="158" y2="103" gradientUnits="userSpaceOnUse"><stop stopColor="#7986CB"/><stop offset="1" stopColor="#5C6BC0"/></linearGradient>
                        <filter id="phone-s"><feDropShadow dx="0" dy="5" stdDeviation="7" floodOpacity="0.14"/></filter>
                      </defs>
                      {/* Phone body */}
                      <rect x="90" y="20" width="80" height="155" rx="18" fill="url(#phone-body-g)" filter="url(#phone-s)" stroke="#7986CB" strokeWidth="1.5"/>
                      {/* Screen */}
                      <rect x="96" y="36" width="68" height="112" rx="6" fill="white"/>
                      {/* Home button */}
                      <circle cx="130" cy="160" r="6" stroke="#7986CB" strokeWidth="1.5" fill="#E8EAF6"/>
                      {/* Speaker notch */}
                      <rect x="117" y="26" width="26" height="4" rx="2" fill="#9FA8DA"/>
                      {/* Chat bubble 1 — received */}
                      <rect x="100" y="48" width="46" height="24" rx="12" fill="url(#phone-bubble1-g)"/>
                      <path d="M103 72 L100 78 L108 72Z" fill="url(#phone-bubble1-g)"/>
                      {/* Dots in bubble 1 */}
                      <circle cx="113" cy="60" r="2.5" fill="white" opacity="0.8"/>
                      <circle cx="123" cy="60" r="2.5" fill="white" opacity="0.8"/>
                      <circle cx="133" cy="60" r="2.5" fill="white" opacity="0.8"/>
                      {/* Chat bubble 2 — sent */}
                      <rect x="118" y="82" width="42" height="22" rx="11" fill="url(#phone-bubble2-g)"/>
                      <path d="M157 82 L160 76 L155 82Z" fill="url(#phone-bubble2-g)"/>
                      <circle cx="130" cy="93" r="2" fill="white" opacity="0.7"/>
                      <circle cx="139" cy="93" r="2" fill="white" opacity="0.7"/>
                      {/* Chat bubble 3 — small received */}
                      <rect x="100" y="114" width="32" height="18" rx="9" fill="#C5CAE9"/>
                      <circle cx="110" cy="123" r="1.8" fill="#7986CB" opacity="0.7"/>
                      <circle cx="116" cy="123" r="1.8" fill="#7986CB" opacity="0.7"/>
                      {/* Signal arcs */}
                      <path d="M186 48 Q197 37 208 48" stroke="#7986CB" strokeWidth="2" fill="none" opacity="0.5" strokeLinecap="round"/>
                      <path d="M181 37 Q197 21 213 37" stroke="#7986CB" strokeWidth="1.8" fill="none" opacity="0.3" strokeLinecap="round"/>
                      {/* Decorative orbs */}
                      <circle cx="54" cy="80" r="8" fill="#C5CAE9" opacity="0.28"/>
                      <circle cx="44" cy="97" r="5" fill="#7986CB" opacity="0.18"/>
                      <circle cx="212" cy="122" r="6" fill="#9FA8DA" opacity="0.28"/>
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
                        <linearGradient id="bday-bot-g" x1="65" y1="110" x2="195" y2="165" gradientUnits="userSpaceOnUse"><stop stopColor="#FFAB91"/><stop offset="1" stopColor="#FF8A65"/></linearGradient>
                        <linearGradient id="bday-mid-g" x1="75" y1="82" x2="185" y2="115" gradientUnits="userSpaceOnUse"><stop stopColor="#FF8A65"/><stop offset="1" stopColor="#FF7043"/></linearGradient>
                        <linearGradient id="bday-frost-g" x1="75" y1="105" x2="185" y2="118" gradientUnits="userSpaceOnUse"><stop stopColor="#FFF9C4"/><stop offset="1" stopColor="#FFECB3"/></linearGradient>
                        <filter id="bday-s"><feDropShadow dx="0" dy="5" stdDeviation="7" floodOpacity="0.13"/></filter>
                      </defs>
                      {/* Shadow under cake */}
                      <ellipse cx="130" cy="168" rx="78" ry="9" fill="#FFCCBC" opacity="0.6"/>
                      {/* Bottom cake tier */}
                      <rect x="65" y="112" width="130" height="52" rx="14" fill="url(#bday-bot-g)" filter="url(#bday-s)"/>
                      {/* Frosting drips on bottom */}
                      <path d="M75 112 Q85 104 95 112 Q105 104 115 112 Q125 104 135 112 Q145 104 155 112 Q165 104 175 112 Q182 105 185 112" fill="url(#bday-frost-g)" stroke="none"/>
                      {/* Middle tier */}
                      <rect x="78" y="82" width="104" height="34" rx="12" fill="url(#bday-mid-g)"/>
                      {/* Frosting on middle */}
                      <path d="M88 82 Q96 74 104 82 Q112 74 120 82 Q128 74 136 82 Q144 74 152 82 Q158 75 162 82" fill="url(#bday-frost-g)" stroke="none"/>
                      {/* Candle 1 */}
                      <rect x="100" y="54" width="7" height="30" rx="3.5" fill="#64B5F6"/>
                      <ellipse cx="103.5" cy="49" rx="5.5" ry="8" fill="#FFD54F"/>
                      <ellipse cx="103.5" cy="46" rx="2.5" ry="4.5" fill="#FFF9C4"/>
                      <ellipse cx="103.5" cy="44" rx="1.2" ry="2.5" fill="white" opacity="0.8"/>
                      {/* Candle 2 */}
                      <rect x="126.5" y="48" width="7" height="36" rx="3.5" fill="#F48FB1"/>
                      <ellipse cx="130" cy="43" rx="5.5" ry="8" fill="#FFD54F"/>
                      <ellipse cx="130" cy="40" rx="2.5" ry="4.5" fill="#FFF9C4"/>
                      <ellipse cx="130" cy="38" rx="1.2" ry="2.5" fill="white" opacity="0.8"/>
                      {/* Candle 3 */}
                      <rect x="153" y="54" width="7" height="30" rx="3.5" fill="#81C784"/>
                      <ellipse cx="156.5" cy="49" rx="5.5" ry="8" fill="#FFD54F"/>
                      <ellipse cx="156.5" cy="46" rx="2.5" ry="4.5" fill="#FFF9C4"/>
                      <ellipse cx="156.5" cy="44" rx="1.2" ry="2.5" fill="white" opacity="0.8"/>
                      {/* Confetti */}
                      <rect x="40" y="28" width="9" height="4.5" rx="2" fill="#F48FB1" transform="rotate(-22 40 28)"/>
                      <rect x="208" y="24" width="9" height="4.5" rx="2" fill="#64B5F6" transform="rotate(16 208 24)"/>
                      <circle cx="50" cy="58" r="3.5" fill="#FFD54F"/>
                      <circle cx="214" cy="54" r="3" fill="#81C784"/>
                      <rect x="55" y="44" width="7" height="3.5" rx="1.5" fill="#CE93D8" transform="rotate(-36 55 44)"/>
                      <rect x="200" y="39" width="7" height="3.5" rx="1.5" fill="#FFAB91" transform="rotate(26 200 39)"/>
                      <circle cx="35" cy="80" r="2.5" fill="#64B5F6" opacity="0.45"/>
                      <circle cx="225" cy="74" r="2.5" fill="#F48FB1" opacity="0.45"/>
                      <rect x="230" y="48" width="7" height="3" rx="1.5" fill="#FFD54F" transform="rotate(-14 230 48)"/>
                      <rect x="28" y="50" width="6" height="3" rx="1.5" fill="#81C784" transform="rotate(20 28 50)"/>
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
                        <linearGradient id="gender-p1-g" x1="70" y1="45" x2="120" y2="170" gradientUnits="userSpaceOnUse"><stop stopColor="#90CAF9"/><stop offset="1" stopColor="#42A5F5"/></linearGradient>
                        <linearGradient id="gender-p2-g" x1="140" y1="45" x2="195" y2="170" gradientUnits="userSpaceOnUse"><stop stopColor="#F48FB1"/><stop offset="1" stopColor="#E91E8C"/></linearGradient>
                        <linearGradient id="gender-heart-g" x1="118" y1="72" x2="148" y2="105" gradientUnits="userSpaceOnUse"><stop stopColor="#FF6B6B"/><stop offset="1" stopColor="#C62828"/></linearGradient>
                        <filter id="gender-s"><feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.13"/></filter>
                      </defs>
                      {/* Person 1 — blue silhouette */}
                      <circle cx="95" cy="70" r="26" fill="url(#gender-p1-g)" filter="url(#gender-s)"/>
                      <ellipse cx="95" cy="133" rx="31" ry="42" fill="url(#gender-p1-g)" filter="url(#gender-s)"/>
                      {/* Person 2 — pink silhouette */}
                      <circle cx="165" cy="70" r="26" fill="url(#gender-p2-g)" filter="url(#gender-s)"/>
                      <ellipse cx="165" cy="133" rx="31" ry="42" fill="url(#gender-p2-g)" filter="url(#gender-s)"/>
                      {/* Large heart between them */}
                      <path d="M122 87 C122 79 129 75 133 80 C137 75 144 79 144 87 C144 99 133 106 133 106 C133 106 122 99 122 87Z" fill="url(#gender-heart-g)" opacity="0.85"/>
                      {/* Small heart below */}
                      <path d="M116 110 C116 105 121 103 123 106 C125 103 130 105 130 110 C130 117 123 121 123 121 C123 121 116 117 116 110Z" fill="#EF5350" opacity="0.4"/>
                      {/* Sparkles */}
                      <circle cx="40" cy="58" r="4" fill="#CE93D8" opacity="0.3"/>
                      <circle cx="222" cy="54" r="5" fill="#CE93D8" opacity="0.28"/>
                      <circle cx="50" cy="171" r="3" fill="#90CAF9" opacity="0.38"/>
                      <circle cx="210" cy="176" r="3" fill="#F48FB1" opacity="0.38"/>
                      <circle cx="130" cy="160" r="2.5" fill="#EF5350" opacity="0.25"/>
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
                        <linearGradient id="addr-house-g" x1="80" y1="95" x2="180" y2="175" gradientUnits="userSpaceOnUse"><stop stopColor="#FFF9F0"/><stop offset="1" stopColor="#FFF3E0"/></linearGradient>
                        <linearGradient id="addr-roof-g" x1="70" y1="55" x2="190" y2="102" gradientUnits="userSpaceOnUse"><stop stopColor="#FF8A65"/><stop offset="1" stopColor="#E64A19"/></linearGradient>
                        <linearGradient id="addr-pin-g" x1="108" y1="20" x2="152" y2="75" gradientUnits="userSpaceOnUse"><stop stopColor="#EF5350"/><stop offset="1" stopColor="#B71C1C"/></linearGradient>
                        <linearGradient id="addr-tree-g" x1="27" y1="115" x2="59" y2="165" gradientUnits="userSpaceOnUse"><stop stopColor="#81C784"/><stop offset="1" stopColor="#388E3C"/></linearGradient>
                        <linearGradient id="addr-tree2-g" x1="202" y1="118" x2="232" y2="165" gradientUnits="userSpaceOnUse"><stop stopColor="#81C784"/><stop offset="1" stopColor="#388E3C"/></linearGradient>
                        <filter id="addr-house-s"><feDropShadow dx="0" dy="5" stdDeviation="7" floodOpacity="0.12"/></filter>
                        <filter id="addr-pin-s"><feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.2"/></filter>
                      </defs>
                      {/* Ground */}
                      <ellipse cx="130" cy="172" rx="110" ry="12" fill="#C8E6C9" opacity="0.7"/>
                      {/* House body */}
                      <rect x="80" y="97" width="100" height="74" rx="6" fill="url(#addr-house-g)" filter="url(#addr-house-s)" stroke="#F5A623" strokeWidth="1.2"/>
                      {/* Roof */}
                      <path d="M68 103 L130 56 L192 103Z" fill="url(#addr-roof-g)"/>
                      <path d="M68 103 L130 56 L192 103" stroke="#BF360C" strokeWidth="1.2" fill="none"/>
                      {/* Roof ridge cap */}
                      <ellipse cx="130" cy="56" rx="5" ry="5" fill="#FF8A65" opacity="0.5"/>
                      {/* Door */}
                      <rect x="115" y="132" width="30" height="39" rx="5" fill="#8D6E63"/>
                      <rect x="115" y="132" width="30" height="39" rx="5" stroke="#6D4C41" strokeWidth="1"/>
                      <circle cx="140" cy="153" r="2.8" fill="#FFD54F"/>
                      {/* Window left */}
                      <rect x="88" y="108" width="20" height="20" rx="4" fill="#B3E5FC" stroke="#29B6F6" strokeWidth="1"/>
                      <line x1="98" y1="108" x2="98" y2="128" stroke="#29B6F6" strokeWidth="0.7"/>
                      <line x1="88" y1="118" x2="108" y2="118" stroke="#29B6F6" strokeWidth="0.7"/>
                      {/* Window right */}
                      <rect x="152" y="108" width="20" height="20" rx="4" fill="#B3E5FC" stroke="#29B6F6" strokeWidth="1"/>
                      <line x1="162" y1="108" x2="162" y2="128" stroke="#29B6F6" strokeWidth="0.7"/>
                      <line x1="152" y1="118" x2="172" y2="118" stroke="#29B6F6" strokeWidth="0.7"/>
                      {/* Map pin */}
                      <path d="M130 18 C117 18 106 29 106 42 C106 59 130 77 130 77 C130 77 154 59 154 42 C154 29 143 18 130 18Z" fill="url(#addr-pin-g)" filter="url(#addr-pin-s)"/>
                      <circle cx="130" cy="41" r="9" fill="white" opacity="0.9"/>
                      <circle cx="130" cy="41" r="4" fill="#EF5350" opacity="0.5"/>
                      {/* Tree left */}
                      <rect x="40" y="142" width="7" height="28" rx="3" fill="#795548"/>
                      <circle cx="43" cy="129" r="17" fill="url(#addr-tree-g)"/>
                      <circle cx="37" cy="137" r="13" fill="#66BB6A"/>
                      {/* Tree right */}
                      <rect x="214" y="143" width="6" height="26" rx="3" fill="#795548"/>
                      <circle cx="217" cy="131" r="15" fill="url(#addr-tree2-g)"/>
                      <circle cx="222" cy="139" r="11" fill="#66BB6A"/>
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
                        <radialGradient id="globe-fill-g" cx="40%" cy="35%" r="65%" gradientUnits="objectBoundingBox"><stop stopColor="#E3F2FD"/><stop offset="1" stopColor="#BBDEFB"/></radialGradient>
                        <linearGradient id="globe-land-g" x1="90" y1="70" x2="160" y2="130" gradientUnits="userSpaceOnUse"><stop stopColor="#A5D6A7"/><stop offset="1" stopColor="#4CAF50"/></linearGradient>
                        <filter id="globe-s"><feDropShadow dx="0" dy="5" stdDeviation="8" floodOpacity="0.14"/></filter>
                        <filter id="globe-flag-s"><feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.18"/></filter>
                      </defs>
                      {/* Globe */}
                      <circle cx="130" cy="102" r="66" fill="url(#globe-fill-g)" filter="url(#globe-s)" stroke="#64B5F6" strokeWidth="1.8"/>
                      {/* Latitude lines */}
                      <ellipse cx="130" cy="102" rx="66" ry="25" stroke="#90CAF9" strokeWidth="0.9" fill="none" opacity="0.7"/>
                      <ellipse cx="130" cy="102" rx="48" ry="66" stroke="#90CAF9" strokeWidth="0.9" fill="none" opacity="0.7"/>
                      <line x1="64" y1="102" x2="196" y2="102" stroke="#90CAF9" strokeWidth="0.9" opacity="0.7"/>
                      <line x1="130" y1="36" x2="130" y2="168" stroke="#90CAF9" strokeWidth="0.9" opacity="0.7"/>
                      {/* Continents */}
                      <ellipse cx="109" cy="87" rx="21" ry="15" fill="url(#globe-land-g)" opacity="0.65"/>
                      <ellipse cx="155" cy="92" rx="15" ry="20" fill="url(#globe-land-g)" opacity="0.65"/>
                      <ellipse cx="120" cy="118" rx="18" ry="11" fill="url(#globe-land-g)" opacity="0.55"/>
                      <ellipse cx="148" cy="120" rx="9" ry="7" fill="url(#globe-land-g)" opacity="0.5"/>
                      {/* Danish flag on pole */}
                      <rect x="184" y="36" width="2.5" height="32" rx="1" fill="#8D6E63"/>
                      <g transform="translate(186, 36)" filter="url(#globe-flag-s)">
                        <rect x="0" y="0" width="32" height="22" rx="2" fill="#C8102E"/>
                        <rect x="9.5" y="0" width="4.5" height="22" fill="white"/>
                        <rect x="0" y="8.5" width="32" height="4.5" fill="white"/>
                      </g>
                      {/* Airplane */}
                      <g transform="translate(50, 38) rotate(-22)">
                        <ellipse cx="0" cy="0" rx="14" ry="3.5" fill="#7986CB"/>
                        <path d="M-6 0 L-2 -9 L3 0" fill="#9FA8DA"/>
                        <path d="M9 0 L14 -5 L14 0" fill="#9FA8DA"/>
                      </g>
                      {/* Flight path */}
                      <path d="M54 43 Q90 20 130 38" stroke="#7986CB" strokeWidth="1.2" strokeDasharray="3 3" fill="none" opacity="0.45"/>
                      <circle cx="27" cy="170" r="3" fill="#BBDEFB" opacity="0.4"/>
                      <circle cx="234" cy="168" r="3.5" fill="#90CAF9" opacity="0.35"/>
                    </svg>
                  </div>
                  <Button onClick={handleSaveField({ country: profileDraft.country.trim() || undefined })} className="w-full shrink-0 rounded-[12px] py-3" disabled={isSaving}>
                    Gem
                  </Button>
                </div>
              )}

              {/* ─── allergen-list: person picker ─── */}
              {settingsDetailView === 'allergen-list' && (
                <div className="min-h-[calc(100vh-280px)] flex flex-col" style={{ paddingBottom: keyboardHeight > 0 ? keyboardHeight : undefined }}>
                  <div className="space-y-4">
                    <h2 className="text-[28px] font-bold text-foreground pb-2">Familiens allergener</h2>
                    <p className="text-[13px] text-muted-foreground px-1">Vælg en person for at administrere allergener</p>
                    <div className="divide-y divide-border">
                      {currentUser && (
                        <button
                          onClick={() => setSettingsDetailView(`allergen-${currentUser.id}`)}
                          className="flex w-full items-center justify-between py-3.5 px-1 text-left transition-colors hover:bg-card"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <User className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                              <p className="text-[15px] font-medium text-foreground truncate">{currentUser.name}</p>
                              <p className="text-[13px] text-muted-foreground truncate">
                                {currentUser.allergies?.length ? currentUser.allergies.join(', ') : 'Ingen allergener'}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                        </button>
                      )}
                      {children.map(child => (
                        <button
                          key={child.id}
                          onClick={() => setSettingsDetailView(`allergen-${child.id}`)}
                          className="flex w-full items-center justify-between py-3.5 px-1 text-left transition-colors hover:bg-card"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Heart className="h-4 w-4 text-[#f58a2d] shrink-0" />
                            <div className="min-w-0">
                              <p className="text-[15px] font-medium text-foreground truncate">{child.name}</p>
                              <p className="text-[13px] text-muted-foreground truncate">
                                {child.allergies?.length ? child.allergies.join(', ') : 'Ingen allergener'}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 flex items-center justify-center py-8">
                    <svg width="260" height="200" viewBox="0 0 260 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="alglist-p1-g" x1="78" y1="45" x2="122" y2="155" gradientUnits="userSpaceOnUse"><stop stopColor="#FFE0B2"/><stop offset="1" stopColor="#FFCC80"/></linearGradient>
                        <linearGradient id="alglist-p2-g" x1="140" y1="52" x2="182" y2="147" gradientUnits="userSpaceOnUse"><stop stopColor="#FFCC80"/><stop offset="1" stopColor="#FFA726"/></linearGradient>
                        <linearGradient id="alglist-shield-g" x1="105" y1="138" x2="155" y2="200" gradientUnits="userSpaceOnUse"><stop stopColor="#FFF8E1"/><stop offset="1" stopColor="#FFE0B2"/></linearGradient>
                        <filter id="alglist-s"><feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.12"/></filter>
                        <filter id="alglist-shield-s"><feDropShadow dx="0" dy="3" stdDeviation="5" floodOpacity="0.15"/></filter>
                      </defs>
                      {/* Person 1 — parent */}
                      <circle cx="98" cy="68" r="24" fill="url(#alglist-p1-g)" filter="url(#alglist-s)"/>
                      <ellipse cx="98" cy="122" rx="27" ry="32" fill="url(#alglist-p1-g)" filter="url(#alglist-s)"/>
                      {/* Person 2 — child */}
                      <circle cx="160" cy="74" r="19" fill="url(#alglist-p2-g)" filter="url(#alglist-s)"/>
                      <ellipse cx="160" cy="120" rx="21" ry="27" fill="url(#alglist-p2-g)" filter="url(#alglist-s)"/>
                      {/* Shield */}
                      <path d="M130 136 L157 149 L157 173 C157 187 143 195 130 200 C117 195 103 187 103 173 L103 149 Z" fill="url(#alglist-shield-g)" filter="url(#alglist-shield-s)" stroke="#F5A623" strokeWidth="1.8"/>
                      {/* Check in shield */}
                      <path d="M121 170 L127 177 L141 161" stroke="#F5A623" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
                      {/* Heart above */}
                      <path d="M124 40 C124 34 130 31 133 36 C136 31 142 34 142 40 C142 48 133 53 133 53 C133 53 124 48 124 40Z" fill="#F48FB1" opacity="0.55"/>
                      <circle cx="54" cy="100" r="3.5" fill="#FFCC80" opacity="0.38"/>
                      <circle cx="211" cy="94" r="4" fill="#FFE0B2" opacity="0.38"/>
                      <circle cx="42" cy="165" r="2.5" fill="#F5A623" opacity="0.25"/>
                    </svg>
                  </div>
                </div>
              )}

              {/* ─── allergen sub-pages ─── */}
              {settingsDetailView?.startsWith('allergen-') && settingsDetailView !== 'allergen-list' && (() => {
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
                          <linearGradient id="algsub-shield-g" x1="75" y1="25" x2="185" y2="182" gradientUnits="userSpaceOnUse"><stop stopColor="#FFF8E1"/><stop offset="1" stopColor="#FFE0B2"/></linearGradient>
                          <linearGradient id="algsub-inner-g" x1="90" y1="45" x2="170" y2="164" gradientUnits="userSpaceOnUse"><stop stopColor="#FFE0B2"/><stop offset="1" stopColor="#FFCA28"/></linearGradient>
                          <linearGradient id="algsub-heart-g" x1="115" y1="78" x2="145" y2="122" gradientUnits="userSpaceOnUse"><stop stopColor="#FF6B6B"/><stop offset="1" stopColor="#C62828"/></linearGradient>
                          <filter id="algsub-s"><feDropShadow dx="0" dy="6" stdDeviation="10" floodOpacity="0.15"/></filter>
                        </defs>
                        {/* Outer shield */}
                        <path d="M130 22 L187 54 L187 117 C187 148 156 173 130 183 C104 173 73 148 73 117 L73 54 Z" fill="url(#algsub-shield-g)" filter="url(#algsub-s)" stroke="#F5A623" strokeWidth="2"/>
                        {/* Inner shield */}
                        <path d="M130 42 L172 66 L172 113 C172 137 152 158 130 165 C108 158 88 137 88 113 L88 66 Z" fill="url(#algsub-inner-g)"/>
                        {/* Heart */}
                        <path d="M114 96 C114 82 124 78 130 86 C136 78 146 82 146 96 C146 114 130 122 130 122 C130 122 114 114 114 96Z" fill="url(#algsub-heart-g)" opacity="0.88"/>
                        {/* Checkmark */}
                        <path d="M120 98 L128 108 L143 88" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"/>
                        {/* Sparkles */}
                        <circle cx="48" cy="100" r="4" fill="#FFE0B2" opacity="0.5"/>
                        <circle cx="214" cy="96" r="5" fill="#F5A623" opacity="0.3"/>
                        <circle cx="60" cy="165" r="3" fill="#FFCA28" opacity="0.35"/>
                        <circle cx="202" cy="168" r="3" fill="#FFE0B2" opacity="0.4"/>
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
                        <linearGradient id="export-doc-g" x1="80" y1="28" x2="180" y2="152" gradientUnits="userSpaceOnUse"><stop stopColor="#EDE7F6"/><stop offset="1" stopColor="#E8EAF6"/></linearGradient>
                        <linearGradient id="export-btn-g" x1="108" y1="138" x2="152" y2="183" gradientUnits="userSpaceOnUse"><stop stopColor="#7986CB"/><stop offset="1" stopColor="#5C6BC0"/></linearGradient>
                        <filter id="export-doc-s"><feDropShadow dx="0" dy="4" stdDeviation="7" floodOpacity="0.12"/></filter>
                        <filter id="export-btn-s"><feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.2"/></filter>
                      </defs>
                      {/* Document */}
                      <rect x="80" y="28" width="100" height="120" rx="14" fill="url(#export-doc-g)" filter="url(#export-doc-s)" stroke="#9FA8DA" strokeWidth="1.5"/>
                      {/* Dog-ear fold */}
                      <path d="M158 28 L180 50 L158 50 Z" fill="#C5CAE9" opacity="0.5"/>
                      {/* Text lines */}
                      <rect x="95" y="56" width="72" height="7" rx="3.5" fill="#9FA8DA" opacity="0.7"/>
                      <rect x="95" y="70" width="52" height="6" rx="3" fill="#C5CAE9"/>
                      <rect x="95" y="83" width="62" height="6" rx="3" fill="#C5CAE9"/>
                      <rect x="95" y="96" width="42" height="6" rx="3" fill="#C5CAE9"/>
                      <rect x="95" y="109" width="55" height="6" rx="3" fill="#C5CAE9" opacity="0.6"/>
                      {/* Download circle button */}
                      <circle cx="130" cy="162" r="24" fill="url(#export-btn-g)" filter="url(#export-btn-s)"/>
                      {/* Arrow */}
                      <line x1="130" y1="150" x2="130" y2="171" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                      <path d="M121 164 L130 173 L139 164" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                      {/* Sparkles */}
                      <circle cx="54" cy="50" r="4.5" fill="#FFD54F" opacity="0.45"/>
                      <circle cx="207" cy="44" r="3.5" fill="#9FA8DA" opacity="0.4"/>
                      <circle cx="58" cy="152" r="3" fill="#C5CAE9" opacity="0.4"/>
                      <circle cx="205" cy="158" r="3" fill="#7986CB" opacity="0.3"/>
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
                        <linearGradient id="del-tri-g" x1="50" y1="30" x2="210" y2="165" gradientUnits="userSpaceOnUse"><stop stopColor="#FFEBEE"/><stop offset="1" stopColor="#FFCDD2"/></linearGradient>
                        <linearGradient id="del-inner-g" x1="70" y1="55" x2="190" y2="155" gradientUnits="userSpaceOnUse"><stop stopColor="#FFCDD2"/><stop offset="1" stopColor="#EF9A9A"/></linearGradient>
                        <filter id="del-s"><feDropShadow dx="0" dy="5" stdDeviation="8" floodOpacity="0.14"/></filter>
                      </defs>
                      {/* Outer triangle */}
                      <path d="M130 28 L215 165 L45 165 Z" fill="url(#del-tri-g)" filter="url(#del-s)" stroke="#EF5350" strokeWidth="2.2"/>
                      {/* Inner fill triangle */}
                      <path d="M130 52 L196 152 L64 152 Z" fill="url(#del-inner-g)"/>
                      {/* Exclamation bar */}
                      <rect x="126.5" y="80" width="7" height="42" rx="3.5" fill="#EF5350"/>
                      {/* Exclamation dot */}
                      <circle cx="130" cy="135" r="5" fill="#EF5350"/>
                      {/* Small orbiting triangles */}
                      <path d="M42 52 L50 40 L58 52 Z" fill="#FFCDD2" opacity="0.5" stroke="#EF5350" strokeWidth="1"/>
                      <path d="M202 45 L209 34 L216 45 Z" fill="#FFCDD2" opacity="0.4" stroke="#EF5350" strokeWidth="0.8"/>
                      <circle cx="44" cy="175" r="3" fill="#FFCDD2" opacity="0.4"/>
                      <circle cx="218" cy="174" r="3" fill="#EF9A9A" opacity="0.4"/>
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
              {/* ─── Kredit- og debitkort ─── */}
              <div className="pt-2">
                <p className="text-[16px] font-bold text-foreground px-1 pb-2">Kredit- og debitkort</p>
                <div className="divide-y divide-border">
                  <button
                    onClick={() => setSettingsDetailView('payment-add-card')}
                    className="flex w-full items-center gap-3 py-3.5 px-1 text-left transition-colors hover:bg-card"
                  >
                    <span className="text-[20px] text-muted-foreground">+</span>
                    <p className="text-[15px] font-medium text-foreground">Tilføj nyt kort</p>
                  </button>
                </div>
              </div>

              <div className="border-t border-border mt-2" />

              {/* ─── Andre betalingsmetoder ─── */}
              <div className="pt-3">
                <p className="text-[16px] font-bold text-foreground px-1 pb-2">Andre betalingsmetoder</p>
                <div className="divide-y divide-border">
                  <button
                    onClick={() => setSettingsDetailView('payment-mobilepay')}
                    className="flex w-full items-center justify-between py-3.5 px-1 text-left transition-colors hover:bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] bg-[#5A78FF]">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="4" y="3" width="12" height="14" rx="2" fill="white"/><path d="M7 8 L10 12 L13 7" stroke="#5A78FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      <p className="text-[15px] font-medium text-foreground">MobilePay</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                  <button
                    onClick={() => setSettingsDetailView('payment-applepay')}
                    className="flex w-full items-center justify-between py-3.5 px-1 text-left transition-colors hover:bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] border border-border bg-white">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M14.5 5.5C13.8 4.7 12.8 4.3 11.9 4.3C10.6 4.3 10 5 9.2 5C8.4 5 7.6 4.3 6.5 4.3C5.5 4.3 4.4 4.9 3.7 5.9C2.6 7.5 2.8 10.5 4.5 13.2C5.1 14.2 5.9 15.3 7 15.3C8 15.3 8.3 14.7 9.5 14.7C10.7 14.7 10.9 15.3 12 15.3C13.1 15.3 13.9 14.1 14.5 13.1C14.9 12.4 15 12.1 15.3 11.3C13.2 10.5 12.9 7.5 14.5 5.5Z" fill="black"/></svg>
                      </div>
                      <p className="text-[15px] font-medium text-foreground">Apple Pay</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                  <button
                    onClick={() => setSettingsDetailView('payment-paypal')}
                    className="flex w-full items-center justify-between py-3.5 px-1 text-left transition-colors hover:bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] border border-border bg-white">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M7.5 16.5L8.2 12.5H10.5C13.5 12.5 15.5 10.5 16 7.5C16.3 5.5 15 4 12.5 4H8L5.5 16.5H7.5Z" fill="#003087"/><path d="M8.5 14L9 11H11C13.5 11 15 9.5 15.3 7C15.5 5.5 14.5 4.5 12.5 4.5H9L7 14H8.5Z" fill="#009CDE"/></svg>
                      </div>
                      <p className="text-[15px] font-medium text-foreground">PayPal</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                </div>
              </div>

              <div className="border-t border-border mt-2" />

              {/* ─── Gavekort, Kreditter, Indløs kode ─── */}
              <div className="divide-y divide-border pt-2">
                <button
                  onClick={() => setSettingsDetailView('payment-giftcard')}
                  className="flex w-full items-center justify-between py-3.5 px-1 text-left transition-colors hover:bg-card"
                >
                  <div>
                    <p className="text-[15px] font-medium text-foreground">Gavekort</p>
                    <p className="text-[13px] text-muted-foreground">Giv en gave til en ven eller familiemedlem</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                </button>
                <button
                  onClick={() => setSettingsDetailView('payment-credits')}
                  className="flex w-full items-center justify-between py-3.5 px-1 text-left transition-colors hover:bg-card"
                >
                  <div>
                    <p className="text-[15px] font-medium text-foreground">Kreditter</p>
                    <p className="text-[13px] text-muted-foreground">Optjen kreditter ved at invitere venner</p>
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
                  <div>
                    <p className="text-[15px] font-medium text-foreground">Indløs kode</p>
                    <p className="text-[13px] text-muted-foreground">Indløs gavekort eller kampagnekode</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                </button>
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
                        <linearGradient id="gift-card-g" x1="50" y1="48" x2="210" y2="152" gradientUnits="userSpaceOnUse"><stop stopColor="#FFF9F0"/><stop offset="1" stopColor="#FFE0B2"/></linearGradient>
                        <linearGradient id="gift-header-g" x1="50" y1="48" x2="210" y2="88" gradientUnits="userSpaceOnUse"><stop stopColor="#FFE0B2"/><stop offset="1" stopColor="#FFCC80"/></linearGradient>
                        <linearGradient id="gift-ribbon-g" x1="130" y1="48" x2="130" y2="152" gradientUnits="userSpaceOnUse"><stop stopColor="#EF5350"/><stop offset="1" stopColor="#B71C1C"/></linearGradient>
                        <linearGradient id="gift-bow-g" x1="112" y1="78" x2="148" y2="102" gradientUnits="userSpaceOnUse"><stop stopColor="#EF5350"/><stop offset="1" stopColor="#C62828"/></linearGradient>
                        <filter id="gift-s"><feDropShadow dx="0" dy="5" stdDeviation="8" floodOpacity="0.14"/></filter>
                        <filter id="gift-bow-s"><feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.2"/></filter>
                      </defs>
                      {/* Card */}
                      <rect x="50" y="48" width="160" height="104" rx="18" fill="url(#gift-card-g)" filter="url(#gift-s)" stroke="#F5A623" strokeWidth="1.5"/>
                      {/* Card header band */}
                      <rect x="50" y="48" width="160" height="36" rx="18" fill="url(#gift-header-g)"/>
                      <rect x="50" y="67" width="160" height="17" fill="url(#gift-header-g)"/>
                      {/* Vertical ribbon */}
                      <rect x="122" y="48" width="16" height="104" fill="url(#gift-ribbon-g)" opacity="0.72"/>
                      {/* Horizontal ribbon */}
                      <rect x="50" y="89" width="160" height="15" fill="url(#gift-ribbon-g)" opacity="0.72"/>
                      {/* Bow loops */}
                      <ellipse cx="119" cy="87" rx="19" ry="13" fill="url(#gift-bow-g)" filter="url(#gift-bow-s)"/>
                      <ellipse cx="141" cy="87" rx="19" ry="13" fill="url(#gift-bow-g)" filter="url(#gift-bow-s)"/>
                      {/* Bow center knot */}
                      <circle cx="130" cy="88" r="7" fill="#B71C1C"/>
                      <circle cx="130" cy="88" r="4" fill="#EF5350"/>
                      {/* Heart on card */}
                      <path d="M82 118 C82 112 87 110 90 113 C93 110 98 112 98 118 C98 126 90 131 90 131 C90 131 82 126 82 118Z" fill="#F48FB1" opacity="0.6"/>
                      {/* Sparkles */}
                      <circle cx="34" cy="38" r="4.5" fill="#FFD54F" opacity="0.5"/>
                      <circle cx="230" cy="34" r="3.5" fill="#F5A623" opacity="0.4"/>
                      <circle cx="38" cy="167" r="3.5" fill="#EF5350" opacity="0.3"/>
                      <circle cx="226" cy="170" r="4" fill="#FFD54F" opacity="0.38"/>
                      <path d="M44 72 L50 66 L56 72 L50 78Z" fill="#FFD54F" opacity="0.4"/>
                      <path d="M208 60 L214 54 L220 60 L214 66Z" fill="#F48FB1" opacity="0.38"/>
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
                        <radialGradient id="cred-coin-g" cx="38%" cy="35%" r="65%" gradientUnits="objectBoundingBox"><stop stopColor="#FFF9C4"/><stop offset="1" stopColor="#FFD54F"/></radialGradient>
                        <radialGradient id="cred-coin2-g" cx="38%" cy="35%" r="65%" gradientUnits="objectBoundingBox"><stop stopColor="#FFECB3"/><stop offset="1" stopColor="#FFE082"/></radialGradient>
                        <filter id="cred-coin-s"><feDropShadow dx="0" dy="4" stdDeviation="7" floodOpacity="0.16"/></filter>
                        <filter id="cred-sm-s"><feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.12"/></filter>
                      </defs>
                      {/* Large centre coin */}
                      <circle cx="130" cy="96" r="42" fill="url(#cred-coin-g)" filter="url(#cred-coin-s)" stroke="#F9A825" strokeWidth="2"/>
                      <circle cx="130" cy="96" r="32" stroke="#FFB300" strokeWidth="1.5" fill="none"/>
                      <text x="130" y="103" textAnchor="middle" fontSize="24" fontWeight="bold" fill="#F57F17">kr</text>
                      {/* Small coin top-left */}
                      <circle cx="64" cy="60" r="20" fill="url(#cred-coin2-g)" filter="url(#cred-sm-s)" stroke="#FFB300" strokeWidth="1.5"/>
                      <circle cx="64" cy="60" r="13" stroke="#FFB300" strokeWidth="1" fill="none"/>
                      {/* Small coin top-right */}
                      <circle cx="200" cy="55" r="17" fill="url(#cred-coin2-g)" filter="url(#cred-sm-s)" stroke="#FFB300" strokeWidth="1.5"/>
                      <circle cx="200" cy="55" r="11" stroke="#FFB300" strokeWidth="1" fill="none"/>
                      {/* Small coins bottom */}
                      <circle cx="186" cy="142" r="13" fill="url(#cred-coin2-g)" filter="url(#cred-sm-s)" stroke="#FFB300" strokeWidth="1"/>
                      <circle cx="74" cy="147" r="11" fill="url(#cred-coin2-g)" filter="url(#cred-sm-s)" stroke="#FFB300" strokeWidth="1"/>
                      {/* Star shapes */}
                      <path d="M44 100 L47.5 91 L51 100 L44 95.5 L51 95.5Z" fill="#66BB6A" opacity="0.65"/>
                      <path d="M214 100 L217.5 91 L221 100 L214 95.5 L221 95.5Z" fill="#66BB6A" opacity="0.65"/>
                      <path d="M99 29 L103 20 L107 29 L99 24.5 L107 24.5Z" fill="#FFD54F" opacity="0.55"/>
                      <path d="M159 24 L163 15 L167 24 L159 19.5 L167 19.5Z" fill="#FFD54F" opacity="0.55"/>
                      {/* Sparkle dots */}
                      <circle cx="40" cy="171" r="3.5" fill="#66BB6A" opacity="0.4"/>
                      <circle cx="225" cy="169" r="3.5" fill="#FFD54F" opacity="0.38"/>
                      <circle cx="130" cy="176" r="2.5" fill="#FFB300" opacity="0.3"/>
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
                        <linearGradient id="redeem-ticket-g" x1="40" y1="52" x2="220" y2="148" gradientUnits="userSpaceOnUse"><stop stopColor="#EDE7F6"/><stop offset="1" stopColor="#D1C4E9"/></linearGradient>
                        <linearGradient id="redeem-bar-g" x1="85" y1="68" x2="175" y2="92" gradientUnits="userSpaceOnUse"><stop stopColor="#CE93D8"/><stop offset="1" stopColor="#AB47BC"/></linearGradient>
                        <filter id="redeem-s"><feDropShadow dx="0" dy="5" stdDeviation="8" floodOpacity="0.13"/></filter>
                      </defs>
                      {/* Ticket body */}
                      <rect x="40" y="52" width="180" height="96" rx="16" fill="url(#redeem-ticket-g)" filter="url(#redeem-s)" stroke="#9575CD" strokeWidth="1.8"/>
                      {/* Notch left */}
                      <circle cx="40" cy="100" r="13" fill="white" stroke="#9575CD" strokeWidth="1.8"/>
                      {/* Notch right */}
                      <circle cx="220" cy="100" r="13" fill="white" stroke="#9575CD" strokeWidth="1.8"/>
                      {/* Dashed divider */}
                      <line x1="76" y1="100" x2="184" y2="100" stroke="#B39DDB" strokeWidth="1.5" strokeDasharray="6 4"/>
                      {/* Code bar top */}
                      <rect x="82" y="65" width="96" height="22" rx="8" fill="url(#redeem-bar-g)" opacity="0.8"/>
                      <rect x="90" y="71" width="80" height="9" rx="4" fill="white" opacity="0.3"/>
                      {/* Bottom text placeholder */}
                      <rect x="92" y="110" width="76" height="14" rx="5" fill="#B39DDB" opacity="0.6"/>
                      {/* Star sparkle top-left */}
                      <path d="M51 37 L54.5 27 L58 37 L51 32.5 L58 32.5Z" fill="#FFD54F"/>
                      <circle cx="54.5" cy="32" r="3" fill="#FFF9C4"/>
                      {/* Star sparkle top-right */}
                      <path d="M200 28 L204 18 L208 28 L200 23.5 L208 23.5Z" fill="#9575CD" opacity="0.55"/>
                      <circle cx="204" cy="23" r="2.5" fill="#CE93D8"/>
                      {/* Star centre top */}
                      <path d="M128 32 L132 23 L136 32 L128 27.5 L136 27.5Z" fill="#CE93D8" opacity="0.65"/>
                      {/* Bottom decorative */}
                      <path d="M33 160 L38 152 L43 160 L38 156Z" fill="#FFD54F" opacity="0.42"/>
                      <circle cx="226" cy="161" r="3.5" fill="#9575CD" opacity="0.3"/>
                      <circle cx="78" cy="166" r="2.8" fill="#B39DDB" opacity="0.4"/>
                      <circle cx="182" cy="170" r="2.5" fill="#FFD54F" opacity="0.4"/>
                    </svg>
                  </div>
                  <Button className="w-full shrink-0 rounded-[12px] py-3">
                    Indløs
                  </Button>
                </div>
              )}

              {/* ─── Tilføj kort (Wolt-stil) ─── */}
              {settingsDetailView === 'payment-add-card' && (
                <div className="min-h-[calc(100vh-280px)] flex flex-col" style={{ paddingBottom: keyboardHeight > 0 ? keyboardHeight : undefined }}>
                  <div className="space-y-5">
                    <h2 className="text-[28px] font-bold text-foreground pb-2">Tilføj kort</h2>
                    {/* Blue card visual */}
                    <div className="rounded-[16px] p-5 space-y-4" style={{ background: 'linear-gradient(135deg, #4FC3F7 0%, #29B6F6 50%, #039BE5 100%)' }}>
                      <div className="flex justify-end">
                        <span className="text-[11px] font-bold text-white/80 tracking-wider">KREDIT / DEBET</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[13px] font-semibold text-white">Kortnummer</p>
                        <Input placeholder="0000 0000 0000 0000" className="rounded-[8px] bg-white/95 border-0 px-4 py-3 text-[15px] tracking-[0.05em] placeholder:text-gray-400" inputMode="numeric" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <p className="text-[13px] font-semibold text-white">Udløbsdato</p>
                          <Input placeholder="MM/YY" className="rounded-[8px] bg-white/95 border-0 px-4 py-3 text-[15px] placeholder:text-gray-400" inputMode="numeric" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[13px] font-semibold text-white">Sikkerhedskode</p>
                          <Input placeholder="000" className="rounded-[8px] bg-white/95 border-0 px-4 py-3 text-[15px] placeholder:text-gray-400" inputMode="numeric" type="password" />
                        </div>
                      </div>
                    </div>
                    <p className="text-[13px] text-muted-foreground text-center px-4">
                      Du kan bruge dit debit- eller kreditkort (Visa/Dankort, Visa Electron, MasterCard, American Express) til at betale med Huska.
                    </p>
                  </div>
                  <div className="flex-1" />
                  <Button className="w-full shrink-0 rounded-[12px] py-3 mt-6">
                    Tilføj kort
                  </Button>
                </div>
              )}

              {/* ─── MobilePay ─── */}
              {settingsDetailView === 'payment-mobilepay' && (
                <div className="min-h-[calc(100vh-280px)] flex flex-col" style={{ paddingBottom: keyboardHeight > 0 ? keyboardHeight : undefined }}>
                  <div className="space-y-4">
                    <h2 className="text-[28px] font-bold text-foreground pb-2">MobilePay</h2>
                    <div className="rounded-[12px] bg-[#E8EAF6] p-4 space-y-2">
                      <p className="text-[14px] font-medium text-foreground">Betal med MobilePay</p>
                      <p className="text-[13px] text-muted-foreground">Tilknyt din MobilePay-konto for hurtig og nem betaling direkte fra appen.</p>
                    </div>
                    <Input placeholder="Telefonnummer" className="rounded-[12px] border-border bg-card px-4 py-3 text-[15px]" inputMode="tel" />
                  </div>
                  <div className="flex-1 flex items-center justify-center py-8">
                    <svg width="260" height="200" viewBox="0 0 260 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="85" y="25" width="90" height="150" rx="18" fill="#5A78FF" opacity="0.15"/>
                      <rect x="90" y="30" width="80" height="140" rx="16" fill="white" stroke="#5A78FF" strokeWidth="2"/>
                      <rect x="100" y="50" width="60" height="80" rx="4" fill="#EEF0FF"/>
                      <path d="M115 80 L125 95 L145 70" stroke="#5A78FF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <rect x="118" y="155" width="24" height="4" rx="2" fill="#5A78FF" opacity="0.3"/>
                      <circle cx="50" cy="80" r="6" fill="#5A78FF" opacity="0.15"/>
                      <circle cx="215" cy="75" r="5" fill="#5A78FF" opacity="0.1"/>
                    </svg>
                  </div>
                  <Button className="w-full shrink-0 rounded-[12px] py-3">
                    Tilknyt MobilePay
                  </Button>
                </div>
              )}

              {/* ─── Apple Pay ─── */}
              {settingsDetailView === 'payment-applepay' && (
                <div className="min-h-[calc(100vh-280px)] flex flex-col" style={{ paddingBottom: keyboardHeight > 0 ? keyboardHeight : undefined }}>
                  <div className="space-y-4">
                    <h2 className="text-[28px] font-bold text-foreground pb-2">Apple Pay</h2>
                    <div className="rounded-[12px] bg-muted/50 p-4 space-y-2">
                      <p className="text-[14px] font-medium text-foreground">Betal med Apple Pay</p>
                      <p className="text-[13px] text-muted-foreground">Brug Apple Pay til hurtig og sikker betaling med Face ID eller Touch ID.</p>
                    </div>
                  </div>
                  <div className="flex-1 flex items-center justify-center py-8">
                    <svg width="260" height="200" viewBox="0 0 260 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="60" y="50" width="140" height="90" rx="16" fill="#1D1D1F" />
                      <path d="M115 80C114 77 116 74 118 73C116 70 113 69 111 69C108 69 106 71 104 71C102 71 99 69 97 69C93 69 89 72 87 76C83 84 86 96 90 102C92 105 94 108 97 108C99 108 100 107 103 107C106 107 107 108 110 108C113 108 115 105 117 102C118 100 119 98 119 97C117 96 115 93 115 80Z" fill="white"/>
                      <path d="M112 66C113 64 114 62 114 60C114 59 113 58 112 57C110 57 108 58 106 60C105 62 104 64 104 66C104 67 105 67 106 67C108 68 110 67 112 66Z" fill="white"/>
                      <text x="140" y="102" fontSize="18" fontWeight="600" fill="white" fontFamily="system-ui">Pay</text>
                    </svg>
                  </div>
                  <Button className="w-full shrink-0 rounded-[12px] py-3 bg-black text-white hover:bg-gray-900">
                    Konfigurer Apple Pay
                  </Button>
                </div>
              )}

              {/* ─── PayPal ─── */}
              {settingsDetailView === 'payment-paypal' && (
                <div className="min-h-[calc(100vh-280px)] flex flex-col" style={{ paddingBottom: keyboardHeight > 0 ? keyboardHeight : undefined }}>
                  <div className="space-y-4">
                    <h2 className="text-[28px] font-bold text-foreground pb-2">PayPal</h2>
                    <div className="rounded-[12px] bg-[#FFF8E1] p-4 space-y-2">
                      <p className="text-[14px] font-medium text-foreground">Betal med PayPal</p>
                      <p className="text-[13px] text-muted-foreground">Log ind med din PayPal-konto for at tilknytte den som betalingsmetode.</p>
                    </div>
                  </div>
                  <div className="flex-1 flex items-center justify-center py-8">
                    <svg width="260" height="200" viewBox="0 0 260 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="60" y="45" width="140" height="100" rx="16" fill="#F5F7FA" stroke="#003087" strokeWidth="1.5"/>
                      <path d="M100 70H120C128 70 133 74 132 82C131 92 124 96 116 96H110L108 110H98L100 70Z" fill="#003087"/>
                      <path d="M105 75H122C128 75 132 78 131 85C130 93 124 96 118 96H113L111 107H103L105 75Z" fill="#009CDE"/>
                      <path d="M137 70H152C158 70 161 73 160 78C159 85 154 88 149 88H145L143 98H136L137 70Z" fill="#003087"/>
                      <path d="M140 73H153C157 73 159 76 158 80C157 85 153 87 150 87H147L145 95H139L140 73Z" fill="#009CDE"/>
                      <circle cx="50" cy="95" r="4" fill="#003087" opacity="0.1"/>
                      <circle cx="215" cy="90" r="5" fill="#009CDE" opacity="0.1"/>
                    </svg>
                  </div>
                  <Button className="w-full shrink-0 rounded-[12px] py-3" style={{ background: '#0070BA' }}>
                    Log ind med PayPal
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
