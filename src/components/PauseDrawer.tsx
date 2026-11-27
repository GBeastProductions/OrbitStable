import React from 'react';
import { motion } from 'motion/react';
import { Flag, Home, ListMusic, Play, RotateCcw, X } from 'lucide-react';
import { CHASSIS_THEMES } from '../data/catalog';
import { getResolvedChassisTheme } from '../store/studioRegistryStore';
import { BgFxMode, HitSfxMode, OverdriveVfxMode, PauseTabId, PlayerProfile, ThemeId } from '../types/game';
import { ArcadeSwitch } from './LazerChrome';
import { useStudioLayout } from './LiveLayoutWrapper';
import { OrbIcon } from './OrbIcon';
import { SkinBladeTrim } from './SkinAtmosphere';

interface PauseDrawerProps {
  open: boolean;
  activeTab: PauseTabId;
  onChangeTab: (tab: PauseTabId) => void;
  profile: PlayerProfile;
  songTitle: string;
  listeningSlot: 0 | 1 | 2;
  onStartRebind: (slot: 1 | 2) => void;
  onResume: () => void;
  onRetryRound: () => void;
  onGoToSongSelect: () => void;
  onGoToTitle: () => void;
  onOpenOrbVault: () => void;
  onTogglePointer: () => void;
  onUpdateAudioOffset: (ms: number) => void;
  onToggleMusic: () => void;
  onMusicVolume: (vol: number) => void;
  onToggleSound: () => void;
  onSfxVolume: (vol: number) => void;
  onSelectHitSfx: (mode: HitSfxMode) => void;
  onSelectTheme: (theme: ThemeId) => void;
  onSelectBgFx: (mode: BgFxMode) => void;
  onSelectOverdriveVfx: (mode: OverdriveVfxMode) => void;
  isPracticeMode: boolean;
  isReplayMode: boolean;
  onTogglePracticeMode: () => void;
}

const DRAWER_TABS: { id: PauseTabId; label: string }[] = [
  { id: 'main', label: 'Session' },
  { id: 'audio', label: 'Audio' },
  { id: 'ctrl', label: 'Controls' },
  { id: 'disp', label: 'Theme' },
];

