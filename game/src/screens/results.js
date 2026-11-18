import { drawGrade } from './results/grade.js';
import { drawScoreChart } from './results/scoreChart.js';
export { drawScoreChart } from './results/scoreChart.js';
import { drawUnlocks } from './results/unlocks.js';
import { resultButton } from './results/buttons.js';
import { gradeRun } from '../world/state.js';
import { wrathCap } from '../world/ascension.js';
import { text, panel, hitRect, circle, line } from '../render/primitives.js';
import { drawArtIcon } from '../render/arts.js';
import { artLevel } from '../arts/levels.js';
import { formatSeed } from '../rng.js';
import { resultMotion, resultReveal } from './resultMotion.js';
import { drawEndingVista } from '../render/endingVista.js';
import { drawSeasonScroll } from '../render/seasonScrolls.js';
import { YOKAI } from '../entities/yokai.js';
import { ACHIEVEMENTS, drawAchievementIcon } from '../achievements.js';

export const RESTART_BUTTON = { x: 64, y: 706, w: 396, h: 58 };
export const SAME_SEED_BUTTON = { x: 478, y: 706, w: 352, h: 58 };
export const TITLE_BUTTON = { x: 848, y: 706, w: 368, h: 58 };
const number = value => Math.round(value).toLocaleString('en-US');

