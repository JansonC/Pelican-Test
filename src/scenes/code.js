import { SCENES } from './catalog.js';
import { ROAD_Y, clamp } from '../beat/timeline.js';
import { line, text, SANS } from '../kit/canvas.js';
import { layer } from '../kit/materials.js';
import { smooth } from '../kit/math.js';

export const scene = SCENES[19];
export const finished = true;
export const TITLE_GLYPHS = '代码美学大模型时代路径展开骑行鹈鹕编辑器';
export const UI_GLYPHS = '代码美学路径轮车架腿羽毛展开深色编辑器';

const TAU = Math.PI * 2;
const BG = '#213437';
const PANEL = '#18292c';
const PAPER = '#e7e6d5';
const CYAN = '#84c7ba';
const ORANGE = '#d6aa79';
const MUTED = '#6d8c8c';
const ROAD = '#112124';
let editor;

const PATHS = Object.freeze([
  { key: 'wheel', color: ORANGE, d: 'M -135 0 A 73 73 0 1 0 11 0 A 73 73 0 1 0 -135 0 M 135 0 A 73 73 0 1 0 281 0 A 73 73 0 1 0 135 0' },
  { key: 'frame', color: CYAN, d: 'M -135 0 L -60 -115 L -20 -4 L -135 0 M -60 -115 L 80 -105 L -20 -4 M 80 -105 L 135 0 M 80 -105 L 72 -145 L 103 -154 L 117 -144' },
  { key: 'legs', color: ORANGE, d: 'M -50 -164 L -35 -78 L -20 -4 M -50 -164 L -71 -82 L -54 22' },
  { key: 'feathers', color: PAPER, d: 'M -126 -180 C -170 -183 -166 -220 -132 -245 C -90 -260 -46 -251 -12 -231 C 8 -252 7 -286 2 -322 C 28 -350 63 -350 91 -333 C 87 -311 67 -296 58 -262 C 39 -213 8 -176 -54 -158 Z M 82 -326 L 230 -298 Q 164 -286 92 -305 Z' },
]);

export function pathProgressAt(localT) {
  const t = clamp(localT, 0, 6);
  return smooth((t - 2) / 2);
}

export function svgPathAt(localT) {
  const progress = pathProgressAt(localT);
  return PATHS.slice(0, Math.max(1, Math.ceil(progress * PATHS.length))).map((path) => ({ ...path }));
}

export function codeLinesAt(localT) {
  const paths = svgPathAt(localT);
  const lines = ['const pelican = svgPath({'];
  for (const path of paths) lines.push(`  ${path.key}: path(${JSON.stringify(path.d)}),`);
  lines.push('});', 'render(pelican, { road: 802 });');
  return lines;
}

function circle(ctx, x, y, radius, fill = null, stroke = null, width = 1) {
  ctx.beginPath(); ctx.arc(x, y, radius, 0, TAU);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
}

function rounded(ctx, x, y, width, height, radius, fill, stroke = null, widthStroke = 1) {
  ctx.beginPath(); ctx.roundRect(x, y, width, height, radius);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = widthStroke; ctx.stroke(); }
}

function paintEditor(ctx) {
  ctx.fillStyle = BG; ctx.fillRect(0, 0, 2000, 1000);
  ctx.fillStyle = '#2a4144'; ctx.fillRect(0, 0, 2000, 62);
  for (const [x, color] of [[30, '#dc8a79'], [53, '#d6aa79'], [76, '#84c7ba']]) circle(ctx, x, 31, 8, color);
  text(ctx, 'pelican-study.svg', 110, 39, { size: 20, color: '#c7d8cf', family: SANS });
  rounded(ctx, 28, 90, 790, 637, 10, PANEL, '#466267', 2);
  rounded(ctx, 849, 90, 1123, 637, 10, '#1a3030', '#466267', 2);
  ctx.fillStyle = '#2a4547'; ctx.fillRect(28, 90, 790, 41);
  text(ctx, '01  pelican-study.svg', 52, 119, { size: 17, color: '#c4d6ce', family: SANS });
  ctx.fillStyle = '#122226'; ctx.fillRect(849, 90, 1123, 41);
  text(ctx, 'preview  ·  deterministic render', 881, 119, { size: 17, color: '#9fc0b8', family: SANS });
  for (let y = 164; y < 702; y += 29) line(ctx, [[40, y], [806, y]], 'rgba(132,199,186,0.08)', 1);
  for (let x = 870; x < 1950; x += 90) line(ctx, [[x, 137], [x, 714]], 'rgba(132,199,186,0.045)', 1);
  ctx.fillStyle = ROAD; ctx.fillRect(-500, ROAD_Y, 2000, 198);
  line(ctx, [[-500, ROAD_Y], [1500, ROAD_Y]], '#3e7770', 3);
  for (let x = -500; x < 1500; x += 120) line(ctx, [[x, ROAD_Y + 42], [x + 38, ROAD_Y + 42]], '#345951', 1.4);
}

