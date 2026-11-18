// One place to tune the cinematic pass. Bloom runs at quarter resolution.
export const POST = Object.freeze({
  bloomScale: 0.25,
  bloom: 0.24,
  blurRadius: 1.7,
  vignette: 0.16,
  grain: 0.006,
  inkBleed: 0.075,
  grade: 0.65,
  seasons: [
    [1.025, 1.005, 0.985], // Spring: rose paper.
    [0.985, 1.015, 1.005], // Summer: jade shade.
    [1.065, 1.015, 0.935], // Autumn: amber light.
    [0.945, 0.995, 1.065], // Winter: blue moonlight.
  ],
});
