import fs from 'node:fs';
import path from 'node:path';
import { AppSettings, AuditRecord } from './types.js';

export const DEFAULT_SETTINGS: AppSettings = {
  protectionEnabled: true,
  autoSanitize: false,
  startWithWindows: false,
  closeToTray: true,
  notificationsEnabled: true,
  notificationSound: true,
  retentionDays: 30,
  auditMaxRecords: 1000,
  whitelistedPatterns: [],
};

export class StorageManager {
  private dataDir: string;
  private settingsFile: string;
  private auditFile: string;
  private cachedSettings: AppSettings | null = null;
  private cachedAudits: AuditRecord[] | null = null;
  private isWriting = false;

  constructor(dataDirectory: string) {
    this.dataDir = dataDirectory;
    this.settingsFile = path.join(this.dataDir, 'settings.json');
    this.auditFile = path.join(this.dataDir, 'audit_ledger.json');
    this.ensureDirectory();
  }

  private ensureDirectory(): void {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true, mode: 0o700 });
      }
    } catch (err) {
      console.error('[StorageManager] Failed to create data directory:', err);
    }
  }

  /**
   * Atomic write to file: writes to temp file first, then atomically replaces destination
   */
  private atomicWriteFileSync(filePath: string, content: string): void {
    const tempFile = `${filePath}.tmp.${Date.now()}.${Math.random().toString(36).slice(2, 8)}`;
    try {
      this.ensureDirectory();
      fs.writeFileSync(tempFile, content, { encoding: 'utf8', mode: 0o600 });
      // Rename is atomic on POSIX and NTFS (if destination exists, renameSync replaces it)
      fs.renameSync(tempFile, filePath);
    } catch (err) {
      // Clean up temp file if rename or write failed
      try {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      } catch {
        // ignore
      }
      throw err;
    }
  }

  /**
   * Loads settings from disk with graceful fallback and schema migration
   */
  public getSettings(): AppSettings {
    if (this.cachedSettings) {
      return { ...this.cachedSettings };
    }

    if (!fs.existsSync(this.settingsFile)) {
      this.cachedSettings = { ...DEFAULT_SETTINGS };
      this.saveSettings(this.cachedSettings);
      return { ...this.cachedSettings };
    }

    try {
      const raw = fs.readFileSync(this.settingsFile, 'utf8');
      const parsed = JSON.parse(raw);

      // Validate schema and merge with defaults for any missing properties
      this.cachedSettings = {
        protectionEnabled: typeof parsed.protectionEnabled === 'boolean' ? parsed.protectionEnabled : DEFAULT_SETTINGS.protectionEnabled,
        autoSanitize: typeof parsed.autoSanitize === 'boolean' ? parsed.autoSanitize : DEFAULT_SETTINGS.autoSanitize,
        startWithWindows: typeof parsed.startWithWindows === 'boolean' ? parsed.startWithWindows : DEFAULT_SETTINGS.startWithWindows,
        closeToTray: typeof parsed.closeToTray === 'boolean' ? parsed.closeToTray : DEFAULT_SETTINGS.closeToTray,
        notificationsEnabled: typeof parsed.notificationsEnabled === 'boolean' ? parsed.notificationsEnabled : DEFAULT_SETTINGS.notificationsEnabled,
        notificationSound: typeof parsed.notificationSound === 'boolean' ? parsed.notificationSound : DEFAULT_SETTINGS.notificationSound,
        retentionDays: typeof parsed.retentionDays === 'number' && parsed.retentionDays > 0 ? parsed.retentionDays : DEFAULT_SETTINGS.retentionDays,
        auditMaxRecords: typeof parsed.auditMaxRecords === 'number' && parsed.auditMaxRecords > 0 ? parsed.auditMaxRecords : DEFAULT_SETTINGS.auditMaxRecords,
        whitelistedPatterns: Array.isArray(parsed.whitelistedPatterns) ? parsed.whitelistedPatterns : [],
      };
      return { ...this.cachedSettings };
    } catch (err) {
      console.warn('[StorageManager] Settings file corrupt or unreadable, recovering with defaults:', err);
      this.cachedSettings = { ...DEFAULT_SETTINGS };
      this.saveSettings(this.cachedSettings);
      return { ...this.cachedSettings };
    }
  }

  /**
   * Saves settings to disk atomically
   */
  public saveSettings(settings: Partial<AppSettings>): AppSettings {
    const current = this.getSettings();
    const updated: AppSettings = { ...current, ...settings };
    this.cachedSettings = updated;

    try {
      this.atomicWriteFileSync(this.settingsFile, JSON.stringify(updated, null, 2));
    } catch (err) {
      console.error('[StorageManager] Failed to persist settings:', err);
    }

    return { ...updated };
  }

  /**
   * Retrieves audit ledger records
   */
  public getAuditRecords(): AuditRecord[] {
    if (this.cachedAudits) {
      return [...this.cachedAudits];
    }

    if (!fs.existsSync(this.auditFile)) {
      this.cachedAudits = [];
      return [];
    }

    try {
      const raw = fs.readFileSync(this.auditFile, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        this.cachedAudits = parsed;
        return [...this.cachedAudits];
      }
      this.cachedAudits = [];
      return [];
    } catch (err) {
      console.warn('[StorageManager] Audit file corrupt or unreadable, recovering:', err);
      this.cachedAudits = [];
      return [];
    }
  }

  /**
   * Appends an audit record to the ledger
   */
  public appendAuditRecord(record: AuditRecord): void {
    const list = this.getAuditRecords();
    list.unshift(record);

    const settings = this.getSettings();
    if (list.length > settings.auditMaxRecords) {
      list.length = settings.auditMaxRecords;
    }

    this.cachedAudits = list;

    try {
      this.atomicWriteFileSync(this.auditFile, JSON.stringify(list, null, 2));
    } catch (err) {
      console.error('[StorageManager] Failed to persist audit record:', err);
    }
  }

  /**
   * Clears audit history
   */
  public clearAuditRecords(): boolean {
    this.cachedAudits = [];
    try {
      this.atomicWriteFileSync(this.auditFile, JSON.stringify([], null, 2));
      return true;
    } catch (err) {
      console.error('[StorageManager] Failed to clear audit ledger:', err);
      return false;
    }
  }
}
