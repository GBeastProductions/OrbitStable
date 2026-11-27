// Unified WebGL2 (#version 300 es) Overdrive VFX Shader for ORBIT.
// Renders seamless full-viewport energy wisps, radial orbital aura, and anamorphic flare
// with smooth elliptical vignette falloff so rectangular edges never appear.

export const OVERDRIVE_VERT_SRC = `#version 300 es
precision highp float;
in vec2 a_pos;
out vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

export const OVERDRIVE_FRAG_SRC = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform vec2  u_res;
uniform float u_time;
uniform float u_charge;        // 0.0 .. 1.0
uniform float u_active;        // 0.0 (buildup) or 1.0 (erupted)
uniform float u_beatPulse;     // 0.0 .. 1.0
uniform float u_bass;          // 0.0 .. 1.0 (WASM FFT band)
uniform float u_mid;           // 0.0 .. 1.0
uniform float u_turbulence;    // shader tuning 0.3 .. 2.2
uniform float u_flareStrength; // shader tuning 0.0 .. 2.0
uniform float u_speed;         // shader tuning 0.4 .. 2.5
uniform float u_ringAura;      // shader tuning 0.0 .. 2.0
uniform vec2  u_center;        // dial center in normalized UV
uniform float u_bezelR;        // dial radius / min(w,h)
uniform vec3  u_primary;
uniform vec3  u_bright;
uniform vec3  u_secondary;
uniform vec3  u_edgeTick;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
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

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(0.80, -0.60, 0.60, 0.80);
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = rot * p * 2.04 + vec2(3.1, -1.7);
    a *= 0.5;
  }
  return v;
}

float starSparkle(vec2 p, float r) {
  float d1 = exp(-abs(p.x) * (16.0 / r)) * exp(-abs(p.y) * (2.6 / r));
  float d2 = exp(-abs(p.y) * (16.0 / r)) * exp(-abs(p.x) * (2.6 / r));
  float core = exp(-length(p) * (6.0 / r));
  return clamp(d1 + d2 + core * 0.85, 0.0, 1.5);
}

void main() {
  float intensity = clamp(u_active > 0.5 ? 1.0 : smoothstep(0.14, 1.0, u_charge) * 0.78, 0.0, 1.0);
  if (intensity <= 0.005) {
    outColor = vec4(0.0);
    return;
  }

  float minDim = min(u_res.x, u_res.y);
  vec2 aspectDelta = (v_uv - u_center) * (u_res / minDim);
  float dist = length(aspectDelta);
  float ang = atan(aspectDelta.y, aspectDelta.x);
  float t = u_time * max(0.35, u_speed);
  float audioBoost = 1.0 + u_bass * 0.85 + u_beatPulse * 0.48;

  // Seamless viewport edge feather (prevents hard edges while keeping screen presence huge)
  float edgeFadeX = smoothstep(0.0, 0.055, v_uv.x) * smoothstep(1.0, 0.945, v_uv.x);
  float edgeFadeY = smoothstep(0.0, 0.06, v_uv.y) * smoothstep(1.0, 0.94, v_uv.y);
  float safeMask = edgeFadeX * edgeFadeY;

  // 1. Swirling Polar Flame Ribbons whipping outward around the dial
  float ringDist = max(0.0, dist - u_bezelR * 0.82);
  float swirlAng = ang - ringDist * (2.6 * u_turbulence) + t * 0.42;
  vec2 polarVec = vec2(cos(swirlAng), sin(swirlAng));
  float n1 = fbm(polarVec * 2.8 + vec2(ringDist * 3.4 - t * 1.45, t * 0.55));
  float n2 = fbm(polarVec * 5.2 - vec2(ringDist * 5.1 - t * 2.1, n1 * 1.8));
  float ribbonField = n1 * 0.58 + n2 * 0.55;

  // Sharpen ribbons into dramatic high-contrast anime energy arcs with dark voids between wisps
  float radialReach = exp(-ringDist * (1.55 - 0.55 * intensity)) * smoothstep(u_bezelR * 0.72, u_bezelR * 1.06, dist);
  float sharpRibbon = smoothstep(0.46, 0.78, ribbonField + radialReach * 0.34) * radialReach;
  float emberCrest = smoothstep(0.68, 0.90, ribbonField + radialReach * 0.25) * radialReach;

  // Tight luminous crown hugging bezel
  float crownBand = exp(-abs(dist - u_bezelR - 0.018 - (n1 - 0.5) * 0.055) * 26.0) * max(0.0, u_ringAura);

  // 2. Corner Volumetric Energy Flanks (expands dramatically at full overdrive)
  vec2 uvMirrored = vec2(abs(v_uv.x - 0.5) * 2.0, v_uv.y);
  float cornerPull = exp(-length(vec2(1.0 - uvMirrored.x, min(v_uv.y, 1.0 - v_uv.y * 0.65))) * 1.95);
  float outerWisp = smoothstep(0.48, 0.84, fbm(vec2(aspectDelta.x * 2.2, aspectDelta.y * 2.2 - t * 1.35)) + cornerPull * 0.42) * cornerPull;

  // 3. Sharp Cardinal Anamorphic Star Beams (Horizontal + Vertical + Diagonal) centered on Dial
  float hBeam = exp(-abs(aspectDelta.y) * (42.0 - u_beatPulse * 10.0)) * exp(-abs(aspectDelta.x) * 1.05);
  float vBeam = exp(-abs(aspectDelta.x) * (34.0 - u_beatPulse * 8.0)) * exp(-abs(aspectDelta.y) * 1.25);
  float dBeam = exp(-abs(aspectDelta.y - aspectDelta.x * 0.35) * 58.0) * exp(-dist * 1.45);
  float flare = (hBeam * 0.78 + vBeam * 0.58 + dBeam * 0.32) * u_flareStrength * (u_active > 0.5 ? 1.0 : 0.32) * (1.0 + u_mid * 0.6);

  // 4. Twinkling 4-point Orbital Sparkles around perimeter
  float sparkles = 0.0;
  for (int k = 0; k < 5; k++) {
    float fk = float(k);
    float sAng = fk * 1.2566 + t * (0.28 + fk * 0.05);
    float sRad = u_bezelR * (1.28 + 0.38 * sin(t * 1.3 + fk * 2.1));
    vec2 sPos = vec2(cos(sAng), sin(sAng)) * sRad;
    float pulse = 0.55 + 0.45 * sin(t * 4.5 + fk * 1.7);
    sparkles += starSparkle(aspectDelta - sPos, 0.055 * pulse) * pulse;
  }

  // Palette composition: Deep secondary ember -> fiery primary silk -> incandescent bright + white hot core
  float coreMask = clamp(emberCrest * 1.2 + crownBand * 0.9 + flare * 0.85, 0.0, 1.0);
  vec3 col = mix(u_secondary * 0.65, u_primary, smoothstep(0.18, 0.62, sharpRibbon + outerWisp * 0.5));
  col = mix(col, u_bright, smoothstep(0.42, 0.85, emberCrest + crownBand * 0.75 + outerWisp * 0.55));
  col = mix(col, u_edgeTick * 1.15, smoothstep(0.62, 0.96, coreMask));
  col += vec3(1.0, 0.97, 0.92) * (sparkles * 0.45 + flare * 0.52);

  float rawAlpha = (sharpRibbon * 0.82 + crownBand * 0.75 + outerWisp * 0.52 + flare * 0.62 + sparkles * 0.42) * audioBoost * intensity * safeMask;
  float totalAlpha = clamp(rawAlpha, 0.0, 0.94);
  outColor = vec4(col * totalAlpha, totalAlpha);
}
`;

