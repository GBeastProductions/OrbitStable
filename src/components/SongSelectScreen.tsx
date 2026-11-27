import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Film,
  Flag,
  Flame,
  ImagePlus,
  Library,
  Lock,
  Play,
  Search,
  Shuffle,
  SlidersHorizontal,
  Snowflake,
  Upload,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import {
  DIFFICULTIES,
  DIFFICULTY_ORDER,
} from '../data/catalog';
import { XMAS_SPRITES } from '../data/christmasSprites';
import {
  computeModMultiplier,
  computeNextMilestone,
  formatTimeSec,
} from '../engine/beatmap';
import {
  formatCountdown,
  getDailyRotationState,
  getWeeklyRotationState,
} from '../store/dailyWeeklyStore';
import { getResolvedSkinPack } from '../store/studioRegistryStore';
import {
  DifficultyId,
  LevelBackgroundSetting,
  PlayerProfile,
  SongDefinition,
} from '../types/game';
import { DiscCartridge } from './DiscCartridge';
import { StudioSlot, useStudioLayout } from './LiveLayoutWrapper';
import { OrbIcon } from './OrbIcon';
import { SkinBladeTrim } from './SkinAtmosphere';

interface SongSelectScreenProps {
  profile: PlayerProfile;
  songs: SongDefinition[];
  customAudioStatus: string;
  onBackToTitle: () => void;
  onPreviewSong: (songId: string) => void;
  onRandomSong: () => void;
  onToggleMusic: () => void;
  onSelectDifficulty: (diffId: DifficultyId) => void;
  onStartGame: () => void;
  onStartPractice: () => void;
  hasBestReplay: boolean;
  onWatchReplay: () => void;
  onOpenMods: () => void;
  onOpenOrbVault: () => void;
  onUnlockDifficulty: (diffId: DifficultyId, cost: number) => void;
  onUnlockSong: (songId: string, cost: number) => void;
  onUpdateLevelBg: (songId: string, patch: Partial<LevelBackgroundSetting>) => void;
  onResetLevelBg: (songId: string) => void;
  onUploadCustomAudio: (file: File, ngIdTag: string, targetSongId?: string) => Promise<void>;
}

const RANK_COLORS: Record<string, string> = {
  SS: 'text-[#fde047]',
  S: 'text-[#fbbf24]',
  A: 'text-[#34d399]',
  B: 'text-[#22d3ee]',
  C: 'text-[#c084fc]',
  D: 'text-[#fb923c]',
  F: 'text-[#ef4444]',
};

async function resizeImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxW = 1280;
        const scale = img.width > maxW ? maxW / img.width : 1;
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas unavailable'));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => reject(new Error('Invalid image'));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error('File read error'));
    reader.readAsDataURL(file);
  });
}

type TrackPillar = 'library' | 'daily' | 'weekly';
type LibraryPackFilter = 'all' | 'christmas' | 'arcade' | 'electronic' | 'tutorial' | 'custom';

