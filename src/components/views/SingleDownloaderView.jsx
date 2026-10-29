import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Video,
  Music,
  FolderOpen,
  ArrowRightLeft,
  AlertCircle,
  Loader2,
  ListVideo,
  ClipboardPaste,
  X,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  Check,
  RefreshCw,
  Play,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
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
  globalOutputDir = '',
  onSelectOutputDir,
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

  const handleRevealLocation = () => {
    if (globalOutputDir && window.electronAPI?.openFileLocation) {
      window.electronAPI.openFileLocation(globalOutputDir);
    } else if (onSelectOutputDir) {
      onSelectOutputDir();
    }
  };

  const isAuthError =
    urlError &&
    (urlError.toLowerCase().includes('cookie') ||
      urlError.toLowerCase().includes('age-restricted') ||
      urlError.toLowerCase().includes('private') ||
      urlError.toLowerCase().includes('sign in'));

  const qualityOptions = [
    { value: '', label: 'Best Available (Auto: 2160p 60fps HDR)' },
    ...formats.map((f) => ({
      value: String(f.height),
      label: `${f.resolution || `${f.height}p`} ${f.fps ? `(${f.fps}fps)` : ''} ${f.ext ? `[${f.ext}]` : ''}`.trim(),
    })),
  ];

  const quickChips = [
    { label: '2160p', value: '2160' },
    { label: '1440p (2K)', value: '1440' },
    { label: '1080p FHD', value: '1080' },
    { label: '720p', value: '720' },
    { label: 'Audio Only', value: 'audio' },
  ];

  const isChipAvailable = (val) => {
    if (val === 'audio' || formats.length === 0) return true;
    const num = parseInt(val, 10);
    return formats.some((f) => f.height === num || f.height >= num);
  };

  const availableStreamsText =
    formats.length > 0
      ? `Available: ${[...new Set(formats.map((f) => `${f.height}p`))]
          .slice(-4)
          .reverse()
          .join(', ')}, MP3`
      : 'Available: 2160p, 1440p, 1080p, MP3';

  const handleChipClick = (val) => {
    if (val === 'audio') {
      setDownloadType('mp3');
      setSelectedQuality('');
    } else {
      setDownloadType('mp4');
      setSelectedQuality(val);
    }
  };

  // Determine badge label for target quality
  const getQualityBadgeLabel = () => {
    if (downloadType === 'mp3') return 'MP3';
    if (!selectedQuality) return '4K';
    const num = parseInt(selectedQuality, 10);
    if (num >= 2160) return '4K';
    if (num >= 1440) return '2K';
    if (num >= 1080) return 'FHD';
    if (num >= 720) return 'HD';
    return `${selectedQuality}p`;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full pb-8">
      {/* Hero Module Header */}
      <header className="flex items-start justify-between border-b border-purple-900/25 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2 font-heading">
              Single Media Downloader
            </h1>
            <span className="text-[10px] font-mono font-medium text-purple-200 bg-purple-950/70 border border-purple-700/50 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-neon shadow-glow-violet" />
              Lossless 4K / 8K HDR
            </span>
          </div>
          <p className="text-xs text-slate-400 font-normal">
            Zero-latency YouTube video &amp; audio extractor with instant FFmpeg post-processing.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-right">
          <div className="px-2.5 py-1 rounded-lg bg-obsidian-950 border border-purple-900/40 text-[11px] font-mono shadow-inner">
            <span className="text-purple-400/60">Pipeline:</span>
            <span className="text-slate-100 font-semibold ml-1">Direct Stream</span>
          </div>
        </div>
      </header>

      {/* Command-Bar Style Link Input Container */}
      <section className="space-y-2" data-purpose="source-input-panel">
        <div className="flex items-center justify-between text-xs">
          <label
            className="font-mono text-[11px] uppercase tracking-wider text-purple-300/80 flex items-center gap-1.5"
            htmlFor="url-source"
          >
            <span className="text-accent-neon font-bold">#</span> Source Media URL
            <span className="text-slate-500 font-normal hidden sm:inline">
              (YouTube, Shorts, Playlists, Soundcloud)
            </span>
          </label>
          <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
            Press{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-obsidian-850 border border-purple-900/50 text-purple-200 font-mono text-[10px] shadow-sm">
              Enter ↵
            </kbd>{' '}
            to analyze
          </span>
        </div>

        {/* Enhanced Interactive Input Box */}
        <div className="relative flex items-center rounded-xl bg-obsidian-950/90 border border-purple-900/40 focus-within:border-accent-violet focus-within:ring-2 focus-within:ring-accent-violet/30 shadow-inner transition-all">
          <div className="pl-4 pr-2 text-slate-400 flex items-center pointer-events-none">
            <Sparkles className="w-4 h-4 text-accent-neon animate-pulse" />
          </div>
          <input
            id="url-source"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isDownloading || isInspecting}
            placeholder="Paste media link here (e.g., https://youtu.be/...)"
            className="w-full bg-transparent py-3.5 px-2 text-sm text-slate-100 placeholder-slate-600 font-mono focus:outline-none border-0 focus:ring-0"
          />
          <div className="pr-2 flex items-center gap-1.5">
            {url && (
              <button
                type="button"
                onClick={handleClearUrl}
                aria-label="Clear URL"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-purple-950/40 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={handlePaste}
              disabled={isDownloading || isInspecting || isPasting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-obsidian-850 hover:bg-purple-950/50 border border-purple-900/40 text-slate-200 text-xs font-medium hover:border-purple-700/60 transition shadow-sm active:scale-95 cursor-pointer disabled:opacity-40"
            >
              <ClipboardPaste className="w-3.5 h-3.5 text-purple-300" />
              <span>Paste</span>
              <kbd className="text-[9px] font-mono text-purple-300 bg-obsidian-950 px-1.5 py-0.5 rounded border border-purple-900/60">
                Ctrl+V
              </kbd>
            </button>
          </div>
        </div>

        {/* Error & Warning Alert Banner */}
        <AnimatePresence>
          {urlError && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className={`p-3 rounded-xl border text-xs flex items-start gap-3 ${
                isAuthError
                  ? 'bg-amber-950/30 border-amber-800/40 text-amber-200'
                  : 'bg-rose-950/30 border-rose-800/40 text-rose-200'
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
                    className="mt-2 text-xs border-amber-500/40 text-amber-300 hover:bg-amber-950/50"
                  >
                    Launch Cookie Authentication Wizard
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
            <div className="p-4 bg-obsidian-950/80 border border-purple-900/30 rounded-xl flex items-center gap-4 animate-pulse">
              <div className="w-36 h-20 bg-obsidian-850 rounded-lg shrink-0 border border-purple-900/30" />
              <div className="flex-1 space-y-2.5">
                <div className="h-4 bg-obsidian-800 rounded w-3/4" />
                <div className="h-3 bg-obsidian-850 rounded w-1/2" />
                <div className="h-3 bg-obsidian-850 rounded w-1/3" />
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
            className="p-4 bg-gradient-to-r from-purple-950/60 via-obsidian-950 to-obsidian-900 border border-accent-violet/40 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 shadow-glow-violet"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-lg bg-accent-violet/20 text-accent-neon border border-accent-violet/40 shadow-sm">
                <ListVideo className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white font-heading">
                    YouTube Playlist Detected
                  </span>
                  <Badge variant="accent" size="sm">
                    {playlistEntries.length} Videos
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {selectedPlaylistVideos.length} of {playlistEntries.length} items currently queued for batch download.
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

      {/* Live Detected Video Metadata Preview Card */}
      <AnimatePresence>
        {singleVideoMetadata && !urlError && playlistEntries.length === 0 && (
          <motion.article
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="bg-obsidian-950/80 border border-purple-900/30 hover:border-purple-600/50 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center gap-4 relative overflow-hidden group transition shadow-sm"
            data-purpose="media-preview-card"
          >
            {/* Thumbnail Box */}
            <div className="relative w-full sm:w-36 h-22 sm:h-20 rounded-lg overflow-hidden shrink-0 border border-purple-900/40 bg-obsidian-900 flex items-center justify-center">
              <img
                src={`https://img.youtube.com/vi/${singleVideoMetadata.id}/mqdefault.jpg`}
                alt={singleVideoMetadata.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              {/* Play icon overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-950/60 via-transparent to-accent-amethyst/20 flex items-center justify-center pointer-events-none">
                <div className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm border border-purple-400/30 flex items-center justify-center shadow-md">
                  <Play className="w-3.5 h-3.5 text-accent-neon fill-accent-neon ml-0.5" />
                </div>
              </div>
              <span className="absolute bottom-1 right-1 bg-black/85 text-slate-200 text-[10px] font-mono px-1.5 py-0.5 rounded border border-purple-400/20 font-medium z-10">
                HD
              </span>
            </div>

            {/* Video Details and Live Tags */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-rose-300 bg-rose-950/70 border border-rose-800/50 px-1.5 py-0.5 rounded">
                  YouTube
                </span>
                <span className="text-[10px] font-mono text-accent-neon flex items-center gap-1 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-neon inline-block shadow-glow-violet" />
                  Direct Stream Verified
                </span>
                <span className="text-slate-600 text-xs">•</span>
                <span className="text-[11px] text-slate-400 font-mono">
                  ID: {singleVideoMetadata.id}
                </span>
              </div>
              <h3
                className="text-sm font-semibold text-slate-100 line-clamp-2 group-hover:text-accent-neon transition leading-snug"
                title={singleVideoMetadata.title}
              >
                {singleVideoMetadata.title}
              </h3>
              <div className="flex flex-wrap items-center gap-2.5 text-[11px] font-mono text-slate-400 mt-1.5">
                <span>
                  Format:{' '}
                  <span className="text-slate-200 font-semibold uppercase">
                    {downloadType}
                  </span>
                </span>
                <span className="text-purple-900/60">/</span>
                <span>
                  Quality:{' '}
                  <span className="text-purple-300 font-semibold">
                    {downloadType === 'mp3'
                      ? '320kbps Audio'
                      : selectedQuality
                      ? `${selectedQuality}p`
                      : 'Best Available'}
                  </span>
                </span>
                <span className="text-purple-900/60">/</span>
                <span className="text-purple-300/80">
                  {availableStreamsText}
                </span>
              </div>
            </div>

            {/* Quick Refresh Metadata Button */}
            <button
              type="button"
              onClick={() => setUrl(url)}
              disabled={isFetchingFormats || isDownloading}
              className="p-2 rounded-lg bg-obsidian-850 hover:bg-purple-950/40 text-slate-400 hover:text-purple-200 border border-purple-900/40 transition shrink-0 cursor-pointer disabled:opacity-40"
              title="Re-probe Link Metadata"
            >
              <RefreshCw
                className={`w-4 h-4 ${isFetchingFormats ? 'animate-spin text-accent-neon' : ''}`}
              />
            </button>
          </motion.article>
        )}
      </AnimatePresence>

      {/* Configuration Matrix (Format & Quality) */}
      <section
        className="grid grid-cols-1 md:grid-cols-2 gap-5"
        data-purpose="format-configuration-grid"
      >
        {/* Column 1: Output Format Switcher */}
        <div className="space-y-2">
          <label className="block font-mono text-[11px] uppercase tracking-wider text-purple-300/80">
            Output Container Format
          </label>
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-obsidian-950 border border-purple-900/35 rounded-xl">
            {/* MP4 Video Switch */}
            <button
              type="button"
              onClick={() => setDownloadType('mp4')}
              disabled={isDownloading}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
                downloadType === 'mp4'
                  ? 'bg-gradient-to-b from-purple-950/70 to-obsidian-850 border border-accent-violet/60 text-purple-200 shadow-sm'
                  : 'hover:bg-purple-950/30 text-slate-400 hover:text-purple-200 border border-transparent'
              }`}
            >
              <Video className="w-4 h-4 text-accent-neon" />
              <span>MP4 Video</span>
            </button>

            {/* MP3 Audio Switch */}
            <button
              type="button"
              onClick={() => setDownloadType('mp3')}
              disabled={isDownloading}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
                downloadType === 'mp3'
                  ? 'bg-gradient-to-b from-purple-950/70 to-obsidian-850 border border-accent-violet/60 text-purple-200 shadow-sm'
                  : 'hover:bg-purple-950/30 text-slate-400 hover:text-purple-200 border border-transparent'
              }`}
            >
              <Music className="w-4 h-4 text-accent-neon" />
              <span>MP3 Audio</span>
            </button>
          </div>

          {/* Sub-presets info strip */}
          <div className="flex items-center gap-2 pt-1 text-[11px] font-mono text-slate-400">
            <span className="text-purple-400/60">Preset:</span>
            <span className="px-2 py-0.5 rounded bg-purple-950/70 border border-purple-700/50 text-purple-200">
              {downloadType === 'mp3' ? '320 kbps (High Quality)' : 'Lossless Remux (Auto)'}
            </span>
            <span className="text-slate-500">• Direct FFmpeg pipeline</span>
          </div>
        </div>

        {/* Column 2: Target Quality Preset Dropdown */}
        <div className="space-y-2" ref={qualityRef}>
          <div className="flex items-center justify-between">
            <label className="block font-mono text-[11px] uppercase tracking-wider text-purple-300/80">
              Target Resolution &amp; Preset
            </label>
            {isFetchingFormats && (
              <span className="text-[10px] text-accent-neon font-mono animate-pulse">
                Probing resolutions...
              </span>
            )}
          </div>

          <div className="relative">
            <div
              onClick={() => downloadType === 'mp4' && !isDownloading && setIsQualityOpen(!isQualityOpen)}
              className={`w-full bg-obsidian-950 border border-purple-900/40 rounded-xl p-2.5 flex items-center justify-between transition ${
                downloadType === 'mp3' || isDownloading
                  ? 'opacity-60 cursor-not-allowed'
                  : 'hover:border-purple-600/50 cursor-pointer'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-accent-violet/20 border border-accent-violet/40 flex items-center justify-center text-accent-neon font-mono text-xs font-bold shrink-0">
                  {getQualityBadgeLabel()}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-slate-100 truncate">
                    {downloadType === 'mp3'
                      ? '320 kbps (Lossless Extraction)'
                      : selectedQuality
                      ? `${selectedQuality}p High Definition Stream`
                      : 'Best Available (Auto: Lossless HDR)'}
                  </div>
                  <div className="text-[10px] text-purple-300/60 font-mono truncate">
                    {downloadType === 'mp3'
                      ? 'Original audio demuxed directly to MP3'
                      : 'Original bitrate stream multiplexed'}
                  </div>
                </div>
              </div>
              <div className="text-slate-400 pr-1 shrink-0">
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-150 ${
                    isQualityOpen ? 'rotate-180 text-accent-neon' : ''
                  }`}
                />
              </div>
            </div>

            {/* Quality Options Dropdown */}
            <AnimatePresence>
              {isQualityOpen && downloadType === 'mp4' && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  className="absolute z-50 w-full mt-1.5 bg-obsidian-900 border border-purple-800/40 rounded-xl shadow-2xl py-1 max-h-56 overflow-y-auto"
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
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition ${
                          isSelected
                            ? 'bg-purple-950/60 text-accent-neon font-semibold'
                            : 'text-slate-200 hover:bg-purple-950/30'
                        }`}
                      >
                        <span className="truncate">{opt.label}</span>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-accent-neon shrink-0 ml-2" />
                        )}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Quality Preset Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] font-mono">
            {quickChips.map((chip) => {
              const isSelected =
                chip.value === 'audio'
                  ? downloadType === 'mp3'
                  : downloadType === 'mp4' && selectedQuality === chip.value;
              const available = isChipAvailable(chip.value);
              return (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => handleChipClick(chip.value)}
                  disabled={isDownloading}
                  title={!available ? 'Not directly detected in stream sources; engine will auto-fallback to closest available' : undefined}
                  className={`px-2 py-0.5 rounded transition cursor-pointer ${
                    isSelected
                      ? 'bg-purple-950/80 border border-purple-500/60 text-purple-200 font-semibold shadow-sm'
                      : available
                      ? 'bg-obsidian-950 border border-purple-900/40 text-slate-400 hover:text-purple-200 hover:border-purple-700/60'
                      : 'bg-obsidian-950/50 border border-purple-900/20 text-slate-600 hover:text-slate-400'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Destination Folder & Path Selector Module */}
      <section className="space-y-2" data-purpose="destination-folder-bar">
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono text-[11px] uppercase tracking-wider text-purple-300/80">
            Download Destination Path
          </span>
          <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Folder write permissions verified
          </span>
        </div>
        <div className="p-3 bg-obsidian-950/80 border border-purple-900/35 rounded-xl flex items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-purple-950/40 border border-purple-800/40 text-accent-neon shrink-0">
              <FolderOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-mono text-xs text-slate-200 truncate select-all">
                {globalOutputDir ? (
                  (() => {
                    const sep = globalOutputDir.includes('/') ? '/' : '\\';
                    const lastIdx = globalOutputDir.lastIndexOf(sep);
                    const parent = lastIdx !== -1 ? globalOutputDir.substring(0, lastIdx + 1) : '';
                    const folder = lastIdx !== -1 ? globalOutputDir.substring(lastIdx + 1) : globalOutputDir;
                    return (
                      <>
                        <span className="text-slate-400">{parent}</span>
                        <span className="text-accent-neon font-semibold">{folder}</span>
                      </>
                    );
                  })()
                ) : (
                  <span className="text-slate-300">System Default (~/Downloads)</span>
                )}
              </div>
              <div className="text-[10px] text-purple-400/60 font-mono">
                Default Forge Output Subfolder • Ready
              </div>
            </div>
          </div>
          {/* Browse & Reveal Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRevealLocation}
              title="Open folder in File Explorer"
              className="text-xs font-medium"
            >
              Reveal
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onSelectOutputDir}
              disabled={isDownloading}
              className="text-xs font-medium"
            >
              Browse...
            </Button>
          </div>
        </div>
      </section>

      {/* Secondary Action Utility Drawer (Convert Local Media) */}
      <section
        className="border border-dashed border-purple-900/40 hover:border-purple-600/50 bg-obsidian-950/40 rounded-xl p-3.5 flex items-center justify-between transition"
        data-purpose="secondary-utilities"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-950/50 border border-purple-800/40 text-accent-neon">
            <ArrowRightLeft className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-200">
              Convert Local MP4 to MP3
            </h4>
            <p className="text-[11px] text-slate-400">
              Select or extract high-bitrate audio from any existing video file on your computer.
            </p>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={onConvertLocal}
          disabled={isDownloading}
          className="text-xs font-medium text-purple-200 hover:text-white shrink-0"
        >
          Select File
        </Button>
      </section>

      {/* Primary Execution Action Bar */}
      <footer className="pt-2" data-purpose="execution-bar">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-obsidian-950 via-obsidian-900 to-obsidian-950 p-4 rounded-2xl border border-purple-900/35">
          {/* Left Info Pills */}
          <div className="flex items-center gap-3 text-xs text-purple-300/70 font-mono">
            <span className="flex items-center gap-1.5 text-purple-200">
              <CheckCircle2 className="w-4 h-4 text-accent-neon" />
              {singleVideoMetadata ? 'Metadata parsed' : 'Ready to Forge'}
            </span>
            <span className="text-purple-900/60">•</span>
            <span className="text-slate-300">100% Lossless Remux</span>
          </div>

          {/* Big Glowing Call to Action Button */}
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
            kbd="Enter ↵"
            className="w-full sm:w-auto px-8 py-3.5 font-bold text-sm shadow-glow-violet active:scale-[0.98] transition-all"
          >
            <Download className="w-4 h-4 text-white" />
            <span>
              {playlistEntries.length > 0
                ? 'Select Videos Above'
                : downloadType === 'mp3'
                ? 'Download Audio (MP3 320k)'
                : selectedQuality
                ? `Download Media (MP4 ${selectedQuality}p)`
                : 'Download Media (MP4 Lossless)'}
            </span>
          </Button>
        </div>
      </footer>

      {/* Active Download Progress Card */}
      <AnimatePresence>
        {isDownloading && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="p-5 bg-obsidian-950/95 border border-purple-700/50 rounded-2xl shadow-glow-violet space-y-4 relative overflow-hidden"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-neon to-transparent" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-accent-neon animate-spin" />
                <div>
                  <span className="text-xs font-bold text-white block">
                    {status || 'Downloading stream via media engine...'}
                  </span>
                  <span className="text-[10px] text-purple-300/60 font-mono">
                    Direct FFmpeg &amp; yt-dlp pipeline active
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold text-accent-neon tabular-nums">
                  {progress > 0 ? `${progress.toFixed(1)}%` : 'Starting...'}
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onCancelClick}
                  className="h-7 px-3 text-xs font-semibold"
                >
                  Cancel
                </Button>
              </div>
            </div>

            <Progress value={progress} indeterminate={progress === 0} />

            {/* Playlist sequential progress queue */}
            {playlistDownloadQueue.length > 0 && (
              <div className="mt-3 pt-3 border-t border-purple-900/40 max-h-40 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                <span className="text-[10px] uppercase font-bold text-purple-400/80 block mb-1 font-mono">
                  Playlist Batch Queue (
                  {playlistDownloadQueue.filter((i) => i.status === 'Done').length} /{' '}
                  {playlistDownloadQueue.length} Done)
                </span>
                {playlistDownloadQueue.map((item) => (
                  <div
                    key={item.id}
                    className="p-2 rounded-lg bg-obsidian-900 text-xs flex items-center justify-between gap-2 border border-purple-900/30"
                  >
                    <span className="text-[11px] text-slate-200 truncate max-w-[280px] font-medium">
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SingleDownloaderView;
