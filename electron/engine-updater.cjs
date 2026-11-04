/**
 * Hermanos Forge — Engine Updater Helper
 * Handles standalone yt-dlp binary resolution, GitHub release version probing,
 * atomic binary replacement, and fail-safe background updates.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { Readable } = require('stream');

/**
 * Normalizes a version tag into a clean dotted string (e.g. 'v2026.10.26' -> '2026.10.26').
 */
function normalizeVersion(ver) {
  if (!ver || typeof ver !== 'string') return '';
  return ver.trim().split(/[\r\n]+/)[0].replace(/^v/i, '').trim();
}

/**
 * Parses dotted version string into numeric segments.
 */
function parseVersionSegments(ver) {
  const normalized = normalizeVersion(ver);
  if (!normalized) return [];
  return normalized.split('.').map((part) => {
    const num = parseInt(part, 10);
    return isNaN(num) ? 0 : num;
  });
}

/**
 * Compares two version strings.
 * Returns:
 *   1 if v2 > v1 (update available)
 *   0 if v1 === v2 (up to date)
 *  -1 if v2 < v1 (v1 is newer)
 */
function compareVersions(v1, v2) {
  const hasV1 = Boolean(normalizeVersion(v1));
  const hasV2 = Boolean(normalizeVersion(v2));

  if (!hasV1 && !hasV2) return 0;
  if (!hasV1 && hasV2) return 1;
  if (hasV1 && !hasV2) return -1;

  const seg1 = parseVersionSegments(v1);
  const seg2 = parseVersionSegments(v2);
  const maxLen = Math.max(seg1.length, seg2.length);

  for (let i = 0; i < maxLen; i++) {
    const n1 = seg1[i] !== undefined ? seg1[i] : 0;
    const n2 = seg2[i] !== undefined ? seg2[i] : 0;
    if (n2 > n1) return 1;
    if (n2 < n1) return -1;
  }
  return 0;
}

/**
 * Resolves standard target binary path inside AppData (%AppData%\Hermanos Forge\bin\yt-dlp.exe).
 */
function getTargetBinaryPath(appDataPath) {
  if (!appDataPath) {
    const appdata = process.env.APPDATA || '';
    return path.join(appdata, 'Hermanos Forge', 'bin', 'yt-dlp.exe');
  }
  return path.join(appDataPath, 'bin', 'yt-dlp.exe');
}

/**
 * Checks if writable AppData standalone binary exists and is accessible.
 */
function resolveYtdlpBinary(appDataPath) {
  const binPath = getTargetBinaryPath(appDataPath);
  try {
    if (fs.existsSync(binPath)) {
      const stats = fs.statSync(binPath);
      if (stats.isFile() && stats.size > 1000) {
        fs.accessSync(binPath, fs.constants.R_OK);
        return binPath;
      }
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Probes version of an executable by executing it with `--version`.
 */
function getExecutableVersion(binPath) {
  return new Promise((resolve) => {
    if (!binPath || !fs.existsSync(binPath)) {
      return resolve(null);
    }
    let resolved = false;
    try {
      const child = spawn(binPath, ['--version'], {
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stdout = '';
      child.stdout.on('data', (d) => {
        stdout += d.toString();
      });

      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          try {
            child.kill();
          } catch { }
          resolve(null);
        }
      }, 3500);

      child.on('close', (code) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          if (code === 0 && stdout.trim()) {
            resolve(normalizeVersion(stdout.trim()));
          } else {
            resolve(null);
          }
        }
      });

      child.on('error', () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          resolve(null);
        }
      });
    } catch {
      resolve(null);
    }
  });
}

/**
 * Atomically replaces a file at destPath with the file at sourcePath.
 * Safe for Windows locks by performing backup swap or copy fallback.
 */
