import { SCENES } from './catalog.js';
import { text, line, SANS } from '../kit/canvas.js';
import { seeded, smooth, lerp } from '../kit/math.js';
import { layer, xuanPaper } from '../kit/materials.js';
import { ROAD_Y } from '../beat/timeline.js';

export const scene = SCENES[7];
export const finished = true;
export const TITLE_GLYPHS = '花园雅集一路生风约';

const INK = '#414b3e';
const GOLD = '#b3944d';
const TEAL = '#356b68';
const ROSE = '#a45654';
const TAU = Math.PI * 2;
const guests = [
  { x: 116, y: 628, scale: 1.02, view: 'front', robe: '#b98272', side: 1 },
  { x: 863, y: 576, scale: 0.97, view: 'profile', robe: '#537b78', side: -1 },
  { x: 1190, y: 660, scale: 1.08, view: 'back', robe: '#c5ad71', side: -1 },
];
let garden;
let riderBody;
let bicycle;

function shape(ctx, description, fill, stroke = INK, width = 0.9) {
  const path = typeof description === 'string' ? new Path2D(description) : description;
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill(path);
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.stroke(path);
  }
}

function polygon(ctx, points, fill, stroke = INK, width = 0.9) {
  const path = new Path2D();
  points.forEach(([pointX, pointY], index) => index ? path.lineTo(pointX, pointY) : path.moveTo(pointX, pointY));
  path.closePath();
  shape(ctx, path, fill, stroke, width);
}

function ellipse(ctx, centerX, centerY, radiusX, radiusY, fill, stroke = INK, width = 0.8, angle = 0) {
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radiusX, radiusY, angle, 0, TAU);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
}

function flower(ctx, centerX, centerY, size, color, turn = 0) {
  for (let petal = 0; petal < 5; petal += 1) {
    const angle = turn + petal / 5 * TAU;
    ellipse(ctx, centerX + Math.cos(angle) * size * 0.55, centerY + Math.sin(angle) * size * 0.55, size * 0.47, size * 0.31, color, null, 0, angle);
  }
  ellipse(ctx, centerX, centerY, size * 0.22, size * 0.22, '#d5b55e', null);
}

function sprig(ctx, centerX, groundY, height, color, turn = 0) {
  shape(ctx, `M${centerX} ${groundY} Q${centerX - height * 0.12} ${groundY - height * 0.58} ${centerX + turn * 3} ${groundY - height}`, null, '#64704a', 0.64);
  for (let leaf = 0; leaf < 4; leaf += 1) {
    const side = leaf % 2 ? 1 : -1;
    const leafY = groundY - height * (0.18 + leaf * 0.15);
    ellipse(ctx, centerX + side * height * 0.1, leafY - 3, height * 0.13, height * 0.038, '#697b4f', '#526242', 0.38, side * -0.5);
  }
  flower(ctx, centerX + turn * 3, groundY - height, height * 0.12, color, turn);
}

function cypress(ctx, centerX, groundY, height, seed) {
  const random = seeded(seed);
  const path = new Path2D(`M${centerX} ${groundY - height} C${centerX - height * 0.1} ${groundY - height * 0.72} ${centerX - height * 0.17} ${groundY - height * 0.28} ${centerX - height * 0.1} ${groundY - 15} Q${centerX} ${groundY + 6} ${centerX + height * 0.1} ${groundY - 15} C${centerX + height * 0.17} ${groundY - height * 0.28} ${centerX + height * 0.09} ${groundY - height * 0.72} ${centerX} ${groundY - height} Z`);
  shape(ctx, path, '#526a4a', '#3e5943', 1);
  ctx.save();
  ctx.clip(path);
  for (let needle = 0; needle < 125; needle += 1) {
    const pointX = centerX + (random() - 0.5) * height * 0.3;
    const pointY = groundY - random() * height;
    line(ctx, [[pointX, pointY], [pointX + 3, pointY - 5]], random() > 0.5 ? '#8f9a66' : '#334f3d', 0.65);
  }
  ctx.restore();
  line(ctx, [[centerX, groundY - 18], [centerX, groundY + 5]], '#696142', 1.8);
}

