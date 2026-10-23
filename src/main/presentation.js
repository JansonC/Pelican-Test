import { STAGE_WIDTH, clamp } from '../beat/timeline.js';
import { smooth, lerp } from '../kit/math.js';

export function songCameraAt(localT) {
  // The full bicycle must clear a portal before its apparent scale changes.
  const small = smooth((localT - 0.7) / 0.6) * (1 - smooth((localT - 4.2) / 1.05));
  const search = smooth((localT - 1.85) / 1.2) * (1 - smooth((localT - 3.85) / 1.4));
  const found = smooth((localT - 2) / 0.8) * (1 - smooth((localT - 4.2) / 1.05));
  return { zoom: 1 + search * 2.8, riderScale: lerp(1, 0.09, small) + found * 0.105 };
}

export function portraitAt(t) {
  const amount = smooth((t - 112.65) / 0.7) * (1 - smooth((t - 119) / 0.5));
  const width = lerp(STAGE_WIDTH, 562.5, amount);
  return { amount, width, left: (STAGE_WIDTH - width) / 2, riderX: lerp(720, STAGE_WIDTH / 2 - 12, amount), riderScale: lerp(1, 0.68, amount), progress: clamp((t - 113) / 6) };
}
