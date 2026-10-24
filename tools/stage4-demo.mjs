import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';
import { options, ensureParent, run } from './lib/runtime.mjs';
import { fingerprint } from './lib/fingerprint.mjs';
import { CUES } from '../src/beat/events.js';
import { DURATION } from '../src/beat/timeline.js';
import { createScore } from '../audio/score.js';

const args = options({ fps: { type: 'string', default: '30' }, tag: { type: 'string', default: 'stage4-music' }, out: { type: 'string', default: 'out/stage4/pelican-with-music.mp4' }, resume: { type: 'boolean', default: false }, overwrite: { type: 'boolean', default: false }, 'verify-only': { type: 'boolean', default: false } });
if (!/^[a-z0-9-]+$/.test(args.tag)) throw new RangeError('Invalid frame tag');
const fps = Number(args.fps);
if (![30, 60].includes(fps)) throw new RangeError('fps must be 30 or 60');
const source = await fingerprint();
const audio = JSON.parse(await readFile('out/audio/render-verification.json', 'utf8'));
const review = JSON.parse(await readFile('out/audio/verification.json', 'utf8'));
assert.equal(audio.fingerprint, source, 'Run audio:render for the current source');
assert.equal(review.fingerprint, source, 'Run review:audio for the current source');
const directory = dirname(args.out);
const frames = `frames/${args.tag}-${fps}`;
const output = args.out;
await ensureParent(output);
if (!args['verify-only']) {
  await run(process.execPath, ['tools/render.mjs', '--fps', String(fps), '--out', frames, ...(args.resume ? ['--resume'] : [])]);
  await run(process.execPath, ['tools/encode.mjs', '--frames', frames, '--audio', 'out/audio/mix.wav', '--out', output, ...(args.overwrite ? ['--overwrite'] : [])]);
}
const manifest = JSON.parse(await readFile(`${frames}/manifest.json`, 'utf8'));
assert.equal(manifest.fingerprint, source);
assert.equal(manifest.status, 'complete');
assert.equal(manifest.frameCount, DURATION * fps);
await run(process.execPath, ['tools/sheet.mjs', '--frames', frames, '--times', [3, 89, 91, 98, 103, 109, 109.25, 109.5, 109.75, 130, 136.5, 136.9].map((time) => (Math.round(time * fps) / fps).toFixed(6)).join(','), '--cols', '4', '--out', `${directory}/sync-sheet.png`]);
const execute = promisify(execFile);
const { stdout } = await execute('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', resolve(output)], { windowsHide: true });
const info = JSON.parse(stdout);
const video = info.streams.find((stream) => stream.codec_type === 'video');
const track = info.streams.find((stream) => stream.codec_type === 'audio');
assert.equal(video.codec_name, 'h264');
assert.equal(video.width, 1920); assert.equal(video.height, 1080);
assert.equal(Number(video.nb_frames), DURATION * fps);
assert.equal(video.r_frame_rate, `${fps}/1`);
assert.equal(track.codec_name, 'aac'); assert.equal(track.channels, 2); assert.equal(Number(track.sample_rate), 48000);
assert.equal(Number(video.start_time), 0); assert.equal(Number(track.start_time), 0);
assert.ok(Math.abs(Number(info.format.duration) - DURATION) < 0.025);
assert.ok(Math.abs(Number(track.duration) - DURATION) < 0.025);
await run(process.env.FFMPEG_PATH || 'ffmpeg', ['-v', 'error', '-i', resolve(output), '-f', 'null', '-']);
const pictureChecks = [];
for (const time of [3, 89, 98, 103, 109.5, 130, 136.5, 136 + 19 / 30]) {
  const frame = Math.round(time * fps);
  const { stdout: png } = await execute(process.env.FFMPEG_PATH || 'ffmpeg', ['-v', 'error', '-ss', String(frame / fps), '-i', resolve(output), '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', '-'], { windowsHide: true, encoding: 'buffer', maxBuffer: 16 * 1024 * 1024 });
  const reference = await sharp(resolve(frames, `${String(frame).padStart(6, '0')}.png`)).removeAlpha().raw().toBuffer();
  const actual = await sharp(png).removeAlpha().raw().toBuffer();
  assert.equal(actual.length, reference.length);
  let error = 0;
  for (let index = 0; index < reference.length; index += 1) error += Math.abs(actual[index] - reference[index]);
  const meanError = error / reference.length / 255;
  assert.ok(meanError < 0.025, `Decoded picture differs from frame ${frame}: ${meanError}`);
  await writeFile(`${directory}/decoded-${frame}.png`, png);
  pictureChecks.push({ time: frame / fps, frame, normalizedMeanAbsoluteError: meanError });
}
const { stdout: decoded } = await execute(process.env.FFMPEG_PATH || 'ffmpeg', ['-v', 'error', '-i', resolve(output), '-map', '0:a:0', '-f', 's16le', '-acodec', 'pcm_s16le', '-ar', '48000', '-ac', '2', '-'], { windowsHide: true, encoding: 'buffer', maxBuffer: 64 * 1024 * 1024 });
const wav = await readFile('out/audio/mix.wav');
assert.ok(Math.abs(decoded.length / 4 - DURATION * 48000) <= 1024);
const synchronization = [];
for (const { name, time } of [...createScore().markers, { name: 'portal-outro', time: 125 }].filter((marker) => marker.time < DURATION && marker.time !== CUES.musicEnd)) {
  const start = Math.max(0, Math.round((time - 0.02) * 48000));
  const count = Math.min(14400, DURATION * 48000 - start - 1024);
  function similarity(lag) {
    let dot = 0;
    let referenceEnergy = 0;
    let decodedEnergy = 0;
    for (let index = 0; index < count; index += 4) {
      const referenceIndex = start + index;
      const decodedIndex = referenceIndex + lag;
      if (decodedIndex < 0 || (decodedIndex + 1) * 4 > decoded.length) continue;
      const reference = wav.readInt16LE(44 + referenceIndex * 4);
      const sample = decoded.readInt16LE(decodedIndex * 4);
      dot += reference * sample; referenceEnergy += reference * reference; decodedEnergy += sample * sample;
    }
    return dot / Math.sqrt(referenceEnergy * decodedEnergy);
  }
  let best = { lag: 0, correlation: -1 };
  for (let lag = -1024; lag <= 1024; lag += 4) {
    const correlation = similarity(lag);
    if (correlation > best.correlation) best = { lag, correlation };
  }
  const coarse = best.lag;
  for (let lag = coarse - 3; lag <= coarse + 3; lag += 1) {
    const correlation = similarity(lag);
    if (correlation > best.correlation) best = { lag, correlation };
  }
  assert.ok(Math.abs(best.lag) <= 128 && best.correlation > 0.75, `${name}: AAC synchronization ${JSON.stringify(best)}`);
  synchronization.push({ name, time, ...best, milliseconds: best.lag / 48 });
}
assert.equal(await fingerprint(), source, 'Source changed during demo export');
await writeFile(`${directory}/export-verification.json`, `${JSON.stringify({ fingerprint: source, file: output, video, audio: track, duration: Number(info.format.duration), decoded: true, pictureChecks, synchronization }, null, 2)}\n`);
console.log(`137 seconds, ${DURATION * fps} frames, stereo AAC, decoded and checked against WAV → ${output}`);
