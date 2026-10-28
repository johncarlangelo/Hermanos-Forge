import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const Input = forwardRef(function Input(
  {
    className,
    type = 'text',
    error = false,
    size = 'md',
    leftIcon,
    rightIcon,
    kbd,
    disabled = false,
    ...props
  },
  ref
) {
  const sizeStyles = {
    sm: 'h-7 px-2.5 text-xs rounded-[6px]',
    md: 'h-9 px-3 text-xs sm:text-sm rounded-[8px]',
    lg: 'h-11 px-3.5 text-sm rounded-[10px]',
  };

  const leftPadding = {
    sm: leftIcon ? 'pl-7' : '',
    md: leftIcon ? 'pl-9' : '',
    lg: leftIcon ? 'pl-10' : '',
  };

  const rightPadding = {
    sm: rightIcon || kbd ? 'pr-7' : '',
    md: rightIcon || kbd ? 'pr-9' : '',
    lg: rightIcon || kbd ? 'pr-10' : '',
  };

  return (
    <div className="relative flex items-center w-full group">
      {leftIcon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] group-focus-within:text-[var(--accent-primary)] pointer-events-none flex items-center justify-center transition-colors">
          {leftIcon}
        </div>
      )}
      <input
        ref={ref}
        type={type}
        disabled={disabled}
        className={cn(
          'w-full bg-[var(--surface-2)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] border transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]/25 focus-visible:border-[var(--accent-primary)]/80',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          'shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]',
          sizeStyles[size] || sizeStyles.md,
          error
            ? 'border-[var(--status-danger)] focus-visible:ring-[var(--status-danger)]/25'
            : 'border-[var(--border-subdued)] hover:border-[var(--border-strong)]',
          leftPadding[size],
          rightPadding[size],
          className
        )}
        {...props}
      />
      {(rightIcon || kbd) && (
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[var(--text-secondary)]">
          {kbd && <span className="kbd-hint">{kbd}</span>}
          {rightIcon}
        </div>
      )}
    </div>
  );
});

export default Input;
