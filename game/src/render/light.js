const glows = new Map();
// Small cached radial sprites avoid Canvas shadowBlur and live gradients.
export function drawGlow(ctx, x, y, radius, opacity = 0.35, color = '#efb64b') {
  if (!glows.has(color)) {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
    const paint = canvas.getContext('2d'), gradient = paint.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, color + 'b0'); gradient.addColorStop(0.22, color + '80');
    gradient.addColorStop(0.55, color + '30'); gradient.addColorStop(1, color + '00');
    paint.fillStyle = gradient; paint.fillRect(0, 0, 128, 128); glows.set(color, canvas);
  }
  ctx.save(); ctx.globalAlpha *= opacity;
  ctx.drawImage(glows.get(color), x - radius, y - radius, radius * 2, radius * 2); ctx.restore();
}
let groundShadow;
export function drawShadow(ctx, x, y, radius) {
  if (!groundShadow) {
    groundShadow = document.createElement('canvas'); groundShadow.width = 128; groundShadow.height = 64;
    const paint = groundShadow.getContext('2d'); paint.scale(1, 0.5);
    const gradient = paint.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, '#252c3040'); gradient.addColorStop(0.4, '#252c3025'); gradient.addColorStop(1, '#252c3000');
    paint.fillStyle = gradient; paint.fillRect(0, 0, 128, 128);
  }
  ctx.drawImage(groundShadow, x - radius * 1.4, y + 12 - radius * 0.45, radius * 2.8, radius * 0.9);
}
