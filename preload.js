// preload.js

const { contextBridge, ipcRenderer } = require("electron");

// Expose a safe, context-isolated API to the renderer process (index.html)
contextBridge.exposeInMainWorld("electronAPI", {
  // Sends the overlay's item data to the main process.
  applyOverlay: (items) => ipcRenderer.send("apply-overlay", items),
  // Gets the screen size from the main process.
  getScreenSize: () => ipcRenderer.invoke("get-screen-size"),
  // New functions exposed to the frontend
  removeOverlay: () => ipcRenderer.send("remove-overlay"),
  minimizeToTray: () => ipcRenderer.send("minimize-to-tray"),
});
