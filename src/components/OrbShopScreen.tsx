import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Check,
  Disc3,
  Lock,
  Palette,
  SlidersHorizontal,
  Snowflake,
  Sparkles,
} from 'lucide-react';
import {
  CHASSIS_THEMES,
  DIFFICULTIES,
  DIFFICULTY_ORDER,
  MOD_CATALOG,
} from '../data/catalog';
import { getResolvedChassisTheme, getResolvedSkinPack } from '../store/studioRegistryStore';
import { DifficultyId, ModCode, PlayerProfile, SongDefinition, ThemeId } from '../types/game';
import { useStudioLayout } from './LiveLayoutWrapper';
import { OrbIcon } from './OrbIcon';
import { SkinBladeTrim } from './SkinAtmosphere';

type ShopTab = 'all' | 'tracks' | 'mods' | 'themes' | 'tiers';

interface OrbShopScreenProps {
  profile: PlayerProfile;
  songs: SongDefinition[];
  isDeveloper?: boolean;
  onToggleDevUnlock?: () => void;
  onBack: () => void;
  onUnlockDifficulty: (diffId: DifficultyId, cost: number) => void;
  onUnlockSong: (songId: string, cost: number) => void;
  onUnlockTheme: (themeId: ThemeId, cost: number) => void;
  onEquipTheme: (themeId: ThemeId) => void;
  onUnlockMod: (code: ModCode, cost: number) => void;
  onToggleEquipMod: (code: ModCode) => void;
}

const SHOP_TABS: { id: ShopTab; label: string }[] = [
  { id: 'all', label: 'All Storefront' },
  { id: 'tracks', label: 'Tracks & Christmas' },
  { id: 'mods', label: 'Arcade Mods' },
  { id: 'themes', label: 'Cabinet Themes' },
  { id: 'tiers', label: 'Difficulty Tiers' },
];

