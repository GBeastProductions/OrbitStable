import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Award, BarChart3, BookOpen, Check, Crown, Lock, Play, Snowflake } from 'lucide-react';
import { BADGE_CATALOG, WAVE_MODES } from '../data/catalog';
import { XMAS_SPRITES } from '../data/christmasSprites';
import { computeMasteryPrestige, TAU } from '../engine/beatmap';
import { getResolvedSkinPack } from '../store/studioRegistryStore';
import { PlayerProfile, SongDefinition, WaveModeId, WaveModeInfo } from '../types/game';
import { useStudioLayout } from './LiveLayoutWrapper';
import { OrbIcon } from './OrbIcon';
import { SkinBladeTrim } from './SkinAtmosphere';

type IndexTab = 'book' | 'trophies' | 'telemetry';

interface IndexScreenProps {
  profile: PlayerProfile;
  songs: SongDefinition[];
  onBack: () => void;
  onLaunchSandbox: (modeId: WaveModeId) => void;
}

/**
 * Live interactive canvas preview inside The Index book page demonstrating
 * each orbital mechanic in smooth 60fps motion.
 */
const MechanicDemoCanvas: React.FC<{ mode: WaveModeInfo }> = ({ mode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    const start = performance.now();

    const render = (now: number) => {
      const t = (now - start) / 1000;
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const r = Math.min(w, h) * 0.36;
      const tw = 22;

      ctx.clearRect(0, 0, w, h);

      // Outer bezel
      ctx.beginPath();
      ctx.arc(cx, cy, r + tw * 0.72, 0, TAU);
      ctx.fillStyle = '#090c14';
      ctx.fill();
      ctx.strokeStyle = '#242c3e';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Track groove
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, TAU);
      ctx.strokeStyle = '#05070c';
      ctx.lineWidth = tw;
      ctx.stroke();

      const dir = mode.id === 'CCW_RED' ? -1 : 1;
      const speed =
        mode.id === 'PURPLE_SURGE'
          ? 2.6
          : mode.id === 'BRAKE_DRIFT'
          ? 1.5 + 0.8 * Math.sin(t * 3)
          : 1.75;
      const needleA = (-Math.PI / 2 + dir * speed * t) % TAU;

      if (mode.id === 'HOLD_ARC') {
        const startA = -Math.PI * 0.25;
        const span = 1.45;
        ctx.beginPath();
        ctx.arc(cx, cy, r, startA, startA + span);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.28)';
        ctx.lineWidth = tw * 0.56;
        ctx.stroke();

        const prog = (Math.sin(t * 1.8) + 1) * 0.5;
        ctx.beginPath();
        ctx.arc(cx, cy, r, startA, startA + span * prog);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = tw * 0.62;
        ctx.stroke();

        // Cap
        ctx.beginPath();
        ctx.arc(cx, cy, r, startA - 0.18, startA + 0.18);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = tw - 2;
        ctx.stroke();
      } else if (mode.id === 'FEVER_SPINNER') {
        const pct = (t * 0.55) % 1;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, TAU);
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.18)';
        ctx.lineWidth = tw - 3;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + TAU * pct);
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = tw - 3;
        ctx.stroke();
      } else if (mode.id === 'OSU_PORTAL') {
        ctx.beginPath();
        ctx.arc(cx, cy, r, -0.3, 0.3);
        ctx.strokeStyle = '#e879f9';
        ctx.lineWidth = tw - 4;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, r, Math.PI - 0.3, Math.PI + 0.3);
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = tw - 4;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, r, Math.PI + 1.1, Math.PI + 1.7);
        ctx.strokeStyle = mode.color;
        ctx.lineWidth = tw - 2;
        ctx.stroke();
      } else if (mode.id === 'ORDERED_SEQ') {
        [0.15, 1.35, 2.55].forEach((a, i) => {
          ctx.beginPath();
          ctx.arc(cx, cy, r, a - 0.24, a + 0.24);
          ctx.strokeStyle = mode.color;
          ctx.lineWidth = tw - 2;
          ctx.stroke();

          ctx.fillStyle = '#07080d';
          ctx.font = '900 11px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(i + 1), cx + Math.cos(a) * r, cy + Math.sin(a) * r);
        });
      } else if (mode.id === 'MULTI_CLUSTER' || mode.id === 'METEOR_SLASH') {
        [0.4, mode.id === 'METEOR_SLASH' ? -0.9 : 2.1].forEach((a, i) => {
          ctx.beginPath();
          ctx.arc(cx, cy, r, a - 0.28, a + 0.28);
          ctx.strokeStyle = i === 1 && mode.id === 'METEOR_SLASH' ? '#fb923c' : mode.color;
          ctx.lineWidth = tw - 2;
          ctx.stroke();
        });
      } else {
        const bounce = mode.id === 'SPRING_BOUNCE' ? Math.sin(t * 3.2) * 0.38 : 0;
        const decay = mode.id === 'DECAY_ARC' ? Math.max(0.12, 0.38 - ((t * 0.16) % 0.24)) : 0.3;
        const hw = mode.id === 'SNIPER_MICRO' ? 0.16 : decay;
        const alpha = mode.id === 'GHOST_PULSE' ? 0.25 + 0.7 * ((Math.sin(t * 3.2) + 1) * 0.5) : 1;
        const ta = 0.75 + bounce;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(cx, cy, r, ta - hw, ta + hw);
        ctx.strokeStyle = mode.color;
        ctx.lineWidth = tw - 2;
        ctx.stroke();
        ctx.restore();

        if (mode.id === 'HAZARD_DECOY') {
          [ta - 0.68, ta + 0.68].forEach((ha) => {
            ctx.beginPath();
            ctx.arc(cx, cy, r, ha - 0.14, ha + 0.14);
            ctx.strokeStyle = '#dc2626';
            ctx.lineWidth = tw - 4;
            ctx.stroke();
          });
        }
      }

      // Inner hub
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.48, 0, TAU);
      ctx.fillStyle = '#07080d';
      ctx.fill();
      ctx.strokeStyle = mode.color;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = '800 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(dir === 1 ? 'CW ↻' : 'CCW ↺', cx, cy);

      // Needle
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(needleA) * (r * 0.48), cy + Math.sin(needleA) * (r * 0.48));
      ctx.lineTo(cx + Math.cos(needleA) * (r + tw * 0.55), cy + Math.sin(needleA) * (r + tw * 0.55));
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [mode]);

  return (
    <canvas
      ref={canvasRef}
      width={240}
      height={240}
      className="h-[190px] w-[190px] sm:h-[220px] sm:w-[220px] shrink-0"
    />
  );
};

