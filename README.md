# Wifu Engine 🌸

> A modern, lightweight, cross-platform desktop application for creating and managing beautiful, transparent, click-through desktop overlays with your favorite animated GIFs and images. Perfect for personalizing your workspace or enhancing streaming setups.

![Version](https://img.shields.io/badge/version-1.0.3-pink.svg)
![Electron](https://img.shields.io/badge/Electron-28+-47848F?logo=electron&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15+-black?logo=next.js&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue?logo=typescript&logoColor=white)

---

## ✨ Features

- **🌸 Modern Neon Dark Interface**: Re-engineered with Next.js App Router, Tailwind CSS v4, Lucide Icons, and Framer Motion micro-animations with a frameless custom titlebar.
- **🖼️ Persistent Asset Gallery**: Import animated GIFs, PNGs, WebP, and JPGs directly into the app. Assets are copied into your local user data directory with instant thumbnail previews and base64 caching.
- **🖌️ Aspect-Ratio Preserving Canvas Editor**:
  - **Proportional Scaling**: 8-direction resize handles that preserve media aspect ratios without distortion.
  - **Rotation & Ordering**: 360° rotation handles (with Shift-to-snap 45° increments), duplicate, layer ordering (Bring Forward / Send Backward), and instant deletion.
  - **Dynamic Resolutions**: Quick presets (1080p, 1440p, 4K, 720p), auto-detect native display resolution, or custom Width x Height canvas dimensions.
- **💾 Layout Preset Manager**: Save complex multi-character overlay compositions with custom names and descriptions. Edit, overwrite, or apply presets directly to the screen.
- **🚀 One-Click Transparent Overlay**: Apply your canvas creation as a seamless, click-through, always-on-top desktop overlay that runs over any window or taskbar.
- **⚙️ System Tray & Automation**:
  - Minimize to system tray for distraction-free background operation.
  - Optional Windows startup integration with auto-apply for your last active overlay configuration.

---

## 🛠️ Tech Stack

- **Desktop Framework**: [Electron](https://www.electronjs.org/)
- **Renderer Frontend**: [Next.js](https://nextjs.org/) (Static HTML Export `output: 'export'`)
- **Styling & Theme**: [Tailwind CSS v4](https://tailwindcss.com/) (`@tailwindcss/postcss`)
- **Icons & Motion**: [Lucide React](https://lucide.dev/) & [Framer Motion](https://www.framer.com/motion/)
- **Packaging**: [electron-builder](https://www.electron.build/)

---

## 🚀 Quickstart

### Prerequisites
- **Node.js**: v18+ recommended
- **npm** or **pnpm** / **yarn**

### Installation

```bash
# Clone the repository
git clone https://github.com/shariarSultanFahim/wifu-engine.git

# Navigate into the project directory
cd wifu-engine

# Install dependencies
npm install
```

---

## 💻 Development & Building

### Run in Development Mode
Starts Next.js development server with hot-reloading concurrently with Electron:
```bash
npm run dev
```

### Run Packaged Renderer in Electron
Runs Electron loading the compiled static build from `out/`:
```bash
npm start
```

### Build Production App
Compiles Next.js static renderer and packages the application installer:
```bash
# Compile Next.js renderer export (out/)
npm run build:renderer

# Build Windows NSIS installer and unpacked standalone app (dist/)
npm run build
```

Generated installer and binaries will be output to the `dist/` directory:
- `dist/Wifu Engine Setup 1.0.3.exe`
- `dist/win-unpacked/`

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
