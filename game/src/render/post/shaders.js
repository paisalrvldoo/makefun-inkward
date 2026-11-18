export const VERTEX = `#version 300 es
precision highp float;
out vec2 uv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  uv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

export const EXTRACT = `#version 300 es
precision mediump float;
in vec2 uv;
out vec4 outColor;
uniform sampler2D source;
uniform vec2 texel;
vec3 bright(vec2 p) {
  vec3 c = texture(source, p).rgb;
  float hi = max(c.r, max(c.g, c.b));
  float lo = min(c.r, min(c.g, c.b));
  float saturated = smoothstep(0.12, 0.38, hi - lo);
  float vermilion = smoothstep(0.12, 0.35, c.r - c.g) * step(c.b, c.g + 0.08);
  float gold = smoothstep(0.1, 0.28, c.g - c.b) * smoothstep(0.55, 0.8, c.r);
  float mask = max(saturated * smoothstep(0.62, 0.92, hi), max(vermilion, gold) * 0.75);
  // Leave the broad pale paper alone; only its whitest highlights contribute.
  mask = max(mask, smoothstep(0.975, 1.0, lo) * 0.12);
  return c * mask;
}
void main() {
  vec2 d = texel * 0.5;
  outColor = vec4((bright(uv + d) + bright(uv - d) +
    bright(uv + vec2(d.x, -d.y)) + bright(uv + vec2(-d.x, d.y))) * 0.25, 1.0);
}`;

export const BLUR = `#version 300 es
precision mediump float;
in vec2 uv;
out vec4 outColor;
uniform sampler2D source;
uniform vec2 direction;
void main() {
  vec3 c = texture(source, uv).rgb * 0.227027;
  c += (texture(source, uv + direction * 1.384615).rgb +
        texture(source, uv - direction * 1.384615).rgb) * 0.316216;
  c += (texture(source, uv + direction * 3.230769).rgb +
        texture(source, uv - direction * 3.230769).rgb) * 0.070270;
  outColor = vec4(c, 1.0);
}`;

export const COMPOSITE = `#version 300 es
precision highp float;
in vec2 uv;
out vec4 outColor;
uniform sampler2D source;
uniform sampler2D bloom;
uniform vec2 texel;
uniform vec3 tint;
uniform vec4 strengths;
uniform float grade;
float luminance(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
float paperGrain(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z) - 0.5;
}
void main() {
  vec3 c = texture(source, uv).rgb;
  float l = luminance(c);
  vec2 d = texel * 1.25;
  float neighbours = min(min(luminance(texture(source, uv + vec2(d.x, 0.0)).rgb),
                             luminance(texture(source, uv - vec2(d.x, 0.0)).rgb)),
                         min(luminance(texture(source, uv + vec2(0.0, d.y)).rgb),
                             luminance(texture(source, uv - vec2(0.0, d.y)).rgb)));
  c *= 1.0 - clamp(l - neighbours, 0.0, 0.6) * strengths.w;
  c = mix(c, c * tint, grade);
  vec3 glow = texture(bloom, uv).rgb;
  c += glow * strengths.x * (1.0 - c * 0.65);
  vec2 p = (uv - 0.5) * vec2(1.12, 1.0);
  c *= 1.0 - smoothstep(0.14, 0.57, dot(p, p)) * strengths.y;
  c += paperGrain(gl_FragCoord.xy) * strengths.z;
  outColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}`;
