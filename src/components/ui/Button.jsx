import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Button = forwardRef(function Button(
  {
    variant = 'secondary',
    size = 'md',
    isLoading = false,
    disabled = false,
    className,
    children,
    type = 'button',
    kbd,
    ...props
  },
  ref
) {
  const baseStyles =
    'relative inline-flex items-center justify-center font-medium whitespace-nowrap shrink-0 transition-all duration-150 select-none overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg-base)] disabled:pointer-events-none disabled:opacity-40 cursor-pointer';

  const variants = {
    primary:
      'bg-gradient-to-b from-[#14B8A6] to-[#0D9488] hover:from-[#17C6B3] hover:to-[#0F9E91] text-white shadow-[0_1px_2px_rgba(0,0,0,0.3),0_0_12px_rgba(20,184,166,0.25)] border border-teal-400/30 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent',
    secondary:
      'bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border-subdued)] hover:border-[var(--border-strong)] shadow-sm before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent',
    outline:
      'bg-transparent hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border-strong)] hover:border-[var(--accent-primary)]/50',
    ghost:
      'bg-transparent hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
    destructive:
      'bg-gradient-to-b from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white shadow-sm border border-rose-400/20',
    accentMuted:
      'bg-[var(--accent-muted)] hover:bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/25',
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs rounded-[6px] gap-2',
    md: 'h-9 px-4 text-xs sm:text-sm rounded-[8px] gap-2',
    lg: 'h-11 px-5 text-sm rounded-[8px] gap-2.5 font-semibold',
    icon: 'h-8 w-8 p-0 rounded-[8px] shrink-0',
    iconSm: 'h-7 w-7 p-0 rounded-[6px] shrink-0',
  };

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      whileHover={disabled || isLoading ? undefined : { scale: 1.015 }}
      whileTap={disabled || isLoading ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.12, ease: 'easeOut' }}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
          <span>{children}</span>
        </>
      ) : (
        <>
          {children}
          {kbd && <span className="kbd-hint ml-1.5">{kbd}</span>}
        </>
      )}
    </motion.button>
  );
});

export default Button;
