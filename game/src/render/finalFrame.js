import { WIDTH, HEIGHT } from '../config.js';

let painted = false, sequence = null, frame = null;

// Hold the actual painted hit frame, without redrawing every released spirit's dissolve.
export function holdFinalFrame(ctx, state) {
  if (state.mode !== 'seal') { painted = true; return null; }
  if (sequence !== state.finalSeal) {
    sequence = state.finalSeal;
    if (painted) {
      if (!frame) { frame = document.createElement('canvas'); frame.width = WIDTH; frame.height = HEIGHT; }
      const frozen = frame.getContext('2d'); frozen.clearRect(0, 0, WIDTH, HEIGHT); frozen.drawImage(ctx.canvas, 0, 0);
    }
  }
  return painted ? frame : null;
}
