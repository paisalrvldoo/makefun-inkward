import { COLORS } from '../config.js';
import { text, panel, button, hitRect } from '../render/primitives.js';

export const RESUME_BUTTON = { x: 462, y: 485, w: 356, h: 66 };
export function drawPause(ctx, input) {
  ctx.fillStyle = '#f6f0dfdf'; ctx.fillRect(0, 0, 1280, 800);
  panel(ctx, 324, 176, 632, 450, '#fff8e9', '#bda875');
  text(ctx, 'LET THE INK SETTLE', 640, 266, 40, COLORS.ink, 'bold', true, 'center');
  text(ctx, 'The garden waits for you.', 640, 313, 21, COLORS.faint, 'normal', true, 'center');
  text(ctx, 'LMB  Paint a wall. Close a loop to seal.', 640, 366, 17, COLORS.ink, 'normal', false, 'center');
  text(ctx, 'RMB  Splash + stun.   SPACE  Dash through spirits.', 640, 399, 17, COLORS.ink, 'normal', false, 'center');
  text(ctx, 'Q  Freeze the garden.   E  Push spirits from the bell.', 640, 432, 17, COLORS.ink, 'normal', false, 'center');
  button(ctx, 'RETURN TO THE GARDEN', RESUME_BUTTON, hitRect(input.pointer, RESUME_BUTTON), 'P OR ESC TO RESUME');
  text(ctx, 'M  TOGGLE SOUND', 640, 593, 11, COLORS.faint, 'bold', false, 'center');
}
