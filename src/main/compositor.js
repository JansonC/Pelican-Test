import { SCENES } from '../scenes/catalog.js';
import { sceneRenderers } from '../scenes/index.js';
import { poseAt, drawPelican } from '../rig/pelican.js';
import { shadowOutlineAt } from '../scenes/nosferatu.js';
import { scopeOutlineAt } from '../scenes/scope.js';
import { text, line, SANS, withAlpha } from '../kit/canvas.js';
import { smooth, lerp } from '../kit/math.js';
import { locate, STAGE_WIDTH as W, PANEL_WIDTH, TRAVEL_SPEED, ROAD_Y, quantizeTime } from '../beat/timeline.js';
import { portraitAt, codeCameraAt, GALLERY, outroCameraAt, outroCaptionAt } from './presentation.js';
import { CUES } from '../beat/events.js';

const PAPER = '#eee8da';
const INK = '#354136';
const RIDER_X = 720;

export function createCompositor({ paper }) {
  const thumbnails = [];

  function grain(ctx, alpha = 1) {
    withAlpha(ctx, alpha, () => ctx.drawImage(paper, 0, 0, W, 1000));
  }

  function drawWorld(ctx, t, { rider = true } = {}) {
    const portrait = portraitAt(t);
    const riderX = portrait.riderX + codeCameraAt(t).riderOffset;
    const travel = (t - 5) * TRAVEL_SPEED;
    const camera = travel - riderX;
    const distance = Math.abs((t - 5 + 3) % 6 - 3);
    const zoom = 1 + 0.022 * Math.exp(-((distance / 0.18) ** 2));
    ctx.save();
    ctx.translate(riderX, ROAD_Y);
    ctx.scale(zoom, zoom);
    ctx.translate(-riderX, -ROAD_Y);

    for (let index = -1; index < 21; index += 1) {
      const left = index * PANEL_WIDTH - camera;
      if (left > W + 100 || left + PANEL_WIDTH < -100) continue;
      const scene = SCENES[Math.max(0, Math.min(19, index))];
      const renderer = sceneRenderers[Math.max(0, Math.min(19, index))];
      ctx.save();
      ctx.beginPath();
      ctx.rect(left, -100, PANEL_WIDTH, 1200);
      ctx.clip();
      ctx.fillStyle = index < 0 ? PAPER : scene.paper;
      ctx.fillRect(left, -100, PANEL_WIDTH, 1200);
      if (!renderer.finished || index < 0 || index > 19) grain(ctx, 0.8);

      if (index >= 0 && index < 20) {
        const titleX = Math.min(left + PANEL_WIDTH - 760, Math.max(left + 125, 110));
        const characterT = scene.updateHz ? quantizeTime(t, scene.updateHz) : t;
        const poseT = renderer.poseTimeAt?.(characterT, characterT - scene.start) ?? characterT;
        const frame = { t, localT: t - scene.start, pose: poseAt(poseT) };
        const localView = renderer.cameraAt?.(frame.localT) || { zoom: 1, riderScale: 1 };
        const view = { zoom: localView.zoom, riderScale: localView.riderScale * portrait.riderScale };
        const origin = left + (PANEL_WIDTH - 1000) / 2;
        const localRiderX = riderX - origin;
        ctx.save();
        ctx.translate(origin, 0);
        // Local lenses pivot on the tire contact. Their transforms never change
        // the world road, portal position, or the neighboring panel's camera.
        ctx.translate(localRiderX, ROAD_Y);
        ctx.scale(view.zoom, view.zoom);
        ctx.translate(-localRiderX, -ROAD_Y);
        renderer.renderAt(ctx, frame);
        if (rider && renderer.renderRider) {
          renderer.renderRider(ctx, frame.pose, {
            x: localRiderX, y: ROAD_Y - 73 * view.riderScale, scale: view.riderScale,
            t, localT: frame.localT,
          });
        }
        ctx.restore();
        if (renderer.renderTitle) renderer.renderTitle(ctx, { x: titleX, ...frame });
        else if (!renderer.finished) {
          text(ctx, `THE PELICAN TEST     /     ${String(index + 1).padStart(2, '0')}`, titleX, 145, { size: 17, color: scene.ink, family: SANS });
          text(ctx, scene.zh, titleX, 233, { size: 61, color: scene.ink, weight: 600 });
          text(ctx, scene.en, titleX + 3, 277, { size: 25, color: scene.ink });
          text(ctx, scene.era, titleX + 3, 324, { size: 24, color: scene.ink });
        }
      }

      if (!renderer.finished || index < 0 || index > 19) {
        line(ctx, [[left, ROAD_Y], [left + PANEL_WIDTH, ROAD_Y]], scene.ink, 2.5);
        line(ctx, [[left, ROAD_Y + 58], [left + PANEL_WIDTH, ROAD_Y + 58]], scene.ink, 1.2);
        for (let marker = Math.floor(camera / 120) * 120; marker < camera + W + 200; marker += 120) {
          line(ctx, [[marker - camera, ROAD_Y + 30], [marker - camera + 38, ROAD_Y + 30]], scene.accent, 1.5);
        }
      }
      if (rider && (!renderer.finished || index < 0 || index > 19)) {
        const characterT = scene.updateHz ? quantizeTime(t, scene.updateHz) : t;
        const placement = { x: riderX, y: ROAD_Y - 73 * portrait.riderScale, scale: portrait.riderScale, t, localT: t - scene.start };
        if (index > 19) renderer.renderRider(ctx, poseAt(characterT), placement);
        else drawPelican(ctx, poseAt(characterT), { ...placement, ink: scene.ink, accent: scene.accent });
      }
      ctx.restore();
    }

    // The last Nosferatu shadow is wired into the first green vector trace.
    // Both outlines are reconstructed from the requested time so seeking cannot
    // leave a stale glow or alter the 14→15 handoff.
    if (rider && t >= 88.72 && t <= 89.32) {
      const envelope = smooth((t - 88.72) / 0.18) * (1 - smooth((t - 89.16) / 0.16));
      if (envelope > 0) {
        const sourceLeft = 13 * PANEL_WIDTH - camera;
        const sourceOrigin = sourceLeft + (PANEL_WIDTH - 1000) / 2;
        const targetLeft = 14 * PANEL_WIDTH - camera;
        const targetOrigin = targetLeft + (PANEL_WIDTH - 1000) / 2;
        const pose = poseAt(t);
        const source = shadowOutlineAt(t - 83, pose).map(([x, y]) => [sourceOrigin + x, y]);
        const targetData = scopeOutlineAt(Math.max(0, t - 89), pose);
        const targetBaseX = targetOrigin + (riderX - targetOrigin);
        const targetBaseY = ROAD_Y - 73 * portrait.riderScale;
        const target = targetData.points.map(([x, y]) => [targetBaseX + x, targetBaseY + y * portrait.riderScale]);
        const morph = smooth((t - 88.92) / 0.2);
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = envelope * 0.85;
        line(ctx, source, 'rgba(142,219,142,0.32)', 13);
        line(ctx, source, '#b7ffb7', 3.1);
        if (morph > 0) {
          ctx.globalAlpha = envelope * morph * 0.72;
          line(ctx, target, 'rgba(142,219,142,0.28)', 11);
          line(ctx, target, '#b7ffb7', 2.6);
          const bridge = [source[source.length - 1], target[0]];
          line(ctx, bridge, '#b7ffb7', 2.8);
        }
        ctx.restore();
      }
    }

    if (t >= 113 && t <= 119.13) sceneRenderers[18].renderOverlay(ctx, { t });

    for (let index = 0; index <= 20; index += 1) {
      const x = index * PANEL_WIDTH - camera;
      if (x < -30 || x > W + 30) continue;
      const dark = index === 0 || index === 1 ? '#69402b' : index === 4 || index === 5 ? '#444b3a' : index === 18 || index === 19 ? '#264a42' : '#6a644e';
      const light = index === 18 || index === 19 ? '#bce0c5' : '#b8a779';
      ctx.fillStyle = dark;
      ctx.fillRect(x - 9, 75, 18, 850);
      ctx.fillStyle = light;
      ctx.fillRect(x - 5, 80, 5, 840);
      line(ctx, [[x - 16, 75], [x + 16, 75]], dark, 4);
      line(ctx, [[x - 16, 925], [x + 16, 925]], dark, 4);
      text(ctx, String(index + 1).padStart(2, '0'), x + 22, 920, { size: 15, color: dark, family: SANS });
    }
    ctx.restore();
    if (portrait.amount > 0) {
      ctx.fillStyle = '#090d0f';
      ctx.fillRect(0, 0, portrait.left, 1000);
      ctx.fillRect(portrait.left + portrait.width, 0, W, 1000);
    }
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
    if (125 + localT >= CUES.bell && 125 + localT < CUES.bell + 0.3) {
      drawPelican(ctx, poseAt(125 + localT), { x: lerp(-220, 1220, (125 + localT - CUES.bell) / 0.3), y: 352, scale: 0.52 });
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
    for (const flash of CUES.flashes) {
      const alpha = Math.max(0, 1 - Math.abs(125 + localT - flash) / 0.09) * 0.7;
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
      drawWorld(ctx, scene.highlight);
      thumbnails.push(canvas);
    });
  }

  function drawOutro(ctx, localT) {
    prepareThumbnails();
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, W, 1000);
    grain(ctx);
    const { cellWidth: cellW, cellHeight: cellH, gap, top } = GALLERY;
    const camera = outroCameraAt(localT);
    const { left } = camera;
    ctx.save();
    ctx.translate(camera.x, camera.y);
    ctx.scale(camera.scale, camera.scale);
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
    if (localT < 0.55) withAlpha(ctx, 1 - smooth(localT / 0.55), () => drawWorld(ctx, 125 - 1e-6));
    const caption = outroCaptionAt(localT);
    withAlpha(ctx, caption.alpha, () => {
      ctx.fillStyle = PAPER;
      ctx.fillRect(0, 875, W, 125);
      text(ctx, caption.text, W / 2, 947, { size: 34, align: 'center', weight: 600 });
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
