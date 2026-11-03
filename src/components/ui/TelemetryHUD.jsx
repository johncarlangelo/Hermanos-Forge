import { useState } from 'react';
import {
  Activity,
  Clock,
  HardDrive,
  Layers,
  Terminal,
  Copy,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import {
  formatSpeed,
  formatEta,
  formatVolume,
  getStreamPhase,
  getStreamPhaseBadgeVariant,
  generateTelemetrySummary,
} from '@/utils/telemetry';

/**
 * Real-time download telemetry HUD displaying speed, ETA countdown,
 * processed data volume, stream phase, and monospace copyable log strip.
 *
 * @param {object} props
 * @param {object|null} props.telemetry - Parsed telemetry JSON payload from backend
 * @param {string} props.status - Current engine status text
 * @param {boolean} props.isDownloading - Active download lifecycle flag
 * @param {string} [props.className] - Optional custom CSS classes
 */
export function TelemetryHUD({
  telemetry = null,
  status = '',
  isDownloading = true,
  className,
}) {
  const [copied, setCopied] = useState(false);

  const phase = getStreamPhase(telemetry, status, isDownloading);
  const phaseVariant = getStreamPhaseBadgeVariant(phase);
  const isStreamActive = Boolean(telemetry?.speed && telemetry.speed > 0);

  const displayStatus =
    phase === 'Receiving Stream' && status.toLowerCase().includes('processing')
      ? 'Receiving media stream chunks...'
      : status || (isDownloading ? 'Receiving media stream chunks...' : 'Idle');

  const handleCopyLog = async () => {
    try {
      const summary = generateTelemetrySummary(telemetry, displayStatus, phase);
      let copiedSuccessfully = false;

      if (navigator?.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(summary);
          copiedSuccessfully = true;
        } catch {
          // Clipboard writeText threw, fall back to execCommand
        }
      }

      if (!copiedSuccessfully) {
        const textArea = document.createElement('textarea');
        textArea.value = summary;
        textArea.style.position = 'fixed';
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        copiedSuccessfully = document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      if (copiedSuccessfully) {
        setCopied(true);
        toast.success('Status log copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
      } else {
        throw new Error('Clipboard copy denied');
      }
    } catch (err) {
      console.error('Clipboard copy failed:', err);
      toast.error('Failed to copy status log.');
    }
  };

  return (
    <div
      data-purpose="download-telemetry-hud"
      className={cn(
        'relative overflow-hidden rounded-xl border border-purple-900/40 bg-obsidian-950/90 p-4 space-y-3.5 shadow-inner',
        'before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-purple-400/40 before:to-transparent before:pointer-events-none',
        className
      )}
    >
      {/* 4-Column Performance Metrics Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Metric 1: Transfer Speed Gauge */}
        <div className="p-3 rounded-lg bg-obsidian-900/80 border border-purple-900/30 flex flex-col justify-between gap-1.5 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between min-w-0">
            <span className="font-mono text-[11px] uppercase tracking-wider text-purple-300/80 font-semibold flex items-center gap-1.5 truncate">
              <Activity className="w-3.5 h-3.5 text-accent-neon shrink-0" />
              <span>Speed</span>
            </span>
            {isStreamActive ? (
              <span className="relative flex h-2 w-2 shrink-0 ml-1.5" title="Active Stream Transfer">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-neon opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-neon" />
              </span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-purple-900/60 shrink-0 ml-1.5" title="Standby" />
            )}
          </div>
          <div className="font-mono text-sm sm:text-base font-bold text-slate-100 tabular-nums truncate">
            {formatSpeed(telemetry?.speed)}
          </div>
        </div>

        {/* Metric 2: Dynamic ETA Countdown */}
        <div className="p-3 rounded-lg bg-obsidian-900/80 border border-purple-900/30 flex flex-col justify-between gap-1.5 min-w-0 overflow-hidden">
          <div className="flex items-center gap-1.5 min-w-0">
            <Clock className="w-3.5 h-3.5 text-purple-300 shrink-0" />
            <span className="font-mono text-[11px] uppercase tracking-wider text-purple-300/80 font-semibold truncate">
              ETA
            </span>
          </div>
          <div className="font-mono text-sm sm:text-base font-bold text-accent-neon tabular-nums truncate">
            {formatEta(telemetry?.eta)}
          </div>
        </div>

        {/* Metric 3: Processed Data Volume */}
        <div className="p-3 rounded-lg bg-obsidian-900/80 border border-purple-900/30 flex flex-col justify-between gap-1.5 min-w-0 overflow-hidden">
          <div className="flex items-center gap-1.5 min-w-0">
            <HardDrive className="w-3.5 h-3.5 text-purple-300 shrink-0" />
            <span className="font-mono text-[11px] uppercase tracking-wider text-purple-300/80 font-semibold truncate">
              Volume
            </span>
          </div>
          <div
            className="font-mono text-xs sm:text-sm font-semibold text-slate-200 tabular-nums truncate"
            title={formatVolume(telemetry?.downloaded, telemetry?.total)}
          >
            {formatVolume(telemetry?.downloaded, telemetry?.total)}
          </div>
        </div>

        {/* Metric 4: Stream Phase Badge */}
        <div className="p-3 rounded-lg bg-obsidian-900/80 border border-purple-900/30 flex flex-col justify-between gap-1.5 min-w-0 overflow-hidden">
          <div className="flex items-center gap-1.5 min-w-0">
            <Layers className="w-3.5 h-3.5 text-purple-300 shrink-0" />
            <span className="font-mono text-[11px] uppercase tracking-wider text-purple-300/80 font-semibold truncate">
              Phase
            </span>
          </div>
          <div className="flex items-center min-w-0 max-w-full" title={phase}>
            <Badge
              variant={phaseVariant}
              pulse={phase === 'Receiving Stream' || phase === 'FFmpeg Muxing'}
              size="sm"
              className="max-w-full min-w-0 font-mono text-[11px] px-2"
            >
              <span className="truncate">
                {phase === 'Receiving Stream' ? 'Streaming' : phase === 'FFmpeg Muxing' ? 'Muxing' : phase}
              </span>
            </Badge>
          </div>
        </div>
      </div>

      {/* Monospace Log Strip & 1-Click Copy Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 rounded-lg bg-obsidian-900/90 border border-purple-900/30 px-3 py-2 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <Terminal className="w-3.5 h-3.5 text-accent-neon shrink-0" />
          <span className="font-mono text-[11px] text-purple-300/60 shrink-0 uppercase select-none">
            Status:
          </span>
          <span
            className="font-mono text-xs text-slate-200 truncate select-all"
            title={displayStatus}
          >
            {displayStatus}
          </span>
        </div>

        <Button
          variant="secondary"
          size="xs"
          onClick={handleCopyLog}
          className="shrink-0 font-mono text-[11px] gap-1.5 self-end sm:self-auto border-purple-900/40 hover:border-purple-600/50"
          aria-label="Copy Status Log"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-300">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-purple-300" />
              <span>Copy Log</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default TelemetryHUD;
