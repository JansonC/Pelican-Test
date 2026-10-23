import test from 'node:test';
import assert from 'node:assert/strict';
import { poseAt } from '../src/rig/pelican.js';

test('feet stay on opposite pedals, repeat every two beats, and remain reachable', () => {
  for (let sample = 0; sample < 100; sample += 1) {
    const t = sample * 0.137;
    const pose = poseAt(t);
    const repeated = poseAt(t + 1);
    assert.ok(Math.hypot(pose.nearFoot.x - repeated.nearFoot.x, pose.nearFoot.y - repeated.nearFoot.y) < 1e-9);
    assert.ok(Math.abs(pose.nearFoot.x + pose.farFoot.x + 40) < 1e-9);
    assert.ok(Math.abs(pose.nearFoot.y + pose.farFoot.y + 8) < 1e-9);
    for (const side of ['near', 'far']) {
      const knee = pose[`${side}Knee`];
      const foot = pose[`${side}Foot`];
      assert.ok(Math.abs(Math.hypot(knee.x - pose.hip.x, knee.y - pose.hip.y) - 98) < 1e-6);
      assert.ok(Math.abs(Math.hypot(foot.x - knee.x, foot.y - knee.y) - 105) < 1e-6);
    }
  }
});
