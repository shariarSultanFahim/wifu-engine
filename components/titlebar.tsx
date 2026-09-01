"use client";

import React, { useEffect, useState } from "react";
import { Minus, Square, Copy, X } from "lucide-react";

export function Titlebar() {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.electronAPI) {
      window.electronAPI.isWindowMaximized().then(setIsMaximized);
      const unsubscribe = window.electronAPI.onMaximizeChange(setIsMaximized);
      return () => unsubscribe();
    }
  }, []);

  const handleMinimize = () => {
    window.electronAPI?.windowMinimize();
  };

  const handleMaximize = () => {
    window.electronAPI?.windowMaximize();
  };

  const handleClose = () => {
    window.electronAPI?.windowClose();
  };

  return (
    <div className="titlebar-drag h-10 w-full bg-[#0a0d14] border-b border-[#1c2333] flex items-center justify-between px-3 shrink-0 select-none z-50">
      {/* App Logo & Title */}
      <div className="flex items-center gap-2 titlebar-no-drag">
        <div className="w-5 h-5 rounded flex items-center justify-center overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.png" alt="Wifu Engine" className="w-4 h-4 object-contain" />
        </div>
        <span className="text-xs font-semibold text-slate-300 tracking-wide">
          Wifu Engine
        </span>
      </div>

      {/* Window Controls */}
      <div className="flex items-center titlebar-no-drag">
        <button
          onClick={handleMinimize}
          className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          title="Minimize"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleMaximize}
          className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          title={isMaximized ? "Restore" : "Maximize"}
        >
          {isMaximized ? (
            <Copy className="w-3 h-3 rotate-180" />
          ) : (
            <Square className="w-3 h-3" />
          )}
        </button>
        <button
          onClick={handleClose}
          className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-red-600/90 transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
