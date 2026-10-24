import { SCENES } from './catalog.js';
import { text, SANS } from '../kit/canvas.js';
import { seeded, smooth, lerp } from '../kit/math.js';
import { layer, xuanPaper, inkGranulation, brushMark, tintMask } from '../kit/materials.js';
import { inkStroke, inkWash, mossDots } from '../kit/ink.js';
import { ROAD_Y } from '../beat/timeline.js';

export const scene = SCENES[8];
export const finished = true;
export const TITLE_GLYPHS = '八大山人写意留白行约';

const INK = '#252b27';
const PAPER = '#eee9dc';
const TAU = Math.PI * 2;
let landscape;
let body;
let bicycle;
let inkTip;

function stroke(ctx, points, width = 2, seed = 9100, alpha = 1, dry = 0.3) {
  inkStroke(ctx, points, { color: INK, width, seed, alpha, dry });
}

function wetShape(ctx, path, alpha = 1, color = INK, bleed = 1.8) {
  inkWash(ctx, path, { color, alpha: alpha * 0.2, bleed });
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = color;
  ctx.fill(path);
  ctx.restore();
}

function paintStone(ctx) {
  const silhouette = new Path2D('M799 800 Q803 781 820 767 L816 744 Q817 728 837 724 L852 690 Q872 676 892 690 L915 682 Q936 689 932 714 L954 741 Q951 756 969 772 L983 800 Q909 811 799 800 Z');
  inkWash(ctx, silhouette, { alpha: 0.14, bleed: 3, color: INK });
  ctx.save();
  ctx.clip(silhouette);
  const shade = ctx.createLinearGradient(807, 683, 976, 807);
  shade.addColorStop(0, 'rgba(37,43,39,0.06)');
  shade.addColorStop(0.42, 'rgba(37,43,39,0.17)');
  shade.addColorStop(0.64, 'rgba(37,43,39,0.5)');
  shade.addColorStop(1, 'rgba(37,43,39,0.18)');
  ctx.fillStyle = shade;
  ctx.fillRect(790, 675, 200, 140);
  inkWash(ctx, new Path2D('M900 692 Q917 701 914 727 Q910 747 926 764 L930 795 Q908 781 903 763 Q911 739 897 722 Z'), { color: INK, alpha: 0.53, bleed: 2.8 });
  inkWash(ctx, new Path2D('M834 729 Q847 739 843 757 Q835 771 846 794 L831 791 Q826 770 834 754 Z'), { color: INK, alpha: 0.42, bleed: 2.1 });
  const random = seeded(9010);
  for (let index = 0; index < 38; index += 1) {
    const startX = 815 + random() * 150;
    const startY = 692 + random() * 111;
    stroke(ctx, [[startX, startY], [startX - 4, startY + 11], [startX + 6, startY + 19]], 0.5 + random() * 1.3, 9010 + index, 0.1 + random() * 0.3, 0.7);
  }
  ctx.restore();
  stroke(ctx, [[802, 796], [818, 771], [817, 745], [837, 726], [854, 691], [875, 682]], 2.3, 9060, 0.9, 0.55);
  stroke(ctx, [[894, 691], [915, 684], [929, 694], [931, 715], [953, 742], [950, 754], [968, 776], [980, 797]], 2.7, 9061, 0.77, 0.5);
  stroke(ctx, [[851, 698], [867, 725], [864, 750], [879, 782]], 1.2, 9062, 0.66, 0.6);
  stroke(ctx, [[930, 715], [904, 738], [912, 760], [899, 787]], 1.8, 9063, 0.81, 0.65);
  mossDots(ctx, 849, 735, 48, 18, 9070, 0.7);
  mossDots(ctx, 922, 787, 58, 20, 9071, 0.55);
}

