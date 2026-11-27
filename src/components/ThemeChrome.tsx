import React from 'react';
import { XMAS_SPRITES } from '../data/christmasSprites';
import { getResolvedSkinPack } from '../store/studioRegistryStore';
import { ThemeId } from '../types/game';
import { useStudioLayout } from './LiveLayoutWrapper';

/**
 * Bespoke ORBIT crest logo dynamically styled per Transformation Theme,
 * faithful to the ConseptsFT art direction.
 */
export const ThemeTitleLogo: React.FC<{
  themeId: ThemeId;
  accentColor: string;
}> = ({ themeId, accentColor }) => {
  if (themeId === 'cozy_christmas_2026') {
    return (
      <div className="relative flex items-center select-none">
        <img
          src={XMAS_SPRITES.logoOrnate}
          alt="ORBIT Cozy Christmas 2026"
          className="h-14 sm:h-16 w-auto object-contain drop-shadow-[0_4px_18px_rgba(251,191,36,0.45)]"
        />
      </div>
    );
  }

  if (themeId === 'krampusnacht_2026') {
    return (
      <div className="relative flex items-center gap-3 select-none">
        <div className="relative">
          <svg
            aria-hidden="true"
            viewBox="0 0 250 92"
            className="pointer-events-none absolute -inset-x-6 -inset-y-3 h-[calc(100%+24px)] w-[calc(100%+48px)] overflow-visible"
          >
            {/* Spiked wrought-iron orbital crescent */}
            <path
              d="M14 54 C 35 16, 175 12, 224 44 C 195 72, 65 82, 20 62"
              fill="none"
              stroke="#dc2626"
              strokeWidth="2.4"
              opacity="0.92"
            />
            <path d="M50 22 L46 8 L58 18 Z" fill="#991b1b" />
            <path d="M188 22 L196 8 L198 24 Z" fill="#991b1b" />
            {/* Crimson 4-point star glint inside O */}
            <path
              d="M32 24 L35 39 L50 42 L35 45 L32 60 L29 45 L14 42 L29 39 Z"
              fill="#ef4444"
              opacity="0.9"
            />
            {/* Hanging brass Krampus bell */}
            <line x1="212" y1="42" x2="212" y2="62" stroke="#b45309" strokeWidth="1.8" />
            <path
              d="M203 78 L221 78 L217 65 C216 61 208 61 207 65 Z"
              fill="url(#krampusBell)"
              stroke="#f59e0b"
              strokeWidth="1"
            />
            <circle cx="212" cy="80" r="2.2" fill="#fbbf24" />
            <defs>
              <linearGradient id="krampusBell" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fde68a" />
                <stop offset="50%" stopColor="#b45309" />
                <stop offset="100%" stopColor="#451a03" />
              </linearGradient>
            </defs>
          </svg>
          <span
            className="font-display relative z-10 inline-block text-4xl sm:text-5xl font-black tracking-[0.16em] text-[#fef2f2]"
            style={{
              textShadow: '0 0 24px rgba(220,38,38,0.65), 0 4px 12px rgba(0,0,0,0.9)',
            }}
          >
            ORBIT
          </span>
          <div className="mt-0.5 text-center text-[11px] font-bold tracking-[0.35em] text-[#fca5a5]/80">
            降魔聖夜 · オービット
          </div>
        </div>
      </div>
    );
  }

  if (themeId === 'neon_sakura') {
    return (
      <div className="relative flex items-center gap-3 select-none">
        <div className="relative">
          <svg
            aria-hidden="true"
            viewBox="0 0 246 86"
            className="pointer-events-none absolute -inset-x-5 -inset-y-2 h-[calc(100%+16px)] w-[calc(100%+40px)] overflow-visible"
          >
            <ellipse
              cx="123"
              cy="43"
              rx="110"
              ry="26"
              transform="rotate(-8 123 43)"
              fill="none"
              stroke="url(#sakuraRing)"
              strokeWidth="2.6"
            />
            {/* Glowing 5-petal sakura bloom at top-right arc */}
            <g transform="translate(206 20)">
              {[0, 72, 144, 216, 288].map((deg) => (
                <ellipse
                  key={deg}
                  cx="0"
                  cy="-7"
                  rx="3.4"
                  ry="6.5"
                  transform={`rotate(${deg})`}
                  fill="#fbcfe8"
                  opacity="0.95"
                />
              ))}
              <circle cx="0" cy="0" r="2.6" fill="#facc15" />
            </g>
            <defs>
              <linearGradient id="sakuraRing" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f472b6" />
                <stop offset="55%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#facc15" />
              </linearGradient>
            </defs>
          </svg>
          <span
            className="font-display relative z-10 inline-block text-4xl sm:text-5xl font-black italic tracking-[0.13em] text-white"
            style={{
              textShadow: '0 0 24px rgba(244,63,142,0.55), 0 4px 12px rgba(0,0,0,0.8)',
            }}
          >
            ORBIT
          </span>
          <div className="mt-0.5 text-center text-[11px] font-bold tracking-[0.35em] text-[#fbcfe8]/90">
            オービット
          </div>
        </div>
      </div>
    );
  }

  // Classic orbital arcade mark
  return (
    <div className="relative flex items-center gap-3 select-none">
      <div className="relative">
        <span
          className="font-display inline-block text-4xl sm:text-5xl font-black italic tracking-[0.14em] text-white"
          style={{
            textShadow: `0 0 24px ${accentColor}66`,
          }}
        >
          ORBIT
        </span>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] font-semibold tracking-[0.32em] text-white/60">
          <span>オービット</span>
          <span aria-hidden="true">·</span>
          <span>TOKYO ARCADE</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Crisp theme-crafted top/corner accents anchored inside menu blades, cards, and modals across the entire app.
 */
export const ThemeBladeAccents: React.FC<{
  themeId: ThemeId;
  featured?: boolean;
  compact?: boolean;
}> = ({ themeId, featured = false, compact = false }) => {
  const { themesMap } = useStudioLayout();
  const skin = getResolvedSkinPack(themeId, themesMap);
  if (skin.trimStyle === 'none') return null;

  if (skin.trimStyle === 'snow_cap') {
    return (
      <>
        {/* Sculpted frosted snowdrift blanket along top bezel + warm gold bevel trim */}
        <svg
          aria-hidden="true"
          viewBox="0 0 400 28"
          preserveAspectRatio="none"
          className="pointer-events-none absolute -top-[4px] inset-x-0 h-[18px] w-full z-20 drop-shadow-[0_3px_5px_rgba(14,116,144,0.35)]"
        >
          <defs>
            <linearGradient id="xmasSnowBody" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="68%" stopColor="#f1f5f9" />
              <stop offset="100%" stopColor="#bae6fd" />
            </linearGradient>
          </defs>
          <path
            d="M0 0 L400 0 L400 10 C382 19, 362 7, 336 15 C312 22, 286 6, 256 13 C228 21, 198 8, 168 15 C140 23, 112 7, 82 14 C54 22, 26 8, 0 13 Z"
            fill="url(#xmasSnowBody)"
          />
          <path
            d="M0 13 C26 8, 54 22, 82 14 C112 7, 140 23, 168 15 C198 8, 228 21, 256 13 C286 6, 312 22, 336 15 C362 7, 382 19, 400 10"
            fill="none"
            stroke="#7dd3fc"
            strokeWidth="1.2"
            opacity="0.7"
          />
        </svg>

        {/* Subtle warm champagne-gold inner border sheen */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 border border-[#fde68a]/35 shadow-[inset_0_0_14px_rgba(251,191,36,0.12)]"
        />

        {/* Painted Holly Sprig Corner Cluster */}
        {!compact && (
          <img
            aria-hidden="true"
            src={XMAS_SPRITES.hollySprig}
            alt=""
            className="pointer-events-none absolute -left-3 -top-3.5 h-8 w-8 object-contain z-30 drop-shadow-[0_3px_6px_rgba(0,0,0,0.65)]"
          />
        )}

        {/* Featured Right-Corner Painted Crimson Velvet Bow + Hanging Gold Star */}
        {featured && (
          <div aria-hidden="true" className="pointer-events-none absolute -right-2 -top-3.5 z-30 flex flex-col items-center">
            <img
              src={XMAS_SPRITES.bowCrimson}
              alt=""
              className="h-9 w-9 object-contain drop-shadow-[0_3px_8px_rgba(225,29,72,0.55)]"
            />
            <svg viewBox="0 0 24 28" className="-mt-2 h-6 w-5 overflow-visible drop-shadow-[0_0_8px_rgba(253,224,71,0.95)]">
              <line x1="12" y1="0" x2="12" y2="10" stroke="#fde68a" strokeWidth="1.5" />
              <path d="M12 8 L14.5 14 L21 14.8 L16 18.8 L17.4 25 L12 21.8 L6.6 25 L8 18.8 L3 14.8 L9.5 14 Z" fill="#fde047" stroke="#fffbeb" strokeWidth="0.7" />
            </svg>
          </div>
        )}
      </>
    );
  }

  if (skin.trimStyle === 'krampus_iron') {
    return (
      <>
        {/* Forged dark iron spiked trim + crimson glow line */}
        <svg
          aria-hidden="true"
          viewBox="0 0 400 18"
          preserveAspectRatio="none"
          className="pointer-events-none absolute -top-[1px] inset-x-0 h-3.5 w-full z-20"
        >
          <path
            d="M0 0 L400 0 L400 5 L368 12 L344 5 L302 10 L270 4 L235 13 L195 5 L155 11 L115 4 L72 13 L38 5 L12 10 L0 5 Z"
            fill="rgba(226,232,240,0.22)"
          />
          <line x1="0" y1="1.5" x2="400" y2="1.5" stroke="#dc2626" strokeWidth="2.2" />
        </svg>
        {!compact && featured && (
          <svg
            aria-hidden="true"
            viewBox="0 0 42 42"
            className="pointer-events-none absolute -left-2 -top-2.5 h-9 w-9 z-30 drop-shadow-[0_3px_8px_rgba(220,38,38,0.65)]"
          >
            <path d="M21 12 L10 5 L14 16 Z" fill="#991b1b" />
            <path d="M21 12 L32 5 L28 16 Z" fill="#dc2626" />
            <path d="M14 29 L28 29 L25 18 C24 14 18 14 17 18 Z" fill="#d97706" stroke="#fde68a" strokeWidth="1" />
            <circle cx="21" cy="31" r="2" fill="#fef08a" />
          </svg>
        )}
      </>
    );
  }

  // sakura_blossom: gold kintsugi line + crisp blooming 5-petal blossoms
  return (
    <>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[2px] z-20"
        style={{
          background:
            'linear-gradient(90deg, rgba(250,204,21,0.9), #f472b6 45%, rgba(251,207,232,0.85) 80%, transparent)',
        }}
      />
      {!compact && (
        <svg
          aria-hidden="true"
          viewBox="0 0 48 48"
          className="pointer-events-none absolute -left-2 -top-2.5 h-8 w-8 z-30 drop-shadow-[0_2px_8px_rgba(244,63,142,0.65)]"
        >
          <g transform="translate(22 22)">
            {[0, 72, 144, 216, 288].map((deg) => (
              <ellipse
                key={deg}
                cx="0"
                cy="-8.5"
                rx="4.2"
                ry="8"
                transform={`rotate(${deg})`}
                fill={featured ? '#fbcfe8' : '#f472b6'}
                opacity="0.95"
              />
            ))}
            <circle cx="0" cy="0" r="3" fill="#facc15" />
          </g>
        </svg>
      )}
    </>
  );
};

/**
 * Spinning Disc / Platter themed bezel & ornaments matching the concept art.
 */
export const ThemeDiscBezel: React.FC<{ themeId: ThemeId }> = ({ themeId }) => {
  if (themeId === 'cozy_christmas_2026') {
    return (
      <div aria-hidden="true" className="pointer-events-none absolute -inset-6 z-20">
        {/* Soft snow drift crown arcing neatly across top platter */}
        <svg viewBox="0 0 260 260" className="h-full w-full overflow-visible">
          <defs>
            <linearGradient id="xmasDiscSnow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#bae6fd" />
            </linearGradient>
          </defs>
          <path
            d="M44 68 C 82 22, 162 20, 212 60 C 190 66, 168 48, 142 56 C 114 64, 90 46, 62 66 Z"
            fill="url(#xmasDiscSnow)"
            opacity="0.96"
          />
          {/* Hanging gold star beneath right ribbon */}
          <line x1="205" y1="74" x2="205" y2="112" stroke="#fde68a" strokeWidth="1.6" opacity="0.85" />
          <path
            d="M205 108 L210 119 L222 121 L213 128 L215 140 L205 134 L195 140 L197 128 L188 121 L200 119 Z"
            fill="#fde047"
            stroke="#fffbeb"
            strokeWidth="1"
          />
        </svg>
        {/* Painted Crimson Velvet Ribbon Bow perched on upper-right rim */}
        <img
          src={XMAS_SPRITES.bowCrimson}
          alt=""
          className="absolute -right-2 top-3 h-20 w-20 sm:h-24 sm:w-24 object-contain rotate-[14deg] drop-shadow-[0_6px_14px_rgba(0,0,0,0.75)]"
        />
        {/* Painted Holly Sprig nestled along upper-left rim */}
        <img
          src={XMAS_SPRITES.hollySprig}
          alt=""
          className="absolute left-1 top-3 h-12 w-12 sm:h-14 sm:w-14 object-contain -rotate-[18deg] drop-shadow-[0_4px_10px_rgba(0,0,0,0.7)]"
        />
      </div>
    );
  }

  if (themeId === 'krampusnacht_2026') {
    return (
      <div aria-hidden="true" className="pointer-events-none absolute -inset-7 z-20">
        <svg viewBox="0 0 280 280" className="h-full w-full overflow-visible">
          {/* Forged iron spiked halo & chain arcs */}
          <circle
            cx="140"
            cy="140"
            r="128"
            fill="none"
            stroke="#991b1b"
            strokeWidth="2.2"
            strokeDasharray="10 6"
            opacity="0.85"
          />
          {[0, 90, 180, 270].map((deg) => (
            <g key={deg} transform={`rotate(${deg} 140 140)`}>
              <path d="M140 2 L146 18 L140 26 L134 18 Z" fill="#ef4444" stroke="#fca5a5" strokeWidth="0.7" />
            </g>
          ))}
          {/* Glowing crimson candles flanking bottom-left & bottom-right */}
          <g transform="translate(26 205)">
            <rect x="0" y="16" width="12" height="32" rx="2" fill="#991b1b" />
            <ellipse cx="6" cy="10" rx="3.5" ry="6" fill="#fbbf24" />
            <ellipse cx="6" cy="11" rx="1.6" ry="3.2" fill="#fffbeb" />
          </g>
          <g transform="translate(232 212)">
            <rect x="0" y="14" width="11" height="28" rx="2" fill="#7f1d1d" />
            <ellipse cx="5.5" cy="9" rx="3" ry="5.5" fill="#fbbf24" />
            <ellipse cx="5.5" cy="10" rx="1.4" ry="3" fill="#fffbeb" />
          </g>
        </svg>
      </div>
    );
  }

  if (themeId === 'neon_sakura') {
    return (
      <div aria-hidden="true" className="pointer-events-none absolute -inset-6 z-20">
        <svg viewBox="0 0 260 260" className="h-full w-full overflow-visible">
          {/* Dual gold & magenta kintsugi halo */}
          <circle
            cx="130"
            cy="130"
            r="122"
            fill="none"
            stroke="url(#sakuraDiscHalo)"
            strokeWidth="2.4"
            opacity="0.9"
          />
          {/* Corner sakura clusters hugging bottom-left & top-left */}
          {[
            { x: 34, y: 48, s: 1.1 },
            { x: 18, y: 82, s: 0.85 },
            { x: 36, y: 210, s: 1.05 },
            { x: 224, y: 204, s: 0.9 },
          ].map((b, i) => (
            <g key={i} transform={`translate(${b.x} ${b.y}) scale(${b.s})`}>
              {[0, 72, 144, 216, 288].map((deg) => (
                <ellipse
                  key={deg}
                  cx="0"
                  cy="-8"
                  rx="4"
                  ry="7.5"
                  transform={`rotate(${deg})`}
                  fill="#fbcfe8"
                  stroke="#f472b6"
                  strokeWidth="0.8"
                />
              ))}
              <circle cx="0" cy="0" r="2.8" fill="#facc15" />
            </g>
          ))}
          <defs>
            <linearGradient id="sakuraDiscHalo" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f472b6" />
              <stop offset="50%" stopColor="#facc15" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  return null;
};

/**
 * Full-viewport subtle architectural SVG border motifs framing every non-playing and playing screen.
 */
export const ThemeCornerFraming: React.FC<{
  themeId: ThemeId;
  dimDuringPlay?: boolean;
}> = ({ themeId, dimDuringPlay = false }) => {
  const opacity = dimDuringPlay ? 0.34 : 0.82;

  if (themeId === 'cozy_christmas_2026') {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[8] overflow-hidden transition-opacity duration-300"
        style={{ opacity: dimDuringPlay ? 0.55 : 0.96 }}
      >
        {/* Top Arch Structural Timber & Hanging Gold Fairy Stars */}
        <svg viewBox="0 0 1600 180" preserveAspectRatio="none" className="absolute inset-x-0 top-0 h-28 sm:h-36 w-full">
          <defs>
            <linearGradient id="xmasArchGold" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#fde68a" stopOpacity="0.55" />
              <stop offset="50%" stopColor="#fffbeb" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#fde68a" stopOpacity="0.55" />
            </linearGradient>
          </defs>
          <path
            d="M0 68 Q 800 -18, 1600 68"
            fill="none"
            stroke="url(#xmasArchGold)"
            strokeWidth="2.2"
          />
          {/* Swaying golden star ornaments along the upper arch */}
          {[
            { x: 110, len: 54, r: 9 },
            { x: 245, len: 42, r: 7 },
            { x: 1365, len: 44, r: 7 },
            { x: 1495, len: 58, r: 10 },
          ].map((st, idx) => (
            <g key={idx}>
              <line x1={st.x} y1={0} x2={st.x} y2={st.len} stroke="#fde68a" strokeWidth="1.4" opacity="0.75" />
              <path
                d={`M${st.x} ${st.len - st.r} L${st.x + st.r * 0.3} ${st.len - st.r * 0.3} L${st.x + st.r} ${st.len} L${st.x + st.r * 0.3} ${st.len + st.r * 0.3} L${st.x} ${st.len + st.r} L${st.x - st.r * 0.3} ${st.len + st.r * 0.3} L${st.x - st.r} ${st.len} L${st.x - st.r * 0.3} ${st.len - st.r * 0.3} Z`}
                fill="#fffbeb"
              />
            </g>
          ))}
        </svg>

        {/* Left & Right Evergreen Pine-and-Brass-Bell Boughs */}
        <img
          src={XMAS_SPRITES.boughBell}
          alt=""
          className="absolute -left-6 -top-5 h-32 sm:h-44 w-auto object-contain -rotate-[12deg] drop-shadow-[0_6px_18px_rgba(0,0,0,0.7)]"
        />
        <img
          src={XMAS_SPRITES.boughBell}
          alt=""
          className="absolute -right-6 -top-5 h-32 sm:h-44 w-auto object-contain -scale-x-100 rotate-[12deg] drop-shadow-[0_6px_18px_rgba(0,0,0,0.7)]"
        />

        {/* Lower Corner Wreaths (kept subtle on menus, hidden during play for stage clarity) */}
        {!dimDuringPlay && (
          <img
            src={XMAS_SPRITES.wreath}
            alt=""
            className="hidden xl:block absolute -left-6 bottom-12 h-28 w-28 object-contain opacity-85 drop-shadow-[0_6px_16px_rgba(0,0,0,0.75)]"
          />
        )}
      </div>
    );
  }

  if (themeId === 'krampusnacht_2026') {
    return (
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[6] overflow-hidden transition-opacity duration-300" style={{ opacity }}>
        {/* Draped forged chains top-left & top-right */}
        <svg viewBox="0 0 320 180" className="absolute left-0 top-0 h-40 w-64">
          <path d="M0 44 Q 110 112 240 0" fill="none" stroke="#1e293b" strokeWidth="8" strokeDasharray="14 6" />
          <path d="M0 44 Q 110 112 240 0" fill="none" stroke="#dc2626" strokeWidth="1.4" opacity="0.55" />
        </svg>
        <svg viewBox="0 0 320 180" className="absolute right-0 top-0 h-40 w-64">
          <path d="M320 44 Q 210 112 80 0" fill="none" stroke="#1e293b" strokeWidth="8" strokeDasharray="14 6" />
          <path d="M320 44 Q 210 112 80 0" fill="none" stroke="#dc2626" strokeWidth="1.4" opacity="0.55" />
        </svg>
      </div>
    );
  }

  if (themeId === 'neon_sakura') {
    return (
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[6] overflow-hidden transition-opacity duration-300" style={{ opacity }}>
        {/* Hanging sakura silhouette branch upper corners + crisp pink neon circuit lines */}
        <svg viewBox="0 0 320 200" className="absolute left-0 top-0 h-44 w-72">
          <path d="M-8 12 Q 75 26 148 82" fill="none" stroke="#1e0b1e" strokeWidth="5" strokeLinecap="round" />
          {[
            { x: 52, y: 24, s: 1.0 },
            { x: 96, y: 42, s: 1.15 },
            { x: 136, y: 74, s: 0.9 },
            { x: 24, y: 58, s: 0.8 },
          ].map((b, i) => (
            <g key={i} transform={`translate(${b.x} ${b.y}) scale(${b.s})`}>
              {[0, 72, 144, 216, 288].map((deg) => (
                <ellipse key={deg} cx="0" cy="-7" rx="3.4" ry="6.5" transform={`rotate(${deg})`} fill="#f472b6" opacity="0.88" />
              ))}
              <circle cx="0" cy="0" r="2.4" fill="#facc15" />
            </g>
          ))}
        </svg>
        <svg viewBox="0 0 320 200" className="absolute right-0 bottom-0 h-44 w-72">
          <path d="M328 188 Q 245 174 172 118" fill="none" stroke="#1e0b1e" strokeWidth="5" strokeLinecap="round" />
          {[
            { x: 268, y: 174, s: 1.05 },
            { x: 222, y: 152, s: 1.15 },
            { x: 184, y: 124, s: 0.85 },
          ].map((b, i) => (
            <g key={i} transform={`translate(${b.x} ${b.y}) scale(${b.s})`}>
              {[0, 72, 144, 216, 288].map((deg) => (
                <ellipse key={deg} cx="0" cy="-7" rx="3.4" ry="6.5" transform={`rotate(${deg})`} fill="#fbcfe8" opacity="0.88" />
              ))}
              <circle cx="0" cy="0" r="2.4" fill="#facc15" />
            </g>
          ))}
        </svg>
      </div>
    );
  }

  return null;
};
