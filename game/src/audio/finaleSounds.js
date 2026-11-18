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
  } else if (name === 'endingBell') {
    [261.63, 523.25, 784.88, 1046.5, 1569.75].forEach((frequency, i) => tone(frequency, 3.8 - i * 0.3, 0.1 / (1 + i * 0.6), 'sine'));
  } else if (name === 'dawn') {
    [392, 523.25, 659.25].forEach((frequency, i) => tone(frequency, 2, 0.045, 'sine', i * 0.18));
  } else if (name === 'unroll') {
    rustle(0.25, 0.045, 1500); tone(392 * 2 ** (value / 12), 0.55, 0.055, 'triangle');
  } else if (name === 'resultsReveal') {
    rustle(0.55, 0.07, 1300); tone(130.81, 0.7, 0.09, 'triangle');
  } else if (name === 'scoreTick') {
    tone(392 * 2 ** (value / 12), 0.13, 0.025, 'triangle');
  } else if (name === 'scoreSlam') {
    tone(65.41, 0.45, 0.12, 'triangle'); [523.25, 659.25, 783.99].forEach(frequency => tone(frequency, 0.85, 0.045, 'sine')); rustle(0.14, 0.07, 850);
  } else return false;
  return true;
}
