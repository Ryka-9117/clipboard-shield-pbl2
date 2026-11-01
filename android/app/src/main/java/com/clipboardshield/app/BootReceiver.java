package com.clipboardshield.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction()) ||
            "android.intent.action.QUICKBOOT_POWERON".equals(intent.getAction())) {

            SharedPreferences prefs = context.getSharedPreferences("clipboard_shield_settings", Context.MODE_PRIVATE);
            boolean startOnBoot = prefs.getBoolean("start_on_boot", true);
            boolean protectionEnabled = prefs.getBoolean("protection_enabled", true);

            if (startOnBoot && protectionEnabled) {
                Intent serviceIntent = new Intent(context, ClipboardMonitorService.class);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(serviceIntent);
                } else {
                    context.startService(serviceIntent);
                }
            }
        }
    }
}