export function drawResults(ctx, state, input) {
  const won = state.mode === 'win', fulfilled = state.omenHistory.filter(o => o.complete);
  const motion = resultMotion(state);
  ctx.fillStyle = '#080f19'; ctx.fillRect(0, 0, 1280, 800);
  ctx.save(); ctx.beginPath(); ctx.rect(24, 20, 1232, 12 + 750 * (1 - (1 - motion.unroll) ** 3)); ctx.clip();
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
  text(ctx, won ? 'THE BELL ENDURES' : 'THE BELL FELL', 61, 145, won ? 55 : 65, won ? gold : '#f0d3bb', 'bold', true);
  ctx.restore();
  text(ctx, won ? 'AT DAWN, IT RANG FOR EVERY SOUL.  ·  A / ENTER ENDLESS ASCENSION' : 'A NEW ROAD. A NEW BRUSH. THE NEXT PILGRIMAGE AWAITS.', 66, 173, 12, '#b9c5bd', 'bold');
  if (won) {
    panel(ctx, 694, 94, 282, 212, '#22362e', '#ac955c');
    text(ctx, 'DAWN AT THE SHRINE', 835, 108, 9, '#f0d596', 'bold', false, 'center');
    drawEndingVista(ctx, state, 12.6 + motion.age, { x: 698, y: 116, w: 274, h: 157 }, true);
    for (let i = 0; i < 8; i++) drawSeasonScroll(ctx, i, 706 + i * 33, 279, 25, 20, resultReveal(motion.age, 0.8 + i * 0.1), true);
  }
  text(ctx, 'FINAL SCORE', 66, 211, 12, '#edc571', 'bold');
  ctx.save(); ctx.translate(62, 278); const totalScale = 1 + motion.slam * 0.065;
  ctx.scale(totalScale, totalScale);
  text(ctx, number(motion.score), motion.count > 0 && motion.count < 1 ? Math.sin(motion.age * 47) * 1.5 : 0, 0, 76, '#fff1d4', 'bold', true); ctx.restore();
  line(ctx, [[438, 215], [438, 276]], '#655a3e', 1);
  text(ctx, 'PERSONAL BEST', 465, 228, 11, '#b3c1be', 'bold');
  text(ctx, number(state.best), 463, 266, 34, '#eac66f', 'bold', true);
  text(ctx, 'SEED ' + formatSeed(state.seed) + ' / ' + state.difficulty.toUpperCase(), 66, 317, 12, '#d6b86e', 'bold');
  if (state.previousBestRun) {
    const difference = state.score - state.previousBestRun.score;
    text(ctx, (difference >= 0 ? '+' : '−') + number(Math.abs(difference)) + ' VS PREVIOUS BEST', 884, 317, 11, difference >= 0 ? '#91c9aa' : '#dda18a', 'bold', false, 'right');
  } else text(ctx, 'YOUR NEXT PILGRIMAGE STARTS HERE', 884, 317, 11, '#a5bab4', 'bold', false, 'right');
  drawGrade(ctx, state, motion);

  const stats = [
    [state.expedition === 'ascension' ? 'ASCENSION / CIRCUITS' : 'SCROLLS SEALED', state.expedition === 'ascension' ? state.ascension + ' / ' + state.circuits : (won ? 8 : state.scroll - 1) + ' / 8', '#bd5364'],
    ['SPIRITS FREED', number(state.sealed), '#75b395'],
    ['BEST COMBO', '×' + state.peakCombo.toFixed(1), '#e8ba53'],
    ['BELL HEALTH', state.bell.hp + ' / ' + state.bell.maxHp, '#e77d59'],
    ['OMENS FULFILLED', fulfilled.length + ' / 8', '#8fadd8'],
    ['PILGRIMAGE TIME', Math.floor(state.runTime / 60) + ':' + String(Math.floor(state.runTime % 60)).padStart(2, '0'), '#d1c6a8'],
  ];
  stats.forEach(([label, value, color], i) => {
    ctx.save(); ctx.globalAlpha = resultReveal(motion.age, 0.8 + i * 0.12);
    const x = 64 + i * 194;
    panel(ctx, x, 344, 182, 52, '#1b2a36', '#586054');
    ctx.fillStyle = color; ctx.fillRect(x, 344, 3, 52);
    text(ctx, label, x + 13, 361, 9, '#b6c6c0', 'bold');
    text(ctx, value, x + 13, 388, 26, '#fff0d8', 'bold', true);
    ctx.restore();
  });
  ctx.save(); ctx.globalAlpha = resultReveal(motion.age, 1.6);
  panel(ctx, 64, 404, 1152, 28, '#1b2a36', '#7a6a44');
  const painted = Math.round(state.inkPainted || 0);
  text(ctx, painted.toLocaleString('en-US') + ' INK PAINTED', 78, 423, 10, '#d1cfa3', 'bold');
  text(ctx, 'LARGEST SEAL', 252, 416, 8, '#8f9180', 'bold');
  text(ctx, state.largestSeal + ' SPIRITS', 252, 427, 12, '#f0d078', 'bold');
  const topKinds = Object.entries(state.yokaiByType || {}).sort((a, b) => b[1] - a[1]).slice(0, 5);
  if (topKinds.length) {
    text(ctx, 'YOKAI', 420, 416, 8, '#8f9180', 'bold');
    const names = topKinds.map(([k, n]) => (k === 'oni' ? 'ONI' : YOKAI[k]?.name || k.toUpperCase()) + ' ' + n).join(' · ');
    text(ctx, names, 420, 427, 10, '#eddcc0', 'bold');
  }
  const avgTime = (state.scrollTimes || []).filter(t => t > 0).reduce((s, t, _, a) => s + t / a.length, 0);
  text(ctx, (avgTime / 60).toFixed(1) + ' MIN / SCROLL', 1214, 423, 10, '#c8bfa6', 'bold', false, 'right');
  ctx.restore();
  drawScoreChart(ctx, state);
  panel(ctx, 900, 422, 316, 168, '#111e2b', '#665538');
  text(ctx, 'THE BRUSH YOU BECAME', 920, 446, 12, '#edc571', 'bold');
  const gap = Math.min(40, 274 / Math.max(1, state.arts.length));
  state.arts.forEach((id, i) => {
    const x = 925 + i * gap;
    drawArtIcon(ctx, id, x + 11, 483, 27);
    text(ctx, 'LV ' + artLevel(state, id), x + 11, 515, 9, '#bfcac2', 'bold', false, 'center');
  });
  line(ctx, [[920, 518], [1196, 518]], '#3c4b4e', 1);
  text(ctx, 'WRATH PEAK ' + state.peakWrath + '/' + wrathCap(state) + '  ·  ' + state.huntersSealed + ' HUNTERS SEALED', 920, 540, 10, '#ed8c68', 'bold');
  text(ctx, 'LARGEST SEAL  /  ' + state.largestSeal + ' SPIRITS', 920, 566, 11, '#d1d4bf', 'bold');
  const fresh = (state.newAchievements || []).filter(id => ACHIEVEMENTS.some(a => a.id === id));
  if (fresh.length) {
    panel(ctx, 64, 594, 1152, 24, '#1a2a38', '#e4b550');
    text(ctx, 'NEW', 80, 610, 9, '#f2c761', 'bold');
    fresh.forEach((id, i) => {
      const ach = ACHIEVEMENTS.find(a => a.id === id);
      drawAchievementIcon(ctx, id, 138 + i * 190, 606, 10);
      text(ctx, ach ? ach.name : '', 152 + i * 190, 611, 9, '#fff0d2', 'bold');
      line(ctx, [[130 + i * 190, 598], [130 + i * 190, 612]], '#7a6a44', 1);
    });
  }
  drawUnlocks(ctx, state);
  resultButton(ctx, won ? 'NEW RUN  (R)' : 'RETRY  (R)', 'A NEW PILGRIMAGE', RESTART_BUTTON, input, true);
  resultButton(ctx, 'SAME SEED  (S)', 'RETRACE THIS RUN', SAME_SEED_BUTTON, input);
  resultButton(ctx, 'MENU  (Esc)', 'RETURN TO THE SHRINE', TITLE_BUTTON, input);
  ctx.restore();
}
