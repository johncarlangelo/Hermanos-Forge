import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const engineUpdater = require('../electron/engine-updater.cjs');

const {
  normalizeVersion,
  parseVersionSegments,
  compareVersions,
  getTargetBinaryPath,
  resolveYtdlpBinary,
  atomicReplaceFile,
  fetchLatestRelease,
  checkEngineVersion,
  startupCheckAndUpdate,
} = engineUpdater;

test('normalizeVersion cleans tags, leading v, and whitespace', () => {
  assert.equal(normalizeVersion('2026.10.26'), '2026.10.26');
  assert.equal(normalizeVersion('v2026.10.26'), '2026.10.26');
  assert.equal(normalizeVersion('  v2025.01.15  '), '2025.01.15');
  assert.equal(normalizeVersion('V2024.12.01'), '2024.12.01');
  assert.equal(normalizeVersion("2026.11.04\r\nWARNING: out of date"), '2026.11.04');
  assert.equal(normalizeVersion("v2026.11.04\n[youtube] info"), '2026.11.04');
  assert.equal(normalizeVersion(''), '');
  assert.equal(normalizeVersion(null), '');
  assert.equal(normalizeVersion(undefined), '');
});

test('parseVersionSegments extracts numeric components', () => {
  assert.deepEqual(parseVersionSegments('2026.10.26'), [2026, 10, 26]);
  assert.deepEqual(parseVersionSegments('v2026.10.26.1'), [2026, 10, 26, 1]);
  assert.deepEqual(parseVersionSegments("2026.10.26\nignored"), [2026, 10, 26]);
  assert.deepEqual(parseVersionSegments('invalid'), [0]);
  assert.deepEqual(parseVersionSegments(''), []);
});

test('compareVersions accurately detects newer, older, and identical releases', () => {
  // Update available: latest (v2) is newer than current (v1) -> returns 1
  assert.equal(compareVersions('2026.06.09', '2026.10.26'), 1);
  assert.equal(compareVersions('v2026.06.09', '2026.10.26'), 1);
  assert.equal(compareVersions('2025.12.31', '2026.01.01'), 1);
  assert.equal(compareVersions('2026.10.26', '2026.10.26.1'), 1);

  // Up to date: identical versions -> returns 0
  assert.equal(compareVersions('2026.10.26', '2026.10.26'), 0);
  assert.equal(compareVersions('v2026.10.26', '2026.10.26'), 0);
  assert.equal(compareVersions('2026.10.26', 'v2026.10.26'), 0);

  // Current is newer than remote (e.g. nightly or ahead) -> returns -1
  assert.equal(compareVersions('2026.10.26', '2026.06.09'), -1);
  assert.equal(compareVersions('2026.10.26.1', '2026.10.26'), -1);

  // Boundary and missing version handling
  assert.equal(compareVersions(null, '2026.10.26'), 1);
  assert.equal(compareVersions('', '2026.10.26'), 1);
  assert.equal(compareVersions('Bundled', '2026.10.26'), 1);
  assert.equal(compareVersions('2026.10.26', 'Bundled'), -1);
  assert.equal(compareVersions('2026.10.26', null), -1);
  assert.equal(compareVersions(null, null), 0);
});

test('getTargetBinaryPath builds standard AppData executable path', () => {
  const dummyUserData = path.join(os.tmpdir(), 'hermanos-test-appdata');
  const resolved = getTargetBinaryPath(dummyUserData);
  assert.equal(resolved, path.join(dummyUserData, 'bin', 'yt-dlp.exe'));
});

test('resolveYtdlpBinary returns null when binary is missing', () => {
  const dummyUserData = path.join(os.tmpdir(), 'hermanos-nonexistent-' + Date.now());
  const resolved = resolveYtdlpBinary(dummyUserData);
  assert.equal(resolved, null);
});

test('resolveYtdlpBinary returns valid path when binary exists', () => {
  const testDir = path.join(os.tmpdir(), 'hermanos-test-bin-' + Date.now());
  const binDir = path.join(testDir, 'bin');
  fs.mkdirSync(binDir, { recursive: true });
  const fakeExe = path.join(binDir, 'yt-dlp.exe');
  // Write > 1000 bytes dummy binary
  fs.writeFileSync(fakeExe, Buffer.alloc(2048, 0x90));

  try {
    const resolved = resolveYtdlpBinary(testDir);
    assert.equal(resolved, fakeExe);
  } finally {
    try {
      fs.rmSync(testDir, { recursive: true, force: true });
    } catch { }
  }
});

