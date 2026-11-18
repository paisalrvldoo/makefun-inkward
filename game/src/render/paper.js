import { WIDTH, HEIGHT, FIELD, COLORS } from '../config.js';
import { createRng } from '../rng.js';
import { circle, line, text } from './primitives.js';
import { getSeason } from '../world/scrolls.js';
import { drawParallax } from './landscape.js';

let gardenFibres;
function drawGardenFibres(ctx) {
  if (!gardenFibres) {
    gardenFibres = document.createElement('canvas'); gardenFibres.width = FIELD.w; gardenFibres.height = FIELD.h;
    const paint = gardenFibres.getContext('2d'), fibres = createRng(704); paint.globalAlpha = 0.065;
    for (let i = 0; i < 2300; i++) {
      const x = fibres() * FIELD.w, y = fibres() * FIELD.h;
      line(paint, [[x, y], [x + 2 + fibres() * 6, y + fibres() * 2]], i % 2 ? '#fffef3' : '#7a6a50', 0.5);
    }
  }
  ctx.drawImage(gardenFibres, FIELD.x, FIELD.y);
}

export function createPaper() {
  const canvas = document.createElement('canvas'); canvas.width = WIDTH; canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  const rng = createRng(704);
  ctx.fillStyle = COLORS.paper; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  for (let i = 0; i < 14000; i++) {
    ctx.globalAlpha = 0.025 + rng() * 0.025;
    ctx.strokeStyle = rng() > 0.5 ? '#fffef3' : '#7a6a50'; ctx.lineWidth = 0.5;
    const x = rng() * WIDTH, y = rng() * HEIGHT;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + rng() * 5, y + rng() * 2); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  return canvas;
}
export function wash(ctx, x, y, radius, color, opacity = 0.4) {
  ctx.save(); ctx.globalAlpha = opacity;
  const gradient = ctx.createRadialGradient(x, y, radius * 0.08, x, y, radius);
  gradient.addColorStop(0, color); gradient.addColorStop(0.5, color); gradient.addColorStop(1, color + '00');
  ctx.fillStyle = gradient; ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2); ctx.restore();
}
export function blossom(ctx, x, y, size, angle = 0, color = '#da989c') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.fillStyle = color;
  for (let i = 0; i < 5; i++) {
    ctx.rotate(Math.PI * 2 / 5); ctx.beginPath(); ctx.ellipse(0, -size * 0.55, size * 0.43, size * 0.66, 0, 0, Math.PI * 2); ctx.fill();
  }
  circle(ctx, 0, 0, size * 0.2, '#b68a36'); ctx.restore();
}
export function maple(ctx, x, y, size, angle = 0, color = '#cc6330') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.scale(size / 12, size / 12);
  ctx.fillStyle = color; ctx.beginPath();
  const points = [[0, 9], [-5, 7], [-5, 3], [-12, 0], [-8, -3], [-10, -8], [-4, -6], [-3, -13], [0, -10], [3, -13], [4, -6], [10, -8], [8, -3], [12, 0], [5, 3], [5, 7]];
  ctx.moveTo(...points[0]); for (const p of points.slice(1)) ctx.lineTo(...p); ctx.closePath(); ctx.fill();
  line(ctx, [[0, 14], [0, -8]], '#824b2b88', 0.7);
  line(ctx, [[0, 5], [-7, -3]], '#824b2b66', 0.6); line(ctx, [[0, 5], [7, -3]], '#824b2b66', 0.6); ctx.restore();
}
function branch(ctx, x, y, scale = 1, flip = 1, motif = 'blossom') {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale * flip, scale);
  line(ctx, [[0, 0], [24, -18], [57, -28], [95, -49], [137, -62]], '#5a5245', 6);
  line(ctx, [[55, -28], [63, -61], [83, -88]], '#5a5245', 3);
  line(ctx, [[94, -48], [117, -24], [154, -21]], '#5a5245', 2.5);
  const flowers = [[36, -26, 8], [62, -58, 11], [82, -85, 8], [110, -54, 12], [137, -65, 8], [146, -24, 10]];
  for (const [bx, by, size] of flowers) {
    if (motif === 'maple') { maple(ctx, bx, by, size * 1.6, bx, bx % 3 ? '#ce6930' : '#a8452e'); maple(ctx, bx + 15, by + 13, size, bx + 1, '#d69535'); }
    else if (motif === 'leaf') { ctx.save(); ctx.translate(bx, by); ctx.rotate(bx); ctx.fillStyle = '#739173'; ctx.beginPath(); ctx.ellipse(0, 0, size, size * 0.4, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
    else if (motif === 'snow') { line(ctx, [[bx - size, by], [bx + size, by]], '#fffdf2', 3); }
    else blossom(ctx, bx, by, size, bx, '#dfb0ae');
  }
  ctx.restore();
}
export function drawGarden(ctx, state) {
  const season = getSeason(state);
  ctx.save(); ctx.beginPath(); ctx.rect(FIELD.x, FIELD.y, FIELD.w, FIELD.h); ctx.clip();
  ctx.fillStyle = season.motif === 'snow' ? '#edf6f8' : '#faf5e6'; ctx.fillRect(FIELD.x, FIELD.y, FIELD.w, FIELD.h);
  wash(ctx, FIELD.x + 70, FIELD.y + 80, 220, season.wash, 0.72);
  wash(ctx, FIELD.x + FIELD.w - 10, FIELD.y + FIELD.h - 40, 250, season.wash, 0.66);
  wash(ctx, 495, 410, 210, '#ebdbac', 0.25);
  if (season.motif === 'maple') {
    wash(ctx, 100, 550, 290, '#e57c35', 0.54);
    wash(ctx, 840, 290, 260, '#db8839', 0.56);
    wash(ctx, 480, 230, 310, '#edb85f', 0.43);
  }
  drawParallax(ctx, state, branch);
  ctx.globalAlpha = 0.15;
  for (let i = 0; i < 6; i++) {
    ctx.strokeStyle = '#b5af96'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(493, 422, 120 + i * 22, 68 + i * 15, -0.06, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // Sparse garden stones make the centre readable and keep the playing paper bright.
  for (const [x, y, r] of [[220, 301, 15], [760, 509, 19], [333, 590, 13], [825, 253, 14]]) {
    ctx.fillStyle = '#c6c4b0'; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.5, -0.3, 0, Math.PI * 2); ctx.fill();
    line(ctx, [[x - r * 0.6, y - 2], [x, y - r * 0.25], [x + r * 0.7, y - 1]], '#e9e3ce', 2);
    line(ctx, [[x + 15, y + 3], [x + 20, y - 11]], '#a6b296', 1.4);
  }
  const rng = createRng(91);
  const snowfall = season.motif === 'snow' ? 78 : 32;
  for (let i = 0; i < snowfall; i++) {
    const baseX = FIELD.x + rng() * FIELD.w, baseY = FIELD.y + rng() * FIELD.h;
    const x = FIELD.x + (baseX - FIELD.x + state.time * (6 + i % 5)) % FIELD.w;
    const y = FIELD.y + (baseY - FIELD.y + state.time * 3) % FIELD.h;
    ctx.save(); ctx.translate(x, y); ctx.rotate(i + state.time * 0.2); ctx.globalAlpha = 0.38;
    if (season.motif === 'maple') { ctx.globalAlpha = 0.55; maple(ctx, 0, 0, 5 + i % 5, 0, i % 3 ? '#ce6930' : '#b94c32'); }
    else if (season.motif === 'snow') circle(ctx, 0, 0, 2 + i % 4, '#ffffff', '#669bb7', 1.25);
    else { ctx.fillStyle = season.color; ctx.beginPath(); ctx.ellipse(0, 0, 3 + i % 3, 1.8, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
  drawGardenFibres(ctx);
  ctx.restore();
  ctx.strokeStyle = '#817044'; ctx.lineWidth = 2; ctx.strokeRect(FIELD.x + 0.5, FIELD.y + 0.5, FIELD.w - 1, FIELD.h - 1);
  // Registration marks frame the garden like a printed scroll.
  for (const [x, y, dx, dy] of [[FIELD.x, FIELD.y, 1, 1], [FIELD.x + FIELD.w, FIELD.y, -1, 1], [FIELD.x, FIELD.y + FIELD.h, 1, -1], [FIELD.x + FIELD.w, FIELD.y + FIELD.h, -1, -1]]) {
    line(ctx, [[x + dx * 5, y + dy * 23], [x + dx * 5, y + dy * 5], [x + dx * 23, y + dy * 5]], '#9e9278', 2);
  }
  text(ctx, 'THE SHRINE GARDEN', FIELD.x + 20, FIELD.y + 27, 10, '#65583d', 'bold');
}