export const PauseDrawer: React.FC<PauseDrawerProps> = ({
  open,
  activeTab,
  onChangeTab,
  profile,
  songTitle,
  listeningSlot,
  onStartRebind,
  onResume,
  onRetryRound,
  onGoToSongSelect,
  onGoToTitle,
  onOpenOrbVault,
  onTogglePointer,
  onUpdateAudioOffset,
  onToggleMusic,
  onMusicVolume,
  onToggleSound,
  onSfxVolume,
  onSelectHitSfx,
  onSelectTheme,
  onSelectBgFx,
  onSelectOverdriveVfx,
  isPracticeMode,
  isReplayMode,
  onTogglePracticeMode,
}) => {
  const { themesMap } = useStudioLayout();
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pauseDrawerTitle"
      className="fixed inset-0 z-50 flex justify-end bg-black/62"
      onClick={onResume}
    >
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="flex h-dvh w-[min(94vw,430px)] flex-col border-l border-[var(--accent-bright)]/50 backdrop-blur-md shadow-[-20px_0_60px_rgba(0,0,0,0.75)]"
        style={{ backgroundColor: 'var(--skin-surface, rgba(11, 14, 22, 0.98))' }}
      >
        {/* Drawer Header */}
        <div
          className="relative flex items-center justify-between gap-3 border-b px-5 py-4"
          style={{
            backgroundColor: 'var(--skin-header, #121624)',
            borderColor: 'var(--skin-border, rgba(255,255,255,0.12))',
          }}
        >
          <SkinBladeTrim themeId={profile.theme} compact />
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--accent-bright)]">
              Paused · 一時停止
            </p>
            <h2
              id="pauseDrawerTitle"
              className="font-display truncate text-lg font-extrabold text-white"
            >
              {songTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={onResume}
            className="tactile-btn border skin-blade p-2 text-[#d1d5db] hover:text-white cursor-pointer"
            aria-label="Resume Stage"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Slanted Tab Switcher */}
        <div
          className="grid grid-cols-4 gap-1.5 border-b px-4 py-2.5"
          style={{
            backgroundColor: 'var(--skin-surface-elevated, #0e121d)',
            borderColor: 'var(--skin-border, rgba(255,255,255,0.1))',
          }}
        >
          {DRAWER_TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChangeTab(tab.id)}
                className={`tactile-btn lazer-slant-sm border py-1.5 text-xs font-bold cursor-pointer whitespace-nowrap ${
                  active
                    ? 'border-[var(--accent-bright)] bg-[var(--accent)] text-[var(--accent-on)]'
                    : 'skin-blade text-[#a1abbe] hover:text-white'
                }`}
              >
                <span className="lazer-unslant-sm block">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Drawer Body */}
        <div className="orbit-scroll flex-1 overflow-y-auto p-5">
          {activeTab === 'main' && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={onResume}
                className="tactile-btn lazer-slant-sm flex w-full items-center justify-between border border-[var(--accent-bright)] bg-[var(--accent)] px-5 py-3.5 text-left font-extrabold text-[var(--accent-on)] hover:bg-[var(--accent-bright)] cursor-pointer"
              >
                <span className="lazer-unslant-sm flex w-full items-center justify-between">
                  <span className="font-display text-base">Resume Stage</span>
                  <Play className="h-4 w-4 fill-current" />
                </span>
              </button>

              <button
                type="button"
                onClick={onRetryRound}
                className="tactile-btn lazer-slant-sm flex w-full items-center justify-between border border-white/15 bg-[#121726] px-5 py-3 text-left text-sm font-bold text-white hover:border-[var(--accent-bright)] cursor-pointer"
              >
                <span className="lazer-unslant-sm flex w-full items-center justify-between">
                  <span>Restart From Beginning</span>
                  <RotateCcw className="h-4 w-4 text-[#22d3ee]" />
                </span>
              </button>

              {!isReplayMode && (
                <button
                  type="button"
                  onClick={onTogglePracticeMode}
                  className="tactile-btn lazer-slant-sm flex w-full items-center justify-between border border-[#38bdf8]/40 bg-[#0d1929] px-5 py-3 text-left text-sm font-bold text-[#7dd3fc] hover:border-[#38bdf8] cursor-pointer"
                >
                  <span className="lazer-unslant-sm flex w-full items-center justify-between">
                    <span>{isPracticeMode ? 'Exit Practice (Restart Ranked)' : 'Switch to Practice Mode'}</span>
                    <Flag className="h-4 w-4 text-[#38bdf8]" />
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={onGoToSongSelect}
                className="tactile-btn lazer-slant-sm flex w-full items-center justify-between border border-white/15 bg-[#121726] px-5 py-3 text-left text-sm font-bold text-white hover:border-white/35 cursor-pointer"
              >
                <span className="lazer-unslant-sm flex w-full items-center justify-between">
                  <span>Change Track</span>
                  <ListMusic className="h-4 w-4 text-[var(--accent-bright)]" />
                </span>
              </button>

              <button
                type="button"
                onClick={onOpenOrbVault}
                className="tactile-btn lazer-slant-sm flex w-full items-center justify-between border border-[#fbbf24]/35 bg-[#1c1608] px-5 py-3 text-left text-sm font-bold text-[#fbbf24] hover:border-[#fbbf24] cursor-pointer"
              >
                <span className="lazer-unslant-sm flex w-full items-center justify-between">
                  <span>Open Orb Shop</span>
                  <OrbIcon className="h-4 w-4" />
                </span>
              </button>

              <button
                type="button"
                onClick={onGoToTitle}
                className="tactile-btn lazer-slant-sm flex w-full items-center justify-between border border-white/12 bg-[#0f131f] px-5 py-3 text-left text-sm font-bold text-[#d1d5db] hover:text-white cursor-pointer"
              >
                <span className="lazer-unslant-sm flex w-full items-center justify-between">
                  <span>Quit to Title</span>
                  <Home className="h-4 w-4" />
                </span>
              </button>
            </div>
          )}

          {activeTab === 'audio' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border border-white/10 bg-[#101420] p-3.5">
                <div className="flex-1 pr-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">Music</span>
                    <span className="tabular-nums text-xs text-[#a1abbe]">{profile.musicVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={profile.musicVolume}
                    onChange={(e) => onMusicVolume(Number(e.target.value))}
                    className="w-full accent-[var(--accent)]"
                  />
                </div>
                <ArcadeSwitch checked={profile.musicEnabled} onToggle={onToggleMusic} />
              </div>

              <div className="flex items-center justify-between border border-white/10 bg-[#101420] p-3.5">
                <div className="flex-1 pr-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">Hitsounds</span>
                    <span className="tabular-nums text-xs text-[#a1abbe]">{profile.sfxVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={profile.sfxVolume}
                    onChange={(e) => onSfxVolume(Number(e.target.value))}
                    className="w-full accent-[var(--accent)]"
                  />
                </div>
                <ArcadeSwitch checked={profile.soundEnabled} onToggle={onToggleSound} />
              </div>

              <div className="border border-white/10 bg-[#101420] p-3.5">
                <span className="block text-xs font-bold text-white mb-2">Hit SFX Pack</span>
                <div className="flex gap-1.5">
                  {(['switch', 'harmonic', 'rimshot'] as HitSfxMode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => onSelectHitSfx(m)}
                      className={`tactile-btn flex-1 border py-1.5 text-xs font-bold capitalize cursor-pointer ${
                        profile.hitSfxMode === m
                          ? 'border-[var(--accent-bright)] bg-[var(--accent)] text-[var(--accent-on)]'
                          : 'border-white/12 bg-[#161b29] text-[#a1abbe]'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border border-white/10 bg-[#101420] p-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-white">Offset Calibration</span>
                  <span className="tabular-nums text-xs font-bold text-[#22d3ee]">
                    {profile.audioOffsetMs > 0 ? `+${profile.audioOffsetMs}ms` : `${profile.audioOffsetMs}ms`}
                  </span>
                </div>
                <input
                  type="range"
                  min={-150}
                  max={150}
                  step={5}
                  value={profile.audioOffsetMs}
                  onChange={(e) => onUpdateAudioOffset(Number(e.target.value))}
                  className="w-full accent-[var(--accent)]"
                />
              </div>
            </div>
          )}

          {activeTab === 'ctrl' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border border-white/10 bg-[#101420] p-3.5">
                <span className="text-xs font-bold text-white">Trigger Key 1</span>
                <button
                  type="button"
                  onClick={() => onStartRebind(1)}
                  className="tactile-btn border border-white/20 bg-[#171d2e] px-3.5 py-1.5 font-mono text-xs font-bold text-white hover:border-[var(--accent-bright)] cursor-pointer"
                >
                  {listeningSlot === 1 ? 'Press Key...' : profile.trigger1Label}
                </button>
              </div>
              <div className="flex items-center justify-between border border-white/10 bg-[#101420] p-3.5">
                <span className="text-xs font-bold text-white">Trigger Key 2</span>
                <button
                  type="button"
                  onClick={() => onStartRebind(2)}
                  className="tactile-btn border border-white/20 bg-[#171d2e] px-3.5 py-1.5 font-mono text-xs font-bold text-white hover:border-[var(--accent-bright)] cursor-pointer"
                >
                  {listeningSlot === 2 ? 'Press Key...' : profile.trigger2Label}
                </button>
              </div>
              <div className="flex items-center justify-between border border-white/10 bg-[#101420] p-3.5">
                <div>
                  <span className="block text-xs font-bold text-white">Ring Click / Touch</span>
                  <span className="text-[11px] text-[#a1abbe]">Tap &amp; hold directly on disc</span>
                </div>
                <ArcadeSwitch checked={profile.allowPointerTap} onToggle={onTogglePointer} />
              </div>
            </div>
          )}

          {activeTab === 'disp' && (
            <div className="space-y-4">
              <div>
                <span className="block text-xs font-bold text-white mb-2">Background Effects</span>
                <div className="grid grid-cols-3 gap-2">
                  {(['dynamic', 'clean', 'minimal'] as BgFxMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => onSelectBgFx(mode)}
                      className={`tactile-btn border py-2 text-xs font-bold capitalize cursor-pointer ${
                        profile.bgFxMode === mode
                          ? 'border-[var(--accent-bright)] bg-[var(--accent)] text-[var(--accent-on)]'
                          : 'border-white/12 bg-[#101420] text-[#a1abbe]'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-xs font-bold text-white mb-2">Overdrive Flame VFX</span>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'full', label: 'Full Aura' },
                      { id: 'subtle', label: 'Subtle' },
                      { id: 'off', label: 'Off' },
                    ] as { id: OverdriveVfxMode; label: string }[]
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onSelectOverdriveVfx(opt.id)}
                      className={`tactile-btn border py-2 text-xs font-bold cursor-pointer ${
                        profile.overdriveVfxMode === opt.id
                          ? 'border-[var(--accent-bright)] bg-[var(--accent)] text-[var(--accent-on)]'
                          : 'border-white/12 bg-[#101420] text-[#a1abbe]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-xs font-bold text-white mb-2">Cabinet Theme</span>
                <div className="grid grid-cols-2 gap-2">
                  {((Object.keys(themesMap).length > 0 ? Object.keys(themesMap) : Object.keys(CHASSIS_THEMES)) as ThemeId[]).map((tid) => {
                    const t = getResolvedChassisTheme(tid, themesMap);
                    const owned =
                      profile.devUnlocked ||
                      (!t.isTransformationSkin && t.orbCost === 0) ||
                      profile.unlockedThemes.includes(tid);
                    const active = profile.theme === tid;

                    return (
                      <button
                        key={tid}
                        type="button"
                        disabled={!owned}
                        onClick={() => onSelectTheme(tid)}
                        className={`tactile-btn flex items-center gap-2 border p-2.5 text-left cursor-pointer disabled:opacity-40 ${
                          active
                            ? 'border-[var(--accent-bright)] bg-[#171d2e]'
                            : 'border-white/10 bg-[#101420]'
                        }`}
                      >
                        <span
                          className="h-3.5 w-3.5 shrink-0 border border-white/25"
                          style={{ backgroundColor: t.primary }}
                        />
                        <span className="truncate text-xs font-bold text-white">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.aside>
    </div>
  );
};
