import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../audio/audioEngine';
import { XMAS_SPRITES } from '../data/christmasSprites';
import { AtmosphereGlRenderer } from '../shaders/atmosphereShader';
import { getResolvedChassisTheme, getResolvedSkinPack } from '../store/studioRegistryStore';
import { BgFxMode, SkinParticlePreset, ThemeId } from '../types/game';
import { useStudioLayout } from './LiveLayoutWrapper';
import { ThemeBladeAccents, ThemeCornerFraming } from './ThemeChrome';

function hexToRgb01(hex: string, fallback: [number, number, number]): [number, number, number] {
  const clean = hex.replace('#', '').trim();
  const full =
    clean.length === 3
      ? `${clean[0]}${clean[0]}${clean[1]}${clean[1]}${clean[2]}${clean[2]}`
      : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return fallback;
  return [
    parseInt(full.slice(0, 2), 16) / 255,
    parseInt(full.slice(2, 4), 16) / 255,
    parseInt(full.slice(4, 6), 16) / 255,
  ];
}

interface SkinAtmosphereProps {
  themeId: ThemeId;
  bgFxMode: BgFxMode;
  dimDuringPlay?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  vRot: number;
  alpha: number;
  phase: number;
  kind: 'primary' | 'secondary' | 'gold_spark';
}

function initParticles(preset: SkinParticlePreset, w: number, h: number): Particle[] {
  const count = preset === 'sakura' ? 44 : preset === 'snow' ? 88 : preset === 'krampus_ash' ? 66 : 0;
  const list: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const isSecondary = i % 3 === 0;
    const isGold = i % 7 === 0;
    if (preset === 'sakura') {
      list.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: 18 + Math.random() * 26,
        vy: 22 + Math.random() * 34,
        size: isSecondary ? 8.5 + Math.random() * 5.5 : 5 + Math.random() * 4.5,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 2.4,
        alpha: isSecondary ? 0.56 : 0.82,
        phase: Math.random() * Math.PI * 2,
        kind: isSecondary ? 'secondary' : 'primary',
      });
    } else if (preset === 'snow') {
      list.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 16,
        vy: isGold
          ? 14 + Math.random() * 14
          : isSecondary
          ? 18 + Math.random() * 20
          : 28 + Math.random() * 34,
        size: isGold
          ? 3.0 + Math.random() * 2.5
          : isSecondary
          ? 4.6 + Math.random() * 4.4
          : 1.5 + Math.random() * 2.5,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.9,
        alpha: isGold ? 0.92 : isSecondary ? 0.34 : 0.84,
        phase: Math.random() * Math.PI * 2,
        kind: isGold ? 'gold_spark' : isSecondary ? 'secondary' : 'primary',
      });
    } else if (preset === 'krampus_ash') {
      const isEmber = i % 2 === 0;
      list.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 22,
        vy: isEmber ? -(38 + Math.random() * 55) : 18 + Math.random() * 22,
        size: isEmber ? 1.8 + Math.random() * 2.8 : 2.0 + Math.random() * 3.0,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 1.8,
        alpha: isEmber ? 0.88 : 0.45,
        phase: Math.random() * Math.PI * 2,
        kind: isEmber ? 'primary' : 'secondary',
      });
    }
  }
  return list;
}

/**
 * Far-Background & Midground Scenic Props dedicated to Cozy Christmas 2026
 * (Glowing Moon + Santa Sleigh Silhouette + Perimeter Winter Lanterns & Snowdrifts).
 */
