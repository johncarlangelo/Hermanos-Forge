import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Select({
  options = [],
  value,
  onChange,
  disabled = false,
  placeholder = 'Select...',
  size = 'md',
  className,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const selectedOption =
    options.find((o) => String(o.value) === String(value)) ||
    (value !== undefined && value !== '' ? { label: String(value), value } : null);

  const sizeClasses = {
    sm: 'h-8 px-2.5 text-xs',
    md: 'h-9 px-3 text-xs sm:text-sm',
    lg: 'h-10 px-3.5 text-sm',
  };

  return (
    <div className={cn('relative w-full', className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={cn(
          'flex items-center justify-between w-full bg-[var(--surface-2)] border border-[var(--border-strong)] text-[var(--text-primary)] rounded-[6px] font-medium transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--focus-ring)] focus-visible:border-[var(--accent-primary)]',
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-[var(--surface-hover)] cursor-pointer',
          sizeClasses[size] || sizeClasses.md
        )}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 text-[var(--text-secondary)] transition-transform duration-150 shrink-0 ml-1.5',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className="absolute z-[100] w-full mt-1 bg-[var(--surface-1)] border border-[var(--border-subdued)] rounded-[6px] shadow-lg overflow-hidden py-1 max-h-56 overflow-y-auto"
            role="listbox"
          >
            {options.length === 0 ? (
              <div className="px-3 py-2 text-xs text-[var(--text-secondary)] italic">
                No options available
              </div>
            ) : (
              options.map((option, index) => {
                const isSelected = String(value) === String(option.value);
                return (
                  <button
                    key={index}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={cn(
                      'w-full text-left px-2.5 py-1.5 text-xs flex items-center justify-between transition-colors',
                      isSelected
                        ? 'bg-[var(--accent-muted)] text-[var(--accent-primary)] font-semibold'
                        : 'text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                    )}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0 ml-1.5" />
                    )}
                  </button>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Select;
