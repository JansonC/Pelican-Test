import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { ensureParent, withRenderer } from './lib/runtime.mjs';
import { fingerprint } from './lib/fingerprint.mjs';
import { SCENES } from '../src/scenes/catalog.js';

const directory = 'out/stage3-c';
const scenes = ['ukiyo', 'starry', 'scream', 'nosferatu'].map((id) => SCENES.find((scene) => scene.id === id));
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
  for (const id of ['sahara', 'egypt', 'han', 'tang', 'song', 'qingming', 'maya', 'mughal', 'bada', 'wayang', 'ukiyo', 'starry', 'scream', 'nosferatu', 'vertical']) {
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
      await shot(12.1);
      assert.equal(await hash(await shot(time)), first, `${scene.id} ${state}: seeking must preserve every pixel`);
      report.deterministic.push({ id: scene.id, state, t: time, sha256: first });
      contact.push({ png, label: `${String(scene.number).padStart(2, '0')} ${scene.id} ${state}`, t: time });
    }
  }
  await sheet(contact, 3, 'contact-sheet');
  const boundaries = [];
  for (const boundary of [65, 71, 77, 83, 89]) {
    for (const delta of [-1 / 30, 0, 1 / 30]) {
      const time = boundary + delta;
      const png = await shot(time);
      const first = await hash(png);
      await shot(time < 77 ? 86 : 68);
      assert.equal(await hash(await shot(time)), first, `${time}: portal frames must be independent of history`);
      boundaries.push({ png, label: `portal ${boundary}`, t: time });
      report.boundaries.push({ t: time, sha256: first });
    }
  }
  await sheet(boundaries, 3, 'boundaries');
  const eventTimes = {
    ukiyo: [66.3, 67, 67.5, 68, 69, 70.3],
    starry: [72.3, 73, 73.5, 74, 75, 76.3],
    scream: [78.3, 79, 79.5, 80, 81, 82.3],
    nosferatu: [84.3, 85, 85.5, 86, 87, 88.3],
  };
  const events = [];
  for (const [id, times] of Object.entries(eventTimes)) {
    report.events[id] = times;
    for (const time of times) events.push({ png: await shot(time), label: id, t: time });
  }
  await sheet(events, 6, 'events');
  report.eventFunctions = await page.evaluate(async () => {
    const [{ hatWindAt }, { starOrbitAt }, { waveTensionAt, pedestrianAt }, { shadowAt, shadowOutlineAt }, { poseAt }] = await Promise.all([
      import('/src/scenes/ukiyo.js'), import('/src/scenes/starry.js'), import('/src/scenes/scream.js'), import('/src/scenes/nosferatu.js'), import('/src/rig/pelican.js'),
    ]);
    const pose = poseAt(86);
    return {
      ukiyo: [hatWindAt(1.9), hatWindAt(3), hatWindAt(4.1)],
      starry: [starOrbitAt(1.9), starOrbitAt(3), starOrbitAt(5)],
      scream: [waveTensionAt(1.9), waveTensionAt(2.5), pedestrianAt(2.2, 0).mouth, pedestrianAt(2.2, 1).mouth],
      nosferatu: { before: shadowAt(1.5), peak: shadowAt(3), after: shadowAt(5), outlineLength: shadowOutlineAt(6, pose).length, finite: shadowOutlineAt(6, pose).every(([x, y]) => Number.isFinite(x) && Number.isFinite(y)) },
    };
  });
  assert.equal(report.eventFunctions.ukiyo[0], 0);
  assert.ok(report.eventFunctions.ukiyo[1] > 0 && report.eventFunctions.ukiyo[2] > report.eventFunctions.ukiyo[1]);
  assert.equal(report.eventFunctions.starry[0], 0);
  assert.ok(report.eventFunctions.starry[1] > 0 && report.eventFunctions.starry[2] > report.eventFunctions.starry[1]);
  assert.equal(report.eventFunctions.scream[0], 0);
  assert.ok(report.eventFunctions.scream[1] > 0);
  assert.ok(report.eventFunctions.scream[2] > report.eventFunctions.scream[3]);
  assert.equal(report.eventFunctions.nosferatu.before.tension, 0);
  assert.ok(report.eventFunctions.nosferatu.peak.tension > 0);
  assert.equal(report.eventFunctions.nosferatu.after.tension, 0);
  assert.ok(report.eventFunctions.nosferatu.outlineLength >= 20);
  assert.equal(report.eventFunctions.nosferatu.finite, true);
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
    window.pelican.seek(80);
    window.pelican.pause();
  });
  await page.screenshot({ path: `${directory}/preview.png`, fullPage: true });
});
assert.equal(await fingerprint(), report.fingerprint, 'Source must remain unchanged throughout the visual review.');
await writeFile(`${directory}/verification.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ scenes: scenes.length, deterministic: report.deterministic.length, boundaries: report.boundaries.length, eventFunctions: report.eventFunctions, renderMilliseconds: report.renderMilliseconds, directory }, null, 2));
