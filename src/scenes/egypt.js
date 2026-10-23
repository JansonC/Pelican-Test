import { SCENES } from './catalog.js';
import { text, line, SANS } from '../kit/canvas.js';
import { seeded, smooth, lerp } from '../kit/math.js';
import { layer, noise, tintMask, brushMark, pigmentPainter } from '../kit/materials.js';
import { ROAD_Y } from '../beat/timeline.js';

export const scene = SCENES[1];
export const finished = true;
export const TITLE_GLYPHS = '河畔工坊骑行记录';

const RED = '#a44832';
const INK = '#39362c';
const BLUE = '#376570';
const GOLD = '#b39859';
const LINEN = '#eddfba';
let wall;
let mural;
let surface;
let redChalk;
let paintRider;

function polygon(ctx, points, fill, stroke = INK, width = 1.5) {
  ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
}

function ellipse(ctx, x, y, rx, ry, fill, stroke = INK, width = 1.5) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
}

function outline(ctx, points, color, width) {
  line(ctx, points, INK, width + 2.4);
  line(ctx, points, color, width);
}

// Invented bird and folded-river ornaments are pictures and geometry, never
// a claim to translatable ancient writing.
function birdOrnament(ctx, x, y, size, facing = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size * facing, size);
  polygon(ctx, [[-20, 10], [-26, 3], [-12, 3], [-4, -5], [7, -5], [10, -15], [18, -17], [22, -12], [18, -7], [41, -3], [18, 0], [13, 11]], BLUE, INK, 1.2);
  polygon(ctx, [[-12, 5], [-2, -1], [8, 4], [2, 10]], GOLD, INK, 0.8);
  line(ctx, [[0, 12], [-2, 20], [6, 20]], RED, 1.6);
  line(ctx, [[10, 11], [13, 20], [21, 20]], RED, 1.6);
  ellipse(ctx, 16, -12, 1.2, 1.5, INK, null);
  ctx.restore();
}

function border(ctx, y, lower = false) {
  line(ctx, [[-500, y], [1500, y]], RED, 4);
  line(ctx, [[-500, y + 8], [1500, y + 8]], INK, 1.3);
  line(ctx, [[-500, y + 50], [1500, y + 50]], INK, 1.3);
  line(ctx, [[-500, y + 58], [1500, y + 58]], RED, 4);
  for (let x = -484; x < 1500; x += 160) {
    birdOrnament(ctx, x + 32, y + 28, 0.83, lower ? -1 : 1);
    polygon(ctx, [[x + 97, y + 13], [x + 119, y + 29], [x + 97, y + 45], [x + 75, y + 29]], GOLD, INK, 1.2);
    polygon(ctx, [[x + 97, y + 20], [x + 110, y + 29], [x + 97, y + 38], [x + 84, y + 29]], RED, null);
    line(ctx, [[x + 135, y + 14], [x + 143, y + 29], [x + 135, y + 44]], BLUE, 2.8);
  }
}

function profile(ctx, x, y, scale = 1, facing = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale * facing, scale);
  polygon(ctx, [[-10, 11], [-11, -7], [-3, -15], [11, -14], [14, -6], [21, -1], [15, 3], [15, 11], [5, 15], [4, 23], [-7, 23]], RED, INK, 1.3);
  polygon(ctx, [[-13, 10], [-15, -6], [-10, -18], [4, -20], [13, -13], [8, -7], [-1, -7], [-3, 12]], INK, INK, 1);
  ellipse(ctx, 8, -3, 4, 2.3, LINEN, INK, 0.8);
  ellipse(ctx, 9, -3, 1.5, 1.8, INK, null);
  line(ctx, [[5, -8], [13, -8]], INK, 1.1);
  ctx.restore();
}

