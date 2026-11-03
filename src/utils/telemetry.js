/**
 * Pure telemetry utility functions for Hermanos Forge download stream metrics.
 */

/**
 * Format raw byte count into human-readable binary string (KiB, MiB, GiB).
 * @param {number|null|undefined} bytes
 * @param {number} decimals
 * @returns {string}
 */
export function formatBytes(bytes, decimals = 2) {
  if (
    bytes === null ||
    bytes === undefined ||
    typeof bytes !== 'number' ||
    !Number.isFinite(bytes) ||
    bytes < 0
  ) {
    return '--';
  }
  if (bytes === 0) return '0 B';

  const k = 1024;
  const dm = Math.max(0, decimals);
  const sizes = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  let safeI = Math.min(Math.max(0, i), sizes.length - 1);
  if (safeI === 0) {
    const rounded = Math.round(bytes);
    if (rounded >= k && sizes.length > 1) {
      return `1${dm > 0 ? '.' + '0'.repeat(dm) : ''} KiB`;
    }
    return `${rounded} B`;
  }

  let valueNum = bytes / Math.pow(k, safeI);
  if (parseFloat(valueNum.toFixed(dm)) >= k && safeI < sizes.length - 1) {
    safeI++;
    valueNum = bytes / Math.pow(k, safeI);
  }

  const value = valueNum.toFixed(dm);
  return `${value} ${sizes[safeI]}`;
}

/**
 * Format bytes per second into human-readable transfer speed string.
 * @param {number|null|undefined} bytesPerSec
 * @param {number} decimals
 * @returns {string}
 */
export function formatSpeed(bytesPerSec, decimals = 2) {
  if (
    bytesPerSec === null ||
    bytesPerSec === undefined ||
    typeof bytesPerSec !== 'number' ||
    !Number.isFinite(bytesPerSec) ||
    bytesPerSec < 0
  ) {
    return '--';
  }
  if (bytesPerSec === 0) return '0 B/s';
  return `${formatBytes(bytesPerSec, decimals)}/s`;
}

/**
 * Format estimated seconds remaining into HH:MM:SS or MM:SS countdown.
 * @param {number|null|undefined} seconds
 * @returns {string}
 */
export function formatEta(seconds) {
  if (
    seconds === null ||
    seconds === undefined ||
    typeof seconds !== 'number' ||
    !Number.isFinite(seconds) ||
    seconds < 0
  ) {
    return '--:--';
  }
  const totalSecs = Math.round(seconds);
  if (totalSecs === 0) return '00:00';
  if (totalSecs >= 360000) return '> 99h';

  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Resolve current stream phase based on telemetry metrics and engine status.
 * Supported return values: 'Probing' | 'Receiving Stream' | 'FFmpeg Muxing' | 'Complete'
 * @param {object|null|undefined} telemetry
 * @param {string} status
 * @param {boolean} isDownloading
 * @returns {'Probing'|'Receiving Stream'|'FFmpeg Muxing'|'Complete'}
 */
export function getStreamPhase(telemetry, status = '', isDownloading = true) {
  const normStatus = typeof status === 'string' ? status.trim().toLowerCase() : '';

  if (!isDownloading) {
    if (
      normStatus.includes('complete') ||
      normStatus.includes('done') ||
      (telemetry && telemetry.percent >= 100)
    ) {
      return 'Complete';
    }
    return 'Probing';
  }

  // 1. Check if completed
  if (
    normStatus === 'completed!' ||
    normStatus.startsWith('completed') ||
    normStatus === 'done' ||
    normStatus.includes('all selected playlist videos downloaded')
  ) {
    return 'Complete';
  }

  // 2. Check if actively receiving stream packets
  // Active downloading telemetry always overrides an older post-processing status string
  // (e.g., when yt-dlp finishes downloading video, sets status to processing, then starts downloading audio)
  if (
    telemetry &&
    (telemetry.phase === 'downloading' || telemetry.status === 'downloading') &&
    telemetry.percent < 100
  ) {
    return 'Receiving Stream';
  }

  // 3. Check if FFmpeg Muxing / post-processing
  if (
    normStatus.includes('processing') ||
    normStatus.includes('converting') ||
    normStatus.includes('muxing') ||
    normStatus.includes('stitching') ||
    normStatus.includes('transcode') ||
    (telemetry && (telemetry.phase === 'processing' || telemetry.status === 'finished' || telemetry.percent >= 100))
  ) {
    return 'FFmpeg Muxing';
  }

  if (normStatus.includes('downloading')) {
    return 'Receiving Stream';
  }

  // Default fallback for initial probing / metadata analysis
  return 'Probing';
}

/**
 * Return badge variant adhering to Obsidian Forge DESIGN.md token conventions.
 * @param {'Probing'|'Receiving Stream'|'FFmpeg Muxing'|'Complete'} phase
 * @returns {'accent'|'cyan'|'warning'|'success'}
 */
export function getStreamPhaseBadgeVariant(phase) {
  switch (phase) {
    case 'Receiving Stream':
      return 'cyan';
    case 'FFmpeg Muxing':
      return 'warning';
    case 'Complete':
      return 'success';
    case 'Probing':
    default:
      return 'accent';
  }
}

/**
 * Format processed data volume string (e.g., '14.20 MiB of 45.80 MiB' or '14.20 MiB').
 * @param {number|null|undefined} downloaded
 * @param {number|null|undefined} total
 * @param {number} decimals
 * @returns {string}
 */
export function formatVolume(downloaded, total, decimals = 2) {
  if (
    downloaded === null ||
    downloaded === undefined ||
    typeof downloaded !== 'number' ||
    !Number.isFinite(downloaded) ||
    downloaded < 0
  ) {
    return '--';
  }
  const downloadedStr = formatBytes(downloaded, decimals);
  if (
    total !== null &&
    total !== undefined &&
    typeof total === 'number' &&
    Number.isFinite(total) &&
    total > 0
  ) {
    return `${downloadedStr} of ${formatBytes(total, decimals)}`;
  }
  return downloadedStr;
}

/**
 * Generate a concise single-line stream telemetry log summary for clipboard copying.
 * @param {object|null|undefined} telemetry
 * @param {string} status
 * @param {string|null} phase
 * @returns {string}
 */
export function generateTelemetrySummary(telemetry, status = '', phase = null) {
  const currentPhase = phase || getStreamPhase(telemetry, status, true);
  const speedStr = formatSpeed(telemetry?.speed);
  const etaStr = formatEta(telemetry?.eta);
  const volumeStr = formatVolume(telemetry?.downloaded, telemetry?.total);
  const percentStr =
    telemetry?.percent !== null && telemetry?.percent !== undefined
      ? `${Number(telemetry.percent).toFixed(1)}%`
      : '--';

  const parts = [
    `[Hermanos Forge Stream Telemetry]`,
    `Phase: ${currentPhase}`,
    `Status: ${status || 'Processing stream'}`,
    `Speed: ${speedStr}`,
    `ETA: ${etaStr}`,
    `Volume: ${volumeStr}`,
    `Progress: ${percentStr}`,
  ];

  return parts.join(' | ');
}
