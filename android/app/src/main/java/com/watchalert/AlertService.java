package com.watchalert;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import androidx.core.app.NotificationCompat;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import org.json.JSONArray;
import org.json.JSONObject;

public class AlertService extends Service {
    private static final String CHANNEL_ID = "WatchAlertServiceChannel";
    private static final String ALERT_CHANNEL_ID = "WatchAlertCriticalChannel";
    private Handler handler = new Handler(Looper.getMainLooper());
    private String lastAlertId = "0";
    private boolean isRunning = false;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannels();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && intent.getBooleanExtra("test_notification", false)) {
            showCriticalNotification("Test Alert", "This is a test notification from WatchAlert");
            return START_STICKY;
        }

        if (!isRunning) {
            isRunning = true;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                startForeground(1, getServiceNotification("Monitoring Active"), ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
            } else {
                startForeground(1, getServiceNotification("Monitoring Active"));
            }
            startPolling();
        }
        return START_STICKY;
    }

    private void startPolling() {
        handler.postDelayed(new Runnable() {
            @Override
            public void run() {
                if (isRunning) {
                    JSONObject config = ConfigManager.getConfig(AlertService.this);
                    
                    // Shutdown principle: If system is not active, stop polling and stop service
                    if (!config.optBoolean("isSystemActive", true)) {
                        isRunning = false;
                        stopForeground(true);
                        stopSelf();
                        return;
                    }

                    // Monitoring check
                    if (config.optBoolean("isMonitoring", true)) {
                        checkAlerts();
                    }

                    // Power saving mode: Increase interval if enabled
                    long interval = config.optBoolean("isPowerSaving", false) ? 30000 : 3000;
                    handler.postDelayed(this, interval);
                }
            }
        }, 3000);
    }

    private void checkAlerts() {
        new Thread(() -> {
            try {
                // Pointing to our middle server instead of official HFC API
                // This allows for simulation, logging, and smart city mapping
                URL url = new URL("https://ais-dev-y3k5cv2ixjhrkidsg7weac-327783083381.europe-west1.run.app/api/alerts");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setRequestProperty("X-Requested-With", "XMLHttpRequest");
                conn.setRequestProperty("Referer", "https://www.oref.org.il/");
                conn.setConnectTimeout(5000);
                conn.setReadTimeout(5000);

                int responseCode = conn.getResponseCode();
                if (responseCode == 200) {
                    BufferedReader in = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                    StringBuilder response = new StringBuilder();
                    String inputLine;
                    while ((inputLine = in.readLine()) != null) {
                        response.append(inputLine);
                    }
                    in.close();

                    String jsonStr = response.toString().trim();
                    if (!jsonStr.isEmpty()) {
                        try {
                            JSONObject json = new JSONObject(jsonStr);
                            String id = json.getString("id");
                            if (!id.equals(lastAlertId) && !id.equals("0")) {
                                lastAlertId = id;
                                
                                SharedPreferences sharedPref = getSharedPreferences("WatchAlertPrefs", Context.MODE_PRIVATE);
                                String configJson = sharedPref.getString("appConfig", "");
                                
                                boolean isMonitoring = true;
                                JSONArray profiles = new JSONArray();
                                
                                if (!configJson.isEmpty()) {
                                    try {
                                        JSONObject config = new JSONObject(configJson);
                                        isMonitoring = config.optBoolean("isMonitoring", true);
                                        profiles = config.optJSONArray("profiles");
                                        
                                        // Global Type Filter
                                        boolean filterByTypes = config.optBoolean("filterByTypes", false);
                                        JSONArray selectedTypes = config.optJSONArray("selectedTypes");
                                        if (filterByTypes && selectedTypes != null && selectedTypes.length() > 0) {
                                            boolean globalTypeMatch = false;
                                            String title = json.getString("title");
                                            for (int i = 0; i < selectedTypes.length(); i++) {
                                                if (title.contains(selectedTypes.getString(i))) {
                                                    globalTypeMatch = true;
                                                    break;
                                                }
                                            }
                                            if (!globalTypeMatch) {
                                                return; // Skip this alert entirely
                                            }
                                        }

                                        // Global City Filter
                                        boolean filterToCity = config.optBoolean("filterToCity", false);
                                        String userCity = config.optString("userCity", "");
                                        if (filterToCity && !userCity.isEmpty()) {
                                            boolean globalCityMatch = false;
                                            JSONArray dataArray = json.getJSONArray("data");
                                            for (int i = 0; i < dataArray.length(); i++) {
                                                if (CityUtils.isMatch(dataArray.getString(i), userCity)) {
                                                    globalCityMatch = true;
                                                    break;
                                                }
                                            }
                                            if (!globalCityMatch) {
                                                return; // Skip this alert entirely
                                            }
                                        }
                                    } catch (Exception e) {
                                        // Fallback to legacy if JSON fails
                                        isMonitoring = sharedPref.getBoolean("isMonitoring", true);
                                    }
                                } else {
                                    // Legacy fallback
                                    isMonitoring = sharedPref.getBoolean("isMonitoring", true);
                                    String filterCity = sharedPref.getString("filterCity", "");
                                    boolean filterEnabled = sharedPref.getBoolean("filterEnabled", false);
                                    if (filterEnabled && !filterCity.isEmpty()) {
                                        JSONObject legacyProfile = new JSONObject();
                                        legacyProfile.put("city", filterCity);
                                        legacyProfile.put("enabled", true);
                                        legacyProfile.put("types", new JSONArray());
                                        profiles = new JSONArray();
                                        profiles.put(legacyProfile);
                                    }
                                }
                                
                                if (!isMonitoring) {
                                    return;
                                }

                                String title = json.getString("title");
                                JSONArray dataArray = json.getJSONArray("data");
                                
                                boolean matchFound = false;
                                
                                // If no profiles defined, show all alerts
                                if (profiles == null || profiles.length() == 0) {
                                    matchFound = true;
                                } else {
                                    for (int i = 0; i < profiles.length(); i++) {
                                        JSONObject profile = profiles.getJSONObject(i);
                                        if (!profile.optBoolean("enabled", true)) continue;
                                        
                                        String profileCity = profile.optString("city", "");
                                        JSONArray profileTypes = profile.optJSONArray("types");
                                        
                                        boolean cityMatch = profileCity.isEmpty();
                                        if (!cityMatch) {
                                            for (int j = 0; j < dataArray.length(); j++) {
                                                if (CityUtils.isMatch(dataArray.getString(j), profileCity)) {
                                                    cityMatch = true;
                                                    break;
                                                }
                                            }
                                        }
                                        
                                        boolean typeMatch = profileTypes == null || profileTypes.length() == 0;
                                        if (!typeMatch) {
                                            for (int j = 0; j < profileTypes.length(); j++) {
                                                if (title.contains(profileTypes.getString(j))) {
                                                    typeMatch = true;
                                                    break;
                                                }
                                            }
                                        }
                                        
                                        if (cityMatch && typeMatch) {
                                            matchFound = true;
                                            break;
                                        }
                                    }
                                }

                                if (matchFound) {
                                    String data = dataArray.join(", ").replace("\"", "");
                                    showCriticalNotification(title, data);
                                }
                            }
                        } catch (Exception e) {
                            e.printStackTrace();
                        }
                    } else {
                        lastAlertId = "0";
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }).start();
    }

    private void showCriticalNotification(String title, String message) {
        NotificationManager notificationManager = getSystemService(NotificationManager.class);
        
        Intent intent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, intent, PendingIntent.FLAG_IMMUTABLE);

        Notification notification = new NotificationCompat.Builder(this, ALERT_CHANNEL_ID)
                .setContentTitle(title)
                .setContentText(message)
                .setSmallIcon(android.R.drawable.ic_dialog_alert)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setFullScreenIntent(pendingIntent, true)
                .setAutoCancel(true)
                .setVibrate(new long[]{0, 500, 200, 500, 200, 500})
                .build();

        notificationManager.notify(2, notification);
    }

    private Notification getServiceNotification(String text) {
        Intent intent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, intent, PendingIntent.FLAG_IMMUTABLE);

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("WatchAlert")
                .setContentText(text)
                .setSmallIcon(android.R.drawable.ic_menu_mylocation)
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .build();
    }

    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel serviceChannel = new NotificationChannel(
                    CHANNEL_ID,
                    "Monitoring Service",
                    NotificationManager.IMPORTANCE_LOW
            );
            
            NotificationChannel alertChannel = new NotificationChannel(
                    ALERT_CHANNEL_ID,
                    "Emergency Alerts",
                    NotificationManager.IMPORTANCE_HIGH
            );
            alertChannel.enableVibration(true);
            alertChannel.setVibrationPattern(new long[]{0, 500, 200, 500});

            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(serviceChannel);
            manager.createNotificationChannel(alertChannel);
        }
    }

    @Override
    public void onDestroy() {
        isRunning = false;
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
