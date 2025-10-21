const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // Core overlay functions
  applyOverlay: (items) => ipcRenderer.send("apply-overlay", items),
  removeOverlay: () => ipcRenderer.send("remove-overlay"),
  minimizeToTray: () => ipcRenderer.send("minimize-to-tray"),
  getScreenSize: () => ipcRenderer.invoke("get-screen-size"),

  // --- NEW --- Gallery and Preset data management
  loadData: () => ipcRenderer.invoke("load-data"),
  saveData: (data) => ipcRenderer.invoke("save-data", data),
  importGalleryFiles: () => ipcRenderer.invoke("import-gallery-files"),
});
