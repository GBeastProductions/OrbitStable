import React, { useMemo } from 'react';
import { Eye, EyeOff, LayoutGrid, Plus, RotateCcw, Sliders, Trash2 } from 'lucide-react';
import {
  DEFAULT_DEV_DOCK_STYLE,
  DEFAULT_HUD_LAYOUT,
  WIDGET_CATALOG,
} from '../../store/studioRegistryStore';
import {
  CustomDecorWidget,
  DevAssetItem,
  DevDockStyleConfig,
  HudWidgetOverride,
  PublishedHudLayout,
} from '../../types/game';

interface HudLayoutPanelProps {
  hudLayout: PublishedHudLayout;
  editModeActive: boolean;
  selectedWidgetId: string | null;
  assets: DevAssetItem[];
  onToggleEditMode: () => void;
  onSelectWidget: (widgetId: string) => void;
  onUpdateLayout: (next: PublishedHudLayout) => void;
  onSafeResetLayout: () => void;
}

export const HudLayoutPanel: React.FC<HudLayoutPanelProps> = ({
  hudLayout,
  editModeActive,
  selectedWidgetId,
  assets,
  onToggleEditMode,
  onSelectWidget,
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

  const addDecorWidget = (kind: 'image' | 'badge', imageUrl?: string, text?: string) => {
    const item: CustomDecorWidget = {
      id: `decor_${Date.now().toString().slice(-6)}`,
      screen: 'ALL',
      kind,
      imageUrl,
      text: text || 'ORBIT',
      xPct: 50,
      yPct: 18,
      widthPx: kind === 'image' ? 140 : 120,
      heightPx: kind === 'image' ? 140 : 34,
      opacity: 0.9,
      rotationDeg: 0,
      blendMode: kind === 'image' ? 'screen' : 'normal',
    };
    onUpdateLayout({
      ...hudLayout,
      status: 'draft',
      customDecorWidgets: [...decors, item],
    });
  };

  const updateDecor = (id: string, patch: Partial<CustomDecorWidget>) => {
    onUpdateLayout({
      ...hudLayout,
      status: 'draft',
      customDecorWidgets: decors.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    });
  };

  return (
    <div className="space-y-3 text-xs text-slate-200">
      {/* Live Edit Mode Banner */}
      <div className="border border-[#38BDF8]/40 bg-slate-800/85 p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-[#38BDF8]">
            <LayoutGrid className="h-3.5 w-3.5" /> Live UI &amp; Dev Menu Layout
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
            ? 'LIVE EDIT MODE ON — Drag Widgets Directly On Screen'
            : 'Enable Live Edit Mode (Drag & Resize HUD)'}
        </button>
      </div>

      {/* Widget Inspector */}
      <div className="border border-slate-700 bg-slate-800/65 p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] font-bold uppercase text-slate-400">
            Selected HUD / UI Element
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

      {/* Custom Decor Overlays */}
      <div className="border border-slate-700 bg-slate-800/65 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] font-bold uppercase text-slate-400">
            Custom Stickers &amp; Badges ({decors.length})
          </span>
          <button
            type="button"
            onClick={() => addDecorWidget('badge', undefined, 'ORBIT EDITION')}
            className="flex items-center gap-1 border border-slate-600 bg-slate-900 px-2 py-0.5 text-[10px] text-[#38BDF8] cursor-pointer"
          >
            <Plus className="h-3 w-3" /> Badge
          </button>
        </div>

        {imageAssets.length > 0 && (
          <select
            value=""
            onChange={(e) => {
              const a = imageAssets.find((item) => item.id === e.target.value);
              if (a) addDecorWidget('image', a.dataUrlOrPath, a.name);
            }}
            className="w-full border border-slate-600 bg-slate-900 px-2 py-1 text-[10px] text-slate-200"
          >
            <option value="">+ Place Image Sticker from Asset Vault...</option>
            {imageAssets.map((a) => (
              <option key={a.id} value={a.id}>
                /{a.folder}/{a.name}
              </option>
            ))}
          </select>
        )}

        {decors.map((d) => (
          <div key={d.id} className="border border-slate-700 bg-slate-900/75 p-2 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-bold text-white">
                {d.kind === 'image' ? 'Image Sticker' : 'Text Badge'}: {d.text}
              </span>
              <button
                type="button"
                onClick={() =>
                  onUpdateLayout({
                    ...hudLayout,
                    status: 'draft',
                    customDecorWidgets: decors.filter((item) => item.id !== d.id),
                  })
                }
                className="text-rose-400 hover:text-rose-200 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <select
                value={d.screen}
                onChange={(e) =>
                  updateDecor(d.id, { screen: e.target.value as CustomDecorWidget['screen'] })
                }
                className="border border-slate-600 bg-slate-950 px-1 py-0.5 text-[10px] text-white"
              >
                <option value="ALL">All Screens</option>
                <option value="TITLE">Title</option>
                <option value="SONG_SELECT">Tracks</option>
                <option value="PLAYING">Stage</option>
              </select>
              <input
                type="number"
                value={d.widthPx}
                min={24}
                max={640}
                onChange={(e) => updateDecor(d.id, { widthPx: Number(e.target.value) || 80 })}
                className="tabular-nums border border-slate-600 bg-slate-950 px-1.5 py-0.5 text-[10px] text-white"
                title="Width px"
              />
              <input
                type="number"
                value={d.rotationDeg}
                min={-180}
                max={180}
                onChange={(e) => updateDecor(d.id, { rotationDeg: Number(e.target.value) || 0 })}
                className="tabular-nums border border-slate-600 bg-slate-950 px-1.5 py-0.5 text-[10px] text-white"
                title="Rotation deg"
              />
            </div>
            {d.kind === 'badge' && (
              <input
                type="text"
                value={d.text || ''}
                onChange={(e) => updateDecor(d.id, { text: e.target.value })}
                className="w-full border border-slate-600 bg-slate-950 px-2 py-0.5 text-[10px] text-white"
              />
            )}
          </div>
        ))}
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
