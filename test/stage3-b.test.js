import test from 'node:test';
import assert from 'node:assert/strict';
import { mayaCountAt, scene as maya } from '../src/scenes/maya.js';
import { eyeAt } from '../src/scenes/bada.js';
import { guestGestureAt } from '../src/scenes/mughal.js';
import { rodsAt } from '../src/scenes/wayang.js';
import { pedalPhase } from '../src/beat/timeline.js';

test('Maya numerals advance once per complete shared pedal revolution', () => {
  assert.equal(mayaCountAt(maya.start - 0.5), 0);
  for (let turn = 1; turn <= 6; turn += 1) {
    const boundary = maya.start + turn;
    assert.equal(mayaCountAt(boundary - 0.001), turn - 1);
    assert.equal(mayaCountAt(boundary), turn);
    assert.equal(mayaCountAt(boundary + 0.001), turn);
    assert.ok(Math.abs(pedalPhase(boundary) - pedalPhase(boundary - 1) - Math.PI * 2) < 1e-10);
  }
  const times = [46, 42.1, 45.999, 41, 47, 44, 43.999, 46.9];
  const counts = [5, 1, 4, 0, 6, 3, 2, 5];
  assert.deepEqual(times.map(mayaCountAt), counts, 'seeking cannot accumulate or lose turns');
  assert.equal(mayaCountAt(maya.start + 20), 6, 'neighboring panels must keep the completed ledger bounded');
});

test('Bada rolls its eyes on the second-bar downbeat and holds the expression', () => {
  const before = eyeAt(1.999);
  const onset = eyeAt(2);
  const middle = eyeAt(2.15);
  const held = eyeAt(3);
  assert.equal(before.roll, 0);
  assert.deepEqual(onset, before);
  assert.ok(middle.roll > 0 && middle.roll < 1);
  assert.equal(held.roll, 1);
  assert.ok(held.pupilY < before.pupilY);
  assert.ok(held.pupilX < before.pupilX);
  for (const localT of [2.3, 4, 5.3, 6.5]) assert.deepEqual(eyeAt(localT), held);
  eyeAt(5.9);
  assert.deepEqual(eyeAt(1.999), before, 'returning to entry must restore the original gaze');
});

test('Mughal guests raise their cups in sequence during the second bar', () => {
  for (const index of [0, 1, 2]) {
    assert.equal(guestGestureAt(1.999, index), 0);
    assert.equal(guestGestureAt(3, index), 1);
    assert.equal(guestGestureAt(4, index), 1);
  }
  const firstLift = [0, 1, 2].map((index) => guestGestureAt(2.24, index));
  assert.ok(firstLift[0] > firstLift[1] && firstLift[1] > firstLift[2]);
  assert.equal(firstLift[2], 0);
  guestGestureAt(5.8, 1);
  assert.equal(guestGestureAt(1.9, 1), 0);
});

test('Wayang control rods cross and untangle within the second bar', () => {
  const entry = rodsAt(1.999);
  const crossed = rodsAt(2.8);
  assert.equal(entry.cross, 0);
  assert.ok(entry.left > entry.right);
  assert.equal(crossed.cross, 1);
  assert.ok(crossed.left < crossed.right);
  for (const localT of [4, 5.3, 6.5]) assert.deepEqual(rodsAt(localT), entry);
  assert.deepEqual(rodsAt(2.8), crossed, 'seeking must reconstruct the same crossing');
});
