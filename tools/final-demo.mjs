import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cp, readFile, writeFile } from 'node:fs/promises';
import { preview } from 'vite';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { ROOT, options, run, withRenderer } from './lib/runtime.mjs';
import { fingerprint } from './lib/fingerprint.mjs';

const args = options({ fps: { type: 'string', default: '30' }, tag: { type: 'string', default: 'final' }, resume: { type: 'boolean', default: false }, overwrite: { type: 'boolean', default: false }, 'verify-only': { type: 'boolean', default: false } });
if (!/^[a-z0-9-]+$/.test(args.tag)) throw new RangeError('Invalid frame tag');
if (![30, 60].includes(Number(args.fps))) throw new RangeError('fps must be 30 or 60');
const directory = 'out/final';
const output = `${directory}/pelican-test.mp4`;

if (!args['verify-only']) {
  await run(process.execPath, ['--test']);
  await run(process.execPath, ['tools/check.mjs']);
  await run(process.execPath, ['tools/notices.mjs']);
  await run(process.execPath, ['node_modules/vite/bin/vite.js', 'build']);
  const current = await fingerprint();
  for (const [file, command] of [['out/audio/render-verification.json', 'tools/audio.mjs'], ['out/audio/verification.json', 'tools/audio-review.mjs'], [`${directory}/review/verification.json`, 'tools/final-review.mjs']]) {
    let existing;
    try { existing = JSON.parse(await readFile(file, 'utf8')); } catch { existing = undefined; }
    if (existing?.fingerprint !== current) await run(process.execPath, [command]);
  }
}
const source = await fingerprint();
const review = JSON.parse(await readFile(`${directory}/review/verification.json`, 'utf8'));
assert.equal(review.fingerprint, source, 'Run review:final for the current source');
await run(process.execPath, ['tools/stage4-demo.mjs', '--fps', args.fps, '--tag', args.tag, '--out', output, ...(args.resume ? ['--resume'] : []), ...(args.overwrite ? ['--overwrite'] : []), ...(args['verify-only'] ? ['--verify-only'] : [])]);
const pixelHash = async (png) => createHash('sha256').update(await sharp(png).removeAlpha().raw().toBuffer()).digest('hex');
const frames = `frames/${args.tag}-${args.fps}`;
const frameChecks = [];
for (const reference of review.frames.filter(({ time }) => time < 137)) {
  const frame = Math.round(reference.time * Number(args.fps));
  const png = await readFile(`${frames}/${String(frame).padStart(6, '0')}.png`);
  const actual = await pixelHash(png);
  let rasterVariation;
  if (actual !== reference.sha256) {
    const rendered = await sharp(png).removeAlpha().raw().toBuffer();
    const reviewed = await sharp(reference.file).removeAlpha().raw().toBuffer();
    assert.equal(rendered.length, reviewed.length);
    let error = 0;
    let maximumChannelDifference = 0;
    let differingPixels = 0;
    for (let offset = 0; offset < rendered.length; offset += 3) {
      let changed = false;
      for (let channel = 0; channel < 3; channel += 1) {
        const difference = Math.abs(rendered[offset + channel] - reviewed[offset + channel]);
        error += difference;
        maximumChannelDifference = Math.max(maximumChannelDifference, difference);
        changed ||= difference > 0;
      }
      if (changed) differingPixels += 1;
    }
    rasterVariation = { maximumChannelDifference, normalizedMeanAbsoluteError: error / rendered.length / 255, differingPixelFraction: differingPixels / (rendered.length / 3) };
    assert.ok(maximumChannelDifference <= 8 && rasterVariation.normalizedMeanAbsoluteError <= 0.00005 && rasterVariation.differingPixelFraction <= 0.02, `Exported picture differs from reviewed picture ${reference.label} at ${reference.time}: ${JSON.stringify(rasterVariation)}`);
  }
  frameChecks.push({ time: reference.time, frame, sha256: actual, reviewedSha256: reference.sha256, ...(rasterVariation ? { rasterVariation } : {}) });
}
await writeFile(`${directory}/frame-verification.json`, `${JSON.stringify({ fingerprint: source, frames: frameChecks }, null, 2)}\n`);

const server = await preview({ root: ROOT, configFile: resolve(ROOT, 'vite.config.js'), preview: { host: '127.0.0.1', port: 0, strictPort: false }, logLevel: 'error' });
try {
  await withRenderer(async ({ page, shot }) => {
    assert.equal(await pixelHash(await shot(131.5)), review.frames.find(({ time }) => time === 131.5).sha256, 'Production build must match the reviewed picture');
    await page.goto(server.resolvedUrls.local[0], { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForFunction(() => window.pelican?.ready || window.pelicanError, { timeout: 90000 });
    assert.equal(await page.evaluate(() => window.pelicanError), undefined);
    await page.evaluate(() => window.pelican.seek(131.5));
    assert.equal(await page.$eval('#seek', (element) => Number(element.value)), 131.5);
    assert.equal(await page.$eval('#name', (element) => element.textContent), '新闻发布会');
    await page.setViewport({ width: 1440, height: 1120, deviceScaleFactor: 1 });
    await page.screenshot({ path: `${directory}/browser-preview.png`, fullPage: true });
    await page.select('#scene-select', '113');
    assert.equal((await page.evaluate(() => window.pelican.getState())).frame.index, 18);
    await page.evaluate(() => window.pelican.seek(136.4));
    await page.click('#play');
    await page.waitForFunction(() => !window.pelican.getState().playing && window.pelican.getState().time === 137, { timeout: 60000 });
    const state = await page.evaluate(() => window.pelican.getState());
    assert.ok(state.audio.ready && state.brushVerified);
  }, { url: server.resolvedUrls.local[0] });
} finally {
  await new Promise((resolveClose, reject) => server.httpServer.close((error) => error ? reject(error) : resolveClose()));
}
await cp('dist', `${directory}/browser`, { recursive: true });
assert.equal(await fingerprint(), source, 'Source changed during final export');
const film = await readFile(output);
await writeFile(`${directory}/delivery.json`, `${JSON.stringify({ fingerprint: source, file: output, bytes: film.length, sha256: createHash('sha256').update(film).digest('hex'), browser: `${directory}/browser`, productionPlayback: true, fps: Number(args.fps), seconds: 137, videoVerification: `${directory}/export-verification.json`, visualVerification: `${directory}/review/verification.json`, frameVerification: `${directory}/frame-verification.json`, audioVerification: 'out/audio/verification.json' }, null, 2)}\n`);
console.log(`Final film and production browser preview → ${directory}`);
