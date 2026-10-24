import { BEAT_SECONDS, OUTRO_START, sceneStart } from './timeline.js';

export const CUES = Object.freeze({
  introAccent: 3,
  scream: sceneStart(12) + 2,
  powerOn: sceneStart(14),
  wrongDial: sceneStart(14) + 2,
  jump: sceneStart(15) + 2,
  coin: sceneStart(15) + 2.75,
  oneUp: sceneStart(15) + 3,
  message: sceneStart(16) + 2,
  tapeStart: sceneStart(17),
  tapeSkip: sceneStart(17) + 2,
  tapeResume: sceneStart(17) + 3,
  tapeExit: sceneStart(17) + 4,
  codeReveal: sceneStart(19) + 2,
  flashes: Object.freeze([4, 5, 6].map((offset) => OUTRO_START + offset)),
  musicEnd: OUTRO_START + 8.5,
  bell: OUTRO_START + 11.5,
});

export const TAPE = Object.freeze({
  rate: 2 ** (-4 / 12),
  semitones: 4,
  loopSeconds: BEAT_SECONDS / 2,
  repeats: 4,
  skipStart: 2,
  skipEnd: 3,
  reverbSeconds: 4.2,
  lowpassHz: 4000,
  wowHz: 0.5,
});

function smoothUnit(value) {
  const position = Math.min(1, Math.max(0, value));
  return position * position * (3 - 2 * position);
}

export function tapeRateAt(localTime) {
  if (localTime < 2) return 1 - smoothUnit(localTime / 2) * (1 - TAPE.rate);
  if (localTime < 4) return TAPE.rate;
  return TAPE.rate + smoothUnit((localTime - 4) / 2) * (1 - TAPE.rate);
}

export function tapeSkipAt(localTime) {
  const active = localTime >= TAPE.skipStart && localTime < TAPE.skipEnd;
  if (!active) return { active: false, phase: 0, count: 0 };
  const elapsed = localTime - TAPE.skipStart;
  return { active: true, phase: (elapsed % TAPE.loopSeconds) / TAPE.loopSeconds, count: Math.floor(elapsed / TAPE.loopSeconds) };
}

export function tapePositionAt(localTime) {
  const integralSmooth = (position) => position ** 3 - position ** 4 / 2;
  if (localTime < 2) {
    const position = Math.max(0, localTime) / 2;
    return localTime - (1 - TAPE.rate) * 2 * integralSmooth(position) - (1 - TAPE.rate);
  }
  const skip = tapeSkipAt(localTime);
  if (skip.active) return 2 * TAPE.rate + skip.phase * TAPE.loopSeconds * TAPE.rate;
  if (localTime < 4) return localTime * TAPE.rate;
  return localTime * TAPE.rate + (1 - TAPE.rate) * 2 * integralSmooth(Math.min(1, (localTime - 4) / 2));
}
