import React, { useMemo, useRef, useState } from 'react';
import {
  Activity,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  Wand2,
} from 'lucide-react';
import { audioEngine } from '../../audio/audioEngine';
import { DIFFICULTY_ORDER, HERO_DISCO_IMAGE, WAVE_MODES } from '../../data/catalog';
import { buildSongBeatmap, formatTimeSec } from '../../engine/beatmap';
import { compressImageToDataUrl, loadCustomAudioBytes } from '../../store/mediaVaultStore';
import {
  BeatmapNote,
  DevAssetItem,
  DifficultyId,
  PlayerProfile,
  SongCategory,
  SongDefinition,
  SongSection,
  WaveModeId,
} from '../../types/game';

interface SongForgePanelProps {
  songs: SongDefinition[];
  selectedSongId: string;
  assets: DevAssetItem[];
  profile: PlayerProfile;
  onSaveSongDraft: (song: SongDefinition) => void;
  onSelectSong: (songId: string) => void;
  onPlaytestSong: (song: SongDefinition, startOffsetSec?: number) => void;
}

export const SongForgePanel: React.FC<SongForgePanelProps> = ({
  songs,
  selectedSongId,
  assets,
  profile,
  onSaveSongDraft,
  onSelectSong,
  onPlaytestSong,
}) => {
  const [cursorSec, setCursorSec] = useState(2.0);
  const [paintMode, setPaintMode] = useState<WaveModeId>('CW_GREEN');
  const [selectedNoteIdx, setSelectedNoteIdx] = useState<number | null>(null);
  const [seedDiff, setSeedDiff] = useState<DifficultyId>('NORMAL');
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [audioHealthVersion, setAudioHealthVersion] = useState(0);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const mp3Ref = useRef<HTMLInputElement | null>(null);
  const coverRef = useRef<HTMLInputElement | null>(null);

  const song = useMemo(
    () => songs.find((s) => s.id === selectedSongId) || songs[0],
    [songs, selectedSongId],
  );
  const imageAssets = useMemo(() => assets.filter((a) => a.kind === 'image'), [assets]);
  const audioAssets = useMemo(() => assets.filter((a) => a.kind === 'audio'), [assets]);

  const audioSource = useMemo(() => {
    void audioHealthVersion;
    return audioEngine.getTrackAudioSource(song.id);
  }, [song.id, audioHealthVersion]);

  const notes = song.customBeatmap || [];
  const selectedNote =
    selectedNoteIdx !== null && notes[selectedNoteIdx] ? notes[selectedNoteIdx] : null;

  const updateSong = (patch: Partial<SongDefinition>) => {
    onSaveSongDraft({
      ...song,
      ...patch,
      status: 'draft',
    });
  };

  const handleCheckAudio = async () => {
    setStatusMsg('Checking audio buffer...');
    audioEngine.clearBufferedSong(song.id);
    const buf = await audioEngine.loadSongBuffer(song);
    setAudioHealthVersion((v) => v + 1);
    if (buf) {
      const src = audioEngine.getTrackAudioSource(song.id);
      setStatusMsg(
        `Loaded (${src.toUpperCase()}) · ${buf.duration.toFixed(1)}s`,
      );
      if (Math.abs(buf.duration - song.durationSec) > 1.5 && src !== 'synth') {
        updateSong({ durationSec: Number(buf.duration.toFixed(2)) });
      }
    } else {
      setStatusMsg('Audio failed to initialize.');
    }
  };

  const handleCreateSong = () => {
    const slug = `custom_track_${Date.now().toString().slice(-5)}`;
    const newSong: SongDefinition = {
      id: slug,
      num: 'DEV',
      newgroundsId: slug,
      title: `New Studio Track ${songs.length + 1}`,
      artist: 'Orbit Dev',
      genre: 'Electronic',
      category: 'custom',
      bpm: 132,
      keySig: 'C MIN',
      scaleNotes: [60, 62, 63, 67, 68, 72],
      durationSec: 120,
      audioUrl: '',
      bgImageUrl: HERO_DISCO_IMAGE,
      orbCost: 0,
      chillOnly: false,
      isCustom: true,
      status: 'draft',
      stars: { CHILL: '1.5★', NORMAL: '3.0★', HARD: '4.5★', INSANE: '6.0★', DEMON: '7.5★' },
      desc: 'Authored in Axiom Dev Studio.',
      sections: [
        { startPct: 0, label: 'INTRO' },
        { startPct: 0.25, label: 'BUILD-UP' },
        { startPct: 0.45, label: 'DROP' },
        { startPct: 0.85, label: 'OUTRO' },
      ],
      customBeatmap: [],
    };
    onSaveSongDraft(newSong);
    onSelectSong(slug);
    setSelectedNoteIdx(null);
  };

  const handleUploadMp3 = async (file: File | undefined) => {
    if (!file) return;
    setStatusMsg('Decoding & saving MP3 to Vault...');
    const decoded = await audioEngine.decodeCustomFile(song.id, file);
    setAudioHealthVersion((v) => v + 1);
    if (!decoded) {
      setStatusMsg('Invalid or corrupted MP3 file.');
      return;
    }
    updateSong({
      isCustom: true,
      durationSec: Number(decoded.durationSec.toFixed(2)),
      bpm: decoded.estimatedBpm,
      customOnsets: decoded.onsets,
    });
    setStatusMsg(
      `Saved to Vault · ${decoded.durationSec.toFixed(1)}s · ~${decoded.estimatedBpm} BPM (${decoded.onsets.length} hits)`,
    );
    if (mp3Ref.current) mp3Ref.current.value = '';
  };

  const handleAssignVaultAudio = async (assetId: string) => {
    const asset = audioAssets.find((a) => a.id === assetId);
    if (!asset) return;
    const rawKey = asset.dataUrlOrPath.startsWith('idb://')
      ? asset.dataUrlOrPath.slice(6)
      : asset.id;
    const bytes = await loadCustomAudioBytes(rawKey);
    if (!bytes) {
      setStatusMsg('Audio bytes not found in local IndexedDB Vault.');
      return;
    }
    const decoded = await audioEngine.decodeCustomBufferForId(song.id, bytes);
    setAudioHealthVersion((v) => v + 1);
    if (decoded) {
      updateSong({
        isCustom: true,
        durationSec: Number(decoded.durationSec.toFixed(2)),
        bpm: decoded.estimatedBpm,
        customOnsets: decoded.onsets,
      });
      setStatusMsg(`Assigned ${asset.name} (${decoded.durationSec.toFixed(1)}s)`);
    }
  };

  const handleUploadCover = async (file: File | undefined) => {
    if (!file) return;
    const compressed = await compressImageToDataUrl(file, 960, 150000);
    updateSong({ bgImageUrl: compressed.dataUrl });
    if (coverRef.current) coverRef.current.value = '';
  };

  const handleSeedFromGenerator = () => {
    const generated = buildSongBeatmap(
      { ...song, customBeatmap: undefined },
      seedDiff,
      [],
    );
    updateSong({ customBeatmap: generated });
    setSelectedNoteIdx(null);
    setStatusMsg(`Seeded ${generated.length} notes from ${seedDiff} chart.`);
  };

  const handleAddNoteAtCursor = () => {
    const t = Math.max(0.5, Math.min(song.durationSec - 0.5, Number(cursorSec.toFixed(3))));
    const prog = t / Math.max(1, song.durationSec);
    let section: SongSection = 'INTRO';
    for (const s of song.sections) {
      if (prog >= s.startPct) section = s.label;
    }
    const newNote: BeatmapNote = {
      index: notes.length,
      hitTime: t,
      stepSec: 0.5,
      modeId: paintMode,
      section,
      energy: 0.78,
      holdDurationSec: paintMode === 'HOLD_ARC' ? 1.2 : undefined,
      burstCount: paintMode === 'BEAT_BURST' ? 3 : paintMode === 'DOUBLE_TAP' ? 2 : undefined,
    };
    const next = [...notes, newNote]
      .sort((a, b) => a.hitTime - b.hitTime)
      .map((n, idx, arr) => ({
        ...n,
        index: idx,
        stepSec: arr[idx + 1] ? Math.max(0.2, Number((arr[idx + 1].hitTime - n.hitTime).toFixed(3))) : 0.8,
      }));
    const newIdx = next.findIndex((n) => n.hitTime === t && n.modeId === paintMode);
    updateSong({ customBeatmap: next });
    setSelectedNoteIdx(newIdx >= 0 ? newIdx : null);
  };

  const handleUpdateNote = (idx: number, patch: Partial<BeatmapNote>) => {
    const next = notes
      .map((n, i) => (i === idx ? { ...n, ...patch } : n))
      .sort((a, b) => a.hitTime - b.hitTime)
      .map((n, i) => ({ ...n, index: i }));
    updateSong({ customBeatmap: next });
  };

  const handleDeleteNote = (idx: number) => {
    const next = notes.filter((_, i) => i !== idx).map((n, i) => ({ ...n, index: i }));
    updateSong({ customBeatmap: next });
    setSelectedNoteIdx(null);
  };

  const toggleTimelineAudio = async () => {
    if (previewPlaying) {
      audioEngine.stop();
      setPreviewPlaying(false);
    } else {
      setPreviewPlaying(true);
      await audioEngine.startAtOffset(
        song,
        cursorSec,
        true,
        profile.musicVolume,
        profile.soundEnabled,
        profile.sfxVolume,
        false,
        0.9,
        1.0,
      );
      setAudioHealthVersion((v) => v + 1);
    }
  };

  const windowStart = Math.max(0, cursorSec - 6);
  const windowEnd = Math.min(song.durationSec, windowStart + 14);
  const windowSpan = Math.max(4, windowEnd - windowStart);
  const visibleNotes = notes
    .map((n, idx) => ({ n, idx }))
    .filter(({ n }) => n.hitTime >= windowStart && n.hitTime <= windowEnd);

  return (
    <div className="space-y-3 text-xs text-slate-200">
      {/* Track Selector + Audio Health */}
      <div className="border border-slate-700 bg-slate-800/80 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#38BDF8]">
            Song &amp; Beatmap Forge
          </span>
          <button
            type="button"
            onClick={handleCreateSong}
            className="flex items-center gap-1 border border-[#38BDF8]/60 bg-[#38BDF8]/15 px-2 py-1 font-bold text-[#38BDF8] hover:bg-[#38BDF8]/25 cursor-pointer"
          >
            <Plus className="h-3 w-3" />
            <span>New Track</span>
          </button>
        </div>

        <select
          value={song.id}
          onChange={(e) => {
            onSelectSong(e.target.value);
            setSelectedNoteIdx(null);
            setCursorSec(2);
          }}
          className="w-full border border-slate-600 bg-slate-900 px-2.5 py-1.5 font-semibold text-white"
        >
          {songs.map((s) => (
            <option key={s.id} value={s.id}>
              {s.num} · {s.title} {s.status === 'draft' ? '• DRAFT' : ''}
            </option>
          ))}
        </select>

        {/* Audio Source Health */}
        <div className="flex items-center justify-between border border-slate-700 bg-slate-900 px-2.5 py-1.5">
          <div className="flex items-center gap-1.5">
            <Activity
              className={`h-3.5 w-3.5 ${
                audioSource === 'mp3' || audioSource === 'indexeddb'
                  ? 'text-emerald-400'
                  : audioSource === 'synth'
                  ? 'text-amber-400'
                  : 'text-slate-400'
              }`}
            />
            <span className="font-mono text-[10px] font-bold uppercase text-slate-200">
              Audio: {audioSource.toUpperCase()}
            </span>
          </div>
          <button
            type="button"
            onClick={() => void handleCheckAudio()}
            className="flex items-center gap-1 border border-slate-600 bg-slate-800 px-2 py-0.5 text-[10px] text-slate-200 hover:border-[#38BDF8] cursor-pointer"
          >
            <RefreshCw className="h-2.5 w-2.5" /> Verify Audio
          </button>
        </div>
        {statusMsg && <p className="font-mono text-[10px] text-[#38BDF8]">{statusMsg}</p>}
      </div>

      {/* Metadata & MP3 / Cover */}
      <div className="border border-slate-700 bg-slate-800/60 p-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-0.5">
            <span className="text-[10px] text-slate-400">Track Title</span>
            <input
              type="text"
              value={song.title}
              onChange={(e) => updateSong({ title: e.target.value })}
              className="w-full border border-slate-600 bg-slate-900 px-2 py-1 text-white"
            />
          </label>
          <label className="space-y-0.5">
            <span className="text-[10px] text-slate-400">Artist</span>
            <input
              type="text"
              value={song.artist}
              onChange={(e) => updateSong({ artist: e.target.value })}
              className="w-full border border-slate-600 bg-slate-900 px-2 py-1 text-white"
            />
          </label>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <label className="space-y-0.5">
            <span className="text-[10px] text-slate-400">BPM</span>
            <input
              type="number"
              min={40}
              max={360}
              value={song.bpm}
              onChange={(e) => updateSong({ bpm: Math.max(40, Number(e.target.value) || 120) })}
              className="tabular-nums w-full border border-slate-600 bg-slate-900 px-2 py-1 text-white"
            />
          </label>
          <label className="space-y-0.5">
            <span className="text-[10px] text-slate-400">Duration (s)</span>
            <input
              type="number"
              min={5}
              max={900}
              value={song.durationSec}
              onChange={(e) =>
                updateSong({ durationSec: Math.max(5, Number(e.target.value) || 60) })
              }
              className="tabular-nums w-full border border-slate-600 bg-slate-900 px-2 py-1 text-white"
            />
          </label>
          <label className="space-y-0.5">
            <span className="text-[10px] text-slate-400">Category</span>
            <select
              value={song.category}
              onChange={(e) => updateSong({ category: e.target.value as SongCategory })}
              className="w-full border border-slate-600 bg-slate-900 px-1.5 py-1 text-[11px] text-white"
            >
              <option value="custom">Custom</option>
              <option value="electronic">Electronic</option>
              <option value="arcade">Arcade</option>
              <option value="christmas">Christmas</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="tutorial">Tutorial</option>
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => mp3Ref.current?.click()}
            className="flex items-center justify-center gap-1.5 border border-[#38BDF8]/50 bg-[#38BDF8]/15 py-1.5 font-bold text-[#38BDF8] hover:bg-[#38BDF8]/25 cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5" /> Upload MP3
          </button>
          <button
            type="button"
            onClick={() => coverRef.current?.click()}
            className="flex items-center justify-center gap-1.5 border border-slate-600 bg-slate-900 py-1.5 font-bold text-slate-200 hover:border-slate-400 cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5" /> Cover Art
          </button>
          <input
            ref={mp3Ref}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => void handleUploadMp3(e.target.files?.[0])}
          />
          <input
            ref={coverRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void handleUploadCover(e.target.files?.[0])}
          />
        </div>

        {audioAssets.length > 0 && (
          <select
            value=""
            onChange={(e) => void handleAssignVaultAudio(e.target.value)}
            className="w-full border border-slate-600 bg-slate-900 px-2 py-1 text-[10px] text-slate-200"
          >
            <option value="">Attach MP3 from Asset Vault...</option>
            {audioAssets.map((a) => (
              <option key={a.id} value={a.id}>
                /{a.folder}/{a.name}
              </option>
            ))}
          </select>
        )}

        {imageAssets.length > 0 && (
          <select
            value=""
            onChange={(e) => {
              const found = imageAssets.find((a) => a.id === e.target.value);
              if (found) updateSong({ bgImageUrl: found.dataUrlOrPath });
            }}
            className="w-full border border-slate-600 bg-slate-900 px-2 py-1 text-[10px] text-slate-200"
          >
            <option value="">Attach Cover Art from Asset Vault...</option>
            {imageAssets.map((a) => (
              <option key={a.id} value={a.id}>
                /{a.folder}/{a.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Interactive Beatmap Timeline Painter */}
      <div className="border border-slate-700 bg-slate-800/70 p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] font-bold uppercase text-[#38BDF8]">
            Timeline Chart Painter ({notes.length} authored notes)
          </span>
          <button
            type="button"
            onClick={() => onPlaytestSong(song, Math.max(0, cursorSec - 1))}
            className="border border-emerald-400/60 bg-emerald-500/20 px-2 py-0.5 font-bold text-emerald-300 hover:bg-emerald-500/30 cursor-pointer"
          >
            Playtest Stage
          </button>
        </div>

        {/* Seed from Auto Generator */}
        <div className="flex items-center gap-1.5">
          <select
            value={seedDiff}
            onChange={(e) => setSeedDiff(e.target.value as DifficultyId)}
            className="border border-slate-600 bg-slate-900 px-2 py-1 text-[10px] text-white"
          >
            {DIFFICULTY_ORDER.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleSeedFromGenerator}
            className="flex flex-1 items-center justify-center gap-1 border border-slate-600 bg-slate-900 py-1 text-[10px] font-bold text-slate-200 hover:border-[#38BDF8] cursor-pointer"
          >
            <Wand2 className="h-3 w-3 text-[#38BDF8]" />
            <span>Seed Notes From Auto Chart</span>
          </button>
        </div>

        {/* Cursor Scrubber + Audio Listen */}
        <div className="space-y-1 border-t border-slate-700 pt-2">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => void toggleTimelineAudio()}
              className="flex items-center gap-1 border border-slate-600 bg-slate-900 px-2 py-1 text-[10px] font-bold text-white cursor-pointer"
            >
              {previewPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              <span>{previewPlaying ? 'Stop' : 'Listen @ Cursor'}</span>
            </button>
            <span className="tabular-nums font-mono text-[11px] font-bold text-[#38BDF8]">
              {cursorSec.toFixed(2)}s / {formatTimeSec(song.durationSec)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={Math.max(5, song.durationSec)}
            step={0.05}
            value={cursorSec}
            onChange={(e) => setCursorSec(Number(e.target.value))}
            className="w-full accent-[#38BDF8]"
          />
        </div>

        {/* Visual Note Strip (14s window around cursor) */}
        <div className="relative h-14 w-full overflow-hidden border border-slate-700 bg-slate-950 select-none">
          <div
            className="pointer-events-none absolute top-0 bottom-0 w-0.5 bg-[#38BDF8] z-20"
            style={{
              left: `${((cursorSec - windowStart) / windowSpan) * 100}%`,
            }}
          />
          {visibleNotes.map(({ n, idx }) => {
            const pct = ((n.hitTime - windowStart) / windowSpan) * 100;
            const wm = WAVE_MODES.find((w) => w.id === n.modeId);
            const active = selectedNoteIdx === idx;
            return (
              <button
                key={`${n.hitTime}-${idx}`}
                type="button"
                onClick={() => {
                  setSelectedNoteIdx(idx);
                  setCursorSec(n.hitTime);
                }}
                title={`${n.hitTime.toFixed(2)}s · ${n.modeId}`}
                className={`absolute top-2 bottom-2 w-2.5 -translate-x-1/2 cursor-pointer transition-transform ${
                  active ? 'scale-125 ring-2 ring-white z-30' : 'opacity-85 hover:opacity-100'
                }`}
                style={{
                  left: `${pct}%`,
                  backgroundColor: wm?.color || '#38BDF8',
                }}
              />
            );
          })}
          <div className="pointer-events-none absolute bottom-0.5 left-1 font-mono text-[9px] text-slate-500">
            {windowStart.toFixed(1)}s
          </div>
          <div className="pointer-events-none absolute bottom-0.5 right-1 font-mono text-[9px] text-slate-500">
            {windowEnd.toFixed(1)}s
          </div>
        </div>

        {/* Paint Tool */}
        <div className="flex items-center gap-1.5">
          <select
            value={paintMode}
            onChange={(e) => setPaintMode(e.target.value as WaveModeId)}
            className="flex-1 border border-slate-600 bg-slate-900 px-2 py-1 text-[11px] text-white"
          >
            {WAVE_MODES.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.id})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAddNoteAtCursor}
            className="flex items-center gap-1 border border-[#38BDF8] bg-[#38BDF8]/20 px-2.5 py-1 font-bold text-white hover:bg-[#38BDF8]/30 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> Note
          </button>
        </div>

        {/* Selected Note Editor */}
        {selectedNote && selectedNoteIdx !== null && (
          <div className="border border-[#38BDF8]/50 bg-slate-900/90 p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-[#38BDF8]">
                Note #{selectedNoteIdx + 1}
              </span>
              <button
                type="button"
                onClick={() => handleDeleteNote(selectedNoteIdx)}
                className="flex items-center gap-1 text-[10px] text-rose-400 hover:text-rose-200 cursor-pointer"
              >
                <Trash2 className="h-3 w-3" /> Delete
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-0.5">
                <span className="text-[9px] text-slate-400">Hit Time (s)</span>
                <input
                  type="number"
                  step={0.02}
                  min={0.2}
                  max={song.durationSec}
                  value={selectedNote.hitTime}
                  onChange={(e) =>
                    handleUpdateNote(selectedNoteIdx, {
                      hitTime: Math.max(0.2, Number(e.target.value) || 0.2),
                    })
                  }
                  className="tabular-nums w-full border border-slate-600 bg-slate-950 px-1.5 py-0.5 text-white"
                />
              </label>
              <label className="space-y-0.5">
                <span className="text-[9px] text-slate-400">Mechanic</span>
                <select
                  value={selectedNote.modeId}
                  onChange={(e) =>
                    handleUpdateNote(selectedNoteIdx, { modeId: e.target.value as WaveModeId })
                  }
                  className="w-full border border-slate-600 bg-slate-950 px-1.5 py-0.5 text-[10px] text-white"
                >
                  {WAVE_MODES.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {selectedNote.modeId === 'HOLD_ARC' && (
              <label className="block space-y-0.5">
                <span className="text-[9px] text-slate-400">Hold Duration (s)</span>
                <input
                  type="number"
                  step={0.1}
                  min={0.3}
                  max={6}
                  value={selectedNote.holdDurationSec || 1.2}
                  onChange={(e) =>
                    handleUpdateNote(selectedNoteIdx, {
                      holdDurationSec: Math.max(0.3, Number(e.target.value) || 1.2),
                    })
                  }
                  className="tabular-nums w-full border border-slate-600 bg-slate-950 px-1.5 py-0.5 text-white"
                />
              </label>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
