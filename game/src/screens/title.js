import { COLORS } from '../config.js';
import { YOKAI } from '../entities/yokai.js';
import { drawMonk, drawBell, drawYokai } from '../render/sprites.js';
import { text, line, panel, button, hitRect, stamp, circle } from '../render/primitives.js';
import { wash, blossom } from '../render/paper.js';
import { DIFFICULTIES } from '../world/difficulty.js';
import { ONI } from '../entities/bosses.js';
import { drawTutorial } from './tutorial.js';

export const START_BUTTON = { x: 64, y: 438, w: 398, h: 72 };
export const DIFFICULTY_RECTS = DIFFICULTIES.map((d, i) => ({ x: 64 + i * 136, y: 524, w: 126, h: 31, id: d.id }));
export const SKIN_BUTTON = { x: 290, y: 388, w: 208, h: 27 };
export function drawTitle(ctx, state, input, audio) {
  ctx.fillStyle = '#111a27'; ctx.fillRect(0, 0, 1280, 800);
  wash(ctx, 973, 258, 352, '#ad2e2a', 0.28);
  wash(ctx, 803, 475, 252, '#286b77', 0.27);
  wash(ctx, 342, 548, 400, '#1b3541', 0.42);
  text(ctx, 'A LITTLE BRUSH. A LASTING WARD.', 64, 53, 12, '#ef5a45', 'bold');
  line(ctx, [[64, 69], [1216, 69]], '#886b3c', 1);
  text(ctx, `BEST  ${String(state.best).padStart(6, '0')}`, 1216, 52, 13, '#efc15d', 'bold', true, 'right');

  // The vermilion moon, shrine, monk and spirits reuse the actual game sprites.
  ctx.save();
  circle(ctx, 965, 264, 192, '#d83b2d', '#f0c15d', 5);
  circle(ctx, 965, 264, 177, null, '#f2a44c88', 2);
  wash(ctx, 916, 206, 108, '#f27b43', 0.52);
  ctx.fillStyle = '#0c1723'; ctx.beginPath(); ctx.moveTo(615, 446); ctx.lineTo(724, 333); ctx.lineTo(786, 375); ctx.lineTo(883, 286); ctx.lineTo(1011, 418); ctx.lineTo(1118, 331); ctx.lineTo(1280, 450); ctx.lineTo(1280, 585); ctx.lineTo(615, 585); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#101e2a'; ctx.beginPath(); ctx.moveTo(639, 507); ctx.lineTo(776, 396); ctx.lineTo(856, 456); ctx.lineTo(1030, 371); ctx.lineTo(1179, 486); ctx.lineTo(1280, 420); ctx.lineTo(1280, 590); ctx.lineTo(639, 590); ctx.closePath(); ctx.fill();
  line(ctx, [[620, 525], [738, 488], [831, 517], [944, 474], [1082, 516], [1237, 477]], '#d2a553', 3);
  for (const [x, y, size] of [[1120, 125, 16], [1192, 178, 10], [692, 151, 12], [1187, 383, 12], [690, 435, 8]]) blossom(ctx, x, y, size, 0, '#edb84f');
  // Thick hand-painted ward cuts across the moon-lit encounter.
  const arc = [];
  for (let i = 0; i <= 70; i++) { const angle = i / 70 * Math.PI * 2; arc.push([1012 + Math.cos(angle) * (151 + Math.sin(angle * 3) * 8), 321 + Math.sin(angle) * 119]); }
  line(ctx, arc, '#101820', 16); line(ctx, arc, '#e9c36e', 2);
  const enemies = [
    { kind: 'kappa', x: 1082, y: 194, s: 1.65 }, { kind: 'umbrella', x: 1168, y: 300, s: 1.62 },
    { kind: 'lantern', x: 896, y: 209, s: 1.65 }, { kind: 'fox', x: 1140, y: 454, s: 1.7 },
    { kind: 'crane', x: 772, y: 254, s: 1.65 }, { kind: 'eater', x: 1025, y: 476, s: 1.7 },
    { kind: 'oni', x: 1194, y: 405, s: 1.35 },
  ];
  enemies.forEach(e => drawYokai(ctx, { ...e, color: e.kind === 'oni' ? ONI.ember.color : YOKAI[e.kind].color, phase: 0, radius: 22, maxHp: 5, hp: 4 }, state.time, e.s));
  drawBell(ctx, { x: 930, y: 448, hp: 12, maxHp: 12, hitTime: 0, skin: state.bell.skin }, state.time, 1.6);
  drawMonk(ctx, { x: 755, y: 454, hurtTime: 0 }, state.time, 2.15);
  stamp(ctx, 'WARD', 1189, 512, 66, -0.12);
  ctx.restore();

  ctx.save(); ctx.shadowColor = '#e0a83f'; ctx.shadowBlur = 18;
  text(ctx, 'INKWARD', 57, 190, 112, '#e0b45b', 'bold', true);
  ctx.shadowBlur = 0; text(ctx, 'INKWARD', 51, 184, 112, '#fff5dd', 'bold', true); ctx.restore();
  text(ctx, 'GUARD THE LAST BELL', 66, 234, 24, '#e94a37', 'bold', true);
  text(ctx, 'Paint ink walls. Encircle the yokai.', 67, 273, 19, '#f6edda', 'normal', true);
  text(ctx, 'Seal spirits. Feed WRATH. Shape your own brush.', 67, 301, 14, '#c9c5ba');
  const badges = [
    { x: 64, w: 122, label: '8 SCROLLS', fill: '#b8342b' },
    { x: 197, w: 112, label: '3 ONI', fill: '#b77926' },
    { x: 320, w: 178, label: (state.unlocks.includes('moonInk') ? '14' : '12') + ' BRUSH ARTS', fill: '#26766d' },
  ];
  for (const badge of badges) { panel(ctx, badge.x, 328, badge.w, 37, badge.fill, '#f0c15d'); text(ctx, badge.label, badge.x + badge.w / 2, 352, 13, '#fff7e5', 'bold', false, 'center'); }
  if (state.unlocks.includes('moonBell')) {
    panel(ctx, SKIN_BUTTON.x, SKIN_BUTTON.y, SKIN_BUTTON.w, SKIN_BUTTON.h, '#24313d', '#8a6b3c');
    text(ctx, 'BELL: ' + state.bell.skin.toUpperCase() + '  /  B', 394, 406, 11, '#c3dceb', 'bold', false, 'center');
  }

  button(ctx, 'OPEN THE FIRST SCROLL', START_BUTTON, hitRect(input.pointer, START_BUTTON), 'CLICK TO BEGIN  /  ENTER');
  DIFFICULTY_RECTS.forEach((rect, i) => {
    const selected = state.difficulty === rect.id;
    const locked = rect.id === 'master' && !state.unlocks.includes('master');
    panel(ctx, rect.x, rect.y, rect.w, rect.h, selected ? '#bd382d' : '#24313d', selected ? '#f5c65c' : '#8a6b3c');
    text(ctx, DIFFICULTIES[i].name + (locked ? ' · LOCKED' : ''), rect.x + rect.w / 2, rect.y + 21, locked ? 10 : 12, locked ? '#90999c' : '#fff3d9', 'bold', false, 'center');
  });
  text(ctx, DIFFICULTIES.find(d => d.id === state.difficulty).hint, 68, 578, 12, '#d0c9b8');
  if (!state.unlocks.includes('master')) text(ctx, 'Seal all 8 scrolls to unlock Master + 2 new arts.', 68, 600, 11, '#e5b854');

  drawTutorial(ctx);
  text(ctx, 'WASD MOVE', 68, 775, 12, '#f0c15d', 'bold');
  text(ctx, 'SPACE DASH', 226, 775, 12, '#f0c15d', 'bold');
  text(ctx, 'LMB PAINT + CLOSE', 390, 775, 12, '#f0c15d', 'bold');
  text(ctx, 'RMB SPLASH', 612, 775, 12, '#f0c15d', 'bold');
  text(ctx, 'Q LOTUS  ·  E BELL  ·  P PAUSE', 782, 775, 12, '#f0c15d', 'bold');
  text(ctx, audio.muted ? 'M  SOUND OFF' : 'M  SOUND ON', 1216, 775, 11, '#fff1d2', 'bold', false, 'right');
  text(ctx, 'PROCEDURAL PAPER, INK & SOUND  /  PAISALRVLDOO', 64, 789, 10, '#9a9a91');
}
