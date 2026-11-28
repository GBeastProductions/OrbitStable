import React, { createContext, useContext, useRef } from 'react';
import { Lock, Move, RotateCw } from 'lucide-react';
import {
  CustomDecorWidget,
  EditableThemePayload,
  HudWidgetOverride,
  ScreenView,
  ThemeId,
} from '../types/game';

interface StudioLayoutContextValue {
  widgets: Record<string, HudWidgetOverride>;
  customDecorWidgets: CustomDecorWidget[];
  activeThemeId: ThemeId;
  editModeActive: boolean;
  selectedWidgetId: string | null;
  selectedDecorId: string | null;
  onSelectWidget: (widgetId: string) => void;
  onSelectDecor: (decorId: string | null) => void;
  onUpdateWidgetOffset: (widgetId: string, xOffsetPx: number, yOffsetPx: number) => void;
  onUpdateDecorPos?: (decorId: string, xPct: number, yPct: number) => void;
  onUpdateDecor?: (decorId: string, patch: Partial<CustomDecorWidget>) => void;
  themesMap: Record<string, EditableThemePayload>;
}

const StudioLayoutContext = createContext<StudioLayoutContextValue>({
  widgets: {},
  customDecorWidgets: [],
  activeThemeId: 'tokyo_pink',
  editModeActive: false,
  selectedWidgetId: null,
  selectedDecorId: null,
  onSelectWidget: () => {},
  onSelectDecor: () => {},
  onUpdateWidgetOffset: () => {},
  themesMap: {},
});

export const StudioLayoutProvider: React.FC<{
  value: StudioLayoutContextValue;
  children: React.ReactNode;
}> = ({ value, children }) => (
  <StudioLayoutContext.Provider value={value}>{children}</StudioLayoutContext.Provider>
);

export function useStudioLayout(): StudioLayoutContextValue {
  return useContext(StudioLayoutContext);
}

interface StudioSlotProps {
  widgetId: string;
  label?: string;
  className?: string;
  children: React.ReactNode;
}

export const StudioSlot: React.FC<StudioSlotProps> = ({
  widgetId,
  label,
  className = '',
  children,
}) => {
  const {
    widgets,
    editModeActive,
    selectedWidgetId,
    onSelectWidget,
    onSelectDecor,
    onUpdateWidgetOffset,
  } = useStudioLayout();

  const override = widgets[widgetId];
  const isHidden = override?.visible === false;
  const dragStartRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  if (isHidden && !editModeActive) {
    return null;
  }

  const x = override?.xOffsetPx ?? 0;
  const y = override?.yOffsetPx ?? 0;
  const scale = override?.scale ?? 1;
  const opacity = isHidden ? 0.25 : override?.opacity ?? 1;
  const isSelected = editModeActive && selectedWidgetId === widgetId;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!editModeActive) return;
    e.stopPropagation();
    e.preventDefault();
    onSelectDecor(null);
    onSelectWidget(widgetId);
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStartRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origX: x,
      origY: y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!editModeActive || !dragStartRef.current) return;
    if (dragStartRef.current.pointerId !== e.pointerId) return;
    const dx = Math.round(e.clientX - dragStartRef.current.startX);
    const dy = Math.round(e.clientY - dragStartRef.current.startY);
    onUpdateWidgetOffset(widgetId, dragStartRef.current.origX + dx, dragStartRef.current.origY + dy);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    dragStartRef.current = null;
  };

  return (
    <div
      data-studio-widget={widgetId}
      className={`${className} ${
        editModeActive
          ? `relative cursor-grab active:cursor-grabbing select-none outline ${
              isSelected
                ? 'outline-2 outline-[#38BDF8] shadow-[0_0_0_4px_rgba(56,189,248,0.18)] z-40'
                : 'outline-1 outline-dashed outline-[#38BDF8]/55 hover:outline-[#38BDF8] z-30'
            }`
          : ''
      }`}
      style={{
        transform: x !== 0 || y !== 0 || scale !== 1 ? `translate(${x}px, ${y}px) scale(${scale})` : undefined,
        opacity,
        backgroundColor: override?.bgColor || undefined,
        borderColor: override?.borderColor || undefined,
        borderRadius:
          typeof override?.borderRadiusPx === 'number' ? `${override.borderRadiusPx}px` : undefined,
      }}
      onPointerDown={editModeActive ? handlePointerDown : undefined}
      onPointerMove={editModeActive ? handlePointerMove : undefined}
      onPointerUp={editModeActive ? handlePointerUp : undefined}
      onClickCapture={
        editModeActive
          ? (e) => {
              e.stopPropagation();
              e.preventDefault();
              onSelectDecor(null);
              onSelectWidget(widgetId);
            }
          : undefined
      }
    >
      {editModeActive && (
        <div className="pointer-events-none absolute -top-5 left-0 z-50 flex items-center gap-1 border border-[#38BDF8]/60 bg-[#0F172A]/95 px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#38BDF8] whitespace-nowrap shadow-sm">
          <Move className="h-2.5 w-2.5" />
          <span>{label || widgetId}</span>
          {isHidden && <span className="text-[#F43F5E]">(HIDDEN)</span>}
        </div>
      )}
      {children}
    </div>
  );
};

