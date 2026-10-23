import { clamp } from '../beat/timeline.js';

export const lerp = (a, b, amount) => a + (b - a) * amount;
export const smooth = (value) => { const x = clamp(value); return x * x * (3 - 2 * x); };
export const easeInOut = (value) => (1 - Math.cos(clamp(value) * Math.PI)) / 2;

export function seeded(seed = 1) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function twoBoneJoint(start, end, a, b, bend = 1) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.max(1e-6, Math.hypot(dx, dy));
  const reach = Math.min(distance, a + b - 1e-6);
  const along = (a * a - b * b + reach * reach) / (2 * reach);
  const height = Math.sqrt(Math.max(0, a * a - along * along)) * bend;
  return {
    x: start.x + dx / distance * along - dy / distance * height,
    y: start.y + dy / distance * along + dx / distance * height,
  };
}
