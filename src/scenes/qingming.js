import { SCENES } from './catalog.js';
import { text, line, SANS } from '../kit/canvas.js';
import { seeded, smooth, lerp } from '../kit/math.js';
import { layer, xuanPaper, brushMark, tintMask } from '../kit/materials.js';
import { ROAD_Y, TRAVEL_SPEED } from '../beat/timeline.js';

export const scene = SCENES[5];
export const finished = true;
export const TITLE_GLYPHS = '河市春行';
const INK = '#514a39';
const SILK = '#e7dcc2';
const OCHRE = '#b18b63';
const WATER = '#8faaa0';
let riverside;
let street;

const people = [
  { x: -203, y: 775, scale: 0.89, robe: '#aaa88d', direction: -1, role: 'walk', alert: -160 },
  { x: 118, y: 780, scale: 0.98, robe: '#c6b292', direction: -1, role: 'tea', alert: 210 },
  { x: 270, y: 786, scale: 1.02, robe: '#b9bbaa', direction: -1, role: 'porter', alert: 350 },
  { x: 722, y: 779, scale: 0.95, robe: '#b7a88c', direction: 1, role: 'walk', alert: 530 },
  { x: 909, y: 783, scale: 1.02, robe: '#b2b8a4', direction: 1, role: 'pour', alert: 750 },
  { x: 1279, y: 786, scale: 0.92, robe: '#c7b89b', direction: -1, role: 'porter', alert: 1160 },
];
const bridgePeople = [
  { x: 770, y: 547, scale: 0.37, robe: '#b2b8a4', direction: 1, alert: 570 },
  { x: 829, y: 509, scale: 0.36, robe: '#c0aa8c', direction: -1, alert: 670 },
  { x: 900, y: 478, scale: 0.34, robe: '#b2b8a4', direction: 1, alert: 760 },
  { x: 981, y: 458, scale: 0.35, robe: '#c8b79c', direction: -1, alert: 820 },
  { x: 1045, y: 458, scale: 0.34, robe: '#aaa58d', direction: 1, alert: 900 },
  { x: 1132, y: 480, scale: 0.37, robe: '#c3af94', direction: -1, alert: 1010 },
  { x: 1210, y: 514, scale: 0.36, robe: '#b4b8a5', direction: 1, alert: 1080 },
];

function shape(ctx, path, color = SILK, stroke = INK, width = 1.1) {
  const p = typeof path === 'string' ? new Path2D(path) : path;
  if (color) { ctx.fillStyle = color; ctx.fill(p); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(p); }
}

function poly(ctx, points, color, stroke = INK, width = 1) {
  const p = new Path2D();
  points.forEach(([x, y], i) => i ? p.lineTo(x, y) : p.moveTo(x, y));
  p.closePath();
  shape(ctx, p, color, stroke, width);
}

function roof(ctx, x, y, w, height, depth, seed) {
  const random = seeded(seed);
  ctx.save();
  ctx.translate(x, y);
  const front = new Path2D(`M-23 3 Q-7 1 3 -8 L19 ${-height} L${w - 19} ${-height} L${w + 8} -7 Q${w + 18} -1 ${w + 30} -7 L${w + 21} 10 Q${w / 2} 16 -23 14 Z`);
  shape(ctx, front, '#b2b3a2', INK, 1.5);
  poly(ctx, [[w + 21, 10], [w + depth + 22, 10 - depth * 0.46], [w + depth - 19, -height - depth * 0.46], [w - 19, -height], [w + 8, -7]], '#a5aa99');
  for (let i = 0; i <= Math.floor(w / 8); i += 1) {
    const f = i / Math.floor(w / 8);
    line(ctx, [[lerp(19, w - 19, f), -height + 2], [lerp(-17, w + 23, f), 10]], 'rgba(81,74,57,0.68)', 0.65);
  }
  for (let i = 1; i < 9; i += 1) {
    const f = i / 9;
    line(ctx, [[lerp(19, -17, f), lerp(-height, 10, f)], [lerp(w - 19, w + 23, f), lerp(-height, 10, f)]], 'rgba(81,74,57,0.55)', 0.65);
  }
  for (let i = 0; i < 8; i += 1) {
    const f = (i + 1) / 9;
    line(ctx, [[lerp(w - 19, w + depth - 19, f), -height - depth * 0.46 * f], [lerp(w + 21, w + depth + 22, f), 10 - depth * 0.46 * f]], 'rgba(81,74,57,0.55)', 0.65);
  }
  line(ctx, [[13, -height - 4], [w - 17, -height - 4], [w + depth - 19, -height - depth * 0.46 - 4]], INK, 2);
  line(ctx, [[-23, 17], [w + 23, 13], [w + depth + 23, 12 - depth * 0.46]], INK, 1.6);
  for (let i = 0; i < 65; i += 1) {
    const px = random() * w;
    const py = random() * height - height;
    line(ctx, [[px, py], [px + 3 + random() * 8, py]], 'rgba(247,239,212,0.28)', 0.6);
  }
  ctx.restore();
}

