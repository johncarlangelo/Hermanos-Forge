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
      'bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--border-subdued)]',
    accent:
      'bg-purple-950/70 text-purple-200 border border-purple-700/50 font-semibold',
    cyan:
      'bg-cyan-950/70 text-cyan-300 border border-cyan-800/50 font-semibold',
    rose:
      'bg-rose-950/70 text-rose-300 border border-rose-800/50 font-semibold',
    success:
      'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 font-semibold',
    warning:
      'bg-amber-950/60 text-amber-300 border border-amber-800/40 font-semibold',
    danger:
      'bg-rose-950/70 text-rose-300 border border-rose-800/50 font-semibold',
    info:
      'bg-cyan-950/60 text-cyan-300 border border-cyan-800/40 font-semibold',
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
