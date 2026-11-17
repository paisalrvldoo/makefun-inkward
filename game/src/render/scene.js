import { WIDTH, HEIGHT, FIELD } from '../config.js';
import { drawGarden } from './paper.js';
import { drawBell, drawMonk, drawYokai } from './sprites.js';
import { drawStrokes, drawCursor } from './ink.js';
import { drawEffects } from './fx.js';
import { drawHud, drawWaveBanner } from './hud.js';
import { drawTitle } from '../screens/title.js';
import { drawDraft } from '../screens/draft.js';
import { drawResults } from '../screens/results.js';
import { drawPause } from '../screens/pause.js';
import { spawnPoint } from '../world/waves.js';
import { circle, text } from './primitives.js';
import { drawBossBanner, drawBossTelegraphs } from './bosses.js';

export function renderScene(ctx, paper, state, input, audio) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.setLineDash([]);
  ctx.clearRect(0, 0, WIDTH, HEIGHT); ctx.drawImage(paper, 0, 0);
  if (state.mode === 'title') { drawTitle(ctx, state, input, audio); return; }
  drawGarden(ctx, state);
  ctx.save(); ctx.beginPath(); ctx.rect(FIELD.x, FIELD.y, FIELD.w, FIELD.h); ctx.clip();
  if (state.shake > 0 && state.mode === 'play') ctx.translate(Math.sin(state.time * 79) * state.shake, Math.cos(state.time * 63) * state.shake * 0.6);
  const next = state.queue[0];
  if (next) {
    const p = spawnPoint(next);
    circle(ctx, p.x, p.y, 24 + Math.sin(state.time * 5) * 3, null, '#bb443650', 1.5);
    text(ctx, 'INCOMING', p.x, p.y + 37, 9, '#bb4436', 'bold', false, 'center');
  }
  drawBossTelegraphs(ctx, state);
  drawStrokes(ctx, state);
  drawBell(ctx, state.bell, state.time);
  for (const ghost of state.ghosts) {
    ctx.globalAlpha = ghost.life * 1.5;
    drawMonk(ctx, { ...state.monk, x: ghost.x, y: ghost.y, hurtTime: 0 }, state.time);
  }
  ctx.globalAlpha = 1;
  for (const enemy of [...state.enemies].sort((a, b) => a.y - b.y)) if (!enemy.dead) drawYokai(ctx, enemy, state.time);
  drawMonk(ctx, state.monk, state.time);
  drawEffects(ctx, state);
  if (state.mode === 'play') drawCursor(ctx, input, state);
  if (state.flash > 0) { ctx.fillStyle = `rgba(187,68,54,${state.flash * 0.4})`; ctx.fillRect(FIELD.x, FIELD.y, FIELD.w, FIELD.h); }
  ctx.restore();
  drawHud(ctx, state, audio);
  drawWaveBanner(ctx, state);
  drawBossBanner(ctx, state);
  if (state.mode === 'draft') drawDraft(ctx, state, input);
  if (state.mode === 'win' || state.mode === 'lose') drawResults(ctx, state, input);
  if (state.mode === 'pause') drawPause(ctx, input);
}
