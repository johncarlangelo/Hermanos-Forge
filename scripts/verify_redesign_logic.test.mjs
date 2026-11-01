import test from 'node:test';
import assert from 'node:assert/strict';

// 1. Timecode parsing test
const parseTime = (timeStr) => {
  if (!timeStr) return 0;
  const parts = String(timeStr).trim().split(':').map((p) => parseFloat(p));
  if (parts.some((n) => isNaN(n))) return 0;
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    return parts[0];
  }
  return 0;
};

test('parseTime handles various standard time formats', () => {
  // Prior failure: '01:30' returned 0
  assert.equal(parseTime('01:30'), 90, 'mm:ss should parse correctly');
  assert.equal(parseTime('1:30'), 90, 'm:ss should parse correctly');
  assert.equal(parseTime('00:01:30'), 90, 'hh:mm:ss should parse correctly');
  assert.equal(parseTime('01:00:00'), 3600, '1 hour should parse to 3600s');
  assert.equal(parseTime('45'), 45, 'raw seconds should parse correctly');
  assert.equal(parseTime(''), 0, 'empty string should return 0');
  assert.equal(parseTime('invalid:time'), 0, 'malformed string should return 0');
});

// 2. Video trimmer gap calculation for short videos
test('timeline trimmer handles short videos without locking handles', () => {
  const shortDuration = 3; // 3 second clip
  const minGap = Math.min(1, Math.max(0.1, shortDuration * 0.01)); // ~0.1s
  
  // Test start handle drag forward
  const initialStart = 0;
  const initialEnd = 3;
  const deltaForward = 1.5;
  const newStart = Math.max(0, Math.min(initialStart + deltaForward, initialEnd - minGap));
  assert.equal(newStart, 1.5, 'Start handle should move freely on short video');
  assert.ok(newStart < initialEnd, 'Start must stay strictly before end');

  // Test end handle drag backward
  const deltaBackward = -1.0;
  const newEnd = Math.min(shortDuration, Math.max(initialEnd + deltaBackward, newStart + minGap));
  assert.equal(newEnd, 2.0, 'End handle should move freely on short video');
  assert.ok(newEnd > newStart, 'End must stay strictly after start');
});

// 3. Status string regex extraction
test('status string regex extraction handles percent and MiB correctly', () => {
  const status1 = '[download]  45.2% of ~ 152.40MiB at  8.45MiB/s ETA 00:09';
  const status2 = '[download]  10.25MiB of 50.00MiB at  2.10MiB/s ETA 00:19';

  const speedRegex = /[\d.]+\s*(?:K|M|G)i?B\/s/i;
  const etaRegex = /ETA\s*[\d:]+/i;
  const sizeRegex = /(?:[\d.]+\s*(?:%|(?:K|M|G|T)i?B))\s*of\s*~?\s*[\d.]+\s*(?:K|M|G|T)i?B/i;

  assert.equal(status1.match(speedRegex)?.[0], '8.45MiB/s');
  assert.equal(status1.match(etaRegex)?.[0], 'ETA 00:09');
  assert.equal(status1.match(sizeRegex)?.[0], '45.2% of ~ 152.40MiB');

  assert.equal(status2.match(speedRegex)?.[0], '2.10MiB/s');
  assert.equal(status2.match(etaRegex)?.[0], 'ETA 00:19');
  assert.equal(status2.match(sizeRegex)?.[0], '10.25MiB of 50.00MiB');
});

// 4. Mass clip reordering logic
test('mass clip reordering works predictably in both directions', () => {
  const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  
  const moveClip = (list, index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= list.length) return list;
    const updated = [...list];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    return updated;
  };

  // Move first item down
  const downResult = moveClip(items, 0, 1);
  assert.deepEqual(downResult.map(i => i.id), ['b', 'a', 'c']);

  // Move last item up
  const upResult = moveClip(downResult, 2, -1);
  assert.deepEqual(upResult.map(i => i.id), ['b', 'c', 'a']);

  // Boundary checks: index 0 cannot move up
  const blockedUp = moveClip(items, 0, -1);
  assert.deepEqual(blockedUp.map(i => i.id), ['a', 'b', 'c']);

  // Boundary checks: index 2 cannot move down
  const blockedDown = moveClip(items, 2, 1);
  assert.deepEqual(blockedDown.map(i => i.id), ['a', 'b', 'c']);
});

