import assert from 'node:assert/strict';
import { writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { options, ensureParent, run } from './lib/runtime.mjs';
import { fingerprint } from './lib/fingerprint.mjs';

const args = options({ fps: { type: 'string', default: '30' }, resume: { type: 'boolean', default: false }, overwrite: { type: 'boolean', default: false }, tag: { type: 'string', default: 'stage3-c' } });
if (!/^[a-z0-9-]+$/.test(args.tag)) throw new RangeError('Frame tag must contain lowercase letters, digits and hyphens.');
const fps = Number(args.fps);
if (![30, 60].includes(fps)) throw new RangeError('Stage demo fps must be 30 or 60.');
const directory = 'out/stage3-c';
const segments = [
  { id: 'ukiyo', from: 64.5, to: 71.5, highlight: 68 },
  { id: 'starry', from: 70.5, to: 77.5, highlight: 74 },
  { id: 'scream', from: 76.5, to: 83.5, highlight: 80 },
  { id: 'nosferatu', from: 82.5, to: 89.5, highlight: 86 },
];
const source = await fingerprint();
await ensureParent(`${directory}/batch-c.mp4`);
let review;
try {
  review = JSON.parse(await readFile(`${directory}/verification.json`, 'utf8'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
if (review) assert.equal(review.fingerprint, source, 'Run review:stage3-c again if the artwork has changed.');
for (const { id, from, to } of segments) {
  const frames = `frames/${args.tag}-${id}-${fps}`;
  await run(process.execPath, ['tools/render.mjs', '--fps', String(fps), '--from', String(from), '--to', String(to), '--out', frames, ...(args.resume ? ['--resume'] : [])]);
  const manifest = JSON.parse(await readFile(`${frames}/manifest.json`, 'utf8'));
  assert.equal(manifest.fingerprint, source, 'All segments must use the same source.');
  assert.equal(manifest.status, 'complete');
  await run(process.execPath, ['tools/encode.mjs', '--frames', frames, '--out', `${directory}/${id}.mp4`, ...(args.overwrite ? ['--overwrite'] : [])]);
}
const concat = `${directory}/segments.ffconcat`;
await writeFile(concat, `ffconcat version 1.0\n${segments.map(({ id }) => `file '${id}.mp4'`).join('\n')}\n`);
await run(process.env.FFMPEG_PATH || 'ffmpeg', [args.overwrite ? '-y' : '-n', '-hide_banner', '-loglevel', 'warning', '-f', 'concat', '-safe', '1', '-i', resolve(concat), '-c', 'copy', '-movflags', '+faststart', resolve(`${directory}/batch-c.mp4`)]);

const frameSources = segments.map(({ id }) => `frames/${args.tag}-${id}-${fps}`).join(',');
const contactTimes = segments.flatMap(({ highlight }) => [highlight - 1.7, highlight, highlight + 2.3]);
await run(process.execPath, ['tools/sheet.mjs', '--frames', frameSources, '--times', contactTimes.join(','), '--cols', '3', '--out', `${directory}/contact-sheet.png`]);
await run(process.execPath, ['tools/sheet.mjs', '--frames', frameSources, '--times', segments.map(({ highlight }) => highlight).join(','), '--cols', '2', '--out', `${directory}/highlights.png`]);
const boundaries = [65, 71, 77, 83, 89].flatMap((time) => [time - 1 / fps, time, time + 1 / fps]).map((time) => time.toFixed(6));
await run(process.execPath, ['tools/sheet.mjs', '--frames', frameSources, '--times', boundaries.join(','), '--cols', '3', '--out', `${directory}/boundaries.png`]);

const execute = promisify(execFile);
const files = [...segments.map(({ id }) => ({ id, seconds: 7 })), { id: 'batch-c', seconds: 28 }];
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
await writeFile(`${directory}/export-verification.json`, `${JSON.stringify({ fingerprint: source, videos: verification }, null, 2)}\n`);

if (review) {
  const samples = [];
  for (const { id, state, t: time, sha256 } of review.deterministic) {
    const path = `frames/${args.tag}-${id}-${fps}/${String(Math.round(time * fps)).padStart(6, '0')}.png`;
    const pixels = await sharp(await readFile(path)).raw().toBuffer();
    const actual = createHash('sha256').update(pixels).digest('hex');
    assert.equal(actual, sha256, `${id} ${state}: exported frame must match its reviewed image`);
    samples.push({ id, state, t: time, sha256: actual });
  }
  await writeFile(`${directory}/frame-verification.json`, `${JSON.stringify({ fingerprint: source, samples }, null, 2)}\n`);
}
assert.equal(await fingerprint(), source, 'Source must remain unchanged throughout export.');
console.log(`Four 7-second scenes, checked H.264 and full decode → ${directory}/batch-c.mp4`);
