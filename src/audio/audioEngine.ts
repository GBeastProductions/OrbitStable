import { loadCustomAudioBytes, saveCustomAudioBytes } from '../store/mediaVaultStore';
import { HitSfxMode, SongDefinition } from '../types/game';
import { AudioBands, orbitWasm } from '../wasm/orbitWasm';

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export interface DecodedCustomAudio {
  buffer: AudioBuffer;
  durationSec: number;
  estimatedBpm: number;
  onsets: number[];
}

class OrbitAudioEngine {
  private ctx: AudioContext | null = null;
  private lowWarmthFilter: BiquadFilterNode | null = null;
  private airPresenceFilter: BiquadFilterNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private freqBins: Uint8Array<ArrayBuffer> | null = null;
  private sfxNoiseBuffer: AudioBuffer | null = null;

  private bufferCache = new Map<string, AudioBuffer>();
  private audioSourceMap = new Map<string, 'mp3' | 'indexeddb' | 'synth'>();
  private loadingPromises = new Map<string, Promise<AudioBuffer | null>>();
  private activeSource: AudioBufferSourceNode | null = null;
  private activeSourceGain: GainNode | null = null;
  private activeSongId: string | null = null;
  private activeBufferDuration = 0;
  private activeLoop = false;
  private loadingSongId: string | null = null;
  private playSessionId = 0;

  // Hold-arc sustain shimmer nodes
  private holdOsc: OscillatorNode | null = null;
  private holdSubOsc: OscillatorNode | null = null;
  private holdGain: GainNode | null = null;

  private playing = false;
  private startedAtCtxTime = 0;
  private startOffsetSec = 0;
  private activePlaybackRate = 1.0;

  ensureContext(): AudioContext | null {
    if (!this.ctx) {
      try {
        const Ctx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!Ctx) return null;
        this.ctx = new Ctx();
        const now = this.ctx.currentTime;

        // Crisp Tokyo cabinet master bus: subtle warmth shelf + hi-fi air clarity + transparent limiter
        this.lowWarmthFilter = this.ctx.createBiquadFilter();
        this.lowWarmthFilter.type = 'lowshelf';
        this.lowWarmthFilter.frequency.setValueAtTime(115, now);
        this.lowWarmthFilter.gain.setValueAtTime(1.4, now);

        this.airPresenceFilter = this.ctx.createBiquadFilter();
        this.airPresenceFilter.type = 'highshelf';
        this.airPresenceFilter.frequency.setValueAtTime(6800, now);
        this.airPresenceFilter.gain.setValueAtTime(1.6, now);

        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.setValueAtTime(-3, now);
        this.compressor.knee.setValueAtTime(14, now);
        this.compressor.ratio.setValueAtTime(2.2, now);
        this.compressor.attack.setValueAtTime(0.002, now);
        this.compressor.release.setValueAtTime(0.12, now);

        this.musicGain = this.ctx.createGain();
        this.sfxGain = this.ctx.createGain();
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 64;
        this.analyser.smoothingTimeConstant = 0.78;
        this.freqBins = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount));