function house(ctx, x, y, w, h, depth, roofH, seed, open = false) {
  ctx.save();
  ctx.translate(x, y);
  poly(ctx, [[0, -h], [w, -h], [w, 0], [0, 0]], '#ddd0b3');
  poly(ctx, [[w, -h], [w + depth, -h - depth * 0.46], [w + depth, -depth * 0.46], [w, 0]], '#c9c5ac');
  line(ctx, [[0, -h + 13], [w, -h + 13], [w + depth, -h + 13 - depth * 0.46]], INK, 2.1);
  line(ctx, [[-5, 4], [w + 6, 4], [w + depth + 6, -depth * 0.46 + 4]], INK, 1.5);
  const bays = Math.max(3, Math.floor(w / 55));
  for (let b = 0; b <= bays; b += 1) {
    const px = b / bays * w;
    line(ctx, [[px, -h + 11], [px, 0]], INK, 2.3);
    line(ctx, [[px + 3, -h + 12], [px + 3, -2]], '#b7a281', 0.8);
    if (b === bays) continue;
    const bw = w / bays;
    if (open && b % 2 === 0) {
      ctx.fillStyle = 'rgba(81,74,57,0.17)';
      ctx.fillRect(px + 5, -h + 23, bw - 11, h - 26);
      line(ctx, [[px + 5, -43], [px + bw - 5, -43]], INK, 1.2);
      for (let j = 0; j < 3; j += 1) shape(ctx, `M${px + 10 + j * 14} -42 l-2 -17 q5 -8 11 0 l-1 17 Z`, '#ac9e7e', INK, 0.75);
    } else {
      const wy = -h + 26;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 0.9;
      ctx.strokeRect(px + 8, wy, bw - 17, h * 0.43);
      for (let j = 1; j < 4; j += 1) line(ctx, [[px + 8 + (bw - 17) * j / 4, wy], [px + 8 + (bw - 17) * j / 4, wy + h * 0.43]], INK, 0.65);
      for (let j = 1; j < 3; j += 1) line(ctx, [[px + 8, wy + h * 0.43 * j / 3], [px + bw - 9, wy + h * 0.43 * j / 3]], INK, 0.65);
      for (let j = 1; j < 6; j += 1) line(ctx, [[px + 6 + (bw - 12) * j / 6, -h * 0.35], [px + 6 + (bw - 12) * j / 6, -5]], 'rgba(81,74,57,0.45)', 0.65);
    }
  }
  for (let i = 1; i < 4; i += 1) line(ctx, [[w + depth * i / 4, -h - depth * 0.46 * i / 4], [w + depth * i / 4, -depth * 0.46 * i / 4]], INK, 1.2);
  roof(ctx, 0, -h, w, roofH, depth, seed);
  ctx.restore();
}

function willow(ctx, x, y, height, seed, alpha = 1) {
  const random = seeded(seed);
  ctx.save();
  ctx.globalAlpha *= alpha;
  line(ctx, [[x, y], [x - 5, y - height * 0.4], [x + 9, y - height * 0.74], [x + 6, y - height]], INK, height * 0.025);
  line(ctx, [[x + 5, y], [x + 1, y - height * 0.4], [x + 14, y - height * 0.75]], '#a69b7e', height * 0.009);
  for (let i = 0; i < 9; i += 1) {
    const side = i % 2 ? 1 : -1;
    const yy = y - height * (0.43 + i * 0.058);
    const reach = side * height * (0.19 + random() * 0.29);
    line(ctx, [[x + 7, yy], [x + reach * 0.6, yy - height * 0.1], [x + reach, yy - height * 0.065]], INK, 0.8 + height * 0.004);
    for (let j = 0; j < 6; j += 1) {
      const xx = x + reach * (0.35 + j * 0.13);
      const top = yy - height * (0.05 + random() * 0.04);
      const length = height * (0.15 + random() * 0.22);
      const p = new Path2D();
      p.moveTo(xx, top);
      p.quadraticCurveTo(xx + side * 10, top + length * 0.5, xx + side * 4, top + length);
      shape(ctx, p, null, '#788776', 0.8);
      for (let k = 0; k < 8; k += 1) {
        const f = k / 8;
        line(ctx, [[xx + side * Math.sin(f * Math.PI) * 6, top + length * f], [xx + side * (Math.sin(f * Math.PI) * 6 + 4), top + length * f + 7]], '#83907b', 1.05);
      }
    }
  }
  ctx.restore();
}

