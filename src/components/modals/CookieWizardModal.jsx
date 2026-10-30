import { useState } from 'react';
import {
  Cookie,
  Check,
  Download,
  Upload,
  AlertTriangle,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { Dialog, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

export function CookieWizardModal({
  isOpen,
  onClose,
  cookieBrowser,
  setCookieBrowser,
  isSyncingCookies,
  onFirefoxSync,
  onImportCookies,
}) {
  const [step, setStep] = useState(1);
  const [isDragging, setIsDragging] = useState(false);

  const browsers = ['Firefox', 'Chrome', 'Edge', 'Brave', 'Opera'];

  const handleClose = () => {
    setStep(1);
    onClose();
  };

  const handleDropFile = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.txt')) {
      const path = window.electronAPI?.getPathForFile
        ? window.electronAPI.getPathForFile(file)
        : file.path;
      if (path) {
        onImportCookies(path).then(() => setStep(5));
      }
    } else {
      toast.error('Please drop a valid .txt Netscape cookies file.');
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title="Browser Authentication Setup"
      description={`Step ${step} of 5 — Authenticate YouTube session for private and age-restricted media`}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        {/* Step Indicator */}
        <div className="flex items-center gap-1.5 pb-2 border-b border-[var(--border-subdued)]">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step
                  ? 'bg-[var(--accent-primary)]'
                  : 'bg-[var(--surface-hover)]'
              }`}
            />
          ))}
        </div>

        {/* STEP 1: Browser Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="p-3.5 bg-[var(--surface-2)] border border-[var(--border-subdued)] rounded-xl text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              Cookies stay strictly on your local computer (<code className="text-[var(--accent-primary)] font-mono">%AppData%\Hermanos Forge\cookies.txt</code>). They are never transmitted to any external server and are filtered to keep only YouTube and Google session tokens.
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--text-primary)] mb-2.5">
                Which browser do you normally use for YouTube?
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {browsers.map((b) => {
                  const isSelected = cookieBrowser === b;
                  return (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setCookieBrowser(b)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs sm:text-sm font-medium transition-colors text-left ${
                        isSelected
                          ? 'border-[var(--accent-primary)] bg-[var(--accent-muted)] text-[var(--text-primary)]'
                          : 'border-[var(--border-subdued)] bg-[var(--surface-2)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]'
                            : 'border-[var(--border-strong)]'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                      <span>{b}</span>
                      {b === 'Firefox' && (
                        <span className="ml-auto text-xs text-[var(--accent-primary)] font-bold">
                          1-Click
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {cookieBrowser === 'Firefox' && (
              <div className="p-3.5 bg-[var(--status-success)]/10 border border-[var(--status-success)]/20 rounded-xl flex items-center gap-2.5 text-xs sm:text-sm text-[var(--status-success)] font-medium">
                <Check className="w-4 h-4 shrink-0" />
                <span>Firefox cookies can be extracted directly without installing any extension!</span>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Extension Installation */}
        {step === 2 && (
          <div className="space-y-4 text-xs sm:text-sm text-[var(--text-secondary)]">
            <h4 className="font-bold text-base text-[var(--text-primary)]">
              Install Netscape Cookies Extension
            </h4>
            <p className="leading-relaxed">
              Chromium-based browsers (Chrome, Edge, Brave, Opera) encrypt cookie vaults on Windows. To export them safely in open Netscape format, install the lightweight open-source extension below.
            </p>
            <div className="p-5 bg-[var(--surface-2)] border border-[var(--border-subdued)] rounded-xl flex flex-col items-center justify-center gap-3 text-center">
              <Download className="w-7 h-7 text-[var(--accent-primary)]" />
              <div>
                <span className="font-bold text-sm sm:text-base text-[var(--text-primary)] block">
                  Get cookies.txt LOCALLY
                </span>
                <span className="text-xs text-[var(--text-secondary)] mt-0.5 block">
                  Available in the official Chrome Web Store
                </span>
              </div>
              <Button
                variant="primary"
                size="md"
                className="text-xs sm:text-sm font-semibold"
                onClick={() =>
                  window.electronAPI?.openExternal(
                    'https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc'
                  )
                }
              >
                <ExternalLink className="w-4 h-4" />
                Open Extension Store Page
              </Button>
            </div>
            <p className="text-xs text-[var(--text-tertiary)]">
              Edge, Brave, and Opera users: allow extensions from other stores when prompted.
            </p>
          </div>
        )}

        {/* STEP 3: Export Instructions */}
        {step === 3 && (
          <div className="space-y-4 text-xs sm:text-sm text-[var(--text-secondary)]">
            <h4 className="font-bold text-base text-[var(--text-primary)]">
              Export Cookies from YouTube
            </h4>
            <ol className="space-y-2.5 list-decimal list-inside leading-relaxed bg-[var(--surface-2)] p-4 rounded-xl border border-[var(--border-subdued)]">
              <li>
                Navigate to <strong className="text-[var(--text-primary)]">youtube.com</strong> in your browser and confirm you are signed in.
              </li>
              <li>
                Click the <strong className="text-[var(--text-primary)]">Get cookies.txt</strong> icon in your browser extension toolbar.
              </li>
              <li>
                Ensure format is set to <strong className="text-[var(--text-primary)]">Netscape</strong>.
              </li>
              <li>
                Click the main <strong className="text-[var(--text-primary)]">Export</strong> button. This saves a <code className="text-[var(--accent-primary)] font-mono">cookies.txt</code> file to your Downloads folder.
              </li>
            </ol>
            <div className="p-3 bg-[var(--status-warning)]/10 border border-[var(--status-warning)]/20 rounded-xl flex items-start gap-2.5 text-xs text-[var(--status-warning)]">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Do not click &quot;Export All Cookies&quot;. Export only for the active youtube.com tab.</span>
            </div>
          </div>
        )}

        {/* STEP 4: Import File */}
        {step === 4 && (
          <div className="space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDropFile}
              onClick={async () => {
                const res = await onImportCookies(null);
                if (res) setStep(5);
              }}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer flex flex-col items-center justify-center transition-colors ${
                isDragging
                  ? 'border-[var(--accent-primary)] bg-[var(--accent-muted)]'
                  : 'border-[var(--border-strong)] bg-[var(--surface-2)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              {isSyncingCookies ? (
                <Loader2 className="w-8 h-8 text-[var(--accent-primary)] animate-spin mb-2" />
              ) : (
                <Upload
                  className={`w-8 h-8 mb-2 ${
                    isDragging
                      ? 'text-[var(--accent-primary)]'
                      : 'text-[var(--text-secondary)]'
                  }`}
                />
              )}
              <span className="font-bold text-sm text-[var(--text-primary)] block mb-1">
                Drop your cookies.txt file here
              </span>
              <span className="text-xs text-[var(--text-secondary)]">
                or click anywhere inside this box to browse files
              </span>
            </div>

            <div className="text-xs text-[var(--text-tertiary)] flex items-start gap-2 leading-relaxed">
              <Cookie className="w-4 h-4 shrink-0 mt-0.5 text-[var(--accent-primary)]" />
              <span>
                Non-YouTube cookies are automatically stripped during import for privacy. You may safely delete the exported cookies.txt file from Downloads afterwards.
              </span>
            </div>
          </div>
        )}

        {/* STEP 5: Success Confirmation */}
        {step === 5 && (
          <div className="space-y-4 text-center py-4">
            <div className="w-12 h-12 rounded-full bg-[var(--status-success)]/15 text-[var(--status-success)] flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-base font-bold text-[var(--text-primary)]">
                Cookies Synchronized Successfully
              </h4>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
                Hermanos Forge is now authorized to download age-restricted, unlisted, and private media.
              </p>
            </div>
            <div className="p-3.5 bg-[var(--surface-2)] border border-[var(--border-subdued)] rounded-xl text-xs text-[var(--text-tertiary)] text-left leading-relaxed">
              Session tokens remain valid for approximately 2 to 4 weeks depending on your browser. If YouTube returns sign-in barriers in the future, simply re-sync from Settings.
            </div>
          </div>
        )}
      </div>

      <DialogFooter className="mt-4 -mx-5 -mb-5 px-5">
        {step === 1 && (
          <>
            <Button variant="secondary" size="md" onClick={handleClose} className="text-xs sm:text-sm font-semibold">
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              isLoading={isSyncingCookies}
              className="text-xs sm:text-sm font-semibold"
              onClick={async () => {
                if (cookieBrowser === 'Firefox') {
                  const ok = await onFirefoxSync();
                  if (ok) setStep(5);
                } else {
                  setStep(2);
                }
              }}
            >
              {cookieBrowser === 'Firefox' ? 'Sync Firefox Cookies' : 'Proceed to Step 2'}
            </Button>
          </>
        )}

        {step > 1 && step < 5 && (
          <>
            <Button
              variant="secondary"
              size="md"
              disabled={isSyncingCookies}
              className="text-xs sm:text-sm font-semibold"
              onClick={() => setStep((s) => s - 1)}
            >
              Back
            </Button>
            {step < 4 ? (
              <Button variant="primary" size="md" onClick={() => setStep((s) => s + 1)} className="text-xs sm:text-sm font-semibold">
                Next
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                isLoading={isSyncingCookies}
                className="text-xs sm:text-sm font-semibold"
                onClick={async () => {
                  const res = await onImportCookies(null);
                  if (res) setStep(5);
                }}
              >
                Browse File
              </Button>
            )}
          </>
        )}

        {step === 5 && (
          <Button variant="primary" size="md" onClick={handleClose} className="text-xs sm:text-sm font-semibold">
            Finish & Close
          </Button>
        )}
      </DialogFooter>
    </Dialog>
  );
}

export default CookieWizardModal;
