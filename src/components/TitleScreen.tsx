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
import { XMAS_SPRITES } from '../data/christmasSprites';
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
    const isChristmas = profile.theme === 'cozy_christmas_2026';
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
        accentVariant: 'bow_star' as const,
        offsetClass: 'ml-0',
        onClick: onPlayPrimary,
        renderIcon: () => <Play className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-white" />,
      },
      {
        id: 'tracks',
        label: 'Track Select',
        sub: `${songs.length} Songs · Daily, Weekly Demon & Arcade`,
        primary: false,
        accentVariant: 'holly_star' as const,
        offsetClass: 'sm:ml-3',
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
        accentVariant: 'minimal' as const,
        offsetClass: 'sm:ml-6',
        onClick: onOpenOrbVault,
        renderIcon: () => <OrbIcon className="h-5 w-5 shrink-0 !text-white text-white" />,
      },
      {
        id: 'index',
        label: 'The Index',
        sub: `${WAVE_MODES.length} Mechanics · ${profile.unlockedBadges.length}/${BADGE_CATALOG.length} Badges & Stats`,
        primary: false,
        accentVariant: 'minimal' as const,
        offsetClass: 'sm:ml-9',
        onClick: onOpenIndex,
        renderIcon: () => <IndexIcon className="h-5 w-5 shrink-0 !text-white text-white" />,
      },
      {
        id: 'settings',
        label: 'Settings',
        sub: 'Audio · Keybinds · Calibration',
        primary: false,
        accentVariant: 'holly_star' as const,
        offsetClass: 'sm:ml-12',
        onClick: onOpenSettings,
        renderIcon: () => (
          <Settings className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-[var(--accent-bright)]" />
        ),
      },
    ];

    return (
      <div className="relative z-10 flex h-dvh w-full flex-col justify-between overflow-hidden px-4 py-3 sm:px-10 sm:py-5">
        {/* Radial transformation spotlight */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background: isChristmas
              ? 'radial-gradient(circle at 26% 52%, rgba(251, 191, 36, 0.18) 0%, rgba(225, 29, 72, 0.10) 28%, transparent 56%, rgba(8, 7, 16, 0.56) 94%)'
              : skin.isFullTransformation
              ? `radial-gradient(circle at 28% 52%, rgba(${theme.bgAccentRgb}, 0.22) 0%, transparent 48%, rgba(7,8,13,0.45) 86%)`
              : `radial-gradient(circle at 28% 52%, rgba(${theme.bgAccentRgb}, 0.20) 0%, rgba(34, 211, 238, 0.06) 38%, rgba(7,8,13,0.78) 78%)`,
          }}
        />

        {/* COZY CHRISTMAS GROUNDED COURTYARD DIORAMA (Layered cleanly between sky & foreground UI) */}
        {isChristmas && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-[11] overflow-hidden"
          >
            {/* Courtyard Balcony Railing behind snowman/gifts matching concept art */}
            <svg
              viewBox="0 0 1600 900"
              preserveAspectRatio="xMidYMid slice"
              className="hidden md:block absolute inset-0 h-full w-full opacity-55"
            >
              <g stroke="#1b1426" strokeWidth="4">
                <line x1="560" y1="670" x2="1020" y2="670" strokeWidth="6" />
                <line x1="560" y1="735" x2="1020" y2="735" strokeWidth="5" />
                {[580, 620, 660, 700, 740, 780, 820, 860, 900, 940, 980].map((rx) => (
                  <line key={rx} x1={rx} y1="670" x2={rx} y2="755" />
                ))}
              </g>
            </svg>

            {/* Right Tall Lit Christmas Tree nestled seamlessly behind Menu Blade Cascade */}
            <div className="hidden lg:block absolute right-[25%] bottom-[78px]">
              <div
                className="absolute -inset-6 rounded-full opacity-45 blur-2xl"
                style={{
                  background:
                    'radial-gradient(circle, rgba(251,191,36,0.48) 0%, rgba(225,29,72,0.18) 55%, transparent 78%)',
                }}
              />
              <img
                src={XMAS_SPRITES.treeOrnate}
                alt=""
                className="relative h-[56vh] max-h-[480px] w-auto object-contain opacity-95 drop-shadow-[0_12px_32px_rgba(0,0,0,0.8)]"
              />
              <img
                src={XMAS_SPRITES.sparkleGold}
                alt=""
                className="absolute -top-6 left-1/2 -translate-x-1/2 h-11 w-11 object-contain drop-shadow-[0_0_16px_rgba(253,224,71,0.95)]"
              />
            </div>

            {/* Left Evergreen Shoulder + Wrapped Gifts + Glowing Street Lantern flanking lower-left disc */}
            <div className="hidden sm:flex items-end absolute left-2 bottom-[50px] gap-1">
              <img
                src={XMAS_SPRITES.treeOrnate}
                alt=""
                className="h-44 lg:h-56 w-auto object-contain opacity-90 drop-shadow-[0_10px_24px_rgba(0,0,0,0.85)]"
              />
              <img
                src={XMAS_SPRITES.giftTrio}
                alt=""
                className="-ml-12 mb-1 h-16 lg:h-20 w-auto object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.85)]"
              />
            </div>

            {/* Grounded Winter Terrace Snowman + Warm Lantern + Present Cluster (center-left floor) */}
            <div className="hidden md:flex items-end absolute left-[28%] lg:left-[30%] bottom-[54px] gap-1.5">
              {/* Soft ground contact shadow */}
              <div
                className="pointer-events-none absolute -bottom-2 -left-4 -right-6 h-5 rounded-full blur-md"
                style={{ background: 'rgba(6, 5, 14, 0.72)' }}
              />
              <div className="relative flex flex-col items-center">
                <div
                  className="absolute -inset-4 rounded-full opacity-55 blur-xl"
                  style={{ background: 'rgba(251, 191, 36, 0.42)' }}
                />
                <img
                  src={XMAS_SPRITES.lantern}
                  alt=""
                  className="relative h-20 lg:h-24 w-auto object-contain drop-shadow-[0_0_18px_rgba(251,191,36,0.9)]"
                />
              </div>
              <img
                src={XMAS_SPRITES.snowmanClean}
                alt=""
                className="relative h-36 lg:h-48 w-auto object-contain drop-shadow-[0_10px_22px_rgba(0,0,0,0.8)]"
              />
              <img
                src={XMAS_SPRITES.giftTrio}
                alt=""
                className="relative -ml-3 mb-1 h-14 lg:h-16 w-auto object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,0.85)]"
              />
            </div>
          </div>
        )}

        {/* Top 3-Zone Header Contract */}
        <header
          className="relative z-20 flex w-full items-center justify-between gap-4 border-b pb-2.5 sm:pb-3"
          style={{ borderColor: skin.surfaceBorder }}
        >
          {/* Zone 1: Theme-crafted ORBIT Crest Logo */}
          <StudioSlot
            widgetId="title_hero_badge"
            label="Title Hero Wordmark"
            className="flex items-center origin-left scale-[0.82] sm:scale-100 whitespace-nowrap shrink-0"
          >
            <ThemeTitleLogo themeId={profile.theme} accentColor={theme.bright} />
          </StudioSlot>

          {/* Zone 2: Ornate Stats Bar (Christmas Champagne-Gold Pill / Clean Arcade Strip) */}
          <div
            className={`hidden md:flex items-center gap-3.5 text-xs tabular-nums whitespace-nowrap ${
              isChristmas
                ? 'lazer-slant-sm border border-[#fde68a]/55 bg-[#190a14]/90 px-5 py-1.5 text-[#fef3c7] shadow-[0_6px_22px_rgba(0,0,0,0.65)]'
                : 'text-[#e2e8f0]'
            }`}
          >
            <span className={isChristmas ? 'lazer-unslant-sm flex items-center gap-3.5' : 'flex items-center gap-4'}>
              <span>
                <strong className="font-extrabold" style={{ color: prestige.tierColor }}>
                  {prestige.tierTitle}
                </strong>
                <span className="ml-1.5 text-[#cbd5e1]">
                  SS {prestige.ssCount}/{prestige.totalSongsCount}
                </span>
              </span>
              <span aria-hidden="true" className={isChristmas ? 'text-[#fde68a]/65' : 'text-white/30'}>✦</span>
              <span>
                Best <strong className="ml-1 font-bold text-white">{profile.bestScore.toLocaleString()}</strong>
              </span>
              <span aria-hidden="true" className={isChristmas ? 'text-[#fde68a]/65' : 'text-white/30'}>✦</span>
              <span>
                Peak Combo <strong className="ml-1 font-bold text-[#fde68a]">{profile.bestStreak}x</strong>
              </span>
              <span aria-hidden="true" className={isChristmas ? 'text-[#fde68a]/65' : 'text-white/30'}>✦</span>
              <span className="inline-flex items-center gap-1.5">
                <OrbIcon className="h-4 w-4 text-[#fde68a]" />
                <strong className="font-bold text-white">{profile.orbs.toLocaleString()}</strong>
              </span>
            </span>
          </div>

          {/* Zone 3: Primary Audio Action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onToggleMusic}
              className="tactile-btn lazer-slant-sm relative flex items-center gap-2 border px-4 py-2 text-xs font-semibold text-white hover:border-[var(--accent-bright)] cursor-pointer whitespace-nowrap shrink-0"
              style={{
                background: isChristmas
                  ? 'linear-gradient(125deg, rgba(102, 18, 38, 0.92), rgba(24, 10, 22, 0.94))'
                  : undefined,
                backgroundColor: isChristmas ? undefined : skin.bladeBg,
                borderColor: isChristmas ? 'rgba(253, 224, 140, 0.6)' : skin.surfaceBorder,
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

        {/* Main Asymmetric Split: Turntable Disc (Left) + Menu Fan (Right) */}
        <main className="relative z-20 mx-auto flex w-full max-w-[1280px] flex-1 flex-col items-center justify-center gap-3 sm:gap-6 lg:flex-row lg:justify-between lg:gap-12 min-h-0">
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

              {/* Ornate Thematic Now Spinning Caption Plaque */}
              {isChristmas ? (
                <div className="relative mt-5 sm:mt-7 w-[315px] sm:w-[388px]">
                  {/* Top Pill Cap ("Now Spinning · BPM") anchored cleanly atop plaque */}
                  <div
                    className="relative z-30 mx-auto -mb-3 flex w-fit items-center gap-2 border border-[#fde68a]/65 bg-[#280b16] px-4 py-1 text-[11px] font-bold text-[#fde68a] shadow-[0_6px_16px_rgba(0,0,0,0.7)]"
                    style={{ clipPath: 'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)' }}
                  >
                    <Disc3 className="h-3.5 w-3.5 text-[#fbbf24]" />
                    <span>Now Spinning</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{activeSong.bpm} BPM</span>
                    {activeRecord && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums text-white">Rank {activeRecord.bestRank}</span>
                      </>
                    )}
                  </div>

                  {/* Main Ornate Mahogany & Gold Frame */}
                  <div
                    className="relative border px-6 pt-5 pb-3.5 text-center shadow-[0_16px_42px_rgba(0,0,0,0.85)]"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(52, 14, 26, 0.95) 0%, rgba(20, 10, 22, 0.96) 55%, rgba(38, 10, 20, 0.95) 100%)',
                      borderColor: 'rgba(253, 224, 140, 0.65)',
                      clipPath: 'polygon(16px 0, 100% 0, calc(100% - 16px) 100%, 0 100%)',
                    }}
                  >
                    <SkinBladeTrim themeId={profile.theme} compact />
                    <h1
                      className="font-display truncate text-xl sm:text-2xl font-extrabold italic tracking-tight text-[#fffbeb]"
                      style={{
                        textShadow: '0 2px 18px rgba(251, 191, 36, 0.55)',
                      }}
                    >
                      {activeSong.title}
                    </h1>
                    <div className="mt-1 flex items-center justify-center gap-2.5 text-xs text-[#fde68a]/90">
                      <span className="h-[1px] w-7 bg-gradient-to-r from-transparent to-[#fde68a]/75" />
                      <span className="truncate font-medium">
                        {activeSong.artist} · {activeSong.genre}
                      </span>
                      <span className="h-[1px] w-7 bg-gradient-to-l from-transparent to-[#fde68a]/75" />
                    </div>
                  </div>

                  {/* Holly + Sparkle Corners matching reference */}
                  <img
                    src={XMAS_SPRITES.hollySprig}
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute -left-3.5 top-2 z-30 h-10 w-10 object-contain -rotate-[14deg] drop-shadow-[0_4px_10px_rgba(0,0,0,0.75)]"
                  />
                  <img
                    src={XMAS_SPRITES.hollySprig}
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-3 -bottom-3 z-30 h-10 w-10 object-contain rotate-[12deg] drop-shadow-[0_4px_10px_rgba(0,0,0,0.75)]"
                  />
                  <img
                    src={XMAS_SPRITES.sparkleGold}
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-1 top-3 z-30 h-6 w-6 object-contain drop-shadow-[0_0_10px_rgba(253,224,71,0.9)]"
                  />
                </div>
              ) : (
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
              )}
            </motion.div>
          </StudioSlot>

          {/* Right Column: Kinetic Slanted Menu Blades */}
          <motion.nav
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            aria-label="Main Menu"
            className="flex w-full max-w-[475px] flex-col gap-2 sm:gap-2.5"
          >
            {menuItems.map((item) => {
              const widgetIdMap: Record<string, string> = {
                play: 'title_play_btn',
                tracks: 'title_tracks_btn',
                shop: 'title_shop_btn',
                index: 'title_index_btn',
                settings: 'title_settings_btn',
              };
              const christmasBladeBg = item.primary
                ? 'linear-gradient(125deg, #c81e3a 0%, #991b1b 52%, #4a0a18 100%)'
                : 'linear-gradient(125deg, rgba(36, 12, 24, 0.93) 0%, rgba(15, 19, 36, 0.92) 100%)';

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
                      item.primary && !isChristmas
                        ? 'border-[var(--accent-bright)] bg-[var(--accent)] text-[var(--accent-on)] shadow-[0_10px_32px_rgba(var(--bg-accent-rgb,255,59,130),0.28)] hover:bg-[var(--accent-bright)]'
                        : 'text-white hover:border-[var(--accent-bright)]'
                    }`}
                    style={
                      isChristmas
                        ? {
                            background: christmasBladeBg,
                            borderColor: item.primary ? '#fde68a' : 'rgba(253, 224, 140, 0.52)',
                            boxShadow: item.primary
                              ? '0 12px 34px rgba(225, 29, 72, 0.42), inset 0 0 18px rgba(251, 191, 36, 0.22)'
                              : '0 8px 26px rgba(0, 0, 0, 0.62)',
                          }
                        : item.primary
                        ? undefined
                        : {
                            backgroundColor: skin.bladeBg,
                            borderColor: skin.surfaceBorder,
                          }
                    }
                  >
                    <SkinBladeTrim
                      themeId={profile.theme}
                      featured={item.primary}
                      accentVariant={item.accentVariant}
                    />
                    <div className="lazer-unslant flex w-full items-center justify-between gap-4 min-w-0">
                      <div className="flex items-center gap-3.5 min-w-0">
                        {item.renderIcon()}
                        <div className="min-w-0">
                          <span
                            className={`font-display block truncate text-base sm:text-xl font-extrabold tracking-tight leading-tight ${
                              isChristmas ? 'italic text-[#fffbeb]' : ''
                            }`}
                          >
                            {item.label}
                          </span>
                          <span
                            className={`block truncate text-[11px] sm:text-xs ${
                              item.primary
                                ? 'text-white/95 font-medium'
                                : isChristmas
                                ? 'text-[#fde68a]/78'
                                : 'text-[#b6bfd1]'
                            }`}
                          >
                            {item.sub}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isChristmas && item.id === 'shop' && (
                          <img
                            src={XMAS_SPRITES.giftBox}
                            alt=""
                            aria-hidden="true"
                            className="h-8 w-8 object-contain drop-shadow-[0_3px_8px_rgba(0,0,0,0.7)]"
                          />
                        )}
                        <span
                          aria-hidden="true"
                          className={`text-sm font-bold transition-transform duration-150 group-hover:translate-x-1 shrink-0 ${
                            item.primary
                              ? 'text-[#fde68a]'
                              : 'text-white/55 group-hover:text-[var(--accent-bright)]'
                          }`}
                        >
                          →
                        </span>
                      </div>
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
                className="sm:ml-16"
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
                          Game Engine View · Shaders, PNGs &amp; GitHub Push
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
          className="relative z-20 flex w-full items-center justify-between gap-3 border-t pt-2 sm:pt-2.5 text-xs text-[#e2e8f0] shrink-0"
          style={{ borderColor: isChristmas ? 'rgba(253, 224, 140, 0.4)' : skin.surfaceBorder }}
        >
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className={isChristmas ? 'text-[#fde68a]/85 font-semibold' : undefined}>Triggers</span>
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
                  : {
                      backgroundColor: isChristmas ? 'rgba(26, 10, 20, 0.92)' : skin.bladeBg,
                      borderColor: isChristmas ? 'rgba(253, 224, 140, 0.5)' : skin.surfaceBorder,
                    }
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
                  : {
                      backgroundColor: isChristmas ? 'rgba(26, 10, 20, 0.92)' : skin.bladeBg,
                      borderColor: isChristmas ? 'rgba(253, 224, 140, 0.5)' : skin.surfaceBorder,
                    }
              }
            >
              {profile.trigger2Label}
            </span>
            {profile.allowPointerTap && (
              <span className="hidden sm:inline text-[#cbd5e1]">or Ring Click</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 whitespace-nowrap text-[#fde68a]">
            <span aria-hidden="true" className="hidden sm:inline text-[#fde68a]/50">—</span>
            <span>{skin.isFullTransformation ? skin.subtitle : '東京夜間音響 · 渋谷レコード'}</span>
            <span aria-hidden="true" className="hidden sm:inline text-[#fde68a]/50">—</span>
          </div>
        </footer>
      </div>
    );
  },
);
