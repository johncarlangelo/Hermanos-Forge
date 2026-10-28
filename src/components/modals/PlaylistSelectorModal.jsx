import { Check, AlertCircle, Download } from 'lucide-react';
import { Dialog, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export function PlaylistSelectorModal({
  isOpen,
  onClose,
  playlistEntries = [],
  selectedVideos = [],
  setSelectedVideos,
  onConfirmDownload,
  downloadType = 'mp4',
}) {
  const validEntries = playlistEntries.filter(
    (v) => v.title && v.title !== '[Private video]' && v.title !== '[Deleted video]'
  );

  const isAllSelected =
    validEntries.length > 0 && selectedVideos.length === validEntries.length;

  const handleToggleAll = () => {
    if (isAllSelected) {
      setSelectedVideos([]);
    } else {
      setSelectedVideos(validEntries.map((v) => v.id));
    }
  };

  const handleToggleItem = (id) => {
    if (selectedVideos.includes(id)) {
      setSelectedVideos(selectedVideos.filter((vId) => vId !== id));
    } else {
      setSelectedVideos([...selectedVideos, id]);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Playlist Selection"
      description="Choose which videos to queue for sequential batch download."
      maxWidth="max-w-xl"
    >
      <div className="space-y-3">
        {/* Actions bar */}
        <div className="flex items-center justify-between py-1 border-b border-[var(--border-subdued)]">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-[var(--text-primary)] hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={handleToggleAll}
              className="sr-only"
            />
            <div
              className={`w-4 h-4 rounded-[3px] border flex items-center justify-center transition-colors ${
                isAllSelected
                  ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white'
                  : 'border-[var(--border-strong)] bg-[var(--surface-2)]'
              }`}
            >
              {isAllSelected && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
            <span>Select All ({validEntries.length})</span>
          </label>

          <Badge variant="accent" size="sm">
            {selectedVideos.length} of {playlistEntries.length} selected
          </Badge>
        </div>

        {/* Video list */}
        <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1 py-1">
          {playlistEntries.map((video, index) => {
            const isUnavailable =
              !video.title ||
              video.title === '[Private video]' ||
              video.title === '[Deleted video]';
            const isSelected = selectedVideos.includes(video.id);

            return (
              <div
                key={video.id || index}
                onClick={() => !isUnavailable && handleToggleItem(video.id)}
                className={`flex items-center gap-3 p-2.5 rounded-[6px] border transition-colors ${
                  isUnavailable
                    ? 'opacity-40 bg-[var(--surface-2)]/30 border-transparent cursor-not-allowed'
                    : isSelected
                    ? 'bg-[var(--accent-muted)]/50 border-[var(--accent-primary)]/40 cursor-pointer'
                    : 'bg-[var(--surface-2)] border-[var(--border-subdued)] hover:bg-[var(--surface-hover)] cursor-pointer'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-[3px] border flex items-center justify-center shrink-0 transition-colors ${
                    isUnavailable
                      ? 'border-transparent bg-transparent'
                      : isSelected
                      ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white'
                      : 'border-[var(--border-strong)] bg-[var(--surface-1)]'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>

                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <span className="font-mono text-[11px] text-[var(--text-tertiary)] shrink-0 w-5">
                    {index + 1}.
                  </span>
                  <span
                    className={`text-xs truncate ${
                      isUnavailable
                        ? 'line-through text-[var(--text-secondary)]'
                        : 'text-[var(--text-primary)]'
                    }`}
                    title={video.title || 'Untitled Video'}
                  >
                    {video.title || 'Unavailable Video'}
                  </span>
                </div>

                {isUnavailable && (
                  <Badge variant="danger" size="sm" icon={<AlertCircle className="w-3 h-3" />}>
                    Private/Deleted
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <DialogFooter className="mt-4 -mx-5 -mb-5 px-5">
        <Button variant="secondary" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          disabled={selectedVideos.length === 0}
          onClick={() => {
            onConfirmDownload();
            onClose();
          }}
        >
          <Download className="w-3.5 h-3.5" />
          Download Selected ({selectedVideos.length}) as {downloadType.toUpperCase()}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

export default PlaylistSelectorModal;
