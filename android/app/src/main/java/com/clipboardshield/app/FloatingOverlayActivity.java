package com.clipboardshield.app;

import android.app.Activity;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

public class FloatingOverlayActivity extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_overlay);

        String alertText = getIntent().getStringExtra("ALERT_MSG");
        if (alertText == null) alertText = "Sensitive financial payload intercepted.";
        String hash = getIntent().getStringExtra("HASH");
        if (hash == null) hash = ThreatDetector.computeSha256(alertText);

        TextView msgText = findViewById(R.id.overlay_message);
        TextView hashText = findViewById(R.id.overlay_hash);
        Button btnApprove = findViewById(R.id.btn_approve);
        Button btnCancel = findViewById(R.id.btn_cancel);

        msgText.setText(alertText);
        hashText.setText("SHA-256: " + hash.substring(0, Math.min(hash.length(), 24)) + "...");

        final String finalAlert = alertText;
        final String finalHash = hash;

        btnApprove.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                AuditLedger.addRecord(FloatingOverlayActivity.this, finalAlert, "APPROVED", finalHash);
                Toast.makeText(FloatingOverlayActivity.this, "Transaction Approved", Toast.LENGTH_SHORT).show();
                finish();
            }
        });

        btnCancel.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                AuditLedger.addRecord(FloatingOverlayActivity.this, finalAlert, "BLOCKED_BY_USER", finalHash);
                Toast.makeText(FloatingOverlayActivity.this, "Transaction Blocked", Toast.LENGTH_SHORT).show();
                finish();
            }
        });
    }
}
