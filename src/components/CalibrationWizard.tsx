import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Activity, Check, Play, RotateCcw, Square } from 'lucide-react';
import { audioEngine } from '../audio/audioEngine';

interface CalibrationWizardProps {
  currentOffsetMs: number;
  trigger1Code: string;
  trigger1Label: string;
  trigger2Code: string;
  trigger2Label: string;
  onApplyOffset: (ms: number) => void;
}

const BEAT_INTERVAL_MS = 500; // 120 BPM crisp studio metronome
const TARGET_TAPS = 8;

export const CalibrationWizard: React.FC<CalibrationWizardProps> = ({
  currentOffsetMs,
  trigger1Code,
  trigger1Label,
  trigger2Code,
  trigger2Label,
  onApplyOffset,
}) => {
  const [running, setRunning] = useState(false);
  const [beatIndex, setBeatIndex] = useState(0);
  const [pulseActive, setPulseActive] = useState(false);
  const [samples, setSamples] = useState<number[]>([]);
  const [appliedBanner, setAppliedBanner] = useState(false);

  const beatTimesRef = useRef<number[]>([]);
  const intervalRef = useRef<number | null>(null);
  const pulseTimerRef = useRef<number | null>(null);

  const stopMetronome = useCallback(() => {
    setRunning(false);
    setPulseActive(false);
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (pulseTimerRef.current !== null) {
      window.clearTimeout(pulseTimerRef.current);
      pulseTimerRef.current = null;
    }
  }, []);

  const fireBeat = useCallback((idx: number) => {
    const expectedAudibleMs = audioEngine.playCalibrationClick(idx % 4 === 0);
    beatTimesRef.current.push(expectedAudibleMs);
    if (beatTimesRef.current.length > 16) beatTimesRef.current.shift();
    setBeatIndex(idx);
    setPulseActive(true);
    if (pulseTimerRef.current !== null) window.clearTimeout(pulseTimerRef.current);
    pulseTimerRef.current = window.setTimeout(() => setPulseActive(false), 120);
  }, []);

  const startMetronome = useCallback(() => {
    audioEngine.unlock();
    setSamples([]);
    setAppliedBanner(false);
    beatTimesRef.current = [];
    setRunning(true);
    let count = 0;
    fireBeat(0);
    intervalRef.current = window.setInterval(() => {
      count += 1;
      fireBeat(count);
    }, BEAT_INTERVAL_MS);
  }, [fireBeat]);

  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
      if (pulseTimerRef.current !== null) window.clearTimeout(pulseTimerRef.current);
    };
  }, []);

  const recordTap = useCallback(
    (tapMs: number) => {
      if (!running || beatTimesRef.current.length === 0) return;
      // Find closest metronome click timestamp (signed: positive = player tapped late -> negative offset needed or positive audioOffset?)
      // Note in Orbit: songTime = audioClock + offsetSec.
      // If player hears the beat late (taps +40ms AFTER scheduled click), charts feel early unless we subtract or shift?
      // Wait: if player taps +40ms AFTER the click (delta = tapMs - beatMs = +40ms), the audio reached their ears/brain 40ms later,
      // OR they reacted 40ms late; shifting songTime earlier (-delta) makes targets arrive 40ms later to match their ear!
      // Wait: let's keep the standard rhythm-game convention:
      // audioOffsetMs = -median(tapMs - beatMs) so if audio is delayed by +40ms (you tap 40ms after beat), songTime = audioClock - 40ms delays visuals by 40ms to match!
      let bestDelta = Infinity;
      for (const bt of beatTimesRef.current) {
        const d = tapMs - bt;
        if (Math.abs(d) < Math.abs(bestDelta)) {
          bestDelta = d;
        }
      }
      if (Math.abs(bestDelta) > 240) return;

      setSamples((prev) => {
        const next = [...prev, Math.round(bestDelta)].slice(-TARGET_TAPS);
        if (next.length >= TARGET_TAPS) {
          stopMetronome();
        }
        return next;
      });
    },
    [running, stopMetronome],
  );

  useEffect(() => {
    if (!running) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === trigger1Code || e.code === trigger2Code || e.code === 'Space') {
        e.preventDefault();
        recordTap(e.timeStamp || performance.now());
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [recordTap, running, trigger1Code, trigger2Code]);

  // Compute trimmed median recommendation
  const recommendedOffsetMs = React.useMemo(() => {
    if (samples.length < 3) return null;
    const sorted = [...samples].sort((a, b) => a - b);
    const trimmed = sorted.length >= 6 ? sorted.slice(1, -1) : sorted;
    const avg = trimmed.reduce((acc, v) => acc + v, 0) / trimmed.length;
    const rounded = Math.round(-avg / 5) * 5;
    return Math.max(-150, Math.min(150, rounded));
  }, [samples]);

  const reportedLatency = audioEngine.getReportedLatencyMs();

  return (
    <div className="border border-white/15 bg-[#101524] p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#22d3ee]" />
            <h3 className="font-display text-sm font-black text-white">
              Studio Metronome Calibration Wizard
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-[#a1abbe]">
            Listen to the 120 BPM click and tap <strong className="text-white">{trigger1Label}</strong>,{' '}
            <strong className="text-white">{trigger2Label}</strong>, or the pad below {TARGET_TAPS} times in rhythm.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!running ? (
            <button
              type="button"
              onClick={startMetronome}
              className="tactile-btn lazer-slant-sm border border-[#22d3ee]/60 bg-[#082730] px-4 py-2 text-xs font-extrabold text-[#22d3ee] hover:bg-[#22d3ee] hover:text-[#041217] cursor-pointer whitespace-nowrap"
            >
              <span className="lazer-unslant-sm flex items-center gap-1.5">
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>{samples.length > 0 ? 'Recalibrate' : 'Start Metronome'}</span>
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={stopMetronome}
              className="tactile-btn lazer-slant-sm border border-[#ef4444]/60 bg-[#2a0909] px-4 py-2 text-xs font-extrabold text-[#fca5a5] hover:bg-[#ef4444] hover:text-white cursor-pointer whitespace-nowrap"
            >
              <span className="lazer-unslant-sm flex items-center gap-1.5">
                <Square className="h-3.5 w-3.5 fill-current" />
                <span>Stop</span>
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Live Beat Ring + Tap Pad */}
      <div className="flex flex-col sm:flex-row items-center gap-4 border border-white/10 bg-[#090c14] p-4">
        <button
          type="button"
          onPointerDown={(e) => {
            if (running) recordTap(e.timeStamp || performance.now());
          }}
          disabled={!running}
          className={`relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 transition-transform duration-75 cursor-pointer disabled:opacity-50 ${
            pulseActive
              ? 'scale-105 border-[#fde047] bg-[#fde047]/20 text-[#fde047]'
              : running
              ? 'border-[#22d3ee]/70 bg-[#0d1924] text-white hover:border-[#22d3ee]'
              : 'border-white/15 bg-[#121624] text-[#68738a]'
          }`}
        >
          <div className="text-center">
            <span className="block font-mono text-xs font-black">
              {running ? `BEAT ${(beatIndex % 4) + 1}` : 'IDLE'}
            </span>
            <span className="block text-[10px] text-[#a1abbe]">
              {samples.length}/{TARGET_TAPS}
            </span>
          </div>
        </button>

        {/* Per-Tap Error Histogram */}
        <div className="flex-1 w-full space-y-2">
          <div className="flex items-center justify-between text-[11px] text-[#a1abbe]">
            <span>Early (-ms)</span>
            <span className="font-mono text-white">0ms Center</span>
            <span>Late (+ms)</span>
          </div>
          <div className="relative h-8 w-full border border-white/10 bg-[#05070b] overflow-hidden">
            <div className="absolute inset-y-0 left-1/2 w-[1px] bg-white/40" />
            {samples.map((errMs, idx) => {
              const clamped = Math.max(-120, Math.min(120, errMs));
              const leftPct = 50 + (clamped / 120) * 46;
              const isTight = Math.abs(errMs) <= 20;
              return (
                <div
                  key={`${idx}-${errMs}`}
                  title={`${errMs > 0 ? `+${errMs}` : errMs}ms`}
                  className="absolute top-1 bottom-1 w-1.5 -translate-x-1/2"
                  style={{
                    left: `${leftPct}%`,
                    backgroundColor: isTight ? '#34d399' : '#22d3ee',
                    opacity: 0.45 + ((idx + 1) / Math.max(1, samples.length)) * 0.55,
                  }}
                />
              );
            })}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] tabular-nums text-[#a1abbe]">
            <span>
              Auto Hardware Latency: <strong className="text-white">{reportedLatency}ms</strong>
            </span>
            <span>
              Current Offset:{' '}
              <strong className="text-[#22d3ee]">
                {currentOffsetMs > 0 ? `+${currentOffsetMs}ms` : `${currentOffsetMs}ms`}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Recommendation & Apply Bar */}
      {recommendedOffsetMs !== null && (
        <div className="flex flex-wrap items-center justify-between gap-3 border border-[#34d399]/35 bg-[#08261c]/70 px-4 py-2.5">
          <div className="text-xs text-[#e5e7eb]">
            Measured median offset:{' '}
            <strong className="font-mono text-[#34d399]">
              {recommendedOffsetMs > 0 ? `+${recommendedOffsetMs}ms` : `${recommendedOffsetMs}ms`}
            </strong>{' '}
            <span className="text-[#a1abbe]">({samples.length} taps)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSamples([]);
                setAppliedBanner(false);
              }}
              className="tactile-btn flex items-center gap-1 border border-white/15 bg-[#121726] px-3 py-1.5 text-xs font-bold text-[#d1d5db] hover:text-white cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Clear</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onApplyOffset(recommendedOffsetMs);
                setAppliedBanner(true);
              }}
              className="tactile-btn flex items-center gap-1.5 border border-[#34d399] bg-[#10b981] px-3.5 py-1.5 text-xs font-extrabold text-[#03150e] hover:bg-[#34d399] cursor-pointer"
            >
              <Check className="h-3.5 w-3.5" />
              <span>{appliedBanner ? 'Applied!' : 'Apply Offset'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