type DecorGizmoMode = 'move' | 'resize' | 'rotate';

const Z_LAYER_DEPTH_CLASS: Record<'background' | 'midground' | 'foreground', string> = {
  background: 'z-[4]',
  midground: 'z-[13]',
  foreground: 'z-[26]',
};

export const CustomDecorLayer: React.FC<{
  screen: ScreenView;
  activeThemeId?: ThemeId;
}> = ({ screen, activeThemeId: propThemeId }) => {
  const {
    customDecorWidgets,
    activeThemeId: ctxThemeId,
    editModeActive,
    selectedDecorId,
    onSelectDecor,
    onUpdateDecorPos,
    onUpdateDecor,
  } = useStudioLayout();

  const resolvedThemeId = propThemeId || ctxThemeId;

  const gizmoDragRef = useRef<{
    id: string;
    mode: DecorGizmoMode;
    pointerId: number;
    startX: number;
    startY: number;
    origXPct: number;
    origYPct: number;
    origW: number;
    origH: number;
    centerX: number;
    centerY: number;
    startPointerAngle: number;
    origRotDeg: number;
  } | null>(null);

  const visibleDecor = customDecorWidgets.filter((d) => {
    const screenMatch = d.screen === 'ALL' || d.screen === screen;
    const themeMatch = !d.themeId || d.themeId === 'ALL' || d.themeId === resolvedThemeId;
    return screenMatch && themeMatch;
  });

  if (visibleDecor.length === 0) return null;

  const applyPatch = (id: string, patch: Partial<CustomDecorWidget>) => {
    if (onUpdateDecor) {
      onUpdateDecor(id, patch);
    } else if (
      onUpdateDecorPos &&
      typeof patch.xPct === 'number' &&
      typeof patch.yPct === 'number'
    ) {
      onUpdateDecorPos(id, patch.xPct, patch.yPct);
    }
  };

  const startGizmoDrag = (
    e: React.PointerEvent<HTMLElement>,
    d: CustomDecorWidget,
    mode: DecorGizmoMode,
  ) => {
    if (!editModeActive) return;
    e.stopPropagation();
    e.preventDefault();
    onSelectDecor(d.id);
    if (d.locked) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    const vw = Math.max(1, window.innerWidth);
    const vh = Math.max(1, window.innerHeight);
    const centerX = (d.xPct / 100) * vw;
    const centerY = (d.yPct / 100) * vh;
    const startPointerAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);

    gizmoDragRef.current = {
      id: d.id,
      mode,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origXPct: d.xPct,
      origYPct: d.yPct,
      origW: d.widthPx,
      origH: d.heightPx,
      centerX,
      centerY,
      startPointerAngle,
      origRotDeg: d.rotationDeg,
    };
  };

  const moveGizmoDrag = (e: React.PointerEvent<HTMLElement>, d: CustomDecorWidget) => {
    const drag = gizmoDragRef.current;
    if (!editModeActive || !drag || drag.id !== d.id || drag.pointerId !== e.pointerId) return;

    if (drag.mode === 'move') {
      const dxPct = ((e.clientX - drag.startX) / Math.max(1, window.innerWidth)) * 100;
      const dyPct = ((e.clientY - drag.startY) / Math.max(1, window.innerHeight)) * 100;
      applyPatch(d.id, {
        xPct: Math.max(0, Math.min(100, Math.round((drag.origXPct + dxPct) * 10) / 10)),
        yPct: Math.max(0, Math.min(100, Math.round((drag.origYPct + dyPct) * 10) / 10)),
      });
    } else if (drag.mode === 'resize') {
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      const delta = Math.abs(dx) >= Math.abs(dy) ? dx : dy;
      const aspect = Math.max(0.25, drag.origH / Math.max(1, drag.origW));
      const nextW = Math.max(20, Math.min(960, Math.round(drag.origW + delta)));
      const nextH = Math.max(20, Math.min(960, Math.round(nextW * aspect)));
      applyPatch(d.id, { widthPx: nextW, heightPx: nextH });
    } else if (drag.mode === 'rotate') {
      const curAngle = Math.atan2(e.clientY - drag.centerY, e.clientX - drag.centerX);
      let deg = Math.round(drag.origRotDeg + ((curAngle - drag.startPointerAngle) * 180) / Math.PI);
      while (deg > 180) deg -= 360;
      while (deg < -180) deg += 360;
      applyPatch(d.id, { rotationDeg: deg });
    }
  };

  const endGizmoDrag = (e: React.PointerEvent<HTMLElement>) => {
    if (!gizmoDragRef.current) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    gizmoDragRef.current = null;
  };

  const renderDecorVisual = (d: CustomDecorWidget) => {
    const effScale = d.scale ?? 1;
    const scaleX = (d.flipX ? -1 : 1) * effScale;
    const mixBlend =
      d.blendMode === 'screen'
        ? 'screen'
        : d.blendMode === 'lighten'
        ? 'lighten'
        : 'normal';

    return (
      <div
        key={d.id}
        className="pointer-events-none"
        style={{
          position: 'absolute',
          left: `${d.xPct}%`,
          top: `${d.yPct}%`,
          width: `${d.widthPx}px`,
          height: `${d.heightPx}px`,
          opacity: d.opacity,
          transform: `translate(-50%, -50%) rotate(${d.rotationDeg}deg) scale(${scaleX}, ${effScale})`,
          mixBlendMode: mixBlend,
        }}
      >
        {d.kind === 'image' && d.imageUrl ? (
          <img
            src={d.imageUrl}
            alt={d.text || 'Stage PNG'}
            className="h-full w-full object-contain select-none"
            draggable={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center border border-[#38BDF8]/50 bg-[#0F172A]/85 px-2 text-center font-mono text-xs font-bold text-white shadow-lg">
            {d.text || 'ORBIT'}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {(['background', 'midground', 'foreground'] as const).map((layerKey) => {
        const layerItems = visibleDecor.filter(
          (d) => (d.zLayer || 'foreground') === layerKey,
        );
        if (layerItems.length === 0) return null;
        return (
          <div
            key={layerKey}
            aria-hidden={!editModeActive}
            className={`pointer-events-none fixed inset-0 overflow-hidden ${Z_LAYER_DEPTH_CLASS[layerKey]}`}
          >
            {layerItems.map(renderDecorVisual)}
          </div>
        );
      })}

      {/* Dedicated interactive gizmo overlay above all UI layers when Live Edit is active */}
      {editModeActive && (
        <div className="pointer-events-none fixed inset-0 z-[65] overflow-hidden">
          {visibleDecor.map((d) => {
            const effScale = d.scale ?? 1;
            const boxW = Math.max(24, d.widthPx * effScale);
            const boxH = Math.max(24, d.heightPx * effScale);
            const isSel = selectedDecorId === d.id;
            const isLocked = Boolean(d.locked);

            return (
              <div
                key={`gizmo_${d.id}`}
                onPointerDown={(e) => startGizmoDrag(e, d, 'move')}
                onPointerMove={(e) => moveGizmoDrag(e, d)}
                onPointerUp={endGizmoDrag}
                onPointerCancel={endGizmoDrag}
                className={`pointer-events-auto select-none transition-shadow ${
                  isLocked
                    ? 'cursor-not-allowed outline outline-1 outline-dashed outline-amber-400/70'
                    : isSel
                    ? 'cursor-move outline-2 outline-[#38BDF8] shadow-[0_0_0_4px_rgba(56,189,248,0.2)]'
                    : 'cursor-move outline-1 outline-dashed outline-[#38BDF8]/65 hover:outline-[#38BDF8]'
                }`}
                style={{
                  position: 'absolute',
                  left: `${d.xPct}%`,
                  top: `${d.yPct}%`,
                  width: `${boxW}px`,
                  height: `${boxH}px`,
                  transform: `translate(-50%, -50%) rotate(${d.rotationDeg}deg)`,
                }}
              >
                {/* Floating Transform Pill */}
                <div className="pointer-events-none absolute -top-6 left-0 flex items-center gap-1 border border-[#38BDF8]/75 bg-[#050811]/95 px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#38BDF8] whitespace-nowrap shadow">
                  {isLocked ? (
                    <Lock className="h-2.5 w-2.5 text-amber-400" />
                  ) : (
                    <Move className="h-2.5 w-2.5" />
                  )}
                  <span className="max-w-[110px] truncate text-white">{d.text || d.id}</span>
                  <span className="text-slate-400">
                    {Math.round(d.xPct)}%,{Math.round(d.yPct)}% · {Math.round(d.rotationDeg)}°
                  </span>
                </div>

                {/* Top-center Rotation Handle & Bottom-right Resize Handle when selected & unlocked */}
                {isSel && !isLocked && (
                  <>
                    <div
                      onPointerDown={(e) => startGizmoDrag(e, d, 'rotate')}
                      onPointerMove={(e) => moveGizmoDrag(e, d)}
                      onPointerUp={endGizmoDrag}
                      onPointerCancel={endGizmoDrag}
                      title="Drag to Rotate"
                      className="absolute -top-9 left-1/2 flex h-5 w-5 -translate-x-1/2 cursor-grab items-center justify-center rounded-full border border-[#38BDF8] bg-[#090d16] text-[#38BDF8] shadow hover:bg-[#38BDF8] hover:text-black active:cursor-grabbing"
                    >
                      <RotateCw className="h-3 w-3" />
                    </div>
                    <div
                      onPointerDown={(e) => startGizmoDrag(e, d, 'resize')}
                      onPointerMove={(e) => moveGizmoDrag(e, d)}
                      onPointerUp={endGizmoDrag}
                      onPointerCancel={endGizmoDrag}
                      title="Drag to Resize"
                      className="absolute -bottom-2 -right-2 h-4 w-4 cursor-nwse-resize border border-white bg-[#38BDF8] shadow hover:scale-125 transition-transform"
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};
