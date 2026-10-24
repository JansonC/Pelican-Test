import { SCENES } from './catalog.js';
import { text, line, SANS } from '../kit/canvas.js';
import { seeded, smooth, lerp } from '../kit/math.js';
import { layer, xuanPaper } from '../kit/materials.js';
import { ROAD_Y } from '../beat/timeline.js';
import { CUES } from '../beat/events.js';

export const scene = SCENES[12];
export const finished = true;
export const TITLE_GLYPHS = '呐喊波桥惊魂约';

const ORANGE = '#bc6348';
const CORAL = '#d87854';
const SKY = '#e49a65';
const BLUE = '#344f4b';
const DEEP_BLUE = '#263f42';
const OCHRE = '#d2ab69';
const PLUM = '#654b58';
const INK = '#332f36';
const TAU = Math.PI * 2;
let backdrop;
let pelicanBody;

const walkers = [
  { x: 846, y: 666, scale: 1.03, coat: '#514650', scarf: '#d3a15e', hand: 1 },
  { x: 1086, y: 620, scale: 0.88, coat: '#41565b', scarf: '#b9604d', hand: -1 },
];

function pathShape(ctx, description, fill, stroke = INK, width = 1) {
  const path = typeof description === 'string' ? new Path2D(description) : description;
  if (fill) { ctx.fillStyle = fill; ctx.fill(path); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(path); }
}

function polygon(ctx, points, fill, stroke = INK, width = 1) {
  const path = new Path2D();
  points.forEach(([pointX, pointY], index) => index ? path.lineTo(pointX, pointY) : path.moveTo(pointX, pointY));
  path.closePath();
  pathShape(ctx, path, fill, stroke, width);
}

function ellipse(ctx, centerX, centerY, radiusX, radiusY, fill, stroke = INK, width = 1, angle = 0) {
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radiusX, radiusY, angle, 0, TAU);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
}

function drawWaveSky(ctx, random) {
  ctx.fillStyle = SKY;
  ctx.fillRect(-500, 0, 2000, 480);
  const bands = [
    { baseline: 84, amplitude: 24, fill: '#b95f4d', stroke: '#914e49' },
    { baseline: 169, amplitude: 29, fill: ORANGE, stroke: '#aa5b4b' },
    { baseline: 264, amplitude: 28, fill: '#e0a45f', stroke: '#b96d4f' },
    { baseline: 361, amplitude: 35, fill: '#c9654d', stroke: '#984f48' },
  ];
  for (const band of bands) {
    const upper = [];
    const lower = [];
    for (let index = 0; index <= 44; index += 1) {
      const pointX = -520 + index * 46;
      const pointY = band.baseline + Math.sin(index * 0.67 + random() * 0.2) * band.amplitude;
      upper.push([pointX, pointY]);
      lower.push([pointX, pointY + 89 + Math.sin(index * 0.41) * 9]);
    }
    polygon(ctx, [...upper, ...lower.reverse()], band.fill, band.stroke, 2.1);
    line(ctx, upper, '#f0b36c', 1.2);
  }
  for (let cloud = 0; cloud < 28; cloud += 1) {
    const pointX = -480 + random() * 1950;
    const pointY = 36 + random() * 350;
    line(ctx, [[pointX, pointY], [pointX + 38 + random() * 62, pointY - 11], [pointX + 83 + random() * 58, pointY + 2]], 'rgba(111,62,70,0.28)', 1.2);
  }
}

