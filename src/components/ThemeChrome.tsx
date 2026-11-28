import React from 'react';
import { XMAS_SPRITES } from '../data/christmasSprites';
import { getResolvedSkinPack } from '../store/studioRegistryStore';
import { ThemeId } from '../types/game';
import { useStudioLayout } from './LiveLayoutWrapper';

/**
 * Bespoke ORBIT crest logo dynamically styled per Transformation Theme,
 * faithful to the concept art direction.
 */
export const ThemeTitleLogo: React.FC<{
  themeId: ThemeId;
  accentColor: string;
}> = ({ themeId, accentColor }) => {
  if (themeId === 'cozy_christmas_2026') {
    return (
      <div className="relative flex items-center select-none">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-x-4 -inset-y-2 rounded-full opacity-45 blur-xl"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(251,191,36,0.45) 0%, rgba(225,29,72,0.22) 55%, transparent 78%)',
          }}
        />
        <img
          src={XMAS_SPRITES.logoSanta}
          alt="ORBIT Cozy Christmas 2026"
          className="relative z-10 h-14 sm:h-[68px] w-auto object-contain drop-shadow-[0_4px_18px_rgba(251,191,36,0.52)]"
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
            <path
              d="M32 24 L35 39 L50 42 L35 45 L32 60 L29 45 L14 42 L29 39 Z"
              fill="#ef4444"
              opacity="0.9"
            />
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
  accentVariant?: 'holly_star' | 'bow_star' | 'minimal';
}> = ({ themeId, featured = false, compact = false, accentVariant = 'minimal' }) => {
  const { themesMap } = useStudioLayout();
  const skin = getResolvedSkinPack(themeId, themesMap);
  if (skin.trimStyle === 'none') return null;

  if (skin.trimStyle === 'snow_cap') {
    const showCornerHolly = !compact && (featured || accentVariant === 'holly_star');
    const showRightBowAndStar = featured || accentVariant === 'bow_star';

    return (
      <>
        {/* Sculpted Softly-Shaded Pillowy Snow Cap along upper rim */}
        <svg
          aria-hidden="true"
          viewBox="0 0 420 30"
          preserveAspectRatio="none"
          className="pointer-events-none absolute -top-[4px] inset-x-0 h-[16px] sm:h-[19px] w-full z-20 drop-shadow-[0_3px_5px_rgba(14,116,144,0.34)]"
        >
          <defs>
            <linearGradient id="xmasSnowBody" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="56%" stopColor="#eef6ff" />
              <stop offset="100%" stopColor="#bae6fd" />
            </linearGradient>
          </defs>
          <path
            d="M0 0 L420 0 L420 9 C404 16, 386 6, 362 12 C340 18, 314 5, 286 11 C260 17, 232 4, 204 10 C176 16, 148 5, 118 12 C90 18, 60 6, 34 14 C18 18, 8 10, 0 11 Z"
            fill="url(#xmasSnowBody)"
          />
          <path
            d="M0 11 C8 10, 18 18, 34 14 C60 6, 90 18, 118 12 C148 5, 176 16, 204 10 C232 4, 260 17, 286 11 C314 5, 340 18, 362 12 C386 6, 404 16, 420 9"
            fill="none"
            stroke="#7dd3fc"
            strokeWidth="1.2"
            opacity="0.72"
          />
          <path
            d="M24 4 Q 90 2, 165 4 M 235 4 Q 315 2, 392 4"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity="0.95"
          />
        </svg>

        {/* Warm Champagne-Gold Inner Bevel Rim + Corner Sparkle Pinpoints */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-[1px] z-10 border border-[#fde68a]/40 shadow-[inset_0_0_16px_rgba(251,191,36,0.12)]"
        />

        {!compact && (
          <img
            aria-hidden="true"
            src={XMAS_SPRITES.snowflakeIce}
            alt=""
            className="pointer-events-none absolute right-11 top-1/2 -translate-y-1/2 h-9 w-9 object-contain opacity-[0.22] z-10 mix-blend-screen"
          />
        )}

        {/* Painted Holly Sprig Corner Cluster */}
        {showCornerHolly && (
          <img
            aria-hidden="true"
            src={XMAS_SPRITES.hollySprig}
            alt=""
            className={`pointer-events-none absolute z-30 h-8 w-8 object-contain drop-shadow-[0_3px_6px_rgba(0,0,0,0.7)] ${
              featured ? '-left-3 -top-3.5' : '-right-2.5 -top-3'
            }`}
          />
        )}

        {/* Featured / Selected Crimson Velvet Bow + Glowing Hanging Gold Star */}
        {showRightBowAndStar && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-2.5 -top-3.5 z-30 flex flex-col items-center"
          >
            <img
              src={XMAS_SPRITES.bowCrimson}
              alt=""
              className="h-9 w-9 object-contain drop-shadow-[0_4px_10px_rgba(225,29,72,0.65)]"
            />
            <svg
              viewBox="0 0 24 28"
              className="-mt-2 h-6 w-5 overflow-visible drop-shadow-[0_0_9px_rgba(253,224,71,0.95)]"
            >
              <line x1="12" y1="0" x2="12" y2="10" stroke="#fde68a" strokeWidth="1.5" />
              <path
                d="M12 8 L14.5 14 L21 14.8 L16 18.8 L17.4 25 L12 21.8 L6.6 25 L8 18.8 L3 14.8 L9.5 14 Z"
                fill="#fde047"
                stroke="#fffbeb"
                strokeWidth="0.7"
              />
            </svg>
          </div>
        )}

        {accentVariant === 'holly_star' && !featured && (
          <svg
            aria-hidden="true"
            viewBox="0 0 24 28"
            className="pointer-events-none absolute right-0.5 -bottom-4 z-30 h-5 w-4 overflow-visible drop-shadow-[0_0_8px_rgba(253,224,71,0.9)]"
          >
            <line x1="12" y1="0" x2="12" y2="9" stroke="#fde68a" strokeWidth="1.3" />
            <path
              d="M12 7 L14.3 12.8 L20.5 13.5 L15.8 17.5 L17 23.5 L12 20.4 L7 23.5 L8.2 17.5 L3.5 13.5 L9.7 12.8 Z"
              fill="#fde047"
              stroke="#fffbeb"
              strokeWidth="0.6"
            />
          </svg>
        )}
      </>
    );
  }

  if (skin.trimStyle === 'krampus_iron') {
    return (
      <>
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
 * Spinning Disc / Platter themed bezel & ornaments matching Cozy_Christmas_Orbit_Game_Menu_ba586305.png.
 */
export const ThemeDiscBezel: React.FC<{ themeId: ThemeId }> = ({ themeId }) => {
  if (themeId === 'cozy_christmas_2026') {
    return (
      <div aria-hidden="true" className="pointer-events-none absolute -inset-6 z-20">
        {/* Soft snow drift crown arcing neatly across top platter + hanging glowing 5-point gold star */}
        <svg viewBox="0 0 260 260" className="h-full w-full overflow-visible">
          <defs>
            <linearGradient id="xmasDiscSnow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="65%" stopColor="#f1f5f9" />
              <stop offset="100%" stopColor="#bae6fd" />
            </linearGradient>
          </defs>
          <path
            d="M42 70 C 78 22, 168 18, 214 62 C 194 67, 174 47, 146 56 C 118 65, 92 46, 62 67 Z"
            fill="url(#xmasDiscSnow)"
            opacity="0.97"
          />
          <path
            d="M58 58 Q 126 24, 196 54"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.9"
          />
          {/* Fine golden hanging string + luminous 5-point star dangling beneath right crimson bow */}
          <line x1="205" y1="74" x2="205" y2="112" stroke="#fde68a" strokeWidth="1.6" opacity="0.9" />
          <circle cx="205" cy="126" r="14" fill="rgba(253, 224, 71, 0.28)" />
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

        {/* Crisp Golden Sparkle Star Glints around the outer bezel */}
        <img
          src={XMAS_SPRITES.sparkleGold}
          alt=""
          className="absolute -left-3 top-[38%] h-7 w-7 object-contain opacity-95 drop-shadow-[0_0_10px_rgba(253,224,71,0.9)]"
        />
        <img
          src={XMAS_SPRITES.sparkleGold}
          alt=""
          className="absolute right-4 bottom-6 h-6 w-6 object-contain opacity-90 drop-shadow-[0_0_8px_rgba(253,224,71,0.85)]"
        />
      </div>
    );
  }

  if (themeId === 'krampusnacht_2026') {
    return (
      <div aria-hidden="true" className="pointer-events-none absolute -inset-7 z-20">
        <svg viewBox="0 0 280 280" className="h-full w-full overflow-visible">
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
          <circle
            cx="130"
            cy="130"
            r="122"
            fill="none"
            stroke="url(#sakuraDiscHalo)"
            strokeWidth="2.4"
            opacity="0.9"
          />
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
 * Full-viewport subtle architectural arch framing + pine/bell corner boughs + icicles & swaying gold stars.
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
        style={{ opacity: dimDuringPlay ? 0.52 : 0.96 }}
      >
        {/* Top Timber & Champagne-Gold Architectural Arch + Hanging Gold Stars */}
        <svg viewBox="0 0 1600 200" preserveAspectRatio="none" className="absolute inset-x-0 top-0 h-32 sm:h-40 w-full">
          <defs>
            <linearGradient id="xmasArchGold" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#fde68a" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#fffbeb" stopOpacity="0.82" />
              <stop offset="100%" stopColor="#fde68a" stopOpacity="0.6" />
            </linearGradient>
          </defs>
          {/* Twin ornate upper canopy beams matching reference framing */}
          <path
            d="M0 105 Q 800 -36, 1600 105"
            fill="none"
            stroke="#160a14"
            strokeWidth="12"
            opacity="0.72"
          />
          <path
            d="M0 105 Q 800 -36, 1600 105"
            fill="none"
            stroke="url(#xmasArchGold)"
            strokeWidth="2.4"
          />
          <path
            d="M0 68 Q 800 -18, 1600 68"
            fill="none"
            stroke="url(#xmasArchGold)"
            strokeWidth="1.6"
            opacity="0.75"
          />

          {/* Hanging golden 5-point stars along upper arch */}
          {[
            { x: 118, len: 74, r: 10 },
            { x: 256, len: 52, r: 7.5 },
            { x: 1344, len: 52, r: 7.5 },
            { x: 1482, len: 74, r: 10 },
          ].map((st, idx) => (
            <g key={idx}>
              <line x1={st.x} y1={0} x2={st.x} y2={st.len} stroke="#fde68a" strokeWidth="1.4" opacity="0.82" />
              <circle cx={st.x} cy={st.len} r={st.r * 1.65} fill="rgba(253,224,71,0.22)" />
              <path
                d={`M${st.x} ${st.len - st.r} L${st.x + st.r * 0.28} ${st.len - st.r * 0.28} L${st.x + st.r} ${st.len} L${st.x + st.r * 0.28} ${st.len + st.r * 0.28} L${st.x} ${st.len + st.r} L${st.x - st.r * 0.28} ${st.len + st.r * 0.28} L${st.x - st.r} ${st.len} L${st.x - st.r * 0.28} ${st.len - st.r * 0.28} Z`}
                fill="#fffbeb"
              />
            </g>
          ))}
        </svg>

        {/* Clean Snowy Icicles tucked beneath top corner arch beams (menus only) */}
        {!dimDuringPlay && (
          <>
            <img
              src={XMAS_SPRITES.icicles}
              alt=""
              className="hidden md:block absolute left-[12%] top-0 h-14 w-auto object-contain opacity-90 drop-shadow-[0_4px_12px_rgba(14,165,233,0.4)]"
            />
            <img
              src={XMAS_SPRITES.icicles}
              alt=""
              className="hidden md:block absolute right-[12%] top-0 h-14 w-auto -scale-x-100 object-contain opacity-90 drop-shadow-[0_4px_12px_rgba(14,165,233,0.4)]"
            />
          </>
        )}

        {/* Left & Right Evergreen Pine-and-Brass-Bell Boughs */}
        <img
          src={XMAS_SPRITES.boughBell}
          alt=""
          className="absolute -left-6 -top-5 h-32 sm:h-44 w-auto object-contain -rotate-[12deg] drop-shadow-[0_6px_18px_rgba(0,0,0,0.75)]"
        />
        <img
          src={XMAS_SPRITES.boughBell}
          alt=""
          className="absolute -right-6 -top-5 h-32 sm:h-44 w-auto object-contain -scale-x-100 rotate-[12deg] drop-shadow-[0_6px_18px_rgba(0,0,0,0.75)]"
        />
      </div>
    );
  }

  if (themeId === 'krampusnacht_2026') {
    return (
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[6] overflow-hidden transition-opacity duration-300" style={{ opacity }}>
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
