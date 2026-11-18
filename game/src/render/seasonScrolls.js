import { clamp } from '../config.js';
import { SEASONS, SCROLLS } from '../world/scrolls.js';
import { text, line, circle, stamp } from './primitives.js';

export function drawSeasonMotif(ctx, season, x, y, size) {
  const palette = SEASONS[season]; ctx.save(); ctx.translate(x, y);
  if (season === 0) {
    for (let i = 0; i < 5; i++) { const angle = i / 5 * Math.PI * 2; ctx.fillStyle = palette.color; ctx.beginPath(); ctx.ellipse(Math.cos(angle) * size * 0.45, Math.sin(angle) * size * 0.45, size * 0.48, size * 0.25, angle, 0, Math.PI * 2); ctx.fill(); }
    circle(ctx, 0, 0, size * 0.15, '#edc567');
  } else if (season === 1) {
    ctx.fillStyle = palette.color; ctx.beginPath(); ctx.moveTo(-size, size * 0.6); ctx.quadraticCurveTo(-size * 0.65, -size, size, -size * 0.6); ctx.quadraticCurveTo(size * 0.5, size, -size, size * 0.6); ctx.fill();
    line(ctx, [[-size, size * 0.6], [size, -size * 0.6]], '#ebdfa5', 2);
  } else if (season === 2) {
    ctx.fillStyle = palette.color; ctx.beginPath();
    for (let i = 0; i < 12; i++) { const angle = i / 12 * Math.PI * 2 - Math.PI / 2, radius = size * (i % 2 ? 0.48 : 1); const x1 = Math.cos(angle) * radius, y1 = Math.sin(angle) * radius; if (i) ctx.lineTo(x1, y1); else ctx.moveTo(x1, y1); }
    ctx.closePath(); ctx.fill(); line(ctx, [[0, 0], [0, size * 1.2]], '#764333', 2);
  } else {
    for (let i = 0; i < 6; i++) {
      ctx.save(); ctx.rotate(i / 6 * Math.PI * 2); line(ctx, [[0, 0], [0, -size]], palette.color, 2.5);
      line(ctx, [[-size * 0.3, -size * 0.58], [0, -size * 0.35], [size * 0.3, -size * 0.58]], palette.color, 2); ctx.restore();
    }
  }
  ctx.restore();
}

const TITLES = ['REEDS', 'LANTERNS', 'MOSS', 'PAPER', 'FIRELIGHT', 'MAPLE', 'INKSTONE', 'LAST BELL'];

export function drawSeasonScroll(ctx, index, x, y, width, height, reveal = 1, compact = false) {
  const progress = clamp(reveal, 0, 1), opened = 10 + (height - 10) * (1 - (1 - progress) ** 3), season = SEASONS[SCROLLS[index].season];
  ctx.save(); ctx.shadowColor = '#091a2866'; ctx.shadowBlur = compact ? 3 : 8; ctx.shadowOffsetY = 4;
  ctx.fillStyle = '#f5e9cb'; ctx.fillRect(x, y, width, opened);
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  const shade = ctx.createLinearGradient(x, 0, x + width, 0); shade.addColorStop(0, '#c4aa7655'); shade.addColorStop(0.2, '#fff8e522'); shade.addColorStop(1, '#a5875744');
  ctx.fillStyle = shade; ctx.fillRect(x, y, width, opened);
  line(ctx, [[x + 5, y + 8], [x + 5, y + opened - 6]], season.color + '88', 2);
  line(ctx, [[x + width - 5, y + 8], [x + width - 5, y + opened - 6]], season.color + '88', 2);
  ctx.save(); ctx.beginPath(); ctx.rect(x, y + 5, width, Math.max(0, opened - 10)); ctx.clip();
  if (compact) drawSeasonMotif(ctx, SCROLLS[index].season, x + width / 2, y + 16, 7);
  else {
    stamp(ctx, String(index + 1), x + width / 2, y + 26, 25);
    drawSeasonMotif(ctx, SCROLLS[index].season, x + width / 2, y + 73, 23);
    text(ctx, TITLES[index], x + width / 2, y + 112, 10, '#293d3b', 'bold', false, 'center');
    text(ctx, season.name, x + width / 2, y + 132, 8, season.color, 'bold', false, 'center');
  }
  ctx.restore();
  line(ctx, [[x - 4, y], [x + width + 4, y]], '#76533b', compact ? 4 : 7);
  line(ctx, [[x - 4, y + opened], [x + width + 4, y + opened]], '#9c7145', compact ? 4 : 7);
  ctx.restore();
}
