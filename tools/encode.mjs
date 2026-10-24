import { readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { ensureParent, options, run } from './lib/runtime.mjs';

const args = options({ frames: { type: 'string', default: 'frames/full-30' }, out: { type: 'string', default: 'out/pelican-silent.mp4' }, audio: { type: 'string' }, overwrite: { type: 'boolean', default: false } });
const directory = resolve(args.frames);
const manifest = JSON.parse(await readFile(resolve(directory, 'manifest.json'), 'utf8'));
if (manifest.status !== 'complete' || manifest.rendered !== manifest.frameCount) throw new Error('The frame export is incomplete.');
for (let index = 0; index < manifest.frameCount; index += 1) {
  await access(resolve(directory, `${String(manifest.firstFrame + index).padStart(6, '0')}.png`));
}
await ensureParent(args.out);
const ffmpegArgs = [args.overwrite ? '-y' : '-n', '-hide_banner', '-loglevel', 'warning', '-framerate', String(manifest.fps), '-start_number', String(manifest.firstFrame), '-i', resolve(directory, '%06d.png')];
if (args.audio) ffmpegArgs.push('-ss', String(manifest.firstFrame / manifest.fps), '-i', resolve(args.audio), '-c:a', 'aac', '-b:a', '192k');
else ffmpegArgs.push('-an');
ffmpegArgs.push('-t', String(manifest.frameCount / manifest.fps), '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', resolve(args.out));
await run(process.env.FFMPEG_PATH || 'ffmpeg', ffmpegArgs);
console.log(`${manifest.frameCount} frames / ${manifest.fps} fps → ${args.out}`);
