import { SCENES } from './catalog.js';
import { text, line, SANS, withAlpha } from '../kit/canvas.js';
import { seeded, smooth, lerp } from '../kit/math.js';
import { layer } from '../kit/materials.js';
import { ROAD_Y, clamp, STAGE_WIDTH } from '../beat/timeline.js';

export const scene = SCENES[18];
export const finished = true;
export const cameraAt = () => ({ zoom: 1, riderScale: 1 });
export const UI_GLYPHS = '沿途骑行竖屏短视频此刻循环今天也在路上原创骑行路过的鹈鹕这个踏频很稳从岩画刷到这里本人还在赶路第站关注';
let city;

function fillPath(ctx, path, fill, stroke, width = 1) {
  const p = new Path2D(path);
  ctx.fillStyle = fill;
  ctx.fill(p);
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(p); }
}

function round(ctx, x, y, w, h, r, fill) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
}

function tree(ctx, x, y, size) {
  line(ctx, [[x, y], [x, y - size * 0.7]], '#425d4b', size * 0.035);
  const greens = ['#3d6d5d', '#507b60', '#6e956e'];
  for (let i = 0; i < 3; i += 1) {
    ctx.fillStyle = greens[i];
    ctx.beginPath();
    ctx.ellipse(x + (i - 1) * size * 0.18, y - size * (0.68 + (i % 2) * 0.16), size * 0.3, size * 0.37, (i - 1) * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
  line(ctx, [[x, y - size * 0.28], [x - size * 0.18, y - size * 0.64]], 'rgba(215,218,166,0.4)', 1.2);
}

export function prepare() {
  city = layer(2000, 1000, (ctx) => {
    const sky = ctx.createLinearGradient(0, 0, 0, 800);
    sky.addColorStop(0, '#b4d9d2');
    sky.addColorStop(0.55, '#e6e5c4');
    sky.addColorStop(1, '#f4d3a8');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 2000, 1000);
    ctx.translate(500, 0);
    ctx.fillStyle = '#f6e7bd';
    ctx.beginPath();
    ctx.arc(693, 325, 73, 0, Math.PI * 2);
    ctx.fill();
    const clouds = [[-300, 355, 160], [20, 291, 110], [310, 330, 152], [1045, 300, 140], [1470, 364, 130]];
    for (const [x, y, w] of clouds) {
      round(ctx, x, y, w, 12, 6, 'rgba(255,249,217,0.42)');
      round(ctx, x + w * 0.3, y - 11, w * 0.6, 19, 12, 'rgba(255,249,217,0.42)');
    }
    const random = seeded(2026);
    for (let x = -500; x < 1500; x += 65) {
      const h = 45 + random() * 100;
      round(ctx, x, 617 - h, 53, h, 4, random() > 0.5 ? '#b2c1ab' : '#a5baa5');
    }
    // Independent waterfront architecture: stepped roofs, inset arches, warm walls.
    const buildings = [[-300, 420, 175, 198], [-96, 456, 132, 173], [72, 431, 186, 192], [302, 491, 132, 143], [864, 415, 186, 210], [1096, 465, 168, 167], [1354, 442, 145, 189]];
    for (const [x, y, w, h] of buildings) {
      const color = random() > 0.5 ? '#bd795d' : '#d29a73';
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#dfb18b';
      ctx.fillRect(x - 6, y - 9, w + 12, 12);
      ctx.fillStyle = '#986850';
      ctx.fillRect(x + w - 21, y + 3, 21, h - 3);
      for (let row = 0; row < 3; row += 1) {
        for (let col = 0; col < 3; col += 1) {
          const wx = x + 17 + col * (w - 30) / 3;
          const wy = y + 26 + row * 49;
          round(ctx, wx, wy, 21, 31, [10, 10, 0, 0], '#516e63');
          ctx.fillStyle = '#e3bd93';
          ctx.fillRect(wx - 3, wy + 30, 27, 4);
        }
      }
      line(ctx, [[x, y + h - 18], [x + w, y + h - 18]], '#e5ba90', 5);
    }
    ctx.fillStyle = '#8fb5a8';
    ctx.fillRect(-500, 637, 2000, 97);
    for (let i = 0; i < 75; i += 1) {
      const x = -500 + random() * 2000;
      line(ctx, [[x, 649 + i % 8 * 9], [x + 14 + random() * 55, 649 + i % 8 * 9]], 'rgba(230,232,191,0.5)', 1.2);
    }
    ctx.fillStyle = '#d1b790';
    ctx.fillRect(-500, 731, 2000, 67);
    ctx.fillStyle = '#e5cda7';
    ctx.fillRect(-500, 729, 2000, 7);
    for (let x = -450; x < 1550; x += 95) {
      ctx.fillStyle = '#897e64';
      ctx.fillRect(x, 704, 5, 30);
      line(ctx, [[x, 709], [x + 95, 709]], '#8d9276', 3);
    }
    ctx.fillStyle = '#a78968';
    ctx.fillRect(-500, ROAD_Y, 2000, 198);
    ctx.fillStyle = '#c3a57f';
    ctx.fillRect(-500, ROAD_Y + 6, 2000, 194);
    line(ctx, [[-500, ROAD_Y], [1500, ROAD_Y]], '#6c7360', 2);
    line(ctx, [[-500, 867], [1500, 867]], '#d7bc93', 2);
    for (let x = -500; x < 1500; x += 145) line(ctx, [[x, 968], [x + 56, 968]], '#e2c9a2', 3);
    tree(ctx, 19, 750, 190);
    tree(ctx, 780, 748, 207);
    tree(ctx, 1298, 747, 169);
    for (const x of [194, 970]) {
      line(ctx, [[x, 748], [x, 473], [x + 23, 458], [x + 51, 458]], '#465e53', 5);
      round(ctx, x + 31, 457, 31, 12, 5, '#e8d2a8');
    }
    // Long late-afternoon shadows run across the pavement.
    fillPath(ctx, 'M12 750 L20 750 L-90 1000 L-144 1000 Z', 'rgba(62,80,58,0.12)');
    fillPath(ctx, 'M775 750 L784 750 L638 1000 L591 1000 Z', 'rgba(62,80,58,0.1)');
  }, 1.5);
}

export function renderAt(ctx) {
  ctx.drawImage(city, -500, 0, 2000, 1000);
}

export function renderRider(ctx, pose, { x, y, scale }) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = 'rgba(41,60,48,0.17)';
  ctx.beginPath();
  ctx.ellipse(4, 77, 211, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const limb = (knee, foot, color, width) => {
    line(ctx, [[pose.hip.x, pose.hip.y], [knee.x, knee.y], [foot.x, foot.y]], color, width);
    line(ctx, [[foot.x - 9, foot.y + 3], [foot.x + 20, foot.y + 3]], color, width - 1);
  };
  limb(pose.farKnee, pose.farFoot, '#b27c47', 6);
  for (const cx of [-135, 135]) {
    ctx.beginPath();
    ctx.arc(cx, 0, 73, 0, Math.PI * 2);
    ctx.strokeStyle = '#263d3a';
    ctx.lineWidth = 10;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, 0, 66, 0, Math.PI * 2);
    ctx.strokeStyle = '#f2ddb4';
    ctx.lineWidth = 2;
    ctx.stroke();
    for (let i = 0; i < 16; i += 1) {
      const a = pose.wheelAngle + i * Math.PI / 8;
      line(ctx, [[cx, 0], [cx + Math.cos(a) * 65, Math.sin(a) * 65]], 'rgba(52,76,68,0.55)', 1.2);
    }
    const reflect = pose.wheelAngle + 0.3;
    line(ctx, [[cx + Math.cos(reflect) * 40, Math.sin(reflect) * 40], [cx + Math.cos(reflect) * 53, Math.sin(reflect) * 53]], '#e8d7a3', 5);
  }
  const frame = [[-135, 0], [-62, -115], [-20, -4], [-135, 0], [-62, -115], [80, -105], [-20, -4]];
  line(ctx, frame, '#315c51', 13);
  line(ctx, frame, '#81cbb2', 8);
  line(ctx, [[135, 0], [80, -105], [73, -147], [105, -155], [116, -148]], '#315c51', 9);
  line(ctx, [[135, 0], [80, -105]], '#87cdb4', 5);
  line(ctx, [[-62, -115], [-65, -139]], '#315c51', 7);
  round(ctx, -91, -145, 51, 11, 6, '#344940');
  line(ctx, [[pose.farFoot.x, pose.farFoot.y], [-20, -4], [pose.nearFoot.x, pose.nearFoot.y]], '#405a4e', 5);
  ctx.beginPath();
  ctx.arc(-20, -4, 24, 0, Math.PI * 2);
  ctx.strokeStyle = '#405a4e';
  ctx.lineWidth = 2;
  ctx.stroke();
  line(ctx, [[-131, 4], [-19, 20], [-17, -27], [-131, -4]], '#546457', 1.7);
  ctx.save();
  ctx.translate(0, pose.bob);
  const feathers = ctx.createLinearGradient(-130, -260, 40, -160);
  feathers.addColorStop(0, '#fff9e8');
  feathers.addColorStop(0.65, '#f2eddb');
  feathers.addColorStop(1, '#b6c7b7');
  fillPath(ctx, 'M-164 -196 L-185 -220 Q-156 -215 -130 -244 C-94 -272 -42 -266 -12 -244 Q9 -252 6 -282 C-1 -323 26 -358 59 -356 C90 -354 105 -331 88 -311 Q73 -296 69 -283 C65 -242 54 -215 30 -197 Q-43 -151 -118 -176 Z', feathers, '#2e4b43', 2.4);
  const pouch = ctx.createLinearGradient(92, -340, 130, -286);
  pouch.addColorStop(0, '#e8ae56');
  pouch.addColorStop(1, '#d48642');
  fillPath(ctx, 'M83 -338 L241 -305 Q217 -294 168 -293 Q113 -292 84 -312 Q76 -299 65 -292 L71 -313 Z', pouch, '#7e623d', 1.7);
  line(ctx, [[89, -326], [232, -305]], '#8c663a', 1.3);
  fillPath(ctx, 'M-131 -229 Q-97 -250 -52 -228 Q-6 -201 23 -185 L109 -149 Q37 -163 -18 -170 Q-93 -171 -136 -195 Z', '#e7edda', '#6b8976', 1.8);
  for (let i = 0; i < 7; i += 1) {
    fillPath(ctx, `M${-118 + i * 17} ${-219 + i * 3} Q${-101 + i * 17} ${-210 + i * 5} ${-99 + i * 20} ${-184 + i * 2}`, 'rgba(173,193,169,0.24)', '#acbfaa', 1.1);
  }
  ctx.fillStyle = '#2b4139';
  ctx.beginPath();
  ctx.arc(68, -338, 4.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff6d8';
  ctx.beginPath();
  ctx.arc(69, -339.5, 1.3, 0, Math.PI * 2);
  ctx.fill();
  line(ctx, [[44, -350], [67, -351]], '#fffbed', 2.2);
  ctx.restore();
  limb(pose.nearKnee, pose.nearFoot, '#d3a15d', 7);
  line(ctx, [[pose.nearFoot.x - 10, pose.nearFoot.y + 8], [pose.nearFoot.x + 19, pose.nearFoot.y + 8]], '#344a40', 5);
  // A small original bell, separate from any product iconography.
  ctx.fillStyle = '#d5b56d';
  ctx.beginPath();
  ctx.arc(79, -151, 7, Math.PI, 0);
  ctx.fill();
  ctx.restore();
}

function heart(ctx, x, y, color) {
  ctx.save();
  ctx.translate(x, y);
  fillPath(ctx, 'M0 13 C-5 7 -18 -1 -17 -11 C-16 -22 -3 -24 0 -15 C4 -24 18 -22 18 -11 C18 -1 5 8 0 13 Z', color);
  ctx.restore();
}

export function renderOverlay(ctx, { t }) {
  const localT = t - scene.start;
  const alpha = smooth(localT / 0.35) * (1 - smooth((localT - 6) / 0.13));
  if (alpha <= 0) return;
  const x = STAGE_WIDTH / 2 - 281.25;
  ctx.save();
  ctx.translate(x, 0);
  ctx.globalAlpha *= alpha;
  ctx.beginPath();
  ctx.rect(0, 0, 562.5, 1000);
  ctx.clip();
  const fade = ctx.createLinearGradient(0, 740, 0, 1000);
  fade.addColorStop(0, 'rgba(15,30,29,0)');
  fade.addColorStop(0.55, 'rgba(15,30,29,0.6)');
  fade.addColorStop(1, 'rgba(15,30,29,0.94)');
  ctx.fillStyle = fade;
  ctx.fillRect(0, 740, 562.5, 260);
  line(ctx, [[30, 46], [39, 35], [50, 46], [40, 57]], '#214b46', 3);
  text(ctx, '沿途', 64, 54, { size: 25, color: '#214b46', weight: 600, family: SANS });
  text(ctx, '此刻循环', 528, 52, { size: 17, color: '#416b60', align: 'right', family: SANS });
  line(ctx, [[29, 78], [534, 78]], 'rgba(42,91,79,0.24)', 1);
  text(ctx, '竖屏短视频', 30, 137, { size: 38, color: '#234b43', weight: 600, family: SANS });
  text(ctx, 'VERTICAL SHORT VIDEO', 33, 169, { size: 19, color: '#416b60', family: SANS });
  text(ctx, '2020s', 33, 206, { size: 22, color: '#416b60', family: SANS });
  round(ctx, 463, 107, 69, 34, 17, '#315b50');
  text(ctx, '19', 497.5, 131, { size: 19, color: '#f7edce', align: 'center', family: SANS, weight: 600 });
  // Each bubble has a fixed birth time; seeking reconstructs the same float.
  const comments = [
    { at: 2, value: '这个踏频很稳', width: 215, offset: 0 },
    { at: 2.5, value: '从岩画刷到这里', width: 250, offset: 19 },
    { at: 3, value: '本人还在赶路', width: 232, offset: 0 },
  ];
  for (const comment of comments) {
    const age = localT - comment.at;
    if (age < 0 || age > 2.4) continue;
    const opacity = smooth(age / 0.16) * (1 - smooth((age - 1.85) / 0.55));
    withAlpha(ctx, opacity, () => {
      const y = 470 - age * 80;
      round(ctx, 31 + comment.offset, y, comment.width, 40, 20, 'rgba(247,247,224,0.88)');
      ctx.fillStyle = '#5f8b72';
      ctx.beginPath();
      ctx.arc(51 + comment.offset, y + 20, 5, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, comment.value, 68 + comment.offset, y + 27, { size: 20, color: '#375849', family: SANS, weight: 600 });
    });
  }
  const beatPulse = Math.exp(-((((localT - 2) % 0.5) / 0.12) ** 2)) * (localT >= 2 && localT < 4 ? 1 : 0);
  round(ctx, 481, 590, 59, 85, 29, 'rgba(29,62,54,0.72)');
  ctx.save();
  ctx.translate(510, 622);
  ctx.scale(0.82 + beatPulse * 0.15, 0.82 + beatPulse * 0.15);
  heart(ctx, 0, 0, localT >= 2 ? '#f49b86' : '#fff4d9');
  ctx.restore();
  const likes = localT < 2 ? '2.0k' : localT < 2.5 ? '2.8k' : localT < 3 ? '3.6k' : '4.2k';
  text(ctx, likes, 510, 659, { size: 16, color: '#fff2d8', align: 'center', family: SANS, weight: 600 });
  round(ctx, 481, 689, 59, 78, 29, 'rgba(29,62,54,0.72)');
  ctx.strokeStyle = '#fff4d9';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.roundRect(495, 704, 29, 22, 7);
  ctx.stroke();
  line(ctx, [[502, 726], [499, 733], [510, 727]], '#fff4d9', 2);
  text(ctx, '208', 510, 751, { size: 16, color: '#fff2d8', align: 'center', family: SANS });
  text(ctx, '@路过的鹈鹕', 32, 849, { size: 25, color: '#fff4d9', family: SANS, weight: 600 });
  text(ctx, '今天也在路上。', 33, 892, { size: 28, color: '#fff4d9', family: SANS, weight: 600 });
  text(ctx, '原创骑行  ·  第 19 站', 34, 925, { size: 17, color: '#d6ddbd', family: SANS });
  const progress = clamp(localT / 6);
  round(ctx, 32, 956, 498.5, 4, 2, 'rgba(235,239,213,0.3)');
  round(ctx, 32, 956, Math.max(4, progress * 498.5), 4, 2, '#d0edc3');
  ctx.fillStyle = '#e6f6d4';
  ctx.beginPath();
  ctx.arc(32 + progress * 498.5, 958, 4, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, `00:0${Math.min(6, Math.floor(Math.max(0, localT)))} / 00:06`, 32, 985, { size: 13, color: '#d6ddbd', family: SANS });
  text(ctx, 'ONWARD', 530, 985, { size: 12, color: '#d6ddbd', align: 'right', family: SANS });
  ctx.restore();
}
