import { CHASSIS_THEMES } from '../data/catalog';
import { getSkinPack } from '../data/skinManifests';
import {
  ChassisTheme,
  DevAssetItem,
  DevDockStyleConfig,
  EditableThemePayload,
  PublishedHudLayout,
  SkinPackManifest,
  SongDefinition,
  ThemeId,
} from '../types/game';

export const STUDIO_DRAFTS_STORAGE_KEY = 'orbit_dev_studio_drafts_v1';

export const DEFAULT_DEV_DOCK_STYLE: DevDockStyleConfig = {
  position: 'left',
  opacity: 0.96,
  blurPx: 14,
  accentColor: '#38BDF8',
  bgColor: 'rgba(15, 23, 42, 0.94)',
  borderColor: 'rgba(56, 189, 248, 0.35)',
  compact: false,
  showTooltips: true,
};

export const DEFAULT_HUD_LAYOUT: PublishedHudLayout = {
  id: 'default',
  status: 'published',
  name: 'Cabinet Default',
  widgets: {},
  devDockStyle: { ...DEFAULT_DEV_DOCK_STYLE },
  customDecorWidgets: [],
};

export interface WidgetRegistryMeta {
  widgetId: string;
  label: string;
  screen: 'TITLE' | 'SONG_SELECT' | 'PLAYING' | 'GLOBAL';
}

export const WIDGET_CATALOG: WidgetRegistryMeta[] = [
  { widgetId: 'title_hero_badge', label: 'Title · Hero Header', screen: 'TITLE' },
  { widgetId: 'title_play_btn', label: 'Title · Play Primary Button', screen: 'TITLE' },
  { widgetId: 'title_tracks_btn', label: 'Title · Track Select Button', screen: 'TITLE' },
  { widgetId: 'title_shop_btn', label: 'Title · Orb Shop Button', screen: 'TITLE' },
  { widgetId: 'title_index_btn', label: 'Title · Index Button', screen: 'TITLE' },
  { widgetId: 'title_settings_btn', label: 'Title · Settings Button', screen: 'TITLE' },
  { widgetId: 'title_turntable', label: 'Title · Center Turntable', screen: 'TITLE' },
  { widgetId: 'song_select_topbar', label: 'Track Select · Top Bar', screen: 'SONG_SELECT' },
  { widgetId: 'song_select_launch_btn', label: 'Track Select · Launch Stage CTA', screen: 'SONG_SELECT' },
  { widgetId: 'stage_top_bar', label: 'Stage · Top Navigation Bar', screen: 'PLAYING' },
  { widgetId: 'stage_score_hud', label: 'Stage · Score & Combo HUD', screen: 'PLAYING' },
  { widgetId: 'stage_overdrive_meter', label: 'Stage · Overdrive Charge Meter', screen: 'PLAYING' },
  { widgetId: 'stage_practice_bar', label: 'Stage · Practice / Replay Bar', screen: 'PLAYING' },
];

export function hexToRgbTuple(hex: string): [number, number, number] {
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16) || 255;
    const g = parseInt(clean[1] + clean[1], 16) || 59;
    const b = parseInt(clean[2] + clean[2], 16) || 130;
    return [r, g, b];
  }
  if (clean.length >= 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    if (!Number.isNaN(r) && !Number.isNaN(g) && !Number.isNaN(b)) {
      return [r, g, b];
    }
  }
  return [255, 59, 130];
}

export function hexToRgbString(hex: string): string {
  const [r, g, b] = hexToRgbTuple(hex);
  return `${r}, ${g}, ${b}`;
}

function shadeHex(hex: string, factor: number): string {
  const [r, g, b] = hexToRgbTuple(hex);
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return `#${clamp(r * factor)
    .toString(16)
    .padStart(2, '0')}${clamp(g * factor)
    .toString(16)
    .padStart(2, '0')}${clamp(b * factor)
    .toString(16)
    .padStart(2, '0')}`;
}

