import test from 'node:test';
import assert from 'node:assert/strict';
import { formatTime, formatTimeShort, parseTime, clamp } from '../src/components/views/timeline/timeUtils.js';

test('formatTime formats seconds to hh:mm:ss and hh:mm:ss.ms', () => {
  assert.equal(formatTime(0), '00:00:00');
  assert.equal(formatTime(0, true), '00:00:00.00');
  assert.equal(formatTime(45), '00:00:45');
  assert.equal(formatTime(45.67, true), '00:00:45.67');
  assert.equal(formatTime(65), '00:01:05');
  assert.equal(formatTime(3665.25, true), '01:01:05.25');
  assert.equal(formatTime(null), '00:00:00');
  assert.equal(formatTime(undefined, true), '00:00:00.00');
  assert.equal(formatTime(NaN), '00:00:00');
});

test('formatTimeShort formats concise labels for ruler ticks', () => {
  assert.equal(formatTimeShort(0), '00:00');
  assert.equal(formatTimeShort(45), '00:45');
  assert.equal(formatTimeShort(65), '01:05');
  assert.equal(formatTimeShort(3665), '1:01:05');
  assert.equal(formatTimeShort(null), '00:00');
});

test('parseTime converts digital and fractional strings into seconds', () => {
  assert.equal(parseTime('00:01:05'), 65);
  assert.equal(parseTime('01:00:00'), 3600);
  assert.equal(parseTime('01:01:05.50'), 3665.5);
  assert.equal(parseTime('02:30'), 150);
  assert.equal(parseTime('45'), 45);
  assert.equal(parseTime('45.75'), 45.75);
  assert.equal(parseTime('invalid'), 0);
  assert.equal(parseTime(''), 0);
  assert.equal(parseTime(null), 0);
});

test('clamp confines values strictly between minimum and maximum bounds', () => {
  assert.equal(clamp(5, 0, 10), 5);
  assert.equal(clamp(-5, 0, 10), 0);
  assert.equal(clamp(15, 0, 10), 10);
  assert.equal(clamp(10, 10, 10), 10);
});
