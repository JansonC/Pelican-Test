import { SCENES } from './catalog.js';
import { text, line, SANS } from '../kit/canvas.js';
import { layer } from '../kit/materials.js';
import { seeded, smooth } from '../kit/math.js';
import { ROAD_Y, quantizeTime } from '../beat/timeline.js';
import { CUES } from '../beat/events.js';

export const scene = SCENES[16];
export const finished = true;
export const TITLE_GLYPHS = '栖线早期聊天窗口聊天骑行消息联系人2000s';

const BG = '#bccbd0';
const DEEP = '#3a6477';
const NAVY = '#274d60';
const CREAM = '#f4f1e7';
const GREEN = '#739c82';
const GRID = 'rgba(47,82,96,0.13)';
const TAU = Math.PI * 2;
let desktop;
let windows;

function rect(ctx, x, y, width, height, fill, stroke = null, lineWidth = 1) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, width, height);
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1); }
}

function pixelBorder(ctx, x, y, width, height, fill = CREAM, edge = DEEP) {
  rect(ctx, x, y, width, height, fill, edge, 2);
  rect(ctx, x + 5, y + 5, width - 10, height - 10, 'rgba(255,255,255,0)', 'rgba(39,77,96,0.42)', 1);
}

function windowBar(ctx, x, y, width, title, active = false) {
  rect(ctx, x, y, width, 34, active ? DEEP : '#6e8995');
  text(ctx, title, x + 14, y + 23, { size: 16, color: CREAM, family: SANS, weight: 600 });
  for (let i = 0; i < 3; i += 1) {
    ctx.fillStyle = i === 0 ? '#d3e0d2' : i === 1 ? '#e5d8ad' : '#d39c91';
    ctx.fillRect(x + width - 55 + i * 15, y + 12, 8, 8);
  }
}

function drawContacts(ctx, x, y, width, height) {
  pixelBorder(ctx, x, y, width, height, '#dfe7e7', '#506f7e');
  windowBar(ctx, x, y, width, '栖线  /  CONTACTS');
  rect(ctx, x + 14, y + 50, width - 28, 28, '#f8f4ea', '#9bb0b6', 1);
  text(ctx, '查找联系人', x + 25, y + 70, { size: 14, color: '#71858c', family: SANS });
  const rows = [
    ['路过的鹈鹕', '正在路上', GREEN],
    ['纸边散步者', '刚刚上线', '#9b7e67'],
    ['桥头观察员', '离开 2 分钟', '#71828a'],
    ['墨线收藏家', '离开 1 小时', '#71828a'],
  ];
  rows.forEach(([name, status, color], index) => {
    const rowY = y + 105 + index * 61;
    if (index === 0) rect(ctx, x + 9, rowY - 11, width - 18, 52, '#c8dadd');
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x + 31, rowY + 10, 9, 0, TAU); ctx.fill();
    text(ctx, name, x + 50, rowY + 7, { size: 15, color: NAVY, family: SANS, weight: 600 });
    text(ctx, status, x + 50, rowY + 27, { size: 12, color: '#71858c', family: SANS });
  });
}

function drawBackWindow(ctx, x, y, width, height) {
  pixelBorder(ctx, x, y, width, height, '#e8eeee', '#69838d');
  windowBar(ctx, x, y, width, '栖线记事  /  notes');
  text(ctx, '一条路，二十份答卷。', x + 24, y + 88, { size: 18, color: '#637c86', family: SANS });
  line(ctx, [[x + 24, y + 107], [x + width - 24, y + 107]], '#a7bbc0', 1);
  for (let i = 0; i < 6; i += 1) line(ctx, [[x + 24, y + 141 + i * 31], [x + width - 37 - (i % 2) * 23, y + 141 + i * 31]], 'rgba(66,96,108,0.38)', 1.2);
}

function bubble(ctx, value, bx, by, bw, fill, color) {
  rect(ctx, bx, by, bw, 31, fill, '#b3c1c1', 1);
  text(ctx, value, bx + 12, by + 21, { size: 14, color, family: SANS });
}

