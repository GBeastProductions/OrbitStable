import React from 'react';
import { Lock, ShoppingBag, X } from 'lucide-react';
import { MOD_CATALOG } from '../data/catalog';
import { computeTotalMultiplier } from '../engine/beatmap';
import { DifficultyId, ModCategory, ModCode } from '../types/game';
import { OrbIcon } from './OrbIcon';

interface ModDrawerProps {
  open: boolean;
  equippedMods: ModCode[];
  purchasedMods: ModCode[];
  totalHits: number;
  devUnlocked: boolean;
  activeDifficulty: DifficultyId;
  onToggleMod: (code: ModCode) => void;
  onClearMods: () => void;
  onOpenShop: () => void;
  onClose: () => void;
}

const GROUPS: { id: ModCategory; label: string; accent: string }[] = [
  { id: 'reduction', label: 'Difficulty Reduction', accent: '#34d399' },
  { id: 'increase', label: 'Difficulty Increase', accent: '#f43f5e' },
  { id: 'special', label: 'Special Arcade', accent: '#a855f7' },
];

export const ModDrawer: React.FC<ModDrawerProps> = React.memo(
  ({
    open,
    equippedMods,
    purchasedMods,
    totalHits,
    devUnlocked,
    activeDifficulty,
    onToggleMod,
    onClearMods,
    onOpenShop,
    onClose,
  }) => {
    const baseWithMods = computeTotalMultiplier(activeDifficulty, equippedMods, 0);

    return (
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="modDrawerTitle"
        aria-hidden={!open}
        className={`fixed bottom-0 left-1/2 z-50 flex max-h-[82dvh] w-[min(96vw,920px)] flex-col border-t-2 border-[var(--accent-bright)] shadow-2xl backdrop-blur-md transition-transform duration-200 ease-out ${
          open
            ? '-translate-x-1/2 translate-y-0'
            : '-translate-x-1/2 translate-y-[104%] pointer-events-none'
        }`}
        style={{ backgroundColor: 'var(--skin-surface, rgba(11, 14, 22, 0.98))' }}
      >
        {open && (
          <>
            <div
              className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4"
              style={{
                backgroundColor: 'var(--skin-header, #121624)',
                borderColor: 'var(--skin-border, rgba(255,255,255,0.12))',
              }}
            >
              <div className="min-w-0">
                <h3
                  id="modDrawerTitle"
                  className="font-display text-base font-extrabold tracking-tight text-white"
                >
                  Mod Setup · モッド設定
                </h3>
                <p className="mt-0.5 text-xs text-[#a1abbe] tabular-nums">
                  {equippedMods.length}/3 Active · {baseWithMods.toFixed(2)}x Score Multiplier
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={onOpenShop}
                  className="tactile-btn flex items-center gap-1.5 border border-[#fbbf24]/40 bg-[#1c1608] px-3 py-1.5 text-xs font-bold text-[#fbbf24] hover:border-[#fbbf24] cursor-pointer whitespace-nowrap"
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  <span>Shop Mods</span>
                </button>
                <button
                  type="button"
                  onClick={onClearMods}
                  className="tactile-btn border border-white/15 bg-[#181e30] px-3.5 py-1.5 text-xs font-semibold text-[#d1d5db] hover:text-white cursor-pointer whitespace-nowrap"
                >
                  Clear All
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="tactile-btn border border-white/15 bg-[#181e30] p-2 text-[#d1d5db] hover:text-white cursor-pointer"
                  aria-label="Close Mod Setup"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="orbit-scroll grid grid-cols-1 gap-4 overflow-y-auto p-5 md:grid-cols-3">
              {GROUPS.map((group) => {
                const items = MOD_CATALOG.filter((m) => m.category === group.id);
                return (
                  <div key={group.id} className="space-y-2">
                    <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                      <span
                        className="text-xs font-extrabold uppercase tracking-wider"
                        style={{ color: group.accent }}
                      >
                        {group.label}
                      </span>
                      <span className="text-[10px] font-semibold text-[#68738a] tabular-nums">
                        {items.length}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {items.map((mod) => {
                        const active = equippedMods.includes(mod.code);
                        const needsHits = !devUnlocked && totalHits < mod.unlockHits;
                        const needsShop =
                          !devUnlocked && mod.orbCost > 0 && !purchasedMods.includes(mod.code);
                        const locked = needsHits || needsShop;
                        const fullAndNotActive = !active && equippedMods.length >= 3;

                        return (
                          <button
                            key={mod.id}
                            type="button"
                            disabled={locked || fullAndNotActive}
                            onClick={() => onToggleMod(mod.code)}
                            className={`tactile-btn flex w-full items-start justify-between gap-2.5 border p-3 text-left cursor-pointer disabled:cursor-not-allowed ${
                              active
                                ? 'border-[var(--accent-bright)] bg-[var(--accent-dim)]'
                                : locked
                                ? 'border-white/8 opacity-70 skin-surface'
                                : fullAndNotActive
                                ? 'border-white/8 opacity-50 skin-surface'
                                : 'skin-blade hover:border-white/25'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className="font-mono text-xs font-extrabold"
                                  style={{ color: active ? '#ffffff' : group.accent }}
                                >
                                  {mod.code}
                                </span>
                                <span className="font-display text-sm font-bold text-white truncate">
                                  {mod.name}
                                </span>
                              </div>
                              <p className="mt-1 text-[11px] leading-relaxed text-[#b6bfd1]">
                                {mod.desc}
                              </p>
                            </div>
                            <div className="shrink-0 text-right tabular-nums">
                              {needsShop ? (
                                <span className="flex items-center gap-1 text-[11px] font-bold text-[#fbbf24] whitespace-nowrap">
                                  <OrbIcon className="h-3.5 w-3.5" />
                                  <span>{mod.orbCost}</span>
                                </span>
                              ) : needsHits ? (
                                <span className="flex items-center gap-1 text-[11px] font-bold text-[#fbbf24] whitespace-nowrap">
                                  <Lock className="h-3 w-3" />
                                  <span>{mod.unlockHits} Hits</span>
                                </span>
                              ) : (
                                <span
                                  className={`text-xs font-extrabold whitespace-nowrap ${
                                    mod.mult >= 1 ? 'text-[#22d3ee]' : 'text-[#fbbf24]'
                                  }`}
                                >
                                  {mod.mult.toFixed(2)}x
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>
    );
  },
);
