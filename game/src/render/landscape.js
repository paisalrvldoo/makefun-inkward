import { FIELD } from '../config.js';
import { getSeason } from '../world/scrolls.js';
import { createRng } from '../rng.js';
import { circle, line } from './primitives.js';

const PAD = 40, landscapes = new Map();
const TINTS = {
  blossom: ['#728f92', '#526d6b', '#6d7660'],
  leaf: ['#658881', '#416956', '#52684d'],
  maple: ['#9b8876', '#6b6652', '#796045'],
  snow: ['#7798ae', '#526e85', '#667d91'],
};
function layer(draw) {
  const canvas = document.createElement('canvas');
  canvas.width = FIELD.w + PAD * 2; canvas.height = FIELD.h + PAD * 2;
  const ctx = canvas.getContext('2d');
  ctx.translate(PAD - FIELD.x, PAD - FIELD.y); draw(ctx);
  return canvas;
}
function pine(ctx, x, y, height, color, snow) {
  ctx.save(); ctx.translate(x, y);
  line(ctx, [[0, 0], [-2, -height]], color, 3);
  ctx.fillStyle = color;
  for (let i = 0; i < 6; i++) {
    const top = -height + i * height * 0.12, width = height * (0.08 + i * 0.035);
    ctx.beginPath(); ctx.moveTo(-2, top - 14);
    ctx.quadraticCurveTo(-width * 0.45, top + 7, -width, top + 17);
    ctx.quadraticCurveTo(-width * 0.25, top + 12, 0, top + 20);
    ctx.quadraticCurveTo(width * 0.45, top + 12, width, top + 16);
    ctx.quadraticCurveTo(width * 0.45, top + 2, -2, top - 14); ctx.fill();
    if (snow) line(ctx, [[-width * 0.8, top + 15], [-2, top + 4], [width * 0.75, top + 14]], '#ecf4f7', 2);
  }
  ctx.restore();
}
function createLandscape(season, branch) {
  const [far, mid, near] = TINTS[season.motif], snow = season.motif === 'snow';
  const mountains = layer(ctx => {
    const rng = createRng(136);
    for (let ridge = 0; ridge < 3; ridge++) {
      const base = 320 + ridge * 48;
      ctx.globalAlpha = 0.12 + ridge * 0.025;
      const wash = ctx.createLinearGradient(0, 175, 0, base + 95);
      wash.addColorStop(0, far); wash.addColorStop(1, far + '00'); ctx.fillStyle = wash;
      ctx.beginPath(); ctx.moveTo(FIELD.x - PAD, base + 95);
      const peaks = [];
      for (let i = 0; i < 14; i++) {
        const x = FIELD.x - PAD + i * 86;
        const y = base - 35 - rng() * (i % 2 ? 55 : 125);
        peaks.push([x, y]);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(FIELD.x + FIELD.w + PAD, base + 95); ctx.closePath(); ctx.fill();
      ctx.globalAlpha *= 0.5;
      for (let i = 2; i < peaks.length; i += 2) {
        const [x, y] = peaks[i];
        line(ctx, [[x - 20, y + 24], [x, y], [x + 23, y + 42], [x + 10, y + 32]], far, 1.3);
      }
    }
    // Horizontal veils soften the ridges like water spreading through paper.
    for (let i = 0; i < 3; i++) {
      const y = 290 + i * 60, mist = ctx.createLinearGradient(0, y - 28, 0, y + 28);
      mist.addColorStop(0, '#fffaf000'); mist.addColorStop(0.5, snow ? '#f0f8fc' : '#fffaf0'); mist.addColorStop(1, '#fffaf000');
      ctx.globalAlpha = 0.42; ctx.fillStyle = mist;
      ctx.fillRect(FIELD.x - PAD, y - 28, FIELD.w + PAD * 2, 56);
    }
    if (snow) {
      ctx.globalAlpha = 0.65; circle(ctx, 862, 241, 34, '#eff9ff');
      circle(ctx, 872, 236, 31, '#d5e7ee');
    }
  });
  const grove = layer(ctx => {
    ctx.globalAlpha = snow ? 0.26 : 0.2;
    for (const [x, y, h] of [[48, 385, 167], [92, 339, 145], [143, 364, 126], [884, 353, 151], [942, 414, 196], [985, 344, 140]]) pine(ctx, x, y, h, mid, snow);
    ctx.globalAlpha = 0.23;
    line(ctx, [[758, 343], [758, 263]], mid, 7); line(ctx, [[830, 343], [830, 263]], mid, 7);
    line(ctx, [[735, 258], [793, 265], [852, 257]], mid, 8);
    line(ctx, [[746, 279], [841, 279]], mid, 5);
    line(ctx, [[753, 342], [765, 342]], mid, 3); line(ctx, [[824, 342], [836, 342]], mid, 3);
    if (snow) line(ctx, [[736, 253], [793, 260], [851, 252]], '#f7fcff', 3);
  });
  const edge = layer(ctx => {
    ctx.globalAlpha = 0.82;
    branch(ctx, FIELD.x + 7, FIELD.y + 195, 1.2, 1, season.motif);
    branch(ctx, FIELD.x + FIELD.w - 2, FIELD.y + FIELD.h - 25, 1.05, -1, season.motif);
    const rng = createRng(87); ctx.globalAlpha = 0.3;
    ctx.strokeStyle = near; ctx.lineCap = 'round';
    for (let i = 0; i < 76; i++) {
      const x = FIELD.x + rng() * FIELD.w, y = FIELD.y + FIELD.h + 12;
      if (x > 260 && x < 740) continue;
      const height = 15 + rng() * 50, lean = (rng() - 0.5) * 36;
      ctx.lineWidth = 0.8 + rng() * 1.6;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + lean * 0.2, y - height * 0.6, x + lean, y - height); ctx.stroke();
    }
  });
  const light = layer(ctx => {
    if (season.motif !== 'maple' && !snow) return;
    const color = snow ? '#d4edff' : '#ffe8ab';
    for (let i = 0; i < 5; i++) {
      const x = snow ? 796 + i * 26 : 114 + i * 54, y = FIELD.y - 20;
      const reach = snow ? -160 - i * 30 : 250 + i * 26;
      const beam = ctx.createLinearGradient(x, y, x + reach, FIELD.y + FIELD.h);
      beam.addColorStop(0, color + '00'); beam.addColorStop(0.2, color + 'a0'); beam.addColorStop(1, color + '00');
      ctx.fillStyle = beam; ctx.globalAlpha = snow ? 0.28 : 0.3;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 12, y);
      ctx.lineTo(x + reach + 110, FIELD.y + FIELD.h); ctx.lineTo(x + reach, FIELD.y + FIELD.h); ctx.closePath(); ctx.fill();
    }
  });
  return { mountains, grove, edge, light };
}
export function drawParallax(ctx, state, branch) {
  const season = getSeason(state);
  if (!landscapes.has(season.motif)) landscapes.set(season.motif, createLandscape(season, branch));
  const layers = landscapes.get(season.motif);
  const cameraX = (state.monk.x - (FIELD.x + FIELD.w / 2)) / FIELD.w;
  const cameraY = (state.monk.y - (FIELD.y + FIELD.h / 2)) / FIELD.h;
  for (const [canvas, depth] of [[layers.mountains, 5], [layers.grove, 13], [layers.edge, 24]]) {
    const drift = Math.sin(state.time * 0.075) * depth * 0.16;
    ctx.drawImage(canvas, FIELD.x - PAD - cameraX * depth + drift, FIELD.y - PAD - cameraY * depth * 0.4);
  }
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha *= 0.82 + Math.sin(state.time * 0.3) * 0.12;
  ctx.drawImage(layers.light, FIELD.x - PAD - cameraX * 8, FIELD.y - PAD); ctx.restore();
}