function workshopPerson(ctx, x, y, scale, task = 'carry', facing = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale * facing, scale);
  profile(ctx, 0, -115);
  polygon(ctx, [[-7, -95], [8, -95], [19, -72], [11, -47], [-13, -48], [-17, -76]], RED);
  polygon(ctx, [[-13, -51], [12, -51], [24, -23], [-23, -23]], LINEN);
  for (let i = 0; i < 5; i += 1) line(ctx, [[-9 + i * 4.5, -47], [-15 + i * 8, -26]], GOLD, 0.8);
  outline(ctx, [[-10, -24], [-14, -10], [-26, 0], [-12, 0]], RED, 4);
  outline(ctx, [[12, -24], [19, -11], [35, -1], [46, -1]], RED, 4);
  if (task === 'carry') {
    outline(ctx, [[-12, -86], [-29, -107], [-19, -136]], RED, 4);
    outline(ctx, [[12, -86], [34, -104], [37, -135]], RED, 4);
    polygon(ctx, [[-33, -155], [46, -155], [34, -132], [-19, -132]], GOLD, INK, 1.4);
    for (let i = 0; i < 5; i += 1) line(ctx, [[-24, -150 + i * 3.5], [39, -150 + i * 3.5]], RED, 1);
  } else if (task === 'weave') {
    outline(ctx, [[-11, -86], [-28, -70], [-15, -51]], RED, 4);
    outline(ctx, [[11, -86], [31, -73], [52, -88]], RED, 4);
    line(ctx, [[51, -93], [60, -83]], INK, 2);
  } else {
    outline(ctx, [[-12, -86], [14, -66], [40, -87]], RED, 4);
    outline(ctx, [[12, -86], [27, -94], [43, -87]], RED, 4);
    line(ctx, [[45, -120], [43, -87], [63, 10]], GOLD, 4);
    polygon(ctx, [[57, 2], [65, 2], [77, 34], [66, 40]], GOLD, INK, 1);
  }
  ellipse(ctx, 0, -84, 13, 3, BLUE, INK, 0.7);
  ctx.restore();
}

function reedClump(ctx, x, y, size, seed) {
  const random = seeded(seed);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size, size);
  for (let i = 0; i < 11; i += 1) {
    const dx = (i - 5) * 7;
    const h = 38 + random() * 52;
    line(ctx, [[0, 0], [dx * 0.4, -h * 0.55], [dx, -h]], BLUE, 1.8);
    polygon(ctx, [[dx - 9, -h + 3], [dx - 6, -h - 11], [dx, -h - 17], [dx + 7, -h - 10], [dx + 9, -h + 3]], GOLD, INK, 0.7);
    line(ctx, [[dx - 7, -h - 2], [dx + 7, -h - 2]], BLUE, 1);
  }
  ctx.restore();
}

function workshopBand(ctx) {
  line(ctx, [[-500, 309], [1500, 309]], RED, 2.6);
  line(ctx, [[-500, 317], [1500, 317]], INK, 1.2);
  line(ctx, [[-500, 457], [1500, 457]], INK, 1.5);
  line(ctx, [[-500, 465], [1500, 465]], RED, 3.2);
  reedClump(ctx, -457, 449, 0.92, 2201);
  polygon(ctx, [[-407, 416], [-370, 432], [-191, 432], [-154, 409], [-177, 444], [-203, 450], [-359, 450], [-387, 441]], GOLD, INK, 2);
  for (let i = 0; i < 7; i += 1) line(ctx, [[-388, 430 + i * 2], [-178, 430 + i * 2]], RED, 0.8);
  workshopPerson(ctx, -336, 429, 0.72, 'row');
  workshopPerson(ctx, -234, 429, 0.72, 'row');
  reedClump(ctx, -104, 451, 0.68, 2202);
  workshopPerson(ctx, -5, 451, 0.79, 'weave');
  polygon(ctx, [[44, 332], [134, 332], [134, 450], [126, 450], [126, 340], [52, 340], [52, 450], [44, 450]], GOLD, INK, 1.6);
  for (let x = 59; x < 125; x += 6) line(ctx, [[x, 342], [x + 2, 443]], LINEN, 2.2);
  polygon(ctx, [[58, 384], [124, 384], [126, 431], [59, 431]], BLUE, INK, 1.2);
  for (let y = 391; y < 429; y += 7) line(ctx, [[60, y], [124, y]], GOLD, 1.3);
  for (let x = 64; x < 125; x += 12) line(ctx, [[x, 385], [x + 1, 429]], LINEN, 1);
  workshopPerson(ctx, 196, 451, 0.8, 'weave', -1);
  for (const [x, color] of [[279, RED], [305, BLUE], [331, GOLD]]) {
    polygon(ctx, [[x - 8, 410], [x + 8, 410], [x + 14, 445], [x + 8, 451], [x - 9, 451], [x - 14, 445]], color, INK, 1.2);
    ellipse(ctx, x, 411, 9, 2.3, INK, null);
    line(ctx, [[x - 9, 433], [x + 9, 433]], LINEN, 1.5);
  }
  workshopPerson(ctx, 422, 452, 0.8, 'carry');
  workshopPerson(ctx, 535, 452, 0.8, 'carry');
  polygon(ctx, [[619, 407], [696, 407], [682, 449], [633, 449]], GOLD, INK, 1.4);
  for (let i = 0; i < 7; i += 1) line(ctx, [[624 + i * 10, 413], [637 + i * 6, 447]], RED, 1.1);
  for (let i = 0; i < 6; i += 1) ellipse(ctx, 635 + (i % 3) * 19, 402 - Math.floor(i / 3) * 11, 13, 8, i % 2 ? BLUE : RED, INK, 1);
  workshopPerson(ctx, 779, 452, 0.8, 'carry');
  workshopPerson(ctx, 892, 452, 0.8, 'weave', -1);
  polygon(ctx, [[968, 393], [1100, 393], [1100, 447], [968, 447]], BLUE, INK, 1.8);
  for (let j = 0; j < 3; j += 1) {
    const y = 405 + j * 15;
    for (let i = 0; i < 6; i += 1) line(ctx, [[974 + i * 21, y], [981 + i * 21, y - 4], [988 + i * 21, y]], LINEN, 1.2);
  }
  birdOrnament(ctx, 999, 378, 1.12);
  birdOrnament(ctx, 1076, 378, 0.9, -1);
  reedClump(ctx, 1147, 450, 0.96, 2203);
  workshopPerson(ctx, 1250, 452, 0.8, 'carry');
  workshopPerson(ctx, 1360, 452, 0.8, 'carry');
  reedClump(ctx, 1469, 451, 1.02, 2204);
}

