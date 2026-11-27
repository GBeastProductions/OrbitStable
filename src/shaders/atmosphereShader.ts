// WebGL2 (#version 300 es) Theme Atmosphere Shader Layer for ORBIT.
// Renders shimmering Christmas Aurora ribbons, Krampusnacht Ember Haze, Neon Sakura Moon Mist,
// or Disco Prismatic Swells synced to live WASM audio DSP bands.

export const ATMOSPHERE_VERT_SRC = `#version 300 es
precision highp float;
in vec2 a_pos;
out vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

export const ATMOSPHERE_FRAG_SRC = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform vec2  u_res;
uniform float u_time;
uniform float u_mode;      // 0=classic, 1=neon_sakura, 2=cozy_christmas, 3=krampusnacht
uniform float u_opacity;   // master intensity 0..1
uniform float u_bass;      // WASM bass 0..1
uniform float u_mid;       // WASM mid 0..1
uniform vec3  u_primary;
uniform vec3  u_secondary;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

void main() {
  if (u_opacity <= 0.01) {
    outColor = vec4(0.0);
    return;
  }

  float t = u_time * 0.45;
  vec3 col = vec3(0.0);
  float alpha = 0.0;

  if (u_mode > 1.5 && u_mode < 2.5) {
    // Mode 2: Cozy Christmas 2026 — Northern Lights Aurora Ribbons in upper sky
    float skyMask = smoothstep(0.28, 0.92, v_uv.y);
    float wave1 = sin(v_uv.x * 4.5 + t * 0.9 + noise(vec2(v_uv.x * 2.2, t * 0.5)) * 3.1);
    float ribbon1 = exp(-abs(v_uv.y - (0.76 + wave1 * 0.09)) * 9.5);
    float wave2 = cos(v_uv.x * 3.3 - t * 0.7 + noise(vec2(v_uv.x * 3.1, t * 0.4)) * 2.5);
    float ribbon2 = exp(-abs(v_uv.y - (0.83 + wave2 * 0.07)) * 12.0);
    vec3 emerald = vec3(0.20, 0.88, 0.62);
    vec3 goldWarm = vec3(0.99, 0.82, 0.35);
    col = emerald * ribbon1 + mix(u_secondary, goldWarm, 0.5) * ribbon2;
    alpha = (ribbon1 * 0.24 + ribbon2 * 0.18) * skyMask * (1.0 + u_mid * 0.55);
  } else if (u_mode > 2.5) {
    // Mode 3: Krampusnacht 2026 — Forged Hellfire & Crimson Mist Curtain
    float groundMask = smoothstep(0.75, 0.0, v_uv.y);
    float n = noise(vec2(v_uv.x * 4.2, v_uv.y * 2.5 - t * 1.4));
    float n2 = noise(vec2(v_uv.x * 8.0 + n, v_uv.y * 4.0 - t * 2.0));
    float heat = pow(clamp(n * 0.65 + n2 * 0.5, 0.0, 1.0), 1.8) * groundMask;
    col = mix(vec3(0.75, 0.06, 0.08), vec3(0.98, 0.56, 0.14), n2);
    alpha = heat * 0.32 * (1.0 + u_bass * 0.85);
  } else if (u_mode > 0.5) {
    // Mode 1: Neon Sakura — Moonlit Horizon Silk Haze
    float n = noise(vec2(v_uv.x * 2.8 - t * 0.35, v_uv.y * 2.2));
    float band = exp(-abs(v_uv.y - 0.34 - n * 0.08) * 6.5);
    col = mix(u_primary, vec3(0.98, 0.78, 0.88), n);
    alpha = band * 0.22 * (1.0 + u_mid * 0.5);
  } else {
    // Mode 0: Classic Disco Cabinet Pulse
    vec2 p = v_uv - vec2(0.28, 0.52);
    p.x *= u_res.x / max(1.0, u_res.y);
    float d = length(p);
    float ring = exp(-abs(d - 0.42 - sin(t) * 0.03) * 14.0);
    col = mix(u_primary, u_secondary, 0.4);
    alpha = ring * 0.14 * (1.0 + u_bass * 0.8);
  }

  alpha = clamp(alpha * u_opacity, 0.0, 0.55);
  outColor = vec4(col * alpha, alpha);
}
`;

export class AtmosphereGlRenderer {
  private gl: WebGL2RenderingContext | null = null;
  private prog: WebGLProgram | null = null;
  private vao: WebGLVertexArrayObject | null = null;
  private vbo: WebGLBuffer | null = null;
  private locs: Record<string, WebGLUniformLocation | null> = {};

  init(canvas: HTMLCanvasElement): boolean {
    if (this.gl && this.prog) return true;
    const gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'low-power',
    });
    if (!gl) return false;

    const compile = (type: number, src: string): WebGLShader | null => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        gl.deleteShader(sh);
        return null;
      }
      return sh;
    };

    const vs = compile(gl.VERTEX_SHADER, ATMOSPHERE_VERT_SRC);
    const fs = compile(gl.FRAGMENT_SHADER, ATMOSPHERE_FRAG_SRC);
    if (!vs || !fs) return false;

    const prog = gl.createProgram();
    if (!prog) return false;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      gl.deleteProgram(prog);
      return false;
    }

    const vao = gl.createVertexArray();
    const vbo = gl.createBuffer();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const posLoc = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    for (const k of ['u_res', 'u_time', 'u_mode', 'u_opacity', 'u_bass', 'u_mid', 'u_primary', 'u_secondary']) {
      this.locs[k] = gl.getUniformLocation(prog, k);
    }
    this.gl = gl;
    this.prog = prog;
    this.vao = vao;
    this.vbo = vbo;
    return true;
  }

  render(
    width: number,
    height: number,
    timeSec: number,
    mode: number,
    opacity: number,
    bass: number,
    mid: number,
    primary: [number, number, number],
    secondary: [number, number, number],
  ): void {
    const gl = this.gl;
    const prog = this.prog;
    if (!gl || !prog || !this.vao) return;
    gl.viewport(0, 0, width, height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(prog);
    gl.bindVertexArray(this.vao);
    gl.uniform2f(this.locs.u_res, width, height);
    gl.uniform1f(this.locs.u_time, timeSec);
    gl.uniform1f(this.locs.u_mode, mode);
    gl.uniform1f(this.locs.u_opacity, opacity);
    gl.uniform1f(this.locs.u_bass, bass);
    gl.uniform1f(this.locs.u_mid, mid);
    gl.uniform3f(this.locs.u_primary, primary[0], primary[1], primary[2]);
    gl.uniform3f(this.locs.u_secondary, secondary[0], secondary[1], secondary[2]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindVertexArray(null);
  }

  dispose(): void {
    if (!this.gl) return;
    if (this.vao) this.gl.deleteVertexArray(this.vao);
    if (this.vbo) this.gl.deleteBuffer(this.vbo);
    if (this.prog) this.gl.deleteProgram(this.prog);
    this.vao = null;
    this.vbo = null;
    this.prog = null;
    this.gl = null;
  }
}
