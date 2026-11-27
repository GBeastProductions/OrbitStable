import neonSakuraSceneImg from '../assets/images/skin_neon_sakura_scene_1795711180487.jpg';
import cozyChristmasSceneImg from '../assets/images/skin_cozy_christmas_scene_1795711181962.jpg';
import krampusnachtSceneImg from '../assets/images/skin_krampusnacht_scene_1795711182862.jpg';
import sakuraBranchImg from '../assets/images/skin_sakura_branch_ornament_1795711183094.jpg';
import christmasGarlandImg from '../assets/images/skin_christmas_garland_ornament_1795711182717.jpg';
import krampusIronImg from '../assets/images/skin_krampus_iron_ornament_1795711184104.jpg';
import animeFlameTextureImg from '../assets/images/fx_anime_flame_plume_1795711184734.jpg';
import { CHASSIS_THEMES } from './catalog';
import {
  BuiltInThemeId,
  PlayerProfile,
  SkinPackManifest,
  ThemeId,
  UIActionId,
} from '../types/game';

export const ANIME_FLAME_TEXTURE_URL = animeFlameTextureImg;

export const UI_ACTION_REGISTRY: Record<
  UIActionId,
  { id: UIActionId; label: string; description: string }
> = {
  play_primary: {
    id: 'play_primary',
    label: 'Play Active Track',
    description: 'Launch gameplay stage or calibration tutorial',
  },
  open_tracks: {
    id: 'open_tracks',
    label: 'Track Select',
    description: 'Open full song library, daily rotation, and weekly demon',
  },
  open_shop: {
    id: 'open_shop',
    label: 'Orb Shop',
    description: 'Open tracks, mods, themes, and difficulty tier storefront',
  },
  open_index: {
    id: 'open_index',
    label: 'The Index',
    description: 'Open mechanics handbook, trophy badges, and analytics',
  },
  open_settings: {
    id: 'open_settings',
    label: 'Settings',
    description: 'Open audio, keybinds, display themes, and account roles',
  },
  toggle_music: {
    id: 'toggle_music',
    label: 'Toggle Audio',
    description: 'Mute or unmute soundtrack playback',
  },
  open_mods: {
    id: 'open_mods',
    label: 'Mods',
    description: 'Open gameplay modifier drawer',
  },
  open_practice: {
    id: 'open_practice',
    label: 'Practice Mode',
    description: 'Launch stage in Practice & checkpoint scrubbing console',
  },
  open_dev_console: {
    id: 'open_dev_console',
    label: 'Dev Studio (Phase 6)',
    description: 'Reserved Phase 6 hook for developer role level/skin studio',
  },
};

function makeClassicManifest(id: BuiltInThemeId): SkinPackManifest {
  const c = CHASSIS_THEMES[id];
  return {
    id,
    name: c.label,
    subtitle: c.jpLabel,
    isFullTransformation: false,
    unlockRuleText: c.orbCost === 0 ? 'Starter Cabinet' : `${c.orbCost} Orbs`,
    displayFont: '"Outfit", system-ui, -apple-system, sans-serif',
    bodyFont: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
    monoFont: '"JetBrains Mono", ui-monospace, monospace',
    backdropImageUrl: null,
    backdropScrimRgba: 'rgba(7, 8, 13, 0.72)',
    surfaceBg: 'rgba(13, 17, 27, 0.92)',
    surfaceElevatedBg: 'rgba(20, 26, 40, 0.95)',
    surfaceBorder: 'rgba(255, 255, 255, 0.14)',
    headerBg: 'rgba(8, 10, 17, 0.92)',
    bladeBg: 'rgba(16, 20, 32, 0.92)',
    bladeHoverBg: 'rgba(23, 29, 46, 0.96)',
    trimStyle: 'none',
    particlePreset: 'none',
    dialStyle: 'classic',
    turntableGlowCss: `0 0 56px rgba(${c.bgAccentRgb}, 0.28), inset 0 0 0 1px rgba(255,255,255,0.12)`,
    ornamentImageUrl: null,
    overlays: [],
  };
}

