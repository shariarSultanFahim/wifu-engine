"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { OverlayItem } from "@/types";
import { Move, RotateCw, Trash2, ArrowUp, ArrowDown, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface CanvasProps {
  items: OverlayItem[];
  canvasWidth: number;
  canvasHeight: number;
  onItemsChange: (items: OverlayItem[]) => void;
  onNavigateToGallery?: () => void;
}

export function Canvas({
  items,
  canvasWidth,
  canvasHeight,
  onItemsChange,
  onNavigateToGallery,
}: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Dragging & Resizing state
  const [interactionState, setInteractionState] = useState<{
    type: "drag" | "resize" | "rotate" | null;
    handle?: string;
    startX: number;
    startY: number;
    itemStartX: number; // in %
    itemStartY: number; // in %
    itemStartWidth: number; // in px
    itemStartHeight: number; // in px
    itemStartRotation: number;
    centerX?: number;
    centerY?: number;
  } | null>(null);

  const selectedItem = items.find((item) => item.id === selectedId) || null;

  // Handle global key events (Delete, Backspace)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        // Only if not focused on an input/textarea
        if (
          document.activeElement?.tagName === "INPUT" ||
          document.activeElement?.tagName === "TEXTAREA"
        ) {
          return;
        }
        e.preventDefault();
        onItemsChange(items.filter((it) => it.id !== selectedId));
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, items, onItemsChange]);

  // Click canvas background to deselect
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setSelectedId(null);
    }
  };

  // Start dragging an item
  const handleItemMouseDown = (e: React.MouseEvent, item: OverlayItem) => {
    e.stopPropagation();
    setSelectedId(item.id);

    setInteractionState({
      type: "drag",
      startX: e.clientX,
      startY: e.clientY,
      itemStartX: item.left,
      itemStartY: item.top,
      itemStartWidth: item.width,
      itemStartHeight: item.height,
      itemStartRotation: item.rotation || 0,
    });
  };

  // Start resizing an item
  const handleResizeHandleMouseDown = (
    e: React.MouseEvent,
    handle: string,
    item: OverlayItem
  ) => {
    e.stopPropagation();
    setInteractionState({
      type: "resize",
      handle,
      startX: e.clientX,
      startY: e.clientY,
      itemStartX: item.left,
      itemStartY: item.top,
      itemStartWidth: item.width,
      itemStartHeight: item.height,
      itemStartRotation: item.rotation || 0,
    });
  };

  // Start rotating an item
  const handleRotateHandleMouseDown = (
    e: React.MouseEvent,
    item: OverlayItem
  ) => {
    e.stopPropagation();
    if (!canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const itemPixelX = canvasRect.left + (item.left / 100) * canvasRect.width;
    const itemPixelY = canvasRect.top + (item.top / 100) * canvasRect.height;
    const itemWidthOnCanvas = (item.width / canvasWidth) * canvasRect.width;
    const itemHeightOnCanvas = (item.height / canvasHeight) * canvasRect.height;

    const centerX = itemPixelX + itemWidthOnCanvas / 2;
    const centerY = itemPixelY + itemHeightOnCanvas / 2;

    setInteractionState({
      type: "rotate",
      startX: e.clientX,
      startY: e.clientY,
      centerX,
      centerY,
      itemStartX: item.left,
      itemStartY: item.top,
      itemStartWidth: item.width,
      itemStartHeight: item.height,
      itemStartRotation: item.rotation || 0,
    });
  };

  // Global mouse move & mouse up listeners during drag/resize/rotate
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!interactionState || !selectedId || !canvasRef.current) return;
      const canvasRect = canvasRef.current.getBoundingClientRect();
      if (!canvasRect.width || !canvasRect.height) return;

      const deltaX = e.clientX - interactionState.startX;
      const deltaY = e.clientY - interactionState.startY;

      if (interactionState.type === "drag") {
        const deltaPercentX = (deltaX / canvasRect.width) * 100;
        const deltaPercentY = (deltaY / canvasRect.height) * 100;

        const newLeft = Math.max(
          -20,
          Math.min(100, interactionState.itemStartX + deltaPercentX)
        );
        const newTop = Math.max(
          -20,
          Math.min(100, interactionState.itemStartY + deltaPercentY)
        );

        onItemsChange(
          items.map((item) =>
            item.id === selectedId
              ? {
                ...item,
                left: parseFloat(newLeft.toFixed(2)),
                top: parseFloat(newTop.toFixed(2)),
              }
              : item
          )
        );
      } else if (interactionState.type === "resize") {
        // Delta in natural canvas resolution coordinates
        const scaleX = canvasWidth / canvasRect.width;
        const scaleY = canvasHeight / canvasRect.height;
        const naturalDeltaX = deltaX * scaleX;
        const naturalDeltaY = deltaY * scaleY;

        const aspectRatio = Math.max(
          0.01,
          interactionState.itemStartWidth / interactionState.itemStartHeight
        );
        const handle = interactionState.handle || "";

        let newWidth = interactionState.itemStartWidth;
        let newHeight = interactionState.itemStartHeight;
        let newLeft = interactionState.itemStartX;
        let newTop = interactionState.itemStartY;

        if (handle === "se") {
          const proposedW = Math.max(30, interactionState.itemStartWidth + naturalDeltaX);
          newWidth = proposedW;
          newHeight = Math.round(newWidth / aspectRatio);
        } else if (handle === "sw") {
          const proposedW = Math.max(30, interactionState.itemStartWidth - naturalDeltaX);
          newWidth = proposedW;
          newHeight = Math.round(newWidth / aspectRatio);
          newLeft =
            interactionState.itemStartX +
            ((interactionState.itemStartWidth - newWidth) / canvasWidth) * 100;
        } else if (handle === "ne") {
          const proposedW = Math.max(30, interactionState.itemStartWidth + naturalDeltaX);
          newWidth = proposedW;
          newHeight = Math.round(newWidth / aspectRatio);
          newTop =
            interactionState.itemStartY +
            ((interactionState.itemStartHeight - newHeight) / canvasHeight) * 100;
        } else if (handle === "nw") {
          const proposedW = Math.max(30, interactionState.itemStartWidth - naturalDeltaX);
          newWidth = proposedW;
          newHeight = Math.round(newWidth / aspectRatio);
          newLeft =
            interactionState.itemStartX +
            ((interactionState.itemStartWidth - newWidth) / canvasWidth) * 100;
          newTop =
            interactionState.itemStartY +
            ((interactionState.itemStartHeight - newHeight) / canvasHeight) * 100;
        } else if (handle === "e") {
          newWidth = Math.max(30, interactionState.itemStartWidth + naturalDeltaX);
          newHeight = Math.round(newWidth / aspectRatio);
        } else if (handle === "w") {
          newWidth = Math.max(30, interactionState.itemStartWidth - naturalDeltaX);
          newHeight = Math.round(newWidth / aspectRatio);
          newLeft =
            interactionState.itemStartX +
            ((interactionState.itemStartWidth - newWidth) / canvasWidth) * 100;
        } else if (handle === "s") {
          newHeight = Math.max(30, interactionState.itemStartHeight + naturalDeltaY);
          newWidth = Math.round(newHeight * aspectRatio);
        } else if (handle === "n") {
          newHeight = Math.max(30, interactionState.itemStartHeight - naturalDeltaY);
          newWidth = Math.round(newHeight * aspectRatio);
          newTop =
            interactionState.itemStartY +
            ((interactionState.itemStartHeight - newHeight) / canvasHeight) * 100;
        }

        onItemsChange(
          items.map((item) =>
            item.id === selectedId
              ? {
                ...item,
                width: Math.round(newWidth),
                height: Math.round(newHeight),
                left: parseFloat(newLeft.toFixed(2)),
                top: parseFloat(newTop.toFixed(2)),
              }
              : item
          )
        );
      } else if (interactionState.type === "rotate") {
        if (
          interactionState.centerX === undefined ||
          interactionState.centerY === undefined
        )
          return;

        const rad = Math.atan2(
          e.clientY - interactionState.centerY,
          e.clientX - interactionState.centerX
        );
        let deg = (rad * 180) / Math.PI + 90; // +90 because handle is at top
        if (deg < 0) deg += 360;

        // Snap to 45 degree increments if shift is pressed
        if (e.shiftKey) {
          deg = Math.round(deg / 45) * 45;
        }

        onItemsChange(
          items.map((item) =>
            item.id === selectedId
              ? { ...item, rotation: Math.round(deg) }
              : item
          )
        );
      }
    },
    [interactionState, selectedId, canvasWidth, canvasHeight, items, onItemsChange]
  );

  const handleMouseUp = useCallback(() => {
    setInteractionState(null);
  }, []);

  useEffect(() => {
    if (interactionState) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [interactionState, handleMouseMove, handleMouseUp]);

  // Actions on selected item
  const handleDeleteSelected = () => {
    if (selectedId) {
      onItemsChange(items.filter((it) => it.id !== selectedId));
      setSelectedId(null);
    }
  };

  const handleDuplicateSelected = () => {
    if (!selectedItem) return;
    const newItem: OverlayItem = {
      ...selectedItem,
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      left: Math.min(85, selectedItem.left + 3),
      top: Math.min(85, selectedItem.top + 3),
    };
    onItemsChange([...items, newItem]);
    setSelectedId(newItem.id);
  };

  const handleBringForward = () => {
    if (!selectedItem) return;
    const currentIndex = items.findIndex((it) => it.id === selectedId);
    if (currentIndex < items.length - 1) {
      const newItems = [...items];
      const temp = newItems[currentIndex];
      newItems[currentIndex] = newItems[currentIndex + 1];
      newItems[currentIndex + 1] = temp;
      onItemsChange(newItems);
    }
  };

  const handleSendBackward = () => {
    if (!selectedItem) return;
    const currentIndex = items.findIndex((it) => it.id === selectedId);
    if (currentIndex > 0) {
      const newItems = [...items];
      const temp = newItems[currentIndex];
      newItems[currentIndex] = newItems[currentIndex - 1];
      newItems[currentIndex - 1] = temp;
      onItemsChange(newItems);
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 w-full h-full flex items-center justify-center p-4 min-h-0 min-w-0 select-none overflow-hidden relative"
    >
      {/* Canvas Frame Container matching image.png */}
      <div
        className="w-full h-full flex items-center justify-center relative max-h-full"
        style={{
          aspectRatio: `${canvasWidth} / ${canvasHeight}`,
        }}
      >
        <div
          ref={canvasRef}
          onMouseDown={handleCanvasMouseDown}
          className="relative w-full h-full bg-[#0a0d14] rounded-3xl border border-[#1b2336] shadow-2xl overflow-hidden flex items-center justify-center"
          style={{
            backgroundImage: `radial-gradient(#1a233a 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        >
          {/* Empty State Viewfinder matching image.png */}
          {items.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center p-8 pointer-events-none z-0">
              {/* Neon Reticle Icon */}
              <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
                <div className="absolute inset-0 border-2 border-purple-500/40 rounded-2xl animate-pulse"></div>
                {/* Reticle corner brackets */}
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-purple-400"></div>
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-purple-400"></div>
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-purple-400"></div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-purple-400"></div>
                <div className="w-4 h-4 text-purple-400 flex items-center justify-center font-bold text-lg">
                  +
                </div>
              </div>

              <h2 className="text-2xl font-bold text-white tracking-wide mb-2">
                Editor Canvas
              </h2>
              <p className="text-sm font-semibold text-purple-400 font-mono tracking-wider mb-3">
                {canvasWidth} × {canvasHeight}
              </p>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-4">
                Use the toolbar above to configure canvas size and overlays.
              </p>
              {onNavigateToGallery && (
                <button
                  onClick={onNavigateToGallery}
                  className="pointer-events-auto mt-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 shadow-md transition-all active:scale-95"
                >
                  Browse Gallery to Add Images
                </button>
              )}
            </div>
          )}

          {/* Active Canvas Items */}
          {items.map((item) => {
            const isSelected = item.id === selectedId;
            const itemWidthPercent = (item.width / canvasWidth) * 100;
            const itemHeightPercent = (item.height / canvasHeight) * 100;

            return (
              <div
                key={item.id}
                onMouseDown={(e) => handleItemMouseDown(e, item)}
                className={cn(
                  "absolute cursor-grab active:cursor-grabbing group transition-shadow",
                  isSelected && "z-40"
                )}
                style={{
                  left: `${item.left}%`,
                  top: `${item.top}%`,
                  width: `${itemWidthPercent}%`,
                  height: `${itemHeightPercent}%`,
                  transform: `rotate(${item.rotation || 0}deg)`,
                  transformOrigin: "center center",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    item.previewUrl ||
                    (item.path?.startsWith("data:")
                      ? item.path
                      : `media:///${item.path?.replace(/\\/g, "/")}`)
                  }
                  alt="overlay"
                  className="w-full h-full object-contain pointer-events-none drop-shadow-md select-none"
                  draggable={false}
                />

                {/* Selection Bounding Box & Controls */}
                {isSelected && (
                  <div className="absolute inset-0 border-2 border-pink-500 rounded-lg shadow-[0_0_15px_rgba(236,72,153,0.5)] pointer-events-auto">
                    {/* Rotation handle */}
                    <div
                      onMouseDown={(e) => handleRotateHandleMouseDown(e, item)}
                      className="absolute -top-7 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-purple-500 border-2 border-white shadow-md flex items-center justify-center cursor-crosshair hover:scale-125 transition-transform"
                      title="Rotate (Hold Shift for 45°)"
                    >
                      <RotateCw className="w-2.5 h-2.5 text-white" />
                    </div>
                    <div className="absolute -top-4 left-1/2 w-0.5 h-4 bg-purple-400 -translate-x-1/2"></div>

                    {/* Resize Handles (8 directions) */}
                    <div
                      onMouseDown={(e) => handleResizeHandleMouseDown(e, "nw", item)}
                      className="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-full bg-white border-2 border-pink-500 cursor-nwse-resize shadow"
                    />
                    <div
                      onMouseDown={(e) => handleResizeHandleMouseDown(e, "ne", item)}
                      className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-white border-2 border-pink-500 cursor-nesw-resize shadow"
                    />
                    <div
                      onMouseDown={(e) => handleResizeHandleMouseDown(e, "sw", item)}
                      className="absolute -bottom-1.5 -left-1.5 w-3 h-3 rounded-full bg-white border-2 border-pink-500 cursor-nesw-resize shadow"
                    />
                    <div
                      onMouseDown={(e) => handleResizeHandleMouseDown(e, "se", item)}
                      className="absolute -bottom-1.5 -right-1.5 w-3 h-3 rounded-full bg-white border-2 border-pink-500 cursor-nwse-resize shadow"
                    />
                    <div
                      onMouseDown={(e) => handleResizeHandleMouseDown(e, "n", item)}
                      className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-pink-400 border border-white cursor-ns-resize"
                    />
                    <div
                      onMouseDown={(e) => handleResizeHandleMouseDown(e, "s", item)}
                      className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-pink-400 border border-white cursor-ns-resize"
                    />
                    <div
                      onMouseDown={(e) => handleResizeHandleMouseDown(e, "w", item)}
                      className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-pink-400 border border-white cursor-ew-resize"
                    />
                    <div
                      onMouseDown={(e) => handleResizeHandleMouseDown(e, "e", item)}
                      className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-pink-400 border border-white cursor-ew-resize"
                    />

                    {/* Floating Item Actions Bar */}
                    <div className="absolute -bottom-11 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-[#10141f] border border-[#222c42] p-1 rounded-xl shadow-2xl z-50">
                      <button
                        onClick={handleBringForward}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Bring Forward"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={handleSendBackward}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Send Backward"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={handleDuplicateSelected}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Duplicate"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <div className="w-[1px] h-4 bg-slate-800 my-auto" />
                      <button
                        onClick={handleDeleteSelected}
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950/60 transition-colors"
                        title="Delete (or press Del)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
