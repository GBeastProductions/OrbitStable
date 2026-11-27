// Self-contained WebAssembly binary generator & runtime wrapper for ORBIT's
// 240Hz Circular Beat Synthesis (CBS) angle math, judgment classification, and audio FFT DSP.

const TAU = Math.PI * 2;
const PI = Math.PI;

export interface AudioBands {
  bass: number;
  mid: number;
  high: number;
  flux: number;
}

interface OrbitWasmExports {
  memory: WebAssembly.Memory;
  wrap_angle: (a: number) => number;
  signed_angle_diff: (target: number, current: number) => number;
  cbs_interpolate_angle: (angle: number, dir: number, omega: number, dtSec: number) => number;
  classify_judgment: (absDelta: number, halfWidth: number, perfLimit: number) => number;
  compute_dsp_bands: (len: number) => void;
}

// Minimal LEB128 & IEEE-754 binary encoder so the compiled module matches orbit_core.wat 1:1
function uleb(n: number): number[] {
  const out: number[] = [];
  let v = n >>> 0;
  do {
    let b = v & 0x7f;
    v >>>= 7;
    if (v !== 0) b |= 0x80;
    out.push(b);
  } while (v !== 0);
  return out;
}

function f64Bytes(val: number): number[] {
  const buf = new ArrayBuffer(8);
  new DataView(buf).setFloat64(0, val, true);
  return Array.from(new Uint8Array(buf));
}

function section(id: number, payload: number[]): number[] {
  return [id, ...uleb(payload.length), ...payload];
}

function strBytes(s: string): number[] {
  const arr = Array.from(s).map((c) => c.charCodeAt(0));
  return [...uleb(arr.length), ...arr];
}

