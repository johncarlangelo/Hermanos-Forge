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
      'bg-[#7c3aed] hover:bg-[#6d28d9] active:bg-[#5b21b6] text-white shadow-md shadow-violet-950/40 border border-[#7c3aed4d]',
    secondary:
      'bg-[#14141d] hover:bg-[#1e1e2a] active:bg-[#14141d] text-[#d4d4de] border border-[#2a2a3a]',
    outline:
      'bg-transparent hover:bg-[#ffffff0a] text-[#d4d4de] border border-[#2a2a3a]',
    ghost:
      'bg-transparent hover:bg-[#ffffff0f] text-[#b4b4c2] hover:text-[#f4f4f7]',
    destructive:
      'bg-transparent hover:bg-[#ef44441a] text-[#ef4444] border border-[#ef444455]',
    accentMuted:
      'bg-[#7c3aed1f] hover:bg-[#7c3aed33] text-[#c4b5fd] border border-[#7c3aed4d]',
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
