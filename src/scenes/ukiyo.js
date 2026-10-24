import { SCENES } from './catalog.js';
import { text, line, SANS } from '../kit/canvas.js';
import { seeded, smooth, lerp } from '../kit/math.js';
import { layer, xuanPaper } from '../kit/materials.js';
import { ROAD_Y } from '../beat/timeline.js';

export const scene = SCENES[10];
export const finished = true;
export const TITLE_GLYPHS = '浮世绘海岸驿道木版套色行约';

const PAPER = '#e6d9b8';
const BLUE = '#315b6c';
const GREEN = '#7d9986';
const RED = '#b36c4e';
const BLACK = '#242d30';
const NIGHT = '#294857';
const TAU = Math.PI * 2;
let landscape;

function polygon(ctx, points, fill, stroke = null, width = 1) {
  ctx.beginPath();
  points.forEach(([pointX, pointY], index) => index ? ctx.lineTo(pointX, pointY) : ctx.moveTo(pointX, pointY));
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.stroke();
  }
}

function woodLine(ctx, points, color, width = 2, offsetX = 0, offsetY = 0) {
  line(ctx, points.map(([pointX, pointY]) => [pointX + offsetX, pointY + offsetY]), color, width);
}

function registrationShape(ctx, points, fill, edge = BLACK, width = 1) {
  polygon(ctx, points.map(([pointX, pointY]) => [pointX - 2, pointY + 1]), fill);
  polygon(ctx, points.map(([pointX, pointY]) => [pointX + 2, pointY - 1]), fill);
  polygon(ctx, points, fill, edge, width);
}

function roof(ctx, centerX, baseY, width, height, color = BLUE) {
  registrationShape(ctx, [[centerX - width / 2, baseY], [centerX - width * 0.37, baseY - height], [centerX + width * 0.34, baseY - height * 0.92], [centerX + width / 2, baseY + 2]], color, BLACK, 2.7);
  woodLine(ctx, [[centerX - width * 0.43, baseY - height * 0.23], [centerX + width * 0.42, baseY - height * 0.19]], RED, 1, 2, -1);
  woodLine(ctx, [[centerX - width * 0.42, baseY - height * 0.45], [centerX + width * 0.38, baseY - height * 0.42]], GREEN, 0.9, -2, 1);
}

function house(ctx, centerX, baseY, width, height, variant) {
  const wallColor = variant % 2 ? '#d6c7a4' : '#cfb991';
  registrationShape(ctx, [[centerX - width * 0.43, baseY], [centerX - width * 0.43, baseY - height * 0.64], [centerX + width * 0.41, baseY - height * 0.64], [centerX + width * 0.43, baseY]], wallColor, BLACK, 2.2);
  roof(ctx, centerX, baseY - height * 0.56, width * 1.16, height * 0.42, variant % 2 ? NIGHT : BLUE);
  ctx.fillStyle = variant % 2 ? RED : GREEN;
  ctx.fillRect(centerX - width * 0.12, baseY - height * 0.41, width * 0.24, height * 0.41);
  ctx.fillStyle = '#e8d8ad';
  for (let windowIndex = 0; windowIndex < 3; windowIndex += 1) ctx.fillRect(centerX - width * 0.33 + windowIndex * width * 0.22, baseY - height * 0.51, width * 0.11, height * 0.12);
  woodLine(ctx, [[centerX - width * 0.41, baseY - height * 0.11], [centerX + width * 0.4, baseY - height * 0.1]], RED, 1.2, 1, 0);
}

function pine(ctx, baseX, baseY, height, lean, variant) {
  const trunkTop = [baseX + lean, baseY - height];
  woodLine(ctx, [[baseX, baseY], [baseX + lean * 0.5, baseY - height * 0.56], trunkTop], BLACK, 4.2, 1, 0);
  woodLine(ctx, [[baseX + 2, baseY], [baseX + lean * 0.5, baseY - height * 0.56], trunkTop], RED, 1.2, -2, 1);
  const random = seeded(variant + 440);
  for (let branchIndex = 0; branchIndex < 8; branchIndex += 1) {
    const fraction = 0.23 + branchIndex * 0.085;
    const branchX = lerp(baseX, trunkTop[0], fraction);
    const branchY = lerp(baseY, trunkTop[1], fraction);
    const side = branchIndex % 2 ? 1 : -1;
    const reach = height * (0.12 + random() * 0.11) * side;
    const slant = -height * (0.04 + random() * 0.06);
    woodLine(ctx, [[branchX, branchY], [branchX + reach, branchY + slant]], GREEN, 4.5, 2, -1);
    woodLine(ctx, [[branchX, branchY], [branchX + reach, branchY + slant]], BLACK, 2.2);
    for (let needleIndex = 0; needleIndex < 4; needleIndex += 1) {
      const needleX = branchX + reach * (0.18 + needleIndex * 0.2);
      const needleY = branchY + slant * (0.18 + needleIndex * 0.2);
      woodLine(ctx, [[needleX, needleY], [needleX + side * 16, needleY - 12]], BLUE, 1.4, -1, 0);
    }
  }
}

