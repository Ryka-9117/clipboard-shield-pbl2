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

export interface AuditRecord {
  id: string;
  timestamp: string;
  alertMsg: string;
  action: 'APPROVED' | 'CANCELLED';
  platform: string;
  payloadHash: string;
  signature: string;
  merchantOrParty?: string;
  amount?: string;
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