function boat(ctx, x, y, scale, seed, cargo = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  shape(ctx, 'M-174 -4 Q-155 21 -131 28 L129 15 L177 -17 Q161 20 130 39 L-121 51 Q-155 41 -174 -4 Z', '#bb9e78', INK, 1.8);
  line(ctx, [[-165, 8], [-126, 36], [130, 24], [163, 0]], INK, 0.8);
  line(ctx, [[-129, 43], [121, 33]], INK, 1.1);
  for (let i = 0; i < 16; i += 1) {
    const xx = -119 + i * 16;
    line(ctx, [[xx, 26], [xx + 4, 41]], INK, 0.75);
    line(ctx, [[xx, 2], [xx + 8, 22]], 'rgba(81,74,57,0.6)', 0.65);
  }
  poly(ctx, [[-127, 21], [-111, -7], [135, -20], [126, 14]], '#d1bd96');
  shape(ctx, 'M-86 8 Q-90 -75 -31 -83 Q26 -88 82 -18 L87 -3 Z', '#b7b6a0', INK, 1.25);
  for (let i = 0; i < 12; i += 1) {
    const f = i / 11;
    const xx = -79 + f * 155;
    const top = -16 - Math.sin(f * Math.PI) * 61;
    const p = new Path2D();
    p.moveTo(xx, top);
    p.quadraticCurveTo(xx - 10, top + 30, xx - 1, 4 - f * 12);
    shape(ctx, p, null, INK, 0.8);
  }
  line(ctx, [[-80, -12], [73, -22]], INK, 0.75);
  line(ctx, [[-71, -35], [52, -43]], INK, 0.75);
  if (cargo) {
    for (const [cx, cy] of [[-112, -13], [109, -24], [128, -18], [-106, -40]]) {
      poly(ctx, [[cx - 15, cy], [cx - 17, cy - 23], [cx + 12, cy - 25], [cx + 18, cy - 2]], '#bfa77e');
      line(ctx, [[cx - 3, cy - 23], [cx, cy]], INK, 0.7);
      line(ctx, [[cx - 15, cy - 10], [cx + 16, cy - 12]], INK, 0.7);
    }
  }
  line(ctx, [[-131, 3], [-135, -174]], INK, 2.3);
  line(ctx, [[-133, -168], [-166, 13]], INK, 0.65);
  line(ctx, [[-133, -168], [120, -15]], INK, 0.65);
  line(ctx, [[142, 1], [194, -61]], INK, 2);
  ctx.restore();
}

function masonryFace(ctx, points, color, seed) {
  const p = new Path2D();
  points.forEach(([x, y], i) => i ? p.lineTo(x, y) : p.moveTo(x, y));
  p.closePath();
  shape(ctx, p, color, INK, 1.2);
  const minX = Math.min(...points.map(([x]) => x));
  const maxX = Math.max(...points.map(([x]) => x));
  const minY = Math.min(...points.map(([, y]) => y));
  const maxY = Math.max(...points.map(([, y]) => y));
  const random = seeded(seed);
  ctx.save();
  ctx.clip(p);
  let row = 0;
  for (let y = minY - 14; y < maxY + 20; y += 14) {
    line(ctx, [[minX - 5, y], [maxX + 5, y - 12]], 'rgba(81,74,57,0.68)', 0.65);
    for (let x = minX - 22 + row % 2 * 23; x < maxX + 25; x += 39 + random() * 12) {
      const top = y - (x - minX) / (maxX - minX) * 12;
      line(ctx, [[x, top], [x + 1, top + 14]], 'rgba(81,74,57,0.55)', 0.6);
    }
    row += 1;
  }
  ctx.restore();
}

function approachSteps(ctx, frontFoot, rearFoot, frontHead, rearHead, count) {
  poly(ctx, [frontFoot, rearFoot, rearHead, frontHead], '#d4c6a6', INK, 1.2);
  for (let i = 0; i <= count; i += 1) {
    const f = i / count;
    const a = [lerp(frontFoot[0], frontHead[0], f), lerp(frontFoot[1], frontHead[1], f)];
    const b = [lerp(rearFoot[0], rearHead[0], f), lerp(rearFoot[1], rearHead[1], f)];
    line(ctx, [a, b], INK, 0.85);
    if (i < count) line(ctx, [[a[0], a[1] + 2.5], [b[0], b[1] + 2.5]], '#eee0bd', 1.2);
  }
  for (const [foot, head] of [[frontFoot, frontHead], [rearFoot, rearHead]]) {
    line(ctx, [foot, head], '#9d9278', 3.6);
    line(ctx, [foot, head], '#e6d7b6', 1.3);
  }
}

