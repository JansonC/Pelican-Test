import { seeded } from './math.js';

export const SERIF = '"Noto Serif SC Variable", serif';
export const SANS = '"Segoe UI", "Microsoft YaHei", sans-serif';

export function line(ctx, points, color = '#343b32', width = 2) {
  ctx.beginPath();
  points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
}

export function text(ctx, value, x, y, { size = 28, color = '#343b32', weight = 400, align = 'left', family = SERIF } = {}) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${family}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(value, x, y);
}

export function paperTexture(seed = 67) {
  const canvas = document.createElement('canvas');
  canvas.width = 960;
  canvas.height = 540;
  const ctx = canvas.getContext('2d');
  const random = seeded(seed);
  for (let i = 0; i < 16000; i += 1) {
    const shade = random() > 0.4 ? '45,40,27' : '255,252,241';
    ctx.fillStyle = `rgba(${shade},${0.025 + random() * 0.045})`;
    ctx.fillRect(random() * 960, random() * 540, 0.5 + random() * 1.5, 0.4 + random() * 0.7);
  }
  return canvas;
}

export function withAlpha(ctx, alpha, draw) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  draw();
  ctx.restore();
}
