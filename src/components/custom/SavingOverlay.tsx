import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

interface SavingOverlayProps {
  open: boolean;
  label?: string;
}

export function SavingOverlay({ open, label = 'Gemmer...' }: SavingOverlayProps) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/50"
        >
          <div className="h-10 w-10 rounded-full border-[3px] border-white/30 border-t-white animate-spin" />
          <p className="mt-3 text-[15px] font-semibold text-white">{label}</p>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
