import { SCENES } from './catalog.js';
import { ROAD_Y, clamp } from '../beat/timeline.js';
import { line, text, SANS } from '../kit/canvas.js';
import { layer } from '../kit/materials.js';
import { seeded, smooth } from '../kit/math.js';

export const scene = SCENES[15];
export const finished = true;
export const TITLE_GLYPHS = '8-bit 像素游戏像素骑行金币一关跳坑生命值';
export const UI_GLYPHS = '分数生命一关金幣金币1UP';

// A deliberately small fixed palette keeps this study inside the twelve-colour
// vocabulary of an early home console. Dynamic shapes are snapped to this grid.
const PALETTE = Object.freeze({
  sky: '#adcaba', sky2: '#8fb3aa', hill: '#668a88', hillDark: '#3e656b',
  deep: '#304b4e', ink: '#253b40', road: '#436466', roadLight: '#6e8c78',
  paper: '#d8dfc4', gold: '#cca75c', goldHi: '#f0d27b', red: '#b96853',
});
const GRID = 6;
const TAU = Math.PI * 2;
let level;

function snap(value) { return Math.round(value / GRID) * GRID; }
function rect(ctx, x, y, width, height, color) {
  ctx.fillStyle = color;
  ctx.fillRect(snap(x), snap(y), Math.max(GRID, snap(width)), Math.max(GRID, snap(height)));
}
function pixelLine(ctx, points, color, width = GRID) {
  const oldCap = ctx.lineCap;
  const oldJoin = ctx.lineJoin;
  ctx.lineCap = 'butt'; ctx.lineJoin = 'miter';
  line(ctx, points.map(([x, y]) => [snap(x), snap(y)]), color, Math.max(GRID, snap(width)));
  ctx.lineCap = oldCap; ctx.lineJoin = oldJoin;
}
function pixelCircle(ctx, x, y, radius, color, thickness = GRID) {
  const outer = radius * radius;
  const inner = Math.max(0, radius - thickness) ** 2;
  ctx.fillStyle = color;
  for (let yy = -radius; yy <= radius; yy += GRID) for (let xx = -radius; xx <= radius; xx += GRID) {
    const distance = xx * xx + yy * yy;
    if (distance <= outer && distance >= inner) ctx.fillRect(snap(x + xx), snap(y + yy), GRID, GRID);
  }
}
function sprite(ctx, rows, originX, originY, cell, colors) {
  for (let row = 0; row < rows.length; row += 1) for (let column = 0; column < rows[row].length; column += 1) {
    const color = colors[rows[row][column]];
    if (color) rect(ctx, originX + column * cell, originY + row * cell, cell, cell, color);
  }
}

