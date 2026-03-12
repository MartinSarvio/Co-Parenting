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
  Briefcase,
  Receipt,
  Baby,
  UtensilsCrossed,
  Camera,
  Rss,
  FileText,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';
import { GlobalSearch } from './GlobalSearch';
import { BottomSheet } from '@/components/custom/BottomSheet';

/* ── Custom footer icons with active/inactive states ── */

function OversightIcon({ active, className }: { active: boolean; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {active ? (
        <>
          <rect x="3" y="3" width="8" height="8" rx="1.5" fill="#000" />
          <rect x="13" y="3" width="8" height="8" rx="1.5" fill="#000" />
          <rect x="3" y="13" width="8" height="8" rx="1.5" fill="#000" />
          <rect x="13" y="13" width="8" height="8" rx="1.5" fill="#000" />
        </>
      ) : (
        <>
          <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="#000" strokeWidth="1.8" />
          <rect x="13" y="3" width="8" height="8" rx="1.5" stroke="#000" strokeWidth="1.8" />
          <rect x="3" y="13" width="8" height="8" rx="1.5" stroke="#000" strokeWidth="1.8" />
          <rect x="13" y="13" width="8" height="8" rx="1.5" stroke="#000" strokeWidth="1.8" />
        </>
      )}
    </svg>
  );
}

function SamvaerIcon({ active, className }: { active: boolean; className?: string }) {
  const sw = active ? 2.4 : 1.8;
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 1l4 4-4 4" stroke="#000" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 11V9a4 4 0 014-4h14" stroke="#000" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 23l-4-4 4-4" stroke="#000" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 13v2a4 4 0 01-4 4H3" stroke="#000" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function KalenderIcon({ active, className }: { active: boolean; className?: string }) {
  if (active) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="3" width="20" height="19" rx="3" fill="#000" />
        <path d="M8 1v4M16 1v4" stroke="#000" strokeWidth="2" strokeLinecap="round" />
        <rect x="6" y="10" width="3" height="2.5" rx="0.5" fill="#fff" />
        <rect x="10.5" y="10" width="3" height="2.5" rx="0.5" fill="#fff" />
        <rect x="15" y="10" width="3" height="2.5" rx="0.5" fill="#fff" />
        <rect x="6" y="15" width="3" height="2.5" rx="0.5" fill="#fff" />
        <rect x="10.5" y="15" width="3" height="2.5" rx="0.5" fill="#fff" />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="3" width="20" height="19" rx="3" stroke="#000" strokeWidth="1.8" />
      <path d="M8 1v4M16 1v4" stroke="#000" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M2 8h20" stroke="#000" strokeWidth="1.8" />
      <rect x="6" y="11" width="3" height="2.5" rx="0.5" fill="#000" />
      <rect x="10.5" y="11" width="3" height="2.5" rx="0.5" fill="#000" />
      <rect x="15" y="11" width="3" height="2.5" rx="0.5" fill="#000" />
      <rect x="6" y="16" width="3" height="2.5" rx="0.5" fill="#000" />
      <rect x="10.5" y="16" width="3" height="2.5" rx="0.5" fill="#000" />
    </svg>
  );
}

function AfleveringIcon({ active, className }: { active: boolean; className?: string }) {
  if (active) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="7" r="4" fill="#000" />
        <path d="M4 21v-2a6 6 0 0112 0v2" fill="#000" />
        <path d="M16 11l2 2 4-4" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="7" r="4" stroke="#000" strokeWidth="1.8" />
      <path d="M4 21v-2a6 6 0 0112 0v2" stroke="#000" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 11l2 2 4-4" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MereIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="5" cy="12" r="1.5" fill="#000" />
      <circle cx="12" cy="12" r="1.5" fill="#000" />
      <circle cx="19" cy="12" r="1.5" fill="#000" />
    </svg>
  );
}