test('atomicReplaceFile safely swaps temporary binary to destination and cleans up orphaned backups', () => {
  const testDir = path.join(os.tmpdir(), 'hermanos-atomic-test-' + Date.now());
  fs.mkdirSync(testDir, { recursive: true });
  const binDir = path.join(testDir, 'bin');
  fs.mkdirSync(binDir, { recursive: true });
  const sourcePath = path.join(testDir, 'yt-dlp.exe.temp');
  const targetPath = path.join(binDir, 'yt-dlp.exe');
  const staleBackup = path.join(binDir, 'yt-dlp.exe.old.123456');

  // Plant a stale backup from a prior run
  fs.writeFileSync(staleBackup, 'STALE_OLD_BACKUP');
  fs.writeFileSync(sourcePath, 'ORIGINAL_BINARY_PAYLOAD_V1');

  try {
    // 1. Initial swap into non-existent target, should clean up stale backup
    const result1 = atomicReplaceFile(sourcePath, targetPath);
    assert.equal(result1, true);
    assert.equal(fs.existsSync(targetPath), true);
    assert.equal(fs.readFileSync(targetPath, 'utf8'), 'ORIGINAL_BINARY_PAYLOAD_V1');
    assert.equal(fs.existsSync(sourcePath), false);
    assert.equal(fs.existsSync(staleBackup), false, 'Orphaned backup file should be cleaned up');

    // 2. Overwrite existing destination with v2
    fs.writeFileSync(sourcePath, 'UPDATED_BINARY_PAYLOAD_V2');
    const result2 = atomicReplaceFile(sourcePath, targetPath);
    assert.equal(result2, true);
    assert.equal(fs.existsSync(targetPath), true);
    assert.equal(fs.readFileSync(targetPath, 'utf8'), 'UPDATED_BINARY_PAYLOAD_V2');
    assert.equal(fs.existsSync(sourcePath), false);
  } finally {
    try {
      fs.rmSync(testDir, { recursive: true, force: true });
    } catch { }
  }
});

test('atomicReplaceFile throws clear error when source file is missing', () => {
  const testDir = path.join(os.tmpdir(), 'hermanos-atomic-err-' + Date.now());
  fs.mkdirSync(testDir, { recursive: true });
  const missingSource = path.join(testDir, 'does-not-exist.temp');
  const targetPath = path.join(testDir, 'bin', 'yt-dlp.exe');

  try {
    assert.throws(() => {
      atomicReplaceFile(missingSource, targetPath);
    }, /Source file does not exist/);
  } finally {
    try {
      fs.rmSync(testDir, { recursive: true, force: true });
    } catch { }
  }
});

test('fetchLatestRelease fails gracefully on network timeout or unreachable host', async () => {
  // Point to a non-routable port with small 200ms timeout
  const result = await fetchLatestRelease(200, 'http://127.0.0.1:59999/releases/latest');
  assert.equal(result.success, false);
  assert.equal(typeof result.error, 'string');
});

test('checkEngineVersion falls back gracefully when offline', async () => {
  const dummyUserData = path.join(os.tmpdir(), 'hermanos-offline-test-' + Date.now());

  // Resolver for bundled fallback
  const mockBundledResolver = async () => '2026.06.09';

  // Strict 200ms timeout to force offline resolution
  const result = await checkEngineVersion(dummyUserData, mockBundledResolver, 1);

  assert.equal(result.source, 'Bundled');
  assert.equal(result.currentVersion, '2026.06.09');
  assert.equal(result.updateAvailable, false);
  assert.equal(result.offline, true);
});

test('startupCheckAndUpdate runs fail-safe sequence without throwing when offline', async () => {
  const dummyUserData = path.join(os.tmpdir(), 'hermanos-startup-test-' + Date.now());
  const statuses = [];

  const onStatus = (msg, pct) => {
    statuses.push({ msg, pct });
  };

  const result = await startupCheckAndUpdate({
    appDataPath: dummyUserData,
    onStatus,
    fallbackBundledResolver: async () => '2026.06.09',
    timeoutMs: 1, // trigger fast offline fallback
  });

  assert.equal(result.updated, false);
  assert.equal(result.offline, true);
  assert.ok(statuses.length >= 2, 'Must report progress status messages');
  assert.equal(statuses[0].msg, 'Checking media extraction engine...');
});