function palm(ctx, x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  polygon(ctx, [[-13, 0], [-9, -190], [0, -240], [11, -190], [12, 0]], GOLD, INK, 2.2);
  for (let i = 0; i < 19; i += 1) line(ctx, [[-9, -9 - i * 10], [9, -16 - i * 10]], RED, 1.3);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i += 1) {
      const endX = side * (47 + i * 25);
      const endY = -271 + i * 24;
      polygon(ctx, [[0, -226], [side * 28, -269 + i * 12], [endX, endY], [side * 35, -236 + i * 10]], BLUE, INK, 1.2);
      line(ctx, [[side * 4, -233], [endX, endY]], GOLD, 1.2);
    }
  }
  polygon(ctx, [[-2, -237], [-9, -295], [4, -313], [11, -280], [7, -237]], BLUE, INK, 1.4);
  for (const dx of [-17, -5, 14]) ellipse(ctx, dx, -213, 7, 13, RED, INK, 1);
  ctx.restore();
}

function offeringTable(ctx, x, y) {
  polygon(ctx, [[x - 71, y - 89], [x + 71, y - 89], [x + 66, y - 77], [x - 65, y - 77]], GOLD, INK, 2);
  polygon(ctx, [[x - 7, y - 76], [x + 7, y - 76], [x + 13, y - 6], [x + 44, y], [x - 43, y], [x - 13, y - 6]], RED, INK, 1.8);
  ellipse(ctx, x - 35, y - 96, 24, 10, LINEN, INK, 1.5);
  ellipse(ctx, x + 7, y - 101, 20, 15, LINEN, INK, 1.5);
  polygon(ctx, [[x + 28, y - 95], [x + 37, y - 136], [x + 51, y - 136], [x + 61, y - 95]], BLUE, INK, 1.4);
  ellipse(ctx, x + 44, y - 136, 7, 3, INK, null);
  line(ctx, [[x + 32, y - 111], [x + 55, y - 111]], GOLD, 2);
}

