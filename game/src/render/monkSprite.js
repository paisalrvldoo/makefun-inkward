import { COLORS, MONK } from '../config.js';
import { circle, line } from './primitives.js';
import { drawShadow as shadow } from './light.js';
import { getOutfit, getBrush } from '../skins.js';

export function drawMonk(ctx, monk, time = 0, scale = 1, silhouette = false) {
  const outfit = getOutfit(monk.outfit);
  const brushskin = getBrush(monk.brush || 'sumi');
  const isKatana = brushskin.id === 'katana';
  ctx.save(); ctx.translate(monk.x, monk.y); ctx.scale(scale, scale);
  if (!silhouette && monk.hurtTime > 0 && Math.floor(time * 20) % 2) ctx.globalAlpha *= 0.45;
  if (!silhouette) shadow(ctx, 0, 0, 22);
  const walk = monk.walk || 0, sway = Math.sin(time * 1.8 + walk) * 2.3;
  if (monk.dashTime > 0) {
    const progress = Math.max(0, Math.min(1, 1 - monk.dashTime / MONK.dashTime));
    const stretch = 1 + Math.sin(progress * Math.PI) * 0.34 - Math.exp(-Math.pow(progress / 0.12, 2)) * 0.1;
    const angle = Math.atan2(monk.vy ?? 0, monk.vx ?? 1);
    ctx.rotate(angle); ctx.scale(stretch, 1 / stretch); ctx.rotate(-angle);
  }
  if (monk.landingTime > 0) {
    const squash = Math.sin(monk.landingTime / 0.2 * Math.PI) * 0.19;
    ctx.translate(0, 18); ctx.scale(1 + squash, 1 - squash); ctx.translate(0, -18);
  }
  if (monk.recoil > 0) ctx.rotate(-Math.sign(monk.recoilX) * monk.recoil * 1.1);
  ctx.rotate(Math.sin(time * 1.8 + walk) * 0.025);
  if (outfit.id === 'ronin') {
    // Ronin: wide straw hat, dark worn kimono, trailing scarf
    ctx.fillStyle = outfit.jacket; ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.moveTo(-11, -4); ctx.quadraticCurveTo(-17 + sway, 6, -19 + sway, 18); ctx.quadraticCurveTo(sway, 24, 18 + sway, 16); ctx.lineTo(12, -5); ctx.closePath(); ctx.fill(); ctx.stroke();
    line(ctx, [[-6, 2], [sway * 0.6, 14], [7, 3]], outfit.robe, 1.3);
    line(ctx, [[-14 + sway, 16], [sway, 19], [13 + sway, 15]], '#2a2528', 1.2);
    circle(ctx, 0, -13, 11, '#d8c8b0', COLORS.ink, 2.5);
    // Wide straw hat (ronin)
    ctx.fillStyle = outfit.hat; ctx.beginPath(); ctx.moveTo(-22, -20); ctx.quadraticCurveTo(0, -32, 22, -20); ctx.quadraticCurveTo(0, -26, -22, -20); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#4a3d2e'; ctx.beginPath(); ctx.ellipse(0, -20, 22, 4, 0, 0, Math.PI * 2); ctx.fill();
    line(ctx, [[-18, -21], [18, -21]], '#8a7558', 1);
    circle(ctx, -4, -13, 1.5, COLORS.ink); circle(ctx, 4, -13, 1.5, COLORS.ink);
    // Scarf
    line(ctx, [[-10, -1], [10, -1]], outfit.scarf, 5);
    const flutter = Math.sin(time * 5.5 + walk) * 3 + (monk.dashTime > 0 ? 7 : 0);
    line(ctx, [[9, 0], [24, 4 - flutter * 0.3], [31 + sway, -flutter]], outfit.scarf, 4);
    line(ctx, [[-12, 0], [-24, 6 - flutter * 0.4], [-30 + sway, -flutter * 0.8]], outfit.scarf, 3);
    // Katana brush
    ctx.save(); ctx.rotate(Math.sin(time * 2.3 + walk * 0.6) * 0.065 - (monk.dashTime > 0 ? 0.15 : 0));
    line(ctx, [[-20, 13], [17, -17]], '#3a4858', 4);
    line(ctx, [[-18, 12], [15, -15]], '#6a8ab0', 1.5);
    ctx.fillStyle = '#1a2030'; ctx.beginPath(); ctx.moveTo(15, -17); ctx.lineTo(26, -28); ctx.lineTo(30, -24); ctx.lineTo(19, -13); ctx.closePath(); ctx.fill();
    line(ctx, [[16, -19], [28, -30]], '#8ab0e0', 1);
    circle(ctx, -4, 0, 3.5, '#d8c8b0', COLORS.ink, 1);
    ctx.restore();
  } else {
    // Rice-paper robes, vermilion scarf and an oversized sumi brush.
    ctx.fillStyle = outfit.jacket; ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.moveTo(-10, -6); ctx.quadraticCurveTo(-16 + sway, 5, -18 + sway, 17); ctx.quadraticCurveTo(sway, 23, 17 + sway, 15); ctx.lineTo(11, -5); ctx.closePath(); ctx.fill(); ctx.stroke();
    line(ctx, [[-5, 2], [sway * 0.6, 14], [6, 3]], outfit.robe, 1.3);
    line(ctx, [[-13 + sway, 16], [sway, 19], [12 + sway, 15]], '#e5d3ac', 1.2);
    circle(ctx, 0, -13, 12, '#faf0d9', COLORS.ink, 2.5);
    ctx.fillStyle = outfit.hat; ctx.beginPath(); ctx.ellipse(0, -23, 18, 4.5, -0.04, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d6b36c'; ctx.beginPath(); ctx.moveTo(-17, -24); ctx.lineTo(0, -37); ctx.lineTo(18, -24); ctx.closePath(); ctx.fill(); ctx.stroke();
    line(ctx, [[-10, -27], [12, -27]], '#907f58', 1);
    circle(ctx, -4, -13, 1.5, COLORS.ink); circle(ctx, 4, -13, 1.5, COLORS.ink);
    line(ctx, [[-10, -1], [10, -1]], outfit.scarf, 5);
    const flutter = Math.sin(time * 5.5 + walk) * 3 + (monk.dashTime > 0 ? 7 : 0);
    line(ctx, [[9, 0], [23, 4 - flutter * 0.3], [29 + sway, -flutter]], outfit.scarf, 4);
    ctx.save(); ctx.rotate(Math.sin(time * 2.3 + walk * 0.6) * 0.065 - (monk.dashTime > 0 ? 0.15 : 0));
    if (isKatana) {
      line(ctx, [[-20, 13], [17, -17]], '#3a4858', 4);
      line(ctx, [[-18, 12], [15, -15]], '#6a8ab0', 1.5);
      ctx.fillStyle = '#1a2030'; ctx.beginPath(); ctx.moveTo(15, -17); ctx.lineTo(26, -28); ctx.lineTo(30, -24); ctx.lineTo(19, -13); ctx.closePath(); ctx.fill();
      line(ctx, [[16, -19], [28, -30]], brushskin.trailColor, 1);
    } else {
      line(ctx, [[-20, 13], [17, -17]], '#66523a', 5);
      line(ctx, [[-18, 12], [15, -15]], '#a98753', 2);
      ctx.fillStyle = brushskin.inkColor; ctx.beginPath(); ctx.moveTo(15, -17); ctx.quadraticCurveTo(23, -36, 33, -33); ctx.quadraticCurveTo(25, -16, 19, -13); ctx.closePath(); ctx.fill();
      line(ctx, [[18, -20], [23, -25]], '#6c716a', 1);
    }
    circle(ctx, -4, 0, 3.5, '#faf0d9', COLORS.ink, 1);
    ctx.restore();
  }
  ctx.restore();
}
