import { gradeRun } from '../world/state.js';
import { SCROLLS, SEASONS } from '../world/scrolls.js';
import { UNLOCKS } from '../save.js';
import { text, panel, hitRect, circle, line } from '../render/primitives.js';
import { drawArtIcon } from '../render/arts.js';
import { artLevel } from '../arts/levels.js';
import { formatSeed } from '../rng.js';

export const RESTART_BUTTON = { x: 64, y: 706, w: 396, h: 58 };
export const SAME_SEED_BUTTON = { x: 478, y: 706, w: 352, h: 58 };
export const TITLE_BUTTON = { x: 848, y: 706, w: 368, h: 58 };
const number = value => Math.round(value).toLocaleString('en-US');

function drawGrade(ctx, state) {
  ctx.save(); ctx.translate(1090, 221); ctx.rotate(-0.065);
  const points = Array.from({ length: 33 }, (_, i) => {
    const a = i / 32 * Math.PI * 2, r = i % 2 ? 94 : 100;
    return [Math.cos(a) * r, Math.sin(a) * r];
  });
  circle(ctx, 0, 0, 98, '#1b2934');
  line(ctx, points, '#d7af57', 2);
  circle(ctx, 0, 0, 85, null, '#e8c575', 2);
  circle(ctx, 0, 0, 79, null, '#a47e3b', 1);
  for (let i = 0; i < 16; i++) {
    const a = i * Math.PI / 8;
    circle(ctx, Math.cos(a) * 90, Math.sin(a) * 90, 1.5, '#edcd80');
  }
  ctx.shadowColor = '#dcae4c66'; ctx.shadowBlur = 16;
  text(ctx, state.grade || gradeRun(state), 0, 41, 126, '#f6d680', 'bold', true, 'center');
  ctx.shadowBlur = 0;
  if (state.newBest) {
    ctx.fillStyle = '#c74735'; ctx.beginPath();
    ctx.moveTo(-116, 47); ctx.lineTo(116, 47); ctx.lineTo(106, 64);
    ctx.lineTo(116, 81); ctx.lineTo(-116, 81); ctx.lineTo(-106, 64); ctx.closePath(); ctx.fill();
    line(ctx, [[-105, 51], [105, 51]], '#f2bd6b', 1);
    line(ctx, [[-105, 77], [105, 77]], '#f2bd6b', 1);
    text(ctx, 'NEW BEST!', 0, 70, 18, '#fff2ca', 'bold', false, 'center');
  }
  ctx.restore();
  text(ctx, 'BRUSH GRADE', 1090, 337, 10, '#d6b86e', 'bold', false, 'center');
}

export function drawScoreChart(ctx, state) {
  panel(ctx, 64, 422, 820, 184, '#111e2b', '#665538');
  text(ctx, 'EIGHT SCROLLS / SCORE RECORD', 84, 446, 12, '#edc571', 'bold');
  const ghost = state.previousBestRun;
  const max = Math.max(1000, ...state.scrollScores, ...(ghost?.scrollScores || []));
  const baseline = 568, height = 94;
  if (ghost) {
    ctx.save(); ctx.setLineDash([4, 4]);
    line(ctx, [[708, 442], [736, 442]], '#f4dc9b', 2); ctx.restore();
    text(ctx, 'BEST RUN / ' + ghost.difficulty.toUpperCase() + ' / ' + ghost.grade, 863, 446, 10, '#f4dc9b', 'bold', false, 'right');
  } else text(ctx, 'SET YOUR FIRST RECORD', 863, 446, 10, '#98ada8', 'bold', false, 'right');
  for (let i = 1; i <= 3; i++) {
    const y = baseline - height * i / 3;
    line(ctx, [[112, y], [863, y]], '#34424a', 1);
    text(ctx, Math.round(max * i / 3000) + 'k', 101, y + 3, 9, '#7f959e', 'normal', false, 'right');
  }
  state.scrollScores.forEach((score, i) => {
    const season = SEASONS[SCROLLS[i].season], x = 131 + i * 93;
    const barHeight = score ? Math.max(3, score / max * height) : 2;
    const fill = ctx.createLinearGradient(0, baseline - barHeight, 0, baseline);
    fill.addColorStop(0, season.wash); fill.addColorStop(1, season.color);
    ctx.fillStyle = fill; ctx.fillRect(x - 26, baseline - barHeight, 52, barHeight);
    ctx.fillStyle = '#fff0ce99'; ctx.fillRect(x - 26, baseline - barHeight, 52, 2);
    text(ctx, String(i + 1).padStart(2, '0'), x, 584, 10, '#e9deca', 'bold', false, 'center');
  });
  if (ghost) {
    const points = ghost.scrollScores.map((score, i) => [131 + i * 93, baseline - score / max * height]);
    line(ctx, points, '#101b25cc', 5);
    ctx.save(); ctx.setLineDash([5, 4]); line(ctx, points, '#f4dc9b', 2); ctx.restore();
    points.forEach(([x, y]) => circle(ctx, x, y, 3, '#152632', '#f4dc9b', 1.5));
  }
  state.scrollScores.forEach((score, i) => {
    const barHeight = score ? Math.max(3, score / max * height) : 2;
    text(ctx, score ? (score / 1000).toFixed(1) + 'k' : '—', 131 + i * 93, baseline - barHeight - 7, 10, '#e4e7db', 'bold', false, 'center');
  });
  SEASONS.forEach((season, i) => text(ctx, season.name, 177.5 + i * 186, 600, 9, season.wash, 'bold', false, 'center'));
}