export const OrbShopScreen: React.FC<OrbShopScreenProps> = ({
  profile,
  songs,
  isDeveloper = false,
  onToggleDevUnlock,
  onBack,
  onUnlockDifficulty,
  onUnlockSong,
  onUnlockTheme,
  onEquipTheme,
  onUnlockMod,
  onToggleEquipMod,
}) => {
  const { themesMap } = useStudioLayout();
  const [tab, setTab] = useState<ShopTab>('all');

  const unlockableSongs = useMemo(() => songs.filter((s) => s.orbCost > 0), [songs]);
  const christmasSongs = useMemo(
    () => unlockableSongs.filter((s) => s.category === 'christmas'),
    [unlockableSongs],
  );
  const arcadeUnlockSongs = useMemo(
    () => unlockableSongs.filter((s) => s.category !== 'christmas'),
    [unlockableSongs],
  );
  const shopMods = useMemo(() => MOD_CATALOG.filter((m) => m.orbCost > 0), []);
  const allThemes = useMemo(
    () =>
      (Object.keys(themesMap).length > 0
        ? Object.keys(themesMap)
        : Object.keys(CHASSIS_THEMES)) as ThemeId[],
    [themesMap],
  );

  // Featured recommendation picks the first locked item the user can aim for, or Winter Solstice showcase
  const spotlightSong = useMemo(() => {
    const firstLocked = unlockableSongs.find(
      (s) => !profile.devUnlocked && !profile.unlockedSongs.includes(s.id),
    );
    return firstLocked || christmasSongs[0] || unlockableSongs[0];
  }, [christmasSongs, profile.devUnlocked, profile.unlockedSongs, unlockableSongs]);

  const unlockedSongCount = unlockableSongs.filter(
    (s) => profile.devUnlocked || profile.unlockedSongs.includes(s.id),
  ).length;
  const ownedThemeCount = allThemes.filter((tid) => {
    const t = getResolvedChassisTheme(tid, themesMap);
    return (
      profile.devUnlocked ||
      (!t.isTransformationSkin && t.orbCost === 0) ||
      profile.unlockedThemes.includes(tid)
    );
  }).length;
  const skin = getResolvedSkinPack(profile.theme, themesMap);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="relative z-10 flex h-dvh w-full flex-col overflow-hidden"
    >
      {/* Clean Tokyo Atelier Ambient Scrim */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: skin.isFullTransformation
            ? `radial-gradient(circle at 80% 14%, rgba(251, 191, 36, 0.08) 0%, ${skin.backdropScrimRgba} 48%, rgba(7, 8, 13, 0.88) 100%)`
            : 'radial-gradient(circle at 80% 14%, rgba(251, 191, 36, 0.10) 0%, rgba(16, 20, 34, 0.90) 48%, rgba(7, 8, 13, 0.97) 100%)',
        }}
      />

      {/* Top 3-Zone Header */}
      <header
        className="relative z-20 flex h-[60px] shrink-0 items-center justify-between gap-4 border-b px-4 sm:px-8 backdrop-blur-md"
        style={{ backgroundColor: skin.headerBg, borderColor: skin.surfaceBorder }}
      >
        <SkinBladeTrim themeId={profile.theme} />
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="tactile-btn lazer-slant-sm flex items-center border px-3.5 py-2 text-xs font-bold text-white hover:border-[var(--accent-bright)] cursor-pointer whitespace-nowrap shrink-0"
            style={{ backgroundColor: skin.bladeBg, borderColor: skin.surfaceBorder }}
          >
            <span className="lazer-unslant-sm flex items-center gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </span>
          </button>
          <div className="flex items-baseline gap-2.5 min-w-0 truncate">
            <h1 className="font-display text-lg sm:text-2xl font-black tracking-tight text-white whitespace-nowrap">
              Orb Boutique
            </h1>
            <span className="hidden sm:inline text-xs font-semibold tracking-[0.2em] text-[#fbbf24] whitespace-nowrap">
              オーブショップ
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {isDeveloper && onToggleDevUnlock && (
            <button
              type="button"
              onClick={onToggleDevUnlock}
              className={`tactile-btn border px-3 py-1.5 text-xs font-extrabold cursor-pointer whitespace-nowrap ${
                profile.devUnlocked
                  ? 'border-[#34d399]/60 bg-[#0b261c] text-[#34d399]'
                  : 'border-white/25 bg-black/60 text-white hover:border-white'
              }`}
            >
              {profile.devUnlocked ? 'Dev Preview: All Unlocked' : 'Unlock All Preview'}
            </button>
          )}
          <span className="hidden md:inline text-xs text-[#a1abbe] tabular-nums">
            {unlockedSongCount}/{unlockableSongs.length} Tracks · {ownedThemeCount}/{allThemes.length} Themes
          </span>
          <div className="flex items-center gap-2 rounded-md border border-[#fbbf24]/40 bg-[#1a1507] px-3.5 py-1.5 text-sm font-black text-[#fbbf24] tabular-nums">
            <OrbIcon className="h-4 w-4 text-[#fbbf24]" />
            <span>{profile.orbs.toLocaleString()} Orbs</span>
          </div>
        </div>
      </header>

      {/* Clean Segmented Navigation Bar */}
      <nav
        aria-label="Shop Categories"
        className="relative z-20 flex shrink-0 items-center justify-between gap-4 overflow-x-auto border-b px-4 py-2.5 sm:px-8 backdrop-blur-md"
        style={{ backgroundColor: skin.surfaceBg, borderColor: skin.surfaceBorder }}
      >
        <div className="flex items-center gap-1.5">
          {SHOP_TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`tactile-btn rounded-md px-3.5 py-1.5 text-xs font-bold cursor-pointer whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-[#fbbf24] text-[#140c02] shadow-sm'
                    : 'bg-transparent text-[#a1abbe] hover:bg-white/6 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        <span className="hidden lg:inline text-xs text-[#68738a] whitespace-nowrap">
          Earn Orbs by clearing tracks with C-Rank or higher
        </span>
      </nav>

      {/* Structured Orthogonal Storefront Canvas */}
      <main className="orbit-scroll relative z-20 mx-auto w-full max-w-[1320px] flex-1 space-y-9 overflow-y-auto px-4 py-6 sm:px-8">
        {/* Featured Spotlight Banner (All Showcase view only) */}
        {tab === 'all' && spotlightSong && (
          <section
            className="relative overflow-hidden rounded-lg border"
            style={{ backgroundColor: skin.surfaceBg, borderColor: skin.surfaceBorder }}
          >
            <SkinBladeTrim themeId={profile.theme} featured />
            <div className="grid grid-cols-1 lg:grid-cols-12">
              <div className="relative h-44 lg:col-span-5 lg:h-auto overflow-hidden bg-[#07090f]">
                <img
                  src={spotlightSong.bgImageUrl}
                  alt={spotlightSong.title}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover opacity-85"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-[#0d111c] via-transparent to-black/30 lg:bg-gradient-to-r lg:from-transparent lg:to-[#0d111c]"
                />
                <div className="absolute left-4 top-4 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-white">
                  {spotlightSong.category === 'christmas' ? (
                    <Snowflake className="h-3.5 w-3.5 text-[#38bdf8]" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5 text-[#fbbf24]" />
                  )}
                  <span>Featured Release</span>
                </div>
              </div>

              <div className="flex flex-col justify-between gap-4 p-5 sm:p-7 lg:col-span-7">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#a1abbe]">
                    <span className={spotlightSong.category === 'christmas' ? 'text-[#38bdf8]' : 'text-[var(--accent-bright)]'}>
                      {spotlightSong.category === 'christmas' ? 'Seasonal Christmas Pack' : 'Featured Arcade Track'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{spotlightSong.bpm} BPM</span>
                    <span aria-hidden="true">·</span>
                    <span>{spotlightSong.genre}</span>
                  </div>
                  <h2 className="font-display mt-1.5 text-2xl sm:text-3xl font-black tracking-tight text-white">
                    {spotlightSong.title}
                  </h2>
                  <p className="mt-1 text-sm text-[#b6bfd1]">{spotlightSong.desc}</p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                  {profile.devUnlocked || profile.unlockedSongs.includes(spotlightSong.id) ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#34d399]">
                      <Check className="h-4 w-4" />
                      <span>Owned in Track Library</span>
                    </span>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 text-sm font-black text-[#fbbf24] tabular-nums">
                        <OrbIcon className="h-4 w-4 text-[#fbbf24]" />
                        <span>{spotlightSong.orbCost} Orbs</span>
                      </div>
                      <button
                        type="button"
                        disabled={profile.orbs < spotlightSong.orbCost}
                        onClick={() => onUnlockSong(spotlightSong.id, spotlightSong.orbCost)}
                        className="tactile-btn rounded-md bg-[#fbbf24] px-5 py-2 text-xs font-black text-[#140c02] hover:bg-[#fde047] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Unlock Featured Track
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 1: Tracks & Christmas Collection (Crisp Vinyl Sleeve Cards) */}
        {(tab === 'all' || tab === 'tracks') && (
          <section className="space-y-6">
            {/* Christmas Collection Duo */}
            {christmasSongs.length > 0 && (
              <div>
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-display flex items-center gap-2 text-lg font-black text-white">
                    <Snowflake className="h-4 w-4 text-[#38bdf8]" />
                    <span>Christmas Collection</span>
                  </h2>
                  <span className="text-xs text-[#93c5fd]">Winter Solstice &amp; Carol of the Bells</span>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {christmasSongs.map((song) => {
                    const unlocked = profile.devUnlocked || profile.unlockedSongs.includes(song.id);
                    const canAfford = profile.orbs >= song.orbCost;
                    return (
                      <article
                        key={song.id}
                        className="relative flex flex-col justify-between gap-4 rounded-lg border p-4 transition-colors"
                        style={{ backgroundColor: skin.bladeBg, borderColor: skin.surfaceBorder }}
                      >
                        <SkinBladeTrim themeId={profile.theme} compact />
                        <div className="flex items-start gap-4">
                          <img
                            src={song.bgImageUrl}
                            alt={song.title}
                            referrerPolicy="no-referrer"
                            className="h-20 w-20 shrink-0 rounded-md border border-white/10 object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 text-[11px] font-bold text-[#38bdf8]">
                              <span>Winter Special</span>
                              <span aria-hidden="true">·</span>
                              <span className="tabular-nums text-[#a1abbe]">{song.bpm} BPM</span>
                            </div>
                            <h3 className="font-display mt-0.5 truncate text-lg font-black text-white">
                              {song.title}
                            </h3>
                            <p className="text-xs text-[#a1abbe]">{song.artist}</p>
                            <p className="mt-1.5 line-clamp-2 text-xs text-[#cbd5e1]">{song.desc}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-white/10 pt-3">
                          {unlocked ? (
                            <span className="flex items-center gap-1.5 text-xs font-extrabold text-[#34d399]">
                              <Check className="h-4 w-4" />
                              <span>Unlocked in Library</span>
                            </span>
                          ) : (
                            <>
                              <span className="flex items-center gap-1.5 text-xs font-bold text-[#fbbf24] tabular-nums">
                                <OrbIcon className="h-4 w-4 text-[#fbbf24]" />
                                <span>{song.orbCost} Orbs</span>
                              </span>
                              <button
                                type="button"
                                disabled={!canAfford}
                                onClick={() => onUnlockSong(song.id, song.orbCost)}
                                className="tactile-btn rounded-md bg-[#fbbf24] px-4 py-1.5 text-xs font-black text-[#140c02] hover:bg-[#fde047] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                              >
                                Unlock Track
                              </button>
                            </>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Arcade Catalog Releases */}
            <div>
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display flex items-center gap-2 text-lg font-black text-white">
                  <Disc3 className="h-4 w-4 text-[var(--accent-bright)]" />
                  <span>Arcade Vault Releases</span>
                </h2>
                <span className="text-xs text-[#a1abbe]">Permanent track unlocks</span>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {arcadeUnlockSongs.map((song) => {
                  const unlocked = profile.devUnlocked || profile.unlockedSongs.includes(song.id);
                  const canAfford = profile.orbs >= song.orbCost;
                  return (
                    <article
                      key={song.id}
                      className="relative flex flex-col justify-between gap-4 rounded-lg border p-4 transition-colors"
                      style={{ backgroundColor: skin.bladeBg, borderColor: skin.surfaceBorder }}
                    >
                      <SkinBladeTrim themeId={profile.theme} compact />
                      <div className="flex items-start gap-4">
                        <img
                          src={song.bgImageUrl}
                          alt={song.title}
                          referrerPolicy="no-referrer"
                          className="h-20 w-20 shrink-0 rounded-md border border-white/10 object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 text-[11px] font-bold text-[var(--accent-bright)]">
                            <span>Arcade Stage</span>
                            <span aria-hidden="true">·</span>
                            <span className="tabular-nums text-[#a1abbe]">{song.bpm} BPM</span>
                          </div>
                          <h3 className="font-display mt-0.5 truncate text-lg font-black text-white">
                            {song.title}
                          </h3>
                          <p className="text-xs text-[#a1abbe]">{song.artist} · {song.genre}</p>
                          <p className="mt-1.5 line-clamp-2 text-xs text-[#b6bfd1]">{song.desc}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-white/10 pt-3">
                        {unlocked ? (
                          <span className="flex items-center gap-1.5 text-xs font-extrabold text-[#34d399]">
                            <Check className="h-4 w-4" />
                            <span>Unlocked in Library</span>
                          </span>
                        ) : (
                          <>
                            <span className="flex items-center gap-1.5 text-xs font-bold text-[#fbbf24] tabular-nums">
                              <OrbIcon className="h-4 w-4 text-[#fbbf24]" />
                              <span>{song.orbCost} Orbs</span>
                            </span>
                            <button
                              type="button"
                              disabled={!canAfford}
                              onClick={() => onUnlockSong(song.id, song.orbCost)}
                              className="tactile-btn rounded-md bg-[#fbbf24] px-4 py-1.5 text-xs font-black text-[#140c02] hover:bg-[#fde047] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            >
                              Purchase
                            </button>
                          </>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* SECTION 2: Boutique Arcade Mods (Compact Hardware Module Tiles) */}
        {(tab === 'all' || tab === 'mods') && (
          <section>
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display flex items-center gap-2 text-lg font-black text-white">
                <SlidersHorizontal className="h-4 w-4 text-[#a855f7]" />
                <span>Arcade Gameplay Mods</span>
              </h2>
              <span className="text-xs text-[#a1abbe]">Equip purchased Mods inside Track Select or right here</span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {shopMods.map((mod) => {
                const owned = profile.devUnlocked || profile.purchasedMods.includes(mod.code);
                const equipped = profile.equippedMods.includes(mod.code);
                const canAfford = profile.orbs >= mod.orbCost;

                return (
                  <article
                    key={mod.id}
                    className={`relative flex flex-col justify-between gap-4 rounded-lg border p-4 transition-colors ${
                      equipped ? 'border-[var(--accent-bright)]' : ''
                    }`}
                    style={{
                      backgroundColor: equipped ? skin.surfaceElevatedBg : skin.bladeBg,
                      borderColor: equipped ? undefined : skin.surfaceBorder,
                    }}
                  >
                    {equipped && <SkinBladeTrim themeId={profile.theme} compact />}
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-[#a855f7]/40 bg-[#1a132c] font-mono text-sm font-black text-[#c084fc]">
                        {mod.code}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-display truncate text-base font-black text-white">
                            {mod.name}
                          </h3>
                          <span className="tabular-nums text-xs font-bold text-[#22d3ee] shrink-0">
                            {mod.mult.toFixed(2)}x
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-[#b6bfd1]">{mod.desc}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/10 pt-3">
                      {owned ? (
                        <button
                          type="button"
                          onClick={() => onToggleEquipMod(mod.code)}
                          className={`tactile-btn w-full rounded-md border py-2 text-xs font-extrabold cursor-pointer ${
                            equipped
                              ? 'border-[var(--accent-bright)] bg-[var(--accent)] text-[var(--accent-on)]'
                              : 'border-white/15 bg-[#151a2a] text-white hover:border-[var(--accent-bright)]'
                          }`}
                        >
                          {equipped ? 'Equipped (Click to Unequip)' : 'Owned · Equip Mod'}
                        </button>
                      ) : (
                        <>
                          <span className="flex items-center gap-1.5 text-xs font-bold text-[#fbbf24] tabular-nums">
                            <OrbIcon className="h-4 w-4 text-[#fbbf24]" />
                            <span>{mod.orbCost} Orbs</span>
                          </span>
                          <button
                            type="button"
                            disabled={!canAfford}
                            onClick={() => onUnlockMod(mod.code, mod.orbCost)}
                            className="tactile-btn rounded-md bg-[#fbbf24] px-4 py-1.5 text-xs font-black text-[#140c02] hover:bg-[#fde047] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                          >
                            Unlock Mod
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* SECTION 3: Cabinet Themes & Full-UI Transformation Skins */}
        {(tab === 'all' || tab === 'themes') && (
          <section>
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display flex items-center gap-2 text-lg font-black text-white">
                <Palette className="h-4 w-4 text-[var(--accent-bright)]" />
                <span>Cabinet Themes &amp; Transformation Skins ({allThemes.length})</span>
              </h2>
              <span className="text-xs text-[#a1abbe]">
                Unlock full-UI artistic skins by earning S/SS mastery clears
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {allThemes.map((themeId) => {
                const t = getResolvedChassisTheme(themeId, themesMap);
                const pack = getResolvedSkinPack(themeId, themesMap);
                const isTransform = Boolean(t.isTransformationSkin);
                const owned =
                  profile.devUnlocked ||
                  (!isTransform && t.orbCost === 0) ||
                  profile.unlockedThemes.includes(themeId);
                const active = profile.theme === themeId;
                const canAfford = !isTransform && profile.orbs >= t.orbCost;

                return (
                  <article
                    key={themeId}
                    className={`overflow-hidden rounded-lg border transition-colors ${
                      active
                        ? 'border-[var(--accent-bright)]'
                        : isTransform
                        ? 'border-white/20'
                        : 'border-white/12'
                    }`}
                    style={{ backgroundColor: active ? skin.surfaceElevatedBg : skin.surfaceBg }}
                  >
                    {/* Visual Stage Preview Strip (Bespoke Illustrated Backdrop if Transformation Skin) */}
                    <div
                      className="relative flex h-24 items-center justify-center overflow-hidden border-b border-white/10"
                      style={{
                        background: `radial-gradient(circle at 50% 60%, rgba(${t.bgAccentRgb}, 0.28) 0%, #07090f 85%)`,
                      }}
                    >
                      {pack.backdropImageUrl && (
                        <img
                          src={pack.backdropImageUrl}
                          alt={t.label}
                          referrerPolicy="no-referrer"
                          className={`absolute inset-0 h-full w-full object-cover ${
                            owned ? 'opacity-72' : 'opacity-40 grayscale'
                          }`}
                        />
                      )}
                      <div
                        className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-[4px] bg-[#07080d]/90"
                        style={{
                          borderColor: t.primary,
                          boxShadow: `0 0 18px rgba(${t.bgAccentRgb}, 0.55)`,
                        }}
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: t.secondary }}
                        />
                      </div>
                      {isTransform && (
                        <span
                          className="absolute left-2.5 top-2 z-10 border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider"
                          style={{
                            borderColor: `${t.primary}88`,
                            backgroundColor: 'rgba(7, 8, 13, 0.86)',
                            color: t.edgeTick,
                          }}
                        >
                          Full Skin
                        </span>
                      )}
                      <span className="absolute right-2.5 top-2 z-10 text-[10px] font-bold tracking-wider text-white/80 drop-shadow">
                        {t.jpLabel}
                      </span>
                    </div>

                    <div className="flex flex-col gap-3 p-3.5">
                      <div>
                        <h3 className="font-display truncate text-sm font-extrabold text-white">
                          {t.label}
                        </h3>
                        <p className="mt-0.5 line-clamp-2 text-[11px] text-[#9aa5ba]">
                          {isTransform
                            ? t.unlockRequirement || 'Skill Milestone Unlock'
                            : t.orbCost === 0
                            ? 'Starter Cabinet'
                            : 'Boutique Edition'}
                        </p>
                      </div>

                      {active ? (
                        <div className="rounded-md border border-[var(--accent-bright)]/40 bg-[var(--accent-dim)] py-1.5 text-center text-xs font-extrabold text-white">
                          Equipped
                        </div>
                      ) : owned ? (
                        <button
                          type="button"
                          onClick={() => onEquipTheme(themeId)}
                          className="tactile-btn rounded-md border border-white/15 bg-[#151a2a] py-1.5 text-xs font-bold text-white hover:border-white/35 cursor-pointer"
                        >
                          Equip {isTransform ? 'Skin' : 'Theme'}
                        </button>
                      ) : isTransform ? (
                        <div className="flex items-center justify-center gap-1.5 rounded-md border border-white/12 bg-black/35 py-1.5 text-center text-[11px] font-bold text-[#a1abbe]">
                          <Lock className="h-3 w-3 shrink-0" />
                          <span>Earn via Skill Clear</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={!canAfford}
                          onClick={() => onUnlockTheme(themeId, t.orbCost)}
                          className="tactile-btn flex items-center justify-center gap-1.5 rounded-md bg-[#fbbf24] py-1.5 text-xs font-black text-[#140c02] hover:bg-[#fde047] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer tabular-nums"
                        >
                          <OrbIcon className="h-3.5 w-3.5 text-[#140c02]" />
                          <span>{t.orbCost} Orbs</span>
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* SECTION 4: Difficulty Tiers (Unified Progression Strip) */}
        {(tab === 'all' || tab === 'tiers') && (
          <section className="pb-4">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-lg font-black text-white">
                Difficulty Tiers
              </h2>
              <span className="text-xs text-[#a1abbe]">Unlock denser rhythms and higher score multipliers</span>
            </div>

            <div
              className="grid grid-cols-1 divide-y divide-white/10 overflow-hidden rounded-lg border sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-5 lg:divide-x"
              style={{ backgroundColor: skin.surfaceBg, borderColor: skin.surfaceBorder }}
            >
              {DIFFICULTY_ORDER.map((diffId, idx) => {
                const cfg = DIFFICULTIES[diffId];
                const unlocked = profile.devUnlocked || profile.unlockedDiffs.includes(diffId);
                const canAfford = profile.orbs >= cfg.orbCost;

                return (
                  <div key={diffId} className="flex flex-col justify-between gap-4 p-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold text-[#68738a]">
                          TIER 0{idx + 1}
                        </span>
                        <span className="tabular-nums text-xs font-black text-[#22d3ee]">
                          {cfg.mult.toFixed(2)}x
                        </span>
                      </div>
                      <h3 className="font-display mt-1 text-base font-black text-white">
                        {cfg.name}
                      </h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-[#a1abbe]">{cfg.desc}</p>
                    </div>

                    {unlocked ? (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-[#34d399]">
                        <Check className="h-3.5 w-3.5" />
                        <span>Unlocked</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={!canAfford}
                        onClick={() => onUnlockDifficulty(diffId, cfg.orbCost)}
                        className="tactile-btn flex items-center justify-center gap-1.5 rounded-md bg-[#fbbf24] py-2 text-xs font-black text-[#140c02] hover:bg-[#fde047] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer tabular-nums"
                      >
                        <Lock className="h-3.5 w-3.5" />
                        <span>{cfg.orbCost} Orbs</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </motion.div>
  );
};
