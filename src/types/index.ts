export type Platform = 'android' | 'windows' | 'ios' | 'macos' | 'linux';

export interface NotificationItem {
  id: string;
  sender: string;
  appName: string;
  title: string;
  text: string;
  timestamp: string;
  isFinancial: boolean;
  matchedKeywords: string[];
  amount?: string;
}

export type ThreatCategory =
  | 'CREDIT_CARD'
  | 'CRYPTO_WALLET'
  | 'SECRET_TOKEN'
  | 'UPI_FINANCIAL'
  | 'OTP_CODE'
  | 'IBAN_ACCOUNT'
  | 'CUSTOM_RULE';

export interface AuditRecord {
  id: string;
  timestamp: string;
  timestampMs?: number;
  alertMsg: string;
  action: 'APPROVED' | 'CANCELLED' | 'SANITIZED' | 'ALERTED';
  platform: string;
  payloadHash: string;
  signature: string;
  merchantOrParty?: string;
  amount?: string;
  category?: ThreatCategory;
  maskedPreview?: string;
}

export interface DownloadPackage {
  platform: Platform;
  title: string;
  fileExtension: string;
  version: string;
  size: string;
  recommendedOs: string;
  description: string;
  iconName: string;
}

export interface ProtectionStatus {
  state: 'ACTIVE' | 'PAUSED' | 'DEGRADED' | 'STOPPED';
  protectionEnabled: boolean;
  autoSanitize: boolean;
  startWithWindows: boolean;
  closeToTray: boolean;
  uptimeSeconds: number;
  scansPerformed: number;
  threatsDetected: number;
  lastThreatTimestamp?: string;
  version: string;
}

export interface AppSettings {
  protectionEnabled: boolean;
  autoSanitize: boolean;
  startWithWindows: boolean;
  closeToTray: boolean;
  notificationsEnabled: boolean;
  notificationSound: boolean;
  retentionDays: number;
  auditMaxRecords: number;
  whitelistedPatterns: string[];
}

export interface SystemInfo {
  version: string;
  electronVersion: string;
  chromeVersion: string;
  nodeVersion: string;
  platform: string;
  arch: string;
  osRelease: string;
  userDataPath: string;
}

export interface UpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion?: string;
  releaseName?: string;
  releaseNotes?: string;
  publishedAt?: string;
  downloadUrl?: string;
  sha256?: string;
  error?: string;
}

export interface ThreatEvent {
  id: string;
  timestamp: string;
  timestampMs: number;
  category: ThreatCategory;
  ruleName: string;
  description: string;
  maskedPreview: string;
  payloadHash: string;
  actionTaken: 'ALERTED' | 'SANITIZED' | 'CLEARED' | 'BLOCKED_BY_USER';
}

export interface IElectronAPI {
  getStatus: () => Promise<ProtectionStatus>;
  setProtectionEnabled: (enabled: boolean) => Promise<boolean>;
  setAutoSanitize: (enabled: boolean) => Promise<boolean>;
  getSettings: () => Promise<AppSettings>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<AppSettings>;
  getAuditRecords: () => Promise<AuditRecord[]>;
  clearAuditRecords: () => Promise<boolean>;
  getSystemInfo: () => Promise<SystemInfo>;
  checkForUpdates: () => Promise<UpdateInfo>;
  openExternalUrl: (url: string) => Promise<boolean>;
  minimizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  quitApp: () => Promise<void>;
  onThreatDetected: (callback: (threat: ThreatEvent) => void) => () => void;
  onStatusChanged: (callback: (status: ProtectionStatus) => void) => () => void;
  onAuditAdded: (callback: (record: AuditRecord) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: IElectronAPI;
  }
}