function bridgeAbutments(ctx) {
  // The near masonry starts on the quay, with stairs rising to the timber end.
  // Its projecting side remains visible below the treads and meets the water.
  poly(ctx, [[592, 712], [637, 735], [707, 734], [760, 695], [756, 681], [697, 710], [633, 706]], 'rgba(81,74,57,0.15)', null);
  masonryFace(ctx, [[631, 702], [677, 603], [714, 629], [699, 720], [651, 736], [614, 718]], '#b8b29a', 6090);
  masonryFace(ctx, [[714, 629], [751, 600], [748, 689], [699, 720]], '#a7aa94', 6091);
  poly(ctx, [[677, 603], [714, 574], [751, 600], [714, 629]], '#d8c9a9', INK, 1.1);
  approachSteps(ctx, [612, 712], [648, 684], [685, 592], [722, 563], 12);
  // A landing spreads onto the bank rather than terminating in open water.
  poly(ctx, [[593, 719], [622, 695], [658, 710], [631, 734]], '#d4c7a7', INK, 1.1);
  line(ctx, [[598, 716], [632, 731]], 'rgba(81,74,57,0.55)', 0.7);
  line(ctx, [[609, 706], [644, 721]], 'rgba(81,74,57,0.55)', 0.7);
  // The far platform continues through the bank line, alongside the far houses.
  poly(ctx, [[1221, 553], [1260, 566], [1338, 510], [1381, 475], [1376, 463], [1307, 493]], 'rgba(81,74,57,0.13)', null);
  masonryFace(ctx, [[1229, 528], [1277, 495], [1338, 463], [1335, 494], [1272, 549], [1227, 561]], '#b7b29a', 6092);
  masonryFace(ctx, [[1229, 528], [1264, 508], [1264, 550], [1227, 561]], '#a7aa94', 6093);
  poly(ctx, [[1229, 528], [1277, 495], [1338, 463], [1365, 474], [1290, 523], [1252, 547]], '#d7c9aa', INK, 1.1);
  approachSteps(ctx, [1263, 492], [1300, 463], [1326, 470], [1363, 441], 5);
  poly(ctx, [[1326, 470], [1363, 441], [1390, 454], [1353, 484]], '#d9cdae', INK, 1.1);
  line(ctx, [[1341, 476], [1378, 448]], 'rgba(81,74,57,0.55)', 0.7);
}

function bridge(ctx) {
  const upper = [[685, 592], [769, 516], [879, 461], [1000, 435], [1121, 441], [1263, 492]];
  const lower = [[710, 632], [795, 555], [897, 503], [1007, 480], [1120, 486], [1239, 529]];
  poly(ctx, [...upper, ...lower.slice().reverse()], '#b59b76', INK, 2.3);
  // Five interlocked timber bays support the deck; each has paired diagonals.
  for (let i = 0; i < upper.length - 1; i += 1) {
    const a = upper[i];
    const b = upper[i + 1];
    const c = lower[i];
    const d = lower[i + 1];
    line(ctx, [a, d], '#746449', 4.7);
    line(ctx, [c, b], '#746449', 4.7);
    line(ctx, [a, d], '#ddc49e', 1.1);
    line(ctx, [c, b], '#ddc49e', 1.1);
    line(ctx, [c, d], INK, 2.4);
    line(ctx, [a, b], INK, 2.5);
    for (let j = 1; j < 10; j += 1) {
      const f = j / 10;
      const px = lerp(a[0], b[0], f);
      const py = lerp(a[1], b[1], f);
      line(ctx, [[px, py - 1], [px + 31, py - 28]], 'rgba(81,74,57,0.68)', 0.9);
    }
  }
  const rear = upper.map(([x, y]) => [x + 37, y - 29]);
  poly(ctx, [...upper, ...rear.slice().reverse()], '#d6c19e', INK, 1.1);
  for (let i = 0; i < upper.length - 1; i += 1) {
    for (let j = 0; j < 6; j += 1) {
      const f = j / 6;
      const x = lerp(upper[i][0], upper[i + 1][0], f);
      const y = lerp(upper[i][1], upper[i + 1][1], f);
      line(ctx, [[x, y], [x + 37, y - 29]], INK, 0.65);
      for (const dx of [0, 37]) line(ctx, [[x + dx, y - dx * 29 / 37], [x + dx, y - 34 - dx * 29 / 37]], INK, 1.5);
    }
  }
  for (const dx of [0, 37]) {
    const rail = upper.map(([x, y]) => [x + dx, y - 33 - dx * 29 / 37]);
    line(ctx, rail, INK, 2.5);
    line(ctx, rail.map(([x, y]) => [x, y + 12]), INK, 0.9);
  }
}

function basket(ctx, x, y, width = 35, height = 35) {
  const p = new Path2D(`M${x - width / 2} ${y - height} Q${x} ${y - height - 7} ${x + width / 2} ${y - height} L${x + width * 0.4} ${y} Q${x} ${y + 4} ${x - width * 0.4} ${y} Z`);
  shape(ctx, p, '#b6a079', INK, 1);
  for (let i = 1; i < 5; i += 1) line(ctx, [[x - width * 0.46, y - height * i / 5], [x + width * 0.46, y - height * i / 5]], INK, 0.55);
  for (let i = -2; i <= 2; i += 1) line(ctx, [[x + i * width / 6, y - height], [x + i * width / 7, y]], INK, 0.55);
}

