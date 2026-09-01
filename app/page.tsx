"use client";

import React, { useState, useEffect } from "react";
import { Sidebar, TabType } from "@/components/sidebar";
import { EditorToolbar } from "@/components/editor/toolbar";
import { Canvas } from "@/components/editor/canvas";
import { GalleryView } from "@/components/gallery/gallery-view";
import { PresetsView } from "@/components/presets/presets-view";
import { SavePresetModal } from "@/components/presets/save-preset-modal";
import { SettingsView } from "@/components/settings/settings-view";
import { AppData, AppSettings, GalleryItem, OverlayItem, Preset } from "@/types";
import { Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("editor");
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    startOnStartup: false,
    loadLastPreset: true,
  });

  const [canvasWidth, setCanvasWidth] = useState<number>(1920);
  const [canvasHeight, setCanvasHeight] = useState<number>(1080);
  const [canvasItems, setCanvasItems] = useState<OverlayItem[]>([]);

  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type?: "success" | "info" | "error";
  } | null>(null);

  const showToast = (text: string, type: "success" | "info" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Initialize data from Electron backend
  useEffect(() => {
    async function init() {
      if (typeof window !== "undefined" && window.electronAPI) {
        try {
          const data: AppData = await window.electronAPI.loadData();
          if (data) {
            if (data.gallery) setGallery(data.gallery);
            if (data.presets) setPresets(data.presets);
            if (data.settings) setSettings(data.settings);
            if (data.lastAppliedOverlayItems && data.lastAppliedOverlayItems.length > 0) {
              setCanvasItems(data.lastAppliedOverlayItems);
            }
          }

          const screen = await window.electronAPI.getScreenSize();
          if (screen && screen.width && screen.height) {
            setCanvasWidth(screen.width);
            setCanvasHeight(screen.height);
          }
        } catch (err) {
          console.error("Failed to load initial data from Electron:", err);
        }
      }
    }
    init();
  }, []);

  // Save gallery & presets when updated
  const syncDataToElectron = async (newGallery: GalleryItem[], newPresets: Preset[]) => {
    if (typeof window !== "undefined" && window.electronAPI) {
      try {
        await window.electronAPI.saveData({
          gallery: newGallery,
          presets: newPresets,
        });
      } catch (err) {
        console.error("Failed to save data:", err);
      }
    }
  };

  // Gallery Actions
  const handleImportGallery = async () => {
    if (typeof window !== "undefined" && window.electronAPI) {
      try {
        const imported = await window.electronAPI.importGalleryFiles();
        if (imported && imported.length > 0) {
          const updatedGallery = [...gallery, ...imported];
          setGallery(updatedGallery);
          await syncDataToElectron(updatedGallery, presets);
          showToast(`Imported ${imported.length} asset(s) successfully!`);
        }
      } catch (err) {
        console.error("Error importing files:", err);
        showToast("Failed to import images", "error");
      }
    } else {
      showToast("Import is only available inside Electron desktop app", "info");
    }
  };

  const handleDeleteGalleryItem = async (galleryId: string) => {
    if (typeof window !== "undefined" && window.electronAPI) {
      try {
        const res = await window.electronAPI.deleteGalleryItem(galleryId);
        if ("gallery" in res && res.gallery) {
          setGallery(res.gallery);
          setPresets(res.presets || []);
        } else {
          const updatedGallery = gallery.filter((g) => g.id !== galleryId);
          setGallery(updatedGallery);
        }

        // Clean up from current canvas
        setCanvasItems((prev) => prev.filter((it) => it.galleryId !== galleryId));
        showToast("Asset deleted from gallery and presets.");
      } catch (err) {
        console.error("Error deleting gallery item:", err);
        showToast("Failed to delete gallery item", "error");
      }
    }
  };

  const handleAddItemToCanvas = (item: GalleryItem) => {
    const src =
      item.previewUrl ||
      (item.path?.startsWith("data:")
        ? item.path
        : `media:///${item.path?.replace(/\\/g, "/")}`);

    const addItemWithDimensions = (w: number, h: number) => {
      const newItem: OverlayItem = {
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        galleryId: item.id,
        path: item.path,
        previewUrl: item.previewUrl,
        left: 35,
        top: 30,
        width: Math.round(w),
        height: Math.round(h),
        rotation: 0,
      };

      setCanvasItems((prev) => [...prev, newItem]);
      setActiveTab("editor");
      showToast(`Added ${item.name || "asset"} to canvas!`);
    };

    if (typeof window !== "undefined") {
      const img = new window.Image();
      img.onload = () => {
        const nw = img.naturalWidth || 300;
        const nh = img.naturalHeight || 300;
        const aspect = nw / nh;
        let targetW = 320;
        let targetH = 320;
        if (aspect >= 1) {
          targetW = 360;
          targetH = Math.round(360 / aspect);
        } else {
          targetH = 360;
          targetW = Math.round(360 * aspect);
        }
        addItemWithDimensions(targetW, targetH);
      };
      img.onerror = () => {
        addItemWithDimensions(300, 300);
      };
      img.src = src;
    } else {
      addItemWithDimensions(300, 300);
    }
  };

  // Editor Actions
  const handleApplyOverlay = () => {
    if (canvasItems.length === 0) {
      showToast("Add at least one item to the canvas before applying overlay", "info");
      return;
    }

    if (typeof window !== "undefined" && window.electronAPI) {
      window.electronAPI.applyOverlay(canvasItems);
      showToast("Transparent screen overlay applied!", "success");
    } else {
      showToast("Overlay applied (browser preview mode)", "info");
    }
  };

  const handleRemoveOverlay = () => {
    if (typeof window !== "undefined" && window.electronAPI) {
      window.electronAPI.removeOverlay();
      showToast("Screen overlay removed.");
    }
  };

  const handleMinimizeToTray = () => {
    if (typeof window !== "undefined" && window.electronAPI) {
      window.electronAPI.minimizeToTray();
    }
  };

  // Preset Actions
  const handleSavePreset = (name: string, description: string) => {
    if (canvasItems.length === 0) {
      showToast("Canvas is empty! Add items first.", "error");
      return;
    }

    const newPreset: Preset = {
      id: `preset_${Date.now()}`,
      name,
      description,
      createdAt: new Date().toISOString(),
      items: [...canvasItems],
      canvasWidth,
      canvasHeight,
    };

    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);
    syncDataToElectron(gallery, updatedPresets);
    showToast(`Preset "${name}" saved!`);
  };

  const handleLoadPreset = (preset: Preset) => {
    setCanvasItems(preset.items || []);
    if (preset.canvasWidth && preset.canvasHeight) {
      setCanvasWidth(preset.canvasWidth);
      setCanvasHeight(preset.canvasHeight);
    }
    setActiveTab("editor");
    showToast(`Loaded preset "${preset.name}" into canvas.`);
  };

  const handleApplyPresetDirectly = (preset: Preset) => {
    if (!preset.items || preset.items.length === 0) {
      showToast("Preset is empty", "info");
      return;
    }
    if (typeof window !== "undefined" && window.electronAPI) {
      window.electronAPI.applyOverlay(preset.items);
      showToast(`Applied preset "${preset.name}" directly to screen!`);
    }
  };

  const handleOverwritePreset = (presetId: string) => {
    const updatedPresets = presets.map((p) => {
      if (p.id === presetId) {
        return {
          ...p,
          items: [...canvasItems],
          canvasWidth,
          canvasHeight,
        };
      }
      return p;
    });
    setPresets(updatedPresets);
    syncDataToElectron(gallery, updatedPresets);
    showToast("Preset updated with current canvas layout.");
  };

  const handleDeletePreset = (presetId: string) => {
    const updatedPresets = presets.filter((p) => p.id !== presetId);
    setPresets(updatedPresets);
    syncDataToElectron(gallery, updatedPresets);
    showToast("Preset deleted.");
  };

  // Settings Actions
  const handleSettingsChange = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    if (typeof window !== "undefined" && window.electronAPI) {
      try {
        await window.electronAPI.setSettings(newSettings);
        showToast("Settings updated.");
      } catch (err) {
        console.error("Failed to save settings:", err);
      }
    }
  };

  return (
    <div className="flex-1 flex w-full h-full bg-[#0a0d14] overflow-hidden select-none">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#0c0f17] relative">
        {/* Editor Tab */}
        {activeTab === "editor" && (
          <div className="flex-1 flex flex-col h-full overflow-hidden p-6 gap-4">
            <EditorToolbar
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
              onSizeChange={(w, h) => {
                setCanvasWidth(w);
                setCanvasHeight(h);
              }}
              onSavePresetClick={() => setIsSaveModalOpen(true)}
              onApplyOverlay={handleApplyOverlay}
              onRemoveOverlay={handleRemoveOverlay}
              onMinimizeToTray={handleMinimizeToTray}
            />

            <Canvas
              items={canvasItems}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
              onItemsChange={setCanvasItems}
              onNavigateToGallery={() => setActiveTab("gallery")}
            />
          </div>
        )}

        {/* Gallery Tab */}
        {activeTab === "gallery" && (
          <GalleryView
            gallery={gallery}
            onImport={handleImportGallery}
            onAddToCanvas={handleAddItemToCanvas}
            onDeleteItem={handleDeleteGalleryItem}
          />
        )}

        {/* Presets Tab */}
        {activeTab === "presets" && (
          <PresetsView
            presets={presets}
            currentCanvasItems={canvasItems}
            onLoadPreset={handleLoadPreset}
            onApplyPresetDirectly={handleApplyPresetDirectly}
            onOverwritePreset={handleOverwritePreset}
            onDeletePreset={handleDeletePreset}
            onOpenSaveModal={() => setIsSaveModalOpen(true)}
          />
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <SettingsView
            settings={settings}
            onSettingsChange={handleSettingsChange}
          />
        )}

        {/* Floating Toast Notification */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              className="absolute bottom-6 right-6 z-50 flex items-center gap-2.5 bg-[#141926]/95 border border-[#232c42] px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md text-xs font-semibold text-white"
            >
              {toastMessage.type === "error" ? (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-pink-400 shrink-0" />
              )}
              <span>{toastMessage.text}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Save Preset Dialog Modal */}
      <SavePresetModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSavePreset}
        itemCount={canvasItems.length}
      />
    </div>
  );
}