export const IndexScreen: React.FC<IndexScreenProps> = ({
  profile,
  songs,
  onBack,
  onLaunchSandbox,
}) => {
  const [tab, setTab] = useState<IndexTab>('book');
  const [selectedModeId, setSelectedModeId] = useState<WaveModeId>('HOLD_ARC');

  const selectedMode = WAVE_MODES.find((m) => m.id === selectedModeId) || WAVE_MODES[0];
  const mStat = profile.mechanicStats[selectedMode.id] || { hits: 0, perfects: 0, misses: 0 };
  const mTotal = mStat.hits + mStat.misses;
  const mAcc = mTotal > 0 ? (mStat.hits / mTotal) * 100 : 100;

  const totalAttempts = profile.totalHits + profile.totalMisses;
  const careerAcc = totalAttempts > 0 ? (profile.totalHits / totalAttempts) * 100 : 100;
  const clearedTracksCount = songs.filter(
    (s) => profile.songRecords[s.id] && profile.songRecords[s.id].bestRank !== 'F',
  ).length;
  const prestige = computeMasteryPrestige(profile, songs);
  const { themesMap } = useStudioLayout();
  const skin = getResolvedSkinPack(profile.theme, themesMap);
  const isCozyXmas = profile.theme === 'cozy_christmas_2026';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.22 }}
      className="relative z-10 flex h-dvh w-full flex-col overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: skin.isFullTransformation
            ? `linear-gradient(135deg, ${skin.backdropScrimRgba} 0%, rgba(7,8,13,0.72) 55%, ${skin.backdropScrimRgba} 100%)`
            : 'linear-gradient(135deg, rgba(7,9,15,0.95) 0%, rgba(11,16,27,0.92) 50%, rgba(7,8,13,0.95) 100%)',
        }}
      />

      {/* Top 3-Zone Header */}
      <header
        className="relative z-20 flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2.5 border-b px-4 py-2.5 sm:px-8 backdrop-blur-md"
        style={{
          background: isCozyXmas
            ? 'linear-gradient(90deg, rgba(36, 12, 22, 0.94) 0%, rgba(20, 14, 28, 0.92) 50%, rgba(36, 12, 22, 0.94) 100%)'
            : undefined,
          backgroundColor: isCozyXmas ? undefined : skin.headerBg,
          borderColor: isCozyXmas ? 'rgba(253, 230, 138, 0.48)' : skin.surfaceBorder,
        }}
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
              <span>Title</span>
            </span>
          </button>
          <div className="flex items-baseline gap-2.5 min-w-0 truncate">
            {isCozyXmas && (
              <img
                aria-hidden="true"
                src={XMAS_SPRITES.hollyBells}
                alt=""
                className="hidden sm:block h-7 w-7 self-center object-contain drop-shadow"
              />
            )}
            <h1 className="font-display text-lg sm:text-2xl font-black tracking-tight text-white whitespace-nowrap">
              The Index
            </h1>
            <span className="hidden sm:inline text-xs font-semibold tracking-[0.2em] text-[#22d3ee] whitespace-nowrap">
              アーカイブ図鑑
            </span>
          </div>
        </div>

        {/* Center/Right Book Navigation Tabs */}
        <div className="flex w-full items-center gap-2 overflow-x-auto pb-0.5 md:w-auto md:pb-0 shrink-0">
          {(
            [
              { id: 'book', label: 'Mechanics Book', Icon: BookOpen },
              { id: 'trophies', label: 'Trophies & Tracks', Icon: Award },
              { id: 'telemetry', label: 'Telemetry', Icon: BarChart3 },
            ] as const
          ).map(({ id, label, Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`tactile-btn lazer-slant-sm relative flex items-center border px-3 sm:px-4 py-1.5 text-xs font-bold cursor-pointer whitespace-nowrap shrink-0 ${
                  active
                    ? 'border-[var(--accent-bright)] bg-[var(--accent)] text-[var(--accent-on)]'
                    : 'skin-blade text-[#b6bfd1] hover:text-white'
                }`}
              >
                <span className="lazer-unslant-sm flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5" style={{ color: active ? 'currentColor' : 'var(--accent-bright)' }} />
                  <span>{label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Content Area */}
      <main className="orbit-scroll relative z-20 mx-auto w-full max-w-[1340px] flex-1 overflow-y-auto px-4 py-4 sm:px-8 sm:py-5 lg:overflow-hidden">
        {/* TAB 1: BOOK SPREAD — Left Index List + Right Illustrated Mechanics Page */}
        {tab === 'book' && (
          <div className="grid grid-cols-1 gap-5 lg:h-full lg:grid-cols-12 lg:overflow-hidden">
            {/* Left Page: Index Contents */}
            <aside
              className="orbit-scroll relative flex max-h-[260px] flex-col gap-2 overflow-y-auto border p-4 backdrop-blur-md lg:col-span-5 lg:max-h-none"
              style={{ backgroundColor: skin.surfaceBg, borderColor: skin.surfaceBorder }}
            >
              <SkinBladeTrim themeId={profile.theme} compact />
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--accent-bright)]">
                  Table of Contents · 19 Mechanics
                </span>
                <span className="text-[11px] text-[#a1abbe]">Total Hits Recorded</span>
              </div>

              {WAVE_MODES.map((m, idx) => {
                const stat = profile.mechanicStats[m.id];
                const hits = stat?.hits || 0;
                const active = selectedMode.id === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedModeId(m.id)}
                    className={`tactile-btn relative flex items-center justify-between gap-3 border px-3.5 py-2.5 text-left cursor-pointer ${
                      active
                        ? 'skin-surface-elevated border-[var(--accent-bright)]'
                        : 'skin-blade hover:border-white/30'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-[11px] text-[#68738a] tabular-nums w-5">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span
                        className="h-3 w-3 shrink-0"
                        style={{ backgroundColor: m.color }}
                      />
                      <div className="min-w-0">
                        <span className="font-display block truncate text-sm font-extrabold text-white">
                          {m.name}
                        </span>
                        <span className="block truncate text-[11px] text-[#a1abbe]">
                          {m.category} · {m.tag}
                        </span>
                      </div>
                    </div>
                    <span className="tabular-nums text-xs font-bold text-[var(--accent-secondary)] shrink-0">
                      {hits.toLocaleString()} hits
                    </span>
                  </button>
                );
              })}
            </aside>

            {/* Right Page: Illustrated Book Detail + Live Animation + Mechanic Stats */}
            <section
              className="orbit-scroll relative flex flex-col justify-between gap-6 border p-5 sm:p-8 backdrop-blur-md lg:col-span-7 lg:overflow-y-auto"
              style={{ backgroundColor: skin.surfaceBg, borderColor: skin.surfaceBorder }}
            >
              <SkinBladeTrim themeId={profile.theme} />
              <div className="space-y-6">
                <div className="flex flex-col items-center gap-6 border-b border-white/10 pb-6 sm:flex-row sm:items-start">
                  {/* Live Animated Diagram Canvas */}
                  <div
                    className="skin-surface-elevated relative flex flex-col items-center border p-3"
                    style={
                      isCozyXmas
                        ? {
                            borderColor: 'rgba(253, 230, 138, 0.5)',
                            boxShadow: 'inset 0 0 24px rgba(251, 191, 36, 0.14)',
                          }
                        : undefined
                    }
                  >
                    <SkinBladeTrim
                      themeId={profile.theme}
                      featured={isCozyXmas}
                      compact={!isCozyXmas}
                      accentVariant={isCozyXmas ? 'bow_star' : 'minimal'}
                    />
                    <MechanicDemoCanvas mode={selectedMode} />
                    <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[#808ba1]">
                      Live Visual Preview
                    </span>
                  </div>

                  {/* Mechanic Title & Tactical Overview */}
                  <div className="flex-1 space-y-3 min-w-0">
                    <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest">
                      <span style={{ color: selectedMode.color }}>{selectedMode.category}</span>
                      <span className="text-white/25">·</span>
                      <span className="text-[#a1abbe]">{selectedMode.tierPresence}</span>
                    </div>

                    <h2 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-white">
                      {selectedMode.name}
                    </h2>
                    <p className="text-sm leading-relaxed text-[#d1d5db]">
                      {selectedMode.desc}
                    </p>

                    <div className="space-y-2 border-t border-white/10 pt-3 text-xs">
                      <p className="text-[#e5e7eb]">
                        <strong className="text-[#22d3ee] uppercase tracking-wider mr-1.5">How To Play:</strong>
                        {selectedMode.howToHit}
                      </p>
                      <p className="text-[#b6bfd1]">
                        <strong className="text-[#fbbf24] uppercase tracking-wider mr-1.5">Pro Tip:</strong>
                        {selectedMode.timingTip}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Per-Mechanic Stats Telemetry */}
                <div>
                  <span className="block text-xs font-extrabold uppercase tracking-wider text-[#a1abbe] mb-3">
                    Your Career Record On {selectedMode.name}
                  </span>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 tabular-nums">
                    <div className="skin-blade border p-3.5">
                      <span className="block text-[11px] text-[#a1abbe]">Total Hits</span>
                      <span className="mt-1 block text-xl font-black text-white">
                        {mStat.hits.toLocaleString()}
                      </span>
                    </div>
                    <div className="skin-blade border p-3.5">
                      <span className="block text-[11px] text-[#a1abbe]">Perfect Strikes</span>
                      <span className="mt-1 block text-xl font-black text-[#fde047]">
                        {mStat.perfects.toLocaleString()}
                      </span>
                    </div>
                    <div className="skin-blade border p-3.5">
                      <span className="block text-[11px] text-[#a1abbe]">Misses</span>
                      <span className="mt-1 block text-xl font-black text-[#ef4444]">
                        {mStat.misses.toLocaleString()}
                      </span>
                    </div>
                    <div className="skin-blade border p-3.5">
                      <span className="block text-[11px] text-[#a1abbe]">Hit Rate</span>
                      <span className="mt-1 block text-xl font-black text-[#34d399]">
                        {mAcc.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                <span className="text-xs text-[#808ba1]">
                  Launch this mechanic in endless Practice Sandbox to sharpen timing.
                </span>
                <button
                  type="button"
                  onClick={() => onLaunchSandbox(selectedMode.id)}
                  className="tactile-btn lazer-slant flex items-center border border-[var(--accent-bright)] bg-[var(--accent)] px-6 py-2.5 text-xs font-black text-[var(--accent-on)] hover:bg-[var(--accent-bright)] cursor-pointer whitespace-nowrap"
                >
                  <span className="lazer-unslant flex items-center gap-2">
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>Practice {selectedMode.name}</span>
                  </span>
                </button>
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: TROPHY ROOM & UNLOCKED TRACKS */}
        {tab === 'trophies' && (
          <div className="orbit-scroll h-full space-y-7 overflow-y-auto pr-1">
            {/* Mastery Prestige Showcase */}
            <section
              className="relative border p-5 backdrop-blur-md"
              style={{ backgroundColor: skin.surfaceBg, borderColor: skin.surfaceBorder }}
            >
              <SkinBladeTrim themeId={profile.theme} featured />
              {isCozyXmas && (
                <img
                  aria-hidden="true"
                  src={XMAS_SPRITES.bellBow}
                  alt=""
                  className="pointer-events-none hidden sm:block absolute -left-3 -bottom-3 h-10 w-10 object-contain drop-shadow"
                />
              )}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className="skin-surface-elevated flex h-12 w-12 shrink-0 items-center justify-center border"
                    style={{
                      borderColor: prestige.tierColor,
                      boxShadow: `0 0 18px ${prestige.tierColor}33`,
                    }}
                  >
                    <Crown className="h-6 w-6" style={{ color: prestige.tierColor }} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2.5">
                      <span
                        className="font-display text-2xl font-black tracking-tight"
                        style={{ color: prestige.tierColor }}
                      >
                        {prestige.tierTitle}
                      </span>
                      <span className="text-xs font-semibold tracking-[0.16em] text-[#a1abbe]">
                        {prestige.jpTitle}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-[#b6bfd1] tabular-nums">
                      Mastery Rating <strong className="text-white">{prestige.points.toLocaleString()} PTS</strong>
                      <span className="mx-2 text-white/25">·</span>
                      SS Clears <strong className="text-[#fde047]">{prestige.ssCount}/{prestige.totalSongsCount}</strong>
                      <span className="mx-2 text-white/25">·</span>
                      S+ Clears <strong className="text-[#fbbf24]">{prestige.sOrHigherCount}</strong>
                      <span className="mx-2 text-white/25">·</span>
                      Overdrives <strong className="text-[var(--accent-bright)]">{profile.totalOverdrives}</strong>
                    </p>
                  </div>
                </div>

                <div className="w-full sm:w-64 shrink-0">
                  <div className="mb-1.5 flex items-center justify-between text-[11px] tabular-nums">
                    <span className="font-semibold text-[#a1abbe]">
                      {prestige.nextTierTitle
                        ? `Next: ${prestige.nextTierTitle} (${prestige.nextTierPoints.toLocaleString()} PTS)`
                        : 'Maximum Prestige Reached'}
                    </span>
                    <span className="font-extrabold text-white">
                      {Math.round(prestige.tierProgressPct)}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden bg-white/10">
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${prestige.tierProgressPct}%`,
                        backgroundColor: prestige.tierColor,
                      }}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Trophy Badges Shelf */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-lg font-black text-white">
                  Collector Trophy Badges ({profile.unlockedBadges.length}/{BADGE_CATALOG.length})
                </h2>
                <span className="text-xs text-[#a1abbe]">Unlock badges for permanent Orb bonuses</span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {BADGE_CATALOG.map((badge) => {
                  const unlocked = profile.unlockedBadges.includes(badge.id);
                  const tierColor =
                    badge.tier === 'prism'
                      ? '#e879f9'
                      : badge.tier === 'gold'
                      ? '#fbbf24'
                      : badge.tier === 'silver'
                      ? '#e2e8f0'
                      : '#fb923c';

                  return (
                    <div
                      key={badge.id}
                      className={`lazer-slant-sm relative border p-4 ${
                        unlocked
                          ? 'skin-surface-elevated'
                          : 'skin-blade opacity-65'
                      }`}
                    >
                      <SkinBladeTrim themeId={profile.theme} compact />
                      <div className="lazer-unslant-sm flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Award className="h-4 w-4 shrink-0" style={{ color: unlocked ? tierColor : '#68738a' }} />
                            <span className="font-display truncate text-sm font-extrabold text-white">
                              {badge.title}
                            </span>
                          </div>
                          <span className="mt-0.5 block text-[10px] font-semibold text-[#808ba1]">
                            {badge.jpTitle}
                          </span>
                          <p className="mt-1.5 text-xs text-[#b6bfd1]">{badge.desc}</p>
                        </div>

                        <div className="shrink-0 text-right tabular-nums">
                          {unlocked ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#34d399]">
                              <Check className="h-3.5 w-3.5" />
                              <span>Earned</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#fbbf24]">
                              <OrbIcon className="h-3.5 w-3.5" />
                              <span>+{badge.orbReward}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Unlocked Tracks Mastery Wall */}
            <section className="pb-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-lg font-black text-white">
                  Track Discography Mastery ({clearedTracksCount}/{songs.length} Cleared)
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {songs.map((song) => {
                  const unlocked =
                    profile.devUnlocked ||
                    song.orbCost === 0 ||
                    profile.unlockedSongs.includes(song.id);
                  const rec = profile.songRecords[song.id];
                  const isChristmas = song.category === 'christmas';

                  return (
                    <div
                      key={song.id}
                      className={`relative flex items-center justify-between gap-3 border p-3 ${
                        rec
                          ? 'skin-surface-elevated'
                          : 'skin-blade opacity-85'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={song.bgImageUrl}
                          alt={song.title}
                          referrerPolicy="no-referrer"
                          className={`h-11 w-11 shrink-0 border border-white/15 object-cover ${
                            !unlocked ? 'grayscale opacity-50' : ''
                          }`}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            {isChristmas && <Snowflake className="h-3 w-3 shrink-0 text-[#38bdf8]" />}
                            <span className="font-display truncate text-sm font-bold text-white">
                              {song.title}
                            </span>
                          </div>
                          <span className="block truncate text-[11px] text-[#a1abbe]">
                            {song.artist} · {rec ? `${rec.bestAccuracy.toFixed(1)}% · ${rec.bestCombo}x` : unlocked ? 'Unlocked' : `Locked (${song.orbCost} Orbs)`}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 tabular-nums">
                        {rec ? (
                          <span className="font-display text-2xl font-black text-[#fbbf24]">
                            {rec.bestRank}
                          </span>
                        ) : unlocked ? (
                          <span className="text-xs font-semibold text-[#68738a]">—</span>
                        ) : (
                          <Lock className="h-4 w-4 text-[#68738a]" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* TAB 3: CAREER TELEMETRY */}
        {tab === 'telemetry' && (
          <div className="orbit-scroll h-full space-y-6 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 tabular-nums">
              <div className="skin-surface relative border p-4 backdrop-blur-md">
                <SkinBladeTrim themeId={profile.theme} compact />
                <span className="block text-xs text-[#a1abbe]">Mastery Prestige</span>
                <span
                  className="font-display mt-1 block text-xl font-black truncate"
                  style={{ color: prestige.tierColor }}
                >
                  {prestige.tierTitle}
                </span>
                <span className="mt-0.5 block text-[11px] text-[#808ba1]">
                  {prestige.points.toLocaleString()} PTS · {prestige.ssMasteryPct.toFixed(0)}% SS
                </span>
              </div>
              <div className="skin-surface border p-4 backdrop-blur-md">
                <span className="block text-xs text-[#a1abbe]">High Score</span>
                <span className="mt-1 block text-2xl font-black text-white">
                  {profile.bestScore.toLocaleString()}
                </span>
              </div>
              <div className="skin-surface border p-4 backdrop-blur-md">
                <span className="block text-xs text-[#a1abbe]">Peak Combo</span>
                <span className="mt-1 block text-2xl font-black text-[var(--accent-secondary)]">
                  {profile.bestStreak}x
                </span>
              </div>
              <div className="skin-surface border p-4 backdrop-blur-md">
                <span className="block text-xs text-[#a1abbe]">Career Accuracy</span>
                <span className="mt-1 block text-2xl font-black text-[#34d399]">
                  {careerAcc.toFixed(1)}%
                </span>
              </div>
              <div className="skin-surface border p-4 backdrop-blur-md">
                <span className="block text-xs text-[#a1abbe]">Lifetime Orbs Earned</span>
                <span className="mt-1 flex items-center gap-1.5 text-2xl font-black text-[#fbbf24]">
                  <OrbIcon className="h-5 w-5" />
                  <span>{profile.totalOrbsEarned.toLocaleString()}</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="skin-surface relative border p-5 space-y-3 tabular-nums backdrop-blur-md">
                <SkinBladeTrim themeId={profile.theme} compact />
                <h3 className="font-display text-base font-extrabold text-white">
                  Difficulty Tier Best Scores
                </h3>
                {(['CHILL', 'NORMAL', 'HARD', 'INSANE', 'DEMON'] as const).map((tier) => (
                  <div key={tier} className="flex items-center justify-between border-b border-white/8 pb-2 text-xs">
                    <span className="font-bold text-[#d1d5db]">{tier}</span>
                    <span className="font-black text-white">
                      {(profile.tierBestScores[tier] || 0).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="skin-surface relative border p-5 space-y-3 tabular-nums backdrop-blur-md">
                <SkinBladeTrim themeId={profile.theme} compact />
                <h3 className="font-display text-base font-extrabold text-white">
                  Timing Tendency &amp; Accuracy Breakdown
                </h3>
                <div className="flex justify-between text-xs text-[#b6bfd1]">
                  <span>Total Hits: <strong className="text-white">{profile.totalHits.toLocaleString()}</strong></span>
                  <span>Perfects: <strong className="text-[#fde047]">{profile.totalPerfects.toLocaleString()}</strong></span>
                  <span>Misses: <strong className="text-[#ef4444]">{profile.totalMisses.toLocaleString()}</strong></span>
                </div>
                <div className="pt-2">
                  <div className="flex justify-between text-[11px] text-[#a1abbe] mb-1.5">
                    <span>Early Misses ({profile.earlyMisses})</span>
                    <span>Late Misses ({profile.lateMisses})</span>
                  </div>
                  <div className="flex h-2.5 w-full overflow-hidden bg-white/10">
                    {(() => {
                      const totBias = Math.max(1, profile.earlyMisses + profile.lateMisses);
                      const earlyPct = (profile.earlyMisses / totBias) * 100;
                      return (
                        <>
                          <div className="h-full bg-[#22d3ee]" style={{ width: `${earlyPct}%` }} />
                          <div className="h-full bg-[#ff3b82]" style={{ width: `${100 - earlyPct}%` }} />
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </motion.div>
  );
};