function encodeOrbitWasmBinary(): Uint8Array {
  const F64 = 0x7c;
  const F32 = 0x7d;
  const I32 = 0x7f;

  // Type section (5 types)
  // 0: (f64) -> f64
  // 1: (f64, f64) -> f64
  // 2: (f64, f64, f64, f64) -> f64
  // 3: (f64, f64, f64) -> i32
  // 4: (i32) -> ()
  const typeSection = section(1, [
    5,
    0x60, 1, F64, 1, F64,
    0x60, 2, F64, F64, 1, F64,
    0x60, 4, F64, F64, F64, F64, 1, F64,
    0x60, 3, F64, F64, F64, 1, I32,
    0x60, 1, I32, 0,
  ]);

  // Function section: 5 functions mapped to types 0..4
  const funcSection = section(3, [5, 0, 1, 2, 3, 4]);

  // Memory section: min 1 page (64KB)
  const memSection = section(5, [1, 0x00, 1]);

  // Export section
  const exportSection = section(7, [
    6,
    ...strBytes('memory'), 0x02, 0,
    ...strBytes('wrap_angle'), 0x00, 0,
    ...strBytes('signed_angle_diff'), 0x00, 1,
    ...strBytes('cbs_interpolate_angle'), 0x00, 2,
    ...strBytes('classify_judgment'), 0x00, 3,
    ...strBytes('compute_dsp_bands'), 0x00, 4,
  ]);

  const TAU_B = f64Bytes(TAU);
  const PI_B = f64Bytes(PI);
  const ZERO_B = f64Bytes(0.0);
  const GREAT_SCALE_B = f64Bytes(0.68);

  // Func 0: wrap_angle(a: f64) -> f64
  // locals: 1=$tau(f64), 2=$m(f64)
  const body0: number[] = [
    1, 2, F64,
    0x44, ...TAU_B, 0x21, 1, // $tau = TAU
    0x20, 0, // local.get $a
    0x20, 0, 0x20, 1, 0xa3, // $a / $tau
    0x9c, // f64.floor
    0x20, 1, 0xa2, // * $tau
    0xa1, // f64.sub
    0x22, 2, // local.tee $m
    0x44, ...ZERO_B, 0x63, // m < 0
    0x04, F64,
    0x20, 2, 0x20, 1, 0xa0, // m + tau
    0x05,
    0x20, 2,
    0x0b,
    0x0b,
  ];

  // Func 1: signed_angle_diff(target: f64, current: f64) -> f64
  // locals: 2=$d(f64)
  const body1: number[] = [
    1, 1, F64,
    0x20, 0, 0x20, 1, 0xa1, // target - current
    0x10, 0, // call wrap_angle
    0x22, 2, // local.tee $d
    0x44, ...PI_B, 0x64, // d > PI
    0x04, F64,
    0x20, 2, 0x44, ...TAU_B, 0xa1, // d - TAU
    0x05,
    0x20, 2,
    0x0b,
    0x0b,
  ];

  // Func 2: cbs_interpolate_angle(angle, dir, omega, dt) -> f64
  const body2: number[] = [
    0,
    0x20, 0,
    0x20, 1, 0x20, 2, 0xa2, 0x20, 3, 0xa2,
    0xa0,
    0x10, 0,
    0x0b,
  ];

  // Func 3: classify_judgment(abs_delta, half_width, perf_limit) -> i32
  const body3: number[] = [
    0,
    0x20, 0, 0x20, 2, 0x65, // abs_delta <= perf_limit
    0x04, 0x40,
    0x41, 0, 0x0f, // return 0 (PERFECT)
    0x0b,
    0x20, 0, 0x20, 1, 0x44, ...GREAT_SCALE_B, 0xa2, 0x65, // abs_delta <= half_width * 0.68
    0x04, 0x40,
    0x41, 1, 0x0f, // return 1 (GREAT)
    0x0b,
    0x20, 0, 0x20, 1, 0x65, // abs_delta <= half_width
    0x04, 0x40,
    0x41, 2, 0x0f, // return 2 (GOOD)
    0x0b,
    0x41, 3, // MISS
    0x0b,
  ];

  // Func 4: compute_dsp_bands(len: i32) -> void
  // params: 0=$len
  // locals: 1=$i(i32), 2=$cBass(i32), 3=$cMid(i32), 4=$cHigh(i32),
  //         5=$v(f32), 6=$bass(f32), 7=$mid(f32), 8=$high(f32), 9=$peak(f32)
  const body4: number[] = [
    2,
    4, I32,
    5, F32,
    // block $done { loop $loop {
    0x02, 0x40,
    0x03, 0x40,
    0x20, 1, 0x20, 0, 0x4e, 0x0d, 1, // br_if $done ($i >= $len)
    // $v = f32.load($i << 2)
    0x20, 1, 0x41, 2, 0x74, 0x2a, 0x02, 0x00, 0x22, 5,
    0x20, 9, 0x5e, // $v > $peak
    0x04, 0x40, 0x20, 5, 0x21, 9, 0x0b,
    // if ($i < 8)
    0x20, 1, 0x41, 8, 0x48,
    0x04, 0x40,
    0x20, 6, 0x20, 5, 0x92, 0x21, 6,
    0x20, 2, 0x41, 1, 0x6a, 0x21, 2,
    0x05,
    // else if ($i < 40)
    0x20, 1, 0x41, 40, 0x48,
    0x04, 0x40,
    0x20, 7, 0x20, 5, 0x92, 0x21, 7,
    0x20, 3, 0x41, 1, 0x6a, 0x21, 3,
    0x05,
    // else high
    0x20, 8, 0x20, 5, 0x92, 0x21, 8,
    0x20, 4, 0x41, 1, 0x6a, 0x21, 4,
    0x0b,
    0x0b,
    // $i += 1; br $loop
    0x20, 1, 0x41, 1, 0x6a, 0x21, 1,
    0x0c, 0,
    0x0b, // end loop
    0x0b, // end block
    // Normalize & store at byte offsets 1024, 1028, 1032, 1036
    0x20, 2, 0x41, 0, 0x4a, 0x04, 0x40,
    0x20, 6, 0x20, 2, 0xb2, 0x95, 0x21, 6, 0x0b,
    0x20, 3, 0x41, 0, 0x4a, 0x04, 0x40,
    0x20, 7, 0x20, 3, 0xb2, 0x95, 0x21, 7, 0x0b,
    0x20, 4, 0x41, 0, 0x4a, 0x04, 0x40,
    0x20, 8, 0x20, 4, 0xb2, 0x95, 0x21, 8, 0x0b,
    // stores (offset encoded in uleb128: 1024 = 0x80 0x08, 1028 = 0x84 0x08, ...)
    0x41, ...uleb(1024), 0x20, 6, 0x38, 0x02, 0x00,
    0x41, ...uleb(1028), 0x20, 7, 0x38, 0x02, 0x00,
    0x41, ...uleb(1032), 0x20, 8, 0x38, 0x02, 0x00,
    0x41, ...uleb(1036), 0x20, 9, 0x38, 0x02, 0x00,
    0x0b,
  ];

  const bodies = [body0, body1, body2, body3, body4];
  const codePayload: number[] = [bodies.length];
  for (const b of bodies) {
    codePayload.push(...uleb(b.length), ...b);
  }
  const codeSection = section(10, codePayload);

  return new Uint8Array([
    0x00, 0x61, 0x73, 0x6d, // "\0asm"
    0x01, 0x00, 0x00, 0x00, // version 1
    ...typeSection,
    ...funcSection,
    ...memSection,
    ...exportSection,
    ...codeSection,
  ]);
}

