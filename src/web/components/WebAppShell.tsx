import { Suspense, lazy, useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/store';
import { supabase } from '@/lib/supabase';
import { fetchMe } from '@/lib/auth';
import { loadInitialData } from '@/lib/dataSync';
import { startRealtimeSync, stopRealtimeSync } from '@/lib/realtime';
import { ErrorBoundary } from '@/components/custom/ErrorBoundary';
import { Toaster } from '@/components/ui/sonner';
import {
  LayoutDashboard,
  CalendarDays,
  Repeat,
  CheckSquare,
  UtensilsCrossed,
  MessageCircle,
  Wallet,
  Camera,
  Baby,
  BookOpen,
  RefreshCw,
  CalendarHeart,
  FileText,
  Rss,
  Settings,
  LogOut,
  Menu,
  X,
  Clock,
  ListChecks,
} from 'lucide-react';

/* ── Lazy section imports (same as App.tsx) ── */

const Dashboard = lazy(() => import('@/sections/Dashboard').then(m => ({ default: m.Dashboard })));
const Samversplan = lazy(() => import('@/sections/Samversplan').then(m => ({ default: m.Samversplan })));
const Kalender = lazy(() => import('@/sections/Kalender').then(m => ({ default: m.Kalender })));
const HandoverView = lazy(() => import('@/sections/HandoverView').then(m => ({ default: m.HandoverView })));
const Opgaver = lazy(() => import('@/sections/Opgaver').then(m => ({ default: m.Opgaver })));
const MadOgHjem = lazy(() => import('@/sections/MadOgHjem').then(m => ({ default: m.MadOgHjem })));
const Kommunikation = lazy(() => import('@/sections/Kommunikation').then(m => ({ default: m.Kommunikation })));
const Expenses = lazy(() => import('@/sections/Expenses').then(m => ({ default: m.Expenses })));
const Fotoalbum = lazy(() => import('@/sections/Fotoalbum').then(m => ({ default: m.Fotoalbum })));
const ChildManagement = lazy(() => import('@/sections/ChildManagement').then(m => ({ default: m.ChildManagement })));
const Borneoverblik = lazy(() => import('@/sections/Borneoverblik').then(m => ({ default: m.Borneoverblik })));
const Dagbog = lazy(() => import('@/sections/Dagbog').then(m => ({ default: m.Dagbog })));
const RutinerView = lazy(() => import('@/sections/RutinerView').then(m => ({ default: m.RutinerView })));
const VigtigeDatoer = lazy(() => import('@/sections/VigtigeDatoer').then(m => ({ default: m.VigtigeDatoer })));
const Beslutningslog = lazy(() => import('@/sections/Beslutningslog').then(m => ({ default: m.Beslutningslog })));
const Dokumenter = lazy(() => import('@/sections/Dokumenter').then(m => ({ default: m.Dokumenter })));
const FeedView = lazy(() => import('@/sections/FeedView').then(m => ({ default: m.FeedView })));
const SettingsView = lazy(() => import('@/sections/SettingsView').then(m => ({ default: m.SettingsView })));
const NotifikationsView = lazy(() => import('@/sections/NotifikationsView').then(m => ({ default: m.NotifikationsView })));
const HistorikView = lazy(() => import('@/sections/HistorikView').then(m => ({ default: m.HistorikView })));
const Aarskalender = lazy(() => import('@/sections/Aarskalender').then(m => ({ default: m.Aarskalender })));
const CustodyConfig = lazy(() => import('@/sections/CustodyConfig').then(m => ({ default: m.CustodyConfig })));
const SwapRequest = lazy(() => import('@/sections/SwapRequest').then(m => ({ default: m.SwapRequest })));
const KalenderWeekView = lazy(() => import('@/sections/KalenderWeekView').then(m => ({ default: m.KalenderWeekView })));
const FamilieOgBoern = lazy(() => import('@/sections/FamilieOgBoern').then(m => ({ default: m.FamilieOgBoern })));
const MeetingMinutesView = lazy(() => import('@/sections/MeetingMinutesView').then(m => ({ default: m.MeetingMinutesView })));

/* ── Nav items ── */

const navItems = [
  { id: 'dashboard', label: 'Oversigt', icon: LayoutDashboard },
  { id: 'samversplan', label: 'Samværsplan', icon: Repeat },
  { id: 'kalender', label: 'Kalender', icon: CalendarDays },
  { id: 'handover', label: 'Aflevering', icon: RefreshCw },
  { id: 'opgaver', label: 'Opgaver', icon: CheckSquare },
  { id: 'mad-hjem', label: 'Mad & Hjem', icon: UtensilsCrossed },
  { id: 'kommunikation', label: 'Kommunikation', icon: MessageCircle },
  { id: 'expenses', label: 'Udgifter', icon: Wallet },
  { id: 'fotoalbum', label: 'Fotoalbum', icon: Camera },
  { id: 'children', label: 'Børn', icon: Baby },
  { id: 'borneoverblik', label: 'Børneoverblik', icon: ListChecks },
  { id: 'dagbog', label: 'Dagbog', icon: BookOpen },
  { id: 'rutiner', label: 'Rutiner', icon: Clock },
  { id: 'vigtige-datoer', label: 'Vigtige datoer', icon: CalendarHeart },
  { id: 'beslutningslog', label: 'Beslutningslog', icon: FileText },
  { id: 'dokumenter', label: 'Dokumenter', icon: FileText },
  { id: 'feed', label: 'Feed', icon: Rss },
  { id: 'historik', label: 'Historik', icon: Clock },
  { id: 'settings', label: 'Indstillinger', icon: Settings },
];

/* ── Loading skeleton ── */

function SectionLoading() {
  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-lg">
        <div className="h-6 w-48 animate-pulse rounded bg-gray-200" />
        <div className="mt-3 h-4 w-64 animate-pulse rounded bg-gray-100" />
        <div className="mt-6 space-y-3">
          <div className="h-24 animate-pulse rounded-xl bg-gray-100" />
          <div className="h-24 animate-pulse rounded-xl bg-gray-100" />
        </div>
      </div>
    </div>
  );
}

