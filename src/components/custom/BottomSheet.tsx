import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  /** When true, sheet wraps tightly around content instead of stretching to 90vh */
  compact?: boolean;
}

export function BottomSheet({ open, onOpenChange, title, children, compact }: BottomSheetProps) {
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, close]);

  // Prevent background scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[80] bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
          />

          {/* Sheet */}
          <motion.div
            className={`fixed inset-x-0 bottom-0 z-[81] mx-auto max-w-[430px] flex flex-col bg-[#f7f6f2] rounded-t-3xl shadow-[0_-8px_40px_rgba(0,0,0,0.12)] ${compact ? 'max-h-[70vh]' : 'max-h-[90vh]'}`}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(_: unknown, info: PanInfo) => {
              if (info.offset.y > 100) close();
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="h-1 w-10 rounded-full bg-[#d8d7cf]" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-center px-4 pb-3 shrink-0">
              <h2 className="text-[17px] font-bold text-[#2f2f2d] truncate">
                {title}
              </h2>
            </div>

            {/* Content */}
            <div className="overflow-y-auto overscroll-contain px-4 pt-4 pb-[env(safe-area-inset-bottom,24px)]">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
