import { COLORS } from '../config.js';
import { YOKAI } from '../entities/yokai.js';
import { drawMonk, drawBell, drawYokai } from '../render/sprites.js';
import { text, line, panel, button, hitRect, stamp, circle } from '../render/primitives.js';
import { wash, blossom } from '../render/paper.js';
import { DIFFICULTIES } from '../world/difficulty.js';
import { ONI } from '../entities/bosses.js';
import { drawTutorial } from './tutorial.js';
import { formatSeed } from '../rng.js';

export const ASCENSION_BUTTON = { x: 510, y: 562, w: 310, h: 34 };
export const START_BUTTON = { x: 64, y: 438, w: 398, h: 72 };
export const DIFFICULTY_RECTS = DIFFICULTIES.map((d, i) => ({ x: 64 + i * 136, y: 524, w: 126, h: 30, id: d.id }));
export const SKIN_BUTTON = { x: 290, y: 388, w: 208, h: 27 };
export const SEED_BUTTON = { x: 64, y: 388, w: 208, h: 27 };
export function drawTitle(ctx, state, input, audio) {
  ctx.fillStyle = '#0a1220'; ctx.fillRect(0, 0, 1280, 800);
  wash(ctx, 973, 258, 352, '#a2241f', 0.32);
  wash(ctx, 803, 475, 252, '#1d5568', 0.30);
  wash(ctx, 342, 548, 400, '#142b38', 0.48);
  text(ctx, 'A LITTLE BRUSH. A LASTING WARD.', 64, 53, 12, '#e84d3a', 'bold');
  line(ctx, [[64, 69], [1216, 69]], '#7a5b32', 1);
  text(ctx, `BEST  ${String(state.best).padStart(6, '0')}`, 1216, 52, 13, '#e4b550', 'bold', true, 'right');

  // The vermilion moon, shrine, monk and spirits reuse the actual game sprites.
  ctx.save();
  circle(ctx, 965, 264, 192, '#ce3327', '#e4b550', 5);
  circle(ctx, 965, 264, 177, null, '#e0933e88', 2);
  wash(ctx, 916, 206, 108, '#e46735', 0.58);
  ctx.fillStyle = '#08121e'; ctx.beginPath(); ctx.moveTo(615, 446); ctx.lineTo(724, 333); ctx.lineTo(786, 375); ctx.lineTo(883, 286); ctx.lineTo(1011, 418); ctx.lineTo(1118, 331); ctx.lineTo(1280, 450); ctx.lineTo(1280, 585); ctx.lineTo(615, 585); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#0a1a28'; ctx.beginPath(); ctx.moveTo(639, 507); ctx.lineTo(776, 396); ctx.lineTo(856, 456); ctx.lineTo(1030, 371); ctx.lineTo(1179, 486); ctx.lineTo(1280, 420); ctx.lineTo(1280, 590); ctx.lineTo(639, 590); ctx.closePath(); ctx.fill();
  line(ctx, [[620, 525], [738, 488], [831, 517], [944, 474], [1082, 516], [1237, 477]], '#c49a3d', 3);
  for (const [x, y, size] of [[1120, 125, 16], [1192, 178, 10], [692, 151, 12], [1187, 383, 12], [690, 435, 8]]) blossom(ctx, x, y, size, 0, '#e0a840');
  // Thick hand-painted ward cuts across the moon-lit encounter.
  const arc = [];
  for (let i = 0; i <= 70; i++) { const angle = i / 70 * Math.PI * 2; arc.push([1012 + Math.cos(angle) * (151 + Math.sin(angle * 3) * 8), 321 + Math.sin(angle) * 119]); }
  line(ctx, arc, '#0a141a', 18); line(ctx, arc, '#debb5c', 2);
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

  // Bold brush logo: a dark ink circle echoes the vermilion moon, and a layered stamp-like title with golden shadow.
  ctx.save();
  circle(ctx, 56, 178, 107, null, '#e0b45b1a', 3);
  circle(ctx, 56, 178, 98, null, '#e0b45b28', 1.5);
  ctx.shadowColor = '#ce8c2a'; ctx.shadowBlur = 26;
  text(ctx, 'INKWARD', 44, 194, 118, '#e0b45b', 'bold', true);
  ctx.shadowBlur = 0; text(ctx, 'INKWARD', 38, 188, 118, '#fff5dd', 'bold', true); ctx.restore();
  text(ctx, 'GUARD THE LAST BELL', 53, 240, 26, '#d9412c', 'bold', true);
  text(ctx, 'Paint ink walls. Encircle the yokai.', 54, 279, 20, '#f2e6cc', 'normal', true);
  text(ctx, 'Seal spirits. Feed WRATH. Shape your own brush.', 54, 309, 15, '#bfbbb0');
  const badges = [
    { x: 64, w: 122, label: '8 SCROLLS', fill: '#a82d25' },
    { x: 197, w: 112, label: '8 BOSSES', fill: '#a56e20' },
    { x: 320, w: 178, label: (state.unlocks.includes('moonInk') ? '14' : '12') + ' BRUSH ARTS', fill: '#1c605a' },
  ];
  for (const badge of badges) { panel(ctx, badge.x, 336, badge.w, 37, badge.fill, '#e4b550'); text(ctx, badge.label, badge.x + badge.w / 2, 360, 13, '#fff2db', 'bold', false, 'center'); }
  panel(ctx, SEED_BUTTON.x, SEED_BUTTON.y, SEED_BUTTON.w, SEED_BUTTON.h, hitRect(input.pointer, SEED_BUTTON) ? '#2c3f4a' : '#1e2d39', '#7a5a32');
  text(ctx, 'SEED ' + formatSeed(state.seed), 78, 406, 12, '#deba64', 'bold');
  text(ctx, 'R \u21bb', 257, 406, 10, '#b9c7bc', 'bold', false, 'right');
  if (state.unlocks.includes('moonBell')) {
    panel(ctx, SKIN_BUTTON.x, SKIN_BUTTON.y, SKIN_BUTTON.w, SKIN_BUTTON.h, '#1e2d39', '#7a5a32');
    text(ctx, 'BELL: ' + state.bell.skin.toUpperCase() + '  /  B', 394, 406, 11, '#c3dceb', 'bold', false, 'center');
  }

  button(ctx, 'OPEN THE FIRST SCROLL', START_BUTTON, hitRect(input.pointer, START_BUTTON), 'CLICK TO BEGIN  /  ENTER');
  DIFFICULTY_RECTS.forEach((rect, i) => {
    const selected = state.difficulty === rect.id;
    const locked = rect.id === 'master' && !state.unlocks.includes('master');
    panel(ctx, rect.x, rect.y, rect.w, rect.h, selected ? '#bd382d' : '#1e2d39', selected ? '#eeba55' : '#7a5a32');
    text(ctx, DIFFICULTIES[i].name + (locked ? ' \u00b7 LOCKED' : ''), rect.x + rect.w / 2, rect.y + 20, locked ? 10 : 12, locked ? '#90999c' : '#fff3d9', 'bold', false, 'center');
  });

  const endless = state.unlocks.includes('ascension');
  panel(ctx, ASCENSION_BUTTON.x, ASCENSION_BUTTON.y, ASCENSION_BUTTON.w, ASCENSION_BUTTON.h, state.expedition === 'ascension' ? '#704e92' : '#1e2d39', endless ? '#d8b5fa' : '#6c5a40');
  text(ctx, endless ? (state.expedition === 'ascension' ? 'ASCENSION SELECTED / A' : 'ENDLESS ASCENSION / A') : 'ASCENSION \u00b7 WIN TO UNLOCK', 665, ASCENSION_BUTTON.y + 14, 12, endless ? '#f3d5ff' : '#a9a89b', 'bold', false, 'center');
  text(ctx, endless ? 'Keep your build \u00b7 higher WRATH every circuit' : '3 SHRINE RELICS \u00b7 8 SPIRIT TACTICS', 665, ASCENSION_BUTTON.y + 27, 10, '#d9c99d', 'bold', false, 'center');
  text(ctx, DIFFICULTIES.find(d => d.id === state.difficulty).hint, 68, 566, 12, '#d0c9b8');
  if (!state.unlocks.includes('master')) text(ctx, 'Seal all 8 scrolls to unlock Master + 2 new arts.', 68, 582, 10, '#e0a84b');
  drawTutorial(ctx);
  text(ctx, input.touch ? 'ONE FINGER PAINT' : 'WASD MOVE', 68, 775, 12, '#e4b550', 'bold');
  text(ctx, input.touch ? 'DASH BUTTON' : 'SPACE DASH', 226, 775, 12, '#e4b550', 'bold');
  text(ctx, input.touch ? 'CLOSE YOUR LOOP' : 'LMB PAINT + CLOSE', 390, 775, 12, '#e4b550', 'bold');
  text(ctx, input.touch ? '2 FINGERS SPLASH' : 'RMB SPLASH', 612, 775, 12, '#e4b550', 'bold');
  text(ctx, 'Q LOTUS  \u00b7  E BELL  \u00b7  P PAUSE', 782, 775, 12, '#e4b550', 'bold');
  text(ctx, audio.muted ? 'M  SOUND OFF' : 'M  SOUND ON', 1216, 775, 11, '#fff1d2', 'bold', false, 'right');
  text(ctx, 'PROCEDURAL PAPER, INK & SOUND  /  PAISALRVLDOO', 64, 789, 10, '#8a8a81');
  text(ctx, 'G  CINEMATIC GRAPHICS', 1216, 789, 10, '#8a8a81', 'normal', false, 'right');
}