/* ── Main Shell ── */

export function WebAppShell() {
  const {
    isAuthenticated, activeTab, setActiveTab,
    currentUser, setCurrentUser, setAuthenticated,
    hydrateFromServer, logout,
  } = useAppStore();

  const [isReady, setIsReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Session restore (mirrors App.tsx without Capacitor)
  const restoreSession = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      window.location.hash = '#login';
      return;
    }

    try {
      const user = await fetchMe();
      setCurrentUser(user);

      try {
        const data = await loadInitialData();
        hydrateFromServer(data);
      } catch {
        console.warn('Data sync failed — using cached data');
      }

      setAuthenticated(true);
      startRealtimeSync();
    } catch (err: any) {
      if (err?.status === 401) {
        stopRealtimeSync();
        await supabase.auth.signOut();
        logout();
        window.location.hash = '#login';
      } else {
        console.warn('Session restore failed (network?):', err?.message);
        setAuthenticated(true);
      }
    } finally {
      setIsReady(true);
    }
  }, [setCurrentUser, setAuthenticated, hydrateFromServer, logout]);

  useEffect(() => {
    restoreSession();
    return () => { stopRealtimeSync(); };
  }, [restoreSession]);

  // Online/offline detection
  useEffect(() => {
    const store = useAppStore.getState();
    const handleOnline = () => store.setOnline(true);
    const handleOffline = () => store.setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    store.setOnline(navigator.onLine);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLogout = async () => {
    stopRealtimeSync();
    await supabase.auth.signOut();
    logout();
    window.location.hash = '#login';
  };

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setSidebarOpen(false);
  };

  // Loading state
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
        <div className="text-center">
          <div className="w-10 h-10 border-[3px] border-[#e8e6df] border-t-[#2f2f2f] rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-[15px] font-semibold text-[#2f2f2f]">Indlæser Huska...</p>
        </div>
      </div>
    );
  }

  // Not authenticated — redirect
  if (!isAuthenticated) {
    window.location.hash = '#login';
    return null;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <ErrorBoundary sectionName="Oversigt"><Dashboard /></ErrorBoundary>;
      case 'samversplan': return <ErrorBoundary sectionName="Samværsplan"><Samversplan /></ErrorBoundary>;
      case 'samversconfig': return <ErrorBoundary sectionName="Samværskonfiguration"><CustodyConfig /></ErrorBoundary>;
      case 'kalender': return <ErrorBoundary sectionName="Kalender"><Kalender /></ErrorBoundary>;
      case 'kalender-week': return <ErrorBoundary sectionName="Ugevisning"><KalenderWeekView /></ErrorBoundary>;
      case 'handover': return <ErrorBoundary sectionName="Aflevering"><HandoverView /></ErrorBoundary>;
      case 'opgaver': return <ErrorBoundary sectionName="Opgaver"><Opgaver /></ErrorBoundary>;
      case 'mad-hjem': return <ErrorBoundary sectionName="Mad og Hjem"><MadOgHjem /></ErrorBoundary>;
      case 'kommunikation': return <ErrorBoundary sectionName="Kommunikation"><Kommunikation /></ErrorBoundary>;
      case 'borneoverblik':
      case 'milestones': return <ErrorBoundary sectionName="Børneoverblik"><Borneoverblik /></ErrorBoundary>;
      case 'meeting-minutes': return <ErrorBoundary sectionName="Referater"><MeetingMinutesView /></ErrorBoundary>;
      case 'expenses':
      case 'balance':
      case 'send-penge':
      case 'budget':
      case 'gaveoenskeliste':
      case 'analyse': return <ErrorBoundary sectionName="Udgifter"><Expenses /></ErrorBoundary>;
      case 'children': return <ErrorBoundary sectionName="Børn"><ChildManagement /></ErrorBoundary>;
      case 'settings': return <ErrorBoundary sectionName="Indstillinger"><SettingsView /></ErrorBoundary>;
      case 'fotoalbum': return <ErrorBoundary sectionName="Fotoalbum"><Fotoalbum /></ErrorBoundary>;
      case 'dagbog': return <ErrorBoundary sectionName="Dagbog"><Dagbog /></ErrorBoundary>;
      case 'rutiner': return <ErrorBoundary sectionName="Rutiner"><RutinerView /></ErrorBoundary>;
      case 'vigtige-datoer': return <ErrorBoundary sectionName="Vigtige datoer"><VigtigeDatoer /></ErrorBoundary>;
      case 'beslutningslog': return <ErrorBoundary sectionName="Beslutningslog"><Beslutningslog /></ErrorBoundary>;
      case 'aarskalender': return <ErrorBoundary sectionName="Årskalender"><Aarskalender /></ErrorBoundary>;
      case 'feed': return <ErrorBoundary sectionName="Feed"><FeedView /></ErrorBoundary>;
      case 'dokumenter': return <ErrorBoundary sectionName="Dokumenter"><Dokumenter /></ErrorBoundary>;
      case 'notifikationer': return <ErrorBoundary sectionName="Notifikationer"><NotifikationsView /></ErrorBoundary>;
      case 'swap-request': return <ErrorBoundary sectionName="Bytteanmodning"><SwapRequest /></ErrorBoundary>;
      case 'historik': return <ErrorBoundary sectionName="Historik"><HistorikView /></ErrorBoundary>;
      case 'familie-og-boern': return <ErrorBoundary sectionName="Familie & Børn"><FamilieOgBoern /></ErrorBoundary>;
      default: return <ErrorBoundary sectionName="Oversigt"><Dashboard /></ErrorBoundary>;
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 bottom-0 w-[260px] bg-white border-r border-[#e5e3dc] z-50
        flex flex-col overflow-y-auto
        transition-transform duration-200
        md:translate-x-0 md:static md:z-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e3dc]">
          <div className="flex items-center gap-2.5">
            <img src="/huska-logo.svg" alt="Huska" className="h-8 w-8" />
            <span className="text-lg font-bold text-[#2f2f2f] tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Huska</span>
          </div>
          <button className="md:hidden p-1 text-[#78766d]" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* User info */}
        {currentUser && (
          <div className="px-5 py-3 border-b border-[#e5e3dc]">
            <p className="text-sm font-semibold text-[#2f2f2f] truncate">{currentUser.name || currentUser.email}</p>
            <p className="text-xs text-[#78766d] truncate">{currentUser.email}</p>
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 py-2 px-3">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-[14px] font-medium transition-colors mb-0.5
                  ${isActive
                    ? 'bg-[#1a1a1a] text-white'
                    : 'text-[#5f5d56] hover:bg-[#f2f1ed] hover:text-[#2f2f2f]'
                  }
                `}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-3 border-t border-[#e5e3dc]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-[14px] font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} />
            Log ud
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar (mobile) */}
        <header className="md:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-[#e5e3dc] px-4 h-14 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-[#5f5d56]">
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <img src="/huska-logo.svg" alt="Huska" className="h-7 w-7" />
            <span className="text-base font-bold text-[#2f2f2f]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Huska</span>
          </div>
          <div className="w-10" /> {/* Spacer for centering */}
        </header>

        {/* Section content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-2xl px-3 py-4 sm:px-6">
            <Suspense fallback={<SectionLoading />}>
              {renderContent()}
            </Suspense>
          </div>
        </main>
      </div>

      <Toaster position="top-center" />
    </div>
  );
}
