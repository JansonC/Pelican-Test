import { SCENES } from './catalog.js';
import { text, line, SANS } from '../kit/canvas.js';
import { seeded, smooth } from '../kit/math.js';
import { layer, xuanPaper, tintMask, brushMark } from '../kit/materials.js';
import { ROAD_Y } from '../beat/timeline.js';

export const scene = SCENES[3];
export const finished = true;
export const TITLE_GLYPHS = '唐代白描风过长汀吴带当风行约';

const INK = '#33362f';
const TEA = '#a99a7e';
const PAPER = '#eee7d6';
const TAU = Math.PI * 2;
let landscape;
let body;
let bicycle;
let willowThreads = [];

function cubic(points, count = 24) {
  const [a, b, c, d] = points;
  return Array.from({ length: count + 1 }, (_, index) => {
    const t = index / count;
    const q = 1 - t;
    return [
      q ** 3 * a[0] + 3 * q * q * t * b[0] + 3 * q * t * t * c[0] + t ** 3 * d[0],
      q ** 3 * a[1] + 3 * q * q * t * b[1] + 3 * q * t * t * c[1] + t ** 3 * d[1],
    ];
  });
}

// Filled contours give each line pressure; a narrow white core supplies flying white.
function silkLine(ctx, points, width = 1.5, alpha = 0.9, seed = 1, dry = false) {
  if (points.length < 2) return;
  const sides = [[], []];
  points.forEach(([x, y], index) => {
    const before = points[Math.max(0, index - 1)];
    const after = points[Math.min(points.length - 1, index + 1)];
    const dx = after[0] - before[0];
    const dy = after[1] - before[1];
    const length = Math.max(0.01, Math.hypot(dx, dy));
    const f = index / (points.length - 1);
    const pressure = (0.3 + Math.sin(Math.PI * f) ** 0.7 * 0.7) * (0.88 + 0.12 * Math.sin(f * 14 + seed));
    const radius = width * pressure * 0.5;
    sides[0].push([x - dy / length * radius, y + dx / length * radius]);
    sides[1].push([x + dy / length * radius, y - dx / length * radius]);
  });
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = INK;
  ctx.beginPath();
  [...sides[0], ...sides[1].reverse()].forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
  ctx.fill();
  if (dry && width > 1.4) {
    ctx.globalAlpha *= 0.48;
    line(ctx, points.slice(3, Math.max(4, Math.floor(points.length * 0.72))), PAPER, width * 0.16);
  }
  ctx.restore();
}

function flourish(ctx, points, width = 1.5, alpha = 0.9, seed = 1, dry = false) {
  silkLine(ctx, cubic(points), width, alpha, seed, dry);
}

function outline(ctx, path, width = 1.3, fill = null, alpha = 1) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill(path);
  }
  ctx.strokeStyle = INK;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke(path);
  ctx.restore();
}

function rock(ctx, x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  outline(ctx, new Path2D('M-61 7 C-81 -9 -72 -30 -57 -39 L-49 -77 -30 -87 -24 -127 -3 -144 5 -180 23 -191 35 -171 27 -141 45 -116 37 -86 57 -68 51 -37 72 -14 61 5 Q9 17 -61 7 Z'), 1.5, PAPER);
  const contours = [
    [[-61, 7], [-48, -12], [-70, -17], [-57, -39]],
    [[-49, -77], [-21, -62], [-27, -40], [-19, -24]],
    [[-24, -127], [9, -111], [-10, -91], [2, -66]],
    [[5, -180], [4, -159], [21, -161], [27, -141]],
    [[45, -116], [17, -106], [34, -72], [14, -55]],
    [[37, -86], [48, -58], [12, -44], [27, -12]],
    [[-30, -87], [-13, -90], [-8, -66], [-13, -57]],
    [[51, -37], [42, -25], [56, -15], [61, 5]],
  ];
  contours.forEach((points, index) => flourish(ctx, points, index % 3 ? 0.75 : 1.65, 0.74, 41 + index, true));
  for (let i = 0; i < 11; i += 1) {
    const xx = -37 + i * 7;
    flourish(ctx, [[xx, 5], [xx - 4, -4], [xx + 2, -10], [xx - 3, -19 - i % 3 * 5]], 0.62, 0.37, i);
  }
  ctx.restore();
}

