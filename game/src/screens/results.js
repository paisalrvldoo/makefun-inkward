import { COLORS } from '../config.js';
import { gradeRun } from '../world/state.js';
import { text, panel, stamp, button, hitRect } from '../render/primitives.js';
import { omenReward } from '../world/omens.js';

export const RESTART_BUTTON = { x: 446, y: 622, w: 388, h: 66 };
export const TITLE_BUTTON = { x: 497, y: 705, w: 286, h: 34 };
export function drawResults(ctx, state, input) {
  const won = state.mode === 'win';
  ctx.fillStyle = '#f6f0dfe8'; ctx.fillRect(0, 0, 1280, 800);
  panel(ctx, 183, 76, 914, 679, '#fcf6e9f2', '#bda875');
  text(ctx, won ? 'VICTORY  /  ALL EIGHT SCROLLS SEALED' : 'DEFEAT  /  THE WARD IS BROKEN', 640, 132, 17, won ? COLORS.green : COLORS.red, 'bold', false, 'center');
  text(ctx, won ? 'THE BELL ENDURES' : 'THE BELL FELL', 640, 212, won ? 55 : 65, COLORS.ink, 'bold', true, 'center');
  text(ctx, won ? 'The seasons turn. The wandering spirits are home.' : 'Every broken ward teaches the brush a new way.', 640, 254, 21, COLORS.faint, 'normal', true, 'center');
  text(ctx, 'FINAL SCORE', 528, 312, 12, COLORS.faint, 'bold', false, 'center');
  text(ctx, String(state.score).padStart(6, '0'), 528, 373, 64, COLORS.ink, 'bold', true, 'center');
  stamp(ctx, gradeRun(state), 831, 337, 88, -0.09);
  text(ctx, 'BRUSH GRADE', 831, 402, 11, COLORS.red, 'bold', false, 'center');
  const stats = [
    ['SCROLLS', `${won ? 8 : state.scroll - 1} / 8`], ['SPIRITS FREED', String(state.sealed)],
    ['BEST COMBO', `×${state.peakCombo.toFixed(1)}`], ['BIGGEST SEAL', `×${state.largestSeal}`],
  ];
  stats.forEach(([label, value], i) => {
    const x = 256 + i * 193;
    panel(ctx, x, 424, 183, 75, '#f0e7d1');
    text(ctx, label, x + 91, 446, 11, COLORS.faint, 'bold', false, 'center');
    text(ctx, value, x + 91, 482, 29, COLORS.ink, 'bold', true, 'center');
  });
  const fulfilled = state.omenHistory.filter(o => o.complete);
  text(ctx, `OMENS FULFILLED  ${fulfilled.length}/${state.omenHistory.length}`, 256, 522, 13, COLORS.green, 'bold');
  fulfilled.forEach((omen, i) => {
    const label = { cranes: '3 CRANES / ONE LOOP', unharmed: 'BELL UNHARMED', boss: 'BOSS / TWO LOOPS' }[omen.id];
    text(ctx, `S${omen.scroll} · ${label} · ${omenReward(omen)}`, 256 + Math.floor(i / 4) * 400, 545 + i % 4 * 17, 11, COLORS.ink, 'bold');
  });
  if (!fulfilled.length) text(ctx, 'An optional challenge awaits in every scroll.', 256, 551, 14, COLORS.faint, 'normal', true);
  text(ctx, `PERSONAL BEST ${String(state.best).padStart(6, '0')}  ·  ${state.arts.length} BRUSH ARTS`, 640, 609, 13, COLORS.gold, 'bold', true, 'center');
  button(ctx, 'PAINT ANOTHER WARD', RESTART_BUTTON, hitRect(input.pointer, RESTART_BUTTON), 'CLICK TO RESTART  /  R');
  text(ctx, 'RETURN TO TITLE  /  ESC', 640, 727, 12, hitRect(input.pointer, TITLE_BUTTON) ? COLORS.red : COLORS.faint, 'bold', false, 'center');
}
