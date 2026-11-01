package com.clipboardshield.app;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONArray;
import org.json.JSONObject;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class AuditLedger {
    private static final String PREF_NAME = "clipboard_shield_audit";
    private static final String KEY_RECORDS = "records";
    private static final int MAX_RECORDS = 500;

    public static class Record {
        public final String id;
        public final String timestamp;
        public final String alertMsg;
        public final String action;
        public final String payloadHash;
        public final String platform;

        public Record(String id, String timestamp, String alertMsg, String action, String payloadHash, String platform) {
            this.id = id;
            this.timestamp = timestamp;
            this.alertMsg = alertMsg;
            this.action = action;
            this.payloadHash = payloadHash;
            this.platform = platform;
        }

        public JSONObject toJson() {
            try {
                JSONObject obj = new JSONObject();
                obj.put("id", id);
                obj.put("timestamp", timestamp);
                obj.put("alertMsg", alertMsg);
                obj.put("action", action);
                obj.put("payloadHash", payloadHash);
                obj.put("platform", platform);
                return obj;
            } catch (Exception e) {
                return new JSONObject();
            }
        }

        public static Record fromJson(JSONObject obj) {
            return new Record(
                obj.optString("id", "audit_" + System.currentTimeMillis()),
                obj.optString("timestamp", "--:--:--"),
                obj.optString("alertMsg", "Threat detected"),
                obj.optString("action", "SANITIZED"),
                obj.optString("payloadHash", "0x0"),
                obj.optString("platform", "ANDROID")
            );
        }
    }

    public static synchronized void addRecord(Context context, String alertMsg, String action, String payloadHash) {
        SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        List<Record> records = getRecords(context);

        String id = "rec_" + System.currentTimeMillis();
        String time = new SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(new Date());
        Record newRecord = new Record(id, time, alertMsg, action, payloadHash, "ANDROID");

        records.add(0, newRecord);
        if (records.size() > MAX_RECORDS) {
            records = records.subList(0, MAX_RECORDS);
        }

        JSONArray array = new JSONArray();
        for (Record r : records) {
            array.put(r.toJson());
        }
        prefs.edit().putString(KEY_RECORDS, array.toString()).apply();
    }

    public static synchronized List<Record> getRecords(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        String raw = prefs.getString(KEY_RECORDS, "[]");
        List<Record> list = new ArrayList<>();
        try {
            JSONArray array = new JSONArray(raw);
            for (int i = 0; i < array.length(); i++) {
                list.add(Record.fromJson(array.getJSONObject(i)));
            }
        } catch (Exception ignored) {}
        return list;
    }

    public static synchronized void clear(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        prefs.edit().remove(KEY_RECORDS).apply();
    }
}
