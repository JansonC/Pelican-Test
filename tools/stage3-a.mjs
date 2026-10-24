import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { ensureParent, withRenderer } from './lib/runtime.mjs';
import { fingerprint } from './lib/fingerprint.mjs';
import { SCENES } from '../src/scenes/catalog.js';

const directory = 'out/stage3-a';
const scenes = ['egypt', 'han', 'tang', 'qingming'].map((id) => SCENES.find((scene) => scene.id === id));
const hash = async (png) => createHash('sha256').update(await sharp(png).raw().toBuffer()).digest('hex');
const report = { fingerprint: await fingerprint(), deterministic: [], boundaries: [], renderMilliseconds: {} };
await ensureParent(`${directory}/verification.json`);

async function sheet(samples, columns, output) {
  const overlays = [];
  for (let index = 0; index < samples.length; index += 1) {
    const { png, label, t } = samples[index];
    const left = index % columns * 480;
    const top = Math.floor(index / columns) * 300;
    overlays.push({ input: await sharp(png).resize(480, 270).png().toBuffer(), left, top });
    const caption = `<svg width="480" height="30"><rect width="480" height="30" fill="#252b25"/><text x="12" y="20" font-family="sans-serif" font-size="13" fill="#e4d4b4">${label} / ${t.toFixed(3)} s</text></svg>`;
    overlays.push({ input: Buffer.from(caption), left, top: top + 270 });
  }
  await sharp({ create: { width: columns * 480, height: Math.ceil(samples.length / columns) * 300, channels: 3, background: '#191c1b' } }).composite(overlays).png().toFile(`${directory}/${output}.png`);
}

await withRenderer(async ({ page, shot }) => {
  report.finished = await page.evaluate(async () => {
    const { sceneRenderers } = await import('/src/scenes/index.js');
    return sceneRenderers.filter((renderer) => renderer.finished).map((renderer) => renderer.scene.id);
  });
  for (const id of ['sahara', 'egypt', 'han', 'tang', 'song', 'qingming', 'vertical']) {
    assert.ok(report.finished.includes(id), `${id} must retain its finished artwork`);
  }
  for (const scene of scenes) assert.ok(report.finished.includes(scene.id), `${scene.id} must replace its placeholder`);
  const contact = [];
  for (const scene of scenes) {
    for (const [state, offset] of [['entry', 1.3], ['highlight', 3], ['exit', 5.3]]) {
      const t = scene.start + offset;
      const png = await shot(t);
      const stats = await sharp(png).stats();
      assert.ok(stats.channels[0].stdev > 15, `${scene.id} must contain a complete picture`);
      await writeFile(`${directory}/${scene.id}-${state}.png`, png);
      const first = await hash(png);
      await shot(136.9);
      await shot(89.1);
      assert.equal(await hash(await shot(t)), first, `${scene.id} ${state}: seeking must preserve every pixel`);
      report.deterministic.push({ id: scene.id, state, t, sha256: first });
      contact.push({ png, label: `${scene.number.toString().padStart(2, '0')} ${scene.id} ${state}`, t });
    }
  }
  await sheet(contact, 3, 'contact-sheet');
  const boundaries = [];
  for (const boundary of [11, 17, 23, 29, 35, 41]) {
    for (const delta of [-1 / 30, 0, 1 / 30]) {
      const t = boundary + delta;
      const png = await shot(t);
      const first = await hash(png);
      await shot(t < 25 ? 40 : 12);
      assert.equal(await hash(await shot(t)), first, `${t}: portal frames must be independent of history`);
      boundaries.push({ png, label: `portal ${boundary}`, t });
      report.boundaries.push({ t, sha256: first });
    }
  }
  await sheet(boundaries, 3, 'boundaries');
  const events = [];
  for (const [id, times] of [
    ['egypt', [12.8, 13, 13.5, 14, 14.5, 15]],
    ['han', [18.8, 19.5, 20, 20.5, 21, 21.5]],
    ['tang', [24.8, 25.5, 26, 26.5, 27, 27.5]],
    ['qingming', [36.8, 37.5, 38, 38.5, 39, 39.5]],
  ]) {
    for (const t of times) events.push({ png: await shot(t), label: id, t });
  }
  await sheet(events, 6, 'events');
  report.renderMilliseconds = await page.evaluate((entries) => {
    const results = {};
    for (const { id, start } of entries) {
      const begin = performance.now();
      for (let i = 0; i < 24; i += 1) window.pelican.renderAt(start + 2 + i / 60);
      results[id] = (performance.now() - begin) / 24;
    }
    return results;
  }, scenes.map(({ id, start }) => ({ id, start })));
  await page.setViewport({ width: 1440, height: 1120, deviceScaleFactor: 1 });
  await page.evaluate(() => {
    document.body.classList.remove('export-mode');
    window.pelican.seek(38);
    window.pelican.pause();
  });
  await page.screenshot({ path: `${directory}/preview.png`, fullPage: true });
});
assert.equal(await fingerprint(), report.fingerprint, 'Source must remain unchanged throughout the visual review.');
await writeFile(`${directory}/verification.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ scenes: scenes.length, deterministic: report.deterministic.length, boundaries: report.boundaries.length, renderMilliseconds: report.renderMilliseconds, directory }, null, 2));
