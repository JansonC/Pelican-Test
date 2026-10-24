import { STAGE_WIDTH, clamp } from '../beat/timeline.js';
import { smooth, lerp } from '../kit/math.js';

export const GALLERY = Object.freeze({ columns: 7, cellWidth: 216, cellHeight: 206, gap: 15, top: 145, inset: 5, pictureWidth: 206, pictureHeight: 116 });

export function outroCameraAt(localT) {
  const { columns, cellWidth, gap, top, cellHeight, inset, pictureHeight, pictureWidth } = GALLERY;
  const left = (STAGE_WIDTH - (cellWidth * columns + gap * (columns - 1))) / 2;
  const push = smooth((localT - 2) / 4);
  const pull = 1 - smooth(localT / 1.25);
  const scale = 1 + (STAGE_WIDTH / pictureWidth - 1) * pull + 6.2 * push;
  const focusX = left + (push > 0 ? 6 : 5) * (cellWidth + gap) + cellWidth / 2;
  const focusY = top + 2 * (cellHeight + gap) + inset + pictureHeight / 2;
  return {
    left, scale,
    x: (STAGE_WIDTH / 2 - focusX * scale) * (push + pull),
    y: (lerp(500, 445, push) - focusY * scale) * (push + pull),
  };
}

export function outroCaptionAt(localT) {
  return localT < 6
    ? { text: '截至目前，人类共提交了 20 份答卷。', alpha: smooth((localT - 0.4) / 0.3) * (1 - smooth((localT - 5.2) / 0.6)) }
    : { text: '鹈鹕本人对此尚未发表评论。', alpha: smooth((localT - 6) / 0.3) };
}

export function songCameraAt(localT) {
  // The full bicycle must clear a portal before its apparent scale changes.
  const small = smooth((localT - 0.7) / 0.6) * (1 - smooth((localT - 4.2) / 1.05));
  const search = smooth((localT - 1.85) / 1.2) * (1 - smooth((localT - 3.85) / 1.4));
  const found = smooth((localT - 2) / 0.8) * (1 - smooth((localT - 4.2) / 1.05));
  return { zoom: 1 + search * 2.8, riderScale: lerp(1, 0.09, small) + found * 0.105 };
}

export function portraitAt(t) {
  const amount = smooth((t - 112.65) / 0.7) * (1 - smooth((t - 119) / 0.5));
  const width = lerp(STAGE_WIDTH, 562.5, amount);
  return { amount, width, left: (STAGE_WIDTH - width) / 2, riderX: lerp(720, STAGE_WIDTH / 2 - 12, amount), riderScale: lerp(1, 0.68, amount), progress: clamp((t - 113) / 6) };
}

export function codeCameraAt(t) {
  const amount = smooth((t - 119.7) / 0.65) * (1 - smooth((t - 123.6) / 0.65));
  return { riderOffset: amount * 510, paneAlpha: amount };
}
