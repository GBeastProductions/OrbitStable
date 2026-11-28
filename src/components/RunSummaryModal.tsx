import React from 'react';
import { motion } from 'motion/react';
import { Award, Film, ListMusic, RotateCcw, Sparkles } from 'lucide-react';
import { computeNextMilestone } from '../engine/beatmap';
import { XMAS_SPRITES } from '../data/christmasSprites';
import { getResolvedChassisTheme } from '../store/studioRegistryStore';
import { RunSummaryData, ThemeId } from '../types/game';
import { useStudioLayout } from './LiveLayoutWrapper';
import { OrbIcon } from './OrbIcon';
import { SkinBladeTrim } from './SkinAtmosphere';

interface RunSummaryModalProps {
  summary: RunSummaryData | null;
  themeId?: ThemeId;
  hasReplay?: boolean;
  onWatchReplay?: () => void;
  onRetry: () => void;
  onOpenSongSelect: () => void;
  onOpenOrbVault: () => void;
  onEquipTheme?: (themeId: ThemeId) => void;
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

export const RunSummaryModal: React.FC<RunSummaryModalProps> = ({
  summary,
  themeId = 'tokyo_pink',
  hasReplay,
  onWatchReplay,
  onRetry,
  onOpenSongSelect,
  onOpenOrbVault,
  onEquipTheme,
}) => {
  const { themesMap } = useStudioLayout();
  if (!summary) return null;

  const rankClass =
    summary.isSilverRank && (summary.rank === 'SS' || summary.rank === 'S')
      ? 'text-[#e5e7eb]'
      : RANK_COLORS[summary.rank] || 'text-white';

  const milestone = computeNextMilestone(
    summary.accuracy,
    summary.missCount,
    summary.cleared,
    summary.difficulty,
  );

  const binCount = 15;
  const bins = new Array<number>(binCount).fill(0);
  for (const s of summary.offsetSamples) {
    const norm = Math.max(-1, Math.min(0.999, s));
    const idx = Math.floor(((norm + 1) / 2) * binCount);
    bins[Math.max(0, Math.min(binCount - 1, idx))] += 1;
  }
  const maxBin = Math.max(1, ...bins);

  const unlockedSkins = summary.newlyUnlockedThemes || [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="runSummaryTitle"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/84 p-4 backdrop-blur-xs"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto orbit-scroll border shadow-2xl"
        style={{
          backgroundColor: 'var(--skin-surface, #0b0e16)',
          borderColor:
            themeId === 'cozy_christmas_2026'
              ? 'rgba(253, 230, 138, 0.6)'
              : 'var(--skin-border, rgba(255,255,255,0.15))',
          boxShadow:
            themeId === 'cozy_christmas_2026'
              ? '0 24px 64px rgba(0,0,0,0.88), 0 0 32px rgba(225,29,72,0.28)'
              : undefined,
        }}
      >
        {/* Top Rank Header */}
        <div
          className="relative flex items-center justify-between gap-4 border-b px-6 py-5"
          style={{
            background:
              themeId === 'cozy_christmas_2026'
                ? 'linear-gradient(90deg, rgba(46, 14, 26, 0.96), rgba(20, 12, 24, 0.96))'
                : undefined,
            backgroundColor:
              themeId === 'cozy_christmas_2026'
                ? undefined
                : 'var(--skin-header, #121624)',
            borderColor:
              themeId === 'cozy_christmas_2026'
                ? 'rgba(253, 230, 138, 0.42)'
                : 'var(--skin-border, rgba(255,255,255,0.12))',
          }}
        >
          <SkinBladeTrim themeId={themeId} featured accentVariant="bow_star" />
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent-bright)]">
              {summary.cleared ? 'Stage Cleared · クリア' : `Stage Failed · ${summary.missReason || 'Missed'}`}
            </p>
            <h2
              id="runSummaryTitle"
              className="font-display mt-1 truncate text-2xl font-black text-white"
            >
              {summary.songTitle}
            </h2>
            <p className="text-xs text-[#a1abbe]">
              {summary.artist} · {summary.difficulty}
              {summary.isPractice && ' · Practice Run (Unranked)'}
              {summary.isNewBest && !summary.isPractice && ' · New Personal Best'}
            </p>
          </div>

