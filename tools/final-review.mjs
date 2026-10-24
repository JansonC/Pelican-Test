import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { ensureParent, withRenderer } from './lib/runtime.mjs';
import { fingerprint } from './lib/fingerprint.mjs';
import { SCENES } from '../src/scenes/catalog.js';
import { CUES } from '../src/beat/events.js';

const directory = 'out/final/review';
const source = await fingerprint();
const report = { fingerprint: source, frames: [], deterministic: [], captureEquality: [], titles: [], playback: {} };
const hash = async (png) => createHash('sha256').update(await sharp(png).removeAlpha().raw().toBuffer()).digest('hex');
const grid = (time) => Math.round(time * 30) / 30;
await ensureParent(`${directory}/verification.json`);

async function sheet(samples, columns, filename) {
  const overlays = [];
  for (const [index, sample] of samples.entries()) {
    const left = index % columns * 480;
    const top = Math.floor(index / columns) * 300;
    overlays.push({ input: await sharp(sample.png).resize(480, 270).png().toBuffer(), left, top });
    const label = `<svg width="480" height="30"><rect width="480" height="30" fill="#252b25"/><text x="12" y="20" font-family="sans-serif" font-size="13" fill="#e4d4b4">${sample.label} / ${sample.time.toFixed(3)} s</text></svg>`;
    overlays.push({ input: Buffer.from(label), left, top: top + 270 });
  }
  await sharp({ create: { width: columns * 480, height: Math.ceil(samples.length / columns) * 300, channels: 3, background: '#191c1b' } }).composite(overlays).png().toFile(`${directory}/${filename}.png`);
}

