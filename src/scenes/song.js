import { SCENES } from './catalog.js';
import { text, line, SANS } from '../kit/canvas.js';
import { seeded } from '../kit/math.js';
import { layer, xuanPaper, noise, brushMark, tintMask, inkGranulation } from '../kit/materials.js';
import { inkStroke, inkWash, mossDots } from '../kit/ink.js';
import { songCameraAt } from '../main/presentation.js';
import { ROAD_Y } from '../beat/timeline.js';

export const scene = SCENES[4];
export const finished = true;
export const cameraAt = songCameraAt;
let landscape;
let inkTip;

function polygon(points) {
  const path = new Path2D();
  points.forEach(([x, y], i) => i ? path.lineTo(x, y) : path.moveTo(x, y));
  path.closePath();
  return path;
}

function rockEdge(points, seed) {
  const random = seeded(seed);
  const edge = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const [x, y] = points[i];
    const [xx, yy] = points[i + 1];
    const length = Math.hypot(xx - x, yy - y);
    const steps = Math.max(2, Math.floor(length / 3));
    for (let j = 0; j < steps; j += 1) {
      const f = j / steps;
      const jitter = (random() - 0.5) * 2.4;
      edge.push([x + (xx - x) * f - (yy - y) / length * jitter, y + (yy - y) * f + (xx - x) / length * jitter]);
    }
  }
  edge.push(points.at(-1));
  return edge;
}