function personBody(ctx, person) {
  const { x, y, scale, robe, role } = person;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  if (role === 'porter') {
    line(ctx, [[-82, -126], [80, -139]], INK, 3.4);
    for (const xx of [-77, 75]) {
      line(ctx, [[xx, -131], [xx - 17, -43]], INK, 0.85);
      line(ctx, [[xx, -131], [xx + 17, -43]], INK, 0.85);
      basket(ctx, xx, -15, 48, 33);
    }
  }
  shape(ctx, 'M-14 -139 Q-24 -133 -29 -115 L-27 -79 L-37 -23 Q-7 -13 34 -26 L23 -88 L22 -118 Q16 -134 5 -141 Z', robe, INK, 1.35);
  line(ctx, [[-11, -138], [-2, -117], [11, -139]], INK, 1);
  line(ctx, [[-1, -117], [-9, -43], [-12, -25]], INK, 0.9);
  line(ctx, [[15, -105], [22, -64], [25, -28]], INK, 0.8);
  line(ctx, [[-25, -81], [24, -83]], INK, 1.5);
  line(ctx, [[-18, -22], [-19, -4], [-32, -1]], INK, 3);
  line(ctx, [[17, -23], [22, -4], [33, -2]], INK, 3);
  shape(ctx, 'M-18 -126 L-34 -105 L-22 -86 L-9 -98 L-17 -106 Z', robe, INK, 1.1);
  if (role !== 'pour' && role !== 'porter') shape(ctx, 'M17 -128 L34 -109 L29 -87 L15 -94 L21 -109 Z', robe, INK, 1.1);
  ctx.restore();
}

function face(ctx, direction, size = 1) {
  ctx.save();
  ctx.scale(size, size);
  const d = direction;
  shape(ctx, 'M-10 -15 Q-9 -28 4 -26 Q15 -23 14 -7 L8 9 Q-4 16 -11 2 Z', '#ddd1b2', INK, 1.1);
  shape(ctx, `M${d * 10} -13 L${d * 22} -4 L${d * 10} 1 Z`, '#ddd1b2', INK, 1.1);
  shape(ctx, 'M-13 -14 Q-17 -29 0 -31 Q15 -29 15 -17 L8 -20 L-1 -16 Z', '#716d57', INK, 0.9);
  shape(ctx, 'M-7 -29 Q-10 -40 -1 -40 Q8 -39 5 -29 Z', '#716d57', INK, 0.8);
  line(ctx, [[d * 6 - 1.4, -10], [d * 6 + 1.4, -10]], INK, 1.5);
  line(ctx, [[d * 10, 3], [d * 14, 2]], INK, 0.9);
  ctx.restore();
}

function personMotion(ctx, person, localT) {
  const riderX = localT * TRAVEL_SPEED - 500;
  const notice = smooth((riderX - person.alert) / 75);
  const target = lerp(-1, 1, smooth((riderX - person.x + 50) / 100));
  const direction = lerp(person.direction, target, notice);
  const attention = notice * (1 - smooth((riderX - person.x - 320) / 180));
  ctx.save();
  ctx.translate(person.x, person.y);
  ctx.scale(person.scale, person.scale);
  line(ctx, [[-4, -137], [-4, -149], [6, -149], [7, -137]], '#b4a283', 4);
  ctx.save();
  ctx.translate(0, -158);
  face(ctx, direction);
  ctx.restore();
  if (person.role === 'porter') {
    const hand = [lerp(24, 36, attention), lerp(-127, -166, attention)];
    line(ctx, [[18, -123], [36, -132], hand], INK, 4);
    line(ctx, [[18, -123], [36, -132], hand], person.robe, 2.4);
    line(ctx, [[hand[0], hand[1]], [hand[0] + 5, hand[1] - 6]], INK, 1.9);
  }
  if (person.role === 'pour') {
    const pause = notice;
    const handY = lerp(-104, -116, pause);
    line(ctx, [[17, -125], [36, -105], [57, handY]], INK, 5);
    line(ctx, [[17, -125], [36, -105], [57, handY]], person.robe, 3.2);
    ctx.save();
    ctx.translate(62, handY);
    ctx.rotate(lerp(-0.4, 0.06, pause));
    shape(ctx, 'M-10 -4 Q-12 -21 2 -21 Q17 -20 13 -3 Z M11 -15 L24 -23 L27 -20 L15 -7 M-10 -16 Q-28 -26 -25 -9 L-11 -7', '#9b8463', INK, 1.2);
    line(ctx, [[-7, -22], [9, -22]], INK, 1.5);
    ctx.restore();
    if (pause < 1) {
      ctx.save();
      ctx.globalAlpha *= 1 - pause;
      line(ctx, [[87, handY - 13], [90, -76]], WATER, 1.3);
      ctx.restore();
    }
  }
  ctx.restore();
}

