const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // Core overlay functions
  applyOverlay: (items) => ipcRenderer.send("apply-overlay", items),
  removeOverlay: () => ipcRenderer.send("remove-overlay"),
  minimizeToTray: () => ipcRenderer.send("minimize-to-tray"),
  getScreenSize: () => ipcRenderer.invoke("get-screen-size"),

  // Data management
  loadData: () => ipcRenderer.invoke("load-data"),
  saveData: (data) => ipcRenderer.invoke("save-data", data),
  importGalleryFiles: () => ipcRenderer.invoke("import-gallery-files"),
  deleteGalleryItem: (galleryId) => ipcRenderer.invoke("delete-gallery-item", galleryId),

  // Settings
  getSettings: () => ipcRenderer.invoke("get-settings"),
  setSettings: (settings) => ipcRenderer.invoke("set-settings", settings),

  // Frameless Window Controls
  windowMinimize: () => ipcRenderer.send("window:minimize"),
  windowMaximize: () => ipcRenderer.send("window:maximize"),
  windowClose: () => ipcRenderer.send("window:close"),
  isWindowMaximized: () => ipcRenderer.invoke("window:is-maximized"),
  onMaximizeChange: (callback) => {
    const handler = (_event, isMax) => callback(isMax);
    ipcRenderer.on("window:maximize-change", handler);
    return () => ipcRenderer.removeListener("window:maximize-change", handler);
  },
});
