const {
  app,
  BrowserWindow,
  ipcMain,
  screen,
  Tray,
  Menu,
  dialog,
} = require("electron");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

let mainWindow;
let overlayWindow;
let tray = null;
let tempOverlayFile = null;

const userDataPath = app.getPath("userData");
const galleryPath = path.join(userDataPath, "gallery");
const dataFilePath = path.join(userDataPath, "data.json");

// --- NEW: Default appData structure ---
const defaultAppData = {
  gallery: [],
  presets: [],
  settings: { startOnStartup: false, loadLastPreset: true },
  lastAppliedOverlayItems: [],
};

// --- NEW: Global appData variable ---
let appData = { ...defaultAppData };

// --- MODIFIED: initializeAppData ---
// Now loads data into the global variable or creates the file if it doesn't exist.
function initializeAppData() {
  if (!fs.existsSync(galleryPath)) {
    fs.mkdirSync(galleryPath, { recursive: true });
  }

  try {
    if (fs.existsSync(dataFilePath)) {
      const data = fs.readFileSync(dataFilePath, "utf-8");
      const parsedData = JSON.parse(data);
      // Merge with defaults to ensure new settings keys exist
      appData = {
        ...defaultAppData,
        ...parsedData,
        settings: { ...defaultAppData.settings, ...parsedData.settings },
      };
    } else {
      // Save the defaults if file doesn't exist
      fs.writeFileSync(dataFilePath, JSON.stringify(appData, null, 2));
    }
  } catch (error) {
    console.error("Failed to load data.json, using defaults:", error);
    // appData is already set to defaults
  }
}

// --- NEW: Helper to save appData ---
function saveAppData() {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(appData, null, 2));
  } catch (error) {
    console.error("Failed to save data file:", error);
  }
}

// --- NEW: Reusable function to generate overlay HTML ---
function generateOverlayHtml(items) {
  return items
    .map((item) => {
      try {
        // Check if file exists before reading
        if (!item.path || !fs.existsSync(item.path)) {
          console.warn(`Skipping missing overlay item: ${item.path}`);
          return "";
        }
        const imageBuffer = fs.readFileSync(item.path);
        const imageBase64 = imageBuffer.toString("base64");
        const mimeType = `image/${path.extname(item.path).slice(1) || "png"}`;
        const imageSrc = `data:${mimeType};base64,${imageBase64}`;
        const transform = `transform: rotate(${item.rotation || 0}deg);`;
        return `<img src="${imageSrc}" style="position: absolute; left: ${item.left}%; top: ${item.top}%; width: ${item.width}px; height: ${item.height}px; ${transform}">`;
      } catch (error) {
        console.error(
          "Failed to read image file for overlay:",
          item.path,
          error
        );
        return "";
      }
    })
    .join("");
}

// --- NEW: Refactored function for tray creation ---
function createTray() {
  if (tray) return; // Already exists
  const iconPath = path.join(__dirname, "icon.png");
  tray = new Tray(iconPath);
  const contextMenu = Menu.buildFromTemplate([
    { label: "Show App", click: () => mainWindow.show() },
    {
      label: "Quit",
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);
  tray.setToolTip("Wifu Engine");
  tray.setContextMenu(contextMenu);
  tray.on("click", () => {
    if (mainWindow) {
      mainWindow.show();
    }
  });
}

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
    icon: path.join(__dirname, "icon.png"),
  });

  mainWindow.loadFile("index.html");
  mainWindow.setMenuBarVisibility(false);

  // --- MODIFIED: "close" event (Feature 3) ---
  // Now ensures the tray is created before hiding
  mainWindow.on("close", (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      createTray(); // Ensure tray exists
      mainWindow.hide();
    }
  });
};

const _createActualOverlay = (htmlContent) => {
  try {
    const tempDir = app.getPath("temp");
    tempOverlayFile = path.join(tempDir, `overlay-${Date.now()}.html`);
    fs.writeFileSync(tempOverlayFile, htmlContent);
  } catch (error) {
    console.error("Failed to write temporary overlay file:", error);
    return;
  }

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.size;

  overlayWindow = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });

  overlayWindow.setAlwaysOnTop(true, "screen-saver");
  overlayWindow.setIgnoreMouseEvents(true);
  overlayWindow.loadFile(tempOverlayFile);

  overlayWindow.once("ready-to-show", () => {
    if (overlayWindow) {
      overlayWindow.show();
    }
  });

  overlayWindow.on("closed", () => {
    if (tempOverlayFile && fs.existsSync(tempOverlayFile)) {
      try {
        fs.unlinkSync(tempOverlayFile);
      } catch (error) {
        console.error("Failed to delete temp overlay file:", error);
      }
    }
    tempOverlayFile = null;
    overlayWindow = null;
  });
};

const createOverlay = (htmlContent) => {
  if (overlayWindow) {
    overlayWindow.once("closed", () => {
      _createActualOverlay(htmlContent);
    });
    overlayWindow.close();
  } else {
    _createActualOverlay(htmlContent);
  }
};

