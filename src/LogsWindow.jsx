import { useState, useEffect, useRef } from 'react';
import { Terminal, Trash2, Copy, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import toast, { Toaster } from 'react-hot-toast';

export default function LogsWindow() {
  const [logs, setLogs] = useState([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef(null);

  useEffect(() => {
    if (!window.electronAPI) return;

    const unsub = window.electronAPI.onLogUpdate((line) => {
      setLogs((prev) => {
        const next = [...prev, line];
        return next.length > 1000 ? next.slice(next.length - 1000) : next;
      });
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (autoScroll) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleCopyAll = () => {
    if (logs.length === 0) return;
    navigator.clipboard.writeText(logs.join('\n'));
    toast.success('All logs copied to clipboard!');
  };

  const formatLogLine = (line, idx) => {
    let colorClass = 'text-[var(--text-primary)]';
    if (line.includes('ERROR:') || line.includes('Error') || line.includes('FAIL')) {
      colorClass = 'text-[var(--status-danger)] font-semibold';
    } else if (line.includes('PROGRESS:') || line.includes('STATUS:')) {
      colorClass = 'text-[var(--accent-primary)]';
    } else if (line.includes('SUCCESS:') || line.includes('Complete')) {
      colorClass = 'text-[var(--status-success)] font-semibold';
    } else if (line.includes('AUTH_ERROR:')) {
      colorClass = 'text-[var(--status-warning)] font-semibold';
    } else if (line.includes('FFMPEG') || line.includes('FFPROBE')) {
      colorClass = 'text-[var(--text-tertiary)]';
    }

    return (
      <div key={idx} className={`leading-relaxed break-all whitespace-pre-wrap ${colorClass}`}>
        <span className="text-[var(--text-tertiary)] select-none mr-2 font-mono text-xs">
          {(idx + 1).toString().padStart(4, '0')}
        </span>
        {line}
      </div>
    );
  };

  return (
    <div className="h-screen w-screen bg-[var(--bg-base)] text-[var(--text-primary)] font-mono text-xs flex flex-col select-text overflow-hidden">
      {/* Header */}
      <header className="h-10 bg-[var(--surface-1)] border-b border-[var(--border-subdued)] px-3 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[var(--accent-primary)]" />
          <span className="font-bold text-xs tracking-wider uppercase text-[var(--text-primary)]">
            Hermanos Forge — Developer Logs
          </span>
          <Badge variant="default" size="sm">
            {logs.length} Lines
          </Badge>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant={autoScroll ? 'accentMuted' : 'outline'}
            size="sm"
            onClick={() => setAutoScroll(!autoScroll)}
            title="Toggle auto-scroll to bottom"
          >
            <ArrowDown className="w-3 h-3" />
            Auto-Scroll: {autoScroll ? 'ON' : 'OFF'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyAll}
            disabled={logs.length === 0}
            title="Copy all logs"
          >
            <Copy className="w-3 h-3" />
            Copy All
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLogs([])}
            disabled={logs.length === 0}
            className="text-[var(--status-danger)] hover:bg-[var(--status-danger)]/10"
            title="Clear console buffer"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </Button>
        </div>
      </header>

      {/* Log Stream Body */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-1 custom-scrollbar bg-[var(--surface-1)]/40 font-mono text-xs">
        {logs.length === 0 && (
          <div className="h-full flex items-center justify-center text-[var(--text-tertiary)] italic">
            Console stream idle. Start an operation to observe live subprocess logs...
          </div>
        )}
        {logs.map((log, i) => formatLogLine(log, i))}
        <div ref={logsEndRef} />
      </div>

      <Toaster position="bottom-right" />
    </div>
  );
}