function paintReed(ctx) {
  stroke(ctx, [[127, 807], [137, 746], [135, 685], [148, 619], [169, 563]], 2.8, 9080, 0.88, 0.5);
  stroke(ctx, [[140, 715], [106, 682], [86, 641]], 1.6, 9081, 0.8, 0.2);
  stroke(ctx, [[140, 692], [173, 665], [205, 649]], 1.2, 9082, 0.86, 0.2);
  wetShape(ctx, new Path2D('M135 732 Q107 726 89 700 Q116 707 135 732 Z'), 0.91);
  wetShape(ctx, new Path2D('M140 693 Q160 659 194 644 Q173 675 140 693 Z'), 0.93);
  wetShape(ctx, new Path2D('M150 615 Q151 589 139 564 Q162 580 150 615 Z'), 0.89);
  wetShape(ctx, new Path2D('M155 598 Q177 584 183 561 Q187 586 155 598 Z'), 0.78);
  for (let index = 0; index < 7; index += 1) {
    const height = 550 + index * 3.7;
    stroke(ctx, [[167 + index * 0.2, height + 13], [176 + Math.sin(index / 6 * Math.PI) * 13, height - 1]], 1.3, 9090 + index, 0.6, 0.4);
  }
  brushMark(ctx, inkTip, 108, 806, 164, 806, 9, 0.5);
}

function paintBody(ctx) {
  const belly = new Path2D('M-169 -199 C-181 -214 -153 -240 -115 -252 C-78 -264 -37 -251 -14 -237 Q8 -239 13 -274 C17 -305 25 -337 50 -349 Q73 -361 92 -347 Q108 -335 94 -317 Q82 -307 70 -309 C59 -292 67 -266 48 -232 C31 -201 3 -178 -43 -173 Q-111 -164 -169 -199 Z');
  wetShape(ctx, belly, 0.28, '#5a6055', 2.4);
  const back = new Path2D('M-178 -200 C-180 -224 -139 -252 -109 -254 C-68 -260 -35 -250 -14 -237 C-48 -242 -83 -236 -104 -220 C-129 -199 -149 -192 -178 -200 Z');
  wetShape(ctx, back, 0.83, INK, 2.1);
  const wing = new Path2D('M-151 -218 C-131 -239 -95 -241 -60 -224 C-38 -216 -13 -191 20 -184 Q-40 -166 -87 -176 Q-135 -183 -151 -218 Z');
  wetShape(ctx, wing, 0.95, INK, 2.8);
  wetShape(ctx, new Path2D('M-174 -200 Q-199 -202 -209 -222 Q-190 -211 -168 -216 Z'), 0.87);
  wetShape(ctx, new Path2D('M15 -273 C13 -307 29 -340 49 -350 C67 -363 89 -352 96 -338 Q106 -324 88 -315 L73 -309 Q57 -288 57 -271 C54 -249 51 -230 34 -215 Q44 -252 34 -271 C30 -284 32 -312 43 -330 Q24 -305 24 -274 Z'), 0.93, INK, 1.8);
  stroke(ctx, [[-160, -197], [-121, -176], [-73, -171], [-37, -175]], 2.9, 9120, 0.85, 0.7);
  stroke(ctx, [[-144, -210], [-111, -216], [-76, -203], [-42, -193]], 2.8, 9121, 0.45, 0.9);
  ctx.save();
  ctx.globalAlpha = 0.65;
  ctx.strokeStyle = PAPER;
  ctx.lineWidth = 1.7;
  ctx.beginPath();
  ctx.moveTo(-130, -220);
  ctx.bezierCurveTo(-101, -228, -88, -214, -66, -205);
  ctx.stroke();
  ctx.lineWidth = 0.85;
  ctx.beginPath();
  ctx.moveTo(-119, -198);
  ctx.quadraticCurveTo(-90, -187, -64, -187);
  ctx.stroke();
  ctx.restore();
  const pouch = new Path2D('M91 -337 L244 -303 Q164 -282 89 -309 L73 -308 Q85 -320 91 -337 Z');
  wetShape(ctx, pouch, 0.18, INK, 0.8);
  stroke(ctx, [[91, -337], [157, -322], [244, -303]], 2.4, 9130, 0.95, 0.2);
  stroke(ctx, [[243, -303], [175, -294], [132, -298], [89, -309]], 1.5, 9131, 0.8, 0.45);
  stroke(ctx, [[91, -325], [155, -313], [238, -303]], 1.1, 9132, 0.8, 0.25);
  stroke(ctx, [[-111, -226], [-76, -226], [-34, -199], [16, -182], [101, -150]], 4.8, 9133, 0.85, 0.6);
  stroke(ctx, [[-27, -190], [16, -174], [65, -164], [101, -150]], 1.4, 9134, 0.75, 0.6);
  brushMark(ctx, inkTip, -150, -218, -58, -191, 37, 0.55);
}

