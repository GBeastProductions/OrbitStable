import React, { createContext, useContext, useRef } from 'react';
import { Move } from 'lucide-react';
import {
  CustomDecorWidget,
  EditableThemePayload,
  HudWidgetOverride,
  ScreenView,
} from '../types/game';

interface StudioLayoutContextValue {
  widgets: Record<string, HudWidgetOverride>;
  customDecorWidgets: CustomDecorWidget[];
  editModeActive: boolean;
  selectedWidgetId: string | null;
  onSelectWidget: (widgetId: string) => void;
  onUpdateWidgetOffset: (widgetId: string, xOffsetPx: number, yOffsetPx: number) => void;
  onUpdateDecorPos?: (decorId: string, xPct: number, yPct: number) => void;
  themesMap: Record<string, EditableThemePayload>;
}

const StudioLayoutContext = createContext<StudioLayoutContextValue>({
  widgets: {},
  customDecorWidgets: [],
  editModeActive: false,
  selectedWidgetId: null,
  onSelectWidget: () => {},
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

export const CustomDecorLayer: React.FC<{ screen: ScreenView }> = ({ screen }) => {
  const { customDecorWidgets, editModeActive, onUpdateDecorPos } = useStudioLayout();
  const dragRef = useRef<{
    id: string;
    pointerId: number;
    startX: number;
    startY: number;
    origXPct: number;
    origYPct: number;
  } | null>(null);

  const visibleDecor = customDecorWidgets.filter(
    (d) =>
      d.screen === 'ALL' ||
      (screen === 'TITLE' && d.screen === 'TITLE') ||
      (screen === 'SONG_SELECT' && d.screen === 'SONG_SELECT') ||
      (screen === 'PLAYING' && d.screen === 'PLAYING'),
  );

  if (visibleDecor.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-25 overflow-hidden">
      {visibleDecor.map((d) => (
        <div
          key={d.id}
          onPointerDown={
            editModeActive && onUpdateDecorPos
              ? (e) => {
                  e.stopPropagation();
                  e.currentTarget.setPointerCapture(e.pointerId);
                  dragRef.current = {
                    id: d.id,
                    pointerId: e.pointerId,
                    startX: e.clientX,
                    startY: e.clientY,
                    origXPct: d.xPct,
                    origYPct: d.yPct,
                  };
                }
              : undefined
          }
          onPointerMove={
            editModeActive && onUpdateDecorPos
              ? (e) => {
                  if (!dragRef.current || dragRef.current.id !== d.id) return;
                  const dxPct = ((e.clientX - dragRef.current.startX) / Math.max(1, window.innerWidth)) * 100;
                  const dyPct = ((e.clientY - dragRef.current.startY) / Math.max(1, window.innerHeight)) * 100;
                  onUpdateDecorPos(
                    d.id,
                    Math.max(2, Math.min(98, Math.round((dragRef.current.origXPct + dxPct) * 10) / 10)),
                    Math.max(2, Math.min(98, Math.round((dragRef.current.origYPct + dyPct) * 10) / 10)),
                  );
                }
              : undefined
          }
          onPointerUp={
            editModeActive
              ? (e) => {
                  if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                    e.currentTarget.releasePointerCapture(e.pointerId);
                  }
                  dragRef.current = null;
                }
              : undefined
          }
          className={editModeActive ? 'pointer-events-auto cursor-move outline outline-1 outline-[#38BDF8]' : 'pointer-events-none'}
          style={{
            position: 'absolute',
            left: `${d.xPct}%`,
            top: `${d.yPct}%`,
            width: `${d.widthPx}px`,
            height: `${d.heightPx}px`,
            opacity: d.opacity,
            transform: `translate(-50%, -50%) rotate(${d.rotationDeg}deg)`,
            mixBlendMode: d.blendMode === 'screen' ? 'screen' : 'normal',
          }}
        >
          {d.kind === 'image' && d.imageUrl ? (
            <img
              src={d.imageUrl}
              alt={d.text || 'Custom decor'}
              className="h-full w-full object-contain select-none"
              draggable={false}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center border border-[#38BDF8]/50 bg-[#0F172A]/85 px-2 text-center font-mono text-xs font-bold text-white shadow-lg">
              {d.text || 'ORBIT'}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
