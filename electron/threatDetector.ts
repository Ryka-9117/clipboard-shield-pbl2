import crypto from 'node:crypto';
import { ThreatCategory, ThreatDetectionResult } from './types.js';

// Luhn algorithm for credit card number validation
export function validateLuhn(digits: string): boolean {
  const sanitized = digits.replace(/\D/g, '');
  if (sanitized.length < 13 || sanitized.length > 19) {
    return false;
  }

  let sum = 0;
  let shouldDouble = false;

  for (let i = sanitized.length - 1; i >= 0; i--) {
    let digit = parseInt(sanitized.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

// Masking helpers to ensure secrets are never stored or displayed in plaintext
export function maskCreditCard(digits: string): string {
  const clean = digits.replace(/[\s-]/g, '');
  if (clean.length < 8) return '•••• ••••';
  const first4 = clean.slice(0, 4);
  const last4 = clean.slice(-4);
  return `${first4} •••• •••• ${last4}`;
}

export function maskSecret(secret: string, prefixLen = 4, suffixLen = 4): string {
  if (secret.length <= prefixLen + suffixLen) {
    return '••••••••';
  }
  const start = secret.slice(0, prefixLen);
  const end = secret.slice(-suffixLen);
  return `${start}••••••••${end}`;
}

export function maskCrypto(address: string): string {
  if (address.length <= 10) return '••••••••';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function maskUpi(vpa: string): string {
  const parts = vpa.split('@');
  if (parts.length !== 2) return '••••@upi';
  const user = parts[0];
  const domain = parts[1];
  const maskedUser = user.length > 2 ? `${user.slice(0, 2)}${'*'.repeat(Math.min(user.length - 2, 4))}` : '**';
  return `${maskedUser}@${domain}`;
}

// Generate deterministic SHA-256 hash
export function computeSha256(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

// Common non-UPI domains to ignore for UPI detection
const COMMON_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'icloud.com',
  'aol.com',
  'protonmail.com',
  'proton.me',
  'zoho.com',
  'mail.com',
  'yandex.com',
]);

const KNOWN_UPI_HANDLES = new Set([
  'okaxis',
  'okhdfcbank',
  'okicici',
  'oksbi',
  'paytm',
  'ybl',
  'ibl',
  'upi',
  'axl',
  'apl',
  'barodampay',
  'federal',
  'kotak',
  'indus',
  'postbank',
  'airtel',
  'freecharge',
  'jupiteraxis',
  'slice',
  'cred',
]);

// Maximum text length to scan (protects against ReDoS and memory bloat on large files)
const MAX_SCAN_LENGTH = 512 * 1024; // 512 KB

export class ThreatDetector {
  /**
   * Scan plain text for sensitive patterns.
   * Returns detection results or null if clean.
   */
  public static scan(rawText: string): ThreatDetectionResult | null {
    if (!rawText || typeof rawText !== 'string') {
      return null;
    }

    const text = rawText.length > MAX_SCAN_LENGTH ? rawText.slice(0, MAX_SCAN_LENGTH) : rawText;

    // 1. Check for Private Keys
    const privateKeyMatch = text.match(/-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/i);
    if (privateKeyMatch) {
      return {
        category: 'SECRET_TOKEN',
        ruleName: 'Asymmetric Private Key Header',
        description: 'Detected cryptographic private key block in clipboard buffer.',
        maskedPreview: '-----BEGIN PRIVATE KEY----- [REDACTED]',
        matchedPattern: privateKeyMatch[0],
        confidence: 0.99,
      };
    }

    // 2. Check for AWS Access Keys
    const awsMatch = text.match(/\b(AKIA[0-9A-Z]{16})\b/);
    if (awsMatch) {
      return {
        category: 'SECRET_TOKEN',
        ruleName: 'AWS Access Key ID',
        description: 'Identified active AWS Cloud IAM access key ID.',
        maskedPreview: maskSecret(awsMatch[1], 4, 2),
        matchedPattern: awsMatch[1],
        confidence: 0.98,
      };
    }

    // 3. Check for GitHub Personal Access Tokens
    const ghMatch = text.match(/\b(gh[pousr]_[A-Za-z0-9_]{36,255})\b/);
    if (ghMatch) {
      return {
        category: 'SECRET_TOKEN',
        ruleName: 'GitHub Access Token',
        description: 'Identified GitHub personal authentication token.',
        maskedPreview: maskSecret(ghMatch[1], 4, 3),
        matchedPattern: ghMatch[1],
        confidence: 0.99,
      };
    }

    // 4. Check for JWT tokens
    const jwtMatch = text.match(/\b(eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})\b/);
    if (jwtMatch) {
      return {
        category: 'SECRET_TOKEN',
        ruleName: 'JSON Web Token (JWT)',
        description: 'Identified bearer authentication token (JWT session key).',
        maskedPreview: maskSecret(jwtMatch[1], 8, 6),
        matchedPattern: jwtMatch[1],
        confidence: 0.95,
      };
    }

    // 5. Check for Credit Card Numbers with Luhn verification
    const cardCandidateRegex = /\b(?:\d[ -]*?){13,19}\b/g;
    let cardMatch: RegExpExecArray | null;
    while ((cardMatch = cardCandidateRegex.exec(text)) !== null) {
      const candidateDigits = cardMatch[0].replace(/\D/g, '');
      if (candidateDigits.length >= 13 && candidateDigits.length <= 19) {
        if (validateLuhn(candidateDigits)) {
          return {
            category: 'CREDIT_CARD',
            ruleName: 'Payment Card Number (Luhn Verified)',
            description: 'Identified primary account number (Visa / Mastercard / Amex / RuPay / Discover).',
            maskedPreview: maskCreditCard(candidateDigits),
            matchedPattern: cardMatch[0],
            confidence: 0.99,
          };
        }
      }
    }

    // 6. Check for Ethereum Wallets
    const ethMatch = text.match(/\b(0x[a-fA-F0-9]{40})\b/);
    if (ethMatch) {
      return {
        category: 'CRYPTO_WALLET',
        ruleName: 'Ethereum / EVM Address',
        description: 'Detected Ethereum or EVM-compatible public wallet address.',
        maskedPreview: maskCrypto(ethMatch[1]),
        matchedPattern: ethMatch[1],
        confidence: 0.95,
      };
    }

    // 7. Check for Bitcoin Wallets (Legacy, SegWit, Bech32)
    const btcMatch = text.match(/\b(bc1[a-z0-9]{39,59}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})\b/);
    if (btcMatch) {
      return {
        category: 'CRYPTO_WALLET',
        ruleName: 'Bitcoin Wallet Address',
        description: 'Detected on-chain Bitcoin cryptocurrency recipient address.',
        maskedPreview: maskCrypto(btcMatch[1]),
        matchedPattern: btcMatch[1],
        confidence: 0.95,
      };
    }

    // 8. Check for Indian UPI IDs
    const upiRegex = /\b([a-zA-Z0-9.\-_]{2,64}@([a-zA-Z]{3,24}))\b/g;
    let upiCandidate: RegExpExecArray | null;
    while ((upiCandidate = upiRegex.exec(text)) !== null) {
      const fullVpa = upiCandidate[1];
      const handle = upiCandidate[2].toLowerCase();
      if (!COMMON_EMAIL_DOMAINS.has(handle) && (KNOWN_UPI_HANDLES.has(handle) || handle.includes('bank') || handle.includes('upi'))) {
        return {
          category: 'UPI_FINANCIAL',
          ruleName: 'Unified Payments Interface (UPI VPA)',
          description: 'Identified direct bank transfer UPI address.',
          maskedPreview: maskUpi(fullVpa),
          matchedPattern: fullVpa,
          confidence: 0.96,
        };
      }
    }

    // 9. Check for Sensitive One-Time Passwords / Verification Codes
    const otpMatch = text.match(/(?:OTP|one-time password|verification code|security code|passcode)(?:\s+(?:is|code|number))*\s*[:=-]?\s*([0-9]{4,8})\b/i);
    if (otpMatch) {
      return {
        category: 'OTP_CODE',
        ruleName: 'Confidential OTP Code',
        description: 'Detected temporary banking or authorization verification code.',
        maskedPreview: `OTP: ••••${otpMatch[1].slice(-2)}`,
        matchedPattern: otpMatch[0],
        confidence: 0.92,
      };
    }

    // 10. Check for International Bank Account Numbers (IBAN)
    const ibanMatch = text.match(/\b([A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}(?:[A-Z0-9]?){0,16})\b/);
    if (ibanMatch) {
      const iban = ibanMatch[1];
      if (iban.length >= 15 && iban.length <= 34) {
        return {
          category: 'IBAN_ACCOUNT',
          ruleName: 'International Bank Account (IBAN)',
          description: 'Identified international wire bank account number.',
          maskedPreview: maskSecret(iban, 4, 3),
          matchedPattern: iban,
          confidence: 0.90,
        };
      }
    }

    return null;
  }

  /**
   * Sanitizes text by replacing the matched threat with a secure placeholder
   */
  public static sanitize(text: string, threat: ThreatDetectionResult): string {
    const placeholder = `[CLIPBOARD SHIELD PROTECTED: ${threat.category}]`;
    return text.replace(threat.matchedPattern, placeholder);
  }
}
