import { writeFile } from 'node:fs/promises';
import { ensureParent, options, withRenderer } from './lib/runtime.mjs';
import { normalizeTime } from '../src/beat/timeline.js';

const args = options({ time: { type: 'string', default: '8' }, out: { type: 'string', default: 'out/shot.png' }, url: { type: 'string' } });
const time = normalizeTime(Number(args.time));
await ensureParent(args.out);
await withRenderer(async ({ shot }) => {
  await writeFile(args.out, await shot(time));
  console.log(`${time.toFixed(3)}s → ${args.out}`);
}, args);
