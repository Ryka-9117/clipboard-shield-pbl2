using System;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;
using System.Security.Cryptography;
using System.Drawing;
using System.Windows.Forms;
using System.Threading;

namespace ClipboardShield
{
    public class Program
    {
        private static NotifyIcon trayIcon;
        private static System.Windows.Forms.Timer pollTimer;
        private static string lastHash = "";
        private static string lastSelfWrite = "";
        private static bool protectionEnabled = true;
        private static bool autoSanitize = false;
        private static string dataDir;
        private static string auditFile;
        private static string settingsFile;
        private static Mutex singleMutex;

        [STAThread]
        public static void Main(string[] args)
        {
            bool createdNew;
            singleMutex = new Mutex(true, "Global\\ClipboardShieldSingleInstanceMutex", out createdNew);
            if (!createdNew)
            {
                MessageBox.Show("Clipboard Shield is already running in your system tray.", "Clipboard Shield Active", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }

            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            dataDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "ClipboardShield");
            if (!Directory.Exists(dataDir))
            {
                Directory.CreateDirectory(dataDir);
            }
            auditFile = Path.Combine(dataDir, "audit_ledger.json");
            settingsFile = Path.Combine(dataDir, "settings.json");

            LoadSettings();

            // Create Tray Icon
            trayIcon = new NotifyIcon();
            trayIcon.Text = "Clipboard Shield (Active)";
            trayIcon.Icon = SystemIcons.Shield;
            trayIcon.Visible = true;

            UpdateMenu();

            trayIcon.DoubleClick += (s, e) => {
                ShowStatusDialog();
            };

            // Initial Hash
            try
            {
                if (Clipboard.ContainsText())
                {
                    lastHash = ComputeSha256(Clipboard.GetText());
                }
            }
            catch { }

            // Polling timer
            pollTimer = new System.Windows.Forms.Timer();
            pollTimer.Interval = 500;
            pollTimer.Tick += (s, e) => CheckClipboard();
            pollTimer.Start();

            trayIcon.ShowBalloonTip(3000, "Clipboard Shield Active", "Real-time clipboard & financial fraud interceptor is running in your taskbar.", ToolTipIcon.Info);

            Application.Run();

            singleMutex.ReleaseMutex();
        }

        private static void UpdateMenu()
        {
            ContextMenu menu = new ContextMenu();
            menu.MenuItems.Add(new MenuItem("Clipboard Shield: " + (protectionEnabled ? "Active" : "Paused")) { Enabled = false });
            menu.MenuItems.Add("-");

            MenuItem toggleItem = new MenuItem("Protection Enabled", (s, e) => {
                protectionEnabled = !protectionEnabled;
                SaveSettings();
                UpdateMenu();
                trayIcon.Text = "Clipboard Shield (" + (protectionEnabled ? "Active" : "Paused") + ")";
            });
            toggleItem.Checked = protectionEnabled;
            menu.MenuItems.Add(toggleItem);

            MenuItem sanitizeItem = new MenuItem("Auto-Sanitize Threats", (s, e) => {
                autoSanitize = !autoSanitize;
                SaveSettings();
                UpdateMenu();
            });
            sanitizeItem.Checked = autoSanitize;
            menu.MenuItems.Add(sanitizeItem);

            menu.MenuItems.Add("-");
            menu.MenuItems.Add("View Status & Ledger", (s, e) => ShowStatusDialog());
            menu.MenuItems.Add("Open Web Console", (s, e) => {
                try { System.Diagnostics.Process.Start("https://github.com/Ryka-9117/clipboard-shield-pbl2"); } catch {}
            });
            menu.MenuItems.Add("-");
            menu.MenuItems.Add("Quit Clipboard Shield", (s, e) => {
                trayIcon.Visible = false;
                Application.Exit();
            });

            trayIcon.ContextMenu = menu;
        }

        private static void ShowStatusDialog()
        {
            string msg = string.Format(
                "Clipboard Shield v1.4.0 (Windows Native Daemon)\n\n" +
                "Status: {0}\n" +
                "Auto-Sanitization: {1}\n" +
                "Local Audit Storage: {2}\n\n" +
                "The application is actively guarding your Windows clipboard against credit card leaks, crypto address hijackers, and secret token harvesting.",
                protectionEnabled ? "Active 🛡️" : "Paused ⏸️",
                autoSanitize ? "ON (Auto-Redaction Active)" : "OFF (Alert Only)",
                auditFile
            );
            MessageBox.Show(msg, "Clipboard Shield Status", MessageBoxButtons.OK, MessageBoxIcon.Information);
        }

        private static void CheckClipboard()
        {
            if (!protectionEnabled) return;

            try
            {
                if (!Clipboard.ContainsText()) return;
                string text = Clipboard.GetText();
                if (string.IsNullOrEmpty(text)) return;

                string currentHash = ComputeSha256(text);
                if (currentHash == lastHash || currentHash == lastSelfWrite) return;

                lastHash = currentHash;

                ScanAndHandleThreat(text, currentHash);
            }
            catch { }
        }

