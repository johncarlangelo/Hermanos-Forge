import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function Tabs({
  tabs = [],
  activeTab,
  onChange,
  size = 'md',
  layoutId = 'tab-indicator',
  className,
}) {
  const sizeStyles = {
    sm: 'h-8 p-1 text-xs rounded-[8px]',
    md: 'h-9 p-1 text-xs sm:text-sm rounded-[10px]',
  };

  const itemSizeStyles = {
    sm: 'px-2.5 py-1 text-xs whitespace-nowrap shrink-0',
    md: 'px-3.5 py-1.5 text-xs sm:text-sm whitespace-nowrap shrink-0',
  };

  return (
    <div
      role="tablist"
      className={cn(
        'relative inline-flex items-center shrink-0 bg-[var(--surface-2)] border border-[var(--border-subdued)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]',
        sizeStyles[size] || sizeStyles.md,
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative inline-flex items-center justify-center font-medium rounded-[6px] transition-colors duration-150 gap-2 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]/40',
              itemSizeStyles[size] || itemSizeStyles.md,
              isActive
                ? 'text-[var(--text-primary)] font-semibold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            )}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-0 bg-[var(--surface-1)] border border-[var(--border-subdued)] rounded-[6px] shadow-sm pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent"
                transition={{ type: 'spring', bounce: 0.18, duration: 0.3 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={cn(
                    'ml-1 px-1.5 py-0.5 rounded-full text-xs font-mono font-semibold',
                    isActive
                      ? 'bg-[var(--accent-muted)] text-[var(--accent-primary)]'
                      : 'bg-[var(--surface-hover)] text-[var(--text-tertiary)]'
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
