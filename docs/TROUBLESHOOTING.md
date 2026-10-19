# Clipboard Shield — Troubleshooting & Diagnostics Guide

## 1. Frequently Encountered Issues & Solutions

### Issue 1: "Windows protected your PC" (SmartScreen Warning)
- **Symptom:** When running `Clipboard-Shield-Setup-1.4.0.exe` or `Clipboard-Shield-1.4.0-portable.exe`, Windows Defender SmartScreen displays a blue dialog saying *"Microsoft Defender SmartScreen prevented an unrecognized app from starting"*.
- **Root Cause:** Open-source software released without a paid commercial Extended Validation (EV) Authenticode certificate has not yet accumulated automated download reputation in Microsoft's cloud database.
- **Resolution:**
  1. Open PowerShell and verify the SHA-256 checksum against `docs/INSTALLATION.md`:
     ```powershell
     Get-FileHash .\Clipboard-Shield-Setup-1.4.0.exe -Algorithm SHA256
     ```
  2. If the hash matches `948af1d34e039dd67beb9481e1fa048ece7d2b3f3b4d2799ca99901fbe980476`, click **More info** on the SmartScreen dialog.
  3. Click **Run anyway**.

---

### Issue 2: Application Window Doesn't Open When Clicking the Shortcut
- **Symptom:** Clicking the Desktop or Start Menu shortcut does not show a new window.
- **Root Cause:** Clipboard Shield enforces a **single-instance lock** to prevent multiple competing daemons. If the application is already running in the background, it restores the existing window or remains in the system notification tray.
- **Resolution:**
  1. Check the bottom-right corner of your Windows taskbar (click the `^` arrow to show hidden tray icons).
  2. Locate the teal **Clipboard Shield** icon.
  3. Right-click and choose **Open Dashboard**, or double-click the icon.

---

### Issue 3: Dashboard Displays Status "DEGRADED"
- **Symptom:** The status badge turns red or amber with state `DEGRADED`.
- **Root Cause:** Another Windows application (such as a legacy clipboard manager, virtual machine client, or Office app) held an exclusive Win32 clipboard lock (`OpenClipboard`) without releasing it in a timely manner.
- **Resolution:**
  1. The daemon will automatically resume `ACTIVE` status once the lock is released.
  2. You can manually re-trigger the monitor by toggling the **Protection Active** button in the dashboard or tray menu.

---

### Issue 4: My Copied Credentials Were Overwritten with `[CLIPBOARD SHIELD PROTECTED]`
- **Symptom:** After copying a credit card number or AWS access key, the pasted text is replaced with a redacted placeholder.
- **Root Cause:** **Auto-Sanitize** is enabled. When active, Clipboard Shield immediately overwrites detected sensitive tokens to prevent accidental exposure to untrusted programs.
- **Resolution:**
  - If you need to temporarily paste raw credentials into a verified password manager, toggle **Auto-Sanitize** to **OFF** via the System Tray context menu or Desktop Dashboard.

---

### Issue 5: Toast Notifications Are Not Showing
- **Symptom:** Threats are logged in the Audit Ledger, but no Windows desktop banner appears.
- **Root Cause:** Windows Focus Assist (Do Not Disturb) is silencing notifications, or notifications are disabled for the app.
- **Resolution:**
  1. Go to **Windows Settings** > **System** > **Notifications**.
  2. Ensure **Notifications** are set to **On**.
  3. Scroll down to **Get notifications from these senders**, locate **Clipboard Shield**, and toggle it to **On**.

---

### Issue 6: Resetting Configuration to Factory Defaults
- **Symptom:** Incompatible custom patterns or corrupt settings.
- **Resolution:**
  1. Completely quit Clipboard Shield via the tray menu (**Right-click tray icon > Quit Clipboard Shield**).
  2. Open PowerShell and run:
     ```powershell
     Remove-Item "$env:APPDATA\ClipboardShield\settings.json" -Force
     ```
  3. Relaunch Clipboard Shield. A clean, valid configuration file will be generated automatically.
