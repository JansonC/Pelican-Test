import { SCENES } from './catalog.js';
import { ROAD_Y, clamp } from '../beat/timeline.js';
import { line, text, SANS } from '../kit/canvas.js';
import { layer } from '../kit/materials.js';
import { lerp, seeded, smooth } from '../kit/math.js';
import { CUES } from '../beat/events.js';

export const scene = SCENES[14];
export const finished = true;
export const TITLE_GLYPHS = '示波器矢量图错转旋钮余辉李萨如绿屏通电';

const TAU = Math.PI * 2;
const SCREEN_X = 500;
const SCREEN_Y = 447;
const SCREEN_R = 306;
const PHOSPHOR = '#8edb8e';
const PHOSPHOR_DIM = '#417a62';
const PHOSPHOR_BRIGHT = '#d0ffd0';
const CASE_DARK = '#202f29';
const INK = '#13221c';
let instrument;

function circle(ctx, x, y, radius, fill = null, stroke = null, width = 1) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
}

function rounded(ctx, x, y, width, height, radius, fill, stroke = null, lineWidth = 1) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
}

function phosphorLine(ctx, points, alpha = 1, width = 2, bright = false) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  line(ctx, points, `rgba(110,220,138,${bright ? 0.2 : 0.12})`, width * 4.2);
  line(ctx, points, bright ? PHOSPHOR_BRIGHT : PHOSPHOR, width);
  ctx.restore();
}

function vectorBodyPoints(pose = {}) {
  const bob = Number.isFinite(pose.bob) ? pose.bob : 0;
  return [
    [-126, -180 + bob], [-171, -183 + bob], [-166, -220 + bob], [-132, -245 + bob],
    [-90, -260 + bob], [-46, -251 + bob], [-12, -231 + bob], [7, -252 + bob],
    [7, -286 + bob], [2, -322 + bob], [28, -350 + bob], [63, -350 + bob],
    [91, -333 + bob], [87, -311 + bob], [67, -296 + bob], [58, -262 + bob],
    [39, -213 + bob], [8, -176 + bob], [-54, -158 + bob], [-126, -180 + bob],
    [82, -326 + bob], [230, -298 + bob], [164, -286 + bob], [92, -305 + bob],
  ];
}

export function vectorIntensityAt(localT) {
  return 0.24 + 0.76 * smooth(localT / 0.85) * (1 - 0.08 * smooth((localT - 5.45) / 0.55));
}

export function scopeOutlineAt(localT, pose = {}) {
  return { points: vectorBodyPoints(pose), intensity: vectorIntensityAt(localT), x: 0, y: 0 };
}

export const vectorOutlineAt = scopeOutlineAt;

export function scopeDialAt(localT) {
  const wrong = smooth((localT - (CUES.wrongDial - scene.start)) / 0.22) * (1 - smooth((localT - 3.45) / 0.48));
  const settle = smooth((localT - 3.45) / 0.52);
  return { wrong, settle, angle: lerp(-0.5, 1.35, wrong) + settle * -0.22, lissajous: wrong > 0.04 };
}

export const dialAt = scopeDialAt;

export function lissajousAt(localT, count = 160) {
  const state = scopeDialAt(localT);
  const points = [];
  const amount = state.wrong;
  const phase = localT * TAU * 0.8;
  for (let index = 0; index < count; index += 1) {
    const u = index / (count - 1);
    const a = u * TAU * 2.4 + phase;
    points.push([SCREEN_X + Math.sin(a * (1.1 + amount * 1.7)) * (SCREEN_R - 38), SCREEN_Y + Math.sin(a * (2.05 + amount * 2.4) + 0.8) * (SCREEN_R - 51)]);
  }
  return points;
}

function waveformAt(localT, count = 180) {
  const points = [];
  const drift = localT * TAU * 0.32;
  for (let index = 0; index < count; index += 1) {
    const u = index / (count - 1);
    const x = SCREEN_X - SCREEN_R + 32 + u * (SCREEN_R * 2 - 64);
    points.push([x, SCREEN_Y + Math.sin(u * TAU * 3.4 + drift) * 49 + Math.sin(u * TAU * 8.2 - drift * 0.8) * 12]);
  }
  return points;
}