function OpgaverIcon({ active, className }: { active: boolean; className?: string }) {
  if (active) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="18" height="18" rx="3" fill="#000" />
        <path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="18" height="18" rx="3" stroke="#000" strokeWidth="1.8" />
      <path d="M9 12l2 2 4-4" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MadHjemIcon({ active, className }: { active: boolean; className?: string }) {
  const sw = active ? 2.4 : 1.8;
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2" stroke="#000" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 2v20" stroke="#000" strokeWidth={sw} strokeLinecap="round" />
      <path d="M21 15V2v0a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" stroke="#000" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* Map of nav item IDs to custom icon components */
const customIconMap: Record<string, ComponentType<{ active: boolean; className?: string }>> = {
  dashboard: OversightIcon,
  samversplan: SamvaerIcon,
  kalender: KalenderIcon,
  handover: AfleveringIcon,
  opgaver: OpgaverIcon,
  'mad-hjem': MadHjemIcon,
};

type NavItem = {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

export function BottomNav() {
  const { activeTab, setActiveTab, isProfessionalView, household, fullScreenOverlayOpen, kommunikationThreadId, currentUser, handoverAction, feedTab, activeSettingsTab, milestoneFormMode, meetingFormMode, docFormMode } = useAppStore();
  const [moreOpen, setMoreOpen] = useState(false);
  const isTogetherFamily = household?.familyMode === 'together';
  const isSingleParent = household?.familyMode === 'single_parent';
  const showHandoverNav = !isTogetherFamily && !isSingleParent;
  const shouldShowProfessionalNav = isProfessionalView && currentUser?.isAdmin === true;

  if (fullScreenOverlayOpen || kommunikationThreadId || activeTab === 'swap-request' || activeTab === 'kalender-week' || activeTab === 'group-detail' || activeTab === 'profile' || activeTab === 'create-group' || handoverAction === 'add-pakkeliste' || (activeTab === 'feed' && (feedTab === 'forum' || feedTab === 'tilbud')) || (activeTab === 'settings' && activeSettingsTab === 'info') || milestoneFormMode || meetingFormMode || docFormMode) return null;

  const mainNavItems: NavItem[] = isTogetherFamily
    ? [
        { id: 'dashboard', label: 'Oversigt', icon: LayoutDashboard },
        { id: 'kalender', label: 'Kalender', icon: CalendarDays },
        { id: 'mad-hjem', label: 'Mad & Hjem', icon: UtensilsCrossed },
        { id: 'opgaver', label: 'Opgaver', icon: CheckSquare },
      ]
    : showHandoverNav
    ? [
        { id: 'dashboard', label: 'Oversigt', icon: LayoutDashboard },
        { id: 'samversplan', label: 'Samvær', icon: Repeat },
        { id: 'kalender', label: 'Kalender', icon: CalendarDays },
        { id: 'handover', label: 'Aflevering', icon: UserCircle },
      ]
    : [
        // single_parent: samværsplan uden aflevering
        { id: 'dashboard', label: 'Oversigt', icon: LayoutDashboard },
        { id: 'samversplan', label: 'Samvær', icon: Repeat },
        { id: 'kalender', label: 'Kalender', icon: CalendarDays },
        { id: 'opgaver', label: 'Opgaver', icon: CheckSquare },
      ];

  const moreNavItems: NavItem[] = isTogetherFamily
    ? [
        { id: 'kommunikation', label: 'Chat', icon: MessageCircle },
        { id: 'expenses', label: 'Udgifter', icon: Receipt },
        { id: 'children', label: 'Børn', icon: Baby },
        { id: 'borneoverblik', label: 'Overblik', icon: UserCircle },
        { id: 'fotoalbum', label: 'Fotoalbum', icon: Camera },
        { id: 'feed', label: 'Feed', icon: Rss },
      ]
    : [
        { id: 'opgaver', label: 'Opgaver', icon: CheckSquare },
        { id: 'mad-hjem', label: 'Mad & Hjem', icon: UtensilsCrossed },
        { id: 'kommunikation', label: 'Chat', icon: MessageCircle },
        { id: 'expenses', label: 'Udgifter', icon: Receipt },
        { id: 'children', label: 'Børn', icon: Baby },
        { id: 'borneoverblik', label: 'Overblik', icon: UserCircle },
        { id: 'fotoalbum', label: 'Fotoalbum', icon: Camera },
        { id: 'feed', label: 'Feed', icon: Rss },
      ];

  const professionalNavItems: NavItem[] = [
    { id: 'cases', label: 'Sager', icon: Briefcase },
    { id: 'meeting-minutes', label: 'Referater', icon: FileText },
    { id: 'dashboard', label: 'Oversigt', icon: LayoutDashboard },
    { id: 'settings', label: 'Indstillinger', icon: Settings },
  ];

  const renderNavButton = (item: NavItem, useCustomIcon = false) => {
    const isActive = activeTab === item.id;
    const CustomIcon = useCustomIcon ? customIconMap[item.id] : undefined;
    const LucideIcon = item.icon;

    return (
      <button
        key={item.id}
        onClick={() => setActiveTab(item.id)}
        aria-label={item.label}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'relative flex flex-1 min-w-0 flex-col items-center justify-center gap-1 px-0.5 py-1 transition-colors duration-200',
          isActive ? 'text-[#000]' : 'text-[#78766d] hover:text-[#4a4945]'
        )}
      >
        {CustomIcon ? (
          <CustomIcon aria-hidden="true" active={isActive} className="h-6 w-6" />
        ) : (
          <LucideIcon aria-hidden="true" className={cn('h-6 w-6 transition-colors', isActive ? 'text-[#000]' : 'text-[#9d9b93]')} />
        )}
        <span aria-hidden="true" className={cn(
          "w-full truncate px-0.5 text-center text-[10px] font-semibold leading-tight tracking-[-0.01em]",
          isActive ? 'text-[#000]' : ''
        )}>
          {item.label}
        </span>
      </button>
    );
  };

  if (shouldShowProfessionalNav) {
    return (
      <nav aria-label="Hovednavigation" className="safe-area-pb fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[430px] bg-[#f2f1ed]">
        <div className="mx-auto flex h-[54px] w-full max-w-[430px] items-center justify-between px-1 pt-2">
          {professionalNavItems.map((item) => renderNavButton(item))}
        </div>
      </nav>
    );
  }

  return (
    <nav aria-label="Hovednavigation" className="safe-area-pb fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[430px] bg-[#f2f1ed]">
      <div className="mx-auto flex h-[54px] w-full max-w-[430px] items-center justify-between px-1 pt-2">
        {mainNavItems.map((item) => renderNavButton(item, true))}

        <button
          onClick={() => setMoreOpen(true)}
          aria-label="Flere menupunkter"
          aria-expanded={moreOpen}
          className={cn(
            'relative flex flex-1 min-w-0 flex-col items-center justify-center gap-1 px-0.5 py-1 transition-colors duration-200',
            'text-[#000]'
          )}
        >
          <MereIcon aria-hidden="true" className="h-6 w-6" />
          <span aria-hidden="true" className="w-full truncate px-0.5 text-center text-[10px] font-semibold leading-tight tracking-[-0.01em]">
            Mere
          </span>
        </button>
        <BottomSheet open={moreOpen} onOpenChange={setMoreOpen} title="Menu">
          {/* Global search at top of menu */}
          <div className="pb-1 shrink-0">
            <GlobalSearch variant="inline" />
          </div>
          <nav aria-label="Yderligere menupunkter">
            <div className="grid grid-cols-3 gap-2">
              {[...moreNavItems, { id: 'settings', label: 'Indstillinger', icon: Settings }].map((item) => {
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
                      'flex flex-col items-center gap-2 rounded-[8px] py-4 transition-colors',
                      isActive
                        ? 'bg-[#fff2e6] text-[#2f2f2d]'
                        : 'text-[#3f3e3a] hover:bg-[#f2f1ec]'
                    )}
                  >
                    <Icon aria-hidden="true" className={cn('h-6 w-6', isActive ? 'text-[#f58a2d]' : 'text-[#5f5d56]')} />
                    <span className="text-[12px] font-semibold tracking-[-0.01em]">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </BottomSheet>
      </div>
    </nav>
  );
}
