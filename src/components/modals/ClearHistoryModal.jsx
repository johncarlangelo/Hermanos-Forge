import { AlertCircle } from 'lucide-react';
import { Dialog, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';

export function ClearHistoryModal({ isOpen, onClose, onConfirm }) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Clear Download History"
      maxWidth="max-w-md"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-[6px] bg-[var(--status-danger)]/15 text-[var(--status-danger)] shrink-0">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Are you sure you want to clear your download history? This will permanently
            remove records for Single Downloads, Selective Clips, and Mass Clips.
          </p>
          <p className="text-[11px] text-[var(--text-tertiary)] mt-2">
            Downloaded files on your disk will NOT be deleted.
          </p>
        </div>
      </div>

      <DialogFooter className="mt-4 -mx-5 -mb-5 px-5">
        <Button variant="secondary" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          Clear History
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

export default ClearHistoryModal;