function cloud(ctx, centerX, centerY, width, color) {
  const cloudPoints = [[centerX - width * 0.5, centerY], [centerX - width * 0.33, centerY - 13], [centerX - width * 0.14, centerY - 8], [centerX + width * 0.05, centerY - 22], [centerX + width * 0.25, centerY - 9], [centerX + width * 0.5, centerY], [centerX + width * 0.38, centerY + 10], [centerX - width * 0.42, centerY + 10]];
  woodLine(ctx, cloudPoints, color, 4, 2, -1);
  woodLine(ctx, cloudPoints, BLACK, 1.2);
}

function boat(ctx, centerX, centerY, scale, sailColor) {
  registrationShape(ctx, [[centerX - 60 * scale, centerY], [centerX + 63 * scale, centerY], [centerX + 33 * scale, centerY + 21 * scale], [centerX - 37 * scale, centerY + 21 * scale]], NIGHT, BLACK, 1.4);
  woodLine(ctx, [[centerX, centerY], [centerX, centerY - 128 * scale]], BLACK, 2.3, 2, 0);
  registrationShape(ctx, [[centerX, centerY - 124 * scale], [centerX + 60 * scale, centerY - 59 * scale], [centerX + 2 * scale, centerY - 55 * scale]], sailColor, BLACK, 1.2);
  woodLine(ctx, [[centerX, centerY - 119 * scale], [centerX + 57 * scale, centerY - 59 * scale]], RED, 1, -2, 1);
}

function wave(ctx, startX, startY, length, amplitude, index) {
  const points = [];
  for (let pointIndex = 0; pointIndex <= 18; pointIndex += 1) {
    const fraction = pointIndex / 18;
    points.push([startX + fraction * length, startY + Math.sin(fraction * Math.PI * 2 + index) * amplitude]);
  }
  woodLine(ctx, points, BLUE, 1.25, 2, -1);
  woodLine(ctx, points, BLACK, 0.7);
}

function paintLandscape() {
  const paper = xuanPaper(11011);
  return layer(2000, 1000, (ctx) => {
    ctx.drawImage(paper, 0, 0, 2000, 1000);
    const sky = ctx.createLinearGradient(0, 0, 0, 560);
    sky.addColorStop(0, '#eee2c4');
    sky.addColorStop(0.66, '#e4d6b4');
    sky.addColorStop(1, '#c7c9ae');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 2000, 595);
    ctx.fillStyle = '#769895';
    ctx.fillRect(0, 505, 2000, 297);
    ctx.fillStyle = '#8ca6a0';
    ctx.fillRect(0, 505, 2000, 34);
    const random = seeded(11012);
    for (let index = 0; index < 45; index += 1) wave(ctx, random() * 2000, 545 + random() * 237, 45 + random() * 115, 2 + random() * 7, index);
    for (let index = 0; index < 13; index += 1) cloud(ctx, 100 + random() * 1800, 115 + random() * 220, 80 + random() * 190, index % 2 ? '#d3c8a7' : '#a8b7a8');
    polygon(ctx, [[0, 581], [142, 542], [283, 565], [416, 529], [562, 557], [731, 520], [903, 554], [1087, 520], [1281, 554], [1448, 532], [1632, 562], [1800, 533], [2000, 559], [2000, 694], [0, 694]], '#78948b');
    woodLine(ctx, [[0, 582], [143, 543], [284, 566], [417, 530], [563, 558], [731, 521], [904, 555], [1088, 521], [1282, 555], [1449, 533], [1633, 563], [1801, 534], [2000, 560]], BLUE, 3, 2, -1);
    boat(ctx, 1040, 563, 0.78, '#d0b487');
    boat(ctx, 1540, 604, 0.48, RED);
    house(ctx, 170, 691, 215, 184, 0);
    house(ctx, 455, 714, 280, 208, 1);
    house(ctx, 1412, 693, 265, 205, 0);
    house(ctx, 1810, 720, 230, 175, 1);
    pine(ctx, 760, 783, 332, -68, 11020);
    pine(ctx, 887, 782, 262, 54, 11021);
    pine(ctx, 1254, 788, 352, -85, 11022);
    pine(ctx, 1336, 787, 231, 48, 11023);
    polygon(ctx, [[0, 699], [240, 704], [437, 711], [602, 700], [791, 711], [1004, 701], [1182, 714], [1370, 703], [1594, 713], [1780, 700], [2000, 709], [2000, 830], [0, 830]], '#cfbb91');
    woodLine(ctx, [[0, 700], [240, 705], [437, 712], [602, 701], [791, 712], [1004, 702], [1182, 715], [1370, 704], [1594, 714], [1780, 701], [2000, 710]], RED, 2, 2, -1);
    for (let stoneIndex = 0; stoneIndex < 20; stoneIndex += 1) {
      const stoneX = stoneIndex * 112 + 12;
      polygon(ctx, [[stoneX, 779], [stoneX + 42, 776], [stoneX + 65, 789], [stoneX + 17, 797]], stoneIndex % 3 ? '#a88f6d' : GREEN, BLACK, 0.7);
    }
    woodLine(ctx, [[0, ROAD_Y], [2000, ROAD_Y]], RED, 4, 2, -1);
    woodLine(ctx, [[0, ROAD_Y], [2000, ROAD_Y]], BLACK, 2);
    woodLine(ctx, [[0, ROAD_Y + 52], [2000, ROAD_Y + 52]], BLUE, 1.8, -2, 1);
    for (let markerIndex = 0; markerIndex < 24; markerIndex += 1) woodLine(ctx, [[markerIndex * 92 - 35, ROAD_Y + 27], [markerIndex * 92, ROAD_Y + 22]], GREEN, 1.4, 1, 0);
    ctx.fillStyle = 'rgba(36,45,48,0.06)';
    ctx.fillRect(0, 0, 2000, 1000);
  });
}

