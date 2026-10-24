import { SCENES } from './catalog.js';
import { ROAD_Y, pedalPhase } from '../beat/timeline.js';
import { line, text, SANS } from '../kit/canvas.js';
import { lerp, seeded, smooth } from '../kit/math.js';
import { layer, noise, pigmentPainter } from '../kit/materials.js';

export const scene = SCENES[11];
export const finished = true;
export const TITLE_GLYPHS = '星月夜村落星轨旋涡约1889';

const ULTRAMARINE = '#253c67';
const COBALT = '#416b91';
const CREAM = '#e0c66c';
const PALE_CREAM = '#f0df99';
const DARK_GREEN = '#3e5148';
const DEEP_GREEN = '#293d3b';
const TAU = Math.PI * 2;
let daylight;
let night;
let paper;
let paintRider;
let stars = [];

function polygon(ctx, points, fill, stroke = null, width = 1) {
  ctx.beginPath();
  points.forEach(([pointX, pointY], index) => index ? ctx.lineTo(pointX, pointY) : ctx.moveTo(pointX, pointY));
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
}

function ellipse(ctx, centerX, centerY, radiusX, radiusY, fill, stroke = null, width = 1) {
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, TAU);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
}

function stroke(ctx, points, color, width, alpha = 1) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  points.forEach(([pointX, pointY], index) => index ? ctx.lineTo(pointX, pointY) : ctx.moveTo(pointX, pointY));
  ctx.stroke();
  ctx.restore();
}

function dash(ctx, centerX, centerY, angle, length, color, width, alpha = 1) {
  const half = length / 2;
  const dx = Math.cos(angle) * half;
  const dy = Math.sin(angle) * half;
  stroke(ctx, [[centerX - dx, centerY - dy], [centerX + dx, centerY + dy]], color, width, alpha);
}

