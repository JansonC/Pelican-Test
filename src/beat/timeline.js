export const BPM = 120;
export const BEAT_SECONDS = 60 / BPM;
export const BAR_SECONDS = BEAT_SECONDS * 4;
export const INTRO_SECONDS = 5;
export const SCENE_SECONDS = BAR_SECONDS * 3;
export const OUTRO_SECONDS = BAR_SECONDS * 6;
export const SCENE_COUNT = 20;
export const OUTRO_START = INTRO_SECONDS + SCENE_COUNT * SCENE_SECONDS;
export const DURATION = OUTRO_START + OUTRO_SECONDS;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const STAGE_HEIGHT = 1000;
export const STAGE_WIDTH = STAGE_HEIGHT * WIDTH / HEIGHT;
export const PANEL_WIDTH = 2000;
export const ROAD_Y = 802;
export const TRAVEL_SPEED = PANEL_WIDTH / SCENE_SECONDS;

export function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export function normalizeTime(time) {
  if (!Number.isFinite(time)) throw new TypeError('Time must be finite');
  return clamp(time, 0, DURATION);
}

export function sceneStart(index) {
  if (!Number.isInteger(index) || index < 0 || index >= SCENE_COUNT) {
    throw new RangeError('Scene index must be in [0, 19]');
  }
  return INTRO_SECONDS + index * SCENE_SECONDS;
}

export function locate(time) {
  const t = normalizeTime(time);
  if (t < INTRO_SECONDS) return { kind: 'intro', t, localT: t, index: -1 };
  if (t >= OUTRO_START) return { kind: 'outro', t, localT: t - OUTRO_START, index: 20 };
  const index = Math.floor((t - INTRO_SECONDS) / SCENE_SECONDS);
  const localT = t - sceneStart(index);
  return { kind: 'scene', t, index, localT, bar: Math.floor(localT / BAR_SECONDS) };
}

// Two-beat anacrusis, then full measures at 1, 3, 5, ... seconds.
export function beatAt(time) {
  return (normalizeTime(time) - 1) / BEAT_SECONDS;
}

export function pedalPhase(time) {
  return time / (BEAT_SECONDS * 2) * Math.PI * 2;
}

export function quantizeTime(time, hz = 10) {
  return Math.floor((time + 1e-9) * hz) / hz;
}

export function frameTimes({ from = 0, to = DURATION, fps = 30 } = {}) {
  if (![30, 60].includes(fps)) throw new RangeError('fps must be 30 or 60');
  if (!Number.isFinite(from) || !Number.isFinite(to) || from < 0 || to > DURATION || from >= to) {
    throw new RangeError('Require 0 <= from < to <= duration');
  }
  // Half-open intervals let adjoining render jobs share one frame sequence.
  const start = Math.ceil(from * fps - 1e-8);
  const end = Math.ceil(to * fps - 1e-8);
  return Array.from({ length: end - start }, (_, offset) => (start + offset) / fps);
}

export function formatTime(time) {
  const seconds = Math.floor(normalizeTime(time));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