// 5. Studio Timeline Ruler calculations
test('studio timeline ruler safely clamps In/Out points and calculates duration', () => {
  const duration = 240;
  const start = 30;
  const end = 150;
  
  const safeDuration = Math.max(1, duration || 180);
  const safeStart = Math.max(0, Math.min(start || 0, safeDuration));
  const safeEnd = Math.max(safeStart + 0.1, Math.min(end || safeDuration, safeDuration));
  const rangeDuration = safeEnd - safeStart;

  assert.equal(safeStart, 30);
  assert.equal(safeEnd, 150);
  assert.equal(rangeDuration, 120);

  // Inverted range boundary check
  const badStart = 200;
  const badEnd = 50;
  const clampedStart = Math.max(0, Math.min(badStart, safeDuration));
  const clampedEnd = Math.max(clampedStart + 0.1, Math.min(badEnd, safeDuration));
  assert.ok(clampedEnd > clampedStart, 'End point must always stay strictly after start point');
});

// 6. Quality badge label resolution logic
test('inspector quality badge label correctly classifies 4K, 2K, FHD, HD, and MP3', () => {
  const getQualityBadgeLabel = (type, quality) => {
    if (type === 'mp3') return 'MP3 320k';
    if (!quality) return 'Auto';
    const num = parseInt(quality, 10);
    if (num >= 2160) return '4K UHD';
    if (num >= 1440) return '2K QHD';
    if (num >= 1080) return '1080p FHD';
    if (num >= 720) return '720p HD';
    return `${quality}p`;
  };

  assert.equal(getQualityBadgeLabel('mp3', '1080'), 'MP3 320k');
  assert.equal(getQualityBadgeLabel('mp4', ''), 'Auto');
  assert.equal(getQualityBadgeLabel('mp4', '2160'), '4K UHD');
  assert.equal(getQualityBadgeLabel('mp4', '1440'), '2K QHD');
  assert.equal(getQualityBadgeLabel('mp4', '1080'), '1080p FHD');
  assert.equal(getQualityBadgeLabel('mp4', '720'), '720p HD');
  assert.equal(getQualityBadgeLabel('mp4', '480'), '480p');
});

// 7. Command bar Enter key action resolution
test('command bar Enter key logic correctly dispatches between batch sequence addition, playlist modal, and media download', () => {
  const resolveEnterAction = ({
    url,
    isDownloading,
    isInspecting,
    activeTab,
    playlistCount,
    hasSingleMetadata,
  }) => {
    if (!url || !url.trim() || isDownloading || isInspecting) return 'NO_OP';
    if (activeTab === 'mass-clip') return 'ADD_TO_SEQUENCE';
    if (playlistCount > 0) return 'OPEN_PLAYLIST_MODAL';
    if (hasSingleMetadata) return 'FORGE_MEDIA';
    return 'PROBE_AND_FORGE';
  };

  assert.equal(resolveEnterAction({ url: '', isDownloading: false, isInspecting: false }), 'NO_OP');
  assert.equal(resolveEnterAction({ url: 'https://youtu.be/abc', isDownloading: true, isInspecting: false }), 'NO_OP');
  assert.equal(resolveEnterAction({ url: 'https://youtu.be/abc', isDownloading: false, isInspecting: true }), 'NO_OP');
  assert.equal(resolveEnterAction({ url: 'https://youtu.be/abc', isDownloading: false, isInspecting: false, activeTab: 'mass-clip' }), 'ADD_TO_SEQUENCE');
  assert.equal(resolveEnterAction({ url: 'https://youtu.be/abc', isDownloading: false, isInspecting: false, activeTab: 'download', playlistCount: 5 }), 'OPEN_PLAYLIST_MODAL');
  assert.equal(resolveEnterAction({ url: 'https://youtu.be/abc', isDownloading: false, isInspecting: false, activeTab: 'download', playlistCount: 0, hasSingleMetadata: true }), 'FORGE_MEDIA');
  assert.equal(resolveEnterAction({ url: 'https://youtu.be/abc', isDownloading: false, isInspecting: false, activeTab: 'download', playlistCount: 0, hasSingleMetadata: false }), 'PROBE_AND_FORGE');
});