function fruitTree(ctx, centerX, groundY, height, seed) {
  const random = seeded(seed);
  line(ctx, [[centerX, groundY], [centerX - 4, groundY - height * 0.5], [centerX + 2, groundY - height * 0.82]], '#64573d', height * 0.034);
  for (let bough = 0; bough < 7; bough += 1) {
    const angle = bough / 7 * TAU;
    const pointX = centerX + Math.cos(angle) * height * 0.22;
    const pointY = groundY - height * 0.69 + Math.sin(angle) * height * 0.19;
    line(ctx, [[centerX - 2, groundY - height * 0.4], [pointX, pointY]], '#64573d', 1.3);
    ellipse(ctx, pointX, pointY, height * 0.17, height * 0.19, '#7a8654', '#586842', 0.7);
  }
  for (let leaf = 0; leaf < 220; leaf += 1) {
    const angle = random() * TAU;
    const radius = Math.sqrt(random()) * height * 0.35;
    const pointX = centerX + Math.cos(angle) * radius;
    const pointY = groundY - height * 0.69 + Math.sin(angle) * radius * 0.9;
    ellipse(ctx, pointX, pointY, 2.4, 1.1, leaf % 5 ? '#a5aa6e' : '#405a40', null, 0, angle);
    if (leaf % 13 === 0) ellipse(ctx, pointX + 2, pointY + 4, 2.7, 3.1, '#a95843', '#88513c', 0.4);
  }
}

function arch(ctx, centerX, bottomY, width, height, fill) {
  shape(ctx, `M${centerX - width / 2} ${bottomY} L${centerX - width / 2} ${bottomY - height * 0.55} Q${centerX - width * 0.5} ${bottomY - height * 0.83} ${centerX - width * 0.17} ${bottomY - height * 0.89} Q${centerX - width * 0.12} ${bottomY - height * 0.98} ${centerX} ${bottomY - height} Q${centerX + width * 0.12} ${bottomY - height * 0.98} ${centerX + width * 0.17} ${bottomY - height * 0.89} Q${centerX + width * 0.5} ${bottomY - height * 0.83} ${centerX + width * 0.5} ${bottomY - height * 0.55} L${centerX + width / 2} ${bottomY} Z`, fill, '#8c7d59', 0.8);
}

function pavilion(ctx, centerX, groundY, width, height, dome = true) {
  const left = centerX - width / 2;
  ctx.fillStyle = '#c59d7b';
  ctx.fillRect(left - 12, groundY - 9, width + 36, 19);
  ctx.fillStyle = '#ead9b8';
  ctx.fillRect(left, groundY - height, width, height - 9);
  ctx.strokeStyle = '#8d7f60';
  ctx.lineWidth = 1;
  ctx.strokeRect(left, groundY - height, width, height - 9);
  polygon(ctx, [[left + width, groundY - height], [left + width + 24, groundY - height - 17], [left + width + 24, groundY - 22], [left + width, groundY - 9]], '#c2b393', '#8d7f60', 1);
  const bays = Math.max(3, Math.round(width / 48));
  for (let bay = 0; bay < bays; bay += 1) {
    const archX = left + (bay + 0.5) / bays * width;
    arch(ctx, archX, groundY - 20, width / bays * 0.72, height * 0.69, '#7c8270');
    arch(ctx, archX, groundY - 20, width / bays * 0.58, height * 0.62, '#c3c5a7');
    for (let lattice = 1; lattice < 5; lattice += 1) {
      const latticeX = archX - width / bays * 0.23 + lattice / 5 * width / bays * 0.46;
      line(ctx, [[latticeX, groundY - height * 0.47], [latticeX, groundY - 21]], '#6d7964', 0.65);
    }
    for (let crossbar = 0; crossbar < 4; crossbar += 1) line(ctx, [[archX - width / bays * 0.24, groundY - 28 - crossbar * 12], [archX + width / bays * 0.24, groundY - 28 - crossbar * 12]], '#879074', 0.6);
    ellipse(ctx, archX, groundY - height + 10, 3, 3, ROSE, GOLD, 0.7);
  }
  line(ctx, [[left - 8, groundY - height], [left + width + 9, groundY - height], [left + width + 29, groundY - height - 17]], '#8c7050', 3.5);
  line(ctx, [[left - 8, groundY - height - 4], [left + width + 9, groundY - height - 4]], GOLD, 1.3);
  for (let merlon = 0; merlon <= bays * 3; merlon += 1) {
    const pointX = left + merlon / (bays * 3) * width;
    shape(ctx, `M${pointX - 3} ${groundY - height - 5} l0 -7 q3 -6 6 0 l0 7 Z`, '#d9c59e', '#8d7f60', 0.6);
  }
  if (dome) {
    shape(ctx, `M${centerX - width * 0.33} ${groundY - height - 17} Q${centerX - width * 0.42} ${groundY - height - 40} ${centerX - width * 0.18} ${groundY - height - 61} Q${centerX - width * 0.02} ${groundY - height - 77} ${centerX} ${groundY - height - 91} Q${centerX + width * 0.02} ${groundY - height - 77} ${centerX + width * 0.18} ${groundY - height - 61} Q${centerX + width * 0.42} ${groundY - height - 40} ${centerX + width * 0.33} ${groundY - height - 17} Z`, '#d5cba9', '#827b5b', 1.1);
    shape(ctx, `M${centerX} ${groundY - height - 88} Q${centerX - width * 0.13} ${groundY - height - 39} ${centerX - width * 0.1} ${groundY - height - 18}`, null, '#f3e5bf', 1.3);
    line(ctx, [[centerX, groundY - height - 91], [centerX, groundY - height - 109]], GOLD, 1.5);
    ellipse(ctx, centerX, groundY - height - 105, 3, 3, GOLD, INK, 0.6);
    line(ctx, [[centerX - width * 0.34, groundY - height - 15], [centerX + width * 0.34, groundY - height - 15]], '#8c7050', 3);
  }
  for (let step = 0; step < 4; step += 1) {
    const stepY = groundY + step * 5;
    ctx.fillStyle = step % 2 ? '#cfbd97' : '#e4cfaa';
    ctx.fillRect(left - 17 - step * 4, stepY, width + 34 + step * 8, 5);
    line(ctx, [[left - 17 - step * 4, stepY], [left + width + 17 + step * 4, stepY]], '#9d8861', 0.7);
  }
}

