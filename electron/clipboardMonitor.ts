import { clipboard, Notification } from 'electron';
import { ThreatDetector, computeSha256 } from './threatDetector.js';
import { StorageManager } from './storage.js';
import { ProtectionState, ProtectionStatus, ThreatEvent, AuditRecord } from './types.js';

export interface ClipboardMonitorCallbacks {
  onThreatDetected?: (threat: ThreatEvent) => void;
  onStatusChanged?: (status: ProtectionStatus) => void;
  onAuditAdded?: (record: AuditRecord) => void;
}

export class ClipboardMonitor {
  private storage: StorageManager;
  private callbacks: ClipboardMonitorCallbacks;
  private state: ProtectionState = 'ACTIVE';
  private timer: NodeJS.Timeout | null = null;
  private lastHash: string = '';
  private lastSelfWriteHash: string = '';
  private checkIntervalMs = 500;
  private startTime = Date.now();
  private scansPerformed = 0;
  private threatsDetected = 0;
  private lastThreatTimestamp?: string;
  private consecutiveErrors = 0;

  constructor(storage: StorageManager, callbacks: ClipboardMonitorCallbacks = {}) {
    this.storage = storage;
    this.callbacks = callbacks;
  }

  public start(): void {
    const settings = this.storage.getSettings();
    if (!settings.protectionEnabled) {
      this.state = 'PAUSED';
      this.notifyStatus();
      return;
    }

    this.state = 'ACTIVE';
    this.consecutiveErrors = 0;

    // Seed initial hash to avoid alerting on existing clipboard at launch
    clipboard.readText().then((initial) => {
      this.lastHash = computeSha256(initial);
    }).catch(() => {
      this.lastHash = '';
    });

    if (this.timer) {
      clearInterval(this.timer);
    }

    this.timer = setInterval(() => {
      this.tick().catch((err) => {
        console.error('[ClipboardMonitor] Tick error:', err);
      });
    }, this.checkIntervalMs);
    this.notifyStatus();
  }

  public pause(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.state = 'PAUSED';
    this.notifyStatus();
  }

  public resume(): void {
    this.start();
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.state = 'STOPPED';
    this.notifyStatus();
  }

  public setAutoSanitize(enabled: boolean): void {
    this.storage.saveSettings({ autoSanitize: enabled });
    this.notifyStatus();
  }

  public setProtectionEnabled(enabled: boolean): void {
    this.storage.saveSettings({ protectionEnabled: enabled });
    if (enabled) {
      this.resume();
    } else {
      this.pause();
    }
  }

  public getStatus(): ProtectionStatus {
    const settings = this.storage.getSettings();
    return {
      state: this.state,
      protectionEnabled: settings.protectionEnabled && this.state === 'ACTIVE',
      autoSanitize: settings.autoSanitize,
      startWithWindows: settings.startWithWindows,
      closeToTray: settings.closeToTray,
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      scansPerformed: this.scansPerformed,
      threatsDetected: this.threatsDetected,
      lastThreatTimestamp: this.lastThreatTimestamp,
      version: '1.4.0',
    };
  }

  private notifyStatus(): void {
    if (this.callbacks.onStatusChanged) {
      this.callbacks.onStatusChanged(this.getStatus());
    }
  }

  private async tick(): Promise<void> {
    if (this.state !== 'ACTIVE') return;

    try {
      this.scansPerformed++;
      const currentText = await clipboard.readText();

      // Skip empty clipboard
      if (!currentText || currentText.trim().length === 0) {
        return;
      }

      const currentHash = computeSha256(currentText);

      // Skip if unchanged or written by ourselves during auto-sanitize
      if (currentHash === this.lastHash || currentHash === this.lastSelfWriteHash) {
        return;
      }

      this.lastHash = currentHash;
      this.consecutiveErrors = 0;

      // Scan text with deterministic pattern engine
      const threat = ThreatDetector.scan(currentText);
      if (threat) {
        this.threatsDetected++;
        const now = new Date();
        const timeStr = now.toTimeString().split(' ')[0];
        this.lastThreatTimestamp = timeStr;

        const settings = this.storage.getSettings();
        let actionTaken: 'SANITIZED' | 'ALERTED' = 'ALERTED';

        if (settings.autoSanitize) {
          const sanitizedText = ThreatDetector.sanitize(currentText, threat);
          this.lastSelfWriteHash = computeSha256(sanitizedText);
          await clipboard.writeText(sanitizedText);
          actionTaken = 'SANITIZED';
        }

        const threatEvent: ThreatEvent = {
          id: `threat_${Date.now()}`,
          timestamp: timeStr,
          timestampMs: now.getTime(),
          category: threat.category,
          ruleName: threat.ruleName,
          description: threat.description,
          maskedPreview: threat.maskedPreview,
          payloadHash: currentHash,
          actionTaken,
        };

        const auditRecord: AuditRecord = {
          id: threatEvent.id,
          timestamp: timeStr,
          timestampMs: now.getTime(),
          alertMsg: `${threat.ruleName}: ${threat.maskedPreview}`,
          category: threat.category,
          action: actionTaken,
          platform: 'WINDOWS',
          payloadHash: currentHash,
          signature: `SHA256:${currentHash.slice(0, 16)}`,
          maskedPreview: threat.maskedPreview,
        };

        // Persist to audit ledger
        this.storage.appendAuditRecord(auditRecord);

        // Notify Windows user via OS toast/notification
        if (settings.notificationsEnabled && Notification.isSupported()) {
          const title = actionTaken === 'SANITIZED' ? '🛡️ Clipboard Shield Sanitized Threat' : '⚠️ Clipboard Shield Threat Alert';
          const body = `${threat.ruleName} detected: ${threat.maskedPreview}${actionTaken === 'SANITIZED' ? ' (Sanitized)' : ''}`;
          const notif = new Notification({
            title,
            body,
            silent: !settings.notificationSound,
          });
          notif.show();
        }

        // Trigger renderer callbacks
        if (this.callbacks.onThreatDetected) {
          this.callbacks.onThreatDetected(threatEvent);
        }
        if (this.callbacks.onAuditAdded) {
          this.callbacks.onAuditAdded(auditRecord);
        }

        this.notifyStatus();
      }
    } catch (err) {
      this.consecutiveErrors++;
      if (this.consecutiveErrors > 5) {
        this.state = 'DEGRADED';
        console.error('[ClipboardMonitor] Entering degraded state due to clipboard read errors:', err);
        this.notifyStatus();
      }
    }
  }
}
