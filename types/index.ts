export interface GalleryItem {
  id: string;
  name?: string;
  path: string;
  previewUrl?: string;
  size?: number;
  createdAt?: string;
}

export interface OverlayItem {
  id: string;
  galleryId: string;
  path: string;
  previewUrl?: string;
  left: number; // percentage (0 - 100)
  top: number; // percentage (0 - 100)
  width: number; // in pixels relative to canvas resolution
  height: number; // in pixels relative to canvas resolution
  rotation?: number; // in degrees
  zIndex?: number;
}

export interface Preset {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
  items: OverlayItem[];
  canvasWidth?: number;
  canvasHeight?: number;
}

export interface AppSettings {
  startOnStartup: boolean;
  loadLastPreset: boolean;
  defaultResolution?: string;
}

export interface AppData {
  gallery: GalleryItem[];
  presets: Preset[];
  settings: AppSettings;
  lastAppliedOverlayItems?: OverlayItem[];
}
