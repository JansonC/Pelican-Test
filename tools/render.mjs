import { access, mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { options, withRenderer } from './lib/runtime.mjs';
import { fingerprint } from './lib/fingerprint.mjs';
import { frameTimes, WIDTH, HEIGHT } from '../src/beat/timeline.js';

const args = options({ fps: { type: 'string', default: '30' }, from: { type: 'string', default: '0' }, to: { type: 'string', default: '137' }, out: { type: 'string', default: 'frames/full-30' }, resume: { type: 'boolean', default: false }, url: { type: 'string' } });
const fps = Number(args.fps);
const from = Number(args.from);
const to = Number(args.to);
const times = frameTimes({ from, to, fps });
const directory = resolve(args.out);
await mkdir(directory, { recursive: true });
const manifestPath = resolve(directory, 'manifest.json');
const source = await fingerprint();
const manifest = { version: 1, fps, from, to, width: WIDTH, height: HEIGHT, firstFrame: Math.round(times[0] * fps), frameCount: times.length, fingerprint: source, status: 'rendering', rendered: 0 };
if (args.resume) {
  const previous = JSON.parse(await readFile(manifestPath, 'utf8'));
  for (const field of ['fps', 'from', 'to', 'fingerprint']) {
    if (previous[field] !== manifest[field]) throw new Error(`Cannot resume: ${field} changed; use a new output directory.`);
  }
} else if ((await readdir(directory)).length) {
  throw new Error('Output directory is not empty; use --resume or choose a new directory.');
}
await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
try {
  await withRenderer(async ({ shot }) => {
    for (let index = 0; index < times.length; index += 1) {
      const path = resolve(directory, `${String(manifest.firstFrame + index).padStart(6, '0')}.png`);
      let exists = false;
      if (args.resume) {
        try {
          await access(path);
          const image = await sharp(path).metadata();
          if (image.width === WIDTH && image.height === HEIGHT) {
            await sharp(path).stats();
            exists = true;
          }
        } catch { /* A missing or broken frame is rendered again. */ }
      }
      if (!exists) await writeFile(path, await shot(times[index]));
      manifest.rendered = index + 1;
      if ((index + 1) % 60 === 0 || index + 1 === times.length) {
        await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
        console.log(`${index + 1}/${times.length} frames (${fps} fps)`);
      }
    }
  }, args);
  manifest.status = 'complete';
} finally {
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
}