export function toChassisTheme(payload: EditableThemePayload): ChassisTheme {
  const builtIn = CHASSIS_THEMES[payload.id];
  const primary = payload.primary || builtIn?.primary || '#ff3b82';
  const bright = payload.bright || builtIn?.bright || '#ff6ea3';
  const secondary = payload.secondary || builtIn?.secondary || '#22d3ee';
  const dim = payload.dim || builtIn?.dim || shadeHex(primary, 0.22);
  const bgAccentRgb = payload.bgAccentRgb || hexToRgbString(primary);

  return {
    id: payload.id,
    label: payload.label || builtIn?.label || payload.id,
    jpLabel: payload.jpLabel || builtIn?.jpLabel || 'カスタム',
    orbCost: typeof payload.orbCost === 'number' ? payload.orbCost : builtIn?.orbCost ?? 0,
    isTransformationSkin:
      payload.isTransformationSkin ?? builtIn?.isTransformationSkin ?? payload.manifest.isFullTransformation,
    unlockRequirement: payload.unlockRequirement ?? builtIn?.unlockRequirement,
    primary,
    bright,
    secondary,
    dim,
    edgeTick: builtIn?.edgeTick || bright,
    trailSteps: builtIn?.trailSteps || [
      shadeHex(primary, 0.14),
      shadeHex(primary, 0.28),
      shadeHex(primary, 0.52),
      primary,
    ],
    hubActiveFill: builtIn?.hubActiveFill || shadeHex(primary, 0.14),
    onPrimary: payload.onPrimary || builtIn?.onPrimary || '#ffffff',
    bgAccentRgb,
  };
}

export function buildEditableThemeFromBuiltIn(themeId: ThemeId): EditableThemePayload {
  const base = CHASSIS_THEMES[themeId] || CHASSIS_THEMES.tokyo_pink;
  const manifest = getSkinPack(base.id);
  return {
    id: base.id,
    status: 'published',
    label: base.label,
    jpLabel: base.jpLabel,
    orbCost: base.orbCost,
    isTransformationSkin: base.isTransformationSkin,
    unlockRequirement: base.unlockRequirement,
    primary: base.primary,
    bright: base.bright,
    secondary: base.secondary,
    dim: base.dim,
    onPrimary: base.onPrimary,
    bgAccentRgb: base.bgAccentRgb,
    manifest: {
      ...manifest,
      overlays: manifest.overlays ? manifest.overlays.map((o) => ({ ...o })) : [],
    },
    overdriveLayers: [],
    hideBuiltInFlames: false,
    isBuiltInOverride: Boolean(CHASSIS_THEMES[themeId]),
  };
}

export function mergeThemesCatalog(
  publishedThemes: EditableThemePayload[],
  draftThemes: Record<string, EditableThemePayload>,
): Record<string, EditableThemePayload> {
  const merged: Record<string, EditableThemePayload> = {};
  for (const tid of Object.keys(CHASSIS_THEMES)) {
    merged[tid] = buildEditableThemeFromBuiltIn(tid);
  }
  for (const pub of publishedThemes) {
    if (!pub?.id) continue;
    merged[pub.id] = {
      ...pub,
      manifest: pub.manifest || buildEditableThemeFromBuiltIn('tokyo_pink').manifest,
      overdriveLayers: Array.isArray(pub.overdriveLayers) ? pub.overdriveLayers : [],
    };
  }
  for (const [id, draft] of Object.entries(draftThemes)) {
    if (!draft) continue;
    merged[id] = {
      ...draft,
      id,
      overdriveLayers: Array.isArray(draft.overdriveLayers) ? draft.overdriveLayers : [],
    };
  }
  return merged;
}

export function getResolvedChassisTheme(
  themeId: ThemeId,
  mergedThemes: Record<string, EditableThemePayload>,
): ChassisTheme {
  const entry = mergedThemes[themeId];
  if (entry) return toChassisTheme(entry);
  return CHASSIS_THEMES[themeId] || CHASSIS_THEMES.tokyo_pink;
}

