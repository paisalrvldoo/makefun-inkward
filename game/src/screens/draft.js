import { text, panel, hitRect, wrapText, circle } from '../render/primitives.js';
import { artLevel } from '../arts/levels.js';
import { drawLevelPips, drawArtIcon } from '../render/arts.js';
import { describeArt } from '../arts/brushArts.js';
import { getScroll, getSeason } from '../world/scrolls.js';
import { ONI } from '../entities/bosses.js';

export const DRAFT_RECTS = [0, 1, 2].map(i => ({ x: 116 + i * 356, y: 278, w: 336, h: 408 }));
export const draftRects = state => state.draft.length === 4
  ? [0, 1, 2, 3].map(i => ({ x: 42 + i * 304, y: 278, w: 284, h: 408 }))
  : DRAFT_RECTS;

const SEALS = {
  WALL: '#d84b3c', INK: '#258c9c', MOVE: '#67964c', SEAL: '#d38d31',
  SCORE: '#d9ad38', COMBO: '#8865b4', RITUAL: '#477fbd', BELL: '#bc5148',
};

function drawBrightSeal(ctx, art, x, y) {
  const fill = SEALS[art.type] || '#bd4438';
  ctx.save(); ctx.translate(x, y);
  circle(ctx, 0, 0, 40, '#0b1521', '#dfb752', 2);
  circle(ctx, 0, 0, 34, fill, '#ffe2a0', 1.5);
  circle(ctx, 0, 0, 28, null, '#fff1ce88', 1);
  for (let i = 0; i < 8; i++) {
    const angle = i * Math.PI / 4;
    circle(ctx, Math.cos(angle) * 31, Math.sin(angle) * 31, 1.6, '#fff1ce');
  }
  ctx.restore();
  drawArtIcon(ctx, art.id, x, y, 46, { fill: '#f9e9c7', outline: '#fff0c7', mark: fill });
}

function nextScrollLabel(state) {
  const next = state.scroll + 1;
  const scroll = getScroll({ scroll: next });
  const season = getSeason({ scroll: next }).name;
  const boss = scroll.boss ? ONI[scroll.boss].name.replace(' · ', ' ') : '';
  return 'NEXT: SCROLL ' + next + ' · ' + season + (boss ? ' — ' + boss : '');
}

export function drawDraft(ctx, state, input) {
  // Opaque lacquer keeps the inter-scroll choice focused on its cards.
  ctx.fillStyle = '#080f19'; ctx.fillRect(0, 0, 1280, 800);
  panel(ctx, 32, 22, 1216, 85, '#111c29', '#95763b');
  panel(ctx, 38, 28, 1204, 73, '#111c29', '#3d4a4c');
  text(ctx, 'SCROLL ' + state.scroll + ' COMPLETE', 58, 57, 14, '#efbd58', 'bold');
  text(ctx, nextScrollLabel(state), 58, 87, 19, '#fff0d5', 'bold', true);

  text(ctx, 'A new art for your brush', 640, 149, 38, '#fff3df', 'bold', true, 'center');
  text(ctx, state.bonusDraft ? 'OMEN REWARD  ·  FOURTH ART UNLOCKED' : 'CHOOSE ONE ART  ·  YOUR INK REFILLS', 640, 177, 13, state.bonusDraft ? '#f1b44f' : '#c6c5bd', 'bold', false, 'center');

  panel(ctx, 42, 191, 1196, 70, '#121f2c', '#5d5237');
  text(ctx, 'BRUSH ARTS HELD', 60, 219, 12, '#e3b651', 'bold');
  text(ctx, state.arts.length + ' HELD', 60, 243, 11, '#bdbdb6', 'bold');
  const gap = Math.min(100, 790 / Math.max(1, state.arts.length - 1));
  const start = 780 - (Math.max(1, state.arts.length) - 1) * gap / 2;
  state.arts.forEach((id, i) => {
    const x = start + i * gap;
    drawArtIcon(ctx, id, x, 219, 32);
    text(ctx, id.replace(/([a-z])([A-Z])/g, '$1 $2').toUpperCase(), x, 249, 8, '#e5dfd0', 'bold', false, 'center');
  });

  state.draft.forEach((art, i) => {
    const rect = draftRects(state)[i], hover = hitRect(input.pointer, rect);
    const level = artLevel(state, art.id), nextLevel = level + 1;
    const effect = describeArt(art.id, nextLevel);
    panel(ctx, rect.x, rect.y, rect.w, rect.h, hover ? '#203347' : '#172635', hover ? '#ef5b45' : '#b28a43');
    panel(ctx, rect.x + 6, rect.y + 6, rect.w - 12, rect.h - 12, hover ? '#203347' : '#172635', '#36494f');
    text(ctx, '0' + (i + 1) + '  /  ' + art.type, rect.x + 22, rect.y + 34, 11, '#e7ba56', 'bold');
    text(ctx, level ? 'UPGRADE' : 'NEW ART', rect.x + rect.w - 18, rect.y + 34, 10, '#bfc6c2', 'bold', false, 'right');
    drawBrightSeal(ctx, art, rect.x + rect.w / 2, rect.y + 91);
    text(ctx, art.name, rect.x + rect.w / 2, rect.y + 160, 23, '#fff0d8', 'bold', true, 'center');
    text(ctx, 'LV ' + nextLevel, rect.x + 22, rect.y + 190, 11, '#d5cbb6', 'bold');
    drawLevelPips(ctx, state, art.id, rect.x + rect.w - 52, rect.y + 186, true);
    wrapText(ctx, effect.description, rect.x + 21, rect.y + 220, rect.w - 42, 22, 17, '#fff0d3');
    wrapText(ctx, effect.detail, rect.x + 21, rect.y + 276, rect.w - 42, 17, 12, '#c0c8c6');

    const chip = { x: rect.x + 18, y: rect.y + 345, w: rect.w - 36, h: 45 };
    ctx.fillStyle = hover ? '#ef6348' : '#c43e32'; ctx.fillRect(chip.x, chip.y, chip.w, chip.h);
    ctx.strokeStyle = '#f3b49a'; ctx.lineWidth = 1; ctx.strokeRect(chip.x + 4.5, chip.y + 4.5, chip.w - 9, chip.h - 9);
    text(ctx, 'PRESS ' + (i + 1), rect.x + rect.w / 2, chip.y + 29, 18, '#fff4df', 'bold', false, 'center');
  });

  panel(ctx, 42, 704, 1196, 62, '#111c29', '#78643c');
  text(ctx, 'BELL ' + state.bell.hp + '/' + state.bell.maxHp + '   ·   SCORE ' + state.score.toLocaleString('en-US') + '   ·   ' + state.sealed + ' SPIRITS FREED', 640, 729, 13, '#e8bd60', 'bold', false, 'center');
  text(ctx, state.bonusDraft ? 'OMEN FULFILLED  ·  ONE EXTRA ART CHOICE' : '1–3 / CLICK TO CHOOSE  ·  ONE ART CARRIES INTO THE NEXT SCROLL', 640, 751, 11, '#d4d0c6', 'bold', false, 'center');
}
