import React from 'react';
import { getResolvedSkinPack } from '../store/studioRegistryStore';
import { BgFxMode, LevelBackgroundSetting, ThemeId } from '../types/game';
import { useStudioLayout } from './LiveLayoutWrapper';

interface BackgroundBackdropProps {
  defaultImageUrl: string;
  levelSetting?: LevelBackgroundSetting;
  bgFxMode: BgFxMode;
  themeId: ThemeId;
  preferSkinBackdrop?: boolean;
  forceDimPct?: number;
  forceBlurPx?: number;
  accentRgb?: string;
}

export const BackgroundBackdrop: React.FC<BackgroundBackdropProps> = React.memo(
  ({
    defaultImageUrl,
    levelSetting,
    bgFxMode,
    themeId,
    preferSkinBackdrop = false,
    forceDimPct,
    forceBlurPx,
    accentRgb = '255, 59, 130',
  }) => {
    const { themesMap } = useStudioLayout();
    const skin = getResolvedSkinPack(themeId, themesMap);
    const hasCustomTrackArt = Boolean(levelSetting?.customImageDataUrl);
    const useSkinScene =
      skin.isFullTransformation &&
      Boolean(skin.backdropImageUrl) &&
      (preferSkinBackdrop || !hasCustomTrackArt);

    const imageSrc = useSkinScene
      ? skin.backdropImageUrl || defaultImageUrl
      : levelSetting?.customImageDataUrl || defaultImageUrl;

    const dimPct =
      forceDimPct !== undefined
        ? forceDimPct
        : useSkinScene
        ? 36
        : levelSetting?.dimPct ?? 64;
    const blurPx =
      forceBlurPx !== undefined
        ? forceBlurPx
        : useSkinScene
        ? 0
        : levelSetting?.blurPx ?? 3;

    return (
      <div
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#07080d] isolate"
        aria-hidden="true"
      >
        {imageSrc && (
          <img
            src={imageSrc}
            alt=""
            decoding="async"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
            style={{
              filter: bgFxMode === 'minimal' || blurPx <= 0 ? 'none' : `blur(${blurPx}px)`,
              transform:
                blurPx > 0 && bgFxMode !== 'minimal'
                  ? 'translate3d(0,0,0) scale(1.05)'
                  : 'translate3d(0,0,0) scale(1)',
              willChange: 'transform',
            }}
          />
        )}

        {/* Measured readability scrim */}
        <div
          className="absolute inset-0 transition-opacity duration-200"
          style={{
            background: skin.isFullTransformation
              ? 'radial-gradient(circle at 50% 45%, rgba(8,6,14,0.35) 0%, rgba(8,6,14,0.88) 92%)'
              : '#07080d',
            opacity: Math.min(0.96, Math.max(0.24, dimPct / 100)),
          }}
        />

        {/* Dynamic ambiance: classic disco grid OR transformation atmospheric aura */}
        {bgFxMode === 'dynamic' && (
          <>
            <div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(circle at 26% 52%, rgba(${accentRgb}, 0.16) 0%, rgba(34, 211, 238, 0.05) 44%, transparent 78%)`,
              }}
            />
            {!skin.isFullTransformation && (
              <>
                <div className="disco-grid absolute inset-0 opacity-35" />
                <div className="tokyo-scanlines absolute inset-0 opacity-55" />
              </>
            )}
          </>
        )}
      </div>
    );
  },
);