function teaShed(ctx) {
  // Broad near eaves and exposed rafters distinguish this from the far houses.
  house(ctx, -367, 737, 370, 188, 67, 68, 6200, true);
  line(ctx, [[-370, 738], [50, 738]], INK, 1.8);
  for (const x of [-298, -185, -61]) {
    line(ctx, [[x, 683], [x + 75, 683], [x + 88, 692], [x + 12, 693], [x, 683]], INK, 1.4);
    line(ctx, [[x + 12, 693], [x + 9, 737]], INK, 1.8);
    line(ctx, [[x + 76, 693], [x + 79, 737]], INK, 1.8);
    for (const cx of [x + 26, x + 54]) shape(ctx, `M${cx - 5} 678 q5 5 10 0 l1 -8 l-12 0 Z`, '#e4d9bd', INK, 0.9);
    line(ctx, [[x + 5, 714], [x + 71, 714]], INK, 2.4);
  }
  for (const [x, y] of [[-343, 767], [-294, 765], [35, 746]]) basket(ctx, x, y, 40, 43);
  line(ctx, [[28, 553], [28, 604]], INK, 1.2);
  shape(ctx, 'M8 603 L49 603 L49 663 L8 663 Z', '#d9cbaa', INK, 1.2);
  line(ctx, [[17, 616], [40, 616], [23, 628], [34, 642], [17, 650]], INK, 1.5);
}

function teaStall(ctx) {
  for (const x of [842, 1112]) line(ctx, [[x, 570], [x + 4, 778]], INK, 3.2);
  shape(ctx, 'M815 570 Q855 546 893 522 L1052 519 Q1094 549 1150 559 L1134 577 Q992 590 815 585 Z', '#c0b99d', INK, 1.7);
  for (let i = 0; i < 21; i += 1) {
    const f = i / 20;
    line(ctx, [[lerp(893, 1052, f), lerp(522, 519, f)], [lerp(822, 1140, f), lerp(579, 570, f)]], 'rgba(81,74,57,0.64)', 0.85);
  }
  line(ctx, [[835, 587], [1128, 579]], INK, 2);
  shape(ctx, 'M946 707 L1124 699 L1133 714 L950 724 Z', '#b7a17b', INK, 1.4);
  for (const x of [963, 1117]) line(ctx, [[x, 721], [x + 3, 781]], INK, 2.8);
  for (const x of [991, 1030, 1075]) shape(ctx, `M${x - 7} 702 q7 5 14 -1 l2 -10 l-18 1 Z`, '#e5dbc0', INK, 1);
  basket(ctx, 1160, 776, 48, 62);
  basket(ctx, 1214, 776, 44, 41);
  shape(ctx, 'M849 646 Q840 620 856 608 Q874 622 866 648 Z', '#baa17c', INK, 1);
  line(ctx, [[856, 583], [856, 609]], INK, 1);
}

