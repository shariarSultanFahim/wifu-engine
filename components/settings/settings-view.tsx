"use client";

import React from "react";
import { AppSettings } from "@/types";
import { Settings, Power, Layers, Monitor, Info, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsViewProps {
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
}

export function SettingsView({ settings, onSettingsChange }: SettingsViewProps) {
  const toggleStartOnStartup = () => {
    onSettingsChange({
      ...settings,
      startOnStartup: !settings.startOnStartup,
    });
  };

  const toggleLoadLastPreset = () => {
    onSettingsChange({
      ...settings,
      loadLastPreset: !settings.loadLastPreset,
    });
  };

  return (
    <div className="flex-1 flex flex-col mx-auto md:h-full overflow-y-auto p-6 gap-6 select-none w-full">
      {/* Header */}
      <header className="w-full bg-[#10141f] border border-[#1b2234] rounded-2xl p-4 flex items-center justify-between shadow-lg">
        <div className="flex flex-col">
          <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-300" />
            Preferences & Application Settings
          </h2>
          <span className="text-xs text-slate-400">
            Configure application startup and overlay behavior
          </span>
        </div>
      </header>

      {/* Main Settings Sections */}
      <div className="flex flex-col gap-4">
        {/* Startup & Automation Card */}
        <div className="bg-[#10141f] border border-[#1d2538] rounded-2xl p-5 flex flex-col gap-5 shadow-lg">
          <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-[#1b2336] pb-3">
            <Power className="w-4 h-4 text-emerald-400" />
            <span>Startup & Automation</span>
          </div>

          <div className="flex flex-col gap-4">
            {/* Setting 1: Start on Startup */}
            <div className="flex items-center justify-between gap-4 p-3 bg-[#0c0f17] rounded-xl border border-[#1b2336]">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-200">
                  Launch on Windows Startup
                </span>
                <span className="text-[11px] text-slate-400">
                  Automatically start Wifu Engine in system tray when your computer turns on.
                </span>
              </div>

              <button
                onClick={toggleStartOnStartup}
                className={cn(
                  "w-12 h-6 rounded-full transition-colors relative flex items-center px-1 shrink-0",
                  settings.startOnStartup
                    ? "bg-gradient-to-r from-pink-500 to-purple-600 shadow-[0_0_12px_rgba(236,72,153,0.5)]"
                    : "bg-slate-700"
                )}
              >
                <div
                  className={cn(
                    "w-4 h-4 rounded-full bg-white transition-transform",
                    settings.startOnStartup ? "translate-x-6" : "translate-x-0"
                  )}
                />
              </button>
            </div>

            {/* Setting 2: Auto-apply last overlay */}
            <div className="flex items-center justify-between gap-4 p-3 bg-[#0c0f17] rounded-xl border border-[#1b2336]">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-200">
                  Auto-apply Last Overlay on Launch
                </span>
                <span className="text-[11px] text-slate-400">
                  Automatically restore your active screen overlay layout when starting minimized.
                </span>
              </div>

              <button
                onClick={toggleLoadLastPreset}
                className={cn(
                  "w-12 h-6 rounded-full transition-colors relative flex items-center px-1 shrink-0",
                  settings.loadLastPreset
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 shadow-[0_0_12px_rgba(168,85,247,0.5)]"
                    : "bg-slate-700"
                )}
              >
                <div
                  className={cn(
                    "w-4 h-4 rounded-full bg-white transition-transform",
                    settings.loadLastPreset ? "translate-x-6" : "translate-x-0"
                  )}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Display & Engine Information Card */}
        <div className="bg-[#10141f] border border-[#1d2538] rounded-2xl p-5 flex flex-col gap-4 shadow-lg">
          <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-[#1b2336] pb-3">
            <Info className="w-4 h-4 text-purple-400" />
            <span>About Wifu Engine</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="bg-[#0c0f17] p-3 rounded-xl border border-[#1b2336] flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Version</span>
              <span className="text-xs font-semibold text-slate-200 mt-0.5">v1.0.3</span>
            </div>
            <div className="bg-[#0c0f17] p-3 rounded-xl border border-[#1b2336] flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Framework</span>
              <span className="text-xs font-semibold text-slate-200 mt-0.5">Next.js 15 + Electron</span>
            </div>
            <div className="bg-[#0c0f17] p-3 rounded-xl border border-[#1b2336] flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Renderer Styling</span>
              <span className="text-xs font-semibold text-slate-200 mt-0.5">Tailwind CSS v4</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