function paintInstrument(ctx) {
  ctx.save();
  ctx.translate(500, 0);
  const body = ctx.createLinearGradient(-430, 100, 1370, 900);
  body.addColorStop(0, '#35483d'); body.addColorStop(0.5, '#546257'); body.addColorStop(1, '#283a31');
  rounded(ctx, -415, 83, 1830, 824, 38, body, '#17251e', 5);
  rounded(ctx, -388, 108, 1776, 773, 26, CASE_DARK, '#718071', 2);
  circle(ctx, SCREEN_X, SCREEN_Y, 359, '#0b1713', '#798a79', 8);
  circle(ctx, SCREEN_X, SCREEN_Y, 334, '#10271c', '#172c22', 3);
  ctx.save();
  ctx.beginPath(); ctx.arc(SCREEN_X, SCREEN_Y, SCREEN_R, 0, TAU); ctx.clip();
  const glow = ctx.createRadialGradient(SCREEN_X - 48, SCREEN_Y - 72, 40, SCREEN_X, SCREEN_Y, SCREEN_R);
  glow.addColorStop(0, 'rgba(46,115,75,0.21)'); glow.addColorStop(0.8, 'rgba(10,38,25,0.06)'); glow.addColorStop(1, 'rgba(4,16,11,0.43)');
  ctx.fillStyle = glow; ctx.fillRect(SCREEN_X - SCREEN_R, SCREEN_Y - SCREEN_R, SCREEN_R * 2, SCREEN_R * 2);
  for (let tick = -4; tick <= 4; tick += 1) {
    const p = tick / 4;
    line(ctx, [[SCREEN_X - SCREEN_R, SCREEN_Y + p * SCREEN_R * 0.86], [SCREEN_X + SCREEN_R, SCREEN_Y + p * SCREEN_R * 0.86]], 'rgba(111,206,132,0.12)', 1);
    line(ctx, [[SCREEN_X + p * SCREEN_R * 0.86, SCREEN_Y - SCREEN_R], [SCREEN_X + p * SCREEN_R * 0.86, SCREEN_Y + SCREEN_R]], 'rgba(111,206,132,0.12)', 1);
  }
  for (let tick = -3; tick <= 3; tick += 1) { ctx.beginPath(); ctx.arc(SCREEN_X, SCREEN_Y, 78 + (tick + 3) * 57, 0, TAU); ctx.strokeStyle = 'rgba(111,206,132,0.11)'; ctx.lineWidth = 1; ctx.stroke(); }
  ctx.restore();
  for (const [x, y] of [[-353, 138], [1353, 138], [-353, 846], [1353, 846]]) { circle(ctx, x, y, 11, '#293a31', '#9da996', 2); line(ctx, [[x - 5, y - 5], [x + 5, y + 5]], '#17251e', 2); }
  const knob = (x, y, radius, label, accent) => {
    circle(ctx, x, y, radius + 12, '#1e2d25', '#748575', 2); circle(ctx, x, y, radius, '#607064', '#17241d', 3);
    for (let index = 0; index < 9; index += 1) { const angle = -1.15 + index * 0.29; line(ctx, [[x + Math.cos(angle) * (radius + 17), y + Math.sin(angle) * (radius + 17)], [x + Math.cos(angle) * (radius + 23), y + Math.sin(angle) * (radius + 23)]], '#a5b59d', 1.2); }
    line(ctx, [[x, y], [x + Math.cos(-0.55) * radius * 0.72, y + Math.sin(-0.55) * radius * 0.72]], accent, 4);
    text(ctx, label, x, y + radius + 42, { size: 17, color: '#c1cdb6', align: 'center', family: SANS });
  };
  knob(1085, 325, 48, 'TIME / DIV', '#b4d69e'); knob(1248, 325, 43, 'VOLTS / DIV', '#b4d69e'); knob(1164, 520, 61, 'CAL', '#e0c985');
  rounded(ctx, 1004, 665, 332, 83, 10, '#1b2a22', '#758473', 2);
  text(ctx, 'VECTOR / 1950s', 1170, 701, { size: 19, color: PHOSPHOR, align: 'center', family: SANS, weight: 600 }); text(ctx, 'SCOPE-14', 1170, 728, { size: 14, color: '#b4c4ad', align: 'center', family: SANS });
  ctx.fillStyle = '#17251e'; ctx.fillRect(-500, ROAD_Y, 2000, 198); line(ctx, [[-500, ROAD_Y], [1500, ROAD_Y]], PHOSPHOR_DIM, 3); line(ctx, [[-500, ROAD_Y + 8], [1500, ROAD_Y + 8]], '#263f32', 1);
  for (let x = -500; x < 1500; x += 120) line(ctx, [[x, ROAD_Y + 42], [x + 37, ROAD_Y + 42]], '#395846', 1.4);
  ctx.restore();
}

export function prepare() { instrument = layer(2000, 1000, paintInstrument, 1.2); }

