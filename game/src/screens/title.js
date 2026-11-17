import { COLORS } from '../config.js';
import { YOKAI } from '../entities/yokai.js';
import { drawMonk, drawBell, drawYokai } from '../render/sprites.js';
import { text, line, panel, button, hitRect, stamp, circle } from '../render/primitives.js';
import { wash, blossom } from '../render/paper.js';

export const START_BUTTON = { x: 64, y: 438, w: 398, h: 72 };
export function drawTitle(ctx, state, input, audio) {
  wash(ctx, 1080, 150, 310, '#edc3b8', 0.45);
  wash(ctx, 790, 454, 260, '#d7dfb7', 0.4);
  text(ctx, 'A LITTLE BRUSH. A LASTING WARD.', 64, 69, 12, COLORS.red, 'bold');
  line(ctx, [[64, 86], [1216, 86]], COLORS.line, 1);
  text(ctx, 'INKWARD', 55, 221, 118, COLORS.ink, 'bold', true);
  text(ctx, 'Guard the last bell.', 64, 273, 40, COLORS.red, 'normal', true);
  text(ctx, 'Paint ink walls. Encircle the yokai.', 67, 324, 22, COLORS.ink, 'normal', true);
  text(ctx, 'Set wandering spirits free before they crack your shrine.', 67, 357, 17, COLORS.faint);
  text(ctx, '8 SCROLLS     4 SEASONS     3 ONI BOSSES     12 BRUSH ARTS', 67, 399, 12, COLORS.gold, 'bold');
  button(ctx, 'OPEN THE FIRST SCROLL', START_BUTTON, hitRect(input.pointer, START_BUTTON), 'CLICK TO BEGIN  /  ENTER');
  text(ctx, 'A fresh brush art after every scroll. No two wards alike.', 68, 538, 14, COLORS.faint, 'normal', true);
  text(ctx, `BEST  ${String(state.best).padStart(6, '0')}`, 1216, 67, 14, COLORS.gold, 'bold', true, 'right');

  ctx.save();
  // The title's illustrated rules use the very same monk, shrine, enemies and stroke drawing as play.
  circle(ctx, 914, 332, 178, null, '#c5b789', 1);
  ctx.setLineDash([2, 10]); circle(ctx, 914, 332, 191, null, '#c5b789', 1); ctx.setLineDash([]);
  drawBell(ctx, { x: 880, y: 393, hp: 12, hitTime: 0 }, state.time, 1.7);
  drawMonk(ctx, { x: 743, y: 455, hurtTime: 0 }, state.time, 1.85);
  const enemies = [
    { kind: 'kappa', x: 1024, y: 265 }, { kind: 'umbrella', x: 1082, y: 322 },
    { kind: 'lantern', x: 959, y: 297 }, { kind: 'fox', x: 1132, y: 436 }, { kind: 'crane', x: 785, y: 216 },
  ];
  enemies.forEach(e => drawYokai(ctx, { ...e, color: YOKAI[e.kind].color, phase: 0, radius: 20 }, state.time, 1.2));
  const arc = [];
  for (let i = 0; i <= 65; i++) { const angle = i / 65 * Math.PI * 2; arc.push([1028 + Math.cos(angle) * (102 + Math.sin(angle * 3) * 5), 290 + Math.sin(angle) * 87]); }
  line(ctx, arc, COLORS.ink, 8);
  line(ctx, arc.map(([x, y]) => [x + 2, y + 1]), '#f2e5c433', 1);
  circle(ctx, 1131, 290, 17, '#bb44361a', COLORS.red, 2);
  text(ctx, 'CLOSE THE LOOP', 1077, 186, 13, COLORS.red, 'bold', false, 'center');
  line(ctx, [[1094, 194], [1142, 231], [1134, 267]], COLORS.red, 1.5);
  stamp(ctx, 'WARD', 1173, 511, 65, -0.12);
  for (const [x, y, size] of [[1192, 123, 17], [1152, 142, 10], [682, 187, 11], [698, 568, 9]]) blossom(ctx, x, y, size);
  ctx.restore();

  const cards = [
    { x: 64, n: '01', title: 'PAINT A WALL', detail: 'Hold LMB to draw. Ink blocks spirits.', sub: 'Release the brush to refill your ink.' },
    { x: 457, n: '02', title: 'CLOSE A LOOP', detail: 'Circle yokai. Return to the red dot.', sub: 'Seal groups for combos + ink refunds.' },
    { x: 850, n: '03', title: 'KEEP THE BELL', detail: 'Clear 8 scrolls. Draft stronger arts.', sub: 'Dash, splash and use rituals to survive.' },
  ];
  for (const card of cards) {
    panel(ctx, card.x, 590, 366, 127, '#fbf6e9');
    text(ctx, card.n, card.x + 18, 626, 25, COLORS.gold, 'bold', true);
    text(ctx, card.title, card.x + 65, 625, 17, COLORS.ink, 'bold', true);
    text(ctx, card.detail, card.x + 19, 661, 14, COLORS.ink);
    text(ctx, card.sub, card.x + 19, 687, 13, COLORS.faint);
  }
  text(ctx, 'WASD move  ·  SPACE dash  ·  LMB paint  ·  RMB splash  ·  Q lotus hush  ·  E bell ward  ·  P pause', 64, 759, 13, COLORS.faint);
  text(ctx, audio.muted ? 'M  SOUND OFF' : 'M  SOUND ON', 1216, 759, 12, COLORS.faint, 'bold', false, 'right');
  text(ctx, 'PROCEDURAL PAPER, INK & SOUND  /  PAISALRVLDOO', 64, 785, 10, '#98917e');
}
