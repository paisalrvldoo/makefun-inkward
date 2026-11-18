import { UNLOCKS } from '../../save.js';
import { panel, text, line, circle } from '../../render/primitives.js';
import { drawArtIcon } from '../../render/arts.js';
import { resultReveal } from '../resultMotion.js';

export function drawUnlocks(ctx, state) {
  panel(ctx, 64, 624, 1152, 64, '#18262d', '#be9649');
  text(ctx, state.unlocks.length ? 'UNLOCKED' : 'NEXT RUN', 84, 651, 16, '#f3ce77', 'bold', true);
  text(ctx, 'A LASTING LEGACY', 84, 671, 9, '#abbab7', 'bold');
  UNLOCKS.forEach((unlock, i) => {
    const x = 231 + i * 194, owned = state.unlocks.includes(unlock.id), fresh = state.newUnlocks.includes(unlock.id);
    line(ctx, [[x - 12, 635], [x - 12, 677]], '#6e6243', 1);
    ctx.save(); ctx.globalAlpha = (owned ? 1 : 0.4) * resultReveal(state.resultsTime ?? 5, 2.3 + i * 0.15);
    if (unlock.kind === 'BRUSH ART') drawArtIcon(ctx, unlock.id, x + 18, 653, 29, { fill: '#e5d3a4', outline: '#f5d787' });
    else if (unlock.kind === 'CHALLENGE') {
      circle(ctx, x + 18, 653, 16, '#28424b', '#e3bd68', 1.5);
      text(ctx, unlock.id === 'ascension' ? '∞' : 'M', x + 18, 660, 23, '#f2d182', 'bold', true, 'center');
    } else {
      circle(ctx, x + 18, 653, 16, '#c3dceb', '#f0d99f', 1.5);
      circle(ctx, x + 17, 652, 9, '#fff5d6'); circle(ctx, x + 22, 648, 8, '#c3dceb');
    }
    text(ctx, unlock.name, x + 44, 653, 11, '#fff0d2', 'bold');
    text(ctx, owned ? unlock.kind : 'SEAL ALL 8 SCROLLS', x + 44, 673, 9, '#b9c4bc', 'bold');
    if (fresh) text(ctx, 'NEW', x + 175, 638, 8, '#f2c761', 'bold', false, 'right');
    ctx.restore();
  });
}

