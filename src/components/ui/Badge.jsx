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
      'bg-[#1e1e2a] text-[#b4b4c2] border border-[#2a2a3a]',
    brand:
      'bg-[#7c3aed1f] text-[#c4b5fd] border border-[#7c3aed4d] font-semibold',
    accent:
      'bg-[#7c3aed1f] text-[#c4b5fd] border border-[#7c3aed4d] font-semibold',
    cyan:
      'bg-[#38bdf81f] text-[#7dd3fc] border border-[#38bdf84d] font-semibold',
    rose:
      'bg-[#ef44441a] text-[#fca5a5] border border-[#ef444455] font-semibold',
    success:
      'bg-[#22c55e14] text-[#86efac] border border-[#22c55e33] font-semibold',
    warning:
      'bg-[#fef08a14] text-[#fde047] border border-[#facc1533] font-semibold',
    danger:
      'bg-[#ef44441a] text-[#fca5a5] border border-[#ef444455] font-semibold',
    info:
      'bg-[#38bdf81f] text-[#7dd3fc] border border-[#38bdf84d] font-semibold',
    outline:
      'bg-transparent text-[#b4b4c2] border border-[#2a2a3a]',
  };

  const sizes = {
    sm: 'px-2.5 py-0.5 text-xs gap-1.5 rounded-full font-medium',
    md: 'px-3 py-1 text-xs gap-1.5 rounded-full font-semibold',
    lg: 'px-3.5 py-1 text-sm gap-2 rounded-full font-semibold',
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
