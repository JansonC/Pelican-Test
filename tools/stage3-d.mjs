import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { ensureParent, withRenderer } from './lib/runtime.mjs';
import { fingerprint } from './lib/fingerprint.mjs';
import { SCENES } from '../src/scenes/catalog.js';

const directory = 'out/stage3-d';
const scenes = ['scope', 'pixel', 'chat', 'vaporwave', 'code'].map((id) => SCENES.find((scene) => scene.id === id));
const hash = async (png) => createHash('sha256').update(await sharp(png).raw().toBuffer()).digest('hex');
const report = { fingerprint: await fingerprint(), deterministic: [], boundaries: [], events: {}, renderMilliseconds: {} };
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
  for (const scene of SCENES) assert.ok(report.finished.includes(scene.id), `${scene.id} must provide finished artwork`);
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
      await shot(12.1);
      assert.equal(await hash(await shot(time)), first, `${scene.id} ${state}: seeking must preserve every pixel`);
      report.deterministic.push({ id: scene.id, state, t: time, sha256: first });
      contact.push({ png, label: `${String(scene.number).padStart(2, '0')} ${scene.id} ${state}`, t: time });
    }
  }
  await sheet(contact, 3, 'contact-sheet');
  await sheet(contact.filter(({ label }) => label.endsWith('highlight')), 5, 'highlights');

  const boundaries = [];
  for (const boundary of [89, 95, 101, 107, 113, 119]) {
    for (const delta of [-1 / 30, 0, 1 / 30]) {
      const time = boundary + delta;
      const png = await shot(time);
      const first = await hash(png);
      await shot(time < 101 ? 116 : 86);
      assert.equal(await hash(await shot(time)), first, `${time}: portal frames must be independent of history`);
      boundaries.push({ png, label: `portal ${boundary}`, t: time });
      report.boundaries.push({ t: time, sha256: first });
    }
  }
  await sheet(boundaries, 3, 'boundaries');

  const eventTimes = {
    scope: [90.3, 91, 91.5, 92, 93, 94.3],
    pixel: [96.3, 97, 97.5, 98, 99, 100.3],
    chat: [102.3, 103, 103.5, 104, 105, 106.3],
    vaporwave: [108.3, 109, 109.5, 110, 111, 112.3],
    code: [120.3, 121, 121.5, 122, 123, 124.3],
  };
  const events = [];
  for (const [id, times] of Object.entries(eventTimes)) {
    report.events[id] = times;
    for (const time of times) events.push({ png: await shot(time), label: id, t: time });
  }
  await sheet(events, 6, 'events');

  report.eventFunctions = await page.evaluate(async () => {
    const [{ scopeDialAt, vectorIntensityAt }, { jumpAt, coinAt, oneUpAt, animationFrameAt: pixelFrame }, { windowJitterAt, messageAt, animationFrameAt: chatFrame }, { tapeRateAt, skipAt }, { pathProgressAt, svgPathAt, codeLinesAt }] = await Promise.all([
      import('/src/scenes/scope.js'), import('/src/scenes/pixel.js'), import('/src/scenes/chat.js'), import('/src/scenes/vaporwave.js'), import('/src/scenes/code.js'),
    ]);
    return {
      scope: { before: scopeDialAt(1.9), wrong: scopeDialAt(2.7), settled: scopeDialAt(4.6), intensity: vectorIntensityAt(3) },
      pixel: { before: jumpAt(1.9), peak: jumpAt(3), after: jumpAt(4.1), coinBefore: coinAt(2.5), coinAfter: coinAt(3.5), oneUp: oneUpAt(3.1), frame: [pixelFrame(2.01), pixelFrame(2.09)] },
      chat: { before: windowJitterAt(1.9), shake: windowJitterAt(2.2), after: windowJitterAt(5), message: messageAt(2), frame: [chatFrame(2.01), chatFrame(2.09)] },
      vaporwave: { enter: tapeRateAt(0), slow: tapeRateAt(1.5), steady: tapeRateAt(3), restore: tapeRateAt(5.8), skip: [skipAt(1.9), skipAt(2.25), skipAt(3.75), skipAt(4.1)] },
      code: { before: pathProgressAt(1.9), middle: pathProgressAt(3), after: pathProgressAt(5), pathCount: svgPathAt(3).length, lineCount: codeLinesAt(3).length },
    };
  });
  assert.equal(report.eventFunctions.scope.before.wrong, 0);
  assert.ok(report.eventFunctions.scope.wrong.wrong > 0 && report.eventFunctions.scope.wrong.lissajous);
  assert.ok(report.eventFunctions.scope.settled.settle > 0);
  assert.equal(report.eventFunctions.pixel.before, 0);
  assert.ok(report.eventFunctions.pixel.peak > 0 && report.eventFunctions.pixel.after === 0);
  assert.ok(report.eventFunctions.pixel.coinBefore > report.eventFunctions.pixel.coinAfter);
  assert.ok(report.eventFunctions.pixel.oneUp > 0);
  assert.equal(report.eventFunctions.chat.before.amount, 0);
  assert.ok(report.eventFunctions.chat.shake.amount > 0 && report.eventFunctions.chat.after.amount === 0);
  assert.equal(report.eventFunctions.chat.message, true);
  assert.equal(report.eventFunctions.vaporwave.skip[0].active, false);
  assert.equal(report.eventFunctions.vaporwave.skip[1].active, true);
  assert.ok(report.eventFunctions.vaporwave.slow < report.eventFunctions.vaporwave.enter);
  assert.ok(Math.abs(report.eventFunctions.vaporwave.restore - 1) < 0.01);
  assert.equal(report.eventFunctions.code.before, 0);
  assert.ok(report.eventFunctions.code.middle > 0 && report.eventFunctions.code.after === 1);
  assert.ok(report.eventFunctions.code.pathCount >= 2 && report.eventFunctions.code.lineCount >= 4);
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
  await page.evaluate(() => { document.body.classList.remove('export-mode'); window.pelican.seek(104); window.pelican.pause(); });
  await page.screenshot({ path: `${directory}/preview.png`, fullPage: true });
});
assert.equal(await fingerprint(), report.fingerprint, 'Source must remain unchanged throughout the visual review.');
await writeFile(`${directory}/verification.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ scenes: scenes.length, deterministic: report.deterministic.length, boundaries: report.boundaries.length, eventFunctions: report.eventFunctions, renderMilliseconds: report.renderMilliseconds, directory }, null, 2));