function flowerBed(ctx, points, seed, flowers = 100) {
  polygon(ctx, points, '#7c8e61', '#b4a37c', 7);
  polygon(ctx, points, null, '#536944', 1);
  const path = new Path2D();
  points.forEach(([pointX, pointY], index) => index ? path.lineTo(pointX, pointY) : path.moveTo(pointX, pointY));
  path.closePath();
  const random = seeded(seed);
  const minX = Math.min(...points.map(([pointX]) => pointX));
  const minY = Math.min(...points.map(([, pointY]) => pointY));
  const maxX = Math.max(...points.map(([pointX]) => pointX));
  const maxY = Math.max(...points.map(([, pointY]) => pointY));
  ctx.save();
  ctx.clip(path);
  for (let plant = 0; plant < flowers; plant += 1) sprig(ctx, lerp(minX, maxX, random()), lerp(minY, maxY, random()), 13 + random() * 12, plant % 3 ? '#d8c5a3' : '#b2655b', random() - 0.5);
  ctx.restore();
}

function pool(ctx, points, seed) {
  polygon(ctx, points, '#92b5a7', '#ded0ab', 11);
  polygon(ctx, points, null, '#708d7a', 1.4);
  const random = seeded(seed);
  const path = new Path2D();
  points.forEach(([pointX, pointY], index) => index ? path.lineTo(pointX, pointY) : path.moveTo(pointX, pointY));
  path.closePath();
  ctx.save();
  ctx.clip(path);
  const minX = Math.min(...points.map(([pointX]) => pointX));
  const maxX = Math.max(...points.map(([pointX]) => pointX));
  const minY = Math.min(...points.map(([, pointY]) => pointY));
  const maxY = Math.max(...points.map(([, pointY]) => pointY));
  for (let ripple = 0; ripple < 110; ripple += 1) {
    const pointX = lerp(minX, maxX, random());
    const pointY = lerp(minY, maxY, random());
    line(ctx, [[pointX, pointY], [pointX + 4 + random() * 16, pointY - 1.8]], 'rgba(228,231,200,0.61)', 0.75);
  }
  ctx.restore();
}

