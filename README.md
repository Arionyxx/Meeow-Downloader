# Meeow-Downloader 🐱⬇️

> A purr-fectly designed download manager with a cozy cat theme.

![Meeow-Downloader Preview](https://placehold.co/600x400?text=Meeow+Downloader+Preview)

## 📖 Overview

Meeow-Downloader is a cross-platform download manager built with modern web technologies. It combines powerful download management features with a delightful cat-themed interface, now refreshed with a modern, polished look making your downloading experience efficient and adorable.

## ✨ Features

- **📦 Download Queue**: Efficiently manage multiple downloads with priority handling.
- **🌪️ Torrent Support**: Built-in torrent client with magnet link and .torrent file support.
- **⏯️ Pause/Resume**: Interrupt and continue downloads at your convenience.
- **💻 Cross-Platform**: Works seamlessly on Windows, Linux, and macOS.
- **🔗 Auto-Capture**: Automatically detects download links and magnet links from your clipboard.
- **🎨 Modern UI**: A freshly polished interface with responsive design, better typography, and smooth transitions.
- **🐱 Cat Theming**: Enjoy a "meow-tastic" user interface with customizable themes.

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v18 or higher
- **Package Manager**: [pnpm](https://pnpm.io/) (recommended), npm, or yarn
- **Operating System**: Windows, Linux, or macOS

## 📥 Installation

### Arch Linux

1. Download the latest `.AppImage` release from the [Releases](https://github.com/meow-dev/meeow-downloader/releases) page.
2. Make the file executable:
   ```bash
   chmod +x Meeow-Downloader-x.x.x.AppImage
   ```
3. Run the application:
   ```bash
   ./Meeow-Downloader-x.x.x.AppImage
   ```

### Windows

1. Download the latest `.exe` installer from the [Releases](https://github.com/meow-dev/meeow-downloader/releases) page.
2. Run the installer and follow the on-screen instructions.
3. The application will launch automatically after installation.

### Verifying Releases

You can verify the integrity of the downloaded files by checking the SHA256 checksum provided with the release.

## 🚀 Development Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/meow-dev/meeow-downloader.git
   cd meeow-downloader
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Run locally:**
   Start the development server with hot-reload:
   ```bash
   pnpm dev
   ```

## 🏗️ Building and Packaging

To create production builds:

- **Build for all configured platforms:**

  ```bash
  pnpm build && pnpm package
  ```

- **Build for Linux (AppImage):**

  ```bash
  pnpm dist:linux
  ```

- **Build for Windows (NSIS):**
  ```bash
  pnpm dist:win
  ```

> **Note:** Building for Windows on Linux requires Wine. See [BUILD.md](./BUILD.md) for details.

## 📂 Project Structure

The project follows a standard Electron-Vite structure:

```
src/
├── main/       # Electron main process (backend logic, download management)
├── preload/    # Preload scripts (IPC bridge, context isolation)
└── renderer/   # React application (frontend UI, components)
```

## 🧩 Architecture

- **Main Process**: Handles native OS interactions, file system access, and core download logic using `electron-store` and native APIs. Includes a dedicated `TorrentManager` for P2P downloads.
- **Renderer Process**: A React application that provides the UI. It communicates with the Main process via IPC (Inter-Process Communication).
- **IPC**: Safe communication bridge exposed via `preload` scripts, allowing the renderer to request downloads and receive status updates.

## 💻 Technology Stack

- **Runtime**: [Electron](https://www.electronjs.org/)
- **Frontend**: [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/) + [electron-vite](https://electron-vite.org/)
- **Packaging**: [electron-builder](https://www.electron.build/)

## 📜 Available Scripts

| Script            | Description                              |
| :---------------- | :--------------------------------------- |
| `pnpm dev`        | Start the development server             |
| `pnpm build`      | Build the production code                |
| `pnpm lint`       | Run ESLint to check code quality         |
| `pnpm format`     | Format code using Prettier               |
| `pnpm package`    | Package the application for distribution |
| `pnpm dist:linux` | Build AppImage for Linux                 |
| `pnpm dist:win`   | Build Installer for Windows              |

## ⚙️ Settings and Configuration

Configuration is handled via the "Settings" panel in the application:

- **Default Download Directory**: Set your preferred folder for saving files.
- **Max Concurrent Downloads**: Limit the number of active downloads (1-10).
- **Enable Notifications**: Toggle desktop notifications for completed downloads.
- **Auto Capture**: Enable automatic link detection from clipboard (URLs and Magnet links).
- **Torrent Settings**: Configure default download location for torrents and seeding behavior.
- **Theme**: Switch between Light, Dark, or System theme preference.

## 🤝 Contributing

We welcome contributions! If you'd like to help improve Meeow-Downloader:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add some amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

## 📄 License

This project is licensed under the **ISC License**.

## 📞 Support

Have questions or feedback? Reach out to us!

- **Email**: meow@example.com
- **Twitter**: @MeowDownloader
- **Issues**: [GitHub Issues](https://github.com/meow-dev/meeow-downloader/issues)

---

_Built with 🐱 and ☕ by the Meeow Team._
