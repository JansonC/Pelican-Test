import { text, line, SANS } from '../kit/canvas.js';

// Scene coordinates are a square 1000 × 1000; the compositor extends the ground.
export function renderPlaceholder(ctx, { scene }) {
  ctx.save();
  ctx.globalAlpha = 0.075;
  text(ctx, String(scene.number).padStart(2, '0'), 1000, 590, {
    size: 390, color: scene.ink, weight: 400, align: 'right', family: SANS,
  });
  ctx.globalAlpha = 0.16;
  line(ctx, [[50, 645], [950, 645]], scene.ink, 1);
  for (let x = 50; x <= 950; x += 150) line(ctx, [[x, 638], [x, 652]], scene.ink, 1);
  ctx.globalAlpha = 0.52;
  text(ctx, '画风占位 · STYLE STUDY TO FOLLOW', 950, 690, { size: 16, align: 'right', color: scene.ink, family: SANS });
  ctx.restore();
}
