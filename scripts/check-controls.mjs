import assert from 'node:assert/strict';
import { createState, startRun } from '../game/src/world/state.js';
import { updateWorld } from '../game/src/world/update.js';
import { replayInput } from '../game/src/shots.js';
import { createTouch } from '../game/src/controls/touch.js';
import { updateStrokes } from '../game/src/ink/strokes.js';

function world() { const s = createState(1); startRun(s); s.spawnTime = 100; return s; }
for (const [action, key, field] of [['dash', 'Space', 'dashCooldown'], ['lotus', 'KeyQ', 'qCooldown'], ['ward', 'KeyE', 'eCooldown'], ['splash', null, 'splashCooldown']]) {
  for (const early of [0.12, 0.121, 0.25]) {
    const state = world(), input = replayInput(), owner = action === 'dash' ? state.monk : state;
    owner[field] = early;
    if (key) input.pressed.add(key); else input.splashes.push({ x: 250, y: 300 });
    updateWorld(state, input, 0); input.clearFrame();
    for (let i = 0; i < 30; i++) updateWorld(state, input, 0.01);
    assert.equal(owner[field] > 0, early <= 0.12, `${action}: a ${early}s early press fires only inside grace`);
    assert.equal(Object.keys(state.actionBuffer).length, 0, 'Buffered requests are consumed or expire');
  }
}
{
  const state = world(), input = replayInput(); state.hitStop = 0.06; input.pressed.add('KeyQ');
  updateWorld(state, input, 0.02); input.clearFrame();
  for (let i = 0; i < 4; i++) updateWorld(state, input, 0.02);
  assert.ok(state.qCooldown > 0, 'Ritual presses survive brief hit-stop');
}
for (const delay of [0.1, 0.14]) {
  const state = world(), input = replayInput(); input.painting = true; input.pointer = { x: 20, y: 300 };
  input.paintEvents.push({ type: 'begin', point: input.pointer }); updateStrokes(state, input, 0); input.clearFrame();
  updateStrokes(state, input, delay); input.pointer = { x: 50, y: 300 };
  input.paintEvents.push({ type: 'move', point: input.pointer }); updateStrokes(state, input, 0);
  assert.equal(Boolean(state.activeStroke), delay <= 0.12, 'Field entry honors stroke-start grace');
}
{
  const input = replayInput(), touch = createTouch(input, e => ({ x: e.x, y: e.y }));
  const event = (id, x, y, time, type = 'pointerup') => ({ pointerId: id, x, y, timeStamp: time, type });
  assert.ok(touch.down(event(1, 200, 300, 0))); input.painting = true;
  assert.equal(touch.down(event(2, 240, 300, 20)), false);
  assert.equal(input.painting, false, 'Second finger ends painting');
  touch.up(event(1, 200, 300, 80)); touch.up(event(2, 240, 300, 100));
  assert.deepEqual(input.splashes, [{ x: 220, y: 300 }], 'Two-finger tap splashes once at the midpoint');
  input.clearFrame(); touch.down(event(1, 200, 300, 200)); touch.down(event(2, 240, 300, 220));
  touch.move(event(2, 320, 300, 250)); touch.up(event(1, 200, 300, 280)); touch.up(event(2, 320, 300, 300));
  assert.equal(input.splashes.length, 0, 'Two-finger drags do not splash');
}
console.log('Controls OK: all four 120ms buffers and expiry, hit-stop input, field-entry grace and touch tap/drag distinction');