function border(ctx) {
  ctx.fillStyle = '#eadcbb';
  ctx.fillRect(-482, 26, 1964, 41);
  ctx.fillRect(-482, 927, 1964, 47);
  ctx.fillRect(-482, 26, 40, 948);
  ctx.fillRect(1442, 26, 40, 948);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2.3;
  ctx.strokeRect(-477, 31, 1954, 938);
  ctx.strokeRect(-445, 64, 1890, 866);
  ctx.lineWidth = 0.7;
  ctx.strokeRect(-472, 36, 1944, 928);
  for (let motif = 0; motif < 71; motif += 1) {
    const centerX = -460 + motif * 27;
    for (const borderY of [47, 950]) {
      shape(ctx, `M${centerX - 13} ${borderY} Q${centerX - 5} ${borderY - 12} ${centerX} ${borderY} Q${centerX + 8} ${borderY + 12} ${centerX + 14} ${borderY}`, null, GOLD, 0.9);
      ellipse(ctx, centerX - 4, borderY - 4, 3.6, 1.1, '#778159', null, 0, -0.5);
      flower(ctx, centerX + 5, borderY + 3, 3, motif % 3 ? '#b57668' : TEAL, motif);
    }
  }
  for (let motif = 0; motif < 31; motif += 1) {
    const centerY = 76 + motif * 27;
    for (const borderX of [-462, 1462]) {
      shape(ctx, `M${borderX} ${centerY - 14} Q${borderX - 12} ${centerY - 3} ${borderX} ${centerY + 1} Q${borderX + 12} ${centerY + 8} ${borderX} ${centerY + 14}`, null, GOLD, 0.9);
      flower(ctx, borderX + 3, centerY + 4, 3.2, ROSE, motif);
    }
  }
}

function guestBody(ctx, guest) {
  ctx.save();
  ctx.translate(guest.x, guest.y);
  ctx.scale(guest.scale, guest.scale);
  ellipse(ctx, 0, 2, 35, 5, 'rgba(73,76,48,0.14)', null);
  shape(ctx, 'M-16 -31 L-20 -3 Q-14 2 -5 -1 L-1 -31 Z M4 -31 L9 -1 Q18 2 25 -3 L19 -32 Z', '#f2e3c2');
  shape(ctx, 'M-22 -4 Q-21 -10 -13 -7 L-4 -2 -25 0 Z M8 -2 Q15 -10 21 -7 L30 -1 Z', '#805742', INK, 0.7);
  shape(ctx, 'M-15 -115 Q-28 -108 -30 -91 L-26 -38 Q0 -25 29 -38 L22 -97 Q16 -111 9 -115 Z', guest.robe, INK, 0.9);
  for (let pleat = 0; pleat < 6; pleat += 1) shape(ctx, `M${-17 + pleat * 7} -86 Q${-24 + pleat * 9} -53 ${-24 + pleat * 9} -38`, null, '#e0c797', 0.65);
  line(ctx, [[-24, -47], [25, -47]], GOLD, 1.7);
  line(ctx, [[-22, -52], [24, -52]], '#e8d7af', 0.6);
  for (let rosette = 0; rosette < 9; rosette += 1) flower(ctx, -17 + rosette % 3 * 16, -94 + Math.floor(rosette / 3) * 17, 1.8, '#dbc79b', rosette);
  if (guest.view === 'back') {
    shape(ctx, 'M-10 -119 L-8 -107 Q0 -99 11 -109 L10 -120 Z', '#b99472');
    ellipse(ctx, 0, -132, 13, 16, '#c59d76');
    shape(ctx, 'M-13 -130 Q-18 -146 -6 -151 Q10 -158 16 -141 L13 -129 Q0 -138 -13 -130 Z', '#dfcfaa', INK, 0.8);
    line(ctx, [[-13, -138], [13, -142]], '#a58e65', 0.75);
    shape(ctx, 'M-4 -125 Q-1 -108 -7 -98 L4 -94 Q10 -109 4 -125 Z', '#d4b879', GOLD, 0.6);
  } else if (guest.view === 'profile') {
    shape(ctx, 'M-9 -145 Q-20 -143 -18 -133 L-23 -128 -17 -125 Q-17 -113 -9 -113 L2 -116 9 -128 6 -143 Z', '#d8b38c');
    shape(ctx, 'M-13 -147 Q-10 -158 4 -153 Q18 -150 16 -138 L2 -136 -17 -139 Z', '#d6c69d', INK, 0.8);
    line(ctx, [[-14, -146], [11, -144]], GOLD, 1.4);
    shape(ctx, 'M-18 -124 Q-7 -124 -5 -114 Q-14 -108 -18 -120 Z', '#4a4439', INK, 0.4);
    line(ctx, [[-5, -113], [1, -108], [8, -115]], '#e7d3a8', 1.2);
  } else {
    ellipse(ctx, 0, -130, 12, 17, '#d8b58f');
    shape(ctx, 'M-12 -135 Q-19 -150 -2 -155 Q14 -155 15 -138 L9 -135 Q0 -139 -12 -135 Z', '#eee2bf', INK, 0.8);
    line(ctx, [[-11, -146], [11, -141]], GOLD, 1.6);
    shape(ctx, 'M-9 -122 Q0 -116 8 -122 Q6 -109 0 -108 Q-8 -111 -9 -122 Z', '#4b453a', null);
    line(ctx, [[0, -131], [-2, -124], [2, -124]], '#9a7654', 0.6);
  }
  line(ctx, [[-18, -108], [-28, -82], [-8, -77]], guest.robe, 11);
  line(ctx, [[-27, -85], [-9, -79]], GOLD, 0.7);
  ellipse(ctx, -6, -77, 5, 3, '#d8b38c');
  ctx.restore();
}

