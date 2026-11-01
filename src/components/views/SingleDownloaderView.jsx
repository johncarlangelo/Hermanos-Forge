import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRightLeft,
  Loader2,
  ListVideo,
  ClipboardPaste,
  Sparkles,
  Check,
  RefreshCw,
  Play,
  Layers,
  Film,
  Scissors,
  Activity,
  HardDrive,
  Gauge,
  Clock,
  Radio,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds < 0) return '00:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

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
  onNavigateTab,
}) {
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const canvasRef = useRef(null);

  // Extract speed from status string (e.g. "8.45MiB/s")
  const extractedSpeed = status && status.includes('/s')
    ? status.match(/[\d.]+\s*(?:K|M|G)i?B\/s/i)?.[0] || 'Active stream'
    : isDownloading ? 'Streaming chunks' : '0.00 KiB/s';

  // Extract ETA from status string
  const extractedEta = status && status.toLowerCase().includes('eta')
    ? status.match(/ETA\s*[\d:]+/i)?.[0] || 'In progress'
    : progress > 0 ? `${progress.toFixed(0)}% elapsed` : 'Ready';

  // Extract downloaded size
  const extractedSize = status && status.includes('of')
    ? status.match(/(?:[\d.]+\s*(?:%|(?:K|M|G|T)i?B))\s*of\s*~?\s*[\d.]+\s*(?:K|M|G|T)i?B/i)?.[0] || 'Dynamic buffer'
    : isDownloading ? 'Dynamic buffer' : 'Awaiting job';

  // Simulated animated audio waveform canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let offset = 0;
    const numBars = 64;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = canvas.width / numBars;
      offset += isDownloading ? 0.08 : 0.03;

      for (let i = 0; i < numBars; i++) {
        const x = i * barWidth;
        const sinVal = Math.sin(i * 0.25 + offset) * Math.cos(i * 0.15 - offset * 0.5);
        const intensity = isDownloading ? 0.8 : isPlayingPreview ? 0.7 : 0.35;
        const barHeight = Math.max(4, Math.abs(sinVal) * (canvas.height * intensity));
        const y = (canvas.height - barHeight) / 2;

        // Gradient coloring
        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (isDownloading) {
          grad.addColorStop(0, '#38bdf8');
          grad.addColorStop(1, '#7c3aed');
        } else if (isPlayingPreview) {
          grad.addColorStop(0, '#a78bfa');
          grad.addColorStop(1, '#4c1d95');
        } else {
          grad.addColorStop(0, '#2a2a3e');
          grad.addColorStop(1, '#1e1e2a');
        }

        ctx.fillStyle = grad;
        ctx.fillRect(x + 1, y, Math.max(1, barWidth - 2), barHeight);
      }
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isDownloading, isPlayingPreview]);

  const handlePasteUrl = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        setUrl(text.trim());
        toast.success('Pasted media URL from clipboard!');
      } else {
        toast('Clipboard does not contain valid text.');
      }
    } catch {
      toast.error('Unable to read clipboard.');
    }
  };

  const isAuthError =
    urlError &&
    (urlError.toLowerCase().includes('cookie') ||
      urlError.toLowerCase().includes('age-restricted') ||
      urlError.toLowerCase().includes('private') ||
      urlError.toLowerCase().includes('sign in'));

  // Dynamic or standard quality tiers for interactive selection chips
  const standardTiers = useMemo(() => {
    if (formats && formats.length > 0) {
      const uniqueHeights = [...new Set(formats.map((f) => f.height))]
        .filter(Boolean)
        .sort((a, b) => b - a);
      if (uniqueHeights.length > 0) {
        return [
          ...uniqueHeights.slice(0, 5).map((h) => ({
            label: h >= 2160 ? '4K UHD' : h >= 1440 ? '2K QHD' : h >= 1080 ? '1080p FHD' : `${h}p`,
            height: String(h),
            desc: `${h}p Video Stream`,
          })),
          { label: '320k MP3', height: 'mp3', desc: 'Lossless Audio Master' },
        ];
      }
    }
    return [
      { label: '4K UHD', height: '2160', desc: 'Ultra High Definition' },
      { label: '2K QHD', height: '1440', desc: 'Quad High Definition' },
      { label: '1080p FHD', height: '1080', desc: 'Full High Definition' },
      { label: '720p HD', height: '720', desc: 'Standard HD' },
      { label: '480p SD', height: '480', desc: 'Standard Definition' },
      { label: '320k MP3', height: 'mp3', desc: 'Lossless Audio Master' },
    ];
  }, [formats]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full pb-10" data-purpose="studio-center-stage">
      {/* Studio Header HUD */}
      <header className="flex w-full items-start justify-between gap-4">
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-center gap-2 text-xs font-mono text-[#7a7a8c]">
            <span>HERMANOS FORGE</span>
            <span>&gt;</span>
            <span className="text-[#a78bfa]">MEDIA WORKBENCH</span>
            <span>&gt;</span>
            <span className="text-[#f4f4f7]">STUDIO CANVAS</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#f4f4f7] font-heading">
            Direct Media Workbench
          </h1>
          <p className="text-xs sm:text-sm text-[#7a7a8c]">
            High-density media canvas with interactive stream preview, live frequency waveform monitor, and hardware-accelerated Forge pipeline.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-2 rounded-full border border-[#22c55e33] bg-[#22c55e14] px-3 py-1 shadow-sm">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22c55e]" />
            </span>
            <span className="text-xs font-bold text-[#86efac] font-mono">
              {isDownloading ? 'Active Forge' : isInspecting ? 'Probing Link' : 'Engine Ready'}
            </span>
          </div>
        </div>
      </header>

      {/* URL Error Banner if inspection failed */}
      <AnimatePresence>
        {urlError && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={`w-full p-4 rounded-xl border text-xs sm:text-sm flex items-start justify-between gap-3 ${
              isAuthError
                ? 'bg-[#fef08a14] border-[#facc1533] text-[#fde047]'
                : 'bg-[#ef44441a] border-[#ef444455] text-[#fca5a5]'
            }`}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${isAuthError ? 'text-[#facc15]' : 'text-[#ef4444]'}`} />
              <div>
                <p className="font-semibold leading-relaxed">{urlError}</p>
                <p className="text-[11px] opacity-80 mt-1">
                  Check your URL or configure your Netscape browser cookies in the Studio Settings drawer.
                </p>
              </div>
            </div>
            {isAuthError && onOpenCookieWizard && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenCookieWizard}
                className="shrink-0 border-[#facc1555] text-[#fde047] hover:bg-[#fef08a22] font-semibold text-xs gap-1.5"
              >
                <span>Launch Cookie Wizard</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. STATE: ACTIVE FORGING / DOWNLOADING MONITOR */}
      <AnimatePresence>
        {isDownloading && (
          <motion.section
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="rounded-2xl border border-[#7c3aed4d] bg-[#12121a] p-6 shadow-2xl surface-panel space-y-6 relative overflow-hidden"
            data-purpose="active-forge-monitor"
          >
            {/* Ambient Purple Spotlight */}
            <div className="ambient-glow-purple pointer-events-none" />

            {/* Forge Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-[#7c3aed26] border border-[#7c3aed66] text-[#c4b5fd]">
                  <Radio className="w-6 h-6 text-[#a78bfa] animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="brand" size="sm" icon={<Loader2 className="w-3 h-3 animate-spin" />}>
                      FORGING STREAM
                    </Badge>
                    <span className="text-xs font-mono text-[#a78bfa] font-bold">
                      {downloadType === 'mp3' ? 'MP3 320k Audio Master' : `${selectedQuality || 'Best'} MP4 Container`}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-[#f4f4f7] font-heading mt-1 line-clamp-1">
                    {singleVideoMetadata?.title || 'Direct Media Pipeline Transfer'}
                  </h2>
                </div>
              </div>

              <Button
                variant="destructive"
                size="sm"
                onClick={onCancelClick}
                className="shrink-0 text-xs px-4 h-9 font-bold font-mono shadow-lg"
              >
                Cancel Forge
              </Button>
            </div>

            {/* Central Progress Ring & Real-Time Waveform */}
            <div className="p-6 rounded-xl bg-[#08080d] border border-[#1e1e2a] flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Radial Progress Display */}
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-[#1e1e2a]"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-[#7c3aed] transition-all duration-300"
                      strokeDasharray={`${Math.max(1, Math.min(100, progress))}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute font-mono text-base font-bold text-[#f4f4f7] tabular-nums">
                    {progress > 0 ? `${progress.toFixed(0)}%` : '0%'}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-mono text-[#a78bfa] block font-bold">
                    PACKET TRANSFER ACTIVE
                  </span>
                  <span className="text-xs font-mono text-[#7a7a8c] block truncate max-w-xs">
                    {status || 'Establishing accelerated streaming connection...'}
                  </span>
                </div>
              </div>

              {/* Real-Time Waveform Monitor */}
              <div className="w-full md:w-72 h-16 rounded-lg bg-[#0c0c14] border border-[#1e1e2a] p-2 flex items-center justify-center relative overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={280}
                  height={56}
                  className="w-full h-full block"
                />
              </div>
            </div>

            {/* Subframe Telemetry Metrics Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
              <div className="p-3 rounded-lg bg-[#08080d] border border-[#1e1e2a]">
                <span className="text-[10px] font-mono uppercase text-[#7a7a8c] block">TRANSFER SPEED</span>
                <div className="flex items-center gap-1.5 mt-1 font-mono text-xs text-[#f4f4f7] font-bold">
                  <Gauge className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
                  <span className="truncate">{extractedSpeed}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#08080d] border border-[#1e1e2a]">
                <span className="text-[10px] font-mono uppercase text-[#7a7a8c] block">TIME REMAINING</span>
                <div className="flex items-center gap-1.5 mt-1 font-mono text-xs text-[#f4f4f7] font-bold">
                  <Clock className="w-3.5 h-3.5 text-[#a78bfa] shrink-0" />
                  <span className="truncate">{extractedEta}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#08080d] border border-[#1e1e2a]">
                <span className="text-[10px] font-mono uppercase text-[#7a7a8c] block">CONTAINER</span>
                <div className="flex items-center gap-1.5 mt-1 font-mono text-xs text-[#f4f4f7] font-bold">
                  <Layers className="w-3.5 h-3.5 text-[#a78bfa] shrink-0" />
                  <span className="truncate">{downloadType === 'mp3' ? 'MP3 320k Audio' : `${selectedQuality || 'Best'} MP4`}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#08080d] border border-[#1e1e2a]">
                <span className="text-[10px] font-mono uppercase text-[#7a7a8c] block">DATA PROCESSED</span>
                <div className="flex items-center gap-1.5 mt-1 font-mono text-xs text-[#f4f4f7] font-bold">
                  <HardDrive className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
                  <span className="truncate">{extractedSize}</span>
                </div>
              </div>
            </div>

            {/* Playlist sequential progress queue if active */}
            {playlistDownloadQueue.length > 0 && (
              <div className="w-full pt-3 border-t border-[#1e1e2a] max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                <span className="text-xs uppercase font-bold text-[#9a9aac] font-mono block mb-1">
                  Playlist Queue ({playlistDownloadQueue.filter((i) => i.status === 'Done').length} / {playlistDownloadQueue.length} Finished)
                </span>
                {playlistDownloadQueue.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-lg bg-[#08080d] text-xs flex items-center justify-between gap-2.5 border border-[#1e1e2a]"
                  >
                    <span className="text-xs text-[#d4d4de] truncate max-w-[340px]">
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
          </motion.section>
        )}
      </AnimatePresence>

      {/* 2. STATE: STREAM PROBING (LOADING SCANNER) */}
      <AnimatePresence>
        {isInspecting && !isDownloading && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="rounded-2xl border border-[#38bdf84d] bg-[#0c0c14] p-8 shadow-2xl surface-panel flex flex-col items-center justify-center text-center space-y-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#38bdf81a] border border-[#38bdf84d] flex items-center justify-center text-[#38bdf8]">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-[#f4f4f7] font-heading">
                Probing Remote Media Stream
              </h3>
              <p className="text-xs text-[#7a7a8c] font-mono max-w-md">
                Analyzing media endpoints, extracting available resolutions, audio tracks, and hardware-accelerated codec manifests...
              </p>
            </div>
            <div className="w-48 h-1 bg-[#1e1e2a] rounded-full overflow-hidden">
              <div className="h-full bg-[#38bdf8] animate-pulse w-3/4 rounded-full" />
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* 3. STATE: PLAYLIST DETECTED REEL */}
      <AnimatePresence>
        {playlistEntries.length > 0 && !urlError && !isDownloading && (
          <motion.section
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="p-6 bg-[#12121a] border border-[#7c3aed4d] rounded-2xl flex flex-col gap-5 shadow-2xl surface-panel"
            data-purpose="playlist-sequence-reel"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-[#7c3aed1f] text-[#a78bfa] border border-[#7c3aed4d] shrink-0">
                  <ListVideo className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-base font-bold text-[#f4f4f7] font-heading">
                      Playlist Sequence Detected
                    </span>
                    <Badge variant="brand" size="sm">
                      {playlistEntries.length} Videos
                    </Badge>
                  </div>
                  <p className="text-xs text-[#b4b4c2] mt-0.5">
                    {selectedPlaylistVideos.length} of {playlistEntries.length} videos selected for sequential batch download.
                  </p>
                </div>
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={onOpenPlaylistModal}
                className="shrink-0 font-bold text-xs sm:text-sm px-5 h-10 shadow-lg shadow-violet-950/40"
              >
                <ListVideo className="w-4 h-4 mr-1.5" />
                <span>Configure Selection ({selectedPlaylistVideos.length})</span>
              </Button>
            </div>

            {/* Sequence Preview Reel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2 border-t border-[#1e1e2a]">
              {playlistEntries.slice(0, 6).map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-3 rounded-xl bg-[#08080d] border border-[#1e1e2a] flex items-center gap-3"
                >
                  <span className="text-[10px] font-mono font-bold text-[#7a7a8c] w-5 shrink-0 text-center">
                    #{idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-mono font-medium text-[#f4f4f7] truncate block">
                      {item.title}
                    </span>
                    <span className="text-[10px] font-mono text-[#5c5c6e] block">
                      {item.duration ? formatTime(item.duration) : 'Video stream'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* 4. STATE: STREAM LOCKED (SINGLE VIDEO METADATA LOADED) */}
      <AnimatePresence>
        {singleVideoMetadata && !urlError && playlistEntries.length === 0 && !isDownloading && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="rounded-2xl border border-[#1e1e2a] bg-[#12121a] p-6 shadow-2xl surface-panel space-y-6 relative overflow-hidden"
            data-purpose="stream-locked-card"
          >
            {/* Ambient Purple Glow */}
            <div className="ambient-glow-purple pointer-events-none" />

            {/* Top Preview Monitor Row */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* 16:9 Video Player Monitor Frame */}
              <div
                onClick={() => setIsPlayingPreview(!isPlayingPreview)}
                className="relative w-full md:w-64 aspect-video rounded-xl overflow-hidden shrink-0 border border-[#2a2a3a] bg-[#08080d] flex items-center justify-center cursor-pointer group shadow-lg"
                title="Click to toggle preview playback simulation"
              >
                <img
                  src={`https://img.youtube.com/vi/${singleVideoMetadata.id}/mqdefault.jpg`}
                  alt={singleVideoMetadata.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center transition-colors group-hover:bg-black/25">
                  <div className="w-10 h-10 rounded-full bg-black/70 border border-white/20 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 font-mono text-[10px] text-white border border-white/10">
                  HD Stream
                </div>
              </div>

              {/* Video Metadata HUD */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="brand" size="sm">
                    YouTube Stream
                  </Badge>
                  <Badge variant="success" size="sm" icon={<CheckCircle2 className="w-3 h-3" />}>
                    Stream Locked
                  </Badge>
                  <span className="text-[11px] text-[#7a7a8c] font-mono">
                    ID: {singleVideoMetadata.id}
                  </span>
                </div>

                <h3 className="text-base sm:text-xl font-bold text-[#f4f4f7] font-heading line-clamp-2 leading-snug">
                  {singleVideoMetadata.title}
                </h3>

                <p className="text-xs text-[#7a7a8c] font-mono">
                  Ready for direct hardware-accelerated download. Choose your target container format and resolution in the Studio Inspector on the right, or click a quality chip below.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {onDownload && (
                    <Button
                      variant="primary"
                      size="xs"
                      onClick={onDownload}
                      className="font-mono text-[11px] gap-1.5 shadow-md shadow-violet-950/40 bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] font-bold"
                    >
                      <Sparkles className="w-3 h-3 text-white" />
                      <span>Forge Stream</span>
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => setUrl(url)}
                    disabled={isFetchingFormats}
                    className="font-mono text-[11px] text-[#c4b5fd] border-[#7c3aed4d] hover:bg-[#7c3aed1a] gap-1.5"
                  >
                    <RefreshCw className={`w-3 h-3 ${isFetchingFormats ? 'animate-spin' : ''}`} />
                    <span>Re-probe Manifest</span>
                  </Button>

                  {onNavigateTab && (
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => onNavigateTab('selective')}
                      className="font-mono text-[11px] text-[#7a7a8c] hover:text-[#f4f4f7] gap-1"
                    >
                      <Film className="w-3 h-3 text-[#a78bfa]" />
                      <span>Open in Timeline Trimmer →</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Interactive Real-Time Waveform Monitor Strip */}
            <div className="rounded-xl bg-[#08080d] border border-[#1e1e2a] p-3 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono text-[#7a7a8c]">
                <span className="flex items-center gap-1.5 uppercase font-bold">
                  <Activity className="w-3 h-3 text-[#a78bfa]" /> STREAM FREQUENCY SPECTRUM
                </span>
                <span className="text-[#a78bfa]">
                  {isPlayingPreview ? 'SIMULATING PLAYBACK' : 'IDLE SPECTRUM'}
                </span>
              </div>
              <div className="w-full h-12 flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={48}
                  className="w-full h-full block"
                />
              </div>
            </div>

            {/* Interactive Stream Format Tier Matrix */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-[10px] font-mono text-[#7a7a8c]">
                <span className="uppercase font-bold">SELECTABLE RESOLUTION TIERS</span>
                <span>Click a chip to set output target</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {standardTiers.map((tier) => {
                  const isMp3Tier = tier.height === 'mp3';
                  const isSelected = isMp3Tier
                    ? downloadType === 'mp3'
                    : downloadType === 'mp4' && String(selectedQuality) === String(tier.height);

                  return (
                    <button
                      key={tier.height}
                      type="button"
                      onClick={() => {
                        if (isMp3Tier) {
                          setDownloadType('mp3');
                        } else {
                          setDownloadType('mp4');
                          setSelectedQuality(tier.height);
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#7c3aed26] border-[#7c3aed] text-white shadow-md shadow-violet-950/40 ring-1 ring-[#7c3aed]'
                          : 'bg-[#08080d] border-[#1e1e2a] hover:border-[#2a2a3a] text-[#7a7a8c] hover:text-[#f4f4f7]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-mono font-bold ${isSelected ? 'text-[#c4b5fd]' : 'text-[#f4f4f7]'}`}>
                          {tier.label}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#22c55e]" />}
                      </div>
                      <span className="text-[10px] font-mono text-[#5c5c6e] block truncate">
                        {tier.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* 5. STATE: IDLE STUDIO CANVAS (WHEN NO URL / WAITING FOR STREAM) */}
      {!url && !isInspecting && !isDownloading && !singleVideoMetadata && (
        <section
          className="rounded-2xl border border-[#1e1e2a] bg-[#12121a] p-8 sm:p-10 shadow-2xl surface-panel relative overflow-hidden flex flex-col items-center justify-center text-center space-y-8"
          data-purpose="studio-idle-canvas"
        >
          {/* Ambient Purple Glow */}
          <div className="ambient-glow-purple pointer-events-none" />

          {/* Center Stage Monitor Frame */}
          <div className="relative w-full max-w-xl aspect-video rounded-2xl bg-[#08080d] border border-[#232332] p-6 flex flex-col items-center justify-center shadow-inner overflow-hidden group">
            {/* Background Audio Spectrum Simulation */}
            <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
              <canvas
                ref={canvasRef}
                width={500}
                height={160}
                className="w-full h-full block"
              />
            </div>

            {/* Studio Monitor Emblem */}
            <div className="relative z-10 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#4c1d95] flex items-center justify-center shadow-xl shadow-violet-950/50 border border-violet-500/30">
                <Sparkles className="w-6 h-6 text-white" />
              </div>

              <div className="space-y-1">
                <h2 className="text-lg sm:text-xl font-bold text-[#f4f4f7] font-heading">
                  Studio Media Canvas
                </h2>
                <p className="text-xs text-[#7a7a8c] font-mono max-w-sm">
                  Enter a YouTube link in the Command Bar above (<kbd className="text-[#a78bfa]">Ctrl+K</kbd>) or paste from your clipboard.
                </p>
              </div>

              {/* Instant Action Pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handlePasteUrl}
                  className="font-mono text-xs gap-1.5 bg-[#14141d] hover:bg-[#1e1e2a] border-[#2a2a3a] text-[#c4b5fd]"
                >
                  <ClipboardPaste className="w-3.5 h-3.5 text-[#a78bfa]" />
                  <span>Paste Stream Link</span>
                  <kbd className="text-[10px] text-[#7a7a8c] ml-1">Ctrl+V</kbd>
                </Button>

                {onConvertLocal && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onConvertLocal}
                    className="font-mono text-xs gap-1.5 text-[#7a7a8c] hover:text-[#f4f4f7]"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5 text-[#a78bfa]" />
                    <span>Convert Local MP4</span>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Studio Hardware & Pipeline Capabilities Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-3xl">
            <div className="p-3.5 rounded-xl bg-[#08080d] border border-[#1e1e2a] text-left">
              <span className="text-[10px] font-mono uppercase text-[#5c5c6e] block">HARDWARE ENGINE</span>
              <span className="text-xs font-mono font-bold text-[#c4b5fd] block mt-1">
                NVENC / CPU Lossless
              </span>
              <span className="text-[10px] text-[#7a7a8c] block mt-0.5">Hardware accelerated</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#08080d] border border-[#1e1e2a] text-left">
              <span className="text-[10px] font-mono uppercase text-[#5c5c6e] block">MEDIA CORE</span>
              <span className="text-xs font-mono font-bold text-[#c4b5fd] block mt-1">
                yt-dlp 2026.03
              </span>
              <span className="text-[10px] text-[#7a7a8c] block mt-0.5">Direct stream extractor</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#08080d] border border-[#1e1e2a] text-left">
              <span className="text-[10px] font-mono uppercase text-[#5c5c6e] block">AUDIO MASTER</span>
              <span className="text-xs font-mono font-bold text-[#c4b5fd] block mt-1">
                320 kbps LAME CBR
              </span>
              <span className="text-[10px] text-[#7a7a8c] block mt-0.5">Lossless audio transcode</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#08080d] border border-[#1e1e2a] text-left">
              <span className="text-[10px] font-mono uppercase text-[#5c5c6e] block">CONTAINER DEMUX</span>
              <span className="text-xs font-mono font-bold text-[#c4b5fd] block mt-1">
                FFmpeg 7.0 Engine
              </span>
              <span className="text-[10px] text-[#7a7a8c] block mt-0.5">Zero quality loss copy</span>
            </div>
          </div>

          {/* Studio Quick-Tool Launchers */}
          {onNavigateTab && (
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onNavigateTab('mass-clip')}
                className="px-4 py-2 rounded-xl bg-[#08080d] border border-[#1e1e2a] hover:border-[#7c3aed4d] hover:bg-[#7c3aed14] text-xs font-mono text-[#b4b4c2] hover:text-[#f4f4f7] flex items-center gap-2 transition cursor-pointer"
              >
                <Scissors className="w-3.5 h-3.5 text-[#a78bfa]" />
                <span>Multi-Track Sequence Stitcher</span>
                <kbd className="px-1 py-0.2 rounded bg-[#14141d] text-[10px] text-[#7a7a8c]">Ctrl+2</kbd>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('selective')}
                className="px-4 py-2 rounded-xl bg-[#08080d] border border-[#1e1e2a] hover:border-[#7c3aed4d] hover:bg-[#7c3aed14] text-xs font-mono text-[#b4b4c2] hover:text-[#f4f4f7] flex items-center gap-2 transition cursor-pointer"
              >
                <Film className="w-3.5 h-3.5 text-[#a78bfa]" />
                <span>Keyframe Timeline Trimmer</span>
                <kbd className="px-1 py-0.2 rounded bg-[#14141d] text-[10px] text-[#7a7a8c]">Ctrl+3</kbd>
              </button>
            </div>
          )}
        </section>
      )}

      {/* Secondary Quick Action: Transcode Local MP4 */}
      {onConvertLocal && !isDownloading && (
        <section
          className="border border-[#1e1e2a] hover:border-[#2a2a3a] bg-[#12121a] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition shadow-md"
          data-purpose="secondary-utilities"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-[#7c3aed1a] border border-[#7c3aed33] text-[#a78bfa] shrink-0">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#f4f4f7] font-heading">
                Extract Audio from Local MP4 Video
              </h4>
              <p className="text-xs text-[#7a7a8c] mt-0.5">
                Instantly transcode existing local MP4 videos into high-bitrate 320kbps MP3 audio files.
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={onConvertLocal}
            className="text-xs font-bold text-[#d4d4de] hover:text-white shrink-0 self-start sm:self-auto px-4"
          >
            Select Video File
          </Button>
        </section>
      )}
    </div>
  );
}

export default SingleDownloaderView;
