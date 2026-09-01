"use client";

import React, { useState } from "react";
import { Bookmark, Monitor, Check, Layers, Trash2, ArrowDownToLine, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolbarProps {
  canvasWidth: number;
  canvasHeight: number;
  onSizeChange: (width: number, height: number) => void;
  onSavePresetClick: () => void;
  onApplyOverlay: () => void;
  onRemoveOverlay: () => void;
  onMinimizeToTray: () => void;
}

const PRESET_RESOLUTIONS = [
  { label: "1080p (FHD)", width: 1920, height: 1080 },
  { label: "1440p (2K)", width: 2560, height: 1440 },
  { label: "4K (UHD)", width: 3840, height: 2160 },
  { label: "720p (HD)", width: 1280, height: 720 },
  { label: "1366x768", width: 1366, height: 768 },
];

export function EditorToolbar({
  canvasWidth,
  canvasHeight,
  onSizeChange,
  onSavePresetClick,
  onApplyOverlay,
  onRemoveOverlay,
  onMinimizeToTray,
}: ToolbarProps) {
  const [inputW, setInputW] = useState(canvasWidth.toString());
  const [inputH, setInputH] = useState(canvasHeight.toString());
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Sync if canvasWidth/Height changes externally
  React.useEffect(() => {
    setInputW(canvasWidth.toString());
    setInputH(canvasHeight.toString());
  }, [canvasWidth, canvasHeight]);

  const handleApplyCustomSize = () => {
    const w = parseInt(inputW, 10);
    const h = parseInt(inputH, 10);
    if (!isNaN(w) && !isNaN(h) && w > 100 && h > 100) {
      onSizeChange(w, h);
    }
  };

  const handleDetectScreenSize = async () => {
    if (typeof window !== "undefined" && window.electronAPI) {
      try {
        const size = await window.electronAPI.getScreenSize();
        if (size && size.width && size.height) {
          setInputW(size.width.toString());
          setInputH(size.height.toString());
          onSizeChange(size.width, size.height);
        }
      } catch (err) {
        console.error("Failed to detect screen size:", err);
      }
    }
  };

  return (
    <header className="w-full bg-[#10141f] border border-[#1b2234] rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-lg select-none">
      {/* Left: Save Preset */}
      <div className="flex items-center gap-3">
        <button
          onClick={onSavePresetClick}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-white font-semibold text-xs tracking-wide bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 shadow-[0_2px_15px_rgba(236,72,153,0.3)] transition-all active:scale-95"
        >
          <Bookmark className="w-4 h-4 fill-white/20" />
          <span>Save Preset</span>
        </button>
      </div>

      {/* Center: Screen Size Preset & Inputs */}
      <div className="flex items-center gap-2.5 bg-[#141926] p-1.5 rounded-xl border border-[#1e263c]">
        {/* Resolution Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-[#1a2133] transition-colors"
          >
            <Monitor className="w-3.5 h-3.5 text-indigo-400" />
            <span>Screen Size</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full mt-2 left-0 w-48 bg-[#141824] border border-[#222c42] rounded-xl shadow-2xl p-1.5 z-50 flex flex-col gap-1">
              <button
                onClick={() => {
                  handleDetectScreenSize();
                  setIsDropdownOpen(false);
                }}
                className="w-full text-left px-2.5 py-1.5 text-xs text-indigo-300 hover:bg-[#1c2438] rounded-lg font-medium transition-colors"
              >
                Native Display Size
              </button>
              <div className="h-[1px] bg-[#1e263a] my-0.5" />
              {PRESET_RESOLUTIONS.map((res) => (
                <button
                  key={res.label}
                  onClick={() => {
                    setInputW(res.width.toString());
                    setInputH(res.height.toString());
                    onSizeChange(res.width, res.height);
                    setIsDropdownOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-[#1c2438] rounded-lg transition-colors"
                >
                  <span>{res.label}</span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {res.width}x{res.height}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <input
            type="number"
            value={inputW}
            onChange={(e) => setInputW(e.target.value)}
            placeholder="1920"
            className="w-16 bg-[#0c0f17] border border-[#222a3d] text-slate-200 text-xs font-mono font-medium rounded-lg px-2 py-1.5 text-center focus:outline-none focus:border-purple-500"
          />
          <span className="text-slate-500 text-xs font-mono">W</span>
          <span className="text-slate-600 text-xs font-bold mx-0.5">×</span>
          <input
            type="number"
            value={inputH}
            onChange={(e) => setInputH(e.target.value)}
            placeholder="1080"
            className="w-16 bg-[#0c0f17] border border-[#222a3d] text-slate-200 text-xs font-mono font-medium rounded-lg px-2 py-1.5 text-center focus:outline-none focus:border-purple-500"
          />
          <span className="text-slate-500 text-xs font-mono">H</span>

          <button
            onClick={handleApplyCustomSize}
            className="flex items-center gap-1 bg-[#252f4a] hover:bg-[#303d60] text-indigo-200 font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors ml-1 active:scale-95"
            title="Apply dimensions"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply</span>
          </button>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onApplyOverlay}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-white font-semibold text-xs tracking-wide bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-[0_2px_12px_rgba(168,85,247,0.3)] transition-all active:scale-95"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Apply Overlay</span>
        </button>

        <button
          onClick={onRemoveOverlay}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-red-200 hover:text-white font-semibold text-xs tracking-wide bg-red-950/40 hover:bg-red-900/60 border border-red-900/50 transition-all active:scale-95"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Remove</span>
        </button>

        <button
          onClick={onMinimizeToTray}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-slate-300 hover:text-white font-semibold text-xs tracking-wide bg-[#171d2b] hover:bg-[#1f283b] border border-[#222b40] transition-all active:scale-95"
        >
          <ArrowDownToLine className="w-3.5 h-3.5" />
          <span>Tray</span>
        </button>
      </div>
    </header>
  );
}
