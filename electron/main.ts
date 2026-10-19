import { app, BrowserWindow, nativeImage } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { StorageManager } from './storage.js';
import { ClipboardMonitor } from './clipboardMonitor.js';
import { TrayManager } from './tray.js';
import { registerIpcHandlers } from './ipcHandlers.js';
import { ThreatEvent, ProtectionStatus, AuditRecord } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Enforce single-instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  console.log('[Main] Another instance is already running. Exiting duplicate instance.');
  app.quit();
  process.exit(0);
}

let mainWindow: BrowserWindow | null = null;
let trayManager: TrayManager | null = null;
let isQuitting = false;

// Initialize Storage and Monitor
const userDataDir = app.getPath('userData');
const storage = new StorageManager(userDataDir);

const monitor = new ClipboardMonitor(storage, {
  onThreatDetected: (threat: ThreatEvent) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('threat-detected', threat);
    }
  },
  onStatusChanged: (status: ProtectionStatus) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('protection-status-changed', status);
    }
    if (trayManager) {
      trayManager.updateMenu();
    }
  },
  onAuditAdded: (record: AuditRecord) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('audit-added', record);
    }
  },
});

function createWindow(): BrowserWindow {
  const iconPath = path.resolve(__dirname, process.platform === 'win32' ? '../build/icon.ico' : '../build/icon.png');
  const appIcon = nativeImage.createFromPath(iconPath);

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 1024,
    minHeight: 700,
    title: 'Clipboard Shield',
    icon: appIcon.isEmpty() ? undefined : appIcon,
    backgroundColor: '#06141d',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });

  // Security: Block unauthorized popups and external window opening
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const parsed = new URL(url);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        import('electron').then(({ shell }) => shell.openExternal(parsed.toString()));
      }
    } catch {
      // ignore
    }
    return { action: 'deny' };
  });

  // Security: Prevent in-app navigation away from our application
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const isLocalFile = navigationUrl.startsWith('file://');
    const isDevServer = process.env.VITE_DEV_SERVER_URL && navigationUrl.startsWith(process.env.VITE_DEV_SERVER_URL);
    if (!isLocalFile && !isDevServer) {
      event.preventDefault();
      import('electron').then(({ shell }) => shell.openExternal(navigationUrl));
    }
  });

  // Handle window close behavior (Close to Tray vs Quit)
  mainWindow.on('close', (event) => {
    const shouldQuit = isQuitting || (mainWindow as any)?.__isQuitting;
    const settings = storage.getSettings();

    if (!shouldQuit && settings.closeToTray) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  // Load the web app (production dist/index.html or dev server)
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.resolve(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  return mainWindow;
}

// Handle second instance activation
app.on('second-instance', () => {
  if (mainWindow) {
    if (!mainWindow.isVisible()) {
      mainWindow.show();
    }
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
  }
});

app.whenReady().then(() => {
  // Set application user model ID for Windows notifications
  if (process.platform === 'win32') {
    app.setAppUserModelId('io.clipboardshield.desktop');
  }

  // Register IPC handlers
  registerIpcHandlers(monitor, storage, () => mainWindow);

  // Initialize Tray
  const trayIconPath = path.resolve(__dirname, process.platform === 'win32' ? '../build/tray.ico' : '../build/tray.png');
  trayManager = new TrayManager(monitor, storage, () => mainWindow, trayIconPath);
  trayManager.init();

  // Create main window
  createWindow();

  // Start native clipboard protection daemon
  monitor.start();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else if (mainWindow) {
      mainWindow.show();
    }
  });
});

app.on('before-quit', () => {
  isQuitting = true;
  if (mainWindow) {
    (mainWindow as any).__isQuitting = true;
  }
  monitor.stop();
  if (trayManager) {
    trayManager.destroy();
  }
});

app.on('window-all-closed', () => {
  const settings = storage.getSettings();
  if (!settings.closeToTray || isQuitting) {
    app.quit();
  }
});
