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
        'relative inline-flex items-center shrink-0 bg-[#0b0b10] border border-[#2a2a3a] rounded-full',
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
              'relative inline-flex items-center justify-center font-bold rounded-full transition-colors duration-150 gap-2 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed]/40',
              itemSizeStyles[size] || itemSizeStyles.md,
              isActive
                ? 'text-[#ede9fe]'
                : 'text-[#9a9aac] hover:text-[#f4f4f7]'
            )}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-0 bg-[#7c3aed1f] border border-[#7c3aed4d] rounded-full pointer-events-none"
                transition={{ type: 'spring', bounce: 0.18, duration: 0.3 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={cn(
                    'ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold',
                    isActive
                      ? 'bg-[#7c3aed26] text-[#c4b5fd]'
                      : 'bg-[#1e1e2a] text-[#7a7a8c]'
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
