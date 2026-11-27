import {
  OverdriveAnimationType,
  OverdriveCustomLayer,
  OverdriveLayerAnchor,
} from '../types/game';

export interface OverdriveAnimationMeta {
  id: OverdriveAnimationType;
  label: string;
  desc: string;
  defaultBlend: 'screen' | 'lighter' | 'normal';
}

export const OVERDRIVE_ANIMATION_CATALOG: OverdriveAnimationMeta[] = [
  { id: 'flame_rise', label: 'Flame Rise', desc: 'Vertical billowing heat & upward drift', defaultBlend: 'screen' },
  { id: 'pulse_shockwave', label: 'Pulse Shockwave', desc: 'Beat-synced outward rhythmic aura rings', defaultBlend: 'lighter' },
  { id: 'parallax_drift', label: 'Parallax Drift', desc: 'Seamless tiled horizontal aura scroll', defaultBlend: 'screen' },
  { id: 'helix_orbit', label: 'Helix Orbit', desc: 'Dual figure-8 counter-weaving twin sprites', defaultBlend: 'screen' },
  { id: 'chromatic_split', label: 'Chromatic Split', desc: 'Bass-reactive RGB glitch separation jitter', defaultBlend: 'lighter' },
  { id: 'lightning_strobe', label: 'Lightning Strobe', desc: 'Electric crackle flicker & snap flash', defaultBlend: 'lighter' },
  { id: 'petal_swirl', label: 'Petal Swirl', desc: 'Floating rotational drift & gentle flutter', defaultBlend: 'screen' },
  { id: 'thermal_heatwave', label: 'Thermal Heatwave', desc: 'Multi-slice mirage wave distortion', defaultBlend: 'screen' },
  { id: 'slash_sweep', label: 'Slash Sweep', desc: 'Diagonal katana laser streaks across border', defaultBlend: 'lighter' },
  { id: 'bounce_pop', label: 'Bounce Pop', desc: 'Elastic bass-driven squash & stretch', defaultBlend: 'normal' },
  { id: 'flipbook_sheet', label: 'Flipbook Sheet', desc: 'Grid sprite-sheet frame animation (cols×rows)', defaultBlend: 'screen' },
  { id: 'spark_emitter', label: 'Spark Emitter', desc: 'Spawns & rises glowing sprite embers', defaultBlend: 'lighter' },
];

export const OVERDRIVE_ANCHOR_CATALOG: { id: OverdriveLayerAnchor; label: string }[] = [
  { id: 'bottom_border', label: 'Bottom Screen Border' },
  { id: 'side_borders', label: 'Left & Right Side Borders' },
  { id: 'left_border', label: 'Left Border Only' },
  { id: 'right_border', label: 'Right Border Only' },
  { id: 'screen_frame', label: 'Full Screen Frame' },
  { id: 'center_aura', label: 'Behind Center Turntable' },
];

const imageCache = new Map<string, HTMLImageElement>();

export function getCachedOverdriveImage(url: string): HTMLImageElement | null {
  if (!url) return null;
  let img = imageCache.get(url);
  if (!img) {
    img = new Image();
    if (url.startsWith('http://') || url.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }
    img.src = url;
    imageCache.set(url, img);
  }
  if (!img.complete || img.naturalWidth === 0) return null;
  return img;
}

interface AnchorRect {
  x: number;
  y: number;
  w: number;
  h: number;
  mirrorX?: boolean;
}

