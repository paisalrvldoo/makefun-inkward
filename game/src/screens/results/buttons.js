import { panel, text, hitRect } from '../../render/primitives.js';

export function resultButton(ctx, label, hint, rect, input, primary = false) {
  const hover = hitRect(input.pointer, rect);
  panel(ctx, rect.x, rect.y, rect.w, rect.h, primary ? hover ? '#df6247' : '#ba3d30' : hover ? '#29404c' : '#192b37', primary ? '#e8a26c' : '#bd974a');
  panel(ctx, rect.x + 5, rect.y + 5, rect.w - 10, rect.h - 10, primary ? hover ? '#df6247' : '#ba3d30' : hover ? '#29404c' : '#192b37', primary ? '#ecb084' : '#506159');
  text(ctx, label, rect.x + rect.w / 2, rect.y + 28, 22, '#fff0d5', 'bold', true, 'center');
  text(ctx, hint, rect.x + rect.w / 2, rect.y + 46, 9, primary ? '#f9d9b2' : '#bbc8c5', 'bold', false, 'center');
}

