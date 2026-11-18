export function playFinaleSound(name, value, tone, rustle) {
  if (name === 'finalPhase') {
    rustle(0.7, 0.12, 650); tone(49, 1.3, 0.14, 'triangle');
    [147, 220, 311 + value * 12].forEach((frequency, i) => tone(frequency, 1.2, 0.06, 'sine', 0.12 + i * 0.12));
  } else if (name === 'finalBreath') {
    tone(55, 0.22, 0.09, 'sine'); rustle(0.18, 0.04, 450);
  } else if (name === 'finalSlash') {
    rustle(0.22, 0.25, 4700); rustle(0.9, 0.13, 620);
    tone(41, 1.2, 0.22, 'triangle'); tone(82, 0.6, 0.11, 'sine');
    [392, 587, 784, 1175, 1568].forEach((frequency, i) => tone(frequency, 1.8, 0.055, 'sine', 0.08 + i * 0.028));
  } else if (name === 'frostDivide') {
    rustle(0.42, 0.12, 3200); [98, 196, 784].forEach(frequency => tone(frequency, 0.5, 0.065, 'triangle'));
  } else return false;
  return true;
}
