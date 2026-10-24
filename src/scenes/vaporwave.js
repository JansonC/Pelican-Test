import { SCENES } from './catalog.js';
import { text, line, SANS } from '../kit/canvas.js';
import { layer } from '../kit/materials.js';
import { seeded, smooth } from '../kit/math.js';
import { ROAD_Y } from '../beat/timeline.js';

export const scene = SCENES[17];
export const finished = true;
export const TITLE_GLYPHS = '蒸汽波日落网格海岸棕榈胸像磁带变速跳针2010s';

const PINK = '#d78da9';
const PURPLE = '#755c9e';
const CYAN = '#66bcb8';
const INDIGO = '#272447';
const CREAM = '#f1d9e5';
const TAU = Math.PI * 2;
let landscape;
let bust;

function polygon(ctx, points, fill, stroke = null, width = 1) {
  ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
}

function palm(ctx, x, y, scale, flip = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip * scale, scale);
  ctx.strokeStyle = INDIGO;
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-14, -118, 8, -247, -38, -389);
  ctx.stroke();
  for (let i = 0; i < 8; i += 1) {
    const angle = -1.22 + i * 0.34;
    const len = 72 + (i % 3) * 24;
    line(ctx, [[-37, -388], [-37 + Math.cos(angle) * len, -388 + Math.sin(angle) * len]], i % 2 ? CYAN : PINK, 7);
  }
  ctx.restore();
}

function grid(ctx) {
  ctx.save();
  ctx.translate(500, 0);
  ctx.strokeStyle = 'rgba(102,188,184,0.64)';
  ctx.lineWidth = 1.5;
  for (let y = ROAD_Y - 6; y <= 1000; y += 23) {
    const depth = (y - ROAD_Y + 6) / 198;
    ctx.beginPath();
    ctx.moveTo(-500, y);
    ctx.lineTo(1500, y);
    ctx.stroke();
    if (depth > 0) {
      ctx.strokeStyle = 'rgba(215,141,169,0.5)';
      for (let x = -500; x < 1500; x += 90) line(ctx, [[x, y], [x + (x - 500) * depth * 0.18, y + 18]], 'rgba(215,141,169,0.42)', 1.2);
      ctx.strokeStyle = 'rgba(102,188,184,0.64)';
    }
  }
  for (let x = -550; x <= 1550; x += 100) line(ctx, [[x, ROAD_Y], [500 + (x - 500) * 2.4, 1000]], 'rgba(102,188,184,0.62)', 1.4);
  ctx.restore();
}

function buildLandscape() {
  return layer(2000, 1000, (ctx) => {
    const sky = ctx.createLinearGradient(0, 0, 0, 1000);
    sky.addColorStop(0, '#5b4c88'); sky.addColorStop(0.47, PINK); sky.addColorStop(0.7, '#dd8fab'); sky.addColorStop(1, INDIGO);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, 2000, 1000);
    ctx.translate(500, 0);
    ctx.fillStyle = '#f3c0c8'; ctx.beginPath(); ctx.arc(1070, 318, 112, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(249,211,219,0.28)'; ctx.beginPath(); ctx.arc(1070, 318, 145, 0, TAU); ctx.fill();
    polygon(ctx, [[-500, 555], [1500, 536], [1500, 805], [-500, 805]], '#7b5b8e', '#3e385c', 3);
    palm(ctx, -286, 803, 0.88, 1); palm(ctx, 1350, 804, 0.8, -1);
    // A coded abstract bust replaces any imported statue reference.
    ctx.save(); ctx.translate(1030, 690); ctx.scale(0.9, 0.9);
    polygon(ctx, [[-140, 165], [-173, 43], [-136, -82], [-86, -149], [-34, -194], [31, -192], [94, -148], [132, -40], [162, 156]], '#5e4f80', '#302b52', 5);
    ctx.fillStyle = '#dca1ba'; ctx.beginPath(); ctx.ellipse(4, -146, 75, 91, 0, 0, TAU); ctx.fill();
    line(ctx, [[-36, -170], [-5, -190], [38, -170]], PURPLE, 8);
    line(ctx, [[-48, -141], [-22, -136]], INDIGO, 4); line(ctx, [[28, -136], [54, -141]], INDIGO, 4);
    line(ctx, [[-5, -123], [4, -91], [26, -87]], '#9a517d', 3);
    line(ctx, [[-35, -60], [0, -48], [39, -60]], INDIGO, 5);
    for (let i = 0; i < 7; i += 1) line(ctx, [[-118 + i * 38, 3], [-105 + i * 38, 137]], i % 2 ? CYAN : PINK, 5);
    ctx.restore();
    polygon(ctx, [[-500, ROAD_Y], [1500, ROAD_Y], [1500, 1000], [-500, 1000]], 'rgba(34,29,65,0.7)', null);
    grid(ctx);
    line(ctx, [[-500, ROAD_Y], [1500, ROAD_Y]], CYAN, 4);
    line(ctx, [[-500, ROAD_Y + 13], [1500, ROAD_Y + 13]], PINK, 2);
    const noise = seeded(18021);
    for (let i = 0; i < 680; i += 1) {
      const x = -500 + noise() * 2000; const y = noise() * 1000;
      ctx.fillStyle = i % 2 ? 'rgba(255,218,232,0.08)' : 'rgba(35,30,65,0.1)';
      ctx.fillRect(x, y, 1 + noise() * 2.5, 1 + noise() * 1.5);
    }
    for (let y = 0; y < 1000; y += 5) line(ctx, [[-500, y], [1500, y]], 'rgba(255,255,255,0.026)', 0.8);
  });
}

