import { seeded } from './math.js';

// Materials are shared; each scene supplies its own contours and brush grammar.
export function inkStroke(ctx, points, { color = '#29322b', width = 1.5, seed = 1, dry = 0.35, alpha = 1 } = {}) {
  if (points.length < 2) return;
  const random = seeded(seed);
  ctx.save();
  const inheritedAlpha = ctx.globalAlpha;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = color;
  for (let strand = 0; strand < 3; strand += 1) {
    ctx.globalAlpha = inheritedAlpha * alpha * (strand === 0 ? 0.52 : 0.23);
    ctx.lineWidth = width * (strand === 0 ? 1 : 0.38 + random() * 0.3);
    ctx.beginPath();
    points.forEach(([x, y], i) => {
      const jx = strand ? (random() - 0.5) * width * 1.2 : 0;
      const jy = strand ? (random() - 0.5) * width * 1.2 : 0;
      if (i === 0) ctx.moveTo(x + jx, y + jy);
      else ctx.lineTo(x + jx, y + jy);
    });
    ctx.stroke();
  }
  if (dry > 0) {
    ctx.strokeStyle = '#eee8d6';
    ctx.lineWidth = width * 0.15;
    ctx.globalAlpha = inheritedAlpha * dry;
    for (let i = 0; i < points.length - 1; i += 1) {
      if (random() > 0.45) continue;
      const [x, y] = points[i];
      const [xx, yy] = points[i + 1];
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (xx - x) * 0.7, y + (yy - y) * 0.7);
      ctx.stroke();
    }
  }
  ctx.restore();
}

export function inkWash(ctx, path, { color = '#5d6659', alpha = 0.15, bleed = 2 } = {}) {
  ctx.save();
  const inheritedAlpha = ctx.globalAlpha;
  ctx.fillStyle = color;
  ctx.globalAlpha = inheritedAlpha * alpha * 0.3;
  ctx.filter = `blur(${bleed}px)`;
  ctx.fill(path);
  ctx.filter = 'none';
  ctx.globalAlpha = inheritedAlpha * alpha;
  ctx.fill(path);
  ctx.restore();
}

export function mossDots(ctx, x, y, spread, count, seed, alpha = 0.6) {
  const random = seeded(seed);
  ctx.save();
  const inheritedAlpha = ctx.globalAlpha;
  ctx.fillStyle = '#29332a';
  for (let i = 0; i < count; i += 1) {
    ctx.globalAlpha = inheritedAlpha * alpha * (0.35 + random() * 0.65);
    ctx.beginPath();
    ctx.ellipse(x + (random() - 0.5) * spread, y + (random() - 0.5) * spread * 0.23, 0.5 + random() * 2.4, 0.45 + random() * 1.3, random() * 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
