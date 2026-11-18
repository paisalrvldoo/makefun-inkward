import { text, panel, hitRect, wrapText, circle } from '../render/primitives.js';
import { artLevel } from '../arts/levels.js';
import { drawLevelPips, drawArtIcon } from '../render/arts.js';
import { describeArt, draftArtLevel, findArt } from '../arts/brushArts.js';
import { getScroll, getSeason } from '../world/scrolls.js';
import { pendingRoad } from '../world/path.js';
import { RELICS, shrineRelic } from '../arts/relics.js';
import { isAscension, ascensionLabel } from '../world/ascension.js';
import { ONI } from '../entities/bosses.js';
import { drawPath } from './path.js';
import { artSchool, schoolCount, activeSynergies } from '../arts/schools.js';

import { drawRarityGlow } from '../render/rarityGlow.js';

export const DRAFT_RECTS = [0, 1, 2].map(i => ({ x: 116 + i * 356, y: 366, w: 336, h: 322 }));
export const draftRects = state => state.draft.length === 4
  ? [0, 1, 2, 3].map(i => ({ x: 42 + i * 304, y: 366, w: 284, h: 322 }))
  : DRAFT_RECTS;

const SEALS = {
  WALL: '#d84b3c', INK: '#258c9c', MOVE: '#67964c', SEAL: '#d38d31',
  SCORE: '#d9ad38', COMBO: '#8865b4', RITUAL: '#477fbd', BELL: '#bc5148',
};

function drawBrightSeal(ctx, art, x, y) {
  const fill = SEALS[art.type] || '#bd4438';
  ctx.save(); ctx.translate(x, y);
  circle(ctx, 0, 0, 29, '#0b1521', '#dfb752', 2);
  circle(ctx, 0, 0, 24, fill, '#ffe2a0', 1.5);
  for (let i = 0; i < 8; i++) {
    const angle = i * Math.PI / 4;
    circle(ctx, Math.cos(angle) * 22, Math.sin(angle) * 22, 1.2, '#fff1ce');
  }
  ctx.restore();
  drawArtIcon(ctx, art.id, x, y, 34, { fill: '#f9e9c7', outline: '#fff0c7', mark: fill });
}

function nextScrollLabel(state) {
  if (state.scroll === 8 && isAscension(state)) return 'NEXT: ' + ascensionLabel({ ...state, ascension: state.ascension + 1 });
  const next = state.scroll + 1, scroll = getScroll({ scroll: next });
  const season = getSeason({ scroll: next }).name;
  const boss = scroll.boss ? ONI[scroll.boss].name.replace(' · ', ' ') : '';
  return 'NEXT: SCROLL ' + next + ' · ' + season + (boss ? ' / ' + boss : '');
}