function drawRiver(ctx) {
  polygon(ctx, [[-500, 415], [1500, 415], [1500, 727], [-500, 727]], '#4a7471', '#294c4d', 2.5);
  for (let ripple = 0; ripple < 47; ripple += 1) {
    const pointX = -500 + (ripple * 127) % 2020;
    const pointY = 454 + (ripple * 83) % 229;
    line(ctx, [[pointX, pointY], [pointX + 31, pointY - 4], [pointX + 76, pointY + 1]], 'rgba(206,185,132,0.56)', 1.2);
  }
  polygon(ctx, [[-500, 426], [-350, 391], [-198, 425], [-31, 397], [117, 421], [262, 388], [425, 423], [592, 391], [738, 425], [902, 394], [1061, 425], [1228, 390], [1500, 421], [1500, 487], [-500, 487]], '#7a8274', '#3f514e', 1.4);
  polygon(ctx, [[-500, 681], [-337, 650], [-188, 675], [-24, 647], [137, 681], [297, 650], [462, 679], [612, 645], [782, 681], [951, 652], [1107, 679], [1282, 647], [1500, 680], [1500, 803], [-500, 803]], '#87735d', '#4a4b46', 2);
  for (let reed = -465; reed < 1470; reed += 52) {
    const stemHeight = 18 + ((reed * 17) % 23 + 23) % 23;
    line(ctx, [[reed, 704], [reed - 4, 704 - stemHeight]], '#4c5b4c', 1.1);
    line(ctx, [[reed - 2, 704 - stemHeight + 3], [reed + 10, 704 - stemHeight - 3]], '#59644f', 0.8);
  }
}

function drawBoardwalk(ctx, random) {
  polygon(ctx, [[-500, 800], [1500, 800], [1500, 934], [-500, 934]], '#9c795d', '#443e3c', 2.3);
  for (let plank = -500; plank <= 1500; plank += 42) {
    const skew = 12 + random() * 9;
    line(ctx, [[plank, 799], [plank + skew, 935]], '#4f4743', 1.3);
    line(ctx, [[plank + 2, 814], [plank + 33, 813]], 'rgba(238,191,124,0.35)', 0.9);
  }
  line(ctx, [[-500, 800], [1500, 800]], '#2d3737', 4);
  line(ctx, [[-500, 934], [1500, 934]], '#493f3d', 2.4);
  for (let post = -470; post < 1490; post += 126) {
    line(ctx, [[post, 797], [post + 8, 946]], '#443a39', 4);
    ellipse(ctx, post + 8, 797, 5, 4, '#d1a66b', '#453c3b', 1);
  }
}

export function waveTensionAt(localT) {
  return smooth((localT - (CUES.scream - scene.start)) / 0.45) * (1 - smooth((localT - 4.35) / 0.65));
}

export function pedestrianAt(localT, index = 0) {
  const alarm = smooth((localT - (CUES.scream - scene.start) - index * 0.13) / 0.32);
  const mouth = alarm * (1 - smooth((localT - 4.65) / 0.65) * 0.18);
  return { alarm, mouth, hand: lerp(0, 1, alarm) };
}

function drawWalker(ctx, walker, localT, index) {
  const state = pedestrianAt(localT, index);
  const side = walker.hand;
  ctx.save();
  ctx.translate(walker.x, walker.y);
  ctx.scale(walker.scale, walker.scale);
  ellipse(ctx, 0, 2, 30, 5, 'rgba(34,37,36,0.23)', null);
  pathShape(ctx, 'M-24 -108 Q-35 -94 -29 -26 Q-2 -13 27 -26 L21 -104 Q10 -119 -24 -108 Z', walker.coat, '#2f3840', 1.2);
  line(ctx, [[-22, -87], [22, -87]], walker.scarf, 6);
  line(ctx, [[-22, -82], [20, -82]], '#e1b776', 0.9);
  for (let fold = 0; fold < 5; fold += 1) line(ctx, [[-20 + fold * 10, -76], [-24 + fold * 11, -27]], 'rgba(235,192,130,0.5)', 0.8);
  ellipse(ctx, -4, -143, 17, 21, '#c18f71', '#3b383a', 1);
  pathShape(ctx, 'M-22 -147 Q-12 -164 8 -157 Q22 -154 24 -140 Q7 -147 -21 -138 Z', '#413b42', '#312e34', 1);
  if (state.mouth > 0.08) ellipse(ctx, 0, -130, 7 + state.mouth * 2, 4 + state.mouth * 5, '#292a2d', '#3b2c31', 0.8);
  else line(ctx, [[-5, -130], [5, -130]], '#523b3b', 1.2);
  ellipse(ctx, -8, -145, 2.3, 1.4, '#ede1bd', null);
  ellipse(ctx, 7, -145, 2.3, 1.4, '#ede1bd', null);
  ellipse(ctx, -8 + state.alarm * 2, -145, 0.8, 1, INK, null);
  ellipse(ctx, 7 + state.alarm * 2, -145, 0.8, 1, INK, null);
  const handY = lerp(-74, -141, state.hand);
  line(ctx, [[side * 18, -88], [side * 34, lerp(-72, -113, state.hand)], [side * 26, handY]], '#2d3538', 12);
  line(ctx, [[side * 18, -88], [side * 34, lerp(-72, -113, state.hand)], [side * 26, handY]], walker.coat, 8);
  ellipse(ctx, side * 26, handY, 6, 5, '#c18f71', '#3b383a', 0.7);
  line(ctx, [[-14, -26], [-23, 0]], '#342f33', 5);
  line(ctx, [[14, -26], [24, 0]], '#342f33', 5);
  line(ctx, [[-32, 1], [-13, 1]], '#252a2d', 4);
  line(ctx, [[14, 1], [34, 1]], '#252a2d', 4);
  ctx.restore();
}

