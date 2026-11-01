import { useState } from 'react';
import {
  Check,
  Download,
  Upload,
  AlertTriangle,
  Loader2,
  ExternalLink,
  ShieldCheck,
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
      title="Browser Authentication Wizard"
      description={`Step ${step} of 5 — Authenticate YouTube session for private and age-restricted media`}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        {/* Step Indicator Progress Bar */}
        <div className="flex items-center gap-1.5 pb-2 border-b border-[#1e1e2a]">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step
                  ? 'bg-[#7c3aed]'
                  : 'bg-[#1e1e2a]'
              }`}
            />
          ))}
        </div>

        {/* STEP 1: Browser Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="p-3.5 bg-[#0b0b10] border border-[#1e1e2a] rounded-xl text-xs sm:text-sm text-[#7a7a8c] leading-relaxed">
              Cookies stay strictly on your local computer (<code className="text-[#a78bfa] font-mono">%AppData%\Hermanos Forge\cookies.txt</code>). They are never transmitted externally and are filtered to keep only YouTube and Google session tokens.
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#9a9aac] mb-2.5 font-mono">
                WHICH BROWSER DO YOU REGULARLY USE FOR YOUTUBE?
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {browsers.map((b) => {
                  const isSelected = cookieBrowser === b;
                  return (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setCookieBrowser(b)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs sm:text-sm font-medium transition text-left cursor-pointer ${
                        isSelected
                          ? 'border-[#7c3aed] bg-[#7c3aed1f] text-[#ede9fe] shadow-sm'
                          : 'border-[#2a2a3a] bg-[#0b0b10] text-[#b4b4c2] hover:bg-[#14141d] hover:text-[#f4f4f7]'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'border-[#7c3aed] bg-[#7c3aed]'
                            : 'border-[#3a3a4e]'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                      <span>{b}</span>
                      {b === 'Firefox' && (
                        <span className="ml-auto text-[10px] text-[#a78bfa] font-mono font-bold bg-[#7c3aed26] px-1.5 py-0.2 rounded">
                          Direct
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {cookieBrowser === 'Firefox' && (
              <div className="p-3 bg-[#22c55e14] border border-[#22c55e33] rounded-xl flex items-center gap-2.5 text-xs text-[#86efac] font-medium">
                <Check className="w-4 h-4 shrink-0" />
                <span>Firefox cookies can be extracted directly without installing any browser extensions!</span>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Extension Installation */}
        {step === 2 && (
          <div className="space-y-4 text-xs sm:text-sm text-[#b4b4c2]">
            <h4 className="font-bold text-base text-[#f4f4f7] font-heading">
              Install Netscape Cookies Extension
            </h4>
            <p className="leading-relaxed">
              Chromium-based browsers (Chrome, Edge, Brave, Opera) encrypt cookie databases on Windows. To export them safely in standard Netscape format, install the lightweight open-source extension below.
            </p>
            <div className="p-5 bg-[#0b0b10] border border-[#1e1e2a] rounded-xl flex flex-col items-center justify-center gap-3 text-center shadow-inner">
              <Download className="w-7 h-7 text-[#a78bfa]" />
              <div>
                <span className="font-bold text-sm sm:text-base text-[#f4f4f7] block">
                  Get cookies.txt LOCALLY
                </span>
                <span className="text-xs text-[#7a7a8c] mt-0.5 block font-mono">
                  Official Chrome Web Store extension
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
            <p className="text-xs text-[#7a7a8c] font-mono">
              Note: Edge, Brave, and Opera users should click &quot;Allow extensions from other stores&quot; when prompted.
            </p>
          </div>
        )}

        {/* STEP 3: Export Instructions */}
        {step === 3 && (
          <div className="space-y-4 text-xs sm:text-sm text-[#b4b4c2]">
            <h4 className="font-bold text-base text-[#f4f4f7] font-heading">
              Export Cookies from YouTube
            </h4>
            <ol className="space-y-2.5 list-decimal list-inside leading-relaxed bg-[#0b0b10] p-4 rounded-xl border border-[#1e1e2a] shadow-inner">
              <li>
                Navigate to <strong className="text-[#f4f4f7]">youtube.com</strong> in your browser and confirm you are signed in.
              </li>
              <li>
                Click the <strong className="text-[#f4f4f7]">Get cookies.txt</strong> icon in your browser extension toolbar.
              </li>
              <li>
                Ensure format is set to <strong className="text-[#f4f4f7]">Netscape</strong>.
              </li>
              <li>
                Click the main <strong className="text-[#f4f4f7]">Export</strong> button. This saves a <code className="text-[#a78bfa] font-mono">cookies.txt</code> file to your Downloads folder.
              </li>
            </ol>
            <div className="p-3 bg-[#fef08a14] border border-[#facc1533] rounded-xl flex items-start gap-2.5 text-xs text-[#fde047]">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#facc15]" />
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
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer flex flex-col items-center justify-center transition-all ${
                isDragging
                  ? 'border-[#7c3aed] bg-[#7c3aed1a]'
                  : 'border-[#2a2a3a] bg-[#0b0b10] hover:bg-[#12121a] hover:border-[#3a3a4e]'
              }`}
            >
              {isSyncingCookies ? (
                <Loader2 className="w-8 h-8 text-[#a78bfa] animate-spin mb-2" />
              ) : (
                <Upload
                  className={`w-8 h-8 mb-2 ${
                    isDragging
                      ? 'text-[#a78bfa]'
                      : 'text-[#7a7a8c]'
                  }`}
                />
              )}
              <span className="font-bold text-sm text-[#f4f4f7] block mb-1">
                Drop your cookies.txt file here
              </span>
              <span className="text-xs text-[#7a7a8c]">
                or click anywhere inside this box to browse local files
              </span>
            </div>

            <div className="text-xs text-[#7a7a8c] flex items-start gap-2 leading-relaxed">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-[#22c55e]" />
              <span>
                Non-YouTube cookies are automatically stripped during import for privacy. You may safely delete the exported cookies.txt file from Downloads afterwards.
              </span>
            </div>
          </div>
        )}

        {/* STEP 5: Success Confirmation */}
        {step === 5 && (
          <div className="space-y-4 text-center py-4">
            <div className="w-12 h-12 rounded-full bg-[#22c55e14] border border-[#22c55e33] text-[#86efac] flex items-center justify-center mx-auto shadow-sm">
              <Check className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-base font-bold text-[#f4f4f7] font-heading">
                Cookies Synchronized Successfully
              </h4>
              <p className="text-xs sm:text-sm text-[#7a7a8c] mt-1">
                Hermanos Forge is now authorized to download age-restricted, unlisted, and private media.
              </p>
            </div>
            <div className="p-3.5 bg-[#0b0b10] border border-[#1e1e2a] rounded-xl text-xs text-[#7a7a8c] text-left leading-relaxed font-mono">
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
            Finish &amp; Close
          </Button>
        )}
      </DialogFooter>
    </Dialog>
  );
}

export default CookieWizardModal;
