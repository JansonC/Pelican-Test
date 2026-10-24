import { SCENES } from './catalog.js';
import { ROAD_Y, clamp, pedalPhase } from '../beat/timeline.js';
import { line, text, SANS } from '../kit/canvas.js';
import { seeded, smooth } from '../kit/math.js';
import { layer, noise, pigmentPainter } from '../kit/materials.js';

export const scene = SCENES[6];
export const finished = true;
export const TITLE_GLYPHS = '玛雅抄本约骑行记数一圈一记折页账册';

const PAPER = '#dcc99e';
const IVORY = '#e9ddba';
const INK = '#353028';
const RED = '#a64633';
const BLUE = '#537b78';
const GOLD = '#b4914e';
const TAU = Math.PI * 2;
let paper;
let painting;
let riderBody;
let paintRider;
let counterFrame;
let openingPage;

function polygon(ctx, points, fill, stroke = INK, width = 2) {
  ctx.beginPath();
  points.forEach(([pointX, pointY], index) => index ? ctx.lineTo(pointX, pointY) : ctx.moveTo(pointX, pointY));
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
}

function ellipse(ctx, centerX, centerY, radiusX, radiusY, fill, stroke = INK, width = 1.6) {
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, TAU);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
}

function steppedBand(ctx, centerY, reverse = false) {
  line(ctx, [[-500, centerY - 27], [1500, centerY - 27]], RED, 5);
  line(ctx, [[-500, centerY - 19], [1500, centerY - 19]], INK, 1.2);
  line(ctx, [[-500, centerY + 22], [1500, centerY + 22]], INK, 1.2);
  line(ctx, [[-500, centerY + 30], [1500, centerY + 30]], RED, 4);
  for (let pointX = -500; pointX < 1500; pointX += 83) {
    ctx.save();
    ctx.translate(pointX, centerY);
    ctx.scale(reverse ? -1 : 1, 1);
    polygon(ctx, [[7, 15], [7, -11], [23, -11], [23, -2], [37, -2], [37, 7], [51, 7], [51, -12], [63, -12], [63, 15]], BLUE, INK, 1.1);
    line(ctx, [[13, 9], [13, -5], [17, -5]], IVORY, 1.5);
    ellipse(ctx, 72, -1, 3.3, 3.3, RED, null);
    ctx.restore();
  }
}

function rainSign(ctx, centerX, centerY, size = 1) {
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.scale(size, size);
  polygon(ctx, [[-69, -1], [-69, -24], [-54, -24], [-54, -38], [-25, -38], [-25, -49], [4, -49], [4, -39], [36, -39], [36, -26], [64, -26], [64, -1], [45, 10], [-51, 10]], BLUE, INK, 3);
  line(ctx, [[-56, -4], [-39, -4], [-39, -21], [-12, -21], [-12, -32], [15, -32], [15, -16], [47, -16], [47, -4]], IVORY, 2.8);
  for (let index = 0; index < 5; index += 1) {
    const dropX = -48 + index * 24;
    polygon(ctx, [[dropX, 24], [dropX + 6, 42], [dropX + 2, 48], [dropX - 5, 45]], RED, INK, 1);
  }
  ctx.restore();
}

function maize(ctx, centerX, baseY, size = 1) {
  ctx.save();
  ctx.translate(centerX, baseY);
  ctx.scale(size, size);
  polygon(ctx, [[-7, 2], [-6, -134], [3, -144], [9, -133], [6, 2]], BLUE, INK, 1.7);
  for (let index = 0; index < 3; index += 1) {
    const leafY = -18 - index * 34;
    polygon(ctx, [[-4, leafY], [-49, leafY - 22], [-78, leafY - 57], [-40, leafY - 48], [0, leafY - 15]], BLUE, INK, 1.3);
    polygon(ctx, [[6, leafY - 11], [43, leafY - 40], [74, leafY - 46], [52, leafY - 16], [5, leafY + 2]], GOLD, INK, 1.3);
    line(ctx, [[-3, leafY - 6], [-57, leafY - 44]], IVORY, 1.2);
    line(ctx, [[10, leafY - 8], [54, leafY - 32]], RED, 1.3);
  }
  polygon(ctx, [[-17, -123], [-23, -162], [-12, -190], [1, -198], [17, -182], [23, -153], [15, -124]], GOLD, INK, 2);
  for (let row = 0; row < 5; row += 1) {
    for (let column = 0; column < 3; column += 1) ellipse(ctx, -11 + column * 10, -175 + row * 10, 3.2, 3, IVORY, RED, 0.6);
  }
  ctx.restore();
}

