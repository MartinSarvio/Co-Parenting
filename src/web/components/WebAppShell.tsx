import { Suspense, lazy, useEffect, useState, useCallback, useRef } from 'react';
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
  Bell,
  ChevronDown,
  User,
  FolderOpen,
} from 'lucide-react';

/* ── Lazy section imports ── */

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

/* ── Grouped nav items ── */

const navGroups = [
  {
    label: 'Overblik',
    items: [
      { id: 'dashboard', label: 'Oversigt', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Familie',
    items: [
      { id: 'samversplan', label: 'Samværsplan', icon: Repeat },
      { id: 'kalender', label: 'Kalender', icon: CalendarDays },
      { id: 'handover', label: 'Aflevering', icon: RefreshCw },
      { id: 'opgaver', label: 'Opgaver', icon: CheckSquare },
    ],
  },
  {
    label: 'Hverdag',
    items: [
      { id: 'mad-hjem', label: 'Mad & Hjem', icon: UtensilsCrossed },
      { id: 'expenses', label: 'Udgifter', icon: Wallet },
      { id: 'rutiner', label: 'Rutiner', icon: Clock },
    ],
  },
  {
    label: 'Kommunikation',
    items: [
      { id: 'kommunikation', label: 'Beskeder', icon: MessageCircle },
      { id: 'feed', label: 'Feed', icon: Rss },
    ],
  },
  {
    label: 'Børn',
    items: [
      { id: 'children', label: 'Børn', icon: Baby },
      { id: 'borneoverblik', label: 'Børneoverblik', icon: ListChecks },
      { id: 'dagbog', label: 'Dagbog', icon: BookOpen },
      { id: 'fotoalbum', label: 'Fotoalbum', icon: Camera },
    ],
  },
  {
    label: 'Dokumentation',
    items: [
      { id: 'dokumenter', label: 'Dokumenter', icon: FolderOpen },
      { id: 'beslutningslog', label: 'Beslutningslog', icon: FileText },
      { id: 'vigtige-datoer', label: 'Vigtige datoer', icon: CalendarHeart },
      { id: 'historik', label: 'Historik', icon: Clock },
    ],
  },
];

/* ── Tab → title mapping ── */

const tabTitles: Record<string, string> = {
  dashboard: 'Oversigt',
  samversplan: 'Samværsplan',
  samversconfig: 'Samværskonfiguration',
  kalender: 'Kalender',
  'kalender-week': 'Ugevisning',
  handover: 'Aflevering',
  opgaver: 'Opgaver',
  'mad-hjem': 'Mad & Hjem',
  kommunikation: 'Beskeder',
  borneoverblik: 'Børneoverblik',
  milestones: 'Milepæle',
  'meeting-minutes': 'Referater',
  expenses: 'Udgifter',
  balance: 'Balance',
  'send-penge': 'Send penge',
  budget: 'Budget',
  gaveoenskeliste: 'Ønskeliste',
  analyse: 'Analyse',
  children: 'Børn',
  settings: 'Indstillinger',
  fotoalbum: 'Fotoalbum',
  dagbog: 'Dagbog',
  rutiner: 'Rutiner',
  'vigtige-datoer': 'Vigtige datoer',
  beslutningslog: 'Beslutningslog',
  aarskalender: 'Årskalender',
  feed: 'Feed',
  dokumenter: 'Dokumenter',
  notifikationer: 'Notifikationer',
  'swap-request': 'Bytteanmodning',
  historik: 'Historik',
  'familie-og-boern': 'Familie & Børn',
};

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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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

  const currentTitle = tabTitles[activeTab] || 'Oversigt';
  const initials = currentUser?.name
    ? currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div className="min-h-screen bg-[#f8f8f6] flex flex-col">
      {/* ═══ HEADER ═══ */}
      <header className="sticky top-0 z-40 h-14 bg-white border-b border-[#e5e3dc] flex items-center px-4 lg:px-6 shrink-0">
        {/* Left: hamburger (mobile) + logo */}
        <div className="flex items-center gap-3 min-w-[200px]">
          <button
            className="lg:hidden p-1.5 -ml-1.5 rounded-lg text-[#5f5d56] hover:bg-[#f2f1ed] transition-colors"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <a href="/web.html" className="flex items-center gap-2">
            <img src="/huska-logo.svg" alt="Huska" className="h-8 w-8" />
            <span className="text-lg font-bold text-[#2f2f2f] tracking-tight hidden sm:block" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Huska</span>
          </a>
        </div>

        {/* Center: current section title */}
        <div className="flex-1 flex justify-center">
          <h1 className="text-[15px] font-semibold text-[#2f2f2f]">{currentTitle}</h1>
        </div>

        {/* Right: notifications + user menu */}
        <div className="flex items-center gap-2 min-w-[200px] justify-end">
          <button
            onClick={() => handleNavClick('notifikationer')}
            className="relative p-2 rounded-lg text-[#5f5d56] hover:bg-[#f2f1ed] transition-colors"
          >
            <Bell size={20} />
          </button>

          {/* User dropdown */}
          <div ref={userMenuRef} className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#f2f1ed] transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center text-white text-xs font-bold">
                {initials}
              </div>
              <span className="text-sm font-medium text-[#2f2f2f] hidden md:block max-w-[120px] truncate">
                {currentUser?.name || currentUser?.email}
              </span>
              <ChevronDown size={14} className={`text-[#78766d] hidden md:block transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl border border-[#e5e3dc] shadow-lg shadow-black/[0.08] py-1.5 z-50">
                <div className="px-4 py-2.5 border-b border-[#e5e3dc]">
                  <p className="text-sm font-semibold text-[#2f2f2f] truncate">{currentUser?.name}</p>
                  <p className="text-xs text-[#78766d] truncate">{currentUser?.email}</p>
                </div>
                <button
                  onClick={() => { handleNavClick('settings'); setUserMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#5f5d56] hover:bg-[#f2f1ed] transition-colors"
                >
                  <Settings size={16} />
                  Indstillinger
                </button>
                <button
                  onClick={() => { handleNavClick('children'); setUserMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#5f5d56] hover:bg-[#f2f1ed] transition-colors"
                >
                  <User size={16} />
                  Profil & Familie
                </button>
                <div className="border-t border-[#e5e3dc] mt-1 pt-1">
                  <button
                    onClick={() => { handleLogout(); setUserMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={16} />
                    Log ud
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ═══ BODY: Sidebar + Content ═══ */}
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ─── Sidebar (col 1) ─── */}
        <aside className={`
          fixed top-14 left-0 bottom-0 w-[240px] bg-white border-r border-[#e5e3dc] z-30
          flex flex-col overflow-y-auto
          transition-transform duration-200
          lg:translate-x-0 lg:static lg:z-auto
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <nav className="flex-1 py-3 px-2.5">
            {navGroups.map((group) => (
              <div key={group.label} className="mb-4">
                <p className="text-[10px] font-bold text-[#b5b3ab] uppercase tracking-widest px-3 mb-1.5">
                  {group.label}
                </p>
                {group.items.map((item) => {
                  const isActive = activeTab === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`
                        w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-[13px] font-medium transition-colors
                        ${isActive
                          ? 'bg-[#1a1a1a] text-white'
                          : 'text-[#5f5d56] hover:bg-[#f2f1ed] hover:text-[#2f2f2f]'
                        }
                      `}
                    >
                      <Icon size={16} className="shrink-0" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Sidebar footer */}
          <div className="px-2.5 py-2.5 border-t border-[#e5e3dc]">
            <button
              onClick={() => handleNavClick('settings')}
              className={`
                w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-[13px] font-medium transition-colors
                ${activeTab === 'settings' ? 'bg-[#1a1a1a] text-white' : 'text-[#5f5d56] hover:bg-[#f2f1ed]'}
              `}
            >
              <Settings size={16} />
              Indstillinger
            </button>
          </div>
        </aside>

        {/* ─── Main content (col 2) ─── */}
        <main className="flex-1 overflow-y-auto bg-[#f8f8f6]">
          <div className="w-full max-w-4xl mx-auto px-4 py-5 sm:px-6 lg:px-8">
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
