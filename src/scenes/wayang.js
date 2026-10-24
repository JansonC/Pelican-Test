import { SCENES } from './catalog.js';
import { text, line, SANS } from '../kit/canvas.js';
import { layer, xuanPaper } from '../kit/materials.js';
import { seeded, smooth, lerp } from '../kit/math.js';
import { ROAD_Y, quantizeTime } from '../beat/timeline.js';

export const scene = SCENES[9];
export const finished = true;
export const TITLE_GLYPHS = '爪哇皮影戏灯下骑行约';

const INK = '#302315';
const GOLD = '#aa7d3d';
const TAU = Math.PI * 2;
let screen;
let puppet;
let wheel;
let bicycle;

function circle(ctx, centerX, centerY, radius, fill, edge = null, width = 1) {
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, TAU);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (edge) {
    ctx.strokeStyle = edge;
    ctx.lineWidth = width;
    ctx.stroke();
  }
}

function rivet(ctx, centerX, centerY, radius = 4) {
  circle(ctx, centerX, centerY, radius, GOLD, INK, 1);
  circle(ctx, centerX, centerY, 1.2, '#e5c78b');
}

function leaf(ctx, centerX, centerY, angle, size, open = false) {
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(angle);
  ctx.scale(size, size);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-13, -16, -8, -36, 0, -46);
  ctx.bezierCurveTo(9, -31, 14, -12, 0, 0);
  ctx.fillStyle = INK;
  ctx.fill();
  if (open) {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.ellipse(0, -24, 3.1, 10.5, 0, 0, TAU);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.restore();
}

function laceTree(ctx, centerX, flip) {
  ctx.save();
  ctx.translate(centerX, ROAD_Y);
  ctx.scale(flip, 1);
  const trunk = new Path2D('M-37 0 C-18 -104 -30 -158 -3 -239 C11 -290 -18 -364 -7 -413 C7 -377 10 -342 30 -309 C50 -273 34 -224 24 -180 C9 -114 15 -54 35 0 Z');
  ctx.fillStyle = INK;
  ctx.fill(trunk);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 0.8;
  ctx.stroke(trunk);
  const branches = [
    [[4, -139], [-48, -173], [-87, -234], [-123, -282]],
    [[12, -216], [66, -239], [98, -302], [129, -349]],
    [[6, -289], [-35, -317], [-64, -363], [-81, -411]],
    [[0, -355], [46, -386], [61, -431], [73, -481]],
  ];
  branches.forEach((points) => {
    ctx.beginPath();
    ctx.moveTo(...points[0]);
    ctx.bezierCurveTo(...points[1], ...points[2], ...points[3]);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.stroke();
  });
  for (let index = 0; index < 19; index += 1) {
    const side = index % 2 ? 1 : -1;
    const reach = 48 + index % 4 * 19;
    const height = -129 - index * 18;
    const angle = side * (0.55 + index % 3 * 0.17);
    line(ctx, [[side * 12, height + 12], [side * reach * 0.6, height - 5], [side * reach, height - 25]], INK, 3.2);
    leaf(ctx, side * reach, height - 22, angle, 0.9 + index % 3 * 0.13, true);
    leaf(ctx, side * reach * 0.63, height - 4, -angle * 0.8, 0.6, true);
  }
  const fan = new Path2D('M-150 -70 Q-199 -197 -143 -343 Q-112 -451 -5 -580 Q117 -450 149 -331 Q187 -194 151 -70 Q60 -102 0 -75 Q-60 -100 -150 -70 Z');
  ctx.strokeStyle = INK;
  ctx.lineWidth = 9;
  ctx.stroke(fan);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 1;
  ctx.stroke(fan);
  for (let index = 0; index < 25; index += 1) {
    const angle = Math.PI * 1.03 + index / 24 * Math.PI * 0.94;
    const center = { x: Math.cos(angle) * 149, y: -253 + Math.sin(angle) * 280 };
    circle(ctx, center.x, center.y, 3.2, GOLD);
  }
  ctx.restore();
}

function arch(ctx) {
  ctx.save();
  const curve = new Path2D('M-415 795 L-415 548 C-417 252 -33 78 500 76 C1033 78 1417 252 1415 548 L1415 795');
  ctx.strokeStyle = INK;
  ctx.lineWidth = 17;
  ctx.stroke(curve);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.stroke(curve);
  for (let index = 0; index < 43; index += 1) {
    const angle = Math.PI + index / 42 * Math.PI;
    const centerX = 500 + Math.cos(angle) * 861;
    const centerY = 537 + Math.sin(angle) * 426;
    leaf(ctx, centerX, centerY, angle + Math.PI * 0.5, 0.61, true);
  }
  for (const centerX of [-415, 1415]) {
    for (let index = 0; index < 9; index += 1) {
      circle(ctx, centerX, 575 + index * 23, 4, GOLD);
    }
  }
  ctx.restore();
}