function recorderBody(ctx, x, y, scale, variant) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  profile(ctx, 0, -208, 1.7, -1);
  polygon(ctx, [[-12, -170], [15, -170], [33, -134], [21, -79], [-22, -80], [-30, -134]], RED, INK, 2);
  polygon(ctx, [[-22, -87], [22, -87], [48, -50], [85, -34], [83, -13], [3, -13], [-22, -39]], LINEN, INK, 2);
  polygon(ctx, [[-14, -42], [13, -26], [75, -15], [97, -11], [99, -3], [11, -2], [-36, -21]], RED, INK, 2);
  polygon(ctx, [[21, -81], [58, -66], [75, -21], [59, -16], [30, -57]], LINEN, INK, 1.6);
  for (let i = 0; i < 6; i += 1) line(ctx, [[-14 + i * 5, -79], [7 + i * 9, -32]], GOLD, 1);
  polygon(ctx, [[-20, -169], [17, -169], [22, -155], [-25, -155]], BLUE, INK, 1.4);
  for (let i = 0; i < 7; i += 1) line(ctx, [[-15 + i * 5, -167], [-15 + i * 5, -156]], GOLD, 1.6);
  // The boards carry invented geometric studies of the unlikely visitor.
  polygon(ctx, [[-64, -81], [22, -91], [31, -57], [-55, -47]], GOLD, INK, 1.7);
  ellipse(ctx, -42, -64, 9, 9, null, RED, 1.3);
  ellipse(ctx, -4, -69, 9, 9, null, RED, 1.3);
  line(ctx, [[-42, -64], [-26, -82], [-20, -66], [-42, -64], [-4, -69], [-11, -85]], RED, 1.1);
  line(ctx, [[-58, -36], [-4, -39]], BLUE, 2);
  if (variant) polygon(ctx, [[37, -7], [90, -7], [96, 0], [31, 0]], BLUE, INK, 1.1);
  ctx.restore();
}

function recorderArms(ctx, x, y, scale, localT, variant) {
  const lift = smooth((localT - 2 - variant * 0.08) / 0.22) * (1 - smooth((localT - 3.32 - variant * 0.08) / 0.58));
  const working = Math.sin(localT * 5.8 + variant * 1.3) * 4 * (1 - lift);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const elbow = [lerp(-39, -64, lift), lerp(-123, -191, lift)];
  const hand = [lerp(-40, -107 - variant * 10, lift), lerp(-82 + working, -237 + variant * 15, lift)];
  outline(ctx, [[-22, -155], elbow, hand], RED, 9);
  ellipse(ctx, hand[0] - 2, hand[1] - 1, 5, 3.5, RED, INK, 1.1);
  line(ctx, [[hand[0] - 12, hand[1] - 20], [hand[0] + 9, hand[1] + 11]], INK, 2);
  outline(ctx, [[18, -153], [33, -111], [-7, -83]], RED, 8);
  line(ctx, [[-7, -83], [-20, -78]], RED, 6);
  line(ctx, [[elbow[0] - 5, elbow[1] - 4], [elbow[0] + 3, elbow[1] + 3]], GOLD, 4);
  ctx.restore();
}

function constructionLines(ctx) {
  ctx.save();
  ctx.strokeStyle = 'rgba(164,72,50,0.1)';
  ctx.lineWidth = 0.65;
  ctx.beginPath();
  for (let x = -500; x <= 1500; x += 56) { ctx.moveTo(x, 97); ctx.lineTo(x, 842); }
  for (let y = 108; y < 842; y += 56) { ctx.moveTo(-500, y); ctx.lineTo(1500, y); }
  ctx.stroke();
  ctx.globalAlpha = 0.2;
  for (const x of [-350, -5, 422, 780, 1250]) {
    line(ctx, [[x - 14, 333], [x + 6, 328], [x + 14, 347], [x + 8, 373], [x + 22, 397], [x + 5, 420], [x + 30, 450]], RED, 1);
    line(ctx, [[x - 7, 372], [x - 16, 398], [x - 11, 418], [x - 29, 450]], RED, 1);
  }
  line(ctx, [[763, 746], [774, 653], [802, 600], [840, 556], [862, 573], [863, 613]], RED, 1);
  ctx.restore();
}

function plasterSurface() {
  const texture = layer(1000, 500);
  const ctx = texture.getContext('2d');
  const data = ctx.createImageData(1000, 500);
  const random = seeded(2101);
  for (let y = 0; y < 500; y += 1) {
    for (let x = 0; x < 1000; x += 1) {
      const shade = (noise(x / 105, y / 57, 2101) - 0.5) * 20 + (noise(x / 20, y / 11, 2102) - 0.5) * 7 + (random() - 0.5) * 9;
      const i = (y * 1000 + x) * 4;
      data.data[i] = 228 + shade;
      data.data[i + 1] = 208 + shade;
      data.data[i + 2] = 163 + shade * 0.86;
      data.data[i + 3] = 255;
    }
  }
  ctx.putImageData(data, 0, 0);
  return texture;
}