function getAnchorTargets(
  anchor: OverdriveLayerAnchor,
  width: number,
  height: number,
  cx: number,
  cy: number,
  bezelOuterR: number,
  imgRatio: number,
  scale: number,
): AnchorRect[] {
  const baseH = Math.max(140, height * 0.44 * scale);
  switch (anchor) {
    case 'bottom_border': {
      const w = Math.max(width * 0.65, baseH * imgRatio);
      return [{ x: cx, y: height - baseH * 0.36, w, h: baseH }];
    }
    case 'left_border': {
      const w = Math.max(180, width * 0.26 * scale);
      const h = Math.max(height * 0.72, w / Math.max(0.25, imgRatio));
      return [{ x: w * 0.34, y: height * 0.56, w, h }];
    }
    case 'right_border': {
      const w = Math.max(180, width * 0.26 * scale);
      const h = Math.max(height * 0.72, w / Math.max(0.25, imgRatio));
      return [{ x: width - w * 0.34, y: height * 0.56, w, h, mirrorX: true }];
    }
    case 'side_borders': {
      const w = Math.max(170, width * 0.24 * scale);
      const h = Math.max(height * 0.72, w / Math.max(0.25, imgRatio));
      return [
        { x: w * 0.34, y: height * 0.58, w, h },
        { x: width - w * 0.34, y: height * 0.58, w, h, mirrorX: true },
      ];
    }
    case 'screen_frame': {
      return [{ x: cx, y: cy, w: width * scale, h: height * scale }];
    }
    case 'center_aura': {
      const side = bezelOuterR * 2.75 * scale;
      return [{ x: cx, y: cy, w: side * Math.max(0.7, imgRatio), h: side }];
    }
  }
}

