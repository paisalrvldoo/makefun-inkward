import { WIDTH, HEIGHT, clamp } from '../config.js';
import { text, line } from '../render/primitives.js';
import { drawEndingVista } from '../render/endingVista.js';
import { drawSeasonScroll } from '../render/seasonScrolls.js';
import { brushSlash } from '../render/brush.js';
import { EPILOGUE } from '../scenes/ending.js';

function inkSentence(ctx, value, x, y, progress) {
  ctx.save(); ctx.font = 'italic bold 28px Georgia, serif';
  const width = ctx.measureText(value).width;
  ctx.beginPath(); ctx.rect(x - 4, y - 33, (width + 10) * clamp(progress, 0, 1), 46); ctx.clip();
  ctx.strokeStyle = '#152d2922'; ctx.lineWidth = 0.65; ctx.strokeText(value, x, y);
  text(ctx, value, x, y, 28, '#243d36', 'italic bold', true); ctx.restore();
}

export function drawEnding(ctx, state) {
  const age = state.ending.age;
  ctx.fillStyle = '#f5e9cb'; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  drawEndingVista(ctx, state, age);
  const paper = ctx.createLinearGradient(0, 460, 0, HEIGHT); paper.addColorStop(0, '#f5e9cb00'); paper.addColorStop(0.15, '#f5e9cb'); paper.addColorStop(1, '#e9d8b6');
  ctx.fillStyle = paper; ctx.fillRect(0, 460, WIDTH, HEIGHT - 460);
  ctx.save(); ctx.globalAlpha = clamp(age / 1.2, 0, 1);
  text(ctx, 'VIII SCROLLS · IV SEASONS · ONE UNBROKEN SONG', 52, 48, 12, '#495c4d', 'bold');
  text(ctx, 'DAWN RETURNS', 48, 110, 62, '#233c37', 'bold', true);
  line(ctx, [[52, 128], [565, 128]], '#b6874c', 1);
  inkSentence(ctx, EPILOGUE[0], 55, 179, (age - 8.7) / 1.1);
  inkSentence(ctx, EPILOGUE[1], 55, 219, (age - 9.9) / 1.1);
  if (age > 10.5) brushSlash(ctx, { x: 55, y: 237 }, { x: 473, y: 230 }, (age - 10.5) / 0.6, 10, '#b44a3e');
  ctx.restore();
  text(ctx, 'THE SEASONS RETURN TO THE SHRINE', 640, 505, 12, '#66714e', 'bold', false, 'center');
  for (let i = 0; i < 8; i++) drawSeasonScroll(ctx, i, 82 + i * 142, 529, 122, 149, (age - 4.4 - i * 0.62) / 0.6);
  text(ctx, 'THE BELL ENDURES', 640, 727, 28, '#344c3b', 'bold', true, 'center');
  text(ctx, 'ANY KEY OR TAP · OPEN YOUR FINAL RECORD', 640, 768, 11, '#796043', 'bold', false, 'center');
  ctx.save(); ctx.globalAlpha = clamp(1 - age * 1.7, 0, 1); ctx.fillStyle = '#0b1420'; ctx.fillRect(0, 0, WIDTH, HEIGHT); ctx.restore();
}
