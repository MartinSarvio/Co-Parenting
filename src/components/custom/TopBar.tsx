import { useState } from 'react';
import { useAppStore } from '@/store';
import { cn, getParentColor } from '@/lib/utils';
import { Bell, Settings, ChevronDown, ChevronLeft, ChevronRight, Briefcase, User, LogOut, Menu, Plus, BookOpen, UtensilsCrossed, Camera, Search, Clock, UserPlus, Newspaper, Tag, MessageSquare, ExternalLink, Building2, FolderOpen, Upload, X } from 'lucide-react';
import { StoreBadge } from './StoreBadge';
import { useIsFamilyMember } from '@/hooks/useIsFamilyMember';
import { FLYERS, getFlyerStoreSlug } from '@/lib/etilbudsavis';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { logoutUser } from '@/lib/auth';
import { addMonths, format } from 'date-fns';
import { da } from 'date-fns/locale';

export function TopBar() {
  const {
    currentUser, users, children, notifications, isProfessionalView, setProfessionalView,
    household, activeTab, previousTab, setActiveTab, logout, sideMenuOpen, setSideMenuOpen, setSideMenuContext,
    calendarDate, setCalendarDate, setCalendarAddOpen,
    madSubTab, setMadAction, setOpgaverAction, setMilestonesAction, milestoneFormMode, setMilestoneFormMode, meetingFormMode, setMeetingFormMode, setMeetingAction, docSection, setDocSection, setDocAction, docFormMode, setDocFormMode, feedTab, setFeedTab, showGrupper,
    expenseFilter, setExpenseFilter, showExpenseForm, setShowExpenseForm,
    budgetPeriod, setBudgetPeriod, showBudgetEdit, setShowBudgetEdit,
    wishPersonFilter, setWishPersonFilter, wishCoverImage, setWishCoverImage, setWishCoverImageOpen, showWishForm, setShowWishForm,
    analysePersonId, setAnalysePersonId,
    threads, kommunikationThreadId, setKommunikationThreadId, setKommunikationAction, handoverAction, setHandoverAction,
    setAdminSearchOpen, isAdminVisible,
    setAdminRefresh, setAdminCreateOpen, adminCategoryFilter, setAdminCategoryFilter,
    calendarWeekViewDate, setCalendarWeekViewDate,
    dashboardFamilyLabel,
    activeSettingsTab, settingsDetailView, setSettingsDetailView,
    viewGroupName, groupDetailSearchOpen, setGroupDetailSearchOpen,
    tilbudStoreId, setTilbudStoreId, setViewerFlyerId, uploadedBatchMeta, setUploadedBatchMeta,
    analyticsPeriod, setAnalyticsPeriod,
    tilbudAdminTab, setTilbudAdminTab, setTilbudAdminCreateOpen, setNyhederAdminCreateOpen,
  } = useAppStore();
  const { isFamilyMember } = useIsFamilyMember();
  const [avatarSheetOpen, setAvatarSheetOpen] = useState(false);
  const [childSelectorOpen, setChildSelectorOpen] = useState(false);
  const [expenseFilterSelectorOpen, setExpenseFilterSelectorOpen] = useState(false);
  const [wishPersonSelectorOpen, setWishPersonSelectorOpen] = useState(false);
  const [analysePersonSelectorOpen, setAnalysePersonSelectorOpen] = useState(false);
  const [threadSwitcherOpen, setThreadSwitcherOpen] = useState(false);
  const [budgetPeriodSelectorOpen, setBudgetPeriodSelectorOpen] = useState(false);
  const [wishCoverSheetOpen, setWishCoverSheetOpen] = useState(false);
  const [adminCategorySelectorOpen, setAdminCategorySelectorOpen] = useState(false);
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const [analyticsPeriodSelectorOpen, setAnalyticsPeriodSelectorOpen] = useState(false);
  const [tilbudAdminTabSelectorOpen, setTilbudAdminTabSelectorOpen] = useState(false);
  const adminCategoryLabels: Record<string, string> = {
    all: 'Alle brugere', admin: 'Admin', parent: 'Forældre', child: 'Børn',
    professional: 'Professionel', lawyer: 'Advokat', municipality: 'Kommuner',
  };
  const expenseFilterLabels: Record<string, string> = {
    all: 'Alle udgifter', pending: 'Afventer', paid: 'Betalt',
    disputed: 'Anfægtet', recurring: 'Faste', unexpected: 'Uventet',
  };
  const parentUsers = users.filter(u => u.role === 'parent');
  const wishPersonLabel = wishPersonFilter === 'all'
    ? 'Alle personer'
    : parentUsers.find(u => u.id === wishPersonFilter)?.name?.split(' ')[0] ?? 'Person';
  const OVERBLIK_TABS = ['borneoverblik', 'milestones', 'meeting-minutes', 'dokumenter', 'dagbog', 'rutiner', 'vigtige-datoer', 'beslutningslog', 'familie-og-boern'];
  const MAD_TABS = ['mad-hjem'];
  const KALENDER_TABS = ['kalender', 'aarskalender'];
  const OPGAVER_TABS = ['opgaver', 'historik'];
  const EXPENSES_TABS = ['expenses', 'balance', 'send-penge', 'budget', 'gaveoenskeliste', 'analyse'];
  const isExpensePage = EXPENSES_TABS.includes(activeTab);
  const isBudgetPage = activeTab === 'budget';
  const isAnalyse = activeTab === 'analyse';
  const isExpenseWhiteText = isExpensePage && !isBudgetPage && !isAnalyse;
  const isMadHjem = activeTab === 'mad-hjem';
  const isMadMealPlan = isMadHjem && madSubTab === 'meal-plan';
  const isMadShopping = isMadHjem && madSubTab === 'shopping';
  const isOpgaver = OPGAVER_TABS.includes(activeTab);

  const unreadNotifications = notifications.filter(n => !n.read).length;
  const currentChild = children[0];
  const allowProfessionalTools = currentUser?.isAdmin === true || currentUser?.role === 'professional';
  const analyseFamilyMembers = isAnalyse ? [
    { id: null as string | null, name: 'Alle' },
    ...(currentUser ? [{ id: currentUser.id, name: currentUser.name?.split(' ')[0] ?? 'Mig' }] : []),
    ...users.filter(u => u.id !== currentUser?.id && u.role === 'parent').map(u => ({ id: u.id as string | null, name: u.name?.split(' ')[0] ?? u.name })),
    ...children.map(c => ({ id: c.id as string | null, name: c.name?.split(' ')[0] ?? c.name })),
  ] : [];
  const showProfessionalView = isProfessionalView && allowProfessionalTools;
  const modeLabel = household?.familyMode === 'together'
    ? 'Samboende'
    : household?.familyMode === 'single_parent'
      ? 'Enlig'
      : household?.familyMode === 'blended'
        ? 'Bonus'
        : 'Co-parenting';
  const billingLabel = household?.subscription?.billingModel === 'shared' ? 'Delt abo' : 'Separat abo';

  const isCalendar = activeTab === 'kalender';
  const isChatMode = activeTab === 'kommunikation' && kommunikationThreadId !== null;
  const chatThread = isChatMode ? threads.find(t => t.id === kommunikationThreadId) : null;
  const visibleThreads = threads.filter(t => !t.deletedBy?.includes(currentUser?.id || ''));

  // Render dedicated header for milestone/meeting/upload form modes (blocked for family members)
  if (!isFamilyMember && (milestoneFormMode || meetingFormMode || docFormMode)) {
    const formTitle = milestoneFormMode ? 'Ny milepæl' : meetingFormMode ? 'Nyt referat' : 'Upload dokument';
    const onBack = () => {
      if (milestoneFormMode) setMilestoneFormMode(null);
      if (meetingFormMode) setMeetingFormMode(null);
      if (docFormMode) setDocFormMode(null);
    };
    return (
      <header className="safe-area-pt fixed inset-x-0 top-0 z-50 mx-auto max-w-[430px] bg-card">
        <div className="flex items-center justify-between px-4 pb-2.5 pt-2">
          <button onClick={onBack} className="transition-colors">
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>
          <h2 className="text-lg font-semibold text-foreground">{formTitle}</h2>
          {docFormMode ? (
            <button onClick={onBack} className="transition-colors">
              <X className="h-5 w-5 text-foreground" />
            </button>
          ) : (
            <div className="w-5" />
          )}
        </div>
      </header>
    );
  }

  return (
    <>
      <header className={cn(
        "safe-area-pt fixed inset-x-0 top-0 z-50 mx-auto max-w-[430px] transition-colors",
        activeTab === 'kalender-week' || activeTab === 'feed'
          ? "bg-background border-b-0"
          : isExpensePage
            ? "bg-transparent border-transparent border-b"
            : "bg-background"
      )}>
        {activeTab === 'kalender-week' ? (
          /* ── Kalender uge-header: [<] Måned + M/T/O/T/F/L/S ── */
          <div className="flex w-full flex-col">
            <div className="flex items-center justify-between px-4 pt-2 pb-0">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setCalendarWeekViewDate(null); setActiveTab('kalender'); setYearDropdownOpen(false); }}
                  className="flex h-9 w-9 items-center justify-center text-foreground transition-colors"
                  aria-label="Tilbage til kalender"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="text-[15px] font-semibold text-foreground capitalize">
                  {format(calendarWeekViewDate || new Date(), 'MMMM', { locale: da })}
                </span>
              </div>
              <div className="relative">
                <button
                  onClick={() => setYearDropdownOpen(!yearDropdownOpen)}
                  className="flex items-center gap-1 text-[15px] font-semibold text-foreground transition-colors"
                >
                  {(calendarWeekViewDate || new Date()).getFullYear()}
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                {yearDropdownOpen && (
                  <div className="absolute right-0 top-full z-50 mt-1 rounded-xl border border-border bg-card py-1 shadow-lg">
                    {(() => {
                      const currentYear = (calendarWeekViewDate || new Date()).getFullYear();
                      return [currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map(y => (
                        <button
                          key={y}
                          onClick={() => {
                            const base = calendarWeekViewDate || new Date();
                            const newDate = new Date(base);
                            newDate.setFullYear(y);
                            setCalendarWeekViewDate(newDate);
                            setYearDropdownOpen(false);
                          }}
                          className={cn(
                            "block w-full px-5 py-1.5 text-center text-sm font-medium transition-colors",
                            y === currentYear ? "text-[#f58a2d]" : "text-foreground hover:bg-card"
                          )}
                        >
                          {y}
                        </button>
                      ));
                    })()}
                  </div>
                )}
              </div>
            </div>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {['M','T','O','T','F','L','S'].map((letter, i) => (
                <div
                  key={`wd-${i}`}
                  className={cn(
                    "py-1.5 text-center text-[11px] font-semibold",
                    i >= 5 ? "text-[#b0876a]" : "text-muted-foreground"
                  )}
                >
                  {letter}
                </div>
              ))}
            </div>
          </div>
        ) : handoverAction === 'add-pakkeliste' ? (
          /* ── Pakkeliste header: [←]  Tilføj til pakkeliste (centreret) ── */
          <div className="mx-auto flex w-full max-w-[430px] items-center px-3 pb-2.5 pt-2 relative">
            <button
              onClick={() => setHandoverAction(null)}
              className="flex h-9 w-9 items-center justify-center text-foreground"
              aria-label="Tilbage"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h1 className="absolute inset-x-0 text-center text-[15px] font-semibold text-foreground pointer-events-none">
              Tilføj til pakkeliste
            </h1>
          </div>
        ) : isCalendar ? (
          /* ── Calendar-specific header: [< hamburger]  [I dag]  [+ >] ── */
          <div className="mx-auto flex w-full max-w-[430px] items-center justify-between px-3 pb-2.5 pt-2">
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setCalendarDate(addMonths(calendarDate, -1))}
                className="flex h-9 w-9 items-center justify-center text-foreground transition-colors"
                aria-label="Forrige måned"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => {
                  setSideMenuContext('kalender');
                  setSideMenuOpen(!sideMenuOpen);
                }}
                className="flex h-9 w-9 items-center justify-center text-foreground transition-colors"
                aria-label="Menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>

            <button
              onClick={() => setCalendarDate(new Date())}
              className="rounded-[8px] px-3 py-1.5 text-[13px] font-semibold text-foreground hover:bg-muted transition-colors"
            >
              I dag
            </button>

            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setCalendarAddOpen(true)}
                className="flex h-9 w-9 items-center justify-center text-foreground transition-colors"
                aria-label="Ny aftale"
              >
                <Plus className="h-5 w-5" />
              </button>
              <button
                onClick={() => setCalendarDate(addMonths(calendarDate, 1))}
                className="flex h-9 w-9 items-center justify-center text-foreground transition-colors"
                aria-label="Næste måned"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        ) : isChatMode && chatThread ? (
          /* ── Chat-specific header: [<]  [Titel ▼]  [spacer] ── */
          <div className="mx-auto flex w-full max-w-[430px] items-center gap-1 px-3 pb-2.5 pt-2">
            <button
              onClick={() => setKommunikationThreadId(null)}
              className="flex h-9 w-9 items-center justify-center text-foreground transition-colors"
              aria-label="Tilbage til samtaler"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <button
              onClick={() => visibleThreads.length > 1 && setThreadSwitcherOpen(true)}
              className="flex flex-1 min-w-0 items-center gap-2"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-tint">
                <span className="text-sm font-bold text-[#bf6722]">{chatThread.title[0]}</span>
              </div>
              <span className="truncate text-sm font-semibold text-foreground">{chatThread.title}</span>
              {visibleThreads.length > 1 && (
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              )}
            </button>

            <div className="w-9" />
          </div>
        ) : activeTab === 'group-detail' ? (
          /* ── Group detail header ── */
          <div className="mx-auto flex w-full max-w-[430px] items-center gap-1 px-4 pb-2.5 pt-2">
            <button
              onClick={() => { setActiveTab('feed'); }}
              className="flex h-9 w-9 items-center justify-center text-foreground transition-colors"
              aria-label="Tilbage"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <p className="text-[15px] font-semibold text-foreground flex-1 truncate">{viewGroupName || 'Gruppe'}</p>
            <button
              onClick={() => setGroupDetailSearchOpen(!groupDetailSearchOpen)}
              className="flex h-9 w-9 items-center justify-center text-foreground transition-colors"
              aria-label="Søg"
            >
              <Search className="h-5 w-5" />
            </button>
          </div>
        ) : activeTab === 'create-group' ? (
          /* ── Create group header ── */
          <div className="mx-auto flex w-full max-w-[430px] items-center gap-1 px-4 pb-2.5 pt-2">
            <button
              onClick={() => { setActiveTab('feed'); }}
              className="flex h-9 w-9 items-center justify-center text-foreground transition-colors"
              aria-label="Tilbage"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <p className="text-[15px] font-semibold text-foreground flex-1">Ny gruppe</p>
            <button
              onClick={() => {
                // Scroll to settings section
                const el = document.getElementById('create-group-settings');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex h-9 w-9 items-center justify-center text-foreground transition-colors"
              aria-label="Indstillinger"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        ) : activeTab === 'profile' ? (
          /* ── Profile header ── */
          <div className="mx-auto flex w-full max-w-[430px] items-center gap-1 px-4 pb-2.5 pt-2">
            <button
              onClick={() => { setActiveTab(previousTab || 'feed'); }}
              className="flex h-9 w-9 items-center justify-center text-foreground transition-colors"
              aria-label="Tilbage"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <p className="text-[15px] font-semibold text-foreground flex-1">Profil</p>
          </div>
        ) : activeTab === 'feed' && showGrupper ? (
          /* ── Grupper header ── */
          <div className="mx-auto flex w-full max-w-[430px] items-center justify-center px-4 pb-2.5 pt-2">
            <p className="text-[15px] font-semibold text-foreground">Grupper</p>
          </div>
        ) : activeTab === 'feed' && feedTab === 'tilbud' && tilbudStoreId ? (
          /* ── Tilbudsavis butik-header ── */
          (() => {
            const isUploaded = tilbudStoreId.startsWith('uploaded-');
            const storeFlyer = isUploaded ? null : FLYERS.find(f => f.id === tilbudStoreId);
            const ubMeta = isUploaded ? uploadedBatchMeta : null;
            const displayName = storeFlyer?.store ?? ubMeta?.store ?? tilbudStoreId;
            const displayColor = storeFlyer?.storeColor ?? ubMeta?.storeColor ?? '#78766d';
            const displayFrom = storeFlyer?.validFrom ?? ubMeta?.validFrom;
            const displayUntil = storeFlyer?.validUntil ?? ubMeta?.validUntil;
            return (
              <div className="mx-auto flex w-full max-w-[430px] items-center gap-1.5 px-4 pb-2.5 pt-2">
                <button
                  onClick={() => { setTilbudStoreId(null); if (isUploaded) setUploadedBatchMeta(null); }}
                  className="flex h-9 w-9 items-center justify-center text-foreground transition-colors"
                  aria-label="Tilbage"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                {isUploaded ? (
                  <StoreBadge storeName={displayName} storeColor={displayColor} storeInitial={displayName[0]} size="sm" />
                ) : (
                  <StoreBadge storeId={storeFlyer ? getFlyerStoreSlug(storeFlyer) : tilbudStoreId} size="sm" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-bold text-foreground truncate">{displayName}</p>
                  {displayFrom && displayUntil && (
                    <p className="text-[10px] text-muted-foreground">{displayFrom} – {displayUntil}</p>
                  )}
                </div>
                {!isUploaded && storeFlyer?.hasFlyer ? (
                  <button
                    onClick={() => setViewerFlyerId(tilbudStoreId)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full text-white text-[11px] font-semibold active:scale-[0.97] transition-transform shrink-0"
                    style={{ backgroundColor: storeFlyer?.storeColor }}
                  >
                    Se avis
                    <ChevronRight className="h-3 w-3" />
                  </button>
                ) : !isUploaded && storeFlyer?.webUrl ? (
                  <a
                    href={storeFlyer?.webUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full text-white text-[11px] font-semibold active:scale-[0.97] transition-transform shrink-0"
                    style={{ backgroundColor: storeFlyer?.storeColor }}
                  >
                    Hjemmeside
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : null}
              </div>
            );
          })()
        ) : activeTab === 'feed' ? (
          /* ── Feed header: Nyheder | spacer | Tilbud + Forum ── */
          <div className="mx-auto flex w-full max-w-[430px] items-center justify-between px-4 pb-2.5 pt-2">
            <button
              onClick={() => setFeedTab('nyheder')}
              className={cn("flex h-9 w-9 items-center justify-center rounded-full transition-colors",
                feedTab === 'nyheder' ? "bg-primary text-white" : "text-muted-foreground"
              )}
              aria-label="Nyheder"
            >
              <Newspaper className="h-5 w-5" />
            </button>
            <div />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFeedTab('tilbud')}
                className={cn("flex h-9 w-9 items-center justify-center rounded-full transition-colors",
                  feedTab === 'tilbud' ? "bg-primary text-white" : "text-muted-foreground"
                )}
                aria-label="Tilbud"
              >
                <Tag className="h-5 w-5" />
              </button>
              <button
                onClick={() => setFeedTab('forum')}
                className={cn("flex h-9 w-9 items-center justify-center rounded-full transition-colors",
                  feedTab === 'forum' ? "bg-primary text-white" : "text-muted-foreground"
                )}
                aria-label="Forum"
              >
                <MessageSquare className="h-5 w-5" />
              </button>
            </div>
          </div>
        ) : (activeTab === 'settings' && activeSettingsTab === 'platform-analyse') ? (
          /* ── Platform Analyse header ── */
          <div className="mx-auto grid w-full max-w-[430px] grid-cols-3 items-center gap-2 px-2 pb-2.5 pt-2">
            <div className="flex min-w-0 items-center gap-0">
              <button
                onClick={() => {
                  setSideMenuContext('settings');
                  setSideMenuOpen(!sideMenuOpen);
                }}
                className="flex items-center justify-center text-foreground hover:text-foreground transition-colors"
                aria-label="Menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <span className="text-sm font-medium text-muted-foreground ml-0.5">Platformanalyse</span>
            </div>
            <div className="flex min-w-0 justify-center">
              <button
                onClick={() => setAnalyticsPeriodSelectorOpen(true)}
                className="mx-auto flex h-9 min-w-0 items-center gap-2 px-1 text-foreground transition-colors hover:text-foreground"
              >
                <span className="truncate text-sm font-medium">
                  {analyticsPeriod === 'today' ? 'I dag' : analyticsPeriod === 'week' ? 'Uge' : analyticsPeriod === 'month' ? 'Måned' : 'Alt'}
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            </div>
            <div className="flex items-center justify-self-end gap-1" />
          </div>
        ) : (activeTab === 'settings' && activeSettingsTab === 'nyheder-admin') ? (
          /* ── Nyheder admin header ── */
          <div className="mx-auto grid w-full max-w-[430px] grid-cols-3 items-center gap-2 px-2 pb-2.5 pt-2">
            <div className="flex min-w-0 items-center gap-0">
              <button
                onClick={() => {
                  setSideMenuContext('settings');
                  setSideMenuOpen(!sideMenuOpen);
                }}
                className="flex items-center justify-center text-foreground hover:text-foreground transition-colors"
                aria-label="Menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <span className="text-sm font-medium text-muted-foreground ml-0.5">Nyheder</span>
            </div>
            <div className="flex min-w-0 justify-center" />
            <div className="flex items-center justify-self-end gap-1">
              <button
                onClick={() => setNyhederAdminCreateOpen(true)}
                className="flex h-9 w-9 items-center justify-center text-foreground transition-colors"
                aria-label="Opret"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>
        ) : (activeTab === 'settings' && activeSettingsTab === 'tilbud-admin') ? (
          /* ── Tilbudsadmin header ── */
          <div className="mx-auto grid w-full max-w-[430px] grid-cols-3 items-center gap-2 px-2 pb-2.5 pt-2">
            <div className="flex min-w-0 items-center gap-0">
              <button
                onClick={() => {
                  setSideMenuContext('settings');
                  setSideMenuOpen(!sideMenuOpen);
                }}
                className="flex items-center justify-center text-foreground hover:text-foreground transition-colors"
                aria-label="Menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <span className="text-sm font-medium text-muted-foreground ml-0.5">Tilbudsadmin</span>
            </div>
            <div className="flex min-w-0 justify-center">
              <button
                onClick={() => setTilbudAdminTabSelectorOpen(true)}
                className="mx-auto flex h-9 min-w-0 items-center gap-2 px-1 text-foreground transition-colors hover:text-foreground"
              >
                <span className="truncate text-sm font-medium">
                  {tilbudAdminTab === 'affiliates' ? 'Affiliate-links' : 'Tilbudsaviser'}
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            </div>
            <div className="flex items-center justify-self-end gap-1">
              <button
                onClick={() => setTilbudAdminCreateOpen(true)}
                className="flex h-9 w-9 items-center justify-center text-foreground transition-colors"
                aria-label="Opret"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>
        ) : (activeTab === 'settings' && activeSettingsTab !== 'admin') ? (
          /* ── Settings header ── */
          <div className="mx-auto grid w-full max-w-[430px] grid-cols-3 items-center gap-2 px-2 pb-2.5 pt-2">
            <div className="flex min-w-0 items-center gap-0">
              {settingsDetailView ? (
                <button
                  onClick={() => setSettingsDetailView(null)}
                  className="flex h-9 w-9 items-center justify-center text-foreground transition-colors"
                  aria-label="Tilbage"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    setSideMenuContext('settings');
                    setSideMenuOpen(!sideMenuOpen);
                  }}
                  className="flex items-center justify-center text-foreground hover:text-foreground transition-colors"
                  aria-label="Menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
              )}
              <span className="text-sm font-medium text-muted-foreground ml-0.5">
                {settingsDetailView
                  ? (activeSettingsTab === 'info' ? 'Info' : activeSettingsTab === 'notifications' ? 'Notifikationer' : 'Indstillinger')
                  : activeSettingsTab === 'appearance' ? 'Visning'
                  : activeSettingsTab === 'payments' ? 'Betaling'
                  : activeSettingsTab === 'members' ? 'Medlemmer'
                  : activeSettingsTab === 'feedback' ? 'Feedback'
                  : 'Indstillinger'}
              </span>
            </div>
            <div className="flex min-w-0 justify-center" />
            <div className="flex items-center justify-self-end gap-1" />
          </div>
        ) : activeTab === 'dokumenter' ? (
          /* ── Dokumenter header ── */
          <div className="mx-auto grid w-full max-w-[430px] grid-cols-3 items-center gap-2 px-2 pb-2.5 pt-2">
            <div className="flex min-w-0 items-center gap-1">
              <button
                onClick={() => {
                  setSideMenuContext('overblik');
                  setSideMenuOpen(!sideMenuOpen);
                }}
                className="flex items-center justify-center text-foreground hover:text-foreground transition-colors"
                aria-label="Menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              {docSection === 'family' && (
                <button
                  onClick={() => setDocAction('upload')}
                  className="flex h-9 w-9 items-center justify-center rounded-[8px] text-foreground transition-colors active:bg-muted"
                  aria-label="Upload dokument"
                >
                  <Upload className="h-5 w-5" />
                </button>
              )}
            </div>
            <div className="flex min-w-0 justify-center">
              <span className="text-[15px] font-bold text-foreground">Dokumenter</span>
            </div>
            <div className="flex items-center justify-self-end gap-1">
              <button
                onClick={() => setDocSection('official')}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-[8px] transition-colors",
                  docSection === 'official' ? "text-foreground bg-muted" : "text-muted-foreground"
                )}
                aria-label="Officielle blanketter"
              >
                <Building2 className="h-5 w-5" />
              </button>
              <button
                onClick={() => setDocSection('family')}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-[8px] transition-colors",
                  docSection === 'family' ? "text-foreground bg-muted" : "text-muted-foreground"
                )}
                aria-label="Vores dokumenter"
              >
                <FolderOpen className="h-5 w-5" />
              </button>
            </div>
          </div>
        ) : (
          /* ── Default header ── */
          <div className="mx-auto grid w-full max-w-[430px] grid-cols-3 items-center gap-2 px-2 pb-2.5 pt-2">
            <div className="flex min-w-0 items-center gap-0">
              {activeTab === 'notifikationer' ? (
                <button
                  onClick={() => setActiveTab(previousTab || 'dashboard')}
                  className="flex h-9 w-9 items-center justify-center text-foreground transition-colors"
                  aria-label="Tilbage"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              ) : activeTab === 'expenses' && showExpenseForm ? (
                <button
                  onClick={() => setShowExpenseForm(false)}
                  className="flex h-9 w-9 items-center justify-center text-white transition-colors"
                  aria-label="Tilbage"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              ) : activeTab === 'budget' && showBudgetEdit ? (
                <button
                  onClick={() => setShowBudgetEdit(false)}
                  className="flex h-9 w-9 items-center justify-center text-foreground transition-colors"
                  aria-label="Tilbage"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              ) : activeTab === 'gaveoenskeliste' && showWishForm ? (
                <button
                  onClick={() => setShowWishForm(false)}
                  className="flex h-9 w-9 items-center justify-center text-white transition-colors"
                  aria-label="Tilbage"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              ) : activeTab === 'kommunikation' && !isChatMode ? (
                <>
                  <button
                    onClick={() => setKommunikationAction('new-thread')}
                    className="flex items-center justify-center text-foreground hover:text-foreground transition-colors"
                    aria-label="Ny samtale"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                  <span className="text-sm font-medium text-muted-foreground ml-0.5">Chat</span>
                </>
              ) : activeTab === 'handover' ? (
                <>
                  <button
                    onClick={() => setHandoverAction('add-pakkeliste')}
                    className="flex items-center justify-center text-foreground hover:text-foreground transition-colors"
                    aria-label="Tilføj til pakkeliste"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </>
              ) : activeTab !== 'dashboard' && (
                <>
                  <button
                    onClick={() => {
                      const ctx = OVERBLIK_TABS.includes(activeTab)
                        ? 'overblik' as const
                        : MAD_TABS.includes(activeTab)
                          ? 'madoghjem' as const
                          : KALENDER_TABS.includes(activeTab)
                            ? 'kalender' as const
                            : OPGAVER_TABS.includes(activeTab)
                              ? 'opgaver' as const
                              : EXPENSES_TABS.includes(activeTab)
                                ? 'expenses' as const
                                : activeTab === 'settings'
                                  ? 'settings' as const
                                  : 'samversplan' as const;
                      setSideMenuContext(ctx);
                      setSideMenuOpen(!sideMenuOpen);
                    }}
                    className={cn(
                      "flex items-center justify-center transition-colors",
                      isExpenseWhiteText ? "text-white hover:text-white/80" : "text-foreground hover:text-foreground"
                    )}
                    aria-label="Menu"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                  {isMadHjem && (() => {
                    const label = madSubTab === 'meal-plan' ? 'Mad'
                      : madSubTab === 'shopping' ? 'Indkøb'
                      : madSubTab === 'fridge' ? 'Køleskab'
                      : madSubTab === null ? 'Mad'
                      : null;
                    return label ? <span className="text-sm font-medium text-muted-foreground ml-0.5">{label}</span> : null;
                  })()}
                  {isAdminVisible && (
                    <button
                      onClick={() => setAdminSearchOpen(true)}
                      className="flex h-9 w-9 items-center justify-center text-foreground hover:text-foreground transition-colors"
                      aria-label="Søg brugere"
                    >
                      <Search className="h-5 w-5" />
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="flex min-w-0 justify-center">
              {activeTab === 'expenses' && (
                showExpenseForm ? (
                  <span className="text-sm font-semibold text-white">Ny udgift</span>
                ) : (
                  <button
                    onClick={() => setExpenseFilterSelectorOpen(true)}
                    className="mx-auto flex h-9 min-w-0 items-center gap-2 px-1 text-white transition-colors"
                  >
                    <span className="truncate text-sm font-medium">
                      {expenseFilterLabels[expenseFilter] ?? 'Alle udgifter'}
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 text-white/70" />
                  </button>
                )
              )}
              {activeTab === 'budget' && (
                showBudgetEdit ? (
                  <span className="text-sm font-semibold text-foreground">Sæt budget</span>
                ) : (
                  <button
                    onClick={() => setBudgetPeriodSelectorOpen(true)}
                    className="mx-auto flex h-9 min-w-0 items-center gap-2 px-1 text-foreground transition-colors"
                  >
                    <span className="truncate text-sm font-medium">
                      {budgetPeriod === 'monthly' ? 'Månedlig' : 'Årlig'}
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                )
              )}
              {activeTab === 'gaveoenskeliste' && (
                showWishForm ? (
                  <span className="text-sm font-semibold text-white">Tilføj ønske</span>
                ) : (
                  <button
                    onClick={() => setWishPersonSelectorOpen(true)}
                    className="mx-auto flex h-9 min-w-0 items-center gap-2 px-1 text-white transition-colors"
                  >
                    <span className="truncate text-sm font-medium">
                      {wishPersonLabel}
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 text-white/70" />
                  </button>
                )
              )}
              {isAdminVisible && (
                <button
                  onClick={() => setAdminCategorySelectorOpen(true)}
                  className="mx-auto flex h-9 min-w-0 items-center gap-2 px-1 text-foreground transition-colors hover:text-foreground"
                >
                  <span className="truncate text-sm font-medium">
                    {adminCategoryLabels[adminCategoryFilter] ?? 'Alle brugere'}
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              )}
              {!isAdminVisible && !showProfessionalView && !isExpensePage && !isAnalyse && activeTab === 'dashboard' && (
                <div className="mx-auto flex h-9 max-w-[170px] min-w-0 items-center gap-2 px-1 sm:max-w-[190px]">
                  <span className="truncate text-sm font-semibold text-foreground">
                    {dashboardFamilyLabel ?? 'Familie'}
                  </span>
                </div>
              )}
              {!isAdminVisible && !showProfessionalView && currentChild && !isExpensePage && !isAnalyse && activeTab !== 'dashboard' && (
                <button
                  onClick={() => setChildSelectorOpen(true)}
                  className="mx-auto flex h-9 max-w-[170px] min-w-0 items-center gap-2 px-1 text-foreground transition-colors hover:text-foreground sm:max-w-[190px]"
                  aria-label={`Valgt barn: ${currentChild.name}. Klik for at skifte`}
                >
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarImage src={currentChild.avatar} />
                    <AvatarFallback className="bg-secondary text-xs text-foreground">
                      {currentChild.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate text-sm font-medium">{currentChild.name}</span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                </button>
              )}

              {isFamilyMember && !isExpensePage && activeTab !== 'borneoverblik' && activeTab !== 'milestones' && (
                <button
                  onClick={() => setActiveTab('borneoverblik')}
                  className="flex h-8 items-center gap-1.5 rounded-full border border-[#d8d7cf] bg-[#faf9f6] px-3 text-[#41403c] transition-colors hover:bg-[#f0efea]"
                  aria-label="Gå til overblik"
                >
                  <User className="h-3.5 w-3.5" />
                  <span className="text-[13px] font-medium">Overblik</span>
                </button>
              )}
              {showProfessionalView && allowProfessionalTools && (
                <Badge variant="outline" className="h-8 border-border bg-card px-3 text-foreground">
                  <Briefcase className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                  Sagsbehandler
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-self-end gap-1">
              {isMadMealPlan ? (
                /* ── Madplan: Opskrifter + Tilføj ret ── */
                <>
                  <button
                    onClick={() => setMadAction('open-recipes')}
                    className="flex h-9 w-9 items-center justify-center text-foreground transition-colors"
                    aria-label="Opskrifter"
                  >
                    <BookOpen className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => setMadAction('add-meal')}
                    className="flex h-9 w-9 items-center justify-center text-foreground transition-colors"
                    aria-label="Tilføj ret"
                  >
                    <Plus className="h-5 w-5" aria-hidden="true" />
                  </button>
                </>
              ) : isOpgaver && activeTab !== 'historik' ? (
                /* ── Opgaver: Tilføj ── */
                <button
                  onClick={() => setOpgaverAction('add')}
                  className="flex h-9 w-9 items-center justify-center text-foreground transition-colors"
                  aria-label="Tilføj"
                >
                  <Plus className="h-5 w-5" aria-hidden="true" />
                </button>
              ) : activeTab === 'milestones' && !isFamilyMember ? (
                /* ── Milepæle: Tilføj ── */
                <button
                  onClick={() => setMilestonesAction('add')}
                  className="flex h-9 w-9 items-center justify-center text-foreground transition-colors"
                  aria-label="Tilføj milepæl"
                >
                  <Plus className="h-5 w-5" aria-hidden="true" />
                </button>
              ) : activeTab === 'meeting-minutes' ? (
                /* ── Mødereferater: Tilføj ── */
                <button
                  onClick={() => setMeetingAction('add')}
                  className="flex h-9 w-9 items-center justify-center text-foreground transition-colors"
                  aria-label="Nyt referat"
                >
                  <Plus className="h-5 w-5" aria-hidden="true" />
                </button>
              ) : isMadShopping ? (
                /* ── Indkøbsliste: Generer fra madplan + Tilføj vare ── */
                <>
                  <button
                    onClick={() => setMadAction('generate-shopping')}
                    className="flex h-9 w-9 items-center justify-center text-foreground transition-colors"
                    aria-label="Generer fra madplan"
                  >
                    <UtensilsCrossed className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => setMadAction('from-meal-plan')}
                    className="flex h-9 w-9 items-center justify-center text-foreground transition-colors"
                    aria-label="Tilføj vare"
                  >
                    <Plus className="h-5 w-5" aria-hidden="true" />
                  </button>
                </>
              ) : isMadHjem && madSubTab === 'templates' ? (
                /* ── Uge-skabeloner: Opret ny ── */
                <button
                  onClick={() => setMadAction('templates-add')}
                  className="flex h-9 w-9 items-center justify-center text-foreground transition-colors"
                  aria-label="Opret uge-skabelon"
                >
                  <Plus className="h-5 w-5" aria-hidden="true" />
                </button>
              ) : isMadHjem && madSubTab === 'quick-setup' ? (
                /* ── Hurtige valg: Tilføj ── */
                <button
                  onClick={() => setMadAction('quick-setup-add')}
                  className="flex h-9 w-9 items-center justify-center text-foreground transition-colors"
                  aria-label="Tilføj hurtig tilvalg"
                >
                  <Plus className="h-5 w-5" aria-hidden="true" />
                </button>
              ) : activeTab === 'gaveoenskeliste' && !showWishForm ? (
                /* ── Gave/ønskeliste: Kamera-ikon → bottom sheet ── */
                <button
                  onClick={() => setWishCoverSheetOpen(true)}
                  className="flex h-9 w-9 items-center justify-center text-white transition-colors"
                  aria-label="Vælg coverbillede"
                >
                  <Camera className="h-5 w-5" aria-hidden="true" />
                </button>
              ) : isAdminVisible ? (
                /* ── Admin: Clock (opdater) + UserPlus (opret) ── */
                <>
                  <button
                    onClick={() => setAdminRefresh(true)}
                    className="flex h-9 w-9 items-center justify-center text-foreground transition-colors hover:text-foreground"
                    aria-label="Opdater brugere"
                  >
                    <Clock className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => setAdminCreateOpen(true)}
                    className="flex h-9 w-9 items-center justify-center text-foreground transition-colors hover:text-foreground"
                    aria-label="Opret bruger"
                  >
                    <UserPlus className="h-5 w-5" aria-hidden="true" />
                  </button>
                </>
              ) : (
                /* ── Default: Bell + Avatar ── */
                <>
                  {!isExpensePage && (
                    <button
                      onClick={() => setActiveTab('notifikationer')}
                      className="relative flex items-center justify-center text-foreground transition-colors hover:text-foreground"
                      aria-label={unreadNotifications > 0 ? `${unreadNotifications} ulæste notifikationer` : 'Notifikationer'}
                    >
                      <Bell className="h-5 w-5" aria-hidden="true" />
                      {unreadNotifications > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#f58a2d]" aria-hidden="true" />
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => setAvatarSheetOpen(true)}
                    className="flex items-center justify-center transition-colors"
                    aria-label={`Brugermenu for ${currentUser?.name ?? 'bruger'}`}
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={currentUser?.avatar} />
                      <AvatarFallback
                        className="text-sm"
                        style={{
                          backgroundColor: currentUser ? getParentColor('cool') + '30' : undefined,
                          color: currentUser ? getParentColor('cool') : undefined
                        }}
                      >
                        {currentUser?.name[0]}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Avatar bottom sheet — always available */}
      <Sheet open={avatarSheetOpen} onOpenChange={setAvatarSheetOpen}>
        <SheetContent side="bottom" hideClose className="flex max-h-[90vh] flex-col rounded-t-[28px] border-border bg-background shadow-[0_-18px_40px_rgba(0,0,0,0.2)]">
          <div aria-hidden="true" className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted shrink-0" />
          <SheetHeader className="pb-0 px-4 shrink-0">
            <SheetTitle className="sr-only">Brugermenu</SheetTitle>
            <div className="flex items-center gap-3 py-2">
              <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                <AvatarImage src={currentUser?.avatar} />
                <AvatarFallback
                  className="text-lg"
                  style={{
                    backgroundColor: currentUser ? getParentColor('cool') + '30' : undefined,
                    color: currentUser ? getParentColor('cool') : undefined
                  }}
                >
                  {currentUser?.name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">{currentUser?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{currentUser?.email}</p>
                <p className="text-xs text-muted-foreground">{modeLabel} · {billingLabel}</p>
                {currentUser?.role === 'professional' && (
                  <p className="text-xs text-muted-foreground">{currentUser.organization}</p>
                )}
              </div>
            </div>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-2 px-4 py-3 pb-[calc(env(safe-area-inset-bottom,0px)+24px)]">
            {allowProfessionalTools && (
              <button
                onClick={() => { setProfessionalView(!isProfessionalView); setAvatarSheetOpen(false); }}
                className="flex flex-col items-center gap-2 rounded-[8px] py-4 text-foreground hover:bg-background transition-colors"
              >
                {isProfessionalView ? (
                  <User className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                ) : (
                  <Briefcase className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                )}
                <span className="text-[12px] font-semibold tracking-[-0.01em]">
                  {isProfessionalView ? 'Forældrevisning' : 'Professionel'}
                </span>
              </button>
            )}
            <button
              onClick={() => { setActiveTab('settings'); setAvatarSheetOpen(false); }}
              className="flex flex-col items-center gap-2 rounded-[8px] py-4 text-foreground hover:bg-background transition-colors"
            >
              <Settings className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
              <span className="text-[12px] font-semibold tracking-[-0.01em]">Indstillinger</span>
            </button>
            <button
              onClick={() => { logoutUser(); logout(); }}
              className="flex flex-col items-center gap-2 rounded-[8px] py-4 text-[#b56522] hover:bg-orange-tint transition-colors"
            >
              <LogOut className="h-6 w-6" aria-hidden="true" />
              <span className="text-[12px] font-semibold tracking-[-0.01em]">Log ud</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Child selector bottom sheet */}
      <Sheet open={childSelectorOpen} onOpenChange={setChildSelectorOpen}>
        <SheetContent side="bottom" hideClose className="flex max-h-[90vh] flex-col rounded-t-[28px] border-border bg-background shadow-[0_-18px_40px_rgba(0,0,0,0.2)]">
          <div aria-hidden="true" className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted shrink-0" />
          <SheetHeader className="pb-0 px-4 shrink-0">
            <SheetTitle className="text-center text-[1.05rem] text-foreground">Vælg barn</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-1 px-4 py-3 pb-[calc(env(safe-area-inset-bottom,0px)+24px)]">
            {children.map(child => (
              <button
                key={child.id}
                onClick={() => setChildSelectorOpen(false)}
                className="flex items-center gap-3 rounded-[8px] px-3 py-3 text-left text-foreground hover:bg-background transition-colors"
              >
                <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                  <AvatarImage src={child.avatar} />
                  <AvatarFallback className="bg-secondary text-sm text-foreground">
                    {child.name[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[14px] font-semibold">{child.name}</span>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Expense filter selector bottom sheet */}
      <Sheet open={expenseFilterSelectorOpen} onOpenChange={setExpenseFilterSelectorOpen}>
        <SheetContent side="bottom" hideClose className="flex max-h-[90vh] flex-col rounded-t-[28px] border-border bg-background shadow-[0_-18px_40px_rgba(0,0,0,0.2)]">
          <div aria-hidden="true" className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted shrink-0" />
          <SheetHeader className="pb-0 px-4 shrink-0">
            <SheetTitle className="text-center text-[1.05rem] text-foreground">Filtrer udgifter</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-1 px-4 py-3 pb-[calc(env(safe-area-inset-bottom,0px)+24px)]">
            {Object.entries(expenseFilterLabels).map(([key, label]) => (
              <button
                key={key}
                onClick={() => { setExpenseFilter(key); setExpenseFilterSelectorOpen(false); }}
                className="flex items-center gap-3 rounded-[8px] px-3 py-3 text-left text-foreground hover:bg-background transition-colors"
              >
                <span className="text-[14px] font-semibold">{label}</span>
                {expenseFilter === key && (
                  <span className="ml-auto text-xs font-semibold text-[#f58a2d]">Aktiv</span>
                )}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Wish person selector bottom sheet */}
      <Sheet open={wishPersonSelectorOpen} onOpenChange={setWishPersonSelectorOpen}>
        <SheetContent side="bottom" hideClose className="flex max-h-[90vh] flex-col rounded-t-[28px] border-border bg-background shadow-[0_-18px_40px_rgba(0,0,0,0.2)]">
          <div aria-hidden="true" className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted shrink-0" />
          <SheetHeader className="pb-0 px-4 shrink-0">
            <SheetTitle className="text-center text-[1.05rem] text-foreground">Filtrer person</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-1 px-4 py-3 pb-[calc(env(safe-area-inset-bottom,0px)+24px)]">
            <button
              onClick={() => { setWishPersonFilter('all'); setWishPersonSelectorOpen(false); }}
              className="flex items-center gap-3 rounded-[8px] px-3 py-3 text-left text-foreground hover:bg-background transition-colors"
            >
              <span className="text-[14px] font-semibold">Alle personer</span>
              {wishPersonFilter === 'all' && (
                <span className="ml-auto text-xs font-semibold text-[#f58a2d]">Aktiv</span>
              )}
            </button>
            {parentUsers.map(u => (
              <button
                key={u.id}
                onClick={() => { setWishPersonFilter(u.id); setWishPersonSelectorOpen(false); }}
                className="flex items-center gap-3 rounded-[8px] px-3 py-3 text-left text-foreground hover:bg-background transition-colors"
              >
                <span className="text-[14px] font-semibold">{u.name}</span>
                {wishPersonFilter === u.id && (
                  <span className="ml-auto text-xs font-semibold text-[#f58a2d]">Aktiv</span>
                )}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Analyse person selector bottom sheet */}
      <Sheet open={analysePersonSelectorOpen} onOpenChange={setAnalysePersonSelectorOpen}>
        <SheetContent side="bottom" hideClose className="flex max-h-[90vh] flex-col rounded-t-[28px] border-border bg-background shadow-[0_-18px_40px_rgba(0,0,0,0.2)]">
          <div aria-hidden="true" className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted shrink-0" />
          <SheetHeader className="pb-0 px-4 shrink-0">
            <SheetTitle className="text-center text-[1.05rem] text-foreground">Filtrer person</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-1 px-4 py-3 pb-[calc(env(safe-area-inset-bottom,0px)+24px)]">
            {analyseFamilyMembers.map(m => (
              <button
                key={m.id ?? 'alle'}
                onClick={() => { setAnalysePersonId(m.id); setAnalysePersonSelectorOpen(false); }}
                className="flex items-center gap-3 rounded-[8px] px-3 py-3 text-left text-foreground hover:bg-background transition-colors"
              >
                <span className="text-[14px] font-semibold">{m.name}</span>
                {analysePersonId === m.id && (
                  <span className="ml-auto text-xs font-semibold text-[#f58a2d]">Aktiv</span>
                )}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Thread switcher bottom sheet */}
      <Sheet open={threadSwitcherOpen} onOpenChange={setThreadSwitcherOpen}>
        <SheetContent side="bottom" hideClose className="flex max-h-[90vh] flex-col rounded-t-[28px] border-border bg-background shadow-[0_-18px_40px_rgba(0,0,0,0.2)]">
          <div aria-hidden="true" className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted shrink-0" />
          <SheetHeader className="pb-0 px-4 shrink-0">
            <SheetTitle className="text-center text-[1.05rem] text-foreground">Skift samtale</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-1 px-4 py-3 pb-[calc(env(safe-area-inset-bottom,0px)+24px)]">
            {visibleThreads.map(thread => (
              <button
                key={thread.id}
                onClick={() => { setKommunikationThreadId(thread.id); setThreadSwitcherOpen(false); }}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-background transition-colors"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-tint">
                  <span className="text-lg font-bold text-[#bf6722]">{thread.title[0]}</span>
                </div>
                <span className="flex-1 truncate text-[14px] font-semibold text-foreground">{thread.title}</span>
                {thread.id === kommunikationThreadId && (
                  <span className="text-xs font-semibold text-[#f58a2d]">Aktiv</span>
                )}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Budget period selector bottom sheet */}
      <Sheet open={budgetPeriodSelectorOpen} onOpenChange={setBudgetPeriodSelectorOpen}>
        <SheetContent side="bottom" hideClose className="flex max-h-[90vh] flex-col rounded-t-[28px] border-border bg-background shadow-[0_-18px_40px_rgba(0,0,0,0.2)]">
          <div aria-hidden="true" className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted shrink-0" />
          <SheetHeader className="pb-0 px-4 shrink-0">
            <SheetTitle className="text-center text-[1.05rem] text-foreground">Vælg periode</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-1 px-4 py-3 pb-[calc(env(safe-area-inset-bottom,0px)+24px)]">
            {([['monthly', 'Månedlig'], ['yearly', 'Årlig']] as const).map(([value, label]) => (
              <button
                key={value}
                onClick={() => { setBudgetPeriod(value); setBudgetPeriodSelectorOpen(false); }}
                className="flex items-center gap-3 rounded-[8px] px-3 py-3 text-left text-foreground hover:bg-background transition-colors"
              >
                <span className="text-[14px] font-semibold">{label}</span>
                {budgetPeriod === value && (
                  <span className="ml-auto text-xs font-semibold text-[#f58a2d]">Aktiv</span>
                )}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Wish cover image bottom sheet */}
      <Sheet open={wishCoverSheetOpen} onOpenChange={setWishCoverSheetOpen}>
        <SheetContent side="bottom" hideClose className="flex max-h-[90vh] flex-col rounded-t-[28px] border-border bg-background shadow-[0_-18px_40px_rgba(0,0,0,0.2)]">
          <div aria-hidden="true" className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted shrink-0" />
          <SheetHeader className="pb-0 px-4 shrink-0">
            <SheetTitle className="text-center text-[1.05rem] text-foreground">Coverbillede</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-1 px-4 py-3 pb-[calc(env(safe-area-inset-bottom,0px)+24px)]">
            <button
              onClick={() => { setWishCoverImageOpen(true); setWishCoverSheetOpen(false); }}
              className="flex items-center gap-3 rounded-[8px] px-3 py-3 text-left text-foreground hover:bg-background transition-colors"
            >
              <Camera className="h-5 w-5 text-muted-foreground" />
              <span className="text-[14px] font-semibold">Vælg nyt billede</span>
            </button>
            {wishCoverImage && (
              <button
                onClick={() => { setWishCoverImage(null); setWishCoverSheetOpen(false); }}
                className="flex items-center gap-3 rounded-[8px] px-3 py-3 text-left text-red-500 hover:bg-red-50 transition-colors"
              >
                <span className="text-[14px] font-semibold">Fjern billede</span>
              </button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Admin category filter bottom sheet */}
      <Sheet open={adminCategorySelectorOpen} onOpenChange={setAdminCategorySelectorOpen}>
        <SheetContent side="bottom" hideClose className="flex max-h-[90vh] flex-col rounded-t-[28px] border-border bg-background shadow-[0_-18px_40px_rgba(0,0,0,0.2)]">
          <div aria-hidden="true" className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted shrink-0" />
          <SheetHeader className="pb-0 px-4 shrink-0">
            <SheetTitle className="text-center text-[1.05rem] text-foreground">Filtrer brugere</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-1 px-4 py-3 pb-[calc(env(safe-area-inset-bottom,0px)+24px)]">
            {Object.entries(adminCategoryLabels).map(([key, label]) => (
              <button
                key={key}
                onClick={() => { setAdminCategoryFilter(key); setAdminCategorySelectorOpen(false); }}
                className="flex items-center gap-3 rounded-[8px] px-3 py-3 text-left text-foreground hover:bg-background transition-colors"
              >
                <span className="text-[14px] font-semibold">{label}</span>
                {adminCategoryFilter === key && (
                  <span className="ml-auto text-xs font-semibold text-[#f58a2d]">Aktiv</span>
                )}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Analytics period selector bottom sheet */}
      <Sheet open={analyticsPeriodSelectorOpen} onOpenChange={setAnalyticsPeriodSelectorOpen}>
        <SheetContent side="bottom" hideClose className="flex max-h-[90vh] flex-col rounded-t-[28px] border-border bg-background shadow-[0_-18px_40px_rgba(0,0,0,0.2)]">
          <div aria-hidden="true" className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted shrink-0" />
          <SheetHeader className="pb-0 px-4 shrink-0">
            <SheetTitle className="text-center text-[1.05rem] text-foreground">Vælg periode</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-1 px-4 py-3 pb-[calc(env(safe-area-inset-bottom,0px)+24px)]">
            {([['today', 'I dag'], ['week', 'Uge'], ['month', 'Måned'], ['all', 'Alt']] as const).map(([value, label]) => (
              <button
                key={value}
                onClick={() => { setAnalyticsPeriod(value); setAnalyticsPeriodSelectorOpen(false); }}
                className="flex items-center gap-3 rounded-[8px] px-3 py-3 text-left text-foreground hover:bg-background transition-colors"
              >
                <span className="text-[14px] font-semibold">{label}</span>
                {analyticsPeriod === value && (
                  <span className="ml-auto text-xs font-semibold text-[#f58a2d]">Aktiv</span>
                )}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Tilbudsadmin tab selector bottom sheet */}
      <Sheet open={tilbudAdminTabSelectorOpen} onOpenChange={setTilbudAdminTabSelectorOpen}>
        <SheetContent side="bottom" hideClose className="flex max-h-[90vh] flex-col rounded-t-[28px] border-border bg-background shadow-[0_-18px_40px_rgba(0,0,0,0.2)]">
          <div aria-hidden="true" className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted shrink-0" />
          <SheetHeader className="pb-0 px-4 shrink-0">
            <SheetTitle className="text-center text-[1.05rem] text-foreground">Vælg fane</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-1 px-4 py-3 pb-[calc(env(safe-area-inset-bottom,0px)+24px)]">
            {([['affiliates', 'Affiliate-links'], ['pdf-import', 'Tilbudsaviser']] as const).map(([value, label]) => (
              <button
                key={value}
                onClick={() => { setTilbudAdminTab(value); setTilbudAdminTabSelectorOpen(false); }}
                className="flex items-center gap-3 rounded-[8px] px-3 py-3 text-left text-foreground hover:bg-background transition-colors"
              >
                <span className="text-[14px] font-semibold">{label}</span>
                {tilbudAdminTab === value && (
                  <span className="ml-auto text-xs font-semibold text-[#f58a2d]">Aktiv</span>
                )}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
