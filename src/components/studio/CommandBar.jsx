import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles,
  ClipboardPaste,
  X,
  Loader2,
  ListVideo,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tooltip } from '@/components/ui/Tooltip';
import toast from 'react-hot-toast';

export function CommandBar({
  url = '',
  setUrl,
  isDownloading = false,
  isInspecting = false,
  urlError = null,
  singleVideoMetadata = null,
  playlistEntries = [],
  onOpenPlaylistModal,
  onDownload,
  activeTab = 'download',
  onOpenCookieWizard,
  onAddTrack,
}) {
  const inputRef = useRef(null);
  const [isPasting, setIsPasting] = useState(false);

  // Global Ctrl+K / Cmd+K listener to focus the command bar from anywhere
  useEffect(() => {
    const handleGlobalKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  const handlePaste = useCallback(async () => {
    try {
      setIsPasting(true);
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        setUrl(text.trim());
        toast.success('Pasted URL from clipboard!');
      } else {
        toast('Clipboard is empty or does not contain text.');
      }
    } catch {
      toast.error('Unable to access clipboard. Check permissions.');
    } finally {
      setIsPasting(false);
    }
  }, [setUrl]);

  const handleClear = () => {
    setUrl('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!url.trim() || isDownloading || isInspecting) return;
      if (activeTab === 'mass-clip' && onAddTrack) {
        onAddTrack(url.trim());
        setUrl('');
        return;
      }
      if (playlistEntries.length > 0 && onOpenPlaylistModal) {
        onOpenPlaylistModal();
        return;
      }
      if (onDownload) {
        onDownload();
      }
    }
  };

  // Derive mode label
  const modeLabel =
    activeTab === 'download'
      ? 'MEDIA WORKBENCH'
      : activeTab === 'mass-clip'
      ? 'MULTI-TRACK STITCHER'
      : activeTab === 'selective'
      ? 'TIMELINE TRIMMER'
      : activeTab === 'history'
      ? 'HISTORY LEDGER'
      : 'STUDIO PREFERENCES';

  const placeholderText =
    activeTab === 'mass-clip'
      ? 'Enter media URL to add track to sequence... (Press Enter ↵ to append)'
      : activeTab === 'selective'
      ? 'Enter media URL to load into keyframe trimmer... (Press Enter ↵)'
      : 'Enter media URL, YouTube link, or press Ctrl+V to paste... (Ctrl+K)';

  const isAuthError =
    urlError &&
    (urlError.toLowerCase().includes('cookie') ||
      urlError.toLowerCase().includes('age-restricted') ||
      urlError.toLowerCase().includes('private') ||
      urlError.toLowerCase().includes('sign in'));

  return (
    <header
      className="shrink-0 border-b border-[#1e1e2a] bg-[#0c0c13]/95 backdrop-blur-md px-6 py-3 flex flex-col gap-2.5 z-10"
      data-purpose="studio-command-bar"
    >
      {/* Top Breadcrumb HUD & URL Stream Detection Status */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2 text-[11px] font-mono tracking-wider">
          <span className="text-[#7a7a8c] font-semibold">STUDIO</span>
          <span className="text-[#3a3a4e]">/</span>
          <span className="text-[#a78bfa] font-bold">{modeLabel}</span>
          <span className="text-[#3a3a4e]">/</span>
          <span className="text-[#f4f4f7] truncate">
            {singleVideoMetadata?.title ? singleVideoMetadata.title : 'GLOBAL COMMAND SPOTLIGHT'}
          </span>
        </div>

        {/* Dynamic Stream Detection Badges */}
        <div className="flex items-center gap-2">
          {isInspecting ? (
            <Badge variant="cyan" size="sm" className="flex items-center gap-1.5 font-mono">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>PROBING STREAM...</span>
            </Badge>
          ) : playlistEntries.length > 0 ? (
            <div className="flex items-center gap-1.5">
              <Badge variant="violet" size="sm" className="flex items-center gap-1.5 font-mono">
                <ListVideo className="w-3 h-3" />
                <span>PLAYLIST: {playlistEntries.length} VIDEOS</span>
              </Badge>
              {onOpenPlaylistModal && (
                <Button
                  variant="outline"
                  size="xs"
                  onClick={onOpenPlaylistModal}
                  className="font-mono text-[10px] text-[#c4b5fd] border-[#7c3aed4d] hover:bg-[#7c3aed1a]"
                >
                  Select Videos
                </Button>
              )}
            </div>
          ) : singleVideoMetadata ? (
            <Badge variant="success" size="sm" className="flex items-center gap-1.5 font-mono">
              <CheckCircle2 className="w-3 h-3" />
              <span>STREAM LOCKED</span>
            </Badge>
          ) : url ? (
            <Badge variant="subdued" size="sm" className="flex items-center gap-1.5 font-mono">
              <Sparkles className="w-3 h-3 text-[#a78bfa]" />
              <span>LINK DETECTED</span>
            </Badge>
          ) : (
            <span className="text-[10px] font-mono text-[#5c5c6e] flex items-center gap-1">
              <kbd className="px-1 py-0.2 rounded bg-[#161622] border border-[#2a2a3a] text-[#a78bfa]">
                Ctrl+K
              </kbd>
              to focus
            </span>
          )}

          {isAuthError && onOpenCookieWizard && (
            <Button
              variant="destructive"
              size="xs"
              onClick={onOpenCookieWizard}
              className="font-mono text-[10px] gap-1 animate-pulse"
            >
              <AlertTriangle className="w-3 h-3" />
              Sync Cookies
            </Button>
          )}
        </div>
      </div>

      {/* Global Command Bar Input Field */}
      <div className="relative flex items-center w-full bg-[#08080c] border border-[#232332] rounded-xl focus-within:border-[#7c3aed] focus-within:ring-2 focus-within:ring-[#7c3aed]/25 transition-all shadow-inner group">
        {/* Leading Glyph */}
        <div className="pl-3.5 pr-2 flex items-center pointer-events-none text-[#a78bfa] group-focus-within:text-[#c4b5fd] transition-colors">
          <Sparkles className="w-4 h-4" />
        </div>

        {/* Input Control */}
        <input
          ref={inputRef}
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isDownloading || isInspecting}
          placeholder={placeholderText}
          className="w-full bg-transparent py-2.5 text-xs sm:text-sm font-mono text-[#f4f4f7] placeholder-[#5c5c6e] focus:outline-none selection:bg-[#7c3aed40]"
          aria-label="Global Media URL Input"
        />

        {/* Trailing Control Stack */}
        <div className="flex items-center gap-1.5 pr-2.5 shrink-0">
          {/* Clear Button */}
          {url && !isDownloading && (
            <Tooltip content="Clear input" position="bottom" delay={200}>
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear URL"
                className="p-1 rounded-md text-[#7a7a8c] hover:text-[#f4f4f7] hover:bg-[#ffffff0f] transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
          )}

          {/* Instant Paste Button */}
          <Tooltip content="Paste from clipboard (Ctrl+V)" position="bottom" delay={200}>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={handlePaste}
              disabled={isDownloading || isPasting}
              className="gap-1 px-2 text-[11px] font-mono text-[#a78bfa] hover:text-[#c4b5fd] hover:bg-[#7c3aed1a] border border-transparent hover:border-[#7c3aed40]"
            >
              <ClipboardPaste className="w-3 h-3" />
              <span>Paste</span>
            </Button>
          </Tooltip>

          {/* Hotkey Indicator */}
          <div className="hidden sm:flex items-center gap-1 pl-1 border-l border-[#1e1e2a]">
            <kbd className="px-1.5 py-0.5 rounded bg-[#14141d] border border-[#2a2a3a] text-[#7a7a8c] font-mono text-[10px] leading-none">
              ↵ Enter
            </kbd>
          </div>
        </div>
      </div>

      {/* URL Error Banner */}
      {urlError && (
        <div className="flex items-center justify-between text-xs font-mono px-3 py-1.5 rounded-lg bg-[#ef444414] border border-[#ef444433] text-[#fca5a5]">
          <div className="flex items-center gap-2 truncate">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-[#ef4444]" />
            <span className="truncate">{urlError}</span>
          </div>
          {isAuthError && onOpenCookieWizard && (
            <button
              type="button"
              onClick={onOpenCookieWizard}
              className="underline hover:text-white shrink-0 ml-2 font-medium flex items-center gap-1"
            >
              Configure Wizard <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </header>
  );
}
