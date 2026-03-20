import { useMemo, useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { requestNotificationPermission, scheduleAllHandoverReminders } from '@/lib/notifications';
import { userId as generateUserId } from '@/lib/id';
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
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getStripe, createSetupIntent, listPaymentMethods, deletePaymentMethod, formatCardBrand, type SavedPaymentMethod } from '@/lib/payments';
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

// ─── Stripe sub-forms (bruger useStripe/useElements hooks) ──────────────────

interface StripeFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  keyboardHeight: number;
}

function StripeCardForm({ onSuccess, onCancel, keyboardHeight }: StripeFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);

    const { error: confirmError } = await stripe.confirmSetup({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    });

    if (confirmError) {
      setError(confirmError.message || 'Kunne ikke tilføje kort');
      setLoading(false);
    } else {
      onSuccess();
    }
  };

  return (
    <div className="min-h-[calc(100vh-280px)] flex flex-col" style={{ paddingBottom: keyboardHeight > 0 ? keyboardHeight : undefined }}>
      <div className="space-y-5">
        <h2 className="text-[28px] font-bold text-foreground pb-2">Tilføj kort</h2>
        <div className="rounded-[12px] border-2 border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2 pb-2">
            <Shield className="h-4 w-4 text-green-600" />
            <p className="text-[12px] font-medium text-green-700">Sikker forbindelse — krypteret med Stripe</p>
          </div>
          <CardElement options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#1a1a1a',
                '::placeholder': { color: '#9ca3af' },
                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
              },
              invalid: { color: '#ef4444' },
            },
            hidePostalCode: true,
          }} />
        </div>
        {error && <p className="text-[13px] text-red-500 text-center px-4">{error}</p>}
        <p className="text-[13px] text-muted-foreground text-center px-4">
          Visa/Dankort, Visa Electron, MasterCard, American Express. Dine kortoplysninger opbevares sikkert af Stripe og deles aldrig med Huska.
        </p>
      </div>
      <div className="flex-1" />
      <div className="space-y-2 mt-6">
        <button
          onClick={handleSubmit}
          disabled={loading || !stripe}
          className="w-full rounded-[12px] py-3.5 bg-primary text-white text-[15px] font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? 'Gemmer kort...' : 'Tilføj kort'}
        </button>
        <button onClick={onCancel} className="w-full rounded-[12px] py-3 text-[14px] text-muted-foreground font-medium">
          Annuller
        </button>
      </div>
    </div>
  );
}

function StripeMobilePayForm({ onSuccess, onCancel, keyboardHeight }: StripeFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);

    const { error: confirmError } = await stripe.confirmSetup({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    });

    if (confirmError) {
      setError(confirmError.message || 'Kunne ikke tilknytte MobilePay');
      setLoading(false);
    } else {
      onSuccess();
    }
  };

  return (
    <div className="min-h-[calc(100vh-280px)] flex flex-col" style={{ paddingBottom: keyboardHeight > 0 ? keyboardHeight : undefined }}>
      <div className="space-y-4">
        <h2 className="text-[28px] font-bold text-foreground pb-2">MobilePay</h2>
        <div className="rounded-[12px] bg-[#E8EAF6] p-4 space-y-2">
          <div className="flex items-center gap-3">
            <img src="/images/Mobilepay.jpeg" alt="MobilePay" className="h-10 w-10 rounded-[8px] object-cover" />
            <div>
              <p className="text-[14px] font-medium text-foreground">Betal med MobilePay</p>
              <p className="text-[13px] text-muted-foreground">Tilknyt din MobilePay-konto for hurtig betaling.</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 px-1">
          <Shield className="h-4 w-4 text-green-600" />
          <p className="text-[12px] font-medium text-green-700">Sikker forbindelse via Stripe</p>
        </div>
        {error && <p className="text-[13px] text-red-500 text-center px-4">{error}</p>}
      </div>
      <div className="flex-1" />
      <div className="space-y-2">
        <button
          onClick={handleSubmit}
          disabled={loading || !stripe}
          className="w-full rounded-[12px] py-3.5 text-white text-[15px] font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
          style={{ background: '#5A78FF' }}
        >
          {loading ? 'Tilknytter...' : 'Tilknyt MobilePay'}
        </button>
        <button onClick={onCancel} className="w-full rounded-[12px] py-3 text-[14px] text-muted-foreground font-medium">
          Annuller
        </button>
      </div>
    </div>
  );
}

