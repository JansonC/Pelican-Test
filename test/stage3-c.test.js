import test from 'node:test';
import assert from 'node:assert/strict';
import { hatWindAt } from '../src/scenes/ukiyo.js';
import { starOrbitAt } from '../src/scenes/starry.js';
import { waveTensionAt, pedestrianAt } from '../src/scenes/scream.js';
import { shadowAt, shadowOutlineAt } from '../src/scenes/nosferatu.js';
import { poseAt } from '../src/rig/pelican.js';

test('Stage C events reconstruct from local time', () => {
  assert.equal(hatWindAt(1.999), 0);
  assert.ok(hatWindAt(3) > 0 && hatWindAt(4) > hatWindAt(3));
  assert.equal(starOrbitAt(1.999), 0);
  assert.ok(starOrbitAt(3) > 0 && starOrbitAt(5) > starOrbitAt(3));
  assert.equal(waveTensionAt(1.999), 0);
  assert.ok(waveTensionAt(2.5) > 0);
  assert.ok(pedestrianAt(2.3, 0).mouth > pedestrianAt(2.3, 1).mouth);
  assert.equal(shadowAt(1.5).tension, 0);
  assert.ok(shadowAt(3).tension > 0);
  assert.equal(shadowAt(5).tension, 0);
  const outline = shadowOutlineAt(6, poseAt(89));
  assert.ok(outline.length >= 20);
  assert.ok(outline.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y)));
});
