import { circle } from './primitives.js';

export function drawInkMotes(ctx, state) {
  for (const mote of state.inkMotes) {
    ctx.save();
    mote.trail.forEach((p, i) => { ctx.globalAlpha = (1 - i / 5) * 0.35; circle(ctx, p.x, p.y, 3 - i * 0.4, '#338e86'); });
    ctx.globalAlpha = 1; ctx.shadowColor = '#97f1d4'; ctx.shadowBlur = 12;
    const size = 4 + Math.sin(mote.age * 12) * 0.8;
    circle(ctx, mote.x, mote.y, size + 2, '#218d7e'); circle(ctx, mote.x, mote.y, size, '#e0ffe2', '#39ab96', 1.5);
    ctx.restore();
  }
}
