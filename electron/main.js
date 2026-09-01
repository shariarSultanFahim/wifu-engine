const {
  app,
  BrowserWindow,
  ipcMain,
  screen,
  Tray,
  Menu,
  dialog,
  protocol,
} = require("electron");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

// Register custom scheme as privileged before app is ready
protocol.registerSchemesAsPrivileged([
  {
    scheme: "app",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
  {
    scheme: "media",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

let mainWindow = null;
let overlayWindow = null;
let tray = null;
let tempOverlayFile = null;

const isDev = process.env.NODE_ENV === "development";

const userDataPath = app.getPath("userData");
const galleryPath = path.join(userDataPath, "gallery");
const dataFilePath = path.join(userDataPath, "data.json");

const defaultAppData = {
  gallery: [],
  presets: [],
  settings: { startOnStartup: false, loadLastPreset: true, defaultResolution: "1920x1080" },
  lastAppliedOverlayItems: [],
};

let appData = { ...defaultAppData };

function initializeAppData() {
  if (!fs.existsSync(galleryPath)) {
    fs.mkdirSync(galleryPath, { recursive: true });
  }

  try {
    if (fs.existsSync(dataFilePath)) {
      const data = fs.readFileSync(dataFilePath, "utf-8");
      const parsedData = JSON.parse(data);
      appData = {
        ...defaultAppData,
        ...parsedData,
        settings: { ...defaultAppData.settings, ...parsedData.settings },
      };
    } else {
      fs.writeFileSync(dataFilePath, JSON.stringify(appData, null, 2));
    }
  } catch (error) {
    console.error("Failed to load data.json, using defaults:", error);
  }
}

function saveAppData() {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(appData, null, 2));
  } catch (error) {
    console.error("Failed to save data file:", error);
  }
}

function getFileDataUrl(filePath) {
  try {
    if (!filePath || !fs.existsSync(filePath)) return "";
    const fileBuffer = fs.readFileSync(filePath);
    const base64 = fileBuffer.toString("base64");
    const ext = path.extname(filePath).slice(1).toLowerCase() || "png";
    const mimeType =
      ext === "gif"
        ? "image/gif"
        : ext === "jpg" || ext === "jpeg"
        ? "image/jpeg"
        : ext === "webp"
        ? "image/webp"
        : ext === "svg"
        ? "image/svg+xml"
        : "image/png";
    return `data:${mimeType};base64,${base64}`;
  } catch {
    return "";
  }
}

function generateOverlayHtml(items) {
  return items
    .map((item) => {
      try {
        if (!item.path || !fs.existsSync(item.path)) {
          console.warn(`Skipping missing overlay item: ${item.path}`);
          return "";
        }
        const imageSrc = getFileDataUrl(item.path);
        if (!imageSrc) return "";
        const transform = `transform: rotate(${item.rotation || 0}deg);`;
        return `<img src="${imageSrc}" style="position: absolute; left: ${item.left}%; top: ${item.top}%; width: ${item.width}px; height: ${item.height}px; ${transform} object-fit: contain; user-select: none; pointer-events: none;">`;
      } catch (error) {
        console.error("Failed to read image file for overlay:", item.path, error);
        return "";
      }
    })
    .join("");
}

function createTray() {
  if (tray) return;
  const iconPath = path.join(__dirname, "../icon.png");
  tray = new Tray(iconPath);
  const contextMenu = Menu.buildFromTemplate([
    { label: "Show Wifu Engine", click: () => { if (mainWindow) { mainWindow.show(); mainWindow.focus(); } } },
    { type: "separator" },
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
      mainWindow.focus();
    }
  });
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".webp": "image/webp",
    ".txt": "text/plain; charset=utf-8",
  };
  return mimeTypes[ext] || "application/octet-stream";
}

