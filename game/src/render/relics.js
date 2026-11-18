import { RELICS } from '../arts/relics.js';
import { circle, text } from './primitives.js';

export function drawRelics(ctx, state, x = 575, y = 80) {
  state.relics.forEach((id, i) => {
    const relic = RELICS.find(r => r.id === id), px = x + i * 30;
    circle(ctx, px, y, 11, '#1d3040', relic.color, 1.5);
    text(ctx, relic.glyph, px, y + 4, 12, relic.color, 'bold', false, 'center');
  });
}