const CozyChristmasScenicLayers: React.FC<{ dimDuringPlay: boolean }> = ({ dimDuringPlay }) => {
  return (
    <>
      {/* FAR SKY LAYER: Full Harvest/Winter Moon + Santa's Sleigh Silhouette crossing the Aurora */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[2] overflow-hidden transition-opacity duration-300"
        style={{ opacity: dimDuringPlay ? 0.32 : 0.88 }}
      >
        <svg
          viewBox="0 0 1600 900"
          preserveAspectRatio="xMidYMid slice"
          className="h-full w-full"
        >
          <defs>
            <radialGradient id="xmasMoonGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fffbeb" stopOpacity="0.95" />
              <stop offset="48%" stopColor="#fde68a" stopOpacity="0.82" />
              <stop offset="72%" stopColor="#fbcfe8" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#fbcfe8" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="sleighTrail" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fde68a" stopOpacity="0" />
              <stop offset="65%" stopColor="#fde68a" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          {/* Glowing Lunar Halo */}
          <circle cx="940" cy="235" r="145" fill="url(#xmasMoonGlow)" />
          <circle cx="940" cy="235" r="64" fill="#fff7ed" opacity="0.94" />
          {/* Stardust trail across the moon */}
          <path
            d="M660 285 Q 815 268, 935 225"
            fill="none"
            stroke="url(#sleighTrail)"
            strokeWidth="2.5"
            strokeDasharray="6 7"
          />
          {/* Crisp Silhouette: Santa's Sleigh + Reindeer Team against the moon */}
          <g transform="translate(888 185) rotate(-14) scale(0.78)" fill="#170b18" opacity="0.92">
            {/* Sleigh */}
            <path d="M0 32 L32 32 L40 20 L34 20 L29 27 L10 27 L4 16 L-4 22 Z" />
            <path d="M-2 36 Q 18 40, 38 35" stroke="#170b18" strokeWidth="2.5" fill="none" />
            <circle cx="15" cy="18" r="5" />
            {/* Reins */}
            <path d="M36 24 L118 14" stroke="#170b18" strokeWidth="1.2" fill="none" />
            {/* Reindeer 1 */}
            <path d="M58 26 L62 18 L74 18 L78 11 L82 14 L77 21 L76 30 L72 30 L72 24 L64 24 L62 30 L58 30 Z" />
            {/* Reindeer 2 */}
            <path d="M94 21 L98 13 L110 13 L115 6 L119 9 L114 16 L113 25 L109 25 L109 19 L101 19 L99 25 L95 25 Z" />
          </g>
        </svg>
      </div>

      {/* MIDGROUND DIORAMA PROPS: Bottom Snowdrifts + Glowing Brass Lanterns + Snowy Pines on Wide Stage */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[6] overflow-hidden transition-opacity duration-300"
        style={{ opacity: dimDuringPlay ? 0.36 : 0.94 }}
      >
        {/* Left & Right Snowy Ground Banks anchoring the viewport */}
        <img
          src={XMAS_SPRITES.snowdriftBank}
          alt=""
          className="absolute -bottom-2 -left-10 w-[44vw] max-w-[540px] object-contain opacity-85 drop-shadow-[0_-4px_16px_rgba(186,230,253,0.22)]"
        />
        <img
          src={XMAS_SPRITES.snowdriftBank}
          alt=""
          className="absolute -bottom-2 -right-10 w-[44vw] max-w-[540px] -scale-x-100 object-contain opacity-85 drop-shadow-[0_-4px_16px_rgba(186,230,253,0.22)]"
        />

        {/* During gameplay, flank outer edges gently with glowing Christmas lanterns & snow-capped pine silhouettes */}
        {dimDuringPlay && (
          <>
            <img
              src={XMAS_SPRITES.treeOrnate}
              alt=""
              className="hidden lg:block absolute -left-6 bottom-6 h-52 w-auto object-contain opacity-55 drop-shadow-[0_0_24px_rgba(251,191,36,0.3)]"
            />
            <img
              src={XMAS_SPRITES.lantern}
              alt=""
              className="hidden md:block absolute left-4 bottom-24 h-20 w-auto object-contain opacity-75 drop-shadow-[0_0_20px_rgba(251,191,36,0.75)]"
            />
            <img
              src={XMAS_SPRITES.treeOrnate}
              alt=""
              className="hidden lg:block absolute -right-6 bottom-6 h-52 w-auto -scale-x-100 object-contain opacity-55 drop-shadow-[0_0_24px_rgba(251,191,36,0.3)]"
            />
            <img
              src={XMAS_SPRITES.lantern}
              alt=""
              className="hidden md:block absolute right-4 bottom-24 h-20 w-auto object-contain opacity-75 drop-shadow-[0_0_20px_rgba(251,191,36,0.75)]"
            />
          </>
        )}
      </div>
    </>
  );
};

export const SkinAtmosphere: React.FC<SkinAtmosphereProps> = React.memo(
  ({ themeId, bgFxMode, dimDuringPlay = false }) => {
    const { themesMap } = useStudioLayout();
    const skin = getResolvedSkinPack(themeId, themesMap);
    const activeTheme = getResolvedChassisTheme(themeId, themesMap);
    const shaderCfg = themesMap[themeId]?.shaderConfig;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const glCanvasRef = useRef<HTMLCanvasElement>(null);
    const glRendererRef = useRef<AtmosphereGlRenderer | null>(null);

    const shaderMode: 0 | 1 | 2 | 3 =
      themeId === 'neon_sakura'
        ? 1
        : themeId === 'cozy_christmas_2026'
        ? 2
        : themeId === 'krampusnacht_2026'
        ? 3
        : 0;

    const activeShaderOpacity =
      shaderCfg?.atmosphereOpacity ?? (skin.isFullTransformation ? 0.84 : 0.42);
    const primaryHex = activeTheme.primary;
    const secondaryHex = activeTheme.secondary;

    useEffect(() => {
      const glCanvas = glCanvasRef.current;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced || bgFxMode === 'minimal') {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        glRendererRef.current?.dispose();
        glRendererRef.current = null;
        return;
      }

      if (glCanvas && !glRendererRef.current) {
        const renderer = new AtmosphereGlRenderer();
        if (renderer.init(glCanvas)) {
          glRendererRef.current = renderer;
        }
      }

      const ctx = canvas.getContext('2d');
      let width = window.innerWidth;
      let height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      const resize = () => {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (glCanvas) {
          glCanvas.width = Math.max(320, Math.floor(width * 0.6));
          glCanvas.height = Math.max(180, Math.floor(height * 0.6));
        }
      };
      resize();
      window.addEventListener('resize', resize);

      const primaryRgb = hexToRgb01(primaryHex, [1, 0.23, 0.51]);
      const secondaryRgb = hexToRgb01(secondaryHex, [0.13, 0.83, 0.93]);
      const particles = initParticles(skin.particlePreset, width, height);
      let lastTime = performance.now();
      let rafId = 0;

      const tick = (now: number) => {
        const dt = Math.min(0.05, (now - lastTime) / 1000);
        lastTime = now;
        const t = now * 0.001;

        const bands = audioEngine.getAudioBands();
        const masterOpacity = dimDuringPlay ? 0.52 : bgFxMode === 'clean' ? 0.58 : 0.96;

        if (glRendererRef.current && glCanvas) {
          glRendererRef.current.render(
            glCanvas.width,
            glCanvas.height,
            t,
            shaderMode,
            activeShaderOpacity * (dimDuringPlay ? 0.58 : bgFxMode === 'clean' ? 0.48 : 1),
            bands.bass,
            bands.mid,
            primaryRgb,
            secondaryRgb,
          );
        }

        if (ctx && skin.particlePreset !== 'none') {
          ctx.clearRect(0, 0, width, height);
          for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            const sway = Math.sin(t * 1.4 + p.phase) * (skin.particlePreset === 'snow' ? 16 : 20);
            p.x += (p.vx + sway) * dt;
            p.y += p.vy * dt;
            p.rot += p.vRot * dt;

            if (p.x > width + 24) p.x = -20;
            if (p.x < -24) p.x = width + 20;
            if (p.vy > 0 && p.y > height + 24) {
              p.y = -20;
              p.x = Math.random() * width;
            } else if (p.vy < 0 && p.y < -24) {
              p.y = height + 20;
              p.x = Math.random() * width;
            }

            ctx.save();
            ctx.globalAlpha = p.alpha * masterOpacity;

            if (skin.particlePreset === 'sakura') {
              ctx.translate(p.x, p.y);
              ctx.rotate(p.rot);
              const petalW = p.size;
              const petalH = p.size * 0.62;
              const grad = ctx.createLinearGradient(-petalW, 0, petalW, 0);
              grad.addColorStop(0, p.kind === 'secondary' ? '#fff1f2' : '#f472b6');
              grad.addColorStop(1, '#fbcfe8');
              ctx.fillStyle = grad;
              ctx.beginPath();
              ctx.moveTo(-petalW, 0);
              ctx.quadraticCurveTo(0, -petalH, petalW, 0);
              ctx.quadraticCurveTo(0, petalH, -petalW, 0);
              ctx.fill();
            } else if (skin.particlePreset === 'snow') {
              if (p.kind === 'gold_spark') {
                // Warm golden fairy-light / 4-point star sparkle
                const pulse = 0.7 + 0.3 * Math.sin(t * 3.8 + p.phase);
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);
                const r = p.size * 1.45 * pulse;
                const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 2.2);
                g.addColorStop(0, '#fffbeb');
                g.addColorStop(0.4, 'rgba(253, 224, 71, 0.85)');
                g.addColorStop(1, 'rgba(251, 191, 36, 0)');
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(0, 0, r * 2.2, 0, Math.PI * 2);
                ctx.fill();
              } else if (p.kind === 'secondary') {
                const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.2);
                g.addColorStop(0, 'rgba(254, 243, 199, 0.88)');
                g.addColorStop(1, 'rgba(224, 242, 254, 0)');
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 2.2, 0, Math.PI * 2);
                ctx.fill();
              } else {
                ctx.fillStyle = '#f8fafc';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
              }
            } else if (skin.particlePreset === 'krampus_ash') {
              if (p.kind === 'primary') {
                const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.8);
                g.addColorStop(0, '#fef08a');
                g.addColorStop(0.45, '#ef4444');
                g.addColorStop(1, 'rgba(220, 38, 38, 0)');
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 2.8, 0, Math.PI * 2);
                ctx.fill();
              } else {
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);
                ctx.fillStyle = 'rgba(203, 213, 225, 0.6)';
                ctx.fillRect(-p.size * 0.6, -p.size * 0.35, p.size * 1.2, p.size * 0.7);
              }
            }

            ctx.restore();
          }
        } else if (ctx) {
          ctx.clearRect(0, 0, width, height);
        }

        rafId = window.requestAnimationFrame(tick);
      };

      rafId = window.requestAnimationFrame(tick);
      return () => {
        window.cancelAnimationFrame(rafId);
        window.removeEventListener('resize', resize);
      };
    }, [bgFxMode, dimDuringPlay, skin.particlePreset, shaderMode, activeShaderOpacity, primaryHex, secondaryHex]);

    useEffect(() => {
      return () => {
        glRendererRef.current?.dispose();
        glRendererRef.current = null;
      };
    }, []);

    return (
      <>
        {themeId === 'cozy_christmas_2026' && (
          <CozyChristmasScenicLayers dimDuringPlay={dimDuringPlay} />
        )}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[7] overflow-hidden"
        >
          {/* WebGL2 GLSL Atmospheric Audio-Reactive Layer */}
          {bgFxMode !== 'minimal' && (
            <canvas
              ref={glCanvasRef}
              className="absolute inset-0 h-full w-full"
              style={{ mixBlendMode: 'screen' }}
            />
          )}

          {/* Painted Foreground Corner Framing & Swinging Ornaments */}
          <ThemeCornerFraming themeId={themeId} dimDuringPlay={dimDuringPlay} />

          {/* Atmospheric 60fps Particle Canvas */}
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
        </div>
      </>
    );
  },
);

export const SkinBladeTrim: React.FC<{
  themeId: ThemeId;
  featured?: boolean;
  compact?: boolean;
}> = ({ themeId, featured = false, compact = false }) => {
  return <ThemeBladeAccents themeId={themeId} featured={featured} compact={compact} />;
};
