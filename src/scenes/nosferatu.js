import { SCENES } from './catalog.js';
import { text, line, SANS } from '../kit/canvas.js';
import { seeded, smooth, lerp } from '../kit/math.js';
import { layer, xuanPaper } from '../kit/materials.js';
import { ROAD_Y } from '../beat/timeline.js';

export const scene = SCENES[13];
export const finished = true;
export const TITLE_GLYPHS = '诺斯费拉图默片影阶约';

const WALL = '#242722';
const SHADOW = '#161915';
const SHADOW_EDGE = '#42443b';
const LAMP = '#d7bf7a';
const INK = '#dde0ca';
const TAU = Math.PI * 2;
let architecture;
let grain;

function shape(ctx, description, fill, stroke = null, width = 1) {
  const path = typeof description === 'string' ? new Path2D(description) : description;
  if (fill) { ctx.fillStyle = fill; ctx.fill(path); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(path); }
}

function polygon(ctx, points, fill, stroke = null, width = 1) {
  const path = new Path2D();
  points.forEach(([pointX, pointY], index) => index ? path.lineTo(pointX, pointY) : path.moveTo(pointX, pointY));
  path.closePath();
  shape(ctx, path, fill, stroke, width);
}

function ellipse(ctx, centerX, centerY, radiusX, radiusY, fill, stroke = null, width = 1, angle = 0) {
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radiusX, radiusY, angle, 0, TAU);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
}

function staircase(ctx, left, top, width, height, steps, direction = 1) {
  const stepWidth = width / steps;
  const stepHeight = height / steps;
  for (let step = 0; step < steps; step += 1) {
    const pointX = left + step * stepWidth * direction;
    const pointY = top + step * stepHeight;
    const front = direction > 0 ? pointX : pointX - stepWidth;
    polygon(ctx, [[front, pointY], [front + stepWidth, pointY], [front + stepWidth, pointY + stepHeight], [front, pointY + stepHeight]], step % 2 ? '#6e7068' : '#85847a', '#3a3c37', 1);
    line(ctx, [[front, pointY], [front + stepWidth, pointY]], '#b8b4a1', 1.25);
  }
  line(ctx, [[left, top], [left + width * direction, top + height]], '#c1bdab', 3);
  line(ctx, [[left, top + height + 5], [left + width * direction, top + height + 5]], '#3b3c38', 2);
}

function wallCracks(ctx, random) {
  for (let crack = 0; crack < 72; crack += 1) {
    const pointX = -470 + random() * 1930;
    const pointY = 92 + random() * 715;
    const length = 7 + random() * 44;
    line(ctx, [[pointX, pointY], [pointX + length * 0.35, pointY - 2 - random() * 6], [pointX + length, pointY + random() * 10]], 'rgba(22,24,21,0.33)', 0.6 + random() * 0.7);
    if (crack % 4 === 0) line(ctx, [[pointX + length * 0.35, pointY - 2], [pointX + length * 0.5, pointY - 16 - random() * 13]], 'rgba(22,24,21,0.22)', 0.55);
  }
}

