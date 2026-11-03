import test from 'node:test';
import assert from 'node:assert/strict';

import {
  formatBytes,
  formatSpeed,
  formatEta,
  getStreamPhase,
  getStreamPhaseBadgeVariant,
  formatVolume,
  generateTelemetrySummary,
} from '../src/utils/telemetry.js';

test('formatBytes formats binary values accurately', () => {
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(512), '512 B');
  assert.equal(formatBytes(1024), '1.00 KiB');
  assert.equal(formatBytes(1536, 1), '1.5 KiB');
  assert.equal(formatBytes(1048576), '1.00 MiB');
  assert.equal(formatBytes(1073741824), '1.00 GiB');
  assert.equal(formatBytes(1099511627776), '1.00 TiB');
});

test('formatBytes handles boundary rounding without 1024.00 KiB artifacts', () => {
  // 1048575 bytes is 1023.999 KiB. With 2 decimals, it must bump to 1.00 MiB rather than 1024.00 KiB.
  assert.equal(formatBytes(1048575), '1.00 MiB');
  assert.equal(formatBytes(1073741823), '1.00 GiB');
});

test('formatBytes handles invalid and edge-case inputs gracefully', () => {
  assert.equal(formatBytes(null), '--');
  assert.equal(formatBytes(undefined), '--');
  assert.equal(formatBytes(-100), '--');
  assert.equal(formatBytes(NaN), '--');
  assert.equal(formatBytes(Infinity), '--');
  assert.equal(formatBytes('not a number'), '--');
});

test('formatSpeed formats transfer rate strings', () => {
  assert.equal(formatSpeed(0), '0 B/s');
  assert.equal(formatSpeed(1024), '1.00 KiB/s');
  assert.equal(formatSpeed(5242880), '5.00 MiB/s');
  assert.equal(formatSpeed(1048575), '1.00 MiB/s');
  assert.equal(formatSpeed(null), '--');
  assert.equal(formatSpeed(undefined), '--');
  assert.equal(formatSpeed(-50), '--');
  assert.equal(formatSpeed(NaN), '--');
});

test('formatEta formats seconds into digital timecodes', () => {
  assert.equal(formatEta(0), '00:00');
  assert.equal(formatEta(45), '00:45');
  assert.equal(formatEta(65), '01:05');
  assert.equal(formatEta(599), '09:59');
  assert.equal(formatEta(3600), '01:00:00');
  assert.equal(formatEta(3665), '01:01:05');
  assert.equal(formatEta(7322), '02:02:02');
  assert.equal(formatEta(500000), '> 99h');
});

test('formatEta handles invalid values gracefully', () => {
  assert.equal(formatEta(null), '--:--');
  assert.equal(formatEta(undefined), '--:--');
  assert.equal(formatEta(-1), '--:--');
  assert.equal(formatEta(NaN), '--:--');
  assert.equal(formatEta(Infinity), '--:--');
});

test('getStreamPhase resolves correct lifecycle phases', () => {
  // Probing phase
  assert.equal(
    getStreamPhase(null, 'Initializing media stream...', true),
    'Probing'
  );
  assert.equal(
    getStreamPhase(null, 'Starting MP4 download...', true),
    'Probing'
  );

  // Receiving Stream phase
  const dlTelemetry = {
    downloaded: 1024,
    total: 2048,
    speed: 512,
    eta: 2,
    percent: 50.0,
    status: 'downloading',
    phase: 'downloading',
  };
  assert.equal(getStreamPhase(dlTelemetry, '', true), 'Receiving Stream');
  assert.equal(
    getStreamPhase(null, 'downloading stream...', true),
    'Receiving Stream'
  );

  // FFmpeg Muxing phase
  assert.equal(
    getStreamPhase(null, 'Converting webm to H.264 for compatibility...', true),
    'FFmpeg Muxing'
  );
  assert.equal(
    getStreamPhase(null, 'Download complete, processing...', true),
    'FFmpeg Muxing'
  );
  const finishedTelemetry = {
    downloaded: 2048,
    total: 2048,
    speed: 0,
    eta: 0,
    percent: 100.0,
    status: 'finished',
    phase: 'processing',
  };
  assert.equal(getStreamPhase(finishedTelemetry, '', true), 'FFmpeg Muxing');

  // Complete phase
  assert.equal(getStreamPhase(null, 'Completed!', true), 'Complete');
  assert.equal(getStreamPhase(null, 'Completed!', false), 'Complete');
  assert.equal(
    getStreamPhase({ percent: 100 }, 'All done', false),
    'Complete'
  );

  // Multi-stream phase recovery: Video finished -> status becomes "Download complete, processing...",
  // then audio stream starts downloading. Telemetry must correctly reflect "Receiving Stream".
  const audioStreamTelemetry = {
    downloaded: 32768,
    total: 3145728,
    speed: 524288,
    eta: 5,
    percent: 1.04,
    status: 'downloading',
    phase: 'downloading',
  };
  assert.equal(
    getStreamPhase(audioStreamTelemetry, 'Download complete, processing...', true),
    'Receiving Stream'
  );
});

