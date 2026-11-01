# 📱 Clipboard Shield for Android

Native Android background interceptor and financial fraud guardian application.

## 🚀 Key Features on Android:
- **Real-Time Clipboard Monitoring Daemon:** Foreground service with low power consumption continuously audits clipboard updates.
- **Luhn MOD-10 Credit Card Verification:** Detects 13-19 digit PANs and runs checksum validation before any unauthorized app captures it.
- **API Tokens & Private Keys:** Identifies AWS Access Keys, GitHub PATs, JWTs, and private key blocks.
- **Financial Interception & OTP Protection:** Intercepts Indian UPI VPAs, IBAN bank accounts, and sensitive OTP SMS messages.
- **Floating Security Authorization Overlay:** Pops up on top of any banking app (GPay, PhonePe, Paytm, etc.) or clipboard paste event with instant Approve / Cancel controls.
- **Buffer Auto-Sanitization:** When enabled, immediately replaces sensitive clipboard data with masked placeholders `[CLIPBOARD SHIELD PROTECTED: <CATEGORY>]`.
- **Immutable Local Cryptographic Ledger:** Stores SHA-256 event signatures on-device. Zero cloud telemetry.

## 🛠️ How to Build & Install:
1. Open this `android/` directory in Android Studio.
2. Build Debug or Release APK:
   ```bash
   ./gradlew assembleRelease
   ```
3. Install to device:
   ```bash
   adb install app/build/outputs/apk/release/app-release.apk
   ```
4. Enable Permissions:
   - Go to **Settings > Apps > Special App Access > Display Over Other Apps** -> Enable Clipboard Shield.
   - Go to **Settings > Apps > Special App Access > Notification Access** -> Enable Clipboard Shield.
