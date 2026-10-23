import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { options, ensureParent, run } from './lib/runtime.mjs';

const args = options({ fps: { type: 'string', default: '30' }, resume: { type: 'boolean', default: false }, overwrite: { type: 'boolean', default: false }, tag: { type: 'string', default: 'stage2' } });
if (!/^[a-z0-9-]+$/.test(args.tag)) throw new RangeError('Frame tag must contain lowercase letters, digits and hyphens.');
const fps = Number(args.fps);
if (![30, 60].includes(fps)) throw new RangeError('Stage demo fps must be 30 or 60.');
const segments = [
  { id: 'sahara', from: 4.5, to: 11.5 },
  { id: 'song', from: 28.5, to: 35.5 },
  { id: 'vertical', from: 112.5, to: 119.5 },
];
await ensureParent('out/stage2/three-studies.mp4');
for (const { id, from, to } of segments) {
  const frames = `frames/${args.tag}-${id}-${fps}`;
  await run(process.execPath, ['tools/render.mjs', '--fps', String(fps), '--from', String(from), '--to', String(to), '--out', frames, ...(args.resume ? ['--resume'] : [])]);
  await run(process.execPath, ['tools/encode.mjs', '--frames', frames, '--out', `out/stage2/${id}.mp4`, ...(args.overwrite ? ['--overwrite'] : [])]);
}
const concat = 'out/stage2/segments.ffconcat';
await writeFile(concat, `ffconcat version 1.0\n${segments.map(({ id }) => `file '${id}.mp4'`).join('\n')}\n`);
await run(process.env.FFMPEG_PATH || 'ffmpeg', [args.overwrite ? '-y' : '-n', '-hide_banner', '-loglevel', 'warning', '-f', 'concat', '-safe', '1', '-i', resolve(concat), '-c', 'copy', '-movflags', '+faststart', resolve('out/stage2/three-studies.mp4')]);
const frameSources = segments.map(({ id }) => `frames/${args.tag}-${id}-${fps}`).join(',');
await run(process.execPath, ['tools/sheet.mjs', '--frames', frameSources, '--times', '5.5,7,7.8,10.5,29.5,30.6,32.2,34.5,113.5,115.8,116.5,118.5', '--cols', '4', '--out', 'out/stage2/contact-sheet.png']);
await run(process.execPath, ['tools/sheet.mjs', '--frames', frameSources, '--times', '4.9,5,5.1,10.9,11,11.1,28.9,29,29.1,34.9,35,35.1,112.9,113,113.1,118.9,119,119.1', '--cols', '6', '--out', 'out/stage2/boundaries.png']);
console.log('Three 7-second scenes with adjacent portals → out/stage2/three-studies.mp4');