function gradientSky(ctx, top, middle, bottom) {
  const gradient = ctx.createLinearGradient(0, 0, 0, 1000);
  gradient.addColorStop(0, top);
  gradient.addColorStop(0.5, middle);
  gradient.addColorStop(1, bottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(-500, 0, 2000, 1000);
}

function texture(ctx, seed, count, colors) {
  const random = seeded(seed);
  for (let index = 0; index < count; index += 1) {
    const x = random() * 2000 - 500;
    const y = random() * 770;
    ctx.fillStyle = colors[index % colors.length];
    ctx.fillRect(x, y, 0.3 + random() * 1.5, 0.3 + random() * 1.3);
  }
}

function spiral(ctx, centerX, centerY, radiusX, radiusY, turns, phase, color, width, alpha = 1) {
  const points = [];
  for (let index = 0; index <= 78; index += 1) {
    const amount = index / 78;
    const angle = phase + amount * turns * TAU;
    const radius = radiusX * (0.06 + amount * 0.94);
    points.push([centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius * radiusY / radiusX]);
  }
  stroke(ctx, points, color, width, alpha);
  for (let index = 10; index < 78; index += 13) {
    const amount = index / 78;
    const angle = phase + amount * turns * TAU;
    const radius = radiusX * (0.06 + amount * 0.94);
    dash(ctx, centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius * radiusY / radiusX, angle + Math.PI / 2, width * 2.1, color, width * 1.1, alpha * 0.72);
  }
}

function hill(ctx, fill, strokeColor) {
  polygon(ctx, [[-500, 817], [-300, 702], [-105, 743], [108, 676], [331, 744], [564, 680], [821, 726], [1042, 678], [1500, 790], [1500, 1000], [-500, 1000]], fill, strokeColor, 3);
  const random = seeded(12055);
  for (let index = 0; index < 260; index += 1) {
    dash(ctx, -500 + random() * 2000, 585 + random() * 225, -0.14 + (random() - 0.5) * 0.5, 7 + random() * 15, random() > 0.5 ? COBALT : DEEP_GREEN, 1.7 + random() * 2.2, 0.25 + random() * 0.29);
  }
}

function tower(ctx, centerX, baseY, scale = 1) {
  ctx.save();
  ctx.translate(centerX, baseY);
  ctx.scale(scale, scale);
  polygon(ctx, [[-54, 0], [-45, -302], [12, -343], [49, -290], [57, 0]], DARK_GREEN, ULTRAMARINE, 4);
  polygon(ctx, [[-45, -302], [12, -343], [49, -290], [28, -268], [-22, -273]], COBALT, ULTRAMARINE, 3);
  for (let level = 0; level < 5; level += 1) {
    const windowY = -247 + level * 44;
    polygon(ctx, [[-26, windowY], [-6, windowY - 12], [14, windowY - 4], [14, windowY + 18], [-25, windowY + 12]], CREAM, ULTRAMARINE, 1.8);
    dash(ctx, -6, windowY + 3, 0.9, 15, PALE_CREAM, 2.2, 0.6);
  }
  stroke(ctx, [[-62, -3], [-56, -120], [-48, -240]], COBALT, 8, 0.75);
  stroke(ctx, [[50, -8], [43, -120], [39, -267]], ULTRAMARINE, 7, 0.8);
  polygon(ctx, [[-67, -336], [11, -387], [69, -330], [22, -318]], CREAM, ULTRAMARINE, 3);
  ctx.restore();
}

function house(ctx, centerX, baseY, width, height, variant) {
  ctx.save();
  ctx.translate(centerX, baseY);
  const wall = variant % 2 ? DARK_GREEN : '#334b4e';
  const roof = variant % 2 ? ULTRAMARINE : DEEP_GREEN;
  polygon(ctx, [[-width / 2, 0], [-width * 0.46, -height], [width * 0.43, -height], [width / 2, 0]], wall, ULTRAMARINE, 2.4);
  polygon(ctx, [[-width * 0.58, -height + 16], [0, -height - 47 - variant * 8], [width * 0.56, -height + 15]], roof, COBALT, 4);
  for (let index = 0; index < 3; index += 1) {
    const x = -width * 0.28 + index * width * 0.27;
    polygon(ctx, [[x - 12, -height * 0.56], [x + 10, -height * 0.62], [x + 10, -height * 0.35], [x - 12, -height * 0.3]], variant === 2 && index === 1 ? CREAM : COBALT, ULTRAMARINE, 1.2);
  }
  stroke(ctx, [[-width * 0.44, -height * 0.1], [0, -height * 0.04], [width * 0.4, -height * 0.11]], CREAM, 2.5, 0.6);
  ctx.restore();
}

function tree(ctx, centerX, baseY, height, seed) {
  const random = seeded(seed);
  ctx.save();
  ctx.translate(centerX, baseY);
  stroke(ctx, [[0, 0], [random() * 11 - 5, -height * 0.5], [random() * 12 - 6, -height]], DEEP_GREEN, Math.max(4, height * 0.07));
  for (let index = 0; index < 9; index += 1) {
    const amount = index / 8;
    const branchY = -height * (0.28 + amount * 0.57);
    const reach = height * (0.2 - amount * 0.08) * (index % 2 ? 1 : -1);
    stroke(ctx, [[0, branchY], [reach * 0.5, branchY - height * 0.09], [reach, branchY - height * 0.1]], DARK_GREEN, 2.5 + random() * 3, 0.86);
    dash(ctx, reach * 0.75, branchY - height * 0.1, -0.2 + random() * 0.4, height * 0.16, index % 2 ? COBALT : ULTRAMARINE, 5 + random() * 3, 0.8);
  }
  ctx.restore();
}

export function starOrbitAt(localT) {
  const rotation = pedalPhase(scene.start + Math.max(0, localT)) - pedalPhase(scene.start + 2);
  const spin = smooth((localT - 2) / 2);
  const gather = smooth((localT - 4) / 2);
  return rotation * spin + gather * 0.72;
}

function drawStars(ctx, time, localT) {
  const orbit = starOrbitAt(localT);
  const gather = smooth((localT - 4) / 2);
  for (const star of stars) {
    const angle = star.angle + orbit * star.rate + pedalPhase(time) * 0.015;
    const orbitX = star.centerX + Math.cos(angle) * star.radiusX;
    const orbitY = star.centerY + Math.sin(angle) * star.radiusY;
    const pointX = lerp(orbitX, 1470, gather * star.gather);
    const pointY = lerp(orbitY, 385, gather * star.gather);
    dash(ctx, pointX, pointY, angle + Math.PI / 2 + gather * 0.45, star.length * (1 + gather * 1.8), star.color, star.width * (1 + gather * 0.65), star.alpha);
  }
}

export function prepare() {
  paper = layer(2000, 1000, (ctx) => {
    ctx.fillStyle = '#87918b';
    ctx.fillRect(0, 0, 2000, 1000);
    texture(ctx, 12002, 21000, ['rgba(238,222,164,0.06)', 'rgba(19,33,51,0.09)', 'rgba(238,222,164,0.04)', 'rgba(30,48,57,0.06)']);
  });
  daylight = layer(2000, 1000, (ctx) => {
    gradientSky(ctx, '#8fa6ad', '#b7b98f', '#77826c');
    texture(ctx, 12011, 8500, ['rgba(241,226,162,0.13)', 'rgba(46,67,74,0.1)', 'rgba(241,226,162,0.08)', 'rgba(46,67,74,0.06)']);
    ctx.translate(500, 0);
    hill(ctx, '#566b64', '#405b5f');
    tower(ctx, 20, 770, 0.84);
    house(ctx, 650, 795, 152, 150, 1);
    house(ctx, 844, 794, 124, 123, 2);
    house(ctx, 1006, 797, 178, 168, 0);
    tree(ctx, 532, 790, 176, 12081);
    tree(ctx, 1176, 790, 115, 12082);
    line(ctx, [[-500, ROAD_Y], [1500, ROAD_Y]], '#314f55', 8);
    line(ctx, [[-500, ROAD_Y + 12], [1500, ROAD_Y + 12]], '#b2a675', 2);
  });
  night = layer(2000, 1000, (ctx) => {
    gradientSky(ctx, '#172c55', ULTRAMARINE, '#1d344a');
    texture(ctx, 12071, 17000, ['rgba(131,157,184,0.1)', 'rgba(16,34,65,0.12)', 'rgba(131,157,184,0.08)', 'rgba(16,34,65,0.1)']);
    ctx.translate(500, 0);
    spiral(ctx, 185, 230, 260, 120, 2.65, 0.35, CREAM, 9, 0.9);
    spiral(ctx, 625, 194, 310, 150, 2.4, 1.8, PALE_CREAM, 11, 0.86);
    spiral(ctx, 1047, 285, 246, 112, 2.2, 3.9, CREAM, 8, 0.88);
    spiral(ctx, 1244, 148, 154, 82, 2.05, 2.6, COBALT, 6, 0.82);
    hill(ctx, DEEP_GREEN, ULTRAMARINE);
    tower(ctx, 20, 770, 0.84);
    house(ctx, 650, 795, 152, 150, 1);
    house(ctx, 844, 794, 124, 123, 2);
    house(ctx, 1006, 797, 178, 168, 0);
    tree(ctx, 532, 790, 176, 12081);
    tree(ctx, 1176, 790, 115, 12082);
    line(ctx, [[-500, ROAD_Y], [1500, ROAD_Y]], ULTRAMARINE, 8);
    line(ctx, [[-500, ROAD_Y + 12], [1500, ROAD_Y + 12]], COBALT, 2);
  });
  const random = seeded(12090);
  const colors = [CREAM, PALE_CREAM, COBALT, CREAM];
  stars = Array.from({ length: 62 }, (_, index) => ({
    centerX: -270 + random() * 1400,
    centerY: 90 + random() * 355,
    radiusX: 22 + random() * 105,
    radiusY: 13 + random() * 58,
    angle: random() * TAU,
    rate: 0.62 + random() * 0.68,
    gather: 0.55 + random() * 0.45,
    length: 8 + random() * 13,
    width: 2.4 + random() * 3.8,
    alpha: 0.54 + random() * 0.4,
    color: colors[index % colors.length],
  }));
  paintRider = pigmentPainter(650, 520, 12127);
}

export function renderAt(ctx, { t, localT }) {
  ctx.drawImage(daylight, -500, 0, 2000, 1000);
  const nightAmount = smooth(localT / 2);
  ctx.save();
  ctx.globalAlpha = nightAmount;
  ctx.drawImage(night, -500, 0, 2000, 1000);
  ctx.restore();
  ctx.save();
  ctx.translate(500, 0);
  ctx.globalAlpha = 0.2 + nightAmount * 0.8;
  drawStars(ctx, t, localT);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.drawImage(paper, -500, 0, 2000, 1000);
  ctx.restore();
}

export function renderRider(ctx, pose, { x, y, scale = 1 }) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  paintRider(ctx, (paint) => {
    paint.lineCap = 'round';
    paint.lineJoin = 'round';
    const limb = (knee, foot, color, width = 6) => {
      line(paint, [[pose.hip.x, pose.hip.y], [knee.x, knee.y], [foot.x, foot.y]], '#182b42', width + 2);
      line(paint, [[pose.hip.x, pose.hip.y], [knee.x, knee.y], [foot.x, foot.y]], color, width);
      ellipse(paint, knee.x, knee.y, 5, 5, CREAM, ULTRAMARINE, 1.2);
    };
    limb(pose.farKnee, pose.farFoot, COBALT, 5.4);
    for (const centerX of [-135, 135]) {
      ellipse(paint, centerX, 0, 73, 73, null, CREAM, 7);
      ellipse(paint, centerX, 0, 69, 69, null, COBALT, 2.3);
      for (let spoke = 0; spoke < 10; spoke += 1) {
        const angle = pose.wheelAngle + spoke * TAU / 10;
        line(paint, [[centerX, 0], [centerX + Math.cos(angle) * 66, Math.sin(angle) * 66]], PALE_CREAM, 1.7);
      }
      ellipse(paint, centerX, 0, 6, 6, CREAM, ULTRAMARINE, 2);
    }
    line(paint, [[-135, 0], [-60, -115], [-20, -4], [-135, 0]], COBALT, 7);
    line(paint, [[-60, -115], [80, -105], [-20, -4]], CREAM, 6);
    line(paint, [[80, -105], [135, 0]], COBALT, 7);
    line(paint, [[80, -105], [72, -145], [102, -153], [116, -143]], CREAM, 5);
    line(paint, [[-60, -115], [-64, -138], [-90, -138], [-41, -138]], ULTRAMARINE, 7);
    line(paint, [[pose.farFoot.x, pose.farFoot.y], [-20, -4], [pose.nearFoot.x, pose.nearFoot.y]], CREAM, 4);
    paint.save();
    paint.translate(0, pose.bob * 0.65);
    polygon(paint, [[-160, -195], [-177, -220], [-148, -217], [-121, -248], [-78, -261], [-36, -251], [-7, -232], [7, -252], [7, -294], [21, -334], [48, -352], [79, -343], [94, -322], [78, -303], [62, -293], [65, -259], [41, -218], [5, -184], [-53, -169], [-119, -174]], PALE_CREAM, ULTRAMARINE, 3.4);
    polygon(paint, [[-141, -231], [-104, -245], [-53, -226], [6, -194], [106, -148], [62, -154], [7, -169], [-53, -188], [-111, -190]], COBALT, ULTRAMARINE, 2.3);
    for (let feather = 0; feather < 7; feather += 1) dash(paint, -101 + feather * 22, -225 + feather * 8, 0.82, 31, feather % 2 ? PALE_CREAM : CREAM, 5.5, 0.95);
    polygon(paint, [[86, -335], [241, -302], [211, -294], [150, -288], [102, -295], [82, -308], [64, -286], [66, -305]], CREAM, ULTRAMARINE, 3.2);
    stroke(paint, [[94, -319], [155, -308], [226, -301]], PALE_CREAM, 2, 0.9);
    ellipse(paint, 68, -333, 5, 5, ULTRAMARINE, null);
    dash(paint, 37, -349, 0.3, 54, COBALT, 5, 0.85);
    paint.restore();
    limb(pose.nearKnee, pose.nearFoot, CREAM, 6.5);
    line(paint, [[pose.nearFoot.x - 8, pose.nearFoot.y + 6], [pose.nearFoot.x + 18, pose.nearFoot.y + 6]], ULTRAMARINE, 4);
  });
  ctx.restore();
}

export function renderTitle(ctx, { x }) {
  ctx.save();
  ctx.fillStyle = 'rgba(31,53,87,0.94)';
  ctx.fillRect(x - 22, 42, 486, 253);
  ctx.strokeStyle = CREAM;
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 13, 51, 468, 235);
  text(ctx, '12   /   NIGHT HILLS', x + 10, 79, { size: 16, color: PALE_CREAM, family: SANS, weight: 600 });
  text(ctx, scene.zh, x + 10, 151, { size: 57, color: PALE_CREAM, weight: 600 });
  text(ctx, 'STARRY NIGHT', x + 13, 193, { size: 24, color: CREAM, family: SANS });
  text(ctx, scene.era, x + 13, 235, { size: 25, color: CREAM });
  text(ctx, '丘陵村落 · 旋涡星群', x + 13, 270, { size: 19, color: '#b8d1d3' });
  ctx.restore();
}
