import React from 'react';
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
      <div className="relative flex items-center gap-3 select-none">
        <div className="relative">
          {/* Santa Hat perched atop the 'O' */}
          <svg
            aria-hidden="true"
            viewBox="0 0 84 62"
            className="pointer-events-none absolute -left-3 -top-6 h-11 w-14 drop-shadow-[0_4px_10px_rgba(0,0,0,0.65)] z-20"
          >
            <path
              d="M14 42 C18 16, 48 6, 68 18 C58 28, 52 38, 46 44 Z"
              fill="#dc2626"
              stroke="#7f1d1d"
              strokeWidth="1.5"
            />
            <path d="M24 22 C36 14, 52 14, 62 20" stroke="#fca5a5" strokeWidth="2.5" fill="none" opacity="0.55" strokeLinecap="round" />
            <circle cx="69" cy="19" r="7" fill="#fffbeb" stroke="#fde68a" strokeWidth="1.5" />
            <rect x="9" y="39" width="42" height="11" rx="5.5" transform="rotate(-10 30 44)" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
          </svg>
          {/* Tilted elliptical orbit halo */}
          <svg
            aria-hidden="true"
            viewBox="0 0 240 84"
            className="pointer-events-none absolute -inset-x-5 -inset-y-2 h-[calc(100%+16px)] w-[calc(100%+40px)] overflow-visible"
          >
            <ellipse
              cx="120"
              cy="42"
              rx="108"
              ry="28"
              transform="rotate(-9 120 42)"
              fill="none"
              stroke="url(#xmasLogoRing)"
              strokeWidth="2.8"
            />
            {/* Hanging star & 4-point shimmer */}
            <path d="M206 10 L210 20 L220 24 L210 28 L206 38 L202 28 L192 24 L202 20 Z" fill="#fef08a" />
            <line x1="18" y1="54" x2="18" y2="74" stroke="#fde68a" strokeWidth="1.4" opacity="0.7" />
            <path d="M18 71 L21 77 L27 78 L22 82 L23 88 L18 85 L13 88 L14 82 L9 78 L15 77 Z" fill="#fbbf24" />
            <defs>
              <linearGradient id="xmasLogoRing" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fde68a" stopOpacity="0.95" />
                <stop offset="55%" stopColor="#ffffff" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.85" />
              </linearGradient>
            </defs>
          </svg>
          <span
            className="font-display relative z-10 inline-block text-4xl sm:text-5xl font-black italic tracking-[0.12em] text-white"
            style={{
              textShadow: '0 2px 18px rgba(251,191,36,0.45), 0 4px 12px rgba(0,0,0,0.8)',
            }}
          >
            ORBIT
          </span>
          <div className="mt-0.5 text-center text-[11px] font-bold tracking-[0.35em] text-[#fde68a]/85">
            オービット
          </div>
        </div>
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
        {/* Draped fresh snowdrift along top blade edge */}
        <svg
          aria-hidden="true"
          viewBox="0 0 400 22"
          preserveAspectRatio="none"
          className="pointer-events-none absolute -top-[3px] inset-x-0 h-4 w-full z-20 drop-shadow-[0_3px_4px_rgba(2,132,199,0.28)]"
        >
          <path
            d="M0 0 L400 0 L400 8 C375 15, 355 6, 330 12 C305 18, 280 5, 250 11 C222 17, 195 7, 165 13 C135 19, 108 6, 78 12 C48 18, 22 7, 0 11 Z"
            fill="#f8fafc"
          />
          <path
            d="M0 8 C22 5, 48 15, 78 10 C108 5, 135 16, 165 11 C195 5, 222 14, 250 9 C280 4, 305 15, 330 10 C355 5, 375 12, 400 7"
            fill="none"
            stroke="#bae6fd"
            strokeWidth="1.5"
            opacity="0.7"
          />
        </svg>

        {/* Holly berries & crisp gold shimmer bevel */}
        {!compact && (
          <svg
            aria-hidden="true"
            viewBox="0 0 48 40"
            className="pointer-events-none absolute -left-2 -top-2.5 h-8 w-10 z-30 drop-shadow-md"
          >
            <path d="M16 18 C8 12, 4 6, 14 4 C19 10, 22 13, 22 18 Z" fill="#15803d" stroke="#86efac" strokeWidth="0.8" />
            <path d="M22 18 C28 11, 36 8, 38 16 C32 20, 26 21, 22 18 Z" fill="#166534" stroke="#86efac" strokeWidth="0.8" />
            <circle cx="19" cy="18" r="3.4" fill="#ef4444" />
            <circle cx="25" cy="19" r="3.1" fill="#dc2626" />
            <circle cx="22" cy="14" r="2.8" fill="#f87171" />
          </svg>
        )}

        {featured && (
          <svg
            aria-hidden="true"
            viewBox="0 0 36 36"
            className="pointer-events-none absolute right-2 -top-3 h-8 w-8 z-30 drop-shadow"
          >
            <path d="M18 16 L8 9 L12 20 Z" fill="#dc2626" />
            <path d="M18 16 L28 9 L24 20 Z" fill="#b91c1c" />
            <circle cx="18" cy="16" r="3.4" fill="#fef08a" />
            <path d="M18 22 L20 27 L25 28 L21 31 L22 36 L18 33 L14 36 L15 31 L11 28 L16 27 Z" fill="#fbbf24" />
          </svg>
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
        {/* Soft snow drift crown + glowing crimson ribbon bow & hanging gold star */}
        <svg viewBox="0 0 260 260" className="h-full w-full overflow-visible">
          {/* Upper snow arc */}
          <path
            d="M46 66 C 85 26, 155 24, 206 58 C 186 64, 165 50, 140 56 C 115 62, 92 48, 66 64 Z"
            fill="#f8fafc"
            opacity="0.92"
          />
          {/* Crimson velvet ribbon & holly bow top-right */}
          <g transform="translate(198 54)">
            <path d="M0 0 C-18 -20, -34 -6, -12 8 Z" fill="#dc2626" stroke="#7f1d1d" strokeWidth="1.2" />
            <path d="M0 0 C22 -16, 32 4, 8 10 Z" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="1.2" />
            <path d="M-4 4 L-16 32 L-6 26 Z" fill="#991b1b" />
            <path d="M4 4 L18 34 L6 27 Z" fill="#dc2626" />
            <circle cx="0" cy="2" r="5" fill="#ef4444" stroke="#fef08a" strokeWidth="1" />
            {/* Hanging star below bow */}
            <line x1="0" y1="8" x2="0" y2="38" stroke="#fde68a" strokeWidth="1.4" />
            <path d="M0 36 L4 44 L12 45 L6 50 L8 58 L0 54 L-8 58 L-6 50 L-12 45 L-4 44 Z" fill="#fbbf24" />
          </g>
        </svg>
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
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[6] overflow-hidden transition-opacity duration-300" style={{ opacity }}>
        {/* Left & Right Evergreen Pine Boughs with warm fairy stars */}
        <svg viewBox="0 0 260 220" className="absolute -left-2 -top-2 h-44 w-52 sm:h-56 sm:w-64">
          <path d="M0 0 L210 0 C160 26, 95 45, 0 140 Z" fill="#064e3b" opacity="0.65" />
          <path d="M0 0 L150 0 C105 24, 58 40, 0 92 Z" fill="#f8fafc" opacity="0.22" />
          <line x1="65" y1="18" x2="65" y2="56" stroke="#fde68a" strokeWidth="1.2" opacity="0.7" />
          <path d="M65 54 L68 62 L76 63 L70 68 L72 76 L65 72 L58 76 L60 68 L54 63 L62 62 Z" fill="#fde047" />
          <line x1="138" y1="8" x2="138" y2="38" stroke="#fde68a" strokeWidth="1" opacity="0.6" />
          <circle cx="138" cy="41" r="4" fill="#fbbf24" />
        </svg>
        <svg viewBox="0 0 260 220" className="absolute -right-2 -top-2 h-44 w-52 sm:h-56 sm:w-64">
          <path d="M260 0 L50 0 C100 26, 165 45, 260 140 Z" fill="#064e3b" opacity="0.65" />
          <line x1="188" y1="14" x2="188" y2="48" stroke="#fde68a" strokeWidth="1.2" opacity="0.7" />
          <path d="M188 46 L191 54 L199 55 L193 60 L195 68 L188 64 L181 68 L183 60 L177 55 L185 54 Z" fill="#fde047" />
        </svg>
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