function atomicReplaceFile(sourcePath, destPath) {
  const destDir = path.dirname(destPath);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // Attempt to clean up any past .old.* backup files in destDir
  try {
    const files = fs.readdirSync(destDir);
    const baseName = path.basename(destPath);
    for (const f of files) {
      if (f.startsWith(`${baseName}.old.`)) {
        try {
          fs.unlinkSync(path.join(destDir, f));
        } catch { }
      }
    }
  } catch { }

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source file does not exist: ${sourcePath}`);
  }

  if (!fs.existsSync(destPath)) {
    fs.renameSync(sourcePath, destPath);
    return true;
  }

  const oldBackupPath = `${destPath}.old.${Date.now()}`;
  try {
    fs.renameSync(destPath, oldBackupPath);
    fs.renameSync(sourcePath, destPath);
    try {
      fs.unlinkSync(oldBackupPath);
    } catch { }
    return true;
  } catch (err) {
    // Fallback: copy and unlink if cross-device or permission hiccup
    try {
      fs.copyFileSync(sourcePath, destPath);
      try {
        fs.unlinkSync(sourcePath);
      } catch { }
      if (fs.existsSync(oldBackupPath)) {
        try {
          fs.unlinkSync(oldBackupPath);
        } catch { }
      }
      return true;
    } catch (fallbackErr) {
      if (!fs.existsSync(destPath) && fs.existsSync(oldBackupPath)) {
        try {
          fs.renameSync(oldBackupPath, destPath);
        } catch { }
      }
      throw new Error(`Atomic replacement failed: ${err.message}; Fallback: ${fallbackErr.message}`);
    }
  }
}

/**
 * Probes GitHub releases for the latest yt-dlp release with a strict timeout.
 */
async function fetchLatestRelease(timeoutMs = 2500, apiUrl = 'https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest') {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(apiUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'HermanosForge',
        Accept: 'application/vnd.github.v3+json',
      },
    });

    clearTimeout(timer);

    if (!res.ok) {
      return { success: false, error: `GitHub API error (HTTP ${res.status})` };
    }

    const data = await res.json();
    const tag = data.tag_name || '';
    const version = normalizeVersion(tag);

    const asset = (data.assets || []).find((a) => a.name && a.name.toLowerCase() === 'yt-dlp.exe');
    if (!asset || !asset.browser_download_url) {
      return { success: false, error: 'yt-dlp.exe asset missing from release' };
    }

    return {
      success: true,
      tag,
      version,
      downloadUrl: asset.browser_download_url,
      size: asset.size || 0,
      publishedAt: data.published_at,
    };
  } catch (err) {
    clearTimeout(timer);
    return {
      success: false,
      error: err.name === 'AbortError' ? 'Network timeout fetching release' : err.message,
    };
  }
}

/**
 * Downloads binary stream to temporary file and atomically moves to targetPath.
 */
async function downloadBinary(downloadUrl, targetPath, onProgress, timeoutMs = 90000) {
  const targetDir = path.dirname(targetPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const tempPath = `${targetPath}.temp.${Date.now()}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(downloadUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'HermanosForge',
      },
      redirect: 'follow',
    });

    if (!res.ok) {
      throw new Error(`Download failed with HTTP ${res.status}`);
    }

    const totalBytes = parseInt(res.headers.get('content-length') || '0', 10);
    let downloadedBytes = 0;

    const fileStream = fs.createWriteStream(tempPath);
    const nodeStream = Readable.fromWeb(res.body);

    await new Promise((resolve, reject) => {
      let settled = false;
      const doResolve = () => {
        if (!settled) {
          settled = true;
          resolve();
        }
      };
      const doReject = (err) => {
        if (!settled) {
          settled = true;
          reject(err);
        }
      };

      nodeStream.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        if (typeof onProgress === 'function') {
          const percent = totalBytes > 0
            ? Math.min(100, Math.round((downloadedBytes / totalBytes) * 100))
            : 0;
          onProgress(percent, downloadedBytes, totalBytes);
        }
      });

      nodeStream.on('error', (err) => {
        fileStream.destroy();
        doReject(err);
      });

      fileStream.on('error', (err) => {
        nodeStream.destroy();
        doReject(err);
      });

      fileStream.on('finish', () => {
        doResolve();
      });

      nodeStream.pipe(fileStream);
    });

    clearTimeout(timer);
    atomicReplaceFile(tempPath, targetPath);
    return { success: true };
  } catch (err) {
    clearTimeout(timer);
    if (fs.existsSync(tempPath)) {
      try {
        fs.unlinkSync(tempPath);
      } catch { }
    }
    throw err;
  }
}

