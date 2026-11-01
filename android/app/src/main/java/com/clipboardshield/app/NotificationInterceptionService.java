package com.clipboardshield.app;

import android.content.Intent;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;

public class NotificationInterceptionService extends NotificationListenerService {

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null || sbn.getNotification() == null) return;
        Bundle extras = sbn.getNotification().extras;
        if (extras == null) return;

        CharSequence titleCs = extras.getCharSequence("android.title", "");
        CharSequence textCs = extras.getCharSequence("android.text", "");

        String title = titleCs != null ? titleCs.toString() : "";
        String text = textCs != null ? textCs.toString() : "";
        String fullMsg = (title + " " + text).trim();

        if (fullMsg.isEmpty()) return;

        // Check if message is a financial transaction or OTP
        boolean isFinancial = fullMsg.contains("debited") ||
                fullMsg.contains("credited") ||
                fullMsg.contains("OTP") ||
                fullMsg.contains("₹") ||
                fullMsg.contains("$") ||
                fullMsg.contains("UPI") ||
                fullMsg.contains("A/c") ||
                fullMsg.contains("transferred");

        if (isFinancial) {
            String hash = ThreatDetector.computeSha256(fullMsg);
            AuditLedger.addRecord(this, "Intercepted Banking Notice: " + title, "PENDING_AUTH", hash);

            // Launch floating prompt overlay
            Intent dialogIntent = new Intent(this, FloatingOverlayActivity.class);
            dialogIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            dialogIntent.putExtra("ALERT_MSG", fullMsg);
            dialogIntent.putExtra("CATEGORY", "FINANCIAL_NOTICE");
            dialogIntent.putExtra("HASH", hash);
            startActivity(dialogIntent);
        }
    }
}