export function guestGestureAt(localT, index) {
  const raise = smooth((localT - 2 - index * 0.16) / 0.38);
  return raise * (1 - smooth((localT - 4.4) / 0.8) * 0.23);
}

function guestGesture(ctx, guest, localT, index) {
  const lift = guestGestureAt(localT, index);
  const side = guest.side;
  const handX = side * lerp(35, 38, lift);
  const handY = lerp(-85, -142, lift);
  ctx.save();
  ctx.translate(guest.x, guest.y);
  ctx.scale(guest.scale, guest.scale);
  line(ctx, [[side * 19, -106], [side * 31, lerp(-88, -113, lift)], [handX, handY]], INK, 12);
  line(ctx, [[side * 19, -106], [side * 31, lerp(-88, -113, lift)], [handX, handY]], guest.robe, 10);
  line(ctx, [[handX - 4, handY + 4], [handX + 4, handY + 4]], GOLD, 1.2);
  ellipse(ctx, handX, handY, 4.5, 4, '#d8b38c', INK, 0.5);
  shape(ctx, `M${handX - 7} ${handY - 12} L${handX + 7} ${handY - 12} Q${handX + 6} ${handY - 3} ${handX} ${handY - 3} Q${handX - 6} ${handY - 3} ${handX - 7} ${handY - 12} Z`, '#d2ad55', '#7e6841', 0.7);
  line(ctx, [[handX, handY - 3], [handX, handY + 1]], '#7e6841', 0.65);
  line(ctx, [[handX - 4, handY + 1], [handX + 4, handY + 1]], '#7e6841', 0.65);
  line(ctx, [[handX - 5, handY - 10], [handX + 4, handY - 10]], '#f0d99c', 0.7);
  if (guest.view === 'front') {
    ellipse(ctx, -5, -131, 2.5, 1.2, '#f0dfbd', INK, 0.3);
    ellipse(ctx, 5, -131, 2.5, 1.2, '#f0dfbd', INK, 0.3);
    ellipse(ctx, -5 + lift, -131, 0.7, 0.9, INK, null);
    ellipse(ctx, 5 + lift, -131, 0.7, 0.9, INK, null);
  } else if (guest.view === 'profile') {
    line(ctx, [[-17, -133], [-11, -133 - lift * 0.4]], INK, 0.8);
  }
  ctx.restore();
}