function mountain(ctx, points, { seed, opacity = 1, strokes = 1400, shade = '#434d42' }) {
  const random = seeded(seed);
  const edge = rockEdge(points, seed);
  const path = polygon(edge);
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  ctx.save();
  ctx.globalAlpha = opacity;
  inkWash(ctx, path, { color: shade, alpha: 0.17, bleed: 3.2 });
  ctx.save();
  ctx.clip(path);
  const wash = ctx.createLinearGradient(minX, minY, maxX, maxY);
  wash.addColorStop(0, 'rgba(66,76,62,0.02)');
  wash.addColorStop(0.46, 'rgba(61,72,59,0.09)');
  wash.addColorStop(0.69, 'rgba(43,55,44,0.29)');
  wash.addColorStop(1, 'rgba(83,88,70,0.08)');
  ctx.fillStyle = wash;
  ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
  // Long dark clefts and pale rock faces give the texture a geological order.
  for (let rib = 0; rib < 13; rib += 1) {
    const x = minX + (rib + 0.3 + random() * 0.4) / 13 * (maxX - minX);
    const top = minY + random() * (maxY - minY) * 0.4;
    const w = (maxX - minX) * (0.018 + random() * 0.065);
    const lean = (random() - 0.6) * 80;
    const cleft = new Path2D();
    cleft.moveTo(x, top);
    cleft.bezierCurveTo(x - w * 0.4, top + 110, x + lean + w, maxY - 90, x + lean, maxY + 20);
    cleft.lineTo(x + lean + w * 0.3, maxY + 20);
    cleft.bezierCurveTo(x + lean + w * 0.3, maxY - 125, x + w * 0.55, top + 80, x + w * 0.15, top);
    cleft.closePath();
    inkWash(ctx, cleft, { color: '#253226', alpha: 0.1 + random() * 0.25, bleed: 2.7 });
    brushMark(ctx, inkTip, x + w * 0.1, top, x + lean + w * 0.3, maxY, w * 0.45, 0.22);
  }
  // Overlapping wet areas create irregular value masses before the dry texture.
  for (let i = 0; i < 80; i += 1) {
    const x = minX + random() * (maxX - minX);
    const y = minY + random() * (maxY - minY);
    ctx.fillStyle = `rgba(40,54,43,${0.012 + random() * 0.023})`;
    ctx.beginPath();
    ctx.ellipse(x, y, 8 + random() * 55, 25 + random() * 110, -0.3 + random() * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < strokes; i += 1) {
    const x = minX + random() * (maxX - minX);
    const y = minY + random() * (maxY - minY);
    const n = noise(x / 90, y / 140, seed);
    const len = 1.3 + random() * 5 + n * 7;
    const bend = (noise(x / 53, y / 150, seed + 1) - 0.35) * 4;
    const shadeSide = noise(x / 77, y / 90, seed + 9);
    const pts = [[x, y], [x + bend * 0.2, y + len * 0.4], [x + bend, y + len]];
    inkStroke(ctx, pts, { color: shadeSide > 0.4 ? '#263327' : '#7b806a', width: 0.35 + random() * 1.4, alpha: 0.12 + shadeSide * 0.42, seed: seed + i, dry: 0.4 });
  }
  for (let i = 0; i < 230; i += 1) {
    const x = minX + random() * (maxX - minX);
    const y = minY + random() * (maxY - minY);
    brushMark(ctx, inkTip, x, y, x - 4 + random() * 17, y + 15 + random() * 40, 5 + random() * 13, 0.09 + random() * 0.13);
  }
  for (let i = 0; i < 1400; i += 1) {
    const x = minX + random() * (maxX - minX);
    const y = minY + random() * (maxY - minY);
    const density = noise(x / 29, y / 36, seed + 51);
    if (random() > density * density) continue;
    mossDots(ctx, x, y, 11, 6, seed + i + 8000, 0.4);
  }
  // Broken descending ribs establish the direction of the cliff faces.
  for (let i = 0; i < 18; i += 1) {
    const x = minX + random() * (maxX - minX);
    const y = minY + random() * (maxY - minY) * 0.8;
    inkStroke(ctx, [[x, y], [x - 4, y + 26], [x - 3, y + 47], [x - 11, y + 86], [x - 23, y + 121]], { seed: i + seed, width: 1.6, alpha: 0.45, dry: 0.3 });
  }
  ctx.restore();
  inkStroke(ctx, edge, { width: 1.4, seed, alpha: 0.7, dry: 0.5 });
  for (let i = 1; i < points.length - 2; i += 2) {
    const [x, y] = points[i];
    const [xx, yy] = points[i + 1];
    brushMark(ctx, inkTip, x, y + 2, xx, yy + 2, 8, 0.43);
  }
  points.slice(1, -1).forEach(([x, y], i) => {
    if (i % 2 === 0) mossDots(ctx, x, y + 3, 17, 8, seed + i, 0.64);
  });
  ctx.restore();
}

function pine(ctx, x, y, height, seed, opacity = 1) {
  const random = seeded(seed);
  ctx.save();
  ctx.globalAlpha = opacity;
  const lean = (random() - 0.5) * height * 0.23;
  inkStroke(ctx, [[x - 3, y], [x + 1, y - height * 0.32], [x + lean * 0.4, y - height * 0.7], [x + lean, y - height]], { seed, width: Math.max(1, height * 0.026), alpha: 0.9, dry: 0.3 });
  for (let branch = 0; branch < 6; branch += 1) {
    const h = 0.25 + branch * 0.115;
    const side = branch % 2 ? 1 : -1;
    const bx = x + lean * h;
    const by = y - height * h;
    const reach = height * (0.37 - h * 0.22) * side;
    const endY = by - height * (0.07 + random() * 0.03);
    inkStroke(ctx, [[bx, by], [bx + reach * 0.6, by - height * 0.06], [bx + reach, endY]], { seed: seed + branch, width: height * 0.012 + 0.5, alpha: 0.85 });
    for (let tuft = 0; tuft < 4; tuft += 1) {
      const tx = bx + reach * (0.2 + tuft * 0.24);
      const ty = by - height * 0.06;
      // Uneven ink clusters give the needles weight without a flat green disk.
      ctx.fillStyle = '#344332';
      for (let dab = 0; dab < 18; dab += 1) {
        const dx = (random() - 0.5) * height * 0.09;
        const dy = (random() - 0.5) * height * 0.028;
        ctx.globalAlpha = opacity * (0.1 + random() * 0.25);
        ctx.beginPath();
        ctx.ellipse(tx + dx, ty + dy, height * (0.006 + random() * 0.01), height * (0.004 + random() * 0.005), -0.1, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = opacity;
      for (let needle = 0; needle < 10; needle += 1) {
        const a = -Math.PI + needle / 9 * Math.PI;
        const len = height * (0.035 + random() * 0.03);
        inkStroke(ctx, [[tx, ty], [tx + Math.cos(a) * len, ty + Math.sin(a) * len * 0.6]], { seed: seed + tuft * 40 + needle, width: 0.55 + height * 0.003, alpha: 0.8, dry: 0 });
      }
    }
    mossDots(ctx, bx + reach, endY - 3, height * 0.11, 10, seed + branch + 7, 0.7);
  }
  ctx.restore();
}

function foregroundRock(ctx, x, y, size, seed) {
  const random = seeded(seed);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size, size);
  const p = new Path2D('M-1 .07 Q-.91 -.29 -.69 -.34 Q-.6 -.62 -.31 -.55 Q-.11 -.77 .2 -.58 Q.48 -.55 .52 -.37 Q.85 -.32 1 .07 Q.27 .16 -1 .07 Z');
  inkWash(ctx, p, { color: '#3b4538', alpha: 0.45, bleed: 0.01 });
  ctx.save();
  ctx.clip(p);
  const wash = ctx.createLinearGradient(-1, -0.6, 0.8, 0.15);
  wash.addColorStop(0, 'rgba(50,61,48,0.05)');
  wash.addColorStop(0.55, 'rgba(35,47,35,0.35)');
  wash.addColorStop(1, 'rgba(32,44,34,0.68)');
  ctx.fillStyle = wash;
  ctx.fillRect(-1, -1, 2, 1.2);
  for (let i = 0; i < 150; i += 1) {
    const px = random() * 2 - 1;
    const py = -random() * 0.7;
    inkStroke(ctx, [[px, py], [px - 0.02, py + 0.06], [px - 0.013, py + 0.09]], { width: 0.002 + random() * 0.006, seed: seed + i, alpha: 0.6, dry: 0.4 });
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(33,44,33,0.42)';
  ctx.lineWidth = 0.005;
  ctx.stroke(p);
  inkStroke(ctx, [[-0.31, -0.55], [-0.4, -0.32], [-0.08, -0.22], [0.2, 0]], { seed, width: 0.009, alpha: 0.8 });
  brushMark(ctx, inkTip, -0.65, -0.33, -0.28, -0.48, 0.04, 0.3);
  brushMark(ctx, inkTip, 0.19, -0.53, 0.5, -0.31, 0.03, 0.3);
  ctx.restore();
}

export function prepare({ brush }) {
  inkTip = tintMask(brush.graphite, '#354132');
  const paper = xuanPaper(1061);
  const granulation = inkGranulation(1062);
  landscape = layer(2000, 1000, (ctx) => {
    ctx.translate(500, 0);
    const peaks = layer(2000, 1000, (ctx) => {
      ctx.translate(500, 0);
      mountain(ctx, [[-470, 707], [-380, 539], [-313, 481], [-275, 381], [-225, 359], [-196, 301], [-142, 338], [-110, 289], [-65, 320], [-9, 455], [80, 496], [151, 653], [224, 706]], { seed: 1030, opacity: 0.25, strokes: 650 });
      mountain(ctx, [[818, 727], [909, 584], [938, 448], [984, 409], [1000, 318], [1047, 282], [1070, 227], [1109, 269], [1145, 254], [1201, 401], [1278, 465], [1359, 685], [1500, 739]], { seed: 1040, opacity: 0.24, strokes: 700 });
      mountain(ctx, [[-146, 719], [-103, 599], [-51, 565], [-23, 478], [33, 446], [53, 359], [91, 342], [113, 270], [159, 283], [193, 230], [241, 252], [259, 318], [307, 348], [330, 447], [371, 493], [381, 593], [450, 712]], { seed: 1060, opacity: 0.62, strokes: 1250 });
      mountain(ctx, [[267, 756], [305, 642], [342, 589], [351, 509], [392, 468], [401, 364], [442, 333], [449, 258], [482, 240], [493, 190], [532, 180], [550, 127], [582, 139], [614, 95], [642, 106], [673, 75], [704, 102], [720, 152], [762, 161], [783, 220], [817, 249], [820, 315], [850, 369], [869, 467], [909, 516], [921, 626], [1017, 756]], { seed: 1090, opacity: 0.98, strokes: 6800 });
      const fall = new Path2D('M379 398 C362 439 380 462 369 496 C360 524 354 552 362 577 C370 594 354 620 339 642 L351 647 C372 615 382 599 374 576 C365 547 378 522 382 493 C391 458 375 439 389 400 Z');
      ctx.fillStyle = '#e5e2d2';
      ctx.fill(fall);
      inkStroke(ctx, [[379, 407], [374, 443], [380, 474], [369, 515], [366, 553], [372, 582], [351, 630]], { seed: 1099, alpha: 0.38, width: 0.8 });
      // Fade the ink itself; painting a solid fog rectangle leaves a hard band
      // when the camera inspects the mountain foot at higher magnification.
      const mist = ctx.createLinearGradient(0, 550, 0, 700);
      mist.addColorStop(0, 'rgba(0,0,0,0)');
      mist.addColorStop(0.55, 'rgba(0,0,0,0.4)');
      mist.addColorStop(1, 'rgba(0,0,0,1)');
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = mist;
      ctx.fillRect(-500, 550, 2000, 450);
    }, 2.5);
    ctx.drawImage(peaks, -500, 0, 2000, 1000);
    // Low, detailed terraces remain in the search lens after the giant summit
    // leaves the view. Reserve a pale gap for the rider and the narrow track.
    foregroundRock(ctx, 240, 785, 79, 1101);
    foregroundRock(ctx, 710, 780, 105, 1102);
    foregroundRock(ctx, 848, 785, 62, 1103);
    for (let i = 0; i < 11; i += 1) pine(ctx, 690 + i * 17, 743 + Math.sin(i * 1.3) * 9, 27 + i % 4 * 8, 1104 + i, 0.73);
    for (let i = 0; i < 6; i += 1) pine(ctx, 181 + i * 19, 755, 26 + i % 3 * 9, 1134 + i, 0.69);
    for (let i = 0; i < 19; i += 1) {
      const y = 842 + i * 4.4;
      const start = 288 + Math.sin(i * 0.7) * 32;
      inkStroke(ctx, [[start, y], [410 + i * 4, y - 2], [500 + Math.sin(i) * 11, y + 3], [578 + i * 3, y + 1]], { seed: 1110 + i, width: 0.36, alpha: 0.22, dry: 0.1 });
    }
    // Midground bank and trees, smaller and lighter than the near rocks.
    mountain(ctx, [[-245, 789], [-187, 739], [-139, 721], [-93, 731], [-31, 696], [22, 712], [76, 761], [174, 788]], { seed: 1110, strokes: 270, opacity: 0.66 });
    for (let i = 0; i < 9; i += 1) pine(ctx, -149 + i * 25, 751 + Math.sin(i) * 12, 29 + (i % 3) * 11, 1120 + i, 0.7);
    mountain(ctx, [[924, 779], [973, 719], [1013, 728], [1078, 689], [1123, 722], [1222, 742], [1298, 781]], { seed: 1150, strokes: 270, opacity: 0.62 });
    for (let i = 0; i < 7; i += 1) pine(ctx, 1001 + i * 27, 741, 25 + (i % 3) * 12, 1160 + i, 0.65);
    // The cycling track stays horizontal while its banks wander into the picture.
    inkStroke(ctx, [[-500, ROAD_Y], [-100, ROAD_Y], [250, ROAD_Y], [600, ROAD_Y], [1050, ROAD_Y], [1500, ROAD_Y]], { seed: 1180, width: 0.48, alpha: 0.48, dry: 0.3 });
    inkStroke(ctx, [[-500, 826], [-270, 822], [-122, 843], [66, 828], [182, 845], [352, 836], [544, 846], [709, 830], [881, 848], [1130, 825], [1500, 840]], { seed: 1181, width: 1, alpha: 0.47 });
    foregroundRock(ctx, -107, 917, 225, 1200);
    pine(ctx, -185, 855, 164, 1210);
    pine(ctx, -107, 841, 192, 1220);
    foregroundRock(ctx, 1017, 933, 183, 1240);
    pine(ctx, 1052, 879, 143, 1250);
    foregroundRock(ctx, 1420, 947, 186, 1260);
    foregroundRock(ctx, 768, 887, 49, 1269);
    mossDots(ctx, 747, 858, 69, 36, 1270, 0.8);
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(granulation, -500, 0);
    ctx.globalCompositeOperation = 'destination-over';
    ctx.drawImage(paper, -500, 0, 2000, 1000);
    // Paper fibers sit over the pigment as well as in the empty sky.
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 0.065;
    ctx.drawImage(paper, -500, 0, 2000, 1000);
  }, 2.5);
}

export function renderAt(ctx) {
  ctx.drawImage(landscape, -500, 0, 2000, 1000);
}

export function renderRider(ctx, pose, { x, y, scale }) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const stroke = (pts, width = 2, seed = 1280) => inkStroke(ctx, pts, { width, seed, alpha: 0.95, dry: 0.35 });
  for (const cx of [-135, 135]) {
    const rim = Array.from({ length: 81 }, (_, i) => [cx + Math.cos(i / 80 * Math.PI * 2) * 73, Math.sin(i / 80 * Math.PI * 2) * 73]);
    stroke(rim, 3.5, cx + 1400);
    for (let i = 0; i < 10; i += 1) {
      const a = pose.wheelAngle + i * Math.PI / 5;
      stroke([[cx, 0], [cx + Math.cos(a) * 70, Math.sin(a) * 70]], 0.9, i);
    }
  }
  stroke([[-135, 0], [-60, -115], [-20, -4], [-135, 0]], 4);
  stroke([[-60, -115], [80, -105], [-20, -4]], 4);
  stroke([[135, 0], [80, -105], [73, -146], [105, -154]], 4);
  stroke([[-60, -115], [-62, -139], [-87, -139], [-42, -139]], 4);
  stroke([[pose.farFoot.x, pose.farFoot.y], [-20, -4], [pose.nearFoot.x, pose.nearFoot.y]], 3);
  stroke([[pose.hip.x, pose.hip.y], [pose.farKnee.x, pose.farKnee.y], [pose.farFoot.x, pose.farFoot.y]], 4);
  ctx.save();
  ctx.translate(0, pose.bob * 0.5);
  const body = new Path2D('M-159 -198 Q-150 -228 -111 -246 Q-70 -266 -22 -238 Q11 -244 7 -285 C2 -330 32 -358 65 -349 Q100 -345 93 -318 Q90 -303 68 -296 C54 -281 68 -248 42 -216 Q7 -171 -63 -174 Q-121 -174 -159 -198 Z');
  ctx.fillStyle = '#eee9d8';
  ctx.fill(body);
  ctx.strokeStyle = '#30382d';
  ctx.lineWidth = 2.2;
  ctx.stroke(body);
  inkWash(ctx, new Path2D('M-147 -200 Q-98 -249 -43 -216 Q2 -190 41 -211 Q-1 -171 -63 -174 Q-121 -174 -147 -200 Z'), { color: '#69745e', alpha: 0.1, bleed: 1.4 });
  const pouch = new Path2D('M85 -333 L238 -301 Q146 -274 82 -307 Q72 -299 64 -288');
  ctx.fillStyle = '#d2c8a7';
  ctx.fill(pouch);
  ctx.stroke(pouch);
  stroke([[88, -322], [230, -301]], 1.4);
  ctx.beginPath();
  ctx.arc(69, -335, 3.1, 0, Math.PI * 2);
  ctx.fillStyle = '#29322a';
  ctx.fill();
  stroke([[-134, -229], [-106, -238], [-63, -228], [-25, -207], [19, -184], [104, -149]], 3);
  for (let i = 0; i < 8; i += 1) stroke([[-124 + i * 18, -220 + i * 4], [-115 + i * 17, -201 + i * 3], [-98 + i * 18, -185 + i * 2]], 1.1, i + 1360);
  ctx.restore();
  stroke([[pose.hip.x, pose.hip.y], [pose.nearKnee.x, pose.nearKnee.y], [pose.nearFoot.x, pose.nearFoot.y]], 4.5);
  stroke([[pose.nearFoot.x - 9, pose.nearFoot.y + 3], [pose.nearFoot.x + 18, pose.nearFoot.y + 3]], 3.5);
  ctx.restore();
}

export function renderTitle(ctx, { x }) {
  text(ctx, '宋', x + 6, 111, { size: 57, color: '#303b2f', weight: 600 });
  text(ctx, '代', x + 6, 177, { size: 57, color: '#303b2f', weight: 600 });
  text(ctx, '山', x + 6, 243, { size: 57, color: '#303b2f', weight: 600 });
  text(ctx, '水', x + 6, 309, { size: 57, color: '#303b2f', weight: 600 });
  text(ctx, 'SONG LANDSCAPE', x + 90, 100, { size: 22, color: '#4e5847', family: SANS });
  text(ctx, '约 1000', x + 92, 140, { size: 24, color: '#4e5847' });
  text(ctx, '山有千仞', x + 94, 223, { size: 23, color: '#59614e' });
  text(ctx, '行者一骑', x + 94, 261, { size: 23, color: '#59614e' });
  ctx.save();
  ctx.fillStyle = '#9b4938';
  ctx.fillRect(x + 13, 336, 40, 42);
  text(ctx, '行', x + 33, 368, { size: 28, color: '#e6ddc6', align: 'center' });
  ctx.restore();
}