function birdSign(ctx, centerX, centerY, size = 1) {
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.scale(size, size);
  polygon(ctx, [[-43, 7], [-58, -13], [-38, -9], [-22, -25], [4, -25], [10, -47], [27, -54], [42, -45], [39, -26], [76, -12], [39, -8], [28, 12], [-2, 18]], IVORY, INK, 2.2);
  polygon(ctx, [[-27, -14], [-9, -18], [18, 5], [-7, 9]], RED, INK, 1.2);
  line(ctx, [[-5, 18], [-7, 31], [8, 31]], RED, 2.5);
  line(ctx, [[18, 15], [24, 29], [39, 29]], RED, 2.5);
  ellipse(ctx, 28, -39, 3, 3, INK, null);
  ctx.restore();
}

function symbolCell(ctx, centerX, centerY, variant) {
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.strokeStyle = RED;
  ctx.lineWidth = 2;
  ctx.strokeRect(-30, -23, 60, 46);
  if (variant % 3 === 0) {
    polygon(ctx, [[-20, 13], [-20, -10], [-5, -10], [-5, -17], [17, -17], [17, -2], [5, -2], [5, 13]], BLUE, INK, 1.5);
    ellipse(ctx, 17, 10, 4, 4, RED, INK, 0.8);
  } else if (variant % 3 === 1) {
    line(ctx, [[-19, 14], [-19, -12], [17, -12], [17, 11], [-7, 11], [-7, 1], [7, 1]], INK, 3);
    ellipse(ctx, -5, -4, 3.5, 3.5, RED, null);
  } else {
    polygon(ctx, [[0, -17], [22, 4], [0, 16], [-22, 4]], GOLD, INK, 1.5);
    line(ctx, [[-10, 3], [0, -6], [10, 3], [0, 9]], RED, 2.5);
  }
  ctx.restore();
}

function numeral(ctx, count, centerX, centerY, size = 1, color = INK) {
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.scale(size, size);
  if (count === 0) {
    ellipse(ctx, 0, 0, 28, 13, null, color, 2.7);
    line(ctx, [[-20, 1], [20, 1]], color, 2);
    for (let index = 0; index < 4; index += 1) line(ctx, [[-15 + index * 10, -9], [-8 + index * 7, 0]], color, 1.5);
  } else {
    const bars = Math.floor(count / 5);
    const dots = count % 5;
    for (let index = 0; index < bars; index += 1) polygon(ctx, [[-38, 8 + index * 16], [38, 8 + index * 16], [38, 18 + index * 16], [-38, 18 + index * 16]], color, null);
    for (let index = 0; index < dots; index += 1) ellipse(ctx, (index - (dots - 1) / 2) * 21, bars ? -8 : 1, 6.5, 6.5, color, null);
  }
  ctx.restore();
}

export function mayaCountAt(time) {
  const completed = Math.floor((pedalPhase(time) - pedalPhase(scene.start)) / TAU + 1e-9);
  return clamp(completed, 0, 6);
}

