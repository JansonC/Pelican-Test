const TAU = Math.PI * 2;

export const VOICES = Object.freeze({
  harp: { attack: 0.003, decay: 0.7, release: 0.32, partials: [[1, 1, 1], [2, 0.42, 2], [3, 0.2, 3], [4, 0.1, 4]] },
  pipa: { attack: 0.002, decay: 0.3, release: 0.16, partials: [[1, 0.7, 1], [2, 0.5, 1.8], [3, 0.38, 2], [4, 0.24, 2.5], [6, 0.18, 4]] },
  guqin: { attack: 0.008, decay: 1.15, release: 0.5, partials: [[1, 1, 1], [2, 0.26, 1.6], [3, 0.12, 2], [5, 0.07, 3]] },
  shamisen: { attack: 0.001, decay: 0.24, release: 0.14, partials: [[1, 0.65, 1], [2, 0.55, 1.4], [3, 0.35, 1.8], [5, 0.23, 2.8], [7, 0.13, 4]] },
  sitar: { attack: 0.003, decay: 0.8, release: 0.4, partials: [[1, 0.62, 1], [2, 0.5, 1], [3, 0.35, 1.4], [4, 0.29, 1.7], [5, 0.18, 2], [7, 0.09, 3]] },
  bells: { attack: 0.002, decay: 0.9, release: 0.45, partials: [[1, 0.9, 1], [2.71, 0.4, 1.8], [4.08, 0.2, 2.5], [5.43, 0.12, 3]] },
  gamelan: { attack: 0.002, decay: 0.65, release: 0.35, partials: [[1, 0.8, 1], [2.02, 0.18, 1.5], [2.76, 0.5, 1.8], [4.09, 0.24, 2.5]] },
  gong: { attack: 0.02, decay: 1.4, release: 0.5, partials: [[1, 0.6, 1], [1.47, 0.5, 1.1], [2.09, 0.4, 1.5], [2.73, 0.3, 2], [4.32, 0.2, 2.2]] },
  piano: { attack: 0.002, decay: 0.85, release: 0.3, partials: [[1, 1, 1], [2.003, 0.4, 1.5], [3.012, 0.2, 2], [4.026, 0.13, 3], [5.045, 0.07, 4]] },
  organ: { attack: 0.035, sustain: 0.85, release: 0.15, partials: [[0.5, 0.25], [1, 0.7], [2, 0.3], [3, 0.16], [4, 0.12]] },
  strings: { attack: 0.075, sustain: 0.8, release: 0.25, vibrato: 0.045, partials: [[1, 0.8], [2, 0.34], [3, 0.2], [4, 0.13], [5, 0.09], [6, 0.05]] },
  dizi: { attack: 0.022, sustain: 0.82, release: 0.12, vibrato: 0.035, breath: 0.06, partials: [[1, 0.8], [2, 0.32], [3, 0.21], [4, 0.1]] },
  xiao: { attack: 0.07, sustain: 0.8, release: 0.2, vibrato: 0.028, breath: 0.1, partials: [[1, 1], [2, 0.13], [3, 0.04]] },
  ocarina: { attack: 0.035, sustain: 0.9, release: 0.1, vibrato: 0.025, breath: 0.025, partials: [[1, 1], [2, 0.07], [3, 0.02]] },
  vowel: { attack: 0.06, sustain: 0.8, release: 0.15, vibrato: 0.045, partials: [[1, 0.5], [2, 0.36], [3, 0.6], [4, 0.25], [5, 0.18], [6, 0.1], [9, 0.09]] },
  sine: { attack: 0.008, sustain: 0.9, release: 0.05, partials: [[1, 1]] },
  hum: { attack: 0.05, sustain: 0.8, release: 0.08, partials: [[1, 0.6], [2, 0.18], [3, 0.06]] },
  pad: { attack: 0.09, sustain: 0.8, release: 0.35, partials: [[1, 0.8], [1.003, 0.3], [2, 0.14], [3, 0.08]] },
  epiano: { attack: 0.003, decay: 1.1, release: 0.3, fm: 1.2, ratio: 2 },
  bass: { attack: 0.007, decay: 0.6, release: 0.13, fm: 0.45, ratio: 1 },
  sax: { attack: 0.045, sustain: 0.8, release: 0.16, fm: 1.15, ratio: 1, vibrato: 0.055 },
  midi: { attack: 0.002, decay: 0.2, release: 0.12, fm: 1.5, ratio: 2 },
  pop: { attack: 0.006, decay: 0.22, release: 0.12, fm: 0.8, ratio: 1 },
  square: { attack: 0.002, sustain: 0.85, release: 0.012 },
  triangle: { attack: 0.002, sustain: 0.9, release: 0.012 },
  handdrum: { attack: 0.001, decay: 0.11, release: 0.1, drum: true },
  tabla: { attack: 0.001, decay: 0.13, release: 0.08, drum: true },
  wood: { attack: 0.001, decay: 0.035, release: 0.06, drum: true },
  timpani: { attack: 0.003, decay: 0.35, release: 0.25, drum: true },
  kick: { attack: 0.001, decay: 0.11, release: 0.13, drum: true },
  softkick: { attack: 0.003, decay: 0.1, release: 0.08, drum: true },
  snare: { attack: 0.001, decay: 0.075, release: 0.1, noise: true },
  gatedsnare: { attack: 0.001, decay: 0.16, release: 0.02, noise: true },
  hat: { attack: 0.001, decay: 0.025, release: 0.04, noise: true },
  click: { attack: 0.001, decay: 0.014, release: 0.025, noise: true },
  chain: { attack: 0.001, decay: 0.009, release: 0.02, noise: true },
  shutter: { attack: 0.001, decay: 0.02, release: 0.04, noise: true },
  chipnoise: { attack: 0.001, decay: 0.035, release: 0.012, noise: true },
  power: { attack: 0.001, decay: 0.08, release: 0.06, noise: true },
  bell: { attack: 0.001, decay: 0.2, release: 0, partials: [[1, 0.7, 1], [2.01, 0.4, 1.4], [2.76, 0.3, 2], [4.07, 0.18, 2.5]] },
});

