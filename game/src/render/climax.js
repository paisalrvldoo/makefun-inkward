import { WIDTH, HEIGHT, clamp } from '../config.js';
import { text, circle } from './primitives.js';
import { brushSlash } from './brush.js';
import { drawYokai } from './sprites.js';
import { drawSilhouette } from './silhouette.js';
import { drawEffects } from './fx.js';

function inkWash(ctx, amount, color) {
  ctx.save(); ctx.globalAlpha = amount;
  for (let i = 0; i < 15; i++) {
    ctx.fillStyle = i % 3 ? color : '#172330';
    ctx.beginPath(); ctx.moveTo(-40, i * 65 - 12);
    ctx.bezierCurveTo(340, i * 65 + 40, 870, i * 65 - 24, WIDTH + 40, i * 65 + 10);
    ctx.lineTo(WIDTH + 40, i * 65 + 72); ctx.lineTo(-40, i * 65 + 84); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

export function drawClimax(ctx, state) {
  const cinematic = state.climax;
  if (cinematic && state.mode === 'play') {
    const age = cinematic.age, fade = Math.min(1, age * 4, (cinematic.duration - age) * 3);
    inkWash(ctx, fade * 0.78, cinematic.phase === 2 ? '#274050' : '#182a3c');
    ctx.save(); ctx.globalAlpha = fade;
    ctx.fillStyle = '#080f1ce6'; ctx.fillRect(0, 0, WIDTH, 80); ctx.fillRect(0, HEIGHT - 80, WIDTH, 80);
    const boss = state.enemies.find(enemy => enemy.id === cinematic.bossId);
    if (boss) {
      const portrait = { ...boss, x: 640, y: 352, stun: 0, telegraph: null, hitTime: 0 };
      drawYokai(ctx, portrait, state.time, 2.4 + age * 0.13);
    }
    brushSlash(ctx, { x: 310, y: 478 }, { x: 970, y: 454 }, clamp(age * 2, 0, 1), 78, '#101a28');
    text(ctx, cinematic.intro ? 'THE EIGHTH WARDEN' : `PHASE ${cinematic.phase + 1} / 3`, 640, 186, 13, '#efcf85', 'bold', false, 'center');
    text(ctx, cinematic.name, 640, 499, 38, '#fff1d4', 'bold', true, 'center');
    text(ctx, cinematic.title, 640, 557, 30, cinematic.phase === 2 ? '#f5ad9b' : '#bce5ef', 'bold', true, 'center');
    text(ctx, cinematic.phase === 2 ? 'FROST LANES ALTERNATE · DASH THROUGH THE CUT · SEAL THE RECOVERY' : 'THE WARD SHIFTS. THE BRUSH STILL MOVES.', 640, 600, 11, '#d2d9d1', 'bold', false, 'center');
    ctx.restore();
  }
  if (state.mode !== 'seal' || !state.finalSeal) return;
  const seal = state.finalSeal, age = seal.age;
  ctx.save();
  inkWash(ctx, Math.min(0.5, age * 0.28), '#152337');
  if (age < 0.65) {
    const alpha = age < 0.24 ? 1 : clamp((0.65 - age) / 0.41, 0, 1);
    drawSilhouette(ctx, drawYokai, seal.boss, state.time, '#fff7dc', alpha);
  }
  if (age >= 0.24) {
    const cut = clamp((age - 0.24) / 0.2, 0, 1), fade = clamp((2.9 - age) / 1.6, 0, 1);
    ctx.globalAlpha = clamp(1 - (age - 0.24) * 5, 0, 1) * 0.8;
    ctx.fillStyle = '#fffbe6'; ctx.fillRect(0, 0, WIDTH, HEIGHT); ctx.globalAlpha = fade;
    brushSlash(ctx, { x: -60, y: 720 }, { x: 1370, y: 108 }, cut, 115, '#e7be6b');
    brushSlash(ctx, { x: -60, y: 720 }, { x: 1370, y: 108 }, cut, 94, '#101723');
    brushSlash(ctx, { x: -60, y: 712 }, { x: 1370, y: 100 }, cut, 20, '#fff2c1');
    const wave = clamp((age - 0.3) / 1.5, 0, 1);
    circle(ctx, seal.x, seal.y, 60 + wave * 1050, null, '#fff6d4', 11 * (1 - wave) + 1);
    ctx.globalAlpha = 1; drawEffects(ctx, state);
    for (let i = 0; i < 45; i++) {
      const angle = i * 2.399, radius = 75 + (age - 0.24) * (150 + i % 7 * 47), x = seal.x + Math.cos(angle) * radius, y = seal.y + Math.sin(angle) * radius * 0.6;
      ctx.save(); ctx.translate(x, y); ctx.rotate(angle + age); ctx.globalAlpha = Math.min(1, fade);
      ctx.fillStyle = i % 3 ? '#efb3b2' : '#efcf75'; ctx.beginPath(); ctx.ellipse(0, 0, 10, 4, 0.2, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
  }
  if (age > 1.1) {
    ctx.globalAlpha = clamp((age - 1.1) * 2, 0, 1);
    text(ctx, 'THE LAST SEAL', 640, 357, 74, '#fff0c4', 'bold', true, 'center');
    text(ctx, 'EIGHT SCROLLS. ONE UNBROKEN SONG.', 640, 406, 15, '#e9c578', 'bold', false, 'center');
  }
  ctx.restore();
}
