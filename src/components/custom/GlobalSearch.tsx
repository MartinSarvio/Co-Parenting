import React, { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/store';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  CalendarDays,
  CalendarRange,
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
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  section: string;
  tab: string;
  icon: React.ReactNode;
}

// All navigable sections in the app
const sectionItems: { id: string; label: string; tab: string; keywords: string; icon: React.ReactNode }[] = [
  { id: 'nav-dashboard', label: 'Oversigt', tab: 'dashboard', keywords: 'oversigt dashboard hjem forside', icon: <LayoutDashboard className="h-4 w-4 text-[#5f5d56]" /> },
  { id: 'nav-samvaer', label: 'Samværsplan', tab: 'samversplan', keywords: 'samvær samværsplan custody plan', icon: <Repeat className="h-4 w-4 text-[#5f5d56]" /> },
  { id: 'nav-kalender', label: 'Kalender', tab: 'kalender', keywords: 'kalender calendar begivenheder events', icon: <CalendarDays className="h-4 w-4 text-blue-500" /> },
  { id: 'nav-handover', label: 'Aflevering', tab: 'handover', keywords: 'aflevering handover hente bringe', icon: <UserCircle className="h-4 w-4 text-[#5f5d56]" /> },
  { id: 'nav-opgaver', label: 'Opgaver & Indkøb', tab: 'opgaver', keywords: 'opgaver tasks indkøb shopping todo', icon: <CheckSquare className="h-4 w-4 text-green-500" /> },
  { id: 'nav-madhjem', label: 'Mad & Hjem', tab: 'mad-hjem', keywords: 'mad hjem madplan rengøring opskrifter meal', icon: <UtensilsCrossed className="h-4 w-4 text-[#bf6722]" /> },
  { id: 'nav-chat', label: 'Chat / Kommunikation', tab: 'kommunikation', keywords: 'chat kommunikation beskeder messages', icon: <MessageCircle className="h-4 w-4 text-teal-500" /> },
  { id: 'nav-expenses', label: 'Udgifter', tab: 'expenses', keywords: 'udgifter expenses økonomi penge', icon: <Receipt className="h-4 w-4 text-orange-500" /> },
  { id: 'nav-children', label: 'Børn', tab: 'children', keywords: 'børn children barn', icon: <Baby className="h-4 w-4 text-[#bf6722]" /> },
  { id: 'nav-overblik', label: 'Børneoverblik', tab: 'borneoverblik', keywords: 'børneoverblik overblik milestones dokumenter', icon: <UserCircle className="h-4 w-4 text-[#5f5d56]" /> },
  { id: 'nav-referater', label: 'Referater', tab: 'meeting-minutes', keywords: 'referater mødereferat meeting minutes', icon: <FileText className="h-4 w-4 text-[#5f5d56]" /> },
  { id: 'nav-dokumenter', label: 'Dokumenter', tab: 'dokumenter', keywords: 'dokumenter documents blanketter familieretshuset', icon: <FolderOpen className="h-4 w-4 text-[#5f5d56]" /> },
  { id: 'nav-fotoalbum', label: 'Fotoalbum', tab: 'fotoalbum', keywords: 'fotoalbum billeder photos fotos', icon: <Camera className="h-4 w-4 text-[#5f5d56]" /> },
  { id: 'nav-dagbog', label: 'Dagbog', tab: 'dagbog', keywords: 'dagbog diary journal', icon: <BookOpen className="h-4 w-4 text-[#5f5d56]" /> },
  { id: 'nav-datoer', label: 'Vigtige datoer', tab: 'vigtige-datoer', keywords: 'vigtige datoer key dates fødselsdage', icon: <CalendarHeart className="h-4 w-4 text-[#5f5d56]" /> },
  { id: 'nav-beslutninger', label: 'Beslutningslog', tab: 'beslutningslog', keywords: 'beslutninger beslutningslog decisions', icon: <ClipboardList className="h-4 w-4 text-[#5f5d56]" /> },
  { id: 'nav-aarskalender', label: 'Årskalender', tab: 'aarskalender', keywords: 'årskalender aarskalender year calendar oversigt', icon: <CalendarRange className="h-4 w-4 text-[#5f5d56]" /> },
  { id: 'nav-settings', label: 'Indstillinger', tab: 'settings', keywords: 'indstillinger settings profil konto', icon: <Settings className="h-4 w-4 text-[#5f5d56]" /> },
  { id: 'nav-sager', label: 'Professionel oversigt', tab: 'cases', keywords: 'professionel sager cases sagsbehandler', icon: <Briefcase className="h-4 w-4 text-indigo-500" /> },
];

