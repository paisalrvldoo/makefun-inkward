import { WIDTH, HEIGHT } from './config.js';

export function createInput(canvas, unlockAudio) {
  const input = {
    keys: new Set(), pressed: new Set(), pointer: { x: 494, y: 411 },
    paintEvents: [], clicks: [], splashes: [], painting: false,
    clearFrame() { this.pressed.clear(); this.paintEvents.length = 0; this.clicks.length = 0; this.splashes.length = 0; },
    release() { this.keys.clear(); this.painting = false; this.paintEvents.push({ type: 'end', point: { ...this.pointer } }); },
  };
  const point = event => {
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * WIDTH / rect.width, y: (event.clientY - rect.top) * HEIGHT / rect.height };
  };
  const updatePointer = event => { input.pointer = point(event); };
  window.addEventListener('keydown', event => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) event.preventDefault();
    if (!input.keys.has(event.code)) input.pressed.add(event.code);
    input.keys.add(event.code);
    unlockAudio();
  });
  window.addEventListener('keyup', event => input.keys.delete(event.code));
  canvas.addEventListener('pointerdown', event => {
    updatePointer(event);
    unlockAudio();
    canvas.focus();
    canvas.setPointerCapture(event.pointerId);
    if (event.button === 0) {
      input.painting = true;
      input.paintEvents.push({ type: 'begin', point: { ...input.pointer } });
      input.clicks.push({ ...input.pointer });
    }
    if (event.button === 2) input.splashes.push({ ...input.pointer });
  });
  canvas.addEventListener('pointermove', event => {
    const events = event.getCoalescedEvents?.() || [event];
    for (const sample of events) {
      updatePointer(sample);
      if (input.painting) input.paintEvents.push({ type: 'move', point: { ...input.pointer } });
    }
  });
  const end = event => {
    if (event.button !== 0 && event.type !== 'pointercancel') return;
    updatePointer(event);
    input.paintEvents.push({ type: 'end', point: { ...input.pointer } });
    input.painting = false;
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('contextmenu', event => event.preventDefault());
  window.addEventListener('blur', () => input.release());
  return input;
}
