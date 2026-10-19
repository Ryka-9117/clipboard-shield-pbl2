import { describe, it, expect } from 'vitest';
import {
  ThreatDetector,
  validateLuhn,
  maskCreditCard,
  maskSecret,
  maskCrypto,
  maskUpi,
  computeSha256,
} from '../electron/threatDetector.js';

describe('ThreatDetector & Luhn Algorithm', () => {
  it('validates genuine credit card numbers via Luhn checksum', () => {
    // Valid standard test PANs
    expect(validateLuhn('4532015112830366')).toBe(true); // Visa test (16 digits)
    expect(validateLuhn('5424180123456789')).toBe(true); // Mastercard test (16 digits)
    expect(validateLuhn('378282246310005')).toBe(true);  // Amex test (15 digits)
    expect(validateLuhn('6011111111111117')).toBe(true); // Discover test (16 digits)
  });

  it('rejects invalid numbers or corrupted check digits', () => {
    expect(validateLuhn('49927398717')).toBe(false);
    expect(validateLuhn('1234567890123456')).toBe(false);
    expect(validateLuhn('123')).toBe(false); // too short
  });

  it('correctly detects Luhn-verified credit cards in text', () => {
    const text = 'Payment authorization for card 4532-0151-1283-0366 expiring 12/28';
    const result = ThreatDetector.scan(text);
    expect(result).not.toBeNull();
    expect(result?.category).toBe('CREDIT_CARD');
    expect(result?.ruleName).toContain('Payment Card');
    expect(result?.maskedPreview).toContain('4532 •••• •••• 0366');
  });

  it('detects AWS Access Key IDs', () => {
    const text = 'export AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE';
    const result = ThreatDetector.scan(text);
    expect(result).not.toBeNull();
    expect(result?.category).toBe('SECRET_TOKEN');
    expect(result?.ruleName).toBe('AWS Access Key ID');
    expect(result?.maskedPreview).toBe('AKIA••••••••LE');
  });

  it('detects GitHub Personal Access Tokens', () => {
    const text = 'ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const result = ThreatDetector.scan(text);
    expect(result).not.toBeNull();
    expect(result?.category).toBe('SECRET_TOKEN');
    expect(result?.ruleName).toBe('GitHub Access Token');
    expect(result?.maskedPreview).toContain('ghp_••••••••');
  });

  it('detects RSA/EC Private Key blocks', () => {
    const text = '-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA0...\n-----END RSA PRIVATE KEY-----';
    const result = ThreatDetector.scan(text);
    expect(result).not.toBeNull();
    expect(result?.category).toBe('SECRET_TOKEN');
    expect(result?.ruleName).toContain('Private Key');
    expect(result?.maskedPreview).toBe('-----BEGIN PRIVATE KEY----- [REDACTED]');
  });

  it('detects JWT Tokens', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const result = ThreatDetector.scan(`Bearer ${jwt}`);
    expect(result).not.toBeNull();
    expect(result?.category).toBe('SECRET_TOKEN');
    expect(result?.ruleName).toContain('JWT');
  });

  it('detects Ethereum public wallet addresses', () => {
    const eth = '0x71C837C34e81561730076214A36b6942C344E998';
    const result = ThreatDetector.scan(`Send payment to ${eth}`);
    expect(result).not.toBeNull();
    expect(result?.category).toBe('CRYPTO_WALLET');
    expect(result?.ruleName).toContain('Ethereum');
    expect(result?.maskedPreview).toBe('0x71C8...E998');
  });

  it('detects Bitcoin wallet addresses', () => {
    const btc = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
    const result = ThreatDetector.scan(`BTC: ${btc}`);
    expect(result).not.toBeNull();
    expect(result?.category).toBe('CRYPTO_WALLET');
    expect(result?.ruleName).toContain('Bitcoin');
  });

  it('detects Indian UPI VPAs and distinguishes them from ordinary emails', () => {
    const upiText = 'Please send ₹500 to merchant.pay@okaxis';
    const upiResult = ThreatDetector.scan(upiText);
    expect(upiResult).not.toBeNull();
    expect(upiResult?.category).toBe('UPI_FINANCIAL');
    expect(upiResult?.maskedPreview).toBe('me****@okaxis');

    // Ordinary email address must NOT trigger false positive
    const emailText = 'Contact our support team at support@gmail.com for help';
    const emailResult = ThreatDetector.scan(emailText);
    expect(emailResult).toBeNull();
  });

  it('detects Confidential OTP verification codes', () => {
    const otpText = 'Your secret OTP is 948102 for online transaction. Do not share.';
    const result = ThreatDetector.scan(otpText);
    expect(result).not.toBeNull();
    expect(result?.category).toBe('OTP_CODE');
    expect(result?.maskedPreview).toBe('OTP: ••••02');
  });

  it('handles empty, null, or clean text gracefully', () => {
    expect(ThreatDetector.scan('')).toBeNull();
    expect(ThreatDetector.scan('Hello world, this is a clean string with no secrets.')).toBeNull();
  });

  it('sanitizes text replacing secrets with secure placeholders', () => {
    const text = 'Target wallet is 0x71C837C34e81561730076214A36b6942C344E998 now';
    const threat = ThreatDetector.scan(text);
    expect(threat).not.toBeNull();
    const sanitized = ThreatDetector.sanitize(text, threat!);
    expect(sanitized).toBe('Target wallet is [CLIPBOARD SHIELD PROTECTED: CRYPTO_WALLET] now');
    expect(sanitized).not.toContain('0x71C8');
  });

  it('computes deterministic SHA-256 hashes without leaking raw secrets', () => {
    const hash1 = computeSha256('secret-payload');
    const hash2 = computeSha256('secret-payload');
    const hash3 = computeSha256('different-payload');
    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash1).toHaveLength(64);
  });
});
