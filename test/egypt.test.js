import test from 'node:test';
import assert from 'node:assert/strict';
import { scene, poseTimeAt } from '../src/scenes/egypt.js';
import { poseAt } from '../src/rig/pelican.js';

test('Egypt freezes the shared rider pose during its second-bar tableau', () => {
  const frozen = poseAt(poseTimeAt(scene.start + 2, 2));
  for (const localT of [2.1, 2.4, 2.8, 3]) {
    const pose = poseAt(poseTimeAt(scene.start + localT, localT));
    assert.deepEqual(pose, frozen, 'feet, knees, wheel phase and body must freeze together');
  }
  assert.notDeepEqual(poseAt(scene.start + 2.4), frozen, 'the tableau must actually differ from normal pedaling');
});

test('Egypt pose timing is continuous, monotone, and rejoins both portal poses', () => {
  const sample = (localT) => poseTimeAt(scene.start + localT, localT);
  for (const localT of [-1, -0.2, 0, 0.2, 1.5, 4, 5.3, 5.8, 6, 6.2, 7]) {
    assert.equal(sample(localT), scene.start + localT, 'outside the tableau both sides of a portal need the original phase');
  }
  const step = 0.0001;
  let previous = sample(-1);
  for (let i = 1; i <= 80000; i += 1) {
    const next = sample(-1 + i * step);
    assert.ok(Number.isFinite(next));
    assert.ok(next >= previous - 1e-10, 'catching up must not reverse the pedals');
    assert.ok(next - previous < step * 7, 'time mapping must not jump at a hold/release boundary');
    previous = next;
  }
});
