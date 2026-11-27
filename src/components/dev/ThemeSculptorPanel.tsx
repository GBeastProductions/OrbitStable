import React, { useMemo, useRef } from 'react';
import { Palette, Plus, RotateCcw, Sparkles, Upload } from 'lucide-react';
import { CHASSIS_THEMES } from '../../data/catalog';
import { compressImageToDataUrl } from '../../store/mediaVaultStore';
import {
  buildEditableThemeFromBuiltIn,
  hexToRgbString,
} from '../../store/studioRegistryStore';
import {
  DevAssetItem,
  EditableThemePayload,
  SkinDialStyle,
  SkinParticlePreset,
  SkinTrimStyle,
  ThemeId,
} from '../../types/game';

interface ThemeSculptorPanelProps {
  themesMap: Record<string, EditableThemePayload>;
  selectedThemeId: ThemeId;
  activePlayerTheme: ThemeId;
  assets: DevAssetItem[];
  onSelectEditTheme: (id: ThemeId) => void;
  onApplyPlayerTheme: (id: ThemeId) => void;
  onSaveThemeDraft: (theme: EditableThemePayload) => void;
  onResetBuiltInTheme: (id: ThemeId) => void;
}

const FONT_OPTIONS = [
  { label: 'Outfit (Arcade Geometric)', value: '"Outfit", system-ui, -apple-system, sans-serif' },
  { label: 'Shippori Mincho (Sakura Serif)', value: '"Shippori Mincho", "Outfit", serif' },
  { label: 'Playfair Display (Holiday Classic)', value: '"Playfair Display", "Outfit", serif' },
  { label: 'Cinzel (Gothic Forged)', value: '"Cinzel", "Outfit", serif' },
  { label: 'JetBrains Mono (Cyber Tech)', value: '"JetBrains Mono", ui-monospace, monospace' },
];

