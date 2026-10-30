import { FolderOpen } from 'lucide-react';
import { Dialog, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';

export function OutputFolderModal({
  isOpen,
  onClose,
  currentPath,
  onSelectFolder,
}) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Configure Destination Directory"
      description="Select the default folder where downloaded media and converted files are saved."
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        <div className="p-3.5 bg-[var(--surface-2)] border border-[var(--border-subdued)] rounded-xl">
          <span className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">
            Current Destination Path
          </span>
          <p className="font-mono text-xs sm:text-sm text-[var(--text-primary)] break-all select-all">
            {currentPath || 'No destination path configured'}
          </p>
        </div>

        <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
          You can change this location at any time. When downloading playlists, a unique subfolder will be created inside this path.
        </p>
      </div>

      <DialogFooter className="mt-4 -mx-5 -mb-5 px-5">
        <Button variant="secondary" size="md" onClick={onClose} className="text-xs sm:text-sm font-semibold">
          Close
        </Button>
        <Button
          variant="primary"
          size="md"
          className="text-xs sm:text-sm font-semibold"
          onClick={async () => {
            await onSelectFolder();
            onClose();
          }}
        >
          <FolderOpen className="w-4 h-4" />
          Choose New Folder
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

export default OutputFolderModal;