function reeds(ctx, x, y, size, seed) {
  const random = seeded(seed);
  for (let i = 0; i < 17; i += 1) {
    const root = x + (random() - 0.5) * size * 0.65;
    const height = size * (0.4 + random() * 0.7);
    const reach = -height * (0.13 + random() * 0.55);
    const end = [root + reach, y - height];
    flourish(ctx, [[root, y], [root - 9, y - height * 0.35], [end[0] + 12, y - height * 0.8], end], 0.7 + random() * 0.6, 0.74, seed + i);
    for (let leaf = 0; leaf < 2; leaf += 1) {
      const side = leaf ? 1 : -1;
      const py = y - height * (0.26 + leaf * 0.29);
      const px = root + reach * (0.2 + leaf * 0.3);
      flourish(ctx, [[px, py], [px + side * 15, py - 20], [px + side * 27, py - 24], [px + side * 42, py - 26]], 1.55, 0.76, i + leaf);
    }
    if (i % 3 === 0) {
      for (let bar = 0; bar < 9; bar += 1) {
        const py = end[1] + bar * 2.2;
        line(ctx, [[end[0] - 2, py], [end[0] + 5 + Math.sin(bar / 9 * Math.PI) * 4, py - 5]], INK, 0.48);
      }
    }
  }
}