export function drawDraft(ctx, state, input) {
  ctx.fillStyle = '#080f19'; ctx.fillRect(0, 0, 1280, 800);
  panel(ctx, 32, 22, 1216, 56, '#111c29', '#95763b');
  text(ctx, "PILGRIM'S PATH", 55, 58, 34, '#efd08a', 'bold', true);
  text(ctx, 'SCROLL ' + state.scroll + ' COMPLETE', 1224, 43, 11, '#efbd58', 'bold', false, 'right');
  text(ctx, nextScrollLabel(state), 1224, 65, 16, '#fff0d5', 'bold', true, 'right');
  drawPath(ctx, state, input);

  const road = pendingRoad(state);
  text(ctx, 'A new art for your brush', 42, 299, 29, '#fff3df', 'bold', true);
  text(ctx, road ? road.name.toUpperCase() + ' CHOSEN / PICK YOUR ART BELOW' : '1. CHOOSE A ROAD ABOVE   2. CHOOSE A BRUSH ART', 1237, 291, 12, road ? '#f1c773' : '#c6c5bd', 'bold', false, 'right');
  text(ctx, state.bonusDraft ? 'OMEN REWARD · FOURTH ART UNLOCKED' : 'ONE ART CARRIES INTO THE NEXT SCROLL', 1237, 309, 10, state.bonusDraft ? '#f1b44f' : '#c6c5bd', 'bold', false, 'right');

  panel(ctx, 42, 318, 1196, 36, '#121f2c', '#5d5237');
  text(ctx, 'BRUSH ARTS HELD / ' + state.arts.length, 60, 341, 11, '#e3b651', 'bold');
  const gap = 938 / Math.max(1, state.arts.length);
  state.arts.forEach((id, i) => {
    const x = 279 + i * gap;
    drawArtIcon(ctx, id, x + 14, 336, 25);
    text(ctx, findArt(id).name, x + 34, 334, state.arts.length > 6 ? 10 : 11, '#e5dfd0', 'bold');
    const school = artSchool(id);
    text(ctx, 'LV ' + artLevel(state, id) + ' / ' + school.name, x + 34, 348, 8, school.color, 'bold');
  });

  state.draft.forEach((art, i) => {
    const rect = draftRects(state)[i], hover = hitRect(input.pointer, rect);
    const level = artLevel(state, art.id), nextLevel = draftArtLevel(state, art.id), gained = nextLevel - level;
    const effect = describeArt(art.id, nextLevel);
    if (art.id === 'breath' && gained > 1) effect.description = '+60 ink capacity · +' + nextLevel * 30 + '% refill';
    if (art.id === 'mending' && gained > 1) effect.description = 'Repair 6 bell cracks now';
    panel(ctx, rect.x, rect.y, rect.w, rect.h, hover ? '#203347' : '#172635', hover && road ? '#ef5b45' : '#b28a43');
    panel(ctx, rect.x + 6, rect.y + 6, rect.w - 12, rect.h - 12, hover ? '#203347' : '#172635', '#36494f');
    text(ctx, '0' + (i + 1) + ' / ' + art.type, rect.x + 20, rect.y + 26, 10, '#e7ba56', 'bold');
    drawRarityGlow(ctx, state, art, rect, hover);
    drawBrightSeal(ctx, art, rect.x + rect.w / 2, rect.y + 66);
    text(ctx, art.name, rect.x + rect.w / 2, rect.y + 114, 22, '#fff0d8', 'bold', true, 'center');
    const school = artSchool(art.id) || { name: 'REST', color: '#8dd8f3' }, pairs = (art.id === 'rest' ? 0 : schoolCount(state, school)) + (level ? 0 : 1) >= 2;
    text(ctx, 'LV ' + nextLevel + ' / ' + school.name + (pairs ? ' SYNERGY' : ''), rect.x + 21, rect.y + 141, 10, school.color, 'bold');
    drawLevelPips(ctx, state, art.id, rect.x + rect.w - 52, rect.y + 137, nextLevel);
    const detailY = wrapText(ctx, effect.description, rect.x + 21, rect.y + 167, rect.w - 42, 20, 16, '#fff0d3');
    wrapText(ctx, effect.detail, rect.x + 21, Math.max(rect.y + 211, detailY + 7), rect.w - 42, 16, 12, '#c0c8c6');
    const chip = { x: rect.x + 18, y: rect.y + 274, w: rect.w - 36, h: 34 };
    ctx.fillStyle = road ? hover ? '#ef6348' : '#c43e32' : '#33424a'; ctx.fillRect(chip.x, chip.y, chip.w, chip.h);
    ctx.strokeStyle = road ? '#f3b49a' : '#607168'; ctx.lineWidth = 1; ctx.strokeRect(chip.x + 4.5, chip.y + 4.5, chip.w - 9, chip.h - 9);
    text(ctx, road ? 'PRESS ' + (i + 1) + ' / TAKE ART' : 'CHOOSE A ROAD FIRST ↑', rect.x + rect.w / 2, chip.y + 23, road ? 14 : 12, '#fff4df', 'bold', false, 'center');
  });

  panel(ctx, 42, 704, 1196, 62, '#111c29', '#78643c');
  const combos = activeSynergies(state);
  text(ctx, combos.length ? 'SYNERGY / ' + combos.map(s => s.name + ' ' + s.bonus).join('  ·  ') : 'BELL ' + state.bell.hp + '/' + state.bell.maxHp + '   ·   SCORE ' + state.score.toLocaleString('en-US') + '   ·   ' + state.sealed + ' SPIRITS FREED', 640, 729, 13, '#e8bd60', 'bold', false, 'center');
  const relicText = state.relics.map(id => RELICS.find(r => r.id === id).name).join(' · ');
  text(ctx, road?.id === 'shrine' ? shrineRelic(state).effect.toUpperCase() : relicText ? 'RELICS / ' + relicText.toUpperCase() : road ? road.effect.toUpperCase() + '  ·  1–' + state.draft.length + ' / CLICK TO TAKE AN ART' : '← SWARM ROAD   ·   → QUIET ROAD   ·   OR CLICK THE NEXT MAP NODE', 640, 751, 11, '#d4d0c6', 'bold', false, 'center');
}