function paintBicycle(ctx) {
  for (const center of [-135, 135]) {
    const rim = Array.from({ length: 81 }, (_, index) => [center + Math.cos(index / 80 * TAU) * 73, Math.sin(index / 80 * TAU) * 73]);
    stroke(ctx, rim, 4.3, 9150 + center, 0.96, 0.7);
    const inner = Array.from({ length: 65 }, (_, index) => [center + Math.cos(index / 64 * TAU) * 68.7, Math.sin(index / 64 * TAU) * 68.7]);
    stroke(ctx, inner, 0.7, 9151 + center, 0.7, 0.15);
  }
  stroke(ctx, [[-135, 0], [-60, -115], [-20, -4], [-135, 0]], 5, 9160, 0.95, 0.7);
  stroke(ctx, [[-60, -115], [80, -105], [-20, -4]], 4.3, 9161, 0.94, 0.55);
  stroke(ctx, [[135, 0], [80, -105], [73, -145], [101, -154], [115, -144]], 4.8, 9162, 0.95, 0.65);
  stroke(ctx, [[-60, -115], [-64, -137]], 4.7, 9163, 0.9, 0.45);
  brushMark(ctx, inkTip, -90, -140, -41, -139, 12, 0.95);
  stroke(ctx, [[-126, 5], [-22, 17], [-15, -23], [-127, -5]], 1.1, 9164, 0.7, 0.2);
}

export function eyeAt(localT) {
  const roll = smooth((localT - 2) / 0.3);
  return { roll, pupilX: lerp(4.5, -1.5, roll), pupilY: lerp(1, -6.2, roll) };
}

export function prepare({ brush }) {
  inkTip = tintMask(brush.charcoal, INK);
  const paper = xuanPaper(9000);
  const granulation = inkGranulation(9001);
  landscape = layer(2000, 1000, (ctx) => {
    ctx.drawImage(paper, 0, 0, 2000, 1000);
    ctx.fillStyle = 'rgba(255,254,246,0.19)';
    ctx.fillRect(0, 0, 2000, 1000);
    ctx.translate(500, 0);
    paintStone(ctx);
    paintReed(ctx);
    for (const [start, end, width, alpha] of [[-485, -320, 6, 0.38], [-190, -93, 4, 0.46], [195, 284, 5, 0.3], [386, 487, 3, 0.36], [665, 731, 3, 0.39], [1015, 1091, 4, 0.4], [1280, 1470, 5, 0.36]]) {
      brushMark(ctx, inkTip, start, ROAD_Y, end, ROAD_Y, width, alpha);
    }
    stroke(ctx, [[796, 804], [846, 807], [921, 805], [987, 802]], 1.4, 9180, 0.4, 0.65);
    mossDots(ctx, 151, 809, 37, 12, 9181, 0.35);
  });
  body = layer(620, 490, (ctx) => {
    ctx.translate(260, 420);
    paintBody(ctx);
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(granulation, -260, -420, 620, 490);
  }, 2);
  bicycle = layer(620, 520, (ctx) => {
    ctx.translate(260, 420);
    paintBicycle(ctx);
  }, 2);
}

