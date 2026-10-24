import p5 from 'p5';
import './styles.css';
import { DURATION, WIDTH, HEIGHT, formatTime, normalizeTime, locate } from '../beat/timeline.js';
import { SCENES } from '../scenes/catalog.js';
import { sceneRenderers } from '../scenes/index.js';
import { paperTexture } from '../kit/canvas.js';
import { prepareBrush } from '../kit/brush.js';
import { createCompositor } from './compositor.js';

const query = new URLSearchParams(location.search);
const exportMode = query.get('export') === '1';
if (exportMode) document.body.classList.add('export-mode');

document.querySelector('#app').innerHTML = `
  <div class="shell">
    <header class="masthead">
      <div class="identity"><div class="monogram" aria-hidden="true">鹈</div><div><h1>鹈鹕测试</h1><div class="subtitle">The Pelican Test · An improbable art history</div></div></div>
      <div class="reel-meta"><strong>批次 C · 十五幕已完成</strong><br />20 个时代 · 02:17 · 无声</div>
    </header>
    <section class="screen-wrap" aria-label="动画预览">
      <div id="screen"></div><div class="loading" role="status">正在展开这段尚待考证的艺术史……</div>
      <div class="transport">
        <button class="icon-button" id="play" aria-label="播放" title="播放 / 暂停（空格）"><span class="play-icon">▶</span></button>
        <div class="timecode"><span id="time">0:00</span> / 2:17</div>
        <input id="seek" type="range" min="0" max="137" step="0.001" value="0" aria-label="播放进度" />
        <div class="now-playing"><span id="number">序</span><strong id="name">一本正经地胡说</strong></div>
        <button class="icon-button" id="fullscreen" aria-label="全屏预览" title="全屏">⛶</button>
      </div>
    </section>
    <div class="chapters-head"><span>沿路的二十个时代</span><span>点击跳转 · ← → 前后半秒</span></div>
    <nav class="chapters" aria-label="版块跳转">${SCENES.map((scene) => `<button class="chapter" style="--color:${scene.paper}" data-scene="${scene.index}" aria-label="跳到${scene.zh}" title="${scene.zh} · ${scene.era}">${String(scene.number).padStart(2, '0')}</button>`).join('')}</nav>
    <footer class="footer"><p>一条路，二十份答卷。鹈鹕本人尚未发表评论。</p><select id="scene-select" aria-label="选择版块"><option value="0">序 · 一本正经地胡说</option>${SCENES.map((scene) => `<option value="${scene.start}">${String(scene.number).padStart(2, '0')} · ${scene.zh}</option>`).join('')}<option value="125">终 · 新闻发布会</option></select></footer>
  </div>`;

let currentTime = normalizeTime(Number(query.get('t') || 0));
let playing = false;
let anchorTime = currentTime;
let anchorWall = 0;
let animationFrame;
let renderer;
let compositor;
let output;
let brush;

function updateControls() {
  const frame = locate(currentTime);
  document.querySelector('#time').textContent = formatTime(currentTime);
  document.querySelector('#seek').value = String(currentTime);
  document.querySelector('#seek').setAttribute('aria-valuetext', `${formatTime(currentTime)}，${frame.kind === 'scene' ? SCENES[frame.index].zh : frame.kind === 'intro' ? '序幕' : '新闻发布会'}`);
  document.querySelector('#name').textContent = frame.kind === 'scene' ? SCENES[frame.index].zh : frame.kind === 'intro' ? '一本正经地胡说' : '新闻发布会';
  document.querySelector('#number').textContent = frame.kind === 'scene' ? String(frame.index + 1).padStart(2, '0') : frame.kind === 'intro' ? '序' : '终';
  document.querySelector('#play').setAttribute('aria-label', playing ? '暂停' : '播放');
  document.querySelector('.play-icon').textContent = playing ? 'Ⅱ' : '▶';
  document.querySelectorAll('[data-scene]').forEach((button) => button.setAttribute('aria-current', String(frame.kind === 'scene' && Number(button.dataset.scene) === frame.index)));
  document.querySelector('#scene-select').value = String(frame.kind === 'scene' ? SCENES[frame.index].start : frame.kind === 'intro' ? 0 : 125);
}

function renderAt(time) {
  currentTime = normalizeTime(time);
  const ctx = output.drawingContext;
  ctx.save();
  ctx.setTransform(WIDTH / (1000 * 16 / 9), 0, 0, HEIGHT / 1000, 0, 0);
  compositor.renderAt(ctx, currentTime);
  ctx.restore();
  renderer.clear();
  renderer.image(output, -WIDTH / 2, -HEIGHT / 2, WIDTH, HEIGHT);
  renderer._renderer?.flushDraw?.();
  if (!exportMode) updateControls();
  return { ...locate(currentTime), duration: DURATION };
}

