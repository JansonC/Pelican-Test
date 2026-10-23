import { SCENES } from '../scenes/catalog.js';
import { sceneRenderers } from '../scenes/index.js';
import { poseAt, drawPelican } from '../rig/pelican.js';
import { text, line, SANS, withAlpha } from '../kit/canvas.js';
import { smooth, lerp } from '../kit/math.js';
import { locate, STAGE_WIDTH as W, PANEL_WIDTH, TRAVEL_SPEED, ROAD_Y, quantizeTime } from '../beat/timeline.js';

const PAPER = '#eee8da';
const INK = '#354136';
const RIDER_X = 720;

export function createCompositor({ paper }) {
  const thumbnails = [];

  function grain(ctx, alpha = 1) {
    withAlpha(ctx, alpha, () => ctx.drawImage(paper, 0, 0, W, 1000));
  }

  function drawWorld(ctx, t, { rider = true } = {}) {
    const travel = (t - 5) * TRAVEL_SPEED;
    const camera = travel - RIDER_X;
    const distance = Math.abs((t - 5 + 3) % 6 - 3);
    const zoom = 1 + 0.022 * Math.exp(-((distance / 0.18) ** 2));
    ctx.save();
    ctx.translate(RIDER_X, ROAD_Y);
    ctx.scale(zoom, zoom);
    ctx.translate(-RIDER_X, -ROAD_Y);

    for (let index = -1; index < 21; index += 1) {
      const left = index * PANEL_WIDTH - camera;
      if (left > W + 100 || left + PANEL_WIDTH < -100) continue;
      const scene = SCENES[Math.max(0, Math.min(19, index))];
      ctx.save();
      ctx.beginPath();
      ctx.rect(left, -100, PANEL_WIDTH, 1200);
      ctx.clip();
      ctx.fillStyle = index < 0 ? PAPER : scene.paper;
      ctx.fillRect(left, -100, PANEL_WIDTH, 1200);
      grain(ctx, 0.8);

      if (index >= 0 && index < 20) {
        const titleX = Math.min(left + PANEL_WIDTH - 760, Math.max(left + 125, 110));
        text(ctx, `THE PELICAN TEST     /     ${String(index + 1).padStart(2, '0')}`, titleX, 145, { size: 17, color: scene.ink, family: SANS });
        text(ctx, scene.zh, titleX, 233, { size: 61, color: scene.ink, weight: 600 });
        text(ctx, scene.en, titleX + 3, 277, { size: 25, color: scene.ink });
        text(ctx, scene.era, titleX + 3, 324, { size: 24, color: scene.ink });
        ctx.save();
        ctx.translate(left + (PANEL_WIDTH - 1000) / 2, 0);
        const characterT = scene.updateHz ? quantizeTime(t, scene.updateHz) : t;
        sceneRenderers[index].renderAt(ctx, { t, localT: t - scene.start, pose: poseAt(characterT) });
        ctx.restore();
      }

      line(ctx, [[left, ROAD_Y], [left + PANEL_WIDTH, ROAD_Y]], scene.ink, 2.5);
      line(ctx, [[left, ROAD_Y + 58], [left + PANEL_WIDTH, ROAD_Y + 58]], scene.ink, 1.2);
      for (let marker = Math.floor(camera / 120) * 120; marker < camera + W + 200; marker += 120) {
        line(ctx, [[marker - camera, ROAD_Y + 30], [marker - camera + 38, ROAD_Y + 30]], scene.accent, 1.5);
      }
      if (rider) {
        const characterT = scene.updateHz ? quantizeTime(t, scene.updateHz) : t;
        drawPelican(ctx, poseAt(characterT), { x: RIDER_X, y: ROAD_Y - 73, ink: scene.ink, accent: scene.accent });
      }
      ctx.restore();
    }

    for (let index = 0; index <= 20; index += 1) {
      const x = index * PANEL_WIDTH - camera;
      if (x < -30 || x > W + 30) continue;
      const dark = '#6a644e';
      const light = '#b8a779';
      ctx.fillStyle = dark;
      ctx.fillRect(x - 9, 75, 18, 850);
      ctx.fillStyle = light;
      ctx.fillRect(x - 5, 80, 5, 840);
      line(ctx, [[x - 16, 75], [x + 16, 75]], dark, 4);
      line(ctx, [[x - 16, 925], [x + 16, 925]], dark, 4);
      text(ctx, String(index + 1).padStart(2, '0'), x + 22, 920, { size: 15, color: dark, family: SANS });
    }
    ctx.restore();
  }

  function drawIntro(ctx, t) {
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, W, 1000);
    grain(ctx);
    const exit = smooth((t - 4) / 1);
    if (exit > 0) withAlpha(ctx, exit, () => drawWorld(ctx, t, { rider: false }));
    withAlpha(ctx, 1 - exit, () => {
      text(ctx, '一 部 尚 待 考 证 的 艺 术 史', 122, 143, { size: 20, color: '#8b7b60' });
      line(ctx, [[122, 175], [1650, 175]], '#b2a48a', 1);
      withAlpha(ctx, smooth((t - 0.25) / 0.6), () => {
        text(ctx, '人类自古以来就痴迷于画', 120, 335, { size: 53, weight: 600 });
        text(ctx, '鹈鹕骑自行车。', 120, 435, { size: 78, weight: 600 });
      });
      withAlpha(ctx, smooth((t - 3) / 0.16), () => {
        text(ctx, '——早在自行车被发明之前。', 124, 545, { size: 35, color: '#8c653f' });
      });
      text(ctx, '——《鹈鹕骑行艺术通史》，卷一（虚构书名）', 126, 865, { size: 23, color: '#817967' });
      text(ctx, '图一  鹈鹕骑行图（摹本）', 1375, 774, { size: 22, align: 'center', color: '#817967' });
      text(ctx, 'THE PELICAN TEST', 122, 930, { size: 15, color: '#8b7b60', family: SANS });
      text(ctx, '一条路，二十份答卷。', 1650, 930, { size: 17, align: 'right', color: '#8b7b60' });
    });
    withAlpha(ctx, smooth(t / 0.5), () => {
      drawPelican(ctx, poseAt(t), { x: lerp(1375, RIDER_X, exit), y: lerp(678, ROAD_Y - 73, exit), scale: lerp(0.68, 1, exit), sketch: true });
    });
  }

  function drawPress(ctx, localT) {
    ctx.fillStyle = '#e7e1d3';
    ctx.fillRect(0, 0, 1000, 562.5);
    line(ctx, [[0, 85], [1000, 85]], '#c5bca5', 2);
    text(ctx, '新闻发布会', 500, 60, { size: 25, align: 'center', color: '#8b8068' });
    text(ctx, 'PRESS CONFERENCE', 500, 108, { size: 11, align: 'center', color: '#8b8068', family: SANS });
    ctx.fillStyle = '#6e7566';
    ctx.beginPath();
    ctx.roundRect(415, 181, 170, 181, 25);
    ctx.fill();
    line(ctx, [[440, 338], [426, 470]], '#494c40', 8);
    line(ctx, [[560, 338], [574, 470]], '#494c40', 8);
    if (localT >= 11.5 && localT < 11.8) {
      drawPelican(ctx, poseAt(125 + localT), { x: lerp(-220, 1220, (localT - 11.5) / 0.3), y: 352, scale: 0.52 });
    }
    ctx.fillStyle = '#89806a';
    ctx.fillRect(70, 351, 860, 155);
    ctx.fillStyle = '#b1a180';
    ctx.fillRect(60, 339, 880, 20);
    for (const [x, tilt] of [[286, -20], [370, 14], [622, -12], [716, 18]]) {
      line(ctx, [[x, 337], [x + tilt, 279]], INK, 5);
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.ellipse(x + tilt, 276, 12, 19, tilt / 65, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x - 20, 333, 40, 6);
    }
    ctx.fillStyle = '#f2eddf';
    ctx.fillRect(401, 319, 198, 48);
    text(ctx, '鹈鹕（本人）', 500, 352, { size: 23, align: 'center', weight: 600 });
    for (const flash of [4, 5, 6]) {
      const alpha = Math.max(0, 1 - Math.abs(localT - flash) / 0.09) * 0.7;
      if (alpha) withAlpha(ctx, alpha, () => { ctx.fillStyle = '#fffef7'; ctx.fillRect(0, 0, 1000, 562.5); });
    }
  }

  function prepareThumbnails() {
    if (thumbnails.length) return;
    SCENES.forEach((scene) => {
      const canvas = document.createElement('canvas');
      canvas.width = 480;
      canvas.height = 270;
      const ctx = canvas.getContext('2d');
      ctx.scale(canvas.width / W, canvas.height / 1000);
      drawWorld(ctx, scene.start + 3);
      thumbnails.push(canvas);
    });
  }

  function drawOutro(ctx, localT) {
    prepareThumbnails();
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, W, 1000);
    grain(ctx);
    const cellW = 216;
    const cellH = 206;
    const gap = 15;
    const left = (W - (cellW * 7 + gap * 6)) / 2;
    const top = 145;
    const focus = { x: left + 6 * (cellW + gap) + cellW / 2, y: top + 2 * (cellH + gap) + 75 };
    const finalZoom = 7.2;
    const push = smooth((localT - 3) / 4);
    // Pull out from the final displayed scene before approaching the empty chair.
    const pull = 1 - smooth(localT / 1.25);
    const last = { x: left + 5 * (cellW + gap) + cellW / 2, y: focus.y };
    const scale = 1 + (finalZoom - 1) * (push + pull);
    const focusX = push ? focus.x : last.x;
    const offset = push || pull;
    ctx.save();
    ctx.translate(lerp(0, W / 2 - focusX * scale, offset), lerp(0, 445 - focus.y * scale, offset));
    ctx.scale(scale, scale);
    text(ctx, '二十份答卷，一个空席位。', left, 91, { size: 28, weight: 600 });
    text(ctx, 'THE PELICAN TEST   /   COLLECTED STUDIES', W - left, 91, { size: 12, align: 'right', color: '#847d69', family: SANS });
    for (let index = 0; index < 21; index += 1) {
      const x = left + (index % 7) * (cellW + gap);
      const y = top + Math.floor(index / 7) * (cellH + gap);
      ctx.fillStyle = '#e1d8c4';
      ctx.fillRect(x - 3, y - 3, cellW + 6, 154);
      ctx.fillStyle = '#f8f3e6';
      ctx.fillRect(x, y, cellW, cellH);
      if (index < 20) ctx.drawImage(thumbnails[index], x + 5, y + 5, cellW - 10, 116);
      else {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x + 5, y + 5, cellW - 10, 116);
        ctx.clip();
        ctx.translate(x + 5, y + 5);
        ctx.scale((cellW - 10) / 1000, 116 / 562.5);
        drawPress(ctx, localT);
        ctx.restore();
      }
      text(ctx, `${String(index + 1).padStart(2, '0')}  ${index < 20 ? SCENES[index].zh : '鹈鹕（本人）'}`, x + 11, y + 151, { size: 13, weight: 600 });
      text(ctx, index < 20 ? SCENES[index].era : '尚未发表评论', x + 11, y + 179, { size: 11, color: '#8b8068' });
    }
    ctx.restore();
    const caption = localT < 6 ? '截至目前，人类共提交了 20 份答卷。' : '鹈鹕本人对此尚未发表评论。';
    const captionAlpha = localT < 6 ? smooth((localT - 1) / 0.4) * (1 - smooth((localT - 5.3) / 0.5)) : smooth((localT - 7) / 0.4);
    withAlpha(ctx, captionAlpha, () => {
      ctx.fillStyle = PAPER;
      ctx.fillRect(0, 875, W, 125);
      text(ctx, caption, W / 2, 947, { size: 34, align: 'center', weight: 600 });
    });
  }

  return {
    renderAt(ctx, time) {
      const frame = locate(time);
      ctx.save();
      // Fractional clip edges must blend against a fresh base, never a prior frame.
      ctx.fillStyle = PAPER;
      ctx.fillRect(0, 0, W, 1000);
      if (frame.kind === 'intro') drawIntro(ctx, frame.t);
      else if (frame.kind === 'scene') drawWorld(ctx, frame.t);
      else drawOutro(ctx, frame.localT);
      ctx.restore();
      return frame;
    },
  };
}
