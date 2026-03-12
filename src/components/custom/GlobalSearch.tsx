import React, { useEffect, useState, useCallback, useMemo, useRef, useDeferredValue } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore } from '@/store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays,
  CalendarRange,
  Rss,
  CheckSquare,
  Receipt,
  ShoppingCart,
  MessageCircle,
  Star,
  Search,
  LayoutDashboard,
  Repeat,
  UserCircle,
  UtensilsCrossed,
  Baby,
  FileText,
  Camera,
  BookOpen,
  CalendarHeart,
  ClipboardList,
  FolderOpen,
  Settings,
  Briefcase,
  ArrowLeft,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  section: string;
  tab: string;
  icon: React.ReactNode;
  searchValue: string;
}

/** Normalize Danish characters for search: æ→ae, ø→o, å→a, etc. */
function normalizeDanish(text: string): string {
  return text
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/å/g, 'a')
    .replace(/é/g, 'e')
    .replace(/ü/g, 'u');
}

/** Create a rich search value from multiple text fragments */
function buildSearchValue(...parts: (string | undefined)[]): string {
  const combined = parts.filter(Boolean).join(' ');
  return `${combined} ${normalizeDanish(combined)}`;
}

// All navigable sections with rich keywords
const sectionItems: { id: string; label: string; tab: string; keywords: string; icon: React.ReactNode }[] = [
  { id: 'nav-dashboard', label: 'Oversigt', tab: 'dashboard', keywords: 'oversigt dashboard hjem forside start', icon: <LayoutDashboard className="h-4 w-4 text-[#5f5d56]" /> },
  { id: 'nav-samvaer', label: 'Samværsplan', tab: 'samversplan', keywords: 'samvær samværsplan samvaersplan custody plan skifteordning uge weekend hverdage', icon: <Repeat className="h-4 w-4 text-[#5f5d56]" /> },
  { id: 'nav-kalender', label: 'Kalender', tab: 'kalender', keywords: 'kalender calendar begivenheder events aftale aftaler dato program', icon: <CalendarDays className="h-4 w-4 text-blue-500" /> },
  { id: 'nav-handover', label: 'Aflevering', tab: 'handover', keywords: 'aflevering handover hente bringe pakkeliste checklist overlevering', icon: <UserCircle className="h-4 w-4 text-[#5f5d56]" /> },
  { id: 'nav-opgaver', label: 'Opgaver & Hjem', tab: 'opgaver', keywords: 'opgaver tasks hjem rengøring todo gøremål liste rengoering cleaning', icon: <CheckSquare className="h-4 w-4 text-green-500" /> },
  { id: 'nav-madhjem', label: 'Mad & Indkøb', tab: 'mad-hjem', keywords: 'mad indkøb madplan opskrifter meal food shopping køkken køleskab indkøbsliste', icon: <UtensilsCrossed className="h-4 w-4 text-[#bf6722]" /> },
  { id: 'nav-chat', label: 'Chat / Kommunikation', tab: 'kommunikation', keywords: 'chat kommunikation beskeder messages samtale sms besked tråd', icon: <MessageCircle className="h-4 w-4 text-teal-500" /> },
  { id: 'nav-expenses', label: 'Udgifter', tab: 'expenses', keywords: 'udgifter expenses økonomi penge betaling delt balance regning kvittering okonomi', icon: <Receipt className="h-4 w-4 text-orange-500" /> },
  { id: 'nav-children', label: 'Børn', tab: 'children', keywords: 'børn children barn institution skole børnehave vuggestue born', icon: <Baby className="h-4 w-4 text-[#bf6722]" /> },
  { id: 'nav-overblik', label: 'Børneoverblik', tab: 'borneoverblik', keywords: 'børneoverblik overblik milestones dokumenter milepæle born borneoverblik', icon: <UserCircle className="h-4 w-4 text-[#5f5d56]" /> },
  { id: 'nav-referater', label: 'Referater', tab: 'meeting-minutes', keywords: 'referater mødereferat meeting minutes notat møde mode modereferat', icon: <FileText className="h-4 w-4 text-[#5f5d56]" /> },
  { id: 'nav-dokumenter', label: 'Dokumenter', tab: 'dokumenter', keywords: 'dokumenter documents blanketter familieretshuset officielle papirer filer', icon: <FolderOpen className="h-4 w-4 text-[#5f5d56]" /> },
  { id: 'nav-fotoalbum', label: 'Fotoalbum', tab: 'fotoalbum', keywords: 'fotoalbum billeder photos fotos album foto', icon: <Camera className="h-4 w-4 text-[#5f5d56]" /> },
  { id: 'nav-dagbog', label: 'Dagbog', tab: 'dagbog', keywords: 'dagbog diary journal noter bog notater', icon: <BookOpen className="h-4 w-4 text-[#5f5d56]" /> },
  { id: 'nav-datoer', label: 'Vigtige datoer', tab: 'vigtige-datoer', keywords: 'vigtige datoer key dates fødselsdage jubilæum fodselsdage jubilaeum', icon: <CalendarHeart className="h-4 w-4 text-[#5f5d56]" /> },
  { id: 'nav-beslutninger', label: 'Beslutningslog', tab: 'beslutningslog', keywords: 'beslutninger beslutningslog decisions log aftale aftaler', icon: <ClipboardList className="h-4 w-4 text-[#5f5d56]" /> },
  { id: 'nav-aarskalender', label: 'Årskalender', tab: 'aarskalender', keywords: 'årskalender aarskalender year calendar oversigt helår helårs aar ars arskalender', icon: <CalendarRange className="h-4 w-4 text-[#5f5d56]" /> },
  { id: 'nav-feed', label: 'Feed', tab: 'feed', keywords: 'feed nyheder tilbud forum rss news offers community opslag', icon: <Rss className="h-4 w-4 text-[#5f5d56]" /> },
  { id: 'nav-settings', label: 'Indstillinger', tab: 'settings', keywords: 'indstillinger settings profil konto abonnement betaling familie', icon: <Settings className="h-4 w-4 text-[#5f5d56]" /> },
  { id: 'nav-sager', label: 'Professionel oversigt', tab: 'cases', keywords: 'professionel sager cases sagsbehandler advokat myndigheder', icon: <Briefcase className="h-4 w-4 text-indigo-500" /> },
];