export function renderAt(ctx) {
  ctx.drawImage(landscape, -500, 0, 2000, 1000);
}

export function renderRider(ctx, pose, { x: positionX, y: positionY, scale, localT }) {
  ctx.save();
  ctx.translate(positionX, positionY);
  ctx.scale(scale, scale);
  const limb = (knee, foot, width, alpha, seed) => {
    stroke(ctx, [[pose.hip.x, pose.hip.y], [knee.x, knee.y], [foot.x, foot.y]], width, seed, alpha, 0.45);
    stroke(ctx, [[foot.x - 8, foot.y + 3], [foot.x + 18, foot.y + 3]], width * 0.8, seed + 1, alpha, 0.35);
  };
  limb(pose.farKnee, pose.farFoot, 4.6, 0.43, 9200);
  ctx.drawImage(bicycle, -260, -420, 620, 520);
  for (const center of [-135, 135]) {
    for (let spoke = 0; spoke < 9; spoke += 1) {
      const angle = pose.wheelAngle + spoke / 9 * TAU;
      stroke(ctx, [[center, 0], [center + Math.cos(angle) * 68, Math.sin(angle) * 68]], 0.9, 9210 + spoke, 0.8, 0.2);
    }
    wetShape(ctx, new Path2D(`M${center - 3} -2 Q${center} -6 ${center + 4} -1 Q${center + 5} 4 ${center} 4 Q${center - 5} 3 ${center - 3} -2 Z`), 0.85, INK, 0.1);
  }
  stroke(ctx, [[pose.farFoot.x, pose.farFoot.y], [-20, -4], [pose.nearFoot.x, pose.nearFoot.y]], 2.9, 9230, 0.75, 0.4);
  ctx.save();
  ctx.translate(0, pose.bob * 0.7);
  ctx.drawImage(body, -260, -420, 620, 490);
  const eye = eyeAt(localT);
  ctx.save();
  ctx.translate(73, -335);
  ctx.rotate(-0.15 - eye.roll * 0.12);
  ctx.beginPath();
  ctx.ellipse(0, 0, 13.5, 10.3, 0, 0, TAU);
  ctx.fillStyle = '#faf6e8';
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.25;
  ctx.stroke();
  ctx.clip();
  ctx.beginPath();
  ctx.ellipse(eye.pupilX, eye.pupilY, 3.7, 4.4, -0.1, 0, TAU);
  ctx.fillStyle = INK;
  ctx.fill();
  ctx.restore();
  stroke(ctx, [[59, -342], [69, -347], [82, -344]], 2, 9240, 0.8, 0.3);
  ctx.restore();
  limb(pose.nearKnee, pose.nearFoot, 5.4, 0.95, 9250);
  stroke(ctx, [[pose.nearFoot.x - 11, pose.nearFoot.y + 8], [pose.nearFoot.x + 15, pose.nearFoot.y + 8]], 2.8, 9252, 0.94, 0.3);
  ctx.restore();
}

export function renderTitle(ctx, { x: titleX }) {
  text(ctx, '八 大 山 人 写 意', titleX + 4, 154, { size: 47, color: INK, weight: 600 });
  text(ctx, 'BADA SHANREN INK', titleX + 7, 199, { size: 22, color: '#62675b', family: SANS });
  text(ctx, '约 1690', titleX + 8, 242, { size: 25, color: '#53594e' });
  ctx.save();
  ctx.fillStyle = '#a64d3d';
  ctx.fillRect(titleX + 9, 273, 29, 33);
  ctx.fillStyle = PAPER;
  ctx.fillRect(titleX + 12, 277, 1, 23);
  ctx.fillRect(titleX + 20, 274, 4, 1);
  text(ctx, '行', titleX + 24, 299, { size: 21, color: PAPER, align: 'center' });
  ctx.restore();
}
