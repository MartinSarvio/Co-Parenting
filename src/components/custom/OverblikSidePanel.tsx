import { createPortal } from 'react-dom';
import { useAppStore } from '@/store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  LayoutDashboard,
  FileText,
  FolderOpen,
  BookOpen,
  CalendarHeart,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const OVERBLIK_TABS = [
  { id: 'dashboard', label: 'Overblik', icon: LayoutDashboard },
  { id: 'meeting-minutes', label: 'Referater', icon: FileText },
  { id: 'dokumenter', label: 'Dokumenter', icon: FolderOpen },
  { id: 'dagbog', label: 'Dagbog', icon: BookOpen },
  { id: 'vigtige-datoer', label: 'Vigtige datoer', icon: CalendarHeart },
  { id: 'beslutningslog', label: 'Beslutninger', icon: ClipboardList },
] as const;

export const OVERBLIK_SUB_TAB_IDS = OVERBLIK_TABS.map((t) => t.id);

export function OverblikSidePanel() {
  const { activeTab, setActiveTab, sideMenuOpen, setSideMenuOpen } = useAppStore();

  return createPortal(
    <AnimatePresence>
      {sideMenuOpen && (
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
            className="fixed inset-y-0 left-0 z-[9999] w-full bg-white flex flex-col"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#eeedea]">
              <h2 className="text-[17px] font-bold text-[#2f2f2d]">Overblik</h2>
              <button
                onClick={() => setSideMenuOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f2f1ed] text-[#5f5d56]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-2 pb-[env(safe-area-inset-bottom,0px)]">
              {OVERBLIK_TABS.map((item) => {
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
                      isActive ? 'bg-[#fff2e6]' : 'hover:bg-[#faf9f6]'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-xl',
                        isActive
                          ? 'bg-[#f58a2d] text-white'
                          : 'bg-[#f2f1ed] text-[#7a786f]'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <p
                      className={cn(
                        'flex-1 min-w-0 text-[15px] font-semibold',
                        isActive ? 'text-[#2f2f2d]' : 'text-[#4a4945]'
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