export const ThemeSculptorPanel: React.FC<ThemeSculptorPanelProps> = ({
  themesMap,
  selectedThemeId,
  activePlayerTheme,
  assets,
  onSelectEditTheme,
  onApplyPlayerTheme,
  onSaveThemeDraft,
  onResetBuiltInTheme,
}) => {
  const backdropFileRef = useRef<HTMLInputElement | null>(null);
  const ornamentFileRef = useRef<HTMLInputElement | null>(null);

  const themeIds = useMemo(() => Object.keys(themesMap), [themesMap]);
  const current =
    themesMap[selectedThemeId] || buildEditableThemeFromBuiltIn('tokyo_pink');
  const imageAssets = useMemo(() => assets.filter((a) => a.kind === 'image'), [assets]);

  const updateField = (patch: Partial<EditableThemePayload>) => {
    const nextPrimary = patch.primary ?? current.primary;
    onSaveThemeDraft({
      ...current,
      ...patch,
      status: 'draft',
      bgAccentRgb: patch.primary ? hexToRgbString(nextPrimary) : current.bgAccentRgb,
      updatedAtIso: new Date().toISOString(),
    });
  };

  const updateManifest = (patch: Partial<EditableThemePayload['manifest']>) => {
    onSaveThemeDraft({
      ...current,
      status: 'draft',
      manifest: {
        ...current.manifest,
        ...patch,
      },
      updatedAtIso: new Date().toISOString(),
    });
  };

  const handleCreateNewTheme = () => {
    const slug = `custom_theme_${Date.now().toString().slice(-5)}`;
    const base = buildEditableThemeFromBuiltIn(selectedThemeId);
    const created: EditableThemePayload = {
      ...base,
      id: slug,
      status: 'draft',
      label: `Custom Theme ${themeIds.length + 1}`,
      jpLabel: 'スタジオ特製',
      orbCost: 0,
      isBuiltInOverride: false,
      manifest: {
        ...base.manifest,
        id: slug,
        name: `Custom Theme ${themeIds.length + 1}`,
      },
    };
    onSaveThemeDraft(created);
    onSelectEditTheme(slug);
    onApplyPlayerTheme(slug);
  };

  const handleDirectUpload = async (file: File | undefined, slot: 'backdrop' | 'ornament') => {
    if (!file) return;
    const compressed = await compressImageToDataUrl(file, 1024, 190000);
    if (slot === 'backdrop') {
      updateManifest({ backdropImageUrl: compressed.dataUrl, isFullTransformation: true });
    } else {
      updateManifest({ ornamentImageUrl: compressed.dataUrl, isFullTransformation: true });
    }
  };

  const isBuiltIn = Boolean(CHASSIS_THEMES[current.id]);

  return (
    <div className="space-y-3 text-xs text-slate-200">
      {/* Selector Row */}
      <div className="border border-slate-700 bg-slate-800/80 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#38BDF8]">
            Theme &amp; Skin Sculptor
          </span>
          <button
            type="button"
            onClick={handleCreateNewTheme}
            className="flex items-center gap-1 border border-[#38BDF8]/60 bg-[#38BDF8]/15 px-2 py-1 font-bold text-[#38BDF8] hover:bg-[#38BDF8]/25 cursor-pointer"
          >
            <Plus className="h-3 w-3" />
            <span>New Theme</span>
          </button>
        </div>

        <select
          value={current.id}
          onChange={(e) => onSelectEditTheme(e.target.value)}
          className="w-full border border-slate-600 bg-slate-900 px-2.5 py-1.5 font-semibold text-white"
        >
          {themeIds.map((id) => {
            const t = themesMap[id];
            return (
              <option key={id} value={id}>
                {t.label} ({id}) {t.status === 'draft' ? '• DRAFT' : ''}
              </option>
            );
          })}
        </select>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onApplyPlayerTheme(current.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 border py-1.5 font-bold cursor-pointer ${
              activePlayerTheme === current.id
                ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                : 'border-[#38BDF8] bg-[#38BDF8]/20 text-white hover:bg-[#38BDF8]/30'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>
              {activePlayerTheme === current.id ? 'Previewing Live' : 'Preview Theme Live'}
            </span>
          </button>
          {isBuiltIn && (
            <button
              type="button"
              onClick={() => onResetBuiltInTheme(current.id)}
              className="flex items-center gap-1 border border-slate-600 bg-slate-900 px-2.5 py-1.5 text-slate-300 hover:text-white cursor-pointer"
              title="Revert built-in theme to defaults"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Identity */}
      <div className="border border-slate-700 bg-slate-800/60 p-3 space-y-2">
        <span className="font-mono text-[10px] font-bold uppercase text-slate-400">
          Identity &amp; Storefront
        </span>
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1">
            <span className="text-[10px] text-slate-400">Title</span>
            <input
              type="text"
              value={current.label}
              onChange={(e) => updateField({ label: e.target.value })}
              className="w-full border border-slate-600 bg-slate-900 px-2 py-1 text-white"
            />
          </label>
          <label className="space-y-1">
            <span className="text-[10px] text-slate-400">Subtitle / JP</span>
            <input
              type="text"
              value={current.jpLabel}
              onChange={(e) => updateField({ jpLabel: e.target.value })}
              className="w-full border border-slate-600 bg-slate-900 px-2 py-1 text-white"
            />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1">
            <span className="text-[10px] text-slate-400">Orb Cost</span>
            <input
              type="number"
              min={0}
              max={10000}
              value={current.orbCost}
              onChange={(e) => updateField({ orbCost: Math.max(0, Number(e.target.value) || 0) })}
              className="tabular-nums w-full border border-slate-600 bg-slate-900 px-2 py-1 text-white"
            />
          </label>
          <label className="flex items-center gap-2 pt-4 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(current.manifest.isFullTransformation)}
              onChange={(e) => {
                updateField({ isTransformationSkin: e.target.checked });
                updateManifest({ isFullTransformation: e.target.checked });
              }}
              className="accent-[#38BDF8]"
            />
            <span className="text-[11px] font-semibold text-white">Full Transformation Skin</span>
          </label>
        </div>
      </div>

      {/* Palette */}
      <div className="border border-slate-700 bg-slate-800/60 p-3 space-y-2">
        <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase text-slate-400">
          <Palette className="h-3 w-3" /> Core Neon Palette
        </span>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ['Primary Accent', 'primary'],
              ['Bright Highlight', 'bright'],
              ['Secondary Accent', 'secondary'],
              ['Deep Dim Base', 'dim'],
            ] as const
          ).map(([lbl, key]) => (
            <label
              key={key}
              className="flex items-center justify-between border border-slate-700 bg-slate-900 px-2 py-1.5"
            >
              <span className="text-[10px] text-slate-300">{lbl}</span>
              <input
                type="color"
                value={current[key]}
                onChange={(e) => updateField({ [key]: e.target.value })}
                className="h-5 w-8 cursor-pointer bg-transparent"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Typography, Dial & Effects */}
      <div className="border border-slate-700 bg-slate-800/60 p-3 space-y-2">
        <span className="font-mono text-[10px] font-bold uppercase text-slate-400">
          Typography &amp; Stage Material
        </span>
        <label className="block space-y-1">
          <span className="text-[10px] text-slate-400">Display Font</span>
          <select
            value={current.manifest.displayFont}
            onChange={(e) => updateManifest({ displayFont: e.target.value })}
            className="w-full border border-slate-600 bg-slate-900 px-2 py-1.5 text-white"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.label} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-3 gap-1.5">
          <label className="space-y-1">
            <span className="text-[10px] text-slate-400">Trim</span>
            <select
              value={current.manifest.trimStyle}
              onChange={(e) => updateManifest({ trimStyle: e.target.value as SkinTrimStyle })}
              className="w-full border border-slate-600 bg-slate-900 px-1.5 py-1 text-[11px] text-white"
            >
              <option value="none">None</option>
              <option value="sakura_blossom">Sakura</option>
              <option value="snow_cap">Snow Cap</option>
              <option value="krampus_iron">Krampus</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[10px] text-slate-400">Particles</span>
            <select
              value={current.manifest.particlePreset}
              onChange={(e) =>
                updateManifest({ particlePreset: e.target.value as SkinParticlePreset })
              }
              className="w-full border border-slate-600 bg-slate-900 px-1.5 py-1 text-[11px] text-white"
            >
              <option value="none">None</option>
              <option value="sakura">Sakura</option>
              <option value="snow">Snow</option>
              <option value="krampus_ash">Embers</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[10px] text-slate-400">Dial Style</span>
            <select
              value={current.manifest.dialStyle}
              onChange={(e) => updateManifest({ dialStyle: e.target.value as SkinDialStyle })}
              className="w-full border border-slate-600 bg-slate-900 px-1.5 py-1 text-[11px] text-white"
            >
              <option value="classic">Classic</option>
              <option value="sakura_kintsugi">Kintsugi</option>
              <option value="christmas_frost">Frost</option>
              <option value="krampus_forged">Forged</option>
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1">
            <span className="text-[10px] text-slate-400">Panel Surface BG</span>
            <input
              type="text"
              value={current.manifest.surfaceBg}
              onChange={(e) => updateManifest({ surfaceBg: e.target.value })}
              className="w-full border border-slate-600 bg-slate-900 px-2 py-1 font-mono text-[10px] text-white"
            />
          </label>
          <label className="space-y-1">
            <span className="text-[10px] text-slate-400">Header BG</span>
            <input
              type="text"
              value={current.manifest.headerBg}
              onChange={(e) => updateManifest({ headerBg: e.target.value })}
              className="w-full border border-slate-600 bg-slate-900 px-2 py-1 font-mono text-[10px] text-white"
            />
          </label>
        </div>
      </div>

      {/* Backdrop & Ornament Assets */}
      <div className="border border-slate-700 bg-slate-800/60 p-3 space-y-2.5">
        <span className="font-mono text-[10px] font-bold uppercase text-slate-400">
          Backdrop &amp; Ornament Artwork
        </span>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-300">Full-Screen Backdrop</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => backdropFileRef.current?.click()}
                className="flex items-center gap-1 border border-slate-600 bg-slate-900 px-2 py-0.5 text-[10px] text-[#38BDF8] cursor-pointer"
              >
                <Upload className="h-2.5 w-2.5" /> Upload
              </button>
              {current.manifest.backdropImageUrl && (
                <button
                  type="button"
                  onClick={() => updateManifest({ backdropImageUrl: null })}
                  className="border border-slate-600 bg-slate-900 px-2 py-0.5 text-[10px] text-rose-300 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
            <input
              ref={backdropFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void handleDirectUpload(e.target.files?.[0], 'backdrop')}
            />
          </div>
          {imageAssets.length > 0 && (
            <select
              value=""
              onChange={(e) => {
                const found = imageAssets.find((a) => a.id === e.target.value);
                if (found) updateManifest({ backdropImageUrl: found.dataUrlOrPath, isFullTransformation: true });
              }}
              className="w-full border border-slate-600 bg-slate-900 px-2 py-1 text-[10px] text-slate-200"
            >
              <option value="">Pick backdrop from Asset Vault...</option>
              {imageAssets.map((a) => (
                <option key={a.id} value={a.id}>
                  /{a.folder}/{a.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="space-y-1.5 border-t border-slate-700 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-300">Disc / Corner Ornament</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => ornamentFileRef.current?.click()}
                className="flex items-center gap-1 border border-slate-600 bg-slate-900 px-2 py-0.5 text-[10px] text-[#38BDF8] cursor-pointer"
              >
                <Upload className="h-2.5 w-2.5" /> Upload
              </button>
              {current.manifest.ornamentImageUrl && (
                <button
                  type="button"
                  onClick={() => updateManifest({ ornamentImageUrl: null })}
                  className="border border-slate-600 bg-slate-900 px-2 py-0.5 text-[10px] text-rose-300 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
            <input
              ref={ornamentFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void handleDirectUpload(e.target.files?.[0], 'ornament')}
            />
          </div>
          {imageAssets.length > 0 && (
            <select
              value=""
              onChange={(e) => {
                const found = imageAssets.find((a) => a.id === e.target.value);
                if (found) updateManifest({ ornamentImageUrl: found.dataUrlOrPath, isFullTransformation: true });
              }}
              className="w-full border border-slate-600 bg-slate-900 px-2 py-1 text-[10px] text-slate-200"
            >
              <option value="">Pick ornament from Asset Vault...</option>
              {imageAssets.map((a) => (
                <option key={a.id} value={a.id}>
                  /{a.folder}/{a.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* WebGL2 Shader Uniforms */}
      <div className="border border-slate-700 bg-slate-800/60 p-3 space-y-2">
        <span className="font-mono text-[10px] font-bold uppercase text-[#38BDF8]">
          WebGL2 Shader Uniforms (GLSL 300 es)
        </span>
        {(
          [
            ['Atmosphere Opacity', 'atmosphereOpacity', 0, 1.5, 0.05, 0.85],
            ['Overdrive Intensity', 'overdriveIntensity', 0.2, 2.0, 0.05, 1.0],
            ['Shader Speed', 'shaderSpeed', 0.3, 2.5, 0.05, 1.0],
            ['Ring Aura Strength', 'ringAura', 0.0, 2.0, 0.05, 1.0],
          ] as const
        ).map(([lbl, key, min, max, step, fallback]) => {
          const val = current.shaderConfig?.[key] ?? fallback;
          return (
            <div key={key} className="space-y-0.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-300">{lbl}</span>
                <span className="tabular-nums font-mono text-white">{val.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={val}
                onChange={(e) =>
                  updateField({
                    shaderConfig: {
                      overdriveIntensity: current.shaderConfig?.overdriveIntensity ?? 1.0,
                      overdriveTurbulence: current.shaderConfig?.overdriveTurbulence ?? 1.0,
                      flareStrength: current.shaderConfig?.flareStrength ?? 1.0,
                      shaderSpeed: current.shaderConfig?.shaderSpeed ?? 1.0,
                      ringAura: current.shaderConfig?.ringAura ?? 1.0,
                      atmosphereOpacity: current.shaderConfig?.atmosphereOpacity ?? 0.85,
                      [key]: Number(e.target.value),
                    },
                  })
                }
                className="w-full accent-[#38BDF8]"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