function StripeApplePayForm({ onSuccess, onCancel, keyboardHeight }: StripeFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);

    const { error: confirmError } = await stripe.confirmSetup({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    });

    if (confirmError) {
      setError(confirmError.message || 'Kunne ikke konfigurere Apple Pay');
      setLoading(false);
    } else {
      onSuccess();
    }
  };

  return (
    <div className="min-h-[calc(100vh-280px)] flex flex-col" style={{ paddingBottom: keyboardHeight > 0 ? keyboardHeight : undefined }}>
      <div className="space-y-4">
        <h2 className="text-[28px] font-bold text-foreground pb-2">Apple Pay</h2>
        <div className="rounded-[12px] bg-muted/50 p-4 space-y-2">
          <div className="flex items-center gap-3">
            <img src="/images/Apple pay .png" alt="Apple Pay" className="h-10 w-10 rounded-[8px] object-contain border border-border bg-white p-0.5" />
            <div>
              <p className="text-[14px] font-medium text-foreground">Betal med Apple Pay</p>
              <p className="text-[13px] text-muted-foreground">Hurtig og sikker betaling med Face ID eller Touch ID.</p>
            </div>
          </div>
        </div>
        <div className="rounded-[12px] border-2 border-border bg-card p-4">
          <CardElement options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#1a1a1a',
                '::placeholder': { color: '#9ca3af' },
                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
              },
              invalid: { color: '#ef4444' },
            },
            hidePostalCode: true,
          }} />
        </div>
        <div className="flex items-center gap-2 px-1">
          <Shield className="h-4 w-4 text-green-600" />
          <p className="text-[12px] font-medium text-green-700">Sikker forbindelse — Apple Pay via Stripe</p>
        </div>
        {error && <p className="text-[13px] text-red-500 text-center px-4">{error}</p>}
      </div>
      <div className="flex-1" />
      <div className="space-y-2">
        <button
          onClick={handleSubmit}
          disabled={loading || !stripe}
          className="w-full rounded-[12px] py-3.5 bg-black text-white text-[15px] font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? 'Konfigurerer...' : 'Konfigurer Apple Pay'}
        </button>
        <button onClick={onCancel} className="w-full rounded-[12px] py-3 text-[14px] text-muted-foreground font-medium">
          Annuller
        </button>
      </div>
    </div>
  );
}

