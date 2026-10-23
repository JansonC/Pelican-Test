import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { ensureParent, withRenderer } from './lib/runtime.mjs';
import { SCENES } from '../src/scenes/catalog.js';

await ensureParent('out/verification/smoke.json');
const report = { scenes: 20, samples: [], determinism: false, controls: false, brush: false };
const pixelHash = async (buffer) => createHash('sha256').update(await sharp(buffer).raw().toBuffer()).digest('hex');

await withRenderer(async ({ page, shot, browser, url }) => {
  report.brush = (await page.evaluate(() => window.pelican.getState())).brushVerified;
  assert.equal(report.brush, true);
  const firstBuffer = await shot(32);
  await writeFile('out/verification/determinism-first.png', firstBuffer);
  const first = await pixelHash(firstBuffer);
  await shot(133);
  await shot(88.9);
  const secondBuffer = await shot(32);
  await writeFile('out/verification/determinism-return.png', secondBuffer);
  const second = await pixelHash(secondBuffer);
  assert.equal(second, first, 'seeking must not alter a frame');
  const outro = await pixelHash(await shot(136.95));
  await shot(8);
  assert.equal(await pixelHash(await shot(136.95)), outro, 'outro must also be independent of history');
  report.determinism = true;
  for (const scene of SCENES) {
    const buffer = await shot(scene.start + 3);
    const metadata = await sharp(buffer).metadata();
    const stats = await sharp(buffer).stats();
    assert.equal(metadata.width, 1920);
    assert.equal(metadata.height, 1080);
    assert.ok(stats.channels[0].stdev > 10, `${scene.id} must not be blank`);
    report.samples.push({ id: scene.id, time: scene.start + 3, sha256: await pixelHash(buffer) });
  }

  console.log('Canvas, 20 scenes and seek determinism passed. Checking controls…');
  // Release the export page's software WebGL resources before the UI pass.
  await page.close();
  const ui = await browser.newPage();
  await ui.setViewport({ width: 1440, height: 1120, deviceScaleFactor: 1 });
  await ui.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await ui.waitForFunction(() => window.pelican?.ready || window.pelicanError, { timeout: 90000 });
  const startupError = await ui.evaluate(() => window.pelicanError);
  assert.equal(startupError, undefined);
  await ui.select('#scene-select', '29');
  assert.equal(await ui.$eval('#name', (element) => element.textContent), '宋代山水');
  await ui.$eval('#seek', (element) => { element.value = '89'; element.dispatchEvent(new Event('input', { bubbles: true })); });
  assert.equal((await ui.evaluate(() => window.pelican.getState())).frame.index, 14);
  await ui.click('#play');
  await ui.waitForFunction(() => window.pelican.getState().time > 89.2);
  await ui.click('#play');
  assert.equal((await ui.evaluate(() => window.pelican.getState())).playing, false);
  await ui.evaluate(() => window.pelican.seek(3.5));
  await ui.screenshot({ path: 'out/preview.png', fullPage: true });
  await ui.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  assert.equal(await ui.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'mobile must not overflow');
  await ui.close();
  report.controls = true;
});

await writeFile('out/verification/smoke.json', JSON.stringify(report, null, 2));
console.log('20 scenes, 1080p output, brush, seek determinism, playback, selection and mobile layout passed.');
