import { CUES, TAPE, tapePositionAt } from '../src/beat/events.js';
import { createScore, MOTIF, SAMPLE_RATE } from './score.js';
import { randomFor, synthesize, voiceLength } from './instruments.js';

function impulse(context, seconds, seed, gated = false) {
  const buffer = context.createBuffer(2, Math.ceil(seconds * context.sampleRate), context.sampleRate);
  for (let channel = 0; channel < 2; channel += 1) {
    const random = randomFor(seed + channel * 719);
    const samples = buffer.getChannelData(channel);
    let energy = 0;
    for (let index = 0; index < samples.length; index += 1) {
      const time = index / context.sampleRate;
      samples[index] = time < 0.012 ? 0 : random() * Math.exp(-time * (gated ? 3 : 7) / seconds) * Math.min(1, (seconds - time) / 0.015);
      energy += samples[index] ** 2;
    }
    const scale = 0.8 / Math.sqrt(energy);
    for (let index = 0; index < samples.length; index += 1) samples[index] *= scale;
    for (const [time, gain] of [[0.017, 0.23], [0.037, 0.15], [0.061, 0.1]]) samples[Math.round(time * context.sampleRate)] += gain;
  }
  return buffer;
}

function curve(gain, from, to, startAt, valueAt) {
  const values = Float32Array.from({ length: Math.max(2, Math.ceil((to - from) * 40) + 1) }, (_, index) => valueAt(from + (to - from) * index / (Math.max(2, Math.ceil((to - from) * 40) + 1) - 1)));
  gain.setValueCurveAtTime(values, startAt, Math.max(0.001, to - from));
}

function fadeAt(time) {
  const position = Math.min(1, Math.max(0, (time - 127) / (CUES.musicEnd - 127)));
  return 1 - position * position * (3 - 2 * position);
}

function routing(context, { from, to, startAt, muted = false }) {
  const master = context.createGain();
  master.gain.value = muted ? 0 : 0.8;
  const music = context.createGain();
  curve(music.gain, from, to, startAt, fadeAt);
  const room = context.createConvolver();
  room.normalize = false;
  room.buffer = impulse(context, 1.2, 8127);
  const wet = context.createGain();
  curve(wet.gain, from, to, startAt, (time) => {
    if ((time >= 95 && time < 101) || (time >= 107 && time < 113)) return 0;
    return 0.18 * fadeAt(time);
  });
  const highpass = context.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = 28;
  music.connect(master);
  room.connect(wet).connect(master);
  master.connect(highpass).connect(context.destination);
  return { master, music, room, wet, highpass, dispose() { for (const node of [master, music, room, wet, highpass]) node.disconnect(); } };
}

function toneBuffer(context, event) {
  const samples = synthesize(event, context.sampleRate);
  const buffer = context.createBuffer(1, Math.max(1, samples.length), context.sampleRate);
  buffer.copyToChannel(samples, 0);
  return buffer;
}

function schedule(context, graph, event, buffer, startAt, offset = 0) {
  if (offset >= buffer.duration) return null;
  const source = context.createBufferSource();
  source.buffer = buffer;
  const gain = context.createGain();
  gain.gain.value = event.gain;
  const pan = context.createStereoPanner();
  pan.pan.value = event.pan || 0;
  source.connect(gain).connect(pan);
  pan.connect(event.role === 'final' ? graph.master : graph.music);
  if (event.section !== 'pixel' && event.instrument !== 'tape' && event.role !== 'final') pan.connect(graph.room);
  source.start(startAt, offset);
  source.onended = () => { source.disconnect(); gain.disconnect(); pan.disconnect(); };
  return source;
}