export function getResolvedSkinPack(
  themeId: ThemeId,
  mergedThemes: Record<string, EditableThemePayload>,
): SkinPackManifest {
  const entry = mergedThemes[themeId];
  if (entry?.manifest) return entry.manifest;
  return getSkinPack(themeId);
}

export function mergeSongsCatalog(
  baseSongs: SongDefinition[],
  publishedSongs: SongDefinition[],
  draftSongs: Record<string, SongDefinition>,
): SongDefinition[] {
  const byId = new Map<string, SongDefinition>();
  for (const s of baseSongs) byId.set(s.id, s);
  for (const pub of publishedSongs) {
    const existing = byId.get(pub.id);
    byId.set(pub.id, existing ? { ...existing, ...pub, isPublishedOverride: true } : pub);
  }
  for (const [id, draft] of Object.entries(draftSongs)) {
    const existing = byId.get(id);
    byId.set(id, existing ? { ...existing, ...draft } : draft);
  }
  return Array.from(byId.values());
}

export function mergeHudLayout(
  publishedLayouts: PublishedHudLayout[],
  draftLayout: PublishedHudLayout | null,
): PublishedHudLayout {
  const pubDefault =
    publishedLayouts.find((l) => l.id === 'default') || publishedLayouts[0] || DEFAULT_HUD_LAYOUT;
  const base: PublishedHudLayout = {
    ...DEFAULT_HUD_LAYOUT,
    ...pubDefault,
    widgets: { ...(pubDefault.widgets || {}) },
    devDockStyle: { ...DEFAULT_DEV_DOCK_STYLE, ...(pubDefault.devDockStyle || {}) },
    customDecorWidgets: Array.isArray(pubDefault.customDecorWidgets)
      ? pubDefault.customDecorWidgets
      : [],
  };
  if (!draftLayout) return base;
  return {
    ...base,
    ...draftLayout,
    widgets: { ...base.widgets, ...(draftLayout.widgets || {}) },
    devDockStyle: { ...base.devDockStyle, ...(draftLayout.devDockStyle || {}) },
    customDecorWidgets: Array.isArray(draftLayout.customDecorWidgets)
      ? draftLayout.customDecorWidgets
      : base.customDecorWidgets,
  };
}

export interface LocalStudioDraftBundle {
  draftSongs: Record<string, SongDefinition>;
  draftThemes: Record<string, EditableThemePayload>;
  draftHudLayout: PublishedHudLayout | null;
  draftAssets: Record<string, DevAssetItem>;
  devDockStyle?: DevDockStyleConfig;
}

export function loadStudioDrafts(): LocalStudioDraftBundle {
  try {
    const raw = localStorage.getItem(STUDIO_DRAFTS_STORAGE_KEY);
    if (!raw) {
      return { draftSongs: {}, draftThemes: {}, draftHudLayout: null, draftAssets: {} };
    }
    const parsed = JSON.parse(raw) as Partial<LocalStudioDraftBundle>;
    return {
      draftSongs: parsed.draftSongs || {},
      draftThemes: parsed.draftThemes || {},
      draftHudLayout: parsed.draftHudLayout || null,
      draftAssets: parsed.draftAssets || {},
      devDockStyle: parsed.devDockStyle,
    };
  } catch {
    return { draftSongs: {}, draftThemes: {}, draftHudLayout: null, draftAssets: {} };
  }
}

export function saveStudioDrafts(bundle: LocalStudioDraftBundle): void {
  try {
    localStorage.setItem(STUDIO_DRAFTS_STORAGE_KEY, JSON.stringify(bundle));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

export function clearStudioDrafts(): void {
  try {
    localStorage.removeItem(STUDIO_DRAFTS_STORAGE_KEY);
  } catch {
    // Ignore
  }
}
