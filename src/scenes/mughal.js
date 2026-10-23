import { SCENES } from './catalog.js';
import { renderPlaceholder } from './placeholder.js';

export const scene = SCENES[7];

export function renderAt(ctx, frame) {
  renderPlaceholder(ctx, { ...frame, scene });
}
