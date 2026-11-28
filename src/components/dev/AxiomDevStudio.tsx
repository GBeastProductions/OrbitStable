import React, { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CloudUpload,
  Eye,
  EyeOff,
  Flame,
  FolderKanban,
  Layers,
  LayoutGrid,
  Lock,
  Monitor,
  Move,
  Music,
  Palette,
  PanelLeft,
  Redo2,
  RotateCcw,
  Trash2,
  Undo2,
  Unlock,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { DEFAULT_DEV_DOCK_STYLE, WIDGET_CATALOG } from '../../store/studioRegistryStore';
import {
  CustomDecorWidget,
  DevAssetItem,
  EditableThemePayload,
  GameScreen,
  PlayerProfile,
  PublishedHudLayout,
  SongDefinition,
  ThemeId,
} from '../../types/game';
import { AssetVaultPanel } from './AssetVaultPanel';
import { HudLayoutPanel } from './HudLayoutPanel';
import { OverdriveStudioPanel } from './OverdriveStudioPanel';
import { PublishSyncPanel } from './PublishSyncPanel';
import { SongForgePanel } from './SongForgePanel';
import { ThemeSculptorPanel } from './ThemeSculptorPanel';

export type DevToolTabId =
  | 'themes'
  | 'overdrive'
  | 'songs'
  | 'assets'
  | 'layout'
  | 'publish';

interface AxiomDevStudioProps {
  open: boolean;
  onToggleOpen: (open: boolean) => void;
  activeTab: DevToolTabId;
  onSelectTab: (tab: DevToolTabId) => void;
  currentScreen?: GameScreen;
  onSwitchScreen?: (screen: GameScreen) => void;
  profile: PlayerProfile;
  themesMap: Record<string, EditableThemePayload>;
  songs: SongDefinition[];
  selectedSongId: string;
  hudLayout: PublishedHudLayout;
  assets: DevAssetItem[];
  editModeActive: boolean;
  selectedWidgetId: string | null;
  selectedDecorId?: string | null;
  previewCharge: number | null;
  previewActive: boolean;
  draftSongsCount: number;
  draftThemesCount: number;
  hasDraftHud: boolean;
  draftAssetsCount: number;
  exportSongs: SongDefinition[];
  exportThemes: EditableThemePayload[];
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onToggleEditMode: () => void;
  onSelectWidget: (widgetId: string) => void;
  onSelectDecor?: (decorId: string | null) => void;
  onUpdateHudLayout: (next: PublishedHudLayout) => void;
  onSafeResetLayout: () => void;
  onSaveThemeDraft: (theme: EditableThemePayload) => void;
  onResetBuiltInTheme: (id: ThemeId) => void;
  onApplyPlayerTheme: (id: ThemeId) => void;
  onSaveSongDraft: (song: SongDefinition) => void;
  onSelectSong: (songId: string) => void;
  onPlaytestSong: (song: SongDefinition, startOffsetSec?: number) => void;
  onUpsertAsset: (asset: DevAssetItem) => void;
  onDeleteAsset: (assetId: string) => void;
  onPlaceDecorFromAsset?: (asset: DevAssetItem) => void;
  onChangePreviewCharge: (val: number | null) => void;
  onTogglePreviewActive: (active: boolean) => void;
  onPublishAllCloud: () => Promise<string>;
  onDiscardDrafts: () => void;
}

const TOOL_TABS: {
  id: DevToolTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'themes', label: 'Themes', icon: Palette },
  { id: 'overdrive', label: 'Overdrive', icon: Flame },
  { id: 'songs', label: 'Songs', icon: Music },
  { id: 'assets', label: 'PNGs', icon: FolderKanban },
  { id: 'layout', label: 'Layout', icon: LayoutGrid },
  { id: 'publish', label: 'Push', icon: CloudUpload },
];

const SCREEN_VIEWS: { id: GameScreen; label: string }[] = [
  { id: 'TITLE', label: 'Title' },
  { id: 'SONG_SELECT', label: 'Tracks' },
  { id: 'PLAYING', label: 'Stage' },
  { id: 'SHOP', label: 'Shop' },
  { id: 'INDEX', label: 'Index' },
  { id: 'SETTINGS', label: 'Settings' },
];

