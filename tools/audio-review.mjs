import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { ensureParent, withRenderer } from './lib/runtime.mjs';
import { fingerprint } from './lib/fingerprint.mjs';
import { createScore, SAMPLE_RATE } from '../audio/score.js';

const source = await fingerprint();
const rendered = JSON.parse(await readFile('out/audio/render-verification.json', 'utf8'));
assert.equal(rendered.fingerprint, source, 'Run audio:render after changing audio or scene sources');
const report = { fingerprint: source, sampleRate: SAMPLE_RATE, sections: createScore().sections.length };
await ensureParent('out/stage4/preview.png');

await withRenderer(async ({ page, url }) => {
  report.audio = await page.evaluate(async () => {
    const [{ renderScore, prepareTape }, { createScore }, { voiceLength }] = await Promise.all([import('/audio/engine.js'), import('/audio/score.js'), import('/audio/instruments.js')]);
    const score = createScore();
    const bytes = await (await fetch('/out/audio/mix.wav')).arrayBuffer();
    const original = new DataView(bytes);
    const tape = await prepareTape();
    const ranges = [];
    for (const [from, to] of [[2.75, 3.5], [90.75, 91.75], [97.5, 98.75], [108.75, 110.5], [136.25, 137]]) {
      const buffer = await renderScore({ score, from, to, tape });
      let maximumError = 0;
      for (let channel = 0; channel < 2; channel += 1) {
        const samples = buffer.getChannelData(channel);
        for (let index = 0; index < samples.length; index += 1) {
          const expected = original.getInt16(44 + ((Math.round(from * buffer.sampleRate) + index) * 2 + channel) * 2, true) / 32768;
          maximumError = Math.max(maximumError, Math.abs(samples[index] - expected));
        }
      }
      ranges.push({ from, to, maximumError });
    }
    const onsets = [];
    const events = score.events.filter((event) => event.cue || (event.section !== 'outro' && score.sections.some((section) => section.start === event.time)));
    const unique = events.filter((event, index) => event.cue || events.findIndex((other) => other.time === event.time) === index);
    for (const event of unique) {
      const from = Math.max(0, event.time - 0.025);
      const to = Math.min(score.duration, event.time + 0.25);
      const buffer = await renderScore({ score: { ...score, events: [event] }, from, to, tape });
      const samples = buffer.getChannelData(0);
      const onset = samples.findIndex((value) => Math.abs(value) > 1 / 32768);
      onsets.push({ name: event.cue || `portal-${event.section}`, time: event.time, expectedSample: Math.round(event.time * buffer.sampleRate), actualSample: onset < 0 ? null : Math.round(from * buffer.sampleRate) + onset });
    }
    let quietPeak = 0;
    for (let index = Math.round(134 * 48000); index < Math.round(136.5 * 48000); index += 1) {
      for (let channel = 0; channel < 2; channel += 1) quietPeak = Math.max(quietPeak, Math.abs(original.getInt16(44 + (index * 2 + channel) * 2, true)) / 32768);
    }
    let finalPeak = 0;
    for (let index = Math.round(136.999 * 48000); index < 137 * 48000; index += 1) finalPeak = Math.max(finalPeak, Math.abs(original.getInt16(44 + index * 4, true)) / 32768);
    const chip = score.events.filter((event) => event.section === 'pixel');
    return { ranges, onsets, quietPeak, finalPeak, chipChannels: [...new Set(chip.map((event) => event.channel))], chipVoices: chip.length, longestChipVoice: Math.max(...chip.map(voiceLength)) };
  });
  for (const range of report.audio.ranges) assert.ok(range.maximumError < 0.00015, `Audio seek reconstruction ${range.from}: ${range.maximumError}`);
  for (const onset of report.audio.onsets) {
    assert.ok(onset.actualSample !== null, `${onset.name} must sound`);
    assert.ok(onset.actualSample >= onset.expectedSample && onset.actualSample - onset.expectedSample < 72, `${onset.name} onset must be within 1.5 ms of the score`);
  }
  assert.equal(report.audio.quietPeak, 0, 'The pause before the bell must be silent');
  assert.ok(report.audio.finalPeak < 0.0001, 'The final bell must finish within the film');

  await page.setViewport({ width: 1440, height: 1120, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForFunction(() => window.pelican?.ready || window.pelicanError, { timeout: 90000 });
  assert.equal(await page.evaluate(() => window.pelicanError), undefined);
  await page.evaluate(() => window.pelican.seek(89));
  await page.click('#play');
  await page.waitForFunction(() => window.pelican.getState().audio.ready && window.pelican.getState().time > 89.2, { timeout: 60000 });
  const running = await page.evaluate(() => window.pelican.getState());
  assert.equal(running.audio.preparedVoices, createScore().events.length - 1);
  assert.ok(Math.abs(running.time - running.audio.time) < 0.2, 'Visuals must follow the audio output clock');
  await page.click('#mute');
  assert.equal((await page.evaluate(() => window.pelican.getState())).audio.muted, true);
  await page.$eval('#seek', (element) => { element.value = '109.125'; element.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.waitForFunction(() => window.pelican.getState().time > 109.2);
  const sought = await page.evaluate(() => window.pelican.getState());
  assert.ok(sought.time < 110.5 && sought.audio.playing);
  await page.$eval('#seek', (element) => { element.value = '125'; element.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.waitForFunction(() => window.pelican.getState().time > 125.2);
  const unison = await page.evaluate(() => window.pelican.getState());
  assert.ok(Math.abs(unison.time - unison.audio.time) < 0.2 && unison.audio.activeSources >= 5, 'Seeking into the unison must preserve the audio clock');
  await page.click('#play');
  const paused = await page.evaluate(() => window.pelican.getState());
  assert.equal(paused.audio.playing, false);
  assert.equal(paused.audio.activeSources, 0);
  await page.waitForFunction((time) => window.pelican.getState().time === time, {}, paused.time);
  await page.click('#mute');
  assert.equal((await page.evaluate(() => window.pelican.getState())).audio.muted, false);
  await page.evaluate(() => window.pelican.seek(136.4));
  await page.click('#play');
  await page.waitForFunction(() => !window.pelican.getState().playing && window.pelican.getState().time === 137, { timeout: 10000 });
  report.playback = { audioClock: true, mute: true, seekWhilePlaying: true, unisonPrepared: true, pauseStopsSources: true, stopsAtEnd: true, running, sought, unison, paused };
  await page.evaluate(() => window.pelican.seek(110.125));
  assert.equal(await page.$eval('#time', (element) => element.textContent), '1:50');
  assert.equal(await page.$eval('#name', (element) => element.textContent), '蒸汽波');
  await page.screenshot({ path: 'out/stage4/preview.png', fullPage: true });
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Audio controls must fit mobile');
  await page.screenshot({ path: 'out/stage4/mobile.png', fullPage: true });
});
assert.equal(await fingerprint(), source, 'Source changed during audio review');
await writeFile('out/audio/verification.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(`Checked ${report.audio.onsets.length} sample onsets, five seek windows, four chip channels, final silence and live audio controls.`);
