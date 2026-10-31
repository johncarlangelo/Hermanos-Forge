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
        'relative w-full h-2 bg-[#1e1e2a] overflow-hidden rounded-full',
        className
      )}
    >
      {indeterminate ? (
        <div
          className="absolute inset-y-0 w-1/3 rounded-full animate-indeterminate bg-gradient-to-r from-transparent via-[#8b5cf6] to-transparent"
        />
      ) : (
        <div
          className="relative h-full rounded-full transition-all duration-200 ease-out bg-[#8b5cf6] shadow-[0_0_12px_rgba(139,92,246,0.6)]"
          style={{
            width: `${percentage}%`,
          }}
        />
      )}
    </div>
  );
}

export default Progress;
