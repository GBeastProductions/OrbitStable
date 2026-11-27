;; ORBIT Timing, Circular Beat Synthesis (CBS), and Audio DSP Kernel
;; Compiled to a compact WebAssembly binary in orbitWasm.ts
(module
  (memory (export "memory") 1)

  ;; Linear Memory Map:
  ;; [0..1023]    : f32[256] normalized FFT spectrum bins [0.0..1.0]
  ;; [1024..1027] : f32 bass energy (bins 0..7)
  ;; [1028..1031] : f32 mid energy (bins 8..39)
  ;; [1032..1035] : f32 high energy (bins 40..len-1)
  ;; [1036..1039] : f32 spectral flux / peak pulse

  ;; Wrap any angle into [0, 2*PI)
  (func (export "wrap_angle") (param $a f64) (result f64)
    (local $tau f64)
    (local $m f64)
    (local.set $tau (f64.const 6.283185307179586))
    (local.set $m
      (f64.sub
        (local.get $a)
        (f64.mul
          (f64.floor (f64.div (local.get $a) (local.get $tau)))
          (local.get $tau)
        )
      )
    )
    (if (result f64) (f64.lt (local.get $m) (f64.const 0.0))
      (then (f64.add (local.get $m) (local.get $tau)))
      (else (local.get $m))
    )
  )

  ;; Shortest signed angular delta (target - current) in [-PI, PI]
  (func (export "signed_angle_diff") (param $target f64) (param $current f64) (result f64)
    (local $pi f64)
    (local $tau f64)
    (local $d f64)
    (local.set $pi (f64.const 3.141592653589793))
    (local.set $tau (f64.const 6.283185307179586))
    (local.set $d
      (call 0 (f64.sub (local.get $target) (local.get $current)))
    )
    (if (result f64) (f64.gt (local.get $d) (local.get $pi))
      (then (f64.sub (local.get $d) (local.get $tau)))
      (else (local.get $d))
    )
  )

  ;; Advance needle angle by dir * omega * dt_sec wrapped to [0, 2*PI)
  (func (export "cbs_interpolate_angle")
    (param $angle f64) (param $dir f64) (param $omega f64) (param $dt_sec f64) (result f64)
    (call 0
      (f64.add
        (local.get $angle)
        (f64.mul (local.get $dir) (f64.mul (local.get $omega) (local.get $dt_sec)))
      )
    )
  )

  ;; Classify angular error delta:
  ;; Returns 0 = PERFECT, 1 = GREAT, 2 = GOOD, 3 = MISS
  (func (export "classify_judgment")
    (param $abs_delta f64) (param $half_width f64) (param $perf_limit f64) (result i32)
    (if (f64.le (local.get $abs_delta) (local.get $perf_limit))
      (then (return (i32.const 0)))
    )
    (if (f64.le (local.get $abs_delta) (f64.mul (local.get $half_width) (f64.const 0.68)))
      (then (return (i32.const 1)))
    )
    (if (f64.le (local.get $abs_delta) (local.get $half_width))
      (then (return (i32.const 2)))
    )
    (i32.const 3)
  )

  ;; Compute normalized bass / mid / high / peak-flux directly from linear memory [0..len*4)
  (func (export "compute_dsp_bands") (param $len i32)
    (local $i i32)
    (local $v f32)
    (local $bass f32)
    (local $mid f32)
    (local $high f32)
    (local $peak f32)
    (local $cBass i32)
    (local $cMid i32)
    (local $cHigh i32)

    (local.set $i (i32.const 0))
    (block $done
      (loop $loop
        (br_if $done (i32.ge_s (local.get $i) (local.get $len)))
        (local.set $v (f32.load (i32.shl (local.get $i) (i32.const 2))))
        (if (f32.gt (local.get $v) (local.get $peak))
          (then (local.set $peak (local.get $v)))
        )
        (if (i32.lt_s (local.get $i) (i32.const 8))
          (then
            (local.set $bass (f32.add (local.get $bass) (local.get $v)))
            (local.set $cBass (i32.add (local.get $cBass) (i32.const 1)))
          )
          (else
            (if (i32.lt_s (local.get $i) (i32.const 40))
              (then
                (local.set $mid (f32.add (local.get $mid) (local.get $v)))
                (local.set $cMid (i32.add (local.get $cMid) (i32.const 1)))
              )
              (else
                (local.set $high (f32.add (local.get $high) (local.get $v)))
                (local.set $cHigh (i32.add (local.get $cHigh) (i32.const 1)))
              )
            )
          )
        )
        (local.set $i (i32.add (local.get $i) (i32.const 1)))
        (br $loop)
      )
    )

    (if (i32.gt_s (local.get $cBass) (i32.const 0))
      (then (local.set $bass (f32.div (local.get $bass) (f32.convert_i32_s (local.get $cBass)))))
    )
    (if (i32.gt_s (local.get $cMid) (i32.const 0))
      (then (local.set $mid (f32.div (local.get $mid) (f32.convert_i32_s (local.get $cMid)))))
    )
    (if (i32.gt_s (local.get $cHigh) (i32.const 0))
      (then (local.set $high (f32.div (local.get $high) (f32.convert_i32_s (local.get $cHigh)))))
    )

    (f32.store (i32.const 1024) (local.get $bass))
    (f32.store (i32.const 1028) (local.get $mid))
    (f32.store (i32.const 1032) (local.get $high))
    (f32.store (i32.const 1036) (local.get $peak))
  )
)
