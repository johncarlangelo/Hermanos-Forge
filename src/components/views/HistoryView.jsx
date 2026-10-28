import { useState, useMemo } from 'react';
import {
  Clock,
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
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
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
  const [activeSubTab, setActiveSubTab] = useState('single'); // 'single', 'selective', 'stitch'
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const subTabs = [
    {
      id: 'single',
      label: 'Single Media',
      icon: <Video className="w-3.5 h-3.5" />,
      badge: history.filter((h) => h.type === 'mp3' || h.type === 'mp4').length,
    },
    {
      id: 'selective',
      label: 'Selective Duration',
      icon: <Film className="w-3.5 h-3.5" />,
      badge: history.filter((h) => h.type === 'clip').length,
    },
    {
      id: 'stitch',
      label: 'Mass Clips',
      icon: <Scissors className="w-3.5 h-3.5" />,
      badge: history.filter((h) => h.type === 'stitch').length,
    },
  ];

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      // Type match
      let matchesType = false;
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
        return <Video className="w-4 h-4 text-[var(--accent-primary)]" />;
      case 'mp3':
        return <Music className="w-4 h-4 text-purple-400" />;
      case 'clip':
        return <Film className="w-4 h-4 text-blue-400" />;
      case 'stitch':
        return <Scissors className="w-4 h-4 text-emerald-400" />;
      default:
        return <Video className="w-4 h-4 text-[var(--text-secondary)]" />;
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto w-full pb-6">
      <Card className="surface-panel">
        <CardContent className="space-y-4 p-4 sm:p-5">
          {/* Header */}
          <div className="space-y-2 pb-3 border-b border-[var(--border-subdued)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-[8px] bg-gradient-to-br from-teal-500/20 to-teal-500/5 border border-teal-500/30 flex items-center justify-center text-[var(--accent-primary)] shadow-sm shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <h2 className="text-sm sm:text-base font-bold text-[var(--text-primary)] tracking-tight">
                    Download History & Archive
                  </h2>
                  <Badge variant="default" size="sm">
                    {history.length} {history.length === 1 ? 'Record' : 'Records'}
                  </Badge>
                </div>
              </div>

              {history.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onOpenClearModal}
                  className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 font-medium shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Archive</span>
                </Button>
              )}
            </div>

            <p className="text-xs text-[var(--text-secondary)]">
              Review previously processed downloads, open local file destinations, and manage logs.
            </p>
          </div>

          {/* Subtabs and Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="overflow-x-auto pb-1 sm:pb-0">
              <Tabs
                tabs={subTabs}
                activeTab={activeSubTab}
                onChange={(tab) => {
                  setActiveSubTab(tab);
                  setCurrentPage(1);
                }}
                size="sm"
                layoutId="history-subtab-pill"
              />
            </div>

            <div className="w-full sm:w-60 shrink-0">
              <Input
                type="text"
                size="md"
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                leftIcon={<Search className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />}
                rightIcon={
                  searchQuery ? (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear search"
                      className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : null
                }
              />
            </div>
          </div>

          {/* History List */}
          <div className="space-y-2 min-h-[300px]">
            {filteredHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-[var(--border-subdued)] rounded-[8px]">
                <FolderOpen className="w-10 h-10 text-[var(--text-tertiary)] opacity-60 mb-2" />
                <span className="text-xs font-semibold text-[var(--text-secondary)]">
                  No records found
                </span>
                <p className="text-[11px] text-[var(--text-tertiary)] mt-1 max-w-xs">
                  {searchQuery
                    ? `No downloads match "${searchQuery}". Try a different keyword.`
                    : `No completed downloads recorded in this section yet.`}
                </p>
              </div>
            ) : (
              paginatedItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-[var(--surface-2)]/70 border border-[var(--border-subdued)] rounded-[8px] hover:bg-[var(--surface-hover)] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2 rounded-[6px] bg-[var(--surface-1)] border border-[var(--border-subdued)] shrink-0 mt-0.5">
                      {getItemIcon(item.type)}
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs font-semibold text-[var(--text-primary)] truncate block"
                          title={item.filename}
                        >
                          {item.filename || 'Downloaded Media'}
                        </span>
                        <Badge variant="default" size="sm" className="uppercase font-mono text-[9px]">
                          {item.type}
                        </Badge>
                      </div>

                      {item.durationTimestamp && (
                        <span className="text-[11px] font-mono text-[var(--accent-primary)] block">
                          Cut Range: {item.durationTimestamp}
                        </span>
                      )}

                      <span
                        className="text-[11px] text-[var(--text-secondary)] truncate block font-mono cursor-pointer hover:text-[var(--accent-primary)] transition-colors"
                        onClick={() => handleCopyUrl(item.url)}
                        title="Click to copy URL"
                      >
                        {item.url}
                      </span>

                      <div className="flex items-center gap-2 text-[10px] text-[var(--text-tertiary)] font-mono">
                        <span>{item.date}</span>
                        {item.filepath && (
                          <>
                            <span className="opacity-40">•</span>
                            <span className="truncate max-w-[280px]" title={item.filepath}>
                              {item.filepath}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    <Button
                      variant="outline"
                      size="iconSm"
                      onClick={() => handleCopyUrl(item.url)}
                      title="Copy URL"
                      aria-label="Copy URL"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    {item.filepath && (
                      <Button
                        variant="outline"
                        size="iconSm"
                        onClick={() => handleOpenLocation(item.filepath)}
                        title="Show in File Explorer"
                        aria-label="Open in File Explorer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="iconSm"
                      onClick={() => onDeleteHistoryItem(item.id)}
                      title="Remove record from history"
                      aria-label="Delete history record"
                      className="text-[var(--text-secondary)] hover:text-[var(--status-danger)] hover:bg-[var(--status-danger)]/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subdued)]">
              <span className="text-[11px] text-[var(--text-secondary)] font-mono">
                Showing {(safePage - 1) * itemsPerPage + 1}–
                {Math.min(safePage * itemsPerPage, filteredHistory.length)} of{' '}
                {filteredHistory.length} items
              </span>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="iconSm"
                  disabled={safePage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <span className="text-xs font-mono px-2 text-[var(--text-primary)]">
                  {safePage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="iconSm"
                  disabled={safePage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  aria-label="Next page"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default HistoryView;
