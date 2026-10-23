import test from 'node:test';
import assert from 'node:assert/strict';
import { DURATION, SCENE_COUNT, OUTRO_START, locate, sceneStart, beatAt, frameTimes } from '../src/beat/timeline.js';
import { SCENES } from '../src/scenes/catalog.js';
import { sceneRenderers } from '../src/scenes/index.js';

test('all twenty scene boundaries are downbeats after the two-beat pickup', () => {
  assert.equal(DURATION, 137);
  assert.equal(OUTRO_START, 125);
  assert.equal(SCENES.length, SCENE_COUNT);
  assert.equal(new Set(SCENES.map((scene) => scene.id)).size, 20);
  SCENES.forEach((scene, index) => {
    const start = sceneStart(index);
    assert.equal(beatAt(start) % 4, 0);
    assert.equal(locate(start).index, index);
    assert.equal(locate(start - 1e-6).index, index - 1);
    assert.equal(sceneRenderers[index].scene.id, scene.id);
    assert.equal(typeof sceneRenderers[index].renderAt, 'function');
  });
  assert.equal(locate(125).kind, 'outro');
  assert.equal(locate(137).localT, 12);
  assert.throws(() => locate(NaN));
});

test('adjacent frame jobs partition the full sequence without duplicates or missing frames', () => {
  for (const fps of [30, 60]) {
    const full = frameTimes({ fps });
    assert.equal(full.length, 137 * fps);
    const split = [...frameTimes({ fps, to: 89 }), ...frameTimes({ fps, from: 89 })];
    assert.deepEqual(split, full);
    assert.equal(new Set(split).size, full.length);
    assert.ok(full.at(-1) < 137);
  }
  assert.throws(() => frameTimes({ fps: 24 }));
});
