# Clipboard Shield — Release Engineering & Distribution Guide

## 1. Versioning Standard

Clipboard Shield adheres to **Semantic Versioning (SemVer)**:
- **Major (X.0.0):** Breaking architectural changes, IPC protocol overhauls, or operating system support migrations.
- **Minor (0.X.0):** New threat detection rules, UI capabilities, or persistent configuration options.
- **Patch (0.0.X):** Bug fixes, regex optimization, or minor UI adjustments.

---

## 2. Release Steps

### Step 1: Update Version Identifiers
Synchronize the version string across the project:
1. `package.json`: `"version": "1.4.0"`
2. `src/utils/fileGenerators.ts`: `WINDOWS_RELEASE_INFO.version = '1.4.0'`
3. `electron/types.ts` and `electron/updater.ts`: Update version constants if applicable.

### Step 2: Quality Assurance & Automated Tests
Execute the test suites and type-checker:
```bash
npm run lint
npm run test
```

### Step 3: Clean Production Build
Compile both web client and main process binaries:
```bash
npm run clean
npm run build:all
```

### Step 4: Package Windows Release Binaries
Invoke `electron-builder` to package NSIS and Portable distributions:
```bash
npm run package:win
```

### Step 5: Generate Cryptographic Checksums
Compute SHA-256 hashes of all generated `.exe` files:
```powershell
Get-FileHash release\*.exe -Algorithm SHA256 | ForEach-Object {
    "$($_.Hash.ToLower()) *$([System.IO.Path]::GetFileName($_.Path))"
} | Out-File -Encoding utf8 release\SHA256SUMS.txt
```

### Step 6: Create Git Release Tag
Commit the version bump and push the tag to trigger the automated CI release workflow:
```bash
git add package.json src/utils/fileGenerators.ts
git commit -m "chore(release): bump version to 1.4.0"
git tag v1.4.0
git push origin main --tags
```

---

## 3. Code Signing & Authenticode Information

### Production Signing Policy
In production distributions, binaries should be signed with a trusted Windows Authenticode certificate (via Microsoft Hardware Dev Center or trusted Certificate Authority like DigiCert or Sectigo):
```powershell
signtool.exe sign /tr http://timestamp.digicert.com /td sha256 /fd sha256 /a "release\Clipboard-Shield-Setup-1.4.0.exe"
```

### Unsigned Open-Source Releases & Windows SmartScreen
When building without a paid commercial Authenticode certificate:
1. Windows Defender SmartScreen may display: *"Windows protected your PC — Unknown Publisher"*.
2. Users can verify the downloaded file against the published **`SHA256SUMS.txt`** hash on the GitHub Release page.
3. Once verified, click **"More info"** > **"Run anyway"**.
4. We document this transparently without pretending an unsigned binary will bypass SmartScreen reputation filters.
