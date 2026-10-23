import { SCENES } from './catalog.js';
import { text, line, SANS } from '../kit/canvas.js';
import { seeded, smooth, lerp } from '../kit/math.js';
import { layer, grainTexture, noise, tintMask, brushMark, pigmentPainter } from '../kit/materials.js';
import { ROAD_Y } from '../beat/timeline.js';

export const scene = SCENES[0];
export const finished = true;
const OCHRE = '#803d27';
const DARK = '#673722';
let wall;
let paintRider;
let chalk;
let figures;
let erosion;

function shape(ctx, points, fill = OCHRE) {
  ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function rockWall(brush) {
  const texture = grainTexture(1000, 500, { seed: 4000, rock: true });
  chalk = tintMask(brush.charcoal, OCHRE);
  return layer(2000, 1000, (ctx) => {
    ctx.drawImage(texture, 0, 0, 2000, 1000);
    const random = seeded(4001);
    for (let i = 0; i < 17; i += 1) {
      const y = i * 65 + random() * 20 - 40;
      ctx.beginPath();
      ctx.moveTo(-30, y);
      for (let x = 0; x <= 2040; x += 30) ctx.lineTo(x, y + noise(x / 190, i / 3, 38) * 41 + Math.sin(x / 420 + i) * 17);
      ctx.strokeStyle = i % 4 === 0 ? 'rgba(255,225,179,0.18)' : 'rgba(114,71,36,0.08)';
      ctx.lineWidth = 0.7 + random() * 3;
      ctx.stroke();
    }
    const joints = [
      [[174, -20], [211, 114], [201, 210], [260, 326], [249, 405], [312, 542], [299, 660], [343, 772], [330, 1040]],
      [[1703, -30], [1688, 156], [1644, 265], [1669, 390], [1631, 483], [1645, 651], [1603, 780], [1616, 1030]],
      [[-20, 595], [179, 570], [332, 600], [490, 583], [660, 602]],
      [[1243, 30], [1271, 106], [1260, 192], [1310, 263]],
    ];
    for (const points of joints) {
      line(ctx, points.map(([x, y]) => [x + 4, y - 2]), 'rgba(250,211,156,0.48)', 4);
      line(ctx, points, 'rgba(90,57,32,0.42)', 1.9);
      line(ctx, points.map(([x, y]) => [x - 2, y + 1]), 'rgba(114,70,38,0.13)', 7);
    }
    for (let i = 0; i < 580; i += 1) {
      const x = random() * 2000;
      const y = random() * 1000;
      const radius = 1 + random() * 10;
      ctx.fillStyle = i % 3 ? 'rgba(107,67,32,0.07)' : 'rgba(255,224,177,0.16)';
      ctx.beginPath();
      ctx.ellipse(x, y, radius * 2, radius * 0.35, -0.24, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 165; i += 1) {
      const x = random() * 2000;
      const y = random() * 1000;
      const w = 6 + random() * 29;
      const h = 3 + random() * 10;
      shape(ctx, [[x - w, y], [x - w * 0.3, y - h], [x + w * 0.8, y - h * 0.6], [x + w, y], [x, y + h * 0.4]], i % 3 === 0 ? 'rgba(251,219,172,0.13)' : 'rgba(102,65,32,0.045)');
    }
    for (let i = 0; i < 55; i += 1) {
      const x = random() * 2000;
      const y = random() * 1000;
      brushMark(ctx, chalk, x, y, x + 25 + random() * 60, y - 5, 12 + random() * 12, 0.055);
    }
    const light = ctx.createRadialGradient(850, 310, 90, 880, 450, 1200);
    light.addColorStop(0, 'rgba(255,225,175,0.18)');
    light.addColorStop(1, 'rgba(66,37,20,0.15)');
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, 2000, 1000);
  });
}

export function prepare({ brush }) {
  wall = rockWall(brush);
  paintRider = pigmentPainter(600, 550, 4137);
  figures = layer(2000, 1000);
  erosion = layer(2000, 1000, (ctx) => {
    const random = seeded(4073);
    for (let i = 0; i < 95000; i += 1) {
      ctx.fillStyle = `rgba(0,0,0,${0.12 + random() * 0.65})`;
      ctx.fillRect(random() * 2000, random() * 1000, 0.3 + random() * 3.5, 0.3 + random() * 1.8);
    }
    for (let i = 0; i < 110; i += 1) {
      const x = random() * 2000;
      const y = random() * 1000;
      line(ctx, [[x, y], [x + 16, y - 3], [x + 27, y - 1]], 'rgba(0,0,0,0.36)', 1);
    }
  });
}

function cow(ctx, x, y, scale, localT, number) {
  const stop = smooth((localT - 2) / 0.28);
  const walk = Math.sin(Math.min(localT, 2) * 5 + number * 1.7) * 13 * (1 - stop);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.globalAlpha = 0.68 + number * 0.05;
  shape(ctx, [[-105, -44], [-82, -72], [-25, -79], [39, -70], [77, -54], [73, -15], [40, 0], [-60, 2], [-101, -18]]);
  shape(ctx, [[-77, -8], [-62, -8], [-62 + walk, 70], [-70 + walk, 75], [-78, 40]]);
  shape(ctx, [[-46, -7], [-36, -6], [-40 - walk, 64], [-48 - walk, 64]], '#985135');
  shape(ctx, [[39, -15], [54, -24], [53 - walk, 65], [46 - walk, 70]]);
  shape(ctx, [[66, -29], [74, -27], [83 + walk, 54], [77 + walk, 59]], '#985135');
  line(ctx, [[-99, -42], [-120, -24], [-126, 15], [-133, 28]], OCHRE, 4);
  ctx.save();
  ctx.translate(60, -52);
  ctx.rotate(lerp(-0.18, 0.28 + number * 0.045, stop));
  shape(ctx, [[-5, 18], [-8, -21], [6, -49], [35, -51], [66, -35], [62, -21], [35, -16], [23, 10]]);
  ctx.beginPath();
  ctx.moveTo(5, -42);
  ctx.bezierCurveTo(-40, -68, -35, -126, -4, -145);
  ctx.bezierCurveTo(-22, -111, -9, -76, 15, -59);
  ctx.moveTo(22, -47);
  ctx.bezierCurveTo(62, -76, 66, -116, 53, -139);
  ctx.bezierCurveTo(92, -110, 77, -62, 31, -37);
  ctx.fillStyle = OCHRE;
  ctx.fill();
  ctx.fillStyle = '#d0a06b';
  ctx.beginPath();
  ctx.arc(39, -36, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  for (let i = 0; i < 6; i += 1) line(ctx, [[-73 + i * 20, -57], [-65 + i * 19, -20]], '#b8784d', 2);
  ctx.restore();
}

function herder(ctx, x, y, scale, localT, variant) {
  const watch = smooth((localT - 2 - variant * 0.08) / 0.3);
  const stride = Math.sin(Math.min(localT, 2) * 4 + variant) * 10 * (1 - watch);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = DARK;
  ctx.beginPath();
  ctx.ellipse(0, -171, 10, 14, -0.15, 0, Math.PI * 2);
  ctx.fill();
  shape(ctx, [[-6, -155], [7, -155], [14, -101], [-7, -94]], DARK);
  shape(ctx, [[-7, -105], [15, -106], [25, -76], [-16, -77]], DARK);
  line(ctx, [[-7, -80], [-15 - stride, -39], [-24 - stride, 0]], DARK, 5);
  line(ctx, [[9, -80], [20 + stride, -42], [14 + stride, 0]], DARK, 5);
  const elbow = variant ? [-24, lerp(-122, -161, watch)] : [-29, lerp(-131, -144, watch)];
  const hand = variant ? [-4, lerp(-107, -179, watch)] : [lerp(-42, -70, watch), lerp(-111, -145, watch)];
  line(ctx, [[-5, -146], elbow, hand], DARK, 4);
  line(ctx, [[7, -143], [25, -117], [38, -131]], DARK, 4);
  line(ctx, [[38, -156], [41, 0]], DARK, 2.7);
  ctx.restore();
}

export function renderAt(ctx, { localT }) {
  ctx.drawImage(wall, -500, 0, 2000, 1000);
  const paint = figures.getContext('2d');
  paint.clearRect(0, 0, 2000, 1000);
  paint.save();
  paint.translate(500, 0);
  cow(paint, 112, 423, 0.78, localT, 0);
  cow(paint, 440, 430, 1.07, localT, 1);
  cow(paint, 728, 407, 0.72, localT, 2);
  cow(paint, 620, 536, 0.4, localT, 0);
  herder(paint, 905, 657, 1.15, localT, 0);
  herder(paint, 1000, 603, 0.87, localT, 1);
  paint.restore();
  paint.globalCompositeOperation = 'destination-out';
  paint.drawImage(erosion, 0, 0);
  paint.globalCompositeOperation = 'source-over';
  ctx.drawImage(figures, -500, 0);
  ctx.save();
  ctx.globalAlpha = 0.25;
  for (const [x, y] of [[-218, 431], [1140, 329], [1206, 340]]) {
    line(ctx, [[x - 12, y - 22], [x, y], [x - 6, y + 35]], OCHRE, 3);
    line(ctx, [[x, y], [x + 20, y - 15]], OCHRE, 3);
    line(ctx, [[x, y + 12], [x + 18, y + 35]], OCHRE, 3);
  }
  ctx.restore();
  for (let x = -500; x < 1500; x += 175) brushMark(ctx, chalk, x, ROAD_Y + 1, x + 179, ROAD_Y + 1, 12, 0.7);
  line(ctx, [[-500, ROAD_Y + 1], [1500, ROAD_Y + 1]], 'rgba(104,56,31,0.34)', 1);
}

export function renderRider(ctx, pose, { x, y, scale = 1 }) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.globalAlpha *= 0.87;
  paintRider(ctx, (p) => {
    p.lineCap = 'round';
    p.lineJoin = 'round';
    const limb = (knee, foot, width) => line(p, [[pose.hip.x, pose.hip.y], [knee.x, knee.y], [foot.x, foot.y]], OCHRE, width);
    limb(pose.farKnee, pose.farFoot, 5);
    for (const cx of [-135, 135]) {
      const points = Array.from({ length: 81 }, (_, i) => {
        const a = i / 80 * Math.PI * 2;
        const r = 73 + Math.sin(a * 5 + cx) * 1.1;
        return [cx + Math.cos(a) * r, Math.sin(a) * r];
      });
      line(p, points, OCHRE, 6.5);
      for (let i = 0; i < 8; i += 1) {
        const a = pose.wheelAngle + i * Math.PI / 4;
        line(p, [[cx, 0], [cx + Math.cos(a) * 68, Math.sin(a) * 68]], OCHRE, 2.3);
      }
    }
    line(p, [[-135, 0], [-63, -116], [-20, -4], [-135, 0]], OCHRE, 7);
    line(p, [[-63, -116], [78, -107], [-20, -4]], OCHRE, 7);
    line(p, [[78, -107], [135, 0]], OCHRE, 7);
    line(p, [[78, -107], [70, -148], [106, -153]], OCHRE, 6);
    line(p, [[-83, -136], [-41, -136]], DARK, 9);
    line(p, [[-62, -116], [-62, -136]], OCHRE, 5);
    line(p, [[pose.farFoot.x, pose.farFoot.y], [-20, -4], [pose.nearFoot.x, pose.nearFoot.y]], OCHRE, 4);
    p.save();
    p.translate(0, pose.bob * 0.6);
    p.beginPath();
    p.moveTo(-153, -193);
    p.lineTo(-178, -218);
    p.quadraticCurveTo(-139, -220, -115, -249);
    p.bezierCurveTo(-72, -273, -41, -258, -12, -247);
    p.bezierCurveTo(15, -255, -5, -293, 12, -324);
    p.bezierCurveTo(31, -358, 65, -361, 88, -342);
    p.quadraticCurveTo(106, -326, 83, -310);
    p.bezierCurveTo(61, -294, 77, -264, 58, -232);
    p.quadraticCurveTo(32, -185, -34, -170);
    p.quadraticCurveTo(-105, -166, -153, -193);
    p.fillStyle = OCHRE;
    p.fill();
    shape(p, [[83, -339], [238, -306], [193, -297], [103, -307], [76, -287], [64, -300]]);
    p.fillStyle = '#d6a877';
    p.beginPath();
    p.ellipse(66, -339, 2.7, 2.9, 0, 0, Math.PI * 2);
    p.fill();
    line(p, [[90, -324], [225, -307]], '#b7764b', 1.5);
    line(p, [[-117, -233], [-64, -219], [-3, -181], [99, -148]], OCHRE, 13);
    for (let i = 0; i < 6; i += 1) line(p, [[-119 + i * 21, -228], [-102 + i * 20, -196]], '#c08455', 2);
    p.restore();
    limb(pose.nearKnee, pose.nearFoot, 6.5);
    line(p, [[pose.nearFoot.x - 8, pose.nearFoot.y + 4], [pose.nearFoot.x + 19, pose.nearFoot.y + 4]], DARK, 5);
  });
  ctx.restore();
}

export function renderTitle(ctx, { x }) {
  text(ctx, '01   /   TASSILI', x, 95, { size: 16, color: DARK, family: SANS, weight: 600 });
  text(ctx, scene.zh, x, 169, { size: 54, color: DARK, weight: 600 });
  text(ctx, 'SAHARAN ROCK ART', x + 2, 209, { size: 22, color: DARK, family: SANS });
  text(ctx, '约前 4000  ·  牧养时代', x + 2, 249, { size: 22, color: DARK });
  brushMark(ctx, chalk, x, 272, x + 150, 272, 11, 0.8);
}
