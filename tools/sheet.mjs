import sharp from 'sharp';
import { ensureParent, options, withRenderer } from './lib/runtime.mjs';
import { SCENES } from '../src/scenes/catalog.js';
import { normalizeTime } from '../src/beat/timeline.js';

const args = options({ times: { type: 'string' }, cols: { type: 'string', default: '4' }, out: { type: 'string', default: 'out/contact-sheet.png' }, url: { type: 'string' } });
const times = args.times ? args.times.split(',').map((t) => normalizeTime(Number(t))) : [1.5, 3.5, ...SCENES.map((scene) => scene.start + 3), 126.5, 128, 132.5, 136.9];
const columns = Number(args.cols);
if (!Number.isInteger(columns) || columns < 1 || columns > 8) throw new RangeError('cols must be 1–8');
const width = 480;
const height = 300;
const overlays = [];
await ensureParent(args.out);
await withRenderer(async ({ shot }) => {
  for (let index = 0; index < times.length; index += 1) {
    const png = await sharp(await shot(times[index])).resize(width, 270).png().toBuffer();
    const x = index % columns * width;
    const y = Math.floor(index / columns) * height;
    overlays.push({ input: png, left: x, top: y });
    const label = `<svg width="480" height="30"><rect width="480" height="30" fill="#252b25"/><text x="14" y="20" font-family="sans-serif" font-size="13" fill="#e4d4b4">${String(index + 1).padStart(2, '0')}  /  t = ${times[index].toFixed(3)} s</text></svg>`;
    overlays.push({ input: Buffer.from(label), left: x, top: y + 270 });
  }
}, args);
await sharp({ create: { width: columns * width, height: Math.ceil(times.length / columns) * height, channels: 3, background: '#191c1b' } }).composite(overlays).png().toFile(args.out);
console.log(`${times.length} frames → ${args.out}`);
