# Clipboard Shield — Development Guide

## 1. Prerequisites

Before developing or building Clipboard Shield from source, verify that your workstation has the following installed:
- **Node.js:** v20.x or newer (Tested on Node.js v24.21.0).
- **npm:** v10.x or newer (Tested on npm 11.19.0).
- **Git:** 2.x+.
- **Operating System:** Windows 10/11 64-bit (recommended for testing native Win32 clipboard hooks and system tray).

---

## 2. Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/ryka-parikh/clipboard-shield-pbl2.git
cd clipboard-shield-pbl2
```

### 2. Install dependencies
```bash
npm install --legacy-peer-deps
```

### 3. Generate icon assets (if modifying brand artwork)
```bash
node scripts/generate-icons.mjs
```
This generates multi-resolution ICO and PNG assets inside `build/`.

---

## 3. Development Workflow

### Running the Web Showcase
To run the Vite web development server with hot module replacement:
```bash
npm run dev
```
Navigate to `http://localhost:3000` in your web browser.

### Running the Native Desktop Shell
To compile the TypeScript main process and launch Electron:
```bash
npm run build:all
npx electron .
```

---

## 4. Testing & Verification

### Running Automated Test Suites
Run the full Vitest suite testing the regex engine, Luhn validation, storage persistence, and boundary conditions:
```bash
npm run test
```

### Type Checking & Linting
Validate TypeScript types across both renderer and main processes:
```bash
npm run lint
```

---

## 5. Production Packaging

### Build Windows Installer & Portable Binary
```bash
npm run package:win
```
Output artifacts are saved to `release/`:
- `release/Clipboard-Shield-Setup-1.4.0.exe` (NSIS setup installer)
- `release/Clipboard-Shield-1.4.0-portable.exe` (Standalone portable executable)
- `release/SHA256SUMS.txt` (Integrity checksums)

### Build Unpacked Directory (Fast Developer Verification)
```bash
npm run package:dir
```
Outputs unpacked binaries to `release/win-unpacked/Clipboard Shield.exe`.

---

## 6. Project Architecture Directory Map

```text
clipboard-shield/
├── .github/workflows/          # Automated GitHub Actions CI/CD pipeline
├── build/                      # High-resolution application and tray icons
├── dist/                       # Minified Vite production client build
├── dist-electron/              # Compiled TypeScript main process binaries
├── docs/                       # Architectural and technical documentation
│   ├── ARCHITECTURE.md
│   ├── INSTALLATION.md
│   ├── DEVELOPMENT.md
│   ├── RELEASING.md
│   ├── SECURITY.md
│   └── TROUBLESHOOTING.md
├── electron/                   # Native Electron host backend
│   ├── clipboardMonitor.ts     # Real-time clipboard poller and sanitizer
│   ├── ipcHandlers.ts          # Validated IPC gateway
│   ├── main.ts                 # Single-instance lock and window lifecycle
│   ├── preload.ts              # Sandboxed contextBridge API
│   ├── storage.ts              # Atomic settings and audit ledger manager
│   ├── threatDetector.ts       # Deterministic Luhn, card, crypto, and token scanner
│   ├── tray.ts                 # Windows system tray manager
│   ├── types.ts                # Main process TypeScript definitions
│   └── updater.ts              # GitHub release and semver update checker
├── release/                    # Built installers and checksums (git-ignored)
├── scripts/                    # Icon generation and utility scripts
├── src/                        # React 19 Frontend Web and Desktop UI
│   ├── components/             # UI sections (DesktopDashboard, Simulator, etc.)
│   ├── types/                  # Shared TypeScript definitions
│   ├── utils/                  # Audio cues, file generators
│   ├── App.tsx                 # Root application component
│   └── main.tsx                # Client entry point
├── tests/                      # Automated Vitest suites
├── package.json                # Dependencies, build scripts, and electron-builder config
├── tsconfig.json               # Renderer TypeScript configuration
├── tsconfig.electron.json      # Main process TypeScript configuration
└── vite.config.ts              # Vite bundler configuration
```