export function renderCustomOverdriveLayers(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cx: number,
  cy: number,
  bezelOuterR: number,
  animTimeSec: number,
  chargeNorm: number,
  isActive: boolean,
  beatPulse: number,
  bassEnergy: number,
  layers: OverdriveCustomLayer[],
): void {
  if (!layers || layers.length === 0) return;
  const effectiveIntensity = isActive ? 1.0 : Math.max(0, Math.min(1, chargeNorm));
  if (effectiveIntensity <= 0.01) return;

  for (const layer of layers) {
    if (!layer.enabled || !layer.imageUrl) continue;
    const img = getCachedOverdriveImage(layer.imageUrl);
    if (!img) continue;

    const minOp = Math.max(0, Math.min(1, layer.buildupMinOpacity ?? 0.12));
    const buildupFactor = isActive
      ? 1.0
      : minOp + (1 - minOp) * Math.pow(effectiveIntensity, 1.15);
    const eruptMul = isActive ? Math.max(0.6, layer.eruptBoost ?? 1.25) : 1.0;
    const baseAlpha = Math.max(0, Math.min(1, (layer.opacity ?? 0.85) * buildupFactor * eruptMul));
    if (baseAlpha <= 0.01) continue;

    const spd = Math.max(0.1, layer.speed || 1.0);
    const t = animTimeSec * spd;
    const imgRatio = img.naturalWidth / Math.max(1, img.naturalHeight);
    const targets = getAnchorTargets(
      layer.anchor,
      width,
      height,
      cx,
      cy,
      bezelOuterR,
      imgRatio,
      Math.max(0.25, layer.scale || 1.0),
    );

    ctx.save();
    ctx.globalCompositeOperation =
      layer.blendMode === 'normal' ? 'source-over' : layer.blendMode || 'screen';

    for (let ti = 0; ti < targets.length; ti++) {
      const box = targets[ti];
      const flipDir = box.mirrorX ? -1 : 1;

      switch (layer.animation) {
        case 'flame_rise': {
          const driftY = -((t * 36) % (box.h * 0.22));
          const stretchY = 1 + Math.sin(t * 7.2 + ti) * 0.08 + bassEnergy * 0.16;
          const swayX = Math.sin(t * 4.1 + ti * 1.4) * 10;
          ctx.save();
          ctx.globalAlpha = baseAlpha * (0.86 + Math.sin(t * 11) * 0.12);
          ctx.translate(box.x + swayX, box.y + driftY * 0.35);
          ctx.scale(flipDir * (1 + Math.cos(t * 5.3) * 0.03), stretchY);
          ctx.drawImage(img, -box.w / 2, -box.h / 2, box.w, box.h);
          ctx.restore();
          break;
        }

        case 'pulse_shockwave': {
          for (let ring = 0; ring < 2; ring++) {
            const phase = (t * 0.85 + ring * 0.5) % 1;
            const ringScale = 0.85 + phase * (0.42 + beatPulse * 0.22);
            ctx.save();
            ctx.globalAlpha = baseAlpha * (1 - phase) * 0.95;
            ctx.translate(box.x, box.y);
            ctx.scale(flipDir * ringScale, ringScale);
            ctx.drawImage(img, -box.w / 2, -box.h / 2, box.w, box.h);
            ctx.restore();
          }
          break;
        }

        case 'parallax_drift': {
          const offset = (t * 95) % box.w;
          ctx.save();
          ctx.globalAlpha = baseAlpha;
          for (let rep = -1; rep <= 1; rep++) {
            ctx.save();
            ctx.translate(box.x + offset + rep * box.w * 0.88, box.y);
            ctx.scale(flipDir, 1);
            ctx.drawImage(img, -box.w / 2, -box.h / 2, box.w, box.h);
            ctx.restore();
          }
          ctx.restore();
          break;
        }

        case 'helix_orbit': {
          for (let h = 0; h < 2; h++) {
            const ang = t * 2.4 + h * Math.PI + ti;
            const ox = Math.cos(ang) * Math.min(80, box.w * 0.16);
            const oy = Math.sin(ang * 2) * Math.min(48, box.h * 0.12);
            ctx.save();
            ctx.globalAlpha = baseAlpha * (h === 0 ? 0.9 : 0.68);
            ctx.translate(box.x + ox, box.y + oy);
            ctx.rotate(Math.sin(ang) * 0.08);
            ctx.scale(flipDir, 1);
            ctx.drawImage(img, -box.w / 2, -box.h / 2, box.w, box.h);
            ctx.restore();
          }
          break;
        }

        case 'chromatic_split': {
          const jitter = (1.5 + bassEnergy * 18 + beatPulse * 10) * Math.sin(t * 28);
          ctx.save();
          ctx.globalAlpha = baseAlpha * 0.55;
          ctx.translate(box.x - jitter, box.y - jitter * 0.25);
          ctx.scale(flipDir, 1);
          ctx.drawImage(img, -box.w / 2, -box.h / 2, box.w, box.h);
          ctx.restore();

          ctx.save();
          ctx.globalAlpha = baseAlpha * 0.85;
          ctx.translate(box.x + jitter, box.y + jitter * 0.25);
          ctx.scale(flipDir, 1);
          ctx.drawImage(img, -box.w / 2, -box.h / 2, box.w, box.h);
          ctx.restore();
          break;
        }

        case 'lightning_strobe': {
          const flash = Math.sin(t * 23) * Math.cos(t * 37) > 0.2 ? 1.0 : 0.28;
          const snapX = Math.sin(t * 47) * 8;
          const snapY = Math.cos(t * 53) * 6;
          ctx.save();
          ctx.globalAlpha = baseAlpha * flash;
          ctx.translate(box.x + snapX, box.y + snapY);
          ctx.scale(flipDir, 1);
          ctx.drawImage(img, -box.w / 2, -box.h / 2, box.w, box.h);
          ctx.restore();
          break;
        }

        case 'petal_swirl': {
          ctx.save();
          ctx.globalAlpha = baseAlpha;
          ctx.translate(
            box.x + Math.sin(t * 1.4 + ti) * 26,
            box.y + Math.cos(t * 1.1 + ti) * 18,
          );
          ctx.rotate(Math.sin(t * 0.9 + ti) * 0.24);
          ctx.scale(flipDir * (0.96 + Math.sin(t * 2.2) * 0.06), 0.96 + Math.cos(t * 2.2) * 0.06);
          ctx.drawImage(img, -box.w / 2, -box.h / 2, box.w, box.h);
          ctx.restore();
          break;
        }

        case 'thermal_heatwave': {
          const strips = 14;
          const srcStripH = img.naturalHeight / strips;
          const dstStripH = box.h / strips;
          ctx.save();
          ctx.globalAlpha = baseAlpha;
          for (let s = 0; s < strips; s++) {
            const waveX = Math.sin(t * 6.5 + s * 0.72 + ti) * (8 + bassEnergy * 12);
            ctx.save();
            ctx.translate(box.x + waveX, box.y - box.h / 2 + s * dstStripH);
            ctx.scale(flipDir, 1);
            ctx.drawImage(
              img,
              0,
              s * srcStripH,
              img.naturalWidth,
              srcStripH,
              -box.w / 2,
              0,
              box.w,
              dstStripH + 1,
            );
            ctx.restore();
          }
          ctx.restore();
          break;
        }

        case 'slash_sweep': {
          const sweepPhase = (t * 1.35 + ti * 0.33) % 1;
          const travel = (sweepPhase - 0.5) * box.w * 1.1;
          ctx.save();
          ctx.globalAlpha = baseAlpha * Math.sin(sweepPhase * Math.PI);
          ctx.translate(box.x + travel, box.y - travel * 0.28);
          ctx.rotate(-0.32 * flipDir);
          ctx.scale(flipDir * 1.15, 0.85);
          ctx.drawImage(img, -box.w / 2, -box.h / 2, box.w, box.h);
          ctx.restore();
          break;
        }

        case 'bounce_pop': {
          const bounce = Math.abs(Math.sin(t * 4.5)) * 0.14 + bassEnergy * 0.2;
          ctx.save();
          ctx.globalAlpha = baseAlpha;
          ctx.translate(box.x, box.y - bounce * 38);
          ctx.scale(flipDir * (1 + bounce * 0.45), 1 - bounce * 0.22 + beatPulse * 0.24);
          ctx.drawImage(img, -box.w / 2, -box.h / 2, box.w, box.h);
          ctx.restore();
          break;
        }

        case 'flipbook_sheet': {
          const cols = Math.max(1, Math.floor(layer.flipbookCols || 4));
          const rows = Math.max(1, Math.floor(layer.flipbookRows || 4));
          const fps = Math.max(1, layer.flipbookFps || 16);
          const totalFrames = cols * rows;
          const frameIdx = Math.floor(animTimeSec * fps * spd) % totalFrames;
          const col = frameIdx % cols;
          const row = Math.floor(frameIdx / cols);
          const cellW = img.naturalWidth / cols;
          const cellH = img.naturalHeight / rows;
          ctx.save();
          ctx.globalAlpha = baseAlpha;
          ctx.translate(box.x, box.y);
          ctx.scale(flipDir, 1);
          ctx.drawImage(
            img,
            col * cellW,
            row * cellH,
            cellW,
            cellH,
            -box.w / 2,
            -box.h / 2,
            box.w,
            box.h,
          );
          ctx.restore();
          break;
        }

        case 'spark_emitter': {
          const count = 6;
          for (let p = 0; p < count; p++) {
            const life = (t * 0.72 + p / count + ti * 0.17) % 1;
            const px = box.x + Math.sin(p * 2.7 + t * 2) * box.w * 0.32;
            const py = box.y + box.h * 0.25 - life * box.h * 0.78;
            const pScale = (0.38 + (p % 3) * 0.12) * (1 - life * 0.35);
            ctx.save();
            ctx.globalAlpha = baseAlpha * Math.sin(life * Math.PI);
            ctx.translate(px, py);
            ctx.rotate((p % 2 === 0 ? 1 : -1) * life * 0.8);
            ctx.scale(flipDir * pScale, pScale);
            ctx.drawImage(img, -box.w / 2, -box.h / 2, box.w, box.h);
            ctx.restore();
          }
          break;
        }
      }
    }

    ctx.restore();
  }
}
