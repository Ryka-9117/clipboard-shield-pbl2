# Clipboard Shield — Security Policy & Hardening Controls

## 1. Security Philosophy

Clipboard Shield is designed with security and user privacy as foundational tenets. We believe privacy tools must not compromise the user's system through excessive privileges or hidden telemetry.

---

## 2. Security Guarantees & Non-Negotiable Rules

1. **Zero Cloud Telemetry:** Clipboard Shield never transmits clipboard buffers, scanned text snippets, or user activity logs to remote analytics servers. All regex inspection and audit logging occurs strictly on-device.
2. **Zero Plaintext Storage:** Sensitive credentials (such as credit card numbers, OTP verification codes, AWS access keys, and crypto private keys) are **never written in plaintext** to `settings.json`, `audit_ledger.json`, or diagnostic logs.
3. **Cryptographic Fingerprinting:** Detected threat events are hashed with **SHA-256** to generate verifiable audit entries without retaining the raw payload.
4. **Standard User Privileges (Least Privilege):** The application runs entirely within the user's desktop session permissions. It does not require or request Administrator privileges, nor does it install kernel-mode drivers.

---

## 3. Desktop Shell Hardening

| Protection Boundary | Hardening Implementation |
| :--- | :--- |
| **Context Isolation** | `webPreferences.contextIsolation = true`. Prevents renderer scripts from accessing Electron or Node.js internal objects. |
| **Node.js Integration** | `webPreferences.nodeIntegration = false`. The renderer window cannot execute arbitrary Node.js APIs or require native modules. |
| **Sandbox** | `webPreferences.sandbox = true`. The Chromium renderer process executes in a restricted OS sandbox. |
| **Navigation Lockdown** | Navigation events (`will-navigate`) are intercepted. Navigation away from local application files is prohibited; external URLs are dispatched strictly via `shell.openExternal`. |
| **IPC Argument Validation** | All IPC handlers in `ipcHandlers.ts` perform strict type checking and range clamping on inputs before executing operations. |

---

## 4. Threat Boundaries & Known Limitations

1. **User-Mode Clipboard Dynamics:** Win32 clipboard monitoring is reactive. When a text string is copied, Clipboard Shield immediately detects the update, logs the cryptographic event, and can auto-sanitize the buffer. However, user-mode applications cannot prevent a third-party process from reading the clipboard before a copy happens.
2. **Ring-0 Adversaries:** If an adversary has already compromised the host operating system with kernel-level malware or ring-0 rootkits, no user-mode application can provide absolute guarantees.
3. **Integrity vs. Publisher Identity:** A SHA-256 checksum proves the binary has not been corrupted or tampered with in transit; only an Authenticode code-signing certificate verifies the author's real-world identity.

---

## 5. Vulnerability Disclosure

If you discover a security vulnerability in Clipboard Shield:
1. Please do **not** open a public issue.
2. Submit your findings responsibly by creating an encrypted issue or emailing the maintainers directly.
3. Include detailed steps to reproduce, affected versions, and an assessment of the security impact.
4. We acknowledge all legitimate reports within 48 hours and coordinate a coordinated disclosure timeline.
