import { STEP } from '../config.js';
import { updateWorld } from '../world/update.js';
import { chooseRoad } from '../world/path.js';

// Play six complete scrolls, then preview the real winter relic node.
export function stagePathShot(state, input, pilot) {
  for (let frame = 0; frame < 900 / STEP; frame++) {
    if (state.mode === 'draft' && state.scroll === 6) {
      chooseRoad(state, 'shrine');
      state.soundEvents.length = 0;
      return { state, input };
    }
    pilot(state, input); updateWorld(state, input, STEP);
    if (state.ended) break;
  }
  throw new Error('Path replay did not reach its winter shrine');
}