function StripePayPalForm({ onSuccess, onCancel, keyboardHeight }: StripeFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);

    const { error: confirmError } = await stripe.confirmSetup({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    });

    if (confirmError) {
      setError(confirmError.message || 'Kunne ikke tilknytte PayPal');
      setLoading(false);
    } else {
      onSuccess();
    }
  };

  return (
    <div className="min-h-[calc(100vh-280px)] flex flex-col" style={{ paddingBottom: keyboardHeight > 0 ? keyboardHeight : undefined }}>
      <div className="space-y-4">
        <h2 className="text-[28px] font-bold text-foreground pb-2">PayPal</h2>
        <div className="rounded-[12px] bg-[#FFF8E1] p-4 space-y-2">
          <div className="flex items-center gap-3">
            <img src="/images/Paypal.png" alt="PayPal" className="h-10 w-10 rounded-[8px] object-contain border border-border bg-white p-0.5" />
            <div>
              <p className="text-[14px] font-medium text-foreground">Betal med PayPal</p>
              <p className="text-[13px] text-muted-foreground">Log ind med din PayPal-konto for at tilknytte den.</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 px-1">
          <Shield className="h-4 w-4 text-green-600" />
          <p className="text-[12px] font-medium text-green-700">Sikker forbindelse via Stripe + PayPal</p>
        </div>
        {error && <p className="text-[13px] text-red-500 text-center px-4">{error}</p>}
      </div>
      <div className="flex-1" />
      <div className="space-y-2">
        <button
          onClick={handleSubmit}
          disabled={loading || !stripe}
          className="w-full rounded-[12px] py-3.5 text-white text-[15px] font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
          style={{ background: '#0070BA' }}
        >
          {loading ? 'Tilknytter...' : 'Log ind med PayPal'}
        </button>
        <button onClick={onCancel} className="w-full rounded-[12px] py-3 text-[14px] text-muted-foreground font-medium">
          Annuller
        </button>
      </div>
    </div>
  );
}

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
    documents,
    events,
    isProfessionalView,
    setProfessionalView,
    isFamilyMemberView,
    setFamilyMemberView,
    updateUser,
    updateChild,
    setHousehold,
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
  const [savedPaymentMethods, setSavedPaymentMethods] = useState<SavedPaymentMethod[]>([]);
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(false);
  const [addCardLoading, setAddCardLoading] = useState(false);
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
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

  // Hent gemte Stripe-betalingsmetoder
  const fetchSavedPaymentMethods = async () => {
    setPaymentMethodsLoading(true);
    try {
      const methods = await listPaymentMethods();
      setSavedPaymentMethods(methods);
    } catch (err) {
      console.error('Kunne ikke hente betalingsmetoder:', err);
    } finally {
      setPaymentMethodsLoading(false);
    }
  };

  useEffect(() => {
    if (activeSettingsTab === 'betaling') {
      fetchSavedPaymentMethods();
    }
  }, [activeSettingsTab]);

  const handleDeletePaymentMethod = async (pmId: string) => {
    try {
      await deletePaymentMethod(pmId);
      setSavedPaymentMethods((prev) => prev.filter((m) => m.id !== pmId));
      toast.success('Betalingsmetode fjernet');
    } catch {
      toast.error('Kunne ikke fjerne betalingsmetode');
    }
  };

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

  const handleInitAddCard = async () => {
    setAddCardLoading(true);
    try {
      const { clientSecret } = await createSetupIntent(['card']);
      setStripeClientSecret(clientSecret);
      setSettingsDetailView('payment-add-card');
    } catch (err) {
      toast.error('Kunne ikke starte kortregistrering');
      console.error(err);
    } finally {
      setAddCardLoading(false);
    }
  };

  const handleInitMobilePay = async () => {
    setAddCardLoading(true);
    try {
      const { clientSecret } = await createSetupIntent(['mobilepay']);
      setStripeClientSecret(clientSecret);
      setSettingsDetailView('payment-mobilepay');
    } catch (err) {
      toast.error('Kunne ikke starte MobilePay-tilknytning');
      console.error(err);
    } finally {
      setAddCardLoading(false);
    }
  };

  const handleInitPayPal = async () => {
    setAddCardLoading(true);
    try {
      const { clientSecret } = await createSetupIntent(['paypal']);
      setStripeClientSecret(clientSecret);
      setSettingsDetailView('payment-paypal');
    } catch (err) {
      toast.error('Kunne ikke starte PayPal-tilknytning');
      console.error(err);
    } finally {
      setAddCardLoading(false);
    }
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
                    <img src="/illustrations/profile-data.svg" alt="Profil" className="w-[260px] h-[200px] object-contain" />
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
                    <img src="/illustrations/email.svg" alt="Email" className="w-[260px] h-[200px] object-contain" />
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
                    <img src="/illustrations/phone-call.svg" alt="Telefon" className="w-[260px] h-[200px] object-contain" />
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
                    <img src="/illustrations/birthday-cake.svg" alt="Fødselsdag" className="w-[260px] h-[200px] object-contain" />
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
                    <img src="/illustrations/couple.svg" alt="Køn" className="w-[260px] h-[200px] object-contain" />
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
                    <img src="/illustrations/address.svg" alt="Adresse" className="w-[260px] h-[200px] object-contain" />
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
                    <img src="/illustrations/around-the-world.svg" alt="Land" className="w-[260px] h-[200px] object-contain" />
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
                    <img src="/illustrations/family.svg" alt="Familie" className="w-[260px] h-[200px] object-contain" />
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
                      <img src="/illustrations/healthy-habit.svg" alt="Allergener" className="w-[260px] h-[200px] object-contain" />
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
                    <img src="/illustrations/export-files.svg" alt="Eksport" className="w-[260px] h-[200px] object-contain" />
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
                    <img src="/illustrations/warning.svg" alt="Advarsel" className="w-[260px] h-[200px] object-contain" />
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
                    onClick={handleInitAddCard}
                    disabled={addCardLoading}
                    className="flex w-full items-center gap-3 py-3.5 px-1 text-left transition-colors hover:bg-card"
                  >
                    <span className="text-[20px] text-muted-foreground">+</span>
                    <p className="text-[15px] font-medium text-foreground">
                      {addCardLoading ? 'Forbereder...' : 'Tilføj nyt kort'}
                    </p>
                  </button>
                </div>
              </div>

              <div className="border-t border-border mt-2" />

              {/* ─── Andre betalingsmetoder ─── */}
              <div className="pt-3">
                <p className="text-[16px] font-bold text-foreground px-1 pb-2">Andre betalingsmetoder</p>
                <div className="divide-y divide-border">
                  <button
                    onClick={handleInitMobilePay}
                    disabled={addCardLoading}
                    className="flex w-full items-center justify-between py-3.5 px-1 text-left transition-colors hover:bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <img src="/images/Mobilepay.jpeg" alt="MobilePay" className="h-9 w-9 shrink-0 rounded-[6px] object-cover" />
                      <p className="text-[15px] font-medium text-foreground">MobilePay</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                  <button
                    onClick={async () => {
                      setAddCardLoading(true);
                      try {
                        const { clientSecret } = await createSetupIntent(['card']);
                        setStripeClientSecret(clientSecret);
                        setSettingsDetailView('payment-applepay');
                      } catch { toast.error('Kunne ikke starte Apple Pay'); }
                      finally { setAddCardLoading(false); }
                    }}
                    disabled={addCardLoading}
                    className="flex w-full items-center justify-between py-3.5 px-1 text-left transition-colors hover:bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <img src="/images/Apple pay .png" alt="Apple Pay" className="h-9 w-9 shrink-0 rounded-[6px] object-contain border border-border bg-white p-0.5" />
                      <p className="text-[15px] font-medium text-foreground">Apple Pay</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                  <button
                    onClick={handleInitPayPal}
                    disabled={addCardLoading}
                    className="flex w-full items-center justify-between py-3.5 px-1 text-left transition-colors hover:bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <img src="/images/Paypal.png" alt="PayPal" className="h-9 w-9 shrink-0 rounded-[6px] object-contain border border-border bg-white p-0.5" />
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

              {/* ─── Gemte betalingsmetoder ─── */}
              <div className="pt-2">
                <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide px-1 pb-2">Dine betalingsmetoder</p>
                {paymentMethodsLoading ? (
                  <div className="rounded-[8px] border-2 border-dashed border-border bg-card p-4 text-center">
                    <p className="text-[12px] text-muted-foreground">Henter betalingsmetoder...</p>
                  </div>
                ) : savedPaymentMethods.length > 0 ? (
                  <div className="space-y-2">
                    {savedPaymentMethods.map((pm) => (
                      <div key={pm.id} className="flex items-center justify-between rounded-[8px] border-2 border-border bg-card px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-background">
                            {pm.type === 'mobilepay' ? (
                              <img src="/images/Mobilepay.jpeg" alt="MobilePay" className="h-7 w-7 rounded-[4px] object-cover" />
                            ) : pm.type === 'paypal' ? (
                              <img src="/images/Paypal.png" alt="PayPal" className="h-7 w-7 rounded-[4px] object-contain" />
                            ) : pm.isApplePay ? (
                              <img src="/images/Apple pay .png" alt="Apple Pay" className="h-7 w-7 rounded-[4px] object-contain" />
                            ) : (
                              <CreditCard className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-semibold text-foreground">
                              {pm.isApplePay ? 'Apple Pay' : formatCardBrand(pm.brand)}
                              {pm.last4 ? ` ····${pm.last4}` : ''}
                            </p>
                            {pm.expMonth && pm.expYear && (
                              <p className="text-[11px] text-muted-foreground">Udløber {String(pm.expMonth).padStart(2, '0')}/{pm.expYear}</p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeletePaymentMethod(pm.id)}
                          className="shrink-0 rounded-[8px] border-2 border-border px-2.5 py-1 text-[11px] font-semibold text-muted-foreground transition-all active:scale-[0.96]"
                        >
                          Fjern
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[8px] border-2 border-dashed border-border bg-card p-4 text-center">
                    <CreditCard className="mx-auto h-6 w-6 text-muted-foreground mb-1.5" />
                    <p className="text-[12px] text-muted-foreground">Ingen betalingsmetoder tilføjet endnu</p>
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
                    <img src="/illustrations/gift-card.svg" alt="Gavekort" className="w-[260px] h-[200px] object-contain" />
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
                    <img src="/illustrations/savings.svg" alt="Kreditter" className="w-[260px] h-[200px] object-contain" />
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
                    <img src="/illustrations/discount.svg" alt="Indløs" className="w-[260px] h-[200px] object-contain" />
                  </div>
                  <Button className="w-full shrink-0 rounded-[12px] py-3">
                    Indløs
                  </Button>
                </div>
              )}

              {/* ─── Tilføj kort ─── */}
              {/* ─── Tilføj kort (Stripe Elements) ─── */}
              {settingsDetailView === 'payment-add-card' && stripeClientSecret && (
                <Elements stripe={getStripe()} options={{ clientSecret: stripeClientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#f58a2d', borderRadius: '8px' } } }}>
                  <StripeCardForm
                    onSuccess={() => {
                      toast.success('Kort tilføjet!');
                      setStripeClientSecret(null);
                      setSettingsDetailView(null);
                      fetchSavedPaymentMethods();
                    }}
                    onCancel={() => {
                      setStripeClientSecret(null);
                      setSettingsDetailView(null);
                    }}
                    keyboardHeight={keyboardHeight}
                  />
                </Elements>
              )}

              {/* ─── MobilePay (Stripe) ─── */}
              {settingsDetailView === 'payment-mobilepay' && stripeClientSecret && (
                <Elements stripe={getStripe()} options={{ clientSecret: stripeClientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#5A78FF', borderRadius: '8px' } } }}>
                  <StripeMobilePayForm
                    onSuccess={() => {
                      toast.success('MobilePay tilknyttet!');
                      setStripeClientSecret(null);
                      setSettingsDetailView(null);
                      fetchSavedPaymentMethods();
                    }}
                    onCancel={() => {
                      setStripeClientSecret(null);
                      setSettingsDetailView(null);
                    }}
                    keyboardHeight={keyboardHeight}
                  />
                </Elements>
              )}

              {/* ─── Apple Pay ─── */}
              {settingsDetailView === 'payment-applepay' && stripeClientSecret && (
                <Elements stripe={getStripe()} options={{ clientSecret: stripeClientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#000000', borderRadius: '8px' } } }}>
                  <StripeApplePayForm
                    onSuccess={() => {
                      toast.success('Apple Pay konfigureret!');
                      setStripeClientSecret(null);
                      setSettingsDetailView(null);
                      fetchSavedPaymentMethods();
                    }}
                    onCancel={() => {
                      setStripeClientSecret(null);
                      setSettingsDetailView(null);
                    }}
                    keyboardHeight={keyboardHeight}
                  />
                </Elements>
              )}

              {/* ─── PayPal (Stripe) ─── */}
              {settingsDetailView === 'payment-paypal' && stripeClientSecret && (
                <Elements stripe={getStripe()} options={{ clientSecret: stripeClientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#0070BA', borderRadius: '8px' } } }}>
                  <StripePayPalForm
                    onSuccess={() => {
                      toast.success('PayPal tilknyttet!');
                      setStripeClientSecret(null);
                      setSettingsDetailView(null);
                      fetchSavedPaymentMethods();
                    }}
                    onCancel={() => {
                      setStripeClientSecret(null);
                      setSettingsDetailView(null);
                    }}
                    keyboardHeight={keyboardHeight}
                  />
                </Elements>
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