export function GlobalSearch({ variant = 'icon' }: { variant?: 'icon' | 'inline' }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    events,
    tasks,
    expenses,
    shoppingItems,
    messages,
    milestones,
    setActiveTab,
  } = useAppStore();

  // Keyboard shortcut: ⌘K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Clear query when closed
  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  // No body overflow lock needed — portal overlay covers background

  const handleSelect = useCallback(
    (tab: string) => {
      setActiveTab(tab);
      setOpen(false);
    },
    [setActiveTab],
  );

  const sectionResults: SearchResult[] = useMemo(
    () =>
      sectionItems.map((s) => ({
        id: s.id,
        title: s.label,
        subtitle: 'Gå til sektion',
        section: 'Sektioner',
        tab: s.tab,
        icon: s.icon,
        searchValue: buildSearchValue(s.label, s.keywords),
      })),
    [],
  );

  const eventResults: SearchResult[] = useMemo(
    () =>
      events.slice(0, 15).map((e) => ({
        id: e.id,
        title: e.title,
        subtitle: formatDate(e.startDate),
        section: 'Kalender',
        tab: 'kalender',
        icon: <CalendarDays className="h-4 w-4 text-blue-500" />,
        searchValue: buildSearchValue('kalender', e.title, e.type, e.location),
      })),
    [events],
  );

  const taskResults: SearchResult[] = useMemo(
    () =>
      tasks
        .filter((t) => !t.completed)
        .slice(0, 15)
        .map((t) => ({
          id: t.id,
          title: t.title,
          subtitle: t.deadline ? `Deadline: ${formatDate(t.deadline)}` : undefined,
          section: 'Opgaver',
          tab: 'opgaver',
          icon: <CheckSquare className="h-4 w-4 text-green-500" />,
          searchValue: buildSearchValue('opgave', t.title),
        })),
    [tasks],
  );

  const expenseResults: SearchResult[] = useMemo(
    () =>
      expenses.slice(0, 15).map((e) => ({
        id: e.id,
        title: e.title,
        subtitle: `${e.amount} ${e.currency} · ${formatDate(e.date)}`,
        section: 'Udgifter',
        tab: 'expenses',
        icon: <Receipt className="h-4 w-4 text-orange-500" />,
        searchValue: buildSearchValue('udgift', e.title, e.category),
      })),
    [expenses],
  );

  const shoppingResults: SearchResult[] = useMemo(
    () =>
      shoppingItems
        .filter((s) => !s.purchased)
        .slice(0, 15)
        .map((s) => ({
          id: s.id,
          title: s.name,
          subtitle: s.quantity,
          section: 'Indkøb',
          tab: 'mad-hjem',
          icon: <ShoppingCart className="h-4 w-4 text-purple-500" />,
          searchValue: buildSearchValue('indkøb indkob shopping', s.name),
        })),
    [shoppingItems],
  );

  const messageResults: SearchResult[] = useMemo(
    () =>
      messages.slice(0, 15).map((m) => ({
        id: m.id,
        title: m.content.slice(0, 60) + (m.content.length > 60 ? '…' : ''),
        subtitle: formatDate(m.timestamp),
        section: 'Beskeder',
        tab: 'kommunikation',
        icon: <MessageCircle className="h-4 w-4 text-teal-500" />,
        searchValue: buildSearchValue('besked chat', m.content.slice(0, 80)),
      })),
    [messages],
  );

  const milestoneResults: SearchResult[] = useMemo(
    () =>
      milestones.slice(0, 15).map((ms) => ({
        id: ms.id,
        title: ms.title,
        subtitle: formatDate(ms.date),
        section: 'Milepæle',
        tab: 'borneoverblik',
        icon: <Star className="h-4 w-4 text-yellow-500" />,
        searchValue: buildSearchValue('milepæl milestone', ms.title),
      })),
    [milestones],
  );

  const groups = useMemo(
    () =>
      [
        { label: 'Gå til', results: sectionResults },
        { label: 'Kalender', results: eventResults },
        { label: 'Opgaver', results: taskResults },
        { label: 'Udgifter', results: expenseResults },
        { label: 'Indkøb', results: shoppingResults },
        { label: 'Beskeder', results: messageResults },
        { label: 'Milepæle', results: milestoneResults },
      ].filter((g) => g.results.length > 0),
    [sectionResults, eventResults, taskResults, expenseResults, shoppingResults, messageResults, milestoneResults],
  );

  // Filter results by query (deferred for smooth typing)
  const filteredGroups = useMemo(() => {
    if (!deferredQuery.trim()) return groups;
    const normalizedQuery = normalizeDanish(deferredQuery.trim());
    return groups
      .map((g) => ({
        ...g,
        results: g.results.filter((r) =>
          normalizeDanish(r.searchValue).includes(normalizedQuery)
        ),
      }))
      .filter((g) => g.results.length > 0);
  }, [groups, deferredQuery]);

  const totalResults = filteredGroups.reduce((sum, g) => sum + g.results.length, 0);

  return (
    <>
      {variant === 'inline' ? (
        <button
          onClick={() => setOpen(true)}
          className="flex h-12 w-full items-center gap-3 rounded-[8px] border border-[#d8d7cf] bg-[#faf9f6] px-4 text-left text-[#78766d] transition-colors hover:bg-[#f2f1ec]"
          aria-label="Søg (⌘K)"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="text-sm">Søg på tværs af appen…</span>
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex h-10 w-10 items-center justify-center text-[#4a4944] transition-colors"
          aria-label="Åbn global søgning (⌘K)"
          title="Søg (⌘K)"
        >
          <Search className="h-4 w-4" />
        </button>
      )}

      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[100] mx-auto max-w-[430px] bg-[#faf9f6] flex flex-col"
              style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[#e5e3dc]">
                <button
                  onClick={() => setOpen(false)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] text-[#5f5d56] hover:bg-[#eceae2] transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9a978f]" />
                  <input
                    ref={inputRef}
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    inputMode="search"
                    enterKeyHint="search"
                    placeholder="Søg efter sektion, opgave, begivenhed…"
                    className="w-full rounded-[8px] border border-[#d8d7cf] bg-white py-2.5 pl-10 pr-4 text-[15px] text-[#2f2f2d] placeholder:text-[#b0ada4] outline-none focus:border-[#f58a2d] transition-colors"
                  />
                </div>
              </div>

              {/* Results */}
              <div className="flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom,24px)]">
                {totalResults === 0 && query.trim() ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Search className="h-8 w-8 text-[#d8d7cf] mb-3" />
                    <p className="text-[15px] font-medium text-[#78766d]">Ingen resultater fundet</p>
                    <p className="text-[13px] text-[#b0ada4] mt-1">Prøv et andet søgeord</p>
                  </div>
                ) : (
                  filteredGroups.map((group) => (
                    <div key={group.label}>
                      <div className="sticky top-0 bg-[#faf9f6] px-5 py-2 border-b border-[#eeedea]">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9a978f]">
                          {group.label}
                        </p>
                      </div>
                      {group.results.map((result) => (
                        <button
                          key={result.id}
                          onClick={() => handleSelect(result.tab)}
                          className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-[#f2f1ed] active:bg-[#eceae2]"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[#f2f1ed]">
                            {result.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-semibold text-[#2f2f2d] truncate">{result.title}</p>
                            {result.subtitle && (
                              <p className="text-[12px] text-[#9a978f] truncate">{result.subtitle}</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
