import { SCENES } from './catalog.js';
import { text, SANS } from '../kit/canvas.js';
import { seeded, smooth, lerp } from '../kit/math.js';
import { layer, xuanPaper, noise, pigmentPainter, tintMask, brushMark } from '../kit/materials.js';
import { ROAD_Y, TRAVEL_SPEED } from '../beat/timeline.js';

export const scene = SCENES[2];
export const finished = true;
export const TITLE_GLYPHS = '车马出行';
const INK = '#242925';
const PAPER = '#e7e3d6';
const GRAY = '#888b7e';
let stone;
let procession;
let patina;
let riderPrint;
let dryInk;

function fill(ctx, path, color = PAPER) {
  ctx.fillStyle = color;
  ctx.fill(typeof path === 'string' ? new Path2D(path) : path);
}

// Small fixed changes of direction resemble a broad knife worked on stone.
function cut(ctx, points, width = 2, seed = 300, color = PAPER) {
  const random = seeded(seed);
  ctx.beginPath();
  points.forEach(([x, y], i) => {
    if (!i) { ctx.moveTo(x, y); return; }
    const [px, py] = points[i - 1];
    const count = Math.max(1, Math.ceil(Math.hypot(x - px, y - py) / 11));
    for (let j = 1; j <= count; j += 1) {
      const f = j / count;
      const jitter = j === count ? 0 : (random() - 0.5) * Math.min(width * 0.75, 1.3);
      ctx.lineTo(lerp(px, x, f) + jitter, lerp(py, y, f) - jitter * 0.6);
    }
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = 'bevel';
  ctx.lineCap = 'butt';
  ctx.stroke();
}

function cloud(ctx, x, y, scale, flip = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale * flip, scale);
  const p = new Path2D('M-143 12 C-98 16 -91 -18 -53 -17 C-36 -70 17 -67 28 -33 C70 -55 112 -22 92 7 C80 27 45 21 49 5 C51 -7 69 -9 75 0 M-124 27 C-76 28 -57 3 -28 7 C-3 10 10 40 42 29 C62 49 96 38 115 19 C132 1 153 2 174 8 M-83 0 C-59 -3 -47 -36 -21 -33 C-6 -31 -3 -20 -8 -10 C-17 6 -36 -2 -31 -13 M2 -3 C16 -25 36 -21 39 -5');
  ctx.strokeStyle = PAPER;
  ctx.lineWidth = 3.2;
  ctx.stroke(p);
  ctx.lineWidth = 1.1;
  ctx.translate(0, 6);
  ctx.stroke(p);
  ctx.restore();
}

function wheel(ctx, x, y, r, phase, seed) {
  ctx.save();
  ctx.translate(x, y);
  for (let i = 0; i < 16; i += 1) {
    const a = i / 16 * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(0, 0, r, a + 0.012, a + Math.PI / 8 - 0.018);
    ctx.strokeStyle = PAPER;
    ctx.lineWidth = 4.6;
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(0, 0, r - 7, 0, Math.PI * 2);
  ctx.strokeStyle = GRAY;
  ctx.lineWidth = 1.25;
  ctx.stroke();
  for (let i = 0; i < 14; i += 1) {
    const angle = phase + i / 14 * Math.PI * 2;
    cut(ctx, [[0, 0], [Math.cos(angle) * (r - 5), Math.sin(angle) * (r - 5)]], 1.8, seed + i);
  }
  fill(ctx, 'M-8 -6 L3 -9 L10 -3 L7 6 L-5 9 L-10 2 Z');
  ctx.restore();
}

function horseBody(ctx, x, scale, seed) {
  ctx.save();
  ctx.translate(x, ROAD_Y);
  ctx.scale(scale, scale);
  fill(ctx, 'M-137 -169 C-137 -197 -116 -216 -83 -217 C-46 -227 -1 -218 28 -210 L57 -228 Q73 -259 81 -284 L82 -310 L92 -324 L104 -301 Q123 -303 135 -284 L166 -266 Q184 -261 181 -247 L169 -236 L140 -239 L118 -222 Q112 -192 105 -171 Q87 -130 42 -129 L-66 -132 Q-108 -133 -130 -151 Z');
  fill(ctx, 'M-129 -199 C-162 -220 -184 -192 -181 -165 Q-180 -135 -199 -119 C-171 -124 -162 -146 -164 -168 Q-161 -193 -131 -183 Z');
  fill(ctx, 'M43 -219 Q61 -247 76 -283 L80 -305 L85 -285 L76 -254 L68 -223 Z', INK);
  for (let i = 0; i < 9; i += 1) cut(ctx, [[72 + i * 2, -280 + i * 5], [83 + i * 2, -272 + i * 5]], 1.7, seed + i, INK);
  cut(ctx, [[-115, -192], [-83, -202], [-38, -204], [10, -197]], 2, seed, INK);
  cut(ctx, [[-80, -148], [-37, -145], [7, -150], [29, -160]], 1.7, seed + 1, INK);
  cut(ctx, [[53, -215], [48, -188], [66, -163], [82, -154]], 2.8, seed + 2, INK);
  cut(ctx, [[-111, -205], [-93, -181], [-104, -151]], 2.4, seed + 3, INK);
  cut(ctx, [[106, -290], [118, -267], [137, -260]], 1.7, seed + 4, INK);
  cut(ctx, [[143, -246], [171, -247]], 1.7, seed + 5, INK);
  fill(ctx, 'M121 -279 L127 -282 L129 -277 L124 -273 Z', INK);
  fill(ctx, 'M167 -258 L173 -256 L171 -252 L166 -252 Z', INK);
  cut(ctx, [[110, -286], [140, -238], [157, -242]], 2.5, seed + 6, INK);
  cut(ctx, [[104, -219], [56, -172], [-33, -167], [-119, -176]], 3.1, seed + 7, INK);
  cut(ctx, [[85, -218], [57, -188], [-44, -186], [-125, -192]], 1.4, seed + 8, INK);
  for (let i = 0; i < 9; i += 1) cut(ctx, [[-58 + i * 11, -196], [-54 + i * 11, -175]], 1, seed + 20 + i, INK);
  cut(ctx, [[84, -207], [114, -190], [91, -140]], 5.2, seed + 40, INK);
  cut(ctx, [[84, -207], [114, -190], [91, -140]], 1.3, seed + 40);
  ctx.restore();
}

function horseLegs(ctx, x, scale, localT, seed) {
  const walk = Math.sin(localT * Math.PI * 2 + seed) * 10;
  ctx.save();
  ctx.translate(x, ROAD_Y);
  ctx.scale(scale, scale);
  const leg = (a, b, c, width, shade) => {
    fill(ctx, `M${a[0] - width} ${a[1]} L${a[0] + width} ${a[1]} L${b[0] + 5} ${b[1]} L${c[0] + 5} ${c[1] - 8} L${c[0] + 14} ${c[1] - 4} L${c[0] + 12} ${c[1]} L${c[0] - 8} ${c[1]} L${b[0] - 5} ${b[1]} Z`, shade);
    cut(ctx, [a, b, [c[0], c[1] - 10]], 1.4, seed, INK);
  };
  leg([-105, -151], [-126, -74], [-109 + walk, 0], 8, GRAY);
  leg([62, -157], [83, -82], [70 - walk, 0], 8, GRAY);
  leg([-88, -150], [-62, -82], [-83 - walk, 0], 10, PAPER);
  leg([83, -159], [112, -83], [119 + walk, 0], 10, PAPER);
  ctx.restore();
}

function cart(ctx, x, seed) {
  ctx.save();
  ctx.translate(x, ROAD_Y);
  fill(ctx, 'M-89 -183 L100 -183 L107 -133 L-81 -133 Z');
  fill(ctx, 'M-78 -174 L89 -174 L93 -143 L-75 -143 Z', INK);
  for (let i = 0; i < 9; i += 1) cut(ctx, [[-71 + i * 19, -173], [-67 + i * 19, -145]], 2.2, seed + i);
  cut(ctx, [[-97, -132], [111, -132]], 6, seed);
  cut(ctx, [[2, -133], [0, -73]], 7, seed + 1);
  cut(ctx, [[96, -140], [240, -162], [397, -159]], 6, seed + 2);
  cut(ctx, [[96, -155], [240, -180], [390, -176]], 2, seed + 3);
  for (const px of [-72, 72]) cut(ctx, [[px, -183], [px, -328]], 5, seed + px);
  fill(ctx, 'M-126 -327 Q-67 -343 -22 -368 L10 -385 L32 -367 Q79 -344 125 -327 L112 -316 L-117 -316 Z');
  fill(ctx, 'M-99 -325 Q-46 -342 10 -370 Q61 -341 100 -325 Z', INK);
  cut(ctx, [[-113, -312], [-65, -307], [12, -309], [74, -307], [116, -312]], 2, seed + 5);
  for (let i = 0; i < 13; i += 1) cut(ctx, [[-111 + i * 18, -316], [-111 + i * 18, -299]], 2, seed + 20 + i);
  for (let i = 0; i < 8; i += 1) cut(ctx, [[-72 + i * 20, -337], [-61 + i * 16, -322]], 1.4, seed + 40 + i);
  fill(ctx, 'M37 -238 L53 -245 L71 -226 L80 -191 L93 -184 L37 -184 L28 -202 Z');
  cut(ctx, [[42, -231], [49, -202], [68, -187]], 1.7, seed + 70, INK);
  cut(ctx, [[52, -222], [73, -209], [99, -221]], 9, seed + 71);
  cut(ctx, [[52, -222], [73, -209], [99, -221]], 1.5, seed + 72, INK);
  ctx.restore();
}

function driver(ctx, x, localT, front) {
  const turn = front ? smooth((localT - 2.1) / 0.45) * (1 - smooth((localT - 3.65) / 0.5)) : 0;
  const direction = 1 - turn * 2;
  ctx.save();
  ctx.translate(x + 50, ROAD_Y - 256);
  fill(ctx, 'M-5 3 L7 3 L9 22 L-6 23 Z');
  ctx.fillStyle = PAPER;
  ctx.beginPath();
  ctx.ellipse(0, -5, 12, 17, 0, 0, Math.PI * 2);
  ctx.fill();
  fill(ctx, `M${direction * 7} -12 L${direction * 22} -3 L${direction * 10} 3 Z`);
  fill(ctx, 'M-17 -20 L-11 -29 L11 -29 L17 -20 L22 -17 L-20 -17 Z');
  cut(ctx, [[-8, -24], [9, -24]], 1.4, 3390, INK);
  fill(ctx, `M${direction * 4 - 2} -10 L${direction * 4 + 2} -10 L${direction * 4 + 2} -7 L${direction * 4 - 2} -7 Z`, INK);
  cut(ctx, [[direction * 9, 3], [direction * 15, 2]], 1.3, 3391, INK);
  cut(ctx, [[-3, 10], [direction * 7, 14]], 1.6, 3392, INK);
  ctx.restore();
  cut(ctx, [[x + 99, ROAD_Y - 221], [x + 227, ROAD_Y - 241], [x + 420, ROAD_Y - 215]], 1.3, 3393);
}

function staffBearer(ctx, localT) {
  const greeting = smooth((localT - 2.18) / 0.38) * (1 - smooth((localT - 3.55) / 0.42));
  ctx.save();
  ctx.translate(245, ROAD_Y);
  fill(ctx, 'M-16 -216 L6 -217 L24 -195 L19 -144 L40 -49 L-45 -49 L-27 -150 L-28 -193 Z');
  fill(ctx, 'M-21 -47 L-9 -47 L-12 -7 L-2 -4 L-2 0 L-25 0 Z');
  fill(ctx, 'M13 -47 L24 -47 L29 -6 L42 -4 L42 0 L17 0 Z');
  cut(ctx, [[-15, -199], [-5, -158], [-17, -61]], 2, 3410, INK);
  cut(ctx, [[7, -190], [2, -150], [24, -60]], 2, 3411, INK);
  cut(ctx, [[-29, -144], [18, -144]], 4.5, 3412, INK);
  cut(ctx, [[-31, -59], [29, -59]], 1.6, 3413, INK);
  fill(ctx, 'M-14 -221 L-17 -240 L-10 -256 L4 -259 L15 -246 L19 -234 L7 -225 L5 -215 Z');
  fill(ctx, 'M-23 -253 L-14 -268 L9 -268 L20 -256 L16 -251 Z');
  fill(ctx, 'M6 -244 L10 -244 L10 -240 L6 -240 Z', INK);
  cut(ctx, [[9, -230], [17, -232]], 1.4, 3414, INK);
  cut(ctx, [[-20, -201], [-42, -183], [-37, -163]], 10, 3415);
  cut(ctx, [[-20, -201], [-42, -183], [-37, -163]], 1.6, 3416, INK);
  const elbow = [lerp(37, 42, greeting), lerp(-180, -218, greeting)];
  const hand = [lerp(49, 43, greeting), lerp(-197, -262, greeting)];
  cut(ctx, [[15, -203], elbow, hand], 10, 3417);
  cut(ctx, [[15, -203], elbow, hand], 1.4, 3418, INK);
  for (let i = 0; i < 3; i += 1) cut(ctx, [[hand[0] - 3 + i * 3, hand[1] + 1], [hand[0] - 5 + i * 4, hand[1] - 9]], 2.2, 3419 + i);
  cut(ctx, [[-37, -7], [-37, -318]], 4.2, 3423);
  fill(ctx, 'M-45 -318 L-37 -335 L-29 -318 L-35 -306 L-42 -306 Z');
  for (let i = 0; i < 4; i += 1) {
    const y = -298 + i * 21;
    fill(ctx, `M-37 ${y} L-62 ${y + 1} L-54 ${y + 9} L-64 ${y + 14} L-38 ${y + 10} Z`);
  }
  ctx.restore();
}

function bird(ctx, x, y, wing, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  fill(ctx, `M-28 7 Q-13 ${-15 - wing} 3 -5 Q11 ${-28 + wing} 35 -19 L16 2 L1 9 L-10 9 L-25 17 L-16 6 Z`);
  cut(ctx, [[-16, 5], [2, 2], [20, -13]], 1.5, 3430, INK);
  ctx.restore();
}

export function prepare({ brush }) {
  const paper = xuanPaper(3301);
  dryInk = tintMask(brush.charcoal, PAPER);
  riderPrint = pigmentPainter(600, 550, 3302);
  stone = layer(2000, 1000, (ctx) => {
    ctx.drawImage(paper, 0, 0);
    ctx.fillStyle = INK;
    ctx.fillRect(0, 0, 2000, 1000);
    const random = seeded(3303);
    for (let i = 0; i < 12000; i += 1) {
      const x = random() * 2000;
      const y = random() * 1000;
      const n = noise(x / 93, y / 67, 3305);
      ctx.fillStyle = `rgba(231,227,214,${0.015 + n * 0.06})`;
      ctx.fillRect(x, y, 0.4 + random() * 4.5, 0.3 + random() * 2);
    }
    ctx.globalAlpha = 0.095;
    ctx.drawImage(paper, 0, 0);
    ctx.globalAlpha = 1;
    ctx.translate(500, 0);
    cut(ctx, [[-500, 77], [1500, 77]], 3.3, 3306);
    cut(ctx, [[-500, 125], [1500, 125]], 2.2, 3307);
    for (let x = -500; x < 1500; x += 52) cut(ctx, [[x, 85], [x + 39, 85], [x + 39, 117], [x + 10, 117], [x + 10, 95], [x + 28, 95], [x + 28, 107], [x + 20, 107]], 2.6, 3308 + x);
    ctx.save();
    ctx.globalAlpha = 0.67;
    cloud(ctx, -236, 242, 0.72);
    cloud(ctx, 596, 235, 0.88);
    cloud(ctx, 1194, 228, 1.04, -1);
    cloud(ctx, 1461, 397, 0.48);
    cut(ctx, [[-480, 354], [-330, 354], [-269, 354]], 1.2, 3310);
    cut(ctx, [[808, 353], [1094, 353], [1459, 353]], 1.2, 3311);
    bird(ctx, 797, 350, 9, 0.8);
    bird(ctx, 873, 324, -4, 0.54);
    ctx.restore();
    cut(ctx, [[-500, ROAD_Y], [1500, ROAD_Y]], 3.3, 3312);
    cut(ctx, [[-500, 817], [1500, 817]], 0.8, 3313);
    for (let x = -500; x < 1500; x += 137) brushMark(ctx, dryInk, x, ROAD_Y + 1, x + 124, ROAD_Y + 1, 8, 0.29);
    cut(ctx, [[-500, 877], [1500, 877]], 2.1, 3314);
    cut(ctx, [[-500, 924], [1500, 924]], 2.3, 3315);
    for (let x = -510; x < 1520; x += 77) {
      cut(ctx, [[x, 914], [x + 18, 889], [x + 38, 914], [x + 58, 889], [x + 77, 914]], 2.8, 3316 + x);
      cut(ctx, [[x + 19, 913], [x + 38, 890], [x + 57, 913]], 0.9, 3317 + x);
    }
    for (let i = 0; i < 115; i += 1) {
      const x = -500 + random() * 2000;
      const y = 828 + random() * 29;
      cut(ctx, [[x, y], [x + random() * 13 + 2, y - 1]], 0.6, 3400 + i, GRAY);
    }
  }, 1.5);
  procession = layer(2000, 1000, (ctx) => {
    ctx.translate(500, 0);
    cart(ctx, -263, 3500);
    horseBody(ctx, 46, 0.86, 3600);
    cart(ctx, 995, 3700);
    horseBody(ctx, 1304, 0.86, 3800);
  }, 1.5);
  patina = layer(2000, 1000, (ctx) => {
    const random = seeded(3900);
    for (let i = 0; i < 9500; i += 1) {
      const x = random() * 2000;
      const y = random() * 1000;
      ctx.fillStyle = i % 5 === 0 ? 'rgba(231,227,214,0.13)' : 'rgba(36,41,37,0.38)';
      ctx.fillRect(x, y, 0.4 + random() * 2.3, 0.35 + random() * 1.4);
    }
    for (let i = 0; i < 62; i += 1) {
      const x = random() * 2000;
      const y = random() * 1000;
      cut(ctx, [[x, y], [x + 3, y - 7], [x + 5, y - 7], [x + 7, y - 15]], 0.7, 4000 + i, 'rgba(231,227,214,0.19)');
    }
  });
}

export function renderAt(ctx, { localT, pose }) {
  ctx.drawImage(stone, -500, 0, 2000, 1000);
  // The procession travels with its guest: its opening never closes over a wheel.
  ctx.save();
  ctx.translate((localT - 3) * TRAVEL_SPEED, 0);
  horseLegs(ctx, 46, 0.86, localT, 1);
  horseLegs(ctx, 1304, 0.86, localT, 2);
  ctx.drawImage(procession, -500, 0, 2000, 1000);
  wheel(ctx, -263, ROAD_Y - 73, 73, pose.wheelAngle, 3550);
  wheel(ctx, 995, ROAD_Y - 73, 73, pose.wheelAngle, 3750);
  driver(ctx, -263, localT, false);
  driver(ctx, 995, localT, true);
  staffBearer(ctx, localT);
  ctx.restore();
  const fly = smooth((localT - 4) / 2);
  bird(ctx, 1150 + fly * 210, 404 - fly * 35, Math.sin(localT * 7) * 13, 0.63);
  bird(ctx, 1210 + fly * 200, 432 - fly * 28, Math.sin(localT * 7 + 1) * 13, 0.42);
  ctx.drawImage(patina, -500, 0, 2000, 1000);
}

export function renderRider(ctx, pose, { x, y, scale = 1 }) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  riderPrint(ctx, (p) => {
    const leg = (knee, foot, width, color) => cut(p, [[pose.hip.x, pose.hip.y], [knee.x, knee.y], [foot.x, foot.y]], width, 4100, color);
    leg(pose.farKnee, pose.farFoot, 7, GRAY);
    for (const cx of [-135, 135]) wheel(p, cx, 0, 73, pose.wheelAngle, 4120 + cx);
    cut(p, [[-135, 0], [-60, -115], [-20, -4], [-135, 0]], 5.3, 4140);
    cut(p, [[-60, -115], [80, -105], [-20, -4]], 5.3, 4141);
    cut(p, [[135, 0], [80, -105], [73, -146], [106, -154]], 5.3, 4142);
    cut(p, [[-60, -115], [-64, -139], [-88, -139], [-42, -139]], 5.3, 4143);
    cut(p, [[pose.farFoot.x, pose.farFoot.y], [-20, -4], [pose.nearFoot.x, pose.nearFoot.y]], 3.8, 4144);
    p.save();
    p.translate(0, pose.bob * 0.6);
    fill(p, 'M-163 -198 L-183 -218 L-157 -218 Q-125 -257 -79 -255 Q-44 -259 -17 -241 L5 -257 Q-4 -286 7 -311 Q19 -347 54 -354 Q85 -357 99 -334 L91 -314 Q61 -301 66 -276 Q68 -244 43 -216 Q13 -180 -38 -171 Q-108 -166 -163 -198 Z');
    fill(p, 'M89 -336 L238 -304 L220 -298 Q150 -285 87 -307 L69 -284 L60 -291 Q80 -315 89 -336 Z');
    cut(p, [[90, -322], [228, -303]], 2, 4145, INK);
    cut(p, [[88, -307], [119, -299], [156, -296], [198, -299]], 1.2, 4146, INK);
    fill(p, 'M64 -339 L72 -340 L75 -335 L69 -330 L63 -332 Z', INK);
    cut(p, [[27, -324], [18, -298], [27, -270], [19, -240]], 2.4, 4147, INK);
    cut(p, [[-137, -219], [-113, -239], [-76, -236], [-33, -212], [15, -187], [104, -149]], 8, 4148);
    cut(p, [[-134, -224], [-105, -232], [-64, -215], [-23, -190], [31, -170], [99, -151]], 2.4, 4149, INK);
    for (let i = 0; i < 7; i += 1) cut(p, [[-126 + i * 18, -225 + i * 4], [-120 + i * 18, -207 + i * 3], [-104 + i * 17, -190 + i * 2]], 1.8, 4150 + i, INK);
    cut(p, [[-143, -192], [-101, -180], [-48, -179], [-10, -189]], 1.7, 4160, INK);
    for (let i = 0; i < 4; i += 1) cut(p, [[-163 + i * 8, -213], [-151 + i * 8, -201]], 1.5, 4161 + i, INK);
    p.restore();
    leg(pose.nearKnee, pose.nearFoot, 7.5, PAPER);
    leg(pose.nearKnee, pose.nearFoot, 1.5, INK);
    cut(p, [[pose.nearFoot.x - 9, pose.nearFoot.y + 4], [pose.nearFoot.x + 19, pose.nearFoot.y + 4]], 5, 4170);
  });
  ctx.restore();
}

export function renderTitle(ctx, { x }) {
  ctx.save();
  ctx.fillStyle = PAPER;
  ctx.fillRect(x - 12, 145, 478, 186);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.4;
  ctx.strokeRect(x - 6, 151, 466, 174);
  text(ctx, scene.zh, x + 13, 214, { size: 54, color: INK, weight: 600 });
  text(ctx, 'HAN STONE RUBBING', x + 16, 254, { size: 22, color: INK, family: SANS });
  text(ctx, '约 100  ·  车马出行', x + 16, 296, { size: 24, color: INK });
  ctx.fillStyle = '#99483b';
  ctx.fillRect(x + 414, 277, 25, 25);
  ctx.strokeStyle = PAPER;
  ctx.lineWidth = 1.2;
  ctx.strokeRect(x + 419, 282, 15, 15);
  cut(ctx, [[x + 421, 287], [x + 431, 287], [x + 426, 287], [x + 426, 295]], 1, 4180);
  ctx.restore();
}
