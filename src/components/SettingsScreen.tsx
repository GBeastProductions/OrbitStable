import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Cloud,
  Keyboard,
  LogIn,
  LogOut,
  Monitor,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  Volume2,
} from 'lucide-react';
import { CHASSIS_THEMES } from '../data/catalog';
import { XMAS_SPRITES } from '../data/christmasSprites';
import { getResolvedChassisTheme, getResolvedSkinPack } from '../store/studioRegistryStore';
import { BgFxMode, HitSfxMode, OverdriveVfxMode, PlayerProfile, ThemeId } from '../types/game';
import { ArcadeSwitch } from './LazerChrome';
import { CalibrationWizard } from './CalibrationWizard';
import { useStudioLayout } from './LiveLayoutWrapper';
import { OrbIcon } from './OrbIcon';
import { SkinBladeTrim } from './SkinAtmosphere';

type SettingsSection = 'controls' | 'audio' | 'display' | 'profile';

export interface AuthAccountSummary {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface SettingsScreenProps {
  profile: PlayerProfile;
  listeningSlot: 0 | 1 | 2;
  authUser: AuthAccountSummary | null;
  authLoading: boolean;
  authError: string | null;
  isDeveloper: boolean;
  onGoogleSignIn: () => void;
  onGoogleRedirectSignIn?: () => void;
  onGoogleSignOut: () => void;
  onToggleDevUnlock: () => void;
  onOpenDevStudio?: () => void;
  onStartRebind: (slot: 1 | 2) => void;
  onBackToTitle: () => void;
  onTogglePointer: () => void;
  onReplayTutorial: () => void;
  onUpdateAudioOffset: (ms: number) => void;
  onToggleMusic: () => void;
  onMusicVolume: (vol: number) => void;
  onToggleSound: () => void;
  onSfxVolume: (vol: number) => void;
  onSelectHitSfx: (mode: HitSfxMode) => void;
  onSelectTheme: (theme: ThemeId) => void;
  onSelectBgFx: (mode: BgFxMode) => void;
  onSelectOverdriveVfx: (mode: OverdriveVfxMode) => void;
  onOpenShop: () => void;
  onResetCareer: () => void;
  onResetDefaults: () => void;
  onTestTick: () => void;
}

const SECTIONS: { id: SettingsSection; label: string; sub: string; Icon: React.FC<{ className?: string }> }[] = [
  { id: 'controls', label: 'Controls & Input', sub: 'Trigger keys & live key test', Icon: Keyboard },
  { id: 'audio', label: 'Audio & Calibration', sub: 'Volumes, hit SFX & ms offset', Icon: Volume2 },
  { id: 'display', label: 'Display & Themes', sub: 'Cabinet skins & stage FX', Icon: Monitor },
  { id: 'profile', label: 'Account & Roles', sub: 'Google Sign-In & dev access', Icon: ShieldCheck },
];

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  profile,
  listeningSlot,
  authUser,
  authLoading,
  authError,
  isDeveloper,
  onGoogleSignIn,
  onGoogleRedirectSignIn,
  onGoogleSignOut,
  onToggleDevUnlock,
  onOpenDevStudio,
  onStartRebind,
  onBackToTitle,
  onTogglePointer,
  onReplayTutorial,
  onUpdateAudioOffset,
  onToggleMusic,
  onMusicVolume,
  onToggleSound,
  onSfxVolume,
  onSelectHitSfx,
  onSelectTheme,
  onSelectBgFx,
  onSelectOverdriveVfx,
  onOpenShop,
  onResetCareer,
  onResetDefaults,
  onTestTick,
}) => {
  const { themesMap } = useStudioLayout();
  const skin = getResolvedSkinPack(profile.theme, themesMap);
  const isCozyXmas = profile.theme === 'cozy_christmas_2026';
  const themeIds = (
    Object.keys(themesMap).length > 0 ? Object.keys(themesMap) : Object.keys(CHASSIS_THEMES)
  ) as ThemeId[];
  const [section, setSection] = useState<SettingsSection>('controls');
  const [pressedTest, setPressedTest] = useState<'k1' | 'k2' | null>(null);
  const [tapCalTimes, setTapCalTimes] = useState<number[]>([]);
  const tapResetTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.repeat || listeningSlot !== 0) return;
      if (e.code === profile.trigger1Code) {
        setPressedTest('k1');
        onTestTick();
      } else if (e.code === profile.trigger2Code) {
        setPressedTest('k2');
        onTestTick();
      }
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.code === profile.trigger1Code || e.code === profile.trigger2Code) {
        setPressedTest(null);
      }
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [listeningSlot, onTestTick, profile.trigger1Code, profile.trigger2Code]);

  const handleTapCalibrate = () => {
    const now = performance.now();
    onTestTick();
    if (tapResetTimerRef.current) window.clearTimeout(tapResetTimerRef.current);
    tapResetTimerRef.current = window.setTimeout(() => setTapCalTimes([]), 2200);

    setTapCalTimes((prev) => {
      const next = [...prev, now].slice(-6);
      if (next.length >= 4) {
        const intervals: number[] = [];
        for (let i = 1; i < next.length; i++) {
          intervals.push(next[i] - next[i - 1]);
        }
        const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        // Measure deviation from 500ms (120 BPM metronome intuition) clamped nicely to -60..+60ms
        const jitter = Math.round(((avg % 500) - 250) * 0.15);
        const nudged = Math.max(-150, Math.min(150, Math.round(jitter / 5) * 5));
        onUpdateAudioOffset(nudged);
      }
      return next;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="relative z-10 flex h-dvh w-full flex-col overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${skin.backdropScrimRgba} 0%, rgba(9,13,23,0.68) 50%, ${skin.backdropScrimRgba} 100%)`,
        }}
      />

      {/* Top 3-Zone Header */}
      <header
        className="relative z-20 flex h-[60px] shrink-0 items-center justify-between gap-4 border-b px-4 sm:px-8"
        style={{
          backgroundColor: skin.headerBg,
          borderColor: skin.surfaceBorder,
        }}
      >
        <SkinBladeTrim themeId={profile.theme} />
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onBackToTitle}
            className="tactile-btn lazer-slant-sm flex items-center border px-3.5 py-2 text-xs font-bold text-white hover:border-[var(--accent-bright)] cursor-pointer whitespace-nowrap"
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
          <div className="flex items-baseline gap-2.5 whitespace-nowrap">
            {isCozyXmas && (
              <img
                aria-hidden="true"
                src={XMAS_SPRITES.hollyBells}
                alt=""
                className="hidden sm:block h-7 w-7 self-center object-contain drop-shadow"
              />
            )}
            <h1 className="font-display text-lg sm:text-2xl font-black tracking-tight text-white">
              Cabinet Settings
            </h1>
            <span className="hidden sm:inline text-xs font-semibold tracking-[0.2em] text-[var(--accent-bright)]">
              システム設定
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onResetDefaults}
            className="tactile-btn lazer-slant-sm border px-3.5 py-2 text-xs font-semibold text-[#d1d5db] hover:border-white/35 hover:text-white cursor-pointer whitespace-nowrap"
            style={{
              backgroundColor: skin.bladeBg,
              borderColor: skin.surfaceBorder,
            }}
          >
            <span className="lazer-unslant-sm block">Restore Defaults</span>
          </button>
        </div>
      </header>

      {/* Main Split Console: Left Sloped Category Rail + Right Parameter Workbench */}
      <main className="relative z-20 mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-4 overflow-hidden px-4 py-4 sm:px-8 sm:py-5 lg:grid lg:grid-cols-12 lg:gap-6">
        {/* Left Navigation Blades */}
        <nav
          aria-label="Settings Categories"
          className="flex shrink-0 flex-row gap-2 overflow-x-auto pb-1 lg:col-span-4 lg:flex-col lg:gap-3 lg:overflow-visible lg:pb-0"
        >
          {SECTIONS.map((item) => {
            const Icon = item.Icon;
            const active = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={`tactile-btn lazer-slant-sm relative flex shrink-0 items-center justify-between gap-3 border px-3.5 py-2 text-left cursor-pointer lg:w-full lg:px-4 lg:py-3 ${
                  active
                    ? 'border-[var(--accent-bright)] bg-[var(--accent)] text-[var(--accent-on)] shadow-[0_8px_28px_rgba(var(--bg-accent-rgb,255,59,130),0.24)]'
                    : 'text-white hover:border-white/30'
                }`}
                style={
                  active
                    ? undefined
                    : {
                        backgroundColor: skin.bladeBg,
                        borderColor: skin.surfaceBorder,
                      }
                }
              >
                {active && <SkinBladeTrim themeId={profile.theme} />}
                <span className="lazer-unslant-sm flex items-center gap-2.5 lg:gap-3 min-w-0">
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      active ? 'text-white' : 'text-[var(--accent-bright)]'
                    }`}
                  />
                  <span className="min-w-0">
                    <span className="font-display block text-xs sm:text-base font-extrabold leading-tight whitespace-nowrap">
                      {item.label}
                    </span>
                    <span
                      className={`hidden lg:block text-[11px] truncate ${
                        active ? 'text-white/90' : 'text-[#a1abbe]'
                      }`}
                    >
                      {item.sub}
                    </span>
                  </span>
                </span>
              </button>
            );
          })}
        </nav>

        {/* Right Workbench */}
        <section
          className="orbit-scroll relative flex-1 overflow-y-auto border p-5 sm:p-7 lg:col-span-8"
          style={{
            backgroundColor: skin.surfaceBg,
            borderColor: skin.surfaceBorder,
          }}
        >
          <SkinBladeTrim themeId={profile.theme} compact />
          {section === 'controls' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-xl font-black text-white">
                  Dual-Trigger Keybinds
                </h2>
                <p className="mt-1 text-xs text-[#a1abbe]">
                  Bind two ergonomic keys for fast Double Taps, Beat Bursts, and Vinyl Fever mashes. Hold either key cleanly to ride Hold Arcs.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="skin-blade flex items-center justify-between border p-4">
                  <div>
                    <span className="block text-sm font-bold text-white">Primary Trigger</span>
                    <span className="text-xs text-[#a1abbe]">Main tap &amp; hold action</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onStartRebind(1)}
                    data-pressed={pressedTest === 'k1'}
                    className={`tactile-btn border px-4 py-2 font-mono text-xs font-extrabold cursor-pointer ${
                      listeningSlot === 1
                        ? 'border-[#fde047] bg-[#2a2206] text-[#fde047]'
                        : pressedTest === 'k1'
                        ? 'border-[var(--accent-bright)] bg-[var(--accent)] text-[var(--accent-on)]'
                        : 'skin-surface-elevated border text-white hover:border-[var(--accent-bright)]'
                    }`}
                  >
                    {listeningSlot === 1 ? 'PRESS ANY KEY...' : profile.trigger1Label}
                  </button>
                </div>

                <div className="skin-blade flex items-center justify-between border p-4">
                  <div>
                    <span className="block text-sm font-bold text-white">Secondary Trigger</span>
                    <span className="text-xs text-[#a1abbe]">Alternate double-tap key</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onStartRebind(2)}
                    data-pressed={pressedTest === 'k2'}
                    className={`tactile-btn border px-4 py-2 font-mono text-xs font-extrabold cursor-pointer ${
                      listeningSlot === 2
                        ? 'border-[#fde047] bg-[#2a2206] text-[#fde047]'
                        : pressedTest === 'k2'
                        ? 'border-[var(--accent-bright)] bg-[var(--accent)] text-[var(--accent-on)]'
                        : 'skin-surface-elevated border text-white hover:border-[var(--accent-bright)]'
                    }`}
                  >
                    {listeningSlot === 2 ? 'PRESS ANY KEY...' : profile.trigger2Label}
                  </button>
                </div>
              </div>

              <div className="skin-blade flex items-center justify-between border p-4">
                <div>
                  <span className="block text-sm font-bold text-white">Mouse / Touch Ring Click</span>
                  <span className="text-xs text-[#a1abbe]">
                    Allow pressing and holding directly inside the Orbit playfield
                  </span>
                </div>
                <ArcadeSwitch checked={profile.allowPointerTap} onToggle={onTogglePointer} />
              </div>

              <div className="border-t border-white/10 pt-5 flex flex-wrap items-center justify-between gap-4">
                <p className="text-xs text-[#808ba1]">
                  Live input check: tap <strong className="text-white">{profile.trigger1Label}</strong> or{' '}
                  <strong className="text-white">{profile.trigger2Label}</strong> right now to confirm switch actuation.
                </p>
                <button
                  type="button"
                  onClick={onReplayTutorial}
                  className="tactile-btn skin-surface-elevated flex items-center gap-2 border px-4 py-2 text-xs font-bold text-white hover:border-[var(--accent-bright)] cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Launch Calibration Tutorial</span>
                </button>
              </div>
            </div>
          )}

          {section === 'audio' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-xl font-black text-white">
                  Studio Audio &amp; Sync Calibration
                </h2>
                <p className="mt-1 text-xs text-[#a1abbe]">
                  All 15 MP3 tracks play at studio 1.0x pitch across every difficulty tier. Fine-tune output and Bluetooth/hardware latency here.
                </p>
              </div>

              <div className="space-y-4">
                <div className="skin-blade flex items-center justify-between border p-4">
                  <div className="flex-1 pr-5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-bold text-white">Soundtrack Music Volume</span>
                      <span className="tabular-nums text-xs font-bold text-[var(--accent-secondary)]">{profile.musicVolume}%</span>
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

                <div className="skin-blade flex items-center justify-between border p-4">
                  <div className="flex-1 pr-5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-bold text-white">Hitsound &amp; Hold Shimmer Volume</span>
                      <span className="tabular-nums text-xs font-bold text-[var(--accent-secondary)]">{profile.sfxVolume}%</span>
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
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="skin-blade border p-4">
                  <span className="block text-sm font-bold text-white mb-2.5">Hitsound Profile (Click to Audition)</span>
                  <div className="flex gap-2">
                    {(['switch', 'harmonic', 'rimshot'] as HitSfxMode[]).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => onSelectHitSfx(m)}
                        className={`tactile-btn lazer-slant-sm flex-1 border py-2 text-xs font-bold capitalize cursor-pointer ${
                          profile.hitSfxMode === m
                            ? 'border-[var(--accent-bright)] bg-[var(--accent)] text-[var(--accent-on)]'
                            : 'skin-surface-elevated text-[#a1abbe] hover:text-white'
                        }`}
                      >
                        <span className="lazer-unslant-sm block">{m}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="skin-blade border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-white">Audio Sync Offset</span>
                    <span className="tabular-nums text-xs font-extrabold text-[var(--accent-secondary)]">
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
                  <div className="mt-2.5 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleTapCalibrate}
                      className="tactile-btn skin-surface-elevated border px-3 py-1 text-[11px] font-bold text-white hover:border-[var(--accent-bright)] cursor-pointer"
                    >
                      Quick Tap ({tapCalTimes.length}/4)
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateAudioOffset(0)}
                      className="text-[11px] text-[#a1abbe] hover:text-white underline cursor-pointer"
                    >
                      Reset 0ms
                    </button>
                  </div>
                </div>
              </div>

              <CalibrationWizard
                currentOffsetMs={profile.audioOffsetMs}
                trigger1Code={profile.trigger1Code}
                trigger1Label={profile.trigger1Label}
                trigger2Code={profile.trigger2Code}
                trigger2Label={profile.trigger2Label}
                onApplyOffset={onUpdateAudioOffset}
              />
            </div>
          )}

          {section === 'display' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-xl font-black text-white">
                  Cabinet Styling &amp; Stage FX
                </h2>
                <p className="mt-1 text-xs text-[#a1abbe]">
                  Customize reactive stage telemetry rings and swap unlocked Tokyo Arcade cabinet glow themes.
                </p>
              </div>

              <div>
                <span className="block text-sm font-bold text-white mb-2.5">Background &amp; Spectrum Intensity</span>
                <div className="grid grid-cols-3 gap-3">
                  {(['dynamic', 'clean', 'minimal'] as BgFxMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => onSelectBgFx(mode)}
                      className={`tactile-btn lazer-slant-sm border py-2.5 text-xs font-bold capitalize cursor-pointer ${
                        profile.bgFxMode === mode
                          ? 'border-[var(--accent-bright)] bg-[var(--accent)] text-[var(--accent-on)]'
                          : 'border-white/12 bg-[#121726] text-[#a1abbe] hover:text-white'
                      }`}
                    >
                      <span className="lazer-unslant-sm block">{mode}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-sm font-bold text-white">Overdrive Flame VFX</span>
                  <span className="text-[11px] text-[#a1abbe]">Aura &amp; anamorphic flare intensity</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
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
                      className={`tactile-btn lazer-slant-sm border py-2.5 text-xs font-bold cursor-pointer ${
                        profile.overdriveVfxMode === opt.id
                          ? 'border-[var(--accent-bright)] bg-[var(--accent)] text-[var(--accent-on)]'
                          : 'border-white/12 bg-[#121726] text-[#a1abbe] hover:text-white'
                      }`}
                    >
                      <span className="lazer-unslant-sm block">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-bold text-white">Cabinet Themes ({themeIds.length})</span>
                  <div className="flex items-center gap-4">
                    {isDeveloper && (
                      <button
                        type="button"
                        onClick={onToggleDevUnlock}
                        className={`text-xs font-bold cursor-pointer ${
                          profile.devUnlocked ? 'text-[#34d399]' : 'text-[#fde047] hover:underline'
                        }`}
                      >
                        {profile.devUnlocked ? 'Dev Preview: All Unlocked' : 'Unlock All for Preview'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onOpenShop}
                      className="flex items-center gap-1.5 text-xs font-bold text-[#fbbf24] hover:underline cursor-pointer"
                    >
                      <OrbIcon className="h-3.5 w-3.5" />
                      <span>Unlock More in Orb Shop</span>
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {themeIds.map((tid) => {
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
                        className={`tactile-btn relative flex flex-col gap-2 border p-3 text-left cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                          active
                            ? 'border-[var(--accent-bright)]'
                            : 'hover:border-white/30'
                        }`}
                        style={{
                          backgroundColor: active ? skin.surfaceElevatedBg : skin.bladeBg,
                          borderColor: active ? undefined : skin.surfaceBorder,
                        }}
                      >
                        {active && <SkinBladeTrim themeId={tid} compact />}
                        <div className="flex items-center justify-between">
                          <span
                            className="h-4 w-8 border border-white/25"
                            style={{
                              background: t.isTransformationSkin
                                ? `linear-gradient(135deg, ${t.primary}, ${t.secondary})`
                                : t.primary,
                            }}
                          />
                          {active ? (
                            <span className="text-[10px] font-extrabold text-[var(--accent-bright)]">
                              ACTIVE
                            </span>
                          ) : t.isTransformationSkin ? (
                            <Sparkles className="h-3.5 w-3.5 text-[#fde047]" />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <span className="block truncate text-xs font-bold text-white">{t.label}</span>
                          <span className="block truncate text-[10px] text-[#a1abbe]">
                            {owned
                              ? t.jpLabel
                              : t.isTransformationSkin
                              ? t.unlockRequirement || 'Skill Milestone'
                              : `${t.orbCost} Orbs`}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {section === 'profile' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-xl font-black text-white">
                  Account Sync &amp; Developer Role Access
                </h2>
                <p className="mt-1 text-xs text-[#a1abbe]">
                  Sign in with Google to back up your Orbit records and unlock Themes across devices. Developer sandbox access is verified by role rather than client passcodes.
                </p>
              </div>

              {/* Google Account Card */}
              <div
                className="border p-4 space-y-4"
                style={{ backgroundColor: skin.bladeBg, borderColor: skin.surfaceBorder }}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    {authUser?.photoURL ? (
                      <img
                        src={authUser.photoURL}
                        alt={authUser.displayName || 'Account avatar'}
                        referrerPolicy="no-referrer"
                        className="h-11 w-11 shrink-0 border border-white/25 object-cover"
                      />
                    ) : (
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center border"
                        style={{ backgroundColor: skin.surfaceElevatedBg, borderColor: skin.surfaceBorder }}
                      >
                        <Cloud className="h-5 w-5 text-[#22d3ee]" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <span className="block truncate text-sm font-bold text-white">
                        {authUser ? authUser.displayName || 'Orbit Account' : 'Not Signed In'}
                      </span>
                      <span className="block truncate text-xs text-[#a1abbe]">
                        {authUser
                          ? `${authUser.email || 'Signed in'} · Cloud Backup Active`
                          : `Host: ${typeof window !== 'undefined' ? window.location.hostname : 'localhost'} · Google Sign-In syncs Orbs, Skins & Dev Role`}
                      </span>
                    </div>
                  </div>

                  {authUser ? (
                    <button
                      type="button"
                      disabled={authLoading}
                      onClick={onGoogleSignOut}
                      className="tactile-btn flex items-center gap-2 border border-white/20 bg-[#181f33] px-4 py-2 text-xs font-bold text-white hover:border-[#ef4444] cursor-pointer disabled:opacity-50 whitespace-nowrap"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={authLoading}
                        onClick={onGoogleSignIn}
                        className="tactile-btn lazer-slant-sm flex items-center border border-[var(--accent-bright)] bg-[var(--accent)] px-4 py-2 text-xs font-black text-[var(--accent-on)] hover:bg-[var(--accent-bright)] cursor-pointer disabled:opacity-50 whitespace-nowrap"
                      >
                        <span className="lazer-unslant-sm flex items-center gap-2">
                          <LogIn className="h-3.5 w-3.5" />
                          <span>{authLoading ? 'Connecting...' : 'Sign in with Google'}</span>
                        </span>
                      </button>
                      {onGoogleRedirectSignIn && (
                        <button
                          type="button"
                          disabled={authLoading}
                          onClick={onGoogleRedirectSignIn}
                          className="tactile-btn border border-white/20 bg-black/50 px-3 py-2 text-xs font-semibold text-[#d1d5db] hover:border-white hover:text-white cursor-pointer disabled:opacity-50 whitespace-nowrap"
                        >
                          Redirect Sign-In
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {authError && (
                  <p className="border border-[#ef4444]/40 bg-[#2a0e14] px-3 py-2 text-xs text-[#fecaca]">
                    {authError}
                  </p>
                )}
              </div>

              {/* Role-Gated Developer Sandbox Panel */}
              <div
                className="border p-4 space-y-3"
                style={{ backgroundColor: skin.bladeBg, borderColor: skin.surfaceBorder }}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-bold text-white">Developer Sandbox Mode</span>
                      <span aria-hidden="true" className="text-white/30">·</span>
                      <span className={`text-xs font-extrabold ${isDeveloper ? 'text-[#34d399]' : 'text-[#808ba1]'}`}>
                        {isDeveloper ? 'Verified Developer' : 'Player Role'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#a1abbe]">
                      {isDeveloper
                        ? 'Your account holds Developer permissions via Firebase. Toggle Preview Unlock or launch the stark Black & White Axiom Dev Studio.'
                        : 'Set dev: true on your user_profiles document in Firebase Console to unlock Developer Engine View & Sandbox previews.'}
                    </p>
                  </div>

                  {isDeveloper && (
                    <div className="flex items-center gap-3">
                      <ArcadeSwitch checked={profile.devUnlocked} onToggle={onToggleDevUnlock} />
                      {onOpenDevStudio && (
                        <button
                          type="button"
                          onClick={onOpenDevStudio}
                          className="tactile-btn flex items-center gap-2 border-2 border-white bg-black px-3.5 py-2 text-xs font-black uppercase tracking-wider text-white hover:bg-white hover:text-black cursor-pointer whitespace-nowrap"
                        >
                          <TerminalSquare className="h-3.5 w-3.5" />
                          <span>Dev Studio</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 border border-[#ef4444]/30 bg-[#1a0b0e] p-4">
                <div>
                  <span className="block text-sm font-bold text-[#fca5a5]">Reset Local Career Save</span>
                  <span className="text-xs text-[#a1abbe]">
                    Clears scores, Orbs, unlocked tracks, badges, and mechanic stats.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onResetCareer}
                  className="tactile-btn border border-[#ef4444]/60 bg-[#2e0c12] px-4 py-2 text-xs font-extrabold text-[#fecaca] hover:bg-[#ef4444] hover:text-white cursor-pointer"
                >
                  Wipe Save Data
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </motion.div>
  );
};
