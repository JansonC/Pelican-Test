import { seeded, lerp } from './math.js';

export function layer(width, height, draw, density = 1) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(width * density);
  canvas.height = Math.ceil(height * density);
  const ctx = canvas.getContext('2d');
  ctx.scale(density, density);
  draw?.(ctx);
  return canvas;
}

function hash(x, y, seed) {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ seed;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

export function noise(x, y, seed = 1) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  let u = x - ix;
  let v = y - iy;
  u = u * u * (3 - 2 * u);
  v = v * v * (3 - 2 * v);
  return lerp(lerp(hash(ix, iy, seed), hash(ix + 1, iy, seed), u), lerp(hash(ix, iy + 1, seed), hash(ix + 1, iy + 1, seed), u), v);
}

export function grainTexture(width, height, { seed = 1, rock = false } = {}) {
  const canvas = layer(width, height);
  const ctx = canvas.getContext('2d');
  const data = ctx.createImageData(width, height);
  const random = seeded(seed);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const n = noise(x / 160, y / 85, seed) * 0.5 + noise(x / 42, y / 23, seed + 1) * 0.28 + noise(x / 9, y / 7, seed + 2) * 0.22;
      const grit = (random() - 0.5) * (rock ? 17 : 10);
      const strata = rock ? Math.sin(y / 15 + noise(x / 120, y / 70, seed + 3) * 5) * 3 : 0;
      const shade = (n - 0.5) * (rock ? 73 : 22) + grit + strata;
      const i = (y * width + x) * 4;
      data.data[i] = (rock ? 201 : 235) + shade;
      data.data[i + 1] = (rock ? 151 : 229) + shade * (rock ? 0.85 : 1);
      data.data[i + 2] = (rock ? 99 : 210) + shade * (rock ? 0.65 : 0.95);
      data.data[i + 3] = 255;
    }
  }
  ctx.putImageData(data, 0, 0);
  return canvas;
}

export function xuanPaper(seed = 1000) {
  const base = grainTexture(1000, 500, { seed });
  return layer(2000, 1000, (ctx) => {
    ctx.drawImage(base, 0, 0, 2000, 1000);
    const random = seeded(seed + 30);
    for (let i = 0; i < 19000; i += 1) {
      const x = random() * 2000;
      const y = random() * 1000;
      const len = 1 + random() * 9;
      ctx.strokeStyle = random() > 0.3 ? 'rgba(89,79,53,0.06)' : 'rgba(255,255,240,0.24)';
      ctx.lineWidth = 0.25 + random() * 0.4;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + len * 0.4, y - 0.8, x + len, y + random() - 0.5);
      ctx.stroke();
    }
  });
}

export function tintMask(mask, color) {
  return layer(mask.width, mask.height, (ctx) => {
    ctx.drawImage(mask, 0, 0);
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, mask.width, mask.height);
  });
}

export function inkGranulation(seed = 1062) {
  return layer(2000, 1000, (ctx) => {
    const data = ctx.createImageData(2000, 1000);
    const random = seeded(seed);
    for (let y = 0; y < 1000; y += 1) {
      for (let x = 0; x < 2000; x += 1) {
        const n = noise(x / 27, y / 19, seed) * 0.62 + noise(x / 6, y / 4, seed + 1) * 0.38;
        const grit = random();
        const alpha = grit < 0.025 ? 0.24 + grit * 6 : 0.47 + n * 0.46 + grit * 0.09;
        data.data[(y * 2000 + x) * 4 + 3] = alpha * 255;
      }
    }
    ctx.putImageData(data, 0, 0);
    const randomFibers = seeded(seed + 10);
    ctx.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 7000; i += 1) {
      const x = randomFibers() * 2000;
      const y = randomFibers() * 1000;
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.lineWidth = 0.3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 2 + randomFibers() * 7, y + 0.7);
      ctx.stroke();
    }
  });
}

export function brushMark(ctx, tip, x1, y1, x2, y2, width, alpha = 1) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x1, y1);
  ctx.rotate(Math.atan2(y2 - y1, x2 - x1));
  const length = Math.hypot(x2 - x1, y2 - y1);
  const pad = Math.min(8, length * 0.02);
  ctx.drawImage(tip, -pad, -width / 2, length + pad * 2, width);
  ctx.restore();
}

export function pigmentPainter(width = 600, height = 550, seed = 44) {
  const canvas = layer(width, height);
  const mask = layer(width, height, (ctx) => {
    const random = seeded(seed);
    for (let i = 0; i < 18000; i += 1) {
      ctx.fillStyle = `rgba(0,0,0,${0.08 + random() * 0.7})`;
      ctx.fillRect(random() * width, random() * height, 0.3 + random() * 3.2, 0.25 + random() * 1.7);
    }
  });
  return (ctx, draw) => {
    const paint = canvas.getContext('2d');
    paint.clearRect(0, 0, width, height);
    paint.save();
    paint.translate(220, 420);
    draw(paint);
    paint.restore();
    paint.globalCompositeOperation = 'destination-out';
    paint.drawImage(mask, 0, 0);
    paint.globalCompositeOperation = 'source-over';
    ctx.drawImage(canvas, -220, -420);
  };
}
