import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectSheetOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface SelectSheetProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectSheetOption[];
  placeholder?: string;
  title: string;
  className?: string;
  disabled?: boolean;
  size?: 'sm' | 'default';
}

export function SelectSheet({
  value,
  onValueChange,
  options,
  placeholder = 'Vælg...',
  title,
  className,
  disabled,
  size = 'default',
}: SelectSheetProps) {
  const [open, setOpen] = useState(false);
  const wasScrollLocked = useRef(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);

  const close = useCallback(() => setOpen(false), []);

  const handleOpen = useCallback(() => {
    if (triggerRef.current) {
      setTriggerRect(triggerRef.current.getBoundingClientRect());
    }
    setOpen(true);
  }, []);

  const selectedOption = options.find(o => o.value === value);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close();
      }
    }
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [open, close]);

  // Prevent background scroll (nesting-aware)
  useEffect(() => {
    if (open) {
      wasScrollLocked.current = document.body.style.overflow === 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      if (!wasScrollLocked.current) {
        document.body.style.overflow = '';
      }
    }
    return () => {
      if (!wasScrollLocked.current) {
        document.body.style.overflow = '';
      }
    };
  }, [open]);

  // Calculate position: open below trigger, flip above if not enough space
  const GAP = 4;
  const MAX_CARD_HEIGHT = Math.min(window.innerHeight * 0.5, 400);
  const spaceBelow = triggerRect ? window.innerHeight - triggerRect.bottom - GAP : 999;
  const openAbove = spaceBelow < Math.min(MAX_CARD_HEIGHT, 200);

  const cardStyle: React.CSSProperties = triggerRect ? {
    position: 'fixed' as const,
    left: triggerRect.left,
    width: Math.max(triggerRect.width, 200),
    maxWidth: 400,
    maxHeight: openAbove
      ? triggerRect.top - GAP
      : Math.min(spaceBelow, MAX_CARD_HEIGHT),
    zIndex: 10001,
    ...(openAbove
      ? { bottom: window.innerHeight - triggerRect.top + GAP }
      : { top: triggerRect.bottom + GAP }),
  } : {};

  return (
    <>
      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={handleOpen}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-[8px] border border-border bg-card px-3 py-2 text-sm whitespace-nowrap shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition-[color,box-shadow,border-color] outline-none disabled:cursor-not-allowed disabled:opacity-50',
          size === 'default' ? 'h-11' : 'h-9',
          className,
        )}
      >
        <span className={cn('truncate', !selectedOption && 'text-muted-foreground')}>
          {selectedOption ? (
            <span className="flex items-center gap-2">
              {selectedOption.icon}
              {selectedOption.label}
            </span>
          ) : (
            placeholder
          )}
        </span>
        <ChevronDown className="size-4 shrink-0 opacity-50" />
      </button>

      {/* Portal */}
      {createPortal(
        <AnimatePresence>
          {open && (
            <>
              {/* Invisible backdrop click-catcher */}
              <motion.div
                className="fixed inset-0 z-[10000]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={close}
              />

              {/* Floating card — anchored to trigger */}
              <motion.div
                className="overflow-hidden rounded-xl bg-card border border-border shadow-xl"
                style={cardStyle}
                initial={{ opacity: 0, y: openAbove ? -8 : 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: openAbove ? -8 : 8 }}
              >
                {/* Title */}
                <p className="px-4 pt-3.5 pb-2 text-[13px] font-semibold text-muted-foreground">
                  {title}
                </p>

                {/* Options */}
                <div className="overflow-y-auto" style={{ maxHeight: 'calc(100% - 44px)' }}>
                  {options.map(option => {
                    const isSelected = option.value === value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        className={cn(
                          'flex w-full items-center justify-between px-4 py-3 text-left transition-colors',
                          isSelected
                            ? 'bg-card'
                            : 'hover:bg-card active:bg-card',
                        )}
                        onClick={() => {
                          onValueChange(option.value);
                          close();
                        }}
                      >
                        <span className="flex items-center gap-3">
                          {option.icon}
                          <span className="text-[14px] font-semibold text-foreground">
                            {option.label}
                          </span>
                        </span>
                        {isSelected && (
                          <Check className="h-5 w-5 shrink-0 text-[#f58a2d]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
