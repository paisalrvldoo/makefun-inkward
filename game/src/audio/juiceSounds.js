export function playJuiceSound(name, value, tone, rustle, pluck) {
  if (name === 'pickup') {
    const pitch = 660 * 2 ** (Math.min(18, value) / 16);
    tone(pitch, 0.13, 0.036, 'sine'); tone(pitch * 1.5, 0.09, 0.014, 'triangle', 0.035);
  } else if (name === 'sealTick') {
    tone(330 * 2 ** (value / 7), 0.12, 0.04 + value * 0.003, 'triangle');
  } else if (name === 'sealSlam') {
    tone(55, 0.25, 0.13, 'triangle'); tone(990, 0.32, 0.055); rustle(0.1, 0.065, 1500);
  } else if (name === 'landing') {
    rustle(0.09, 0.035, 850); tone(95, 0.1, 0.035, 'triangle');
  } else if (name === 'step') rustle(0.035, 0.012, 650);
  else if (name === 'emptySeal') { tone(196, 0.17, 0.035, 'triangle'); tone(147, 0.18, 0.03, 'triangle', 0.06); }
  else if (name === 'unready') tone(185, 0.07, 0.025, 'triangle');
  else if (name === 'wallSet') { rustle(0.06, 0.025, 1800); tone(392, 0.12, 0.025, 'triangle'); }
  else return false;
  return true;
}