function registerAppProtocol() {
  // Protocol for serving Next.js exported files (app://bundle/...)
  protocol.handle("app", async (request) => {
    try {
      const parsedUrl = new URL(request.url);
      let relativePath = decodeURIComponent(parsedUrl.pathname).replace(/^[/\\]+/, "");
      if (!relativePath || relativePath === "") {
        relativePath = "index.html";
      }

      const outDir = path.resolve(__dirname, "../out");
      let targetPath = path.resolve(outDir, relativePath);

      if (!targetPath.startsWith(outDir)) {
        return new Response("Forbidden", { status: 403 });
      }

      if (!fs.existsSync(targetPath) || fs.statSync(targetPath).isDirectory()) {
        const indexInDir = path.join(targetPath, "index.html");
        if (fs.existsSync(indexInDir)) {
          targetPath = indexInDir;
        } else {
          targetPath = path.join(outDir, "index.html");
        }
      }

      const fileBuffer = await fs.promises.readFile(targetPath);
      const mimeType = getMimeType(targetPath);

      return new Response(fileBuffer, {
        status: 200,
        headers: {
          "Content-Type": mimeType,
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (err) {
      console.error("Error serving app protocol:", err);
      return new Response("Not Found", { status: 404 });
    }
  });

  // Protocol for serving local media files (media://...)
  protocol.handle("media", async (request) => {
    try {
      const url = new URL(request.url);
      let filePath = decodeURIComponent(url.pathname);
      if (/^\/[a-zA-Z]:/.test(filePath)) {
        filePath = filePath.slice(1);
      }
      if (fs.existsSync(filePath)) {
        const data = await fs.promises.readFile(filePath);
        const mime = getMimeType(filePath);
        return new Response(data, {
          headers: {
            "Content-Type": mime,
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
      return new Response("Not Found", { status: 404 });
    } catch (err) {
      return new Response(err.message, { status: 500 });
    }
  });
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    frame: false,
    titleBarStyle: "hidden",
    backgroundColor: "#0a0d14",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    icon: path.join(__dirname, "../icon.png"),
  });

  mainWindow.setMenuBarVisibility(false);

  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:3000").catch(() => {
      mainWindow.loadURL("app://bundle/index.html");
    });
  } else {
    mainWindow.loadURL("app://bundle/index.html");
  }

  mainWindow.on("maximize", () => {
    mainWindow.webContents.send("window:maximize-change", true);
  });

  mainWindow.on("unmaximize", () => {
    mainWindow.webContents.send("window:maximize-change", false);
  });

  mainWindow.on("close", (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      createTray();
      mainWindow.hide();
    }
  });
}

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

app.whenReady().then(() => {
  registerAppProtocol();
  initializeAppData();

  app.setLoginItemSettings({
    openAtLogin: appData.settings.startOnStartup,
    args: ["--hidden"],
  });

  createMainWindow();

  const launchedAtLogin = process.argv.includes("--hidden");

  if (launchedAtLogin && appData.settings.loadLastPreset) {
    if (appData.lastAppliedOverlayItems && appData.lastAppliedOverlayItems.length > 0) {
      const htmlContent = generateOverlayHtml(appData.lastAppliedOverlayItems);
      const fullHtml = `<!DOCTYPE html><html><head><style>body{margin:0; overflow:hidden; background:transparent;}</style></head><body>${htmlContent}</body></html>`;
      if (htmlContent.trim()) {
        createOverlay(fullHtml);
      }
    }
    mainWindow.hide();
    createTray();
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    else if (mainWindow) mainWindow.show();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (tempOverlayFile && fs.existsSync(tempOverlayFile)) {
    try {
      fs.unlinkSync(tempOverlayFile);
    } catch {}
  }
  if (tray) {
    tray.destroy();
  }
});

// IPC Window Controls
ipcMain.on("window:minimize", () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on("window:maximize", () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on("window:close", () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle("window:is-maximized", () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

// Screen and Overlay IPC
ipcMain.handle("get-screen-size", () => {
  const primaryDisplay = screen.getPrimaryDisplay();
  return primaryDisplay.size;
});

ipcMain.on("apply-overlay", (event, items) => {
  const overlayHtmlContent = generateOverlayHtml(items);
  if (!overlayHtmlContent.trim()) return;

  appData.lastAppliedOverlayItems = items;
  saveAppData();

  const fullHtml = `<!DOCTYPE html><html><head><style>body{margin:0; overflow:hidden; background:transparent;}</style></head><body>${overlayHtmlContent}</body></html>`;
  createOverlay(fullHtml);
});

ipcMain.on("remove-overlay", () => {
  if (overlayWindow) overlayWindow.close();
});

ipcMain.on("minimize-to-tray", () => {
  createTray();
  if (mainWindow) mainWindow.hide();
});

// Helper to enrich all appData with fresh preview URLs
function getEnrichedAppData() {
  return {
    ...appData,
    gallery: (appData.gallery || []).map((item) => ({
      ...item,
      previewUrl: item.previewUrl || getFileDataUrl(item.path),
    })),
    presets: (appData.presets || []).map((preset) => ({
      ...preset,
      items: (preset.items || []).map((item) => ({
        ...item,
        previewUrl: item.previewUrl || getFileDataUrl(item.path),
      })),
    })),
    lastAppliedOverlayItems: (appData.lastAppliedOverlayItems || []).map((item) => ({
      ...item,
      previewUrl: item.previewUrl || getFileDataUrl(item.path),
    })),
  };
}

// Data IPC
ipcMain.handle("load-data", async () => {
  return getEnrichedAppData();
});

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
    title: "Import GIFs & Images",
    properties: ["openFile", "multiSelections"],
    filters: [{ name: "Images", extensions: ["gif", "png", "jpg", "jpeg", "webp"] }],
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
      
      const previewUrl = getFileDataUrl(newPath);

      importedFiles.push({
        id: `gallery_${crypto.randomUUID()}`,
        name: path.basename(filePath),
        path: newPath,
        previewUrl,
        size: fs.statSync(newPath).size,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`Failed to copy file: ${filePath}`, error);
    }
  }
  return importedFiles;
});

ipcMain.handle("get-settings", async () => {
  return appData.settings;
});

ipcMain.handle("set-settings", async (event, settings) => {
  try {
    appData.settings = settings;
    saveAppData();

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

ipcMain.handle("delete-gallery-item", async (event, galleryId) => {
  try {
    const galleryItem = appData.gallery.find((g) => g.id === galleryId);
    if (!galleryItem) {
      throw new Error("Item not found in gallery data.");
    }

    if (fs.existsSync(galleryItem.path)) {
      fs.unlinkSync(galleryItem.path);
    }

    appData.gallery = appData.gallery.filter((g) => g.id !== galleryId);

    appData.presets = appData.presets.map((preset) => {
      preset.items = preset.items.filter((item) => item.galleryId !== galleryId);
      return preset;
    });

    appData.lastAppliedOverlayItems = appData.lastAppliedOverlayItems.filter(
      (item) => item.path !== galleryItem.path
    );

    saveAppData();
    return getEnrichedAppData();
  } catch (error) {
    console.error(`Failed to delete gallery item ${galleryId}:`, error);
    return { success: false, error: error.message };
  }
});