        this.musicGain.connect(this.lowWarmthFilter);
        this.lowWarmthFilter.connect(this.airPresenceFilter);
        this.airPresenceFilter.connect(this.analyser);
        this.analyser.connect(this.compressor);
        this.sfxGain.connect(this.compressor);
        this.compressor.connect(this.ctx.destination);
      } catch {
        return null;
      }
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  unlock(): void {
    const ctx = this.ensureContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  }

  updateVolumes(musicEnabled: boolean, musicVol: number, soundEnabled: boolean, sfxVol: number): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const now = ctx.currentTime;
    if (this.musicGain) {
      this.musicGain.gain.cancelScheduledValues(now);
      this.musicGain.gain.setTargetAtTime(musicEnabled ? (musicVol / 100) * 0.85 : 0, now, 0.02);
    }
    if (this.sfxGain) {
      this.sfxGain.gain.cancelScheduledValues(now);
      this.sfxGain.gain.setTargetAtTime(soundEnabled ? (sfxVol / 100) * 0.72 : 0, now, 0.015);
    }
  }

  hasBuffered(songId: string): boolean {
    return this.bufferCache.has(songId);
  }

  getBufferDuration(songId: string): number | null {
    const buf = this.bufferCache.get(songId);
    return buf ? buf.duration : null;
  }

  getTrackAudioSource(songId: string): 'mp3' | 'indexeddb' | 'synth' | 'unloaded' {
    return this.audioSourceMap.get(songId) || 'unloaded';
  }

  clearBufferedSong(songId: string): void {
    this.bufferCache.delete(songId);
    this.audioSourceMap.delete(songId);
    this.loadingPromises.delete(songId);
  }

  preloadSong(song: SongDefinition): void {
    if (this.bufferCache.has(song.id) || this.loadingPromises.has(song.id)) return;
    void this.loadSongBuffer(song);
  }

  async loadSongBuffer(song: SongDefinition): Promise<AudioBuffer | null> {
    if (this.bufferCache.has(song.id)) {
      return this.bufferCache.get(song.id) || null;
    }
    if (this.loadingPromises.has(song.id)) {
      return this.loadingPromises.get(song.id) || null;
    }
    const ctx = this.ensureContext();
    if (!ctx) return null;

    const task = (async () => {
      try {
        // 1. Check persistent IndexedDB Media Vault first (survives page reloads for custom/dev uploads)
        const storedBytes = await loadCustomAudioBytes(song.id);
        if (storedBytes && storedBytes.byteLength >= 4096) {
          try {
            const decodedStored = await ctx.decodeAudioData(storedBytes.slice(0));
            this.bufferCache.set(song.id, decodedStored);
            this.audioSourceMap.set(song.id, 'indexeddb');
            return decodedStored;
          } catch (storedErr) {
            console.warn(`Stored IndexedDB audio decode failed for ${song.title}:`, storedErr);
          }
        }

        // 2. Fetch static/remote MP3 if provided and validate real audio payload (>= 4 KB)
        if (song.audioUrl) {
          try {
            const res = await fetch(song.audioUrl);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const contentType = (res.headers.get('content-type') || '').toLowerCase();
            if (contentType.includes('text/html')) {
              throw new Error('HTML returned instead of audio');
            }
            const arrayBuf = await res.arrayBuffer();
            if (arrayBuf.byteLength >= 4096) {
              const decoded = await ctx.decodeAudioData(arrayBuf.slice(0));
              this.bufferCache.set(song.id, decoded);
              this.audioSourceMap.set(song.id, 'mp3');
              return decoded;
            }
            throw new Error(`Placeholder or truncated audio file (${arrayBuf.byteLength} bytes)`);
          } catch (innerErr) {
            console.warn(`Audio file fallback triggered for ${song.title}:`, innerErr);
          }
        }

        // 3. Deterministic PCM synth fallback so tracks like W1 never go silent
        const rendered = this.synthesizeTrackBuffer(ctx, song);
        if (rendered) {
          this.bufferCache.set(song.id, rendered);
          this.audioSourceMap.set(song.id, 'synth');
          return rendered;
        }
        return null;
      } catch (err) {
        console.warn(`Could not load audio for ${song.title}:`, err);
        return null;
      } finally {
        this.loadingPromises.delete(song.id);
      }
    })();

    this.loadingPromises.set(song.id, task);
    return task;
  }

  private synthesizeTrackBuffer(
    ctx: AudioContext,
    song: SongDefinition,
  ): AudioBuffer | null {
    try {
      const sr = Math.min(44100, Math.max(22050, ctx.sampleRate || 44100));
      const duration = Math.max(16, Math.min(420, song.durationSec || 120));
      const totalSamples = Math.floor(sr * duration);
      const buffer = ctx.createBuffer(2, totalSamples, sr);
      const outL = buffer.getChannelData(0);
      const outR = buffer.getChannelData(1);

      const scale = song.scaleNotes && song.scaleNotes.length >= 4
        ? song.scaleNotes
        : [62, 64, 65, 67, 69, 70, 73, 74];
      const pattern = song.synthFallback || {
        style: song.demonOnly ? ('demon' as const) : ('electro' as const),
        chords: [
          [scale[0] - 12, scale[2] - 12, scale[4] - 12],
          [scale[3] - 12, scale[5] - 12, scale[0]],
          [scale[1] - 12, scale[3] - 12, scale[5] - 12],
          [scale[4] - 12, scale[6] - 12, scale[1]],
        ],
        lead: [scale[0], scale[2], scale[4], scale[5], scale[4], scale[2], scale[1], scale[0]],
      };

      const beatSec = 60 / Math.max(70, song.bpm || 140);
      const totalBeats = Math.floor((duration - 0.5) / beatSec);
      const isDemon = pattern.style === 'demon' || pattern.style === 'rave' || Boolean(song.demonOnly);

      const sectionAt = (pct: number) => {
        let lbl = 'INTRO';
        for (const cue of song.sections) {
          if (pct >= cue.startPct) lbl = cue.label;
        }
        return lbl;
      };

      // Deterministic noise table for crisp snares & hi-hats
      const noiseLen = Math.floor(sr * 0.2);
      const noise = new Float32Array(noiseLen);
      let seed = 0x13579bdf;
      for (let i = 0; i < noiseLen; i++) {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        noise[i] = (seed / 0xffffffff) * 2 - 1;
      }

      const twoPi = Math.PI * 2;
      const addKick = (startSec: number, gain: number) => {
        const idx0 = Math.floor(startSec * sr);
        const len = Math.floor(Math.min(0.26, beatSec * 0.85) * sr);
        let phase = 0;
        for (let i = 0; i < len && idx0 + i < totalSamples; i++) {
          const t = i / sr;
          const freq = 42 + (isDemon ? 128 : 102) * Math.exp(-t * 36);
          phase += (twoPi * freq) / sr;
          const env = Math.exp(-t * 14) * Math.min(1, t / 0.003);
          const s = Math.tanh(Math.sin(phase) * (isDemon ? 1.85 : 1.35)) * gain * env;
          outL[idx0 + i] += s;
          outR[idx0 + i] += s;
        }
      };

      const addSnare = (startSec: number, gain: number) => {
        const idx0 = Math.floor(startSec * sr);
        const len = Math.floor(0.15 * sr);
        let hpPrev = 0;
        let hpOut = 0;
        for (let i = 0; i < len && idx0 + i < totalSamples; i++) {
          const t = i / sr;
          const n = noise[i % noiseLen];
          hpOut = 0.82 * (hpOut + n - hpPrev);
          hpPrev = n;
          const body = Math.sin(twoPi * (190 - t * 420) * t) * Math.exp(-t * 28);
          const env = Math.exp(-t * 20) * Math.min(1, t / 0.002);
          const s = (hpOut * 0.65 + body * 0.45) * gain * env;
          outL[idx0 + i] += s;
          outR[idx0 + i] += s;
        }
      };

      const addHat = (startSec: number, gain: number, pan: number) => {
        const idx0 = Math.floor(startSec * sr);
        const len = Math.floor(0.048 * sr);
        let p0 = 0;
        let p1 = 0;
        let p2 = 0;
        const gL = gain * (1 - Math.max(0, pan) * 0.5);
        const gR = gain * (1 - Math.max(0, -pan) * 0.5);
        for (let i = 0; i < len && idx0 + i < totalSamples; i++) {
          const t = i / sr;
          const n = noise[(i + 97) % noiseLen];
          const hp = n - 2 * p1 + p0;
          p0 = p1;
          p1 = n;
          p2 = p2 * 0.35 + hp * 0.65;
          const env = Math.exp(-t * 68) * Math.min(1, t / 0.001);
          outL[idx0 + i] += p2 * gL * env;
          outR[idx0 + i] += p2 * gR * env;
        }
      };

      const addBass = (startSec: number, freq: number, durSec: number, gain: number, bright: boolean) => {
        const idx0 = Math.floor(startSec * sr);
        const len = Math.floor(durSec * sr);
        let phase = 0;
        let lp = 0;
        for (let i = 0; i < len && idx0 + i < totalSamples; i++) {
          const t = i / sr;
          phase = (phase + freq / sr) % 1;
          const saw = phase * 2 - 1;
          const sub = Math.sin(twoPi * phase);
          const cutoff = bright ? 0.38 : 0.2;
          lp += cutoff * (saw - lp);
          const env = Math.min(1, t / 0.008) * Math.exp((-t / durSec) * 2.2);
          const s = (lp * 0.65 + sub * 0.45) * gain * env;
          outL[idx0 + i] += s;
          outR[idx0 + i] += s;
        }
      };

      const addLead = (startSec: number, freq: number, durSec: number, gain: number, stereoPan: number, edgy: boolean) => {
        const idx0 = Math.floor(startSec * sr);
        const len = Math.floor(durSec * sr);
        let pL = 0;
        let pR = 0;
        const gL = gain * (0.72 - stereoPan * 0.25);
        const gR = gain * (0.72 + stereoPan * 0.25);
        for (let i = 0; i < len && idx0 + i < totalSamples; i++) {
          const t = i / sr;
          pL = (pL + (freq * 0.996) / sr) % 1;
          pR = (pR + (freq * 1.004) / sr) % 1;
          const waveL = edgy ? (pL < 0.5 ? 0.8 : -0.8) * 0.5 + (pL * 2 - 1) * 0.5 : Math.sin(twoPi * pL) * 0.65 + (pL * 2 - 1) * 0.35;
          const waveR = edgy ? (pR < 0.5 ? 0.8 : -0.8) * 0.5 + (pR * 2 - 1) * 0.5 : Math.sin(twoPi * pR) * 0.65 + (pR * 2 - 1) * 0.35;
          const env = Math.min(1, t / 0.006) * Math.exp((-t / durSec) * 3.1);
          outL[idx0 + i] += waveL * gL * env;
          outR[idx0 + i] += waveR * gR * env;
        }
      };

      for (let b = 0; b < totalBeats; b++) {
        const t = 0.25 + b * beatSec;
        const pct = t / duration;
        const sec = sectionAt(pct);
        const bar = Math.floor(b / 4);
        const beatInBar = b % 4;
        const chord = pattern.chords[bar % pattern.chords.length] || [50, 53, 57];
        const isDrop = sec === 'DROP';
        const isBuild = sec === 'BUILD-UP';
        const isBreak = sec === 'BREAKDOWN' || sec === 'OUTRO';

        if (!isBreak && (!isBuild || beatInBar % 2 === 0 || pct > 0.22)) {
          addKick(t, isDrop ? 0.44 : 0.35);
        }

        if ((beatInBar === 1 || beatInBar === 3) && sec !== 'INTRO' && sec !== 'OUTRO') {
          addSnare(t, isDrop ? 0.28 : 0.21);
        }

        const hatSub = isDrop ? 4 : isBuild ? 2 : 1;
        for (let h = 0; h < hatSub; h++) {
          const ht = t + (beatSec / hatSub) * h;
          if (ht >= duration - 0.3) break;
          if (!isDrop && h === 0 && sec === 'INTRO') continue;
          addHat(ht, h % 2 === 1 ? 0.12 : 0.08, (h % 2 === 0 ? -1 : 1) * 0.35);
        }

        const bassRoot = midiToFreq((chord[0] || 50) - 12);
        const bassSub = isDrop || isBuild ? 2 : 1;
        for (let s = 0; s < bassSub; s++) {
          const bt = t + (beatSec / bassSub) * s;
          if (bt >= duration - 0.3) break;
          addBass(bt, s === 1 ? bassRoot * 1.5 : bassRoot, (beatSec / bassSub) * 0.9, isBreak ? 0.14 : 0.26, isDrop);
        }

        if (beatInBar === 0 || (isDrop && beatInBar === 2)) {
          chord.slice(0, 3).forEach((midi, ci) => {
            addLead(
              t,
              midiToFreq(midi),
              isDrop ? beatSec * 1.65 : beatSec * 3.2,
              isDrop ? 0.095 : 0.07,
              (ci - 1) * 0.55,
              isDrop,
            );
          });
        }

        const leadNotes = pattern.lead;
        const arpSteps = isDrop ? 2 : isBreak ? 2 : 1;
        for (let a = 0; a < arpSteps; a++) {
          const at = t + (beatSec / arpSteps) * a;
          if (at >= duration - 0.3) break;
          const noteMidi = leadNotes[(b * arpSteps + a) % leadNotes.length] || 74;
          addLead(
            at,
            midiToFreq(noteMidi),
            Math.min(0.24, (beatSec / arpSteps) * 0.86),
            isDrop ? 0.13 : 0.095,
            a % 2 === 0 ? -0.25 : 0.25,
            isDrop || isDemon,
          );
        }
      }

      // Master soft-clip limiter pass
      for (let i = 0; i < totalSamples; i++) {
        outL[i] = Math.tanh(outL[i] * 0.95);
        outR[i] = Math.tanh(outR[i] * 0.95);
      }

      return buffer;
    } catch (err) {
      console.warn('Direct PCM synth fallback failed:', err);
      return null;
    }
  }

  async decodeCustomBufferForId(
    songId: string,
    arrayBuf: ArrayBuffer,
  ): Promise<DecodedCustomAudio | null> {
    const ctx = this.ensureContext();
    if (!ctx || arrayBuf.byteLength < 4096) return null;
    try {
      await saveCustomAudioBytes(songId, arrayBuf);
      const buffer = await ctx.decodeAudioData(arrayBuf.slice(0));
      this.bufferCache.set(songId, buffer);
      this.audioSourceMap.set(songId, 'indexeddb');
      const { estimatedBpm, onsets } = this.analyzeAudioBeats(buffer);
      return {
        buffer,
        durationSec: buffer.duration,
        estimatedBpm,
        onsets,
      };
    } catch (err) {
      console.warn('Custom audio decode failed:', err);
      return null;
    }
  }

  async decodeCustomFile(songId: string, file: File): Promise<DecodedCustomAudio | null> {
    try {
      const arrayBuf = await file.arrayBuffer();
      return await this.decodeCustomBufferForId(songId, arrayBuf);
    } catch (err) {
      console.warn('Custom audio file read failed:', err);
      return null;
    }
  }

  analyzeAudioBeats(buffer: AudioBuffer): { estimatedBpm: number; onsets: number[] } {
    const data = buffer.getChannelData(0);
    const sr = buffer.sampleRate;
    const hop = Math.floor(sr * 0.02);
    const energies: number[] = [];
    for (let i = 0; i < data.length; i += hop) {
      let sum = 0;
      const end = Math.min(data.length, i + hop);
      for (let j = i; j < end; j++) sum += data[j] * data[j];
      energies.push(Math.sqrt(sum / Math.max(1, end - i)));
    }
    const onsets: number[] = [];
    const win = 10;
    let lastOnset = -1;
    for (let i = win; i < energies.length; i++) {
      let avg = 0;
      for (let k = i - win; k < i; k++) avg += energies[k];
      avg /= win;
      const t = (i * hop) / sr;
      if (energies[i] > avg * 1.48 && energies[i] > 0.045 && t - lastOnset >= 0.24) {
        onsets.push(Number(t.toFixed(3)));
        lastOnset = t;
      }
    }
    let estimatedBpm = 124;
    if (onsets.length >= 8) {
      const intervals: number[] = [];
      for (let i = 1; i < Math.min(onsets.length, 90); i++) {
        const diff = onsets[i] - onsets[i - 1];
        if (diff >= 0.28 && diff <= 1.0) intervals.push(diff);
      }
      if (intervals.length > 0) {
        intervals.sort((a, b) => a - b);
        const median = intervals[Math.floor(intervals.length / 2)];
        let bpm = 60 / median;
        while (bpm < 86) bpm *= 2;
        while (bpm > 172) bpm /= 2;
        estimatedBpm = Math.round(bpm);
      }
    }
    return { estimatedBpm, onsets };
  }

  private teardownSource(src: AudioBufferSourceNode, gain: GainNode | null): void {
    const ctx = this.ctx;
    if (gain && ctx) {
      const now = ctx.currentTime;
      try {
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);
        src.stop(now + 0.03);
      } catch {
        try {
          src.stop();
        } catch {
          // Ignore
        }
      }
      window.setTimeout(() => {
        try {
          src.disconnect();
          gain.disconnect();
        } catch {
          // Ignore
        }
      }, 45);
    } else {
      try {
        src.stop();
        src.disconnect();
      } catch {
        // Ignore
      }
    }
  }

  stop(): void {
    this.stopHoldShimmer();
    this.playSessionId += 1;
    this.activeSongId = null;
    this.loadingSongId = null;
    this.activeBufferDuration = 0;
    this.activeLoop = false;
    if (this.activeSource) {
      this.teardownSource(this.activeSource, this.activeSourceGain);
    }
    this.activeSource = null;
    this.activeSourceGain = null;
    this.playing = false;
  }

  private launchBufferNode(
    ctx: AudioContext,
    buffer: AudioBuffer,
    offsetSec: number,
    loop: boolean,
    previewGainScale: number,
    playbackRate = 1.0,
  ): number {
    const safeOffset = Math.max(0, Math.min(offsetSec, Math.max(0, buffer.duration - 0.15)));
    const safeRate = Math.max(0.25, Math.min(3.0, playbackRate));
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = loop;
    src.playbackRate.setValueAtTime(safeRate, ctx.currentTime);
    this.activePlaybackRate = safeRate;

    const srcGain = ctx.createGain();
    const now = ctx.currentTime;
    srcGain.gain.setValueAtTime(0.0001, now);
    srcGain.gain.linearRampToValueAtTime(previewGainScale, now + 0.025);
    src.connect(srcGain);
    if (this.musicGain) srcGain.connect(this.musicGain);

    src.onended = () => {
      try {
        src.disconnect();
        srcGain.disconnect();
      } catch {
        // Ignore
      }
      if (this.activeSource === src) {
        this.activeSource = null;
        this.activeSourceGain = null;
        this.playing = false;
      }
    };

    this.activeSource = src;
    this.activeSourceGain = srcGain;
    this.activeBufferDuration = buffer.duration;
    this.activeLoop = loop;
    this.playing = true;
    this.startedAtCtxTime = now;
    this.startOffsetSec = safeOffset;
    src.start(now, safeOffset);

    return buffer.duration;
  }

  async startAtOffset(
    song: SongDefinition,
    offsetSec: number,
    musicEnabled: boolean,
    musicVol: number,
    soundEnabled: boolean,
    sfxVol: number,
    loop = false,
    previewGainScale = 1.0,
    playbackRate = 1.0,
  ): Promise<number | null> {
    const ctx = this.ensureContext();
    if (!ctx) return null;
    this.stop();
    // Avoid racing/decoding looped menu previews when music is explicitly muted
    if (loop && !musicEnabled) {
      return null;
    }
    const mySession = this.playSessionId;
    this.activeSongId = song.id;
    this.loadingSongId = song.id;

    // Fast-path synchronous launch if context is running & buffer is cached: eliminates pause/resume drift!
    const cachedBuf = this.bufferCache.get(song.id);
    if (cachedBuf && ctx.state === 'running') {
      this.loadingSongId = null;
      this.updateVolumes(musicEnabled, musicVol, soundEnabled, sfxVol);
      return this.launchBufferNode(ctx, cachedBuf, offsetSec, loop, previewGainScale, playbackRate);
    }

    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        // Continue cleanly
      }
    }
    if (this.playSessionId !== mySession || this.activeSongId !== song.id) {
      return null;
    }

    this.updateVolumes(musicEnabled, musicVol, soundEnabled, sfxVol);
    const buffer = cachedBuf || (await this.loadSongBuffer(song));
    this.loadingSongId = null;
    if (!buffer || this.playSessionId !== mySession || this.activeSongId !== song.id) {
      return null;
    }

    return this.launchBufferNode(ctx, buffer, offsetSec, loop, previewGainScale, playbackRate);
  }

  syncClockAtPerfTime(perfMs: number = performance.now()): number | null {
    if (!this.playing || !this.ctx || this.ctx.state !== 'running') return null;

    let effectiveCtxTime = this.ctx.currentTime;
    const latencySec =
      typeof (this.ctx as AudioContext & { outputLatency?: number }).outputLatency === 'number' &&
      (this.ctx as AudioContext & { outputLatency?: number }).outputLatency! > 0
        ? (this.ctx as AudioContext & { outputLatency?: number }).outputLatency!
        : this.ctx.baseLatency || 0;

    if (typeof this.ctx.getOutputTimestamp === 'function') {
      try {
        const ts = this.ctx.getOutputTimestamp();
        if (
          ts &&
          typeof ts.contextTime === 'number' &&
          typeof ts.performanceTime === 'number' &&
          ts.contextTime > 0 &&
          ts.performanceTime > 0
        ) {
          // Clamp extrapolation cleanly so tab suspend/resume never causes multi-second clock jumps
          const deltaPerfSec = Math.max(0, Math.min(0.25, (perfMs - ts.performanceTime) / 1000));
          effectiveCtxTime = ts.contextTime + deltaPerfSec;
        } else {
          effectiveCtxTime = this.ctx.currentTime - latencySec;
        }
      } catch {
        effectiveCtxTime = this.ctx.currentTime - latencySec;
      }
    } else {
      effectiveCtxTime = this.ctx.currentTime - latencySec;
    }

    const elapsedCtx = Math.max(0, effectiveCtxTime - this.startedAtCtxTime);
    const raw = this.startOffsetSec + elapsedCtx * this.activePlaybackRate;
    if (this.activeLoop && this.activeBufferDuration > 0.2) {
      return raw % this.activeBufferDuration;
    }
    return raw;
  }

  syncClock(): number | null {
    return this.syncClockAtPerfTime(performance.now());
  }

  getReportedLatencyMs(): number {
    if (!this.ctx) return 0;
    const outLat =
      typeof (this.ctx as AudioContext & { outputLatency?: number }).outputLatency === 'number'
        ? (this.ctx as AudioContext & { outputLatency?: number }).outputLatency!
        : 0;
    const lat = outLat > 0 ? outLat : this.ctx.baseLatency || 0;
    return Math.round(lat * 1000);
  }

  isPlaying(): boolean {
    return this.playing;
  }

  isLoading(): boolean {
    return this.loadingSongId !== null;
  }

  getActiveSongId(): string | null {
    return this.activeSongId;
  }

  getBassEnergy(): number {
    if (!this.analyser || !this.freqBins || !this.playing) return 0;
    this.analyser.getByteFrequencyData(this.freqBins);
    let sum = 0;
    const count = Math.min(5, this.freqBins.length);
    for (let i = 0; i < count; i++) sum += this.freqBins[i];
    return Math.min(1, sum / (count * 255));
  }

  getSpectrumBins(outBins: Float32Array): boolean {
    if (!this.analyser || !this.freqBins || !this.playing) {
      outBins.fill(0);
      return false;
    }
    this.analyser.getByteFrequencyData(this.freqBins);
    const len = outBins.length;
    const maxSrc = Math.max(1, Math.min(this.freqBins.length, 24));
    for (let i = 0; i < len; i++) {
      const srcIdx = Math.floor((i / len) * maxSrc);
      outBins[i] = this.freqBins[srcIdx] / 255;
    }
    return true;
  }

  private getSfxNoise(): AudioBuffer | null {
    if (this.sfxNoiseBuffer || !this.ctx) return this.sfxNoiseBuffer;
    const len = Math.floor(this.ctx.sampleRate * 0.03);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.35));
    }
    this.sfxNoiseBuffer = buf;
    return buf;
  }

  private getReadySfxCtx(allowResume: boolean): AudioContext | null {
    const ctx = allowResume ? this.ensureContext() : this.ctx;
    if (!ctx || !this.sfxGain) return null;
    if (ctx.state !== 'running') return null;
    return ctx;
  }

  startHoldShimmer(enabled: boolean, scaleNotes: number[], combo: number): void {
    this.stopHoldShimmer();
    if (!enabled) return;
    const ctx = this.getReadySfxCtx(true);
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const scale = scaleNotes.length > 0 ? scaleNotes : [60, 62, 64, 67, 69, 72];
    const baseMidi = scale[combo % scale.length];
    const f1 = midiToFreq(baseMidi);
    const f2 = midiToFreq(baseMidi + 7);

    const osc = ctx.createOscillator();
    const sub = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    sub.type = 'triangle';
    osc.frequency.setValueAtTime(f1, now);
    sub.frequency.setValueAtTime(f2, now);

    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(0.085, now + 0.04);

    osc.connect(g);
    sub.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    sub.start(now);

    this.holdOsc = osc;
    this.holdSubOsc = sub;
    this.holdGain = g;
  }

  updateHoldShimmer(progressRatio: number): void {
    if (!this.ctx || !this.holdOsc || !this.holdSubOsc) return;
    const now = this.ctx.currentTime;
    const lift = 1 + Math.max(0, Math.min(1, progressRatio)) * 0.045;
    try {
      this.holdOsc.detune.setTargetAtTime((lift - 1) * 600, now, 0.03);
      this.holdSubOsc.detune.setTargetAtTime((lift - 1) * 900, now, 0.03);
    } catch {
      // Ignore
    }
  }

  stopHoldShimmer(): void {
    if (!this.ctx || !this.holdGain) {
      this.holdOsc = null;
      this.holdSubOsc = null;
      this.holdGain = null;
      return;
    }
    const now = this.ctx.currentTime;
    const osc = this.holdOsc;
    const sub = this.holdSubOsc;
    const g = this.holdGain;
    this.holdOsc = null;
    this.holdSubOsc = null;
    this.holdGain = null;
    try {
      g.gain.cancelScheduledValues(now);
      g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
      osc?.stop(now + 0.05);
      sub?.stop(now + 0.05);
    } catch {
      // Ignore
    }
  }

  playFeverTap(enabled: boolean, progressRatio: number): void {
    if (!enabled) return;
    const ctx = this.getReadySfxCtx(true);
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    const pitch = 420 + Math.min(1, progressRatio) * 520;
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(pitch * 1.18, now + 0.05);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(0.14, now + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.065);
  }

  playHit(
    enabled: boolean,
    mode: HitSfxMode,
    combo: number,
    isPerfect: boolean,
    scaleNotes: number[],
  ): void {
    if (!enabled) return;
    const ctx = this.getReadySfxCtx(true);
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const scale = scaleNotes.length > 0 ? scaleNotes : [60, 62, 64, 67, 69, 72];
    const midi = scale[combo % scale.length] + (isPerfect ? 12 : 0);
    const harmonicFreq = midiToFreq(midi);

    if (mode === 'harmonic') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(harmonicFreq, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.22, now + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.15);
      return;
    }

    if (mode === 'rimshot') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isPerfect ? 540 : 440, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.032);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.24, now + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.045);
      return;
    }

    const thock = ctx.createOscillator();
    const thockGain = ctx.createGain();
    thock.type = 'sine';
    thock.frequency.setValueAtTime(isPerfect ? 345 : 280, now);
    thock.frequency.exponentialRampToValueAtTime(72, now + 0.036);
    thockGain.gain.setValueAtTime(0.0001, now);
    thockGain.gain.linearRampToValueAtTime(0.24, now + 0.004);
    thockGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.044);
    thock.connect(thockGain);
    thockGain.connect(this.sfxGain);
    thock.start(now);
    thock.stop(now + 0.048);

    const ping = ctx.createOscillator();
    const pingGain = ctx.createGain();
    ping.type = 'sine';
    ping.frequency.setValueAtTime(harmonicFreq, now);
    pingGain.gain.setValueAtTime(0.0001, now);
    pingGain.gain.linearRampToValueAtTime(isPerfect ? 0.075 : 0.042, now + 0.005);
    pingGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.075);
    ping.connect(pingGain);
    pingGain.connect(this.sfxGain);
    ping.start(now);
    ping.stop(now + 0.08);

    const nb = this.getSfxNoise();
    if (nb) {
      const nSrc = ctx.createBufferSource();
      nSrc.buffer = nb;
      const nGain = ctx.createGain();
      nGain.gain.setValueAtTime(0.09, now);
      nGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.018);
      nSrc.connect(nGain);
      nGain.connect(this.sfxGain);
      nSrc.start(now);
      nSrc.stop(now + 0.022);
    }
  }

  playLessonSlowCue(enabled: boolean): void {
    if (!enabled) return;
    const ctx = this.getReadySfxCtx(true);
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.22);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  playShieldBreak(enabled: boolean): void {
    if (!enabled) return;
    const ctx = this.getReadySfxCtx(true);
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.18);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.16, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.19);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  playMiss(enabled: boolean): void {
    if (!enabled) return;
    const ctx = this.getReadySfxCtx(true);
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    [185, 130].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.0001, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.15, now + idx * 0.08 + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.22);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.24);
    });
  }

  playUiTick(enabled: boolean): void {
    if (!enabled) return;
    const ctx = this.getReadySfxCtx(false);
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(680, now);
    osc.frequency.exponentialRampToValueAtTime(920, now + 0.025);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.075, now + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.032);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.036);
  }

  playUiLaunch(enabled: boolean): void {
    if (!enabled) return;
    const ctx = this.getReadySfxCtx(true);
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    [330, 495, 660].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.035);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.15, now + idx * 0.035 + 0.14);
      gain.gain.setValueAtTime(0.0001, now + idx * 0.035);
      gain.gain.linearRampToValueAtTime(0.11, now + idx * 0.035 + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.035 + 0.16);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + idx * 0.035);
      osc.stop(now + idx * 0.035 + 0.18);
    });
  }

  playComboMilestone(enabled: boolean, tier: 1 | 2 | 3): void {
    if (!enabled) return;
    const ctx = this.getReadySfxCtx(true);
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const base = tier === 3 ? 880 : tier === 2 ? 740 : 587.33;
    [base, base * 1.5].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.045);
      gain.gain.setValueAtTime(0.0001, now + idx * 0.045);
      gain.gain.linearRampToValueAtTime(0.1, now + idx * 0.045 + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.045 + 0.18);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + idx * 0.045);
      osc.stop(now + idx * 0.045 + 0.2);
    });
  }

  playLevelClear(enabled: boolean): void {
    if (!enabled) return;
    const ctx = this.getReadySfxCtx(true);
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.075);
      gain.gain.setValueAtTime(0.0001, now + idx * 0.075);
      gain.gain.linearRampToValueAtTime(0.16, now + idx * 0.075 + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.075 + 0.24);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + idx * 0.075);
      osc.stop(now + idx * 0.075 + 0.26);
    });
  }

  playCalibrationClick(accent: boolean): number {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return performance.now();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = accent ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(accent ? 1180 : 820, now);
    osc.frequency.exponentialRampToValueAtTime(accent ? 640 : 480, now + 0.032);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(accent ? 0.26 : 0.18, now + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.06);
    return performance.now() + this.getReportedLatencyMs();
  }

  playOverdriveIgnite(enabled: boolean): void {
    if (!enabled) return;
    const ctx = this.getReadySfxCtx(true);
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    // Blazing anime ignition rising triad + harmonic shimmer
    [392.0, 523.25, 659.25, 1046.5].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq * 0.92, now + idx * 0.032);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.06, now + idx * 0.032 + 0.24);
      gain.gain.setValueAtTime(0.0001, now + idx * 0.032);
      gain.gain.linearRampToValueAtTime(0.11, now + idx * 0.032 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.032 + 0.28);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + idx * 0.032);
      osc.stop(now + idx * 0.032 + 0.3);
    });
  }

  playCheckpointSound(enabled: boolean): void {
    if (!enabled) return;
    const ctx = this.getReadySfxCtx(true);
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(784, now);
    osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.06);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.13, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  getAudioBands(): AudioBands {
    if (!this.playing || !this.analyser || !this.freqBins) {
      return orbitWasm.analyzeFrequencyData(new Uint8Array(0));
    }
    this.analyser.getByteFrequencyData(this.freqBins);
    return orbitWasm.analyzeFrequencyData(this.freqBins);
  }
}

export const audioEngine = new OrbitAudioEngine();