export function randomFor(seed) {
  let state = seed >>> 0 || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296 * 2 - 1;
  };
}

export function midiHz(midi) { return 440 * 2 ** ((midi - 69) / 12); }

export function voiceLength(event) {
  const voice = VOICES[event.instrument];
  if (!voice) throw new RangeError(`Unknown instrument: ${event.instrument}`);
  return Math.max(0, Math.min(event.duration + (event.release ?? voice.release), event.end - event.time));
}

export function synthesize(event, sampleRate) {
  const voice = VOICES[event.instrument];
  const length = voiceLength(event);
  const samples = new Float32Array(Math.ceil(length * sampleRate));
  const frequency = event.instrument === 'hum' ? 50 : midiHz(event.midi);
  const random = randomFor(Math.round(event.time * 48000) ^ Math.round(event.midi * 917) ^ 0x51ca7);
  const partials = (voice.partials || []).filter(([ratio]) => frequency * ratio < sampleRate * 0.45);
  const normalization = partials.reduce((sum, [, amplitude]) => sum + amplitude, 0) || 1;
  let phase = 0;
  let lowNoise = 0;
  let chipRegister = 1;
  let chipSample = 0;
  for (let index = 0; index < samples.length; index += 1) {
    const time = index / sampleRate;
    const noise = random();
    lowNoise += 0.2 * (noise - lowNoise);
    const bend = event.bend ? event.bend * Math.min(1, time / Math.max(0.03, event.duration)) : 0;
    const vibrato = (event.vibrato ?? voice.vibrato ?? 0) * Math.sin(TAU * 5.1 * time) * Math.min(1, time / 0.14);
    const pitch = frequency * 2 ** ((bend + vibrato) / 12);
    phase += TAU * pitch / sampleRate;
    let sample = 0;
    if (event.instrument === 'square' || event.instrument === 'triangle') {
      const harmonics = Math.min(21, Math.floor(sampleRate * 0.45 / pitch));
      for (let harmonic = 1; harmonic <= harmonics; harmonic += 1) {
        if (event.instrument === 'triangle') {
          if (harmonic % 2) sample += Math.sin(phase * harmonic) * (-1) ** ((harmonic - 1) / 2) / harmonic ** 2;
        } else {
          const duty = event.duty ?? 0.5;
          sample += 2 * Math.sin(Math.PI * harmonic * duty) / (Math.PI * harmonic) * Math.cos(harmonic * (phase - Math.PI * duty));
        }
      }
      sample *= event.instrument === 'triangle' ? 0.81 : 1.35;
    } else if (voice.drum) {
      const base = ['kick', 'softkick'].includes(event.instrument) ? 48 : frequency;
      const sweep = event.instrument === 'tabla' ? 4 : event.instrument === 'wood' ? 1 : 7;
      const drumPhase = TAU * base * (time + sweep * 0.018 * (1 - Math.exp(-time / 0.018)));
      sample = Math.sin(drumPhase) * 0.85 + Math.sin(drumPhase * (event.instrument === 'tabla' ? 1.51 : 2.44)) * 0.16 * Math.exp(-time * 25) + noise * 0.15 * Math.exp(-time * 90);
    } else if (voice.noise) {
      sample = noise - lowNoise;
      if (event.instrument === 'chipnoise') {
        if (Math.floor(time * 7000) !== chipSample) {
          chipSample = Math.floor(time * 7000);
          chipRegister = (chipRegister >> 1) | (((chipRegister ^ (chipRegister >> 1)) & 1) << 14);
        }
        sample = (chipRegister & 1) * 2 - 1;
      } else if (['snare', 'gatedsnare'].includes(event.instrument)) sample = sample * 0.7 + Math.sin(TAU * 185 * time) * 0.32;
      else if (event.instrument === 'shutter') sample *= 0.4 + 0.6 * Math.sin(TAU * 48 * time) ** 2;
      else if (event.instrument === 'power') sample = sample * 0.3 + Math.sin(TAU * (170 * time + 1400 * time ** 2)) * 0.7;
    } else if (voice.fm !== undefined) {
      const modulation = voice.fm * (voice.decay ? Math.exp(-time * 2) : 1);
      sample = Math.sin(phase + modulation * Math.sin(phase * voice.ratio)) * 0.85;
      if (event.instrument === 'sax') sample += Math.sin(phase * 2) * 0.12 + lowNoise * 0.05;
    } else {
      for (const [ratio, amplitude, decay = 1] of partials) sample += Math.sin(phase * ratio) * amplitude * (voice.decay ? Math.exp(-time * decay / voice.decay) : 1);
      sample /= normalization ** 0.7;
      if (voice.breath) sample += (noise - lowNoise) * voice.breath;
      if (['pipa', 'shamisen', 'sitar'].includes(event.instrument)) sample += noise * 0.18 * Math.exp(-time * 65);
    }
    const attack = Math.min(1, time / voice.attack);
    const envelope = voice.decay && !partials.length ? Math.exp(-time / voice.decay) : voice.sustain ? 1 - (1 - voice.sustain) * Math.min(1, time / 0.12) : 1;
    const release = Math.min(1, Math.max(0, (length - time) / Math.max(0.006, length - event.duration)));
    const endFade = Math.min(1, (length - time) / 0.005);
    samples[index] = sample * attack * envelope * release * endFade;
  }
  return samples;
}
