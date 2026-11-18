// One place to tune the cinematic pass. Bloom runs at quarter resolution.
export const POST = Object.freeze({
  bloomScale: 0.25,
  bloom: 0.28,
  blurRadius: 1.9,
  vignette: 0.20,
  grain: 0.008,
  inkBleed: 0.085,
  grade: 0.72,
  seasons: [
    [1.045, 0.995, 0.970], // Spring: deeper rose paper.
    [0.975, 1.025, 0.995], // Summer: jade shade.
    [1.080, 1.010, 0.918], // Autumn: amber light.
    [0.938, 0.990, 1.072], // Winter: blue moonlight.
  ],
});
