# Clipboard Shield — Installation & Deployment Guide

## System Requirements
- **Operating System:** Windows 10 (version 1809+) or Windows 11 (64-bit).
- **Architecture:** x86-64 / AMD64.
- **Privileges:** Standard user account (No Administrator elevation required).
- **Disk Space:** ~250 MB free space.
- **Memory:** 512 MB RAM.

---

## 1. Installation Methods

### Method A: Official Windows Setup Installer (Recommended)
1. Download **`Clipboard-Shield-Setup-1.4.0.exe`** from the official release page or repository release directory.
2. Double-click the installer.
3. Select your preferred installation options:
   - Create Desktop Shortcut (checked by default).
   - Create Start Menu Shortcut (checked by default).
4. The application installs per-user into:
   ```text
   %LOCALAPPDATA%\Programs\clipboard-shield
   ```
5. Click **Finish**. Clipboard Shield launches automatically and minimizes to your Windows system notification tray.

---

### Method B: Portable Standalone Executable
If you prefer not to install the application, or wish to run it from a secure USB drive:
1. Download **`Clipboard-Shield-1.4.0-portable.exe`**.
2. Place the executable in any folder of your choice.
3. Double-click to launch. All application logic runs in-place, while persistent settings are stored in your per-user AppData directory.

---

## 2. Verifying File Integrity & Checksums

Before running the installer, you can cryptographically verify that the binary has not been tampered with:

### Using PowerShell:
```powershell
Get-FileHash .\Clipboard-Shield-Setup-1.4.0.exe -Algorithm SHA256
```

### Using Command Prompt (cmd.exe):
```cmd
certutil -hashfile Clipboard-Shield-Setup-1.4.0.exe SHA256
```

### Expected Checksums (v1.4.0):
| File | SHA-256 Hash |
| :--- | :--- |
| **`Clipboard-Shield-Setup-1.4.0.exe`** | `948af1d34e039dd67beb9481e1fa048ece7d2b3f3b4d2799ca99901fbe980476` |
| **`Clipboard-Shield-1.4.0-portable.exe`** | `f34dd3e55365afbe019dc58ec3f5ff6e95dedf8a5e48d11d0514075fb48cc33b` |

---

## 3. Configuring Start with Windows

To ensure your clipboard is continuously guarded across system reboots:
1. Open the Clipboard Shield main window or right-click the system tray icon.
2. In the context menu or Dashboard Settings, toggle **Start with Windows** to **ON**.
3. This creates a standard per-user registry startup key in `HKCU\Software\Microsoft\Windows\CurrentVersion\Run`.

---

## 4. Uninstallation & Data Retention Policy

To uninstall Clipboard Shield:
1. Open **Windows Settings** > **Apps** > **Installed apps** (or **Add or Remove Programs**).
2. Locate **Clipboard Shield** in the list.
3. Click the three dots `...` and select **Uninstall**.
4. The NSIS uninstaller will:
   - Terminate any running Clipboard Shield process.
   - Clean up desktop and Start menu shortcuts.
   - Remove binary executable files from `%LOCALAPPDATA%\Programs\clipboard-shield`.
   - Remove the Startup registry entry.

### Data Retention Policy:
User preferences (`settings.json`) and audit records (`audit_ledger.json`) located at `%APPDATA%\ClipboardShield` are retained by default to prevent accidental data loss during version upgrades. If you wish to completely wipe all local history, simply delete the folder:
```powershell
Remove-Item -Recurse -Force "$env:APPDATA\ClipboardShield"
```