function barkPaper() {
  const texture = layer(1000, 500);
  const ctx = texture.getContext('2d');
  const image = ctx.createImageData(1000, 500);
  const random = seeded(7104);
  for (let pointY = 0; pointY < 500; pointY += 1) {
    for (let pointX = 0; pointX < 1000; pointX += 1) {
      const shade = (noise(pointX / 87, pointY / 53, 7101) - 0.5) * 21 + (noise(pointX / 12, pointY / 5, 7102) - 0.5) * 8 + (random() - 0.5) * 10;
      const pixel = (pointY * 1000 + pointX) * 4;
      image.data[pixel] = 221 + shade;
      image.data[pixel + 1] = 204 + shade;
      image.data[pixel + 2] = 164 + shade * 0.8;
      image.data[pixel + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  return texture;
}

function wear(ctx, seed) {
  const random = seeded(seed);
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  for (let index = 0; index < 9000; index += 1) {
    ctx.fillStyle = `rgba(0,0,0,${0.15 + random() * 0.65})`;
    ctx.fillRect(random() * 2000 - 500, random() * 1000, 0.5 + random() * 3.2, 0.3 + random() * 1.5);
  }
  ctx.restore();
}

function paintBody(ctx) {
  polygon(ctx, [[-174, -194], [-202, -227], [-170, -220], [-141, -253], [-95, -269], [-51, -259], [-21, -239], [6, -255], [6, -297], [21, -333], [45, -350], [76, -350], [96, -335], [91, -313], [68, -298], [67, -263], [46, -222], [12, -187], [-44, -169], [-115, -173]], IVORY, INK, 4);
  polygon(ctx, [[-197, -227], [-174, -221], [-177, -207], [-165, -201]], RED, INK, 1.5);
  polygon(ctx, [[28, -347], [17, -371], [31, -376], [37, -356], [45, -356], [42, -390], [59, -392], [62, -356], [69, -356], [77, -382], [92, -375], [82, -348]], BLUE, INK, 2.5);
  line(ctx, [[28, -346], [82, -346]], RED, 8);
  polygon(ctx, [[88, -335], [243, -302], [225, -296], [158, -287], [109, -291], [85, -305], [66, -286], [65, -299]], GOLD, INK, 3);
  polygon(ctx, [[92, -322], [232, -302], [157, -294], [110, -298], [84, -311]], RED, INK, 1.4);
  line(ctx, [[105, -317], [220, -302]], IVORY, 1.8);
  ellipse(ctx, 68, -333, 12, 10, IVORY, INK, 2);
  ellipse(ctx, 72, -334, 4.5, 4.5, INK, null);
  line(ctx, [[49, -342], [75, -345]], INK, 2.6);
  polygon(ctx, [[-146, -234], [-107, -247], [-58, -232], [-6, -202], [103, -150], [65, -152], [14, -164], [-38, -178], [-102, -180], [-143, -198]], BLUE, INK, 3);
  polygon(ctx, [[-128, -226], [-99, -235], [-64, -223], [-65, -203], [-83, -203], [-83, -193], [-105, -197], [-105, -211], [-127, -211]], RED, INK, 1.4);
  for (let index = 0; index < 5; index += 1) {
    const featherX = -56 + index * 26;
    const featherY = -222 + index * 13;
    polygon(ctx, [[featherX, featherY], [featherX + 13, featherY + 4], [featherX + 20, featherY + 30], [featherX + 6, featherY + 24]], index % 2 ? RED : IVORY, INK, 1.2);
  }
  line(ctx, [[-145, -190], [-100, -180], [-62, -181]], RED, 3.5);
  line(ctx, [[27, -316], [24, -291], [37, -275], [31, -246]], RED, 3);
  for (let index = 0; index < 4; index += 1) ellipse(ctx, 36 + index * 3, -305 + index * 11, 2.8, 2.8, INK, null);
}

export function prepare() {
  const texture = barkPaper();
  paintRider = pigmentPainter(640, 580, 7199);
  paper = layer(2000, 1000, (ctx) => {
    ctx.drawImage(texture, 0, 0, 2000, 1000);
    const random = seeded(7107);
    for (let index = 0; index < 18000; index += 1) {
      const pointX = random() * 2000;
      const pointY = random() * 1000;
      line(ctx, [[pointX, pointY], [pointX + 3 + random() * 13, pointY + (random() - 0.5) * 2]], index % 3 ? 'rgba(90,66,35,0.065)' : 'rgba(255,244,209,0.28)', 0.25 + random() * 0.6);
    }
    for (let fold = 1; fold < 4; fold += 1) {
      const foldX = fold * 500;
      const shadow = ctx.createLinearGradient(foldX - 24, 0, foldX + 31, 0);
      shadow.addColorStop(0, 'rgba(72,48,28,0)');
      shadow.addColorStop(0.45, 'rgba(72,48,28,0.17)');
      shadow.addColorStop(0.56, 'rgba(255,245,208,0.3)');
      shadow.addColorStop(1, 'rgba(72,48,28,0)');
      ctx.fillStyle = shadow;
      ctx.fillRect(foldX - 24, 18, 55, 962);
      line(ctx, [[foldX, 22], [foldX - 1, 975]], 'rgba(93,68,41,0.24)', 0.9);
    }
  });
  painting = layer(2000, 1000, (ctx) => {
    ctx.translate(500, 0);
    steppedBand(ctx, 56);
    steppedBand(ctx, 912, true);
    line(ctx, [[-500, 305], [1500, 305]], RED, 4);
    line(ctx, [[-500, 316], [1500, 316]], INK, 1.5);
    for (let panel = 0; panel < 4; panel += 1) {
      const panelX = -500 + panel * 500;
      for (let cell = 0; cell < 5; cell += 1) symbolCell(ctx, panelX + 60 + cell * 84, 355, panel * 5 + cell);
      line(ctx, [[panelX + 19, 82], [panelX + 19, 294]], RED, 1.2);
      line(ctx, [[panelX + 481, 82], [panelX + 481, 294]], RED, 1.2);
    }
    rainSign(ctx, -276, 448, 1.27);
    rainSign(ctx, 208, 463, 0.68);
    maize(ctx, -395, 768, 1.22);
    maize(ctx, -163, 771, 0.89);
    maize(ctx, 1372, 773, 1.15);
    birdSign(ctx, -270, 620, 1.1);
    birdSign(ctx, 1218, 237, 1.02);
    birdSign(ctx, 220, 235, 0.9);
    for (let panel = 0; panel < 4; panel += 1) {
      const panelX = -500 + panel * 500;
      for (let index = 0; index < 4; index += 1) {
        const pointX = panelX + 73 + index * 112;
        line(ctx, [[pointX - 23, 849], [pointX - 23, 831], [pointX - 7, 831], [pointX - 7, 841], [pointX + 9, 841], [pointX + 9, 831], [pointX + 24, 831], [pointX + 24, 850]], BLUE, 2.1);
        ellipse(ctx, pointX, 863, 4, 4, RED, null);
      }
    }
    line(ctx, [[-500, ROAD_Y], [1500, ROAD_Y]], INK, 4);
    line(ctx, [[-500, ROAD_Y + 9], [1500, ROAD_Y + 9]], RED, 2);
    wear(ctx, 7133);
  }, 1.25);
  counterFrame = layer(282, 338, (ctx) => {
    ctx.fillStyle = IVORY;
    ctx.fillRect(5, 5, 272, 328);
    ctx.strokeStyle = RED;
    ctx.lineWidth = 5;
    ctx.strokeRect(9, 9, 264, 320);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.7;
    ctx.strokeRect(17, 17, 248, 304);
    line(ctx, [[20, 91], [261, 91]], INK, 1.5);
    line(ctx, [[20, 225], [261, 225]], RED, 2);
    for (let index = 0; index < 6; index += 1) ellipse(ctx, 39 + index * 40, 298, 3, 3, BLUE, null);
  });
  openingPage = layer(495, 654, (ctx) => {
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, 495, 654);
    ctx.strokeStyle = RED;
    ctx.lineWidth = 3;
    ctx.strokeRect(8, 8, 479, 638);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1;
    ctx.strokeRect(15, 15, 465, 624);
    rainSign(ctx, 246, 154, 1.5);
    maize(ctx, 247, 536, 1.47);
    for (let index = 0; index < 5; index += 1) symbolCell(ctx, 75 + index * 85, 591, index);
    const shade = ctx.createLinearGradient(0, 0, 495, 0);
    shade.addColorStop(0, 'rgba(70,42,22,0.22)');
    shade.addColorStop(0.3, 'rgba(70,42,22,0)');
    shade.addColorStop(1, 'rgba(70,42,22,0.05)');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, 495, 654);
  });
  riderBody = layer(600, 460, (ctx) => {
    ctx.translate(220, 420);
    paintBody(ctx);
  }, 1.5);
}

export function renderAt(ctx, { localT }) {
  ctx.drawImage(paper, -500, 0, 2000, 1000);
  ctx.drawImage(painting, -500, 0, 2000, 1000);
  const unfold = 1 - smooth((localT - 0.15) / 1.6);
  if (unfold > 0) {
    ctx.save();
    ctx.translate(0, 143);
    ctx.transform(unfold, 0, 0, 1, 0, 0);
    ctx.drawImage(openingPage, 0, 0);
    ctx.restore();
  }
}

function renderCounter(ctx, time, localT) {
  const count = mayaCountAt(time);
  ctx.drawImage(counterFrame, 0, 0);
  text(ctx, '骑行记数', 141, 45, { size: 28, color: INK, align: 'center', weight: 600 });
  text(ctx, 'PEDAL TURNS', 141, 73, { size: 17, color: RED, family: SANS, align: 'center' });
  const arrival = smooth((localT - Math.floor(localT)) / 0.16);
  ctx.save();
  ctx.globalAlpha *= 0.6 + arrival * 0.4;
  numeral(ctx, count, 141, 153, 1.95, INK);
  ctx.restore();
  text(ctx, '一圈一记', 141, 258, { size: 24, color: RED, align: 'center' });
  for (let index = 0; index < 6; index += 1) numeral(ctx, index + 1, 39 + index * 40, 292, 0.32, index < count ? RED : 'rgba(83,66,45,0.19)');
}

export function renderRider(ctx, pose, { x: riderX, y: riderY, scale = 1 }) {
  ctx.save();
  ctx.translate(riderX, riderY);
  ctx.scale(scale, scale);
  paintRider(ctx, (paint) => {
    const leg = (knee, foot, color) => {
      line(paint, [[pose.hip.x, pose.hip.y], [knee.x, knee.y], [foot.x, foot.y]], INK, 9);
      line(paint, [[pose.hip.x, pose.hip.y], [knee.x, knee.y], [foot.x, foot.y]], color, 5.3);
      ellipse(paint, knee.x, knee.y, 5, 5, GOLD, INK, 1.3);
      line(paint, [[foot.x - 7, foot.y + 3], [foot.x + 20, foot.y + 3], [foot.x + 11, foot.y - 3]], INK, 3);
    };
    leg(pose.farKnee, pose.farFoot, BLUE);
    for (const centerX of [-135, 135]) {
      ellipse(paint, centerX, 0, 73, 73, null, INK, 6);
      ellipse(paint, centerX, 0, 68, 68, null, RED, 2.4);
      ellipse(paint, centerX, 0, 62, 62, null, INK, 1.1);
      for (let index = 0; index < 12; index += 1) {
        const angle = pose.wheelAngle + index * TAU / 12;
        line(paint, [[centerX, 0], [centerX + Math.cos(angle) * 62, Math.sin(angle) * 62]], INK, 1.7);
        ellipse(paint, centerX + Math.cos(angle) * 56, Math.sin(angle) * 56, 2.5, 2.5, BLUE, null);
      }
      ellipse(paint, centerX, 0, 8, 8, GOLD, INK, 2);
    }
    const tube = (points) => {
      line(paint, points, INK, 7.4);
      line(paint, points, RED, 3.8);
    };
    tube([[-135, 0], [-60, -115], [-20, -4], [-135, 0]]);
    tube([[-60, -115], [80, -105], [-20, -4]]);
    tube([[135, 0], [80, -105], [72, -145], [99, -152], [114, -144], [109, -132]]);
    tube([[-60, -115], [-66, -139]]);
    polygon(paint, [[-92, -144], [-45, -144], [-40, -135], [-92, -135]], BLUE, INK, 2);
    ellipse(paint, -20, -4, 24, 24, GOLD, INK, 2.4);
    line(paint, [[pose.farFoot.x, pose.farFoot.y], [-20, -4], [pose.nearFoot.x, pose.nearFoot.y]], INK, 4);
    line(paint, [[-131, 2], [-22, 21], [-16, -26], [-132, -7]], INK, 1.8);
    paint.drawImage(riderBody, -220, -420 + pose.bob * 0.55, 600, 460);
    leg(pose.nearKnee, pose.nearFoot, RED);
    line(paint, [[pose.nearFoot.x - 8, pose.nearFoot.y + 8], [pose.nearFoot.x + 17, pose.nearFoot.y + 8]], BLUE, 4);
    line(paint, [[pose.farFoot.x - 8, pose.farFoot.y + 8], [pose.farFoot.x + 17, pose.farFoot.y + 8]], BLUE, 4);
  });
  ctx.restore();
}

export function renderTitle(ctx, { x: titleX, t: time, localT }) {
  ctx.save();
  ctx.fillStyle = IVORY;
  ctx.fillRect(titleX - 17, 112, 483, 180);
  ctx.strokeStyle = RED;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(titleX - 12, 117, 473, 170);
  line(ctx, [[titleX - 5, 126], [titleX - 5, 279]], INK, 1.1);
  text(ctx, '07   /   FOLDED CYCLING LEDGER', titleX + 10, 145, { size: 15, color: RED, family: SANS, weight: 600 });
  text(ctx, scene.zh, titleX + 8, 204, { size: 54, color: INK, weight: 600 });
  text(ctx, 'MAYA CODEX', titleX + 10, 240, { size: 22, color: INK, family: SANS });
  text(ctx, scene.era, titleX + 10, 272, { size: 23, color: RED });
  text(ctx, '折页账册', titleX + 189, 272, { size: 19, color: BLUE });
  ctx.translate(titleX + 515, 100);
  ctx.scale(0.65, 0.65);
  renderCounter(ctx, time, localT);
  ctx.restore();
}
