package com.watchalert;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
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
        if (!isRunning) {
            isRunning = true;
            startForeground(1, getServiceNotification("Monitoring Active"));
            startPolling();
        }
        return START_STICKY;
    }

    private void startPolling() {
        handler.postDelayed(new Runnable() {
            @Override
            public void run() {
                if (isRunning) {
                    checkAlerts();
                    handler.postDelayed(this, 3000); // Poll every 3 seconds
                }
            }
        }, 3000);
    }

    private void checkAlerts() {
        new Thread(() -> {
            try {
                URL url = new URL("https://www.oref.org.il/WarningMessages/alert/alerts.json");
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
                        JSONObject json = new JSONObject(jsonStr);
                        String id = json.getString("id");
                        if (!id.equals(lastAlertId) && !id.equals("0")) {
                            lastAlertId = id;
                            
                            SharedPreferences sharedPref = getSharedPreferences("WatchAlertPrefs", Context.MODE_PRIVATE);
                            boolean isMonitoring = sharedPref.getBoolean("isMonitoring", true);
                            
                            if (!isMonitoring) {
                                return;
                            }

                            String filterCity = sharedPref.getString("filterCity", "");
                            boolean filterEnabled = sharedPref.getBoolean("filterEnabled", false);
                            
                            JSONArray dataArray = json.getJSONArray("data");
                            boolean matchFound = !filterEnabled || filterCity.isEmpty();
                            
                            if (filterEnabled && !filterCity.isEmpty()) {
                                for (int i = 0; i < dataArray.length(); i++) {
                                    if (dataArray.getString(i).contains(filterCity)) {
                                        matchFound = true;
                                        break;
                                    }
                                }
                            }

                            if (matchFound) {
                                String title = json.getString("title");
                                String data = dataArray.join(", ").replace("\"", "");
                                showCriticalNotification(title, data);
                            }
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
