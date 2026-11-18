import { WIDTH, HEIGHT, STEP } from './config.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { readBest, readProgress, recordRun, selectBellSkin } from './save.js';
import { newRunSeed } from './rng.js';
import { createState, startRun } from './world/state.js';
import { updateWorld, nextScroll } from './world/update.js';
import { chooseArt } from './arts/brushArts.js';
import { chooseRoad } from './world/path.js';
import { endStroke } from './ink/strokes.js';
import { clearControls } from './controls/buffer.js';
import { createPaper } from './render/paper.js';
import { renderScene } from './render/scene.js';
import { createPost } from './render/post/index.js';
import { START_BUTTON, DIFFICULTY_RECTS, SKIN_BUTTON, SEED_BUTTON, ASCENSION_BUTTON } from './screens/title.js';
import { draftRects } from './screens/draft.js';
import { ROAD_RECTS, pathChoiceRects } from './screens/path.js';
import { RESTART_BUTTON, SAME_SEED_BUTTON, TITLE_BUTTON } from './screens/results.js';
import { RESUME_BUTTON } from './screens/pause.js';
import { hitRect } from './render/primitives.js';
import { stageShot } from './shots.js';
import { advanceEnding, skipEnding, skipResults } from './scenes/ending.js';
import { advanceDefeat, skipDefeat } from './scenes/defeat.js';
import { DEFEAT_RETRY_BUTTON } from './screens/defeat.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha: false });
const post = createPost(canvas);
const status = document.getElementById('status');
const audio = createAudio();
const input = createInput(canvas, audio.unlock);
const paper = createPaper();
const query = new URLSearchParams(location.search);
const shot = query.get('shot');
const seed = query.has('seed') ? Number(query.get('seed')) : shot ? 1 : newRunSeed();
let staged = Boolean(shot);
let previewRun = Boolean(shot);
let state = createState(seed, readBest(), 'monk', readProgress());
let drawInput = input;
let lastTime = performance.now(), accumulator = 0, previousMode = '', previousSeed = null, previousEnding = false;

function fitCanvas() {
  const scale = Math.min(window.innerWidth / WIDTH, window.innerHeight / HEIGHT);
  canvas.style.width = `${WIDTH * scale}px`; canvas.style.height = `${HEIGHT * scale}px`;
  post.fit();
}
window.addEventListener('resize', fitCanvas); fitCanvas();

function resetRun(start = true, runSeed = state.seed, expedition = state.expedition) {
  state = createState(runSeed, readBest(), state.difficulty, readProgress(), expedition);
  staged = false; previewRun = false; drawInput = input; accumulator = 0;
  input.release(); input.clearFrame();
  if (start) startRun(state);
}
function pauseRun() {
  if (state.mode !== 'play') return;
  endStroke(state); input.release(); state.mode = 'pause';
  clearControls(state); audio.play('click');
}
function handleMenus() {
  if (input.pressed.has('KeyM')) { audio.toggle(); if (!audio.muted) audio.play('click'); }
  if (input.pressed.has('KeyG')) { post.toggle(); audio.play('click'); }
  const clicked = rect => input.clicks.some(p => hitRect(p, rect));
  if (state.mode === 'title') {
    for (let i = 0; i < DIFFICULTY_RECTS.length; i++) if (clicked(DIFFICULTY_RECTS[i]) || input.pressed.has(`Digit${i + 1}`)) {
      const id = DIFFICULTY_RECTS[i].id;
      if (id !== 'master' || state.unlocks.includes('master')) { state.difficulty = id; audio.play('click'); }
    }
    if (state.unlocks.includes('moonBell') && (clicked(SKIN_BUTTON) || input.pressed.has('KeyB'))) {
      const skin = state.bell.skin === 'moon' ? 'bronze' : 'moon';
      if (selectBellSkin(state.progress, skin)) { state.bell.skin = skin; audio.play('click'); }
    }
    if (input.pressed.has('KeyR') || clicked(SEED_BUTTON)) { resetRun(false, newRunSeed(state.seed)); audio.play('click'); }
    if (state.unlocks.includes('ascension') && (input.pressed.has('KeyA') || clicked(ASCENSION_BUTTON))) { state.expedition = state.expedition === 'ascension' ? 'pilgrimage' : 'ascension'; audio.play('click'); }
    if (input.pressed.has('Enter') || clicked(START_BUTTON)) { resetRun(); input.clearFrame(); }
  } else if (state.mode === 'play') {
    if (input.pressed.has('KeyP') || input.pressed.has('Escape')) pauseRun();
  } else if (state.mode === 'pause') {
    if (input.pressed.has('KeyP') || input.pressed.has('Escape') || clicked(RESUME_BUTTON)) { input.release(); state.mode = 'play'; audio.play('click'); input.clearFrame(); }
  } else if (state.mode === 'draft') {
    for (const road of ROAD_RECTS) {
      if (clicked(road) || pathChoiceRects(state).some(rect => rect.id === road.id && clicked(rect)) || input.pressed.has(road.id === 'swarm' ? 'ArrowLeft' : road.id === 'shrine' ? 'ArrowDown' : 'ArrowRight')) chooseRoad(state, road.id);
    }
    for (let i = 0; i < state.draft.length; i++) {
      if (input.pressed.has(`Digit${i + 1}`) || clicked(draftRects(state)[i])) {
        if (chooseArt(state, i)) { nextScroll(state); staged = false; drawInput = input; input.release(); input.clearFrame(); }
        break;
      }
    }
  } else if (state.mode === 'win' || state.mode === 'lose') {
    if (state.mode === 'win' && state.ending && state.ending.age < state.ending.duration) {
      if (input.pressed.size || input.clicks.length || input.splashes.length) { skipEnding(state); staged = false; drawInput = input; input.release(); input.clearFrame(); }
      return;
    }
    if (state.unlocks.includes('ascension') && input.pressed.has('KeyA')) resetRun(true, newRunSeed(state.seed), 'ascension');
    else if (input.pressed.has('KeyR') || clicked(RESTART_BUTTON) || state.mode === 'lose' && state.defeat?.age < state.defeat?.duration && clicked(DEFEAT_RETRY_BUTTON)) resetRun(true, newRunSeed(state.seed));
    else if (input.pressed.has('KeyS') || clicked(SAME_SEED_BUTTON)) resetRun();
    else if (input.pressed.has('Escape') || clicked(TITLE_BUTTON)) resetRun(false);
    else if (input.pressed.size || input.clicks.length || input.splashes.length) { skipDefeat(state); skipResults(state); }
  }
}
document.addEventListener('visibilitychange', () => { if (document.hidden && !staged) pauseRun(); });
window.addEventListener('blur', () => { if (!staged) pauseRun(); });

