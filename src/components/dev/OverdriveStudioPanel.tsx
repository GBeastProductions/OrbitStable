import React, { useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Flame, Plus, Trash2, Upload, Zap } from 'lucide-react';
import {
  OVERDRIVE_ANCHOR_CATALOG,
  OVERDRIVE_ANIMATION_CATALOG,
} from '../../data/overdriveAnimations';
import { compressImageToDataUrl } from '../../store/mediaVaultStore';
import { buildEditableThemeFromBuiltIn } from '../../store/studioRegistryStore';
import {
  DevAssetItem,
  EditableThemePayload,
  OverdriveAnimationType,
  OverdriveCustomLayer,
  OverdriveLayerAnchor,
  ThemeId,
} from '../../types/game';

interface OverdriveStudioPanelProps {
  themesMap: Record<string, EditableThemePayload>;
  activePlayerTheme: ThemeId;
  assets: DevAssetItem[];
  previewCharge: number | null;
  previewActive: boolean;
  onChangePreviewCharge: (val: number | null) => void;
  onTogglePreviewActive: (active: boolean) => void;
  onSaveThemeDraft: (theme: EditableThemePayload) => void;
  onApplyPlayerTheme: (id: ThemeId) => void;
}

export const OverdriveStudioPanel: React.FC<OverdriveStudioPanelProps> = ({
  themesMap,
  activePlayerTheme,
  assets,
  previewCharge,
  previewActive,
  onChangePreviewCharge,
  onTogglePreviewActive,
  onSaveThemeDraft,
  onApplyPlayerTheme,
}) => {
  const [targetThemeId, setTargetThemeId] = useState<ThemeId>(activePlayerTheme);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const theme = themesMap[targetThemeId] || buildEditableThemeFromBuiltIn(activePlayerTheme);
  const layers = theme.overdriveLayers || [];
  const imageAssets = useMemo(() => assets.filter((a) => a.kind === 'image'), [assets]);
  const selectedLayer =
    layers.find((l) => l.id === selectedLayerId) || layers[0] || null;

  const commitLayers = (nextLayers: OverdriveCustomLayer[], hideFlames?: boolean) => {
    onSaveThemeDraft({
      ...theme,
      status: 'draft',
      overdriveLayers: nextLayers,
      hideBuiltInFlames: hideFlames ?? theme.hideBuiltInFlames,
      updatedAtIso: new Date().toISOString(),
    });
  };

  const addLayerWithUrl = (name: string, imageUrl: string) => {
    const newLayer: OverdriveCustomLayer = {
      id: `od_${Date.now().toString().slice(-6)}`,
      name,
      imageUrl,
      anchor: 'bottom_border',
      animation: 'flame_rise',
      blendMode: 'screen',
      opacity: 0.9,
      scale: 1.0,
      speed: 1.0,
      buildupMinOpacity: 0.14,
      eruptBoost: 1.25,
      flipbookCols: 4,
      flipbookRows: 4,
      flipbookFps: 16,
      enabled: true,
    };
    const next = [...layers, newLayer];
    commitLayers(next);
    setSelectedLayerId(newLayer.id);
    if (previewCharge === null) onChangePreviewCharge(0.85);
  };

  const handleUploadSprite = async (file: File | undefined) => {
    if (!file) return;
    const compressed = await compressImageToDataUrl(file, 960, 190000);
    addLayerWithUrl(file.name.replace(/\.[^.]+$/, ''), compressed.dataUrl);
    if (fileRef.current) fileRef.current.value = '';
  };

  const updateSelected = (patch: Partial<OverdriveCustomLayer>) => {
    if (!selectedLayer) return;
    commitLayers(layers.map((l) => (l.id === selectedLayer.id ? { ...l, ...patch } : l)));
  };

  const moveLayer = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= layers.length) return;
    const copy = [...layers];
    const [item] = copy.splice(idx, 1);
    copy.splice(target, 0, item);
    commitLayers(copy);
  };

  return (
    <div className="space-y-3 text-xs text-slate-200">
      {/* Live Preview Tester */}
      <div className="border border-amber-500/40 bg-slate-800/85 p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-amber-300">
            <Flame className="h-3.5 w-3.5" /> Overdrive VFX Studio
          </span>
          {previewCharge !== null && (
            <button
              type="button"
              onClick={() => {
                onChangePreviewCharge(null);
                onTogglePreviewActive(false);
              }}
              className="border border-slate-600 bg-slate-900 px-2 py-0.5 text-[10px] text-slate-300 hover:text-white cursor-pointer"
            >
              Stop Preview
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400">Target Theme:</span>
          <select
            value={theme.id}
            onChange={(e) => {
              setTargetThemeId(e.target.value);
              onApplyPlayerTheme(e.target.value);
            }}
            className="flex-1 border border-slate-600 bg-slate-900 px-2 py-1 text-[11px] text-white"
          >
            {Object.values(themesMap).map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5 border-t border-slate-700 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-300">
              Live Stage Charge Preview
            </span>
            <span className="tabular-nums font-mono text-[11px] font-bold text-amber-300">
              {previewCharge === null ? 'OFF' : `${Math.round(previewCharge * 100)}%`}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={previewCharge === null ? 0 : Math.round(previewCharge * 100)}
            onChange={(e) => onChangePreviewCharge(Number(e.target.value) / 100)}
            className="w-full accent-amber-400"
          />
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                if (previewCharge === null) onChangePreviewCharge(1);
                onTogglePreviewActive(!previewActive);
              }}
              className={`flex flex-1 items-center justify-center gap-1.5 border py-1.5 font-bold cursor-pointer ${
                previewActive
                  ? 'border-amber-300 bg-amber-500 text-slate-950'
                  : 'border-amber-500/50 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25'
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              <span>{previewActive ? 'ERUPTING LIVE' : 'Test Full Overdrive Erupt'}</span>
            </button>
          </div>
        </div>

        <label className="flex items-center justify-between border border-slate-700 bg-slate-900 px-2.5 py-2 cursor-pointer">
          <span className="text-[11px] font-semibold text-white">
            Hide WebGL2 Built-In Shader &amp; Sparks
          </span>
          <input
            type="checkbox"
            checked={Boolean(theme.hideBuiltInFlames)}
            onChange={(e) => commitLayers(layers, e.target.checked)}
            className="accent-amber-400"
          />
        </label>

        {/* WebGL2 Overdrive Shader Uniform Tuning */}
        <div className="space-y-1.5 border-t border-slate-700 pt-2">
          <span className="font-mono text-[10px] font-bold uppercase text-amber-300">
            WebGL2 Overdrive Shader Tuning
          </span>
          {(
            [
              ['Shader Intensity', 'overdriveIntensity', 0.2, 2.0, 0.05, 1.0],
              ['FBM Turbulence', 'overdriveTurbulence', 0.3, 2.2, 0.05, 1.0],
              ['Anamorphic Flare', 'flareStrength', 0.0, 2.0, 0.05, 1.0],
              ['Flow Speed', 'shaderSpeed', 0.4, 2.5, 0.05, 1.0],
              ['Ring Aura Glow', 'ringAura', 0.0, 2.0, 0.05, 1.0],
            ] as const
          ).map(([lbl, key, min, max, step, fallback]) => {
            const val = theme.shaderConfig?.[key] ?? fallback;
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
                    onSaveThemeDraft({
                      ...theme,
                      status: 'draft',
                      shaderConfig: {
                        overdriveIntensity: theme.shaderConfig?.overdriveIntensity ?? 1.0,
                        overdriveTurbulence: theme.shaderConfig?.overdriveTurbulence ?? 1.0,
                        flareStrength: theme.shaderConfig?.flareStrength ?? 1.0,
                        shaderSpeed: theme.shaderConfig?.shaderSpeed ?? 1.0,
                        ringAura: theme.shaderConfig?.ringAura ?? 1.0,
                        atmosphereOpacity: theme.shaderConfig?.atmosphereOpacity ?? 0.85,
                        [key]: Number(e.target.value),
                      },
                      updatedAtIso: new Date().toISOString(),
                    })
                  }
                  className="w-full accent-amber-400"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Layer Controls */}
      <div className="border border-slate-700 bg-slate-800/70 p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[10px] font-bold uppercase text-slate-400">
            Custom Image Layers ({layers.length})
          </span>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1 border border-[#38BDF8]/60 bg-[#38BDF8]/15 px-2.5 py-1 font-bold text-[#38BDF8] hover:bg-[#38BDF8]/25 cursor-pointer"
          >
            <Upload className="h-3 w-3" />
            <span>Upload PNG/WebP</span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/webp,image/svg+xml,image/jpeg"
            className="hidden"
            onChange={(e) => void handleUploadSprite(e.target.files?.[0])}
          />
        </div>

        {imageAssets.length > 0 && (
          <select
            value=""
            onChange={(e) => {
              const asset = imageAssets.find((a) => a.id === e.target.value);
              if (asset) addLayerWithUrl(asset.name, asset.dataUrlOrPath);
            }}
            className="w-full border border-slate-600 bg-slate-900 px-2 py-1.5 text-[11px] text-slate-200"
          >
            <option value="">+ Add Layer from Asset Vault...</option>
            {imageAssets.map((a) => (
              <option key={a.id} value={a.id}>
                /{a.folder}/{a.name}
              </option>
            ))}
          </select>
        )}

        {/* Layer Stack */}
        <div className="space-y-1.5">
          {layers.length === 0 ? (
            <p className="border border-dashed border-slate-700 bg-slate-900/60 p-3 text-center text-[11px] text-slate-400">
              No custom image layers yet. Upload transparent PNG/WebP fire, aura, or lightning sprites above.
            </p>
          ) : (
            layers.map((layer, idx) => (
              <div
                key={layer.id}
                onClick={() => setSelectedLayerId(layer.id)}
                className={`flex items-center gap-2 border p-2 cursor-pointer ${
                  selectedLayer?.id === layer.id
                    ? 'border-[#38BDF8] bg-[#38BDF8]/15'
                    : 'border-slate-700 bg-slate-900/70 hover:border-slate-500'
                }`}
              >
                <input
                  type="checkbox"
                  checked={layer.enabled}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) =>
                    commitLayers(
                      layers.map((l) =>
                        l.id === layer.id ? { ...l, enabled: e.target.checked } : l,
                      ),
                    )
                  }
                  className="accent-[#38BDF8]"
                />
                <img
                  src={layer.imageUrl}
                  alt={layer.name}
                  className="h-8 w-8 shrink-0 border border-slate-600 bg-slate-950 object-contain"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-white">{layer.name}</p>
                  <p className="truncate font-mono text-[10px] text-slate-400">
                    {layer.animation} · {layer.anchor}
                  </p>
                </div>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveLayer(idx, -1);
                    }}
                    className="p-1 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveLayer(idx, 1);
                    }}
                    className="p-1 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      commitLayers(layers.filter((l) => l.id !== layer.id));
                    }}
                    className="p-1 text-rose-400 hover:text-rose-200 cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Selected Layer Inspector */}
      {selectedLayer && (
        <div className="border border-slate-700 bg-slate-800/70 p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold uppercase text-[#38BDF8]">
              Layer Properties
            </span>
            <button
              type="button"
              onClick={() =>
                addLayerWithUrl(`${selectedLayer.name} Copy`, selectedLayer.imageUrl)
              }
              className="flex items-center gap-1 border border-slate-600 bg-slate-900 px-1.5 py-0.5 text-[10px] text-slate-200 cursor-pointer"
            >
              <Plus className="h-2.5 w-2.5" /> Duplicate
            </button>
          </div>

          <label className="block space-y-1">
            <span className="text-[10px] text-slate-400">Layer Name</span>
            <input
              type="text"
              value={selectedLayer.name}
              onChange={(e) => updateSelected({ name: e.target.value })}
              className="w-full border border-slate-600 bg-slate-900 px-2 py-1 text-white"
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1">
              <span className="text-[10px] text-slate-400">Screen Anchor</span>
              <select
                value={selectedLayer.anchor}
                onChange={(e) =>
                  updateSelected({ anchor: e.target.value as OverdriveLayerAnchor })
                }
                className="w-full border border-slate-600 bg-slate-900 px-2 py-1 text-[11px] text-white"
              >
                {OVERDRIVE_ANCHOR_CATALOG.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-[10px] text-slate-400">Blend Mode</span>
              <select
                value={selectedLayer.blendMode}
                onChange={(e) =>
                  updateSelected({
                    blendMode: e.target.value as OverdriveCustomLayer['blendMode'],
                  })
                }
                className="w-full border border-slate-600 bg-slate-900 px-2 py-1 text-[11px] text-white"
              >
                <option value="screen">Screen (Additive Glow)</option>
                <option value="lighter">Lighter (Anime Fire)</option>
                <option value="normal">Normal (Solid PNG)</option>
              </select>
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-[10px] text-slate-400">Animation Engine (12 Presets)</span>
            <select
              value={selectedLayer.animation}
              onChange={(e) => {
                const anim = OVERDRIVE_ANIMATION_CATALOG.find((a) => a.id === e.target.value);
                updateSelected({
                  animation: e.target.value as OverdriveAnimationType,
                  blendMode: anim ? anim.defaultBlend : selectedLayer.blendMode,
                });
              }}
              className="w-full border border-slate-600 bg-slate-900 px-2 py-1.5 text-[11px] font-semibold text-white"
            >
              {OVERDRIVE_ANIMATION_CATALOG.map((anim) => (
                <option key={anim.id} value={anim.id}>
                  {anim.label} — {anim.desc}
                </option>
              ))}
            </select>
          </label>

          {selectedLayer.animation === 'flipbook_sheet' && (
            <div className="grid grid-cols-3 gap-1.5 border border-slate-700 bg-slate-900 p-2">
              <label className="space-y-0.5">
                <span className="text-[9px] text-slate-400">Cols</span>
                <input
                  type="number"
                  min={1}
                  max={16}
                  value={selectedLayer.flipbookCols || 4}
                  onChange={(e) =>
                    updateSelected({ flipbookCols: Math.max(1, Number(e.target.value) || 1) })
                  }
                  className="tabular-nums w-full border border-slate-600 bg-slate-950 px-1.5 py-0.5 text-white"
                />
              </label>
              <label className="space-y-0.5">
                <span className="text-[9px] text-slate-400">Rows</span>
                <input
                  type="number"
                  min={1}
                  max={16}
                  value={selectedLayer.flipbookRows || 4}
                  onChange={(e) =>
                    updateSelected({ flipbookRows: Math.max(1, Number(e.target.value) || 1) })
                  }
                  className="tabular-nums w-full border border-slate-600 bg-slate-950 px-1.5 py-0.5 text-white"
                />
              </label>
              <label className="space-y-0.5">
                <span className="text-[9px] text-slate-400">FPS</span>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={selectedLayer.flipbookFps || 16}
                  onChange={(e) =>
                    updateSelected({ flipbookFps: Math.max(1, Number(e.target.value) || 12) })
                  }
                  className="tabular-nums w-full border border-slate-600 bg-slate-950 px-1.5 py-0.5 text-white"
                />
              </label>
            </div>
          )}

          {(
            [
              ['Opacity', 'opacity', 0.1, 1.0, 0.05],
              ['Scale', 'scale', 0.3, 2.4, 0.05],
              ['Speed', 'speed', 0.2, 3.0, 0.1],
              ['Min Buildup Opacity', 'buildupMinOpacity', 0, 0.8, 0.05],
              ['Erupt Boost', 'eruptBoost', 0.8, 2.0, 0.05],
            ] as const
          ).map(([lbl, key, min, max, step]) => (
            <div key={key} className="space-y-0.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400">{lbl}</span>
                <span className="tabular-nums font-mono text-white">
                  {Number(selectedLayer[key]).toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={selectedLayer[key]}
                onChange={(e) => updateSelected({ [key]: Number(e.target.value) })}
                className="w-full accent-[#38BDF8]"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
