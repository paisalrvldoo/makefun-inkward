import { panel, text, line, circle } from '../../render/primitives.js';
import { SCROLLS, SEASONS } from '../../world/scrolls.js';
import { resultReveal } from '../resultMotion.js';

export function drawScoreChart(ctx, state) {
  const age = state.resultsTime ?? 5;
  panel(ctx, 64, 436, 820, 170, '#111e2b', '#665538');
  text(ctx, 'EIGHT SCROLLS / SCORE RECORD', 84, 460, 12, '#edc571', 'bold');
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
    const barHeight = score ? Math.max(3, score / max * height * resultReveal(age, 1.05 + i * 0.12, 0.65)) : 2;
    const fill = ctx.createLinearGradient(0, baseline - barHeight, 0, baseline);
    fill.addColorStop(0, season.wash); fill.addColorStop(1, season.color);
    ctx.fillStyle = fill; ctx.fillRect(x - 26, baseline - barHeight, 52, barHeight);
    ctx.fillStyle = '#fff0ce99'; ctx.fillRect(x - 26, baseline - barHeight, 52, 2);
    text(ctx, String(i + 1).padStart(2, '0'), x, 584, 10, '#e9deca', 'bold', false, 'center');
  });
  if (ghost) {
    const points = ghost.scrollScores.map((score, i) => [131 + i * 93, baseline - score / max * height * resultReveal(age, 1.35, 0.75)]);
    line(ctx, points, '#101b25cc', 5);
    ctx.save(); ctx.setLineDash([5, 4]); line(ctx, points, '#f4dc9b', 2); ctx.restore();
    points.forEach(([x, y]) => circle(ctx, x, y, 3, '#152632', '#f4dc9b', 1.5));
  }
  state.scrollScores.forEach((score, i) => {
    const barHeight = score ? Math.max(3, score / max * height * resultReveal(age, 1.05 + i * 0.12, 0.65)) : 2;
    text(ctx, score ? (score / 1000).toFixed(1) + 'k' : '—', 131 + i * 93, baseline - barHeight - 7, 10, '#e4e7db', 'bold', false, 'center');
  });
  SEASONS.forEach((season, i) => text(ctx, season.name, 177.5 + i * 186, 600, 9, season.wash, 'bold', false, 'center'));
}