export const SKIN_PACKS: Record<string, SkinPackManifest> = {
  tokyo_pink: makeClassicManifest('tokyo_pink'),
  shibuya_cyan: makeClassicManifest('shibuya_cyan'),
  emerald: makeClassicManifest('emerald'),
  amber: makeClassicManifest('amber'),
  crimson: makeClassicManifest('crimson'),
  shinjuku_violet: makeClassicManifest('shinjuku_violet'),
  snowflake_frost: makeClassicManifest('snowflake_frost'),
  kyoto_jade: makeClassicManifest('kyoto_jade'),

  neon_sakura: {
    id: 'neon_sakura',
    name: 'Neon Sakura',
    subtitle: '夜桜・月下の鳥居',
    isFullTransformation: true,
    unlockRuleText: 'Achieve S or SS on any DEMON track',
    displayFont: '"Shippori Mincho", "Outfit", serif',
    bodyFont: '"Plus Jakarta Sans", system-ui, sans-serif',
    monoFont: '"JetBrains Mono", ui-monospace, monospace',
    backdropImageUrl: neonSakuraSceneImg,
    backdropScrimRgba: 'rgba(14, 7, 18, 0.56)',
    surfaceBg: 'rgba(24, 11, 24, 0.86)',
    surfaceElevatedBg: 'rgba(38, 16, 36, 0.92)',
    surfaceBorder: 'rgba(244, 114, 182, 0.42)',
    headerBg: 'rgba(18, 8, 20, 0.88)',
    bladeBg: 'rgba(30, 12, 28, 0.88)',
    bladeHoverBg: 'rgba(54, 19, 46, 0.94)',
    trimStyle: 'sakura_blossom',
    particlePreset: 'sakura',
    dialStyle: 'sakura_kintsugi',
    turntableGlowCss:
      '0 0 70px rgba(244, 63, 142, 0.42), 0 0 28px rgba(250, 204, 21, 0.22), inset 0 0 0 2px rgba(251, 207, 232, 0.35)',
    ornamentImageUrl: sakuraBranchImg,
    overlays: [
      {
        id: 'sakura_tl',
        slot: 'topLeft',
        imageUrl: sakuraBranchImg,
        opacity: 0.72,
        scale: 1,
        rotateDeg: 0,
        blendMode: 'screen',
      },
      {
        id: 'sakura_br',
        slot: 'bottomRight',
        imageUrl: sakuraBranchImg,
        opacity: 0.65,
        scale: 1,
        rotateDeg: 180,
        blendMode: 'screen',
      },
      {
        id: 'sakura_turntable',
        slot: 'turntable',
        imageUrl: sakuraBranchImg,
        opacity: 0.9,
        scale: 1.18,
        rotateDeg: -14,
        blendMode: 'screen',
      },
    ],
  },

  cozy_christmas_2026: {
    id: 'cozy_christmas_2026',
    name: 'Cozy Christmas 2026',
    subtitle: '聖夜・オーロラの森',
    isFullTransformation: true,
    unlockRuleText: 'Achieve S or SS on both Christmas tracks (any difficulty)',
    displayFont: '"Playfair Display", "Outfit", serif',
    bodyFont: '"Plus Jakarta Sans", system-ui, sans-serif',
    monoFont: '"JetBrains Mono", ui-monospace, monospace',
    backdropImageUrl: cozyChristmasSceneImg,
    backdropScrimRgba: 'rgba(6, 14, 24, 0.56)',
    surfaceBg: 'rgba(13, 25, 36, 0.86)',
    surfaceElevatedBg: 'rgba(20, 38, 52, 0.92)',
    surfaceBorder: 'rgba(253, 230, 138, 0.38)',
    headerBg: 'rgba(10, 20, 30, 0.88)',
    bladeBg: 'rgba(18, 32, 46, 0.88)',
    bladeHoverBg: 'rgba(34, 52, 70, 0.94)',
    trimStyle: 'snow_cap',
    particlePreset: 'snow',
    dialStyle: 'christmas_frost',
    turntableGlowCss:
      '0 0 72px rgba(52, 211, 153, 0.28), 0 0 38px rgba(251, 191, 36, 0.32), inset 0 0 0 2px rgba(254, 243, 199, 0.42)',
    ornamentImageUrl: christmasGarlandImg,
    overlays: [
      {
        id: 'xmas_tr',
        slot: 'topRight',
        imageUrl: christmasGarlandImg,
        opacity: 0.82,
        scale: 1,
        rotateDeg: 8,
        blendMode: 'screen',
      },
      {
        id: 'xmas_bl',
        slot: 'bottomLeft',
        imageUrl: christmasGarlandImg,
        opacity: 0.72,
        scale: 0.92,
        rotateDeg: -14,
        flipX: true,
        blendMode: 'screen',
      },
      {
        id: 'xmas_turntable',
        slot: 'turntable',
        imageUrl: christmasGarlandImg,
        opacity: 0.94,
        scale: 0.64,
        rotateDeg: -12,
        blendMode: 'screen',
      },
    ],
  },

  krampusnacht_2026: {
    id: 'krampusnacht_2026',
    name: 'Krampusnacht 2026',
    subtitle: '降魔聖夜・煉獄聖堂',
    isFullTransformation: true,
    unlockRuleText: 'Achieve S or SS on both Christmas tracks on DEMON',
    displayFont: '"Cinzel", "Outfit", serif',
    bodyFont: '"Plus Jakarta Sans", system-ui, sans-serif',
    monoFont: '"JetBrains Mono", ui-monospace, monospace',
    backdropImageUrl: krampusnachtSceneImg,
    backdropScrimRgba: 'rgba(12, 4, 6, 0.58)',
    surfaceBg: 'rgba(22, 8, 10, 0.88)',
    surfaceElevatedBg: 'rgba(34, 11, 14, 0.94)',
    surfaceBorder: 'rgba(220, 38, 38, 0.46)',
    headerBg: 'rgba(16, 5, 7, 0.90)',
    bladeBg: 'rgba(26, 9, 12, 0.90)',
    bladeHoverBg: 'rgba(48, 14, 18, 0.96)',
    trimStyle: 'krampus_iron',
    particlePreset: 'krampus_ash',
    dialStyle: 'krampus_forged',
    turntableGlowCss:
      '0 0 78px rgba(220, 38, 38, 0.45), 0 0 32px rgba(245, 158, 11, 0.25), inset 0 0 0 2px rgba(252, 165, 165, 0.3)',
    ornamentImageUrl: krampusIronImg,
    overlays: [
      {
        id: 'krampus_tl',
        slot: 'topLeft',
        imageUrl: krampusIronImg,
        opacity: 0.85,
        scale: 1,
        rotateDeg: 0,
        blendMode: 'screen',
      },
      {
        id: 'krampus_tr',
        slot: 'topRight',
        imageUrl: krampusIronImg,
        opacity: 0.78,
        scale: 0.9,
        rotateDeg: 0,
        flipX: true,
        blendMode: 'screen',
      },
      {
        id: 'krampus_turntable',
        slot: 'turntable',
        imageUrl: krampusIronImg,
        opacity: 0.92,
        scale: 0.66,
        rotateDeg: 0,
        blendMode: 'screen',
      },
    ],
  },
};