function paintPuppet(ctx) {
  const leather = new Path2D('M-167 -195 L-195 -222 L-171 -220 L-187 -239 L-147 -225 Q-126 -260 -83 -262 Q-45 -261 -17 -238 L8 -251 Q21 -267 14 -296 Q2 -332 34 -361 L18 -375 L49 -371 L54 -389 L68 -371 L89 -381 L87 -359 Q110 -345 98 -325 L87 -313 Q67 -298 72 -269 Q74 -239 49 -215 Q26 -189 -13 -177 Q-87 -154 -140 -180 Z');
  ctx.fillStyle = INK;
  ctx.fill(leather);
  ctx.strokeStyle = '#b38a4d';
  ctx.lineWidth = 1.5;
  ctx.stroke(leather);
  const beak = new Path2D('M94 -346 C136 -339 199 -325 251 -302 Q227 -286 211 -295 Q155 -290 88 -317 L81 -306 Q87 -326 94 -346 Z');
  ctx.fillStyle = INK;
  ctx.fill(beak);
  ctx.stroke(beak);
  const wing = new Path2D('M-137 -224 Q-90 -247 -51 -217 Q-12 -192 37 -175 L110 -156 Q120 -154 119 -148 L112 -144 L125 -136 L118 -132 L103 -140 L110 -125 L102 -126 L89 -143 L96 -120 L89 -123 L76 -147 Q8 -154 -37 -169 Q-107 -165 -137 -199 Z');
  ctx.fill(wing);
  ctx.stroke(wing);
  line(ctx, [[98, -331], [155, -319], [240, -302]], GOLD, 0.9);
  const holes = new Path2D();
  for (let index = 0; index < 13; index += 1) {
    const centerX = -131 + index * 10.2;
    const centerY = -208 + Math.sin(index / 12 * Math.PI) * 13;
    holes.moveTo(centerX + 3.2, centerY);
    holes.ellipse(centerX, centerY, 3.2, 5.7, -0.3, 0, TAU);
  }
  for (let index = 0; index < 10; index += 1) {
    const centerX = -133 + index * 12.9;
    const centerY = -232 + Math.sin(index / 9 * Math.PI) * 3;
    holes.moveTo(centerX + 1.5, centerY);
    holes.arc(centerX, centerY, 1.5, 0, TAU);
  }
  for (let index = 0; index < 8; index += 1) {
    const centerX = 38 + Math.sin(index * 0.3) * 6;
    const centerY = -320 + index * 9.5;
    holes.moveTo(centerX + 2.2, centerY);
    holes.ellipse(centerX, centerY, 2.2, 3.4, 0, 0, TAU);
  }
  for (let index = 0; index < 18; index += 1) {
    const angle = index / 18 * TAU;
    const centerX = -81 + Math.cos(angle) * 31;
    const centerY = -217 + Math.sin(angle) * 22;
    holes.moveTo(centerX + 1.4, centerY);
    holes.arc(centerX, centerY, 1.4, 0, TAU);
  }
  holes.moveTo(-81, -233);
  holes.lineTo(-69, -217);
  holes.lineTo(-81, -201);
  holes.lineTo(-93, -217);
  holes.closePath();
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fill(holes);
  circle(ctx, 77, -341, 6, '#000');
  ctx.restore();
  circle(ctx, 77.5, -341, 2.5, INK);
  rivet(ctx, -118, -219, 4);
  rivet(ctx, 41, -272, 3.2);
  rivet(ctx, 105, -151, 3.4);
}

function paintWheel(ctx) {
  const ring = new Path2D();
  ring.arc(0, 0, 73, 0, TAU);
  ring.moveTo(66, 0);
  ring.arc(0, 0, 66, 0, TAU, true);
  ctx.fillStyle = INK;
  ctx.fill(ring);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.arc(0, 0, 70, 0, TAU);
  ctx.stroke();
  for (let index = 0; index < 10; index += 1) {
    const angle = index / 10 * TAU;
    line(ctx, [[0, 0], [Math.cos(angle) * 67, Math.sin(angle) * 67]], INK, 2.3);
    circle(ctx, Math.cos(angle + 0.19) * 70, Math.sin(angle + 0.19) * 70, 1.4, '#d8b878');
  }
  rivet(ctx, 0, 0, 6);
}

export function rodsAt(localT) {
  const cross = smooth((localT - 2) / 0.65) * (1 - smooth((localT - 3.1) / 0.9));
  return { cross, left: lerp(216, -221, cross), right: lerp(-206, 227, cross) };
}

