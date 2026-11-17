import { COLORS } from '../config.js';
import { gradeRun } from '../world/state.js';
import { text, panel, button, hitRect } from '../render/primitives.js';
import { drawArtIcon } from '../render/arts.js';

export const RESTART_BUTTON = { x: 390, y: 672, w: 500, h: 62 };
export const TITLE_BUTTON = { x: 497, y: 738, w: 286, h: 24 };
export function drawResults(ctx, state, input) {
  const won = state.mode === 'win';
  const fulfilled = state.omenHistory.filter(o => o.complete);
  // Opaque lacquer masks the play scene so the result reads as a deliberate finale.
  ctx.fillStyle = '#09111cf7'; ctx.fillRect(0, 0, 1280, 800);
  panel(ctx, 54, 34, 1172, 730, '#121d2a', '#d2a84b');
  panel(ctx, 64, 44, 1152, 710, '#121d2a', '#6f5b37');
  text(ctx, 'INKWARD  /  FINAL RECORD', 110, 83, 13, '#e5b84f', 'bold');
  text(ctx, won ? 'THE BELL ENDURES' : 'THE BELL FELL', 110, 145, 48, '#fff3dc', 'bold', true);
  text(ctx, won ? 'ALL EIGHT SCROLLS SEALED · THE WANDERING SPIRITS ARE HOME' : 'THE WARD IS BROKEN · EVERY FALL TEACHES THE BRUSH', 112, 174, 13, '#c4c2ba', 'bold');
  text(ctx, 'FINAL SCORE', 424, 214, 13, '#d6ad51', 'bold', false, 'center');
  text(ctx, String(state.score).padStart(6, '0'), 424, 294, 72, '#fff4df', 'bold', true, 'center');
  text(ctx, `PERSONAL BEST  ${String(state.best).padStart(6, '0')}`, 424, 319, 12, '#c9c4b9', 'bold', false, 'center');

  // A dedicated gold seal makes the run grade legible at contact-sheet size.
  ctx.save(); ctx.translate(969, 222); ctx.rotate(-0.08);
  ctx.strokeStyle = '#d9ad4d'; ctx.lineWidth = 4; ctx.strokeRect(-81, -81, 162, 162);
  ctx.lineWidth = 2; ctx.strokeRect(-71, -71, 142, 142);
  text(ctx, gradeRun(state), 0, 35, 128, '#f0c45c', 'bold', true, 'center'); ctx.restore();
  text(ctx, 'BRUSH GRADE', 969, 326, 12, '#ed5843', 'bold', false, 'center');

  const stats = [
    ['SCROLLS', `${won ? 8 : state.scroll - 1} / 8`, '#9b382e'],
    ['SPIRITS FREED', String(state.sealed), '#226f68'],
    ['BEST COMBO', `×${state.peakCombo.toFixed(1)}`, '#8a6428'],
    ['WRATH PEAK', `${state.peakWrath} / 5`, '#70343c'],
    ['OMENS', `${fulfilled.length} / ${state.omenHistory.length}`, '#365d78'],
  ];
  stats.forEach(([label, value, color], i) => {
    const x = 110 + i * 214;
    panel(ctx, x, 350, 202, 96, color, '#d2a84b');
    text(ctx, label, x + 101, 378, 11, '#f2d58e', 'bold', false, 'center');
    text(ctx, value, x + 101, 424, 31, '#fff5e2', 'bold', true, 'center');
  });
  text(ctx, `OMEN RECORD  ·  ${fulfilled.slice(0, 4).map(o => `S${o.scroll} ${({ cranes: 'CRANES', unharmed: 'UNHARMED', boss: 'BOSS' })[o.id]}`).join('     ·     ') || 'THE NEXT SCROLL HOLDS A CHALLENGE'}`, 112, 480, 12, '#e5dfd0', 'bold');
  text(ctx, `WRATH HUNTERS SEALED ${state.huntersSealed}  ·  HUNT TIME ${Math.round(state.huntTime)}s  ·  ${state.largestSeal} SPIRITS IN ONE SEAL`, 112, 503, 11, '#e95a45', 'bold');

  text(ctx, 'BRUSH ARTS HELD', 112, 546, 13, '#d9ad4d', 'bold');
  const iconGap = Math.min(104, 768 / Math.max(1, state.arts.length));
  const iconStart = 640 - (Math.max(1, state.arts.length) - 1) * iconGap / 2;
  state.arts.forEach((id, i) => {
    const x = iconStart + i * iconGap;
    drawArtIcon(ctx, id, x, 585, 42);
    text(ctx, id.replace(/([a-z])([A-Z])/g, '$1 $2').toUpperCase(), x, 620, 9, '#e9e1d1', 'bold', false, 'center');
  });
  button(ctx, 'PLAY AGAIN  /  R', RESTART_BUTTON, hitRect(input.pointer, RESTART_BUTTON), 'RESTART THIS RUN');
  text(ctx, 'RETURN TO TITLE  /  ESC', 640, 753, 11, hitRect(input.pointer, TITLE_BUTTON) ? '#ef5844' : '#c7c1b5', 'bold', false, 'center');
}
