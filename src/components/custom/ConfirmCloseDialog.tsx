import { AnimatePresence, motion } from 'framer-motion';

interface ConfirmCloseDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  confirmColor?: string;
}

export function ConfirmCloseDialog({
  open,
  onCancel,
  onConfirm,
  title = 'Vil du afslutte?',
  description = 'Dine ændringer gemmes ikke.',
  cancelLabel = 'Fortsæt redigering',
  confirmLabel = 'Afslut',
  confirmColor = '#ef4444',
}: ConfirmCloseDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="mx-6 w-full max-w-[300px] rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-[#2f2f2d] text-center">{title}</h3>
            <p className="mt-1 text-sm text-[#78766d] text-center">{description}</p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={onCancel}
                className="flex-1 rounded-xl border border-[#e8e7e0] bg-white py-2.5 text-sm font-medium text-[#2f2f2d] active:scale-[0.98] transition-all"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 rounded-xl py-2.5 text-sm font-medium text-white active:scale-[0.98] transition-all"
                style={{ backgroundColor: confirmColor }}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
