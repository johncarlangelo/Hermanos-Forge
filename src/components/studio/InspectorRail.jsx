import { useState, useRef, useEffect } from 'react';
import {
  Video,
  Music,
  Download,
  FolderOpen,
  Gauge,
  Clock,
  Terminal,
  Activity,
  ChevronDown,
  Check,
  PanelRightClose,
  Loader2,
  HardDrive,
  FileAudio,
  Radio,
  Scissors,
  Film,
  RotateCcw,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tooltip } from '@/components/ui/Tooltip';

const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds < 0) return '00:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export function InspectorRail({
  isOpen = true,
  onClose,
  activeTab = 'download',
  // Single Downloader props
  downloadType = 'mp4',
  setDownloadType,
  selectedQuality = '',
  setSelectedQuality,
  formats = [],
  isFetchingFormats = false,
  globalOutputDir = '',
  onOpenOutputModal,
  isDownloading = false,
  progress = 0,
  status = '',
  onDownload,
  onCancelClick,
  url = '',
  singleVideoMetadata = null,
  playlistEntries = [],
  onOpenPlaylistModal,
  onConvertLocal,
  // Multi-Track Stitcher props
  massClips = [],
  isMassProcessing = false,
  massStatus = '',
  onMassStitch,
  onMassCancel,
  // Keyframe Trimmer props
  trimmerClipsCount = 0,
  isTrimmerDownloading = false,
  trimmerStatus = '',
  onTrimmerDownload,
  onTrimmerCancel,
  trimmerStartTime = 0,
  trimmerEndTime = 180,
  // History Ledger props
  historyCount = 0,
  onOpenClearHistoryModal,
  // Settings props
  systemStatus = null,
  onRefreshDiagnostics,
  isRefreshingDiagnostics = false,
  onOpenCookieWizard,
  cookieBrowser = 'Firefox',
  cookieStatus = 'missing',
}) {
  const [isQualityOpen, setIsQualityOpen] = useState(false);
  const [showConsoleStream, setShowConsoleStream] = useState(true);
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

  // Format options
  const qualityOptions = [
    { value: '', label: 'Best Available (Auto Probing)', badge: 'AUTO' },
    ...formats.map((f) => ({
      value: String(f.height),
      label: `${f.resolution || `${f.height}p`} ${f.fps ? `(${f.fps}fps)` : ''} ${f.ext ? `[${f.ext}]` : ''}`.trim(),
      badge: f.height >= 2160 ? '4K' : f.height >= 1440 ? '2K' : f.height >= 1080 ? 'FHD' : `${f.height}p`,
    })),
  ];

  // Extract speed from status string (e.g. "8.45MiB/s")
  const extractedSpeed = status && status.includes('/s')
    ? status.match(/[\d.]+\s*(?:K|M|G)i?B\/s/i)?.[0] || 'Active stream'
    : isDownloading ? 'Streaming...' : '0.00 KiB/s';

  // Extract ETA from status string
  const extractedEta = status && status.toLowerCase().includes('eta')
    ? status.match(/ETA\s*[\d:]+/i)?.[0] || 'In progress'
    : progress > 0 ? `${progress.toFixed(0)}% elapsed` : 'Ready';

  // Extract downloaded size
  const extractedSize = status && status.includes('of')
    ? status.match(/(?:[\d.]+\s*(?:%|(?:K|M|G|T)i?B))\s*of\s*~?\s*[\d.]+\s*(?:K|M|G|T)i?B/i)?.[0] || 'Calculating size'
    : isDownloading ? 'Dynamic buffer' : 'Awaiting job';

  const destinationFolderDisplay = globalOutputDir
    ? globalOutputDir.split(/[/\\]/).pop() || 'Default Downloads'
    : 'System ~/Downloads';

  const validMassClipsCount = massClips.filter((c) => c.url && c.url.trim()).length;

  if (!isOpen) return null;

  return (
    <aside
      className="w-80 sm:w-84 shrink-0 bg-[#0c0c14] border-l border-[#1e1e2a] flex flex-col justify-between select-none z-20 relative custom-scrollbar overflow-y-auto"
      data-purpose="studio-inspector-rail"
      aria-label="Studio Inspector Rail"
    >
      {/* Top Header */}
      <div className="p-4 border-b border-[#1e1e2a] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#7c3aed] animate-pulse" />
          <div>
            <span className="text-xs font-mono font-bold tracking-wider text-[#f4f4f7] block leading-none">
              STUDIO INSPECTOR
            </span>
            <span className="text-[10px] font-mono text-[#a78bfa] block mt-0.5 uppercase">
              {activeTab === 'mass-clip'
                ? 'Multi-Track Sequence'
                : activeTab === 'selective'
                ? 'Keyframe Trimmer'
                : activeTab === 'history'
                ? 'Archive Ledger'
                : activeTab === 'settings'
                ? 'Diagnostics & Auth'
                : 'Direct Stream Pipeline'}
            </span>
          </div>
        </div>

        <Tooltip content="Collapse Inspector (Ctrl+I)" position="left" delay={100}>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#7a7a8c] hover:text-[#f4f4f7] hover:bg-[#ffffff0f] transition cursor-pointer"
            aria-label="Collapse Inspector"
          >
            <PanelRightClose className="w-4 h-4" />
          </button>
        </Tooltip>
      </div>

      {/* Main Body: Context-Aware Inspector Sections */}
      <div className="p-4 space-y-5 flex-1">
        {/* ========================================= */}
        {/* 1. MEDIA WORKBENCH INSPECTOR (`download`) */}
        {/* ========================================= */}
        {activeTab === 'download' && (
          <div className="space-y-4">
            {singleVideoMetadata?.title && (
              <div className="p-2.5 rounded-lg bg-[#12121a] border border-[#7c3aed33] text-[11px] font-mono text-[#ede9fe] flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] shrink-0" />
                <span className="truncate">{singleVideoMetadata.title}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#7a7a8c] font-bold">
                STREAM PROPERTIES
              </span>
              <span className="text-[10px] font-mono text-[#a78bfa]">
                {downloadType === 'mp4' ? 'VIDEO CONTAINER' : 'AUDIO MASTER'}
              </span>
            </div>

            {/* Subframe Segmented Control for Format Toggle */}
            <div
              className="flex items-center p-1 rounded-xl bg-[#08080d] border border-[#1e1e2a] shadow-inner"
              role="group"
              aria-label="Stream Format Toggle"
            >
              <button
                type="button"
                onClick={() => setDownloadType('mp4')}
                disabled={isDownloading}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  downloadType === 'mp4'
                    ? 'bg-[#7c3aed] text-white shadow-md shadow-violet-950/40 font-semibold'
                    : 'text-[#7a7a8c] hover:text-[#f4f4f7]'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>MP4 Video</span>
              </button>

              <button
                type="button"
                onClick={() => setDownloadType('mp3')}
                disabled={isDownloading}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  downloadType === 'mp3'
                    ? 'bg-[#7c3aed] text-white shadow-md shadow-violet-950/40 font-semibold'
                    : 'text-[#7a7a8c] hover:text-[#f4f4f7]'
                }`}
              >
                <Music className="w-3.5 h-3.5" />
                <span>MP3 Master</span>
              </button>
            </div>

            {/* Precision Resolution / Stream Selector Dropdown */}
            {downloadType === 'mp4' ? (
              <div className="space-y-1.5 relative" ref={qualityRef}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#7a7a8c] uppercase">
                    RESOLUTION & FPS
                  </span>
                  {isFetchingFormats && (
                    <span className="text-[10px] font-mono text-[#38bdf8] flex items-center gap-1">
                      <Loader2 className="w-2.5 h-2.5 animate-spin" />
                      Probing...
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => !isDownloading && setIsQualityOpen(!isQualityOpen)}
                  disabled={isDownloading}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#12121a] border border-[#1e1e2a] hover:border-[#2a2a3a] text-xs font-mono text-[#f4f4f7] transition"
                >
                  <span className="truncate">
                    {qualityOptions.find((o) => o.value === selectedQuality)?.label ||
                      'Best Available (Auto Probing)'}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-[#7a7a8c] shrink-0 transition-transform ${
                      isQualityOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isQualityOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 py-1 bg-[#12121a] border border-[#2a2a3a] rounded-lg shadow-2xl z-50 max-h-56 overflow-y-auto custom-scrollbar">
                    {qualityOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setSelectedQuality(opt.value);
                          setIsQualityOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 text-xs font-mono text-left hover:bg-[#1e1e2a] transition text-[#f4f4f7]"
                      >
                        <span className="truncate">{opt.label}</span>
                        {selectedQuality === opt.value && (
                          <Check className="w-3 h-3 text-[#22c55e] shrink-0 ml-2" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-2.5 rounded-lg bg-[#12121a] border border-[#1e1e2a] flex items-center gap-2">
                <FileAudio className="w-4 h-4 text-[#a78bfa] shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs font-mono font-medium text-[#f4f4f7] block">
                    320 kbps Extreme MP3
                  </span>
                  <span className="text-[10px] font-mono text-[#7a7a8c] block">
                    LAME CBR Audio Master
                  </span>
                </div>
              </div>
            )}

            {/* Stream Specs Chip Grid */}
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div className="p-2 rounded bg-[#08080d] border border-[#1e1e2a]">
                <span className="text-[#5c5c6e] block uppercase">CODEC</span>
                <span className="text-[#c4b5fd] font-semibold">
                  {downloadType === 'mp4' ? 'H.264 / AVC1' : 'MP3 / LAME'}
                </span>
              </div>
              <div className="p-2 rounded bg-[#08080d] border border-[#1e1e2a]">
                <span className="text-[#5c5c6e] block uppercase">AUDIO</span>
                <span className="text-[#c4b5fd] font-semibold">
                  {downloadType === 'mp4' ? 'AAC 320k' : '320k Extreme'}
                </span>
              </div>
              <div className="p-2 rounded bg-[#08080d] border border-[#1e1e2a]">
                <span className="text-[#5c5c6e] block uppercase">RATE</span>
                <span className="text-[#c4b5fd] font-semibold">
                  {downloadType === 'mp4' ? '60 FPS Max' : '44.1 kHz'}
                </span>
              </div>
              <div className="p-2 rounded bg-[#08080d] border border-[#1e1e2a]">
                <span className="text-[#5c5c6e] block uppercase">CONTAINER</span>
                <span className="text-[#c4b5fd] font-semibold">
                  {downloadType === 'mp4' ? 'MP4 (Lossless)' : 'MP3 (Audio)'}
                </span>
              </div>
            </div>

            {/* Destination Directory Box */}
            <div
              onClick={onOpenOutputModal}
              className="p-2.5 rounded-lg bg-[#12121a] border border-[#1e1e2a] hover:border-[#2a2a3a] cursor-pointer transition group"
              title={globalOutputDir || 'Default downloads folder'}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono uppercase text-[#7a7a8c] font-bold">
                  DESTINATION DIRECTORY
                </span>
                <span className="text-[10px] font-mono text-[#a78bfa] group-hover:underline">
                  Browse
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FolderOpen className="w-3.5 h-3.5 text-[#a78bfa] shrink-0" />
                <span className="text-xs font-mono text-[#f4f4f7] truncate">
                  {destinationFolderDisplay}
                </span>
              </div>
            </div>

            {/* Telemetry Section */}
            <div className="space-y-3 pt-2 border-t border-[#1e1e2a]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3 h-3 text-[#38bdf8]" />
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#7a7a8c] font-bold">
                    LIVE TELEMETRY
                  </span>
                </div>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                    isDownloading
                      ? 'bg-[#22c55e1a] text-[#86efac] border border-[#22c55e33]'
                      : 'bg-[#1e1e2a] text-[#7a7a8c]'
                  }`}
                >
                  {isDownloading ? 'DOWNLOADING' : 'ENGINE READY'}
                </span>
              </div>

              {/* Telemetry Metric Cards */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-[#08080d] border border-[#1e1e2a] flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#7a7a8c] mb-1">
                    <span className="flex items-center gap-1">
                      <Gauge className="w-3 h-3 text-[#38bdf8]" /> SPEED
                    </span>
                    <Radio className={`w-2.5 h-2.5 ${isDownloading ? 'text-[#22c55e] animate-ping' : 'text-[#5c5c6e]'}`} />
                  </div>
                  <span className="text-xs font-mono font-bold text-[#f4f4f7] truncate">
                    {extractedSpeed}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#08080d] border border-[#1e1e2a] flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#7a7a8c] mb-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#a78bfa]" /> ETA
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#f4f4f7] truncate">
                    {extractedEta}
                  </span>
                  <span className="text-[10px] font-mono text-[#7a7a8c] truncate mt-1.5 block">
                    {extractedSize}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-[#7a7a8c]">TRANSFER PROGRESS</span>
                  <span className="text-[#a78bfa] font-bold">{progress.toFixed(0)}%</span>
                </div>
                <div className="h-2 w-full bg-[#08080d] border border-[#1e1e2a] rounded-full overflow-hidden p-[1px]">
                  <div
                    className="h-full bg-gradient-to-r from-[#7c3aed] to-[#38bdf8] rounded-full transition-all duration-200"
                    style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================= */}
        {/* 2. MULTI-TRACK STITCHER (`mass-clip`)     */}
        {/* ========================================= */}
        {activeTab === 'mass-clip' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#7a7a8c] font-bold">
                SEQUENCE PROPERTIES
              </span>
              <span className="text-[10px] font-mono text-[#a78bfa]">
                BATCH ASSEMBLY
              </span>
            </div>

            <div className="space-y-2">
              <div className="p-2.5 rounded-lg bg-[#12121a] border border-[#1e1e2a]">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#7a7a8c]">QUEUED TRACKS</span>
                  <span className="text-[#c4b5fd] font-bold">{validMassClipsCount} Tracks</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#12121a] border border-[#1e1e2a]">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#7a7a8c]">OUTPUT FORMAT</span>
                  <span className="text-[#c4b5fd] font-bold">Stitched MP4 Video</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#12121a] border border-[#1e1e2a]">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#7a7a8c]">CONCAT ENGINE</span>
                  <span className="text-[#c4b5fd] font-bold">FFmpeg Demuxer</span>
                </div>
              </div>
            </div>

            {/* Destination Directory Box */}
            <div
              onClick={onOpenOutputModal}
              className="p-2.5 rounded-lg bg-[#12121a] border border-[#1e1e2a] hover:border-[#2a2a3a] cursor-pointer transition group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono uppercase text-[#7a7a8c] font-bold">
                  DESTINATION DIRECTORY
                </span>
                <span className="text-[10px] font-mono text-[#a78bfa] group-hover:underline">
                  Browse
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FolderOpen className="w-3.5 h-3.5 text-[#a78bfa] shrink-0" />
                <span className="text-xs font-mono text-[#f4f4f7] truncate">
                  {destinationFolderDisplay}
                </span>
              </div>
            </div>

            {/* Live Stitch Telemetry */}
            <div className="space-y-3 pt-2 border-t border-[#1e1e2a]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Scissors className="w-3 h-3 text-[#38bdf8]" />
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#7a7a8c] font-bold">
                    BATCH TELEMETRY
                  </span>
                </div>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                    isMassProcessing
                      ? 'bg-[#22c55e1a] text-[#86efac] border border-[#22c55e33]'
                      : 'bg-[#1e1e2a] text-[#7a7a8c]'
                  }`}
                >
                  {isMassProcessing ? 'PROCESSING' : 'IDLE'}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#08080d] border border-[#1e1e2a]">
                <span className="text-[10px] font-mono text-[#7a7a8c] block uppercase">ACTIVE STATUS</span>
                <span className="text-xs font-mono text-[#f4f4f7] font-bold block truncate mt-1">
                  {massStatus || (isMassProcessing ? 'Executing batch pipeline...' : 'Sequence engine ready')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================= */}
        {/* 3. TIMELINE TRIMMER (`selective`)         */}
        {/* ========================================= */}
        {activeTab === 'selective' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#7a7a8c] font-bold">
                KEYFRAME TRIMMER
              </span>
              <span className="text-[10px] font-mono text-[#a78bfa]">
                FRAME-ACCURATE
              </span>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-[#12121a] border border-[#1e1e2a]">
                  <span className="text-[#7a7a8c] text-[10px] uppercase block">IN-POINT</span>
                  <span className="text-[#a78bfa] font-bold text-xs">{formatTime(trimmerStartTime)}</span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#12121a] border border-[#1e1e2a]">
                  <span className="text-[#7a7a8c] text-[10px] uppercase block">OUT-POINT</span>
                  <span className="text-[#a78bfa] font-bold text-xs">{formatTime(trimmerEndTime)}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#12121a] border border-[#1e1e2a]">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#7a7a8c]">CLIP DURATION</span>
                  <span className="text-[#22c55e] font-bold">
                    {formatTime(Math.max(0, trimmerEndTime - trimmerStartTime))}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#12121a] border border-[#1e1e2a]">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#7a7a8c]">ACTIVE SEGMENTS</span>
                  <span className="text-[#c4b5fd] font-bold">{trimmerClipsCount} Selected</span>
                </div>
              </div>
            </div>

            {/* Destination Directory Box */}
            <div
              onClick={onOpenOutputModal}
              className="p-2.5 rounded-lg bg-[#12121a] border border-[#1e1e2a] hover:border-[#2a2a3a] cursor-pointer transition group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono uppercase text-[#7a7a8c] font-bold">
                  DESTINATION DIRECTORY
                </span>
                <span className="text-[10px] font-mono text-[#a78bfa] group-hover:underline">
                  Browse
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FolderOpen className="w-3.5 h-3.5 text-[#a78bfa] shrink-0" />
                <span className="text-xs font-mono text-[#f4f4f7] truncate">
                  {destinationFolderDisplay}
                </span>
              </div>
            </div>

            {/* Live Trimmer Telemetry */}
            <div className="space-y-3 pt-2 border-t border-[#1e1e2a]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Film className="w-3 h-3 text-[#38bdf8]" />
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#7a7a8c] font-bold">
                    TRIMMER TELEMETRY
                  </span>
                </div>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                    isTrimmerDownloading
                      ? 'bg-[#22c55e1a] text-[#86efac] border border-[#22c55e33]'
                      : 'bg-[#1e1e2a] text-[#7a7a8c]'
                  }`}
                >
                  {isTrimmerDownloading ? 'TRIMMING' : 'READY'}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#08080d] border border-[#1e1e2a]">
                <span className="text-[10px] font-mono text-[#7a7a8c] block uppercase">STATUS</span>
                <span className="text-xs font-mono text-[#f4f4f7] font-bold block truncate mt-1">
                  {trimmerStatus || (isTrimmerDownloading ? 'Slicing video keyframes...' : 'Trimmer Engine Ready')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================= */}
        {/* 4. HISTORY LEDGER (`history`)             */}
        {/* ========================================= */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#7a7a8c] font-bold">
                ARCHIVE OVERVIEW
              </span>
              <span className="text-[10px] font-mono text-[#a78bfa]">
                RENDER LEDGER
              </span>
            </div>

            <div className="space-y-2">
              <div className="p-2.5 rounded-lg bg-[#12121a] border border-[#1e1e2a]">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#7a7a8c]">TOTAL RECORDS</span>
                  <span className="text-[#f4f4f7] font-bold">{historyCount} Media Files</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#12121a] border border-[#1e1e2a]">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#7a7a8c]">STORAGE SYSTEM</span>
                  <span className="text-[#c4b5fd] font-bold">Local OS Storage</span>
                </div>
              </div>
            </div>

            <div
              onClick={onOpenOutputModal}
              className="p-2.5 rounded-lg bg-[#12121a] border border-[#1e1e2a] hover:border-[#2a2a3a] cursor-pointer transition group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono uppercase text-[#7a7a8c] font-bold">
                  ARCHIVE DESTINATION
                </span>
                <span className="text-[10px] font-mono text-[#a78bfa] group-hover:underline">
                  Browse
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FolderOpen className="w-3.5 h-3.5 text-[#a78bfa] shrink-0" />
                <span className="text-xs font-mono text-[#f4f4f7] truncate">
                  {destinationFolderDisplay}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================= */}
        {/* 5. STUDIO SETTINGS (`settings`)           */}
        {/* ========================================= */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#7a7a8c] font-bold">
                ENGINE DIAGNOSTICS
              </span>
              <span className="text-[10px] font-mono text-[#a78bfa]">
                SYSTEM RUNTIME
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-[#12121a] border border-[#1e1e2a] flex items-center justify-between">
                <span className="text-[#7a7a8c]">yt-dlp Core</span>
                <Badge variant={systemStatus?.backend?.state === 'ONLINE' ? 'success' : 'brand'} size="sm">
                  {systemStatus?.backend?.state || 'ONLINE'}
                </Badge>
              </div>

              <div className="p-2.5 rounded-lg bg-[#12121a] border border-[#1e1e2a] flex items-center justify-between">
                <span className="text-[#7a7a8c]">FFmpeg Engine</span>
                <Badge variant={systemStatus?.ffmpeg?.state === 'ONLINE' ? 'success' : 'brand'} size="sm">
                  {systemStatus?.ffmpeg?.state || 'ONLINE'}
                </Badge>
              </div>

              <div className="p-2.5 rounded-lg bg-[#12121a] border border-[#1e1e2a] flex items-center justify-between">
                <span className="text-[#7a7a8c]">Cookie Authentication</span>
                <Badge variant={cookieStatus === 'active' ? 'success' : cookieStatus === 'stale' ? 'warning' : 'subdued'} size="sm">
                  {cookieBrowser} ({cookieStatus.toUpperCase()})
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Persistent Live Console Stream (Across all views) */}
        <div className="rounded-lg bg-[#08080d] border border-[#1e1e2a] overflow-hidden">
          <button
            type="button"
            onClick={() => setShowConsoleStream(!showConsoleStream)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 bg-[#12121a] text-[10px] font-mono text-[#7a7a8c] hover:text-[#f4f4f7] cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3 h-3 text-[#a78bfa]" />
              LIVE CONSOLE STREAM
            </span>
            <span>{showConsoleStream ? 'Hide' : 'Show'}</span>
          </button>

          {showConsoleStream && (
            <div className="p-2 font-mono text-[10px] text-[#7a7a8c] max-h-20 overflow-y-auto custom-scrollbar select-text leading-tight">
              <p className="text-[#a78bfa]">&gt; [hermanos-core] ready</p>
              {activeTab === 'mass-clip' && massStatus ? (
                <p className="text-[#f4f4f7] truncate">&gt; {massStatus}</p>
              ) : activeTab === 'selective' && trimmerStatus ? (
                <p className="text-[#f4f4f7] truncate">&gt; {trimmerStatus}</p>
              ) : status ? (
                <p className="text-[#f4f4f7] truncate">&gt; {status}</p>
              ) : (
                <p className="text-[#5c5c6e]">&gt; awaiting engine signal</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ========================================= */}
      {/* BOTTOM ACTION DOCK (Primary Forge Button) */}
      {/* ========================================= */}
      <div className="p-4 border-t border-[#1e1e2a] bg-[#0c0c14] space-y-2">
        {/* Media Workbench Tab Action */}
        {activeTab === 'download' && (
          <>
            {isDownloading ? (
              <Button
                variant="destructive"
                size="lg"
                onClick={onCancelClick}
                className="w-full justify-center gap-2 font-mono text-xs sm:text-sm font-bold shadow-lg"
              >
                <span>Cancel Operation</span>
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                onClick={() => {
                  if (playlistEntries.length > 0 && onOpenPlaylistModal) {
                    onOpenPlaylistModal();
                  } else if (onDownload) {
                    onDownload();
                  }
                }}
                disabled={!url.trim() || isFetchingFormats}
                className="w-full justify-center gap-2 font-mono text-xs sm:text-sm font-bold bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white shadow-xl shadow-violet-950/50 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>
                  {playlistEntries.length > 0
                    ? `Select Playlist Videos (${playlistEntries.length})`
                    : downloadType === 'mp3'
                    ? 'Forge Audio Master'
                    : 'Forge Media Stream'}
                </span>
                <kbd className="hidden sm:inline-block ml-1 px-1 py-0.2 rounded bg-black/30 border border-white/20 text-[10px]">
                  ↵
                </kbd>
              </Button>
            )}

            {onConvertLocal && !isDownloading && (
              <button
                type="button"
                onClick={onConvertLocal}
                className="w-full py-1 text-center text-[10px] font-mono text-[#7a7a8c] hover:text-[#c4b5fd] transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <HardDrive className="w-3 h-3 text-[#a78bfa]" />
                <span>Convert Local MP4 file to MP3...</span>
              </button>
            )}
          </>
        )}

        {/* Multi-Track Stitcher Tab Action */}
        {activeTab === 'mass-clip' && (
          <>
            {isMassProcessing ? (
              <Button
                variant="destructive"
                size="lg"
                onClick={onMassCancel}
                className="w-full justify-center gap-2 font-mono text-xs sm:text-sm font-bold shadow-lg"
              >
                <span>Cancel Batch Stitch</span>
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                onClick={onMassStitch}
                disabled={validMassClipsCount === 0}
                className="w-full justify-center gap-2 font-mono text-xs sm:text-sm font-bold bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white shadow-xl shadow-violet-950/50 cursor-pointer"
              >
                <Scissors className="w-4 h-4" />
                <span>Forge Stitched Video ({validMassClipsCount} Tracks)</span>
              </Button>
            )}
          </>
        )}

        {/* Keyframe Trimmer Tab Action */}
        {activeTab === 'selective' && (
          <>
            {isTrimmerDownloading ? (
              <Button
                variant="destructive"
                size="lg"
                onClick={onTrimmerCancel}
                className="w-full justify-center gap-2 font-mono text-xs sm:text-sm font-bold shadow-lg"
              >
                <span>Cancel Trimming</span>
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                onClick={onTrimmerDownload}
                disabled={trimmerClipsCount === 0}
                className="w-full justify-center gap-2 font-mono text-xs sm:text-sm font-bold bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white shadow-xl shadow-violet-950/50 cursor-pointer"
              >
                <Film className="w-4 h-4" />
                <span>Forge Trimmed Clips ({trimmerClipsCount})</span>
              </Button>
            )}
          </>
        )}

        {/* History Ledger Tab Action */}
        {activeTab === 'history' && (
          <Button
            variant="outline"
            size="md"
            onClick={onOpenClearHistoryModal}
            disabled={historyCount === 0}
            className="w-full justify-center gap-2 font-mono text-xs text-[#fca5a5] border-[#ef44444d] hover:bg-[#ef44441a] cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-[#ef4444]" />
            <span>Clear History Archive</span>
          </Button>
        )}

        {/* Settings Tab Action */}
        {activeTab === 'settings' && (
          <div className="space-y-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefreshDiagnostics}
              disabled={isRefreshingDiagnostics}
              className="w-full justify-center gap-2 font-mono text-xs text-[#c4b5fd] border-[#7c3aed4d] hover:bg-[#7c3aed1a] cursor-pointer"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isRefreshingDiagnostics ? 'animate-spin' : ''}`} />
              <span>Refresh Diagnostics</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenCookieWizard}
              className="w-full justify-center gap-2 font-mono text-xs text-[#a78bfa] hover:text-white cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Configure Cookie Wizard</span>
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}

export default InspectorRail;
