import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  Disc3,
  ListMusic,
  Play,
  Settings,
  TerminalSquare,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { BADGE_CATALOG, WAVE_MODES } from '../data/catalog';
import { computeMasteryPrestige } from '../engine/beatmap';
import { getResolvedChassisTheme, getResolvedSkinPack } from '../store/studioRegistryStore';
import { PlayerProfile, SongDefinition } from '../types/game';
import { DiscCartridge } from './DiscCartridge';
import { StudioSlot, useStudioLayout } from './LiveLayoutWrapper';
import { IndexIcon, OrbIcon } from './OrbIcon';
import { SkinBladeTrim } from './SkinAtmosphere';
import { ThemeTitleLogo } from './ThemeChrome';

interface TitleScreenProps {
  profile: PlayerProfile;
  activeSong: SongDefinition;
  songs: SongDefinition[];
  isDeveloper?: boolean;
  onPlayPrimary: () => void;
  onEnterSongSelect: () => void;
  onOpenOrbVault: () => void;
  onOpenSettings: () => void;
  onOpenIndex: () => void;
  onOpenDevStudio?: () => void;
  onToggleMusic: () => void;
  onHoverTick: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = React.memo(
  ({
    profile,
    activeSong,
    songs,
    isDeveloper = false,
    onPlayPrimary,
    onEnterSongSelect,
    onOpenOrbVault,
    onOpenSettings,
    onOpenIndex,
    onOpenDevStudio,
    onToggleMusic,
    onHoverTick,
  }) => {
    const { themesMap } = useStudioLayout();
    const theme = getResolvedChassisTheme(profile.theme, themesMap);
    const skin = getResolvedSkinPack(profile.theme, themesMap);
    const prestige = computeMasteryPrestige(profile, songs);
    const [pressedKey, setPressedKey] = useState<'k1' | 'k2' | null>(null);
    const [beatPhase, setBeatPhase] = useState(0);
    const [discHovered, setDiscHovered] = useState(false);

    const activeRecord = profile.songRecords[activeSong.id];
    const activeBg =
      profile.levelBgSettings[activeSong.id]?.customImageDataUrl || activeSong.bgImageUrl;
    const beatIntervalMs = Math.round(60000 / Math.max(65, activeSong.bpm));

    useEffect(() => {
      const id = window.setInterval(() => {
        setBeatPhase((prev) => (prev + 1) % 4);
      }, beatIntervalMs);
      return () => window.clearInterval(id);
    }, [beatIntervalMs]);

    useEffect(() => {
      const onDown = (e: KeyboardEvent) => {
        if (e.repeat) return;
        if (e.code === profile.trigger1Code) {
          setPressedKey('k1');
          onHoverTick();
        } else if (e.code === profile.trigger2Code) {
          setPressedKey('k2');
          onHoverTick();
        }
      };
      const onUp = (e: KeyboardEvent) => {
        if (e.code === profile.trigger1Code || e.code === profile.trigger2Code) {
          setPressedKey(null);
        }
      };
      window.addEventListener('keydown', onDown);
      window.addEventListener('keyup', onUp);
      return () => {
        window.removeEventListener('keydown', onDown);
        window.removeEventListener('keyup', onUp);
      };
    }, [profile.trigger1Code, profile.trigger2Code, onHoverTick]);

    const menuItems = [
      {
        id: 'play',
        label: !profile.tutorialSongCompleted ? 'Start Tutorial' : 'Play Active Track',
        sub: !profile.tutorialSongCompleted
          ? 'Moments Passing Us · Calibration'
          : `${activeSong.title} · ${activeSong.artist}`,
        primary: true,
        offsetClass: 'ml-0',
        onClick: onPlayPrimary,
        renderIcon: () => <Play className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-white" />,
      },
      {
        id: 'tracks',
        label: 'Track Select',
        sub: `${songs.length} Songs · Daily, Weekly Demon & Arcade`,
        primary: false,
        offsetClass: 'sm:ml-4',
        onClick: onEnterSongSelect,
        renderIcon: () => (
          <ListMusic className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-[var(--accent-bright)]" />
        ),
      },
      {
        id: 'shop',
        label: 'Orb Shop',
        sub: `${profile.orbs.toLocaleString()} Orbs · Mods, Themes & Tracks`,
        primary: false,
        offsetClass: 'sm:ml-8',
        onClick: onOpenOrbVault,
        renderIcon: () => <OrbIcon className="h-5 w-5 shrink-0 !text-white text-white" />,
      },
      {
        id: 'index',
        label: 'The Index',
        sub: `${WAVE_MODES.length} Mechanics · ${profile.unlockedBadges.length}/${BADGE_CATALOG.length} Badges & Stats`,
        primary: false,
        offsetClass: 'sm:ml-12',
        onClick: onOpenIndex,
        renderIcon: () => <IndexIcon className="h-5 w-5 shrink-0 !text-white text-white" />,
      },
      {
        id: 'settings',
        label: 'Settings',
        sub: 'Audio · Keybinds · Calibration',
        primary: false,
        offsetClass: 'sm:ml-16',
        onClick: onOpenSettings,
        renderIcon: () => (
          <Settings className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-[var(--accent-bright)]" />
        ),
      },
    ];

    return (
      <div className="relative z-10 flex h-dvh w-full flex-col justify-between overflow-hidden px-4 py-3 sm:px-10 sm:py-5">
        {/* Radial disco / transformation spotlight */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background: skin.isFullTransformation
              ? `radial-gradient(circle at 28% 52%, rgba(${theme.bgAccentRgb}, 0.22) 0%, transparent 48%, rgba(7,8,13,0.45) 86%)`
              : `radial-gradient(circle at 28% 52%, rgba(${theme.bgAccentRgb}, 0.20) 0%, rgba(34, 211, 238, 0.06) 38%, rgba(7,8,13,0.78) 78%)`,
          }}
        />

        {/* Top 3-Zone Header Contract */}
        <header
          className="relative z-20 flex w-full items-center justify-between gap-4 border-b pb-2.5 sm:pb-3"
          style={{ borderColor: skin.surfaceBorder }}
        >
          {/* Zone 1: Theme-crafted ORBIT Crest Logo */}
          <StudioSlot
            widgetId="title_hero_badge"
            label="Title Hero Wordmark"
            className="flex items-center origin-left scale-[0.72] sm:scale-[0.84] whitespace-nowrap shrink-0"
          >
            <ThemeTitleLogo themeId={profile.theme} accentColor={theme.bright} />
          </StudioSlot>

          {/* Zone 2: Quiet Unboxed Career Telemetry */}
          <div className="hidden md:flex items-center gap-4 text-xs text-[#b6bfd1] tabular-nums whitespace-nowrap">
            <span>
              <strong className="font-extrabold" style={{ color: prestige.tierColor }}>
                {prestige.tierTitle}
              </strong>
              <span className="ml-1.5 text-[#9aa5ba]">
                SS {prestige.ssCount}/{prestige.totalSongsCount}
              </span>
            </span>
            <span aria-hidden="true" className="text-white/25">·</span>
            <span>
              Best <strong className="ml-1 font-bold text-white">{profile.bestScore.toLocaleString()}</strong>
            </span>
            <span aria-hidden="true" className="text-white/25">·</span>
            <span>
              Peak Combo <strong className="ml-1 font-bold text-[#22d3ee]">{profile.bestStreak}x</strong>
            </span>
            <span aria-hidden="true" className="text-white/25">·</span>
            <span className="inline-flex items-center gap-1.5">
              <OrbIcon className="h-4 w-4 text-white" />
              <strong className="font-bold text-white">{profile.orbs.toLocaleString()}</strong>
            </span>
          </div>

          {/* Zone 3: Primary Audio Action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onToggleMusic}
              className="tactile-btn lazer-slant-sm flex items-center gap-2 border px-4 py-2 text-xs font-semibold text-white hover:border-[var(--accent-bright)] cursor-pointer whitespace-nowrap shrink-0"
              style={{
                backgroundColor: skin.bladeBg,
                borderColor: skin.surfaceBorder,
              }}
              aria-label={profile.musicEnabled ? 'Mute Soundtrack' : 'Enable Soundtrack'}
            >
              <span className="lazer-unslant-sm flex items-center gap-2">
                {profile.musicEnabled ? (
                  <Volume2 className="h-4 w-4 text-[var(--accent-bright)]" />
                ) : (
                  <VolumeX className="h-4 w-4 text-[#68738a]" />
                )}
                <span>{profile.musicEnabled ? 'Audio On' : 'Muted'}</span>
              </span>
            </button>
          </div>
        </header>

        {/* Main Asymmetric Split: Tokyo Turntable Disc (Left) + osu!lazer Menu Fan (Right) */}
        <main className="relative z-20 mx-auto flex w-full max-w-[1260px] flex-1 flex-col items-center justify-center gap-3 sm:gap-6 lg:flex-row lg:justify-between lg:gap-12 min-h-0">
          {/* Left Focal Anchor: Spinning Vinyl Disc Turntable */}
          <StudioSlot widgetId="title_turntable" label="Center Turntable" className="shrink-0">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center lg:items-start shrink-0"
            >
              <button
                type="button"
                onClick={onEnterSongSelect}
                onMouseEnter={() => {
                  setDiscHovered(true);
                  onHoverTick();
                }}
                onMouseLeave={() => setDiscHovered(false)}
                className="group relative overflow-visible rounded-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-bright)]"
                aria-label="Open Track Select"
              >
                <DiscCartridge
                  imageUrl={activeBg}
                  num={activeSong.num}
                  title={activeSong.title}
                  themeId={profile.theme}
                  size="hero"
                  spinning
                  beatPulse={beatPhase === 0 || discHovered}
                />
              </button>

              {/* Thematic Now Spinning Caption Plaque */}
              <div className="mt-3 sm:mt-5 flex flex-col items-center text-center lg:items-start lg:text-left">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#d1d9e6]">
                  <Disc3 className="h-3.5 w-3.5 text-[var(--accent-bright)]" />
                  <span>Now Spinning</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{activeSong.bpm} BPM</span>
                  {activeRecord && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums font-bold text-[#fbbf24]">
                        Rank {activeRecord.bestRank}
                      </span>
                    </>
                  )}
                </div>
                <h1
                  className="font-display mt-1 text-xl sm:text-3xl font-extrabold tracking-tight text-white"
                  style={{
                    textShadow: skin.isFullTransformation
                      ? `0 2px 18px rgba(${theme.bgAccentRgb}, 0.45)`
                      : undefined,
                  }}
                >
                  {activeSong.title}
                </h1>
                <p className="text-xs sm:text-sm text-[#b6bfd1]">
                  {activeSong.artist} · {activeSong.genre}
                </p>
              </div>
            </motion.div>
          </StudioSlot>

          {/* Right Column: Kinetic osu!lazer Slanted Menu Blades */}
          <motion.nav
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            aria-label="Main Menu"
            className="flex w-full max-w-[465px] flex-col gap-1.5 sm:gap-2.5"
          >
            {menuItems.map((item) => {
              const widgetIdMap: Record<string, string> = {
                play: 'title_play_btn',
                tracks: 'title_tracks_btn',
                shop: 'title_shop_btn',
                index: 'title_index_btn',
                settings: 'title_settings_btn',
              };
              return (
                <StudioSlot
                  key={item.id}
                  widgetId={widgetIdMap[item.id] || `title_${item.id}_btn`}
                  label={item.label}
                  className={item.offsetClass}
                >
                  <button
                    type="button"
                    onClick={item.onClick}
                    onMouseEnter={onHoverTick}
                    className={`tactile-btn group lazer-slant relative overflow-visible flex w-full items-center justify-between border px-5 py-2 sm:px-6 sm:py-3 text-left cursor-pointer ${
                      item.primary
                        ? 'border-[var(--accent-bright)] bg-[var(--accent)] text-[var(--accent-on)] shadow-[0_10px_32px_rgba(var(--bg-accent-rgb,255,59,130),0.28)] hover:bg-[var(--accent-bright)]'
                        : 'text-white hover:border-[var(--accent-bright)]'
                    }`}
                    style={
                      item.primary
                        ? undefined
                        : {
                            backgroundColor: skin.bladeBg,
                            borderColor: skin.surfaceBorder,
                          }
                    }
                  >
                    <SkinBladeTrim themeId={profile.theme} featured={item.primary} />
                    <div className="lazer-unslant flex w-full items-center justify-between gap-4 min-w-0">
                      <div className="flex items-center gap-3.5 min-w-0">
                        {item.renderIcon()}
                        <div className="min-w-0">
                          <span className="font-display block truncate text-base sm:text-xl font-extrabold tracking-tight leading-tight">
                            {item.label}
                          </span>
                          <span
                            className={`block truncate text-[11px] sm:text-xs ${
                              item.primary ? 'text-white/90 font-medium' : 'text-[#b6bfd1]'
                            }`}
                          >
                            {item.sub}
                          </span>
                        </div>
                      </div>
                      <span
                        aria-hidden="true"
                        className={`text-sm font-bold transition-transform duration-150 group-hover:translate-x-1 shrink-0 ${
                          item.primary ? 'text-white' : 'text-white/55 group-hover:text-[var(--accent-bright)]'
                        }`}
                      >
                        →
                      </span>
                    </div>
                  </button>
                </StudioSlot>
              );
            })}

            {/* Stark Black & White Developer Engine Entry directly below Settings */}
            {isDeveloper && onOpenDevStudio && (
              <StudioSlot
                widgetId="title_dev_studio_btn"
                label="Axiom Dev Studio"
                className="sm:ml-20"
              >
                <button
                  type="button"
                  onClick={onOpenDevStudio}
                  onMouseEnter={onHoverTick}
                  className="tactile-btn group lazer-slant relative flex w-full items-center justify-between border-2 border-white bg-black px-5 py-2 sm:px-6 sm:py-2.5 text-left text-white shadow-[0_10px_28px_rgba(0,0,0,0.85)] hover:bg-white hover:text-black cursor-pointer"
                >
                  <div className="lazer-unslant flex w-full items-center justify-between gap-4 min-w-0">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <TerminalSquare className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                      <div className="min-w-0">
                        <span className="font-display block truncate text-sm sm:text-lg font-black uppercase tracking-wider leading-tight">
                          Dev Studio
                        </span>
                        <span className="block truncate text-[11px] opacity-80">
                          Game Engine View · Shaders, Beatmaps &amp; GitHub Push
                        </span>
                      </div>
                    </div>
                    <span
                      aria-hidden="true"
                      className="text-sm font-black transition-transform duration-150 group-hover:translate-x-1 shrink-0"
                    >
                      →
                    </span>
                  </div>
                </button>
              </StudioSlot>
            )}
          </motion.nav>
        </main>

        {/* Clean Footer Strip: Keybind Check + Theme Era Tag */}
        <footer
          className="relative z-20 flex w-full items-center justify-between gap-3 border-t pt-2 sm:pt-2.5 text-xs text-[#b6bfd1] shrink-0"
          style={{ borderColor: skin.surfaceBorder }}
        >
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span>Triggers</span>
            <span
              data-pressed={pressedKey === 'k1'}
              className={`tactile-btn inline-flex items-center border px-2 py-0.5 sm:px-2.5 sm:py-1 font-mono text-[11px] font-bold ${
                pressedKey === 'k1'
                  ? 'border-[var(--accent-bright)] bg-[var(--accent)] text-white'
                  : 'text-white'
              }`}
              style={
                pressedKey === 'k1'
                  ? undefined
                  : { backgroundColor: skin.bladeBg, borderColor: skin.surfaceBorder }
              }
            >
              {profile.trigger1Label}
            </span>
            <span
              data-pressed={pressedKey === 'k2'}
              className={`tactile-btn inline-flex items-center border px-2 py-0.5 sm:px-2.5 sm:py-1 font-mono text-[11px] font-bold ${
                pressedKey === 'k2'
                  ? 'border-[var(--accent-bright)] bg-[var(--accent)] text-white'
                  : 'text-white'
              }`}
              style={
                pressedKey === 'k2'
                  ? undefined
                  : { backgroundColor: skin.bladeBg, borderColor: skin.surfaceBorder }
              }
            >
              {profile.trigger2Label}
            </span>
            {profile.allowPointerTap && (
              <span className="hidden sm:inline text-[#9aa5ba]">or Ring Click</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 whitespace-nowrap text-[#9aa5ba]">
            <span>{skin.isFullTransformation ? skin.name : '東京夜間音響'}</span>
            <span aria-hidden="true">·</span>
            <span>{skin.isFullTransformation ? skin.subtitle : '渋谷レコード'}</span>
          </div>
        </footer>
      </div>
    );
  },
);