function drawMainWindow(ctx, x, y, width, height, localT, jitter) {
  ctx.save();
  ctx.translate(jitter.x, jitter.y);
  pixelBorder(ctx, x, y, width, height, '#f6f3e8', '#345e70');
  windowBar(ctx, x, y, width, '栖线  /  ONWARD CHAT', true);
  rect(ctx, x + 17, y + 49, 144, height - 69, '#e1eaeb', '#afc0c3', 1);
  text(ctx, '联系人', x + 31, y + 76, { size: 15, color: NAVY, family: SANS, weight: 600 });
  for (let i = 0; i < 4; i += 1) {
    const rowY = y + 106 + i * 52;
    if (i === 0) rect(ctx, x + 23, rowY - 17, 132, 42, '#bed5d4');
    ctx.fillStyle = i === 0 ? GREEN : '#7f9ba1';
    ctx.beginPath(); ctx.arc(x + 40, rowY, 7, 0, TAU); ctx.fill();
    text(ctx, ['路过的鹈鹕', '纸边散步者', '桥头观察员', '墨线收藏家'][i], x + 56, rowY + 5, { size: 12, color: '#426476', family: SANS });
  }
  const chatX = x + 181;
  const chatW = width - 198;
  rect(ctx, chatX, y + 49, chatW, height - 69, '#fbf7ed', '#afc0c3', 1);
  text(ctx, '路过的鹈鹕', chatX + 18, y + 79, { size: 15, color: NAVY, family: SANS, weight: 600 });
  text(ctx, '在线 · 低帧骑行中', chatX + chatW - 18, y + 79, { size: 11, color: GREEN, family: SANS, align: 'right' });
  line(ctx, [[chatX + 16, y + 92], [chatX + chatW - 16, y + 92]], '#bfd0d0', 1);
  bubble(ctx, '你也在赶路吗？', chatX + 22, y + 126, 139, '#e6eef0', '#476d7d');
  bubble(ctx, '正在穿过第 17 幕。', chatX + chatW - 191, y + 170, 169, '#c7dcd0', '#3c6e5c');
  if (messageAt(localT)) {
    const reveal = smooth((localT - (CUES.message - scene.start)) / 0.24);
    if (reveal > 0) { ctx.save(); ctx.globalAlpha = reveal; bubble(ctx, '新消息：保持踏频。', chatX + 34, y + 228, 177, '#d5e7dc', '#3d705b'); ctx.restore(); }
  }
  const cursor = (Math.floor(Math.max(0, localT) * 2) % 2) ? 1 : 0;
  line(ctx, [[chatX + 23, y + height - 50], [chatX + chatW - 65, y + height - 50]], '#9fb5bb', 1);
  text(ctx, cursor ? '输入消息▌' : '输入消息', chatX + 25, y + height - 27, { size: 13, color: '#81979e', family: SANS });
  ctx.restore();
}

export function windowJitterAt(localT) {
  const envelope = smooth((localT - (CUES.message - scene.start)) / 0.18) * (1 - smooth((localT - 4.25) / 0.38));
  if (envelope <= 0) return { x: 0, y: 0, amount: 0 };
  const pulse = Math.exp(-((((localT - (CUES.message - scene.start)) % 0.5) / 0.1) ** 2));
  return { x: Math.sin(localT * 74.2) * (2.4 + pulse * 6.5) * envelope, y: Math.cos(localT * 67.7) * (1.1 + pulse * 3.5) * envelope, amount: envelope };
}

export function messageAt(localT) { return localT >= CUES.message - scene.start; }

export function animationFrameAt(time) { return Math.floor((time + 1e-9) * 10); }

export function prepare() {
  desktop = layer(2000, 1000, (ctx) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, 1000);
    gradient.addColorStop(0, '#cbd8d9'); gradient.addColorStop(0.72, BG); gradient.addColorStop(1, '#9fb8bf');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 2000, 1000);
    ctx.save(); ctx.translate(500, 0);
    for (let x = -500; x <= 1500; x += 32) line(ctx, [[x, 0], [x, 1000]], GRID, 0.6);
    for (let y = 26; y <= 1000; y += 32) line(ctx, [[-500, y], [1500, y]], GRID, 0.6);
    rect(ctx, -500, 56, 2000, 24, '#78939c');
    text(ctx, '栖线  ·  桌面', -466, 73, { size: 13, color: CREAM, family: SANS, weight: 600 });
    text(ctx, '2000s', 1466, 73, { size: 12, color: '#e8f0ed', family: SANS, align: 'right' });
    rect(ctx, -500, ROAD_Y, 2000, 4, DEEP);
    line(ctx, [[-500, ROAD_Y + 22], [1500, ROAD_Y + 22]], 'rgba(255,255,255,0.42)', 1);
    for (let x = -470; x < 1500; x += 118) line(ctx, [[x, ROAD_Y + 39], [x + 53, ROAD_Y + 39]], 'rgba(50,88,101,0.32)', 2);
    ctx.restore();
  });
  windows = layer(2000, 1000, (ctx) => {
    ctx.translate(500, 0);
    drawContacts(ctx, -390, 147, 248, 439);
    drawBackWindow(ctx, 792, 105, 355, 244);
    drawBackWindow(ctx, -260, 122, 342, 196);
  });
}

export function renderAt(ctx, { localT }) {
  ctx.drawImage(desktop, -500, 0, 2000, 1000);
  ctx.drawImage(windows, -500, 0, 2000, 1000);
  drawMainWindow(ctx, 54, 105, 708, 583, localT, windowJitterAt(localT));
  const frame = Math.max(0, Math.floor(localT * 10 + 1e-9));
  const random = seeded(17000 + frame);
  ctx.save(); ctx.globalAlpha = localT >= 2 && localT < 4.5 ? 0.15 : 0.06;
  for (let i = 0; i < 88; i += 1) { const x = -475 + random() * 1960; const y = 90 + random() * 650; ctx.fillStyle = i % 3 ? '#f4f1e7' : '#345e70'; ctx.fillRect(x, y, 1 + random() * 2, 1 + random() * 2); }
  ctx.restore();
}