export function prepare() { editor = layer(2000, 1000, paintEditor, 1.1); }

function drawCode(ctx, localT) {
  const lines = codeLinesAt(localT);
  const y0 = 164;
  for (let index = 0; index < lines.length; index += 1) {
    const value = lines[index];
    text(ctx, String(index + 1).padStart(2, '0'), 54, y0 + index * 29, { size: 16, color: '#557475', family: SANS });
    const color = index === 0 || value.includes('render') ? CYAN : value.includes('d:') ? ORANGE : PAPER;
    text(ctx, value, 95, y0 + index * 29, { size: 18, color, family: 'monospace' });
  }
  text(ctx, 'path progress', 52, 684, { size: 15, color: MUTED, family: SANS });
  const progress = pathProgressAt(localT); rounded(ctx, 171, 670, 580, 8, 4, '#263e3d'); rounded(ctx, 171, 670, 580 * progress, 8, 4, CYAN);
}

function drawPath(ctx, path, alpha = 1, translateX = 1300, translateY = 515) {
  const p = new Path2D(path.d);
  ctx.save(); ctx.translate(translateX, translateY); ctx.globalAlpha *= alpha; ctx.strokeStyle = path.color; ctx.lineWidth = path.key === 'feathers' ? 4 : 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.shadowColor = `${path.color}88`; ctx.shadowBlur = 7; ctx.stroke(p); ctx.restore();
}

export function renderAt(ctx, { localT = 0 } = {}) {
  const time = clamp(localT, 0, 6);
  ctx.drawImage(editor, -500, 0, 2000, 1000);
  drawCode(ctx, time);
  // The preview is the same path data serialized in the left pane, placed in the right pane.
  const paths = svgPathAt(time);
  const progress = pathProgressAt(time);
  for (const path of paths) drawPath(ctx, path, path.key === 'feathers' ? Math.max(0.35, progress) : 1);
}

export function renderRider(ctx, pose, { x, y, scale = 1, localT = 0 } = {}) {
  const paths = svgPathAt(localT); const progress = pathProgressAt(localT);
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  // Real path data is used for the right-hand preview; legs and wheels retain shared pose data.
  for (const path of paths) drawPath(ctx, path, path.key === 'feathers' ? Math.max(0.35, progress) : 1, 0, 0);
  const limb = (knee, foot, alpha) => { ctx.save(); ctx.globalAlpha *= alpha; line(ctx, [[pose.hip.x, pose.hip.y], [knee.x, knee.y], [foot.x, foot.y]], ORANGE, 5); line(ctx, [[foot.x - 9, foot.y + 7], [foot.x + 18, foot.y + 7]], PAPER, 3); ctx.restore(); };
  if (progress > 0.45) { limb(pose.farKnee, pose.farFoot, 0.58); limb(pose.nearKnee, pose.nearFoot, 1); }
  for (const center of [-135, 135]) { ctx.save(); ctx.translate(center, 0); ctx.rotate(pose.wheelAngle); ctx.beginPath(); ctx.arc(0, 0, 73, 0, TAU); ctx.strokeStyle = ORANGE; ctx.lineWidth = 4; ctx.stroke(); for (let spoke = 0; spoke < 12; spoke += 1) line(ctx, [[0, 0], [Math.cos(spoke * TAU / 12) * 67, Math.sin(spoke * TAU / 12) * 67]], '#b47e54', 1.2); ctx.restore(); }
  ctx.restore();
}

export function renderTitle(ctx, { x: titleX } = {}) {
  ctx.save(); rounded(ctx, titleX - 15, 108, 605, 175, 9, 'rgba(24,43,46,0.96)', '#668f89', 2); line(ctx, [[titleX + 2, 129], [titleX + 2, 270]], CYAN, 1);
  text(ctx, '20   /   CODE AESTHETICS', titleX + 19, 140, { size: 15, color: '#9fc8be', family: SANS, weight: 600 }); text(ctx, scene.zh, titleX + 17, 204, { size: 46, color: PAPER, weight: 600 }); text(ctx, 'CODE AESTHETICS', titleX + 19, 238, { size: 20, color: CYAN, family: SANS }); text(ctx, scene.era, titleX + 19, 269, { size: 21, color: ORANGE });
  ctx.restore();
}