function buildBust() {
  return layer(360, 400, (ctx) => {
    ctx.translate(180, 200);
    polygon(ctx, [[-132, 186], [-158, 82], [-116, -71], [-70, -132], [-14, -168], [50, -161], [106, -110], [136, 77], [148, 186]], '#67558c', '#2e2a4e', 5);
    ctx.fillStyle = '#dca1ba'; ctx.beginPath(); ctx.ellipse(0, -124, 71, 91, 0, 0, TAU); ctx.fill();
    line(ctx, [[-39, -148], [0, -168], [40, -147]], '#8a4b7e', 8);
    line(ctx, [[-49, -122], [-22, -117]], INDIGO, 4); line(ctx, [[23, -117], [50, -122]], INDIGO, 4);
    line(ctx, [[-5, -105], [3, -71], [25, -67]], '#985377', 3);
    line(ctx, [[-35, -39], [0, -29], [38, -40]], INDIGO, 5);
    for (let i = 0; i < 6; i += 1) line(ctx, [[-101 + i * 39, 14], [-92 + i * 39, 150]], i % 2 ? CYAN : PINK, 5);
  });
}

export function tapeRateAt(localT) {
  const slowRate = 0.7937005259840998;
  if (localT < 2) return 1 - smooth(localT / 2) * (1 - slowRate);
  if (localT < 4) return slowRate;
  return slowRate + smooth((localT - 4) / 2) * (1 - slowRate);
}

export function skipAt(localT) {
  const active = localT >= 2 && localT < 4;
  if (!active) return { active: false, phase: 0, count: 0 };
  const phase = ((localT - 2) % 0.5) / 0.5;
  return { active: true, phase, count: Math.floor((localT - 2) / 0.5) };
}

export function prepare() {
  landscape = buildLandscape();
  bust = buildBust();
}

export function renderAt(ctx, { localT }) {
  ctx.drawImage(landscape, -500, 0, 2000, 1000);
  const skip = skipAt(localT);
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.drawImage(bust, 920, 495, 220, 245);
  ctx.restore();
  if (skip.active) {
    const pulse = Math.exp(-(((skip.phase - 0.16) / 0.12) ** 2));
    ctx.save();
    ctx.globalAlpha = 0.3 + pulse * 0.28;
    ctx.fillStyle = '#f5c1d7';
    ctx.fillRect(-500, 0, 2000, 7);
    ctx.globalCompositeOperation = 'screen';
    ctx.drawImage(landscape, -500 + 5 + pulse * 4, 0, 2000, 1000);
    ctx.restore();
  }
}