export interface OverdriveShaderUniforms {
  timeSec: number;
  charge: number;
  active: boolean;
  beatPulse: number;
  bass: number;
  mid: number;
  turbulence: number;
  flareStrength: number;
  speed: number;
  ringAura: number;
  centerX: number;
  centerY: number;
  bezelR: number;
  primaryRgb: [number, number, number];
  brightRgb: [number, number, number];
  secondaryRgb: [number, number, number];
  edgeTickRgb: [number, number, number];
}

export class OverdriveGlRenderer {
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
      powerPreference: 'high-performance',
    });
    if (!gl) return false;

    const compile = (type: number, src: string): WebGLShader | null => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.warn('Overdrive GLSL compile error:', gl.getShaderInfoLog(sh));
        gl.deleteShader(sh);
        return null;
      }
      return sh;
    };

    const vs = compile(gl.VERTEX_SHADER, OVERDRIVE_VERT_SRC);
    const fs = compile(gl.FRAGMENT_SHADER, OVERDRIVE_FRAG_SRC);
    if (!vs || !fs) return false;

    const prog = gl.createProgram();
    if (!prog) return false;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.deleteShader(vs);
    gl.deleteShader(fs);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn('Overdrive GLSL link error:', gl.getProgramInfoLog(prog));
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

    const uniformNames = [
      'u_res',
      'u_time',
      'u_charge',
      'u_active',
      'u_beatPulse',
      'u_bass',
      'u_mid',
      'u_turbulence',
      'u_flareStrength',
      'u_speed',
      'u_ringAura',
      'u_center',
      'u_bezelR',
      'u_primary',
      'u_bright',
      'u_secondary',
      'u_edgeTick',
    ];
    for (const name of uniformNames) {
      this.locs[name] = gl.getUniformLocation(prog, name);
    }

    this.gl = gl;
    this.prog = prog;
    this.vao = vao;
    this.vbo = vbo;
    return true;
  }

  render(width: number, height: number, u: OverdriveShaderUniforms): void {
    const gl = this.gl;
    const prog = this.prog;
    if (!gl || !prog || !this.vao) return;

    gl.viewport(0, 0, width, height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(prog);
    gl.bindVertexArray(this.vao);

    gl.uniform2f(this.locs.u_res, width, height);
    gl.uniform1f(this.locs.u_time, u.timeSec);
    gl.uniform1f(this.locs.u_charge, u.charge);
    gl.uniform1f(this.locs.u_active, u.active ? 1.0 : 0.0);
    gl.uniform1f(this.locs.u_beatPulse, u.beatPulse);
    gl.uniform1f(this.locs.u_bass, u.bass);
    gl.uniform1f(this.locs.u_mid, u.mid);
    gl.uniform1f(this.locs.u_turbulence, u.turbulence);
    gl.uniform1f(this.locs.u_flareStrength, u.flareStrength);
    gl.uniform1f(this.locs.u_speed, u.speed);
    gl.uniform1f(this.locs.u_ringAura, u.ringAura);
    gl.uniform2f(this.locs.u_center, u.centerX, u.centerY);
    gl.uniform1f(this.locs.u_bezelR, u.bezelR);
    gl.uniform3f(this.locs.u_primary, u.primaryRgb[0], u.primaryRgb[1], u.primaryRgb[2]);
    gl.uniform3f(this.locs.u_bright, u.brightRgb[0], u.brightRgb[1], u.brightRgb[2]);
    gl.uniform3f(this.locs.u_secondary, u.secondaryRgb[0], u.secondaryRgb[1], u.secondaryRgb[2]);
    gl.uniform3f(this.locs.u_edgeTick, u.edgeTickRgb[0], u.edgeTickRgb[1], u.edgeTickRgb[2]);

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