          <div className="relative shrink-0 text-right">
            {themeId === 'cozy_christmas_2026' && summary.cleared && (
              <img
                aria-hidden="true"
                src={XMAS_SPRITES.wreath}
                alt=""
                className="pointer-events-none absolute -left-14 top-1/2 h-12 w-12 -translate-y-1/2 object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.7)]"
              />
            )}
            <span className="block text-[11px] font-semibold uppercase tracking-widest text-[#a1abbe]">
              Rank
            </span>
            <span className={`font-display text-5xl font-black leading-none ${rankClass}`}>
              {summary.rank}
            </span>
          </div>
        </div>

        {/* Metrics Body */}
        <div className="space-y-5 p-6">
          <div className="grid grid-cols-3 gap-3 border-b border-white/10 pb-4 tabular-nums">
            <div>
              <span className="block text-xs text-[#a1abbe]">Score</span>
              <span className="mt-0.5 block text-2xl font-black text-white">
                {summary.score.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="block text-xs text-[#a1abbe]">Accuracy</span>
              <span className="mt-0.5 block text-2xl font-black text-[#22d3ee]">
                {summary.accuracy.toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="block text-xs text-[#a1abbe]">Max Combo</span>
              <span className="mt-0.5 block text-2xl font-black text-[#fbbf24]">
                {summary.maxCombo}x
              </span>
            </div>
          </div>

          {/* Judgment Breakdown */}
          <div className="grid grid-cols-4 gap-2 text-center tabular-nums">
            <div className="border skin-blade p-2.5">
              <span className="block text-[11px] text-[#a1abbe]">Perfect</span>
              <span className="text-base font-extrabold text-white">{summary.perfectCount}</span>
            </div>
            <div className="border skin-blade p-2.5">
              <span className="block text-[11px] text-[#a1abbe]">Great</span>
              <span className="text-base font-extrabold text-[#34d399]">{summary.greatCount}</span>
            </div>
            <div className="border skin-blade p-2.5">
              <span className="block text-[11px] text-[#a1abbe]">Good</span>
              <span className="text-base font-extrabold text-[#22d3ee]">{summary.goodCount}</span>
            </div>
            <div className="border skin-blade p-2.5">
              <span className="block text-[11px] text-[#a1abbe]">Miss</span>
              <span className="text-base font-extrabold text-[#ef4444]">{summary.missCount}</span>
            </div>
          </div>

          {/* Hit Timing Distribution */}
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs text-[#a1abbe]">
              <span>Hit Timing Spread (Early ◀ 0° ▶ Late)</span>
              <span className="tabular-nums text-white">Avg {summary.avgOffsetDeg.toFixed(1)}°</span>
            </div>
            <div className="flex h-10 items-end gap-1 border-b border-white/10 pb-1">
              {bins.map((count, i) => {
                const pct = count > 0 ? Math.max(14, Math.round((count / maxBin) * 100)) : 6;
                const isCenter = Math.abs(i - 7) <= 1;
                return (
                  <div key={i} className="flex h-full flex-1 items-end">
                    <div
                      className={`w-full ${
                        count === 0
                          ? 'bg-white/10'
                          : isCenter
                          ? 'bg-white'
                          : 'bg-[var(--accent)]'
                      }`}
                      style={{ height: `${pct}%` }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Newly Unlocked Full Transformation Skins */}
          {unlockedSkins.length > 0 && (
            <div className="border border-[var(--accent-bright)] bg-[var(--accent-dim)]/65 p-4 shadow-[0_0_24px_rgba(var(--bg-accent-rgb,255,59,130),0.24)]">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#fde047]">
                <Sparkles className="h-4 w-4" />
                <span>Full-UI Transformation Skin Unlocked</span>
              </div>
              <div className="mt-2.5 space-y-2">
                {unlockedSkins.map((tid) => {
                  const theme = getResolvedChassisTheme(tid, themesMap);
                  if (!theme) return null;
                  return (
                    <div
                      key={tid}
                      className="flex flex-wrap items-center justify-between gap-3 border border-white/15 bg-black/45 px-3.5 py-2.5"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className="h-7 w-7 shrink-0 border border-white/30"
                          style={{
                            background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                          }}
                        />
                        <div className="min-w-0">
                          <span className="font-display block truncate text-sm font-black text-white">
                            {theme.label} <span className="text-xs font-semibold text-white/70">· {theme.jpLabel}</span>
                          </span>
                          <span className="block truncate text-[11px] text-[#e2e8f0]">
                            {theme.unlockRequirement}
                          </span>
                        </div>
                      </div>
                      {onEquipTheme && (
                        <button
                          type="button"
                          onClick={() => onEquipTheme(tid)}
                          className="tactile-btn lazer-slant-sm shrink-0 border border-[#fde047] bg-[#fde047] px-3.5 py-1.5 text-xs font-black text-[#090b10] hover:bg-white cursor-pointer"
                        >
                          <span className="lazer-unslant-sm block">Equip Skin Now</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Newly Unlocked Trophy Badges */}
          {summary.newlyEarnedBadges.length > 0 && (
            <div className="border border-[#fbbf24]/45 bg-[#1c1608]/80 p-3.5">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#fbbf24]">
                <Award className="h-4 w-4" />
                <span>Trophy Badge{summary.newlyEarnedBadges.length > 1 ? 's' : ''} Unlocked</span>
              </div>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {summary.newlyEarnedBadges.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between border border-white/10 bg-[#0d1018] px-3 py-2 text-xs"
                  >
                    <div className="min-w-0">
                      <span className="font-bold text-white block truncate">{b.title}</span>
                      <span className="text-[11px] text-[#a1abbe] block truncate">{b.desc}</span>
                    </div>
                    <span className="ml-2 font-black text-[#fbbf24] whitespace-nowrap tabular-nums">
                      +{b.orbReward}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Orbs & Next Rank Forecast */}
          <div className="flex flex-col gap-2 border skin-blade p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-[#fbbf24] tabular-nums">
                <OrbIcon className="h-4 w-4" />
                <span>
                  {summary.cashOutApproved
                    ? `+${summary.cashedOutOrbs} Orbs Banked`
                    : summary.badgeBonusOrbs > 0
                    ? `+${summary.badgeBonusOrbs} Badge Orbs (${summary.unbankedOrbs} run Orbs need C-Rank+)`
                    : `${summary.unbankedOrbs} Orbs Unbanked (Needs C-Rank+)`}
                </span>
              </div>
              <p className="mt-1 text-xs text-[#a1abbe]">{milestone.gapLabel}</p>
            </div>
            <button
              type="button"
              onClick={onOpenOrbVault}
              className="tactile-btn shrink-0 border border-[#fbbf24]/40 bg-[#1c1608] px-3.5 py-2 text-xs font-bold text-[#fbbf24] hover:border-[#fbbf24] cursor-pointer whitespace-nowrap"
            >
              Open Orb Shop
            </button>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onOpenSongSelect}
              className="tactile-btn flex items-center gap-2 border skin-blade px-5 py-2.5 text-xs font-bold text-white hover:border-white/35 cursor-pointer whitespace-nowrap"
            >
              <ListMusic className="h-4 w-4" />
              <span>Track Select</span>
            </button>
            {hasReplay && onWatchReplay && (
              <button
                type="button"
                onClick={onWatchReplay}
                className="tactile-btn flex items-center gap-2 border border-[#c084fc]/50 bg-[#1e1230] px-5 py-2.5 text-xs font-bold text-[#e9d5ff] hover:border-[#c084fc] cursor-pointer whitespace-nowrap"
              >
                <Film className="h-4 w-4 text-[#c084fc]" />
                <span>Watch Replay</span>
              </button>
            )}
            <button
              type="button"
              onClick={onRetry}
              className="tactile-btn lazer-slant flex items-center border border-[var(--accent-bright)] bg-[var(--accent)] px-6 py-2.5 text-xs font-black text-[var(--accent-on)] hover:bg-[var(--accent-bright)] cursor-pointer whitespace-nowrap"
            >
              <span className="lazer-unslant flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                <span>Retry Stage</span>
              </span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