function pause() {
  playing = false;
  cancelAnimationFrame(animationFrame);
  updateControls();
}

function tick(wall) {
  if (!playing) return;
  renderAt(Math.min(DURATION, anchorTime + (wall - anchorWall) / 1000));
  if (currentTime >= DURATION) pause();
  else animationFrame = requestAnimationFrame(tick);
}

function play() {
  if (playing) return;
  if (currentTime >= DURATION) renderAt(0);
  playing = true;
  anchorTime = currentTime;
  anchorWall = performance.now();
  updateControls();
  animationFrame = requestAnimationFrame(tick);
}

function seek(time) {
  renderAt(time);
  anchorTime = currentTime;
  anchorWall = performance.now();
}

async function start() {
  // Register the addon's p5 lifecycle hooks before constructing the sketch.
  window.p5 = p5;
  const brushRuntime = await import('p5.brush');
  await new Promise((resolve, reject) => {
    new p5((p) => {
      p.setup = () => {
        try {
          p.pixelDensity(1);
          p.createCanvas(WIDTH, HEIGHT, p.WEBGL);
          p.setAttributes({ preserveDrawingBuffer: true, alpha: false, antialias: false });
          // setAttributes recreates the canvas; parent the resulting canvas.
          document.querySelector('#screen').append(p.canvas);
          p.noLoop();
          renderer = p;
          output = p.createGraphics(WIDTH, HEIGHT);
          output.pixelDensity(1);
          resolve();
        } catch (error) { reject(error); }
      };
    });
  });

  // Explicitly request every title/caption glyph before any export or thumbnail.
  const sceneGlyphs = sceneRenderers.map((scene) => `${scene.UI_GLYPHS || ''}${scene.TITLE_GLYPHS || ''}`).join('');
  const glyphs = `${document.body.textContent}人类自古以来就痴迷于画鹈鹕骑自行车。——早在自行车被发明之前。图一骑行摹本艺术通史卷一虚构书名截至目前，人类共提交了20份答卷。鹈鹕本人对此尚未发表评论。新闻发布会牧养时代山有千仞行者一骑${sceneGlyphs}${SCENES.map((scene) => scene.zh + scene.en + scene.era).join('')}`;
  await Promise.all([400, 600].map((weight) => document.fonts.load(`${weight} 32px "Noto Serif SC Variable"`, glyphs)));
  await document.fonts.ready;
  brush = await prepareBrush(renderer, brushRuntime);
  for (const scene of sceneRenderers) scene.prepare?.({ brush });
  compositor = createCompositor({ paper: paperTexture() });
  renderAt(currentTime);
  document.querySelector('.loading').remove();
  document.querySelector('#play').addEventListener('click', () => playing ? pause() : play());
  document.querySelector('#seek').addEventListener('input', (event) => seek(Number(event.target.value)));
  document.querySelector('#scene-select').addEventListener('change', (event) => seek(Number(event.target.value)));
  document.querySelectorAll('[data-scene]').forEach((button) => button.addEventListener('click', () => seek(SCENES[Number(button.dataset.scene)].start + 1)));
  document.querySelector('#fullscreen').addEventListener('click', async () => {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.querySelector('.screen-wrap').requestFullscreen();
  });
  window.addEventListener('keydown', (event) => {
    if (['INPUT', 'SELECT', 'BUTTON', 'TEXTAREA'].includes(event.target.tagName)) return;
    if (event.code === 'Space') { event.preventDefault(); playing ? pause() : play(); }
    if (event.code === 'ArrowRight') { event.preventDefault(); seek(Math.min(DURATION, currentTime + 0.5)); }
    if (event.code === 'ArrowLeft') { event.preventDefault(); seek(Math.max(0, currentTime - 0.5)); }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.pelican = Object.freeze({
    ready: true, renderAt, seek, play, pause, duration: DURATION, width: WIDTH, height: HEIGHT,
    getState: () => ({ time: currentTime, playing, frame: locate(currentTime), brushVerified: brush.verified }),
  });
}

start().catch((error) => {
  console.error(error);
  window.pelicanError = error.message;
  const loading = document.querySelector('.loading');
  if (loading) { loading.className = 'error'; loading.textContent = `预览未能启动：${error.message}`; }
});
