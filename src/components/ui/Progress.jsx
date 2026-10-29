import { cn } from '@/lib/utils';

export function Progress({
  value = 0,
  max = 100,
  indeterminate = false,
  className,
}) {
  const percentage = Math.min(Math.max(0, (value / max) * 100), 100);

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={indeterminate ? undefined : Math.round(percentage)}
      className={cn(
        'relative w-full h-1.5 bg-[var(--surface-2)] overflow-hidden rounded-full border border-[var(--border-subdued)]/40',
        className
      )}
    >
      {indeterminate ? (
        <div
          className="absolute inset-y-0 w-1/3 rounded-full animate-indeterminate bg-gradient-to-r from-transparent via-accent-violet to-transparent"
        />
      ) : (
        <div
          className="relative h-full rounded-full transition-all duration-200 ease-out bg-gradient-to-r from-accent-violet via-accent-purple to-accent-amethyst shadow-[0_0_12px_rgba(157,78,221,0.5)]"
          style={{
            width: `${percentage}%`,
          }}
        >
          <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/60 blur-[1px] rounded-full" />
        </div>
      )}
    </div>
  );
}

export default Progress;
