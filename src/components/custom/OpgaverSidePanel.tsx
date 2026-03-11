import { createPortal } from 'react-dom';
import { useAppStore } from '@/store';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import {
  X,
  CheckSquare,
  SprayCan,
  ShoppingCart,
  Layout,
  History,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const OPGAVER_TABS = [
  { id: 'tasks', label: 'Opgaver', icon: CheckSquare },
  { id: 'cleaning', label: 'Rengøring', icon: SprayCan },
  { id: 'shopping', label: 'Indkøb', icon: ShoppingCart },
  { id: 'templates', label: 'Skabeloner', icon: Layout },
  { id: 'historik', label: 'Historik', icon: History },
] as const;

export type OpgaverSubTab = typeof OPGAVER_TABS[number]['id'];

interface Props {
  activeSubTab: string;
  onSelectSubTab: (tab: OpgaverSubTab) => void;
}

export function OpgaverSidePanel({ activeSubTab, onSelectSubTab }: Props) {
  const { sideMenuOpen, setSideMenuOpen, sideMenuContext, setActiveTab } = useAppStore();

  return createPortal(
    <AnimatePresence>
      {sideMenuOpen && sideMenuContext === 'opgaver' && (
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
            className="fixed inset-y-0 inset-x-0 z-[9999] mx-auto w-full max-w-[430px] bg-white flex flex-col"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
            drag="x"
            dragConstraints={{ right: 0 }}
            dragElastic={0.15}
            onDragEnd={(_: unknown, info: PanInfo) => {
              if (info.offset.x < -80) setSideMenuOpen(false);
            }}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#eeedea]">
              <h2 className="text-[17px] font-bold text-[#2f2f2d]">Opgaver & Hjem</h2>
              <button
                onClick={() => setSideMenuOpen(false)}
                className="flex items-center justify-center text-[#5f5d56] hover:text-[#2f2f2d] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-2 pb-[env(safe-area-inset-bottom,0px)]">
              {OPGAVER_TABS.map((item) => {
                const Icon = item.icon;
                const isActive = item.id === 'historik'
                  ? false
                  : activeSubTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === 'historik') {
                        setActiveTab('historik');
                      } else {
                        onSelectSubTab(item.id);
                      }
                      setSideMenuOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-center gap-3.5 px-5 py-3.5 text-left transition-colors',
                      isActive ? 'bg-transparent' : 'hover:bg-[#faf9f6]'
                    )}
                  >
                    <Icon className={cn('h-5 w-5 shrink-0', isActive ? 'text-[#f58a2d]' : 'text-[#7a786f]')} />
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
