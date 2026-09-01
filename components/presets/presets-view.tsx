"use client";

import React, { useState } from "react";
import { Preset, OverlayItem } from "@/types";
import { Bookmark, PlusCircle, Play, Edit, Trash2, Layers, RefreshCw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface PresetsViewProps {
  presets: Preset[];
  currentCanvasItems: OverlayItem[];
  onLoadPreset: (preset: Preset) => void;
  onApplyPresetDirectly: (preset: Preset) => void;
  onOverwritePreset: (presetId: string) => void;
  onDeletePreset: (presetId: string) => void;
  onOpenSaveModal: () => void;
}

export function PresetsView({
  presets,
  currentCanvasItems,
  onLoadPreset,
  onApplyPresetDirectly,
  onOverwritePreset,
  onDeletePreset,
  onOpenSaveModal,
}: PresetsViewProps) {
  const [presetToDelete, setPresetToDelete] = useState<Preset | null>(null);

  const confirmDelete = () => {
    if (presetToDelete) {
      onDeletePreset(presetToDelete.id);
      setPresetToDelete(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-6 gap-6 select-none">
      {/* Header */}
      <header className="w-full bg-[#10141f] border border-[#1b2234] rounded-2xl p-4 flex items-center justify-between shadow-lg">
        <div className="flex flex-col">
          <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-purple-400" />
            Layout Presets
          </h2>
          <span className="text-xs text-slate-400">
            {presets.length} saved composition{presets.length === 1 ? "" : "s"}
          </span>
        </div>

        <button
          onClick={onOpenSaveModal}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-semibold text-xs tracking-wide bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-[0_2px_12px_rgba(168,85,247,0.3)] transition-all active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Save Current Canvas as Preset</span>
        </button>
      </header>

      {/* Presets Grid */}
      <div className="flex-1 overflow-y-auto pr-1">
        {presets.length === 0 ? (
          <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center text-center p-12 bg-[#0c0f17]/60 border border-dashed border-[#1e263c] rounded-3xl">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">No Saved Presets Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mb-5">
              Arrange GIF characters or overlay graphics on the Editor Canvas, then click &quot;Save Preset&quot; to quickly recall layouts anytime.
            </p>
            {currentCanvasItems.length > 0 && (
              <button
                onClick={onOpenSaveModal}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-xs bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg transition-all active:scale-95"
              >
                <Bookmark className="w-4 h-4" />
                <span>Save Current {currentCanvasItems.length} Item(s) as Preset</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {presets.map((preset) => (
              <div
                key={preset.id}
                className="bg-[#10141f] border border-[#1d2538] hover:border-purple-500/50 rounded-2xl p-5 shadow-lg flex flex-col justify-between gap-4 transition-all group"
              >
                <div>
                  {/* Preset Title & Item Count */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="text-sm font-bold text-white truncate">{preset.name}</h3>
                    <span className="text-[11px] font-semibold text-purple-300 bg-purple-950/60 border border-purple-800/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      {preset.items.length} item{preset.items.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-400 line-clamp-2 min-h-[32px] mb-3">
                    {preset.description || "No description provided."}
                  </p>

                  {/* Thumbnails preview */}
                  <div className="flex items-center gap-2 bg-[#090c13] p-2 rounded-xl border border-[#181f2f] min-h-[50px] overflow-hidden">
                    {preset.items.length === 0 ? (
                      <span className="text-[11px] text-slate-500 italic px-2">Empty preset</span>
                    ) : (
                      preset.items.slice(0, 5).map((item, idx) => (
                        <div
                          key={idx}
                          className="w-10 h-10 rounded-lg bg-[#141824] border border-[#222a3d] overflow-hidden flex items-center justify-center p-1 shrink-0"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={
                              item.previewUrl ||
                              (item.path?.startsWith("data:")
                                ? item.path
                                : `media:///${item.path?.replace(/\\/g, "/")}`)
                            }
                            alt="preview"
                            className="w-full h-full object-contain pointer-events-none"
                          />
                        </div>
                      ))
                    )}
                    {preset.items.length > 5 && (
                      <span className="text-[11px] text-slate-400 font-bold px-1">
                        +{preset.items.length - 5}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-[#1a2233] gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onLoadPreset(preset)}
                      className="px-3 py-1.5 rounded-xl bg-[#161c2b] hover:bg-[#20293d] text-indigo-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title="Load preset into Editor Canvas"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => onApplyPresetDirectly(preset)}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow hover:brightness-110 active:scale-95 transition-all"
                      title="Apply as active screen overlay directly"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Apply</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onOverwritePreset(preset.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#1a2233] transition-colors"
                      title="Overwrite this preset with current canvas items"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setPresetToDelete(preset)}
                      className="p-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-950/50 transition-colors"
                      title="Delete Preset"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {presetToDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#121622] border border-[#232c42] rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-white mb-2">Delete Preset &quot;{presetToDelete.name}&quot;?</h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Are you sure you want to delete this preset? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setPresetToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-[#1b2234] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 shadow-md transition-colors"
              >
                Delete Preset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