function frame(now) {
  const sceneElapsed = Math.max(0, (now - lastTime) / 1000), elapsed = Math.min(sceneElapsed, 0.1); lastTime = now;
  handleMenus();
  if (!staged) {
    if (state.mode === 'play') {
      accumulator += elapsed;
      while (accumulator >= STEP) { updateWorld(state, input, STEP); input.clearFrame(); accumulator -= STEP; }
    } else if (state.mode === 'seal') {
      updateWorld(state, input, previousMode === 'seal' ? sceneElapsed : 0); accumulator = 0; input.clearFrame();
    } else {
      state.time += elapsed;
      const sceneDt = previousMode === state.mode ? sceneElapsed : 0;
      advanceDefeat(state, sceneDt); advanceEnding(state, sceneDt); accumulator = 0; input.clearFrame();
    }
    for (const event of state.soundEvents.splice(0)) audio.play(event.name, event.value);
  } else input.clearFrame();
  const showingEnding = state.mode === 'win' && state.ending?.age < state.ending?.duration;
  if (previousMode !== state.mode || previousSeed !== state.seed || previousEnding !== showingEnding) {
    status.textContent = state.mode === 'title' ? `INKWARD. Seed ${state.seed}. Click Open the first scroll or press Enter. R changes the seed.` : state.mode === 'play' ? `Scroll ${state.scroll}. Guard the bell. Draw closed loops around spirits.` : state.mode === 'draft' ? 'Scroll complete. Left chooses Swarm road; Right chooses Quiet road. Then choose a brush art with 1–4.' : state.mode === 'pause' ? 'Paused. P to resume.' : state.mode === 'seal' ? 'The final seal. All eight scrolls are released.' : state.mode === 'win' && state.ending?.age < state.ending?.duration ? `Victory. The bell rings at dawn. Any key or tap skips to your final record. Score ${state.score}.` : `${state.mode === 'win' ? 'Victory' : 'Defeat'}. Score ${state.score}. Seed ${state.seed}. R for a new seed. S for the same seed. Escape for the menu.`;
    if (!previewRun && (state.mode === 'win' || state.mode === 'lose')) recordRun(state);
    previousMode = state.mode; previousSeed = state.seed; previousEnding = showingEnding;
  }
  renderScene(ctx, paper, state, drawInput, audio);
  if (!staged) audio.update(state);
  canvas.style.cursor = state.mode === 'play' ? 'none' : 'pointer';
  const touchDash = document.getElementById('touch-dash');
  touchDash.hidden = !input.touch || state.mode !== 'play';
  touchDash.textContent = state.monk.dashCooldown > 0 ? `DASH ${state.monk.dashCooldown.toFixed(1)}s` : 'DASH';
  post.present(state);
  if (!staged && state.impactFrames > 0) state.impactFrames--;
  if (staged) document.documentElement.dataset.shotReady = 'true';
  requestAnimationFrame(frame);
}
if (shot) {
  const replay = stageShot(shot, seed); state = replay.state; drawInput = replay.input;
}
// Read-only live state helps browser verification inspect actual input and simulation outcomes.
window.inkward = { get state() { return state; }, get input() { return input; }, get audio() { return audio; }, get post() { return post; } };
requestAnimationFrame(frame);