// --- MODIFIED: app.whenReady (Feature 1) ---
app.whenReady().then(() => {
  initializeAppData(); // Creates paths and loads appData

  // Apply startup setting
  app.setLoginItemSettings({
    openAtLogin: appData.settings.startOnStartup,
    args: ["--hidden"], // Add this argument to detect startup launch
  });

  createWindow();

  const launchedAtLogin = process.argv.includes("--hidden");

  // Handle auto-apply overlay on startup
  if (launchedAtLogin && appData.settings.loadLastPreset) {
    if (
      appData.lastAppliedOverlayItems &&
      appData.lastAppliedOverlayItems.length > 0
    ) {
      const htmlContent = generateOverlayHtml(appData.lastAppliedOverlayItems);
      const fullHtml = `<!DOCTYPE html><html><head><style>body{margin:0; overflow:hidden;}</style></head><body>${htmlContent}</body></html>`;
      if (htmlContent.trim()) {
        createOverlay(fullHtml);
      }
    }
    mainWindow.hide(); // Start minimized to tray
    createTray();
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
    else mainWindow.show(); // Show existing window on activate
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (tempOverlayFile && fs.existsSync(tempOverlayFile)) {
    fs.unlinkSync(tempOverlayFile);
  }
  if (tray) {
    tray.destroy();
  }
});

ipcMain.handle("get-screen-size", () => {
  const primaryDisplay = screen.getPrimaryDisplay();
  return primaryDisplay.size;
});

// --- MODIFIED: "apply-overlay" (Feature 1) ---
// Now saves the applied items as the "last applied overlay"
ipcMain.on("apply-overlay", (event, items) => {
  const overlayHtmlContent = generateOverlayHtml(items);
  if (!overlayHtmlContent.trim()) return;

  // Save these items as the last applied overlay
  appData.lastAppliedOverlayItems = items;
  saveAppData();

  const fullHtml = `<!DOCTYPE html><html><head><style>body{margin:0; overflow:hidden;}</style></head><body>${overlayHtmlContent}</body></html>`;
  createOverlay(fullHtml);
});

ipcMain.on("remove-overlay", () => {
  if (overlayWindow) overlayWindow.close();
});

// --- MODIFIED: "minimize-to-tray" (Feature 3) ---
// Uses the new createTray function
ipcMain.on("minimize-to-tray", () => {
  createTray();
  mainWindow.hide();
});

// --- MODIFIED: "load-data" ---
// Now just returns the already-loaded global appData
ipcMain.handle("load-data", async () => {
  return appData;
});

// --- MODIFIED: "save-data" ---
// This now only saves gallery and presets. Settings are saved separately.
ipcMain.handle("save-data", async (event, data) => {
  try {
    appData.gallery = data.gallery;
    appData.presets = data.presets;
    saveAppData();
    return { success: true };
  } catch (error) {
    console.error("Failed to save data file:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("import-gallery-files", async () => {
  const { filePaths } = await dialog.showOpenDialog({
    title: "Import GIFs",
    properties: ["openFile", "multiSelections"],
    filters: [{ name: "Images", extensions: ["gif", "png", "jpg", "jpeg"] }],
  });

  if (!filePaths || filePaths.length === 0) {
    return [];
  }

  const importedFiles = [];
  for (const filePath of filePaths) {
    try {
      const fileName = `${Date.now()}-${path.basename(filePath)}`;
      const newPath = path.join(galleryPath, fileName);
      fs.copyFileSync(filePath, newPath);
      importedFiles.push({
        id: `gallery_${crypto.randomUUID()}`,
        path: newPath,
      });
    } catch (error) {
      console.error(`Failed to copy file: ${filePath}`, error);
    }
  }
  return importedFiles;
});

// --- NEW: IPC Handlers for Settings (Feature 1) ---
ipcMain.handle("get-settings", async () => {
  return appData.settings;
});

ipcMain.handle("set-settings", async (event, settings) => {
  try {
    appData.settings = settings;
    saveAppData();

    // Apply startup setting immediately
    app.setLoginItemSettings({
      openAtLogin: appData.settings.startOnStartup,
      args: ["--hidden"],
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to set settings:", error);
    return { success: false, error: error.message };
  }
});

// --- NEW: IPC Handler for Deleting Gallery Item (Feature 2 & 2.1) ---
ipcMain.handle("delete-gallery-item", async (event, galleryId) => {
  try {
    const galleryItem = appData.gallery.find((g) => g.id === galleryId);
    if (!galleryItem) {
      throw new Error("Item not found in gallery data.");
    }

    // 1. Delete physical file
    if (fs.existsSync(galleryItem.path)) {
      fs.unlinkSync(galleryItem.path);
    }

    // 2. Remove from appData.gallery
    appData.gallery = appData.gallery.filter((g) => g.id !== galleryId);

    // 2.1. Remove from all presets
    appData.presets = appData.presets.map((preset) => {
      preset.items = preset.items.filter(
        (item) => item.galleryId !== galleryId
      );
      return preset;
    });

    // 2.1. Remove from lastAppliedOverlayItems (which stores by path)
    appData.lastAppliedOverlayItems = appData.lastAppliedOverlayItems.filter(
      (item) => item.path !== galleryItem.path
    );

    // 3. Save the updated data
    saveAppData();

    // 4. Return the new state
    return appData;
  } catch (error) {
    console.error(`Failed to delete gallery item ${galleryId}:`, error);
    return { success: false, error: error.message };
  }
});
