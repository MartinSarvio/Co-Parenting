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
                      {/* Ground shadow */}
                      <ellipse cx="130" cy="194" rx="52" ry="5" fill="#000" opacity="0.06"/>
                      {/* Sparkles */}
                      <motion.circle cx="210" cy="48" r="5" fill="#F5A623" opacity="0.15" animate={{ scale: [1, 1.5, 1], opacity: [0.15, 0.4, 0.15] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}/>
                      <motion.circle cx="48" cy="60" r="4" fill="#6CB4EE" opacity="0.15" animate={{ scale: [1, 1.5, 1], opacity: [0.15, 0.4, 0.15] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 1.1 }}/>
                      <motion.circle cx="225" cy="140" r="3" fill="#FF8A80" opacity="0.15" animate={{ scale: [1, 1.5, 1], opacity: [0.15, 0.4, 0.15] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}/>
                      {/* Floating name badge */}
                      <motion.g animate={{ y: [0, -5, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}>
                        <rect x="155" y="50" width="72" height="52" rx="8" fill="white" stroke="#E0E0E0" strokeWidth="1.5"/>
                        <rect x="155" y="50" width="72" height="18" rx="8" fill="#6CB4EE"/>
                        <rect x="155" y="60" width="72" height="8" fill="#6CB4EE"/>
                        <circle cx="175" cy="86" r="10" fill="#F0C4A8"/>
                        <rect x="190" y="81" width="28" height="5" rx="2.5" fill="#BDBDBD"/>
                        <rect x="190" y="91" width="20" height="4" rx="2" fill="#E0E0E0"/>
                        <rect x="168" y="58" width="22" height="4" rx="2" fill="white" opacity="0.7"/>
                      </motion.g>
                      {/* Girl character — body sway */}
                      <motion.g animate={{ y: [0, -1.5, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}>
                        {/* Legs */}
                        <path d="M112 168 Q110 185 108 194" stroke="#4A3728" strokeWidth="7" strokeLinecap="round" fill="none"/>
                        <path d="M126 168 Q128 185 130 194" stroke="#4A3728" strokeWidth="7" strokeLinecap="round" fill="none"/>
                        {/* Shoes */}
                        <ellipse cx="107" cy="194" rx="9" ry="4" fill="#1A1A2E"/>
                        <ellipse cx="131" cy="194" rx="9" ry="4" fill="#1A1A2E"/>
                        <ellipse cx="104" cy="193" rx="4" ry="2" fill="#2C2C2C" opacity="0.4"/>
                        <ellipse cx="128" cy="193" rx="4" ry="2" fill="#2C2C2C" opacity="0.4"/>
                        {/* Body — coral shirt */}
                        <path d="M100 140 C98 130 97 118 100 110 L139 110 C142 118 141 130 139 140 Z" fill="#FF8A80"/>
                        {/* Blue cardigan */}
                        <path d="M100 140 C98 130 97 118 100 112 C104 110 110 109 112 110 L119 130 L126 110 C128 109 134 110 138 112 C141 118 140 130 139 140 Z" fill="#6CB4EE"/>
                        {/* White collar V */}
                        <path d="M112 110 L119 125 L126 110" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                        {/* Cardigan buttons */}
                        <circle cx="114" cy="116" r="2" fill="white" opacity="0.8"/>
                        <circle cx="113" cy="124" r="2" fill="white" opacity="0.8"/>
                        <circle cx="112" cy="132" r="2" fill="white" opacity="0.8"/>
                        {/* Left arm relaxed */}
                        <path d="M100 115 C94 120 90 130 91 140" stroke="#6CB4EE" strokeWidth="9" strokeLinecap="round" fill="none"/>
                        <path d="M91 140 C89 144 88 148 91 150" stroke="#F0C4A8" strokeWidth="7" strokeLinecap="round" fill="none"/>
                        {/* Left hand fingers */}
                        <path d="M89 149 L86 155" stroke="#F0C4A8" strokeWidth="2.5" strokeLinecap="round"/>
                        <path d="M91 151 L89 157" stroke="#F0C4A8" strokeWidth="2.5" strokeLinecap="round"/>
                        <path d="M93 151 L92 157" stroke="#F0C4A8" strokeWidth="2.5" strokeLinecap="round"/>
                        {/* Right arm reaching forward */}
                        <path d="M139 115 C145 118 150 125 152 135" stroke="#6CB4EE" strokeWidth="9" strokeLinecap="round" fill="none"/>
                        <path d="M152 135 C154 140 153 145 150 147" stroke="#F0C4A8" strokeWidth="7" strokeLinecap="round" fill="none"/>
                        {/* Right hand fingers pointing */}
                        <path d="M151 145 L155 150" stroke="#F0C4A8" strokeWidth="2.5" strokeLinecap="round"/>
                        <path d="M149 147 L152 153" stroke="#F0C4A8" strokeWidth="2.5" strokeLinecap="round"/>
                        <path d="M147 148 L149 154" stroke="#F0C4A8" strokeWidth="2.5" strokeLinecap="round"/>
                        {/* Neck */}
                        <rect x="115" y="100" width="9" height="12" rx="4" fill="#E8B898"/>
                        {/* Head */}
                        <ellipse cx="119" cy="88" rx="22" ry="23" fill="#F0C4A8"/>
                        {/* Ears */}
                        <ellipse cx="97" cy="89" rx="4" ry="5" fill="#E8B898"/>
                        <ellipse cx="97" cy="89" rx="2" ry="3" fill="#DDA68A"/>
                        <ellipse cx="141" cy="89" rx="4" ry="5" fill="#E8B898"/>
                        <ellipse cx="141" cy="89" rx="2" ry="3" fill="#DDA68A"/>
                        {/* Braided hair — dark */}
                        <path d="M97 78 C96 65 100 55 119 55 C138 55 142 65 141 78" fill="#1A1A2E"/>
                        <path d="M97 80 C90 85 88 95 89 105 C87 108 86 115 88 120 Q92 118 94 115 C93 108 94 100 96 95 C96 87 97 80 97 80Z" fill="#1A1A2E"/>
                        <path d="M141 80 C148 85 150 95 149 105 C151 108 152 115 150 120 Q146 118 144 115 C145 108 144 100 142 95 C142 87 141 80 141 80Z" fill="#1A1A2E"/>
                        {/* Braid texture left */}
                        <path d="M90 92 Q93 90 90 88" stroke="#2C2C2C" strokeWidth="1" fill="none"/>
                        <path d="M90 98 Q93 96 90 94" stroke="#2C2C2C" strokeWidth="1" fill="none"/>
                        <path d="M90 104 Q93 102 90 100" stroke="#2C2C2C" strokeWidth="1" fill="none"/>
                        {/* Braid texture right */}
                        <path d="M148 92 Q145 90 148 88" stroke="#2C2C2C" strokeWidth="1" fill="none"/>
                        <path d="M148 98 Q145 96 148 94" stroke="#2C2C2C" strokeWidth="1" fill="none"/>
                        <path d="M148 104 Q145 102 148 100" stroke="#2C2C2C" strokeWidth="1" fill="none"/>
                        {/* Pink hair ties */}
                        <ellipse cx="89" cy="117" rx="4" ry="3" fill="#FF8A80"/>
                        <ellipse cx="149" cy="117" rx="4" ry="3" fill="#FF8A80"/>
                        {/* Glasses — red round */}
                        <circle cx="111" cy="89" r="8" fill="none" stroke="#C0392B" strokeWidth="2"/>
                        <circle cx="127" cy="89" r="8" fill="none" stroke="#C0392B" strokeWidth="2"/>
                        <path d="M119 89 L119 89" stroke="#C0392B" strokeWidth="2" strokeLinecap="round"/>
                        <line x1="103" y1="88" x2="100" y2="87" stroke="#C0392B" strokeWidth="1.5"/>
                        <line x1="135" y1="88" x2="138" y2="87" stroke="#C0392B" strokeWidth="1.5"/>
                        {/* Eyebrows */}
                        <path d="M105 82 Q111 79 117 82" stroke="#1A1A2E" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                        <path d="M121 82 Q127 79 133 82" stroke="#1A1A2E" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                        {/* Eyes */}
                        <ellipse cx="111" cy="89" rx="5" ry="5" fill="white"/>
                        <motion.ellipse cx="111" cy="89" rx="3" ry="3" fill="#1A1A2E" animate={{ scaleY: [1, 0.05, 1] }} transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 3.5, ease: "easeInOut" }} style={{ originX: "111px", originY: "89px" }}/>
                        <ellipse cx="127" cy="89" rx="5" ry="5" fill="white"/>
                        <motion.ellipse cx="127" cy="89" rx="3" ry="3" fill="#1A1A2E" animate={{ scaleY: [1, 0.05, 1] }} transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 3.5, ease: "easeInOut" }} style={{ originX: "127px", originY: "89px" }}/>
                        {/* Nose */}
                        <path d="M118 93 Q119 96 120 93" stroke="#DDA68A" strokeWidth="1" fill="none" strokeLinecap="round"/>
                        {/* Mouth */}
                        <path d="M113 99 Q119 104 125 99" stroke="#C07060" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                        {/* Cheek blush */}
                        <ellipse cx="106" cy="96" rx="6" ry="3.5" fill="#FFB4A2" opacity="0.3"/>
                        <ellipse cx="132" cy="96" rx="6" ry="3.5" fill="#FFB4A2" opacity="0.3"/>
                      </motion.g>
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
                      {/* Ground shadow */}
                      <ellipse cx="130" cy="194" rx="52" ry="5" fill="#000" opacity="0.06"/>
                      {/* Sparkles */}
                      <motion.circle cx="52" cy="45" r="5" fill="#A5D6A7" opacity="0.15" animate={{ scale: [1, 1.5, 1], opacity: [0.15, 0.4, 0.15] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}/>
                      <motion.circle cx="220" cy="80" r="4" fill="#6CB4EE" opacity="0.15" animate={{ scale: [1, 1.5, 1], opacity: [0.15, 0.4, 0.15] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}/>
                      <motion.circle cx="210" cy="160" r="3" fill="#FFE082" opacity="0.15" animate={{ scale: [1, 1.5, 1], opacity: [0.15, 0.4, 0.15] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 1.4 }}/>
                      {/* Floating envelope upper right */}
                      <motion.g animate={{ y: [0, -5, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}>
                        <rect x="168" y="38" width="60" height="42" rx="7" fill="white" stroke="#A5D6A7" strokeWidth="1.5"/>
                        <path d="M168 45 L198 62 L228 45" stroke="#A5D6A7" strokeWidth="1.5" fill="none"/>
                        <path d="M168 80 L188 62" stroke="#A5D6A7" strokeWidth="1" fill="none"/>
                        <path d="M228 80 L208 62" stroke="#A5D6A7" strokeWidth="1" fill="none"/>
                        <path d="M188 55 L192 51 L196 55 L196 59 L188 59 Z" fill="#A5D6A7" opacity="0.5"/>
                      </motion.g>
                      {/* Laptop surface */}
                      <rect x="78" y="158" width="84" height="6" rx="3" fill="#BDBDBD"/>
                      <rect x="72" y="163" width="96" height="4" rx="2" fill="#9E9E9E"/>
                      {/* Laptop screen */}
                      <rect x="80" y="118" width="80" height="42" rx="5" fill="#1A1A2E"/>
                      <rect x="84" y="121" width="72" height="36" rx="3" fill="#1E3A5F"/>
                      <rect x="88" y="125" width="64" height="28" rx="2" fill="#0D2137"/>
                      <ellipse cx="120" cy="139" rx="20" ry="8" fill="#6CB4EE" opacity="0.2"/>
                      <rect x="95" y="131" width="35" height="3" rx="1.5" fill="#6CB4EE" opacity="0.5"/>
                      <rect x="95" y="137" width="25" height="3" rx="1.5" fill="#6CB4EE" opacity="0.3"/>
                      {/* Boy character — body sway */}
                      <motion.g animate={{ y: [0, -1.5, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}>
                        {/* Legs */}
                        <path d="M110 168 Q108 180 107 192" stroke="#4A3728" strokeWidth="7" strokeLinecap="round" fill="none"/>
                        <path d="M126 168 Q128 180 129 192" stroke="#4A3728" strokeWidth="7" strokeLinecap="round" fill="none"/>
                        {/* Shoes */}
                        <ellipse cx="106" cy="193" rx="9" ry="4" fill="#1A1A2E"/>
                        <ellipse cx="130" cy="193" rx="9" ry="4" fill="#1A1A2E"/>
                        <ellipse cx="103" cy="192" rx="4" ry="2" fill="#2C2C2C" opacity="0.4"/>
                        <ellipse cx="127" cy="192" rx="4" ry="2" fill="#2C2C2C" opacity="0.4"/>
                        {/* Body — green sweater */}
                        <path d="M98 140 C96 130 96 118 99 110 L137 110 C140 118 140 130 138 140 Z" fill="#A5D6A7"/>
                        {/* Collar line */}
                        <path d="M110 110 Q118 115 126 110" stroke="#81C784" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                        {/* Left arm — resting on laptop */}
                        <path d="M98 115 C92 120 88 130 86 140 C84 147 84 153 86 158" stroke="#A5D6A7" strokeWidth="9" strokeLinecap="round" fill="none"/>
                        <path d="M86 158 C86 160 87 162 90 163" stroke="#F0C4A8" strokeWidth="7" strokeLinecap="round" fill="none"/>
                        {/* Left hand on laptop */}
                        <path d="M88 162 L85 168" stroke="#F0C4A8" strokeWidth="2.5" strokeLinecap="round"/>
                        <path d="M90 163 L88 169" stroke="#F0C4A8" strokeWidth="2.5" strokeLinecap="round"/>
                        <path d="M92 163 L91 169" stroke="#F0C4A8" strokeWidth="2.5" strokeLinecap="round"/>
                        {/* Right arm resting */}
                        <path d="M138 115 C144 122 148 132 148 142" stroke="#A5D6A7" strokeWidth="9" strokeLinecap="round" fill="none"/>
                        <path d="M148 142 C148 148 146 152 144 154" stroke="#F0C4A8" strokeWidth="7" strokeLinecap="round" fill="none"/>
                        {/* Right hand */}
                        <path d="M145 153 L148 158" stroke="#F0C4A8" strokeWidth="2.5" strokeLinecap="round"/>
                        <path d="M143 154 L145 160" stroke="#F0C4A8" strokeWidth="2.5" strokeLinecap="round"/>
                        <path d="M141 154 L142 160" stroke="#F0C4A8" strokeWidth="2.5" strokeLinecap="round"/>
                        {/* Neck */}
                        <rect x="113" y="100" width="10" height="12" rx="4" fill="#E8B898"/>
                        {/* Head */}
                        <ellipse cx="118" cy="88" rx="22" ry="23" fill="#F0C4A8"/>
                        {/* Ears */}
                        <ellipse cx="96" cy="89" rx="4" ry="5" fill="#E8B898"/>
                        <ellipse cx="96" cy="89" rx="2" ry="3" fill="#DDA68A"/>
                        <ellipse cx="140" cy="89" rx="4" ry="5" fill="#E8B898"/>
                        <ellipse cx="140" cy="89" rx="2" ry="3" fill="#DDA68A"/>
                        {/* Short dark hair */}
                        <path d="M96 80 C96 65 100 55 118 55 C136 55 140 65 140 80" fill="#1A1A2E"/>
                        <path d="M96 82 C94 78 94 72 96 68 C95 66 94 64 96 63 Q97 68 98 72" fill="#1A1A2E"/>
                        <path d="M140 82 C142 78 142 72 140 68 C141 66 142 64 140 63 Q139 68 138 72" fill="#1A1A2E"/>
                        <path d="M98 68 C100 60 108 56 118 55 C128 56 136 60 138 68" fill="#1A1A2E"/>
                        {/* Eyebrows */}
                        <path d="M107 82 Q113 79 119 82" stroke="#1A1A2E" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
                        <path d="M117 82 Q123 79 129 82" stroke="#1A1A2E" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
                        {/* Eyes */}
                        <ellipse cx="110" cy="89" rx="5.5" ry="5.5" fill="white"/>
                        <motion.ellipse cx="110" cy="89" rx="3" ry="3" fill="#1A1A2E" animate={{ scaleY: [1, 0.05, 1] }} transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 3.5, ease: "easeInOut" }} style={{ originX: "110px", originY: "89px" }}/>
                        <ellipse cx="126" cy="89" rx="5.5" ry="5.5" fill="white"/>
                        <motion.ellipse cx="126" cy="89" rx="3" ry="3" fill="#1A1A2E" animate={{ scaleY: [1, 0.05, 1] }} transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 3.5, ease: "easeInOut" }} style={{ originX: "126px", originY: "89px" }}/>
                        {/* Nose */}
                        <path d="M117 93 Q118 96 119 93" stroke="#DDA68A" strokeWidth="1" fill="none" strokeLinecap="round"/>
                        {/* Mouth */}
                        <path d="M112 99 Q118 104 124 99" stroke="#C07060" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                        {/* Cheek blush */}
                        <ellipse cx="105" cy="96" rx="6" ry="3.5" fill="#FFB4A2" opacity="0.3"/>
                        <ellipse cx="131" cy="96" rx="6" ry="3.5" fill="#FFB4A2" opacity="0.3"/>
                      </motion.g>
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
                      {/* Ground shadow */}
                      <ellipse cx="130" cy="194" rx="52" ry="5" fill="#000" opacity="0.06"/>
                      {/* Sparkles */}
                      <motion.circle cx="45" cy="55" r="5" fill="#FFE082" opacity="0.15" animate={{ scale: [1, 1.5, 1], opacity: [0.15, 0.4, 0.15] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}/>
                      <motion.circle cx="215" cy="50" r="4" fill="#6CB4EE" opacity="0.15" animate={{ scale: [1, 1.5, 1], opacity: [0.15, 0.4, 0.15] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.9 }}/>
                      <motion.circle cx="220" cy="150" r="3" fill="#FF8A80" opacity="0.15" animate={{ scale: [1, 1.5, 1], opacity: [0.15, 0.4, 0.15] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 1.6 }}/>
                      {/* Floating chat bubbles right side */}
                      <motion.g animate={{ y: [0, -5, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}>
                        <rect x="172" y="55" width="55" height="22" rx="11" fill="#FFE082" stroke="#F5D060" strokeWidth="1"/>
                        <path d="M172 70 L165 76 L176 70" fill="#FFE082"/>
                        <rect x="178" y="86" width="44" height="18" rx="9" fill="#6CB4EE" opacity="0.7"/>
                        <rect x="172" y="112" width="52" height="18" rx="9" fill="#FFE082" opacity="0.6"/>
                      </motion.g>
                      {/* Girl character — body sway */}
                      <motion.g animate={{ y: [0, -1.5, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}>
                        {/* Legs */}
                        <path d="M113 168 Q111 180 110 192" stroke="#4A3728" strokeWidth="7" strokeLinecap="round" fill="none"/>
                        <path d="M127 168 Q129 180 130 192" stroke="#4A3728" strokeWidth="7" strokeLinecap="round" fill="none"/>
                        {/* Shoes */}
                        <ellipse cx="109" cy="193" rx="9" ry="4" fill="#1A1A2E"/>
                        <ellipse cx="131" cy="193" rx="9" ry="4" fill="#1A1A2E"/>
                        <ellipse cx="106" cy="192" rx="4" ry="2" fill="#2C2C2C" opacity="0.4"/>
                        <ellipse cx="128" cy="192" rx="4" ry="2" fill="#2C2C2C" opacity="0.4"/>
                        {/* Body — yellow top */}
                        <path d="M101 140 C99 130 99 118 102 110 L138 110 C141 118 141 130 139 140 Z" fill="#FFE082"/>
                        {/* Phone held at chest */}
                        <rect x="110" y="120" width="20" height="34" rx="4" fill="#1A1A2E"/>
                        <rect x="112" y="123" width="16" height="27" rx="2" fill="#2A2A4A"/>
                        <rect x="116" y="121" width="8" height="2" rx="1" fill="#3A3A5A"/>
                        {/* Left arm holding phone */}
                        <path d="M101 115 C97 120 95 130 98 138" stroke="#FFE082" strokeWidth="9" strokeLinecap="round" fill="none"/>
                        <path d="M98 138 C99 142 105 145 110 144" stroke="#F0C4A8" strokeWidth="7" strokeLinecap="round" fill="none"/>
                        {/* Left hand gripping phone left side */}
                        <path d="M109 142 L106 148" stroke="#F0C4A8" strokeWidth="2.5" strokeLinecap="round"/>
                        <path d="M110 144 L108 150" stroke="#F0C4A8" strokeWidth="2.5" strokeLinecap="round"/>
                        <path d="M111 145 L110 151" stroke="#F0C4A8" strokeWidth="2.5" strokeLinecap="round"/>
                        {/* Right arm holding phone */}
                        <path d="M138 115 C142 120 143 130 142 138" stroke="#FFE082" strokeWidth="9" strokeLinecap="round" fill="none"/>
                        <path d="M142 138 C141 142 136 145 131 144" stroke="#F0C4A8" strokeWidth="7" strokeLinecap="round" fill="none"/>
                        {/* Right hand gripping phone right side */}
                        <path d="M131 142 L134 148" stroke="#F0C4A8" strokeWidth="2.5" strokeLinecap="round"/>
                        <path d="M130 144 L132 150" stroke="#F0C4A8" strokeWidth="2.5" strokeLinecap="round"/>
                        <path d="M129 145 L130 151" stroke="#F0C4A8" strokeWidth="2.5" strokeLinecap="round"/>
                        {/* Neck */}
                        <rect x="115" y="100" width="10" height="12" rx="4" fill="#E8B898"/>
                        {/* Head */}
                        <ellipse cx="120" cy="88" rx="22" ry="23" fill="#F0C4A8"/>
                        {/* Ears */}
                        <ellipse cx="98" cy="89" rx="4" ry="5" fill="#E8B898"/>
                        <ellipse cx="98" cy="89" rx="2" ry="3" fill="#DDA68A"/>
                        <ellipse cx="142" cy="89" rx="4" ry="5" fill="#E8B898"/>
                        <ellipse cx="142" cy="89" rx="2" ry="3" fill="#DDA68A"/>
                        {/* Ponytail */}
                        <path d="M138 68 C148 62 155 65 158 72 C162 80 158 90 152 94 C148 96 144 94 142 90 C146 88 148 82 146 76 C144 70 140 68 138 68Z" fill="#1A1A2E"/>
                        <path d="M140 90 C140 98 136 108 130 114" stroke="#1A1A2E" strokeWidth="5" strokeLinecap="round" fill="none"/>
                        {/* Hair */}
                        <path d="M98 80 C98 65 102 55 120 55 C138 55 142 65 140 78" fill="#1A1A2E"/>
                        {/* Ponytail tie */}
                        <ellipse cx="140" cy="72" rx="4" ry="5" fill="#FF8A80"/>
                        {/* Eyebrows */}
                        <path d="M109 82 Q115 79 121 82" stroke="#1A1A2E" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
                        <path d="M119 82 Q125 79 131 82" stroke="#1A1A2E" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
                        {/* Eyes */}
                        <ellipse cx="112" cy="89" rx="5.5" ry="5.5" fill="white"/>
                        <motion.ellipse cx="112" cy="89" rx="3" ry="3" fill="#1A1A2E" animate={{ scaleY: [1, 0.05, 1] }} transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 3.5, ease: "easeInOut" }} style={{ originX: "112px", originY: "89px" }}/>
                        <ellipse cx="128" cy="89" rx="5.5" ry="5.5" fill="white"/>
                        <motion.ellipse cx="128" cy="89" rx="3" ry="3" fill="#1A1A2E" animate={{ scaleY: [1, 0.05, 1] }} transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 3.5, ease: "easeInOut" }} style={{ originX: "128px", originY: "89px" }}/>
                        {/* Nose */}
                        <path d="M119 93 Q120 96 121 93" stroke="#DDA68A" strokeWidth="1" fill="none" strokeLinecap="round"/>
                        {/* Mouth */}
                        <path d="M114 99 Q120 104 126 99" stroke="#C07060" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                        {/* Cheek blush */}
                        <ellipse cx="107" cy="96" rx="6" ry="3.5" fill="#FFB4A2" opacity="0.3"/>
                        <ellipse cx="133" cy="96" rx="6" ry="3.5" fill="#FFB4A2" opacity="0.3"/>
                      </motion.g>
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
                      {/* Ground shadow */}
                      <ellipse cx="130" cy="194" rx="52" ry="5" fill="#000" opacity="0.06"/>
                      {/* Sparkles / confetti */}
                      <motion.circle cx="50" cy="45" r="5" fill="#F48FB1" opacity="0.15" animate={{ scale: [1, 1.5, 1], opacity: [0.15, 0.4, 0.15] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}/>
                      <motion.circle cx="210" cy="38" r="4" fill="#FFE082" opacity="0.15" animate={{ scale: [1, 1.5, 1], opacity: [0.15, 0.4, 0.15] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.7 }}/>
                      <motion.circle cx="220" cy="130" r="3" fill="#A5D6A7" opacity="0.15" animate={{ scale: [1, 1.5, 1], opacity: [0.15, 0.4, 0.15] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 1.3 }}/>
                      {/* Static confetti pieces */}
                      <rect x="38" y="55" width="8" height="4" rx="2" fill="#F48FB1" transform="rotate(-20 38 55)" opacity="0.7"/>
                      <rect x="218" y="48" width="8" height="4" rx="2" fill="#6CB4EE" transform="rotate(15 218 48)" opacity="0.7"/>
                      <rect x="42" y="80" width="6" height="3" rx="1.5" fill="#CE93D8" transform="rotate(-35 42 80)" opacity="0.7"/>
                      <rect x="212" y="72" width="6" height="3" rx="1.5" fill="#FFE082" transform="rotate(25 212 72)" opacity="0.7"/>
                      <circle cx="55" cy="70" r="3" fill="#FFE082" opacity="0.6"/>
                      <circle cx="205" cy="65" r="3" fill="#A5D6A7" opacity="0.6"/>
                      {/* Cake — held by right hand, floating slightly */}
                      <motion.g animate={{ y: [0, -4, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}>
                        {/* Tier 2 bottom */}
                        <rect x="140" y="140" width="54" height="28" rx="6" fill="#FFAB91"/>
                        <path d="M140 148 Q167 140 194 148" fill="#FFCCBC"/>
                        {/* Tier 1 top */}
                        <rect x="148" y="116" width="38" height="24" rx="5" fill="#FF8A80"/>
                        <path d="M148 124 Q167 116 186 124" fill="#FFCCBC"/>
                        {/* Frosting drips */}
                        <path d="M152 116 Q154 110 156 116" fill="white"/>
                        <path d="M160 116 Q162 110 164 116" fill="white"/>
                        <path d="M168 116 Q170 110 172 116" fill="white"/>
                        {/* Candles */}
                        <rect x="154" y="100" width="5" height="16" rx="2.5" fill="#6CB4EE"/>
                        <rect x="164" y="96" width="5" height="20" rx="2.5" fill="#F48FB1"/>
                        <rect x="174" y="100" width="5" height="16" rx="2.5" fill="#A5D6A7"/>
                        {/* Flames */}
                        <ellipse cx="156" cy="98" rx="3" ry="4" fill="#FFD54F"/>
                        <ellipse cx="156" cy="97" rx="1.5" ry="2.5" fill="#FFF176"/>
                        <ellipse cx="166" cy="94" rx="3" ry="4" fill="#FFD54F"/>
                        <ellipse cx="166" cy="93" rx="1.5" ry="2.5" fill="#FFF176"/>
                        <ellipse cx="176" cy="98" rx="3" ry="4" fill="#FFD54F"/>
                        <ellipse cx="176" cy="97" rx="1.5" ry="2.5" fill="#FFF176"/>
                      </motion.g>
                      {/* Boy character — body sway */}
                      <motion.g animate={{ y: [0, -1.5, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}>
                        {/* Legs */}
                        <path d="M105 168 Q103 180 102 192" stroke="#4A3728" strokeWidth="7" strokeLinecap="round" fill="none"/>
                        <path d="M119 168 Q121 180 122 192" stroke="#4A3728" strokeWidth="7" strokeLinecap="round" fill="none"/>
                        {/* Shoes */}
                        <ellipse cx="101" cy="193" rx="9" ry="4" fill="#1A1A2E"/>
                        <ellipse cx="123" cy="193" rx="9" ry="4" fill="#1A1A2E"/>
                        <ellipse cx="98" cy="192" rx="4" ry="2" fill="#2C2C2C" opacity="0.4"/>
                        <ellipse cx="120" cy="192" rx="4" ry="2" fill="#2C2C2C" opacity="0.4"/>
                        {/* Body — coral shirt */}
                        <path d="M93 140 C91 130 91 118 94 110 L130 110 C133 118 133 130 131 140 Z" fill="#FF8A80"/>
                        {/* Left arm celebratory (raised) */}
                        <path d="M93 116 C88 108 84 100 80 92" stroke="#FF8A80" strokeWidth="9" strokeLinecap="round" fill="none"/>
                        <path d="M80 92 C78 88 78 83 82 82" stroke="#F0C4A8" strokeWidth="7" strokeLinecap="round" fill="none"/>
                        {/* Left hand celebrating */}
                        <path d="M80 81 L76 76" stroke="#F0C4A8" strokeWidth="2.5" strokeLinecap="round"/>
                        <path d="M82 80 L80 74" stroke="#F0C4A8" strokeWidth="2.5" strokeLinecap="round"/>
                        <path d="M84 81 L84 75" stroke="#F0C4A8" strokeWidth="2.5" strokeLinecap="round"/>
                        {/* Right arm holding cake */}
                        <path d="M130 116 C136 122 140 130 143 140" stroke="#FF8A80" strokeWidth="9" strokeLinecap="round" fill="none"/>
                        <path d="M143 140 C144 146 142 152 140 155" stroke="#F0C4A8" strokeWidth="7" strokeLinecap="round" fill="none"/>
                        {/* Right hand under cake */}
                        <path d="M141 153 L145 158" stroke="#F0C4A8" strokeWidth="2.5" strokeLinecap="round"/>
                        <path d="M139 154 L142 159" stroke="#F0C4A8" strokeWidth="2.5" strokeLinecap="round"/>
                        <path d="M137 154 L139 159" stroke="#F0C4A8" strokeWidth="2.5" strokeLinecap="round"/>
                        {/* Neck */}
                        <rect x="107" y="100" width="10" height="12" rx="4" fill="#E8B898"/>
                        {/* Head */}
                        <ellipse cx="112" cy="88" rx="22" ry="23" fill="#F0C4A8"/>
                        {/* Ears */}
                        <ellipse cx="90" cy="89" rx="4" ry="5" fill="#E8B898"/>
                        <ellipse cx="90" cy="89" rx="2" ry="3" fill="#DDA68A"/>
                        <ellipse cx="134" cy="89" rx="4" ry="5" fill="#E8B898"/>
                        <ellipse cx="134" cy="89" rx="2" ry="3" fill="#DDA68A"/>
                        {/* Party hat */}
                        <path d="M112 68 L105 48 L119 48 Z" fill="#CE93D8"/>
                        <path d="M107 60 L117 60" stroke="white" strokeWidth="1.5" opacity="0.6"/>
                        <path d="M105.5 54 L118.5 54" stroke="white" strokeWidth="1.5" opacity="0.6"/>
                        <circle cx="112" cy="46" r="4" fill="#FFE082"/>
                        <circle cx="112" cy="44" r="2" fill="white" opacity="0.6"/>
                        <path d="M105 68 L119 68" stroke="#CE93D8" strokeWidth="2"/>
                        {/* Curly hair */}
                        <path d="M90 82 C89 70 91 60 96 56 C96 56 94 63 96 67" fill="#1A1A2E"/>
                        <path d="M90 80 C88 74 90 68 92 66 Q91 70 93 72" stroke="#1A1A2E" strokeWidth="3" fill="none" strokeLinecap="round"/>
                        <path d="M134 80 C135 70 133 60 128 56 C128 56 130 63 128 67" fill="#1A1A2E"/>
                        <path d="M134 80 C136 74 134 68 132 66 Q133 70 131 72" stroke="#1A1A2E" strokeWidth="3" fill="none" strokeLinecap="round"/>
                        <path d="M93 58 C98 52 106 49 112 49 C118 49 126 52 131 58" fill="#1A1A2E"/>
                        <path d="M93 62 Q95 58 98 62 Q100 58 103 62 Q105 58 108 62" stroke="#1A1A2E" strokeWidth="2" fill="none" strokeLinecap="round"/>
                        <path d="M116 62 Q119 58 122 62 Q124 58 127 62 Q129 58 131 62" stroke="#1A1A2E" strokeWidth="2" fill="none" strokeLinecap="round"/>
                        {/* Eyebrows */}
                        <path d="M101 82 Q107 79 113 82" stroke="#1A1A2E" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
                        <path d="M111 82 Q117 79 123 82" stroke="#1A1A2E" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
                        {/* Eyes */}
                        <ellipse cx="104" cy="89" rx="5.5" ry="5.5" fill="white"/>
                        <motion.ellipse cx="104" cy="89" rx="3" ry="3" fill="#1A1A2E" animate={{ scaleY: [1, 0.05, 1] }} transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 3.5, ease: "easeInOut" }} style={{ originX: "104px", originY: "89px" }}/>
                        <ellipse cx="120" cy="89" rx="5.5" ry="5.5" fill="white"/>
                        <motion.ellipse cx="120" cy="89" rx="3" ry="3" fill="#1A1A2E" animate={{ scaleY: [1, 0.05, 1] }} transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 3.5, ease: "easeInOut" }} style={{ originX: "120px", originY: "89px" }}/>
                        {/* Nose */}
                        <path d="M111 93 Q112 96 113 93" stroke="#DDA68A" strokeWidth="1" fill="none" strokeLinecap="round"/>
                        {/* Mouth — happy */}
                        <path d="M106 100 Q112 106 118 100" stroke="#C07060" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                        {/* Cheek blush */}
                        <ellipse cx="99" cy="96" rx="6" ry="3.5" fill="#FFB4A2" opacity="0.3"/>
                        <ellipse cx="125" cy="96" rx="6" ry="3.5" fill="#FFB4A2" opacity="0.3"/>
                      </motion.g>
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
                      {/* Ground shadows */}
                      <ellipse cx="88" cy="194" rx="30" ry="4" fill="#000" opacity="0.06"/>
                      <ellipse cx="172" cy="194" rx="30" ry="4" fill="#000" opacity="0.06"/>
                      {/* Sparkles */}
                      <motion.circle cx="130" cy="28" r="5" fill="#EF5350" opacity="0.15" animate={{ scale: [1, 1.5, 1], opacity: [0.15, 0.4, 0.15] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}/>
                      <motion.circle cx="38" cy="80" r="4" fill="#6CB4EE" opacity="0.15" animate={{ scale: [1, 1.5, 1], opacity: [0.15, 0.4, 0.15] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.7 }}/>
                      <motion.circle cx="222" cy="80" r="3" fill="#FF8A80" opacity="0.15" animate={{ scale: [1, 1.5, 1], opacity: [0.15, 0.4, 0.15] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 1.4 }}/>
                      {/* Floating heart between them */}
                      <motion.g animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }} style={{ originX: "130px", originY: "52px" }}>
                        <path d="M130 62 C130 55 123 50 120 55 C117 50 110 55 110 62 C110 72 130 80 130 80 C130 80 150 72 150 62 C150 55 143 50 140 55 C137 50 130 55 130 62Z" fill="#EF5350" opacity="0.85"/>
                      </motion.g>
                      {/* Both in same body sway */}
                      <motion.g animate={{ y: [0, -1.5, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}>
                        {/* ── LEFT PERSON: Boy in blue ── */}
                        {/* Legs */}
                        <path d="M78 168 Q76 180 75 192" stroke="#4A3728" strokeWidth="6" strokeLinecap="round" fill="none"/>
                        <path d="M92 168 Q94 180 95 192" stroke="#4A3728" strokeWidth="6" strokeLinecap="round" fill="none"/>
                        {/* Shoes */}
                        <ellipse cx="74" cy="193" rx="8" ry="4" fill="#1A1A2E"/>
                        <ellipse cx="96" cy="193" rx="8" ry="4" fill="#1A1A2E"/>
                        <ellipse cx="71" cy="192" rx="3.5" ry="2" fill="#2C2C2C" opacity="0.4"/>
                        <ellipse cx="93" cy="192" rx="3.5" ry="2" fill="#2C2C2C" opacity="0.4"/>
                        {/* Body blue shirt */}
                        <path d="M68 140 C66 130 66 118 69 110 L105 110 C108 118 108 130 106 140 Z" fill="#6CB4EE"/>
                        {/* Collar */}
                        <path d="M80 110 Q87 115 94 110" stroke="#5BA4D9" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                        {/* Left arm */}
                        <path d="M68 115 C62 122 60 132 61 142" stroke="#6CB4EE" strokeWidth="8" strokeLinecap="round" fill="none"/>
                        <path d="M61 142 C61 146 63 149 66 150" stroke="#F0C4A8" strokeWidth="6" strokeLinecap="round" fill="none"/>
                        <path d="M64 149 L61 154" stroke="#F0C4A8" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M66 150 L64 155" stroke="#F0C4A8" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M68 150 L67 155" stroke="#F0C4A8" strokeWidth="2" strokeLinecap="round"/>
                        {/* Right arm slightly toward center */}
                        <path d="M105 115 C110 120 112 128 111 138" stroke="#6CB4EE" strokeWidth="8" strokeLinecap="round" fill="none"/>
                        <path d="M111 138 C111 143 109 146 107 147" stroke="#F0C4A8" strokeWidth="6" strokeLinecap="round" fill="none"/>
                        <path d="M108 146 L111 151" stroke="#F0C4A8" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M106 147 L108 152" stroke="#F0C4A8" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M104 147 L105 152" stroke="#F0C4A8" strokeWidth="2" strokeLinecap="round"/>
                        {/* Neck */}
                        <rect x="82" y="100" width="9" height="11" rx="4" fill="#E8B898"/>
                        {/* Head */}
                        <ellipse cx="87" cy="88" rx="20" ry="21" fill="#F0C4A8"/>
                        {/* Ears */}
                        <ellipse cx="67" cy="89" rx="3.5" ry="4.5" fill="#E8B898"/>
                        <ellipse cx="67" cy="89" rx="1.8" ry="2.5" fill="#DDA68A"/>
                        <ellipse cx="107" cy="89" rx="3.5" ry="4.5" fill="#E8B898"/>
                        <ellipse cx="107" cy="89" rx="1.8" ry="2.5" fill="#DDA68A"/>
                        {/* Short dark hair */}
                        <path d="M67 82 C67 68 71 58 87 58 C103 58 107 68 107 82" fill="#1A1A2E"/>
                        <path d="M69 76 C68 70 70 64 72 62 Q71 67 73 70" fill="#1A1A2E"/>
                        <path d="M105 76 C106 70 104 64 102 62 Q103 67 101 70" fill="#1A1A2E"/>
                        {/* Eyebrows */}
                        <path d="M77 82 Q83 79 89 82" stroke="#1A1A2E" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
                        <path d="M85 82 Q91 79 97 82" stroke="#1A1A2E" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
                        {/* Eyes */}
                        <ellipse cx="80" cy="89" rx="5" ry="5" fill="white"/>
                        <motion.ellipse cx="80" cy="89" rx="2.8" ry="2.8" fill="#1A1A2E" animate={{ scaleY: [1, 0.05, 1] }} transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 3.5, ease: "easeInOut" }} style={{ originX: "80px", originY: "89px" }}/>
                        <ellipse cx="94" cy="89" rx="5" ry="5" fill="white"/>
                        <motion.ellipse cx="94" cy="89" rx="2.8" ry="2.8" fill="#1A1A2E" animate={{ scaleY: [1, 0.05, 1] }} transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 4.2, ease: "easeInOut" }} style={{ originX: "94px", originY: "89px" }}/>
                        {/* Nose */}
                        <path d="M86 93 Q87 96 88 93" stroke="#DDA68A" strokeWidth="1" fill="none" strokeLinecap="round"/>
                        {/* Mouth */}
                        <path d="M81 99 Q87 104 93 99" stroke="#C07060" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
                        {/* Cheek blush */}
                        <ellipse cx="75" cy="95" rx="5" ry="3" fill="#FFB4A2" opacity="0.3"/>
                        <ellipse cx="99" cy="95" rx="5" ry="3" fill="#FFB4A2" opacity="0.3"/>

                        {/* ── RIGHT PERSON: Girl in coral ── */}
                        {/* Legs */}
                        <path d="M162 168 Q160 180 159 192" stroke="#4A3728" strokeWidth="6" strokeLinecap="round" fill="none"/>
                        <path d="M176 168 Q178 180 179 192" stroke="#4A3728" strokeWidth="6" strokeLinecap="round" fill="none"/>
                        {/* Shoes */}
                        <ellipse cx="158" cy="193" rx="8" ry="4" fill="#1A1A2E"/>
                        <ellipse cx="180" cy="193" rx="8" ry="4" fill="#1A1A2E"/>
                        <ellipse cx="155" cy="192" rx="3.5" ry="2" fill="#2C2C2C" opacity="0.4"/>
                        <ellipse cx="177" cy="192" rx="3.5" ry="2" fill="#2C2C2C" opacity="0.4"/>
                        {/* Body coral shirt */}
                        <path d="M150 140 C148 130 148 118 151 110 L187 110 C190 118 190 130 188 140 Z" fill="#FF8A80"/>
                        {/* Collar */}
                        <path d="M162 110 Q169 115 176 110" stroke="#FF6060" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                        {/* Left arm — slightly toward center */}
                        <path d="M150 115 C145 120 143 128 144 138" stroke="#FF8A80" strokeWidth="8" strokeLinecap="round" fill="none"/>
                        <path d="M144 138 C144 143 146 146 148 147" stroke="#F0C4A8" strokeWidth="6" strokeLinecap="round" fill="none"/>
                        <path d="M147 146 L144 151" stroke="#F0C4A8" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M149 147 L147 152" stroke="#F0C4A8" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M151 147 L150 152" stroke="#F0C4A8" strokeWidth="2" strokeLinecap="round"/>
                        {/* Right arm */}
                        <path d="M187 115 C192 122 194 132 193 142" stroke="#FF8A80" strokeWidth="8" strokeLinecap="round" fill="none"/>
                        <path d="M193 142 C193 146 191 149 188 150" stroke="#F0C4A8" strokeWidth="6" strokeLinecap="round" fill="none"/>
                        <path d="M190 149 L193 154" stroke="#F0C4A8" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M188 150 L190 155" stroke="#F0C4A8" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M186 150 L187 155" stroke="#F0C4A8" strokeWidth="2" strokeLinecap="round"/>
                        {/* Neck */}
                        <rect x="164" y="100" width="9" height="11" rx="4" fill="#E8B898"/>
                        {/* Head */}
                        <ellipse cx="169" cy="88" rx="20" ry="21" fill="#F0C4A8"/>
                        {/* Ears */}
                        <ellipse cx="149" cy="89" rx="3.5" ry="4.5" fill="#E8B898"/>
                        <ellipse cx="149" cy="89" rx="1.8" ry="2.5" fill="#DDA68A"/>
                        <ellipse cx="189" cy="89" rx="3.5" ry="4.5" fill="#E8B898"/>
                        <ellipse cx="189" cy="89" rx="1.8" ry="2.5" fill="#DDA68A"/>
                        {/* Longer flowing hair */}
                        <path d="M149 82 C149 68 153 58 169 58 C185 58 189 68 189 82" fill="#4A3728"/>
                        <path d="M149 84 C146 90 146 102 148 114 C146 116 145 122 147 126 Q150 124 152 121 C151 114 152 105 153 98 C152 90 150 84 149 84Z" fill="#4A3728"/>
                        <path d="M189 84 C192 90 192 102 190 114 C192 116 193 122 191 126 Q188 124 186 121 C187 114 186 105 185 98 C186 90 188 84 189 84Z" fill="#4A3728"/>
                        {/* Eyebrows */}
                        <path d="M159 82 Q165 79 171 82" stroke="#1A1A2E" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
                        <path d="M167 82 Q173 79 179 82" stroke="#1A1A2E" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
                        {/* Eyes */}
                        <ellipse cx="162" cy="89" rx="5" ry="5" fill="white"/>
                        <motion.ellipse cx="162" cy="89" rx="2.8" ry="2.8" fill="#1A1A2E" animate={{ scaleY: [1, 0.05, 1] }} transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 3.5, ease: "easeInOut" }} style={{ originX: "162px", originY: "89px" }}/>
                        <ellipse cx="176" cy="89" rx="5" ry="5" fill="white"/>
                        <motion.ellipse cx="176" cy="89" rx="2.8" ry="2.8" fill="#1A1A2E" animate={{ scaleY: [1, 0.05, 1] }} transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 4.2, ease: "easeInOut" }} style={{ originX: "176px", originY: "89px" }}/>
                        {/* Nose */}
                        <path d="M168 93 Q169 96 170 93" stroke="#DDA68A" strokeWidth="1" fill="none" strokeLinecap="round"/>
                        {/* Mouth */}
                        <path d="M163 99 Q169 104 175 99" stroke="#C07060" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
                        {/* Cheek blush */}
                        <ellipse cx="157" cy="95" rx="5" ry="3" fill="#FFB4A2" opacity="0.3"/>
                        <ellipse cx="181" cy="95" rx="5" ry="3" fill="#FFB4A2" opacity="0.3"/>
                      </motion.g>
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
                      {/* Ground shadow */}
                      <ellipse cx="130" cy="194" rx="52" ry="5" fill="#000" opacity="0.06"/>
                      {/* Sparkles */}
                      <motion.circle cx="42" cy="50" r="5" fill="#CE93D8" opacity="0.15" animate={{ scale: [1, 1.5, 1], opacity: [0.15, 0.4, 0.15] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}/>
                      <motion.circle cx="222" cy="70" r="4" fill="#6CB4EE" opacity="0.15" animate={{ scale: [1, 1.5, 1], opacity: [0.15, 0.4, 0.15] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}/>
                      <motion.circle cx="48" cy="150" r="3" fill="#FF8A80" opacity="0.15" animate={{ scale: [1, 1.5, 1], opacity: [0.15, 0.4, 0.15] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}/>
                      {/* House */}
                      <rect x="52" y="106" width="88" height="72" rx="4" fill="#FFF3E0" stroke="#E0C080" strokeWidth="1.5"/>
                      {/* Roof */}
                      <path d="M45 110 L96 70 L147 110 Z" fill="#FF8A65"/>
                      <path d="M45 110 L96 70 L147 110" stroke="#E05A20" strokeWidth="1.5" fill="none"/>
                      {/* Chimney */}
                      <rect x="118" y="72" width="12" height="22" rx="2" fill="#BDBDBD"/>
                      <rect x="116" y="70" width="16" height="6" rx="2" fill="#9E9E9E"/>
                      {/* Door */}
                      <rect x="83" y="138" width="26" height="40" rx="4" fill="#8D6E63"/>
                      <circle cx="105" cy="159" r="2" fill="#FFD54F"/>
                      {/* Windows */}
                      <rect x="58" y="118" width="20" height="18" rx="3" fill="#BBDEFB" stroke="#64B5F6" strokeWidth="1"/>
                      <line x1="68" y1="118" x2="68" y2="136" stroke="#64B5F6" strokeWidth="0.8"/>
                      <line x1="58" y1="127" x2="78" y2="127" stroke="#64B5F6" strokeWidth="0.8"/>
                      <rect x="114" y="118" width="20" height="18" rx="3" fill="#BBDEFB" stroke="#64B5F6" strokeWidth="1"/>
                      <line x1="124" y1="118" x2="124" y2="136" stroke="#64B5F6" strokeWidth="0.8"/>
                      <line x1="114" y1="127" x2="134" y2="127" stroke="#64B5F6" strokeWidth="0.8"/>
                      {/* Walkway */}
                      <path d="M83 178 L80 194 L112 194 L109 178 Z" fill="#E0D0C0" opacity="0.8"/>
                      {/* Floating location pin */}
                      <motion.g animate={{ y: [0, -5, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}>
                        <path d="M96 28 C86 28 78 36 78 46 C78 60 96 75 96 75 C96 75 114 60 114 46 C114 36 106 28 96 28Z" fill="#EF5350"/>
                        <circle cx="96" cy="45" r="7" fill="white"/>
                      </motion.g>
                      {/* Girl character — body sway */}
                      <motion.g animate={{ y: [0, -1.5, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}>
                        {/* Legs */}
                        <path d="M176 168 Q174 180 173 192" stroke="#4A3728" strokeWidth="7" strokeLinecap="round" fill="none"/>
                        <path d="M190 168 Q192 180 193 192" stroke="#4A3728" strokeWidth="7" strokeLinecap="round" fill="none"/>
                        {/* Shoes */}
                        <ellipse cx="172" cy="193" rx="9" ry="4" fill="#1A1A2E"/>
                        <ellipse cx="194" cy="193" rx="9" ry="4" fill="#1A1A2E"/>
                        <ellipse cx="169" cy="192" rx="4" ry="2" fill="#2C2C2C" opacity="0.4"/>
                        <ellipse cx="191" cy="192" rx="4" ry="2" fill="#2C2C2C" opacity="0.4"/>
                        {/* Body — purple top */}
                        <path d="M165 140 C163 130 163 118 166 110 L202 110 C205 118 205 130 203 140 Z" fill="#CE93D8"/>
                        {/* Left arm extended pointing at house */}
                        <path d="M165 116 C158 118 148 122 140 128" stroke="#CE93D8" strokeWidth="9" strokeLinecap="round" fill="none"/>
                        <path d="M140 128 C136 131 133 134 132 138" stroke="#F0C4A8" strokeWidth="7" strokeLinecap="round" fill="none"/>
                        {/* Pointing finger */}
                        <path d="M131 137 L126 134" stroke="#F0C4A8" strokeWidth="3" strokeLinecap="round"/>
                        <path d="M131 139 L128 142" stroke="#F0C4A8" strokeWidth="2.5" strokeLinecap="round"/>
                        <path d="M133 140 L131 145" stroke="#F0C4A8" strokeWidth="2.5" strokeLinecap="round"/>
                        {/* Right arm relaxed */}
                        <path d="M202 116 C208 123 210 133 209 143" stroke="#CE93D8" strokeWidth="9" strokeLinecap="round" fill="none"/>
                        <path d="M209 143 C209 149 207 153 205 155" stroke="#F0C4A8" strokeWidth="7" strokeLinecap="round" fill="none"/>
                        <path d="M206 154 L209 159" stroke="#F0C4A8" strokeWidth="2.5" strokeLinecap="round"/>
                        <path d="M204 155 L206 160" stroke="#F0C4A8" strokeWidth="2.5" strokeLinecap="round"/>
                        <path d="M202 155 L203 160" stroke="#F0C4A8" strokeWidth="2.5" strokeLinecap="round"/>
                        {/* Neck */}
                        <rect x="179" y="100" width="10" height="12" rx="4" fill="#E8B898"/>
                        {/* Head */}
                        <ellipse cx="184" cy="88" rx="22" ry="23" fill="#F0C4A8"/>
                        {/* Ears */}
                        <ellipse cx="162" cy="89" rx="4" ry="5" fill="#E8B898"/>
                        <ellipse cx="162" cy="89" rx="2" ry="3" fill="#DDA68A"/>
                        <ellipse cx="206" cy="89" rx="4" ry="5" fill="#E8B898"/>
                        <ellipse cx="206" cy="89" rx="2" ry="3" fill="#DDA68A"/>
                        {/* Bob haircut */}
                        <path d="M162 82 C162 68 166 58 184 58 C202 58 206 68 206 82" fill="#4A3728"/>
                        <path d="M162 84 C160 90 160 100 162 110 C163 114 165 116 167 116 C166 110 165 102 165 95 C164 90 163 84 162 84Z" fill="#4A3728"/>
                        <path d="M206 84 C208 90 208 100 206 110 C205 114 203 116 201 116 C202 110 203 102 203 95 C204 90 205 84 206 84Z" fill="#4A3728"/>
                        <path d="M162 108 Q168 114 176 115" stroke="#4A3728" strokeWidth="4" strokeLinecap="round" fill="none"/>
                        <path d="M206 108 Q200 114 192 115" stroke="#4A3728" strokeWidth="4" strokeLinecap="round" fill="none"/>
                        {/* Eyebrows */}
                        <path d="M173 82 Q179 79 185 82" stroke="#1A1A2E" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
                        <path d="M183 82 Q189 79 195 82" stroke="#1A1A2E" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
                        {/* Eyes */}
                        <ellipse cx="176" cy="89" rx="5.5" ry="5.5" fill="white"/>
                        <motion.ellipse cx="176" cy="89" rx="3" ry="3" fill="#1A1A2E" animate={{ scaleY: [1, 0.05, 1] }} transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 3.5, ease: "easeInOut" }} style={{ originX: "176px", originY: "89px" }}/>
                        <ellipse cx="192" cy="89" rx="5.5" ry="5.5" fill="white"/>
                        <motion.ellipse cx="192" cy="89" rx="3" ry="3" fill="#1A1A2E" animate={{ scaleY: [1, 0.05, 1] }} transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 3.5, ease: "easeInOut" }} style={{ originX: "192px", originY: "89px" }}/>
                        {/* Nose */}
                        <path d="M183 93 Q184 96 185 93" stroke="#DDA68A" strokeWidth="1" fill="none" strokeLinecap="round"/>
                        {/* Mouth */}
                        <path d="M178 99 Q184 104 190 99" stroke="#C07060" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                        {/* Cheek blush */}
                        <ellipse cx="171" cy="96" rx="6" ry="3.5" fill="#FFB4A2" opacity="0.3"/>
                        <ellipse cx="197" cy="96" rx="6" ry="3.5" fill="#FFB4A2" opacity="0.3"/>
                      </motion.g>
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
                      {/* Ground shadow */}
                      <ellipse cx="130" cy="194" rx="52" ry="5" fill="#000" opacity="0.06"/>
                      {/* Sparkles */}
                      <motion.circle cx="46" cy="58" r="5" fill="#A5D6A7" opacity="0.15" animate={{ scale: [1, 1.5, 1], opacity: [0.15, 0.4, 0.15] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}/>
                      <motion.circle cx="218" cy="65" r="4" fill="#6CB4EE" opacity="0.15" animate={{ scale: [1, 1.5, 1], opacity: [0.15, 0.4, 0.15] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.9 }}/>
                      <motion.circle cx="50" cy="150" r="3" fill="#FFE082" opacity="0.15" animate={{ scale: [1, 1.5, 1], opacity: [0.15, 0.4, 0.15] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 1.6 }}/>
                      {/* Floating globe above head */}
                      <motion.g animate={{ x: [0, 2, 0], y: [0, -3, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}>
                        <circle cx="130" cy="52" r="32" fill="#E3F2FD" stroke="#64B5F6" strokeWidth="1.5"/>
                        {/* Globe latitude/longitude lines */}
                        <ellipse cx="130" cy="52" rx="32" ry="12" stroke="#90CAF9" strokeWidth="1" fill="none"/>
                        <ellipse cx="130" cy="52" rx="12" ry="32" stroke="#90CAF9" strokeWidth="1" fill="none"/>
                        <line x1="98" y1="52" x2="162" y2="52" stroke="#90CAF9" strokeWidth="0.8"/>
                        {/* Africa */}
                        <path d="M126 44 C128 40 133 40 135 44 C138 48 138 56 136 60 C134 64 130 64 128 60 C126 56 124 48 126 44Z" fill="#81C784" opacity="0.7"/>
                        {/* Europe */}
                        <path d="M116 38 C118 36 122 36 122 40 C122 44 118 46 116 44 C114 42 114 40 116 38Z" fill="#81C784" opacity="0.6"/>
                        {/* Americas hint */}
                        <path d="M110 48 C112 44 114 46 114 50 C114 54 112 56 110 54 C108 52 108 50 110 48Z" fill="#81C784" opacity="0.5"/>
                      </motion.g>
                      {/* Boy character — body sway */}
                      <motion.g animate={{ y: [0, -1.5, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}>
                        {/* Legs */}
                        <path d="M113 168 Q111 180 110 192" stroke="#4A3728" strokeWidth="7" strokeLinecap="round" fill="none"/>
                        <path d="M127 168 Q129 180 130 192" stroke="#4A3728" strokeWidth="7" strokeLinecap="round" fill="none"/>
                        {/* Shoes */}
                        <ellipse cx="109" cy="193" rx="9" ry="4" fill="#1A1A2E"/>
                        <ellipse cx="131" cy="193" rx="9" ry="4" fill="#1A1A2E"/>
                        <ellipse cx="106" cy="192" rx="4" ry="2" fill="#2C2C2C" opacity="0.4"/>
                        <ellipse cx="128" cy="192" rx="4" ry="2" fill="#2C2C2C" opacity="0.4"/>
                        {/* Body — green shirt */}
                        <path d="M101 140 C99 130 99 118 102 110 L138 110 C141 118 141 130 139 140 Z" fill="#A5D6A7"/>
                        {/* Collar */}
                        <path d="M113 110 Q120 115 127 110" stroke="#81C784" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                        {/* Left arm raised holding globe */}
                        <path d="M101 115 C96 108 93 100 95 88" stroke="#A5D6A7" strokeWidth="9" strokeLinecap="round" fill="none"/>
                        <path d="M95 88 C95 83 97 80 100 80" stroke="#F0C4A8" strokeWidth="7" strokeLinecap="round" fill="none"/>
                        {/* Left hand fingers under globe */}
                        <path d="M99 79 L96 74" stroke="#F0C4A8" strokeWidth="2.5" strokeLinecap="round"/>
                        <path d="M101 79 L100 73" stroke="#F0C4A8" strokeWidth="2.5" strokeLinecap="round"/>
                        <path d="M103 80 L103 74" stroke="#F0C4A8" strokeWidth="2.5" strokeLinecap="round"/>
                        {/* Right arm raised holding globe */}
                        <path d="M139 115 C144 108 147 100 145 88" stroke="#A5D6A7" strokeWidth="9" strokeLinecap="round" fill="none"/>
                        <path d="M145 88 C145 83 143 80 140 80" stroke="#F0C4A8" strokeWidth="7" strokeLinecap="round" fill="none"/>
                        {/* Right hand fingers under globe */}
                        <path d="M141 79 L144 74" stroke="#F0C4A8" strokeWidth="2.5" strokeLinecap="round"/>
                        <path d="M139 79 L140 73" stroke="#F0C4A8" strokeWidth="2.5" strokeLinecap="round"/>
                        <path d="M137 80 L137 74" stroke="#F0C4A8" strokeWidth="2.5" strokeLinecap="round"/>
                        {/* Neck */}
                        <rect x="115" y="100" width="10" height="12" rx="4" fill="#E8B898"/>
                        {/* Head */}
                        <ellipse cx="120" cy="90" rx="20" ry="21" fill="#F0C4A8"/>
                        {/* Ears */}
                        <ellipse cx="100" cy="91" rx="3.5" ry="4.5" fill="#E8B898"/>
                        <ellipse cx="100" cy="91" rx="1.8" ry="2.5" fill="#DDA68A"/>
                        <ellipse cx="140" cy="91" rx="3.5" ry="4.5" fill="#E8B898"/>
                        <ellipse cx="140" cy="91" rx="1.8" ry="2.5" fill="#DDA68A"/>
                        {/* Wavy hair */}
                        <path d="M100 84 C100 70 104 60 120 60 C136 60 140 70 140 84" fill="#1A1A2E"/>
                        <path d="M100 72 Q104 68 108 72 Q112 68 116 72 Q120 68 124 72 Q128 68 132 72 Q136 68 140 72" stroke="#1A1A2E" strokeWidth="2" fill="none" strokeLinecap="round"/>
                        <path d="M100 78 Q103 74 106 78 Q109 74 112 78" stroke="#1A1A2E" strokeWidth="2" fill="none" strokeLinecap="round"/>
                        {/* Eyebrows */}
                        <path d="M109 84 Q115 81 121 84" stroke="#1A1A2E" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
                        <path d="M119 84 Q125 81 131 84" stroke="#1A1A2E" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
                        {/* Eyes */}
                        <ellipse cx="112" cy="91" rx="5.5" ry="5.5" fill="white"/>
                        <motion.ellipse cx="112" cy="91" rx="3" ry="3" fill="#1A1A2E" animate={{ scaleY: [1, 0.05, 1] }} transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 3.5, ease: "easeInOut" }} style={{ originX: "112px", originY: "91px" }}/>
                        <ellipse cx="128" cy="91" rx="5.5" ry="5.5" fill="white"/>
                        <motion.ellipse cx="128" cy="91" rx="3" ry="3" fill="#1A1A2E" animate={{ scaleY: [1, 0.05, 1] }} transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 3.5, ease: "easeInOut" }} style={{ originX: "128px", originY: "91px" }}/>
                        {/* Nose */}
                        <path d="M119 95 Q120 98 121 95" stroke="#DDA68A" strokeWidth="1" fill="none" strokeLinecap="round"/>
                        {/* Mouth */}
                        <path d="M114 101 Q120 106 126 101" stroke="#C07060" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                        {/* Cheek blush */}
                        <ellipse cx="107" cy="97" rx="6" ry="3.5" fill="#FFB4A2" opacity="0.3"/>
                        <ellipse cx="133" cy="97" rx="6" ry="3.5" fill="#FFB4A2" opacity="0.3"/>
                      </motion.g>
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
                      {/* Ground shadow */}
                      <ellipse cx="130" cy="194" rx="52" ry="5" fill="#000" opacity="0.06"/>
                      {/* Parent (left) head */}
                      <ellipse cx="90" cy="70" rx="18" ry="20" fill="#F0C4A8"/>
                      {/* Parent hair */}
                      <path d="M72 66 C72 50 80 44 90 44 C100 44 108 50 108 66 C105 58 101 56 90 56 C79 56 75 58 72 66Z" fill="#2C2C2C"/>
                      {/* Parent ears */}
                      <ellipse cx="72" cy="70" rx="3.5" ry="4.5" fill="#F0C4A8"/>
                      <ellipse cx="72.5" cy="70" rx="2" ry="3" fill="#E8B898"/>
                      <ellipse cx="108" cy="70" rx="3.5" ry="4.5" fill="#F0C4A8"/>
                      <ellipse cx="107.5" cy="70" rx="2" ry="3" fill="#E8B898"/>
                      {/* Parent eyes */}
                      <ellipse cx="84" cy="68" rx="3.5" ry="4" fill="white"/>
                      <ellipse cx="96" cy="68" rx="3.5" ry="4" fill="white"/>
                      <ellipse cx="84" cy="69" rx="2" ry="2.5" fill="#1A1A2E"/>
                      <ellipse cx="96" cy="69" rx="2" ry="2.5" fill="#1A1A2E"/>
                      {/* Parent eyebrows */}
                      <path d="M80 62 Q84 60 88 62" stroke="#2C2C2C" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                      <path d="M92 62 Q96 60 100 62" stroke="#2C2C2C" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                      {/* Parent nose */}
                      <path d="M89 73 Q90 76 91 73" stroke="#E8B898" strokeWidth="1" fill="none"/>
                      {/* Parent mouth */}
                      <path d="M84 77 Q90 81 96 77" stroke="#DDA68A" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                      {/* Parent cheeks */}
                      <ellipse cx="80" cy="76" rx="5" ry="3" fill="#FFB4A2" opacity="0.3"/>
                      <ellipse cx="100" cy="76" rx="5" ry="3" fill="#FFB4A2" opacity="0.3"/>
                      {/* Parent neck */}
                      <rect x="86" y="88" width="8" height="9" fill="#F0C4A8"/>
                      {/* Parent body coral */}
                      <path d="M70 97 C70 95 76 93 90 93 C104 93 110 95 110 97 L113 148 L67 148 Z" fill="#FF8A80"/>
                      {/* Parent legs */}
                      <path d="M78 148 L75 184 L83 184 L87 152 Z" fill="#4A3728"/>
                      <path d="M102 148 L105 184 L97 184 L93 152 Z" fill="#4A3728"/>
                      {/* Parent shoes */}
                      <ellipse cx="79" cy="185" rx="7" ry="3.5" fill="#1A1A2E"/>
                      <ellipse cx="101" cy="185" rx="7" ry="3.5" fill="#1A1A2E"/>
                      {/* Parent arms */}
                      <path d="M70 99 L59 117 L64 119 L74 103 Z" fill="#FF8A80"/>
                      <path d="M110 99 L121 117 L116 119 L106 103 Z" fill="#FF8A80"/>
                      {/* Shield between parent and child */}
                      <path d="M126 105 L135 110 L135 128 C135 135 130 139 126 141 C122 139 117 135 117 128 L117 110 Z" fill="white" stroke="#A5D6A7" strokeWidth="2"/>
                      {/* Checkmark in shield */}
                      <path d="M120 124 L125 129 L132 117" stroke="#4CAF50" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      {/* Child (right, shorter) head */}
                      <ellipse cx="170" cy="82" rx="15" ry="17" fill="#F0C4A8"/>
                      {/* Child hair */}
                      <path d="M155 79 C155 67 162 61 170 61 C178 61 185 67 185 79 C182 72 178 70 170 70 C162 70 158 72 155 79Z" fill="#4A3728"/>
                      {/* Child ears */}
                      <ellipse cx="155" cy="82" rx="3" ry="4" fill="#F0C4A8"/>
                      <ellipse cx="185" cy="82" rx="3" ry="4" fill="#F0C4A8"/>
                      {/* Child eyes */}
                      <ellipse cx="165" cy="80" rx="3" ry="3.5" fill="white"/>
                      <ellipse cx="175" cy="80" rx="3" ry="3.5" fill="white"/>
                      <ellipse cx="165" cy="81" rx="1.8" ry="2.2" fill="#1A1A2E"/>
                      <ellipse cx="175" cy="81" rx="1.8" ry="2.2" fill="#1A1A2E"/>
                      {/* Child eyebrows */}
                      <path d="M161 74 Q165 72 169 74" stroke="#4A3728" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                      <path d="M171 74 Q175 72 179 74" stroke="#4A3728" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                      {/* Child nose */}
                      <path d="M169 85 Q170 88 171 85" stroke="#E8B898" strokeWidth="1" fill="none"/>
                      {/* Child mouth */}
                      <path d="M163 89 Q170 93 177 89" stroke="#DDA68A" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                      {/* Child cheeks */}
                      <ellipse cx="161" cy="87" rx="4" ry="2.5" fill="#FFB4A2" opacity="0.3"/>
                      <ellipse cx="179" cy="87" rx="4" ry="2.5" fill="#FFB4A2" opacity="0.3"/>
                      {/* Child neck */}
                      <rect x="166" y="97" width="7" height="8" fill="#F0C4A8"/>
                      {/* Child body blue */}
                      <path d="M155 105 C155 103 161 101 170 101 C179 101 185 103 185 105 L187 148 L153 148 Z" fill="#6CB4EE"/>
                      {/* Child legs */}
                      <path d="M162 148 L160 184 L167 184 L170 152 Z" fill="#4A3728"/>
                      <path d="M178 148 L180 184 L173 184 L170 152 Z" fill="#4A3728"/>
                      {/* Child shoes */}
                      <ellipse cx="163" cy="185" rx="6" ry="3" fill="#1A1A2E"/>
                      <ellipse cx="177" cy="185" rx="6" ry="3" fill="#1A1A2E"/>
                      {/* Child arms */}
                      <path d="M155 107 L146 122 L151 124 L160 109 Z" fill="#6CB4EE"/>
                      <path d="M185 107 L194 122 L189 124 L180 109 Z" fill="#6CB4EE"/>
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
                        {/* Ground shadow */}
                        <ellipse cx="130" cy="194" rx="52" ry="5" fill="#000" opacity="0.06"/>
                        {/* Sparkle pulses */}
                        <motion.circle animate={{ scale: [1, 1.5, 1], opacity: [0.15, 0.4, 0.15] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }} cx="38" cy="45" r="5" fill="#A5D6A7"/>
                        <motion.circle animate={{ scale: [1, 1.5, 1], opacity: [0.15, 0.4, 0.15] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 1.1 }} cx="222" cy="50" r="4" fill="#6CB4EE"/>
                        <motion.circle animate={{ scale: [1, 1.5, 1], opacity: [0.15, 0.4, 0.15] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.7 }} cx="130" cy="22" r="3" fill="#FFE082"/>
                        {/* Body sway wrapper */}
                        <motion.g animate={{ y: [0, -1.5, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}>
                          {/* Parent (left, coral shirt) */}
                          {/* Parent head */}
                          <ellipse cx="82" cy="70" rx="19" ry="21" fill="#F0C4A8"/>
                          {/* Parent hair */}
                          <path d="M63 66 C63 49 71 43 82 43 C93 43 101 49 101 66 C98 58 94 56 82 56 C70 56 66 58 63 66Z" fill="#2C2C2C"/>
                          {/* Parent ears */}
                          <ellipse cx="63" cy="70" rx="3.5" ry="4.5" fill="#F0C4A8"/>
                          <ellipse cx="63.5" cy="70" rx="2" ry="3" fill="#E8B898"/>
                          <ellipse cx="101" cy="70" rx="3.5" ry="4.5" fill="#F0C4A8"/>
                          <ellipse cx="100.5" cy="70" rx="2" ry="3" fill="#E8B898"/>
                          {/* Parent eyes */}
                          <ellipse cx="76" cy="68" rx="4" ry="4.5" fill="white"/>
                          <ellipse cx="88" cy="68" rx="4" ry="4.5" fill="white"/>
                          <motion.ellipse animate={{ scaleY: [1, 0.05, 1] }} transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 3.5, ease: "easeInOut" }} style={{ originX: "76px", originY: "69px" }} cx="76" cy="69" rx="2.5" ry="3" fill="#1A1A2E"/>
                          <motion.ellipse animate={{ scaleY: [1, 0.05, 1] }} transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 3.5, ease: "easeInOut" }} style={{ originX: "88px", originY: "69px" }} cx="88" cy="69" rx="2.5" ry="3" fill="#1A1A2E"/>
                          {/* Parent eyebrows */}
                          <path d="M71 62 Q76 59 81 62" stroke="#2C2C2C" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                          <path d="M83 62 Q88 59 93 62" stroke="#2C2C2C" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                          {/* Parent nose */}
                          <path d="M80 74 Q82 77 84 74" stroke="#E8B898" strokeWidth="1" fill="none"/>
                          {/* Parent mouth */}
                          <path d="M75 80 Q82 85 89 80" stroke="#DDA68A" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                          {/* Parent cheeks */}
                          <ellipse cx="71" cy="78" rx="5" ry="3" fill="#FFB4A2" opacity="0.3"/>
                          <ellipse cx="93" cy="78" rx="5" ry="3" fill="#FFB4A2" opacity="0.3"/>
                          {/* Parent neck */}
                          <rect x="78" y="89" width="8" height="10" fill="#F0C4A8"/>
                          {/* Parent body coral */}
                          <path d="M61 99 C61 97 68 95 82 95 C96 95 103 97 103 99 L106 150 L58 150 Z" fill="#FF8A80"/>
                          {/* Parent legs */}
                          <path d="M70 150 L67 186 L75 186 L79 154 Z" fill="#4A3728"/>
                          <path d="M94 150 L97 186 L89 186 L85 154 Z" fill="#4A3728"/>
                          {/* Parent shoes */}
                          <ellipse cx="71" cy="187" rx="7.5" ry="3.5" fill="#1A1A2E"/>
                          <ellipse cx="93" cy="187" rx="7.5" ry="3.5" fill="#1A1A2E"/>
                          {/* Parent arm reaching toward shield */}
                          <path d="M103 101 L118 115 L113 118 L100 105 Z" fill="#FF8A80"/>
                          {/* Parent other arm */}
                          <path d="M61 101 L50 117 L55 120 L65 104 Z" fill="#FF8A80"/>
                          {/* Parent fingers (reaching hand) */}
                          <path d="M111 116 L115 113 L117 117 L113 120Z" fill="#F0C4A8"/>
                          <path d="M114 118 L118 115 L120 119 L116 122Z" fill="#F0C4A8"/>
                          {/* Floating shield */}
                          <motion.g animate={{ y: [0, -5, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}>
                            <path d="M130 85 L143 93 L143 114 C143 123 136 129 130 132 C124 129 117 123 117 114 L117 93 Z" fill="white" stroke="#A5D6A7" strokeWidth="2"/>
                            <path d="M130 95 L140 101 L140 117 C140 124 135 128 130 130 C125 128 120 124 120 117 L120 101 Z" fill="#E8F5E9"/>
                            <path d="M124 113 L128 118 L136 106" stroke="#4CAF50" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </motion.g>
                          {/* Child (right, blue shirt) */}
                          {/* Child head */}
                          <ellipse cx="178" cy="80" rx="16" ry="18" fill="#F0C4A8"/>
                          {/* Child hair */}
                          <path d="M162 77 C162 65 169 59 178 59 C187 59 194 65 194 77 C191 70 187 68 178 68 C169 68 165 70 162 77Z" fill="#4A3728"/>
                          {/* Child ears */}
                          <ellipse cx="162" cy="80" rx="3" ry="4" fill="#F0C4A8"/>
                          <ellipse cx="162.5" cy="80" rx="1.8" ry="2.5" fill="#E8B898"/>
                          <ellipse cx="194" cy="80" rx="3" ry="4" fill="#F0C4A8"/>
                          <ellipse cx="193.5" cy="80" rx="1.8" ry="2.5" fill="#E8B898"/>
                          {/* Child eyes */}
                          <ellipse cx="173" cy="78" rx="3.5" ry="4" fill="white"/>
                          <ellipse cx="183" cy="78" rx="3.5" ry="4" fill="white"/>
                          <motion.ellipse animate={{ scaleY: [1, 0.05, 1] }} transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 3.5, ease: "easeInOut", delay: 1.2 }} style={{ originX: "173px", originY: "79px" }} cx="173" cy="79" rx="2.2" ry="2.7" fill="#1A1A2E"/>
                          <motion.ellipse animate={{ scaleY: [1, 0.05, 1] }} transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 3.5, ease: "easeInOut", delay: 1.2 }} style={{ originX: "183px", originY: "79px" }} cx="183" cy="79" rx="2.2" ry="2.7" fill="#1A1A2E"/>
                          {/* Child eyebrows */}
                          <path d="M168 72 Q173 70 178 72" stroke="#4A3728" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                          <path d="M178 72 Q183 70 188 72" stroke="#4A3728" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                          {/* Child nose */}
                          <path d="M176 84 Q178 87 180 84" stroke="#E8B898" strokeWidth="1" fill="none"/>
                          {/* Child mouth */}
                          <path d="M171 89 Q178 93 185 89" stroke="#DDA68A" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                          {/* Child cheeks */}
                          <ellipse cx="168" cy="87" rx="4.5" ry="2.8" fill="#FFB4A2" opacity="0.3"/>
                          <ellipse cx="188" cy="87" rx="4.5" ry="2.8" fill="#FFB4A2" opacity="0.3"/>
                          {/* Child neck */}
                          <rect x="174" y="96" width="7" height="9" fill="#F0C4A8"/>
                          {/* Child body blue */}
                          <path d="M161 105 C161 103 167 101 178 101 C189 101 195 103 195 105 L197 150 L159 150 Z" fill="#6CB4EE"/>
                          {/* Child legs */}
                          <path d="M168 150 L166 186 L173 186 L176 154 Z" fill="#4A3728"/>
                          <path d="M188 150 L190 186 L183 186 L180 154 Z" fill="#4A3728"/>
                          {/* Child shoes */}
                          <ellipse cx="169" cy="187" rx="6.5" ry="3" fill="#1A1A2E"/>
                          <ellipse cx="187" cy="187" rx="6.5" ry="3" fill="#1A1A2E"/>
                          {/* Child arms */}
                          <path d="M161 107 L142 121 L147 124 L165 110 Z" fill="#6CB4EE"/>
                          <path d="M195 107 L208 120 L203 123 L191 110 Z" fill="#6CB4EE"/>
                          {/* Child fingers reaching */}
                          <path d="M143 119 L140 115 L137 118 L140 122Z" fill="#F0C4A8"/>
                          <path d="M141 122 L138 118 L135 121 L138 125Z" fill="#F0C4A8"/>
                        </motion.g>
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
                      {/* Ground shadow */}
                      <ellipse cx="130" cy="194" rx="52" ry="5" fill="#000" opacity="0.06"/>
                      {/* Sparkle pulses */}
                      <motion.circle animate={{ scale: [1, 1.5, 1], opacity: [0.15, 0.4, 0.15] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }} cx="38" cy="40" r="5" fill="#FFE082"/>
                      <motion.circle animate={{ scale: [1, 1.5, 1], opacity: [0.15, 0.4, 0.15] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 1.1 }} cx="222" cy="38" r="4" fill="#6CB4EE"/>
                      <motion.circle animate={{ scale: [1, 1.5, 1], opacity: [0.15, 0.4, 0.15] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.6 }} cx="38" cy="155" r="3" fill="#A5D6A7"/>
                      {/* Body sway */}
                      <motion.g animate={{ y: [0, -1.5, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}>
                        {/* Clipboard prop */}
                        <rect x="148" y="55" width="52" height="68" rx="6" fill="white" stroke="#B0BEC5" strokeWidth="1.5"/>
                        <rect x="155" y="64" width="38" height="5" rx="2.5" fill="#CFD8DC"/>
                        <rect x="155" y="74" width="28" height="5" rx="2.5" fill="#CFD8DC"/>
                        <rect x="155" y="84" width="34" height="5" rx="2.5" fill="#CFD8DC"/>
                        <rect x="155" y="94" width="22" height="5" rx="2.5" fill="#CFD8DC"/>
                        <rect x="155" y="104" width="30" height="5" rx="2.5" fill="#CFD8DC"/>
                        {/* Clipboard clip */}
                        <rect x="165" y="51" width="18" height="10" rx="4" fill="#90A4AE"/>
                        <rect x="168" y="53" width="12" height="6" rx="2" fill="#B0BEC5"/>
                        {/* Person — head */}
                        <ellipse cx="100" cy="68" rx="20" ry="22" fill="#F0C4A8"/>
                        {/* Hair — neat parted */}
                        <path d="M80 64 C80 47 88 41 100 41 C112 41 120 47 120 64 C116 53 108 50 100 50 C92 50 84 53 80 64Z" fill="#1A1A2E"/>
                        <path d="M98 41 C98 45 99 50 100 50 C101 50 102 45 102 41" fill="#1A1A2E"/>
                        {/* Ears */}
                        <ellipse cx="80" cy="68" rx="4" ry="5" fill="#F0C4A8"/>
                        <ellipse cx="80.5" cy="68" rx="2.2" ry="3" fill="#E8B898"/>
                        <ellipse cx="120" cy="68" rx="4" ry="5" fill="#F0C4A8"/>
                        <ellipse cx="119.5" cy="68" rx="2.2" ry="3" fill="#E8B898"/>
                        {/* Eyes */}
                        <ellipse cx="93" cy="66" rx="4" ry="4.5" fill="white"/>
                        <ellipse cx="107" cy="66" rx="4" ry="4.5" fill="white"/>
                        <motion.ellipse animate={{ scaleY: [1, 0.05, 1] }} transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 3.5, ease: "easeInOut" }} style={{ originX: "93px", originY: "67px" }} cx="93" cy="67" rx="2.5" ry="3" fill="#1A1A2E"/>
                        <motion.ellipse animate={{ scaleY: [1, 0.05, 1] }} transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 3.5, ease: "easeInOut" }} style={{ originX: "107px", originY: "67px" }} cx="107" cy="67" rx="2.5" ry="3" fill="#1A1A2E"/>
                        {/* Eyebrows */}
                        <path d="M88 59 Q93 57 98 59" stroke="#1A1A2E" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                        <path d="M102 59 Q107 57 112 59" stroke="#1A1A2E" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                        {/* Nose */}
                        <path d="M98 73 Q100 76 102 73" stroke="#E8B898" strokeWidth="1" fill="none"/>
                        {/* Mouth */}
                        <path d="M92 80 Q100 85 108 80" stroke="#DDA68A" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                        {/* Cheeks */}
                        <ellipse cx="87" cy="77" rx="6" ry="3.5" fill="#FFB4A2" opacity="0.3"/>
                        <ellipse cx="113" cy="77" rx="6" ry="3.5" fill="#FFB4A2" opacity="0.3"/>
                        {/* Neck */}
                        <rect x="96" y="88" width="8" height="10" fill="#F0C4A8"/>
                        {/* Body — blue shirt */}
                        <path d="M78 98 C78 96 85 94 100 94 C115 94 122 96 122 98 L125 150 L75 150 Z" fill="#6CB4EE"/>
                        {/* Collar detail */}
                        <path d="M96 94 L100 100 L104 94" stroke="#5BA4D9" strokeWidth="1" fill="none"/>
                        {/* Legs */}
                        <path d="M87 150 L84 187 L92 187 L96 154 Z" fill="#4A3728"/>
                        <path d="M113 150 L116 187 L108 187 L104 154 Z" fill="#4A3728"/>
                        {/* Shoes */}
                        <ellipse cx="88" cy="188" rx="8" ry="3.5" fill="#1A1A2E"/>
                        <ellipse cx="112" cy="188" rx="8" ry="3.5" fill="#1A1A2E"/>
                        {/* Right arm holding clipboard */}
                        <path d="M122 100 L148 88 L145 82 L119 95 Z" fill="#6CB4EE"/>
                        {/* Right hand fingers */}
                        <path d="M145 80 C147 78 150 79 149 82 L146 83Z" fill="#F0C4A8"/>
                        <path d="M147 83 C149 81 152 82 151 85 L148 86Z" fill="#F0C4A8"/>
                        <path d="M146 86 C148 84 151 85 150 88 L147 89Z" fill="#F0C4A8"/>
                        {/* Left arm */}
                        <path d="M78 100 L63 118 L68 121 L82 104 Z" fill="#6CB4EE"/>
                        {/* Left hand */}
                        <path d="M61 116 C59 118 60 122 63 121 L65 119Z" fill="#F0C4A8"/>
                        <path d="M63 120 C61 122 62 126 65 125 L67 123Z" fill="#F0C4A8"/>
                        {/* Download arrow (bouncing) */}
                        <motion.g animate={{ y: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
                          <circle cx="210" cy="155" r="16" fill="#6CB4EE"/>
                          <path d="M210 145 L210 161" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                          <path d="M204 156 L210 163 L216 156" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </motion.g>
                      </motion.g>
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
                      {/* Ground shadow */}
                      <ellipse cx="130" cy="194" rx="52" ry="5" fill="#000" opacity="0.06"/>
                      {/* Warning triangle — pulsing */}
                      <motion.g animate={{ scale: [1, 1.08, 1], opacity: [0.85, 1, 0.85] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
                        <path d="M52 148 L78 102 L104 148 Z" fill="#FFE082" stroke="#FFB300" strokeWidth="1.5"/>
                        <rect x="76" y="113" width="4" height="18" rx="2" fill="#795548"/>
                        <circle cx="78" cy="140" r="2.5" fill="#795548"/>
                      </motion.g>
                      {/* Sparkles */}
                      <motion.circle animate={{ scale: [1, 1.5, 1], opacity: [0.15, 0.4, 0.15] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }} cx="218" cy="40" r="4" fill="#CE93D8"/>
                      <motion.circle animate={{ scale: [1, 1.5, 1], opacity: [0.15, 0.4, 0.15] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 1.0 }} cx="218" cy="155" r="3" fill="#FFE082"/>
                      <motion.circle animate={{ scale: [1, 1.5, 1], opacity: [0.15, 0.4, 0.15] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} cx="38" cy="100" r="3" fill="#FFE082"/>
                      {/* Body sway */}
                      <motion.g animate={{ y: [0, -1.5, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}>
                        {/* Head */}
                        <ellipse cx="155" cy="70" rx="20" ry="22" fill="#F0C4A8"/>
                        {/* Hair bun */}
                        <path d="M135 65 C135 48 143 42 155 42 C167 42 175 48 175 65 C172 57 167 54 155 54 C143 54 138 57 135 65Z" fill="#CE93D8"/>
                        {/* Bun on top */}
                        <path d="M148 46 C148 38 152 35 155 35 C158 35 162 38 162 46 C162 50 158 52 155 52 C152 52 148 50 148 46Z" fill="#CE93D8"/>
                        {/* Bun shadow */}
                        <path d="M150 46 C150 42 153 40 155 40 C157 40 160 42 160 46" stroke="#B07CC6" strokeWidth="1" fill="none"/>
                        {/* Ears */}
                        <ellipse cx="135" cy="70" rx="4" ry="5" fill="#F0C4A8"/>
                        <ellipse cx="135.5" cy="70" rx="2.2" ry="3" fill="#E8B898"/>
                        <ellipse cx="175" cy="70" rx="4" ry="5" fill="#F0C4A8"/>
                        <ellipse cx="174.5" cy="70" rx="2.2" ry="3" fill="#E8B898"/>
                        {/* Eyes — slightly worried */}
                        <ellipse cx="148" cy="68" rx="4" ry="4.5" fill="white"/>
                        <ellipse cx="162" cy="68" rx="4" ry="4.5" fill="white"/>
                        <motion.ellipse animate={{ scaleY: [1, 0.05, 1] }} transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 3.5, ease: "easeInOut" }} style={{ originX: "148px", originY: "69px" }} cx="148" cy="69" rx="2.5" ry="3" fill="#1A1A2E"/>
                        <motion.ellipse animate={{ scaleY: [1, 0.05, 1] }} transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 3.5, ease: "easeInOut" }} style={{ originX: "162px", originY: "69px" }} cx="162" cy="69" rx="2.5" ry="3" fill="#1A1A2E"/>
                        {/* Worried eyebrows (raised inner) */}
                        <path d="M143 61 Q148 58 153 62" stroke="#CE93D8" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
                        <path d="M157 62 Q162 58 167 61" stroke="#CE93D8" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
                        {/* Nose */}
                        <path d="M153 75 Q155 78 157 75" stroke="#E8B898" strokeWidth="1" fill="none"/>
                        {/* Concerned mouth (slightly down) */}
                        <path d="M149 83 Q155 80 161 83" stroke="#DDA68A" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                        {/* Sweat drop on forehead */}
                        <path d="M170 52 C170 49 172 47 172 50 C172 52 170 53 170 52Z" fill="#90CAF9" opacity="0.7"/>
                        {/* Cheeks */}
                        <ellipse cx="143" cy="78" rx="6" ry="3.5" fill="#FFB4A2" opacity="0.3"/>
                        <ellipse cx="167" cy="78" rx="6" ry="3.5" fill="#FFB4A2" opacity="0.3"/>
                        {/* Neck */}
                        <rect x="151" y="90" width="8" height="10" fill="#F0C4A8"/>
                        {/* Body — light purple top */}
                        <path d="M133 100 C133 98 140 96 155 96 C170 96 177 98 177 100 L180 152 L130 152 Z" fill="#CE93D8"/>
                        {/* Collar */}
                        <path d="M151 96 L155 102 L159 96" stroke="#B07CC6" strokeWidth="1" fill="none"/>
                        {/* Legs */}
                        <path d="M142 152 L139 188 L147 188 L151 156 Z" fill="#4A3728"/>
                        <path d="M168 152 L171 188 L163 188 L159 156 Z" fill="#4A3728"/>
                        {/* Shoes */}
                        <ellipse cx="143" cy="189" rx="8" ry="3.5" fill="#1A1A2E"/>
                        <ellipse cx="167" cy="189" rx="8" ry="3.5" fill="#1A1A2E"/>
                        {/* Arms slightly raised in caution */}
                        <path d="M133 102 L116 88 L119 83 L135 97 Z" fill="#CE93D8"/>
                        <path d="M177 102 L194 88 L191 83 L175 97 Z" fill="#CE93D8"/>
                        {/* Left hand */}
                        <path d="M114 86 C112 83 114 80 116 82 L117 85Z" fill="#F0C4A8"/>
                        <path d="M116 83 C114 80 116 77 118 79 L119 82Z" fill="#F0C4A8"/>
                        {/* Right hand */}
                        <path d="M196 86 C198 83 196 80 194 82 L193 85Z" fill="#F0C4A8"/>
                        <path d="M194 83 C196 80 194 77 192 79 L191 82Z" fill="#F0C4A8"/>
                      </motion.g>
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
                      {/* Ground shadow */}
                      <ellipse cx="130" cy="194" rx="60" ry="5" fill="#000" opacity="0.06"/>
                      {/* Sparkle pulses */}
                      <motion.circle animate={{ scale: [1, 1.5, 1], opacity: [0.15, 0.4, 0.15] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }} cx="130" cy="20" r="4" fill="#FFE082"/>
                      <motion.circle animate={{ scale: [1, 1.5, 1], opacity: [0.15, 0.4, 0.15] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.9 }} cx="32" cy="50" r="3" fill="#A5D6A7"/>
                      <motion.circle animate={{ scale: [1, 1.5, 1], opacity: [0.15, 0.4, 0.15] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} cx="228" cy="55" r="3" fill="#6CB4EE"/>
                      {/* Body sway wrapper — all characters */}
                      <motion.g animate={{ y: [0, -1.5, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}>
                        {/* ─── Giver (left, green shirt) ─── */}
                        {/* Head */}
                        <ellipse cx="68" cy="76" rx="18" ry="20" fill="#F0C4A8"/>
                        {/* Hair — wavy */}
                        <path d="M50 72 C50 56 58 50 68 50 C78 50 86 56 86 72 C83 62 78 59 68 59 C58 59 53 62 50 72Z" fill="#4A3728"/>
                        <path d="M50 68 C52 62 54 62 56 66 C58 62 60 62 62 66" stroke="#4A3728" strokeWidth="2" fill="none"/>
                        {/* Ears */}
                        <ellipse cx="50" cy="76" rx="3.5" ry="4.5" fill="#F0C4A8"/>
                        <ellipse cx="50.5" cy="76" rx="2" ry="2.8" fill="#E8B898"/>
                        <ellipse cx="86" cy="76" rx="3.5" ry="4.5" fill="#F0C4A8"/>
                        <ellipse cx="85.5" cy="76" rx="2" ry="2.8" fill="#E8B898"/>
                        {/* Eyes */}
                        <ellipse cx="62" cy="74" rx="3.5" ry="4" fill="white"/>
                        <ellipse cx="74" cy="74" rx="3.5" ry="4" fill="white"/>
                        <motion.ellipse animate={{ scaleY: [1, 0.05, 1] }} transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 3.5, ease: "easeInOut" }} style={{ originX: "62px", originY: "75px" }} cx="62" cy="75" rx="2.2" ry="2.7" fill="#1A1A2E"/>
                        <motion.ellipse animate={{ scaleY: [1, 0.05, 1] }} transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 3.5, ease: "easeInOut" }} style={{ originX: "74px", originY: "75px" }} cx="74" cy="75" rx="2.2" ry="2.7" fill="#1A1A2E"/>
                        {/* Eyebrows */}
                        <path d="M57 67 Q62 65 67 67" stroke="#4A3728" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                        <path d="M69 67 Q74 65 79 67" stroke="#4A3728" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                        {/* Nose */}
                        <path d="M66 80 Q68 83 70 80" stroke="#E8B898" strokeWidth="1" fill="none"/>
                        {/* Mouth smiling */}
                        <path d="M61 86 Q68 91 75 86" stroke="#DDA68A" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                        {/* Cheeks */}
                        <ellipse cx="57" cy="83" rx="5" ry="3" fill="#FFB4A2" opacity="0.3"/>
                        <ellipse cx="79" cy="83" rx="5" ry="3" fill="#FFB4A2" opacity="0.3"/>
                        {/* Neck */}
                        <rect x="64" y="94" width="8" height="9" fill="#F0C4A8"/>
                        {/* Body — green shirt */}
                        <path d="M48 103 C48 101 55 99 68 99 C81 99 88 101 88 103 L91 152 L45 152 Z" fill="#A5D6A7"/>
                        {/* Collar */}
                        <path d="M64 99 L68 105 L72 99" stroke="#81C784" strokeWidth="1" fill="none"/>
                        {/* Legs */}
                        <path d="M58 152 L55 188 L63 188 L67 156 Z" fill="#4A3728"/>
                        <path d="M78 152 L81 188 L73 188 L69 156 Z" fill="#4A3728"/>
                        {/* Shoes */}
                        <ellipse cx="59" cy="189" rx="7" ry="3.5" fill="#1A1A2E"/>
                        <ellipse cx="77" cy="189" rx="7" ry="3.5" fill="#1A1A2E"/>
                        {/* Giver — arm extended forward holding gift */}
                        <path d="M88 105 L115 118 L112 124 L86 111 Z" fill="#A5D6A7"/>
                        {/* Giver hand/fingers */}
                        <path d="M113 122 L117 118 L120 122 L116 126Z" fill="#F0C4A8"/>
                        <path d="M116 124 L120 120 L123 124 L119 128Z" fill="#F0C4A8"/>
                        {/* Giver other arm */}
                        <path d="M48 105 L36 120 L41 123 L52 108 Z" fill="#A5D6A7"/>

                        {/* ─── Floating gift box ─── */}
                        <motion.g animate={{ y: [0, -5, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}>
                          <rect x="108" y="100" width="44" height="44" rx="4" fill="#FFCCBC" stroke="#FF8A65" strokeWidth="1.5"/>
                          {/* Gift ribbon vertical */}
                          <rect x="127" y="100" width="6" height="44" fill="#EF5350" opacity="0.7"/>
                          {/* Gift ribbon horizontal */}
                          <rect x="108" y="119" width="44" height="6" fill="#EF5350" opacity="0.7"/>
                          {/* Gift bow left */}
                          <path d="M127 100 C120 92 112 94 114 100 C116 106 127 103 127 100Z" fill="#EF5350"/>
                          {/* Gift bow right */}
                          <path d="M133 100 C140 92 148 94 146 100 C144 106 133 103 133 100Z" fill="#EF5350"/>
                          {/* Bow center */}
                          <circle cx="130" cy="100" r="4" fill="#C62828"/>
                        </motion.g>

                        {/* ─── Receiver (right, blue shirt) ─── */}
                        {/* Head */}
                        <ellipse cx="192" cy="76" rx="18" ry="20" fill="#F0C4A8"/>
                        {/* Hair — short neat */}
                        <path d="M174 72 C174 56 182 50 192 50 C202 50 210 56 210 72 C207 62 202 59 192 59 C182 59 177 62 174 72Z" fill="#1A1A2E"/>
                        {/* Ears */}
                        <ellipse cx="174" cy="76" rx="3.5" ry="4.5" fill="#F0C4A8"/>
                        <ellipse cx="174.5" cy="76" rx="2" ry="2.8" fill="#E8B898"/>
                        <ellipse cx="210" cy="76" rx="3.5" ry="4.5" fill="#F0C4A8"/>
                        <ellipse cx="209.5" cy="76" rx="2" ry="2.8" fill="#E8B898"/>
                        {/* Eyes */}
                        <ellipse cx="186" cy="74" rx="3.5" ry="4" fill="white"/>
                        <ellipse cx="198" cy="74" rx="3.5" ry="4" fill="white"/>
                        <motion.ellipse animate={{ scaleY: [1, 0.05, 1] }} transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 3.5, ease: "easeInOut", delay: 1.5 }} style={{ originX: "186px", originY: "75px" }} cx="186" cy="75" rx="2.2" ry="2.7" fill="#1A1A2E"/>
                        <motion.ellipse animate={{ scaleY: [1, 0.05, 1] }} transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 3.5, ease: "easeInOut", delay: 1.5 }} style={{ originX: "198px", originY: "75px" }} cx="198" cy="75" rx="2.2" ry="2.7" fill="#1A1A2E"/>
                        {/* Eyebrows */}
                        <path d="M181 67 Q186 65 191 67" stroke="#1A1A2E" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                        <path d="M193 67 Q198 65 203 67" stroke="#1A1A2E" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                        {/* Nose */}
                        <path d="M190 80 Q192 83 194 80" stroke="#E8B898" strokeWidth="1" fill="none"/>
                        {/* Mouth happy */}
                        <path d="M185 86 Q192 91 199 86" stroke="#DDA68A" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                        {/* Cheeks */}
                        <ellipse cx="181" cy="83" rx="5" ry="3" fill="#FFB4A2" opacity="0.3"/>
                        <ellipse cx="203" cy="83" rx="5" ry="3" fill="#FFB4A2" opacity="0.3"/>
                        {/* Neck */}
                        <rect x="188" y="94" width="8" height="9" fill="#F0C4A8"/>
                        {/* Body — blue shirt */}
                        <path d="M172 103 C172 101 179 99 192 99 C205 99 212 101 212 103 L215 152 L169 152 Z" fill="#6CB4EE"/>
                        {/* Collar */}
                        <path d="M188 99 L192 105 L196 99" stroke="#5BA4D9" strokeWidth="1" fill="none"/>
                        {/* Legs */}
                        <path d="M182 152 L179 188 L187 188 L191 156 Z" fill="#4A3728"/>
                        <path d="M202 152 L205 188 L197 188 L193 156 Z" fill="#4A3728"/>
                        {/* Shoes */}
                        <ellipse cx="183" cy="189" rx="7" ry="3.5" fill="#1A1A2E"/>
                        <ellipse cx="201" cy="189" rx="7" ry="3.5" fill="#1A1A2E"/>
                        {/* Receiver — arms reaching forward toward gift */}
                        <path d="M172 105 L145 118 L148 124 L174 111 Z" fill="#6CB4EE"/>
                        {/* Receiver hand/fingers */}
                        <path d="M147 122 L143 118 L140 122 L144 126Z" fill="#F0C4A8"/>
                        <path d="M144 124 L140 120 L137 124 L141 128Z" fill="#F0C4A8"/>
                        {/* Receiver other arm */}
                        <path d="M212 105 L224 120 L219 123 L208 108 Z" fill="#6CB4EE"/>
                      </motion.g>
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
                      {/* Ground shadow */}
                      <ellipse cx="130" cy="194" rx="52" ry="5" fill="#000" opacity="0.06"/>
                      {/* Floating gold coins with staggered animation */}
                      <motion.g animate={{ y: [0, -6, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
                        <circle cx="58" cy="75" r="16" fill="#FFE082" stroke="#FFB300" strokeWidth="1.5"/>
                        <circle cx="58" cy="75" r="10" stroke="#FFB300" strokeWidth="1" fill="none"/>
                        <line x1="54" y1="70" x2="54" y2="80" stroke="#FFB300" strokeWidth="1"/>
                        <line x1="58" y1="69" x2="58" y2="79" stroke="#FFB300" strokeWidth="1"/>
                        <line x1="62" y1="70" x2="62" y2="80" stroke="#FFB300" strokeWidth="1"/>
                      </motion.g>
                      <motion.g animate={{ y: [0, -6, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}>
                        <circle cx="202" cy="65" r="14" fill="#FFE082" stroke="#FFB300" strokeWidth="1.5"/>
                        <circle cx="202" cy="65" r="9" stroke="#FFB300" strokeWidth="1" fill="none"/>
                        <line x1="198" y1="61" x2="198" y2="69" stroke="#FFB300" strokeWidth="1"/>
                        <line x1="202" y1="60" x2="202" y2="70" stroke="#FFB300" strokeWidth="1"/>
                        <line x1="206" y1="61" x2="206" y2="69" stroke="#FFB300" strokeWidth="1"/>
                      </motion.g>
                      <motion.g animate={{ y: [0, -6, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}>
                        <circle cx="40" cy="135" r="11" fill="#FFE082" stroke="#FFB300" strokeWidth="1.5"/>
                        <circle cx="40" cy="135" r="7" stroke="#FFB300" strokeWidth="1" fill="none"/>
                        <line x1="37" y1="131" x2="37" y2="139" stroke="#FFB300" strokeWidth="1"/>
                        <line x1="40" y1="130" x2="40" y2="140" stroke="#FFB300" strokeWidth="1"/>
                        <line x1="43" y1="131" x2="43" y2="139" stroke="#FFB300" strokeWidth="1"/>
                      </motion.g>
                      <motion.g animate={{ y: [0, -6, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}>
                        <circle cx="222" cy="130" r="12" fill="#FFE082" stroke="#FFB300" strokeWidth="1.5"/>
                        <circle cx="222" cy="130" r="8" stroke="#FFB300" strokeWidth="1" fill="none"/>
                        <line x1="218" y1="126" x2="218" y2="134" stroke="#FFB300" strokeWidth="1"/>
                        <line x1="222" y1="125" x2="222" y2="135" stroke="#FFB300" strokeWidth="1"/>
                        <line x1="226" y1="126" x2="226" y2="134" stroke="#FFB300" strokeWidth="1"/>
                      </motion.g>
                      <motion.g animate={{ y: [0, -6, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}>
                        <circle cx="130" cy="30" r="10" fill="#FFE082" stroke="#FFB300" strokeWidth="1.5"/>
                        <circle cx="130" cy="30" r="6" stroke="#FFB300" strokeWidth="1" fill="none"/>
                        <line x1="127" y1="26" x2="127" y2="34" stroke="#FFB300" strokeWidth="1"/>
                        <line x1="130" y1="25" x2="130" y2="35" stroke="#FFB300" strokeWidth="1"/>
                        <line x1="133" y1="26" x2="133" y2="34" stroke="#FFB300" strokeWidth="1"/>
                      </motion.g>
                      {/* Body sway */}
                      <motion.g animate={{ y: [0, -1.5, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}>
                        {/* Head */}
                        <ellipse cx="130" cy="80" rx="20" ry="22" fill="#F0C4A8"/>
                        {/* Spiky/messy hair */}
                        <path d="M110 76 C110 59 118 53 130 53 C142 53 150 59 150 76" fill="#2C2C2C"/>
                        <path d="M110 68 C112 58 113 55 115 60 C117 50 119 48 121 55 C123 47 124 44 127 52 C129 44 131 42 133 50 C135 44 137 47 139 55 C141 50 143 52 145 60 C147 55 148 58 150 68" fill="#2C2C2C"/>
                        {/* Ears */}
                        <ellipse cx="110" cy="80" rx="4" ry="5" fill="#F0C4A8"/>
                        <ellipse cx="110.5" cy="80" rx="2.2" ry="3" fill="#E8B898"/>
                        <ellipse cx="150" cy="80" rx="4" ry="5" fill="#F0C4A8"/>
                        <ellipse cx="149.5" cy="80" rx="2.2" ry="3" fill="#E8B898"/>
                        {/* Eyes */}
                        <ellipse cx="123" cy="78" rx="4" ry="4.5" fill="white"/>
                        <ellipse cx="137" cy="78" rx="4" ry="4.5" fill="white"/>
                        <motion.ellipse animate={{ scaleY: [1, 0.05, 1] }} transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 3.5, ease: "easeInOut" }} style={{ originX: "123px", originY: "79px" }} cx="123" cy="79" rx="2.5" ry="3" fill="#1A1A2E"/>
                        <motion.ellipse animate={{ scaleY: [1, 0.05, 1] }} transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 3.5, ease: "easeInOut" }} style={{ originX: "137px", originY: "79px" }} cx="137" cy="79" rx="2.5" ry="3" fill="#1A1A2E"/>
                        {/* Eyebrows */}
                        <path d="M118 71 Q123 68 128 71" stroke="#2C2C2C" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                        <path d="M132 71 Q137 68 142 71" stroke="#2C2C2C" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                        {/* Nose */}
                        <path d="M128 85 Q130 88 132 85" stroke="#E8B898" strokeWidth="1" fill="none"/>
                        {/* Wide celebrating smile */}
                        <path d="M120 92 Q130 100 140 92" stroke="#DDA68A" strokeWidth="2" fill="none" strokeLinecap="round"/>
                        <path d="M122 93 Q130 99 138 93" fill="#FFCCBC" opacity="0.5"/>
                        {/* Cheeks */}
                        <ellipse cx="116" cy="87" rx="6.5" ry="4" fill="#FFB4A2" opacity="0.3"/>
                        <ellipse cx="144" cy="87" rx="6.5" ry="4" fill="#FFB4A2" opacity="0.3"/>
                        {/* Neck */}
                        <rect x="126" y="100" width="8" height="10" fill="#F0C4A8"/>
                        {/* Body — coral shirt */}
                        <path d="M108 110 C108 108 115 106 130 106 C145 106 152 108 152 110 L155 158 L105 158 Z" fill="#FF8A80"/>
                        {/* Collar */}
                        <path d="M126 106 L130 112 L134 106" stroke="#FFAB91" strokeWidth="1" fill="none"/>
                        {/* Legs */}
                        <path d="M118 158 L115 188 L123 188 L127 162 Z" fill="#4A3728"/>
                        <path d="M142 158 L145 188 L137 188 L133 162 Z" fill="#4A3728"/>
                        {/* Shoes */}
                        <ellipse cx="119" cy="189" rx="8" ry="3.5" fill="#1A1A2E"/>
                        <ellipse cx="141" cy="189" rx="8" ry="3.5" fill="#1A1A2E"/>
                        {/* Arms up in celebration */}
                        <path d="M108 112 L90 85 L96 82 L113 108 Z" fill="#FF8A80"/>
                        <path d="M152 112 L170 85 L164 82 L147 108 Z" fill="#FF8A80"/>
                        {/* Left hand with spread fingers */}
                        <path d="M88 83 C86 80 88 77 90 79 L91 82Z" fill="#F0C4A8"/>
                        <path d="M91 80 C89 77 91 74 93 76 L94 79Z" fill="#F0C4A8"/>
                        <path d="M94 79 C92 76 94 73 96 75 L97 78Z" fill="#F0C4A8"/>
                        <path d="M97 80 C95 77 97 75 99 77 L100 80Z" fill="#F0C4A8"/>
                        {/* Right hand with spread fingers */}
                        <path d="M172 83 C174 80 172 77 170 79 L169 82Z" fill="#F0C4A8"/>
                        <path d="M169 80 C171 77 169 74 167 76 L166 79Z" fill="#F0C4A8"/>
                        <path d="M166 79 C168 76 166 73 164 75 L163 78Z" fill="#F0C4A8"/>
                        <path d="M163 80 C165 77 163 75 161 77 L160 80Z" fill="#F0C4A8"/>
                      </motion.g>
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
                      {/* Ground shadow */}
                      <ellipse cx="130" cy="194" rx="52" ry="5" fill="#000" opacity="0.06"/>
                      {/* Sparkle pulses around ticket */}
                      <motion.circle animate={{ scale: [1, 1.5, 1], opacity: [0.15, 0.4, 0.15] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }} cx="165" cy="55" r="5" fill="#FFE082"/>
                      <motion.circle animate={{ scale: [1, 1.5, 1], opacity: [0.15, 0.4, 0.15] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.7 }} cx="195" cy="80" r="4" fill="#CE93D8"/>
                      <motion.circle animate={{ scale: [1, 1.5, 1], opacity: [0.15, 0.4, 0.15] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 1.3 }} cx="170" cy="105" r="3" fill="#FFE082"/>
                      <motion.circle animate={{ scale: [1, 1.5, 1], opacity: [0.15, 0.4, 0.15] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }} cx="38" cy="70" r="3" fill="#A5D6A7"/>
                      {/* Body sway */}
                      <motion.g animate={{ y: [0, -1.5, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}>
                        {/* Head */}
                        <ellipse cx="95" cy="72" rx="20" ry="22" fill="#F0C4A8"/>
                        {/* Long straight hair */}
                        <path d="M75 68 C75 51 83 45 95 45 C107 45 115 51 115 68 C112 58 108 55 95 55 C82 55 78 58 75 68Z" fill="#2C2C2C"/>
                        {/* Hair flowing down sides past shoulders */}
                        <path d="M75 68 C73 80 72 100 73 125 C74 130 77 130 78 125 C79 115 79 95 80 85" fill="#2C2C2C"/>
                        <path d="M115 68 C117 80 118 100 117 125 C116 130 113 130 112 125 C111 115 111 95 110 85" fill="#2C2C2C"/>
                        {/* Ears */}
                        <ellipse cx="75" cy="72" rx="4" ry="5" fill="#F0C4A8"/>
                        <ellipse cx="75.5" cy="72" rx="2.2" ry="3" fill="#E8B898"/>
                        <ellipse cx="115" cy="72" rx="4" ry="5" fill="#F0C4A8"/>
                        <ellipse cx="114.5" cy="72" rx="2.2" ry="3" fill="#E8B898"/>
                        {/* Eyes */}
                        <ellipse cx="88" cy="70" rx="4" ry="4.5" fill="white"/>
                        <ellipse cx="102" cy="70" rx="4" ry="4.5" fill="white"/>
                        <motion.ellipse animate={{ scaleY: [1, 0.05, 1] }} transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 3.5, ease: "easeInOut" }} style={{ originX: "88px", originY: "71px" }} cx="88" cy="71" rx="2.5" ry="3" fill="#1A1A2E"/>
                        <motion.ellipse animate={{ scaleY: [1, 0.05, 1] }} transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 3.5, ease: "easeInOut" }} style={{ originX: "102px", originY: "71px" }} cx="102" cy="71" rx="2.5" ry="3" fill="#1A1A2E"/>
                        {/* Eyebrows */}
                        <path d="M83 63 Q88 61 93 63" stroke="#2C2C2C" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                        <path d="M97 63 Q102 61 107 63" stroke="#2C2C2C" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                        {/* Nose */}
                        <path d="M93 77 Q95 80 97 77" stroke="#E8B898" strokeWidth="1" fill="none"/>
                        {/* Mouth */}
                        <path d="M87 83 Q95 88 103 83" stroke="#DDA68A" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                        {/* Cheeks */}
                        <ellipse cx="82" cy="80" rx="6" ry="3.5" fill="#FFB4A2" opacity="0.3"/>
                        <ellipse cx="108" cy="80" rx="6" ry="3.5" fill="#FFB4A2" opacity="0.3"/>
                        {/* Neck */}
                        <rect x="91" y="92" width="8" height="10" fill="#F0C4A8"/>
                        {/* Body — yellow top */}
                        <path d="M73 102 C73 100 80 98 95 98 C110 98 117 100 117 102 L120 155 L70 155 Z" fill="#FFE082"/>
                        {/* Collar detail */}
                        <path d="M91 98 L95 104 L99 98" stroke="#FFD54F" strokeWidth="1" fill="none"/>
                        {/* Legs */}
                        <path d="M83 155 L80 188 L88 188 L92 159 Z" fill="#4A3728"/>
                        <path d="M107 155 L110 188 L102 188 L98 159 Z" fill="#4A3728"/>
                        {/* Shoes */}
                        <ellipse cx="84" cy="189" rx="8" ry="3.5" fill="#1A1A2E"/>
                        <ellipse cx="106" cy="189" rx="8" ry="3.5" fill="#1A1A2E"/>
                        {/* Right arm raised holding ticket */}
                        <path d="M117 104 L143 75 L138 70 L114 100 Z" fill="#FFE082"/>
                        {/* Right hand */}
                        <path d="M140 68 C138 65 140 62 142 64 L143 67Z" fill="#F0C4A8"/>
                        <path d="M142 65 C140 62 142 59 144 61 L145 64Z" fill="#F0C4A8"/>
                        <path d="M144 64 C142 61 144 58 146 60 L147 63Z" fill="#F0C4A8"/>
                        {/* Left arm relaxed */}
                        <path d="M73 104 L60 125 L65 128 L77 108 Z" fill="#FFE082"/>
                        {/* Left hand */}
                        <path d="M58 123 C56 126 58 129 60 127 L62 125Z" fill="#F0C4A8"/>
                        {/* Floating ticket held up */}
                        <motion.g animate={{ y: [0, -5, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}>
                          {/* Ticket body */}
                          <rect x="148" y="55" width="70" height="42" rx="6" fill="white" stroke="#CE93D8" strokeWidth="1.5"/>
                          {/* Ticket notch left */}
                          <path d="M148 76 C144 76 141 73 141 76 C141 79 144 76 148 76Z" fill="#F5F0FA" stroke="#CE93D8" strokeWidth="1"/>
                          {/* Ticket notch right */}
                          <path d="M218 76 C222 76 225 73 225 76 C225 79 222 76 218 76Z" fill="#F5F0FA" stroke="#CE93D8" strokeWidth="1"/>
                          {/* Dashed center line */}
                          <line x1="148" y1="76" x2="218" y2="76" stroke="#CE93D8" strokeWidth="1" strokeDasharray="5 3"/>
                          {/* Code text representation */}
                          <rect x="158" y="63" width="50" height="7" rx="3.5" fill="#E1BEE7"/>
                          <rect x="163" y="80" width="40" height="6" rx="3" fill="#E1BEE7"/>
                        </motion.g>
                      </motion.g>
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