function pigmentWear(ctx) {
  const random = seeded(2117);
  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 23000; i += 1) {
    ctx.fillStyle = `rgba(0,0,0,${0.14 + random() * 0.5})`;
    ctx.fillRect(random() * 2000 - 500, random() * 1000, 0.5 + random() * 3.3, 0.3 + random() * 1.4);
  }
  for (let i = 0; i < 190; i += 1) {
    const x = random() * 2000 - 500;
    const y = random() * 1000;
    const w = 3 + random() * 16;
    const h = 1 + random() * 5;
    polygon(ctx, [[x - w, y], [x - w * 0.4, y - h], [x + w * 0.7, y - h * 0.6], [x + w, y + h * 0.3], [x, y + h]], 'rgba(0,0,0,0.42)', null);
  }
  ctx.globalCompositeOperation = 'source-over';
}

export function prepare({ brush }) {
  redChalk = tintMask(brush.graphite, RED);
  paintRider = pigmentPainter(600, 550, 2199);
  const texture = plasterSurface();
  wall = layer(2000, 1000, (ctx) => {
    ctx.drawImage(texture, 0, 0, 2000, 1000);
    ctx.translate(500, 0);
    constructionLines(ctx);
  });
  mural = layer(2000, 1000, (ctx) => {
    ctx.translate(500, 0);
    ctx.lineJoin = 'round';
    border(ctx, 34);
    workshopBand(ctx);
    border(ctx, 873, true);
    for (let x = -494; x < 1500; x += 112) {
      polygon(ctx, [[x, 840], [x + 28, 823], [x + 56, 840], [x + 84, 823], [x + 112, 840]], null, RED, 2.4);
      line(ctx, [[x, 850], [x + 112, 850]], BLUE, 2.5);
    }
    palm(ctx, -312, 781, 0.95);
    offeringTable(ctx, -115, 782);
    reedClump(ctx, -464, 784, 1.35, 2221);
    recorderBody(ctx, 887, 781, 1.02, 0);
    recorderBody(ctx, 1102, 781, 0.91, 1);
    palm(ctx, 1330, 781, 1.05);
    offeringTable(ctx, 1473, 782);
    for (let i = 0; i < 4; i += 1) {
      const x = 712 + i * 37;
      polygon(ctx, [[x, 527], [x + 23, 527], [x + 23, 555], [x, 555]], null, GOLD, 1);
      line(ctx, [[x + 5, 548], [x + 11, 534], [x + 18, 548]], RED, 1.2);
    }
    line(ctx, [[-500, ROAD_Y], [1500, ROAD_Y]], RED, 4);
    line(ctx, [[-500, ROAD_Y + 9], [1500, ROAD_Y + 9]], INK, 1.1);
    pigmentWear(ctx);
  });
  surface = layer(2000, 1000, (ctx) => {
    const random = seeded(2181);
    ctx.translate(500, 0);
    for (let i = 0; i < 15000; i += 1) {
      const x = random() * 2000 - 500;
      const y = random() * 1000;
      ctx.fillStyle = i % 3 ? 'rgba(74,58,33,0.055)' : 'rgba(255,242,201,0.22)';
      ctx.fillRect(x, y, 0.3 + random() * 1.6, 0.25 + random() * 0.8);
    }
    for (let i = 0; i < 125; i += 1) {
      const x = random() * 2000 - 500;
      const y = random() * 1000;
      const w = 2 + random() * 13;
      const h = 1 + random() * 4;
      polygon(ctx, [[x - w, y], [x - w * 0.25, y - h], [x + w, y], [x + w * 0.2, y + h]], 'rgba(239,221,178,0.5)', null);
    }
    for (const points of [
      [[-406, 94], [-382, 176], [-390, 233], [-371, 272], [-376, 319]],
      [[665, 28], [653, 98], [674, 148], [667, 207], [687, 247]],
      [[1231, 470], [1220, 530], [1228, 579], [1209, 617], [1217, 680]],
      [[-220, 914], [-181, 897], [-133, 907], [-101, 897]],
      [[367, 950], [390, 906], [377, 856]],
    ]) {
      line(ctx, points.map(([x, y]) => [x + 1.5, y - 0.8]), 'rgba(253,237,196,0.5)', 2.4);
      line(ctx, points, 'rgba(86,65,38,0.28)', 0.8);
    }
  });
}

