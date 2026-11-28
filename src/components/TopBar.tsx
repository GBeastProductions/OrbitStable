import React from 'react';
import { ArrowLeft, Pause, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { XMAS_SPRITES } from '../data/christmasSprites';
import { DifficultyId, SongDefinition, ThemeId } from '../types/game';
import { StudioSlot } from './LiveLayoutWrapper';

interface TopBarProps {
  activeSong: SongDefinition;
  activeDifficulty: DifficultyId;
  themeId?: ThemeId;
  equippedModsCount: number;
  beatLedIndex: number;
  songTimerText: string;
  songProgressPct: number;
  onBackToSongSelect: () => void;
  onQuickRestart: () => void;
  onOpenMods: () => void;
  onOpenPause: () => void;
}

export const TopBar: React.FC<TopBarProps> = React.memo(
  ({
    activeSong,
    activeDifficulty,
    themeId = 'tokyo_pink',
    equippedModsCount,
    beatLedIndex,
    songTimerText,
    songProgressPct,
    onBackToSongSelect,
    onQuickRestart,
    onOpenMods,
    onOpenPause,
  }) => {
    const isChristmas = themeId === 'cozy_christmas_2026';

    return (
      <StudioSlot widgetId="stage_top_bar" label="Stage Top Bar" className="relative z-20 shrink-0">
        <header
          className="relative flex h-[54px] shrink-0 items-center justify-between gap-4 border-t border-b px-4 sm:px-7 backdrop-blur-md"
          style={{
            background: isChristmas
              ? 'linear-gradient(90deg, rgba(28, 12, 22, 0.94) 0%, rgba(18, 12, 26, 0.92) 50%, rgba(28, 12, 22, 0.94) 100%)'
              : undefined,
            backgroundColor: isChristmas ? undefined : 'var(--skin-header, rgba(8, 10, 17, 0.92))',
            borderBottomColor: isChristmas ? 'rgba(253, 224, 140, 0.45)' : 'var(--skin-border, rgba(255, 255, 255, 0.12))',
            borderTopColor: isChristmas ? '#fde68a' : 'var(--accent)',
            boxShadow: isChristmas
              ? '0 4px 26px rgba(0, 0, 0, 0.72), inset 0 -1px 0 rgba(253, 230, 138, 0.25)'
              : '0 4px 24px rgba(0, 0, 0, 0.65)',
          }}
        >
          {/* Subtle winter holly sprig framing corners during Christmas mode */}
          {isChristmas && (
            <>
              <img
                src={XMAS_SPRITES.hollySprig}
                alt=""
                aria-hidden="true"
                className="pointer-events-none hidden sm:block absolute left-1 top-1 h-7 w-7 object-contain opacity-90 drop-shadow"
              />
              <img
                src={XMAS_SPRITES.hollySprig}
                alt=""
                aria-hidden="true"
                className="pointer-events-none hidden sm:block absolute right-1 top-1 h-7 w-7 object-contain -scale-x-100 opacity-90 drop-shadow"
              />
            </>
          )}

          {/* Left Zone: Back to Tracks */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onBackToSongSelect}
              className="tactile-btn lazer-slant-sm flex items-center border px-3.5 py-1.5 text-xs font-bold text-white hover:border-[var(--accent-bright)] cursor-pointer whitespace-nowrap shrink-0"
              style={{
                backgroundColor: 'var(--skin-blade, #121624)',
                borderColor: 'var(--skin-border, rgba(255,255,255,0.18))',
              }}
            >
              <span className="lazer-unslant-sm flex items-center gap-1.5">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Tracks</span>
              </span>
            </button>

            <div className="hidden sm:flex items-center gap-2 min-w-0 truncate text-xs text-[#a1abbe]">
              {isChristmas && (
                <img
                  src={XMAS_SPRITES.sparkleGold}
                  alt=""
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 object-contain"
                />
              )}
              <span className="font-display font-bold text-white truncate max-w-[180px]">
                {activeSong.title}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-bold text-[var(--accent-bright)] whitespace-nowrap">
                {activeSong.chillOnly ? 'CHILL' : activeSong.demonOnly ? 'DEMON' : activeDifficulty}
              </span>
            </div>
          </div>

          {/* Center Zone: Beat LEDs + Song Timer */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden md:flex items-center gap-1.5" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => {
                const active = beatLedIndex === i;
                return (
                  <span
                    key={i}
                    className={`h-2 w-4 transition-all duration-100 ${
                      active
                        ? 'bg-[var(--accent-bright)] shadow-[0_0_10px_var(--accent-bright)]'
                        : 'bg-white/15'
                    }`}
                  />
                );
              })}
            </div>
            <span className="tabular-nums text-xs font-bold text-[#e5e7eb] whitespace-nowrap">
              {songTimerText}
            </span>
          </div>

          {/* Right Zone: Quick Restart + Mods + Pause */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onQuickRestart}
              title="Quick Restart (R)"
              className="tactile-btn lazer-slant-sm flex items-center border px-2.5 py-1.5 text-xs font-bold text-[#d1d5db] hover:border-[#22d3ee] hover:text-white cursor-pointer whitespace-nowrap"
              style={{
                backgroundColor: 'var(--skin-blade, #121624)',
                borderColor: 'var(--skin-border, rgba(255,255,255,0.18))',
              }}
            >
              <span className="lazer-unslant-sm flex items-center gap-1.5">
                <RotateCcw className="h-3.5 w-3.5 text-[#22d3ee]" />
                <span className="hidden sm:inline">Retry</span>
              </span>
            </button>
            <button
              type="button"
              onClick={onOpenMods}
              className="tactile-btn lazer-slant-sm flex items-center border px-3 py-1.5 text-xs font-bold text-[#e5e7eb] hover:border-[var(--accent-bright)] cursor-pointer whitespace-nowrap"
              style={{
                backgroundColor: 'var(--skin-blade, #121624)',
                borderColor: 'var(--skin-border, rgba(255,255,255,0.18))',
              }}
            >
              <span className="lazer-unslant-sm flex items-center gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5 text-[var(--accent-bright)]" />
                <span>{equippedModsCount > 0 ? `Mods (${equippedModsCount})` : 'Mods'}</span>
              </span>
            </button>
            <button
              type="button"
              onClick={onOpenPause}
              className="tactile-btn lazer-slant-sm flex items-center border px-3.5 py-1.5 text-xs font-bold text-white hover:border-[var(--accent-bright)] cursor-pointer whitespace-nowrap"
              style={{
                backgroundColor: 'var(--skin-blade, #121624)',
                borderColor: 'var(--skin-border, rgba(255,255,255,0.18))',
              }}
            >
              <span className="lazer-unslant-sm flex items-center gap-1.5">
                <Pause className="h-3.5 w-3.5" />
                <span>Pause</span>
              </span>
            </button>
          </div>

          {/* Hairline Song Progress Bar along Bottom Edge */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-white/10"
          >
            <div
              className="h-full bg-[var(--accent-bright)] shadow-[0_0_8px_var(--accent-bright)] transition-all duration-150"
              style={{ width: `${Math.max(0, Math.min(100, songProgressPct))}%` }}
            />
          </div>
        </header>
      </StudioSlot>
    );
  },
);
