// An original procedural score. A small motif gathers bass, drums, koto plucks and upper bells.
const MELODY = [0, 7, 3, 10, 7, 5, 3, 0, 2, 7, 5, 12, 10, 7, 3, 5];
const ROOTS = [130.81, 155.56, 116.54, 174.61];
const PENTATONIC = [0, 3, 5, 7, 10]; // B minor pentatonic offsets for the koto scale.

export function musicProfile(state) {
  const boss = state.enemies.find(enemy => enemy.boss === 'frost' && !enemy.dead);
  const phase = boss ? boss.hp > 7 ? 0 : boss.hp > 3 ? 1 : 2 : 0;
  const final = state.scroll === 8, cinematic = Boolean(state.climax);
  return { final, phase, bpm: cinematic ? 64 : final ? 124 + phase * 10 : 72 + state.scroll * 4,
    intensity: cinematic ? 0.25 : final ? 1 + phase * 0.25 : 0.24 + state.scroll * 0.055 };
}

export function createMusic(tone, rustle, pluck, taiko, clock) {
  let next = 0, beat = 0, scroll = 0, active = false, scheduled = 0, current = null;
  function update(state) {
    const now = clock();
    active = now !== null && state.mode === 'play';
    current = musicProfile(state);
    if (!active) { next = 0; return; }
    if (scroll !== state.scroll) { scroll = state.scroll; beat = 0; next = 0; }
    if (!next || next < now - 0.3) next = now + 0.035;
    for (let count = 0; next < now + 0.16 && count < 4; count++) {
      const delay = Math.max(0, next - now), root = ROOTS[Math.floor(beat / 16) % ROOTS.length];
      const note = root * 2 ** (MELODY[beat % MELODY.length] / 12);
      // Koto pluck every other note, a pentatonic ornament over the root.
      if (beat % 2 === 0) {
        const pentaIndex = Math.floor(beat / 2) % PENTATONIC.length;
        const kotoNote = root * 2 ** (PENTATONIC[pentaIndex] / 12) * (beat % 8 === 0 ? 1 : 0.5);
        pluck(kotoNote * 2, current.intensity * 1.1, delay + 0.01);
      }
      tone(note * 2, 0.54, 0.025 * current.intensity, 'sine', delay);
      if (beat % 4 === 0) {
        tone(root / 2, 0.8, 0.038 * current.intensity, 'triangle', delay);
        tone(root, 1.2, 0.015 * current.intensity, 'sine', delay);
      }
      // Taiko accents on every eighth beat (two-bar phrase markers) and on boss phases.
      if (beat % 8 === 0) {
        taiko(current.intensity * 0.5, delay);
      }
      if (current.final) {
        if (beat % 2 === 0) { tone(49, 0.17, 0.07 * current.intensity, 'triangle', delay); rustle(0.08, 0.016 * current.intensity, 850, delay); }
        else rustle(0.045, 0.012 * current.intensity, 3700, delay);
        if (current.phase > 0 && beat % 2) tone(note * 4, 0.31, 0.018 * current.intensity, 'triangle', delay + 0.08);
        // Concerted taiko on final boss phases.
        if (current.phase > 1 && beat % 4 === 2) taiko(current.intensity * 0.8, delay);
      }
      beat++; scheduled++; next += 30 / current.bpm;
    }
  }
  return { update, get active() { return active; }, get scheduled() { return scheduled; }, get profile() { return current; } };
}