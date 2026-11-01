package com.clipboardshield.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.IBinder;
import androidx.core.app.NotificationCompat;

public class ClipboardMonitorService extends Service {
    public static final String ACTION_START = "com.clipboardshield.START";
    public static final String ACTION_STOP = "com.clipboardshield.STOP";
    private static final String CHANNEL_ID = "clipboard_shield_monitor_channel";
    private static final int NOTIF_ID = 1001;

    private ClipboardManager clipboardManager;
    private ClipboardManager.OnPrimaryClipChangedListener clipListener;
    private String lastHash = "";
    private String lastSanitizedText = "";

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        clipboardManager = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);

        clipListener = new ClipboardManager.OnPrimaryClipChangedListener() {
            @Override
            public void onPrimaryClipChanged() {
                checkClipboard();
            }
        };

        if (clipboardManager != null) {
            clipboardManager.addPrimaryClipChangedListener(clipListener);
        }
    }

    private void checkClipboard() {
        try {
            if (clipboardManager == null || !clipboardManager.hasPrimaryClip()) return;
            ClipData clip = clipboardManager.getPrimaryClip();
            if (clip == null || clip.getItemCount() == 0) return;

            CharSequence itemText = clip.getItemAt(0).getText();
            if (itemText == null) return;
            String text = itemText.toString();

            // Ignore our own auto-sanitized text or repeated content
            if (text.equals(lastSanitizedText)) return;
            String currentHash = ThreatDetector.computeSha256(text);
            if (currentHash.equals(lastHash)) return;
            lastHash = currentHash;

            SharedPreferences prefs = getSharedPreferences("clipboard_shield_settings", Context.MODE_PRIVATE);
            boolean protectionEnabled = prefs.getBoolean("protection_enabled", true);
            boolean autoSanitize = prefs.getBoolean("auto_sanitize", false);

            if (!protectionEnabled) return;

            ThreatDetector.DetectionResult result = ThreatDetector.scan(text);
            if (result.isThreat) {
                // Threat intercepted!
                String alertMsg = "Intercepted " + result.ruleName + " (" + result.maskedPreview + ")";

                if (autoSanitize) {
                    lastSanitizedText = "[CLIPBOARD SHIELD PROTECTED: " + result.category + "]";
                    ClipData sanitizedClip = ClipData.newPlainText("Sanitized", lastSanitizedText);
                    clipboardManager.setPrimaryClip(sanitizedClip);
                    AuditLedger.addRecord(this, alertMsg, "SANITIZED", result.sha256Hash);
                } else {
                    AuditLedger.addRecord(this, alertMsg, "ALERTED", result.sha256Hash);
                }

                // Launch Floating Overlay Alert
                Intent overlayIntent = new Intent(this, FloatingOverlayActivity.class);
                overlayIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                overlayIntent.putExtra("ALERT_MSG", alertMsg);
                overlayIntent.putExtra("CATEGORY", result.category);
                overlayIntent.putExtra("HASH", result.sha256Hash);
                overlayIntent.putExtra("AUTO_SANITIZED", autoSanitize);
                startActivity(overlayIntent);
            }
        } catch (Exception ignored) {}
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            stopForeground(true);
            stopSelf();
            return START_NOT_STICKY;
        }

        Notification notification = buildForegroundNotification();
        startForeground(NOTIF_ID, notification);
        return START_STICKY;
    }

    private Notification buildForegroundNotification() {
        Intent launchIntent = new Intent(this, MainActivity.class);
        PendingIntent pIntent = PendingIntent.getActivity(
                this, 0, launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Clipboard Shield Active")
                .setContentText("Continuous real-time clipboard and financial fraud monitor running")
                .setSmallIcon(android.R.drawable.ic_lock_idle_lock)
                .setContentIntent(pIntent)
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .build();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Clipboard Shield Protection",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Background clipboard security daemon");
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    @Override
    public void onDestroy() {
        if (clipboardManager != null && clipListener != null) {
            clipboardManager.removePrimaryClipChangedListener(clipListener);
        }
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
