import { useState } from 'react';
import type { ComponentType } from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  Repeat,
  CheckSquare,
  MessageCircle,
  UserCircle,
  Settings,
  FileText,
  Briefcase,
  Receipt,
  Baby,
  MoreHorizontal,
  UtensilsCrossed,
  ChevronRight,
  Camera,
  BookOpen,
  CalendarHeart,
  ClipboardList,
  CalendarRange,
  FolderOpen,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';
import { GlobalSearch } from './GlobalSearch';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type NavItem = {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

export function BottomNav() {
  const { activeTab, setActiveTab, isProfessionalView, household } = useAppStore();
  const [moreOpen, setMoreOpen] = useState(false);
  const isTogetherFamily = household?.familyMode === 'together';
  const shouldShowProfessionalNav = isProfessionalView && !isTogetherFamily;

  const mainNavItems: NavItem[] = isTogetherFamily
    ? [
        { id: 'dashboard', label: 'Oversigt', icon: LayoutDashboard },
        { id: 'kalender', label: 'Kalender', icon: CalendarDays },
        { id: 'mad-hjem', label: 'Mad & Hjem', icon: UtensilsCrossed },
        { id: 'opgaver', label: 'Opgaver', icon: CheckSquare },
      ]
    : [
        { id: 'dashboard', label: 'Oversigt', icon: LayoutDashboard },
        { id: 'samversplan', label: 'Samvær', icon: Repeat },
        { id: 'kalender', label: 'Kalender', icon: CalendarDays },
        { id: 'handover', label: 'Aflevering', icon: UserCircle },
      ];

  const newFeatureItems: NavItem[] = [
    { id: 'dokumenter', label: 'Dokumenter', icon: FolderOpen },
    { id: 'fotoalbum', label: 'Fotoalbum', icon: Camera },
    { id: 'dagbog', label: 'Dagbog', icon: BookOpen },
    { id: 'vigtige-datoer', label: 'Datoer', icon: CalendarHeart },
    { id: 'beslutningslog', label: 'Beslutninger', icon: ClipboardList },
    { id: 'aarskalender', label: 'Årskalender', icon: CalendarRange },
  ];

  const moreNavItems: NavItem[] = isTogetherFamily
    ? [
        { id: 'kommunikation', label: 'Chat', icon: MessageCircle },
        { id: 'expenses', label: 'Udgifter', icon: Receipt },
        { id: 'children', label: 'Børn', icon: Baby },
        { id: 'borneoverblik', label: 'Overblik', icon: UserCircle },
        { id: 'meeting-minutes', label: 'Referater', icon: FileText },
        ...newFeatureItems,
      ]
    : [
        { id: 'opgaver', label: 'Opgaver', icon: CheckSquare },
        { id: 'mad-hjem', label: 'Mad & Hjem', icon: UtensilsCrossed },
        { id: 'kommunikation', label: 'Chat', icon: MessageCircle },
        { id: 'expenses', label: 'Udgifter', icon: Receipt },
        { id: 'children', label: 'Børn', icon: Baby },
        { id: 'borneoverblik', label: 'Overblik', icon: UserCircle },
        { id: 'meeting-minutes', label: 'Referater', icon: FileText },
        ...newFeatureItems,
      ];

  const professionalNavItems: NavItem[] = [
    { id: 'cases', label: 'Sager', icon: Briefcase },
    { id: 'meeting-minutes', label: 'Referater', icon: FileText },
    { id: 'dashboard', label: 'Oversigt', icon: LayoutDashboard },
    { id: 'settings', label: 'Indstillinger', icon: Settings },
  ];

  const renderNavButton = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;

    return (
      <button
        key={item.id}
        onClick={() => setActiveTab(item.id)}
        aria-label={item.label}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'relative flex flex-1 min-w-0 flex-col items-center justify-center gap-1 px-0.5 py-1 transition-colors duration-200',
          isActive ? 'text-[#2f2f2f]' : 'text-[#78766d] hover:text-[#4a4945]'
        )}
      >
        <div
          aria-hidden="true"
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-full transition-all',
            isActive
              ? 'bg-[#2f2f2f] text-white shadow-[0_6px_14px_rgba(0,0,0,0.2)]'
              : 'bg-[#ecebe5] text-[#5f5d56]'
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <span aria-hidden="true" className="w-full truncate px-0.5 text-center text-[10px] font-semibold leading-tight tracking-[-0.01em]">
          {item.label}
        </span>
      </button>
    );
  };

  if (shouldShowProfessionalNav) {
    return (
      <nav aria-label="Hovednavigation" className="safe-area-pb fixed inset-x-0 bottom-0 z-50 border-t border-[#d8d7cf] bg-[#f2f1ed]">
        <div className="mx-auto flex h-[84px] w-full max-w-[430px] items-center justify-between px-1">
          {professionalNavItems.map((item) => renderNavButton(item))}
        </div>
      </nav>
    );
  }

  return (
    <nav aria-label="Hovednavigation" className="safe-area-pb fixed inset-x-0 bottom-0 z-50 border-t border-[#d8d7cf] bg-[#f2f1ed]">
      <div className="mx-auto flex h-[84px] w-full max-w-[430px] items-center justify-between px-1">
        {mainNavItems.map((item) => renderNavButton(item))}

        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <button
              aria-label="Flere menupunkter"
              aria-expanded={moreOpen}
              className={cn(
                'relative flex flex-1 min-w-0 flex-col items-center justify-center gap-1 px-0.5 py-1 transition-colors duration-200',
                moreOpen ? 'text-[#2f2f2f]' : 'text-[#78766d] hover:text-[#4a4945]'
              )}
            >
              <div aria-hidden="true" className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full transition-all',
                moreOpen
                  ? 'bg-[#2f2f2f] text-white shadow-[0_6px_14px_rgba(0,0,0,0.2)]'
                  : 'bg-[#ecebe5] text-[#5f5d56]'
              )}>
                <MoreHorizontal className="h-5 w-5" />
              </div>
              <span aria-hidden="true" className="w-full truncate px-0.5 text-center text-[10px] font-semibold leading-tight tracking-[-0.01em]">
                Mere
              </span>
            </button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="h-auto max-h-[76vh] rounded-t-[28px] border-[#d8d7d1] bg-[#f7f6f2] pb-[calc(env(safe-area-inset-bottom,0px)+12px)] shadow-[0_-18px_40px_rgba(0,0,0,0.2)]"
          >
            <div aria-hidden="true" className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-[#d0cec5]" />
            <SheetHeader className="pb-1">
              <SheetTitle className="text-[1.05rem] text-[#2f2f2d]">Menu</SheetTitle>
            </SheetHeader>
            {/* Global search at top of menu */}
            <div className="px-1 pb-2">
              <GlobalSearch variant="inline" />
            </div>
            <nav aria-label="Yderligere menupunkter" className="flex-1 overflow-hidden">
              <div className="max-h-[calc(76vh-120px)] space-y-2 overflow-y-auto px-1 pb-3">
                {moreNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMoreOpen(false);
                      }}
                      aria-label={item.label}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'flex h-14 w-full items-center justify-between rounded-2xl border px-4 text-left transition-colors',
                        isActive
                          ? 'border-[#f5bf8f] bg-[#fff2e6] text-[#2f2f2d]'
                          : 'border-[#d8d7cf] bg-[#faf9f6] text-[#3f3e3a] hover:bg-[#f2f1ec]'
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div aria-hidden="true" className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                          isActive ? 'bg-[#f58a2d] text-white' : 'bg-[#ecebe5] text-[#5f5d56]'
                        )}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="truncate text-sm font-semibold tracking-[-0.01em]">{item.label}</span>
                      </div>
                      <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-[#9d9b93]" />
                    </button>
                  );
                })}
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