function drawUnlocks(ctx, state) {
  panel(ctx, 64, 624, 1152, 64, '#18262d', '#be9649');
  text(ctx, state.unlocks.length ? 'UNLOCKED' : 'NEXT RUN', 84, 651, 16, '#f3ce77', 'bold', true);
  text(ctx, 'A LASTING LEGACY', 84, 671, 9, '#abbab7', 'bold');
  UNLOCKS.forEach((unlock, i) => {
    const x = 239 + i * 240, owned = state.unlocks.includes(unlock.id), fresh = state.newUnlocks.includes(unlock.id);
    line(ctx, [[x - 12, 635], [x - 12, 677]], '#6e6243', 1);
    ctx.save(); if (!owned) ctx.globalAlpha = 0.4;
    if (unlock.kind === 'BRUSH ART') drawArtIcon(ctx, unlock.id, x + 18, 653, 29, { fill: '#e5d3a4', outline: '#f5d787' });
    else if (unlock.id === 'master') {
      circle(ctx, x + 18, 653, 16, '#28424b', '#e3bd68', 1.5);
      text(ctx, 'M', x + 18, 660, 23, '#f2d182', 'bold', true, 'center');
    } else {
      circle(ctx, x + 18, 653, 16, '#c3dceb', '#f0d99f', 1.5);
      circle(ctx, x + 17, 652, 9, '#fff5d6'); circle(ctx, x + 22, 648, 8, '#c3dceb');
    }
    text(ctx, unlock.name, x + 44, 653, 13, '#fff0d2', 'bold');
    text(ctx, owned ? unlock.kind : 'SEAL ALL 8 SCROLLS', x + 44, 673, 9, '#b9c4bc', 'bold');
    if (fresh) text(ctx, 'NEW', x + 213, 638, 8, '#f2c761', 'bold', false, 'right');
    ctx.restore();
  });
}

function resultButton(ctx, label, hint, rect, input, primary = false) {
  const hover = hitRect(input.pointer, rect);
  panel(ctx, rect.x, rect.y, rect.w, rect.h, primary ? hover ? '#df6247' : '#ba3d30' : hover ? '#29404c' : '#192b37', primary ? '#e8a26c' : '#bd974a');
  panel(ctx, rect.x + 5, rect.y + 5, rect.w - 10, rect.h - 10, primary ? hover ? '#df6247' : '#ba3d30' : hover ? '#29404c' : '#192b37', primary ? '#ecb084' : '#506159');
  text(ctx, label, rect.x + rect.w / 2, rect.y + 28, 22, '#fff0d5', 'bold', true, 'center');
  text(ctx, hint, rect.x + rect.w / 2, rect.y + 46, 9, primary ? '#f9d9b2' : '#bbc8c5', 'bold', false, 'center');
}

