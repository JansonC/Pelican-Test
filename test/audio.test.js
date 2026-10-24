import test from 'node:test';
import assert from 'node:assert/strict';
import { createScore, MOTIF, SAMPLE_RATE } from '../audio/score.js';
import { CUES, TAPE, tapeRateAt, tapeSkipAt, tapePositionAt } from '../src/beat/events.js';
import { synthesize, voiceLength } from '../audio/instruments.js';
import { encodeWav } from '../audio/wav.js';

test('the original score is deterministic, bounded and covers every scene', () => {
  const score = createScore();
  assert.deepEqual(createScore(), score);
  assert.equal(score.duration, 137);
  assert.equal(score.sections.length, 22);
  assert.equal(new Set(score.events.map((event) => event.id)).size, score.events.length);
  for (const event of score.events) {
    assert.ok(event.time >= 0 && event.time < event.end && event.end <= 137);
    assert.ok(event.duration > 0 && Number.isFinite(event.midi) && event.gain > 0);
    assert.ok(event.instrument === 'tape' || event.time + voiceLength(event) <= event.end + 1e-8);
  }
  for (const section of score.sections.slice(1, 21)) {
    assert.ok(score.events.some((event) => event.section === section.id && event.time === section.start));
    if (['pixel', 'vaporwave'].includes(section.id)) continue;
    const phrase = score.events.filter((event) => event.section === section.id && event.pan === -0.08);
    assert.deepEqual(phrase.map((event) => event.time - section.start), MOTIF.map(([beat]) => beat * 0.5));
  }
  const bell = score.events.find((event) => event.cue === 'bell');
  assert.equal(bell.time, 136.5);
  assert.ok(score.events.every((event) => event.time < CUES.musicEnd || event === bell));
});

test('the pixel section has exactly four monophonic chip channels including effects', () => {
  const events = createScore().events.filter((event) => event.section === 'pixel');
  const types = { square1: 'square', square2: 'square', triangle: 'triangle', noise: 'chipnoise' };
  assert.deepEqual([...new Set(events.map((event) => event.channel))].sort(), Object.keys(types).sort());
  for (const [channel, instrument] of Object.entries(types)) {
    const notes = events.filter((event) => event.channel === channel);
    for (const [index, event] of notes.entries()) {
      assert.equal(event.instrument, instrument);
      if (index) assert.ok(notes[index - 1].time + voiceLength(notes[index - 1]) <= event.time + 1e-8, `${channel} overlaps at ${event.time}`);
    }
  }
});

test('tape speed returns to 120 BPM and four half-beat loops share visual timing', () => {
  const sourceBpm = 120 / TAPE.rate;
  assert.ok(Math.abs(sourceBpm * tapeRateAt(3.5) - 120) < 1e-10);
  assert.ok(Math.abs(TAPE.semitones + 12 * Math.log2(TAPE.rate)) < 1e-10);
  assert.equal(TAPE.loopSeconds, 0.25);
  for (let repeat = 0; repeat < 4; repeat += 1) {
    assert.equal(tapeSkipAt(2.125 + repeat * 0.25).count, repeat);
    assert.ok(Math.abs(tapePositionAt(2.125) - tapePositionAt(2.125 + repeat * 0.25)) < 1e-10);
  }
  assert.equal(tapeSkipAt(3).active, false);
  assert.equal(tapeRateAt(0), 1);
  assert.equal(tapeRateAt(6), 1);
  assert.equal(CUES.tapeResume, CUES.tapeSkip + TAPE.repeats * TAPE.loopSeconds);
});

test('voices are seeded, finite, have bounded tails and clean ends', () => {
  for (const instrument of ['pipa', 'xiao', 'sitar', 'strings', 'chipnoise', 'bell']) {
    const event = { instrument, midi: 74, time: 10, end: 10.4, duration: 0.2 };
    const first = synthesize(event, SAMPLE_RATE);
    assert.deepEqual(synthesize(event, SAMPLE_RATE), first);
    assert.ok(first.length <= 0.4 * SAMPLE_RATE + 1);
    assert.equal(first[0], 0);
    assert.ok(first.every(Number.isFinite));
    assert.ok(Math.abs(first.at(-1)) < 0.01);
  }
});

test('PCM WAV stores stereo sample positions and rejects clipping', () => {
  const channels = [new Float32Array([0, -1, 0.5]), new Float32Array([1, 0, -0.5])];
  const bytes = encodeWav({ numberOfChannels: 2, sampleRate: SAMPLE_RATE, length: 3, getChannelData: (channel) => channels[channel] });
  const view = new DataView(bytes);
  assert.equal(bytes.byteLength, 56);
  assert.equal(view.getUint32(24, true), SAMPLE_RATE);
  assert.equal(view.getUint32(40, true), 12);
  assert.deepEqual(Array.from({ length: 6 }, (_, index) => view.getInt16(44 + index * 2, true)), [0, 32767, -32768, 0, 16384, -16384]);
  assert.throws(() => encodeWav({ numberOfChannels: 1, sampleRate: SAMPLE_RATE, length: 1, getChannelData: () => [1.01] }), /clipped/);
});