/**
 * Checks current engine version vs latest release.
 */
async function checkEngineVersion(appDataPath, fallbackBundledResolver, timeoutMs = 2500) {
  let currentVersion = null;
  let source = 'Bundled';
  let binPath = resolveYtdlpBinary(appDataPath);

  if (binPath) {
    currentVersion = await getExecutableVersion(binPath);
    if (currentVersion) {
      source = 'AppData Updated';
    } else {
      binPath = null;
    }
  }

  if (!currentVersion && typeof fallbackBundledResolver === 'function') {
    try {
      currentVersion = await fallbackBundledResolver();
    } catch { }
  }

  const releaseRes = await fetchLatestRelease(timeoutMs);

  let updateAvailable = false;
  let latestVersion = null;
  let downloadUrl = null;

  if (releaseRes.success) {
    latestVersion = releaseRes.version;
    downloadUrl = releaseRes.downloadUrl;
    if (currentVersion) {
      updateAvailable = compareVersions(currentVersion, latestVersion) > 0;
    } else {
      updateAvailable = true;
    }
  }

  return {
    currentVersion: currentVersion || 'Bundled',
    source,
    path: binPath || 'Bundled Python Package',
    latestVersion,
    updateAvailable,
    downloadUrl,
    offline: !releaseRes.success,
  };
}

/**
 * Performs on-demand or automated engine update.
 */
async function performEngineUpdate({ appDataPath, onProgress, timeoutMs = 120000 }) {
  const targetPath = getTargetBinaryPath(appDataPath);

  const releaseRes = await fetchLatestRelease(10000);
  if (!releaseRes.success || !releaseRes.downloadUrl) {
    throw new Error(`Unable to reach update server: ${releaseRes.error || 'No release available'}`);
  }

  await downloadBinary(releaseRes.downloadUrl, targetPath, onProgress, timeoutMs);

  const newVer = await getExecutableVersion(targetPath);

  return {
    success: true,
    version: newVer || releaseRes.version,
    source: 'AppData Updated',
    path: targetPath,
  };
}

/**
 * Fail-safe cold boot startup engine probe and auto-updater.
 */
async function startupCheckAndUpdate({
  appDataPath,
  onStatus,
  onProgress,
  fallbackBundledResolver,
  timeoutMs = 2500,
}) {
  try {
    if (typeof onStatus === 'function') {
      onStatus('Checking media extraction engine...', 20);
    }

    const check = await checkEngineVersion(appDataPath, fallbackBundledResolver, timeoutMs);

    if (check.updateAvailable && check.downloadUrl) {
      const targetPath = getTargetBinaryPath(appDataPath);
      if (typeof onStatus === 'function') {
        onStatus(`Updating media engine (v${check.latestVersion})...`, 35);
      }

      await downloadBinary(
        check.downloadUrl,
        targetPath,
        (pct) => {
          if (typeof onProgress === 'function') onProgress(pct);
          if (typeof onStatus === 'function') {
            const mapped = 35 + Math.round(pct * 0.6);
            onStatus(`Updating media engine (v${check.latestVersion})...`, mapped);
          }
        },
        60000
      );

      if (typeof onStatus === 'function') {
        onStatus('Media extraction engine updated', 98);
      }
      return { updated: true, version: check.latestVersion };
    }

    if (check.offline) {
      if (typeof onStatus === 'function') {
        onStatus('Starting offline media engine...', 90);
      }
      return { updated: false, offline: true };
    }

    if (typeof onStatus === 'function') {
      onStatus('Media extraction engine is up to date', 90);
    }
    return { updated: false, version: check.currentVersion };
  } catch (err) {
    console.warn('Startup engine updater warning (non-fatal):', err);
    if (typeof onStatus === 'function') {
      onStatus('Starting Hermanos Forge...', 90);
    }
    return { updated: false, error: err.message };
  }
}

module.exports = {
  normalizeVersion,
  parseVersionSegments,
  compareVersions,
  getTargetBinaryPath,
  resolveYtdlpBinary,
  getExecutableVersion,
  atomicReplaceFile,
  fetchLatestRelease,
  downloadBinary,
  checkEngineVersion,
  performEngineUpdate,
  startupCheckAndUpdate,
};
