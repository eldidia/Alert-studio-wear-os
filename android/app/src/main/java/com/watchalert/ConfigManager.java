package com.watchalert;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.List;

public class ConfigManager {
    private static final String PREFS_NAME = "WatchAlertPrefs";
    private static final String KEY_CONFIG = "appConfig";
    
    public static class Profile {
        public String id;
        public String name;
        public String city;
        public List<String> types;
        public boolean enabled;

        public Profile() {
            this.id = String.valueOf(System.currentTimeMillis());
            this.types = new ArrayList<>();
            this.enabled = true;
        }
    }

    public static JSONObject getConfig(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String json = prefs.getString(KEY_CONFIG, "");
        if (json.isEmpty()) {
            return createDefaultConfig();
        }
        try {
            return new JSONObject(json);
        } catch (Exception e) {
            return createDefaultConfig();
        }
    }

    public static void saveConfig(Context context, JSONObject config) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putString(KEY_CONFIG, config.toString()).apply();
    }

    private static JSONObject createDefaultConfig() {
        try {
            JSONObject config = new JSONObject();
            config.put("isMonitoring", true);
            config.put("language", "he");
            config.put("profiles", new JSONArray());
            return config;
        } catch (Exception e) {
            return new JSONObject();
        }
    }
}
