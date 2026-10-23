import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { ensureParent, withRenderer } from './lib/runtime.mjs';

await ensureParent('out/stage2/verification.json');
const samples = [
  ['sahara', 7.8], ['song-wide', 30.6], ['song-found', 32.15], ['vertical', 115.8],
  ['vertical-comments', 116.5],
];
const report = { deterministic: [], portrait: null, renderMilliseconds: null };
const hash = async (png) => createHash('sha256').update(await sharp(png).raw().toBuffer()).digest('hex');
await withRenderer(async ({ page, shot }) => {
  for (const [id, t] of samples) {
    const first = await shot(t);
    await writeFile(`out/stage2/${id}.png`, first);
    await shot(136.9);
    await shot(89);
    assert.equal(await hash(await shot(t)), await hash(first), `${id}: random seeking must preserve every pixel`);
    report.deterministic.push({ id, t, sha256: await hash(first) });
  }
  const portrait = await shot(116);
  for (const x of [0, 1270]) {
    const { data, info } = await sharp(portrait).extract({ left: x, top: 0, width: 650, height: 1080 }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let i = 0; i < data.length; i += info.channels) {
      assert.deepEqual([...data.subarray(i, i + 3)], [9, 13, 15], 'portrait side bars must be opaque and empty');
    }
  }
  report.portrait = { content: '607.5 × 1080 px (9:16)', opaqueSideBars: true };
  report.renderMilliseconds = await page.evaluate(() => {
    const results = {};
    for (const [id, from] of [['sahara', 7], ['song', 31], ['vertical', 115]]) {
      const start = performance.now();
      for (let i = 0; i < 30; i += 1) window.pelican.renderAt(from + i / 60);
      results[id] = (performance.now() - start) / 30;
    }
    return results;
  });
  await page.setViewport({ width: 1440, height: 1120, deviceScaleFactor: 1 });
  await page.evaluate(() => {
    document.body.classList.remove('export-mode');
    window.pelican.seek(7.8);
    window.pelican.pause();
  });
  await page.screenshot({ path: 'out/stage2/preview.png', fullPage: true });
});
await writeFile('out/stage2/verification.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