let runtimeManifestOverrides: Record<string, SkinPackManifest> = {};

export function setRuntimeSkinPackOverrides(map: Record<string, SkinPackManifest>): void {
  runtimeManifestOverrides = map;
}

export function getSkinPack(
  themeId: ThemeId,
  customOverrides?: Record<string, SkinPackManifest>,
): SkinPackManifest {
  if (customOverrides && customOverrides[themeId]) return customOverrides[themeId];
  if (runtimeManifestOverrides[themeId]) return runtimeManifestOverrides[themeId];
  return SKIN_PACKS[themeId] || SKIN_PACKS.tokyo_pink;
}

function isSOrSS(rank?: string): boolean {
  return rank === 'S' || rank === 'SS';
}

/**
 * Evaluates skill-based Full-UI Transformation Skin unlocks strictly from verified records.
 */
export function evaluateMilestoneThemes(profile: PlayerProfile): ThemeId[] {
  const newlyUnlocked: ThemeId[] = [];
  const diffRecs = profile.songDiffRecords || {};
  const songRecs = profile.songRecords || {};

  // 1. Neon Sakura: S or SS on ANY track on DEMON
  const hasDemonS =
    Object.values(diffRecs).some((byDiff) => isSOrSS(byDiff?.DEMON?.bestRank)) ||
    ['weekly_w1', 'weekly_w2', 'weekly_w3', 'weekly_w4', 'weekly_w5'].some((wid) =>
      isSOrSS(songRecs[wid]?.bestRank),
    );
  if (hasDemonS && !profile.unlockedThemes.includes('neon_sakura')) {
    newlyUnlocked.push('neon_sakura');
  }

  // 2. Cozy Christmas 2026: S or SS on both 2026 Christmas tracks on ANY difficulty
  const solsticeS = isSOrSS(songRecs['winter_solstice']?.bestRank);
  const carolS = isSOrSS(songRecs['carol_of_the_bells']?.bestRank);
  if (solsticeS && carolS && !profile.unlockedThemes.includes('cozy_christmas_2026')) {
    newlyUnlocked.push('cozy_christmas_2026');
  }

  // 3. Krampusnacht 2026: S or SS on both 2026 Christmas tracks specifically on DEMON
  const solsticeDemonS = isSOrSS(diffRecs['winter_solstice']?.DEMON?.bestRank);
  const carolDemonS = isSOrSS(diffRecs['carol_of_the_bells']?.DEMON?.bestRank);
  if (
    solsticeDemonS &&
    carolDemonS &&
    !profile.unlockedThemes.includes('krampusnacht_2026')
  ) {
    newlyUnlocked.push('krampusnacht_2026');
  }

  return newlyUnlocked;
}
