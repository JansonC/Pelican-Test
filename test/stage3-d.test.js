import test from 'node:test';
import assert from 'node:assert/strict';
import { scopeDialAt, vectorIntensityAt } from '../src/scenes/scope.js';
import { jumpAt, coinAt, oneUpAt, animationFrameAt as pixelFrame } from '../src/scenes/pixel.js';
import { windowJitterAt, messageAt, animationFrameAt as chatFrame } from '../src/scenes/chat.js';
import { tapeRateAt, skipAt } from '../src/scenes/vaporwave.js';
import { pathProgressAt, svgPathAt, codeLinesAt } from '../src/scenes/code.js';
import { poseAt } from '../src/rig/pelican.js';

test('Scope reconstructs the wrong-dial Lissajous event from local time', () => {
  assert.equal(scopeDialAt(1.999).wrong, 0);
  assert.ok(scopeDialAt(2.7).wrong > 0 && scopeDialAt(2.7).lissajous);
  assert.ok(scopeDialAt(4.6).settle > 0);
  assert.ok(vectorIntensityAt(3) > vectorIntensityAt(0));
});

test('Pixel scene separates jump, coin, 1UP and 10 Hz animation state', () => {
  assert.equal(jumpAt(1.9), 0);
  assert.ok(jumpAt(3) > 0 && jumpAt(4.1) === 0);
  assert.ok(coinAt(2.5) > coinAt(3.5));
  assert.ok(oneUpAt(3.1) > 0);
  assert.equal(pixelFrame(2.01), 20);
  assert.equal(pixelFrame(2.09), 20);
  assert.equal(pixelFrame(2.11), 21);
});

test('Chat window jitter and GIF frame are deterministic', () => {
  assert.equal(windowJitterAt(1.9).amount, 0);
  assert.ok(windowJitterAt(2.2).amount > 0);
  assert.equal(windowJitterAt(5).amount, 0);
  assert.equal(messageAt(1.999), false);
  assert.equal(messageAt(2), true);
  assert.equal(chatFrame(2.01), 20);
  assert.equal(chatFrame(2.09), 20);
  assert.equal(chatFrame(2.11), 21);
});

test('Vaporwave tape speed and half-beat skips use absolute time', () => {
  assert.ok(Math.abs(tapeRateAt(0) - 1) < 1e-10);
  assert.ok(tapeRateAt(1.5) < 1 && tapeRateAt(3) < 1);
  assert.ok(Math.abs(tapeRateAt(5.8) - 1) < 0.01);
  assert.equal(skipAt(1.999).active, false);
  assert.equal(skipAt(2).active, true);
  assert.equal(skipAt(4).active, false);
});

test('Code scene reveals the same path data in editor and preview', () => {
  assert.equal(pathProgressAt(1.999), 0);
  assert.ok(pathProgressAt(3) > 0 && pathProgressAt(5) === 1);
  assert.ok(svgPathAt(3).length >= 2);
  assert.ok(codeLinesAt(3).length >= 4);
  for (const localT of [2.3, 3, 4.2, 5.5]) {
    const source = codeLinesAt(localT).join('\n');
    const serialized = [...source.matchAll(/<path stroke="([^"]+)" d="([^"]+)"/g)];
    const paths = svgPathAt(localT);
    assert.equal(serialized.length, paths.length);
    paths.forEach((path, index) => {
      assert.equal(serialized[index][1], path.color);
      assert.equal(serialized[index][2].trim().replace(/\s+/g, ' '), path.d);
    });
    assert.deepEqual(paths, svgPathAt(localT, poseAt(119 + localT)));
    assert.ok(codeLinesAt(localT).length <= 19, 'all displayed SVG must fit inside the code pane');
  }
  const wheel = svgPathAt(5).find((path) => path.key === 'wheel');
  assert.ok(wheel.d.startsWith('M -208 0 A 73 73 0 1 0 -62 0'));
});