// The mapped clock affects pose only; world position uses the original time.
// The cubic joins match both value and first derivative on either side.
export function poseTimeAt(t, localT) {
  if (localT < 1.88 || localT >= 3.9) return t;
  const start = t - localT;
  if (localT < 2) {
    const u = (localT - 1.88) / 0.12;
    return start + 1.88 + 0.12 * (u + u * u - u * u * u);
  }
  if (localT <= 3.02) return start + 2;
  const duration = 0.88;
  const u = (localT - 3.02) / duration;
  const u2 = u * u;
  const u3 = u2 * u;
  return start + (2 * u3 - 3 * u2 + 1) * 2 + (-2 * u3 + 3 * u2) * 3.9 + (u3 - u2) * duration;
}

export function renderAt(ctx, { localT }) {
  ctx.drawImage(wall, -500, 0);
  ctx.save();
  ctx.globalAlpha *= 0.24 + smooth(localT / 1.8) * 0.76;
  ctx.drawImage(mural, -500, 0);
  recorderArms(ctx, 887, 781, 1.02, localT, 0);
  recorderArms(ctx, 1102, 781, 0.91, localT, 1);
  ctx.restore();
  ctx.drawImage(surface, -500, 0);
}

function decorativeWing(ctx, side, ceremonial) {
  ctx.save();
  ctx.translate(-40, -226);
  ctx.scale(side, 1);
  ctx.rotate(lerp(0.14, -0.21, ceremonial));
  polygon(ctx, [[-2, -4], [21, -26], [62, -27], [112, 16], [113, 29], [69, 15], [23, 17]], BLUE, INK, 2);
  for (let i = 0; i < 7; i += 1) {
    const x = 17 + i * 13;
    polygon(ctx, [[x - 5, -10 + i * 2], [x + 6, -11 + i * 3], [x + 15, 19 + i * 0.7], [x + 4, 16 + i * 0.6]], i % 2 ? GOLD : LINEN, INK, 0.8);
  }
  line(ctx, [[5, -8], [27, -18], [60, -18], [103, 16]], RED, 3);
  ctx.restore();
}

