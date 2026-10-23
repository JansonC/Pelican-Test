import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { ensureParent, options, withRenderer } from './lib/runtime.mjs';
import { SCENES } from '../src/scenes/catalog.js';
import { normalizeTime } from '../src/beat/timeline.js';

const args = options({ times: { type: 'string' }, cols: { type: 'string', default: '4' }, out: { type: 'string', default: 'out/contact-sheet.png' }, url: { type: 'string' }, frames: { type: 'string' } });
const times = args.times ? args.times.split(',').map((t) => normalizeTime(Number(t))) : [1.5, 3.5, ...SCENES.map((scene) => scene.start + 3), 126.5, 128, 132.5, 136.9];
const columns = Number(args.cols);
if (!Number.isInteger(columns) || columns < 1 || columns > 8) throw new RangeError('cols must be 1–8');
const width = 480;
const height = 300;
const overlays = [];
await ensureParent(args.out);
async function collect(shot) {
  for (let index = 0; index < times.length; index += 1) {
    const png = await sharp(await shot(times[index])).resize(width, 270).png().toBuffer();
    const x = index % columns * width;
    const y = Math.floor(index / columns) * height;
    overlays.push({ input: png, left: x, top: y });
    const label = `<svg width="480" height="30"><rect width="480" height="30" fill="#252b25"/><text x="14" y="20" font-family="sans-serif" font-size="13" fill="#e4d4b4">${String(index + 1).padStart(2, '0')}  /  t = ${times[index].toFixed(3)} s</text></svg>`;
    overlays.push({ input: Buffer.from(label), left: x, top: y + 270 });
  }
}
if (args.frames) {
  const sources = await Promise.all(args.frames.split(',').map(async (directory) => {
    const manifest = JSON.parse(await readFile(resolve(directory, 'manifest.json'), 'utf8'));
    if (manifest.status !== 'complete') throw new Error(`Incomplete frame source: ${directory}`);
    return { directory, ...manifest };
  }));
  if (new Set(sources.map(({ fingerprint }) => fingerprint)).size !== 1) throw new Error('Frame sources have different source fingerprints.');
  await collect(async (time) => {
    const source = sources.find(({ fps, firstFrame, frameCount }) => {
      const frame = Math.round(time * fps);
      return frame >= firstFrame && frame < firstFrame + frameCount;
    });
    if (!source) throw new RangeError(`No exported frame for ${time}s.`);
    const frame = Math.round(time * source.fps);
    if (Math.abs(time - frame / source.fps) > 0.0001) throw new RangeError(`${time}s is not on the exported ${source.fps} fps grid.`);
    return readFile(resolve(source.directory, `${String(frame).padStart(6, '0')}.png`));
  });
} else {
  await withRenderer(async ({ shot }) => collect(shot), args);
}
await sharp({ create: { width: columns * width, height: Math.ceil(times.length / columns) * height, channels: 3, background: '#191c1b' } }).composite(overlays).png().toFile(args.out);
console.log(`${times.length} frames → ${args.out}`);