test('getStreamPhaseBadgeVariant maps to valid Obsidian token variants', () => {
  assert.equal(getStreamPhaseBadgeVariant('Probing'), 'accent');
  assert.equal(getStreamPhaseBadgeVariant('Receiving Stream'), 'cyan');
  assert.equal(getStreamPhaseBadgeVariant('FFmpeg Muxing'), 'warning');
  assert.equal(getStreamPhaseBadgeVariant('Complete'), 'success');
  assert.equal(getStreamPhaseBadgeVariant('Unknown'), 'accent');
});

test('formatVolume handles partial and complete volume metrics', () => {
  assert.equal(formatVolume(null, null), '--');
  assert.equal(formatVolume(1048576, 5242880), '1.00 MiB of 5.00 MiB');
  assert.equal(formatVolume(1048576, 0), '1.00 MiB');
  assert.equal(formatVolume(1048576, null), '1.00 MiB');
});

test('generateTelemetrySummary formats copyable status log string', () => {
  const telemetry = {
    downloaded: 10485760,
    total: 52428800,
    speed: 2621440,
    eta: 16,
    percent: 20.0,
  };
  const summary = generateTelemetrySummary(
    telemetry,
    'Receiving stream chunks',
    'Receiving Stream'
  );

  assert.ok(summary.includes('[Hermanos Forge Stream Telemetry]'));
  assert.ok(summary.includes('Phase: Receiving Stream'));
  assert.ok(summary.includes('Speed: 2.50 MiB/s'));
  assert.ok(summary.includes('ETA: 00:16'));
  assert.ok(summary.includes('Volume: 10.00 MiB of 50.00 MiB'));
  assert.ok(summary.includes('Progress: 20.0%'));
});

test('IPC prefix parsing contract: TELEMETRY, PROGRESS, and STATUS lines', () => {
  const sampleTelemetryPayload = {
    downloaded: 4194304,
    total: 16777216,
    speed: 1048576,
    eta: 12,
    percent: 25.0,
    status: 'downloading',
    phase: 'downloading',
  };
  const telemetryLine = `TELEMETRY:${JSON.stringify(sampleTelemetryPayload)}`;
  const progressLine = 'PROGRESS:25.00';
  const statusLine = 'STATUS:Downloading media stream...';

  // Verify TELEMETRY line parsing
  assert.ok(telemetryLine.startsWith('TELEMETRY:'));
  const parsedTelemetry = JSON.parse(telemetryLine.substring(10));
  assert.equal(parsedTelemetry.downloaded, 4194304);
  assert.equal(parsedTelemetry.percent, 25.0);
  assert.equal(parsedTelemetry.speed, 1048576);

  // Verify PROGRESS line parsing
  assert.ok(progressLine.startsWith('PROGRESS:'));
  const percent = parseFloat(progressLine.split(':')[1]);
  assert.equal(percent, 25.0);

  // Verify STATUS line parsing
  assert.ok(statusLine.startsWith('STATUS:'));
  const status = statusLine.substring(7);
  assert.equal(status, 'Downloading media stream...');
});

test('IPC stream buffer reconstructs split chunks across data events', () => {
  const fullOutput =
    'PROGRESS:10.00\nTELEMETRY:{"downloaded":1024,"total":2048,"speed":512,"eta":2,"percent":50.0,"status":"downloading","phase":"downloading"}\nSTATUS:Processing\n';

  // Split right in the middle of the TELEMETRY JSON string
  const splitIndex = 35;
  const chunk1 = fullOutput.slice(0, splitIndex);
  const chunk2 = fullOutput.slice(splitIndex);

  let buffer = '';
  const parsedLines = [];

  const processChunk = (chunk) => {
    buffer += chunk;
    const lines = buffer.split(/[\r\n]+/);
    buffer = lines.pop(); // Retain incomplete trailing segment
    lines.forEach((l) => {
      l = l.trim();
      if (l) parsedLines.push(l);
    });
  };

  processChunk(chunk1);
  processChunk(chunk2);
  if (buffer.trim()) parsedLines.push(buffer.trim());

  assert.equal(parsedLines.length, 3);
  assert.equal(parsedLines[0], 'PROGRESS:10.00');
  assert.ok(parsedLines[1].startsWith('TELEMETRY:'));
  const parsedTelemetry = JSON.parse(parsedLines[1].substring(10));
  assert.equal(parsedTelemetry.downloaded, 1024);
  assert.equal(parsedTelemetry.eta, 2);
  assert.equal(parsedLines[2], 'STATUS:Processing');
});

