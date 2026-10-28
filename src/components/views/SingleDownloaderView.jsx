import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Video,
  Music,
  FolderOpen,
  FileCode,
  AlertCircle,
  Loader2,
  ListVideo,
  ClipboardPaste,
  X,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Tabs } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import toast from 'react-hot-toast';

export function SingleDownloaderView({
  url,
  setUrl,
  downloadType,
  setDownloadType,
  selectedQuality,
  setSelectedQuality,
  formats,
  isFetchingFormats,
  isInspecting,
  urlError,
  singleVideoMetadata,
  playlistEntries,
  selectedPlaylistVideos,
  isDownloading,
  progress,
  status,
  playlistDownloadQueue,
  globalOutputDir,
  onSelectOutputDir,
  onDownload,
  onConvertLocal,
  onCancelClick,
  onOpenPlaylistModal,
  onOpenCookieWizard,
}) {
  const [isPasting, setIsPasting] = useState(false);

  const handlePaste = async () => {
    try {
      setIsPasting(true);
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
      }
    } catch {
      toast.error('Unable to read clipboard.');
    } finally {
      setIsPasting(false);
    }
  };

  const handleClearUrl = () => {
    setUrl('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && url.trim() && !isDownloading && !isInspecting && !urlError && playlistEntries.length === 0) {
      e.preventDefault();
      onDownload();
    }
  };

  const isAuthError =
    urlError &&
    (urlError.toLowerCase().includes('cookie') ||
      urlError.toLowerCase().includes('age-restricted') ||
      urlError.toLowerCase().includes('private') ||
      urlError.toLowerCase().includes('sign in'));

  const formatTabs = [
    { id: 'mp4', label: 'MP4 Video', icon: <Video className="w-4 h-4 text-teal-400" /> },
    { id: 'mp3', label: 'MP3 Audio', icon: <Music className="w-4 h-4 text-cyan-400" /> },
  ];

  const qualityOptions = [
    { value: '', label: 'Best Available Resolution (Auto)' },
    ...formats.map((f) => ({
      value: String(f.height),
      label: `${f.resolution || `${f.height}p`} ${f.fps ? `(${f.fps}fps)` : ''} ${f.ext ? `[${f.ext}]` : ''}`.trim(),
    })),
  ];

  return (
    <div className="space-y-5 max-w-4xl mx-auto w-full pb-6">
      {/* Primary Command Card */}
      <Card className="surface-panel">
        <CardContent className="space-y-5 p-5 sm:p-6">
          {/* Header with Title and Live Badge */}
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subdued)]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[8px] bg-gradient-to-br from-teal-500/20 to-teal-500/5 border border-teal-500/30 flex items-center justify-center text-[var(--accent-primary)] shadow-sm">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-[var(--text-primary)] tracking-tight">
                  Single Media Downloader
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  Fast, lossless YouTube video extraction and high-bitrate MP3 conversion.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isInspecting ? (
                <Badge variant="accent" size="sm" pulse>
                  Analyzing Link...
                </Badge>
              ) : (
                <Badge variant="default" size="sm">
                  Ready
                </Badge>
              )}
            </div>
          </div>

          {/* Elevated Command Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5">
                <span>Source Media Link</span>
                <span className="text-[var(--text-tertiary)] font-normal font-mono text-[10px]">(YouTube, Shorts, Playlist)</span>
              </label>
              <span className="text-[10px] text-[var(--text-tertiary)] font-mono">
                Press Enter to run
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  size="lg"
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="https://www.youtube.com/watch?v=..."
                  disabled={isDownloading || isInspecting}
                  error={!!urlError}
                  leftIcon={<Sparkles className="w-4 h-4 text-teal-400/80" />}
                  rightIcon={
                    url ? (
                      <button
                        type="button"
                        onClick={handleClearUrl}
                        aria-label="Clear URL"
                        className="p-1 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    ) : null
                  }
                />
              </div>

              <Button
                variant="secondary"
                size="lg"
                onClick={handlePaste}
                disabled={isDownloading || isInspecting || isPasting}
                title="Paste from clipboard (Ctrl+V)"
                kbd="Ctrl+V"
                className="shrink-0 font-medium"
              >
                <ClipboardPaste className="w-4 h-4" />
                <span className="hidden sm:inline">Paste</span>
              </Button>
            </div>

            {/* Error & Warning Alert Banner */}
            <AnimatePresence>
              {urlError && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className={`mt-2 p-3 rounded-[10px] border text-xs flex items-start gap-3 ${
                    isAuthError
                      ? 'bg-amber-500/10 border-amber-500/25 text-amber-300'
                      : 'bg-rose-500/10 border-rose-500/25 text-rose-300'
                  }`}
                >
                  {isAuthError ? (
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="leading-relaxed font-medium">{urlError}</p>
                    {isAuthError && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onOpenCookieWizard}
                        className="mt-2 text-xs border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
                      >
                        Launch Cookie Authentication Wizard
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Skeleton Loader during Inspection */}
          <AnimatePresence>
            {isInspecting && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-3.5 bg-[var(--surface-2)]/60 border border-[var(--border-subdued)] rounded-[10px] flex items-center gap-3.5 animate-pulse">
                  <div className="w-24 h-14 bg-[var(--surface-hover)] rounded-[6px] shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-[var(--surface-hover)] rounded w-3/4" />
                    <div className="h-2.5 bg-[var(--surface-hover)] rounded w-1/3" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Inline Playlist Detected Card */}
          <AnimatePresence>
            {playlistEntries.length > 0 && !urlError && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="p-4 bg-gradient-to-r from-teal-500/10 to-transparent border border-[var(--accent-primary)]/30 rounded-[10px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-[8px] bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30">
                    <ListVideo className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                        YouTube Playlist Detected
                      </span>
                      <Badge variant="accent" size="sm">
                        {playlistEntries.length} Items Found
                      </Badge>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                      {selectedPlaylistVideos.length} of {playlistEntries.length} videos currently queued for batch download.
                    </p>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  onClick={onOpenPlaylistModal}
                  disabled={isDownloading}
                  className="shrink-0 font-semibold"
                >
                  <ListVideo className="w-3.5 h-3.5" />
                  Select Videos ({selectedPlaylistVideos.length})
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Single Video Rich Preview Card */}
          <AnimatePresence>
            {singleVideoMetadata && !urlError && playlistEntries.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="p-3.5 bg-[var(--surface-2)]/80 border border-[var(--border-subdued)] rounded-[12px] flex flex-col sm:flex-row items-start sm:items-center gap-3.5 shadow-sm"
              >
                {/* 16:9 Thumbnail container */}
                <div className="relative w-full sm:w-36 aspect-video bg-black/60 rounded-[8px] overflow-hidden shrink-0 border border-white/10 group">
                  <img
                    src={`https://img.youtube.com/vi/${singleVideoMetadata.id}/mqdefault.jpg`}
                    alt="Thumbnail"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-1 right-1.5 px-1.5 py-0.2 rounded bg-black/80 text-[10px] font-mono font-bold text-white tracking-wide border border-white/10">
                    HD
                  </div>
                </div>

                {/* Video Info */}
                <div className="flex-1 min-w-0">
                  <h3
                    className="text-xs sm:text-sm font-bold text-[var(--text-primary)] leading-snug line-clamp-2"
                    title={singleVideoMetadata.title}
                  >
                    {singleVideoMetadata.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge variant="accent" size="sm" icon={<CheckCircle2 className="w-3 h-3 text-teal-400" />}>
                      Verified YouTube Link
                    </Badge>
                    <span className="text-[11px] text-[var(--text-tertiary)] font-mono">
                      ID: {singleVideoMetadata.id}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Download Configuration: Format & Resolution */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Format Segmented Tab Switcher */}
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-primary)] mb-1.5 uppercase tracking-wider">
                Output Format
              </label>
              <Tabs
                tabs={formatTabs}
                activeTab={downloadType}
                onChange={setDownloadType}
                size="md"
                layoutId="single-format-tab-indicator"
                className="w-full"
              />
            </div>

            {/* Quality Selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-wider">
                  Target Quality
                </label>
                {isFetchingFormats && (
                  <span className="text-[10px] text-[var(--accent-primary)] font-mono animate-pulse">
                    Probing resolutions...
                  </span>
                )}
              </div>
              <Select
                options={qualityOptions}
                value={selectedQuality}
                onChange={setSelectedQuality}
                disabled={downloadType === 'mp3' || isDownloading}
                placeholder={
                  downloadType === 'mp3'
                    ? '320kbps High Quality Audio'
                    : 'Best Available Resolution (Auto)'
                }
              />
            </div>
          </div>

          {/* Destination Directory Strip */}
          <div className="p-3 bg-[var(--surface-2)]/60 border border-[var(--border-subdued)] rounded-[10px] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 rounded-[6px] bg-[var(--surface-1)] text-[var(--accent-primary)] border border-[var(--border-subdued)] shrink-0">
                <FolderOpen className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] block">
                  Download Destination
                </span>
                <span
                  className="font-mono text-xs text-[var(--text-primary)] truncate block font-medium"
                  title={globalOutputDir || 'Default downloads directory'}
                >
                  {globalOutputDir || 'System Default (~/Downloads)'}
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={onSelectOutputDir}
              disabled={isDownloading}
              className="shrink-0 font-medium"
            >
              Browse
            </Button>
          </div>

          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[var(--border-subdued)]">
            <Button
              variant="ghost"
              size="md"
              onClick={onConvertLocal}
              disabled={isDownloading}
              className="w-full sm:w-auto text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              title="Convert local MP4 file on your computer to MP3 audio"
            >
              <FileCode className="w-4 h-4 text-[var(--accent-primary)]" />
              Convert Local MP4 to MP3
            </Button>

            <Button
              variant="primary"
              size="lg"
              onClick={onDownload}
              disabled={
                !url ||
                isDownloading ||
                isInspecting ||
                isFetchingFormats ||
                !!urlError ||
                playlistEntries.length > 0
              }
              isLoading={isDownloading}
              kbd="Enter"
              className="w-full sm:w-64 font-bold shadow-md"
            >
              <Download className="w-4 h-4" />
              {playlistEntries.length > 0
                ? 'Use "Select Videos" Above'
                : downloadType === 'mp3'
                ? 'Download Audio (MP3)'
                : 'Download Video (MP4)'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Download Progress Surface */}
      <AnimatePresence>
        {isDownloading && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
          >
            <Card className="border-[var(--accent-primary)]/40 bg-[var(--surface-1)] shadow-xl relative overflow-hidden">
              {/* Top specular glow */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/50 to-transparent" />

              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Loader2 className="w-4 h-4 text-[var(--accent-primary)] animate-spin" />
                    <div>
                      <span className="text-xs font-bold text-[var(--text-primary)] block">
                        {status || 'Downloading stream via media engine...'}
                      </span>
                      <span className="text-[10px] text-[var(--text-tertiary)] font-mono">
                        Direct FFmpeg & yt-dlp pipeline
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-[var(--accent-primary)] tabular-nums">
                      {progress > 0 ? `${progress.toFixed(1)}%` : 'Starting...'}
                    </span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={onCancelClick}
                      className="h-7 px-2.5 text-xs font-semibold"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>

                <Progress value={progress} indeterminate={progress === 0} />

                {/* Playlist sequential progress queue */}
                {playlistDownloadQueue.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[var(--border-subdued)] max-h-40 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                    <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] block mb-1">
                      Playlist Batch Queue ({playlistDownloadQueue.filter((i) => i.status === 'Done').length} / {playlistDownloadQueue.length} Done)
                    </span>
                    {playlistDownloadQueue.map((item) => (
                      <div
                        key={item.id}
                        className="p-2 rounded-[6px] bg-[var(--surface-2)] text-xs flex items-center justify-between gap-2 border border-[var(--border-subdued)]/60"
                      >
                        <span className="text-[11px] text-[var(--text-primary)] truncate max-w-[280px] font-medium">
                          {item.title}
                        </span>
                        <Badge
                          variant={
                            item.error
                              ? 'danger'
                              : item.status === 'Done'
                              ? 'success'
                              : 'default'
                          }
                          size="sm"
                        >
                          {item.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SingleDownloaderView;

