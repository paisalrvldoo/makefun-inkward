// One place to tune the cinematic pass. Bloom runs at quarter resolution.
export const POST = Object.freeze({
  bloomScale: 0.25,
  bloom: 0.18,
  blurRadius: 1.6,
  vignette: 0.46,
  grain: 0.010,
  inkBleed: 0.10,
  grade: 0.82,
  seasons: [
    [0.94, 0.86, 0.92], // Spring: dusk plum, rose accents stay warm.
    [0.82, 0.92, 0.86], // Summer: jade shade under deep indigo.
    [0.98, 0.82, 0.70], // Autumn: ember glow over charcoal dusk.
    [0.74, 0.84, 1.00], // Winter: cold moonlight on inkstone.
  ],
});
