import { Suspense, lazy, useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/store';
import { BottomNav } from '@/components/custom/BottomNav';
import { TopBar } from '@/components/custom/TopBar';
import { Toaster } from '@/components/ui/sonner';
import { ErrorBoundary } from '@/components/custom/ErrorBoundary';
import { getToken } from '@/lib/api';
import { fetchMe } from '@/lib/auth';
import { loadInitialData } from '@/lib/dataSync';
import { initPushNotifications } from '@/lib/pushNotifications';
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
const VigtigeDatoer = lazy(() =>
  import('@/sections/VigtigeDatoer').then((module) => ({ default: module.VigtigeDatoer }))
);
const Beslutningslog = lazy(() =>
  import('@/sections/Beslutningslog').then((module) => ({ default: module.Beslutningslog }))
);
const Aarskalender = lazy(() =>
  import('@/sections/Aarskalender').then((module) => ({ default: module.Aarskalender }))
);
const Dokumenter = lazy(() =>
  import('@/sections/Dokumenter').then((module) => ({ default: module.Dokumenter }))
);

function SectionLoading() {
  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-lg">
        <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
        <div className="mt-3 h-4 w-64 animate-pulse rounded bg-slate-100" />
        <div className="mt-6 space-y-3">
          <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
          <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

function App() {
  const { isAuthenticated, isProfessionalView, activeTab, household, setCurrentUser, setAuthenticated, hydrateFromServer, logout } = useAppStore();
  const [isReady, setIsReady] = useState(false);
  const [authScreen, setAuthScreen] = useState<'login' | 'register'>('login');
  const canUseProfessionalView = household?.familyMode !== 'together';
  const showProfessionalView = isProfessionalView && canUseProfessionalView;

  // Session restore — check for existing JWT token on mount
  const restoreSession = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setIsReady(true);
      return;
    }

    try {
      // Validate token and get user
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

      // Initialize push notifications (non-blocking)
      initPushNotifications().catch(console.warn);
    } catch {
      // Token invalid/expired — clear and show login
      logout();
    } finally {
      setIsReady(true);
    }
  }, [setCurrentUser, setAuthenticated, hydrateFromServer, logout]);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  if (!isReady) {
    return (
      <div className="app-shell min-h-[100svh] flex items-center justify-center bg-transparent">
        <div className="animate-pulse flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-[0_14px_28px_rgba(15,23,42,0.14)]">
            <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <p className="text-slate-700 font-medium">Indlæser app...</p>
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

  // Professional view
  if (showProfessionalView) {
    return (
      <div className="app-shell min-h-[100svh] bg-transparent">
        <TopBar />
        <main className="mx-auto w-full max-w-[430px] px-3 pb-[calc(env(safe-area-inset-bottom,0px)+104px)] pt-[calc(env(safe-area-inset-top,0px)+74px)] sm:px-4">
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
                <Dashboard />
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

  // Parent view
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <ErrorBoundary sectionName="Overblik"><Dashboard /></ErrorBoundary>;
      case 'samversplan':
        return <ErrorBoundary sectionName="Samværsplan"><Samversplan /></ErrorBoundary>;
      case 'samversconfig':
        return <ErrorBoundary sectionName="Samværskonfiguration"><CustodyConfig /></ErrorBoundary>;
      case 'kalender':
        return <ErrorBoundary sectionName="Kalender"><Kalender /></ErrorBoundary>;
      case 'handover':
        return <ErrorBoundary sectionName="Aflevering"><HandoverView /></ErrorBoundary>;
      case 'opgaver':
        return <ErrorBoundary sectionName="Opgaver"><Opgaver /></ErrorBoundary>;
      case 'mad-hjem':
        return <ErrorBoundary sectionName="Mad og Hjem"><MadOgHjem /></ErrorBoundary>;
      case 'kommunikation':
        return <ErrorBoundary sectionName="Kommunikation"><Kommunikation /></ErrorBoundary>;
      case 'borneoverblik':
        return <ErrorBoundary sectionName="Børneoverblik"><Borneoverblik /></ErrorBoundary>;
      case 'meeting-minutes':
        return <ErrorBoundary sectionName="Referater"><MeetingMinutesView /></ErrorBoundary>;
      case 'expenses':
        return <ErrorBoundary sectionName="Udgifter"><Expenses /></ErrorBoundary>;
      case 'children':
        return <ErrorBoundary sectionName="Børn"><ChildManagement /></ErrorBoundary>;
      case 'settings':
        return <ErrorBoundary sectionName="Indstillinger"><SettingsView /></ErrorBoundary>;
      case 'fotoalbum':
        return <ErrorBoundary sectionName="Fotoalbum"><Fotoalbum /></ErrorBoundary>;
      case 'dagbog':
        return <ErrorBoundary sectionName="Dagbog"><Dagbog /></ErrorBoundary>;
      case 'vigtige-datoer':
        return <ErrorBoundary sectionName="Vigtige datoer"><VigtigeDatoer /></ErrorBoundary>;
      case 'beslutningslog':
        return <ErrorBoundary sectionName="Beslutningslog"><Beslutningslog /></ErrorBoundary>;
      case 'aarskalender':
        return <ErrorBoundary sectionName="Årskalender"><Aarskalender /></ErrorBoundary>;
      case 'dokumenter':
        return <ErrorBoundary sectionName="Dokumenter"><Dokumenter /></ErrorBoundary>;
      default:
        return <ErrorBoundary sectionName="Overblik"><Dashboard /></ErrorBoundary>;
    }
  };

  return (
    <div className="app-shell min-h-[100svh] bg-transparent">
      <TopBar />
      <main className="mx-auto w-full max-w-[430px] px-3 pb-[calc(env(safe-area-inset-bottom,0px)+104px)] pt-[calc(env(safe-area-inset-top,0px)+74px)] sm:px-4">
        <Suspense fallback={<SectionLoading />}>
          {renderContent()}
        </Suspense>
      </main>
      <BottomNav />
      <Toaster position="top-center" />
    </div>
  );
}

export default App;
