import { clamp, WIDTH, HEIGHT } from '../config.js';
import { SEASONS, SCROLLS } from '../world/scrolls.js';
import { EPILOGUE } from '../scenes/ending.js';
import { drawBell, drawMonk } from './sprites.js';
import { text, line, circle, panel, stamp } from './primitives.js';
import { blossom, maple } from './paper.js';

const ease = t => 1 - (1 - clamp(t, 0, 1)) ** 3;

export function drawDawnShrine(ctx, state, time, miniature = false) {
  ctx.save();
  if (miniature) {
    ctx.translate(650, 159); ctx.scale(0.27, 0.27);
    ctx.beginPath(); ctx.rect(0, 145, 1020, 335); ctx.clip();
  }
  const dawn = ease((time - 0.6) / 2.7);
  const sky = ctx.createLinearGradient(0, 140, 0, 530);
  sky.addColorStop(0, miniature ? '#233440' : '#dedee8'); sky.addColorStop(0.5, '#efc580'); sky.addColorStop(1, '#f7e8b8');
  ctx.fillStyle = sky; ctx.fillRect(miniature ? 0 : 35, 145, miniature ? 1020 : 1210, 335);
  ctx.globalAlpha *= 0.3 + dawn * 0.7;
  circle(ctx, 640, 263, 75 + dawn * 14, '#fff2bf');
  ctx.save(); ctx.globalAlpha *= 0.25; ctx.fillStyle = '#fff6d2';
  for (let i = 0; i < 7; i++) {
    const a = -0.2 + i * 0.55 + Math.sin(time * 0.2) * 0.04;
    ctx.beginPath(); ctx.moveTo(640, 263); ctx.lineTo(640 + Math.cos(a) * 930, 263 + Math.sin(a) * 930);
    ctx.lineTo(640 + Math.cos(a + 0.13) * 930, 263 + Math.sin(a + 0.13) * 930); ctx.fill();
  }
  ctx.restore();
  for (let layer = 0; layer < 3; layer++) {
    ctx.fillStyle = ['#777f9080', '#586c7380', '#334b5088'][layer];
    ctx.beginPath(); ctx.moveTo(35, 480);
    for (let i = 0; i <= 18; i++) {
      const x = 35 + i * 67.2, y = 343 + layer * 31 - Math.sin(i * 0.86 + layer * 2.1) * (40 - layer * 7);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(1245, 480); ctx.closePath(); ctx.fill();
  }
  for (let i = 0; i < 5; i++) line(ctx, [[540 - i * 28, 450 + i * 6], [740 + i * 28, 450 + i * 6]], '#dfc7a8', 5);
  const ring = Math.max(0, time - 0.45);
  if (ring < 4) for (let i = 0; i < 3; i++) {
    ctx.save(); ctx.globalAlpha *= Math.max(0, 1 - ring / 4) * 0.7;
    circle(ctx, 640, 350, 55 + ring * 75 + i * 42, null, '#fff5c9', 2.5); ctx.restore();
  }
  drawBell(ctx, { ...state.bell, x: 640, y: 371, hp: state.bell.maxHp, hitTime: 0, wardTime: 0, ringTime: Math.max(0, 3 - ring), caption: '' }, time, 1.8);
  const walk = ease((time - 1.25) / 2.7);
  drawMonk(ctx, { ...state.monk, x: 400 + walk * 211, y: 449 - walk * 15, hurtTime: 0, dashTime: 0, recoil: 0, walk: walk < 1 ? time * 10 : 0 }, time, 1.25);
  line(ctx, [[60, 469], [209, 405], [296, 310], [358, 267]], '#303d40', 10);
  line(ctx, [[279, 329], [357, 337], [432, 309]], '#303d40', 5);
  for (let i = 0; i < 26; i++) {
    const x = 245 + Math.sin(i * 6.3) * 116, y = 299 + Math.cos(i * 2.1) * 67;
    blossom(ctx, x, y, (4 + i % 5) * dawn, i, i % 3 ? '#e59b9c' : '#f4c5af');
  }
  for (let i = 0; i < 22; i++) {
    const x = 90 + (i * 91 + time * 15) % 1100, y = 200 + (i * 53 + time * 17) % 270;
    ctx.save(); ctx.globalAlpha *= 0.75; blossom(ctx, x, y, 3 + i % 4, time + i, '#f4b9a7'); ctx.restore();
  }
  ctx.restore();
}

function seasonalScroll(ctx, i, time) {
  const open = ease((time - 3.1 - i * 0.42) / 0.65);
  if (!open) return;
  const season = SEASONS[SCROLLS[i].season], x = 71 + i * 143, y = 506, h = 152 * open;
  ctx.save();
  panel(ctx, x, y, 136, h, '#fff4da', '#b79453');
  ctx.beginPath(); ctx.rect(x + 1, y, 134, h); ctx.clip();
  ctx.fillStyle = season.wash + '55'; ctx.fillRect(x + 1, y, 134, 152);
  text(ctx, String(i + 1).padStart(2, '0'), x + 12, y + 25, 19, season.color, 'bold', true);
  line(ctx, [[x + 17, y + 113], [x + 53, y + 80], [x + 92, y + 62], [x + 116, y + 36]], '#554d40', 3);
  for (let j = 0; j < 5; j++) {
    const px = x + 42 + j * 14, py = y + 90 - j * 10;
    if (season.motif === 'blossom') blossom(ctx, px, py, 10, j, season.color);
    else if (season.motif === 'maple') maple(ctx, px, py, 13, j, season.color);
    else if (season.motif === 'snow') { circle(ctx, px, py, 8, '#f9fdff', '#6497b9', 1); }
    else { ctx.fillStyle = season.color; ctx.beginPath(); ctx.ellipse(px, py, 11, 4, -0.6, 0, Math.PI * 2); ctx.fill(); }
  }
  text(ctx, season.name, x + 68, y + 139, 10, season.color, 'bold', false, 'center');
  stamp(ctx, 'SEAL', x + 105, y + 102, 37, -0.15);
  ctx.restore();
  line(ctx, [[x - 3, y], [x + 139, y]], '#765737', 7);
  line(ctx, [[x - 3, y + h], [x + 139, y + h]], '#765737', 7);
  line(ctx, [[x - 3, y - 1], [x + 139, y - 1]], '#d6ad62', 2);
}

export function drawEnding(ctx, paper, state) {
  const time = state.ending.time;
  ctx.fillStyle = '#f6edda'; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.save(); ctx.globalAlpha = 0.3; ctx.drawImage(paper, 0, 0); ctx.restore();
  drawDawnShrine(ctx, state, time);
  // The dawn travels across the old blue paper rather than cutting to a new palette.
  ctx.save(); ctx.globalAlpha = 1 - ease((time - 0.7) / 2.5);
  const sweep = ctx.createLinearGradient(time * 550 - 800, 0, time * 550, 0);
  sweep.addColorStop(0, '#23334900'); sweep.addColorStop(1, '#233349');
  ctx.fillStyle = sweep; ctx.fillRect(35, 145, 1210, 335); ctx.restore();
  text(ctx, 'INKWARD / DAWN AFTER THE EIGHTH SEAL', 640, 43, 12, '#82623a', 'bold', false, 'center');
  text(ctx, 'THE BELL ENDURES', 640, 106, 63, '#29333b', 'bold', true, 'center');
  text(ctx, 'WINTER LAYS DOWN ITS MASK. THE GARDEN BREATHES.', 640, 132, 13, '#9c493e', 'bold', false, 'center');
  for (let i = 0; i < 8; i++) seasonalScroll(ctx, i, time);
  ctx.save(); ctx.globalAlpha = ease((time - 6.1) / 1.2);
  EPILOGUE.forEach((value, i) => {
    // Offset fine strokes give the original verse a dry ink impression.
    text(ctx, value, 640.6, 703 + i * 33, 27, '#a8977640', 'bold', true, 'center');
    text(ctx, value, 640, 702 + i * 33, 27, '#343a38', 'bold', true, 'center');
  }); ctx.restore();
  line(ctx, [[48, 770], [1232, 770]], '#b18b4e', 1);
  text(ctx, 'ANY KEY / TAP · REVEAL YOUR RECORD', 640, 788, 11, '#82623a', 'bold', false, 'center');
  ctx.strokeStyle = '#ac874d'; ctx.lineWidth = 2; ctx.strokeRect(24, 20, 1232, 744);
}
