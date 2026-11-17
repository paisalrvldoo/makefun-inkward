import { COLORS } from '../config.js';
import { text, panel, stamp, hitRect, wrapText } from '../render/primitives.js';

export const DRAFT_RECTS = [0, 1, 2].map(i => ({ x: 116 + i * 356, y: 282, w: 336, h: 309 }));
export function drawDraft(ctx, state, input) {
  ctx.fillStyle = '#f6f0dfed'; ctx.fillRect(0, 0, 1280, 800);
  text(ctx, `SCROLL ${state.scroll} COMPLETE`, 640, 133, 17, COLORS.green, 'bold', false, 'center');
  text(ctx, 'A new art for your brush.', 640, 192, 49, COLORS.ink, 'bold', true, 'center');
  text(ctx, 'Choose one. Your ink refills. Your bell carries its scars.', 640, 236, 18, COLORS.faint, 'normal', true, 'center');
  state.draft.forEach((art, i) => {
    const rect = DRAFT_RECTS[i], hover = hitRect(input.pointer, rect);
    panel(ctx, rect.x, rect.y, rect.w, rect.h, hover ? '#f4e5cb' : '#fcf7e9', hover ? COLORS.red : COLORS.line);
    text(ctx, `0${i + 1}  /  ${art.type}`, rect.x + 22, rect.y + 33, 11, COLORS.gold, 'bold');
    stamp(ctx, art.rune, rect.x + rect.w / 2, rect.y + 91, 61, -0.07);
    text(ctx, art.name, rect.x + rect.w / 2, rect.y + 163, 26, COLORS.ink, 'bold', true, 'center');
    wrapText(ctx, art.description, rect.x + 23, rect.y + 198, rect.w - 46, 23, 16, COLORS.red);
    wrapText(ctx, art.detail, rect.x + 23, rect.y + 248, rect.w - 46, 19, 12, COLORS.faint);
    text(ctx, `CLICK OR PRESS ${i + 1}`, rect.x + rect.w / 2, rect.y + rect.h + 30, 12, COLORS.red, 'bold', false, 'center');
  });
  text(ctx, `BELL ${state.bell.hp}/12    ·    SCORE ${state.score}    ·    ${state.sealed} SPIRITS FREED`, 640, 699, 16, COLORS.gold, 'bold', true, 'center');
}
