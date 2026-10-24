import { BEAT_SECONDS, DURATION, OUTRO_START, sceneStart } from '../src/beat/timeline.js';
import { CUES, TAPE } from '../src/beat/events.js';
import { SCENES } from '../src/scenes/catalog.js';

export const SAMPLE_RATE = 48000;
export const TITLE = '一条路的二十种回声';
export const MOTIF = Object.freeze([
  [0, 74, 0.7], [1, 77, 0.4], [1.5, 81, 0.4], [2, 79, 0.7], [3, 76, 0.4], [3.5, 74, 0.4],
  [4, 77, 0.7], [5, 81, 0.4], [5.5, 84, 0.4], [6, 81, 0.85], [7, 79, 0.7],
  [8, 77, 0.85], [9, 76, 0.4], [9.5, 79, 0.4], [10, 74, 1.65],
].map((note) => Object.freeze(note)));

export const ARRANGEMENTS = Object.freeze([
  ['vowel', 'handdrum', -12, 0.34, '手鼓、合成人声'],
  ['harp', 'wood', 0, 0.41, '竖琴'],
  ['bells', 'wood', -12, 0.33, '编钟'],
  ['pipa', 'wood', -12, 0.4, '琵琶'],
  ['guqin', null, -12, 0.4, '古琴'],
  ['dizi', 'handdrum', -12, 0.32, '笛子、锣鼓'],
  ['ocarina', 'wood', -12, 0.36, '陶笛、木鼓'],
  ['sitar', 'tabla', -12, 0.34, '西塔琴、塔布拉'],
  ['xiao', null, -12, 0.34, '箫'],
  ['gamelan', 'wood', -12, 0.34, '甘美兰'],
  ['shamisen', 'wood', -12, 0.36, '三味线'],
  ['strings', 'softkick', -12, 0.29, '弦乐'],
  ['strings', 'timpani', -12, 0.28, '走调弦乐'],
  ['piano', 'wood', -12, 0.39, '默片钢琴、管风琴'],
  ['sine', null, -12, 0.27, '正弦蜂鸣、电子管嗡声'],
  ['square', 'chipnoise', 0, 0.19, '双方波、三角波、噪声'],
  ['midi', 'click', 0, 0.3, '原创 MIDI 铃声'],
  ['tape', null, 0, 0.78, '变速 FM 电钢琴、贝斯、萨克斯、门限鼓'],
  ['pop', 'kick', -12, 0.27, '短促流行节拍'],
  ['piano', 'click', -12, 0.36, '钢琴、合成器'],
].map((arrangement) => Object.freeze(arrangement)));

const HARMONY = [[50, 57, 60, 65], [46, 53, 57, 62], [48, 55, 59, 64]];