function drawDistortion(ctx, localT) {
  const tension = waveTensionAt(localT);
  if (tension <= 0) return;
  ctx.save();
  ctx.globalAlpha = tension * 0.72;
  const lineData = [
    { y: 426, color: '#f1bd77', width: 2 },
    { y: 489, color: '#a8b08d', width: 1.4 },
    { y: 684, color: '#c19d72', width: 1.6 },
  ];
  for (const data of lineData) {
    const points = [];
    for (let index = 0; index <= 39; index += 1) {
      const pointX = -500 + index * 52;
      points.push([pointX, data.y + Math.sin(index * 0.92 + localT * 4.8) * 18 * tension + Math.sin(index * 0.28) * 4]);
    }
    line(ctx, points, data.color, data.width);
  }
  ctx.restore();
}

function paintPelican(ctx) {
  pathShape(ctx, 'M-150 -190 Q-188 -206 -206 -232 Q-168 -222 -141 -254 C-108 -285 -58 -285 -20 -257 Q7 -238 13 -277 C9 -325 28 -366 61 -375 Q95 -378 101 -350 Q108 -328 84 -313 C60 -294 75 -250 48 -211 Q8 -159 -61 -166 Q-112 -166 -150 -190 Z', '#f0dfc1', '#292e31', 3.2);
  pathShape(ctx, 'M83 -356 L315 -310 Q210 -288 89 -321 Q62 -305 53 -284 Q65 -323 83 -356 Z', '#d4a665', '#403638', 2.2);
  line(ctx, [[93, -344], [295, -309]], '#8d6846', 2);
  ellipse(ctx, 74, -350, 4, 4, '#e2c79e', '#2e3030', 1.3);
  ellipse(ctx, 75, -350, 1.5, 1.7, INK, null);
  pathShape(ctx, 'M-134 -252 Q-99 -275 -72 -254 Q-28 -225 27 -202 Q75 -180 112 -163 Q55 -163 -2 -180 Q-105 -178 -151 -218 Q-164 -238 -134 -252 Z', '#e4cbaa', '#444143', 2);
  for (let feather = 0; feather < 13; feather += 1) {
    const fraction = feather / 12;
    const startX = -126 + fraction * 88;
    const startY = -246 + fraction * 34;
    line(ctx, [[startX, startY], [startX + 54, startY + 33 + Math.sin(fraction * Math.PI) * 9], [startX + 135, startY + 44]], '#9e6e59', 1.2);
  }
  pathShape(ctx, 'M-91 -250 Q-34 -266 5 -232', null, '#b45f52', 2.2);
  pathShape(ctx, 'M-62 -227 Q-4 -248 40 -202', null, '#734f59', 1.5);
}