export const SongSelectScreen: React.FC<SongSelectScreenProps> = React.memo(
  ({
    profile,
    songs,
    customAudioStatus,
    onBackToTitle,
    onPreviewSong,
    onRandomSong,
    onToggleMusic,
    onSelectDifficulty,
    onStartGame,
    onStartPractice,
    hasBestReplay,
    onWatchReplay,
    onOpenMods,
    onOpenOrbVault,
    onUnlockDifficulty,
    onUnlockSong,
    onUpdateLevelBg,
    onResetLevelBg,
    onUploadCustomAudio,
  }) => {
    const selectedSong =
      songs.find((s) => s.id === profile.selectedSongId) || songs[0];

    const initialPillar: TrackPillar = selectedSong.isDaily
      ? 'daily'
      : selectedSong.isWeekly
      ? 'weekly'
      : 'library';
    const [activePillar, setActivePillar] = useState<TrackPillar>(initialPillar);
    const [libraryPack, setLibraryPack] = useState<LibraryPackFilter>('all');
    const [packMenuOpen, setPackMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showUpcomingSchedule, setShowUpcomingSchedule] = useState(false);
    const [showStageEditor, setShowStageEditor] = useState(false);
    const [nowMs, setNowMs] = useState(() => Date.now());
    const bgFileInputRef = useRef<HTMLInputElement>(null);
    const mp3FileInputRef = useRef<HTMLInputElement>(null);
    const packDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const id = window.setInterval(() => setNowMs(Date.now()), 1000);
      return () => window.clearInterval(id);
    }, []);

    useEffect(() => {
      if (!packMenuOpen) return;
      const onPointerDown = (e: PointerEvent) => {
        if (
          packDropdownRef.current &&
          !packDropdownRef.current.contains(e.target as Node)
        ) {
          setPackMenuOpen(false);
        }
      };
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setPackMenuOpen(false);
      };
      window.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('keydown', onKeyDown);
      return () => {
        window.removeEventListener('pointerdown', onPointerDown);
        window.removeEventListener('keydown', onKeyDown);
      };
    }, [packMenuOpen]);

    // Keep pillar synced if Random picks a song from another pillar
    useEffect(() => {
      if (selectedSong.isDaily) setActivePillar('daily');
      else if (selectedSong.isWeekly) setActivePillar('weekly');
    }, [selectedSong.id, selectedSong.isDaily, selectedSong.isWeekly]);

    const dailyState = useMemo(() => getDailyRotationState(nowMs), [nowMs]);
    const weeklyState = useMemo(() => getWeeklyRotationState(nowMs), [nowMs]);

    const librarySongs = useMemo(
      () => songs.filter((s) => !s.isDaily && !s.isWeekly),
      [songs],
    );
    const dailySongs = useMemo(() => songs.filter((s) => s.isDaily), [songs]);
    const weeklySongs = useMemo(() => songs.filter((s) => s.isWeekly), [songs]);

    const filteredSongs = useMemo(() => {
      if (activePillar === 'daily') return dailySongs;
      if (activePillar === 'weekly') return weeklySongs;
      const q = searchQuery.trim().toLowerCase();
      return librarySongs.filter((s) => {
        if (libraryPack !== 'all' && s.category !== libraryPack) return false;
        if (!q) return true;
        return (
          s.title.toLowerCase().includes(q) ||
          s.artist.toLowerCase().includes(q) ||
          s.genre.toLowerCase().includes(q)
        );
      });
    }, [activePillar, dailySongs, libraryPack, librarySongs, searchQuery, weeklySongs]);

    const customSongCount = useMemo(
      () => librarySongs.filter((s) => s.category === 'custom').length,
      [librarySongs],
    );

    const effectiveDiffId: DifficultyId = selectedSong.chillOnly
      ? 'CHILL'
      : selectedSong.demonOnly
      ? 'DEMON'
      : profile.selectedDifficulty;
    const activeDiff = DIFFICULTIES[effectiveDiffId] || DIFFICULTIES.CHILL;
    const songRecord = profile.songRecords[selectedSong.id];
    const bgSetting = profile.levelBgSettings[selectedSong.id] || {
      dimPct: 64,
      blurPx: 3,
    };
    const songUnlocked =
      profile.devUnlocked ||
      selectedSong.orbCost === 0 ||
      profile.unlockedSongs.includes(selectedSong.id);
    const diffUnlocked =
      profile.devUnlocked ||
      Boolean(selectedSong.demonOnly) ||
      profile.unlockedDiffs.includes(effectiveDiffId);
    const canLaunch = songUnlocked && diffUnlocked;
    const activeArtSrc = bgSetting.customImageDataUrl || selectedSong.bgImageUrl;

    const milestone = songRecord
      ? computeNextMilestone(
          songRecord.bestAccuracy,
          songRecord.bestRank === 'SS' || songRecord.bestRank === 'S' ? 0 : 1,
          songRecord.bestRank !== 'F',
          effectiveDiffId,
        )
      : null;

    const modMult = computeModMultiplier(profile.equippedMods);
    const { themesMap } = useStudioLayout();
    const skin = getResolvedSkinPack(profile.theme, themesMap);
    const isCozyXmas = profile.theme === 'cozy_christmas_2026';

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.22 }}
        className="relative z-10 flex h-dvh w-full flex-col justify-between overflow-hidden"
      >
        {/* Directional Readability Scrim */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(90deg, ${skin.backdropScrimRgba} 0%, rgba(7,8,13,0.48) 55%, ${skin.backdropScrimRgba} 100%)`,
          }}
        />

        {/* Top Bar (3-Zone Contract) */}
        <StudioSlot widgetId="song_select_topbar" label="Track Select Top Bar" className="relative z-20 shrink-0">
        <header
          className="relative flex h-[56px] sm:h-[60px] shrink-0 items-center justify-between gap-2 sm:gap-4 border-b px-3 sm:px-8"
          style={{
            backgroundColor: skin.headerBg,
            borderColor: skin.surfaceBorder,
          }}
        >
          <SkinBladeTrim themeId={profile.theme} />
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
            <button
              type="button"
              onClick={onBackToTitle}
              className="tactile-btn lazer-slant-sm flex items-center gap-1.5 border px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold text-white hover:border-[var(--accent-bright)] cursor-pointer whitespace-nowrap shrink-0"
              style={{
                backgroundColor: skin.bladeBg,
                borderColor: skin.surfaceBorder,
              }}
            >
              <span className="lazer-unslant-sm flex items-center gap-1.5">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Title</span>
              </span>
            </button>
            <div className="hidden min-[430px]:flex items-baseline gap-2.5 min-w-0 truncate">
              {isCozyXmas && (
                <img
                  aria-hidden="true"
                  src={XMAS_SPRITES.bellBow}
                  alt=""
                  className="hidden sm:block h-7 w-7 self-center object-contain drop-shadow-[0_2px_6px_rgba(251,191,36,0.45)]"
                />
              )}
              <h1 className="font-display text-base sm:text-xl font-extrabold tracking-tight text-white whitespace-nowrap">
                Track Select
              </h1>
              <span className="hidden md:inline text-xs font-semibold tracking-[0.18em] text-[var(--accent-bright)] whitespace-nowrap">
                トラック選択
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <input
              ref={mp3FileInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onUploadCustomAudio(file, 'CUSTOM');
                  setActivePillar('library');
                  setLibraryPack('custom');
                  setSearchQuery('');
                  e.target.value = '';
                }
              }}
            />
            <button
              type="button"
              onClick={() => mp3FileInputRef.current?.click()}
              className="tactile-btn lazer-slant-sm skin-blade hidden sm:flex items-center border px-3.5 py-2 text-xs font-semibold text-[#e5e7eb] hover:border-[var(--accent-secondary)] cursor-pointer whitespace-nowrap"
            >
              <span className="lazer-unslant-sm flex items-center gap-1.5">
                <Upload className="h-3.5 w-3.5 text-[var(--accent-secondary)]" />
                <span>Import MP3</span>
              </span>
            </button>

            <button
              type="button"
              onClick={onRandomSong}
              className="tactile-btn lazer-slant-sm skin-blade flex items-center border px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-[#e5e7eb] hover:border-[var(--accent-bright)] cursor-pointer whitespace-nowrap"
              title="Random Track"
            >
              <span className="lazer-unslant-sm flex items-center gap-1.5">
                <Shuffle className="h-3.5 w-3.5 text-[var(--accent-bright)]" />
                <span className="hidden md:inline">Random</span>
              </span>
            </button>

            <button
              type="button"
              onClick={onToggleMusic}
              className="tactile-btn lazer-slant-sm skin-blade flex items-center border px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold text-white hover:border-[var(--accent-bright)] cursor-pointer whitespace-nowrap"
              aria-label={profile.musicEnabled ? 'Mute Audio' : 'Enable Audio'}
            >
              <span className="lazer-unslant-sm flex items-center">
                {profile.musicEnabled ? (
                  <Volume2 className="h-4 w-4 text-[var(--accent-bright)]" />
                ) : (
                  <VolumeX className="h-4 w-4 text-[#68738a]" />
                )}
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenOrbVault}
              className="tactile-btn lazer-slant-sm flex items-center border border-[#fbbf24]/40 bg-[#1c1608] px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-bold text-[#fbbf24] hover:border-[#fbbf24] cursor-pointer whitespace-nowrap tabular-nums"
            >
              <span className="lazer-unslant-sm flex items-center gap-1.5">
                <OrbIcon className="h-4 w-4" />
                <span>{profile.orbs.toLocaleString()}</span>
              </span>
            </button>
          </div>
        </header>
        </StudioSlot>

        {/* Main 2-Column Stage */}
        <main className="relative z-20 mx-auto grid w-full max-w-[1380px] flex-1 grid-cols-1 gap-4 sm:gap-6 overflow-y-auto lg:overflow-hidden px-3 py-3 sm:px-8 lg:grid-cols-12 lg:py-5 orbit-scroll">
          {/* LEFT WEDGE */}
          <section className="flex flex-col justify-between gap-4 lg:overflow-y-auto orbit-scroll pr-1 lg:col-span-5">
            <div className="space-y-3.5 sm:space-y-4">
              <div
                className="relative aspect-[16/8.5] w-full overflow-hidden border shadow-lg"
                style={{ backgroundColor: skin.surfaceBg, borderColor: skin.surfaceBorder }}
              >
                <SkinBladeTrim themeId={profile.theme} featured />
                {activeArtSrc ? (
                  <img
                    src={activeArtSrc}
                    alt={selectedSong.title}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-[#1f122a] to-[#0b101b]" />
                )}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-[#07080d] via-[#07080d]/35 to-transparent"
                />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-3.5 sm:p-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[11px] sm:text-xs font-semibold text-[#d1d5db] tabular-nums">
                      <span>Disc {selectedSong.num}</span>
                      <span aria-hidden="true">·</span>
                      <span className="capitalize">{selectedSong.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{selectedSong.bpm} BPM</span>
                      <span aria-hidden="true">·</span>
                      <span>{formatTimeSec(selectedSong.durationSec)}</span>
                    </div>
                    <h2 className="font-display mt-0.5 truncate text-xl sm:text-3xl font-black tracking-tight text-white">
                      {selectedSong.title}
                    </h2>
                    <p className="truncate text-xs sm:text-sm font-medium text-[#b6bfd1]">
                      {selectedSong.artist} · {selectedSong.genre}
                    </p>
                  </div>

                  {songRecord && (
                    <div className="shrink-0 text-right">
                      <span className="block text-[10px] font-semibold uppercase tracking-widest text-[#a1abbe]">
                        Best Rank
                      </span>
                      <span
                        className={`font-display text-3xl font-black leading-none ${
                          RANK_COLORS[songRecord.bestRank] || 'text-white'
                        }`}
                      >
                        {songRecord.bestRank}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-xs sm:text-sm leading-relaxed text-[#b6bfd1]">
                {selectedSong.desc}
              </p>

              {/* Difficulty Tabs */}
              <div>
                <div className="mb-2 flex items-center justify-between text-xs text-[#a1abbe]">
                  <span className="font-semibold">Difficulty</span>
                  <span className="tabular-nums text-white font-semibold">
                    {activeDiff.name} · {activeDiff.mult.toFixed(2)}x Score
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {DIFFICULTY_ORDER.map((diffId) => {
                    const cfg = DIFFICULTIES[diffId];
                    const disabled =
                      (selectedSong.chillOnly && diffId !== 'CHILL') ||
                      (Boolean(selectedSong.demonOnly) && diffId !== 'DEMON');
                    const isSelected = effectiveDiffId === diffId;
                    const isUnlocked =
                      profile.devUnlocked ||
                      (Boolean(selectedSong.demonOnly) && diffId === 'DEMON') ||
                      profile.unlockedDiffs.includes(diffId);
                    const stars = selectedSong.stars[diffId] || '—';

                    return (
                      <button
                        key={diffId}
                        type="button"
                        disabled={disabled}
                        onClick={() => onSelectDifficulty(diffId)}
                        className={`tactile-btn lazer-slant-sm flex flex-col items-center justify-center border px-1.5 py-2 text-center cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${
                          isSelected
                            ? 'border-[var(--accent-bright)] bg-[var(--accent)] text-[var(--accent-on)]'
                            : isUnlocked
                            ? 'skin-blade text-white hover:border-[var(--accent-bright)]'
                            : 'skin-surface text-[#9aa5ba] hover:border-[#fbbf24]/60'
                        }`}
                      >
                        <span className="lazer-unslant-sm flex flex-col items-center w-full min-w-0">
                          <span className="flex items-center gap-0.5 text-[10px] sm:text-[11px] font-extrabold tracking-wide whitespace-nowrap">
                            {!isUnlocked && !disabled && <Lock className="h-2.5 w-2.5 text-[#fbbf24] shrink-0" />}
                            <span>{cfg.name}</span>
                          </span>
                          <span
                            className={`tabular-nums mt-0.5 text-[10px] font-semibold whitespace-nowrap ${
                              isSelected ? 'text-white/95' : 'text-[#9aa5ba]'
                            }`}
                          >
                            {stars}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-[#808ba1]">
                  {selectedSong.demonOnly
                    ? 'Weekly Demon Gauntlet — Locked to DEMON difficulty with free entry.'
                    : selectedSong.chillOnly
                    ? 'Calibration Track — Locked to CHILL difficulty.'
                    : activeDiff.desc}
                </p>
              </div>

              {/* Personal Best & Next Rank Forecast */}
              <div className="border-t border-white/10 pt-3">
                {songRecord ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs tabular-nums">
                      <span className="text-[#a1abbe]">
                        Best Score <strong className="ml-1 text-white">{songRecord.bestScore.toLocaleString()}</strong>
                        <span className="mx-2 text-white/25">·</span>
                        Accuracy <strong className="ml-1 text-[#22d3ee]">{songRecord.bestAccuracy.toFixed(1)}%</strong>
                        <span className="mx-2 text-white/25">·</span>
                        Combo <strong className="ml-1 text-white">{songRecord.bestCombo}x</strong>
                      </span>
                    </div>
                    {milestone && milestone.nextRank && (
                      <div>
                        <div className="mb-1 flex items-center justify-between text-[11px] text-[#a1abbe]">
                          <span>{milestone.gapLabel}</span>
                          <span className="tabular-nums text-white font-semibold">
                            {Math.round(milestone.progressPct)}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden bg-white/10">
                          <div
                            className="h-full bg-[var(--accent-bright)] transition-all duration-300"
                            style={{ width: `${milestone.progressPct}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-[#808ba1]">
                    Unplayed on this profile. Clear with C-rank or higher to bank earned Orbs.
                  </p>
                )}
              </div>

              {/* Compact Mod & Stage Background Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
                <div className="text-xs text-[#b6bfd1] tabular-nums">
                  <span className="font-semibold text-white">Mods:</span>{' '}
                  {profile.equippedMods.length > 0
                    ? `${profile.equippedMods.join(' + ')} (${modMult.toFixed(2)}x)`
                    : 'None (1.00x)'}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowStageEditor((v) => !v)}
                    className="tactile-btn skin-blade border px-3 py-1.5 text-xs font-semibold text-[#d1d5db] hover:border-[var(--accent-bright)] cursor-pointer whitespace-nowrap"
                  >
                    {showStageEditor ? 'Hide Backdrop' : 'Backdrop Tuner'}
                  </button>
                  <button
                    type="button"
                    onClick={onOpenMods}
                    className="tactile-btn skin-surface-elevated border px-3.5 py-1.5 text-xs font-bold text-white hover:border-[var(--accent-bright)] cursor-pointer whitespace-nowrap"
                  >
                    <span className="flex items-center gap-1.5">
                      <SlidersHorizontal className="h-3.5 w-3.5 text-[var(--accent-bright)]" />
                      <span>Mods</span>
                    </span>
                  </button>
                </div>
              </div>

              {showStageEditor && (
                <div className="skin-surface space-y-3 border p-3.5 text-xs backdrop-blur-md">
                  <div className="grid grid-cols-2 gap-4">
                    <label className="block">
                      <span className="flex justify-between text-[#a1abbe] mb-1">
                        <span>Background Dim</span>
                        <span className="tabular-nums text-white">{bgSetting.dimPct}%</span>
                      </span>
                      <input
                        type="range"
                        min={20}
                        max={92}
                        value={bgSetting.dimPct}
                        onChange={(e) =>
                          onUpdateLevelBg(selectedSong.id, { dimPct: Number(e.target.value) })
                        }
                        className="w-full accent-[var(--accent)]"
                      />
                    </label>
                    <label className="block">
                      <span className="flex justify-between text-[#a1abbe] mb-1">
                        <span>Stage Blur</span>
                        <span className="tabular-nums text-white">{bgSetting.blurPx}px</span>
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={14}
                        value={bgSetting.blurPx}
                        onChange={(e) =>
                          onUpdateLevelBg(selectedSong.id, { blurPx: Number(e.target.value) })
                        }
                        className="w-full accent-[var(--accent)]"
                      />
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      ref={bgFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const url = await resizeImageToDataUrl(file);
                            onUpdateLevelBg(selectedSong.id, { customImageDataUrl: url });
                          } catch {
                            // Ignore invalid image
                          }
                          e.target.value = '';
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => bgFileInputRef.current?.click()}
                      className="tactile-btn flex items-center gap-1.5 border border-white/15 bg-[#161b29] px-3 py-1.5 text-xs font-semibold text-white hover:border-[var(--accent-bright)] cursor-pointer"
                    >
                      <ImagePlus className="h-3.5 w-3.5" />
                      <span>Custom Cover</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onResetLevelBg(selectedSong.id)}
                      className="tactile-btn border border-white/10 bg-[#111521] px-3 py-1.5 text-xs text-[#a1abbe] hover:text-white cursor-pointer"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              )}

              {customAudioStatus && (
                <p className="text-xs font-medium text-[#22d3ee]">{customAudioStatus}</p>
              )}
            </div>
          </section>

          {/* RIGHT CAROUSEL — Scalable 3-Pillar Architecture + Pack Dropdown & Search */}
          <section className="relative flex flex-col lg:overflow-hidden lg:col-span-7">
            {/* Primary 3-Pillar Mode Switcher (Never wraps/bloats as new packs arrive) */}
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActivePillar('library');
                    setShowUpcomingSchedule(false);
                    if (librarySongs.length > 0 && (selectedSong.isDaily || selectedSong.isWeekly)) {
                      onPreviewSong(librarySongs[0].id);
                    }
                  }}
                  className={`tactile-btn lazer-slant-sm border px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs font-extrabold cursor-pointer whitespace-nowrap shrink-0 ${
                    activePillar === 'library'
                      ? 'border-[var(--accent-bright)] bg-[var(--accent)] text-[var(--accent-on)]'
                      : 'skin-blade text-[#b6bfd1] hover:border-[var(--accent-bright)] hover:text-white'
                  }`}
                >
                  <span className="lazer-unslant-sm flex items-center gap-1.5">
                    <Library className="h-3.5 w-3.5" />
                    <span>Library</span>
                    <span className="tabular-nums opacity-75">({librarySongs.length})</span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActivePillar('daily');
                    setShowUpcomingSchedule(false);
                    if (dailySongs.length > 0 && !selectedSong.isDaily) {
                      onPreviewSong(dailySongs[0].id);
                    }
                  }}
                  className={`tactile-btn lazer-slant-sm border px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs font-extrabold cursor-pointer whitespace-nowrap shrink-0 ${
                    activePillar === 'daily'
                      ? 'border-[#22d3ee] bg-[#0891b2] text-white'
                      : 'border-[#22d3ee]/25 bg-[#0b151e]/90 text-[#a5f3fc] hover:border-[#22d3ee]/60 hover:text-white'
                  }`}
                >
                  <span className="lazer-unslant-sm flex items-center gap-1.5">
                    <CalendarClock className="h-3.5 w-3.5" />
                    <span>Daily #{dailyState.activeDayNumber}</span>
                    <span className="tabular-nums opacity-80">({dailySongs.length})</span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActivePillar('weekly');
                    setShowUpcomingSchedule(false);
                    if (weeklySongs.length > 0 && !selectedSong.isWeekly) {
                      onPreviewSong(weeklySongs[0].id);
                    }
                  }}
                  className={`tactile-btn lazer-slant-sm border px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs font-extrabold cursor-pointer whitespace-nowrap shrink-0 ${
                    activePillar === 'weekly'
                      ? 'border-[#f87171] bg-[#dc2626] text-white'
                      : 'border-[#ef4444]/30 bg-[#1b0b12]/90 text-[#fca5a5] hover:border-[#ef4444]/65 hover:text-white'
                  }`}
                >
                  <span className="lazer-unslant-sm flex items-center gap-1.5">
                    <Flame className="h-3.5 w-3.5" />
                    <span>Weekly Demon</span>
                    <span className="tabular-nums opacity-80">
                      W{String(weeklyState.activeWeekNumber).padStart(2, '0')}
                    </span>
                  </span>
                </button>
              </div>

              {/* Custom Dark Pack Dropdown + Search when in Library */}
              {activePillar === 'library' && (
                <div className="flex flex-1 min-w-[220px] sm:max-w-[380px] items-center gap-2">
                  <div ref={packDropdownRef} className="relative shrink-0">
                    {(() => {
                      const packOptions: { value: LibraryPackFilter; label: string; count?: number }[] = [
                        { value: 'all', label: 'All Packs', count: librarySongs.length },
                        { value: 'arcade', label: 'Arcade' },
                        { value: 'electronic', label: 'Electronic' },
                        { value: 'christmas', label: 'Christmas 2026' },
                        { value: 'tutorial', label: 'Calibration' },
                        ...(customSongCount > 0
                          ? [{ value: 'custom' as const, label: 'Custom', count: customSongCount }]
                          : []),
                      ];
                      const currentOpt =
                        packOptions.find((o) => o.value === libraryPack) || packOptions[0];
                      const currentLabel =
                        currentOpt.count !== undefined
                          ? `${currentOpt.label} (${currentOpt.count})`
                          : currentOpt.label;

                      return (
                        <>
                          <button
                            type="button"
                            aria-haspopup="listbox"
                            aria-expanded={packMenuOpen}
                            aria-label="Filter Library Pack"
                            onClick={() => setPackMenuOpen((v) => !v)}
                            className={`tactile-btn flex h-8 min-w-[144px] items-center justify-between gap-2.5 border px-3 text-xs font-bold text-white cursor-pointer transition-colors ${
                              packMenuOpen
                                ? 'skin-surface-elevated border-[var(--accent-bright)]'
                                : 'skin-blade hover:border-[var(--accent-bright)]'
                            }`}
                          >
                            <span className="truncate whitespace-nowrap">{currentLabel}</span>
                            <ChevronDown
                              className={`h-3.5 w-3.5 shrink-0 text-[var(--accent-bright)] transition-transform duration-150 ${
                                packMenuOpen ? 'rotate-180' : ''
                              }`}
                            />
                          </button>

                          {packMenuOpen && (
                            <div
                              role="listbox"
                              aria-label="Library Pack Options"
                              className="absolute left-0 top-[calc(100%+4px)] z-40 min-w-[196px] border py-1 shadow-[0_14px_38px_rgba(0,0,0,0.88)] backdrop-blur-md"
                              style={{
                                backgroundColor: skin.surfaceElevatedBg,
                                borderColor: skin.surfaceBorder,
                              }}
                            >
                              {packOptions.map((opt) => {
                                const isSel = libraryPack === opt.value;
                                const optText =
                                  opt.count !== undefined
                                    ? `${opt.label} (${opt.count})`
                                    : opt.label;
                                return (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    role="option"
                                    aria-selected={isSel}
                                    onClick={() => {
                                      setLibraryPack(opt.value);
                                      setPackMenuOpen(false);
                                      const firstMatch = librarySongs.find(
                                        (s) => opt.value === 'all' || s.category === opt.value,
                                      );
                                      if (firstMatch && firstMatch.id !== selectedSong.id) {
                                        onPreviewSong(firstMatch.id);
                                      }
                                    }}
                                    className={`flex w-full items-center justify-between gap-3 px-3.5 py-2 text-left text-xs font-bold cursor-pointer transition-colors ${
                                      isSel
                                        ? 'bg-[var(--accent-dim)] text-white'
                                        : 'text-[#b6bfd1] hover:bg-white/8 hover:text-white'
                                    }`}
                                  >
                                    <span className="whitespace-nowrap">{optText}</span>
                                    {isSel && (
                                      <Check className="h-3.5 w-3.5 shrink-0 text-[var(--accent-bright)]" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  <div className="relative flex-1 min-w-[110px]">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#64748b]" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter tracks..."
                      aria-label="Search tracks"
                      className="skin-blade h-8 w-full border pl-8 pr-7 text-xs text-white placeholder-[#64748b] outline-none focus:border-[var(--accent-bright)]"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        aria-label="Clear track search"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-white cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative flex-1 overflow-hidden">
              <div className="orbit-scroll h-full space-y-2.5 overflow-y-auto px-2 pb-6">
                {/* Daily 24h Rotation Hub Strip */}
                {activePillar === 'daily' && (
                  <div className="border-l-2 border-[#22d3ee] bg-[#0a131d]/90 px-4 py-2.5 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="font-display font-extrabold text-sm text-white">
                          Day #{dailyState.activeDayNumber} Live
                        </span>
                        <span className="text-[11px] font-bold text-[#34d399] tabular-nums">
                          Streak {profile.dailyStreak}d
                        </span>
                      </div>
                      <span className="tabular-nums font-bold text-[#22d3ee]">
                        Next Drop in {formatCountdown(dailyState.remainingMs)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Weekly Demon 7d Rotation Hub Strip */}
                {activePillar === 'weekly' && (
                  <div className="border-l-2 border-[#ef4444] bg-[#190a11]/90 px-4 py-2.5 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="font-display font-extrabold text-sm text-white">
                          Week W{String(weeklyState.activeWeekNumber).padStart(2, '0')} Demon Gauntlet
                        </span>
                        <span className="text-[11px] font-bold text-[#fca5a5]">
                          DEMON Only · Open Entry
                        </span>
                      </div>
                      <span className="tabular-nums font-bold text-[#fca5a5]">
                        Rotates in {formatCountdown(weeklyState.remainingMs)}
                      </span>
                    </div>
                  </div>
                )}

                {filteredSongs.length === 0 && (
                  <div className="border border-white/10 bg-[#0d111b]/80 px-5 py-8 text-center text-xs text-[#9aa5ba]">
                    No tracks match your filter.{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setLibraryPack('all');
                        setSearchQuery('');
                      }}
                      className="font-bold text-[var(--accent-bright)] hover:underline cursor-pointer"
                    >
                      Reset filter
                    </button>
                  </div>
                )}

                {/* Playable Track List */}
                {filteredSongs.map((song, songIdx) => {
                  const isSelected = song.id === selectedSong.id;
                  const unlocked =
                    profile.devUnlocked ||
                    song.orbCost === 0 ||
                    profile.unlockedSongs.includes(song.id);
                  const rec = profile.songRecords[song.id];
                  const art =
                    profile.levelBgSettings[song.id]?.customImageDataUrl || song.bgImageUrl;
                  const starLabel =
                    song.stars[song.chillOnly ? 'CHILL' : song.demonOnly ? 'DEMON' : effectiveDiffId] ||
                    song.stars.CHILL ||
                    song.stars.DEMON ||
                    '';
                  const isChristmasTrack = song.category === 'christmas';
                  const isDailyCleared =
                    song.isDaily && profile.completedDailyIds.includes(song.id);
                  const isWeeklyCleared =
                    song.isWeekly && profile.completedWeeklyIds.includes(song.id);
                  const showArchiveHeader =
                    (activePillar === 'daily' || activePillar === 'weekly') && songIdx === 1;

                  return (
                    <React.Fragment key={song.id}>
                      {showArchiveHeader && (
                        <div className="border-t border-white/10 pt-2.5 pb-0.5 text-[11px] font-extrabold uppercase tracking-wider text-[#9aa5ba]">
                          Past Archive
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => onPreviewSong(song.id)}
                        className={`tactile-btn lazer-slant-sm group relative flex w-full items-center justify-between gap-4 overflow-hidden border px-4 py-2.5 text-left cursor-pointer ${
                          isSelected
                            ? 'skin-surface-elevated border-[var(--accent-bright)] shadow-[0_0_24px_rgba(var(--bg-accent-rgb,255,59,130),0.26)] translate-x-1'
                            : isCozyXmas
                            ? 'skin-blade border-[#fde68a]/35 hover:border-[#fde68a]/85'
                            : isChristmasTrack
                            ? 'skin-blade border-[#38bdf8]/40 hover:border-[#38bdf8]/80'
                            : song.demonOnly
                            ? 'skin-blade border-[#ef4444]/40 hover:border-[#ef4444]/80'
                            : song.isDaily
                            ? 'skin-blade border-[#22d3ee]/35 hover:border-[#22d3ee]/75'
                            : 'skin-blade hover:border-[var(--accent-bright)]'
                        }`}
                      >
                        <SkinBladeTrim themeId={profile.theme} compact featured={isSelected} />
                        {art && (
                          <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-y-0 right-0 w-[56%] overflow-hidden"
                          >
                            <img
                              src={art}
                              alt=""
                              referrerPolicy="no-referrer"
                              className={`h-full w-full object-cover transition-opacity duration-200 ${
                                isSelected ? 'opacity-38' : 'opacity-20 group-hover:opacity-32'
                              } ${!unlocked ? 'grayscale' : ''}`}
                            />
                            <div
                              className="absolute inset-0"
                              style={{
                                background: `linear-gradient(90deg, ${
                                  isSelected ? skin.surfaceElevatedBg : skin.bladeBg
                                } 0%, ${skin.backdropScrimRgba} 65%, transparent 100%)`,
                              }}
                            />
                          </div>
                        )}

                        <div className="lazer-unslant-sm relative z-10 flex w-full items-center justify-between gap-4 min-w-0">
                          <div className="flex items-center gap-3.5 min-w-0">
                            <DiscCartridge
                              imageUrl={art}
                              num={song.num}
                              title={song.title}
                              themeId={profile.theme}
                              size="sm"
                              spinning={isSelected}
                              locked={!unlocked}
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-display truncate text-sm sm:text-base font-extrabold text-white">
                                  {song.title}
                                </span>
                                {isChristmasTrack && (
                                  <Snowflake className="h-3.5 w-3.5 shrink-0 text-[#38bdf8]" />
                                )}
                                {song.isDaily && (
                                  <span className="shrink-0 border border-[#22d3ee]/45 bg-[#082530] px-1.5 py-0.5 text-[9px] font-black tracking-wider text-[#22d3ee]">
                                    {song.id === dailyState.activeSong.id ? 'LIVE DAILY' : 'ARCHIVE'}
                                  </span>
                                )}
                                {song.isWeekly && (
                                  <span className="shrink-0 border border-[#ef4444]/45 bg-[#2d0c13] px-1.5 py-0.5 text-[9px] font-black tracking-wider text-[#fca5a5]">
                                    {song.id === weeklyState.activeSong.id ? 'LIVE DEMON' : 'ARCHIVE'}
                                  </span>
                                )}
                                {(isDailyCleared || isWeeklyCleared) && (
                                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#34d399]" />
                                )}
                              </div>
                              <div className="mt-0.5 flex items-center gap-2 text-xs text-[#b6bfd1] truncate tabular-nums">
                                <span className="truncate">{song.artist}</span>
                                <span aria-hidden="true">·</span>
                                <span>{song.bpm} BPM</span>
                                <span aria-hidden="true">·</span>
                                <span>{formatTimeSec(song.durationSec)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 sm:gap-4 shrink-0 tabular-nums">
                            {starLabel && (
                              <span className="text-xs font-semibold text-[#d1d5db]">
                                {starLabel}
                              </span>
                            )}
                            {!unlocked ? (
                              <span className="flex items-center gap-1 text-xs font-bold text-[#fbbf24] whitespace-nowrap">
                                <Lock className="h-3.5 w-3.5" />
                                <span>{song.orbCost} Orbs</span>
                              </span>
                            ) : rec ? (
                              <span
                                className={`font-display text-lg font-black ${
                                  RANK_COLORS[rec.bestRank] || 'text-white'
                                }`}
                              >
                                {rec.bestRank}
                              </span>
                            ) : (
                              <span className="text-xs font-medium text-[#9aa5ba]">Ready</span>
                            )}
                          </div>
                        </div>
                      </button>
                    </React.Fragment>
                  );
                })}

                {/* Collapsible Sealed Upcoming Daily Schedule (Days 2-10 locked until rotation date) */}
                {activePillar === 'daily' && dailyState.upcomingSlots.length > 0 && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setShowUpcomingSchedule((v) => !v)}
                      className="flex w-full items-center justify-between border border-white/10 bg-[#0b1019] px-3.5 py-2 text-[11px] font-extrabold uppercase tracking-wider text-[#9aa5ba] hover:border-[#22d3ee]/40 hover:text-white cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        {showUpcomingSchedule ? (
                          <ChevronDown className="h-3.5 w-3.5 text-[#22d3ee]" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-[#22d3ee]" />
                        )}
                        <span>Upcoming Daily Schedule ({dailyState.upcomingSlots.length} Sealed)</span>
                      </span>
                      <span className="text-[#22d3ee] tabular-nums">
                        Day #{dailyState.upcomingSlots[0].number} in{' '}
                        {formatCountdown(dailyState.upcomingSlots[0].unlockMs - nowMs)}
                      </span>
                    </button>

                    {showUpcomingSchedule && (
                      <div className="mt-2 space-y-1.5">
                        {dailyState.upcomingSlots.map((slot) => (
                          <div
                            key={slot.song.id}
                            aria-disabled="true"
                            className="flex items-center justify-between gap-4 border border-white/8 bg-[#090c14]/80 px-4 py-2 opacity-65 cursor-not-allowed select-none"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-white/10 bg-[#101420] text-xs font-black text-[#64748b] tabular-nums">
                                D{String(slot.number).padStart(2, '0')}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#94a3b8]">
                                  <Lock className="h-3 w-3 text-[#64748b]" />
                                  <span>Daily Track #{slot.number} · Sealed</span>
                                </div>
                                <span className="text-[11px] text-[#64748b]">
                                  Unlocks automatically at scheduled 24h rotation
                                </span>
                              </div>
                            </div>
                            <span className="shrink-0 tabular-nums text-[11px] font-bold text-[#22d3ee]">
                              {formatCountdown(slot.unlockMs - nowMs)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Collapsible Sealed Upcoming Weekly Demon Schedule (Weeks 2-5 locked until rotation date) */}
                {activePillar === 'weekly' && weeklyState.upcomingSlots.length > 0 && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setShowUpcomingSchedule((v) => !v)}
                      className="flex w-full items-center justify-between border border-[#ef4444]/20 bg-[#120a10] px-3.5 py-2 text-[11px] font-extrabold uppercase tracking-wider text-[#cbd5e1] hover:border-[#ef4444]/45 hover:text-white cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        {showUpcomingSchedule ? (
                          <ChevronDown className="h-3.5 w-3.5 text-[#f87171]" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-[#f87171]" />
                        )}
                        <span>Upcoming Weekly Demons ({weeklyState.upcomingSlots.length} Sealed)</span>
                      </span>
                      <span className="text-[#fca5a5] tabular-nums">
                        W{String(weeklyState.upcomingSlots[0].number).padStart(2, '0')} in{' '}
                        {formatCountdown(weeklyState.upcomingSlots[0].unlockMs - nowMs)}
                      </span>
                    </button>

                    {showUpcomingSchedule && (
                      <div className="mt-2 space-y-1.5">
                        {weeklyState.upcomingSlots.map((slot) => (
                          <div
                            key={slot.song.id}
                            aria-disabled="true"
                            className="flex items-center justify-between gap-4 border border-[#ef4444]/15 bg-[#0d0a10]/85 px-4 py-2 opacity-65 cursor-not-allowed select-none"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-[#ef4444]/25 bg-[#1b0d14] text-xs font-black text-[#f87171] tabular-nums">
                                W{String(slot.number).padStart(2, '0')}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#cbd5e1]">
                                  <Lock className="h-3 w-3 text-[#f87171]" />
                                  <span>Weekly Demon W{String(slot.number).padStart(2, '0')} · Sealed</span>
                                </div>
                                <span className="text-[11px] text-[#64748b]">
                                  Demon-only rotation — sealed until unlock date
                                </span>
                              </div>
                            </div>
                            <span className="shrink-0 tabular-nums text-[11px] font-bold text-[#fca5a5]">
                              {formatCountdown(slot.unlockMs - nowMs)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div
                aria-hidden="true"
                className="pointer-events-none hidden lg:block absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#07080d]/90 to-transparent"
              />
            </div>
          </section>
        </main>

        {/* Bottom Dock */}
        <footer
          className="relative z-20 flex h-[64px] sm:h-[68px] shrink-0 items-center justify-between gap-2 sm:gap-4 border-t px-3 sm:px-8 backdrop-blur-md"
          style={{
            backgroundColor: skin.headerBg,
            borderColor: skin.surfaceBorder,
          }}
        >
          <SkinBladeTrim themeId={profile.theme} compact />
          {isCozyXmas && (
            <img
              aria-hidden="true"
              src={XMAS_SPRITES.giftBox}
              alt=""
              className="pointer-events-none hidden lg:block absolute left-1/2 -top-6 h-10 w-10 -translate-x-1/2 object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.75)]"
            />
          )}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={onOpenOrbVault}
              className="tactile-btn lazer-slant-sm border px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-bold text-white hover:border-[#fbbf24] cursor-pointer whitespace-nowrap"
              style={{ backgroundColor: skin.bladeBg, borderColor: skin.surfaceBorder }}
            >
              <span className="lazer-unslant-sm flex items-center gap-1.5">
                <OrbIcon className="h-4 w-4" />
                <span>Orb Shop</span>
              </span>
            </button>
            <button
              type="button"
              onClick={onOpenMods}
              className="tactile-btn lazer-slant-sm skin-blade border px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-bold text-white hover:border-[var(--accent-bright)] cursor-pointer whitespace-nowrap"
            >
              <span className="lazer-unslant-sm flex items-center gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5 text-[var(--accent-bright)]" />
                <span>Mods</span>
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {!songUnlocked ? (
              <button
                type="button"
                disabled={profile.orbs < selectedSong.orbCost}
                onClick={() => onUnlockSong(selectedSong.id, selectedSong.orbCost)}
                className="tactile-btn lazer-slant flex items-center border border-[#fbbf24] bg-[#fbbf24] px-4 sm:px-7 py-2 sm:py-2.5 text-xs sm:text-sm font-black text-[#140c02] hover:bg-[#fde047] disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
              >
                <span className="lazer-unslant flex items-center gap-1.5 sm:gap-2">
                  <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>Unlock · {selectedSong.orbCost}</span>
                </span>
              </button>
            ) : !diffUnlocked ? (
              <button
                type="button"
                disabled={profile.orbs < activeDiff.orbCost}
                onClick={() => onUnlockDifficulty(effectiveDiffId, activeDiff.orbCost)}
                className="tactile-btn lazer-slant flex items-center border border-[#fbbf24] bg-[#fbbf24] px-4 sm:px-7 py-2 sm:py-2.5 text-xs sm:text-sm font-black text-[#140c02] hover:bg-[#fde047] disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
              >
                <span className="lazer-unslant flex items-center gap-1.5 sm:gap-2">
                  <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>Unlock {activeDiff.name} · {activeDiff.orbCost}</span>
                </span>
              </button>
            ) : (
              <div className="flex items-center gap-2 sm:gap-2.5">
                {hasBestReplay && (
                  <button
                    type="button"
                    onClick={onWatchReplay}
                    className="tactile-btn flex items-center gap-1.5 border border-[#c084fc]/45 bg-[#1b112c] px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-bold text-[#e9d5ff] hover:border-[#c084fc] cursor-pointer whitespace-nowrap"
                    title="Watch Saved Replay"
                  >
                    <Film className="h-3.5 w-3.5 text-[#c084fc]" />
                    <span className="hidden sm:inline">Replay</span>
                  </button>
                )}
                <button
                  type="button"
                  disabled={!canLaunch}
                  onClick={onStartPractice}
                  className="tactile-btn flex items-center gap-1.5 border border-[#38bdf8]/45 bg-[#0b1826] px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-bold text-[#7dd3fc] hover:border-[#38bdf8] cursor-pointer whitespace-nowrap"
                  title="GD-Style Practice Mode with Start Pos & Checkpoints"
                >
                  <Flag className="h-3.5 w-3.5 text-[#38bdf8]" />
                  <span>Practice</span>
                </button>
                <StudioSlot widgetId="song_select_launch_btn" label="Launch Stage CTA">
                  <button
                    type="button"
                    disabled={!canLaunch}
                    onClick={onStartGame}
                    className="tactile-btn lazer-slant flex items-center border border-[var(--accent-bright)] bg-[var(--accent)] px-5 sm:px-8 py-2 sm:py-2.5 text-xs sm:text-base font-black tracking-wide text-[var(--accent-on)] hover:bg-[var(--accent-bright)] cursor-pointer whitespace-nowrap"
                  >
                    <span className="lazer-unslant flex items-center gap-1.5 sm:gap-2">
                      <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current" />
                      <span>Launch Stage</span>
                    </span>
                  </button>
                </StudioSlot>
              </div>
            )}
          </div>
        </footer>
      </motion.div>
    );
  },
);
