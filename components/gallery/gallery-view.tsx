"use client";

import React, { useState } from "react";
import { GalleryItem } from "@/types";
import { PlusCircle, Trash2, Plus, Search, Image as ImageIcon, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface GalleryViewProps {
  gallery: GalleryItem[];
  onImport: () => void;
  onAddToCanvas: (item: GalleryItem) => void;
  onDeleteItem: (id: string) => void;
}

export function GalleryView({
  gallery,
  onImport,
  onAddToCanvas,
  onDeleteItem,
}: GalleryViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [itemToDelete, setItemToDelete] = useState<GalleryItem | null>(null);

  const filteredItems = gallery.filter((item) => {
    if (!searchQuery.trim()) return true;
    const name = item.name || item.path.split(/[\\/]/).pop() || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const confirmDelete = () => {
    if (itemToDelete) {
      onDeleteItem(itemToDelete.id);
      setItemToDelete(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-6 gap-6 select-none">
      {/* Header */}
      <header className="w-full bg-[#10141f] border border-[#1b2234] rounded-2xl p-4 flex items-center justify-between shadow-lg">
        <div className="flex flex-col">
          <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-pink-400" />
            Image & GIF Gallery
          </h2>
          <span className="text-xs text-slate-400">
            {gallery.length} asset{gallery.length === 1 ? "" : "s"} available
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assets..."
              className="bg-[#0b0e14] border border-[#1e263c] rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-pink-500 w-48"
            />
          </div>

          {/* Import button */}
          <button
            onClick={onImport}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-semibold text-xs tracking-wide bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 shadow-[0_2px_12px_rgba(236,72,153,0.3)] transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Import GIFs & Images</span>
          </button>
        </div>
      </header>

      {/* Grid Container */}
      <div className="flex-1 overflow-y-auto pr-1">
        {gallery.length === 0 ? (
          <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center text-center p-12 bg-[#0c0f17]/60 border border-dashed border-[#1e263c] rounded-3xl">
            <div className="w-16 h-16 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 mb-4 shadow-[0_0_20px_rgba(236,72,153,0.15)]">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">No Assets Imported Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mb-5">
              Import animated GIFs, PNGs, or JPGs to build transparent desktop overlays and interactive scenes.
            </p>
            <button
              onClick={onImport}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-xs bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 shadow-lg transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Import Your First File</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredItems.map((item) => {
              const fileName = item.name || item.path.split(/[\\/]/).pop() || "Asset";
              const imgSrc =
                item.previewUrl ||
                (item.path?.startsWith("data:")
                  ? item.path
                  : `media:///${item.path?.replace(/\\/g, "/")}`);

              return (
                <div
                  key={item.id}
                  className="group relative aspect-square bg-[#10141f] border border-[#1d2538] hover:border-pink-500/60 rounded-2xl overflow-hidden shadow-md transition-all duration-200 flex flex-col"
                >
                  {/* Image View */}
                  <div className="flex-1 w-full h-full flex items-center justify-center p-3 overflow-hidden relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imgSrc}
                      alt={fileName}
                      className="w-full h-full object-contain filter drop-shadow group-hover:scale-105 transition-transform duration-200 select-none"
                    />

                    {/* Hover Action Overlay */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                      <button
                        onClick={() => onAddToCanvas(item)}
                        className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold text-xs shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add to Canvas</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setItemToDelete(item);
                        }}
                        className="w-full py-1.5 px-3 rounded-xl bg-red-950/70 border border-red-800 text-red-200 hover:text-white hover:bg-red-900 font-semibold text-[11px] transition-all flex items-center justify-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Footer Name Tag */}
                  <div className="bg-[#0b0e14] px-2.5 py-1.5 border-t border-[#1a2233] flex items-center justify-between text-[11px] text-slate-400 truncate">
                    <span className="truncate" title={fileName}>
                      {fileName}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#121622] border border-[#232c42] rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-white mb-2">Delete Gallery Asset?</h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Are you sure you want to delete this asset? This will permanently delete the file and remove it from all saved layout presets.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-[#1b2234] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 shadow-md transition-colors"
              >
                Delete Asset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
