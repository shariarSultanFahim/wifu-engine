import { AppData, AppSettings, GalleryItem, OverlayItem } from "./index";

export interface ElectronAPI {
  applyOverlay: (items: OverlayItem[]) => void;
  removeOverlay: () => void;
  minimizeToTray: () => void;
  getScreenSize: () => Promise<{ width: number; height: number }>;

  loadData: () => Promise<AppData>;
  saveData: (data: { gallery: GalleryItem[]; presets: any[] }) => Promise<{ success: boolean; error?: string }>;
  importGalleryFiles: () => Promise<GalleryItem[]>;
  deleteGalleryItem: (galleryId: string) => Promise<AppData | { success: boolean; error?: string }>;

  getSettings: () => Promise<AppSettings>;
  setSettings: (settings: AppSettings) => Promise<{ success: boolean; error?: string }>;

  windowMinimize: () => void;
  windowMaximize: () => void;
  windowClose: () => void;
  isWindowMaximized: () => Promise<boolean>;
  onMaximizeChange: (callback: (isMaximized: boolean) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