// 8. Inspector rail context title and action text resolution
test('inspector rail dynamically resolves context title, properties, and forge action across all 5 workspace tools', () => {
  const getInspectorMetadata = ({ activeTab, downloadType, validMassClipsCount, trimmerClipsCount, isDownloading, isMassProcessing, isTrimmerDownloading }) => {
    switch (activeTab) {
      case 'download':
        return {
          header: 'DIRECT STREAM PIPELINE',
          actionText: isDownloading ? 'Cancel Operation' : downloadType === 'mp3' ? 'Forge Audio Master' : 'Forge Media Stream',
          isDestructive: isDownloading,
        };
      case 'mass-clip':
        return {
          header: 'MULTI-TRACK SEQUENCE',
          actionText: isMassProcessing ? 'Cancel Batch Stitch' : `Forge Stitched Video (${validMassClipsCount} Tracks)`,
          isDestructive: isMassProcessing,
        };
      case 'selective':
        return {
          header: 'KEYFRAME TRIMMER',
          actionText: isTrimmerDownloading ? 'Cancel Trimming' : `Forge Trimmed Clips (${trimmerClipsCount})`,
          isDestructive: isTrimmerDownloading,
        };
      case 'history':
        return {
          header: 'ARCHIVE LEDGER',
          actionText: 'Clear History Archive',
          isDestructive: true,
        };
      case 'settings':
        return {
          header: 'DIAGNOSTICS & AUTH',
          actionText: 'Refresh Diagnostics',
          isDestructive: false,
        };
      default:
        return { header: 'DIRECT STREAM PIPELINE', actionText: 'Forge Media Stream', isDestructive: false };
    }
  };

  assert.deepEqual(getInspectorMetadata({ activeTab: 'download', downloadType: 'mp4', isDownloading: false }), {
    header: 'DIRECT STREAM PIPELINE',
    actionText: 'Forge Media Stream',
    isDestructive: false,
  });

  assert.deepEqual(getInspectorMetadata({ activeTab: 'download', downloadType: 'mp3', isDownloading: false }), {
    header: 'DIRECT STREAM PIPELINE',
    actionText: 'Forge Audio Master',
    isDestructive: false,
  });

  assert.deepEqual(getInspectorMetadata({ activeTab: 'mass-clip', validMassClipsCount: 4, isMassProcessing: false }), {
    header: 'MULTI-TRACK SEQUENCE',
    actionText: 'Forge Stitched Video (4 Tracks)',
    isDestructive: false,
  });

  assert.deepEqual(getInspectorMetadata({ activeTab: 'mass-clip', validMassClipsCount: 4, isMassProcessing: true }), {
    header: 'MULTI-TRACK SEQUENCE',
    actionText: 'Cancel Batch Stitch',
    isDestructive: true,
  });

  assert.deepEqual(getInspectorMetadata({ activeTab: 'selective', trimmerClipsCount: 2, isTrimmerDownloading: false }), {
    header: 'KEYFRAME TRIMMER',
    actionText: 'Forge Trimmed Clips (2)',
    isDestructive: false,
  });

  assert.deepEqual(getInspectorMetadata({ activeTab: 'history' }), {
    header: 'ARCHIVE LEDGER',
    actionText: 'Clear History Archive',
    isDestructive: true,
  });

  assert.deepEqual(getInspectorMetadata({ activeTab: 'settings' }), {
    header: 'DIAGNOSTICS & AUTH',
    actionText: 'Refresh Diagnostics',
    isDestructive: false,
  });
});

// 9. Multi-track sequence count calculation
test('multi-track sequence track counting accurately ignores whitespace and counts valid tracks', () => {
  const clips = [
    { id: '1', url: 'https://youtube.com/watch?v=1' },
    { id: '2', url: '   ' },
    { id: '3', url: 'https://youtube.com/watch?v=2' },
    { id: '4', url: '' },
    { id: '5', url: 'https://youtube.com/watch?v=3   ' },
  ];

  const validCount = clips.filter((c) => c.url && c.url.trim()).length;
  assert.equal(validCount, 3, 'Should count exactly 3 valid non-empty track URLs');
});

