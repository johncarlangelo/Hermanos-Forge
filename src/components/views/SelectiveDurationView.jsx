import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Video,
  Download,
  Loader2,
  Plus,
  Check,
  Sparkles,
  OctagonX,
  Film,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogFooter } from '@/components/ui/Dialog';
import { StudioClipTimeline } from './timeline/StudioClipTimeline';
import { formatTime, formatTimeShort } from './timeline/timeUtils';
import toast from 'react-hot-toast';

export function SelectiveDurationView({
  globalOutputDir,
  onRequestGlobalOutput,
  onDownloadSuccess,
}) {
  const [url, setUrl] = useState('');
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [metadata, setMetadata] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState('');
  const [preciseCut, setPreciseCut] = useState(true);

  const [clips, setClips] = useState([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [lastTargetDir, setLastTargetDir] = useState(null);
  const downloadCancelRef = useRef(false);

  useEffect(() => {
    if (!window.electronAPI) return;

    const handleProgress = (_event, p) => {
      setClips((prev) =>
        prev.map((c) => (c.status === 'downloading' ? { ...c, progress: p } : c))
      );
    };
    const handleStatus = (_event, s) => {
      setClips((prev) =>
        prev.map((c) => (c.status === 'downloading' ? { ...c, message: s } : c))
      );
    };

    if (window.electronAPI.onProgressUpdate) window.electronAPI.onProgressUpdate(handleProgress);
    if (window.electronAPI.onStatusUpdate) window.electronAPI.onStatusUpdate(handleStatus);

    return () => {
      if (window.electronAPI.offProgressUpdate)
        window.electronAPI.offProgressUpdate(handleProgress);
      if (window.electronAPI.offStatusUpdate)
        window.electronAPI.offStatusUpdate(handleStatus);
    };
  }, []);

  const handleFetchDetails = async () => {
    if (!url) {
      toast.error('Please enter a YouTube video URL first.');
      return;
    }
    setIsFetchingDetails(true);
    setMetadata(null);
    setClips([]);

    try {
      if (window.electronAPI && window.electronAPI.getVideoMetadata) {
        const meta = await window.electronAPI.getVideoMetadata(url);
        if (meta && meta.duration) {
          setMetadata(meta);
          const initialEnd = Math.min(meta.duration, 60);
          setClips([
            {
              id: crypto.randomUUID(),
              startTime: 0,
              endTime: initialEnd,
              title: '',
              isExcluded: false,
              isLocked: false,
              status: 'idle',
              message: '',
              progress: 0,
            },
          ]);
          toast.success('Video loaded successfully!');
        } else {
          throw new Error('Could not retrieve video duration.');
        }
      }
    } catch (err) {
      console.error('Failed to fetch metadata', err);
      toast.error('Failed to fetch video details. Ensure the link is valid.');
    } finally {
      setIsFetchingDetails(false);
    }
  };

  const addClip = () => {
    if (!metadata) return;
    const lastClip = clips[clips.length - 1];
    const newStart = lastClip
      ? Math.max(0, Math.min(Math.max(0, metadata.duration - 5), lastClip.endTime))
      : 0;
    const newEnd = Math.min(metadata.duration, Math.max(newStart + 1, newStart + 60));

    setClips((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        startTime: parseFloat(newStart.toFixed(2)),
        endTime: parseFloat(newEnd.toFixed(2)),
        title: '',
        isExcluded: false,
        isLocked: false,
        status: 'idle',
        message: '',
        progress: 0,
      },
    ]);
  };

  const duplicateClip = (id) => {
    const clipToDuplicate = clips.find((c) => c.id === id);
    if (!clipToDuplicate || !metadata) return;
    const span = clipToDuplicate.endTime - clipToDuplicate.startTime;
    const newStart = Math.min(metadata.duration - 1, clipToDuplicate.endTime);
    const newEnd = Math.min(metadata.duration, newStart + span);

    setClips((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        startTime: parseFloat(newStart.toFixed(2)),
        endTime: parseFloat(newEnd.toFixed(2)),
        title: clipToDuplicate.title ? `${clipToDuplicate.title} (Copy)` : '',
        isExcluded: false,
        isLocked: false,
        status: 'idle',
        message: '',
        progress: 0,
      },
    ]);
    toast.success('Segment duplicated!');
  };

  const updateClip = (id, updates) => {
    setClips((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const removeClip = (id) => {
    setClips((prev) => prev.filter((c) => c.id !== id));
  };

  const handleRetryClip = async (clip) => {
    if (!lastTargetDir) {
      toast.error("Original destination folder not found. Please click 'Download Clips' to restart.");
      return;
    }

    updateClip(clip.id, { status: 'downloading', message: 'Retrying...', progress: 0 });
    const clipIndex = clips.findIndex((c) => c.id === clip.id);
    const customTitle = clip.title.trim() || `CLIP ${clipIndex + 1}`;

    try {
      if (window.electronAPI && window.electronAPI.downloadClip) {
        const result = await window.electronAPI.downloadClip(
          url,
          lastTargetDir,
          clip.startTime,
          clip.endTime,
          selectedFormat,
          preciseCut,
          customTitle
        );

        if (result && result.success) {
          updateClip(clip.id, { status: 'done', message: 'Complete!' });
          if (onDownloadSuccess) {
            const startFmt = formatTime(clip.startTime);
            const endFmt = formatTime(clip.endTime);
            onDownloadSuccess(result.filepath, startFmt, endFmt, url, customTitle);
          }
          toast.success('Clip retry successful!');
        } else {
          throw new Error('Download failed without a specific error message.');
        }
      }
    } catch (err) {
      console.error('Clip retry failed:', err);
      const friendlyError = err.message?.includes('3436169992')
        ? 'Hey! Too fast, please wait a moment.'
        : err.message;
      updateClip(clip.id, { status: 'error', message: friendlyError });
      toast.error('Retry failed. Please check developer logs.');
    }
  };

  const confirmCancel = async () => {
    setShowCancelModal(false);
    downloadCancelRef.current = true;
    if (window.electronAPI && window.electronAPI.cancelDownload) {
      try {
        await window.electronAPI.cancelDownload();
      } catch (err) {
        console.error('Failed to cancel download', err);
      }
    }
    setIsDownloading(false);
    setDownloadStatus('Canceled');
    setTimeout(() => {
      setDownloadStatus((prev) => (prev === 'Canceled' ? '' : prev));
    }, 3000);
    toast.error('Trimming operation canceled.', { icon: '🛑' });
    setClips((prev) =>
      prev.map((c) =>
        c.status === 'downloading' ? { ...c, status: 'canceled', message: 'Canceled' } : c
      )
    );
  };

  const handleDownloadAll = async () => {
    const activeClips = clips.filter((c) => !c.isExcluded);
    if (activeClips.length === 0) {
      toast.error('No clips available to download.');
      return;
    }

    let targetDir = globalOutputDir;
    if (!targetDir && onRequestGlobalOutput) {
      targetDir = await onRequestGlobalOutput();
    }
    if (!targetDir) {
      toast.error('Please configure an output folder first.');
      return;
    }

    setLastTargetDir(targetDir);
    setIsDownloading(true);
    downloadCancelRef.current = false;
    setDownloadStatus('Preparing clips...');

    for (let i = 0; i < activeClips.length; i++) {
      if (downloadCancelRef.current) break;
      const clip = activeClips[i];
      const customTitle = clip.title.trim() || `CLIP ${i + 1}`;

      updateClip(clip.id, { status: 'downloading', message: 'Downloading segment...', progress: 0 });
      setDownloadStatus(`Processing clip ${i + 1} of ${activeClips.length}`);

      try {
        if (window.electronAPI && window.electronAPI.downloadClip) {
          const result = await window.electronAPI.downloadClip(
            url,
            targetDir,
            clip.startTime,
            clip.endTime,
            selectedFormat,
            preciseCut,
            customTitle
          );

          if (result && result.success) {
            updateClip(clip.id, { status: 'done', message: 'Download complete!' });
            if (onDownloadSuccess) {
              const startFmt = formatTime(clip.startTime);
              const endFmt = formatTime(clip.endTime);
              onDownloadSuccess(result.filepath, startFmt, endFmt, url, customTitle);
            }
          } else {
            throw new Error('Download failed');
          }
        }
      } catch (err) {
        if (downloadCancelRef.current) break;
        const friendlyError = err.message?.includes('3436169992')
          ? 'Hey! Too fast, please wait a moment.'
          : err.message;
        updateClip(clip.id, { status: 'error', message: friendlyError });
      }
    }

    setIsDownloading(false);
    if (!downloadCancelRef.current) {
      setDownloadStatus('All clips finished!');
      toast.success('Completed selective trimming!');
    }
  };

  const getThumbnailUrl = () => {
    if (metadata?.thumbnail) return metadata.thumbnail;
    if (metadata?.id) return `https://img.youtube.com/vi/${metadata.id}/mqdefault.jpg`;
    const ytMatch = url.match(/(?:youtu\.be\/|v=|\/embed\/|\/shorts\/|\/watch\?v=)([\w-]{11})/);
    if (ytMatch && ytMatch[1]) {
      return `https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg`;
    }
    return null;
  };

  const formatOptions = useMemo(() => {
    if (metadata?.formats && metadata.formats.length > 0) {
      const dynamic = [...metadata.formats]
        .sort((a, b) => (b.height || 0) - (a.height || 0))
        .map((f) => ({
          value: String(f.height),
          label: `${f.resolution || `${f.height}p`}${
            f.height >= 2160
              ? ' (4K)'
              : f.height >= 1440
              ? ' (2K)'
              : f.height >= 1080
              ? ' (Full HD)'
              : f.height >= 720
              ? ' (HD)'
              : ''
          }`,
        }));
      return [{ value: '', label: 'Best Available (Auto)' }, ...dynamic];
    }
    return [
      { value: '', label: 'Best Available (Auto)' },
      { value: '2160', label: '2160p (4K)' },
      { value: '1440', label: '1440p (2K)' },
      { value: '1080', label: '1080p Full HD' },
      { value: '720', label: '720p HD' },
      { value: '480', label: '480p SD' },
      { value: '360', label: '360p' },
    ];
  }, [metadata]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full pb-10">
      {/* URL & Inspection Card */}
      <Card className="surface-panel">
        <CardContent className="space-y-6 p-6 sm:p-7">
          <div className="flex items-center justify-between pb-3.5 border-b border-[var(--border-subdued)]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-950/50 border border-purple-800/40 flex items-center justify-center text-accent-neon shadow-sm">
                <Film className="w-4.5 h-4.5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight font-heading">
                  Selective Duration Studio Downloader
                </h2>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                  Interactive multi-track timeline scrubbing, audio waveforms, and precision trimming.
                </p>
              </div>
            </div>
          </div>

          {/* URL Input */}
          <div className="flex items-center gap-2.5">
            <div className="flex-1">
              <Input
                size="lg"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter YouTube URL to inspect video timeline..."
                disabled={isFetchingDetails || isDownloading}
                leftIcon={<Video className="w-4 h-4 text-accent-neon" />}
              />
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={handleFetchDetails}
              isLoading={isFetchingDetails}
              disabled={!url || isDownloading}
              className="font-bold shrink-0 text-sm px-6 h-11"
            >
              Fetch Details
            </Button>
          </div>

          {/* Video Metadata & Global Resolution Selector Card */}
          {metadata && (
            <div className="p-5 bg-obsidian-900/90 border border-purple-800/40 rounded-2xl flex flex-col md:flex-row items-start gap-5 shadow-sm">
              {/* Thumbnail with Fallback */}
              <div className="w-full md:w-52 aspect-video bg-obsidian-950 rounded-xl overflow-hidden shrink-0 border border-purple-900/40 relative flex items-center justify-center group shadow-sm">
                {getThumbnailUrl() ? (
                  <img
                    src={getThumbnailUrl()}
                    alt={metadata.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-1.5 text-purple-400/50">
                    <Video className="w-6 h-6 text-purple-400/60" />
                    <span className="text-xs font-mono">No Preview</span>
                  </div>
                )}
                <div className="absolute bottom-1.5 right-1.5 bg-obsidian-950/90 px-2 py-0.5 rounded text-xs font-mono tabular-nums text-purple-200 border border-purple-700/50">
                  {formatTimeShort(metadata.duration)}
                </div>
              </div>

              {/* Video Details & Quality Select */}
              <div className="flex-1 min-w-0 space-y-3 w-full">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-purple-300/80 block mb-0.5 font-semibold">
                    Video Title
                  </span>
                  <h3
                    className="text-sm sm:text-base font-bold text-[var(--text-primary)] truncate"
                    title={metadata.title}
                  >
                    {metadata.title}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-purple-300/80 block mb-0.5 font-semibold">
                      Full Duration
                    </span>
                    <span className="font-mono text-sm font-semibold text-[var(--text-primary)] tabular-nums">
                      {formatTime(metadata.duration)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-purple-300/80 block mb-0.5 font-semibold">
                      Platform Channel
                    </span>
                    <span className="font-sans text-sm font-semibold text-accent-neon truncate block">
                      {metadata.uploader || metadata.channel || metadata.extractor_key || 'YouTube'}
                    </span>
                  </div>
                </div>

                {/* Target Resolution / Quality Selector */}
                <div className="pt-1 max-w-xs">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-purple-300/80 mb-1.5 font-semibold">
                    Output Resolution
                  </label>
                  <Select
                    options={formatOptions}
                    value={selectedFormat}
                    onChange={setSelectedFormat}
                    disabled={isDownloading}
                    placeholder="Best Available (Auto)"
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Segments Section */}
      {metadata && (
        <Card className="surface-panel">
          <CardContent className="space-y-6 p-6 sm:p-7">
            <div className="flex items-center justify-between pb-3.5 border-b border-[var(--border-subdued)]">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)] tracking-tight font-heading">
                  Studio Timeline Trimming Segments ({clips.length})
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
                  Drag the cyan In-Point and violet Out-Point brackets, use keyboard nudging, or enter exact timecodes.
                </p>
              </div>

              <Badge variant="accent" size="md">
                {clips.filter((c) => !c.isExcluded).length} Active
              </Badge>
            </div>

            {/* List of Studio Timelines */}
            <div className="space-y-5">
              {clips.map((clip, index) => (
                <StudioClipTimeline
                  key={clip.id}
                  clip={clip}
                  metadata={metadata}
                  updateClip={updateClip}
                  removeClip={removeClip}
                  duplicateClip={duplicateClip}
                  index={index}
                  totalClips={clips.length}
                  allClips={clips}
                  isDownloadingQueue={isDownloading}
                  handleRetryClip={handleRetryClip}
                />
              ))}
            </div>

            {/* Add Another Segment Button */}
            <div className="pt-1">
              <Button
                variant="outline"
                size="md"
                onClick={addClip}
                disabled={isDownloading}
                className="w-full py-3.5 border-dashed border-purple-800/60 hover:border-accent-violet hover:bg-purple-950/20 text-[var(--text-primary)] font-semibold text-sm sm:text-base transition-all flex items-center justify-center gap-2.5 rounded-xl cursor-pointer"
              >
                <Plus className="w-4 h-4 text-accent-neon" />
                <span>Add Another Segment</span>
              </Button>
            </div>

            {/* Trimming Options */}
            <div className="pt-2">
              <label className="flex items-center gap-3 p-3.5 bg-obsidian-900/90 rounded-xl border border-purple-900/30 cursor-pointer select-none transition-colors hover:border-purple-700/50">
                <input
                  type="checkbox"
                  checked={preciseCut}
                  onChange={(e) => setPreciseCut(e.target.checked)}
                  disabled={isDownloading}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors shrink-0 ${
                    preciseCut
                      ? 'bg-accent-violet border-accent-violet text-white'
                      : 'border-purple-800/60 bg-obsidian-950'
                  }`}
                >
                  {preciseCut && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-accent-neon" />
                    Frame-Accurate Cutting (Re-encode)
                  </span>
                  <span className="text-xs text-[var(--text-secondary)] block mt-0.5">
                    Enables precise split boundaries without keyframe drift.
                  </span>
                </div>
              </label>
            </div>

            {/* Download Status Message */}
            {downloadStatus && (
              <div className="p-3 rounded-lg bg-purple-950/40 border border-purple-700/40 text-xs sm:text-sm text-purple-200 font-medium flex items-center gap-2.5">
                <Loader2 className="w-4 h-4 animate-spin shrink-0 text-accent-neon" />
                <span>{downloadStatus}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3.5 pt-2">
              {isDownloading ? (
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={() => setShowCancelModal(true)}
                  className="font-semibold text-sm px-6"
                >
                  <OctagonX className="w-4 h-4" />
                  Cancel Trimming
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleDownloadAll}
                  disabled={isDownloading || clips.filter((c) => !c.isExcluded).length === 0}
                  className="font-bold text-sm sm:text-base px-8 py-3.5 shadow-glow-violet"
                >
                  <Download className="w-4 h-4" />
                  Download Selected Clips ({clips.filter((c) => !c.isExcluded).length})
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancel Modal */}
      <Dialog
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Trimming Operation?"
        maxWidth="max-w-sm"
      >
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-lg bg-[var(--status-danger)]/15 text-[var(--status-danger)] shrink-0">
            <OctagonX className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Are you sure you want to stop the current download? Completed clips will remain in your destination folder.
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

export default SelectiveDurationView;