export function prepare({ brush }) {
  const paper = xuanPaper(6001);
  const dryInk = tintMask(brush.graphite, INK);
  riverside = layer(2000, 1000, (ctx) => {
    ctx.drawImage(paper, 0, 0);
    ctx.fillStyle = 'rgba(208,185,140,0.13)';
    ctx.fillRect(0, 0, 2000, 1000);
    ctx.translate(500, 0);
    const random = seeded(6002);
    const bank = new Path2D('M-500 575 Q-173 530 89 517 Q281 499 490 456 Q572 446 682 461 Q954 492 1500 469 L1500 735 Q1272 714 1142 717 Q893 716 731 709 Q471 698 283 705 Q-95 718 -500 716 Z');
    shape(ctx, bank, 'rgba(143,170,160,0.34)', 'rgba(81,74,57,0.5)', 1);
    ctx.save();
    ctx.clip(bank);
    for (let i = 0; i < 330; i += 1) {
      const x = -500 + random() * 2000;
      const y = 458 + random() * 280;
      line(ctx, [[x, y], [x + 11 + random() * 47, y - 1 + random() * 2]], 'rgba(81,104,93,0.19)', 0.6);
    }
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = 0.78;
    house(ctx, -460, 513, 205, 134, 53, 43, 6030);
    house(ctx, -202, 471, 195, 150, 60, 47, 6031, true);
    house(ctx, 42, 477, 208, 151, 64, 53, 6032);
    house(ctx, 297, 482, 144, 109, 41, 39, 6033, true);
    house(ctx, 1351, 490, 213, 131, 48, 45, 6034);
    line(ctx, [[-500, 532], [-309, 522], [-195, 508], [47, 508], [257, 500], [458, 493]], INK, 1.4);
    for (let x = -460; x < 475; x += 24) line(ctx, [[x, 514], [x + 2, 535]], 'rgba(81,74,57,0.4)', 0.65);
    willow(ctx, -255, 507, 235, 6035, 0.8);
    willow(ctx, 1380, 515, 202, 6036, 0.85);
    ctx.restore();
    boat(ctx, 202, 585, 0.62, 6060, true);
    boat(ctx, 1014, 654, 0.89, 6061, true);
    bridgeAbutments(ctx);
    bridge(ctx);
    for (const p of bridgePeople) personBody(ctx, p);
    // Mooring steps descend into the river; the cycling path stays horizontal.
    poly(ctx, [[-395, 694], [-270, 681], [-230, 742], [-364, 752]], '#c5c1a7');
    for (let i = 0; i < 7; i += 1) line(ctx, [[-391 + i * 5, 696 + i * 8], [-269 + i * 6, 683 + i * 8]], INK, 0.85);
    line(ctx, [[-500, 716], [-90, 707], [288, 706], [719, 711], [1145, 718], [1500, 730]], INK, 2);
    for (let i = 0; i < 25; i += 1) {
      const x = -480 + i * 82;
      line(ctx, [[x, 716], [x + 3, 749]], INK, 0.75);
    }
    poly(ctx, [[-500, 750], [1500, 750], [1500, 1000], [-500, 1000]], '#e0d2b1', null);
    line(ctx, [[-500, 750], [1500, 750]], INK, 1.5);
    line(ctx, [[-500, ROAD_Y], [1500, ROAD_Y]], INK, 1.8);
    line(ctx, [[-500, 851], [1500, 851]], 'rgba(81,74,57,0.51)', 0.8);
    line(ctx, [[-500, 914], [1500, 914]], 'rgba(81,74,57,0.48)', 0.8);
    for (let row = 0; row < 3; row += 1) {
      const top = [750, 802, 851][row];
      const bottom = [802, 851, 914][row];
      for (let x = -520 + row * 38; x < 1500; x += 115) line(ctx, [[x, top], [x + 29, bottom]], 'rgba(81,74,57,0.42)', 0.7);
    }
    for (let i = 0; i < 125; i += 1) {
      const x = -500 + random() * 2000;
      const y = 811 + random() * 145;
      brushMark(ctx, dryInk, x, y, x + 2 + random() * 16, y + 1, 0.7 + random(), 0.11);
    }
  }, 1.5);
  street = layer(2000, 1000, (ctx) => {
    ctx.translate(500, 0);
    teaShed(ctx);
    teaStall(ctx);
    for (const p of people) personBody(ctx, p);
    for (const [x, y, s, d] of [[-397, 523, 0.28, 1], [-122, 507, 0.31, -1], [69, 502, 0.29, 1], [290, 502, 0.28, -1], [433, 491, 0.28, 1], [1151, 669, 0.35, -1]]) {
      const p = { x, y, scale: s, robe: '#b9b69a', direction: d, alert: 9000 };
      personBody(ctx, p);
      personMotion(ctx, p, 0);
    }
    for (let i = 0; i < 4; i += 1) basket(ctx, 1359 + i * 36, 777 - i % 2 * 6, 32, 42 + i % 2 * 18);
    // A small handcart has its own timber axle and bundles.
    line(ctx, [[1334, 745], [1470, 745], [1470, 715], [1358, 715], [1334, 745]], INK, 2.3);
    for (const x of [1372, 1453]) {
      ctx.beginPath(); ctx.arc(x, 766, 21, 0, Math.PI * 2); ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.stroke();
      for (let i = 0; i < 8; i += 1) line(ctx, [[x, 766], [x + Math.cos(i / 4 * Math.PI) * 19, 766 + Math.sin(i / 4 * Math.PI) * 19]], INK, 0.7);
    }
    line(ctx, [[1468, 738], [1525, 711]], INK, 2);
  }, 1.5);
}

export function renderAt(ctx, { localT }) {
  ctx.drawImage(riverside, -500, 0, 2000, 1000);
  const ripple = Math.sin(localT * 0.9) * 3;
  for (const [x, y, w] of [[433, 636, 44], [562, 677, 58], [1243, 684, 42], [827, 658, 31]]) {
    line(ctx, [[x + ripple, y], [x + w + ripple, y + 1]], 'rgba(81,104,93,0.35)', 0.8);
    line(ctx, [[x + 9 - ripple, y + 8], [x + w - 7 - ripple, y + 8]], 'rgba(81,104,93,0.25)', 0.6);
  }
  ctx.drawImage(street, -500, 0, 2000, 1000);
  for (const p of bridgePeople) personMotion(ctx, p, localT);
  for (const p of people) personMotion(ctx, p, localT);
}

