import { OctagonX } from 'lucide-react';
import { Dialog, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';

export function CancelConfirmModal({ isOpen, onClose, onConfirm }) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Cancel Active Download?"
      maxWidth="max-w-sm"
    >
      <div className="flex items-start gap-3.5">
        <div className="p-2.5 rounded-lg bg-[var(--status-danger)]/15 text-[var(--status-danger)] shrink-0">
          <OctagonX className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Are you sure you want to stop the active download? Any partially
            downloaded stream files will be cleaned up.
          </p>
        </div>
      </div>

      <DialogFooter className="mt-4 -mx-5 -mb-5 px-5">
        <Button variant="secondary" size="md" onClick={onClose} className="text-xs sm:text-sm font-semibold">
          Keep Downloading
        </Button>
        <Button
          variant="destructive"
          size="md"
          className="text-xs sm:text-sm font-semibold"
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          Yes, Cancel
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

export default CancelConfirmModal;
