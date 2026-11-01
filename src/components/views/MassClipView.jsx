import { useState, useRef, useEffect } from 'react';
import {
  Scissors,
  Plus,
  Trash2,
  Loader2,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  OctagonX,
  Download,
  GripVertical,
  Layers,
  ClipboardPaste,
  ShieldCheck,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogFooter } from '@/components/ui/Dialog';
import toast from 'react-hot-toast';

const ROW_STATE = {
  IDLE: 'idle',
  QUEUED: 'queued',
  DOWNLOADING: 'downloading',
  DONE: 'done',
  ERROR: 'error',
  CANCELED: 'canceled',
};

function makeClip() {
  return { id: crypto.randomUUID(), url: '', state: ROW_STATE.IDLE, message: '' };
}

export function MassClipView({
  onStitchSuccess,
  globalOutputDir,
  onRequestGlobalOutput,
  onClipsChange,
  onProcessingChange,
  onStatusChange,
  onRegisterActions,
}) {
  const [clips, setClips] = useState(() => {
    try {
      const saved = localStorage.getItem('mass-clips');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((c) => ({
          ...c,
          state: c.state === 'downloading' || c.state === 'queued' ? 'idle' : c.state,
        }));
      }
    } catch {
      /* ignore */
    }
    return [makeClip(), makeClip(), makeClip()];
  });

  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  useEffect(() => {
    localStorage.setItem('mass-clips', JSON.stringify(clips));
    onClipsChange?.(clips);
  }, [clips, onClipsChange]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isCoolingDown, setIsCoolingDown] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [globalStatus, setGlobalStatus] = useState('');
  const cleanupFnsRef = useRef([]);
  const clipsRef = useRef(clips);

  useEffect(() => {
    onProcessingChange?.(isProcessing);
  }, [isProcessing, onProcessingChange]);

  useEffect(() => {
    onStatusChange?.(globalStatus);
  }, [globalStatus, onStatusChange]);

  useEffect(() => {
    clipsRef.current = clips;
  }, [clips]);

  useEffect(() => {
    if (!window.stitchAPI) return;

    const unsubClip = window.stitchAPI.onClipUpdate(({ index, state, message }) => {
      clipsRef.current = clipsRef.current.map((c, i) =>
        i === index ? { ...c, state, message: message || '' } : c
      );
      setClips(clipsRef.current);
    });

    const unsubStatus = window.stitchAPI.onStatus((msg) => {
      if (!msg.startsWith('FFMPEG') && !msg.startsWith('FFPROBE') && !msg.startsWith('SHUTIL')) {
        setGlobalStatus(msg);
      }
    });

    const unsubSuccess = window.stitchAPI.onSuccess((finalPath) => {
      setIsProcessing(false);
      setIsCoolingDown(false);
      setGlobalStatus('Compilation complete! Files saved to destination directory.');

      toast.success(
        finalPath.endsWith('.mp4')
          ? `Stitched video saved: ${finalPath}`
          : `Clips downloaded to: ${finalPath}`
      );

      if (onStitchSuccess) {
        onStitchSuccess(finalPath, clipsRef.current);
      }
    });

    const unsubError = window.stitchAPI.onError((msg) => {
      setIsProcessing(false);
      setGlobalStatus('');
      toast.error(msg);
    });

    cleanupFnsRef.current = [unsubClip, unsubStatus, unsubSuccess, unsubError];
    return () => cleanupFnsRef.current.forEach((fn) => fn && fn());
  }, [onStitchSuccess]);

  const addClip = () => setClips((prev) => [...prev, makeClip()]);

  const moveClip = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= clips.length) return;
    setClips((prev) => {
      const updated = [...prev];
      const [movedItem] = updated.splice(index, 1);
      updated.splice(targetIndex, 0, movedItem);
      return updated;
    });
  };

  const updateClipUrl = (id, url) =>
    setClips((prev) => prev.map((c) => (c.id === id ? { ...c, url } : c)));

  const handlePasteClip = async (id) => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        updateClipUrl(id, text.trim());
      }
    } catch {
      toast.error('Unable to read clipboard.');
    }
  };

  const clearClip = (id) =>
    setClips((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, url: '', state: ROW_STATE.IDLE, message: '' } : c
      )
    );

  const removeClipRow = (id) => {
    if (clips.length <= 1) {
      clearClip(id);
      return;
    }
    setClips((prev) => prev.filter((c) => c.id !== id));
  };

  const clearAll = () => {
    if (isProcessing) return;
    setClips([makeClip(), makeClip(), makeClip()]);
  };

  const startStitching = async (noStitch = false) => {
    const urls = clips.map((c) => c.url.trim()).filter(Boolean);

    if (urls.length === 0) {
      toast.error('Add at least one clip URL first.');
      return;
    }

    let targetDir = globalOutputDir;
    if (!targetDir && onRequestGlobalOutput) {
      targetDir = await onRequestGlobalOutput();
    }
    if (!targetDir) {
      toast.error('Select an output folder first.');
      return;
    }

    setClips((prev) =>
      prev
        .filter((c) => c.url.trim())
        .map((c) => ({ ...c, state: ROW_STATE.QUEUED, message: '' }))
    );
    setIsProcessing(true);

    try {
      if (window.stitchAPI) {
        setGlobalStatus('Starting batch download...');
        await window.stitchAPI.stitchClips(urls, targetDir, noStitch);
      }
    } catch (err) {
      setIsProcessing(false);
      setGlobalStatus('');
      const friendlyError = err.message?.includes('3436169992')
        ? 'Hey! Too fast, please wait a moment.'
        : err.message;
      toast.error(`Unexpected error: ${friendlyError}`);
    }
  };

  const confirmCancel = async () => {
    setShowCancelModal(false);
    if (window.stitchAPI) {
      try {
        await window.stitchAPI.cancelStitch(globalOutputDir);
      } catch (err) {
        console.error('Failed to cancel stitch process', err);
      }
    }
    setIsProcessing(false);
    setGlobalStatus('');
    setClips((prev) =>
      prev.map((c) =>
        c.state === ROW_STATE.DOWNLOADING || c.state === ROW_STATE.QUEUED
          ? { ...c, state: ROW_STATE.CANCELED }
          : c
      )
    );
    toast.error('Batch process canceled.', { icon: '🛑' });
  };

  const startStitchingRef = useRef(startStitching);
  useEffect(() => {
    startStitchingRef.current = startStitching;
  });

  useEffect(() => {
    onRegisterActions?.({
      triggerStitch: () => startStitchingRef.current(false),
      triggerSeparate: () => startStitchingRef.current(true),
      triggerCancel: () => setShowCancelModal(true),
      addClipWithUrl: (newUrl) => {
        setClips((prev) => {
          const emptyIdx = prev.findIndex((c) => !c.url.trim());
          if (emptyIdx >= 0) {
            return prev.map((c, i) => (i === emptyIdx ? { ...c, url: newUrl } : c));
          }
          return [...prev, { id: crypto.randomUUID(), url: newUrl, state: ROW_STATE.IDLE, message: '' }];
        });
      },
    });
  }, [onRegisterActions]);

  const renderStatusBadge = (state) => {
    switch (state) {
      case ROW_STATE.QUEUED:
        return (
          <Badge variant="default" size="sm" icon={<Clock className="w-3 h-3" />}>
            Queued
          </Badge>
        );
      case ROW_STATE.DOWNLOADING:
        return (
          <Badge
            variant="accent"
            size="sm"
            icon={<Loader2 className="w-3 h-3 animate-spin" />}
          >
            Downloading
          </Badge>
        );
      case ROW_STATE.DONE:
        return (
          <Badge
            variant="success"
            size="sm"
            icon={<CheckCircle className="w-3 h-3" />}
          >
            Done
          </Badge>
        );
      case ROW_STATE.ERROR:
        return (
          <Badge
            variant="danger"
            size="sm"
            icon={<AlertCircle className="w-3 h-3" />}
          >
            Error
          </Badge>
        );
      case ROW_STATE.CANCELED:
        return (
          <Badge
            variant="warning"
            size="sm"
            icon={<XCircle className="w-3 h-3" />}
          >
            Canceled
          </Badge>
        );
      default:
        return (
          <span className="font-mono text-[10px] text-[#5c5c6e] uppercase">
            IDLE
          </span>
        );
    }
  };

  const handleDragStart = (e, index) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' || e.target.closest('button')) {
      e.preventDefault();
      return;
    }
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    // Keep active
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex !== null) {
      if (draggedIndex !== targetIndex) {
        setClips((prev) => {
          const updated = [...prev];
          const [movedItem] = updated.splice(draggedIndex, 1);
          updated.splice(targetIndex, 0, movedItem);
          return updated;
        });
      }
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Handle external URL drag-and-drop
    const droppedText =
      e.dataTransfer.getData('text/uri-list') ||
      e.dataTransfer.getData('text/plain');
    if (droppedText && droppedText.trim()) {
      const firstLine = droppedText.trim().split(/\r?\n/)[0].trim();
      if (firstLine) {
        setClips((prev) =>
          prev.map((c, i) =>
            i === targetIndex
              ? { ...c, url: firstLine, state: ROW_STATE.IDLE, message: '' }
              : c
          )
        );
      }
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const validUrlsCount = clips.filter((c) => c.url.trim()).length;
  const readyCount = clips.filter((c) => c.state === ROW_STATE.DONE).length;
  const downloadingCount = clips.filter((c) => c.state === ROW_STATE.DOWNLOADING).length;
  const queuedCount = clips.filter((c) => c.state === ROW_STATE.QUEUED).length;
  const errorCount = clips.filter((c) => c.state === ROW_STATE.ERROR).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full pb-8">
      {/* Studio Header HUD */}
      <header className="flex w-full items-start justify-between gap-4">
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-center gap-2 text-xs font-mono text-[#7a7a8c]">
            <span>STUDIO</span>
            <span>&gt;</span>
            <span className="text-[#a78bfa]">BATCH</span>
            <span>&gt;</span>
            <span className="text-[#f4f4f7]">CLIP STITCHER</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#f4f4f7] font-heading">
            Mass Clip Stitcher Studio
          </h1>
          <p className="text-xs sm:text-sm text-[#7a7a8c]">
            Queue sequential media links, reorder scenes on the fly, and losslessly stitch into a cohesive compilation.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-2 rounded-full border border-[#22c55e33] bg-[#22c55e14] px-3 py-1 shadow-sm">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22c55e]" />
            </span>
            <span className="text-xs font-bold text-[#86efac]">
              Engine Ready
            </span>
          </div>
        </div>
      </header>

      {/* Batch Health Diagnostics & Timeline Preview Bar */}
      <section className="p-5 rounded-2xl border border-[#1e1e2a] bg-[#12121a] shadow-xl surface-panel space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#a78bfa]" />
            <span className="text-xs font-bold text-[#f4f4f7] uppercase font-mono tracking-wider">
              SEQUENCE TIMELINE PREVIEW
            </span>
            <Badge variant="brand" size="sm">
              {validUrlsCount} {validUrlsCount === 1 ? 'Segment' : 'Segments'}
            </Badge>
          </div>

          {/* Codec Diagnostics Tags */}
          <div className="flex items-center gap-2 text-[11px] font-mono text-[#7a7a8c]">
            <span className="flex items-center gap-1 text-[#86efac] bg-[#22c55e14] px-2 py-0.5 rounded border border-[#22c55e33]">
              <ShieldCheck className="w-3 h-3 text-[#22c55e]" />
              H.264 / AAC Concat
            </span>
            <span className="bg-[#1e1e2a] px-2 py-0.5 rounded border border-[#2a2a3a] text-[#c4b5fd]">
              MP4 Lossless
            </span>
          </div>
        </div>

        {/* Visual Timeline Segments Bar (Subframe cue-scrubber style) */}
        <div className="space-y-1.5 p-3 rounded-xl bg-[#0b0b10] border border-[#1e1e2a]">
          <div className="flex h-3 w-full rounded-lg overflow-hidden gap-1 bg-[#14141d] p-0.5">
            {clips.filter((c) => c.url.trim()).length > 0 ? (
              clips.filter((c) => c.url.trim()).map((c, i, arr) => {
                const colors = ['bg-[#7c3aed]', 'bg-[#8b5cf6]', 'bg-[#a78bfa]', 'bg-[#c4b5fd]', 'bg-[#38bdf8]'];
                const color =
                  c.state === ROW_STATE.DONE
                    ? 'bg-[#22c55e]'
                    : c.state === ROW_STATE.ERROR
                    ? 'bg-[#ef4444]'
                    : colors[i % colors.length];
                return (
                  <div
                    key={c.id}
                    style={{ width: `${100 / arr.length}%` }}
                    className={`h-full ${color} rounded-sm transition-all duration-300 relative group`}
                    title={`Clip #${i + 1}: ${c.url}`}
                  />
                );
              })
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[10px] font-mono text-[#5c5c6e]">
                AWAITING MEDIA URLS TO MAP SEQUENCE
              </div>
            )}
          </div>

          <div className="flex justify-between items-center text-[10px] font-mono text-[#5c5c6e] pt-1">
            <span>SEQUENCE START · 00:00</span>
            <span>DRAG CARDS TO REORDER ORDER</span>
            <span>END OF COMPILATION</span>
          </div>
        </div>
      </section>

      {/* Main Clip Queue Panel */}
      <section className="flex w-full flex-col items-start gap-5 rounded-2xl border border-[#1e1e2a] bg-[#12121a] p-6 shadow-xl surface-panel">
        {/* Queue Header & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 w-full pb-3.5 border-b border-[#1e1e2a]">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-bold text-[#f4f4f7] font-heading">
              Compilation Track Queue
            </span>
            {readyCount > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-[#86efac] font-medium font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
                {readyCount} complete
              </span>
            )}
            {downloadingCount > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-[#c4b5fd] font-medium font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6] animate-pulse" />
                {downloadingCount} stitching
              </span>
            )}
            {queuedCount > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-[#9a9aac] font-medium font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5c5c6e]" />
                {queuedCount} queued
              </span>
            )}
            {errorCount > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-[#fca5a5] font-medium font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
                {errorCount} error
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={addClip}
              disabled={isProcessing || isCoolingDown}
              className="text-xs font-bold"
            >
              <Plus className="w-3.5 h-3.5 text-[#a78bfa]" />
              <span>Add Clip Track</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              disabled={isProcessing || isCoolingDown || validUrlsCount === 0}
              className="text-[#ef4444] hover:bg-[#ef44441a] text-xs font-bold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Queue</span>
            </Button>
          </div>
        </div>

        {/* Clip Sequence Cards List */}
        <div className="space-y-3 w-full max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
          {clips.map((clip, index) => (
            <div key={clip.id} className="flex items-center gap-3">
              {/* Sequence Order Marker */}
              <div className="w-9 h-9 rounded-xl bg-[#0b0b10] border border-[#2a2a3a] flex items-center justify-center shrink-0 select-none shadow-inner">
                <span className="font-mono text-xs font-bold text-[#a78bfa]">
                  #{String(index + 1).padStart(2, '0')}
                </span>
              </div>

              {/* Draggable Row Card */}
              <div
                draggable={!isProcessing && !isCoolingDown}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex-1 p-3 rounded-xl border transition-all duration-150 ${
                  dragOverIndex === index
                    ? 'border-[#7c3aed] ring-2 ring-[#7c3aed]/40 bg-[#7c3aed1a]'
                    : draggedIndex === index
                    ? 'opacity-40 border-[#2a2a3a] bg-[#0b0b10]'
                    : clip.state === ROW_STATE.ERROR
                    ? 'border-[#ef444455] bg-[#ef444414]'
                    : clip.state === ROW_STATE.DONE
                    ? 'border-[#22c55e44] bg-[#22c55e14]'
                    : clip.state === ROW_STATE.DOWNLOADING
                    ? 'border-[#7c3aed4d] bg-[#7c3aed14]'
                    : 'border-[#1e1e2a] bg-[#0b0b10] hover:border-[#2a2a3a]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex flex-col items-center shrink-0">
                    <button
                      type="button"
                      disabled={index === 0 || isProcessing || isCoolingDown}
                      onClick={() => moveClip(index, -1)}
                      className="text-[#5c5c6e] hover:text-[#a78bfa] disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed p-0.5"
                      title="Move clip up in sequence"
                      aria-label={`Move clip ${index + 1} up`}
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <div
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          moveClip(index, -1);
                        } else if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          moveClip(index, 1);
                        }
                      }}
                      className={`text-[#5c5c6e] hover:text-[#a78bfa] transition focus:outline-none focus:text-[#a78bfa] ${
                        isProcessing || isCoolingDown
                          ? 'opacity-30 cursor-not-allowed'
                          : 'cursor-grab active:cursor-grabbing'
                      }`}
                      title="Drag or press Up/Down arrows to reorder"
                      aria-label={`Reorder clip ${index + 1}, use up and down arrow keys`}
                    >
                      <GripVertical className="w-3.5 h-3.5" />
                    </div>
                    <button
                      type="button"
                      disabled={index === clips.length - 1 || isProcessing || isCoolingDown}
                      onClick={() => moveClip(index, 1)}
                      className="text-[#5c5c6e] hover:text-[#a78bfa] disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed p-0.5"
                      title="Move clip down in sequence"
                      aria-label={`Move clip ${index + 1} down`}
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>

                  <div
                    onDragStart={(e) => e.stopPropagation()}
                    className="flex-1 min-w-0"
                  >
                    <Input
                      size="sm"
                      type="text"
                      value={clip.url}
                      onChange={(e) => updateClipUrl(clip.id, e.target.value)}
                      placeholder="https://youtube.com/watch?v=..."
                      disabled={isProcessing || isCoolingDown}
                      className="font-mono text-xs sm:text-sm bg-[#12121a] border-[#2a2a3a] focus:border-[#7c3aed]"
                    />
                  </div>

                  {/* Quick Paste Button if empty */}
                  {!clip.url && (
                    <Button
                      variant="ghost"
                      size="iconSm"
                      onClick={() => handlePasteClip(clip.id)}
                      disabled={isProcessing || isCoolingDown}
                      title="Paste from clipboard"
                      className="text-[#7a7a8c] hover:text-[#a78bfa]"
                    >
                      <ClipboardPaste className="w-3.5 h-3.5" />
                    </Button>
                  )}

                  <div className="shrink-0">
                    {renderStatusBadge(clip.state)}
                  </div>

                  <div onDragStart={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="iconSm"
                      onClick={() => removeClipRow(clip.id)}
                      disabled={isProcessing || isCoolingDown || clips.length <= 1}
                      aria-label={`Remove clip ${index + 1}`}
                      title="Remove clip"
                      className="text-[#7a7a8c] hover:text-[#ef4444] hover:bg-[#ef44441a]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {clip.state === ROW_STATE.ERROR && clip.message && (
                  <p className="text-xs text-[#ef4444] pl-7 mt-1.5 font-mono">
                    {clip.message}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Global Status Message Bar */}
        {globalStatus && (
          <div className="w-full p-4 rounded-xl bg-[#0b0b10] border border-[#7c3aed4d] flex items-center justify-between text-xs sm:text-sm text-[#ede9fe] font-medium shadow-md">
            <div className="flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-[#a78bfa] animate-spin" />
              <span className="font-mono">{globalStatus}</span>
            </div>
            {isCoolingDown && (
              <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-[#7c3aed26] border border-[#7c3aed4d] text-[#c4b5fd]">
                Reset in 5s
              </span>
            )}
          </div>
        )}

        {/* Execution Dock */}
        <div className="flex flex-col sm:flex-row items-center gap-3.5 pt-4 border-t border-[#1e1e2a] w-full">
          {!isProcessing ? (
            <>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => startStitching(true)}
                disabled={isCoolingDown || validUrlsCount === 0}
                className="w-full sm:flex-1 font-bold text-xs sm:text-sm py-2.5"
              >
                <Download className="w-4 h-4 text-[#a78bfa]" />
                <span>Separate Downloads ({validUrlsCount})</span>
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={() => startStitching(false)}
                disabled={isCoolingDown || validUrlsCount === 0}
                className="w-full sm:flex-[2] font-bold text-sm py-2.5 shadow-lg shadow-violet-950/50"
              >
                <Scissors className="w-4 h-4" />
                <span>Stitch Sequence into Video ({validUrlsCount} Clips)</span>
              </Button>
            </>
          ) : (
            <div className="w-full flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-xs text-[#7a7a8c] font-mono">
                <Loader2 className="w-4 h-4 text-[#a78bfa] animate-spin" />
                <span>Executing multi-stream stitching pipeline...</span>
              </div>
              <Button
                variant="destructive"
                size="md"
                onClick={() => setShowCancelModal(true)}
                className="font-bold text-xs"
              >
                <OctagonX className="w-4 h-4" />
                <span>Cancel All</span>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Cancel Confirmation Modal */}
      <Dialog
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Stitch Operation?"
        maxWidth="max-w-sm"
      >
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-lg bg-[var(--status-danger)]/15 text-[var(--status-danger)] shrink-0">
            <OctagonX className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Are you sure you want to stop the current batch download and stitch process?
              Any clips that have already completed downloading will be kept in your destination folder.
            </p>
          </div>
        </div>

        <DialogFooter className="mt-4 -mx-5 -mb-5 px-5">
          <Button
            variant="secondary"
            size="md"
            onClick={() => setShowCancelModal(false)}
            className="text-xs sm:text-sm font-semibold"
          >
            Keep Going
          </Button>
          <Button
            variant="destructive"
            size="md"
            onClick={confirmCancel}
            className="text-xs sm:text-sm font-semibold"
          >
            Yes, Cancel
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

export default MassClipView;
