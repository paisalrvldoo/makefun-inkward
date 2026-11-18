import { updateMonk } from '../entities/monk.js';
import { updateYokai } from '../entities/yokai.js';
import { updateBosses } from '../entities/bosses.js';
import { endStroke, updateStrokes } from '../ink/strokes.js';
import { updateArts, draftArts } from '../arts/brushArts.js';
import { updateEffects } from '../render/fx.js';
import { makeThreatQueue, updateWaves } from './waves.js';
import { getScroll } from './scrolls.js';
import { updateWrath } from './wrath.js';
import { beginOmen, finishOmen } from './omens.js';
import { gradeRun } from './state.js';
import { recordRun } from '../save.js';
import { artLevel } from '../arts/levels.js';
import { walkRoad } from './path.js';
import { bufferActions, clearControls } from '../controls/buffer.js';
import { castArt } from '../fx/skillCasts.js';
import { updateClimax } from '../fx/climax.js';
import { beginEnding, updateEnding } from '../scenes/ending.js';

export function recordScroll(state) {
  state.scrollScores[state.scroll - 1] = Math.max(0, state.score - state.scrollStartScore);
}

export function finishRun(state, won) {
  if (state.ended) return;
  endStroke(state);
  clearControls(state);
  state.ended = true;
  finishOmen(state, won);
  state.mode = won ? 'win' : 'lose';
  if (won) state.score += state.bell.hp * 500 + 3000;
  recordScroll(state); state.grade = gradeRun(state);
  recordRun(state, { persist: false });
  if (won) beginEnding(state);
  else state.resultTime = 3;
  state.soundEvents.push({ name: won ? 'win' : 'lose' });
}
export function nextScroll(state) {
  if (!walkRoad(state)) return false;
  clearControls(state);
  state.scroll++;
  state.scrollStartScore = state.score;
  state.scrollTime = 0; state.cleared = 0;
  state.strokes = []; state.activeStroke = null; state.waitRelease = false;
  state.queue = makeThreatQueue(state); state.total = state.queue.length; state.spawnTime = 2;
  state.ink = state.maxInk; state.comboTime = 7;
  state.qCooldown = 0; state.eCooldown = 0; state.splashCooldown = 0;
  state.banner = `SCROLL ${state.scroll} · ${getScroll(state).name.toUpperCase()}`;
  state.bannerTime = 4; state.mode = 'play';
  state.bonusDraft = false; beginOmen(state);
  state.soundEvents.push({ name: 'scrollIntro' });
  return true;
}
export function updateWorld(state, input, dt) {
  if (state.mode === 'win') { updateEnding(state, dt); return; }
  if (state.mode !== 'play') return;
  const speed = updateClimax(state, dt);
  if (state.finalSealed) {
    if (!state.climax) { state.enemies = []; finishRun(state, true); }
    return;
  }
  dt *= speed;
  bufferActions(state, input, dt);
  if (state.hitStop > 0) {
    state.paintBuffer = [...new Set([...state.paintBuffer, ...input.paintEvents])].slice(-650);
    state.hitStop = Math.max(0, state.hitStop - dt); return;
  }
  state.time += dt; state.runTime += dt; state.scrollTime += dt;
  state.bannerTime = Math.max(0, state.bannerTime - dt);
  state.bell.hitTime = Math.max(0, state.bell.hitTime - dt);
  state.bell.wardTime = Math.max(0, state.bell.wardTime - dt);
  state.comboTime = Math.max(0, state.comboTime - dt);
  if (state.comboTime <= 0) state.combo = 1;
  updateEffects(state, dt);
  updateMonk(state, input, dt);
  updateStrokes(state, input, dt);
  if (state.finalSealed) return;
  updateArts(state, input, dt);
  updateWrath(state, dt);
  updateWaves(state, dt);
  updateBosses(state, dt);
  updateYokai(state, dt);
  if (state.bell.hp <= 0) { finishRun(state, false); return; }
  if (!state.queue.length && !state.enemies.length) {
    finishOmen(state, true);
    endStroke(state);
    state.bell.hp = Math.min(state.bell.maxHp, state.bell.hp + artLevel(state, 'afterglow'));
    if (artLevel(state, 'afterglow')) castArt(state, 'afterglow', state.bell, { radius: 90, force: true });
    if (state.scroll === 8) finishRun(state, true);
    else {
      state.score += 400 + state.bell.hp * 25;
      recordScroll(state);
      state.mode = 'draft'; state.roadChoice = null; draftArts(state);
      state.soundEvents.push({ name: 'draft' });
    }
  }
}
