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
  ListVideo,
  GripVertical,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
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
    return [makeClip(), makeClip()];
  });

  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  useEffect(() => {
    localStorage.setItem('mass-clips', JSON.stringify(clips));
  }, [clips]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isCoolingDown, setIsCoolingDown] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [globalStatus, setGlobalStatus] = useState('');
  const cleanupFnsRef = useRef([]);
  const clipsRef = useRef(clips);

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
      setIsCoolingDown(true);
      setGlobalStatus('Complete! Resetting queue in 5 seconds...');

      toast.success(
        finalPath.endsWith('.mp4')
          ? `Stitched video saved: ${finalPath}`
          : `Clips downloaded to: ${finalPath}`
      );

      if (onStitchSuccess) {
        onStitchSuccess(finalPath, clipsRef.current);
      }

      // Preserved 5-second auto-clear timer per non-negotiable compatibility rules
      setTimeout(() => {
        setIsCoolingDown(false);
        setGlobalStatus('');
        setClips([makeClip(), makeClip()]);
      }, 5000);
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

  const updateClipUrl = (id, url) =>
    setClips((prev) => prev.map((c) => (c.id === id ? { ...c, url } : c)));

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
    setClips([makeClip(), makeClip()]);
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
        return null;
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
    // Keep hover active until drag over another element or end
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

    // Handle external URL drag-and-drop from web browsers or other apps
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full pb-8">
      {/* Clip Queue Studio Card */}
      <Card className="surface-panel">
        <CardContent className="space-y-5 p-5 sm:p-6">
          {/* Header */}
          <div className="space-y-2 pb-3.5 border-b border-[var(--border-subdued)]">
            <div className="flex flex-wrap items-center justify-between gap-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-purple-950/50 border border-purple-800/40 flex items-center justify-center text-accent-neon shadow-sm shrink-0">
                  <Scissors className="w-4.5 h-4.5" />
                </div>
                <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                  <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight font-heading">
                    Batch Clip Downloader &amp; Stitcher
                  </h2>
                  <Badge variant="accent" size="md">
                    {validUrlsCount} {validUrlsCount === 1 ? 'Clip' : 'Clips'} Queued
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addClip}
                  disabled={isProcessing || isCoolingDown}
                  className="font-medium text-xs sm:text-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add URL</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  disabled={isProcessing || isCoolingDown || validUrlsCount === 0}
                  className="text-[var(--status-danger)] hover:bg-[var(--status-danger)]/10 font-medium text-xs sm:text-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </Button>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              Download sequential video clips and merge them automatically using FFmpeg concat.
            </p>
          </div>

          {/* Sequential Stitching Mode Explainer */}
          <div className="p-3.5 bg-gradient-to-r from-[var(--surface-2)] to-transparent border border-[var(--border-subdued)] rounded-xl flex items-center gap-3 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
            <ListVideo className="w-5 h-5 text-[var(--accent-primary)] shrink-0" />
            <span>
              Clips are processed in exact order from top to bottom. When stitching is selected, a lossless unified <span className="font-mono text-[var(--text-primary)] font-semibold">.mp4</span> file is generated.
            </span>
          </div>

          {/* Interactive Clip Cards Queue with Static Left Numbers */}
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1.5 custom-scrollbar">
            {clips.map((clip, index) => (
              <div key={clip.id} className="flex items-center gap-3">
                {/* Static Number on the Left - Stays in place */}
                <div className="w-8 h-8 rounded-full bg-[var(--surface-1)] border border-[var(--border-subdued)] flex items-center justify-center shrink-0 select-none shadow-sm">
                  <span className="font-mono text-xs sm:text-sm font-bold text-purple-300">
                    {index + 1}
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
                  className={`flex-1 p-3 sm:p-3.5 rounded-xl border transition-all duration-150 ${
                    dragOverIndex === index
                      ? 'border-accent-violet ring-2 ring-accent-violet/40 bg-purple-950/30'
                      : draggedIndex === index
                      ? 'opacity-40 border-purple-800/40 bg-obsidian-950'
                      : clip.state === ROW_STATE.ERROR
                      ? 'border-rose-500/40 bg-rose-500/5'
                      : clip.state === ROW_STATE.DONE
                      ? 'border-emerald-500/40 bg-emerald-500/5'
                      : clip.state === ROW_STATE.DOWNLOADING
                      ? 'border-purple-500/50 bg-purple-500/10 shadow-sm shadow-purple-950/40'
                      : 'border-[var(--border-subdued)] bg-[var(--surface-2)]/80 hover:border-[var(--border-strong)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Drag Handle */}
                    <div
                      className={`text-slate-500 hover:text-purple-300 transition shrink-0 ${
                        isProcessing || isCoolingDown
                          ? 'opacity-30 cursor-not-allowed'
                          : 'cursor-grab active:cursor-grabbing'
                      }`}
                      title="Drag to reorder"
                    >
                      <GripVertical className="w-4 h-4" />
                    </div>

                    <div
                      onDragStart={(e) => e.stopPropagation()}
                      className="flex-1 min-w-0"
                    >
                      <Input
                        type="text"
                        size="md"
                        value={clip.url}
                        onChange={(e) => updateClipUrl(clip.id, e.target.value)}
                        placeholder="Paste YouTube clip or video URL..."
                        disabled={isProcessing || isCoolingDown}
                        className="bg-[var(--surface-1)] font-mono text-xs sm:text-sm"
                      />
                    </div>

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
                        className="text-[var(--text-tertiary)] hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {clip.state === ROW_STATE.ERROR && clip.message && (
                    <p className="text-xs text-rose-400 pl-7 mt-2 font-mono">
                      {clip.message}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Status Message Line */}
          {globalStatus && (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-950/60 to-transparent border border-purple-500/30 flex items-center justify-between text-xs sm:text-sm text-purple-200 font-medium shadow-sm">
              <div className="flex items-center gap-3">
                <Loader2 className="w-4 h-4 text-accent-neon animate-spin" />
                <span>{globalStatus}</span>
              </div>
              {isCoolingDown && (
                <span className="text-xs uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full bg-purple-950/70 border border-purple-700/50 text-purple-200">
                  Auto-Reset Active
                </span>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3.5 pt-3 border-t border-[var(--border-subdued)]">
            {!isProcessing ? (
              <>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => startStitching(true)}
                  disabled={isCoolingDown || validUrlsCount === 0}
                  className="w-full sm:flex-1 font-semibold text-xs sm:text-sm py-3"
                >
                  <Download className="w-4 h-4" />
                  Download Separate Files ({validUrlsCount})
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => startStitching(false)}
                  disabled={isCoolingDown || validUrlsCount === 0}
                  className="w-full sm:flex-[2] font-bold text-sm sm:text-base py-3 shadow-glow-violet"
                >
                  <Scissors className="w-4 h-4" />
                  Stitch into Single Video ({validUrlsCount} Clips)
                </Button>
              </>
            ) : (
              <div className="w-full flex items-center gap-3">
                <div className="flex-1 flex items-center gap-2.5 p-3 rounded-xl bg-[var(--surface-2)] text-xs sm:text-sm text-[var(--text-secondary)]">
                  <ListVideo className="w-4 h-4 text-[var(--accent-primary)] animate-pulse" />
                  <span>Sequential batch engine running. Completed clips are stored locally.</span>
                </div>
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={() => setShowCancelModal(true)}
                  className="w-44 font-bold text-sm"
                >
                  <OctagonX className="w-4 h-4" />
                  Cancel All
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