export function GlobalSearch({ variant = 'icon' }: { variant?: 'icon' | 'inline' }) {
  const [open, setOpen] = useState(false);
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

  const handleSelect = useCallback(
    (tab: string) => {
      setActiveTab(tab);
      setOpen(false);
    },
    [setActiveTab],
  );

  // Section navigation results (always shown)
  const sectionResults: SearchResult[] = sectionItems.map((s) => ({
    id: s.id,
    title: s.label,
    subtitle: 'Gå til sektion',
    section: 'Sektioner',
    tab: s.tab,
    icon: s.icon,
  }));

  const eventResults: SearchResult[] = events.slice(0, 20).map((e) => ({
    id: e.id,
    title: e.title,
    subtitle: formatDate(e.startDate),
    section: 'Kalender',
    tab: 'kalender',
    icon: <CalendarDays className="h-4 w-4 text-blue-500" />,
  }));

  const taskResults: SearchResult[] = tasks
    .filter((t) => !t.completed)
    .slice(0, 20)
    .map((t) => ({
      id: t.id,
      title: t.title,
      subtitle: t.deadline ? `Deadline: ${formatDate(t.deadline)}` : undefined,
      section: 'Opgaver',
      tab: 'opgaver',
      icon: <CheckSquare className="h-4 w-4 text-green-500" />,
    }));

  const expenseResults: SearchResult[] = expenses.slice(0, 20).map((e) => ({
    id: e.id,
    title: e.title,
    subtitle: `${e.amount} ${e.currency} · ${formatDate(e.date)}`,
    section: 'Udgifter',
    tab: 'expenses',
    icon: <Receipt className="h-4 w-4 text-orange-500" />,
  }));

  const shoppingResults: SearchResult[] = shoppingItems
    .filter((s) => !s.purchased)
    .slice(0, 20)
    .map((s) => ({
      id: s.id,
      title: s.name,
      subtitle: s.quantity,
      section: 'Indkøb',
      tab: 'mad-hjem',
      icon: <ShoppingCart className="h-4 w-4 text-purple-500" />,
    }));

  const messageResults: SearchResult[] = messages.slice(0, 20).map((m) => ({
    id: m.id,
    title: m.content.slice(0, 60) + (m.content.length > 60 ? '…' : ''),
    subtitle: formatDate(m.timestamp),
    section: 'Beskeder',
    tab: 'kommunikation',
    icon: <MessageCircle className="h-4 w-4 text-teal-500" />,
  }));

  const milestoneResults: SearchResult[] = milestones.slice(0, 20).map((ms) => ({
    id: ms.id,
    title: ms.title,
    subtitle: formatDate(ms.date),
    section: 'Milepæle',
    tab: 'borneoverblik',
    icon: <Star className="h-4 w-4 text-yellow-500" />,
  }));

  const groups: { label: string; results: SearchResult[] }[] = [
    { label: 'Gå til', results: sectionResults },
    { label: 'Kalender', results: eventResults },
    { label: 'Opgaver', results: taskResults },
    { label: 'Udgifter', results: expenseResults },
    { label: 'Indkøb', results: shoppingResults },
    { label: 'Beskeder', results: messageResults },
    { label: 'Milepæle', results: milestoneResults },
  ].filter((g) => g.results.length > 0);

  return (
    <>
      {variant === 'inline' ? (
        <button
          onClick={() => setOpen(true)}
          className="flex h-12 w-full items-center gap-3 rounded-2xl border border-[#d8d7cf] bg-[#faf9f6] px-4 text-left text-[#78766d] transition-colors hover:bg-[#f2f1ec]"
          aria-label="Søg (⌘K)"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="text-sm">Søg på tværs af appen…</span>
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d7d5ce] bg-[#faf9f6] text-[#4a4944] transition-colors hover:bg-[#f1f0ea]"
          aria-label="Åbn global søgning (⌘K)"
          title="Søg (⌘K)"
        >
          <Search className="h-4 w-4" />
        </button>
      )}

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Søg efter sektion, opgave, begivenhed…" />
        <CommandList>
          <CommandEmpty>Ingen resultater fundet.</CommandEmpty>
          {groups.map((group, i) => (
            <React.Fragment key={group.label}>
              {i > 0 && <CommandSeparator />}
              <CommandGroup heading={group.label}>
                {group.results.map((result) => (
                  <CommandItem
                    key={result.id}
                    value={`${result.section} ${result.title} ${
                      sectionItems.find(s => s.id === result.id)?.keywords || ''
                    }`}
                    onSelect={() => handleSelect(result.tab)}
                  >
                    {result.icon}
                    <div className="ml-2 min-w-0">
                      <div className="truncate text-sm font-medium">{result.title}</div>
                      {result.subtitle && (
                        <div className="truncate text-xs text-muted-foreground">{result.subtitle}</div>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </React.Fragment>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
