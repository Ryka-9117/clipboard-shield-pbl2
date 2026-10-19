import { contextBridge, ipcRenderer } from 'electron';
import {
  ProtectionStatus,
  AppSettings,
  AuditRecord,
  SystemInfo,
  UpdateInfo,
  ThreatEvent,
} from './types.js';

const api = {
  // Status & Control
  getStatus: (): Promise<ProtectionStatus> => ipcRenderer.invoke('get-protection-status'),
  setProtectionEnabled: (enabled: boolean): Promise<boolean> =>
    ipcRenderer.invoke('set-protection-enabled', enabled),
  setAutoSanitize: (enabled: boolean): Promise<boolean> =>
    ipcRenderer.invoke('set-auto-sanitize', enabled),

  // Settings
  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke('get-settings'),
  updateSettings: (settings: Partial<AppSettings>): Promise<AppSettings> =>
    ipcRenderer.invoke('update-settings', settings),

  // Audit Records
  getAuditRecords: (): Promise<AuditRecord[]> => ipcRenderer.invoke('get-audit-records'),
  clearAuditRecords: (): Promise<boolean> => ipcRenderer.invoke('clear-audit-records'),

  // Diagnostics & System
  getSystemInfo: (): Promise<SystemInfo> => ipcRenderer.invoke('get-system-info'),
  checkForUpdates: (): Promise<UpdateInfo> => ipcRenderer.invoke('check-for-updates'),
  openExternalUrl: (url: string): Promise<boolean> => ipcRenderer.invoke('open-external-url', url),

  // Window Controls
  minimizeWindow: (): Promise<void> => ipcRenderer.invoke('minimize-window'),
  closeWindow: (): Promise<void> => ipcRenderer.invoke('close-window'),
  quitApp: (): Promise<void> => ipcRenderer.invoke('quit-app'),

  // Event Subscriptions
  onThreatDetected: (callback: (threat: ThreatEvent) => void) => {
    const handler = (_event: any, threat: ThreatEvent) => callback(threat);
    ipcRenderer.on('threat-detected', handler);
    return () => {
      ipcRenderer.removeListener('threat-detected', handler);
    };
  },

  onStatusChanged: (callback: (status: ProtectionStatus) => void) => {
    const handler = (_event: any, status: ProtectionStatus) => callback(status);
    ipcRenderer.on('protection-status-changed', handler);
    return () => {
      ipcRenderer.removeListener('protection-status-changed', handler);
    };
  },

  onAuditAdded: (callback: (record: AuditRecord) => void) => {
    const handler = (_event: any, record: AuditRecord) => callback(record);
    ipcRenderer.on('audit-added', handler);
    return () => {
      ipcRenderer.removeListener('audit-added', handler);
    };
  },
};

export type ElectronAPI = typeof api;

contextBridge.exposeInMainWorld('electronAPI', api);
