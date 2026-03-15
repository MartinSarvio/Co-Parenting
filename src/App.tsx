import { Suspense, lazy, useEffect, useState, useCallback, useMemo } from 'react';
import { useAppStore } from '@/store';
import { BottomNav } from '@/components/custom/BottomNav';
import { TopBar } from '@/components/custom/TopBar';
import { Toaster } from '@/components/ui/sonner';
import { ErrorBoundary } from '@/components/custom/ErrorBoundary';
import { supabase } from '@/lib/supabase';
import { fetchMe } from '@/lib/auth';
import { loadInitialData } from '@/lib/dataSync';
import { initPushNotifications } from '@/lib/pushNotifications';
import { startRealtimeSync, stopRealtimeSync } from '@/lib/realtime';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { cn } from '@/lib/utils';
import { ChildVerificationDialog } from '@/components/custom/ChildVerificationDialog';
import './App.css';

const OnboardingFlow = lazy(() =>
  import('@/sections/OnboardingFlow').then((module) => ({ default: module.OnboardingFlow }))
);
const LoginScreen = lazy(() =>
  import('@/sections/LoginScreen').then((module) => ({ default: module.LoginScreen }))
);
const HouseholdSetup = lazy(() =>
  import('@/sections/HouseholdSetup').then((module) => ({ default: module.HouseholdSetup }))
);
const Dashboard = lazy(() =>
  import('@/sections/Dashboard').then((module) => ({ default: module.Dashboard }))
);
const Samversplan = lazy(() =>
  import('@/sections/Samversplan').then((module) => ({ default: module.Samversplan }))
);
const Kalender = lazy(() =>
  import('@/sections/Kalender').then((module) => ({ default: module.Kalender }))
);
const HandoverView = lazy(() =>
  import('@/sections/HandoverView').then((module) => ({ default: module.HandoverView }))
);
const Opgaver = lazy(() =>
  import('@/sections/Opgaver').then((module) => ({ default: module.Opgaver }))
);
const MadOgHjem = lazy(() =>
  import('@/sections/MadOgHjem').then((module) => ({ default: module.MadOgHjem }))
);
const Kommunikation = lazy(() =>
  import('@/sections/Kommunikation').then((module) => ({ default: module.Kommunikation }))
);
const Borneoverblik = lazy(() =>
  import('@/sections/Borneoverblik').then((module) => ({ default: module.Borneoverblik }))
);
const ProfessionalDashboard = lazy(() =>
  import('@/sections/ProfessionalDashboard').then((module) => ({ default: module.ProfessionalDashboard }))
);
const MeetingMinutesView = lazy(() =>
  import('@/sections/MeetingMinutesView').then((module) => ({ default: module.MeetingMinutesView }))
);
const ProfessionalOverview = lazy(() =>
  import('@/sections/ProfessionalOverview').then((module) => ({ default: module.ProfessionalOverview }))
);
const CustodyConfig = lazy(() =>
  import('@/sections/CustodyConfig').then((module) => ({ default: module.CustodyConfig }))
);
const Expenses = lazy(() =>
  import('@/sections/Expenses').then((module) => ({ default: module.Expenses }))
);
const ChildManagement = lazy(() =>
  import('@/sections/ChildManagement').then((module) => ({ default: module.ChildManagement }))
);
const SettingsView = lazy(() =>
  import('@/sections/SettingsView').then((module) => ({ default: module.SettingsView }))
);
const Fotoalbum = lazy(() =>
  import('@/sections/Fotoalbum').then((module) => ({ default: module.Fotoalbum }))
);
const Dagbog = lazy(() =>
  import('@/sections/Dagbog').then((module) => ({ default: module.Dagbog }))
);
const RutinerView = lazy(() =>
  import('@/sections/RutinerView').then((module) => ({ default: module.RutinerView }))
);
const VigtigeDatoer = lazy(() =>
  import('@/sections/VigtigeDatoer').then((module) => ({ default: module.VigtigeDatoer }))
);
const Beslutningslog = lazy(() =>
  import('@/sections/Beslutningslog').then((module) => ({ default: module.Beslutningslog }))
);
const Aarskalender = lazy(() =>
  import('@/sections/Aarskalender').then((module) => ({ default: module.Aarskalender }))
);
const FeedView = lazy(() =>
  import('@/sections/FeedView').then((module) => ({ default: module.FeedView }))
);
const Dokumenter = lazy(() =>
  import('@/sections/Dokumenter').then((module) => ({ default: module.Dokumenter }))
);
const NotifikationsView = lazy(() =>
  import('@/sections/NotifikationsView').then((module) => ({ default: module.NotifikationsView }))
);
const HistorikView = lazy(() =>
  import('@/sections/HistorikView').then((module) => ({ default: module.HistorikView }))
);
const SwapRequest = lazy(() =>
  import('@/sections/SwapRequest').then((module) => ({ default: module.SwapRequest }))
);
const KalenderWeekView = lazy(() =>
  import('@/sections/KalenderWeekView').then((module) => ({ default: module.KalenderWeekView }))
);
const GroupDetailView = lazy(() =>
  import('@/sections/GroupDetailView').then((module) => ({ default: module.GroupDetailView }))
);
const ProfileView = lazy(() =>
  import('@/sections/ProfileView').then((module) => ({ default: module.ProfileView }))
);
const CreateGroupView = lazy(() =>
  import('@/sections/CreateGroupView').then((module) => ({ default: module.CreateGroupView }))
);
const FlyerViewer = lazy(() =>
  import('@/components/custom/FlyerViewer').then((module) => ({ default: module.FlyerViewer }))
);
const FamilieOgBoern = lazy(() =>
  import('@/sections/FamilieOgBoern').then((module) => ({ default: module.FamilieOgBoern }))
);