export function drawResults(ctx, state, input) {
  const won = state.mode === 'win', fulfilled = state.omenHistory.filter(o => o.complete);
  ctx.fillStyle = '#080f19'; ctx.fillRect(0, 0, 1280, 800);
  const wash = ctx.createRadialGradient(1060, 180, 20, 1060, 180, 520);
  wash.addColorStop(0, '#75502533'); wash.addColorStop(1, '#111d2900');
  panel(ctx, 32, 24, 1216, 752, '#101c28', '#c6a25b');
  ctx.fillStyle = wash; ctx.fillRect(33, 25, 1214, 750);
  panel(ctx, 40, 32, 1200, 736, '#101c2800', '#514c38');
  for (const [x, y, dx, dy] of [[48, 40, 1, 1], [1232, 40, -1, 1], [48, 760, 1, -1], [1232, 760, -1, -1]]) {
    line(ctx, [[x, y + dy * 20], [x, y], [x + dx * 20, y]], '#d8b463', 2);
    circle(ctx, x + dx * 7, y + dy * 7, 2, '#e1bd70');
  }
  text(ctx, 'INKWARD / THE FINAL RECORD', 65, 63, 12, '#d5b466', 'bold');
  text(ctx, won ? 'VIII SCROLLS · IV SEASONS · ONE LAST BELL' : 'THE BRUSH REMEMBERS EVERY PILGRIMAGE', 1214, 63, 10, '#a8bbb9', 'bold', false, 'right');
  const gold = ctx.createLinearGradient(0, 79, 0, 149);
  gold.addColorStop(0, '#fff0b7'); gold.addColorStop(0.5, '#efd086'); gold.addColorStop(1, '#b9893f');
  ctx.save(); ctx.shadowColor = '#edbd5144'; ctx.shadowBlur = 18;
  text(ctx, won ? 'THE BELL ENDURES' : 'THE BELL FELL', 61, 145, 65, won ? gold : '#f0d3bb', 'bold', true);
  ctx.restore();
  text(ctx, won ? 'ALL EIGHT SCROLLS SEALED. THE WANDERING SPIRITS ARE HOME.' : 'A NEW ROAD. A NEW BRUSH. THE NEXT PILGRIMAGE AWAITS.', 66, 173, 12, '#b9c5bd', 'bold');
  text(ctx, 'FINAL SCORE', 66, 211, 12, '#edc571', 'bold');
  text(ctx, number(state.score), 62, 278, 76, '#fff1d4', 'bold', true);
  line(ctx, [[438, 215], [438, 276]], '#655a3e', 1);
  text(ctx, 'PERSONAL BEST', 465, 228, 11, '#b3c1be', 'bold');
  text(ctx, number(state.best), 463, 266, 34, '#eac66f', 'bold', true);
  text(ctx, 'SEED ' + formatSeed(state.seed) + ' / ' + state.difficulty.toUpperCase(), 66, 317, 12, '#d6b86e', 'bold');
  if (state.previousBestRun) {
    const difference = state.score - state.previousBestRun.score;
    text(ctx, (difference >= 0 ? '+' : '−') + number(Math.abs(difference)) + ' VS PREVIOUS BEST', 884, 317, 11, difference >= 0 ? '#91c9aa' : '#dda18a', 'bold', false, 'right');
  } else text(ctx, 'YOUR NEXT PILGRIMAGE STARTS HERE', 884, 317, 11, '#a5bab4', 'bold', false, 'right');
  drawGrade(ctx, state);

  const stats = [
    ['SCROLLS SEALED', (won ? 8 : state.scroll - 1) + ' / 8', '#bd5364'],
    ['SPIRITS FREED', number(state.sealed), '#75b395'],
    ['BEST COMBO', '×' + state.peakCombo.toFixed(1), '#e8ba53'],
    ['BELL HEALTH', state.bell.hp + ' / ' + state.bell.maxHp, '#e77d59'],
    ['OMENS FULFILLED', fulfilled.length + ' / 8', '#8fadd8'],
    ['PILGRIMAGE TIME', Math.floor(state.runTime / 60) + ':' + String(Math.floor(state.runTime % 60)).padStart(2, '0'), '#d1c6a8'],
  ];
  stats.forEach(([label, value, color], i) => {
    const x = 64 + i * 194;
    panel(ctx, x, 354, 182, 52, '#1b2a36', '#586054');
    ctx.fillStyle = color; ctx.fillRect(x, 354, 3, 52);
    text(ctx, label, x + 13, 371, 9, '#b6c6c0', 'bold');
    text(ctx, value, x + 13, 398, 26, '#fff0d8', 'bold', true);
  });
  drawScoreChart(ctx, state);
  panel(ctx, 900, 422, 316, 184, '#111e2b', '#665538');
  text(ctx, 'THE BRUSH YOU BECAME', 920, 446, 12, '#edc571', 'bold');
  const gap = Math.min(40, 274 / Math.max(1, state.arts.length));
  state.arts.forEach((id, i) => {
    const x = 925 + i * gap;
    drawArtIcon(ctx, id, x + 11, 483, 27);
    text(ctx, 'LV ' + artLevel(state, id), x + 11, 515, 9, '#bfcac2', 'bold', false, 'center');
  });
  line(ctx, [[920, 532], [1196, 532]], '#3c4b4e', 1);
  text(ctx, 'WRATH PEAK ' + state.peakWrath + '/5  ·  ' + state.huntersSealed + ' HUNTERS SEALED', 920, 554, 10, '#ed8c68', 'bold');
  text(ctx, 'LARGEST SEAL  /  ' + state.largestSeal + ' SPIRITS', 920, 580, 11, '#d1d4bf', 'bold');
  drawUnlocks(ctx, state);
  resultButton(ctx, 'RUN AGAIN  (R)', 'A NEW PILGRIMAGE', RESTART_BUTTON, input, true);
  resultButton(ctx, 'SAME SEED  (S)', 'RETRACE THIS RUN', SAME_SEED_BUTTON, input);
  resultButton(ctx, 'MENU  (Esc)', 'RETURN TO THE SHRINE', TITLE_BUTTON, input);
}
