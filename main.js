// main.js

// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, screen, Tray, Menu } = require("electron");
const path = require("path");
const fs = require("fs");

// Keep a global reference of the window objects to prevent them from being garbage collected.
let mainWindow;
let overlayWindow;
let tray = null;
let tempOverlayFile = null; // Variable to hold the path to the temporary file

const createWindow = () => {
  // Create the main application window.
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    webPreferences: {
      // Attach the preload script to expose APIs to the renderer
      preload: path.join(__dirname, "preload.js"),
    },
    icon: path.join(__dirname, "icon.png"), // Set window icon
  });

  // Load the index.html of the app.
  mainWindow.loadFile("index.html");

  // Instead of quitting, hide the window when the user clicks 'close'.
  // The app can be fully closed from the system tray context menu.
  mainWindow.on("close", (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
};

// Function to create the transparent overlay window
const createOverlay = (htmlContent) => {
  if (overlayWindow) {
    overlayWindow.close();
  }

  // Write the overlay HTML to a temporary file.
  try {
    const tempDir = app.getPath("temp");
    tempOverlayFile = path.join(tempDir, `overlay-${Date.now()}.html`);
    fs.writeFileSync(tempOverlayFile, htmlContent);
  } catch (error) {
    console.error("Failed to write temporary overlay file:", error);
    return; // Stop if we can't create the file
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
    show: false, // <-- FIX: Create the window but keep it hidden initially.
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  overlayWindow.setIgnoreMouseEvents(true);

  overlayWindow.loadFile(tempOverlayFile);

  // FIX: Use the 'ready-to-show' event. This event fires only when the
  // webpage has been rendered. Showing the window here prevents visual
  // glitches and is more reliable for transparent windows in a built app.
  overlayWindow.once("ready-to-show", () => {
    overlayWindow.show();
  });

  overlayWindow.on("closed", () => {
    // Clean up the temporary file and clear the window reference.
    if (tempOverlayFile) {
      try {
        if (fs.existsSync(tempOverlayFile)) {
          fs.unlinkSync(tempOverlayFile);
        }
      } catch (error) {
        console.error(
          "Failed to delete temporary overlay file:",
          tempOverlayFile,
          error
        );
      }
    }
    tempOverlayFile = null;
    overlayWindow = null;
  });
};

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

ipcMain.handle("get-screen-size", () => {
  const primaryDisplay = screen.getPrimaryDisplay();
  return primaryDisplay.size;
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.on("apply-overlay", (event, items) => {
  //Close existing overlay if any
  if (overlayWindow) {
    overlayWindow.close();
  }

  const overlayHtmlContent = items
    .map((item) => {
      try {
        const imageBuffer = fs.readFileSync(item.path);
        const imageBase64 = imageBuffer.toString("base64");
        const mimeType = `image/${path.extname(item.path).slice(1) || "png"}`;
        const imageSrc = `data:${mimeType};base64,${imageBase64}`;

        return `<img src="${imageSrc}" class="overlay-item" style="left: ${item.left}%; top: ${item.top}%; width: ${item.width}px; height: ${item.height}px;">`;
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

  if (!overlayHtmlContent.trim()) {
    console.error(
      "Overlay content is empty. No images were processed successfully."
    );
    return;
  }

  const fullHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { margin: 0; overflow: hidden; background-color: transparent; }
          .overlay-item {
              position: absolute;
              user-select: none;
          }
        </style>
      </head>
      <body>${overlayHtmlContent}</body>
    </html>
  `;
  createOverlay(fullHtml);
});

ipcMain.on("remove-overlay", () => {
  if (overlayWindow) {
    // Calling .close() will trigger the 'closed' event where all cleanup happens.
    overlayWindow.close();
  }
});

ipcMain.on("minimize-to-tray", () => {
  if (!tray) {
    const iconPath = path.join(__dirname, "icon.png");
    try {
      tray = new Tray(iconPath);

      const contextMenu = Menu.buildFromTemplate([
        {
          label: "Show App",
          click: () => {
            mainWindow.show();
          },
        },
        {
          label: "Quit",
          click: () => {
            app.isQuitting = true;
            app.quit();
          },
        },
      ]);

      tray.setToolTip("Overlay Creator");
      tray.setContextMenu(contextMenu);

      tray.on("click", () => {
        mainWindow.show();
      });
    } catch (error) {
      console.error("Failed to create system tray icon.", error);
      console.error("Please ensure 'icon.png' exists in the project root.");
    }
  }
  mainWindow.hide();
});

app.on("before-quit", () => {
  // Also clean up temp file on quit if overlay is active
  if (tempOverlayFile && fs.existsSync(tempOverlayFile)) {
    try {
      fs.unlinkSync(tempOverlayFile);
    } catch (error) {
      console.error("Could not clean up temp file on quit:", error);
      return;
    } finally {
      if (tray) {
        tray.destroy();
      }
      tempOverlayFile = null;
    }
  }
});
