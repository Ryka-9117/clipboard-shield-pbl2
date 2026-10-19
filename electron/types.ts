export type ProtectionState = 'ACTIVE' | 'PAUSED' | 'DEGRADED' | 'STOPPED';

export type ThreatCategory =
  | 'CREDIT_CARD'
  | 'CRYPTO_WALLET'
  | 'SECRET_TOKEN'
  | 'UPI_FINANCIAL'
  | 'OTP_CODE'
  | 'IBAN_ACCOUNT'
  | 'CUSTOM_RULE';

export type ThreatAction = 'ALERTED' | 'SANITIZED' | 'CLEARED' | 'BLOCKED_BY_USER';

export interface ThreatDetectionResult {
  category: ThreatCategory;
  ruleName: string;
  description: string;
  maskedPreview: string;
  matchedPattern: string;
  confidence: number;
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
  actionTaken: ThreatAction;
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

export interface AuditRecord {
  id: string;
  timestamp: string;
  timestampMs: number;
  alertMsg: string;
  category: ThreatCategory;
  action: 'APPROVED' | 'CANCELLED' | 'SANITIZED' | 'ALERTED';
  platform: 'WINDOWS' | 'ANDROID' | 'WEB';
  payloadHash: string;
  signature: string;
  maskedPreview: string;
}

export interface ProtectionStatus {
  state: ProtectionState;
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
