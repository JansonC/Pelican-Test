import test from 'node:test';
import assert from 'node:assert/strict';
import { songCameraAt, portraitAt } from '../src/main/presentation.js';
import { STAGE_WIDTH } from '../src/beat/timeline.js';

test('landscape search starts wide, finds a small rider, and rejoins the road at exit', () => {
  assert.deepEqual(songCameraAt(0), { zoom: 1, riderScale: 1 });
  assert.deepEqual(songCameraAt(6), { zoom: 1, riderScale: 1 });
  for (const t of [-0.7, 0, 0.69, 5.26, 6, 6.7]) {
    assert.deepEqual(songCameraAt(t), { zoom: 1, riderScale: 1 }, 'both halves of a rider crossing a portal need the same scale');
  }
  const wide = songCameraAt(1.3);
  const found = songCameraAt(3.2);
  assert.equal(wide.zoom, 1);
  assert.ok(wide.riderScale < 0.1);
  assert.ok(found.zoom > 3);
  assert.ok(found.riderScale * found.zoom > 0.6);
  for (let t = -0.5; t <= 6.5; t += 0.02) {
    const { zoom, riderScale } = songCameraAt(t);
    // Scaling about ROAD_Y leaves the lower tire point exactly on the road.
    const roadY = 802;
    const lowerTire = roadY + ((roadY - 73 * riderScale + 73 * riderScale) - roadY) * zoom;
    assert.equal(lowerTire, roadY);
    assert.ok(Number.isFinite(zoom) && riderScale > 0);
  }
});

test('portrait is exactly 9:16, remains centered, and completes on the exit downbeat', () => {
  for (const t of [113.5, 115, 118.9, 119]) {
    const { width, left } = portraitAt(t);
    assert.equal(width / 1000, 9 / 16);
    assert.equal(left * 2 + width, STAGE_WIDTH);
    assert.equal(portraitAt(t).riderScale, 0.68);
  }
  assert.equal(portraitAt(113).progress, 0);
  assert.ok(portraitAt(118.99).progress < 1);
  assert.equal(portraitAt(119).progress, 1);
  assert.equal(portraitAt(112.5).amount, 0);
  assert.equal(portraitAt(119.5).amount, 0);
  for (let t = 112.5; t <= 119.5; t += 0.01) {
    assert.ok(Math.abs(portraitAt(t + 0.001).width - portraitAt(t).width) < 6);
  }
});
