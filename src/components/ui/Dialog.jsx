import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'max-w-md',
  className,
  closeOnBackdrop = true,
  showCloseButton = true,
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => closeOnBackdrop && onClose && onClose()}
          />

          {/* Dialog Container */}
          <motion.div
            ref={dialogRef}
            initial={{ opacity: 0, scale: 0.96, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'dialog-title' : undefined}
            className={cn(
              'relative w-full bg-[#12121a] border border-[#1e1e2a] rounded-xl shadow-2xl z-10 overflow-hidden flex flex-col max-h-[90vh]',
              maxWidth,
              className
            )}
          >
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#1e1e2a]">
                <div>
                  {title && (
                    <h3
                      id="dialog-title"
                      className="text-sm font-semibold text-[#f4f4f7]"
                    >
                      {title}
                    </h3>
                  )}
                  {description && (
                    <p className="text-xs text-[#7a7a8c] mt-0.5">
                      {description}
                    </p>
                  )}
                </div>
                {showCloseButton && onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close dialog"
                    className="p-1 rounded-md text-[#7a7a8c] hover:text-[#f4f4f7] hover:bg-[#ffffff0f] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#7c3aed]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            <div className="p-5 overflow-y-auto flex-1 text-xs text-[#f4f4f7]">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function DialogFooter({ className, children }) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-2 px-5 py-3 border-t border-[#1e1e2a] bg-[#0f0f16]',
        className
      )}
    >
      {children}
    </div>
  );
}

export default Dialog;