export async function prepareTape(sampleRate = SAMPLE_RATE) {
  const sourceBeat = 0.5 * TAPE.rate;
  const preRoll = 1;
  const context = new OfflineAudioContext(2, Math.ceil(10 * sampleRate), sampleRate);
  const dry = context.createGain();
  dry.gain.value = 0.66;
  dry.connect(context.destination);
  const room = context.createConvolver();
  room.normalize = false;
  room.buffer = impulse(context, TAPE.reverbSeconds, 180043);
  const wet = context.createGain();
  wet.gain.value = 0.68;
  room.connect(wet).connect(context.destination);
  const gated = context.createConvolver();
  gated.normalize = false;
  gated.buffer = impulse(context, 0.19, 180044, true);
  const drumWet = context.createGain();
  drumWet.gain.value = 0.5;
  gated.connect(drumWet).connect(context.destination);
  function note(beat, duration, instrument, midi, gain, pan = 0) {
    const time = preRoll + beat * sourceBeat;
    const event = { time, duration: duration * sourceBeat, end: 10, instrument, midi: midi + TAPE.semitones + (instrument === 'bass' ? 0.18 : 0), gain, pan, ...(instrument === 'bass' ? { bend: -0.18 } : {}) };
    const source = context.createBufferSource();
    source.buffer = toneBuffer(context, event);
    if (time + source.buffer.duration <= 0) return;
    const volume = context.createGain();
    volume.gain.value = gain;
    const panner = context.createStereoPanner();
    panner.pan.value = pan;
    source.connect(volume).connect(panner).connect(dry);
    panner.connect(instrument === 'gatedsnare' ? gated : room);
    source.start(Math.max(0, time), Math.max(0, -time));
  }
  const chords = [[50, 57, 60, 64, 65], [46, 53, 57, 62, 65], [48, 55, 59, 62, 64], [50, 57, 60, 64, 65]];
  for (let bar = -1; bar < 5; bar += 1) {
    const chord = chords[(bar + 4) % 4];
    for (const [voice, midi] of chord.entries()) note(bar * 4 + voice * 0.035, 3.5, 'epiano', midi, 0.16, (voice - 2) * 0.19);
    for (let beat = 0; beat < 4; beat += 1) {
      note(bar * 4 + beat, 0.72, 'bass', chord[0] - 12 + (beat === 3 ? 7 : 0), 0.28, -0.08);
      note(bar * 4 + beat, 0.23, 'kick', 36, 0.29);
      if (beat % 2) note(bar * 4 + beat, 0.38, 'gatedsnare', 54, 0.26, 0.09);
      note(bar * 4 + beat + 0.5, 0.13, 'hat', 70, 0.065, 0.45);
    }
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  for (const [beat, midi, length] of MOTIF) note(beat, length, 'sax', midi - 12, 0.24, -0.27);
  const rendered = await context.startRendering();
  const output = new AudioBuffer({ numberOfChannels: 2, length: 6 * sampleRate, sampleRate });
  for (let channel = 0; channel < 2; channel += 1) {
    const input = rendered.getChannelData(channel);
    const samples = output.getChannelData(channel);
    const random = randomFor(180071 + channel);
    let noise = 0;
    for (let index = 0; index < samples.length; index += 1) {
      const time = index / sampleRate;
      const wow = 0.0014 * Math.sin(Math.PI * 2 * TAPE.wowHz * time);
      const position = (preRoll + tapePositionAt(time) + wow) * sampleRate;
      const left = Math.max(0, Math.min(input.length - 2, Math.floor(position)));
      const fraction = position - Math.floor(position);
      noise = noise * 0.75 + random() * 0.25;
      const gate = Math.min(1, time / 0.035, (6 - time) / 0.07);
      samples[index] = ((input[left] * (1 - fraction) + input[left + 1] * fraction) + noise * 0.0015) * gate;
    }
  }
  const finish = new OfflineAudioContext(2, 6 * sampleRate, sampleRate);
  const source = finish.createBufferSource();
  source.buffer = output;
  const filter = finish.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = TAPE.lowpassHz;
  filter.Q.value = 0.45;
  source.connect(filter).connect(finish.destination);
  source.start();
  return finish.startRendering();
}

export async function renderScore({ score = createScore(), from = 0, to = score.duration, sampleRate = SAMPLE_RATE, tape } = {}) {
  if (!Number.isFinite(from) || !Number.isFinite(to) || from < 0 || from >= to || to > score.duration) throw new RangeError('Invalid audio render range');
  const first = Math.round(from * sampleRate);
  const last = Math.round(to * sampleRate);
  const preRoll = Math.max(0, from - 5);
  const context = new OfflineAudioContext(2, last - Math.round(preRoll * sampleRate), sampleRate);
  const graph = routing(context, { from: preRoll, to, startAt: 0 });
  if (!tape && score.events.some((event) => event.instrument === 'tape' && event.time < to && event.end > preRoll)) tape = await prepareTape(sampleRate);
  for (const event of score.events) {
    if (event.time >= to || event.end <= preRoll) continue;
    const length = event.instrument === 'tape' ? 6 : voiceLength(event);
    if (event.time + length <= preRoll) continue;
    const buffer = event.instrument === 'tape' ? tape : toneBuffer(context, event);
    schedule(context, graph, event, buffer, Math.max(0, event.time - preRoll), Math.max(0, preRoll - event.time));
  }
  const rendered = await context.startRendering();
  const result = new AudioBuffer({ numberOfChannels: 2, length: last - first, sampleRate });
  const offset = first - Math.round(preRoll * sampleRate);
  for (let channel = 0; channel < 2; channel += 1) result.copyToChannel(rendered.getChannelData(channel).subarray(offset, offset + result.length), channel);
  graph.dispose();
  return result;
}

export function createAudioTransport({ score = createScore() } = {}) {
  let context;
  let tape;
  let prepared;
  let graph;
  let timer;
  let playing = false;
  let muted = false;
  let position = 0;
  let contextStart = 0;
  let generation = 0;
  let scheduled = new Set();
  const sources = new Set();
  const buffers = new Map();

  function prepareVoices() {
    return new Promise((resolve, reject) => {
      const worker = new Worker(new URL('./synth-worker.js', import.meta.url), { type: 'module' });
      worker.onerror = (error) => { worker.terminate(); reject(new Error(error.message)); };
      worker.onmessage = ({ data }) => {
        if (data.error) { worker.terminate(); reject(new Error(data.error)); }
        else if (data.complete) { worker.terminate(); resolve(); }
        else {
          const buffer = context.createBuffer(1, data.samples.length, context.sampleRate);
          buffer.copyToChannel(data.samples, 0);
          buffers.set(data.id, buffer);
        }
      };
      worker.postMessage({ events: score.events.filter((event) => event.instrument !== 'tape'), sampleRate: context.sampleRate });
    });
  }

  async function prepare() {
    if (!context) context = new AudioContext({ sampleRate: SAMPLE_RATE, latencyHint: 'interactive' });
    await context.resume();
    prepared ||= Promise.all([prepareVoices(), prepareTape(context.sampleRate).then((buffer) => { tape = buffer; })]);
    await prepared;
  }

  function time() {
    if (!playing) return position;
    const stamp = context.getOutputTimestamp?.();
    const audible = stamp?.contextTime > 0 ? stamp.contextTime + (performance.now() - stamp.performanceTime) / 1000 : context.currentTime;
    return Math.min(score.duration, position + Math.max(0, audible - contextStart));
  }

  function clear() {
    clearInterval(timer);
    if (graph) {
      const previous = graph;
      previous.master.gain.cancelScheduledValues(context.currentTime);
      previous.master.gain.setTargetAtTime(0, context.currentTime, 0.003);
      setTimeout(() => previous.dispose(), 35);
    }
    for (const source of sources) {
      try { source.stop(context.currentTime + 0.015); } catch {}
    }
    sources.clear();
    scheduled = new Set();
  }

  function pump() {
    if (!playing) return;
    const horizon = position + Math.max(0, context.currentTime - contextStart) + 0.35;
    for (const event of score.events) {
      if (event.time >= horizon) break;
      if (scheduled.has(event.id)) continue;
      scheduled.add(event.id);
      const length = event.instrument === 'tape' ? 6 : voiceLength(event);
      const buffer = event.instrument === 'tape' ? tape : buffers.get(event.id);
      const startAt = Math.max(context.currentTime + 0.004, contextStart + event.time - position);
      const offset = Math.max(0, position + startAt - contextStart - event.time);
      if (offset >= length || startAt >= contextStart + score.duration - position) continue;
      const source = schedule(context, graph, event, buffer, startAt, offset);
      if (source) {
        sources.add(source);
        source.addEventListener('ended', () => sources.delete(source));
      }
    }
  }

  function restart(value) {
    clear();
    position = Math.max(0, Math.min(score.duration, value));
    contextStart = context.currentTime + 0.06;
    graph = routing(context, { from: position, to: Math.max(position + 0.001, score.duration), startAt: contextStart, muted });
    pump();
    timer = setInterval(pump, 25);
  }

  return {
    prepare,
    async play(value) {
      const request = ++generation;
      position = Math.max(0, Math.min(score.duration, value));
      await prepare();
      if (request !== generation) return false;
      playing = true;
      restart(value);
      return true;
    },
    pause() {
      generation += 1;
      position = time();
      playing = false;
      if (context) clear();
      return position;
    },
    seek(value) {
      if (playing) restart(value);
      else position = Math.max(0, Math.min(score.duration, value));
    },
    setMuted(value) {
      muted = Boolean(value);
      if (graph) graph.master.gain.setTargetAtTime(muted ? 0 : 0.8, context.currentTime, 0.008);
      return muted;
    },
    time,
    getState: () => ({ ready: Boolean(tape) && buffers.size === score.events.length - 1, preparedVoices: buffers.size, playing, muted, generation, sampleRate: context?.sampleRate, contextState: context?.state, time: time(), scheduled: scheduled.size, activeSources: sources.size }),
  };
}
