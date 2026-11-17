import { COLORS } from '../config.js';

export function text(ctx, value, x, y, size = 16, color = COLORS.ink, weight = 'normal', serif = false, align = 'left') {
  ctx.font = `${weight} ${size}px ${serif ? 'Georgia, serif' : 'Arial, sans-serif'}`;
  ctx.fillStyle = color; ctx.textAlign = align; ctx.fillText(value, x, y); ctx.textAlign = 'left';
}
export function line(ctx, points, color = COLORS.ink, width = 2) {
  if (!points.length) return;
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(points[0][0], points[0][1]);
  for (const p of points.slice(1)) ctx.lineTo(p[0], p[1]);
  ctx.stroke();
}
export function circle(ctx, x, y, radius, fill, stroke = null, width = 1) {
  ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
}
export function panel(ctx, x, y, w, h, fill = '#fbf6e9', stroke = COLORS.line) {
  ctx.fillStyle = fill; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}
export function stamp(ctx, value, x, y, size = 48, angle = -0.08) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
  ctx.strokeStyle = COLORS.red; ctx.lineWidth = 2.5; ctx.strokeRect(-size / 2, -size / 2, size, size);
  ctx.lineWidth = 1; ctx.strokeRect(-size / 2 + 4, -size / 2 + 4, size - 8, size - 8);
  text(ctx, value, 0, size * 0.16, size * 0.28, COLORS.red, 'bold', true, 'center'); ctx.restore();
}
export function button(ctx, label, rect, hovered = false, small = null) {
  const { x, y, w, h } = rect;
  ctx.fillStyle = hovered ? '#cc5845' : COLORS.red; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#f0b9a3'; ctx.lineWidth = 1; ctx.strokeRect(x + 5, y + 5, w - 10, h - 10);
  text(ctx, label, x + w / 2, y + h / 2 + (small ? -2 : 7), 22, COLORS.white, 'bold', true, 'center');
  if (small) text(ctx, small, x + w / 2, y + h - 15, 11, '#f3d5bb', 'bold', false, 'center');
}
export function hitRect(point, rect) { return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h; }
export function wrapText(ctx, value, x, y, maxWidth, lineHeight, size = 16, color = COLORS.faint) {
  ctx.font = `${size}px Arial, sans-serif`; ctx.fillStyle = color; ctx.textAlign = 'left';
  let current = '';
  for (const word of value.split(' ')) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && current) { ctx.fillText(current, x, y); y += lineHeight; current = word; }
    else current = next;
  }
  if (current) ctx.fillText(current, x, y);
  return y + lineHeight;
}
