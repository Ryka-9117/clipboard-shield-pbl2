import { Tray, Menu, nativeImage, app, BrowserWindow } from 'electron';
import path from 'node:path';
import { ClipboardMonitor } from './clipboardMonitor.js';
import { StorageManager } from './storage.js';

export class TrayManager {
  private tray: Tray | null = null;
  private monitor: ClipboardMonitor;
  private storage: StorageManager;
  private getMainWindow: () => BrowserWindow | null;
  private iconPath: string;

  constructor(
    monitor: ClipboardMonitor,
    storage: StorageManager,
    getMainWindow: () => BrowserWindow | null,
    iconPath: string
  ) {
    this.monitor = monitor;
    this.storage = storage;
    this.getMainWindow = getMainWindow;
    this.iconPath = iconPath;
  }

  public init(): void {
    const icon = nativeImage.createFromPath(this.iconPath);
    this.tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon);
    this.tray.setToolTip('Clipboard Shield - Native Interceptor');

    this.tray.on('click', () => {
      this.showDashboard();
    });

    this.tray.on('double-click', () => {
      this.showDashboard();
    });

    this.updateMenu();
  }

  public updateMenu(): void {
    if (!this.tray) return;

    const status = this.monitor.getStatus();
    const settings = this.storage.getSettings();
    const isActive = status.state === 'ACTIVE';

    const contextMenu = Menu.buildFromTemplate([
      {
        label: `Clipboard Shield: ${isActive ? 'Active 🛡️' : 'Paused ⏸️'}`,
        enabled: false,
      },
      { type: 'separator' },
      {
        label: 'Open Dashboard',
        click: () => this.showDashboard(),
      },
      {
        label: 'Protection Enabled',
        type: 'checkbox',
        checked: status.protectionEnabled,
        click: (menuItem) => {
          this.monitor.setProtectionEnabled(menuItem.checked);
          this.updateMenu();
        },
      },
      {
        label: 'Auto-Sanitize Threats',
        type: 'checkbox',
        checked: status.autoSanitize,
        click: (menuItem) => {
          this.monitor.setAutoSanitize(menuItem.checked);
          this.updateMenu();
        },
      },
      {
        label: 'Start with Windows',
        type: 'checkbox',
        checked: settings.startWithWindows,
        click: (menuItem) => {
          this.storage.saveSettings({ startWithWindows: menuItem.checked });
          try {
            app.setLoginItemSettings({
              openAtLogin: menuItem.checked,
              path: process.execPath,
            });
          } catch (err) {
            console.error('[TrayManager] Failed to set login item settings:', err);
          }
          this.updateMenu();
        },
      },
      { type: 'separator' },
      {
        label: 'Clear Audit Ledger',
        click: () => {
          this.storage.clearAuditRecords();
        },
      },
      { type: 'separator' },
      {
        label: 'Quit Clipboard Shield',
        click: () => {
          const win = this.getMainWindow();
          if (win) {
            // Prevent close-to-tray cancellation during explicit quit
            (win as any).__isQuitting = true;
          }
          app.quit();
        },
      },
    ]);

    this.tray.setContextMenu(contextMenu);
    this.tray.setToolTip(`Clipboard Shield (${isActive ? 'Active' : 'Paused'})`);
  }

  public showDashboard(): void {
    const win = this.getMainWindow();
    if (win) {
      if (!win.isVisible()) {
        win.show();
      }
      if (win.isMinimized()) {
        win.restore();
      }
      win.focus();
    }
  }

  public destroy(): void {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}
