import { ipcMain, shell, BrowserWindow, app } from 'electron';
import os from 'node:os';
import { ClipboardMonitor } from './clipboardMonitor.js';
import { StorageManager } from './storage.js';
import { UpdateChecker } from './updater.js';
import { AppSettings, SystemInfo } from './types.js';

export function registerIpcHandlers(
  monitor: ClipboardMonitor,
  storage: StorageManager,
  getMainWindow: () => BrowserWindow | null
): void {
  // Protection Status
  ipcMain.handle('get-protection-status', () => {
    return monitor.getStatus();
  });

  ipcMain.handle('set-protection-enabled', (_event, enabled: boolean) => {
    if (typeof enabled !== 'boolean') {
      throw new Error('Invalid parameter: enabled must be boolean');
    }
    monitor.setProtectionEnabled(enabled);
    return true;
  });

  ipcMain.handle('set-auto-sanitize', (_event, enabled: boolean) => {
    if (typeof enabled !== 'boolean') {
      throw new Error('Invalid parameter: enabled must be boolean');
    }
    monitor.setAutoSanitize(enabled);
    return true;
  });

  // Settings
  ipcMain.handle('get-settings', () => {
    return storage.getSettings();
  });

  ipcMain.handle('update-settings', (_event, patch: Partial<AppSettings>) => {
    if (!patch || typeof patch !== 'object') {
      throw new Error('Invalid settings object');
    }

    // Sanitize and validate incoming settings
    const validPatch: Partial<AppSettings> = {};
    if (typeof patch.protectionEnabled === 'boolean') {
      validPatch.protectionEnabled = patch.protectionEnabled;
      monitor.setProtectionEnabled(patch.protectionEnabled);
    }
    if (typeof patch.autoSanitize === 'boolean') {
      validPatch.autoSanitize = patch.autoSanitize;
      monitor.setAutoSanitize(patch.autoSanitize);
    }
    if (typeof patch.startWithWindows === 'boolean') {
      validPatch.startWithWindows = patch.startWithWindows;
      try {
        app.setLoginItemSettings({
          openAtLogin: patch.startWithWindows,
          path: process.execPath,
        });
      } catch (err) {
        console.error('[IPC] Failed to update login item settings:', err);
      }
    }
    if (typeof patch.closeToTray === 'boolean') {
      validPatch.closeToTray = patch.closeToTray;
    }
    if (typeof patch.notificationsEnabled === 'boolean') {
      validPatch.notificationsEnabled = patch.notificationsEnabled;
    }
    if (typeof patch.notificationSound === 'boolean') {
      validPatch.notificationSound = patch.notificationSound;
    }
    if (typeof patch.retentionDays === 'number' && patch.retentionDays > 0) {
      validPatch.retentionDays = Math.min(patch.retentionDays, 365);
    }
    if (typeof patch.auditMaxRecords === 'number' && patch.auditMaxRecords > 0) {
      validPatch.auditMaxRecords = Math.min(patch.auditMaxRecords, 10000);
    }

    return storage.saveSettings(validPatch);
  });

  // Audit Records
  ipcMain.handle('get-audit-records', () => {
    return storage.getAuditRecords();
  });

  ipcMain.handle('clear-audit-records', () => {
    return storage.clearAuditRecords();
  });

  // System Diagnostics Info
  ipcMain.handle('get-system-info', (): SystemInfo => {
    return {
      version: '1.4.0',
      electronVersion: process.versions.electron || 'unknown',
      chromeVersion: process.versions.chrome || 'unknown',
      nodeVersion: process.versions.node || 'unknown',
      platform: process.platform,
      arch: process.arch,
      osRelease: `${os.type()} ${os.release()}`,
      userDataPath: app.getPath('userData'),
    };
  });

  // Update Check
  ipcMain.handle('check-for-updates', async () => {
    return UpdateChecker.checkForUpdates();
  });

  // External URL Navigation (hardened: strictly HTTP / HTTPS only)
  ipcMain.handle('open-external-url', async (_event, rawUrl: string) => {
    if (typeof rawUrl !== 'string') return false;
    try {
      const parsed = new URL(rawUrl);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        await shell.openExternal(parsed.toString());
        return true;
      }
      return false;
    } catch {
      return false;
    }
  });

  // Window Controls
  ipcMain.handle('minimize-window', () => {
    const win = getMainWindow();
    if (win) win.minimize();
  });

  ipcMain.handle('close-window', () => {
    const win = getMainWindow();
    if (win) win.close();
  });

  ipcMain.handle('quit-app', () => {
    const win = getMainWindow();
    if (win) {
      (win as any).__isQuitting = true;
    }
    app.quit();
  });
}