export function prepare() {
  landscape = paintLandscape();
}

export function cameraAt() {
  return { zoom: 1, riderScale: 1 };
}

export function hatWindAt(localT) {
  return smooth((localT - 2) / 2);
}

export function renderAt(ctx, { localT }) {
  ctx.drawImage(landscape, -500, 0, 2000, 1000);
  const wind = hatWindAt(localT);
  const windAngle = -0.22 - wind * 0.19;
  ctx.save();
  ctx.globalAlpha = 0.64;
  for (let lineIndex = 0; lineIndex < 7; lineIndex += 1) {
    const baseX = 721 + lineIndex * 29;
    const baseY = 445 + lineIndex * 16;
    const length = 46 + lineIndex * 8;
    const endX = baseX + Math.cos(windAngle) * length;
    const endY = baseY + Math.sin(windAngle) * length;
    woodLine(ctx, [[baseX, baseY], [endX, endY]], BLUE, 1.3, 2, -1);
    woodLine(ctx, [[baseX, baseY], [endX, endY]], BLACK, 0.7);
  }
  ctx.restore();
}

function drawWheel(ctx, centerX, wheelAngle) {
  ctx.beginPath();
  ctx.arc(centerX, 0, 73, 0, TAU);
  ctx.strokeStyle = BLACK;
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(centerX + 2, 1, 73, 0, TAU);
  ctx.strokeStyle = RED;
  ctx.lineWidth = 1.6;
  ctx.stroke();
  for (let spokeIndex = 0; spokeIndex < 10; spokeIndex += 1) {
    const angle = wheelAngle + spokeIndex * TAU / 10;
    line(ctx, [[centerX, 0], [centerX + Math.cos(angle) * 68, Math.sin(angle) * 68]], BLUE, 1.5);
  }
  ctx.fillStyle = RED;
  ctx.beginPath();
  ctx.arc(centerX, 0, 4, 0, TAU);
  ctx.fill();
}