test('Robust IPC stdout line parsing handles preceding fragments and concatenated tags', () => {
  const line =
    '[download]  25.0% of  10.00MiB at 1.50MiB/s ETA 00:05TELEMETRY:{"downloaded":2621440,"total":10485760,"speed":1572864,"eta":5,"percent":25.0,"status":"downloading","phase":"downloading"}PROGRESS:25.00';

  // Extract TELEMETRY
  const telemetryIdx = line.indexOf('TELEMETRY:');
  assert.notEqual(telemetryIdx, -1);
  let jsonStr = line.substring(telemetryIdx + 10).trim();
  const firstBrace = jsonStr.indexOf('{');
  const lastBrace = jsonStr.lastIndexOf('}');
  assert.notEqual(firstBrace, -1);
  assert.ok(lastBrace >= firstBrace);
  jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
  const telemetry = JSON.parse(jsonStr);
  assert.equal(telemetry.downloaded, 2621440);
  assert.equal(telemetry.percent, 25.0);

  // Extract PROGRESS
  const progressIdx = line.indexOf('PROGRESS:');
  assert.notEqual(progressIdx, -1);
  const afterProgress = line.substring(progressIdx + 9).trim();
  const match = afterProgress.match(/^(\d+(?:\.\d+)?)/);
  assert.ok(match);
  const percent = parseFloat(match[1]);
  assert.equal(percent, 25.0);
});

test('Robust IPC stdout line parsing handles carriage return and ANSI fragments', () => {
  const line = '\r\x1b[KPROGRESS:75.50';
  const progressIdx = line.indexOf('PROGRESS:');
  assert.notEqual(progressIdx, -1);
  const afterProgress = line.substring(progressIdx + 9).trim();
  const match = afterProgress.match(/^(\d+(?:\.\d+)?)/);
  assert.ok(match);
  const percent = parseFloat(match[1]);
  assert.equal(percent, 75.5);
});

test('IPC parser resolves SUCCESS even when filepath contains ERROR: in title', () => {
  const line = 'SUCCESS:C:\\Users\\Downloads\\Fixing ERROR: In Python Code.mp4';
  
  let resolved = null;
  let rejected = null;

  const successIdx = line.indexOf('SUCCESS:');
  const errorIdx = line.indexOf('ERROR:');

  // Verify that errorIdx matches inside the string
  assert.notEqual(errorIdx, -1);

  // In the fixed parser, successIdx takes precedence
  if (successIdx !== -1) {
    const filepath = line.substring(successIdx + 8).trim();
    resolved = { success: true, filepath };
  } else if (errorIdx !== -1) {
    rejected = new Error(line.substring(errorIdx + 6).trim());
  }

  assert.equal(rejected, null);
  assert.deepEqual(resolved, {
    success: true,
    filepath: 'C:\\Users\\Downloads\\Fixing ERROR: In Python Code.mp4',
  });
});

test('IPC parser resolves METADATA even when video title contains ERROR:', () => {
  const line = 'METADATA:{"title":"How to fix ERROR: 404 Not Found","formats":[]}';

  let resolved = null;
  let rejected = null;

  const metadataIdx = line.indexOf('METADATA:');
  const errorIdx = line.indexOf('ERROR:');

  assert.notEqual(errorIdx, -1);

  // In the fixed parser, metadataIdx takes precedence over errorIdx
  if (metadataIdx !== -1) {
    let jsonStr = line.substring(metadataIdx + 9).trim();
    const fb = jsonStr.indexOf('{');
    const lb = jsonStr.lastIndexOf('}');
    if (fb !== -1 && lb !== -1 && lb >= fb) jsonStr = jsonStr.substring(fb, lb + 1);
    resolved = JSON.parse(jsonStr);
  } else if (errorIdx !== -1) {
    rejected = new Error(line.substring(errorIdx + 6).trim());
  }

  assert.equal(rejected, null);
  assert.equal(resolved.title, 'How to fix ERROR: 404 Not Found');
});

test('IPC parser separates concatenated STATUS and PROGRESS tags', () => {
  const line = 'STATUS:Downloading media stream...PROGRESS:15.50';

  let status = null;
  let progress = null;

  const statusIdx = line.indexOf('STATUS:');
  if (statusIdx !== -1) {
    let s = line.substring(statusIdx + 7).trim();
    const nextTag = s.search(/(?:TELEMETRY|PROGRESS|SUCCESS|ERROR|AUTH_ERROR|FORMATS|METADATA|INSPECT):/);
    if (nextTag !== -1) s = s.substring(0, nextTag).trim();
    status = s;
  }

  const progressIdx = line.indexOf('PROGRESS:');
  if (progressIdx !== -1) {
    const afterProgress = line.substring(progressIdx + 9).trim();
    const match = afterProgress.match(/^(\d+(?:\.\d+)?)/);
    progress = match ? parseFloat(match[1]) : parseFloat(afterProgress);
  }

  assert.equal(status, 'Downloading media stream...');
  assert.equal(progress, 15.5);
});


