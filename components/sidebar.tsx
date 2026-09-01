"use client";

import React from "react";
import { Edit3, Image as ImageIcon, Bookmark, Settings, Sun, Moon, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type TabType = "editor" | "gallery" | "presets" | "settings";

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const navItems: { id: TabType; label: string; sublabel: string; icon: React.ReactNode }[] = [
    {
      id: "editor",
      label: "Editor",
      sublabel: "Canvas & Overlay",
      icon: <Edit3 className="w-5 h-5" />,
    },
    {
      id: "gallery",
      label: "Gallery",
      sublabel: "Image Assets",
      icon: <ImageIcon className="w-5 h-5" />,
    },
    {
      id: "presets",
      label: "Presets",
      sublabel: "Saved Presets",
      icon: <Bookmark className="w-5 h-5" />,
    },
    {
      id: "settings",
      label: "Settings",
      sublabel: "Preferences",
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  return (
    <aside className="w-64 h-full bg-[#0d1017] border-r border-[#1a2233] flex flex-col justify-between p-4 shrink-0 select-none">
      <div className="flex flex-col gap-6">
        {/* Logo Section
        <div className="flex items-center gap-3 px-2 pt-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500/20 via-purple-500/20 to-indigo-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.3)]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"></path>
            </svg>
          </div>
          <div className="flex flex-col">
            <h1 className="text-base font-bold text-white tracking-wide">Wifu Engine</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]"></span>
              <span className="text-[11px] font-medium text-slate-400">v1.0.3</span>
            </div>
          </div>
        </div> */}

        {/* Navigation Items */}
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-left transition-all duration-200 group relative",
                  isActive
                    ? "bg-gradient-to-r from-[#d946ef] via-[#ec4899] to-[#db2777] text-white shadow-[0_4px_20px_rgba(217,70,239,0.35)]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[#151b28]"
                )}
              >
                <div
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-[#161c2b] text-slate-400 group-hover:text-pink-400 group-hover:bg-[#1c2438]"
                  )}
                >
                  {item.icon}
                </div>
                <div className="flex flex-col">
                  <span
                    className={cn(
                      "text-sm font-semibold tracking-wide leading-none mb-1",
                      isActive ? "text-white" : "text-slate-200 group-hover:text-white"
                    )}
                  >
                    {item.label}
                  </span>
                  <span
                    className={cn(
                      "text-[11px] font-normal leading-none",
                      isActive ? "text-pink-100" : "text-slate-500 group-hover:text-slate-400"
                    )}
                  >
                    {item.sublabel}
                  </span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / Theme Selector */}
      {/* <div className="pt-4 border-t border-[#1a2233]">
        <div className="w-full bg-[#131722] border border-[#1f283d] rounded-xl p-2.5 flex items-center justify-between hover:border-slate-600 transition-colors cursor-pointer">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#1c2336] flex items-center justify-center text-slate-400">
              <Sun className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Theme</span>
              <span className="text-xs font-semibold text-slate-300">Dark</span>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-500" />
        </div>
      </div> */}
    </aside>
  );
}
