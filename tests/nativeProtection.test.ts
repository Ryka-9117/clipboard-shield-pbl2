import { describe, it, expect } from 'vitest';
import { ThreatDetector } from '../electron/threatDetector.js';

describe('Native Protection & Threat Model Boundary Tests', () => {
  it('handles Unicode characters and international currency symbols', () => {
    const unicodePayload = '🚨 Urgent: ₹15,400 transferred to test.merchant@okhdfcbank via UPI 🛡️';
    const result = ThreatDetector.scan(unicodePayload);
    expect(result).not.toBeNull();
    expect(result?.category).toBe('UPI_FINANCIAL');
    expect(result?.maskedPreview).toBe('te****@okhdfcbank');
  });

  it('handles large clipboard buffers safely without memory bloat or ReDoS', () => {
    // Generate 1 MB of repetitive filler text with a secret embedded in the middle
    const filler = 'The quick brown fox jumps over the lazy dog. '.repeat(10000);
    const largePayload = `${filler}\nAWS_SECRET_KEY=AKIAIOSFODNN7EXAMPLE\n${filler}`;

    const start = performance.now();
    const result = ThreatDetector.scan(largePayload);
    const duration = performance.now() - start;

    expect(result).not.toBeNull();
    expect(result?.category).toBe('SECRET_TOKEN');
    expect(duration).toBeLessThan(500); // Must scan in under 500ms
  });

  it('guarantees that raw sensitive credentials are never stored in the masked preview', () => {
    const secretCard = '4532 0151 1283 0366';
    const secretKey = 'AKIAIOSFODNN7EXAMPLE';
    const secretToken = 'ghp_1234567890abcdefghijklmnopqrstuvwxyzAB';

    const cardRes = ThreatDetector.scan(`Card: ${secretCard}`);
    const keyRes = ThreatDetector.scan(`Key: ${secretKey}`);
    const tokenRes = ThreatDetector.scan(`Token: ${secretToken}`);

    // Verify raw secret is absent from maskedPreview
    expect(cardRes?.maskedPreview).not.toContain('0151');
    expect(cardRes?.maskedPreview).not.toContain('1283');

    expect(keyRes?.maskedPreview).not.toContain('IOSFODNN7EX');

    expect(tokenRes?.maskedPreview).not.toContain('1234567890abcdef');
  });

  it('handles malformed, undefined, null, and non-string inputs safely', () => {
    expect(ThreatDetector.scan(null as unknown as string)).toBeNull();
    expect(ThreatDetector.scan(undefined as unknown as string)).toBeNull();
    expect(ThreatDetector.scan(123456 as unknown as string)).toBeNull();
    expect(ThreatDetector.scan({} as unknown as string)).toBeNull();
    expect(ThreatDetector.scan(true as unknown as string)).toBeNull();
  });

  it('does not falsely trigger on normal text or programming code', () => {
    const cleanCode = `
      function calculateTotal(price: number, taxRate: number): number {
        const tax = price * taxRate;
        return price + tax;
      }
      const sum = calculateTotal(100, 0.18);
      console.log('Total calculated:', sum);
    `;
    expect(ThreatDetector.scan(cleanCode)).toBeNull();
  });
});