function drawTrace(ctx, localT) {
  const state = scopeDialAt(localT); const points = state.lissajous ? lissajousAt(localT) : waveformAt(localT);
  phosphorLine(ctx, points, 0.58 + 0.32 * (1 - state.wrong), state.lissajous ? 2.2 : 1.8, true);
  for (let sample = 1; sample <= 4; sample += 1) { const earlier = Math.max(0, localT - sample * 0.08); phosphorLine(ctx, state.lissajous ? lissajousAt(earlier, 100) : waveformAt(earlier, 100), 0.07 / sample, 1.2, false); }
  const random = seeded(8700 + Math.floor(localT * 30 + 1e-6));
  ctx.save(); ctx.beginPath(); ctx.arc(SCREEN_X, SCREEN_Y, SCREEN_R - 4, 0, TAU); ctx.clip();
  for (let index = 0; index < 95; index += 1) { const x = SCREEN_X - SCREEN_R + random() * SCREEN_R * 2; const y = SCREEN_Y - SCREEN_R + random() * SCREEN_R * 2; const length = 2 + random() * 12; line(ctx, [[x, y], [x + length, y]], `rgba(142,219,142,${0.025 + random() * 0.07})`, 0.7); }
  ctx.restore();
}

export function renderAt(ctx, { localT = 0 } = {}) { ctx.drawImage(instrument, -500, 0, 2000, 1000); drawTrace(ctx, clamp(localT, 0, 6)); }

function drawVectorBody(ctx, pose, intensity) {
  const points = vectorBodyPoints(pose); phosphorLine(ctx, points.slice(0, 20), intensity, 3.2, true); phosphorLine(ctx, [points[19], points[20], points[21], points[22], points[23]], intensity, 2.4, false);
  phosphorLine(ctx, [[-124, -226 + pose.bob], [-91, -246 + pose.bob], [-43, -220 + pose.bob], [9, -185 + pose.bob], [82, -151 + pose.bob]], intensity, 2.1, false); circle(ctx, 68, -333 + pose.bob, 4, PHOSPHOR_BRIGHT);
}

export function renderRider(ctx, pose, { x, y, scale = 1, localT = 0 } = {}) {
  const intensity = vectorIntensityAt(localT); ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const limb = (knee, foot, alpha) => { phosphorLine(ctx, [[pose.hip.x, pose.hip.y], [knee.x, knee.y], [foot.x, foot.y]], intensity * alpha, 4, true); phosphorLine(ctx, [[foot.x - 10, foot.y + 7], [foot.x + 19, foot.y + 7]], intensity * alpha, 2.4, false); };
  limb(pose.farKnee, pose.farFoot, 0.66);
  for (const center of [-135, 135]) { ctx.save(); ctx.translate(center, 0); ctx.rotate(pose.wheelAngle); ctx.beginPath(); ctx.arc(0, 0, 73, 0, TAU); ctx.strokeStyle = `rgba(142,219,142,${0.22 * intensity})`; ctx.lineWidth = 7; ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 69, 0, TAU); ctx.strokeStyle = PHOSPHOR; ctx.lineWidth = 2.4; ctx.stroke(); for (let spoke = 0; spoke < 12; spoke += 1) phosphorLine(ctx, [[0, 0], [Math.cos(spoke * TAU / 12) * 65, Math.sin(spoke * TAU / 12) * 65]], intensity * 0.52, 1.1, false); ctx.restore(); }
  phosphorLine(ctx, [[-135, 0], [-60, -115], [-20, -4], [-135, 0]], intensity, 4.3, true); phosphorLine(ctx, [[-60, -115], [80, -105], [-20, -4]], intensity, 4.3, true); phosphorLine(ctx, [[80, -105], [135, 0], [80, -105], [72, -145], [102, -154], [117, -144]], intensity, 3.1, false); phosphorLine(ctx, [[-60, -115], [-66, -139], [-91, -139], [-43, -139]], intensity, 3.1, false); phosphorLine(ctx, [[pose.farFoot.x, pose.farFoot.y], [-20, -4], [pose.nearFoot.x, pose.nearFoot.y]], intensity, 2.7, false); phosphorLine(ctx, [[-130, 4], [-20, 20], [-16, -27], [-132, -5]], intensity, 1.4, false); drawVectorBody(ctx, pose, intensity); limb(pose.nearKnee, pose.nearFoot, 1); ctx.restore();
}

export function renderTitle(ctx, { x: titleX } = {}) {
  ctx.save(); rounded(ctx, titleX - 15, 108, 572, 171, 8, 'rgba(10,29,22,0.94)', '#66806e', 2); line(ctx, [[titleX + 2, 129], [titleX + 2, 261]], '#8edb8e', 1);
  text(ctx, '15   /   VECTOR INSTRUMENT', titleX + 19, 139, { size: 15, color: '#9ac69d', family: SANS, weight: 600 }); text(ctx, scene.zh, titleX + 17, 203, { size: 47, color: '#d6f0d1', weight: 600 }); text(ctx, 'OSCILLOSCOPE VECTOR', titleX + 20, 237, { size: 20, color: '#95c498', family: SANS }); text(ctx, scene.era, titleX + 20, 267, { size: 22, color: '#c7dcbd' }); ctx.restore();
}