function drawPelicanRider(ctx, pose, positionX, positionY, scale) {
  ctx.save();
  ctx.translate(positionX, positionY);
  ctx.scale(scale, scale);
  const limb = (knee, foot, color, width) => {
    line(ctx, [[pose.hip.x, pose.hip.y], [knee.x, knee.y], [foot.x, foot.y]], '#343134', width + 1.2);
    line(ctx, [[pose.hip.x, pose.hip.y], [knee.x, knee.y], [foot.x, foot.y]], color, width);
    line(ctx, [[foot.x - 10, foot.y + 6], [foot.x + 20, foot.y + 6]], '#3f3539', width * 0.72);
  };
  limb(pose.farKnee, pose.farFoot, '#8d5e51', 4.2);
  for (const centerX of [-135, 135]) {
    ellipse(ctx, centerX, 0, 73, 73, null, '#33363a', 5);
    ellipse(ctx, centerX, 0, 68, 68, null, '#e1b06b', 1.3);
    for (let spoke = 0; spoke < 16; spoke += 1) {
      const angle = pose.wheelAngle + spoke / 16 * TAU;
      line(ctx, [[centerX, 0], [centerX + Math.cos(angle) * 66, Math.sin(angle) * 66]], '#474348', 1);
    }
    ellipse(ctx, centerX, 0, 4, 4, '#d09a5d', '#33363a', 1);
  }
  line(ctx, [[-135, 0], [-62, -115], [-20, -4], [-135, 0]], '#343134', 6);
  line(ctx, [[-62, -115], [80, -106], [-20, -4]], '#343134', 6);
  line(ctx, [[80, -106], [135, 0]], '#343134', 6);
  line(ctx, [[80, -106], [72, -147], [106, -154]], '#343134', 5);
  line(ctx, [[-88, -139], [-43, -139]], '#343134', 8);
  ellipse(ctx, -20, -4, 22, 22, null, '#bd6b55', 2);
  line(ctx, [[pose.farFoot.x, pose.farFoot.y], [-20, -4], [pose.nearFoot.x, pose.nearFoot.y]], '#9c684f', 3.2);
  ctx.save();
  ctx.translate(0, pose.bob * 0.8);
  ctx.rotate(Math.sin(pose.phase * 0.55) * 0.018);
  ctx.drawImage(pelicanBody, -250, -401, 620, 440);
  ctx.restore();
  limb(pose.nearKnee, pose.nearFoot, '#5f454a', 5);
  ctx.restore();
}

export function prepare() {
  const paper = xuanPaper(13013);
  backdrop = layer(2000, 1000, (ctx) => {
    const random = seeded(13015);
    ctx.fillStyle = '#c87455';
    ctx.fillRect(0, 0, 2000, 1000);
    ctx.globalAlpha = 0.2;
    ctx.drawImage(paper, 0, 0, 2000, 1000);
    ctx.globalAlpha = 1;
    ctx.translate(500, 0);
    drawWaveSky(ctx, random);
    drawRiver(ctx);
    drawBoardwalk(ctx, random);
    for (let post = -420; post < 1480; post += 90) {
      const height = 21 + random() * 22;
      line(ctx, [[post, 802], [post - 7, 802 - height]], '#394242', 2.2);
      line(ctx, [[post - 7, 802 - height], [post + 36, 792 - height]], '#46504b', 1.3);
    }
  });
  pelicanBody = layer(620, 440, (ctx) => {
    ctx.translate(270, 400);
    paintPelican(ctx);
  });
}

export function renderAt(ctx, { localT }) {
  ctx.drawImage(backdrop, -500, 0);
  drawDistortion(ctx, localT);
  walkers.forEach((walker, index) => drawWalker(ctx, walker, localT, index));
}

export function renderRider(ctx, pose, { x: positionX, y: positionY, scale = 1 }) {
  drawPelicanRider(ctx, pose, positionX, positionY, scale);
}

export function renderTitle(ctx, { x: titleX }) {
  ctx.save();
  ctx.fillStyle = 'rgba(238,190,126,0.94)';
  ctx.fillRect(titleX - 12, 111, 503, 163);
  ctx.strokeStyle = '#7b4c49';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(titleX - 5, 118, 489, 149);
  text(ctx, scene.zh, titleX + 14, 173, { size: 55, color: '#423640', weight: 600 });
  text(ctx, 'THE SCREAM', titleX + 17, 214, { size: 24, color: '#734d4d', family: SANS });
  text(ctx, '1893  ·  表现主义桥景', titleX + 17, 251, { size: 23, color: '#654b53' });
  line(ctx, [[titleX + 20, 260], [titleX + 166, 260]], '#b04f46', 2.2);
  ctx.restore();
}