function buildLevel() {
  // Author at 1/4 resolution and enlarge with nearest-neighbour sampling.
  const canvas = document.createElement('canvas'); canvas.width = 500; canvas.height = 250;
  const ctx = canvas.getContext('2d');
  const sx = (x) => Math.round((x + 500) / 4); const sy = (y) => Math.round(y / 4);
  const fill = (x, y, width, height, color) => { ctx.fillStyle = color; ctx.fillRect(sx(x), sy(y), Math.max(1, Math.round(width / 4)), Math.max(1, Math.round(height / 4))); };
  const poly = (points, color) => { ctx.fillStyle = color; ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(sx(x), sy(y)) : ctx.moveTo(sx(x), sy(y))); ctx.closePath(); ctx.fill(); };
  ctx.fillStyle = PALETTE.sky; ctx.fillRect(0, 0, canvas.width, canvas.height);
  fill(-500, 160, 2000, 180, PALETTE.sky2);
  for (const [x, y, width] of [[-360, 205, 190], [50, 135, 150], [980, 188, 230], [1320, 112, 160]]) {
    fill(x, y, width, 24, PALETTE.paper); fill(x + 28, y - 18, width * 0.56, 18, PALETTE.paper); fill(x + 70, y - 29, width * 0.24, 13, PALETTE.paper);
  }
  poly([[-500, 574], [-500, 440], [-390, 440], [-390, 404], [-270, 404], [-270, 366], [-150, 366], [-150, 412], [-30, 412], [-30, 348], [84, 348], [84, 410], [198, 410], [198, 378], [314, 378], [314, 445], [430, 445], [430, 392], [560, 392], [560, 456], [700, 456], [700, 393], [836, 393], [836, 442], [970, 442], [970, 360], [1090, 360], [1090, 422], [1210, 422], [1210, 385], [1326, 385], [1326, 446], [1500, 446], [1500, 574]], PALETTE.hillDark);
  poly([[-500, 640], [-500, 524], [-374, 524], [-374, 476], [-244, 476], [-244, 505], [-110, 505], [-110, 458], [24, 458], [24, 515], [167, 515], [167, 471], [302, 471], [302, 520], [436, 520], [436, 474], [566, 474], [566, 524], [708, 524], [708, 478], [842, 478], [842, 515], [977, 515], [977, 458], [1110, 458], [1110, 512], [1244, 512], [1244, 472], [1385, 472], [1385, 510], [1500, 510], [1500, 640]], PALETTE.hill);
  for (const [x, y, width, height, roof] of [[-280, 628, 112, 86, PALETTE.red], [44, 604, 132, 109, PALETTE.gold], [346, 635, 106, 79, PALETTE.red], [846, 610, 142, 104, PALETTE.gold], [1204, 625, 118, 88, PALETTE.red]]) {
    fill(x, y - height, width, height, PALETTE.paper); fill(x - 11, y - height - 17, width + 22, 18, roof); fill(x + 20, y - height + 29, 24, 31, PALETTE.deep); fill(x + width - 43, y - height + 29, 24, 31, PALETTE.deep); fill(x + width / 2 - 12, y - 42, 24, 42, PALETTE.red);
  }
  for (const x of [-198, 260, 755, 1115, 1432]) { fill(x, 383, 7, 245, PALETTE.deep); fill(x + 7, 392, 42, 18, PALETTE.gold); fill(x + 7, 410, 28, 10, PALETTE.red); }
  fill(-500, 708, 2000, 94, PALETTE.roadLight); fill(-500, ROAD_Y, 2000, 198, PALETTE.road); fill(-500, ROAD_Y + 12, 2000, 12, PALETTE.deep);
  for (let x = -500; x < 1500; x += 72) fill(x, ROAD_Y + 43, 38, 8, PALETTE.roadLight);
  for (let x = -500; x < 1500; x += 122) { fill(x, 747, 85, 14, PALETTE.paper); fill(x + 8, 761, 10, 43, PALETTE.deep); fill(x + 63, 761, 10, 43, PALETTE.deep); }
  fill(440, ROAD_Y, 194, 58, PALETTE.ink); fill(458, ROAD_Y + 50, 157, 62, PALETTE.deep); fill(470, ROAD_Y + 104, 133, 46, PALETTE.ink); fill(426, ROAD_Y, 35, 12, PALETTE.red); fill(615, ROAD_Y, 35, 12, PALETTE.red);
  for (const [x, y] of [[453, 839], [487, 871], [548, 853], [599, 889]]) fill(x, y, 13, 7, PALETTE.hillDark);
  const random = seeded(16016); for (let index = 0; index < 125; index += 1) { const x = -500 + random() * 2000; const y = ROAD_Y + 26 + random() * 165; fill(x, y, 5 + random() * 17, 4, random() > 0.5 ? PALETTE.roadLight : PALETTE.deep); }
  return canvas;
}

export function prepare() { level = buildLevel(); }
export function jumpAt(localT) { if (!Number.isFinite(localT) || localT <= 2 || localT >= 4) return 0; return Math.sin(((localT - 2) / 2) * Math.PI); }
export function coinAt(localT) { if (!Number.isFinite(localT)) return 1; return 1 - smooth((localT - 2.72) / 0.28); }
export function oneUpAt(localT) { if (!Number.isFinite(localT)) return 0; return smooth((localT - 2.85) / 0.12) * (1 - smooth((localT - 3.72) / 0.34)); }
export function animationFrameAt(localT) { if (!Number.isFinite(localT)) return 0; return Math.floor(Math.max(0, localT) * 10 + 1e-9); }
export function pixelFrameAt(localT) { return animationFrameAt(localT) % 4; }

function drawCoin(ctx, centerX, centerY, alpha) {
  ctx.save(); ctx.globalAlpha *= alpha;
  rect(ctx, centerX - 18, centerY - 30, 36, 60, PALETTE.gold); rect(ctx, centerX - 12, centerY - 36, 24, 6, PALETTE.gold); rect(ctx, centerX - 12, centerY + 30, 24, 6, PALETTE.gold); rect(ctx, centerX - 6, centerY - 24, 12, 48, PALETTE.goldHi);
  ctx.restore();
}

export function renderAt(ctx, { localT = 0 }) {
  if (!level) level = buildLevel();
  ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(level, -500, 0, 2000, 1000);
  const coinVisibility = clamp(coinAt(localT)); if (coinVisibility > 0.01) { const spin = pixelFrameAt(localT) % 2; drawCoin(ctx, 550, 650, coinVisibility); drawCoin(ctx, 652, 602 + spin * 6, coinVisibility * 0.86); }
  const oneUp = oneUpAt(localT); if (oneUp > 0) { ctx.globalAlpha = oneUp; rect(ctx, 458, 518, 174, 52, PALETTE.deep); text(ctx, '1UP!', 545, 556, { size: 38, color: PALETTE.goldHi, family: SANS, weight: 800, align: 'center' }); ctx.globalAlpha = 1; }
  ctx.restore();
}

