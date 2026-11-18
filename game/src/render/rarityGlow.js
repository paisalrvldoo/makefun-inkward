import { artLevel } from '../arts/levels.js';
import { artSchool, schoolCount } from '../arts/schools.js';
import { text } from './primitives.js';

export function artRarity(state, art) {
  if (art.unlock || artLevel(state, art.id) >= 2) return { name: 'EPIC', color: '#d69aff', rank: 3 };
  const school = artSchool(art.id);
  if (artLevel(state, art.id) || school && schoolCount(state, school)) return { name: 'RARE', color: '#6ad3ed', rank: 2 };
  return { name: 'COMMON', color: '#b6d9b5', rank: 1 };
}
export function drawRarityGlow(ctx, state, art, rect, hovered) {
  const rarity = artRarity(state, art), pulse = 0.65 + Math.sin(state.time * 3 + rect.x) * 0.12;
  ctx.save(); ctx.shadowColor = rarity.color; ctx.shadowBlur = (hovered ? 22 : 9) * rarity.rank * pulse;
  ctx.strokeStyle = rarity.color; ctx.lineWidth = hovered ? 3 : 1.5;
  ctx.strokeRect(rect.x + 1.5, rect.y + 1.5, rect.w - 3, rect.h - 3);
  ctx.shadowBlur = 0;
  text(ctx, rarity.name, rect.x + rect.w - 19, rect.y + 27, 10, rarity.color, 'bold', false, 'right');
  if (rarity.rank > 1) for (let i = 0; i < 5; i++) {
    const x = rect.x + 14 + (i * 53 + state.time * 7) % (rect.w - 28), y = rect.y + 51 + (i * 71) % 175;
    ctx.globalAlpha = Math.max(0, Math.sin(state.time * 2.4 + i)) * 0.65;
    ctx.fillStyle = rarity.color; ctx.fillRect(x, y, 2, 2);
  }
  ctx.restore();
}