function paintRider(ctx) {
  shape(ctx, 'M-152 -196 Q-180 -207 -192 -222 Q-164 -215 -144 -242 C-119 -267 -70 -271 -35 -250 Q-4 -234 1 -269 C0 -308 13 -341 39 -355 C61 -367 84 -359 90 -342 Q98 -323 80 -313 C61 -298 72 -267 51 -231 C24 -186 -26 -174 -72 -180 Q-121 -179 -152 -196 Z', '#f2e9d0', INK, 1.5);
  shape(ctx, 'M86 -342 L241 -305 Q174 -291 92 -311 Q77 -296 66 -283 Q76 -311 86 -342 Z', '#ceb574', '#6b6346', 1.1);
  shape(ctx, 'M91 -332 Q145 -325 234 -306', null, '#8c784d', 0.9);
  shape(ctx, 'M92 -311 Q140 -299 190 -300', null, '#eed6a0', 1.2);
  for (let fold = 0; fold < 7; fold += 1) shape(ctx, `M${82 + fold * 2} -316 Q${97 + fold * 3} -298 ${118 + fold * 13} ${-298 - fold * 0.3}`, null, '#b09e70', 0.45);
  for (let plume = 0; plume < 5; plume += 1) shape(ctx, `M${29 + plume * 4} -350 Q${12 + plume * 5} -371 ${15 + plume * 6} ${-382 + plume * 3} Q${30 + plume * 5} -369 ${42 + plume * 4} -354`, '#f4e9ca', GOLD, 0.6);
  ellipse(ctx, 68, -342, 3, 3.6, '#ece4c6', INK, 0.8);
  ellipse(ctx, 69.1, -342, 1.4, 1.7, INK, null);
  shape(ctx, 'M-133 -241 Q-106 -253 -83 -239 C-48 -221 -14 -189 42 -173 L83 -163 Q28 -161 -12 -174 Q-98 -170 -145 -207 Q-155 -223 -133 -241 Z', '#dedcc0', '#65715a', 1.1);
  for (let feather = 0; feather < 14; feather += 1) {
    const fraction = feather / 13;
    shape(ctx, `M${-128 + fraction * 97} ${-236 + fraction * 32} Q${-96 + fraction * 82} ${-220 + fraction * 31} ${-111 + fraction * 187} ${-185 + fraction * 23}`, null, '#6a795d', 0.66);
    shape(ctx, `M${-124 + fraction * 97} ${-235 + fraction * 32} Q${-87 + fraction * 77} ${-215 + fraction * 31} ${-108 + fraction * 181} ${-181 + fraction * 21}`, null, '#e8d7a1', 0.47);
  }
  for (let fleck = 0; fleck < 31; fleck += 1) {
    const fraction = fleck / 30;
    const pointX = -128 + fraction * 118;
    const pointY = -239 + Math.sin(fraction * Math.PI) * 4 + fraction * 43;
    shape(ctx, `M${pointX - 2} ${pointY} q2 5 5 1`, null, '#9b976e', 0.6);
  }
  shape(ctx, 'M7 -292 Q13 -277 20 -271 Q33 -284 36 -300', null, '#b09a62', 1.1);
  for (let bead = 0; bead < 9; bead += 1) ellipse(ctx, 7 + bead * 3.6, -291 + Math.sin(bead / 8 * Math.PI) * 14, 1.4, 1.4, GOLD, null);
  shape(ctx, 'M-150 -197 Q-118 -184 -77 -184', null, '#b5ac7f', 0.7);
}