export function createScore() {
  const events = [];
  let serial = 0;
  function add(section, time, duration, instrument, midi, gain, extra = {}) {
    const end = section === 'intro' ? 5 : section === 'outro' ? DURATION : sceneStart(SCENES.findIndex((scene) => scene.id === section)) + 6;
    events.push({ id: `note-${serial++}`, section, time, duration, instrument, midi, gain, pan: 0, end, role: 'music', ...extra });
  }
  for (const [time, midi] of [[0, 69], [0.5, 72], [1, 74], [2, 65], [3, 69], [4, 72]]) {
    add('intro', time, 0.65, 'piano', midi, time === CUES.introAccent ? 0.4 : 0.26);
  }
  for (const time of [1, 3]) for (const midi of [38, 50, 57]) add('intro', time, 1.65, 'organ', midi, 0.065);

  for (const scene of SCENES) {
    const [lead, percussion, transpose, gain] = ARRANGEMENTS[scene.index];
    if (lead === 'tape') {
      add(scene.id, scene.start, 6, 'tape', 0, gain);
      continue;
    }
    const chip = scene.id === 'pixel';
    for (const [beat, midi, length] of MOTIF) {
      const time = scene.start + beat * BEAT_SECONDS;
      if (chip && time >= CUES.coin - 0.2 && time < CUES.oneUp + 0.5) continue;
      add(scene.id, time, length * BEAT_SECONDS, lead, midi + transpose, gain * (beat % 4 === 0 ? 1.08 : 0.9), {
        pan: chip ? -0.13 : -0.08, ...(chip ? { channel: 'square1', release: 0.012 } : {}),
        ...(scene.id === 'scream' && beat >= 4 && beat < 8 ? { bend: beat % 2 ? -1.3 : 1.1, vibrato: 0.25 } : {}),
      });
    }
    for (let bar = 0; bar < 3; bar += 1) {
      const time = scene.start + bar * 2;
      const chord = HARMONY[bar];
      if (chip) {
        for (let step = 0; step < 8; step += 1) {
          add(scene.id, time + step * 0.25, 0.18, 'triangle', chord[step % 2] - 12, 0.24, { channel: 'triangle', release: 0.012 });
          add(scene.id, time + step * 0.25, 0.15, 'square', chord[1 + step % 3] + 12, 0.055, { channel: 'square2', pan: 0.13, duty: 0.25, release: 0.012 });
        }
      } else if (['song', 'bada'].includes(scene.id)) {
        add(scene.id, time, 1.45, lead === 'xiao' ? 'guqin' : lead, chord[0], 0.18, { pan: 0.28 });
      } else if (['scope', 'sahara', 'maya'].includes(scene.id)) {
        add(scene.id, time, 1.6, scene.id === 'scope' ? 'hum' : lead, chord[0], scene.id === 'scope' ? 0.1 : 0.13, { pan: 0.2 });
      } else if (['harp', 'pipa', 'shamisen', 'sitar', 'bells', 'gamelan'].includes(lead)) {
        for (let step = 0; step < 4; step += 1) add(scene.id, time + step * 0.5, 0.44, lead, chord[step], 0.12, { pan: 0.35 });
      } else {
        for (const [voice, midi] of chord.entries()) add(scene.id, time, 1.7, scene.id === 'nosferatu' ? 'organ' : scene.id === 'code' ? 'pad' : lead === 'strings' ? 'strings' : 'epiano', midi, 0.085, { pan: (voice - 1.5) * 0.2 });
      }
    }
    if (percussion) {
      for (let beat = 0; beat < 12; beat += 1) {
        add(scene.id, scene.start + beat * BEAT_SECONDS, 0.12, percussion, beat % 4 === 0 ? 43 : 50, chip ? 0.09 : 0.16, { pan: 0.06, ...(chip ? { channel: 'noise', release: 0.012 } : {}) });
        if (['vertical', 'mughal', 'qingming'].includes(scene.id)) add(scene.id, scene.start + beat * BEAT_SECONDS + 0.25, 0.07, scene.id === 'mughal' ? 'tabla' : 'hat', 62, 0.075, { pan: 0.3 });
        if (scene.id === 'vertical' && beat % 2) add(scene.id, scene.start + beat * BEAT_SECONDS, 0.16, 'snare', 54, 0.22);
      }
    }
    if (!chip && !['song', 'bada'].includes(scene.id)) {
      for (const beat of [0, 2, 4, 6, 8, 10]) add(scene.id, scene.start + beat * BEAT_SECONDS, 0.035, 'chain', 60, 0.014, { role: 'foley', pan: -0.3 });
    }
  }
  add('qingming', sceneStart(5) + 2, 1.25, 'gong', 45, 0.22, { role: 'effect' });
  add('scream', CUES.scream, 1.7, 'strings', 81, 0.18, { bend: -3.7, vibrato: 0.4, role: 'effect', cue: 'scream' });
  add('scope', CUES.powerOn, 0.18, 'power', 45, 0.33, { role: 'effect', cue: 'powerOn' });
  add('scope', CUES.wrongDial, 0.68, 'sine', 81, 0.19, { bend: -18, role: 'effect', cue: 'wrongDial' });
  add('pixel', CUES.jump, 0.16, 'triangle', 60, 0.22, { bend: 12, channel: 'triangle', role: 'effect', cue: 'jump', release: 0.012 });
  add('pixel', CUES.coin, 0.1, 'square', 88, 0.17, { channel: 'square1', role: 'effect', cue: 'coin', release: 0.012 });
  for (const [step, midi] of [81, 85, 88, 93].entries()) add('pixel', CUES.oneUp + step * 0.125, 0.095, 'square', midi, 0.19, { channel: 'square1', role: 'effect', cue: step === 0 ? 'oneUp' : undefined, release: 0.012 });
  for (const [step, midi] of [81, 86, 89].entries()) add('chat', CUES.message + step * 0.125, 0.11, 'midi', midi, 0.32, { role: 'effect', cue: step === 0 ? 'message' : undefined, pan: 0.3 });
  for (const [step, midi] of [74, 77, 81, 84].entries()) add('code', CUES.codeReveal + step * 0.25, 0.17, 'sine', midi, 0.1, { role: 'effect', cue: step === 0 ? 'codeReveal' : undefined, pan: 0.3 });

  for (const [beat, midi, length] of MOTIF) {
    for (const [instrument, transpose, gain, pan] of [['piano', -12, 0.28, -0.2], ['strings', -12, 0.14, 0.22], ['bells', -24, 0.09, 0.4]]) {
      add('outro', OUTRO_START + beat * BEAT_SECONDS, length * BEAT_SECONDS, instrument, midi + transpose, gain, { pan });
    }
  }
  for (const midi of [38, 50, 57, 62, 65]) add('outro', OUTRO_START, 4.6, 'organ', midi, 0.075);
  for (const [index, time] of CUES.flashes.entries()) add('outro', time, 0.07, 'shutter', 72, 0.13, { role: 'effect', pan: (index - 1) * 0.5, cue: `flash${index + 1}` });
  add('outro', CUES.bell, 0.49, 'bell', 92, 0.53, { role: 'final', release: 0, cue: 'bell' });

  const sorted = events.sort((left, right) => left.time - right.time || Number(left.role === 'effect') - Number(right.role === 'effect') || left.id.localeCompare(right.id));
  const chipChannels = new Map();
  for (const event of sorted.filter((note) => note.section === 'pixel')) {
    const previous = chipChannels.get(event.channel);
    if (previous && previous.time + previous.duration + previous.release > event.time) {
      previous.duration = Math.max(0, event.time - previous.time - previous.release);
    }
    chipChannels.set(event.channel, event);
  }
  return Object.freeze({
    title: TITLE, bpm: 120, duration: DURATION, sampleRate: SAMPLE_RATE, key: 'D minor',
    motif: MOTIF, tape: { ...TAPE, sourceBpm: 120 / TAPE.rate }, cues: CUES,
    markers: [
      ...SCENES.map((scene) => ({ name: `portal-${scene.id}`, time: scene.start })),
      ...Object.entries(CUES).flatMap(([name, value]) => Array.isArray(value) ? value.map((time, index) => ({ name: `${name}-${index + 1}`, time })) : [{ name, time: value }]),
      ...Array.from({ length: TAPE.repeats }, (_, index) => ({ name: `tape-loop-${index + 1}`, time: CUES.tapeSkip + index * TAPE.loopSeconds })),
    ].sort((left, right) => left.time - right.time),
    sections: [{ id: 'intro', start: 0, end: 5, instruments: '钢琴、管风琴' }, ...SCENES.map((scene) => ({ id: scene.id, start: scene.start, end: scene.start + 6, instruments: ARRANGEMENTS[scene.index][4] })), { id: 'outro', start: OUTRO_START, end: DURATION, instruments: '主题齐奏、快门、独奏车铃' }],
    events: sorted.filter((event) => event.duration > 0).map((event) => Object.freeze(event)),
  });
}

export function createThemeScore() {
  const events = [];
  for (let repeat = 0; repeat < 2; repeat += 1) {
    for (const [beat, midi, length] of MOTIF) events.push({ id: `theme-${repeat}-${beat}`, section: 'theme', time: repeat * 6 + beat * BEAT_SECONDS, duration: length * BEAT_SECONDS, instrument: repeat ? 'strings' : 'piano', midi: midi - 12, gain: repeat ? 0.4 : 0.48, pan: -0.1, end: (repeat + 1) * 6, role: 'music' });
    for (let bar = 0; bar < 3; bar += 1) {
      for (const [voice, midi] of HARMONY[bar].entries()) events.push({ id: `chord-${repeat}-${bar}-${voice}`, section: 'theme', time: repeat * 6 + bar * 2, duration: 1.65, instrument: 'harp', midi, gain: 0.09, pan: 0.3, end: (repeat + 1) * 6, role: 'music' });
    }
  }
  return { title: TITLE, duration: 12, events: events.sort((left, right) => left.time - right.time) };
}
