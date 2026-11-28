import React, { useMemo } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  EyeOff,
  FlipHorizontal2,
  LayoutGrid,
  Lock,
  Plus,
  RotateCcw,
  Sliders,
  Trash2,
  Unlock,
} from 'lucide-react';
import { CHASSIS_THEMES } from '../../data/catalog';
import { BUILTIN_STUDIO_PNGS } from '../../data/studioBuiltinAssets';
import {
  DEFAULT_DEV_DOCK_STYLE,
  DEFAULT_HUD_LAYOUT,
  WIDGET_CATALOG,
} from '../../store/studioRegistryStore';
import {
  CustomDecorWidget,
  DevAssetItem,
  DevDockStyleConfig,
  EditableThemePayload,
  HudWidgetOverride,
  PublishedHudLayout,
  ScreenView,
  ThemeId,
} from '../../types/game';

interface HudLayoutPanelProps {
  hudLayout: PublishedHudLayout;
  editModeActive: boolean;
  selectedWidgetId: string | null;
  selectedDecorId?: string | null;
  currentScreen?: ScreenView;
  activeThemeId?: ThemeId;
  themesMap?: Record<string, EditableThemePayload>;
  assets: DevAssetItem[];
  onToggleEditMode: () => void;
  onSelectWidget: (widgetId: string) => void;
  onSelectDecor?: (decorId: string | null) => void;
  onUpdateLayout: (next: PublishedHudLayout) => void;
  onSafeResetLayout: () => void;
}

const SCREEN_OPTIONS: { value: CustomDecorWidget['screen']; label: string }[] = [
  { value: 'ALL', label: 'All Screens' },
  { value: 'TITLE', label: 'Title Screen' },
  { value: 'SONG_SELECT', label: 'Track Select' },
  { value: 'PLAYING', label: 'Gameplay Stage' },
  { value: 'SHOP', label: 'Orb Shop' },
  { value: 'INDEX', label: 'The Index' },
  { value: 'SETTINGS', label: 'Settings' },
];