export function prepare() {
  const paper = xuanPaper(8601);
  garden = layer(2000, 1000, (ctx) => {
    ctx.drawImage(paper, 0, 0);
    ctx.fillStyle = 'rgba(227,209,172,0.37)';
    ctx.fillRect(0, 0, 2000, 1000);
    ctx.translate(500, 0);
    polygon(ctx, [[-450, 330], [-240, 166], [-58, 261], [100, 201], [390, 305], [698, 172], [1010, 243], [1200, 156], [1460, 253], [1460, 455], [-450, 455]], '#d0cba8', null);
    polygon(ctx, [[-450, 372], [-250, 285], [20, 324], [273, 273], [504, 346], [808, 280], [1030, 330], [1300, 240], [1460, 298], [1460, 456], [-450, 456]], '#bcc19a', null);
    polygon(ctx, [[-445, 448], [1060, 252], [1445, 420], [1445, 730], [-445, 730]], '#c7c396', '#978f6a', 1);
    for (const tree of [[-350, 434, 180], [-85, 402, 151], [355, 356, 162], [498, 334, 173], [675, 327, 153], [1225, 406, 170], [1351, 440, 194]]) cypress(ctx, ...tree, 8600 + tree[0]);
    pavilion(ctx, -211, 377, 287, 105, true);
    pavilion(ctx, 570, 313, 345, 77, false);
    pavilion(ctx, 1033, 374, 262, 157, true);
    polygon(ctx, [[-445, 488], [635, 347], [1445, 483], [1445, 513], [635, 377], [-445, 518]], '#dfccaa', '#a39167', 0.9);
    for (let joint = -420; joint < 1450; joint += 36) line(ctx, [[joint, 489 - Math.max(0, Math.min(1, (joint + 445) / 1080)) * 141], [joint + 1, 510 - Math.max(0, Math.min(1, (joint + 445) / 1080)) * 133]], '#b09e79', 0.55);
    flowerBed(ctx, [[-396, 542], [121, 470], [370, 510], [-126, 597]], 8602, 220);
    flowerBed(ctx, [[581, 430], [836, 398], [1304, 477], [1055, 523]], 8603, 160);
    flowerBed(ctx, [[-220, 669], [310, 576], [569, 622], [73, 724]], 8604, 220);
    flowerBed(ctx, [[742, 558], [1083, 496], [1410, 548], [1120, 630]], 8605, 160);
    pool(ctx, [[174, 549], [736, 450], [901, 477], [342, 581]], 8606);
    pool(ctx, [[342, 581], [455, 558], [895, 631], [769, 657]], 8607);
    polygon(ctx, [[371, 589], [445, 574], [527, 587], [452, 603]], '#dcccab', '#9c926c', 1);
    line(ctx, [[381, 585], [453, 573], [518, 582]], '#948260', 1.2);
    ellipse(ctx, 551, 511, 15, 6, '#d9d1ac', '#728f7d', 0.8);
    ellipse(ctx, 551, 507, 8, 4, '#8eb3a1', '#a8a37b', 0.7);
    shape(ctx, 'M551 505 Q540 478 543 471 M551 505 Q561 479 559 472 M551 505 L551 465', null, 'rgba(226,232,207,0.78)', 0.95);
    for (const tree of [[-289, 606, 170], [1327, 658, 178], [697, 408, 88], [290, 435, 95]]) fruitTree(ctx, ...tree, 8608 + tree[0]);
    polygon(ctx, [[-445, 732], [78, 711], [606, 704], [1044, 698], [1445, 741], [1445, ROAD_Y], [-445, ROAD_Y]], '#a2ab79', null);
    const random = seeded(8612);
    for (let tuft = 0; tuft < 420; tuft += 1) {
      const pointX = -440 + random() * 1880;
      const pointY = 724 + random() * 65;
      line(ctx, [[pointX, pointY], [pointX + 2, pointY - 4]], '#768457', 0.58);
      if (tuft % 4 === 0) flower(ctx, pointX, pointY - 5, 1.7, '#e5d8a9');
    }
    for (const guest of guests) guestBody(ctx, guest);
    ctx.fillStyle = '#d6c39b';
    ctx.fillRect(-500, ROAD_Y, 2000, 67);
    line(ctx, [[-500, ROAD_Y], [1500, ROAD_Y]], '#8d805a', 1.35);
    line(ctx, [[-500, ROAD_Y + 7], [1500, ROAD_Y + 7]], '#ede0b8', 1.2);
    line(ctx, [[-500, ROAD_Y + 62], [1500, ROAD_Y + 62]], '#978a65', 1.1);
    for (let paving = -480; paving < 1500; paving += 68) {
      line(ctx, [[paving, ROAD_Y + 10], [paving + 22, ROAD_Y + 61]], 'rgba(142,122,83,0.48)', 0.65);
      line(ctx, [[paving + 5, ROAD_Y + 34], [paving + 74, ROAD_Y + 34]], 'rgba(142,122,83,0.43)', 0.65);
    }
    for (let plant = -420; plant < 1480; plant += 41) sprig(ctx, plant, 924, 28 + random() * 18, plant % 3 ? '#a96c60' : '#e0cda5', random() - 0.5);
    border(ctx);
  });
  riderBody = layer(620, 440, (ctx) => {
    ctx.translate(270, 405);
    paintRider(ctx);
  });
  bicycle = layer(500, 270, (ctx) => {
    ctx.translate(250, 180);
    const tubes = [[[-135, 0], [-62, -115], [-20, -4], [-135, 0]], [[-62, -115], [80, -107], [-20, -4]], [[80, -107], [135, 0]], [[80, -107], [72, -146], [100, -155], [115, -147], [111, -135]], [[-62, -115], [-65, -136]]];
    for (const points of tubes) {
      line(ctx, points, INK, 4);
      line(ctx, points, GOLD, 1.45);
    }
    shape(ctx, 'M-89 -141 Q-68 -147 -42 -140 L-45 -135 -87 -135 Z', ROSE, INK, 0.9);
    ellipse(ctx, -20, -4, 23, 23, null, GOLD, 1.5);
    ellipse(ctx, -20, -4, 20, 20, null, '#667554', 0.6);
    line(ctx, [[-133, 4], [-23, 19], [-16, -27], [-130, -5]], '#6d765a', 0.75);
    for (let ornament = 0; ornament < 6; ornament += 1) flower(ctx, -48 + ornament * 20, -113 + ornament * 1.2, 1.5, '#cfb87f');
  });
}