await withRenderer(async ({ page, shot, url }) => {
  const samples = new Map();
  async function capture(time, label, filename) {
    time = grid(time);
    const png = await shot(time);
    const stats = await sharp(png).stats();
    assert.ok(stats.channels.some((channel) => channel.stdev > 8), `${label}: picture must be nonempty`);
    const sample = { png, time, label };
    const frame = { time, label, file: `${directory}/${filename}.png`, sha256: await hash(png) };
    await writeFile(frame.file, png);
    report.frames.push(frame);
    samples.set(time, frame);
    return sample;
  }
  async function repeat(time) {
    time = grid(time);
    const expected = samples.get(time);
    await shot(time > 70 ? 8.3 : 135.5);
    assert.equal(await hash(await shot(time)), expected.sha256, `${expected.label}: random seeking must preserve pixels`);
    report.deterministic.push({ time, sha256: expected.sha256 });
  }

  const contact = [];
  for (const scene of SCENES) {
    for (const [state, time] of [['entry', scene.start + 1.3], ['highlight', scene.highlight], ['exit', scene.start + 5.3]]) {
      contact.push(await capture(time, `${scene.number} ${scene.id} ${state}`, `${scene.id}-${state}`));
    }
    await repeat(scene.highlight);
    const screenshot = await page.screenshot({ type: 'png', optimizeForSpeed: true, clip: { x: 0, y: 0, width: 1920, height: 1080 }, captureBeyondViewport: false });
    assert.equal(await hash(screenshot), samples.get(grid(scene.highlight)).sha256, `${scene.id}: direct canvas export must match the browser picture`);
    report.captureEquality.push(scene.id);
    console.log(`Reviewed ${scene.number}/20: ${scene.id}`);
  }
  await sheet(contact.filter(({ label }) => label.endsWith('highlight')), 5, 'highlights');
  for (let index = 0; index < 5; index += 1) await sheet(contact.slice(index * 12, index * 12 + 12), 3, `scenes-${index + 1}`);

  const boundaries = [];
  for (let index = 0; index <= 20; index += 1) {
    const time = 5 + index * 6;
    for (const [state, offset] of [['before', -1 / 30], ['crossing', 0], ['after', 1 / 30]]) {
      boundaries.push(await capture(time + offset, `portal ${time} ${state}`, `portal-${time}-${state}`));
    }
    await repeat(time);
  }
  for (let index = 0; index < 3; index += 1) await sheet(boundaries.slice(index * 21, index * 21 + 21), 3, `boundaries-${index + 1}`);
  const ending = [];
  for (const time of [125, 125.25, 125.6, 126.5, 127, 128, 129.1, 130.1, 131, 131.5, 133, 135, 136.5, 136.6, 136.7, 136.8, 136.9, 137]) {
    ending.push(await capture(time, 'outro', `outro-${Math.round(time * 30)}`));
    if (time === 136.6) {
      const screenshot = await page.screenshot({ type: 'png', optimizeForSpeed: true, clip: { x: 0, y: 0, width: 1920, height: 1080 }, captureBeyondViewport: false });
      assert.equal(await hash(screenshot), samples.get(grid(time)).sha256, 'Outro canvas export must match the browser picture');
      report.captureEquality.push('outro');
    }
  }
  await sheet(ending, 3, 'outro');
  for (const time of [125, 126.5, 131.5, 136.6, 137]) await repeat(time);
  const intro = [];
  for (const time of [0.5, 1.5, 3.3, 4.8]) intro.push(await capture(time, 'intro', `intro-${Math.round(time * 30)}`));
  await sheet(intro, 2, 'intro');

  report.titles = await page.evaluate(async () => {
    const { sceneRenderers } = await import('/src/scenes/index.js');
    const { poseAt } = await import('/src/rig/pelican.js');
    return sceneRenderers.map((renderer) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1778; canvas.height = 1000;
      const ctx = canvas.getContext('2d');
      const lines = [];
      ctx.fillText = (value, left, baseline) => {
        const bounds = ctx.measureText(value);
        const corners = [
          [left - bounds.actualBoundingBoxLeft, baseline - bounds.actualBoundingBoxAscent],
          [left + bounds.actualBoundingBoxRight, baseline - bounds.actualBoundingBoxAscent],
          [left - bounds.actualBoundingBoxLeft, baseline + bounds.actualBoundingBoxDescent],
          [left + bounds.actualBoundingBoxRight, baseline + bounds.actualBoundingBoxDescent],
        ].map(([horizontal, vertical]) => new DOMPoint(horizontal, vertical).matrixTransform(ctx.getTransform()));
        lines.push({ value, font: ctx.font, left: Math.min(...corners.map((point) => point.x)), right: Math.max(...corners.map((point) => point.x)), top: Math.min(...corners.map((point) => point.y)), bottom: Math.max(...corners.map((point) => point.y)) });
      };
      const time = renderer.scene.start + 3;
      if (renderer.renderTitle) renderer.renderTitle(ctx, { x: 110, t: time, localT: 3, pose: poseAt(time) });
      else renderer.renderOverlay(ctx, { t: time });
      return { id: renderer.scene.id, lines };
    });
  });
  const compact = (value) => value.toUpperCase().replace(/[\s-]/g, '');
  for (const title of report.titles) {
    const scene = SCENES.find(({ id }) => id === title.id);
    const content = compact(title.lines.map(({ value }) => value).join(''));
    for (const value of [scene.zh, scene.en, scene.era]) assert.ok(content.includes(compact(value)), `${scene.id}: missing title ${value}`);
    for (const bounds of title.lines) {
      assert.ok(bounds.left >= 40 && bounds.right <= 1738 && bounds.top >= 20 && bounds.bottom <= 990, `${scene.id}: title outside safe area ${JSON.stringify(bounds)}`);
    }
  }

  await page.setViewport({ width: 1440, height: 1120, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForFunction(() => window.pelican?.ready || window.pelicanError, { timeout: 90000 });
  assert.equal(await page.evaluate(() => window.pelicanError), undefined);
  await page.evaluate(() => window.pelican.seek(3.5));
  assert.equal(await page.$eval('#seek', (element) => Number(element.value)), 3.5);
  await page.screenshot({ path: `${directory}/desktop.png`, fullPage: true });
  await page.click('#fullscreen');
  await page.waitForFunction(() => Boolean(document.fullscreenElement));
  const full = await page.$eval('.transport', (element) => ({ bottom: element.getBoundingClientRect().bottom, viewport: innerHeight }));
  assert.ok(full.bottom <= full.viewport + 1, 'Fullscreen controls must remain visible');
  await page.screenshot({ path: `${directory}/fullscreen.png` });
  await page.evaluate(() => document.exitFullscreen());
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Mobile must not overflow');
  await page.screenshot({ path: `${directory}/mobile.png`, fullPage: true });
  await page.evaluate(() => window.pelican.seek(136.4));
  await page.click('#play');
  await page.waitForFunction(() => !window.pelican.getState().playing && window.pelican.getState().time === 137, { timeout: 60000 });
  report.playback = { fullscreenControls: full, mobileFits: true, stopsAtEnd: true, bell: CUES.bell };
});

assert.equal(await fingerprint(), source, 'Source changed during final review');
await writeFile(`${directory}/verification.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Reviewed ${report.frames.length} pictures, ${report.deterministic.length} repeated frames, twenty titles, fullscreen and mobile → ${directory}`);