function waterbird(ctx, x, y, scale, turn = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale * turn, scale);
  outline(ctx, new Path2D('M-30 -15 Q-49 -23 -58 -16 Q-39 -12 -31 -6 Q-11 14 12 3 Q30 -3 22 -24 Q15 -39 30 -44 Q38 -51 44 -44 Q49 -36 40 -33 Q29 -31 34 -14 Q36 3 15 9 Q-11 15 -30 -15 Z'), 1.1, PAPER);
  flourish(ctx, [[-31, -6], [-22, -24], [4, -15], [15, 0]], 0.8, 0.9);
  for (let i = 0; i < 4; i += 1) flourish(ctx, [[-25 + i * 5, -7], [-16 + i * 5, -5], [-14 + i * 5, 2], [-5 + i * 5, 3]], 0.48, 0.7, i);
  line(ctx, [[43, -40], [57, -35], [42, -36]], INK, 0.8);
  line(ctx, [[-2, 10], [-5, 25], [-13, 26]], INK, 0.8);
  line(ctx, [[10, 8], [14, 23], [21, 23]], INK, 0.8);
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(39, -43, 0.9, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function paintWillow(ctx) {
  outline(ctx, new Path2D('M1014 805 C984 754 975 687 978 615 C977 542 995 488 984 427 C976 374 949 338 909 303 C947 326 981 356 998 400 C1020 458 1004 513 999 573 C988 668 1004 746 1046 800'), 1.7);
  flourish(ctx, [[1028, 802], [988, 713], [981, 655], [988, 578]], 2, 0.8, 11, true);
  flourish(ctx, [[991, 590], [984, 516], [1012, 436], [958, 359]], 1.3, 0.65, 12, true);
  const boughs = [
    [[992, 438], [939, 384], [900, 401], [848, 375]],
    [[981, 403], [938, 347], [868, 351], [802, 329]],
    [[960, 358], [921, 305], [868, 292], [839, 251]],
    [[979, 459], [1041, 398], [1056, 355], [1124, 336]],
    [[999, 506], [1063, 457], [1121, 454], [1164, 422]],
    [[978, 592], [944, 564], [906, 560], [877, 532]],
  ];
  boughs.forEach((points, i) => {
    flourish(ctx, points, 2.6 - i * 0.2, 0.9, 87 + i, true);
    cubic(points, 6).slice(2).forEach(([x, y], j) => {
      willowThreads.push({ x, y, length: 100 + (i * 43 + j * 37) % 167, reach: -31 - (i * 13 + j * 19) % 52, phase: i * 0.72 + j * 1.2 });
    });
  });
}

function paintBody(ctx) {
  outline(ctx, new Path2D('M-180 -195 C-193 -200 -202 -209 -213 -214 C-185 -211 -173 -225 -151 -244 C-116 -271 -80 -276 -40 -252 C-17 -237 -1 -251 -4 -279 C-9 -314 5 -345 31 -359 C50 -371 79 -365 90 -349 C99 -336 93 -320 81 -312 C61 -296 75 -269 55 -232 C36 -192 5 -171 -47 -169 C-101 -167 -148 -179 -180 -195 Z'), 1.9, PAPER);
  flourish(ctx, [[-177, -196], [-135, -175], [-88, -174], [-46, -174]], 2.5, 0.82, 71, true);
  flourish(ctx, [[-150, -243], [-121, -264], [-80, -275], [-44, -255]], 2.2, 0.91, 72, true);
  flourish(ctx, [[-2, -273], [-11, -308], [3, -341], [27, -354]], 2, 0.92, 73, true);
  flourish(ctx, [[78, -313], [55, -300], [64, -275], [48, -249]], 1.2, 0.76, 74);
  for (let i = 0; i < 8; i += 1) {
    flourish(ctx, [[3 + i * 3.8, -292 + i * 5], [4 + i * 4.2, -271 + i * 3], [3 + i * 5, -246 + i * 2], [-6 + i * 6, -223 + i * 1.6]], 0.53, 0.68, 77 + i);
  }
  // Long mandibles and the suspended throat pouch stay almost uncolored.
  outline(ctx, new Path2D('M88 -344 L245 -309 Q203 -293 161 -290 Q111 -287 81 -312 Q69 -303 65 -288'), 1.25, PAPER);
  flourish(ctx, [[87, -331], [139, -324], [207, -312], [242, -309]], 1.65, 0.96, 90);
  flourish(ctx, [[86, -343], [140, -332], [205, -319], [245, -309]], 1.05, 0.94, 91);
  for (let i = 0; i < 8; i += 1) {
    const endX = 105 + i * 14;
    flourish(ctx, [[84, -317], [93 + i * 3, -305], [endX - 16, -297], [endX, -293 - i * 0.8]], 0.46, 0.47, 95 + i);
  }
  flourish(ctx, [[28, -350], [42, -355], [55, -356], [68, -350]], 0.9, 0.85, 100);
  ctx.beginPath();
  ctx.ellipse(66, -347, 3.3, 3.5, -0.1, 0, TAU);
  ctx.fillStyle = INK;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(67, -348, 0.95, 0, TAU);
  ctx.fillStyle = PAPER;
  ctx.fill();
  for (let i = 0; i < 15; i += 1) {
    const f = i / 14;
    flourish(ctx, [[-148 + f * 119, -233 + Math.sin(f * 2.1) * 12], [-176 + f * 124, -209 + f * 16], [-172 + f * 138, -190 + f * 10], [-151 + f * 133, -183 + f * 7]], 0.68, 0.7, i + 110);
  }
  for (let i = 0; i < 6; i += 1) {
    flourish(ctx, [[-193 + i * 4, -209], [-184 + i * 6, -202], [-173 + i * 8, -188], [-157 + i * 8, -188]], 0.7, 0.75, 140 + i);
  }
}

export function prepare({ brush }) {
  const paper = xuanPaper(4600);
  const graphite = tintMask(brush.graphite, INK);
  willowThreads = [];
  landscape = layer(2000, 1000, (ctx) => {
    ctx.drawImage(paper, 0, 0, 2000, 1000);
    ctx.fillStyle = 'rgba(255,252,239,0.15)';
    ctx.fillRect(0, 0, 2000, 1000);
    ctx.translate(500, 0);
    // A sparse bank keeps the uninterrupted upper two thirds as the main material.
    flourish(ctx, [[-500, 856], [-209, 837], [-59, 861], [181, 843]], 0.8, 0.5, 1);
    flourish(ctx, [[-300, 880], [-64, 852], [126, 892], [345, 877]], 0.7, 0.44, 2);
    flourish(ctx, [[830, 851], [1040, 840], [1190, 871], [1500, 850]], 0.65, 0.5, 3);
    for (let i = 0; i < 13; i += 1) {
      const y = 906 + i * 5;
      const x = -390 + Math.sin(i * 1.7) * 30;
      flourish(ctx, [[x, y], [x + 54, y - 3], [x + 119, y + 2], [x + 192 + i % 3 * 13, y - 1]], 0.46, 0.22, 10 + i);
    }
    rock(ctx, 920, 786, 0.91);
    rock(ctx, 1082, 817, 0.48);
    paintWillow(ctx);
    reeds(ctx, -160, 858, 114, 4601);
    reeds(ctx, 90, 869, 64, 4602);
    reeds(ctx, 1161, 867, 89, 4603);
    waterbird(ctx, -36, 877, 0.73, 1);
    waterbird(ctx, 184, 876, 0.57, -1);
    for (const [x, y, w] of [[-23, 902, 49], [189, 898, 38], [891, 823, 88], [1059, 842, 74]]) {
      flourish(ctx, [[x - w, y], [x - w * 0.3, y - 1], [x + w * 0.5, y + 1], [x + w, y]], 0.45, 0.45, 80);
    }
    line(ctx, [[-500, ROAD_Y], [1500, ROAD_Y]], INK, 0.58);
    for (let i = 0; i < 17; i += 1) {
      const x = -494 + i * 123;
      brushMark(ctx, graphite, x, ROAD_Y + 0.5, x + 77, ROAD_Y + 0.5, 1.3, 0.16);
    }
  }, 2);
  body = layer(640, 440, (ctx) => {
    ctx.translate(270, 400);
    paintBody(ctx);
  }, 2);
  bicycle = layer(500, 270, (ctx) => {
    ctx.translate(250, 180);
    const frame = [
      [[-135, 0], [-60, -115], [-20, -4], [-135, 0]],
      [[-60, -115], [80, -105], [-20, -4]],
      [[135, 0], [80, -105], [73, -146], [105, -154], [115, -145], [109, -135]],
      [[-60, -115], [-64, -136], [-88, -139], [-43, -139]],
      [[-129, 5], [-25, 18], [-17, -24], [-128, -5]],
    ];
    frame.forEach((points, i) => {
      line(ctx, points, INK, i === 4 ? 0.8 : 1.8);
      if (i < 2) line(ctx, points.map(([x, y]) => [x + 2.8, y + 0.8]), INK, 0.45);
    });
    outline(ctx, new Path2D('M4 -4 A24 24 0 1 1 -44 -4 A24 24 0 1 1 4 -4'), 0.9);
  }, 2);
}

function windAt(localT) {
  return smooth((localT - 2) / 0.35) * (1 - smooth((localT - 4) / 1.2));
}

export function renderAt(ctx, { t, localT }) {
  ctx.drawImage(landscape, -500, 0, 2000, 1000);
  const gust = windAt(localT);
  for (const thread of willowThreads) {
    const { x, y, length, reach, phase } = thread;
    const sway = Math.sin(t * 1.5 + phase) * (3 + gust * 5) - gust * 10;
    const twig = cubic([[x, y], [x + reach * 0.5, y + length * 0.3], [x + reach + sway, y + length * 0.75], [x + reach + sway * 1.4, y + length]], 27);
    silkLine(ctx, twig, 0.78, 0.77, phase);
    for (let leaf = 1; leaf < 9; leaf += 1) {
      const [px, py] = twig[leaf * 3];
      const side = leaf % 2 ? 1 : -1;
      flourish(ctx, [[px, py], [px + side * 7, py + 2], [px + side * 9, py + 12], [px + side * 4, py + 19]], 1.3, 0.74, leaf + phase);
    }
  }
}

function ribbon(ctx, t, gust, index) {
  const length = 123 + gust * (190 + index * 16);
  const baseY = -246 + index * 10;
  const upper = index !== 1;
  const crest = upper ? -65 - gust * (index === 0 ? 61 : 15) : 39 + gust * 43;
  const ripple = Math.sin(t * 3.1 - index * 1.4) * (3 + gust * 8);
  const top = cubic([[-88, baseY], [-146, baseY + crest * 1.2], [-88 - length * 0.72, baseY + crest + ripple], [-88 - length, baseY + crest * 0.22 + ripple]], 32);
  const bottom = top.map(([x, y], i) => [x + Math.sin(i / 32 * Math.PI) * 2, y + (3.5 + index) * Math.sin(i / 32 * Math.PI) + 1.5]);
  ctx.save();
  ctx.fillStyle = PAPER;
  ctx.beginPath();
  [...top, ...bottom.slice().reverse()].forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
  ctx.fill();
  silkLine(ctx, top, index === 0 ? 2.1 : 1.55, 0.91, 200 + index, true);
  silkLine(ctx, bottom, 0.65, 0.72, 210 + index);
  ctx.restore();
}

function wing(ctx, gust, t) {
  const lift = gust * (5 + Math.sin(t * 3.8) * 2);
  outline(ctx, new Path2D(`M-133 -242 C-100 -260 -66 -236 -37 -214 C0 -187 54 -163 106 ${-149 - lift * 0.25} C72 -144 23 -155 -24 -165 C-70 -172 -120 -183 -145 -204 Q-155 -226 -133 -242 Z`), 1.3, PAPER);
  flourish(ctx, [[-135, -240], [-99, -258], [-53, -227], [-15, -199]], 1.9, 0.91, 181, true);
  for (let i = 0; i < 11; i += 1) {
    const f = i / 10;
    const endX = -111 + f * 217;
    const endY = -182 + f * 34 - lift * Math.sin(f * Math.PI);
    const rootX = -123 + f * 68;
    const rootY = -236 + f * 16;
    flourish(ctx, [[rootX, rootY], [rootX + 17, rootY + 23], [endX - 37, endY - 13], [endX, endY]], 0.8 + f * 0.4, 0.88, 190 + i);
    flourish(ctx, [[rootX + 4, rootY + 10], [rootX + 19, rootY + 29], [endX - 28, endY - 4], [endX - 5, endY + 1.8]], 0.38, 0.61, 210 + i);
  }
  for (let i = 0; i < 12; i += 1) {
    const f = i / 11;
    flourish(ctx, [[-131 + f * 98, -229 + f * 25], [-124 + f * 97, -222 + f * 25], [-121 + f * 95, -215 + f * 23], [-119 + f * 94, -209 + f * 20]], 0.56, 0.65, i + 225);
  }
}

export function renderRider(ctx, pose, { x, y, scale = 1, t = pose.phase / TAU, localT = t - scene.start }) {
  const gust = windAt(localT);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const leg = (knee, foot, alpha, width) => {
    silkLine(ctx, [[pose.hip.x, pose.hip.y], [knee.x, knee.y], [foot.x, foot.y]], width, alpha, 20);
    line(ctx, [[foot.x - 9, foot.y + 3], [foot.x + 17, foot.y + 3], [foot.x + 9, foot.y - 2]], INK, width * 0.57);
  };
  leg(pose.farKnee, pose.farFoot, 0.6, 2.2);
  for (const center of [-135, 135]) {
    ctx.beginPath();
    ctx.arc(center, 0, 73, 0, TAU);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(center, 0, 69, 0, TAU);
    ctx.lineWidth = 0.55;
    ctx.stroke();
    for (let spoke = 0; spoke < 16; spoke += 1) {
      const a = pose.wheelAngle + spoke / 16 * TAU;
      line(ctx, [[center + Math.cos(a) * 3, Math.sin(a) * 3], [center + Math.cos(a + 0.08) * 68, Math.sin(a + 0.08) * 68]], INK, 0.54);
    }
    ctx.beginPath();
    ctx.arc(center, 0, 3.1, 0, TAU);
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.drawImage(bicycle, -250, -180, 500, 270);
  line(ctx, [[pose.farFoot.x, pose.farFoot.y], [-20, -4], [pose.nearFoot.x, pose.nearFoot.y]], INK, 1.5);
  ctx.save();
  ctx.translate(0, pose.bob * 0.55);
  for (let i = 2; i >= 0; i -= 1) ribbon(ctx, t, gust, i);
  ctx.drawImage(body, -270, -400, 640, 440);
  wing(ctx, gust, t);
  flourish(ctx, [[-95, -249], [-86, -258], [-79, -256], [-74, -249]], 1.1, 0.95, 12);
  ctx.restore();
  leg(pose.nearKnee, pose.nearFoot, 0.96, 3.1);
  flourish(ctx, [[pose.hip.x - 4, pose.hip.y - 5], [pose.hip.x + 1, pose.hip.y + 2], [pose.nearKnee.x + 2, pose.nearKnee.y - 4], [pose.nearKnee.x + 1, pose.nearKnee.y + 1]], 0.7, 0.67, 22);
  line(ctx, [[pose.nearFoot.x - 11, pose.nearFoot.y + 7], [pose.nearFoot.x + 17, pose.nearFoot.y + 7]], INK, 1.2);
  ctx.restore();
}

export function renderTitle(ctx, { x }) {
  ctx.save();
  ['唐', '代', '白', '描'].forEach((character, i) => text(ctx, character, x + 3, 113 + i * 59, { size: 49, color: INK, weight: 500 }));
  line(ctx, [[x + 70, 70], [x + 70, 317]], TEA, 0.72);
  text(ctx, 'TANG LINE DRAWING', x + 94, 104, { size: 21, family: SANS, color: INK });
  text(ctx, '约 750', x + 95, 143, { size: 23, color: '#81765f' });
  text(ctx, '风过长汀', x + 96, 221, { size: 25, color: INK });
  text(ctx, '吴带当风', x + 97, 261, { size: 19, color: '#81765f' });
  ctx.strokeStyle = '#a14a3d';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 10, 311, 34, 37);
  ctx.strokeRect(x + 13, 314, 28, 31);
  text(ctx, '行', x + 27, 338, { size: 24, align: 'center', color: '#a14a3d' });
  ctx.restore();
}