export const HudLayoutPanel: React.FC<HudLayoutPanelProps> = ({
  hudLayout,
  editModeActive,
  selectedWidgetId,
  selectedDecorId,
  currentScreen = 'TITLE',
  activeThemeId = 'cozy_christmas_2026',
  themesMap = {},
  assets,
  onToggleEditMode,
  onSelectWidget,
  onSelectDecor,
  onUpdateLayout,
  onSafeResetLayout,
}) => {
  const activeWidgetId = selectedWidgetId || WIDGET_CATALOG[0].widgetId;
  const widgetOverride: HudWidgetOverride = hudLayout.widgets[activeWidgetId] || {
    widgetId: activeWidgetId,
    xOffsetPx: 0,
    yOffsetPx: 0,
    scale: 1,
    opacity: 1,
    visible: true,
  };

  const dock = hudLayout.devDockStyle || DEFAULT_DEV_DOCK_STYLE;
  const decors = hudLayout.customDecorWidgets || [];
  const imageAssets = useMemo(() => assets.filter((a) => a.kind === 'image'), [assets]);
  const selectedDecor = useMemo(
    () => decors.find((d) => d.id === selectedDecorId) || decors[0] || null,
    [decors, selectedDecorId],
  );
  const allThemeIds = useMemo(
    () =>
      (Object.keys(themesMap).length > 0
        ? Object.keys(themesMap)
        : Object.keys(CHASSIS_THEMES)) as ThemeId[],
    [themesMap],
  );

  const updateWidget = (patch: Partial<HudWidgetOverride>) => {
    onUpdateLayout({
      ...hudLayout,
      status: 'draft',
      widgets: {
        ...hudLayout.widgets,
        [activeWidgetId]: {
          ...widgetOverride,
          ...patch,
        },
      },
    });
  };

  const updateDockStyle = (patch: Partial<DevDockStyleConfig>) => {
    onUpdateLayout({
      ...hudLayout,
      status: 'draft',
      devDockStyle: {
        ...dock,
        ...patch,
      },
    });
  };

  const addDecorWidget = (
    kind: 'image' | 'badge',
    imageUrl?: string,
    text?: string,
    defaultBlend: CustomDecorWidget['blendMode'] = 'normal',
  ) => {
    const newId = `decor_${Date.now().toString().slice(-6)}`;
    const item: CustomDecorWidget = {
      id: newId,
      screen: currentScreen || 'ALL',
      themeId: activeThemeId || 'ALL',
      zLayer: 'foreground',
      kind,
      imageUrl,
      text: text || 'ORBIT',
      xPct: 50,
      yPct: 45,
      widthPx: kind === 'image' ? 180 : 140,
      heightPx: kind === 'image' ? 180 : 36,
      scale: 1,
      flipX: false,
      locked: false,
      opacity: 1,
      rotationDeg: 0,
      blendMode: defaultBlend,
    };
    onUpdateLayout({
      ...hudLayout,
      status: 'draft',
      customDecorWidgets: [...decors, item],
    });
    onSelectDecor?.(newId);
    if (!editModeActive) onToggleEditMode();
  };

  const updateDecor = (id: string, patch: Partial<CustomDecorWidget>) => {
    onUpdateLayout({
      ...hudLayout,
      status: 'draft',
      customDecorWidgets: decors.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    });
  };

  const moveDecorOrder = (id: string, delta: -1 | 1) => {
    const idx = decors.findIndex((d) => d.id === id);
    if (idx < 0) return;
    const nextIdx = idx + delta;
    if (nextIdx < 0 || nextIdx >= decors.length) return;
    const copy = [...decors];
    const [removed] = copy.splice(idx, 1);
    copy.splice(nextIdx, 0, removed);
    onUpdateLayout({
      ...hudLayout,
      status: 'draft',
      customDecorWidgets: copy,
    });
  };

  const duplicateDecor = (d: CustomDecorWidget) => {
    const newId = `decor_${Date.now().toString().slice(-6)}`;
    const clone: CustomDecorWidget = {
      ...d,
      id: newId,
      xPct: Math.min(95, d.xPct + 4),
      yPct: Math.min(95, d.yPct + 4),
      locked: false,
    };
    onUpdateLayout({
      ...hudLayout,
      status: 'draft',
      customDecorWidgets: [...decors, clone],
    });
    onSelectDecor?.(newId);
  };

  return (
    <div className="space-y-3 text-xs text-slate-200">
      {/* Live Edit Mode Banner */}
      <div className="border border-[#38BDF8]/40 bg-slate-800/85 p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-[#38BDF8]">
            <LayoutGrid className="h-3.5 w-3.5" /> Live Stage &amp; PNG Layout
          </span>
          <button
            type="button"
            onClick={onSafeResetLayout}
            className="flex items-center gap-1 border border-rose-500/40 bg-rose-950/40 px-2 py-0.5 text-[10px] font-bold text-rose-300 hover:bg-rose-900/50 cursor-pointer"
          >
            <RotateCcw className="h-2.5 w-2.5" /> Safe Reset All
          </button>
        </div>

        <button
          type="button"
          onClick={onToggleEditMode}
          className={`w-full border py-2 font-bold cursor-pointer transition-colors ${
            editModeActive
              ? 'border-[#38BDF8] bg-[#38BDF8] text-slate-950'
              : 'border-[#38BDF8]/50 bg-[#38BDF8]/15 text-[#38BDF8] hover:bg-[#38BDF8]/25'
          }`}
        >
          {editModeActive
            ? 'GIZMOS ON — Drag, Resize & Rotate PNGs/HUD'
            : 'Enable Live Edit Gizmos (Move / Resize / Rotate)'}
        </button>
      </div>

      {/* Stage PNGs & Custom Layer Stack */}
      <div className="border border-slate-700 bg-slate-800/65 p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] font-bold uppercase text-[#38BDF8]">
            Stage PNG Layers ({decors.length})
          </span>
          <button
            type="button"
            onClick={() => addDecorWidget('badge', undefined, 'ORBIT EDITION')}
            className="flex items-center gap-1 border border-slate-600 bg-slate-900 px-2 py-0.5 text-[10px] text-[#38BDF8] hover:border-[#38BDF8] cursor-pointer"
          >
            <Plus className="h-3 w-3" /> Text Badge
          </button>
        </div>

        <select
          value=""
          onChange={(e) => {
            const p = BUILTIN_STUDIO_PNGS.find((item) => item.id === e.target.value);
            if (p) addDecorWidget('image', p.url, p.name, 'normal');
          }}
          className="w-full border border-[#38BDF8]/40 bg-slate-900 px-2 py-1.5 text-[11px] font-semibold text-white"
        >
          <option value="">+ Place Built-In Game PNG ({BUILTIN_STUDIO_PNGS.length})...</option>
          {(['christmas', 'krampus', 'sakura', 'backdrops'] as const).map((pack) => (
            <optgroup key={pack} label={pack.toUpperCase()}>
              {BUILTIN_STUDIO_PNGS.filter((i) => i.pack === pack).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        {imageAssets.length > 0 && (
          <select
            value=""
            onChange={(e) => {
              const a = imageAssets.find((item) => item.id === e.target.value);
              if (a) addDecorWidget('image', a.dataUrlOrPath, a.name, 'normal');
            }}
            className="w-full border border-slate-600 bg-slate-900 px-2 py-1 text-[10px] text-slate-200"
          >
            <option value="">+ Place Uploaded Vault PNG...</option>
            {imageAssets.map((a) => (
              <option key={a.id} value={a.id}>
                /{a.folder}/{a.name}
              </option>
            ))}
          </select>
        )}

        {decors.length === 0 ? (
          <p className="border border-dashed border-slate-700 bg-slate-900/50 p-2.5 text-center text-[10px] text-slate-400">
            Select any PNG above or from the PNGs tab to place and arrange it visually on stage.
          </p>
        ) : (
          <div className="max-h-40 space-y-1 overflow-y-auto orbit-scroll pr-1">
            {decors.map((d, idx) => {
              const isSel = selectedDecor?.id === d.id;
              const depthTag =
                d.zLayer === 'background' ? 'BG' : d.zLayer === 'midground' ? 'MID' : 'FG';
              return (
                <div
                  key={d.id}
                  onClick={() => onSelectDecor?.(d.id)}
                  className={`flex items-center justify-between gap-1.5 border px-2 py-1.5 cursor-pointer ${
                    isSel
                      ? 'border-[#38BDF8] bg-[#38BDF8]/15 text-white'
                      : 'border-slate-700 bg-slate-900/75 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    {d.kind === 'image' && d.imageUrl ? (
                      <img
                        src={d.imageUrl}
                        alt=""
                        className="h-6 w-6 shrink-0 border border-slate-600 bg-black/50 object-contain"
                      />
                    ) : (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center border border-slate-600 bg-slate-950 font-mono text-[9px] text-[#38BDF8]">
                        TXT
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-bold">{d.text || d.id}</p>
                      <p className="font-mono text-[9px] text-slate-400">
                        {depthTag} · {d.screen} · {d.themeId || 'ALL'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        moveDecorOrder(d.id, -1);
                      }}
                      title="Move Layer Backward"
                      className="text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === decors.length - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        moveDecorOrder(d.id, 1);
                      }}
                      title="Move Layer Forward"
                      className="text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateDecor(d.id, { locked: !d.locked });
                      }}
                      title={d.locked ? 'Unlock Layer' : 'Lock Layer'}
                      className="text-slate-400 hover:text-amber-300 cursor-pointer"
                    >
                      {d.locked ? (
                        <Lock className="h-3 w-3 text-amber-400" />
                      ) : (
                        <Unlock className="h-3 w-3" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateDecor(d);
                      }}
                      title="Duplicate Layer"
                      className="text-slate-400 hover:text-sky-300 cursor-pointer"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateLayout({
                          ...hudLayout,
                          status: 'draft',
                          customDecorWidgets: decors.filter((item) => item.id !== d.id),
                        });
                        if (selectedDecorId === d.id) onSelectDecor?.(null);
                      }}
                      title="Remove Layer"
                      className="text-rose-400 hover:text-rose-200 cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Active Selected PNG Transform Inspector */}
        {selectedDecor && (
          <div className="border-t border-slate-700 pt-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase text-white truncate max-w-[190px]">
                Inspect: {selectedDecor.text || selectedDecor.id}
              </span>
              <button
                type="button"
                onClick={() =>
                  updateDecor(selectedDecor.id, {
                    xPct: 50,
                    yPct: 45,
                    scale: 1,
                    rotationDeg: 0,
                    opacity: 1,
                    flipX: false,
                  })
                }
                className="text-[10px] text-slate-400 hover:text-white cursor-pointer"
              >
                Reset Transform
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <label className="space-y-0.5">
                <span className="text-[9px] text-slate-400">Screen</span>
                <select
                  value={selectedDecor.screen}
                  onChange={(e) =>
                    updateDecor(selectedDecor.id, {
                      screen: e.target.value as CustomDecorWidget['screen'],
                    })
                  }
                  className="w-full border border-slate-600 bg-slate-950 px-1 py-1 text-[10px] text-white"
                >
                  {SCREEN_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-0.5">
                <span className="text-[9px] text-slate-400">Theme</span>
                <select
                  value={selectedDecor.themeId || 'ALL'}
                  onChange={(e) =>
                    updateDecor(selectedDecor.id, {
                      themeId: e.target.value as ThemeId | 'ALL',
                    })
                  }
                  className="w-full border border-slate-600 bg-slate-950 px-1 py-1 text-[10px] text-white"
                >
                  <option value="ALL">All Themes</option>
                  {allThemeIds.map((tid) => (
                    <option key={tid} value={tid}>
                      {themesMap[tid]?.label || CHASSIS_THEMES[tid]?.label || tid}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-0.5">
                <span className="text-[9px] text-slate-400">Depth Layer</span>
                <select
                  value={selectedDecor.zLayer || 'foreground'}
                  onChange={(e) =>
                    updateDecor(selectedDecor.id, {
                      zLayer: e.target.value as CustomDecorWidget['zLayer'],
                    })
                  }
                  className="w-full border border-slate-600 bg-slate-950 px-1 py-1 text-[10px] text-white"
                >
                  <option value="background">Background</option>
                  <option value="midground">Midground</option>
                  <option value="foreground">Foreground</option>
                </select>
              </label>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              <label className="space-y-0.5">
                <span className="text-[9px] text-slate-400">X (%)</span>
                <input
                  type="number"
                  step={0.5}
                  min={0}
                  max={100}
                  value={selectedDecor.xPct}
                  onChange={(e) =>
                    updateDecor(selectedDecor.id, { xPct: Number(e.target.value) || 0 })
                  }
                  className="tabular-nums w-full border border-slate-600 bg-slate-950 px-1.5 py-0.5 text-[10px] text-white"
                />
              </label>
              <label className="space-y-0.5">
                <span className="text-[9px] text-slate-400">Y (%)</span>
                <input
                  type="number"
                  step={0.5}
                  min={0}
                  max={100}
                  value={selectedDecor.yPct}
                  onChange={(e) =>
                    updateDecor(selectedDecor.id, { yPct: Number(e.target.value) || 0 })
                  }
                  className="tabular-nums w-full border border-slate-600 bg-slate-950 px-1.5 py-0.5 text-[10px] text-white"
                />
              </label>
              <label className="space-y-0.5">
                <span className="text-[9px] text-slate-400">W (px)</span>
                <input
                  type="number"
                  min={20}
                  max={960}
                  value={selectedDecor.widthPx}
                  onChange={(e) =>
                    updateDecor(selectedDecor.id, {
                      widthPx: Math.max(20, Number(e.target.value) || 80),
                    })
                  }
                  className="tabular-nums w-full border border-slate-600 bg-slate-950 px-1.5 py-0.5 text-[10px] text-white"
                />
              </label>
              <label className="space-y-0.5">
                <span className="text-[9px] text-slate-400">H (px)</span>
                <input
                  type="number"
                  min={20}
                  max={960}
                  value={selectedDecor.heightPx}
                  onChange={(e) =>
                    updateDecor(selectedDecor.id, {
                      heightPx: Math.max(20, Number(e.target.value) || 80),
                    })
                  }
                  className="tabular-nums w-full border border-slate-600 bg-slate-950 px-1.5 py-0.5 text-[10px] text-white"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-0.5">
                <div className="flex justify-between text-[9px]">
                  <span className="text-slate-400">Scale</span>
                  <span className="tabular-nums text-white">
                    {(selectedDecor.scale ?? 1).toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min={0.25}
                  max={2.5}
                  step={0.05}
                  value={selectedDecor.scale ?? 1}
                  onChange={(e) =>
                    updateDecor(selectedDecor.id, { scale: Number(e.target.value) })
                  }
                  className="w-full accent-[#38BDF8]"
                />
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between text-[9px]">
                  <span className="text-slate-400">Rotate</span>
                  <span className="tabular-nums text-white">
                    {Math.round(selectedDecor.rotationDeg)}°
                  </span>
                </div>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  step={1}
                  value={selectedDecor.rotationDeg}
                  onChange={(e) =>
                    updateDecor(selectedDecor.id, { rotationDeg: Number(e.target.value) })
                  }
                  className="w-full accent-[#38BDF8]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-0.5">
                <div className="flex justify-between text-[9px]">
                  <span className="text-slate-400">Opacity</span>
                  <span className="tabular-nums text-white">
                    {Math.round(selectedDecor.opacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.05}
                  max={1}
                  step={0.05}
                  value={selectedDecor.opacity}
                  onChange={(e) =>
                    updateDecor(selectedDecor.id, { opacity: Number(e.target.value) })
                  }
                  className="w-full accent-[#38BDF8]"
                />
              </div>
              <label className="space-y-0.5">
                <span className="text-[9px] text-slate-400">Blend</span>
                <select
                  value={selectedDecor.blendMode || 'normal'}
                  onChange={(e) =>
                    updateDecor(selectedDecor.id, {
                      blendMode: e.target.value as CustomDecorWidget['blendMode'],
                    })
                  }
                  className="w-full border border-slate-600 bg-slate-950 px-1 py-1 text-[10px] text-white"
                >
                  <option value="normal">Normal</option>
                  <option value="screen">Screen (Glow)</option>
                  <option value="lighten">Lighten</option>
                </select>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() =>
                  updateDecor(selectedDecor.id, { flipX: !selectedDecor.flipX })
                }
                className={`flex items-center justify-center gap-1 border py-1 text-[10px] font-bold cursor-pointer ${
                  selectedDecor.flipX
                    ? 'border-[#38BDF8] bg-[#38BDF8]/25 text-white'
                    : 'border-slate-600 bg-slate-900 text-slate-300'
                }`}
              >
                <FlipHorizontal2 className="h-3 w-3" />
                <span>Flip X</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  updateDecor(selectedDecor.id, { locked: !selectedDecor.locked })
                }
                className={`flex items-center justify-center gap-1 border py-1 text-[10px] font-bold cursor-pointer ${
                  selectedDecor.locked
                    ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                    : 'border-slate-600 bg-slate-900 text-slate-300'
                }`}
              >
                {selectedDecor.locked ? (
                  <>
                    <Lock className="h-3 w-3" />
                    <span>Locked</span>
                  </>
                ) : (
                  <>
                    <Unlock className="h-3 w-3" />
                    <span>Unlocked</span>
                  </>
                )}
              </button>
            </div>

            {selectedDecor.kind === 'badge' && (
              <input
                type="text"
                value={selectedDecor.text || ''}
                onChange={(e) => updateDecor(selectedDecor.id, { text: e.target.value })}
                className="w-full border border-slate-600 bg-slate-950 px-2 py-1 text-[10px] text-white"
                placeholder="Badge label..."
              />
            )}
          </div>
        )}
      </div>

      {/* Built-In HUD Slot Inspector */}
      <div className="border border-slate-700 bg-slate-800/65 p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] font-bold uppercase text-slate-400">
            Selected UI / HUD Slot
          </span>
          <button
            type="button"
            onClick={() =>
              updateWidget({
                xOffsetPx: 0,
                yOffsetPx: 0,
                scale: 1,
                opacity: 1,
                visible: true,
                bgColor: undefined,
                borderColor: undefined,
              })
            }
            className="text-[10px] text-slate-300 hover:text-white cursor-pointer"
          >
            Reset Element
          </button>
        </div>

        <select
          value={activeWidgetId}
          onChange={(e) => onSelectWidget(e.target.value)}
          className="w-full border border-slate-600 bg-slate-900 px-2 py-1.5 font-semibold text-white"
        >
          {WIDGET_CATALOG.map((w) => (
            <option key={w.widgetId} value={w.widgetId}>
              {w.label}
            </option>
          ))}
        </select>

        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-0.5">
            <span className="text-[10px] text-slate-400">X Offset (px)</span>
            <input
              type="number"
              value={widgetOverride.xOffsetPx}
              onChange={(e) => updateWidget({ xOffsetPx: Number(e.target.value) || 0 })}
              className="tabular-nums w-full border border-slate-600 bg-slate-900 px-2 py-1 text-white"
            />
          </label>
          <label className="space-y-0.5">
            <span className="text-[10px] text-slate-400">Y Offset (px)</span>
            <input
              type="number"
              value={widgetOverride.yOffsetPx}
              onChange={(e) => updateWidget({ yOffsetPx: Number(e.target.value) || 0 })}
              className="tabular-nums w-full border border-slate-600 bg-slate-900 px-2 py-1 text-white"
            />
          </label>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[10px]">
            <span className="text-slate-400">Scale</span>
            <span className="tabular-nums font-mono text-white">
              {widgetOverride.scale.toFixed(2)}x
            </span>
          </div>
          <input
            type="range"
            min={0.5}
            max={1.8}
            step={0.05}
            value={widgetOverride.scale}
            onChange={(e) => updateWidget({ scale: Number(e.target.value) })}
            className="w-full accent-[#38BDF8]"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[10px]">
            <span className="text-slate-400">Opacity</span>
            <span className="tabular-nums font-mono text-white">
              {Math.round(widgetOverride.opacity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0.1}
            max={1.0}
            step={0.05}
            value={widgetOverride.opacity}
            onChange={(e) => updateWidget({ opacity: Number(e.target.value) })}
            className="w-full accent-[#38BDF8]"
          />
        </div>

        <button
          type="button"
          onClick={() => updateWidget({ visible: !widgetOverride.visible })}
          className={`flex w-full items-center justify-center gap-1.5 border py-1.5 font-bold cursor-pointer ${
            widgetOverride.visible
              ? 'border-slate-600 bg-slate-900 text-white'
              : 'border-rose-500/50 bg-rose-950/50 text-rose-300'
          }`}
        >
          {widgetOverride.visible ? (
            <>
              <Eye className="h-3.5 w-3.5 text-emerald-400" /> Visible on Screen
            </>
          ) : (
            <>
              <EyeOff className="h-3.5 w-3.5 text-rose-400" /> Hidden (Click to Restore)
            </>
          )}
        </button>
      </div>

      {/* Customize Axiom Dev Menu Itself */}
      <div className="border border-slate-700 bg-slate-800/65 p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase text-[#38BDF8]">
            <Sliders className="h-3 w-3" /> Customize Dev Menu Appearance
          </span>
          <button
            type="button"
            onClick={() => updateDockStyle(DEFAULT_HUD_LAYOUT.devDockStyle)}
            className="text-[10px] text-slate-300 hover:text-white cursor-pointer"
          >
            Reset Dock
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {(['left', 'right', 'top'] as const).map((pos) => (
            <button
              key={pos}
              type="button"
              onClick={() => updateDockStyle({ position: pos })}
              className={`border py-1 font-mono text-[10px] uppercase cursor-pointer ${
                dock.position === pos
                  ? 'border-[#38BDF8] bg-[#38BDF8]/25 text-white'
                  : 'border-slate-600 bg-slate-900 text-slate-400'
              }`}
            >
              {pos}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center justify-between border border-slate-700 bg-slate-900 px-2 py-1">
            <span className="text-[10px] text-slate-300">Accent</span>
            <input
              type="color"
              value={dock.accentColor}
              onChange={(e) => updateDockStyle({ accentColor: e.target.value })}
              className="h-5 w-7 cursor-pointer bg-transparent"
            />
          </label>
          <label className="flex items-center gap-1.5 border border-slate-700 bg-slate-900 px-2 py-1 cursor-pointer">
            <input
              type="checkbox"
              checked={dock.compact}
              onChange={(e) => updateDockStyle({ compact: e.target.checked })}
              className="accent-[#38BDF8]"
            />
            <span className="text-[10px] text-slate-200">Compact Dock</span>
          </label>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[10px]">
            <span className="text-slate-400">Dock Opacity</span>
            <span className="tabular-nums font-mono text-white">
              {Math.round(dock.opacity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0.5}
            max={1.0}
            step={0.05}
            value={dock.opacity}
            onChange={(e) => updateDockStyle({ opacity: Number(e.target.value) })}
            className="w-full accent-[#38BDF8]"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[10px]">
            <span className="text-slate-400">Glass Blur</span>
            <span className="tabular-nums font-mono text-white">{dock.blurPx}px</span>
          </div>
          <input
            type="range"
            min={0}
            max={24}
            step={2}
            value={dock.blurPx}
            onChange={(e) => updateDockStyle({ blurPx: Number(e.target.value) })}
            className="w-full accent-[#38BDF8]"
          />
        </div>
      </div>
    </div>
  );
};
