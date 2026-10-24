import assert from 'node:assert/strict';
import { open, writeFile } from 'node:fs/promises';
import { options, ensureParent, withRenderer } from './lib/runtime.mjs';
import { fingerprint } from './lib/fingerprint.mjs';
import { createScore, SAMPLE_RATE } from '../audio/score.js';

const args = options({ samples: { type: 'boolean', default: false } });
const source = await fingerprint();
const score = createScore();
await ensureParent('out/audio/mix.wav');
await writeFile('out/audio/score.json', `${JSON.stringify(score, null, 2)}\n`);
await writeFile('out/audio/cues.json', `${JSON.stringify(score.markers.map((marker) => ({ ...marker, sample: Math.round(marker.time * SAMPLE_RATE), frame30: marker.time * 30 })), null, 2)}\n`);
const report = { fingerprint: source, sampleRate: SAMPLE_RATE, files: [] };

await withRenderer(async ({ page }) => {
  let file;
  await page.exposeFunction('saveAudioChunk', async (encoded) => file.write(Buffer.from(encoded, 'base64')));
  for (const spec of [{ name: 'theme', theme: true }, { name: 'vaporwave', from: 107, to: 113 }, ...(!args.samples ? [{ name: 'mix', from: 0, to: 137 }] : [])]) {
    file = await open(`out/audio/${spec.name}.wav`, 'w');
    try {
      console.log(`Synthesizing ${spec.name}…`);
      const result = await page.evaluate(async (settings) => {
        const [{ renderScore, prepareTape }, { createScore, createThemeScore }, { encodeWav, analyzeBuffer }] = await Promise.all([import('/audio/engine.js'), import('/audio/score.js'), import('/audio/wav.js')]);
        const music = settings.theme ? createThemeScore() : createScore();
        if (!settings.theme) window.preparedTape ||= await prepareTape();
        const buffer = await renderScore({ score: music, from: settings.from, to: settings.to, tape: window.preparedTape });
        const bytes = new Uint8Array(encodeWav(buffer));
        for (let offset = 0; offset < bytes.length; offset += 524288) {
          const chunk = bytes.subarray(offset, offset + 524288);
          let binary = '';
          for (let part = 0; part < chunk.length; part += 16384) binary += String.fromCharCode(...chunk.subarray(part, part + 16384));
          await window.saveAudioChunk(btoa(binary));
        }
        const sections = settings.name === 'mix' ? music.sections.map((section) => {
          let energy = 0;
          let peak = 0;
          const samples = buffer.getChannelData(0).subarray(Math.round(section.start * buffer.sampleRate), Math.round(section.end * buffer.sampleRate));
          for (const value of samples) { energy += value * value; peak = Math.max(peak, Math.abs(value)); }
          return { ...section, rmsDb: 10 * Math.log10(energy / samples.length), peak };
        }) : undefined;
        return { ...analyzeBuffer(buffer), sections };
      }, spec);
      assert.ok(result.peak < 0.98, `${spec.name}: keep peak headroom`);
      assert.equal(result.channels, 2);
      report.files.push({ file: `out/audio/${spec.name}.wav`, ...result });
      console.log(`${spec.name}: ${result.seconds}s, peak ${result.peakDb.toFixed(2)} dBFS, RMS ${result.rmsDb.toFixed(2)} dBFS`);
    } finally { await file.close(); }
  }
});
assert.equal(await fingerprint(), source, 'Source changed during audio rendering');
await writeFile(`out/audio/${args.samples ? 'samples' : 'render'}-verification.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Original score, cue samples and ${args.samples ? 'two samples' : '137-second mix'} → out/audio/`);