class OrbitWasmEngine {
  private exports: OrbitWasmExports | null = null;
  private f32View: Float32Array | null = null;
  private initialized = false;
  private smoothBass = 0;
  private smoothMid = 0;
  private smoothHigh = 0;
  private prevPeak = 0;

  init(): void {
    if (this.initialized) return;
    this.initialized = true;
    try {
      if (typeof WebAssembly === 'undefined') return;
      const bytes = encodeOrbitWasmBinary();
      const mod = new WebAssembly.Module(bytes as unknown as BufferSource);
      const inst = new WebAssembly.Instance(mod);
      this.exports = inst.exports as unknown as OrbitWasmExports;
      this.f32View = new Float32Array(this.exports.memory.buffer);
    } catch (err) {
      console.warn('ORBIT WASM kernel using TS fallback:', err);
      this.exports = null;
      this.f32View = null;
    }
  }

  get isWasmActive(): boolean {
    if (!this.initialized) this.init();
    return Boolean(this.exports);
  }

  wrapAngle(a: number): number {
    if (!this.initialized) this.init();
    if (this.exports) return this.exports.wrap_angle(a);
    const m = ((a % TAU) + TAU) % TAU;
    return m;
  }

  signedAngleDiff(target: number, current: number): number {
    if (!this.initialized) this.init();
    if (this.exports) return this.exports.signed_angle_diff(target, current);
    const d = (((target - current) % TAU) + TAU) % TAU;
    return d > PI ? d - TAU : d;
  }

  interpolateAngle(angle: number, dir: number, omega: number, dtSec: number): number {
    if (!this.initialized) this.init();
    if (this.exports) return this.exports.cbs_interpolate_angle(angle, dir, omega, dtSec);
    return (((angle + dir * omega * dtSec) % TAU) + TAU) % TAU;
  }

  classifyJudgment(absDelta: number, halfWidth: number, perfLimit: number): 0 | 1 | 2 | 3 {
    if (!this.initialized) this.init();
    if (this.exports) {
      return this.exports.classify_judgment(absDelta, halfWidth, perfLimit) as 0 | 1 | 2 | 3;
    }
    if (absDelta <= perfLimit) return 0;
    if (absDelta <= halfWidth * 0.68) return 1;
    if (absDelta <= halfWidth) return 2;
    return 3;
  }

  analyzeFrequencyData(freqBytes: Uint8Array): AudioBands {
    if (!this.initialized) this.init();
    const len = Math.min(256, freqBytes.length);
    let rawBass = 0;
    let rawMid = 0;
    let rawHigh = 0;
    let peak = 0;

    if (this.exports && this.f32View && len > 0) {
      for (let i = 0; i < len; i++) {
        this.f32View[i] = freqBytes[i] / 255;
      }
      this.exports.compute_dsp_bands(len);
      // Byte offsets 1024..1036 map to Float32 indices 256..259
      rawBass = this.f32View[256] || 0;
      rawMid = this.f32View[257] || 0;
      rawHigh = this.f32View[258] || 0;
      peak = this.f32View[259] || 0;
    } else if (len > 0) {
      let cB = 0;
      let cM = 0;
      let cH = 0;
      for (let i = 0; i < len; i++) {
        const v = freqBytes[i] / 255;
        if (v > peak) peak = v;
        if (i < 8) {
          rawBass += v;
          cB++;
        } else if (i < 40) {
          rawMid += v;
          cM++;
        } else {
          rawHigh += v;
          cH++;
        }
      }
      if (cB > 0) rawBass /= cB;
      if (cM > 0) rawMid /= cM;
      if (cH > 0) rawHigh /= cH;
    }

    // Exponential envelope follower for glassy 60fps shader modulation
    this.smoothBass = this.smoothBass * 0.68 + rawBass * 0.32;
    this.smoothMid = this.smoothMid * 0.72 + rawMid * 0.28;
    this.smoothHigh = this.smoothHigh * 0.72 + rawHigh * 0.28;
    const rawFlux = Math.max(0, peak - this.prevPeak);
    this.prevPeak = peak * 0.85;

    return {
      bass: this.smoothBass,
      mid: this.smoothMid,
      high: this.smoothHigh,
      flux: Math.min(1, rawFlux * 2.4 + this.smoothBass * 0.35),
    };
  }
}

export const orbitWasm = new OrbitWasmEngine();
