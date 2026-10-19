# 🛡️ Clipboard Shield — Native Windows Security & Clipboard Interceptor

[![Platform: Windows](https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011-0078D6?logo=windows&logoColor=white)](https://github.com/ryka-parikh/clipboard-shield-pbl2)
[![Electron: v44](https://img.shields.io/badge/Electron-44.9.0-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg)](LICENSE)
[![Zero Telemetry](https://img.shields.io/badge/Privacy-Zero%20Telemetry-14b8a6.svg)](docs/SECURITY.md)

**Clipboard Shield** is a genuine Windows desktop application that protects your clipboard against financial fraud, credential harvesting, and inadvertent secret disclosure. Operating as an interactive background daemon in your Windows taskbar system notification tray, it continuously monitors clipboard buffer updates and sanitizes sensitive credentials before untrusted applications can capture them.

---

## 🌊 Key Capabilities

- **Genuine Windows Desktop Application:** Built with Electron v44, TypeScript, and Vite. Includes native window management, single-instance enforcement, and system tray integration.
- **Deterministic Threat Detection:**
  - **Payment Cards:** Primary Account Numbers (Visa, Mastercard, Amex, Discover, RuPay) verified against the **Luhn MOD-10 algorithm**.
  - **Cloud Secrets & API Tokens:** Identifies active AWS Access Key IDs (`AKIA...`), GitHub Personal Access Tokens (`ghp_...`), JWT bearer tokens, and private key blocks (`BEGIN PRIVATE KEY`).
  - **Cryptocurrency Wallets:** Detects on-chain Bitcoin (Legacy, SegWit, Bech32) and Ethereum / EVM public wallet addresses.
  - **Financial Transfer Addresses:** Intercepts Indian UPI VPAs (`...@okaxis`, etc.) and international IBAN bank accounts.
  - **One-Time Passwords:** Intercepts confidential OTP verification codes.
- **Auto-Sanitization & Buffer Flushing:** When enabled, automatically overwrites sensitive clipboard content with redacted placeholders `[CLIPBOARD SHIELD PROTECTED: <CATEGORY>]`.
- **System Tray Background Daemon:** Minimizes to the taskbar system notification tray when closed. Provides quick-toggle context menu controls for Protection, Auto-Sanitize, and Start with Windows.
- **Zero Plaintext Storage:** Threats are cryptographically hashed using **SHA-256**. Passwords, credit cards, and private keys never touch disk in plaintext.
- **Least Privilege Architecture:** Operates completely within standard Windows user session permissions (`winsta0\default`). Requires no Administrator elevation (`runas`) and no kernel-level drivers.
- **100% Offline First:** All pattern evaluation, logging, and buffer sanitization functions on-device without internet access.

---

## 🚀 Quick Download & Verification

Official release binaries for **v1.4.0**:

| Distribution | Filename | SHA-256 Checksum |
| :--- | :--- | :--- |
| **Windows NSIS Installer** | [`Clipboard-Shield-Setup-1.4.0.exe`](https://github.com/ryka-parikh/clipboard-shield-pbl2/releases/download/v1.4.0/Clipboard-Shield-Setup-1.4.0.exe) | `948af1d34e039dd67beb9481e1fa048ece7d2b3f3b4d2799ca99901fbe980476` |
| **Portable Standalone** | [`Clipboard-Shield-1.4.0-portable.exe`](https://github.com/ryka-parikh/clipboard-shield-pbl2/releases/download/v1.4.0/Clipboard-Shield-1.4.0-portable.exe) | `f34dd3e55365afbe019dc58ec3f5ff6e95dedf8a5e48d11d0514075fb48cc33b` |

To verify the installer checksum in PowerShell:
```powershell
Get-FileHash .\Clipboard-Shield-Setup-1.4.0.exe -Algorithm SHA256
```

---

## 🛠️ Building & Developing from Source

### Prerequisites
- Node.js >= 20.x (Node 24 recommended)
- npm >= 10.x
- Windows 10/11 64-bit

### 1. Install Dependencies
```bash
git clone https://github.com/ryka-parikh/clipboard-shield-pbl2.git
cd clipboard-shield-pbl2
npm install --legacy-peer-deps
```

### 2. Run Automated Tests
```bash
npm run test
```

### 3. Build Web & Desktop Binaries
```bash
npm run build:all
```

### 4. Package Windows Installers
```bash
npm run package:win
```
The output installers and checksums will be generated in `release/`.

---

## 📚 Technical Documentation

For in-depth technical guides, consult the `docs/` directory:
- [**System Architecture & Threat Model**](docs/ARCHITECTURE.md) — Detailed process model, Session 0 isolation analysis, and security boundaries.
- [**Installation & Deployment Guide**](docs/INSTALLATION.md) — Step-by-step setup, portable usage, and uninstallation policies.
- [**Development Guide**](docs/DEVELOPMENT.md) — Codebase structure, local commands, and test suites.
- [**Release Engineering Guide**](docs/RELEASING.md) — Versioning, Authenticode signing, and GitHub release pipeline.
- [**Security Policy & Hardening**](docs/SECURITY.md) — Zero telemetry guarantees, IPC isolation, and vulnerability disclosure.
- [**Troubleshooting & Diagnostics**](docs/TROUBLESHOOTING.md) — Solutions for SmartScreen warnings, tray recovery, and degraded states.

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
