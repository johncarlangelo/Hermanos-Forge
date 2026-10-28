import { cn } from '@/lib/utils';

export function Badge({
  variant = 'default',
  size = 'md',
  icon,
  pulse = false,
  children,
  className,
  ...props
}) {
  const variants = {
    default:
      'bg-[var(--surface-2)] text-[var(--text-secondary)]',
    accent:
      'bg-[var(--accent-muted)] text-[var(--accent-primary)] font-semibold',
    success:
      'bg-emerald-500/15 text-emerald-400 font-semibold',
    warning:
      'bg-amber-500/15 text-amber-400 font-semibold',
    danger:
      'bg-rose-500/15 text-rose-400 font-semibold',
    info:
      'bg-sky-500/15 text-sky-400 font-semibold',
    outline:
      'bg-transparent text-[var(--text-secondary)] border border-[var(--border-strong)]',
  };

  const sizes = {
    sm: 'px-2.5 py-0.5 text-[10px] gap-1.5 rounded-full',
    md: 'px-2.5 py-0.5 text-[11px] gap-1.5 rounded-full',
    lg: 'px-3 py-1 text-xs gap-2 rounded-full font-semibold',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium select-none shrink-0 tracking-tight whitespace-nowrap',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />
        </span>
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}

export default Badge;