export function renderRider(ctx, pose, { x: positionX, y: positionY, scale = 1, localT }) {
  const wind = hatWindAt(localT);
  ctx.save();
  ctx.translate(positionX, positionY);
  ctx.scale(scale, scale);
  ctx.globalAlpha *= 0.96;
  line(ctx, [[pose.hip.x, pose.hip.y], [pose.farKnee.x, pose.farKnee.y], [pose.farFoot.x, pose.farFoot.y]], BLUE, 5);
  drawWheel(ctx, -135, pose.wheelAngle);
  drawWheel(ctx, 135, pose.wheelAngle);
  woodLine(ctx, [[-135, 0], [-62, -115], [-20, -4], [-135, 0]], BLUE, 6, 2, -1);
  line(ctx, [[-135, 0], [-62, -115], [-20, -4], [-135, 0]], BLACK, 4.6);
  woodLine(ctx, [[-62, -115], [80, -105], [-20, -4]], RED, 5, -2, 1);
  line(ctx, [[-62, -115], [80, -105], [-20, -4]], BLACK, 3.2);
  line(ctx, [[80, -105], [135, 0]], BLACK, 4.5);
  line(ctx, [[80, -105], [73, -145], [105, -153]], BLACK, 4.5);
  line(ctx, [[-62, -115], [-64, -137], [-87, -137], [-42, -137]], BLACK, 7);
  line(ctx, [[pose.farFoot.x, pose.farFoot.y], [-20, -4], [pose.nearFoot.x, pose.nearFoot.y]], RED, 3.2);
  ctx.save();
  ctx.translate(0, pose.bob * 0.55);
  ctx.beginPath();
  ctx.moveTo(-153, -193);
  ctx.bezierCurveTo(-170, -218, -138, -239, -112, -255);
  ctx.bezierCurveTo(-73, -276, -39, -257, -10, -243);
  ctx.bezierCurveTo(14, -250, -3, -292, 13, -324);
  ctx.bezierCurveTo(30, -356, 63, -362, 87, -342);
  ctx.bezierCurveTo(104, -328, 96, -309, 77, -299);
  ctx.bezierCurveTo(56, -287, 72, -257, 51, -224);
  ctx.bezierCurveTo(27, -185, -72, -166, -153, -193);
  ctx.fillStyle = '#d8c99f';
  ctx.fill();
  ctx.strokeStyle = BLACK;
  ctx.lineWidth = 3.4;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(82, -337);
  ctx.lineTo(238, -305);
  ctx.quadraticCurveTo(159, -283, 84, -308);
  ctx.quadraticCurveTo(74, -294, 62, -286);
  ctx.quadraticCurveTo(82, -306, 82, -337);
  ctx.fillStyle = RED;
  ctx.fill();
  ctx.strokeStyle = BLACK;
  ctx.lineWidth = 2.3;
  ctx.stroke();
  line(ctx, [[88, -324], [228, -306]], BLUE, 1.3);
  ctx.fillStyle = BLACK;
  ctx.beginPath();
  ctx.arc(68, -337, 3, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(24 - wind * 18, -352 - wind * 17);
  ctx.lineTo(106 - wind * 3, -350 - wind * 16);
  ctx.lineTo(74 - wind * 24, -376 - wind * 24);
  ctx.lineTo(-4 - wind * 37, -371 - wind * 23);
  ctx.closePath();
  ctx.fillStyle = BLUE;
  ctx.fill();
  ctx.strokeStyle = BLACK;
  ctx.lineWidth = 2.1;
  ctx.stroke();
  line(ctx, [[-2 - wind * 32, -370 - wind * 23], [78 - wind * 21, -375 - wind * 24]], RED, 1.2);
  line(ctx, [[-120, -226], [-82, -236], [-40, -210], [17, -181], [101, -149]], GREEN, 9);
  for (let featherIndex = 0; featherIndex < 6; featherIndex += 1) line(ctx, [[-118 + featherIndex * 20, -228], [-102 + featherIndex * 20, -196]], BLUE, 1.6);
  ctx.restore();
  line(ctx, [[pose.hip.x, pose.hip.y], [pose.nearKnee.x, pose.nearKnee.y], [pose.nearFoot.x, pose.nearFoot.y]], RED, 5.8);
  line(ctx, [[pose.nearFoot.x - 8, pose.nearFoot.y + 4], [pose.nearFoot.x + 19, pose.nearFoot.y + 4]], BLACK, 4.5);
  ctx.restore();
}

export function renderTitle(ctx, { x: titleX }) {
  ctx.save();
  ctx.fillStyle = 'rgba(234,222,188,0.94)';
  ctx.fillRect(titleX - 12, 89, 144, 358);
  ctx.strokeStyle = BLUE;
  ctx.lineWidth = 2;
  ctx.strokeRect(titleX - 6, 95, 132, 346);
  text(ctx, '浮', titleX + 27, 144, { size: 39, color: BLACK, weight: 600 });
  text(ctx, '世', titleX + 27, 190, { size: 39, color: BLACK, weight: 600 });
  text(ctx, '绘', titleX + 27, 236, { size: 39, color: BLACK, weight: 600 });
  text(ctx, 'UKIYO-E', titleX + 99, 124, { size: 13, color: BLUE, family: SANS, align: 'center' });
  text(ctx, '1830s', titleX + 95, 281, { size: 21, color: RED, family: SANS, align: 'center' });
  text(ctx, '海 岸 驿 道', titleX + 66, 335, { size: 18, color: GREEN, align: 'center' });
  ctx.fillStyle = RED;
  ctx.fillRect(titleX + 76, 367, 31, 40);
  text(ctx, '旅', titleX + 91, 396, { size: 25, color: PAPER, align: 'center' });
  ctx.restore();
}
