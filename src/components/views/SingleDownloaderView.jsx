import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Video,
  Music,
  ArrowRightLeft,
  AlertCircle,
  Loader2,
  ListVideo,
  ClipboardPaste,
  X,
  ShieldAlert,
  Sparkles,
  ChevronDown,
  Check,
  RefreshCw,
  Play,
  Copy,
  Gauge,
  Clock,
  Layers,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Progress } from '@/components/ui/Progress';
import toast from 'react-hot-toast';

export function SingleDownloaderView({
  url,
  setUrl,
  downloadType,
  setDownloadType,
  selectedQuality,
  setSelectedQuality,
  formats = [],
  isFetchingFormats = false,
  isInspecting = false,
  urlError = null,
  singleVideoMetadata = null,
  playlistEntries = [],
  selectedPlaylistVideos = [],
  isDownloading = false,
  progress = 0,
  status = '',
  playlistDownloadQueue = [],
  onDownload,
  onConvertLocal,
  onCancelClick,
  onOpenPlaylistModal,
  onOpenCookieWizard,
}) {
  const [isPasting, setIsPasting] = useState(false);
  const [isQualityOpen, setIsQualityOpen] = useState(false);
  const qualityRef = useRef(null);

  // Close quality select dropdown on click outside or Escape
  useEffect(() => {
    const handleOutside = (e) => {
      if (qualityRef.current && !qualityRef.current.contains(e.target)) {
        setIsQualityOpen(false);
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setIsQualityOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

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
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!url.trim() || isDownloading || isInspecting || urlError) return;
      if (playlistEntries.length > 0) return;

      if (singleVideoMetadata) {
        onDownload();
      } else {
        setUrl(url.trim());
      }
    }
  };

  const isAuthError =
    urlError &&
    (urlError.toLowerCase().includes('cookie') ||
      urlError.toLowerCase().includes('age-restricted') ||
      urlError.toLowerCase().includes('private') ||
      urlError.toLowerCase().includes('sign in'));

  const qualityOptions = [
    { value: '', label: 'Best Available (Auto)' },
    ...formats.map((f) => ({
      value: String(f.height),
      label: `${f.resolution || `${f.height}p`} ${f.fps ? `(${f.fps}fps)` : ''} ${f.ext ? `[${f.ext}]` : ''}`.trim(),
    })),
  ];

  const availableStreamsText =
    formats.length > 0
      ? `Available: ${[...new Set(formats.map((f) => `${f.height}p`))]
        .slice(-4)
        .reverse()
        .join(', ')}, MP3`
      : 'Available: 2160p, 1440p, 1080p, MP3';

  // Determine badge label for target quality
  const getQualityBadgeLabel = () => {
    if (downloadType === 'mp3') return 'MP3';
    if (!selectedQuality) return 'Auto';
    const num = parseInt(selectedQuality, 10);
    if (num >= 2160) return '4K';
    if (num >= 1440) return '2K';
    if (num >= 1080) return 'FHD';
    if (num >= 720) return 'HD';
    return `${selectedQuality}p`;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full pb-10">
      {/* Subframe Studio Header */}
      <header className="flex w-full items-start justify-between gap-4">
        <div className="flex flex-col items-start gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#f4f4f7] font-heading">
            Single Media Downloader
          </h1>
          <p className="text-xs sm:text-sm text-[#7a7a8c]">
            Paste a link, choose a format and quality, and forge it straight to your output folder.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-solid border-[#22c55e33] bg-[#22c55e14] px-3 py-1 shrink-0">
          <div className="flex h-2 w-2 flex-none items-start rounded-full bg-[#22c55e]" />
          <span className="text-xs font-bold text-[#86efac]">
            Engine ready
          </span>
        </div>
      </header>

      {/* Subframe Main Media Configuration Panel */}
      <section className="flex w-full flex-col items-start gap-5 rounded-xl border border-solid border-[#1e1e2a] bg-[#12121a] px-6 py-6 shadow-lg">
        {/* Media URL Input Row */}
        <div className="flex w-full flex-col items-start gap-2">
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-bold uppercase tracking-wider text-[#9a9aac]">
              Media URL
            </span>
            <span className="text-xs text-[#7a7a8c] font-mono flex items-center gap-1.5">
              Press{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-[#1e1e2a] border border-[#2a2a3a] text-[#c4b5fd] font-mono text-[11px]">
                Enter ↵
              </kbd>{' '}
              to {singleVideoMetadata ? 'download' : 'analyze'}
            </span>
          </div>

          <Input
            id="url-source"
            type="url"
            size="lg"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isDownloading || isInspecting}
            placeholder="https://youtube.com/watch?v=..."
            leftIcon={<Sparkles className="w-4 h-4 text-[#a78bfa]" />}
            className="font-mono text-sm sm:text-base pr-28 bg-[#0b0b10] border-[#2a2a3a]"
            rightIcon={
              <div className="flex items-center gap-1.5">
                {url && (
                  <Button
                    variant="ghost"
                    size="iconSm"
                    onClick={handleClearUrl}
                    aria-label="Clear URL"
                    className="text-[#7a7a8c] hover:text-[#f4f4f7]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handlePaste}
                  disabled={isDownloading || isInspecting || isPasting}
                  className="h-7 px-2.5 text-xs font-bold text-[#c4b5fd] bg-[#1e1e2a] hover:bg-[#2a2a3a] border border-[#2a2a3a]"
                >
                  <ClipboardPaste className="w-3.5 h-3.5 text-[#a78bfa]" />
                  <span>Paste</span>
                </Button>
              </div>
            }
          />
        </div>

        {/* Error Alert */}
        <AnimatePresence>
          {urlError && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className={`w-full p-3.5 rounded-xl border text-xs sm:text-sm flex items-start gap-3 ${
                isAuthError
                  ? 'bg-[#fef08a14] border-[#facc1533] text-[#fde047]'
                  : 'bg-[#ef44441a] border-[#ef444455] text-[#fca5a5]'
              }`}
            >
              {isAuthError ? (
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-[#facc15]" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-[#ef4444]" />
              )}
              <div className="flex-1 min-w-0">
                <p className="leading-relaxed font-medium">{urlError}</p>
                {isAuthError && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onOpenCookieWizard}
                    className="mt-2 text-xs border-[#facc1555] text-[#fde047] hover:bg-[#fef08a22]"
                  >
                    Launch Cookie Authentication Wizard
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Format, Quality, and Download Button Controls */}
        <div className="flex w-full items-end gap-4 mobile:flex-col mobile:items-stretch">
          {/* Format Selector */}
          <div className="flex flex-col items-start gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#9a9aac]">
              Format
            </span>
            <div className="flex h-10 flex-none items-center gap-1 rounded-full border border-solid border-[#2a2a3a] bg-[#0b0b10] px-1">
              <Button
                variant={downloadType === 'mp4' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setDownloadType('mp4')}
                disabled={isDownloading}
                className={`rounded-full h-8 px-4 text-xs font-bold ${
                  downloadType === 'mp4'
                    ? 'bg-[#7c3aed] text-white shadow-md'
                    : 'text-[#9a9aac] hover:text-[#f4f4f7]'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>MP4</span>
              </Button>
              <Button
                variant={downloadType === 'mp3' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setDownloadType('mp3')}
                disabled={isDownloading}
                className={`rounded-full h-8 px-4 text-xs font-bold ${
                  downloadType === 'mp3'
                    ? 'bg-[#7c3aed] text-white shadow-md'
                    : 'text-[#9a9aac] hover:text-[#f4f4f7]'
                }`}
              >
                <Music className="w-3.5 h-3.5" />
                <span>MP3</span>
              </Button>
            </div>
          </div>

          {/* Quality Dropdown */}
          <div className="flex flex-col items-start gap-2 grow relative" ref={qualityRef}>
            <span className="text-xs font-bold uppercase tracking-wider text-[#9a9aac]">
              Quality
            </span>
            <div
              onClick={() => downloadType === 'mp4' && !isDownloading && setIsQualityOpen(!isQualityOpen)}
              className={`flex h-10 w-full flex-none items-center gap-2 rounded-lg border border-solid border-[#2a2a3a] bg-[#0b0b10] px-3 transition ${
                downloadType === 'mp3' || isDownloading
                  ? 'opacity-60 cursor-not-allowed'
                  : 'hover:border-[#3a3a4e] cursor-pointer'
              }`}
            >
              <span className="text-xs font-mono text-[#a78bfa] font-bold">
                {getQualityBadgeLabel()}
              </span>
              <span className="text-xs sm:text-sm text-[#f4f4f7] grow truncate">
                {downloadType === 'mp3'
                  ? 'High Quality Audio (320kbps MP3)'
                  : selectedQuality
                  ? `${selectedQuality}p Video`
                  : 'Best Available (Auto)'}
              </span>
              <span className="text-xs font-bold text-[#c4b5fd] rounded bg-[#7c3aed26] px-1.5 py-0.5">
                {downloadType === 'mp3' ? 'MP3' : isFetchingFormats ? 'Probing...' : 'Ready'}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-[#7a7a8c] transition-transform duration-150 ${
                  isQualityOpen ? 'rotate-180 text-[#a78bfa]' : ''
                }`}
              />
            </div>

            {/* Quality Options Dropdown */}
            <AnimatePresence>
              {isQualityOpen && downloadType === 'mp4' && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  className="absolute top-full left-0 z-50 w-full mt-1.5 bg-[#14141d] border border-[#2a2a3a] rounded-xl shadow-2xl py-1 max-h-56 overflow-y-auto"
                >
                  {qualityOptions.map((opt) => {
                    const isSelected = String(selectedQuality) === String(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setSelectedQuality(opt.value);
                          setIsQualityOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs sm:text-sm flex items-center justify-between transition ${
                          isSelected
                            ? 'bg-[#7c3aed1f] text-[#ede9fe] font-semibold'
                            : 'text-[#d4d4de] hover:bg-[#ffffff0a]'
                        }`}
                      >
                        <span className="truncate">{opt.label}</span>
                        {isSelected && (
                          <Check className="w-4 h-4 text-[#a78bfa] shrink-0 ml-2" />
                        )}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Primary Action Button */}
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
            className="px-6 h-10 mobile:w-full font-bold shadow-md shadow-violet-950/40 text-sm"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </Button>
        </div>
      </section>

      {/* Inspection Skeleton Loader */}
      <AnimatePresence>
        {isInspecting && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-5 bg-[#12121a] border border-[#1e1e2a] rounded-xl flex items-center gap-4 animate-pulse">
              <div className="w-36 h-20 bg-[#1e1e2a] rounded-lg shrink-0" />
              <div className="flex-1 space-y-2.5">
                <div className="h-4 bg-[#1e1e2a] rounded w-3/4" />
                <div className="h-3 bg-[#1e1e2a] rounded w-1/2" />
                <div className="h-3 bg-[#1e1e2a] rounded w-1/3" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Playlist Detected Notification Card */}
      <AnimatePresence>
        {playlistEntries.length > 0 && !urlError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="p-5 bg-[#12121a] border border-[#7c3aed4d] rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-lg bg-[#7c3aed1f] text-[#a78bfa] border border-[#7c3aed4d] shrink-0">
                <ListVideo className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="text-sm sm:text-base font-bold text-[#f4f4f7] font-heading">
                    Playlist Detected
                  </span>
                  <Badge variant="brand" size="sm">
                    {playlistEntries.length} Videos
                  </Badge>
                </div>
                <p className="text-xs text-[#b4b4c2] mt-0.5">
                  {selectedPlaylistVideos.length} of {playlistEntries.length} items queued for batch download.
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={onOpenPlaylistModal}
              disabled={isDownloading}
              className="shrink-0 font-bold text-xs sm:text-sm"
            >
              <ListVideo className="w-4 h-4" />
              Select Videos ({selectedPlaylistVideos.length})
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detected Video Metadata Preview Card */}
      <AnimatePresence>
        {singleVideoMetadata && !urlError && playlistEntries.length === 0 && (
          <motion.article
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="bg-[#12121a] border border-[#1e1e2a] rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-lg group transition"
            data-purpose="media-preview-card"
          >
            <div className="relative w-full sm:w-36 h-22 sm:h-20 rounded-lg overflow-hidden shrink-0 border border-[#2a2a3a] bg-[#0b0b10] flex items-center justify-center">
              <img
                src={`https://img.youtube.com/vi/${singleVideoMetadata.id}/mqdefault.jpg`}
                alt={singleVideoMetadata.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
                <div className="w-7 h-7 rounded-full bg-black/60 border border-white/20 flex items-center justify-center">
                  <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
                </div>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <Badge variant="brand" size="sm">
                  YouTube
                </Badge>
                <Badge variant="success" size="sm">
                  Stream Ready
                </Badge>
                <span className="text-xs text-[#7a7a8c] font-mono">
                  ID: {singleVideoMetadata.id}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-[#f4f4f7] line-clamp-1 leading-snug">
                {singleVideoMetadata.title}
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#7a7a8c] mt-1">
                <span>{availableStreamsText}</span>
              </div>
            </div>

            <Button
              variant="secondary"
              size="icon"
              onClick={() => setUrl(url)}
              disabled={isFetchingFormats || isDownloading}
              className="p-2 rounded-lg bg-[#14141d] hover:bg-[#1e1e2a] text-[#7a7a8c] hover:text-[#f4f4f7] border border-[#2a2a3a] transition shrink-0 cursor-pointer disabled:opacity-40"
              title="Re-probe Link Metadata"
            >
              <RefreshCw
                className={`w-4 h-4 ${isFetchingFormats ? 'animate-spin text-[#a78bfa]' : ''}`}
              />
            </Button>
          </motion.article>
        )}
      </AnimatePresence>

      {/* Subframe Live Progress & Status Card */}
      <AnimatePresence>
        {isDownloading && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="flex w-full flex-col items-start gap-5 rounded-xl border border-solid border-[#1e1e2a] bg-[#12121a] px-6 py-6 shadow-lg"
          >
            {/* Header row with Title & Cancel Button */}
            <div className="flex w-full items-start justify-between gap-4">
              <div className="flex flex-col items-start gap-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="brand" icon={<Loader2 className="w-3 h-3 animate-spin" />}>
                    Downloading
                  </Badge>
                  <span className="text-xs text-[#7a7a8c]">
                    {downloadType.toUpperCase()} · {selectedQuality ? `${selectedQuality}p` : 'Best'}
                  </span>
                </div>
                <span className="line-clamp-1 text-base font-bold text-[#f4f4f7]">
                  {singleVideoMetadata?.title || 'Media Processing'}
                </span>
                <span className="text-xs text-[#7a7a8c]">
                  {status || 'Downloading media fragments to output folder...'}
                </span>
              </div>

              <Button
                variant="destructive"
                size="sm"
                onClick={onCancelClick}
                className="shrink-0 text-xs"
              >
                Cancel
              </Button>
            </div>

            {/* Percentage & Progress Bar */}
            <div className="flex w-full flex-col items-start gap-3">
              <div className="flex w-full items-end justify-between">
                <span className="text-3xl font-bold text-[#f4f4f7] font-mono">
                  {progress > 0 ? `${progress.toFixed(0)}%` : '0%'}
                </span>
                <span className="text-xs text-[#9a9aac] font-mono">
                  {progress > 0 ? `${progress.toFixed(1)}% complete` : 'Initializing...'}
                </span>
              </div>
              <Progress value={progress} indeterminate={progress === 0} />

              {/* Subframe Telemetry Metrics Row */}
              <div className="flex w-full flex-wrap items-center gap-6 mobile:gap-3 pt-1">
                <div className="flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-[#a78bfa]" />
                  <span className="text-xs text-[#b4b4c2] font-mono">
                    {status && status.includes('/s')
                      ? status.match(/[\d.]+\s*(?:K|M|G)i?B\/s/i)?.[0] || 'Active stream'
                      : isDownloading ? 'Streaming data' : 'Idle'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#a78bfa]" />
                  <span className="text-xs text-[#b4b4c2] font-mono">
                    {status && status.toLowerCase().includes('eta')
                      ? status.match(/ETA\s*[\d:]+/i)?.[0] || 'In progress'
                      : progress > 0 ? `${progress.toFixed(0)}% elapsed` : 'Calculating...'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#a78bfa]" />
                  <span className="text-xs text-[#b4b4c2] font-mono">
                    {downloadType === 'mp3' ? 'Audio Stream (MP3)' : `${selectedQuality || 'Best'} Video Stream`}
                  </span>
                </div>
              </div>
            </div>

            {/* Playlist sequential progress queue */}
            {playlistDownloadQueue.length > 0 && (
              <div className="w-full pt-3 border-t border-[#1e1e2a] max-h-48 overflow-y-auto space-y-2 pr-1">
                <span className="text-xs uppercase font-bold text-[#9a9aac] font-mono block mb-1">
                  Playlist Queue ({playlistDownloadQueue.filter((i) => i.status === 'Done').length} / {playlistDownloadQueue.length} Done)
                </span>
                {playlistDownloadQueue.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-lg bg-[#0b0b10] text-xs flex items-center justify-between gap-2.5 border border-[#1e1e2a]"
                  >
                    <span className="text-xs text-[#d4d4de] truncate max-w-[320px]">
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

            {/* Subframe Status Log Box */}
            <div className="flex w-full flex-col items-start gap-2 rounded-lg border border-solid border-[#1e1e2a] bg-[#0b0b10] px-4 py-3">
              <div className="flex w-full items-center justify-between">
                <span className="text-[11px] font-bold text-[#5c5c6e] uppercase tracking-wider font-mono">
                  Status Log
                </span>
                <Button
                  variant="ghost"
                  size="iconSm"
                  onClick={() => {
                    navigator.clipboard.writeText(status || 'Media stream active.');
                    toast.success('Log copied to clipboard');
                  }}
                  title="Copy log entry"
                  aria-label="Copy log"
                  className="text-[#7a7a8c] hover:text-[#f4f4f7]"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
              <div className="flex w-full items-center gap-2 text-xs font-mono">
                <span className="text-[#22c55e] font-bold">INFO</span>
                <span className="text-[#b4b4c2] truncate">
                  {status || 'Media stream active.'}
                </span>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Local MP4 to MP3 Utility Drawer */}
      <section
        className="border border-dashed border-[#2a2a3a] hover:border-[#3a3a4e] bg-[#12121a]/40 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 transition"
        data-purpose="secondary-utilities"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#14141d] border border-[#2a2a3a] text-[#a78bfa] shrink-0">
            <ArrowRightLeft className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-[#f4f4f7]">
              Convert Local MP4 to MP3
            </h4>
            <p className="text-xs text-[#7a7a8c] mt-0.5">
              Extract high-bitrate audio from an existing MP4 file on your disk.
            </p>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={onConvertLocal}
          disabled={isDownloading}
          className="text-xs font-bold text-[#d4d4de] hover:text-white shrink-0 self-start sm:self-auto"
        >
          Select File
        </Button>
      </section>
    </div>
  );
}

export default SingleDownloaderView;
