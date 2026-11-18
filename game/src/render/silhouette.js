let mask = null;
// A reusable sprite-sized mask gives flashes the exact hand-drawn silhouette.
export function drawSilhouette(ctx, draw, actor, time, color = '#fffaf0', alpha = 1) {
  if (!mask) { mask = document.createElement('canvas'); mask.width = 160; mask.height = 160; }
  const ink = mask.getContext('2d');
  ink.setTransform(1, 0, 0, 1, 0, 0); ink.clearRect(0, 0, 160, 160); ink.globalAlpha = 1; ink.globalCompositeOperation = 'source-over';
  draw(ink, { ...actor, x: 80, y: 80 }, time, 1, true);
  ink.globalCompositeOperation = 'source-in'; ink.fillStyle = color; ink.fillRect(0, 0, 160, 160);
  ink.globalCompositeOperation = 'source-over';
  ctx.save(); ctx.globalAlpha *= alpha; ctx.drawImage(mask, actor.x - 80, actor.y - 80); ctx.restore();
}
