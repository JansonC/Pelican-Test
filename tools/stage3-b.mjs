import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { ensureParent, withRenderer } from './lib/runtime.mjs';
import { fingerprint } from './lib/fingerprint.mjs';
import { SCENES } from '../src/scenes/catalog.js';

const directory = 'out/stage3-b';
const scenes = ['maya', 'mughal', 'bada', 'wayang'].map((id) => SCENES.find((scene) => scene.id === id));
const hash = async (png) => createHash('sha256').update(await sharp(png).raw().toBuffer()).digest('hex');
const report = { fingerprint: await fingerprint(), deterministic: [], boundaries: [], renderMilliseconds: {} };
await ensureParent(`${directory}/verification.json`);

async function sheet(samples, columns, output) {
  const overlays = [];
  for (let index = 0; index < samples.length; index += 1) {
    const { png, label, t: time } = samples[index];
    const left = index % columns * 480;
    const top = Math.floor(index / columns) * 300;
    overlays.push({ input: await sharp(png).resize(480, 270).png().toBuffer(), left, top });
    const caption = `<svg width="480" height="30"><rect width="480" height="30" fill="#252b25"/><text x="12" y="20" font-family="sans-serif" font-size="13" fill="#e4d4b4">${label} / ${time.toFixed(3)} s</text></svg>`;
    overlays.push({ input: Buffer.from(caption), left, top: top + 270 });
  }
  await sharp({ create: { width: columns * 480, height: Math.ceil(samples.length / columns) * 300, channels: 3, background: '#191c1b' } }).composite(overlays).png().toFile(`${directory}/${output}.png`);
}

await withRenderer(async ({ page, shot }) => {
  report.finished = await page.evaluate(async () => {
    const { sceneRenderers } = await import('/src/scenes/index.js');
    return sceneRenderers.filter((renderer) => renderer.finished).map((renderer) => renderer.scene.id);
  });
  for (const id of ['sahara', 'egypt', 'han', 'tang', 'song', 'qingming', 'maya', 'mughal', 'bada', 'wayang', 'vertical']) {
    assert.ok(report.finished.includes(id), `${id} must provide finished artwork`);
  }
  const contact = [];
  for (const scene of scenes) {
    assert.equal(scene.status, 'study');
    for (const [state, offset] of [['entry', 1.3], ['highlight', 3], ['exit', 5.3]]) {
      const time = scene.start + offset;
      const png = await shot(time);
      const stats = await sharp(png).stats();
      assert.ok(stats.channels[0].stdev > 15, `${scene.id} must contain a complete picture`);
      await writeFile(`${directory}/${scene.id}-${state}.png`, png);
      const first = await hash(png);
      await shot(136.9);
      await shot(89.1);
      assert.equal(await hash(await shot(time)), first, `${scene.id} ${state}: seeking must preserve every pixel`);
      report.deterministic.push({ id: scene.id, state, t: time, sha256: first });
      contact.push({ png, label: `${String(scene.number).padStart(2, '0')} ${scene.id} ${state}`, t: time });
    }
  }
  await sheet(contact, 3, 'contact-sheet');
  await sheet(contact.filter(({ label }) => label.endsWith('highlight')), 2, 'highlights');
  const boundaries = [];
  for (const boundary of [41, 47, 53, 59, 65]) {
    for (const delta of [-1 / 30, 0, 1 / 30]) {
      const time = boundary + delta;
      const png = await shot(time);
      const first = await hash(png);
      await shot(time < 53 ? 62 : 44);
      assert.equal(await hash(await shot(time)), first, `${time}: portal frames must be independent of history`);
      boundaries.push({ png, label: `portal ${boundary}`, t: time });
      report.boundaries.push({ t: time, sha256: first });
    }
  }
  await sheet(boundaries, 3, 'boundaries');
  const events = [];
  for (const [id, times] of [
    ['maya', [42.8, 43, 43.5, 44, 45, 46]],
    ['mughal', [48.8, 49, 49.5, 50, 50.5, 51]],
    ['bada', [54.8, 55, 55.15, 55.3, 56, 57]],
    ['wayang', [60.8, 61, 61.5, 62, 62.5, 63]],
  ]) {
    for (const time of times) events.push({ png: await shot(time), label: id, t: time });
  }
  await sheet(events, 6, 'events');
  report.puppet = await page.evaluate(async () => {
    const renderer = await import('/src/scenes/wayang.js');
    const { poseAt } = await import('/src/rig/pelican.js');
    const { quantizeTime } = await import('/src/beat/timeline.js');
    const samples = [62.301, 62.399, 62.401].map((time) => {
      const canvas = document.createElement('canvas');
      canvas.width = 700;
      canvas.height = 900;
      renderer.renderRider(canvas.getContext('2d'), poseAt(quantizeTime(time, renderer.scene.updateHz)), { x: 300, y: 500, scale: 1, t: time, localT: time - renderer.scene.start });
      return canvas.toDataURL();
    });
    return { updateHz: renderer.scene.updateHz, holdsWithinTick: samples[0] === samples[1], changesNextTick: samples[1] !== samples[2] };
  });
  assert.equal(report.puppet.updateHz, 10);
  assert.equal(report.puppet.holdsWithinTick, true, 'The complete puppet, including control rods, must hold within a 10 Hz tick.');
  assert.equal(report.puppet.changesNextTick, true, 'The puppet must update on the next tick.');
  report.puppet.worldRemainsSmooth = await hash(await shot(62.301)) !== await hash(await shot(62.399));
  assert.equal(report.puppet.worldRemainsSmooth, true, 'World travel must remain independent of puppet quantization.');
  report.renderMilliseconds = await page.evaluate((entries) => {
    const results = {};
    for (const { id, start } of entries) {
      const begin = performance.now();
      for (let index = 0; index < 24; index += 1) window.pelican.renderAt(start + 2 + index / 60);
      results[id] = (performance.now() - begin) / 24;
    }
    return results;
  }, scenes.map(({ id, start }) => ({ id, start })));
  await page.setViewport({ width: 1440, height: 1120, deviceScaleFactor: 1 });
  await page.evaluate(() => {
    document.body.classList.remove('export-mode');
    window.pelican.seek(50);
    window.pelican.pause();
  });
  await page.screenshot({ path: `${directory}/preview.png`, fullPage: true });
});
assert.equal(await fingerprint(), report.fingerprint, 'Source must remain unchanged throughout the visual review.');
await writeFile(`${directory}/verification.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ scenes: scenes.length, deterministic: report.deterministic.length, boundaries: report.boundaries.length, puppet: report.puppet, renderMilliseconds: report.renderMilliseconds, directory }, null, 2));
