import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { StorageManager, DEFAULT_SETTINGS } from '../electron/storage.js';
import { AuditRecord } from '../electron/types.js';

describe('StorageManager', () => {
  let testDir: string;
  let storage: StorageManager;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cs-test-'));
    storage = new StorageManager(testDir);
  });

  afterEach(() => {
    try {
      fs.rmSync(testDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  it('initializes with default settings on clean install', () => {
    const settings = storage.getSettings();
    expect(settings.protectionEnabled).toBe(true);
    expect(settings.autoSanitize).toBe(false);
    expect(settings.startWithWindows).toBe(false);
    expect(settings.closeToTray).toBe(true);
  });

  it('persists and retrieves updated settings atomically', () => {
    storage.saveSettings({ autoSanitize: true, closeToTray: false });
    const freshStorage = new StorageManager(testDir);
    const loaded = freshStorage.getSettings();
    expect(loaded.autoSanitize).toBe(true);
    expect(loaded.closeToTray).toBe(false);
    expect(loaded.protectionEnabled).toBe(true); // preserves unchanged
  });

  it('recovers gracefully from corrupted JSON settings files', () => {
    const settingsPath = path.join(testDir, 'settings.json');
    fs.writeFileSync(settingsPath, 'INVALID_CORRUPTED_JSON{[{');

    const freshStorage = new StorageManager(testDir);
    const recovered = freshStorage.getSettings();
    expect(recovered).toEqual(DEFAULT_SETTINGS);
  });

  it('appends and loads audit records while enforcing max retention limit', () => {
    storage.saveSettings({ auditMaxRecords: 5 });

    for (let i = 1; i <= 8; i++) {
      const record: AuditRecord = {
        id: `rec_${i}`,
        timestamp: '12:00:00',
        timestampMs: Date.now() + i,
        alertMsg: `Alert ${i}`,
        category: 'CREDIT_CARD',
        action: 'ALERTED',
        platform: 'WINDOWS',
        payloadHash: `hash_${i}`,
        signature: `sig_${i}`,
        maskedPreview: `4111 •••• •••• ${i}`,
      };
      storage.appendAuditRecord(record);
    }

    const freshStorage = new StorageManager(testDir);
    const records = freshStorage.getAuditRecords();
    expect(records.length).toBe(5);
    // Most recent is first
    expect(records[0].id).toBe('rec_8');
  });

  it('clears audit records cleanly', () => {
    const record: AuditRecord = {
      id: 'rec_1',
      timestamp: '12:00:00',
      timestampMs: Date.now(),
      alertMsg: 'Alert 1',
      category: 'SECRET_TOKEN',
      action: 'SANITIZED',
      platform: 'WINDOWS',
      payloadHash: 'hash',
      signature: 'sig',
      maskedPreview: 'AKIA••••',
    };
    storage.appendAuditRecord(record);
    expect(storage.getAuditRecords().length).toBe(1);

    storage.clearAuditRecords();
    expect(storage.getAuditRecords().length).toBe(0);
  });
});