export function prepare() {
  const paper = xuanPaper(10000);
  screen = layer(2000, 1000, (ctx) => {
    const glow = ctx.createRadialGradient(1000, 478, 30, 1000, 478, 1170);
    glow.addColorStop(0, '#f9e7b4');
    glow.addColorStop(0.43, '#e5c98b');
    glow.addColorStop(1, '#a7814a');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 2000, 1000);
    ctx.globalAlpha = 0.15;
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(paper, 0, 0, 2000, 1000);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    const fibers = seeded(10001);
    for (let index = 0; index < 470; index += 1) {
      const height = fibers() * 1000;
      line(ctx, [[0, height], [2000, height + fibers() * 0.6]], 'rgba(71,46,18,0.025)', 0.4);
    }
    ctx.translate(500, 0);
    const decor = layer(2000, 1000, (ornament) => {
      ornament.translate(500, 0);
      arch(ornament);
      laceTree(ornament, -208, 1);
      laceTree(ornament, 1208, -1);
    }, 1.5);
    ctx.drawImage(decor, -500, 0, 2000, 1000);
    line(ctx, [[-500, ROAD_Y], [1500, ROAD_Y]], INK, 3.5);
    line(ctx, [[-500, ROAD_Y + 7], [1500, ROAD_Y + 7]], '#916d39', 1);
    for (let index = 0; index < 68; index += 1) {
      const centerX = -500 + index * 30;
      line(ctx, [[centerX, ROAD_Y + 8], [centerX + 7, ROAD_Y + 13], [centerX + 15, ROAD_Y + 8]], '#9d793f', 1.2);
    }
  });
  puppet = layer(640, 510, (ctx) => {
    ctx.translate(270, 420);
    paintPuppet(ctx);
  }, 2);
  wheel = layer(168, 168, (ctx) => {
    ctx.translate(84, 84);
    paintWheel(ctx);
  }, 2);
  bicycle = layer(620, 520, (ctx) => {
    ctx.translate(260, 420);
    for (const points of [[[-135, 0], [-60, -115], [-20, -4], [-135, 0]], [[-60, -115], [80, -105], [-20, -4]], [[135, 0], [80, -105], [72, -145], [102, -155], [118, -142]], [[-60, -115], [-64, -137]]]) {
      line(ctx, points, INK, 6);
      line(ctx, points, GOLD, 0.8);
    }
    line(ctx, [[-89, -140], [-42, -140]], INK, 9);
    for (let index = 0; index < 5; index += 1) rivet(ctx, -82 + index * 8, -140, 1.3);
    line(ctx, [[-125, 4], [-24, 18], [-15, -25], [-126, -5]], INK, 1.7);
    rivet(ctx, -20, -4, 8);
  }, 2);
}

export function renderAt(ctx) {
  ctx.drawImage(screen, -500, 0, 2000, 1000);
}

export function renderRider(ctx, pose, { x: positionX, y: positionY, scale, t: time }) {
  const characterT = quantizeTime(time, scene.updateHz);
  const localTime = characterT - scene.start;
  const rods = rodsAt(localTime);
  const bob = pose.bob * 0.7;
  ctx.save();
  ctx.translate(positionX, positionY);
  ctx.scale(scale, scale);
  ctx.save();
  ctx.globalAlpha = 0.6;
  line(ctx, [[27, -244 + bob], [22, 242]], '#584327', 3.2);
  line(ctx, [[105, -151 + bob], [rods.left, 234]], '#584327', 2.4);
  line(ctx, [[-118, -219 + bob], [rods.right, 234]], '#584327', 2.4);
  circle(ctx, rods.left, 234, 4, '#584327');
  circle(ctx, rods.right, 234, 4, '#584327');
  ctx.restore();
  const limb = (knee, foot, width, shade) => {
    line(ctx, [[pose.hip.x, pose.hip.y], [knee.x, knee.y], [foot.x, foot.y]], shade, width);
    line(ctx, [[foot.x - 8, foot.y + 3], [foot.x + 17, foot.y + 3]], shade, width * 0.72);
    rivet(ctx, knee.x, knee.y, 3.4);
    rivet(ctx, foot.x, foot.y, 2.6);
  };
  limb(pose.farKnee, pose.farFoot, 7, '#6a4c29');
  for (const center of [-135, 135]) {
    ctx.save();
    ctx.translate(center, 0);
    ctx.rotate(pose.wheelAngle);
    ctx.drawImage(wheel, -84, -84, 168, 168);
    ctx.restore();
  }
  ctx.drawImage(bicycle, -260, -420, 620, 520);
  line(ctx, [[pose.farFoot.x, pose.farFoot.y], [-20, -4], [pose.nearFoot.x, pose.nearFoot.y]], INK, 3.8);
  ctx.drawImage(puppet, -270, -420 + bob, 640, 510);
  limb(pose.nearKnee, pose.nearFoot, 7, INK);
  rivet(ctx, pose.hip.x, pose.hip.y, 4.5);
  ctx.restore();
}

export function renderTitle(ctx, { x: titleX }) {
  ctx.save();
  ctx.fillStyle = 'rgba(247,225,174,0.91)';
  ctx.fillRect(titleX - 9, 110, 557, 163);
  ctx.strokeStyle = '#8a6235';
  ctx.lineWidth = 1;
  ctx.strokeRect(titleX - 3, 116, 545, 151);
  text(ctx, '爪哇皮影戏', titleX + 13, 173, { size: 46, color: INK, weight: 600 });
  text(ctx, 'WAYANG KULIT', titleX + 17, 211, { size: 23, color: '#624425', family: SANS });
  text(ctx, '约 1800', titleX + 18, 248, { size: 24, color: '#624425' });
  ctx.restore();
}
