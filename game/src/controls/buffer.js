// Fixed-step buffers survive hit-stop and expire even while the action is cooling.
export const INPUT_GRACE = 0.12;
const ACTIONS = { Space: 'dash', KeyQ: 'lotus', KeyE: 'ward' };

export function controlFeedback(state, action, text) {
  state.controlFeedback = { action, text, life: 0.85 };
}
export function bufferActions(state, input, dt) {
  for (const [action, request] of Object.entries(state.actionBuffer)) {
    request.life -= dt;
    if (request.life < -1e-6) delete state.actionBuffer[action];
  }
  if (state.controlFeedback) state.controlFeedback.life -= dt;
  const request = (action, point) => {
    state.actionBuffer[action] = { life: INPUT_GRACE, point: { ...point } };
    const cooldown = action === 'dash' ? state.monk.dashCooldown : state[{ splash: 'splashCooldown', lotus: 'qCooldown', ward: 'eCooldown' }[action]];
    if (cooldown > 0) controlFeedback(state, action, cooldown <= INPUT_GRACE + dt ? 'BUFFERED' : `${action.toUpperCase()} · ${cooldown.toFixed(1)}s`);
  };
  for (const [key, action] of Object.entries(ACTIONS)) if (input.pressed.has(key)) request(action, input.pointer);
  for (const point of input.splashes) request('splash', point);
}
export function takeAction(state, action, ready) {
  const request = state.actionBuffer[action];
  if (!request || !ready) return null;
  delete state.actionBuffer[action];
  if (state.controlFeedback?.action === action) state.controlFeedback = null;
  return request;
}
export function clearControls(state) {
  state.actionBuffer = {}; state.strokeStart = null; state.strokeGrace = 0; state.controlFeedback = null;
}
