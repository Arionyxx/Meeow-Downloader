# Build Instructions

## Prerequisites

### General

- Node.js (v18 or later recommended)
- npm (or pnpm/yarn)

### Linux

No special requirements for building AppImage on Linux.

### Windows

To build for Windows (NSIS) on a Linux machine, **Wine** is required.

#### Installing Wine on Ubuntu/Debian:

```bash
sudo dpkg --add-architecture i386
sudo apt-get update
sudo apt-get install -y wine64 wine32
```

## Building

### Install Dependencies

```bash
npm install
```

### Build for Linux (AppImage)

```bash
npm run dist:linux
```

The artifact will be in `dist/`.

### Build for Windows (NSIS)

```bash
npm run dist:win
```

The artifact will be in `dist/`.

## Smoke Testing

After building, you can run the AppImage directly:

```bash
./dist/MeowPalette-1.0.0.AppImage
```

(Note: might require `--no-sandbox` in some environments)
