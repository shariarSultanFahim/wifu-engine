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

function initializeAppData() {
  if (!fs.existsSync(galleryPath)) {
    fs.mkdirSync(galleryPath, { recursive: true });
  }
  if (!fs.existsSync(dataFilePath)) {
    fs.writeFileSync(
      dataFilePath,
      JSON.stringify({ gallery: [], presets: [] }, null, 2)
    );
  }
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

  mainWindow.on("close", (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
};

const createOverlay = (htmlContent) => {
  if (overlayWindow) {
    overlayWindow.close();
  }
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

  overlayWindow.setIgnoreMouseEvents(true);
  overlayWindow.loadFile(tempOverlayFile);
  overlayWindow.once("ready-to-show", () => {
    overlayWindow.show();
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

app.whenReady().then(() => {
  initializeAppData();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
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

ipcMain.on("apply-overlay", (event, items) => {
  const overlayHtmlContent = items
    .map((item) => {
      try {
        const imageBuffer = fs.readFileSync(item.path);
        const imageBase64 = imageBuffer.toString("base64");
        const mimeType = `image/${path.extname(item.path).slice(1) || "png"}`;
        const imageSrc = `data:${mimeType};base64,${imageBase64}`;
        // --- ROTATION ADDED HERE ---
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

  if (!overlayHtmlContent.trim()) return;

  const fullHtml = `<!DOCTYPE html><html><head><style>body{margin:0; overflow:hidden;}</style></head><body>${overlayHtmlContent}</body></html>`;
  createOverlay(fullHtml);
});

ipcMain.on("remove-overlay", () => {
  if (overlayWindow) overlayWindow.close();
});

ipcMain.on("minimize-to-tray", () => {
  if (!tray) {
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
    tray.on("click", () => mainWindow.show());
  }
  mainWindow.hide();
});

ipcMain.handle("load-data", async () => {
  try {
    const data = fs.readFileSync(dataFilePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to load data file:", error);
    return { gallery: [], presets: [] };
  }
});

ipcMain.handle("save-data", async (event, data) => {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
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
