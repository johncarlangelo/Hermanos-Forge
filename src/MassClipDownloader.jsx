import { useState, useRef, useEffect } from 'react';
import { X, Plus, FolderOpen, Scissors, OctagonX, CheckCircle, AlertCircle, Clock, Loader2, XCircle, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const ROW_STATE = {
  IDLE: 'idle',
  QUEUED: 'queued',
  DOWNLOADING: 'downloading',
  DONE: 'done',
  ERROR: 'error',
  CANCELED: 'canceled',
};

function makeClip() {
  return { id: crypto.randomUUID(), url: '', state: ROW_STATE.IDLE, message: '' };
}

const StatusPill = ({ state }) => {
  if (state === ROW_STATE.IDLE) return null;
  
  let icon = null;
  let text = '';
  let colorClasses = '';

  switch (state) {
    case ROW_STATE.QUEUED:
      icon = <Clock size={12} className="mr-1" />;
      text = 'Queued';
      colorClasses = 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
      break;
    case ROW_STATE.DOWNLOADING:
      icon = <Loader2 size={12} className="mr-1 animate-spin" />;
      text = 'Downloading';
      colorClasses = 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      break;
    case ROW_STATE.DONE:
      icon = <CheckCircle size={12} className="mr-1" />;
      text = 'Done';
      colorClasses = 'bg-green-500/20 text-green-400 border border-green-500/30';
      break;
    case ROW_STATE.ERROR:
      icon = <AlertCircle size={12} className="mr-1" />;
      text = 'Error';
      colorClasses = 'bg-red-500/20 text-red-400 border border-red-500/30';
      break;
    case ROW_STATE.CANCELED:
      icon = <XCircle size={12} className="mr-1" />;
      text = 'Canceled';
      colorClasses = 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      break;
  }

  return (
    <div className={`flex items-center px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider ${colorClasses} flex-shrink-0`}>
      {icon}
      {text}
    </div>
  );
};

export default function MassClipDownloader({ onStitchSuccess, globalOutputDir, onRequestGlobalOutput }) {
  const [clips, setClips] = useState(() => {
    try {
      const saved = localStorage.getItem('mass-clips');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map(c => ({
          ...c,
          state: (c.state === 'downloading' || c.state === 'queued') ? 'idle' : c.state
        }));
      }
    } catch (e) {}
    return [makeClip(), makeClip()];
  });

  useEffect(() => {
    localStorage.setItem('mass-clips', JSON.stringify(clips));
  }, [clips]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isMassDownloading, setIsMassDownloading] = useState(false);
  const [isCoolingDown, setIsCoolingDown] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [globalStatus, setGlobalStatus] = useState('');
  const cleanupFnsRef = useRef([]);
  const clipsRef = useRef(clips);

  useEffect(() => {
    clipsRef.current = clips;
  }, [clips]);


  useEffect(() => {
    if (!window.stitchAPI) return;

    const unsubClip = window.stitchAPI.onClipUpdate(({ index, state, message }) => {
      setClips((prev) =>
        prev.map((c, i) => (i === index ? { ...c, state, message: message || '' } : c))
      );
    });

    const unsubStatus = window.stitchAPI.onStatus((msg) => {
      // Don't toast raw logs to prevent flooding
      if (!msg.startsWith('FFMPEG') && !msg.startsWith('FFPROBE') && !msg.startsWith('SHUTIL')) {
        setGlobalStatus(msg);
      }
    });

    const unsubSuccess = window.stitchAPI.onSuccess((finalPath) => {
      setIsProcessing(false);
      setIsMassDownloading(false);
      setIsCoolingDown(true);
      setGlobalStatus('Done! Resetting in 5 seconds...');
      
      toast.success(finalPath.endsWith('.mp4') ? `Stitched video saved: ${finalPath}` : `Clips downloaded to: ${finalPath}`, { style: { borderRadius: '10px', background: '#1E293B', color: '#fff' } });
      
      if (onStitchSuccess) {
        onStitchSuccess(finalPath, clipsRef.current);
      }

      setTimeout(() => {
        setIsCoolingDown(false);
        setGlobalStatus('');
        setClips([makeClip(), makeClip()]);
      }, 5000);
    });

    const unsubError = window.stitchAPI.onError((msg) => {
      setIsProcessing(false);
      setIsMassDownloading(false);
      setGlobalStatus('');
      toast.error(msg, { style: { borderRadius: '10px', background: '#1E293B', color: '#fff' } });
    });

    cleanupFnsRef.current = [unsubClip, unsubStatus, unsubSuccess, unsubError];
    return () => cleanupFnsRef.current.forEach((fn) => fn && fn());
  }, []);

  const addClip = () => setClips((prev) => [...prev, makeClip()]);

  const updateClipUrl = (id, url) =>
    setClips((prev) => prev.map((c) => (c.id === id ? { ...c, url } : c)));

  const clearClip = (id) =>
    setClips((prev) => prev.map((c) => (c.id === id ? { ...c, url: '', state: ROW_STATE.IDLE, message: '' } : c)));

  const clearAll = () => {
    if (isProcessing) return;
    setClips([makeClip(), makeClip()]);
  };

  const startStitching = async (noStitch = false) => {
    const urls = clips.map((c) => c.url.trim()).filter(Boolean);

    if (urls.length === 0) {
      toast.error('Add at least one clip URL first.', { style: { borderRadius: '10px', background: '#1E293B', color: '#fff' } });
      return;
    }
    
    let targetDir = globalOutputDir;
    if (!targetDir && onRequestGlobalOutput) {
      targetDir = await onRequestGlobalOutput();
    }
    if (!targetDir) {
      toast.error('Select an output folder first.', { style: { borderRadius: '10px', background: '#1E293B', color: '#fff' } });
      return;
    }

    setClips((prev) =>
      prev
        .filter((c) => c.url.trim())
        .map((c) => ({ ...c, state: ROW_STATE.QUEUED, message: '' }))
    );
    setIsProcessing(true);
    setIsMassDownloading(noStitch);

    try {
      if (window.stitchAPI) {
        setGlobalStatus('Starting download...');
        await window.stitchAPI.stitchClips(urls, targetDir, noStitch);
      }
    } catch (err) {
      setIsProcessing(false);
      setIsMassDownloading(false);
      setGlobalStatus('');
      toast.error(`Unexpected error: ${err.message}`, { style: { borderRadius: '10px', background: '#1E293B', color: '#fff' } });
    }
  };

  const confirmCancel = async () => {
    setShowCancelModal(false);
    if (window.stitchAPI) {
      await window.stitchAPI.cancelStitch(globalOutputDir);
    }
    setIsProcessing(false);
    setIsMassDownloading(false);
    setGlobalStatus('');
    setClips((prev) =>
      prev.map((c) =>
        c.state === ROW_STATE.DOWNLOADING || c.state === ROW_STATE.QUEUED
          ? { ...c, state: ROW_STATE.CANCELED }
          : c
      )
    );
    toast.error('Stitch process canceled.', { style: { borderRadius: '10px', background: '#1E293B', color: '#fff' }, icon: '🛑' });
  };

  const rowBorderClass = (state) => {
    if (state === ROW_STATE.ERROR) return 'border-red-500';
    if (state === ROW_STATE.CANCELED) return 'border-yellow-500';
    if (state === ROW_STATE.DONE) return 'border-green-500';
    return 'border-border';
  };

  const validClips = clips.filter((c) => c.url.trim());
  const doneClips = validClips.filter((c) => c.state === ROW_STATE.DONE || c.state === ROW_STATE.ERROR);
  const massProgress = validClips.length > 0 ? (doneClips.length / validClips.length) * 100 : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="glass-panel p-6 flex flex-col gap-4 max-h-[50vh] overflow-hidden">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold flex items-center">
            <Scissors className="w-5 h-5 mr-2 text-primary" />
            Clip URLs
          </h2>
          <div className="flex gap-2">
            <button
              onClick={addClip}
              disabled={isProcessing || isCoolingDown}
              className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-md bg-surface hover:bg-surfaceHover border border-border disabled:opacity-50 transition-colors"
            >
              <Plus size={14} /> Add Clip
            </button>
            <button
              onClick={clearAll}
              disabled={isProcessing || isCoolingDown}
              className="text-sm px-3 py-1.5 rounded-md text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
        
        <div className="flex flex-col gap-3 overflow-y-auto pr-2 pb-2">
          {clips.map((clip, idx) => (
            <div key={clip.id} className="flex flex-col gap-1">
              <label className="text-xs font-medium text-textSecondary">Clip {idx + 1}</label>
              <div className={`flex items-center gap-2 border rounded-xl px-3 py-2 bg-background/50 ${rowBorderClass(clip.state)} transition-colors`}>
                <input
                  type="text"
                  value={clip.url}
                  onChange={(e) => updateClipUrl(clip.id, e.target.value)}
                  placeholder="Paste video URL"
                  disabled={isProcessing || isCoolingDown}
                  className="flex-1 bg-transparent outline-none text-base text-textPrimary disabled:opacity-50"
                />
                <StatusPill state={clip.state} />
                <button
                  onClick={() => clearClip(clip.id)}
                  disabled={isProcessing || isCoolingDown}
                  aria-label={`Clear clip ${idx + 1}`}
                  className="text-textSecondary hover:text-textPrimary disabled:opacity-30 p-1 flex-shrink-0"
                >
                  <X size={16} />
                </button>
              </div>
              {clip.state === ROW_STATE.ERROR && (
                <span className="text-xs text-red-400 font-medium pl-1">{clip.message || 'Failed to download'}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          {(globalStatus && (isProcessing || isCoolingDown)) && (
            <div className="text-sm text-primary font-medium text-center animate-pulse">
              {globalStatus}
            </div>
          )}
          <div className="flex gap-4">
            <button
              onClick={() => startStitching(false)}
            disabled={isProcessing || isCoolingDown}
            className="flex-[2] btn-primary h-14 text-lg flex items-center justify-center disabled:opacity-50"
          >
            {isProcessing ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              <>
                <Scissors className="w-5 h-5 mr-2" /> Start Stitching
              </>
            )}
          </button>

          {!isProcessing && (
            <button
              onClick={() => startStitching(true)}
              disabled={isCoolingDown}
              className="flex-[1] bg-surface hover:bg-surfaceHover border border-border text-textPrimary h-14 rounded-lg font-medium transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center"
            >
              Mass Download (No Stitch)
            </button>
          )}

          {isProcessing && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="flex-[1] flex items-center justify-center gap-2 text-lg h-14 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium transition-colors"
            >
              <OctagonX size={20} /> Cancel
            </button>
          )}
          </div>
        </div>
      </div>

      {/* Mass Download Progress Modal */}
      <AnimatePresence>
        {isProcessing && isMassDownloading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-surface/95 border border-border p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-pulse" />
              
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Download className="w-8 h-8 text-primary animate-bounce" />
                </div>
                <h3 className="text-2xl font-bold mb-1">Mass Downloading</h3>
                <p className="text-textSecondary text-sm max-w-[250px] truncate" title={globalStatus || 'Starting...'}>
                  {globalStatus || 'Starting...'}
                </p>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-textSecondary">Progress ({doneClips.length}/{validClips.length})</span>
                  <span className="text-primary font-mono text-lg">{massProgress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-background/50 border border-border/50 rounded-full h-3 overflow-hidden shadow-inner">
                  <motion.div
                    className="bg-gradient-to-r from-primary to-primary/80 h-full rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${massProgress}%` }}
                    transition={{ ease: "easeOut", duration: 0.2 }}
                  />
                </div>
              </div>

              <button
                onClick={() => setShowCancelModal(true)}
                className="w-full flex items-center justify-center gap-2 text-base h-12 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-500 font-medium transition-colors border border-red-600/20"
              >
                <OctagonX size={18} /> Cancel Download
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showCancelModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-[120] p-4">
          <div className="bg-surface/95 border border-border rounded-2xl p-6 w-full max-w-sm flex flex-col gap-5 shadow-2xl">
            <h3 className="text-lg font-bold text-textPrimary">Cancel Process?</h3>
            <p className="text-sm text-textSecondary">
              Are you sure you want to cancel the current download and stitch process? Clips already finished downloading will be kept.
            </p>
            <div className="flex justify-end gap-3 mt-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 rounded-lg bg-background hover:bg-surfaceHover border border-border text-textPrimary font-medium transition-colors"
              >
                Keep Going
              </button>
              <button
                onClick={confirmCancel}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium transition-colors"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
