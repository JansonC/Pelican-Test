import assert from 'node:assert/strict';
import { writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { options, ensureParent, run } from './lib/runtime.mjs';
import { fingerprint } from './lib/fingerprint.mjs';

const args = options({ fps: { type: 'string', default: '30' }, resume: { type: 'boolean', default: false }, overwrite: { type: 'boolean', default: false }, tag: { type: 'string', default: 'stage3-a' } });
if (!/^[a-z0-9-]+$/.test(args.tag)) throw new RangeError('Frame tag must contain lowercase letters, digits and hyphens.');
const fps = Number(args.fps);
if (![30, 60].includes(fps)) throw new RangeError('Stage demo fps must be 30 or 60.');
const directory = 'out/stage3-a';
const segments = [
  { id: 'egypt', from: 10.5, to: 17.5 },
  { id: 'han', from: 16.5, to: 23.5 },
  { id: 'tang', from: 22.5, to: 29.5 },
  { id: 'qingming', from: 34.5, to: 41.5 },
];
const source = await fingerprint();
await ensureParent(`${directory}/batch-a.mp4`);
for (const { id, from, to } of segments) {
  const frames = `frames/${args.tag}-${id}-${fps}`;
  await run(process.execPath, ['tools/render.mjs', '--fps', String(fps), '--from', String(from), '--to', String(to), '--out', frames, ...(args.resume ? ['--resume'] : [])]);
  const manifest = JSON.parse(await readFile(`${frames}/manifest.json`, 'utf8'));
  assert.equal(manifest.fingerprint, source, 'All segments must use the same source.');
  await run(process.execPath, ['tools/encode.mjs', '--frames', frames, '--out', `${directory}/${id}.mp4`, ...(args.overwrite ? ['--overwrite'] : [])]);
}
const concat = `${directory}/segments.ffconcat`;
await writeFile(concat, `ffconcat version 1.0\n${segments.map(({ id }) => `file '${id}.mp4'`).join('\n')}\n`);
await run(process.env.FFMPEG_PATH || 'ffmpeg', [args.overwrite ? '-y' : '-n', '-hide_banner', '-loglevel', 'warning', '-f', 'concat', '-safe', '1', '-i', resolve(concat), '-c', 'copy', '-movflags', '+faststart', resolve(`${directory}/batch-a.mp4`)]);

const frameSources = segments.map(({ id }) => `frames/${args.tag}-${id}-${fps}`).join(',');
await run(process.execPath, ['tools/sheet.mjs', '--frames', frameSources, '--times', '12.3,14,16.3,18.3,20,22.3,24.3,26,28.3,36.3,38,40.3', '--cols', '3', '--out', `${directory}/contact-sheet.png`]);
await run(process.execPath, ['tools/sheet.mjs', '--frames', frameSources, '--times', '14,20,26,38', '--cols', '2', '--out', `${directory}/highlights.png`]);
const boundaries = [11, 17, 23, 29, 35, 41].flatMap((t) => [t - 1 / fps, t, t + 1 / fps]).map((t) => t.toFixed(6));
await run(process.execPath, ['tools/sheet.mjs', '--frames', frameSources, '--times', boundaries.join(','), '--cols', '3', '--out', `${directory}/boundaries.png`]);

const execute = promisify(execFile);
const files = [...segments.map(({ id }) => ({ id, seconds: 7 })), { id: 'batch-a', seconds: 28 }];
const verification = [];
for (const { id, seconds } of files) {
  const file = resolve(`${directory}/${id}.mp4`);
  const { stdout } = await execute('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file], { windowsHide: true });
  const info = JSON.parse(stdout);
  const video = info.streams.find((stream) => stream.codec_type === 'video');
  assert.equal(video.codec_name, 'h264');
  assert.equal(video.width, 1920);
  assert.equal(video.height, 1080);
  const [numerator, denominator] = video.r_frame_rate.split('/').map(Number);
  assert.equal(numerator / denominator, fps);
  assert.equal(Number(video.nb_frames), seconds * fps);
  assert.ok(Math.abs(Number(info.format.duration) - seconds) < 0.001);
  assert.equal(info.streams.filter((stream) => stream.codec_type === 'audio').length, 0);
  await run(process.env.FFMPEG_PATH || 'ffmpeg', ['-v', 'error', '-i', file, '-f', 'null', '-']);
  verification.push({ id, frames: Number(video.nb_frames), seconds, width: video.width, height: video.height, fps, decoded: true, audio: false });
}
assert.equal(await fingerprint(), source, 'Source must remain unchanged throughout export.');
await writeFile(`${directory}/export-verification.json`, `${JSON.stringify({ fingerprint: source, videos: verification }, null, 2)}\n`);
console.log(`Four 7-second scenes, checked H.264 and full decode → ${directory}/batch-a.mp4`);
