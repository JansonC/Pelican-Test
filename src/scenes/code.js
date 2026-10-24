import { SCENES } from './catalog.js';
import { ROAD_Y, clamp } from '../beat/timeline.js';
import { line, text, SANS, withAlpha } from '../kit/canvas.js';
import { layer } from '../kit/materials.js';
import { smooth } from '../kit/math.js';
import { poseAt } from '../rig/pelican.js';
import { codeCameraAt } from '../main/presentation.js';

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
  { key: 'wheel', color: ORANGE, d: 'M -208 0 A 73 73 0 1 0 -62 0 A 73 73 0 1 0 -208 0 M 62 0 A 73 73 0 1 0 208 0 A 73 73 0 1 0 62 0' },
  { key: 'frame', color: CYAN, d: 'M -135 0 L -60 -115 L -20 -4 L -135 0 M -60 -115 L 80 -105 L -20 -4 M 80 -105 L 135 0 M 80 -105 L 72 -145 L 103 -154 L 117 -144' },
  { key: 'legs', color: ORANGE, d: 'M -50 -164 L -35 -78 L -20 -4 M -50 -164 L -71 -82 L -54 22' },
  { key: 'feathers', color: PAPER, d: 'M -126 -180 C -170 -183 -166 -220 -132 -245 C -90 -260 -46 -251 -12 -231 C 8 -252 7 -286 2 -322 C 28 -350 63 -350 91 -333 C 87 -311 67 -296 58 -262 C 39 -213 8 -176 -54 -158 Z M 82 -326 L 230 -298 Q 164 -286 92 -305 Z' },
]);

export function pathProgressAt(localT) {
  const t = clamp(localT, 0, 6);
  return smooth((t - 2) / 2);
}

export function svgPathAt(localT, pose = poseAt(scene.start + clamp(localT, 0, 6))) {
  const progress = pathProgressAt(localT);
  const point = (value) => `${Number(value.x.toFixed(2))} ${Number(value.y.toFixed(2))}`;
  return PATHS.slice(0, Math.max(1, Math.ceil(progress * PATHS.length))).map((path) => {
    if (path.key === 'legs') return { ...path, d: `M ${point(pose.hip)} L ${point(pose.farKnee)} L ${point(pose.farFoot)} M ${point(pose.hip)} L ${point(pose.nearKnee)} L ${point(pose.nearFoot)}` };
    if (path.key === 'wheel') {
      const spokes = [-135, 135].map((center) => `M ${center} 0 L ${point({ x: center + Math.cos(pose.wheelAngle) * 67, y: Math.sin(pose.wheelAngle) * 67 })}`);
      return { ...path, d: `${path.d} ${spokes.join(' ')}` };
    }
    return { ...path };
  });
}

export function codeLinesAt(localT) {
  const paths = svgPathAt(localT);
  const lines = ['<svg viewBox="-250 -380 550 480" fill="none">'];
  for (const path of paths) {
    lines.push(`  <path stroke="${path.color}" d="`);
    let current = '    ';
    for (const token of path.d.split(' ')) {
      if (current.length + token.length > 65) { lines.push(current.trimEnd()); current = '    '; }
      current += `${token} `;
    }
    lines.push(`${current.trimEnd()}" />`);
  }
  lines.push('</svg>');
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
  ctx.fillStyle = ROAD; ctx.fillRect(0, ROAD_Y, 2000, 198);
  line(ctx, [[0, ROAD_Y], [2000, ROAD_Y]], '#3e7770', 3);
  for (let marker = 0; marker < 2000; marker += 120) line(ctx, [[marker, ROAD_Y + 42], [marker + 38, ROAD_Y + 42]], '#345951', 1.4);
}

export function prepare() { editor = layer(2000, 1000, paintEditor, 1.1); }

function drawCode(ctx, localT) {
  const lines = codeLinesAt(localT);
  const y0 = 313;
  ctx.save();
  ctx.beginPath();
  ctx.rect(28, 292, 790, 358);
  ctx.clip();
  for (let index = 0; index < lines.length; index += 1) {
    const value = lines[index];
    text(ctx, String(index + 1).padStart(2, '0'), 54, y0 + index * 18, { size: 12, color: '#557475', family: SANS });
    const color = value.includes('<') ? CYAN : PAPER;
    text(ctx, value, 95, y0 + index * 18, { size: 15, color, family: 'monospace' });
  }
  ctx.restore();
  text(ctx, 'path progress', 52, 684, { size: 15, color: MUTED, family: SANS });
  const progress = pathProgressAt(localT); rounded(ctx, 171, 670, 580, 8, 4, '#263e3d'); rounded(ctx, 171, 670, 580 * progress, 8, 4, CYAN);
}

function drawPath(ctx, path, alpha = 1, translateX = 1300, translateY = 515) {
  const p = new Path2D(path.d);
  ctx.save(); ctx.translate(translateX, translateY); ctx.globalAlpha *= alpha; ctx.strokeStyle = path.color; ctx.lineWidth = path.key === 'feathers' ? 4 : 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.shadowColor = `${path.color}88`; ctx.shadowBlur = 7; ctx.stroke(p); ctx.restore();
}

export function renderAt(ctx) {
  ctx.drawImage(editor, -500, 0, 2000, 1000);
}

export function renderRider(ctx, pose, { x, y, scale = 1, localT = 0 } = {}) {
  const paths = svgPathAt(localT, pose);
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  for (const path of paths) drawPath(ctx, path, 1, 0, 0);
  ctx.restore();
}

export function renderTitle(ctx, { x: titleX, t, localT } = {}) {
  withAlpha(ctx, codeCameraAt(t).paneAlpha, () => {
    ctx.save();
    ctx.translate(titleX - 43, 0);
    rounded(ctx, 28, 292, 790, 435, 10, PANEL, '#466267', 2);
    drawCode(ctx, localT);
    ctx.restore();
  });
  ctx.save(); rounded(ctx, titleX - 15, 108, 605, 175, 9, 'rgba(24,43,46,0.96)', '#668f89', 2); line(ctx, [[titleX + 2, 129], [titleX + 2, 270]], CYAN, 1);
  text(ctx, '20   /   CODE AESTHETICS', titleX + 19, 140, { size: 15, color: '#9fc8be', family: SANS, weight: 600 }); text(ctx, scene.zh, titleX + 17, 204, { size: 46, color: PAPER, weight: 600 }); text(ctx, 'CODE AESTHETICS', titleX + 19, 238, { size: 20, color: CYAN, family: SANS }); text(ctx, scene.era, titleX + 19, 269, { size: 21, color: ORANGE });
  ctx.restore();
}
