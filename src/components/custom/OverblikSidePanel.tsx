import { createPortal } from 'react-dom';
import { useAppStore } from '@/store';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import {
  X,
  UserCircle,
  Star,
  FileText,
  FolderOpen,
  BookOpen,
  CalendarHeart,
  ClipboardList,
  BookHeart,
  ListChecks,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsFamilyMember } from '@/hooks/useIsFamilyMember';

const OVERBLIK_TABS = [
  { id: 'borneoverblik', label: 'Børneoverblik', icon: UserCircle },
  { id: 'milestones', label: 'Milepæle', icon: Star },
  { id: 'meeting-minutes', label: 'Referater', icon: FileText },
  { id: 'dokumenter', label: 'Dokumenter', icon: FolderOpen },
  { id: 'dagbog', label: 'Dagbog', icon: BookOpen },
  { id: 'rutiner', label: 'Rutiner', icon: ListChecks },
  { id: 'vigtige-datoer', label: 'Vigtige datoer', icon: CalendarHeart },
  { id: 'beslutningslog', label: 'Beslutninger', icon: ClipboardList },
  { id: 'familie-og-boern', label: 'Familie & Børn', icon: BookHeart },
] as const;

// Tabs allowed for family members in overblik
const FAMILY_MEMBER_OVERBLIK_TABS = new Set(['borneoverblik', 'milestones']);

export const OVERBLIK_SUB_TAB_IDS = OVERBLIK_TABS.map((t) => t.id);

export function OverblikSidePanel() {
  const { activeTab, setActiveTab, sideMenuOpen, setSideMenuOpen, sideMenuContext } = useAppStore();
  const { isFamilyMember } = useIsFamilyMember();

  return createPortal(
    <AnimatePresence>
      {sideMenuOpen && sideMenuContext === 'overblik' && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9998] bg-black/30"
            onClick={() => setSideMenuOpen(false)}
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="fixed inset-y-0 inset-x-0 z-[9999] mx-auto w-full max-w-[430px] bg-card flex flex-col"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
            drag="x"
            dragConstraints={{ right: 0 }}
            dragElastic={0.15}
            onDragEnd={(_: unknown, info: PanInfo) => {
              if (info.offset.x < -80) setSideMenuOpen(false);
            }}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <h2 className="text-[17px] font-bold text-foreground">Overblik</h2>
              <button
                onClick={() => setSideMenuOpen(false)}
                className="flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-2 pb-[env(safe-area-inset-bottom,0px)]">
              {OVERBLIK_TABS.filter((item) => !isFamilyMember || FAMILY_MEMBER_OVERBLIK_TABS.has(item.id)).map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setSideMenuOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-center gap-3.5 px-5 py-3.5 text-left transition-colors',
                      isActive ? 'bg-transparent' : 'hover:bg-card'
                    )}
                  >
                    <Icon className={cn('h-5 w-5 shrink-0', isActive ? 'text-[#f58a2d]' : 'text-muted-foreground')} />
                    <p
                      className={cn(
                        'flex-1 min-w-0 text-[15px] font-semibold',
                        isActive ? 'text-foreground' : 'text-foreground'
                      )}
                    >
                      {item.label}
                    </p>
                    {isActive && (
                      <div className="h-2 w-2 rounded-full bg-[#f58a2d] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
