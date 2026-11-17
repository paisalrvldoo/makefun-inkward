import { COLORS } from '../config.js';
import { YOKAI } from '../entities/yokai.js';
import { drawMonk, drawYokai } from '../render/sprites.js';
import { drawStrokes } from '../render/ink.js';
import { drawEffects } from '../render/fx.js';
import { panel, text, line, circle } from '../render/primitives.js';

const loop = (x, y, rx, ry, fraction = 1) => Array.from({ length: 49 }, (_, i) => {
  const angle = 0.5 + i / 48 * Math.PI * 2 * fraction;
  return { x: x + Math.cos(angle) * rx, y: y + Math.sin(angle) * ry };
});
const ink = points => ({ points, life: 16, integrity: 1 });
const spirits = (ctx, kind, x, y, scale) => drawYokai(ctx, { kind, x, y, color: YOKAI[kind].color, phase: 0, radius: 18 }, 0, scale);

// Small encounters use the same ink, sprites, seal stamp and particles as play.
export function drawTutorial(ctx) {
  const captions = ['PAINT TO BLOCK', 'CLOSE THE LOOP', 'SEAL AND REFILL'];
  for (let step = 0; step < 3; step++) {
    ctx.save(); ctx.translate(64 + step * 393, 598);
    panel(ctx, 0, 0, 366, 156, '#192632', '#d5a847');
    text(ctx, `0${step + 1}`, 15, 39, 38, '#f0c15d', 'bold');
    text(ctx, captions[step], 77, 33, 21, '#fff5dd', 'bold');
    panel(ctx, 14, 50, 338, 94, '#f6f0df', '#d5a847');
    const scene = { strokes: [], seals: [], arts: [], activeStroke: null };
    if (step === 0) {
      scene.strokes.push(ink([{ x: 176, y: 65 }, { x: 169, y: 83 }, { x: 170, y: 116 }, { x: 182, y: 130 }]));
      drawStrokes(ctx, scene);
      drawMonk(ctx, { x: 70, y: 107, hurtTime: 0 }, 0, 1.05);
      spirits(ctx, 'kappa', 264, 101, 1.3);
      line(ctx, [[237, 103], [192, 103]], COLORS.red, 4);
      line(ctx, [[204, 94], [192, 103], [204, 112]], COLORS.red, 4);
      text(ctx, 'WALL', 130, 139, 17, COLORS.ink, 'bold', false, 'center');
    } else if (step === 1) {
      const points = loop(158, 99, 99, 37, 0.85);
      scene.strokes.push(ink(points)); drawStrokes(ctx, scene);
      spirits(ctx, 'kappa', 106, 100, 0.85);
      spirits(ctx, 'lantern', 158, 100, 0.85);
      spirits(ctx, 'umbrella', 208, 100, 0.85);
      ctx.setLineDash([3, 5]); line(ctx, [[points.at(-1).x, points.at(-1).y], [points[0].x, points[0].y]], COLORS.red, 3); ctx.setLineDash([]);
      circle(ctx, points[0].x, points[0].y, 9, COLORS.red, COLORS.white, 3);
      text(ctx, 'CLOSE', 304, 93, 17, COLORS.red, 'bold', false, 'center');
      text(ctx, 'HERE', 304, 114, 17, COLORS.red, 'bold', false, 'center');
    } else {
      scene.seals.push({ points: loop(83, 99, 43, 32), life: 1.4, success: true }); drawStrokes(ctx, scene);
      const particles = Array.from({ length: 18 }, (_, i) => {
        const angle = i / 18 * Math.PI * 2;
        return { x: 83 + Math.cos(angle) * 56, y: 99 + Math.sin(angle) * 36, angle, size: 4 + i % 4, life: 1, petal: i % 3 === 0, color: i % 2 ? COLORS.red : COLORS.gold };
      });
      drawEffects(ctx, { particles, rings: [], bolts: [], floats: [
        { x: 239, y: 91, text: 'SEALED x3 +900', size: 21, color: COLORS.red, life: 1 },
        { x: 239, y: 125, text: '+INK', size: 27, color: '#306c54', life: 1 },
      ] });
    }
    ctx.restore();
  }
}