export const AxiomDevStudio: React.FC<AxiomDevStudioProps> = (props) => {
  const {
    open,
    onToggleOpen,
    activeTab,
    onSelectTab,
    currentScreen,
    onSwitchScreen,
    profile,
    themesMap,
    songs,
    selectedSongId,
    hudLayout,
    assets,
    editModeActive,
    selectedWidgetId,
    selectedDecorId,
    previewCharge,
    previewActive,
    canUndo = false,
    canRedo = false,
    onUndo,
    onRedo,
    onToggleEditMode,
    onSafeResetLayout,
  } = props;

  const [editThemeId, setEditThemeId] = useState<ThemeId>(profile.theme);
  const [workspaceMode, setWorkspaceMode] = useState<'engine' | 'overlay'>('engine');
  const [showHierarchy, setShowHierarchy] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1120 : true,
  );
  const [showInspector, setShowInspector] = useState(true);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'F8') {
        e.preventDefault();
        onToggleOpen(!open);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onToggleOpen]);

  const dock = hudLayout.devDockStyle || DEFAULT_DEV_DOCK_STYLE;
  const totalDrafts =
    props.draftSongsCount +
    props.draftThemesCount +
    (props.hasDraftHud ? 1 : 0) +
    props.draftAssetsCount;

  // No bottom-left floating DEV STUDIO launcher; launched strictly from Title / Settings buttons or F8
  if (!open) {
    return null;
  }

  const placeAssetOnStage = (asset: DevAssetItem) => {
    if (props.onPlaceDecorFromAsset) {
      props.onPlaceDecorFromAsset(asset);
      setShowInspector(true);
      return;
    }
    const newId = `decor_${Date.now().toString().slice(-6)}`;
    const nextItem: CustomDecorWidget = {
      id: newId,
      screen: currentScreen || 'ALL',
      themeId: profile.theme,
      zLayer: 'foreground',
      kind: 'image',
      imageUrl: asset.dataUrlOrPath,
      text: asset.name,
      xPct: 50,
      yPct: 45,
      widthPx: 180,
      heightPx: 180,
      scale: 1,
      flipX: false,
      locked: false,
      opacity: 1,
      rotationDeg: 0,
      blendMode: 'normal',
    };
    props.onUpdateHudLayout({
      ...hudLayout,
      status: 'draft',
      customDecorWidgets: [...(hudLayout.customDecorWidgets || []), nextItem],
    });
    props.onSelectDecor?.(newId);
    onSelectTab('layout');
    setShowInspector(true);
    if (!editModeActive) onToggleEditMode();
  };

  const assignAssetToOverdrive = (asset: DevAssetItem) => {
    const theme = themesMap[profile.theme] || Object.values(themesMap)[0];
    if (!theme) return;
    const nextLayers = [
      ...(theme.overdriveLayers || []),
      {
        id: `od_${Date.now().toString().slice(-6)}`,
        name: asset.name.replace(/\.[^.]+$/, ''),
        imageUrl: asset.dataUrlOrPath,
        anchor: 'bottom_border' as const,
        animation: 'flame_rise' as const,
        blendMode: 'screen' as const,
        opacity: 0.9,
        scale: 1,
        speed: 1,
        buildupMinOpacity: 0.14,
        eruptBoost: 1.25,
        enabled: true,
      },
    ];
    props.onSaveThemeDraft({ ...theme, status: 'draft', overdriveLayers: nextLayers });
    onSelectTab('overdrive');
    if (previewCharge === null) props.onChangePreviewCharge(0.85);
  };

  const assignAssetToThemeBackdrop = (asset: DevAssetItem) => {
    const theme = themesMap[editThemeId] || themesMap[profile.theme];
    if (!theme) return;
    props.onSaveThemeDraft({
      ...theme,
      status: 'draft',
      isTransformationSkin: true,
      manifest: {
        ...theme.manifest,
        isFullTransformation: true,
        backdropImageUrl: asset.dataUrlOrPath,
      },
    });
    onSelectTab('themes');
  };

  const assignAssetToThemeOrnament = (asset: DevAssetItem) => {
    const theme = themesMap[editThemeId] || themesMap[profile.theme];
    if (!theme) return;
    props.onSaveThemeDraft({
      ...theme,
      status: 'draft',
      isTransformationSkin: true,
      manifest: {
        ...theme.manifest,
        isFullTransformation: true,
        ornamentImageUrl: asset.dataUrlOrPath,
      },
    });
    onSelectTab('themes');
  };

  const activeThemePayload = themesMap[profile.theme];
  const visibleWidgets = WIDGET_CATALOG.filter(
    (w) => !currentScreen || w.screen === currentScreen || w.screen === 'GLOBAL',
  );
  const stageDecorList = (hudLayout.customDecorWidgets || []).filter(
    (d) =>
      (!currentScreen || d.screen === 'ALL' || d.screen === currentScreen) &&
      (!d.themeId || d.themeId === 'ALL' || d.themeId === profile.theme),
  );

  const toggleWidgetVisible = (widgetId: string) => {
    const prev = hudLayout.widgets[widgetId] || {
      widgetId,
      xOffsetPx: 0,
      yOffsetPx: 0,
      scale: 1,
      opacity: 1,
      visible: true,
    };
    props.onUpdateHudLayout({
      ...hudLayout,
      status: 'draft',
      widgets: {
        ...hudLayout.widgets,
        [widgetId]: { ...prev, visible: !prev.visible },
      },
    });
  };

  const toggleDecorLock = (decorId: string) => {
    props.onUpdateHudLayout({
      ...hudLayout,
      status: 'draft',
      customDecorWidgets: (hudLayout.customDecorWidgets || []).map((d) =>
        d.id === decorId ? { ...d, locked: !d.locked } : d,
      ),
    });
  };

  const removeDecor = (decorId: string) => {
    props.onUpdateHudLayout({
      ...hudLayout,
      status: 'draft',
      customDecorWidgets: (hudLayout.customDecorWidgets || []).filter((d) => d.id !== decorId),
    });
    if (selectedDecorId === decorId) props.onSelectDecor?.(null);
  };

  const inspectorBody = (
    <div className="orbit-scroll flex-1 overflow-y-auto p-3">
      {activeTab === 'themes' && (
        <ThemeSculptorPanel
          themesMap={themesMap}
          selectedThemeId={editThemeId}
          activePlayerTheme={profile.theme}
          assets={assets}
          onSelectEditTheme={setEditThemeId}
          onApplyPlayerTheme={props.onApplyPlayerTheme}
          onSaveThemeDraft={props.onSaveThemeDraft}
          onResetBuiltInTheme={props.onResetBuiltInTheme}
        />
      )}

      {activeTab === 'overdrive' && (
        <OverdriveStudioPanel
          themesMap={themesMap}
          activePlayerTheme={profile.theme}
          assets={assets}
          previewCharge={previewCharge}
          previewActive={previewActive}
          onChangePreviewCharge={props.onChangePreviewCharge}
          onTogglePreviewActive={props.onTogglePreviewActive}
          onSaveThemeDraft={props.onSaveThemeDraft}
          onApplyPlayerTheme={props.onApplyPlayerTheme}
        />
      )}

      {activeTab === 'songs' && (
        <SongForgePanel
          songs={songs}
          selectedSongId={selectedSongId}
          assets={assets}
          profile={profile}
          onSaveSongDraft={props.onSaveSongDraft}
          onSelectSong={props.onSelectSong}
          onPlaytestSong={props.onPlaytestSong}
        />
      )}

      {activeTab === 'assets' && (
        <AssetVaultPanel
          assets={assets}
          onUpsertAsset={props.onUpsertAsset}
          onDeleteAsset={props.onDeleteAsset}
          onPlaceDecorFromAsset={placeAssetOnStage}
          onAssignToOverdrive={assignAssetToOverdrive}
          onAssignToThemeBackdrop={assignAssetToThemeBackdrop}
          onAssignToThemeOrnament={assignAssetToThemeOrnament}
        />
      )}

      {activeTab === 'layout' && (
        <HudLayoutPanel
          hudLayout={hudLayout}
          editModeActive={editModeActive}
          selectedWidgetId={selectedWidgetId}
          selectedDecorId={selectedDecorId}
          currentScreen={currentScreen}
          activeThemeId={profile.theme}
          themesMap={themesMap}
          assets={assets}
          onToggleEditMode={onToggleEditMode}
          onSelectWidget={props.onSelectWidget}
          onSelectDecor={props.onSelectDecor}
          onUpdateLayout={props.onUpdateHudLayout}
          onSafeResetLayout={onSafeResetLayout}
        />
      )}

      {activeTab === 'publish' && (
        <PublishSyncPanel
          draftSongsCount={props.draftSongsCount}
          draftThemesCount={props.draftThemesCount}
          hasDraftHud={props.hasDraftHud}
          draftAssetsCount={props.draftAssetsCount}
          exportSongs={props.exportSongs}
          exportThemes={props.exportThemes}
          hudLayout={hudLayout}
          assets={assets}
          onPublishAllCloud={props.onPublishAllCloud}
          onDiscardDrafts={props.onDiscardDrafts}
        />
      )}
    </div>
  );

  // Floating Overlay Mode (compact single-side inspector)
  if (workspaceMode === 'overlay') {
    return (
      <>
        <nav
          aria-label="Axiom Dev Tool Rail"
          className="fixed left-3 top-1/2 -translate-y-1/2 z-[75] flex flex-col gap-1 border p-1.5 shadow-2xl"
          style={{
            backgroundColor: dock.bgColor,
            borderColor: dock.borderColor,
            opacity: dock.opacity,
            backdropFilter: `blur(${dock.blurPx}px)`,
          }}
        >
          {TOOL_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`flex h-11 w-12 flex-col items-center justify-center gap-0.5 border cursor-pointer ${
                  active
                    ? 'bg-[#38BDF8] border-[#38BDF8] text-slate-950 font-bold'
                    : 'border-transparent text-slate-300 hover:border-slate-600 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="font-mono text-[8px] uppercase leading-none">{tab.label}</span>
              </button>
            );
          })}
          <div className="my-1 h-px bg-slate-700" />
          <button
            type="button"
            onClick={() => setWorkspaceMode('engine')}
            title="Switch to Full Game Engine Workspace"
            className="flex h-10 w-12 flex-col items-center justify-center border border-white/40 bg-black text-white hover:bg-white hover:text-black cursor-pointer"
          >
            <Monitor className="h-3.5 w-3.5" />
            <span className="font-mono text-[7px] uppercase">ENGINE</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleOpen(false)}
            className="flex h-9 w-12 items-center justify-center border border-slate-700 bg-slate-900 text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </nav>

        <aside
          aria-label="Axiom Dev Inspector"
          className="fixed left-[72px] top-4 bottom-4 z-[74] flex w-[min(90vw,390px)] flex-col border shadow-2xl"
          style={{
            backgroundColor: dock.bgColor,
            borderColor: dock.borderColor,
            opacity: dock.opacity,
            backdropFilter: `blur(${dock.blurPx}px)`,
          }}
        >
          <header className="flex items-center justify-between gap-2 border-b border-slate-700 px-3.5 py-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <Wrench className="h-4 w-4 shrink-0 text-[#38BDF8]" />
              <h2 className="truncate font-mono text-xs font-extrabold uppercase tracking-wider text-white">
                ORBIT AXIOM STUDIO
              </h2>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {onUndo && (
                <button
                  type="button"
                  disabled={!canUndo}
                  onClick={onUndo}
                  title="Undo (Ctrl+Z)"
                  className="border border-slate-700 bg-slate-900 p-1 text-slate-300 hover:text-white disabled:opacity-35 cursor-pointer"
                >
                  <Undo2 className="h-3.5 w-3.5" />
                </button>
              )}
              {onRedo && (
                <button
                  type="button"
                  disabled={!canRedo}
                  onClick={onRedo}
                  title="Redo (Ctrl+Shift+Z)"
                  className="border border-slate-700 bg-slate-900 p-1 text-slate-300 hover:text-white disabled:opacity-35 cursor-pointer"
                >
                  <Redo2 className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => onToggleOpen(false)}
                className="border border-slate-700 bg-slate-900 p-1 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </header>
          {inspectorBody}
        </aside>
      </>
    );
  }

  // Full 3-Pane Collapsible Game Engine View
  return (
    <>
      {/* TOP ENGINE TOOLBAR */}
      <header className="fixed inset-x-0 top-0 z-[76] flex h-11 items-center justify-between gap-2 border-b border-white/25 bg-[#050608]/95 px-2.5 backdrop-blur-md">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex items-center gap-1.5 border border-white bg-black px-2.5 py-1 font-mono text-[10px] font-black tracking-widest text-white whitespace-nowrap">
            <Wrench className="h-3 w-3" />
            <span>ORBIT ENGINE</span>
          </span>

          <button
            type="button"
            onClick={() => setShowHierarchy((v) => !v)}
            title="Toggle Scene Hierarchy Panel"
            className={`hidden sm:flex items-center gap-1 border px-2 py-1 font-mono text-[10px] font-bold cursor-pointer whitespace-nowrap ${
              showHierarchy
                ? 'border-white/50 bg-white/15 text-white'
                : 'border-white/20 bg-black text-slate-400 hover:text-white'
            }`}
          >
            <PanelLeft className="h-3 w-3" />
            <span>Hierarchy</span>
          </button>

          {/* Undo / Redo History Controls */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              disabled={!canUndo}
              onClick={onUndo}
              title="Undo Accidental Change (Ctrl+Z)"
              className="flex items-center gap-1 border border-white/25 bg-black px-2 py-1 font-mono text-[10px] font-bold text-white hover:border-white disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
            >
              <Undo2 className="h-3 w-3" />
              <span className="hidden xl:inline">Undo</span>
            </button>
            <button
              type="button"
              disabled={!canRedo}
              onClick={onRedo}
              title="Redo Change (Ctrl+Shift+Z)"
              className="flex items-center gap-1 border border-white/25 bg-black px-2 py-1 font-mono text-[10px] font-bold text-white hover:border-white disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
            >
              <Redo2 className="h-3 w-3" />
              <span className="hidden xl:inline">Redo</span>
            </button>
          </div>

          {/* Live Screen Switcher */}
          {onSwitchScreen && (
            <div className="flex items-center gap-1 overflow-x-auto">
              {SCREEN_VIEWS.map((scr) => {
                const active = currentScreen === scr.id;
                return (
                  <button
                    key={scr.id}
                    type="button"
                    onClick={() => onSwitchScreen(scr.id)}
                    className={`border px-2 py-1 font-mono text-[10px] font-bold uppercase cursor-pointer whitespace-nowrap ${
                      active
                        ? 'border-white bg-white text-black'
                        : 'border-white/15 bg-black/70 text-slate-300 hover:border-white/45 hover:text-white'
                    }`}
                  >
                    {scr.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Center/Right Engine Quick Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Quick Overdrive Live Shader Test */}
          <div className="hidden lg:flex items-center gap-1.5 border border-white/15 bg-black/80 px-2 py-0.5">
            <Flame className="h-3 w-3 text-amber-400" />
            <input
              type="range"
              min={0}
              max={100}
              value={previewCharge === null ? 0 : Math.round(previewCharge * 100)}
              onChange={(e) => {
                const v = Number(e.target.value) / 100;
                props.onChangePreviewCharge(v <= 0.01 ? null : v);
              }}
              aria-label="Engine Overdrive Preview Level"
              className="w-16 accent-amber-400"
            />
            <button
              type="button"
              onClick={() => {
                if (previewCharge === null) props.onChangePreviewCharge(1);
                props.onTogglePreviewActive(!previewActive);
              }}
              className={`flex items-center gap-1 border px-1.5 py-0.5 font-mono text-[9px] font-black cursor-pointer ${
                previewActive
                  ? 'border-amber-300 bg-amber-400 text-black'
                  : 'border-amber-500/40 bg-amber-500/15 text-amber-300'
              }`}
            >
              <Zap className="h-2.5 w-2.5" />
              <span>ERUPT</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onToggleEditMode}
            className={`flex items-center gap-1 border px-2 py-1 font-mono text-[10px] font-bold cursor-pointer whitespace-nowrap ${
              editModeActive
                ? 'border-amber-300 bg-amber-400 text-black'
                : 'border-white/25 bg-black text-white hover:border-white'
            }`}
          >
            <Move className="h-3 w-3" />
            <span className="hidden md:inline">Gizmos</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectTab('publish');
              setShowInspector(true);
            }}
            className="flex items-center gap-1 border border-emerald-400/70 bg-emerald-500/20 px-2.5 py-1 font-mono text-[10px] font-bold text-emerald-200 hover:bg-emerald-500/35 cursor-pointer whitespace-nowrap"
          >
            <CloudUpload className="h-3 w-3" />
            <span>Push ({totalDrafts})</span>
          </button>

          <button
            type="button"
            onClick={() => setWorkspaceMode('overlay')}
            title="Switch to Compact Floating Dock"
            className="hidden sm:flex items-center border border-white/20 bg-black px-2 py-1 font-mono text-[10px] text-slate-300 hover:text-white cursor-pointer"
          >
            Dock
          </button>

          <button
            type="button"
            onClick={() => setShowInspector((v) => !v)}
            title="Toggle Right Inspector"
            className="flex items-center border border-white/20 bg-black p-1 text-slate-300 hover:text-white cursor-pointer"
          >
            {showInspector ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => onToggleOpen(false)}
            title="Exit Dev Studio (F8)"
            className="flex items-center gap-1 border border-white bg-white px-2 py-1 font-mono text-[10px] font-black text-black hover:bg-black hover:text-white cursor-pointer"
          >
            <X className="h-3 w-3" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </header>

      {/* LEFT SCENE HIERARCHY PANE */}
      {showHierarchy && (
        <aside
          aria-label="Scene Hierarchy"
          className="orbit-scroll fixed left-0 top-11 bottom-0 z-[74] flex w-60 flex-col border-r border-white/20 bg-[#080a0f]/94 backdrop-blur-md"
        >
          <div className="flex items-center justify-between border-b border-white/15 px-3 py-2">
            <span className="flex items-center gap-1.5 font-mono text-[10px] font-black uppercase tracking-wider text-white">
              <Layers className="h-3.5 w-3.5 text-[#38BDF8]" />
              <span>Hierarchy · {currentScreen || 'LIVE'}</span>
            </span>
          </div>

          <div className="orbit-scroll flex-1 overflow-y-auto p-2.5 space-y-3 text-xs">
            {/* Placed Individual Stage PNGs */}
            <div className="space-y-1">
              <div className="flex items-center justify-between px-1">
                <span className="font-mono text-[9px] font-bold uppercase text-[#38BDF8]">
                  Stage PNG Layers ({stageDecorList.length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onSelectTab('assets');
                    setShowInspector(true);
                  }}
                  className="font-mono text-[9px] font-bold text-slate-300 hover:text-[#38BDF8] cursor-pointer"
                >
                  + Browse PNGs
                </button>
              </div>

              {stageDecorList.length === 0 ? (
                <p className="border border-dashed border-white/10 bg-black/40 px-2 py-2 text-[10px] text-slate-400">
                  No custom PNGs placed on this screen. Open PNGs tab to place any sprite.
                </p>
              ) : (
                stageDecorList.map((d) => {
                  const isSel = selectedDecorId === d.id;
                  return (
                    <div
                      key={d.id}
                      className={`flex items-center justify-between gap-1 border px-2 py-1 ${
                        isSel
                          ? 'border-[#38BDF8] bg-[#38BDF8]/15 text-white'
                          : 'border-white/10 bg-black/50 text-slate-300 hover:border-white/30'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          props.onSelectDecor?.(d.id);
                          onSelectTab('layout');
                          setShowInspector(true);
                          if (!editModeActive) onToggleEditMode();
                        }}
                        className="flex min-w-0 flex-1 items-center gap-1.5 text-left font-mono text-[10px] cursor-pointer"
                      >
                        {d.kind === 'image' && d.imageUrl && (
                          <img
                            src={d.imageUrl}
                            alt=""
                            className="h-4 w-4 shrink-0 object-contain"
                          />
                        )}
                        <span className="truncate">{d.text || d.id}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleDecorLock(d.id)}
                        title={d.locked ? 'Unlock PNG' : 'Lock PNG'}
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
                        onClick={() => removeDecor(d.id)}
                        title="Remove PNG"
                        className="text-rose-400 hover:text-rose-200 cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="space-y-1 border-t border-white/10 pt-2">
              <span className="block px-1 font-mono text-[9px] font-bold uppercase text-slate-400">
                Active Screen Slots ({visibleWidgets.length})
              </span>
              {visibleWidgets.map((w) => {
                const ov = hudLayout.widgets[w.widgetId];
                const isVis = ov?.visible ?? true;
                const isSel = selectedWidgetId === w.widgetId;
                return (
                  <div
                    key={w.widgetId}
                    className={`flex items-center justify-between gap-1 border px-2 py-1.5 ${
                      isSel
                        ? 'border-[#38BDF8] bg-[#38BDF8]/15 text-white'
                        : 'border-white/10 bg-black/50 text-slate-300 hover:border-white/30'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        props.onSelectWidget(w.widgetId);
                        onSelectTab('layout');
                        setShowInspector(true);
                      }}
                      className="min-w-0 flex-1 truncate text-left font-mono text-[10px] cursor-pointer"
                    >
                      {w.label.split('·').pop()?.trim() || w.label}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleWidgetVisible(w.widgetId)}
                      title={isVis ? 'Hide Slot' : 'Show Slot'}
                      className="text-slate-400 hover:text-white cursor-pointer"
                    >
                      {isVis ? <Eye className="h-3 w-3 text-emerald-400" /> : <EyeOff className="h-3 w-3 text-rose-400" />}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="space-y-1 border-t border-white/10 pt-2">
              <span className="block px-1 font-mono text-[9px] font-bold uppercase text-slate-400">
                Render Layers ({profile.theme})
              </span>
              <button
                type="button"
                onClick={() => {
                  onSelectTab('themes');
                  setShowInspector(true);
                }}
                className="flex w-full items-center justify-between border border-white/10 bg-black/50 px-2 py-1.5 font-mono text-[10px] text-slate-200 hover:border-white/35 cursor-pointer"
              >
                <span>Skin &amp; Atmosphere GL2</span>
                <span className="text-[#38BDF8]">Edit</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelectTab('overdrive');
                  setShowInspector(true);
                }}
                className="flex w-full items-center justify-between border border-white/10 bg-black/50 px-2 py-1.5 font-mono text-[10px] text-slate-200 hover:border-white/35 cursor-pointer"
              >
                <span>Overdrive Shader GL2</span>
                <span className="text-amber-300">
                  {(activeThemePayload?.overdriveLayers?.length || 0)} FX
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelectTab('songs');
                  setShowInspector(true);
                }}
                className="flex w-full items-center justify-between border border-white/10 bg-black/50 px-2 py-1.5 font-mono text-[10px] text-slate-200 hover:border-white/35 cursor-pointer"
              >
                <span>Active Chart &amp; Audio</span>
                <span className="text-emerald-300">Open</span>
              </button>
            </div>
          </div>

          <div className="border-t border-white/15 p-2 flex items-center justify-between">
            <button
              type="button"
              onClick={onSafeResetLayout}
              className="flex items-center gap-1 font-mono text-[10px] text-slate-400 hover:text-white cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Safe Reset</span>
            </button>
            <span className="font-mono text-[9px] text-slate-500">Ctrl+Z · F8</span>
          </div>
        </aside>
      )}

      {/* RIGHT INSPECTOR PANE */}
      {showInspector && (
        <aside
          aria-label="Axiom Dev Inspector"
          className="fixed right-0 top-11 bottom-0 z-[74] flex w-[min(92vw,375px)] flex-col border-l border-white/20 bg-[#080a0f]/95 shadow-2xl backdrop-blur-md"
        >
          <div className="grid grid-cols-6 border-b border-white/15 bg-black/75">
            {TOOL_TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectTab(tab.id)}
                  className={`flex flex-col items-center justify-center gap-0.5 border-b-2 py-2 cursor-pointer transition-colors ${
                    active
                      ? 'border-white bg-white text-black font-black'
                      : 'border-transparent text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="font-mono text-[8px] uppercase leading-none">
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
          {inspectorBody}
        </aside>
      )}
    </>
  );
};