export function renderRider(ctx, pose, { x, y, scale = 1, localT = 0 }) {
  const ceremonial = smooth((localT - 1.86) / 0.14) * (1 - smooth((localT - 3.02) / 0.55));
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  paintRider(ctx, (p) => {
    p.lineCap = 'round';
    p.lineJoin = 'round';
    const leg = (knee, foot, color, width) => {
      outline(p, [[pose.hip.x, pose.hip.y], [knee.x, knee.y], [foot.x, foot.y]], color, width);
      line(p, [[foot.x - 9, foot.y + 5], [foot.x + 19, foot.y + 5]], BLUE, 5);
      ellipse(p, knee.x, knee.y, 5, 5, GOLD, INK, 1);
    };
    leg(pose.farKnee, pose.farFoot, '#8b7048', 6);
    for (const cx of [-135, 135]) {
      ellipse(p, cx, 0, 73, 73, null, INK, 7);
      ellipse(p, cx, 0, 71, 71, null, RED, 3);
      ellipse(p, cx, 0, 66, 66, null, GOLD, 1.2);
      for (let i = 0; i < 10; i += 1) {
        const a = pose.wheelAngle + i * Math.PI / 5;
        line(p, [[cx, 0], [cx + Math.cos(a) * 66, Math.sin(a) * 66]], BLUE, 1.6);
      }
      ellipse(p, cx, 0, 7, 7, RED, INK, 1.5);
      ellipse(p, cx, 0, 2.5, 2.5, GOLD, null);
    }
    outline(p, [[-135, 0], [-60, -115], [-20, -4], [-135, 0]], RED, 6);
    outline(p, [[-60, -115], [80, -105], [-20, -4]], RED, 6);
    outline(p, [[135, 0], [80, -105], [72, -145], [108, -151]], RED, 6);
    line(p, [[-60, -115], [-65, -137]], BLUE, 5);
    line(p, [[-88, -140], [-42, -140]], INK, 8);
    line(p, [[-84, -140], [-46, -140]], GOLD, 2);
    ellipse(p, -20, -4, 23, 23, null, GOLD, 2);
    line(p, [[pose.farFoot.x, pose.farFoot.y], [-20, -4], [pose.nearFoot.x, pose.nearFoot.y]], INK, 4);
    p.save();
    p.translate(0, pose.bob * 0.6);
    decorativeWing(p, -1, ceremonial);
    const body = new Path2D('M-137 -183 L-174 -211 L-143 -220 C-120 -258 -62 -267 -22 -244 C0 -236 5 -263 6 -287 C7 -324 27 -354 58 -353 C81 -353 98 -338 94 -320 C92 -308 78 -302 68 -296 C55 -280 69 -251 45 -216 C13 -167 -76 -162 -137 -183 Z');
    p.fillStyle = LINEN;
    p.fill(body);
    p.strokeStyle = INK;
    p.lineWidth = 3;
    p.stroke(body);
    polygon(p, [[-140, -220], [-173, -212], [-137, -183], [-110, -179]], BLUE, INK, 1.8);
    for (let i = 0; i < 4; i += 1) line(p, [[-159 + i * 7, -211], [-129 + i * 7, -183]], GOLD, 1.5);
    const beak = new Path2D('M88 -337 L238 -302 L214 -294 L102 -305 Q85 -289 68 -287 L78 -309 Z');
    p.fillStyle = GOLD;
    p.fill(beak);
    p.stroke(beak);
    line(p, [[94, -324], [231, -302]], INK, 1.3);
    polygon(p, [[102, -305], [214, -294], [171, -288], [91, -297], [68, -287]], RED, INK, 1.1);
    // A frontal almond eye in a profile head is the key mural convention.
    const eye = new Path2D('M45 -335 Q59 -347 75 -335 Q59 -324 45 -335 Z');
    p.fillStyle = LINEN;
    p.fill(eye);
    p.strokeStyle = INK;
    p.lineWidth = 2.4;
    p.stroke(eye);
    ellipse(p, 60, -335, 4.5, 6.2, INK, null);
    line(p, [[44, -335], [32, -331]], INK, 2);
    line(p, [[47, -346], [62, -351], [79, -344]], INK, 2);
    polygon(p, [[10, -277], [61, -269], [57, -253], [6, -264]], BLUE, INK, 1.5);
    for (let i = 0; i < 8; i += 1) line(p, [[13 + i * 6, -275 + i * 1.1], [11 + i * 6, -264 + i * 1.1]], GOLD, 2);
    decorativeWing(p, 1, ceremonial);
    outline(p, [[-36, -214], [18, -187], [65, -164], [107, -148]], LINEN, 10);
    for (let i = 0; i < 5; i += 1) line(p, [[-18 + i * 20, -208 + i * 10], [-24 + i * 20, -198 + i * 10]], BLUE, 2.1);
    p.restore();
    leg(pose.nearKnee, pose.nearFoot, RED, 7.5);
    const foot = pose.nearFoot;
    line(p, [[foot.x - 7, foot.y - 5], [foot.x + 2, foot.y - 5]], GOLD, 4);
    line(p, [[foot.x - 8, foot.y + 9], [foot.x + 17, foot.y + 9]], INK, 3.5);
  });
  ctx.restore();
}

export function renderTitle(ctx, { x }) {
  text(ctx, '02   /   RIVER WORKSHOP', x + 2, 123, { size: 16, family: SANS, color: BLUE, weight: 600 });
  text(ctx, scene.zh, x, 185, { size: 56, color: INK, weight: 600 });
  text(ctx, 'EGYPTIAN WALL PAINTING', x + 2, 223, { size: 23, family: SANS, color: INK });
  text(ctx, scene.era, x + 2, 263, { size: 24, color: RED });
  text(ctx, '河畔工坊 · 骑行记录', x + 180, 263, { size: 19, color: BLUE });
  brushMark(ctx, redChalk, x, 283, x + 366, 283, 5, 0.75);
}
