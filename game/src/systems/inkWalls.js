import { INK, distance } from '../config.js';
import { nearestOnSegment } from '../ink/geometry.js';
import { burst, floatText } from '../render/fx.js';
import { artLevel } from '../arts/levels.js';
import { wrathMultiplier } from '../world/wrath.js';
import { castArt } from '../fx/skillCasts.js';
import { dissolveSpirit } from '../fx/characterStates.js';
import { synergyBonus } from '../arts/schools.js';
import { ascensionModifiers } from '../world/ascension.js';
import { relicScoreBonus } from '../arts/relics.js';

export function wallCollision(state, enemy, next, dt) {
  if (enemy.kind === 'lantern') return false;
  for (const stroke of state.strokes) {
    if (stroke.life <= 0 || stroke.integrity <= 0) continue;
    for (let i = 1; i < stroke.points.length; i++) {
      const nearest = nearestOnSegment(next, stroke.points[i - 1], stroke.points[i]);
      if (nearest.distance >= enemy.radius + INK.width / 2) continue;
      stroke.integrity -= dt * (enemy.kind === 'eater' ? 0.6 : enemy.kind === 'oni' ? 0.32 : 0.09) * ascensionModifiers(state).erosion / ((1 + artLevel(state, 'stone') * 0.25) * synergyBonus(state, 'carve'));
      stroke.erosion = { x: nearest.x, y: nearest.y, life: 1.25 };
      if (!stroke.soundCooldown) {
        stroke.flash = 0.25; stroke.soundCooldown = 0.6;
        state.soundEvents.push({ name: 'wallHit' });
        if (artLevel(state, 'vermilion')) castArt(state, 'vermilion', nearest, { angle: Math.atan2(stroke.points[i].y - stroke.points[i - 1].y, stroke.points[i].x - stroke.points[i - 1].x) });
        if (artLevel(state, 'stone')) castArt(state, 'stone', nearest, { radius: 32, interval: 1 });
      }
      enemy.blocked += dt;
      if (artLevel(state, 'vermilion')) {
        enemy.hitTime = 0.15;
        enemy.hitFlash = 0.06;
        enemy.stun = Math.max(enemy.stun, 0.06);
        stroke.integrity += dt * 0.035;
        enemy.edgeDamage = (enemy.edgeDamage || 0) + dt * artLevel(state, 'vermilion');
        if (enemy.edgeDamage >= 1.6 && enemy.kind !== 'oni') {
          enemy.dead = true; state.sealed++; state.cleared++;
          dissolveSpirit(state, enemy);
          const base = enemy.value * state.combo * (1 + artLevel(state, 'gold') * 0.3) * synergyBonus(state, 'bloom') * relicScoreBonus(state);
          const score = Math.round(base * wrathMultiplier(state));
          state.score += score; state.wrathScore += score - Math.round(base);
          if (enemy.hunter) state.huntersSealed++;
          burst(state, enemy.x, enemy.y, 22, '#bb4436');
          floatText(state, enemy.x, enemy.y - 30, 'VERMILION CUT', '#bb4436', 18);
          state.soundEvents.push({ name: 'seal' });
        }
      }
      // Slide tangentially along the ink instead of getting stuck forever.
      const a = stroke.points[i - 1], b = stroke.points[i];
      const length = distance(a, b) || 1;
      let tx = (b.x - a.x) / length, ty = (b.y - a.y) / length;
      const target = enemy.hunter ? state.monk : state.bell;
      if (tx * (target.x - enemy.x) + ty * (target.y - enemy.y) < 0) { tx *= -1; ty *= -1; }
      const slide = { x: enemy.x + tx * enemy.speed * dt * 0.45, y: enemy.y + ty * enemy.speed * dt * 0.45 };
      if (nearestOnSegment(slide, a, b).distance >= enemy.radius + INK.width / 2 - 2) {
        enemy.x = slide.x; enemy.y = slide.y;
      }
      return true;
    }
  }
  enemy.blocked = 0;
  return false;
}
