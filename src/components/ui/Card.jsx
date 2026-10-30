import { cn } from '@/lib/utils';

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden bg-[var(--surface-1)] border border-[var(--border-subdued)] rounded-[12px] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.25)]',
        'before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/12 before:to-transparent before:pointer-events-none',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between px-4 py-3 border-b border-[var(--border-subdued)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }) {
  return (
    <h3
      className={cn(
        'text-sm sm:text-base font-bold text-[var(--text-primary)] tracking-tight',
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }) {
  return (
    <p
      className={cn('text-xs sm:text-sm text-[var(--text-secondary)] mt-1 leading-relaxed', className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }) {
  return (
    <div className={cn('p-5 sm:p-6', className)} {...props}>
      {children}
    </div>
  );
}

export default Card;
