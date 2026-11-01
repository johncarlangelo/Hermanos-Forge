import { useState, useMemo } from 'react';
import {
  Trash2,
  FolderOpen,
  Copy,
  Video,
  Music,
  Scissors,
  Film,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
  HardDrive,
  Clock,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tabs } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import toast from 'react-hot-toast';

export function HistoryView({
  history = [],
  onDeleteHistoryItem,
  onOpenClearModal,
}) {
  const [activeSubTab, setActiveSubTab] = useState('all'); // 'all', 'single', 'selective', 'stitch'
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const singleCount = history.filter((h) => h.type === 'mp3' || h.type === 'mp4').length;
  const selectiveCount = history.filter((h) => h.type === 'clip').length;
  const stitchCount = history.filter((h) => h.type === 'stitch').length;

  const subTabs = [
    {
      id: 'all',
      label: 'All Archive',
      icon: <Layers className="w-3.5 h-3.5" />,
      badge: history.length,
    },
    {
      id: 'single',
      label: 'Single Media',
      icon: <Video className="w-3.5 h-3.5" />,
      badge: singleCount,
    },
    {
      id: 'selective',
      label: 'Selective Clips',
      icon: <Film className="w-3.5 h-3.5" />,
      badge: selectiveCount,
    },
    {
      id: 'stitch',
      label: 'Mass Compilations',
      icon: <Scissors className="w-3.5 h-3.5" />,
      badge: stitchCount,
    },
  ];

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      // Type match
      let matchesType = true;
      if (activeSubTab === 'single') matchesType = item.type === 'mp3' || item.type === 'mp4';
      else if (activeSubTab === 'selective') matchesType = item.type === 'clip';
      else if (activeSubTab === 'stitch') matchesType = item.type === 'stitch';

      if (!matchesType) return false;

      // Search match
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const filenameMatch = item.filename?.toLowerCase().includes(q);
      const urlMatch = item.url?.toLowerCase().includes(q);
      const pathMatch = item.filepath?.toLowerCase().includes(q);
      return filenameMatch || urlMatch || pathMatch;
    });
  }, [history, activeSubTab, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedItems = filteredHistory.slice(
    (safePage - 1) * itemsPerPage,
    safePage * itemsPerPage
  );

  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(url);
    toast.success('Media URL copied to clipboard!');
  };

  const handleOpenLocation = (filePath) => {
    if (window.electronAPI && window.electronAPI.openFileLocation && filePath) {
      window.electronAPI.openFileLocation(filePath);
    } else {
      toast.error('Could not locate file on disk.');
    }
  };

  const getItemIcon = (type) => {
    switch (type) {
      case 'mp4':
        return <Video className="w-4 h-4 text-[#8b5cf6]" />;
      case 'mp3':
        return <Music className="w-4 h-4 text-[#a78bfa]" />;
      case 'clip':
        return <Film className="w-4 h-4 text-[#38bdf8]" />;
      case 'stitch':
        return <Scissors className="w-4 h-4 text-[#22c55e]" />;
      default:
        return <Video className="w-4 h-4 text-[#d4d4de]" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full pb-8">
      {/* Studio Header HUD */}
      <header className="flex w-full items-start justify-between gap-4">
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-center gap-2 text-xs font-mono text-[#7a7a8c]">
            <span>STUDIO</span>
            <span>&gt;</span>
            <span className="text-[#a78bfa]">ARCHIVE</span>
            <span>&gt;</span>
            <span className="text-[#f4f4f7]">DOWNLOAD LEDGER</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#f4f4f7] font-heading">
            Media Download Ledger
          </h1>
          <p className="text-xs sm:text-sm text-[#7a7a8c]">
            Review completed downloads, open local file paths in Explorer, and manage historic media records.
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

      {/* Storage & Archive Summary Card */}
      <section className="p-4 rounded-xl border border-[#1e1e2a] bg-[#12121a] shadow-lg surface-panel flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-[#7c3aed1a] border border-[#7c3aed33] text-[#a78bfa] shrink-0">
            <HardDrive className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#f4f4f7] font-heading">
                Disk Storage Archive
              </span>
              <span className="font-mono text-[10px] text-[#22c55e] bg-[#22c55e14] px-1.5 py-0.2 rounded border border-[#22c55e33]">
                INDEXED
              </span>
            </div>
            <p className="text-xs text-[#7a7a8c] mt-0.5">
              {history.length} completed items saved across local directories.
            </p>
          </div>
        </div>

        {history.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenClearModal}
            className="text-[#ef4444] hover:bg-[#ef44441a] text-xs font-bold shrink-0 self-end sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Archive</span>
          </Button>
        )}
      </section>

      {/* Main Archive Ledger Panel */}
      <section className="flex w-full flex-col items-start gap-5 rounded-2xl border border-[#1e1e2a] bg-[#12121a] p-6 shadow-xl surface-panel">
        {/* Subtabs and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 w-full">
          <div className="overflow-x-auto pb-1 sm:pb-0">
            <Tabs
              tabs={subTabs}
              activeTab={activeSubTab}
              onChange={(tab) => {
                setActiveSubTab(tab);
                setCurrentPage(1);
              }}
              size="md"
              layoutId="history-subtab-pill"
            />
          </div>

          <div className="w-full sm:w-64 shrink-0">
            <Input
              type="text"
              size="md"
              placeholder="Search by title, url, path..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              leftIcon={<Search className="w-4 h-4 text-[#7a7a8c]" />}
              rightIcon={
                searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    className="p-1 text-[#7a7a8c] hover:text-[#f4f4f7] transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : null
              }
              className="text-xs sm:text-sm bg-[#0b0b10] border-[#2a2a3a]"
            />
          </div>
        </div>

        {/* History Records List */}
        <div className="space-y-3 w-full min-h-[300px]">
          {filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-14 text-center border border-dashed border-[#2a2a3a] rounded-xl bg-[#0b0b10]/40">
              <FolderOpen className="w-10 h-10 text-[#5c5c6e] mb-2.5 opacity-60" />
              <span className="text-sm font-bold text-[#d4d4de] font-heading">
                No Archive Records Found
              </span>
              <p className="text-xs text-[#7a7a8c] mt-1.5 max-w-sm leading-relaxed">
                {searchQuery
                  ? `No media records match "${searchQuery}". Try modifying your search term.`
                  : `No completed media downloads recorded in this section yet.`}
              </p>
            </div>
          ) : (
            paginatedItems.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-[#0b0b10] border border-[#1e1e2a] hover:border-[#2a2a3a] rounded-xl transition duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="p-2.5 rounded-xl bg-[#12121a] border border-[#2a2a3a] shrink-0 mt-0.5 shadow-sm">
                    {getItemIcon(item.type)}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span
                        className="text-sm font-bold text-[#f4f4f7] truncate block"
                        title={item.filename}
                      >
                        {item.filename || 'Downloaded Media File'}
                      </span>
                      <Badge variant="brand" size="sm" className="uppercase font-mono text-[10px] px-2 py-0.2 font-bold">
                        {item.type}
                      </Badge>
                    </div>

                    {item.durationTimestamp && (
                      <span className="text-xs font-mono text-[#a78bfa] font-semibold block">
                        Trim Range: {item.durationTimestamp}
                      </span>
                    )}

                    <span
                      className="text-xs text-[#7a7a8c] truncate block font-mono cursor-pointer hover:text-[#a78bfa] transition"
                      onClick={() => handleCopyUrl(item.url)}
                      title="Click to copy media URL"
                    >
                      {item.url}
                    </span>

                    <div className="flex items-center gap-2 text-[11px] text-[#5c5c6e] font-mono">
                      <Clock className="w-3 h-3 text-[#5c5c6e]" />
                      <span>{item.date}</span>
                      {item.filepath && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[320px]" title={item.filepath}>
                            {item.filepath}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <Button
                    variant="outline"
                    size="iconSm"
                    onClick={() => handleCopyUrl(item.url)}
                    title="Copy Media URL"
                    aria-label="Copy Media URL"
                    className="border-[#2a2a3a] text-[#b4b4c2] hover:text-[#f4f4f7]"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                  {item.filepath && (
                    <Button
                      variant="outline"
                      size="iconSm"
                      onClick={() => handleOpenLocation(item.filepath)}
                      title="Reveal in File Explorer"
                      aria-label="Reveal in File Explorer"
                      className="border-[#2a2a3a] text-[#b4b4c2] hover:text-[#f4f4f7]"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="iconSm"
                    onClick={() => onDeleteHistoryItem(item.id)}
                    title="Remove record from archive"
                    aria-label="Delete history record"
                    className="text-[#7a7a8c] hover:text-[#ef4444] hover:bg-[#ef44441a]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination Navigation */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-3.5 border-t border-[#1e1e2a] w-full">
            <span className="text-xs text-[#7a7a8c] font-mono">
              Showing {(safePage - 1) * itemsPerPage + 1}–
              {Math.min(safePage * itemsPerPage, filteredHistory.length)} of{' '}
              {filteredHistory.length} records
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="iconSm"
                disabled={safePage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs font-mono px-2.5 text-[#f4f4f7] font-bold">
                {safePage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="iconSm"
                disabled={safePage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default HistoryView;