export function renderRider(ctx, pose, { x, y, scale = 1 }) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const fine = (points, width = 1.8, color = INK) => line(ctx, points, color, width);
  const leg = (knee, foot, color, width) => fine([[pose.hip.x, pose.hip.y], [knee.x, knee.y], [foot.x, foot.y]], width, color);
  leg(pose.farKnee, pose.farFoot, '#9d947b', 4.2);
  for (const cx of [-135, 135]) {
    ctx.beginPath(); ctx.arc(cx, 0, 73, 0, Math.PI * 2); ctx.strokeStyle = INK; ctx.lineWidth = 3.3; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, 0, 68, 0, Math.PI * 2); ctx.lineWidth = 0.85; ctx.stroke();
    for (let i = 0; i < 16; i += 1) {
      const a = pose.wheelAngle + i / 8 * Math.PI;
      fine([[cx, 0], [cx + Math.cos(a) * 68, Math.sin(a) * 68]], 0.85);
    }
    shape(ctx, `M${cx - 4} -4 l8 0 l0 8 l-8 0 Z`, OCHRE, INK, 1);
  }
  fine([[-135, 0], [-60, -115], [-20, -4], [-135, 0]], 3.8);
  fine([[-60, -115], [80, -105], [-20, -4]], 3.8);
  fine([[135, 0], [80, -105], [73, -146], [107, -153]], 3.8);
  fine([[-60, -115], [-64, -138], [-89, -138], [-42, -138]], 3.6);
  fine([[-135, 0], [-60, -115], [-20, -4]], 0.8, '#cab793');
  fine([[pose.farFoot.x, pose.farFoot.y], [-20, -4], [pose.nearFoot.x, pose.nearFoot.y]], 2.6);
  ctx.save();
  ctx.translate(0, pose.bob * 0.55);
  shape(ctx, 'M-160 -199 Q-147 -231 -113 -249 Q-73 -271 -29 -245 Q-3 -234 6 -262 Q1 -300 16 -324 Q32 -355 62 -352 Q91 -350 98 -327 Q92 -307 72 -300 Q58 -275 64 -252 Q59 -226 36 -205 Q0 -172 -53 -172 Q-117 -173 -160 -199 Z', '#ece4cf', INK, 1.9);
  shape(ctx, 'M88 -334 L238 -302 Q175 -284 86 -306 Q77 -292 65 -287 L64 -298 Q81 -315 88 -334 Z', '#c8ac7d', INK, 1.55);
  fine([[89, -321], [229, -302]], 1.05);
  fine([[90, -305], [131, -298], [181, -298]], 0.8, '#8f795a');
  shape(ctx, 'M65 -337 Q70 -341 74 -335 Q71 -329 65 -332 Z', INK, null);
  fine([[26, -324], [18, -300], [26, -274], [20, -249]], 0.8, '#9e9980');
  shape(ctx, 'M-136 -223 Q-112 -246 -80 -234 Q-41 -224 -9 -198 Q26 -175 105 -149 Q29 -159 -19 -170 Q-89 -172 -132 -194 Z', '#eee6d1', INK, 1.5);
  for (let i = 0; i < 9; i += 1) fine([[-123 + i * 17, -224 + i * 4], [-117 + i * 17, -207 + i * 3.5], [-103 + i * 17, -190 + i * 2.5]], 0.7, '#938e77');
  fine([[-145, -196], [-100, -183], [-53, -182], [-18, -188]], 0.7, '#a09a82');
  for (let i = 0; i < 3; i += 1) fine([[-158 + i * 7, -213], [-144 + i * 7, -199]], 0.9);
  ctx.restore();
  leg(pose.nearKnee, pose.nearFoot, INK, 4.4);
  leg(pose.nearKnee, pose.nearFoot, '#c6ab7d', 2.1);
  fine([[pose.nearFoot.x - 9, pose.nearFoot.y + 4], [pose.nearFoot.x + 18, pose.nearFoot.y + 4]], 3.1);
  ctx.restore();
}

export function renderTitle(ctx, { x }) {
  ctx.save();
  ctx.fillStyle = 'rgba(237,226,200,0.96)';
  ctx.fillRect(x - 12, 124, 476, 190);
  ctx.strokeStyle = 'rgba(81,74,57,0.51)';
  ctx.lineWidth = 0.9;
  ctx.strokeRect(x - 6, 130, 464, 178);
  text(ctx, scene.zh, x + 13, 196, { size: 56, color: INK, weight: 600 });
  text(ctx, 'QINGMING RIVERSIDE', x + 15, 240, { size: 22, color: INK, family: SANS });
  text(ctx, '约 1100  ·  河市春行', x + 15, 283, { size: 24, color: INK });
  ctx.fillStyle = '#a56c50';
  ctx.fillRect(x + 406, 263, 27, 27);
  ctx.strokeStyle = '#e9dcc0';
  ctx.strokeRect(x + 412, 269, 15, 15);
  ctx.restore();
}