function drawGifRider(ctx, pose, frame) {
  const bob = [0, 1.4, 0, -1.4][frame]; const wing = [0, 1, 0, -1][frame];
  const limb = (knee, foot, color, width) => { line(ctx, [[pose.hip.x, pose.hip.y + bob], [knee.x, knee.y], [foot.x, foot.y]], color, width); line(ctx, [[foot.x - 8, foot.y + 4], [foot.x + 17, foot.y + 4]], color, width * 0.62); };
  limb(pose.farKnee, pose.farFoot, '#73909a', 5);
  for (const center of [-135, 135]) { ctx.beginPath(); ctx.arc(center, 0, 73, 0, TAU); ctx.strokeStyle = NAVY; ctx.lineWidth = 6; ctx.stroke(); ctx.beginPath(); ctx.arc(center, 0, 67, 0, TAU); ctx.strokeStyle = '#87a6ac'; ctx.lineWidth = 1.4; ctx.stroke(); for (let i = 0; i < 12; i += 1) { const angle = pose.wheelAngle + i * Math.PI / 6; line(ctx, [[center, 0], [center + Math.cos(angle) * 66, Math.sin(angle) * 66]], 'rgba(39,77,96,0.58)', 1.2); } }
  line(ctx, [[-135, 0], [-62, -115], [-20, -4], [-135, 0]], NAVY, 7); line(ctx, [[-62, -115], [80, -105], [-20, -4]], NAVY, 7); line(ctx, [[80, -105], [135, 0]], NAVY, 7); line(ctx, [[80, -105], [73, -147], [104, -154]], NAVY, 5); line(ctx, [[-90, -140], [-43, -140]], NAVY, 8); line(ctx, [[pose.farFoot.x, pose.farFoot.y], [-20, -4], [pose.nearFoot.x, pose.nearFoot.y]], GREEN, 3);
  ctx.save(); ctx.translate(0, bob); ctx.beginPath(); ctx.moveTo(-145, -190); ctx.bezierCurveTo(-175, -220, -134, -256, -90, -259); ctx.bezierCurveTo(-47, -264, -25, -240, 1, -251); ctx.bezierCurveTo(8, -277, 6, -318, 38, -342); ctx.bezierCurveTo(67, -361, 97, -340, 79, -314); ctx.bezierCurveTo(58, -288, 73, -252, 46, -214); ctx.bezierCurveTo(16, -177, -93, -165, -145, -190); ctx.fillStyle = CREAM; ctx.fill(); ctx.strokeStyle = NAVY; ctx.lineWidth = 3; ctx.stroke(); ctx.beginPath(); ctx.moveTo(78, -327); ctx.lineTo(224, -299); ctx.quadraticCurveTo(155, -284, 82, -309); ctx.quadraticCurveTo(70, -297, 58, -286); ctx.quadraticCurveTo(75, -313, 78, -327); ctx.fillStyle = '#d7b26e'; ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-123, -236); ctx.quadraticCurveTo(-79, -258 - wing * 3, -39, -224); ctx.quadraticCurveTo(21, -181, 102, -149); ctx.quadraticCurveTo(20, -162, -43, -181); ctx.quadraticCurveTo(-102, -184, -123, -236); ctx.fillStyle = '#e6eee9'; ctx.fill(); ctx.stroke(); ctx.fillStyle = NAVY; ctx.beginPath(); ctx.arc(67, -332, 3.3, 0, TAU); ctx.fill(); ctx.restore();
  limb(pose.nearKnee, pose.nearFoot, '#3e6f7d', 6);
}

export function renderRider(ctx, pose, { x: positionX, y: positionY, scale = 1, t: time = scene.start }) {
  const frame = animationFrameAt(quantizeTime(time, 10)) % 4;
  ctx.save(); ctx.translate(positionX, positionY); ctx.scale(scale * 0.78, scale * 0.78); drawGifRider(ctx, pose, frame); ctx.restore();
}

export function renderTitle(ctx, { x: titleX }) {
  ctx.save(); rect(ctx, titleX - 8, 101, 420, 132, 'rgba(244,241,231,0.95)', '#3d6575', 1.2);
  text(ctx, scene.zh, titleX + 14, 145, { size: 38, color: NAVY, family: SANS, weight: 600 });
  text(ctx, 'EARLY CHAT WINDOW', titleX + 16, 177, { size: 16, color: DEEP, family: SANS, weight: 600 });
  text(ctx, '2000s  ·  栖线', titleX + 16, 207, { size: 18, color: GREEN, family: SANS }); ctx.restore();
}