        private static void ScanAndHandleThreat(string text, string currentHash)
        {
            string threatCategory = null;
            string threatRule = null;
            string masked = null;

            // 1. AWS Key
            Match aws = Regex.Match(text, @"\b(AKIA[0-9A-Z]{16})\b");
            if (aws.Success)
            {
                threatCategory = "SECRET_TOKEN";
                threatRule = "AWS Access Key ID";
                masked = "AKIA••••••••" + aws.Value.Substring(aws.Value.Length - 2);
            }

            // 2. Credit Card (Luhn checked)
            if (threatCategory == null)
            {
                MatchCollection cards = Regex.Matches(text, @"\b(?:\d[ -]*?){13,19}\b");
                foreach (Match m in cards)
                {
                    string digits = Regex.Replace(m.Value, @"\D", "");
                    if (digits.Length >= 13 && digits.Length <= 19 && CheckLuhn(digits))
                    {
                        threatCategory = "CREDIT_CARD";
                        threatRule = "Payment Card Number (Luhn Verified)";
                        masked = digits.Substring(0, 4) + " •••• •••• " + digits.Substring(digits.Length - 4);
                        break;
                    }
                }
            }

            // 3. Ethereum Address
            if (threatCategory == null)
            {
                Match eth = Regex.Match(text, @"\b(0x[a-fA-F0-9]{40})\b");
                if (eth.Success)
                {
                    threatCategory = "CRYPTO_WALLET";
                    threatRule = "Ethereum Address";
                    masked = eth.Value.Substring(0, 6) + "..." + eth.Value.Substring(eth.Value.Length - 4);
                }
            }

            // 4. UPI
            if (threatCategory == null)
            {
                Match upi = Regex.Match(text, @"\b([a-zA-Z0-9.\-_]{2,64}@(okaxis|okhdfcbank|okicici|oksbi|paytm|ybl|ibl|upi))\b");
                if (upi.Success)
                {
                    threatCategory = "UPI_FINANCIAL";
                    threatRule = "Indian UPI Virtual Address";
                    masked = upi.Value.Substring(0, 2) + "****" + upi.Value.Substring(upi.Value.IndexOf('@'));
                }
            }

            // 5. OTP
            if (threatCategory == null)
            {
                Match otp = Regex.Match(text, @"(?:OTP|verification code|one-time password)[\s:=-]+([0-9]{4,8})\b", RegexOptions.IgnoreCase);
                if (otp.Success)
                {
                    threatCategory = "OTP_CODE";
                    threatRule = "Confidential OTP Code";
                    masked = "OTP: ••••" + otp.Groups[1].Value.Substring(Math.Max(0, otp.Groups[1].Value.Length - 2));
                }
            }

            if (threatCategory != null)
            {
                string action = "ALERTED";
                if (autoSanitize)
                {
                    action = "SANITIZED";
                    string placeholder = "[CLIPBOARD SHIELD PROTECTED: " + threatCategory + "]";
                    lastSelfWrite = ComputeSha256(placeholder);
                    Clipboard.SetText(placeholder);
                }

                // Show Balloon
                trayIcon.ShowBalloonTip(
                    4000,
                    action == "SANITIZED" ? "🛡️ Threat Sanitized by Clipboard Shield" : "⚠️ Clipboard Shield Threat Intercepted",
                    threatRule + ": " + masked + (action == "SANITIZED" ? " (Buffer Redacted)" : ""),
                    action == "SANITIZED" ? ToolTipIcon.Info : ToolTipIcon.Warning
                );

                // Log to Audit Ledger
                AppendAuditRecord(threatRule, threatCategory, action, masked, currentHash);
            }
        }

        private static bool CheckLuhn(string digits)
        {
            int sum = 0;
            bool doubleDigit = false;
            for (int i = digits.Length - 1; i >= 0; i--)
            {
                int d = digits[i] - '0';
                if (doubleDigit)
                {
                    d *= 2;
                    if (d > 9) d -= 9;
                }
                sum += d;
                doubleDigit = !doubleDigit;
            }
            return sum % 10 == 0;
        }

        private static string ComputeSha256(string raw)
        {
            using (SHA256 sha = SHA256.Create())
            {
                byte[] bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(raw));
                StringBuilder sb = new StringBuilder();
                foreach (byte b in bytes) sb.Append(b.ToString("x2"));
                return sb.ToString();
            }
        }

        private static void AppendAuditRecord(string rule, string category, string action, string masked, string hash)
        {
            try
            {
                string timestamp = DateTime.Now.ToString("HH:mm:ss");
                string entry = string.Format(
                    "  {{\"id\":\"ev_{0}\",\"timestamp\":\"{1}\",\"alertMsg\":\"{2}: {3}\",\"category\":\"{4}\",\"action\":\"{5}\",\"platform\":\"WINDOWS_NATIVE\",\"payloadHash\":\"{6}\"}},\n",
                    DateTime.UtcNow.Ticks, timestamp, rule, masked, category, action, hash
                );
                File.AppendAllText(auditFile, entry);
            }
            catch { }
        }

        private static void LoadSettings()
        {
            try
            {
                if (File.Exists(settingsFile))
                {
                    string json = File.ReadAllText(settingsFile);
                    if (json.Contains("\"autoSanitize\": true")) autoSanitize = true;
                    if (json.Contains("\"protectionEnabled\": false")) protectionEnabled = false;
                }
            }
            catch { }
        }

        private static void SaveSettings()
        {
            try
            {
                string json = string.Format("{{\"protectionEnabled\": {0}, \"autoSanitize\": {1}}}\n",
                    protectionEnabled ? "true" : "false",
                    autoSanitize ? "true" : "false"
                );
                File.WriteAllText(settingsFile, json);
            }
            catch { }
        }
    }
}
