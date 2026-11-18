export function drawEffects(ctx, state) {
  for (const bolt of state.bolts) {
    ctx.globalAlpha = Math.min(1, bolt.life * 3);
    ctx.beginPath(); ctx.moveTo(bolt.x, bolt.y);
    for (let i = 1; i <= 7; i++) {
      const t = i / 7, offset = i === 7 ? 0 : Math.sin(i * 9.1) * 13;
      ctx.lineTo(bolt.x + (bolt.endX - bolt.x) * t + offset, bolt.y + (bolt.endY - bolt.y) * t - offset);
    }
    ctx.strokeStyle = '#c49a3d'; ctx.lineWidth = 5; ctx.stroke();
    ctx.strokeStyle = '#faf4e4'; ctx.lineWidth = 2; ctx.stroke();
  }
  for (const ring of state.rings) {
    const progress = 1 - ring.life / ring.maxLife;
    ctx.globalAlpha = (1 - progress) * 0.82;
    ctx.strokeStyle = ring.color; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(ring.x, ring.y, ring.radius * (0.3 + progress * 0.7), 0, Math.PI * 2); ctx.stroke();
  }
  for (const p of state.particles) {
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle);
    ctx.globalAlpha = Math.min(1, p.life * 2); ctx.fillStyle = p.color;
    ctx.beginPath();
    if (p.petal) {
      ctx.moveTo(-p.size, 0); ctx.quadraticCurveTo(0, -p.size, p.size, 0);
      ctx.quadraticCurveTo(p.size * 0.2, p.size * 0.65, -p.size, 0);
    } else ctx.ellipse(0, 0, p.size * 0.65, p.size * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    if (!p.petal) { ctx.beginPath(); ctx.arc(p.size * 1.8, -p.size, p.size * 0.22, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  const bigSeal = state.floats.some(f => Number(/^SEALED ×(\d+)/.exec(f.text)?.[1]) >= 4);
  for (const f of state.floats) {
    // Combo and WRATH are already readable in the permanent HUD.
    if (state.scoreBurst && /^SEALED ×/.test(f.text)) continue;
    if (/^(COMBO ×|WRATH \d)/.test(f.text) || (bigSeal && f.text === 'LOTUS HUSH')) continue;
    const value = f.text.replace(/ · WRATH ×[\d.]+$/, '');
    ctx.globalAlpha = Math.min(1, f.life * 2);
    ctx.font = `bold ${f.size}px Georgia, serif`; ctx.textAlign = 'center';
    ctx.lineWidth = 5; ctx.strokeStyle = '#fffaf0'; ctx.strokeText(value, f.x, f.y);
    ctx.fillStyle = f.color; ctx.fillText(value, f.x, f.y);
  }
  ctx.globalAlpha = 1; ctx.textAlign = 'left';
}