function lamp(ctx) {
  const glow = ctx.createRadialGradient(825, 725, 22, 825, 725, 390);
  glow.addColorStop(0, 'rgba(232,202,125,0.4)');
  glow.addColorStop(0.3, 'rgba(194,166,103,0.18)');
  glow.addColorStop(1, 'rgba(111,103,73,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(400, 375, 850, 625);
  line(ctx, [[825, 804], [825, 715]], '#161915', 8);
  ellipse(ctx, 825, 714, 31, 17, '#10130f', '#777252', 1.3);
  ellipse(ctx, 825, 710, 19, 11, LAMP, '#dfca8d', 1);
  line(ctx, [[794, 718], [856, 718]], '#8a774a', 1);
}

function paintArchitecture(ctx, paper) {
  ctx.fillStyle = WALL;
  ctx.fillRect(0, 0, 2000, 1000);
  ctx.globalAlpha = 0.16;
  ctx.globalCompositeOperation = 'screen';
  ctx.drawImage(paper, 0, 0, 2000, 1000);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.translate(500, 0);
  polygon(ctx, [[-500, 91], [225, 91], [401, 190], [401, 803], [-500, 803]], '#383a34', '#151814', 2);
  polygon(ctx, [[225, 91], [1500, 18], [1500, 803], [401, 803], [401, 190]], '#8b8a7c', '#20221f', 2.2);
  polygon(ctx, [[401, 190], [1500, 18], [1500, 75], [430, 248]], '#b2afa0', '#343630', 1.8);
  line(ctx, [[401, 190], [430, 248], [430, 802]], '#3a3b36', 3);
  line(ctx, [[430, 248], [1500, 75]], '#dbd5bc', 1.6);
  staircase(ctx, -412, 242, 510, 554, 13, 1);
  staircase(ctx, 1438, 113, 510, 690, 16, -1);
  staircase(ctx, -475, 726, 1960, 77, 12, 1);
  polygon(ctx, [[-500, 803], [1500, 803], [1500, 942], [-500, 942]], '#2d302b', '#11130f', 3);
  line(ctx, [[-500, ROAD_Y], [1500, ROAD_Y]], '#c5bd9e', 2.2);
  line(ctx, [[-500, ROAD_Y + 8], [1500, ROAD_Y + 8]], '#55574d', 1);
  wallCracks(ctx, seeded(14014));
  lamp(ctx);
  ctx.fillStyle = 'rgba(12,14,12,0.36)';
  ctx.fillRect(-500, 0, 2000, 1000);
}

export function shadowAt(localT) {
  const progress = Math.min(1, Math.max(0, localT / 6));
  const tension = smooth((localT - 1.75) / 0.6) * (1 - smooth((localT - 4.25) / 0.75));
  return { positionX: lerp(-310, 1310, progress), tension, heightScale: lerp(0.72, 1.03, tension), lean: lerp(-0.03, -0.26, tension), wallY: lerp(727, 642, tension) };
}

export function shadowOutlineAt(localT, pose = {}) {
  const state = shadowAt(localT);
  const phase = Number.isFinite(pose.phase) ? pose.phase : localT * TAU;
  const legWave = Math.sin(phase) * 5;
  const scale = state.heightScale;
  const baseX = state.positionX;
  const baseY = state.wallY;
  return [
    [baseX - 150 * scale, baseY - 8], [baseX - 212 * scale, baseY - 26 - legWave], [baseX - 203 * scale, baseY - 105], [baseX - 166 * scale, baseY - 159], [baseX - 126 * scale, baseY - 188], [baseX - 82 * scale, baseY - 197], [baseX - 40 * scale, baseY - 214], [baseX - 4 * scale, baseY - 268], [baseX + 20 * scale, baseY - 377 * scale], [baseX + 58 * scale, baseY - 420 * scale], [baseX + 89 * scale, baseY - 414 * scale], [baseX + 70 * scale, baseY - 394 * scale], [baseX + 53 * scale, baseY - 374 * scale], [baseX + 94 * scale, baseY - 347 * scale], [baseX + 301 * scale * (1 + state.tension * 0.65), baseY - 298 * scale], [baseX + 160 * scale, baseY - 278 * scale], [baseX + 94 * scale, baseY - 250 * scale], [baseX + 61 * scale, baseY - 202 * scale], [baseX + 39 * scale, baseY - 154 * scale], [baseX + 128 * scale, baseY - 104 * scale], [baseX + 155 * scale, baseY - 8], [baseX + 116 * scale, baseY - 12 - legWave], [baseX + 62 * scale, baseY - 91], [baseX + 24 * scale, baseY - 137], [baseX - 10 * scale, baseY - 116], [baseX - 36 * scale, baseY - 8],
  ];
}

function drawShadow(ctx, localT, pose) {
  const state = shadowAt(localT);
  const points = shadowOutlineAt(localT, pose);
  const path = new Path2D();
  points.forEach(([pointX, pointY], index) => index ? path.lineTo(pointX, pointY) : path.moveTo(pointX, pointY));
  path.closePath();
  ctx.save();
  ctx.globalAlpha = 0.91;
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 8;
  shape(ctx, path, SHADOW, SHADOW_EDGE, 2.2);
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 0.72;
  line(ctx, [[state.positionX - 190 * state.heightScale, state.wallY], [state.positionX + 154 * state.heightScale, state.wallY]], '#080a08', 5);
  ctx.globalAlpha = 0.84;
  for (const centerX of [-135, 135]) {
    ctx.beginPath();
    ctx.arc(state.positionX + centerX * state.heightScale, state.wallY, 73 * state.heightScale, 0, TAU);
    ctx.strokeStyle = '#090b09';
    ctx.lineWidth = 4.5;
    ctx.stroke();
  }
  ctx.restore();
}

export function prepare() {
  const paper = xuanPaper(14010);
  architecture = layer(2000, 1000, (ctx) => paintArchitecture(ctx, paper));
  grain = layer(2000, 1000, (ctx) => {
    const random = seeded(14018);
    for (let scratch = 0; scratch < 1800; scratch += 1) {
      const pointX = random() * 2000;
      const pointY = random() * 1000;
      const length = 2 + random() * 20;
      line(ctx, [[pointX, pointY], [pointX + length, pointY + random() * 2 - 1]], `rgba(230,230,208,${0.025 + random() * 0.08})`, 0.45 + random() * 0.5);
    }
  });
}

export function renderAt(ctx, { localT, pose }) {
  ctx.drawImage(architecture, -500, 0);
  ctx.drawImage(grain, -500, 0);
  drawShadow(ctx, localT, pose);
}

export function cameraAt() {
  return { zoom: 1, riderScale: 1 };
}

export function renderRider() {
  // The scene intentionally contains only the projected bicycle shadow.
}

export function renderTitle(ctx, { x: titleX }) {
  ctx.save();
  ctx.fillStyle = 'rgba(19,22,18,0.9)';
  ctx.fillRect(titleX - 12, 111, 508, 169);
  ctx.strokeStyle = '#989889';
  ctx.lineWidth = 1;
  ctx.strokeRect(titleX - 4, 118, 492, 155);
  text(ctx, scene.zh, titleX + 14, 174, { size: 54, color: INK, weight: 600 });
  text(ctx, 'NOSFERATU', titleX + 17, 214, { size: 24, color: '#b4b39e', family: SANS });
  text(ctx, '1922  ·  默片阴影', titleX + 17, 252, { size: 23, color: '#a9a895' });
  line(ctx, [[titleX + 20, 263], [titleX + 186, 263]], '#7c7d70', 1.8);
  ctx.restore();
}
