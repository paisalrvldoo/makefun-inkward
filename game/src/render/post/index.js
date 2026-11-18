import { POST } from './config.js';
import { VERTEX, EXTRACT, BLUR, COMPOSITE } from './shaders.js';
import { getScroll } from '../../world/scrolls.js';

// The original canvas stays visible and owns input. The display only covers it
// after a successful frame, so every failure immediately reveals the 2D path.
export function createPost(sourceCanvas) {
  const canvas = document.createElement('canvas');
  canvas.id = 'cinematic'; canvas.width = sourceCanvas.width; canvas.height = sourceCanvas.height;
  canvas.setAttribute('aria-hidden', 'true'); canvas.style.display = 'none';
  sourceCanvas.after(canvas);
  let gl, resources, available = false, enabled = true, frames = 0;
  const textures = [], buffers = [], programs = [], shaders = [];
  const reveal2D = () => {
    canvas.style.display = 'none';
    document.documentElement.dataset.renderer = '2d';
  };
  function dispose() {
    if (gl && !gl.isContextLost()) {
      for (const t of textures) gl.deleteTexture(t);
      for (const b of buffers) gl.deleteFramebuffer(b);
      for (const p of programs) gl.deleteProgram(p);
      for (const s of shaders) gl.deleteShader(s);
    }
    // Lost-context handles are invalid after restoration; never delete them
    // against the restored context, where that would poison initialization.
    textures.length = buffers.length = programs.length = shaders.length = 0;
    resources = null; available = false; reveal2D();
  }
  function program(fragment) {
    const p = gl.createProgram(); programs.push(p);
    for (const [type, code] of [[gl.VERTEX_SHADER, VERTEX], [gl.FRAGMENT_SHADER, fragment]]) {
      const s = gl.createShader(type); shaders.push(s);
      gl.shaderSource(s, code); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('Post shader unavailable');
      gl.attachShader(p, s);
    }
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('Post program unavailable');
    const uniforms = {};
    for (let i = 0; i < gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i++) {
      const name = gl.getActiveUniform(p, i).name;
      uniforms[name] = gl.getUniformLocation(p, name);
    }
    return { p, uniforms };
  }
  function texture(width, height) {
    const t = gl.createTexture(); textures.push(t); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    return t;
  }
  function target(width, height) {
    const t = texture(width, height), f = gl.createFramebuffer(); buffers.push(f);
    gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error('Post target unavailable');
    return { t, f };
  }
  function initialize() {
    try {
      gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'high-performance' });
      if (!gl) { reveal2D(); return; }
      gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND);
      const width = Math.max(1, Math.round(canvas.width * POST.bloomScale));
      const height = Math.max(1, Math.round(canvas.height * POST.bloomScale));
      resources = { extract: program(EXTRACT), blur: program(BLUR), composite: program(COMPOSITE),
        source: texture(canvas.width, canvas.height), a: target(width, height), b: target(width, height), width, height };
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      if (gl.getError() !== gl.NO_ERROR) throw new Error('Post initialization failed');
      available = true;
    } catch { dispose(); }
  }
  function use(pass, input, framebuffer, width, height) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer); gl.viewport(0, 0, width, height);
    gl.useProgram(pass.p); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, input);
    gl.uniform1i(pass.uniforms.source, 0);
  }
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); dispose(); });
  canvas.addEventListener('webglcontextrestored', initialize);
  initialize();
  return {
    get active() { return available && enabled; },
    get available() { return available; },
    get frames() { return frames; },
    toggle() { enabled = !enabled; if (!enabled) reveal2D(); },
    fit() { canvas.style.width = sourceCanvas.style.width; canvas.style.height = sourceCanvas.style.height; },
    present(state) {
      if (!available || !enabled) { reveal2D(); return; }
      try {
        if (gl.isContextLost()) { available = false; reveal2D(); return; }
        const r = resources;
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, r.source);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, sourceCanvas);
        use(r.extract, r.source, r.a.f, r.width, r.height);
        gl.uniform2f(r.extract.uniforms.texel, 1 / r.width, 1 / r.height);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        use(r.blur, r.a.t, r.b.f, r.width, r.height);
        gl.uniform2f(r.blur.uniforms.direction, POST.blurRadius / r.width, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        use(r.blur, r.b.t, r.a.f, r.width, r.height);
        gl.uniform2f(r.blur.uniforms.direction, 0, POST.blurRadius / r.height);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        use(r.composite, r.source, null, canvas.width, canvas.height);
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, r.a.t);
        gl.uniform1i(r.composite.uniforms.bloom, 1);
        gl.uniform2f(r.composite.uniforms.texel, 1 / canvas.width, 1 / canvas.height);
        gl.uniform3fv(r.composite.uniforms.tint, POST.seasons[getScroll(state).season]);
        gl.uniform4f(r.composite.uniforms.strengths, POST.bloom, POST.vignette, POST.grain, POST.inkBleed);
        gl.uniform1f(r.composite.uniforms.grade, POST.grade);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        // Check the first frame and periodically thereafter, without a readback per frame.
        if (frames % 120 === 0 && gl.getError() !== gl.NO_ERROR) throw new Error('Post rendering failed');
        frames++; canvas.style.display = 'block'; document.documentElement.dataset.renderer = 'webgl2';
      } catch { dispose(); }
    },
  };
}