function wheel(ctx, center, angle) {
  ctx.beginPath(); ctx.arc(center, 0, 73, 0, TAU); ctx.strokeStyle = CYAN; ctx.lineWidth = 5; ctx.stroke();
  ctx.beginPath(); ctx.arc(center + 3, 0, 69, 0, TAU); ctx.strokeStyle = PINK; ctx.lineWidth = 2; ctx.stroke();
  for (let i = 0; i < 12; i += 1) { const a = angle + i * TAU / 12; line(ctx, [[center, 0], [center + Math.cos(a) * 67, Math.sin(a) * 67]], '#c4a8cc', 1.3); }
}

export function renderRider(ctx, pose, { x: positionX, y: positionY, scale = 1 }) {
  ctx.save(); ctx.translate(positionX, positionY); ctx.scale(scale, scale);
  const limb = (knee, foot, color, width) => { line(ctx, [[pose.hip.x, pose.hip.y], [knee.x, knee.y], [foot.x, foot.y]], '#332953', width + 2); line(ctx, [[pose.hip.x, pose.hip.y], [knee.x, knee.y], [foot.x, foot.y]], color, width); };
  limb(pose.farKnee, pose.farFoot, CYAN, 5); wheel(ctx, -135, pose.wheelAngle); wheel(ctx, 135, pose.wheelAngle);
  line(ctx, [[-135, 0], [-62, -115], [-20, -4], [-135, 0]], CYAN, 6); line(ctx, [[-62, -115], [80, -105], [-20, -4]], PINK, 6); line(ctx, [[80, -105], [135, 0]], CYAN, 6); line(ctx, [[80, -105], [73, -147], [104, -154]], PINK, 5); line(ctx, [[-90, -140], [-43, -140]], INDIGO, 8);
  line(ctx, [[pose.farFoot.x, pose.farFoot.y], [-20, -4], [pose.nearFoot.x, pose.nearFoot.y]], PINK, 3);
  ctx.save(); ctx.translate(0, pose.bob * 0.6);
  polygon(ctx, [[-153, -194], [-180, -223], [-143, -218], [-116, -250], [-72, -263], [-30, -247], [3, -252], [4, -294], [20, -336], [49, -355], [81, -343], [98, -319], [76, -299], [61, -285], [66, -250], [42, -214], [6, -183], [-58, -168]], CREAM, INDIGO, 3.2);
  polygon(ctx, [[-139, -229], [-94, -248], [-44, -226], [11, -193], [107, -148], [59, -155], [4, -170], [-54, -188], [-109, -190]], CYAN, INDIGO, 2.2);
  for (let i = 0; i < 7; i += 1) line(ctx, [[-116 + i * 20, -227 + i * 6], [-98 + i * 20, -195 + i * 5]], PINK, 2.2);
  polygon(ctx, [[82, -338], [243, -304], [210, -293], [145, -288], [98, -300], [63, -286], [69, -309]], PINK, INDIGO, 3);
  line(ctx, [[91, -322], [227, -304]], CREAM, 1.5); ctx.fillStyle = INDIGO; ctx.beginPath(); ctx.arc(67, -337, 4, 0, TAU); ctx.fill();
  ctx.restore(); limb(pose.nearKnee, pose.nearFoot, PINK, 6); line(ctx, [[pose.nearFoot.x - 9, pose.nearFoot.y + 6], [pose.nearFoot.x + 18, pose.nearFoot.y + 6]], INDIGO, 4); ctx.restore();
}

export function renderTitle(ctx, { x: titleX }) {
  ctx.save(); ctx.fillStyle = 'rgba(39,36,71,0.9)'; ctx.fillRect(titleX - 13, 78, 467, 194); ctx.strokeStyle = '#e9b9d1'; ctx.lineWidth = 2; ctx.strokeRect(titleX - 6, 85, 453, 180);
  text(ctx, scene.zh, titleX + 16, 134, { size: 44, color: CREAM, weight: 600 }); text(ctx, 'VAPORWAVE', titleX + 19, 171, { size: 21, color: CYAN, family: SANS, weight: 600 }); text(ctx, '2010s  ·  日落网格海岸', titleX + 19, 207, { size: 21, color: PINK }); text(ctx, 'tape / skip / return', titleX + 19, 242, { size: 14, color: '#c8b8d8', family: SANS }); ctx.restore();
}
