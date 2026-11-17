import { WIDTH, HEIGHT, STEP } from './config.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { readBest, saveBest } from './save.js';
import { createState, startRun } from './world/state.js';
import { updateWorld, nextScroll } from './world/update.js';
import { chooseArt } from './arts/brushArts.js';
import { endStroke } from './ink/strokes.js';
import { createPaper } from './render/paper.js';
import { renderScene } from './render/scene.js';
import { START_BUTTON, DIFFICULTY_RECTS } from './screens/title.js';
import { draftRects } from './screens/draft.js';
import { RESTART_BUTTON, TITLE_BUTTON } from './screens/results.js';
import { RESUME_BUTTON } from './screens/pause.js';
import { hitRect } from './render/primitives.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha: false });
const status = document.getElementById('status');
const audio = createAudio();
const input = createInput(canvas, audio.unlock);
const paper = createPaper();
const query = new URLSearchParams(location.search);
const seed = Number(query.get('seed')) || 1;
const shot = query.get('shot');
let state = createState(seed, readBest());
let drawInput = input;
let lastTime = performance.now(), accumulator = 0, previousMode = '';

function fitCanvas() {
  const scale = Math.min(window.innerWidth / WIDTH, window.innerHeight / HEIGHT);
  canvas.style.width = `${WIDTH * scale}px`; canvas.style.height = `${HEIGHT * scale}px`;
}
window.addEventListener('resize', fitCanvas); fitCanvas();

function resetRun(start = true) {
  state = createState(seed, readBest(), state.difficulty);
  input.release(); input.clearFrame();
  if (start) startRun(state);
}
function pauseRun() {
  if (state.mode !== 'play') return;
  endStroke(state); input.release(); state.mode = 'pause';
}
function handleMenus() {
  if (input.pressed.has('KeyM')) audio.toggle();
  const clicked = rect => input.clicks.some(p => hitRect(p, rect));
  if (state.mode === 'title') {
    for (let i = 0; i < DIFFICULTY_RECTS.length; i++) if (clicked(DIFFICULTY_RECTS[i]) || input.pressed.has(`Digit${i + 1}`)) { state.difficulty = DIFFICULTY_RECTS[i].id; audio.play('click'); }
    if (input.pressed.has('Enter') || clicked(START_BUTTON)) { resetRun(); input.clearFrame(); }
  } else if (state.mode === 'play') {
    if (input.pressed.has('KeyP') || input.pressed.has('Escape')) pauseRun();
  } else if (state.mode === 'pause') {
    if (input.pressed.has('KeyP') || input.pressed.has('Escape') || clicked(RESUME_BUTTON)) { input.release(); state.mode = 'play'; input.clearFrame(); }
  } else if (state.mode === 'draft') {
    for (let i = 0; i < state.draft.length; i++) {
      if (input.pressed.has(`Digit${i + 1}`) || clicked(draftRects(state)[i])) {
        if (chooseArt(state, i)) { nextScroll(state); input.release(); input.clearFrame(); }
        break;
      }
    }
  } else if (state.mode === 'win' || state.mode === 'lose') {
    if (input.pressed.has('KeyR') || clicked(RESTART_BUTTON)) resetRun();
    else if (input.pressed.has('Escape') || clicked(TITLE_BUTTON)) resetRun(false);
  }
}
document.addEventListener('visibilitychange', () => { if (document.hidden && !shot) pauseRun(); });
window.addEventListener('blur', () => { if (!shot) pauseRun(); });

function frame(now) {
  const elapsed = Math.min((now - lastTime) / 1000, 0.1); lastTime = now;
  if (!shot) {
    handleMenus();
    if (state.mode === 'play') {
      accumulator += elapsed;
      while (accumulator >= STEP) { updateWorld(state, input, STEP); input.clearFrame(); accumulator -= STEP; }
    } else { state.time += elapsed; accumulator = 0; input.clearFrame(); }
    for (const event of state.soundEvents.splice(0)) audio.play(event.name, event.value);
  }
  if (previousMode !== state.mode) {
    status.textContent = state.mode === 'title' ? 'INKWARD. Click Open the first scroll or press Enter.' : state.mode === 'play' ? `Scroll ${state.scroll}. Guard the bell. Draw closed loops around spirits.` : state.mode === 'draft' ? 'Scroll complete. Choose a brush art with 1, 2 or 3.' : state.mode === 'pause' ? 'Paused. P to resume.' : `${state.mode === 'win' ? 'Victory' : 'Defeat'}. Score ${state.score}. R to restart.`;
    if (!shot && (state.mode === 'win' || state.mode === 'lose')) state.best = saveBest(state.score);
    previousMode = state.mode;
  }
  renderScene(ctx, paper, state, drawInput, audio);
  requestAnimationFrame(frame);
}
if (shot) {
  const replay = stageShot(shot, seed); state = replay.state; drawInput = replay.input;
  document.documentElement.dataset.shotReady = 'true';
}
// Read-only live state helps browser verification inspect actual input and simulation outcomes.
window.inkward = { get state() { return state; }, get input() { return input; }, get audio() { return audio; } };
requestAnimationFrame(frame);
