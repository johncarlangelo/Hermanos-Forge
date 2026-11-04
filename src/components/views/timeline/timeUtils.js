/**
 * Precision time formatting and parsing utilities for Studio Timeline
 */

export const formatTime = (seconds, includeMs = false) => {
  if (isNaN(seconds) || seconds === null || seconds === undefined) {
    return includeMs ? '00:00:00.00' : '00:00:00';
  }
  const positiveSec = Math.max(0, seconds);
  const h = Math.floor(positiveSec / 3600);
  const m = Math.floor((positiveSec % 3600) / 60);
  const s = Math.floor(positiveSec % 60);
  const base = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

  if (includeMs) {
    const ms = Math.floor((positiveSec % 1) * 100);
    return `${base}.${ms.toString().padStart(2, '0')}`;
  }
  return base;
};

export const formatTimeShort = (seconds) => {
  if (isNaN(seconds) || seconds === null || seconds === undefined) return '00:00';
  const positiveSec = Math.max(0, seconds);
  const h = Math.floor(positiveSec / 3600);
  const m = Math.floor((positiveSec % 3600) / 60);
  const s = Math.floor(positiveSec % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const parseTime = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const trimmed = timeStr.trim();

  // Support direct seconds number e.g. "45" or "120.5"
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    return Math.max(0, parseFloat(trimmed));
  }

  const parts = trimmed.split(':');
  if (parts.length === 3) {
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    const s = parseFloat(parts[2]) || 0;
    return Math.max(0, h * 3600 + m * 60 + s);
  }
  if (parts.length === 2) {
    const m = parseInt(parts[0], 10) || 0;
    const s = parseFloat(parts[1]) || 0;
    return Math.max(0, m * 60 + s);
  }
  return 0;
};

export const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