function SectionLoading() {
  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-lg">
        <div className="h-6 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-3 h-4 w-64 animate-pulse rounded bg-muted/60" />
        <div className="mt-6 space-y-3">
          <div className="h-24 animate-pulse rounded-xl bg-muted/60" />
          <div className="h-24 animate-pulse rounded-xl bg-muted/60" />
        </div>
      </div>
    </div>
  );
}

function App() {
  const { isAuthenticated, isProfessionalView, activeTab, setActiveTab, household, currentUser, children, setCurrentUser, setAuthenticated, hydrateFromServer, logout, isOnline } = useAppStore();
  const [isReady, setIsReady] = useState(false);
  const [authScreen, setAuthScreen] = useState<'login' | 'register'>('login');
  const [childVerified, setChildVerified] = useState(false);
  const [verificationChecked, setVerificationChecked] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const canUseProfessionalView = currentUser?.isAdmin === true || currentUser?.role === 'professional';
  const showProfessionalView = isProfessionalView && canUseProfessionalView;

  // Session restore — check for existing Supabase session on mount
  const restoreSession = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setIsReady(true);
      return;
    }

    try {
      // Validate session and get user profile
      const user = await fetchMe();
      setCurrentUser(user);

      // Load all data from server
      try {
        const data = await loadInitialData();
        hydrateFromServer(data);
      } catch {
        console.warn('Data sync failed — using cached data');
      }

      setAuthenticated(true);

      // Start realtime sync for live-opdateringer
      startRealtimeSync();

      // Initialize push notifications (non-blocking)
      initPushNotifications().catch(console.warn);
    } catch (err: any) {
      // Only logout if session is truly invalid (401), not on network errors
      if (err?.status === 401) {
        stopRealtimeSync();
        await supabase.auth.signOut();
        logout();
      } else {
        // Network error — keep user logged in with cached data
        console.warn('Session restore failed (network?):', err?.message);
        setAuthenticated(true);
      }
    } finally {
      setIsReady(true);
    }
  }, [setCurrentUser, setAuthenticated, hydrateFromServer, logout]);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // Check if current user (parent 2) needs to verify children
  useEffect(() => {
    if (!isAuthenticated || !household || !currentUser) {
      setVerificationChecked(true);
      return;
    }

    const checkVerification = async () => {
      try {
        const { data } = await supabase
          .from('household_members')
          .select('child_verified, role')
          .eq('household_id', household.id)
          .eq('user_id', currentUser.id)
          .single();

        // Only require verification for parent 2 (invited members who haven't verified)
        if (data && data.role !== 'creator' && data.child_verified === false && children.length > 0) {
          setNeedsVerification(true);
        }
      } catch {
        // If column doesn't exist yet (pre-migration), skip verification
      } finally {
        setVerificationChecked(true);
      }
    };

    checkVerification();
  }, [isAuthenticated, household, currentUser, children.length]);

  // Children that need verification (memoized)
  const childrenToVerify = useMemo(
    () => children.map(c => ({ id: c.id, name: c.name })),
    [children],
  );

  // App lifecycle — refresh data on resume from background
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let handle: { remove: () => Promise<void> } | null = null;
    let backgroundedAt = 0;

    CapApp.addListener('appStateChange', async ({ isActive }) => {
      if (!isActive) {
        backgroundedAt = Date.now();
        return;
      }
      // Resume: reset transient UI state
      const s = useAppStore.getState();
      if (s.sideMenuOpen) s.setSideMenuOpen(false);
      if (s.fullScreenOverlayOpen) s.setFullScreenOverlayOpen(false);
      // Refresh data if stale (>5 min)
      if (Date.now() - backgroundedAt > 300_000 && s.isAuthenticated) {
        try {
          const data = await loadInitialData();
          s.hydrateFromServer(data);
        } catch { /* network error — keep cached data */ }
      }
    }).then(h => { handle = h; });

    return () => { handle?.remove(); };
  }, []);

  // Capacitor hardware back-button handler (Android + iOS swipe-back)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let backHandle: { remove: () => Promise<void> } | null = null;

    CapApp.addListener('backButton', () => {
      const s = useAppStore.getState();

      // Priority 1: Close side menu
      if (s.sideMenuOpen) { s.setSideMenuOpen(false); return; }
      // Priority 2: Close fullscreen overlay
      if (s.fullScreenOverlayOpen) { s.setFullScreenOverlayOpen(false); return; }
      // Priority 3: Close kommunikation thread
      if (s.kommunikationThreadId) { s.setKommunikationThreadId(null); return; }
      // Priority 4: Close kalender week view
      if (s.calendarWeekViewDate) { s.setCalendarWeekViewDate(null); s.setActiveTab('kalender'); return; }
      // Priority 5: Close swap request
      if (s.swapRequestDate) { s.setSwapRequestDate(null); s.setActiveTab('samversplan'); return; }
      // Priority 6: Navigate back via stack
      if (s.navigationStack.length > 0) { s.goBack(); return; }
      // Priority 7: Exit app (Android only)
      if (Capacitor.getPlatform() === 'android') { CapApp.exitApp(); }
    }).then(h => { backHandle = h; });

    return () => { backHandle?.remove(); };
  }, []);

  // Offline detection
  useEffect(() => {
    const store = useAppStore.getState();
    const handleOnline = () => store.setOnline(true);
    const handleOffline = () => store.setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    // Set initial state
    store.setOnline(navigator.onLine);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Keyboard dismiss: tap (not scroll) outside input fields blurs active element
  useEffect(() => {
    let startX = 0;
    let startY = 0;

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
    };

    const onTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      const dx = Math.abs(touch.clientX - startX);
      const dy = Math.abs(touch.clientY - startY);

      // Only dismiss keyboard if it was a tap (not a scroll gesture)
      if (dx < 10 && dy < 10) {
        const target = e.target as HTMLElement;
        if (!target.closest('input, textarea, select, [contenteditable]')) {
          (document.activeElement as HTMLElement)?.blur();
        }
      }
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  if (!isReady) {
    return (
      <div className="app-shell min-h-[100svh] flex items-center justify-center bg-transparent">
        <div className="animate-pulse flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-border bg-card shadow-lg">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <p className="text-foreground font-medium">Indlæser app...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <ErrorBoundary sectionName="Opstart">
          <Suspense fallback={<SectionLoading />}>
            {authScreen === 'login' ? (
              <LoginScreen onSwitchToRegister={() => setAuthScreen('register')} />
            ) : (
              <OnboardingFlow onSwitchToLogin={() => setAuthScreen('login')} />
            )}
          </Suspense>
        </ErrorBoundary>
        <Toaster position="top-center" />
      </>
    );
  }

  // User is authenticated but has no household — show setup
  if (!household) {
    return (
      <>
        <ErrorBoundary sectionName="Husstandsopsætning">
          <Suspense fallback={<SectionLoading />}>
            <HouseholdSetup onComplete={() => {
              // Force re-render by touching a harmless state
              // household is now set in the store, component will re-render
            }} />
          </Suspense>
        </ErrorBoundary>
        <Toaster position="top-center" />
      </>
    );
  }

  // Child verification gate for parent 2
  if (needsVerification && !childVerified && verificationChecked && childrenToVerify.length > 0) {
    return (
      <>
        <ChildVerificationDialog
          children={childrenToVerify}
          householdId={household.id}
          userId={currentUser!.id}
          onVerified={() => {
            setChildVerified(true);
            setNeedsVerification(false);
          }}
        />
        <Toaster position="top-center" />
      </>
    );
  }

  // Professional view
  if (showProfessionalView) {
    return (
      <div className="app-shell min-h-[100svh] bg-transparent">
        <TopBar />
        <main className="mx-auto w-full max-w-[430px] overflow-hidden px-3 pb-[calc(env(safe-area-inset-bottom,0px)+104px)] pt-[calc(env(safe-area-inset-top,0px)+74px)] sm:px-4">
          <Suspense fallback={<SectionLoading />}>
            {activeTab === 'cases' && (
              <ErrorBoundary sectionName="Sager">
                <ProfessionalDashboard />
              </ErrorBoundary>
            )}
            {activeTab === 'meeting-minutes' && (
              <ErrorBoundary sectionName="Referater">
                <MeetingMinutesView />
              </ErrorBoundary>
            )}
            {activeTab === 'dashboard' && (
              <ErrorBoundary sectionName="Overblik">
                <ProfessionalOverview />
              </ErrorBoundary>
            )}
            {activeTab === 'kommunikation' && (
              <ErrorBoundary sectionName="Kommunikation">
                <Kommunikation />
              </ErrorBoundary>
            )}
            {activeTab === 'settings' && (
              <ErrorBoundary sectionName="Indstillinger">
                <SettingsView />
              </ErrorBoundary>
            )}
          </Suspense>
        </main>
        <BottomNav />
        <Toaster position="top-center" />
      </div>
    );
  }

  // Blocked tabs for family_member role (GDPR + access control)
  const FAMILY_MEMBER_BLOCKED_TABS = new Set([
    'handover', 'mad-hjem', 'opgaver', 'feed', 'kommunikation',
    'expenses', 'balance', 'send-penge', 'budget', 'gaveoenskeliste',
    'analyse', 'swap-request', 'meeting-minutes',
  ]);

  // Parent view
  const renderContent = () => {
    if (currentUser?.role === 'family_member' && FAMILY_MEMBER_BLOCKED_TABS.has(activeTab)) {
      setActiveTab('dashboard');
      return null;
    }

    switch (activeTab) {
      case 'dashboard':
        return <ErrorBoundary sectionName="Overblik"><Dashboard /></ErrorBoundary>;
      case 'samversplan':
        return <ErrorBoundary sectionName="Samværsplan"><Samversplan /></ErrorBoundary>;
      case 'samversconfig':
        return <ErrorBoundary sectionName="Samværskonfiguration"><CustodyConfig /></ErrorBoundary>;
      case 'kalender':
        return <ErrorBoundary sectionName="Kalender"><Kalender /></ErrorBoundary>;
      case 'kalender-week':
        return <ErrorBoundary sectionName="Kalender ugevisning"><KalenderWeekView /></ErrorBoundary>;
      case 'handover':
        return <ErrorBoundary sectionName="Aflevering"><HandoverView /></ErrorBoundary>;
      case 'opgaver':
        return <ErrorBoundary sectionName="Opgaver"><Opgaver /></ErrorBoundary>;
      case 'mad-hjem':
        return <ErrorBoundary sectionName="Mad og Indkøb"><MadOgHjem /></ErrorBoundary>;
      case 'kommunikation':
        return <ErrorBoundary sectionName="Kommunikation"><Kommunikation /></ErrorBoundary>;
      case 'borneoverblik':
      case 'milestones':
        return <ErrorBoundary sectionName="Børneoverblik"><Borneoverblik /></ErrorBoundary>;
      case 'meeting-minutes':
        return <ErrorBoundary sectionName="Referater"><MeetingMinutesView /></ErrorBoundary>;
      case 'expenses':
      case 'balance':
      case 'send-penge':
      case 'budget':
      case 'gaveoenskeliste':
      case 'analyse':
        return <ErrorBoundary sectionName="Udgifter"><Expenses /></ErrorBoundary>;
      case 'children':
        return <ErrorBoundary sectionName="Børn"><ChildManagement /></ErrorBoundary>;
      case 'settings':
        return <ErrorBoundary sectionName="Indstillinger"><SettingsView /></ErrorBoundary>;
      case 'fotoalbum':
        return <ErrorBoundary sectionName="Fotoalbum"><Fotoalbum /></ErrorBoundary>;
      case 'dagbog':
        return <ErrorBoundary sectionName="Dagbog"><Dagbog /></ErrorBoundary>;
      case 'rutiner':
        return <ErrorBoundary sectionName="Rutiner"><RutinerView /></ErrorBoundary>;
      case 'vigtige-datoer':
        return <ErrorBoundary sectionName="Vigtige datoer"><VigtigeDatoer /></ErrorBoundary>;
      case 'beslutningslog':
        return <ErrorBoundary sectionName="Beslutningslog"><Beslutningslog /></ErrorBoundary>;
      case 'aarskalender':
        return <ErrorBoundary sectionName="Årskalender"><Aarskalender /></ErrorBoundary>;
      case 'feed':
        return <ErrorBoundary sectionName="Feed"><FeedView /></ErrorBoundary>;
      case 'dokumenter':
        return <ErrorBoundary sectionName="Dokumenter"><Dokumenter /></ErrorBoundary>;
      case 'notifikationer':
        return <ErrorBoundary sectionName="Notifikationer"><NotifikationsView /></ErrorBoundary>;
      case 'swap-request':
        return <ErrorBoundary sectionName="Bytteanmodning"><SwapRequest /></ErrorBoundary>;
      case 'historik':
        return <ErrorBoundary sectionName="Historik"><HistorikView /></ErrorBoundary>;
      case 'group-detail':
        return <ErrorBoundary sectionName="Gruppedetalje"><GroupDetailView /></ErrorBoundary>;
      case 'profile':
        return <ErrorBoundary sectionName="Profil"><ProfileView /></ErrorBoundary>;
      case 'create-group':
        return <ErrorBoundary sectionName="Opret gruppe"><CreateGroupView /></ErrorBoundary>;
      case 'familie-og-boern':
        return <ErrorBoundary sectionName="Familie & Børn"><FamilieOgBoern /></ErrorBoundary>;
      default:
        return <ErrorBoundary sectionName="Overblik"><Dashboard /></ErrorBoundary>;
    }
  };

  const hideChrome = activeTab === 'swap-request';

  return (
    <div className="app-shell min-h-[100svh] bg-transparent">
      {!isOnline && (
        <div className="fixed top-0 inset-x-0 z-[9999] bg-red-500 text-white text-center text-[13px] font-semibold py-1.5" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
          Ingen internetforbindelse — ændringer gemmes lokalt
        </div>
      )}
      {!hideChrome && <TopBar />}
      <main className={cn(
        "mx-auto w-full",
        hideChrome
          ? "max-w-[430px] px-0 pb-0"
          : activeTab === 'kalender-week'
            ? "max-w-none px-0 pb-0 pt-[calc(env(safe-area-inset-top,0px)+74px)]"
            : "max-w-[430px] overflow-x-hidden px-3 pb-[calc(env(safe-area-inset-bottom,0px)+104px)] sm:px-4 pt-[calc(env(safe-area-inset-top,0px)+74px)]"
      )}>
        <Suspense fallback={<SectionLoading />}>
          {renderContent()}
        </Suspense>
      </main>
      {!hideChrome && <BottomNav />}
      <Suspense fallback={null}><FlyerViewer /></Suspense>
      <Toaster position="top-center" />
    </div>
  );
}

export default App;
