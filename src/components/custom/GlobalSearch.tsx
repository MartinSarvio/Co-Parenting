import { useEffect, useState, useCallback } from 'react';
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
  CheckSquare,
  Receipt,
  ShoppingCart,
  MessageCircle,
  Star,
  Search,
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
        <CommandInput placeholder="Søg på tværs af appen…" />
        <CommandList>
          <CommandEmpty>Ingen resultater fundet.</CommandEmpty>
          {groups.map((group, i) => (
            <>
              {i > 0 && <CommandSeparator key={`sep-${group.label}`} />}
              <CommandGroup key={group.label} heading={group.label}>
                {group.results.map((result) => (
                  <CommandItem
                    key={result.id}
                    value={`${result.section} ${result.title}`}
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
            </>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