function drawPixelRider(ctx, pose, frame) {
  const colors = { '#': PALETTE.ink, w: PALETTE.paper, g: PALETTE.gold, r: PALETTE.red, h: PALETTE.goldHi };
  const pulse = frame % 4;
  pixelCircle(ctx, -135, 0, 73, PALETTE.ink, 8); pixelCircle(ctx, -135, 0, 63, PALETTE.roadLight, 5); pixelCircle(ctx, 135, 0, 73, PALETTE.ink, 8); pixelCircle(ctx, 135, 0, 63, PALETTE.roadLight, 5);
  for (const centerX of [-135, 135]) { for (let spoke = 0; spoke < 8; spoke += 1) { const angle = frame * 0.24 + spoke * TAU / 8; pixelLine(ctx, [[centerX, 0], [centerX + Math.cos(angle) * 63, Math.sin(angle) * 63]], PALETTE.deep, 5); } rect(ctx, centerX - 6, -6, 12, 12, PALETTE.gold); }
  pixelLine(ctx, [[-135, 0], [-62, -115], [-20, -4], [-135, 0]], PALETTE.deep, 9); pixelLine(ctx, [[-62, -115], [80, -105], [-20, -4]], PALETTE.deep, 9); pixelLine(ctx, [[80, -105], [135, 0]], PALETTE.deep, 9); pixelLine(ctx, [[80, -105], [73, -147], [105, -155]], PALETTE.ink, 8); rect(ctx, -91, -145, 50, 10, PALETTE.gold);
  const leg = (knee, foot, color) => { pixelLine(ctx, [[pose.hip.x, pose.hip.y], [knee.x, knee.y], [foot.x, foot.y]], color, 7); rect(ctx, foot.x - 9, foot.y + 2, 27, 8, PALETTE.ink); };
  leg(pose.farKnee, pose.farFoot, PALETTE.roadLight); pixelLine(ctx, [[pose.farFoot.x, pose.farFoot.y], [-20, -4], [pose.nearFoot.x, pose.nearFoot.y]], PALETTE.gold, 6);
  sprite(ctx, ['....................', '......###...........', '.....#####..........', '....#######.........', '.....########.......', '....##########......', '...############.....', '...##############...', '....############....', '.....##########.....', '......########......', '.......####.........'], -130, -350 + Math.round((pulse % 2) * 3), 10, colors);
  sprite(ctx, ['................', '..##............', '..####..........', '...######.......', '....########....', '.....##########.', '......##########', '.......########.'], -112, -276, 10, { '#': PALETTE.ink });
  sprite(ctx, ['....######..', '..##########', '.############', '#############', '.###########.', '..########...'], 20, -355, 10, { '#': PALETTE.paper });
  sprite(ctx, ['################', '.##############.', '..##########....'], 100, -335, 10, { '#': PALETTE.gold }); rect(ctx, 77, -343, 8, 8, PALETTE.ink); pixelLine(ctx, [[86, -321], [222, -301]], PALETTE.ink, 5);
  leg(pose.nearKnee, pose.nearFoot, PALETTE.red); rect(ctx, pose.nearFoot.x - 9, pose.nearFoot.y + 5, 28, 8, PALETTE.ink);
}

export function renderRider(ctx, pose, { x, y, scale = 1, localT = 0 }) {
  ctx.save(); ctx.imageSmoothingEnabled = false; ctx.translate(snap(x), snap(y - jumpAt(localT) * 96)); ctx.scale(scale, scale); drawPixelRider(ctx, pose, animationFrameAt(localT)); ctx.restore();
}

export function renderTitle(ctx, { x: titleX }) {
  const left = titleX; rect(ctx, left - 12, 98, 505, 191, PALETTE.paper); rect(ctx, left - 12, 98, 505, 10, PALETTE.deep); rect(ctx, left - 12, 279, 505, 10, PALETTE.deep);
  text(ctx, '16  /  PIXEL QUEST', left + 14, 142, { size: 17, color: PALETTE.deep, family: SANS, weight: 700 }); text(ctx, scene.zh, left + 14, 202, { size: 48, color: PALETTE.deep, weight: 700 }); text(ctx, '8-BIT CYCLING', left + 16, 237, { size: 21, color: PALETTE.red, family: SANS, weight: 700 }); text(ctx, '1980s', left + 16, 270, { size: 20, color: PALETTE.deep, family: SANS }); rect(ctx, left + 363, 130, 92, 31, PALETTE.deep); text(ctx, 'SCORE 016', left + 409, 152, { size: 13, color: PALETTE.goldHi, family: SANS, align: 'center', weight: 700 });
}
