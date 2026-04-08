package com.watchalert;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;

public class CityManager {
    private static final String PREFS_NAME = "WatchAlertCities";
    private static final String KEY_CITIES = "cachedCities";
    private static final String BASE_URL = "https://ais-dev-y3k5cv2ixjhrkidsg7weac-327783083381.europe-west1.run.app";

    public static class CityInfo {
        public String name;
        public String district;
        public String time;

        public CityInfo(String name, String district, String time) {
            this.name = name;
            this.district = district;
            this.time = time;
        }

        @Override
        public String toString() {
            return name + (district.isEmpty() ? "" : " (" + district + ")");
        }
    }

    public interface CityCallback {
        void onCitiesLoaded(List<CityInfo> cities);
    }

    public static List<CityInfo> getCachedCities(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String json = prefs.getString(KEY_CITIES, "");
        if (json.isEmpty()) return new ArrayList<>();
        return parseCities(json);
    }

    public static void fetchCities(Context context, String lang, CityCallback callback) {
        new Thread(() -> {
            try {
                URL url = new URL(BASE_URL + "/api/cities?lang=" + lang);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setConnectTimeout(10000);
                conn.setReadTimeout(10000);

                if (conn.getResponseCode() == 200) {
                    BufferedReader in = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                    StringBuilder response = new StringBuilder();
                    String line;
                    while ((line = in.readLine()) != null) {
                        response.append(line);
                    }
                    in.close();

                    String json = response.toString();
                    saveCities(context, json);
                    List<CityInfo> cities = parseCities(json);
                    if (callback != null) {
                        new android.os.Handler(android.os.Looper.getMainLooper()).post(() -> callback.onCitiesLoaded(cities));
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }).start();
    }

    private static void saveCities(Context context, String json) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putString(KEY_CITIES, json).apply();
    }

    private static List<CityInfo> parseCities(String json) {
        List<CityInfo> list = new ArrayList<>();
        try {
            JSONArray array = new JSONArray(json);
            for (int i = 0; i < array.length(); i++) {
                JSONObject obj = array.getJSONObject(i);
                list.add(new CityInfo(
                    obj.optString("name"),
                    obj.optString("district"),
                    obj.optString("time")
                ));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }
}