export function renderAt(ctx, { localT }) {
  ctx.drawImage(garden, -500, 0);
  guests.forEach((guest, index) => guestGesture(ctx, guest, localT, index));
}

export function renderRider(ctx, pose, { x: riderX, y: riderY, scale = 1 }) {
  ctx.save();
  ctx.translate(riderX, riderY);
  ctx.scale(scale, scale);
  const leg = (knee, foot, color, width) => {
    line(ctx, [[pose.hip.x, pose.hip.y], [knee.x, knee.y], [foot.x, foot.y]], INK, width + 1);
    line(ctx, [[pose.hip.x, pose.hip.y], [knee.x, knee.y], [foot.x, foot.y]], color, width);
    polygon(ctx, [[foot.x - 5, foot.y], [foot.x + 17, foot.y + 4], [foot.x + 8, foot.y + 6], [foot.x - 6, foot.y + 4]], color, INK, 0.65);
  };
  leg(pose.farKnee, pose.farFoot, '#b2a77b', 2.2);
  for (const centerX of [-135, 135]) {
    ellipse(ctx, centerX, 0, 73, 73, null, INK, 2.6);
    ellipse(ctx, centerX, 0, 69, 69, null, GOLD, 1.1);
    ellipse(ctx, centerX, 0, 66.5, 66.5, null, '#7d8b67', 0.6);
    for (let spoke = 0; spoke < 24; spoke += 1) {
      const angle = pose.wheelAngle + spoke / 24 * TAU;
      line(ctx, [[centerX + Math.cos(angle) * 3, Math.sin(angle) * 3], [centerX + Math.cos(angle + 0.06) * 67, Math.sin(angle + 0.06) * 67]], spoke % 3 ? '#7d805f' : GOLD, 0.6);
    }
    ellipse(ctx, centerX, 0, 3.5, 3.5, GOLD, INK, 0.7);
  }
  ctx.drawImage(bicycle, -250, -180);
  line(ctx, [[pose.farFoot.x, pose.farFoot.y], [-20, -4], [pose.nearFoot.x, pose.nearFoot.y]], GOLD, 2);
  ctx.drawImage(riderBody, -270, -405 + pose.bob * 0.5);
  leg(pose.nearKnee, pose.nearFoot, '#c8b374', 3.3);
  for (const foot of [pose.farFoot, pose.nearFoot]) line(ctx, [[foot.x - 9, foot.y + 7], [foot.x + 18, foot.y + 7]], '#48513e', 1.8);
  ctx.restore();
}

export function renderTitle(ctx, { x: titleX }) {
  ctx.save();
  ctx.fillStyle = 'rgba(242,230,201,0.97)';
  ctx.fillRect(titleX - 16, 113, 478, 202);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 1.3;
  ctx.strokeRect(titleX - 10, 119, 466, 190);
  ctx.lineWidth = 0.55;
  ctx.strokeRect(titleX - 6, 123, 458, 182);
  text(ctx, scene.zh, titleX + 10, 186, { size: 49, color: INK, weight: 600 });
  text(ctx, 'MUGHAL MINIATURE', titleX + 13, 230, { size: 22, color: TEAL, family: SANS });
  text(ctx, '约 1600  ·  花园雅集', titleX + 13, 275, { size: 24, color: '#746c4d' });
  flower(ctx, titleX + 419, 267, 7, ROSE, 0.2);
  shape(ctx, `M${titleX + 419} 281 Q${titleX + 405} 271 ${titleX + 407} 256`, null, GOLD, 0.7);
  ctx.restore();
}
