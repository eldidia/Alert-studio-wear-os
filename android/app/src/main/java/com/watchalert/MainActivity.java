package com.watchalert;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import org.json.JSONArray;
import org.json.JSONObject;

public class MainActivity extends Activity {
    private static final int PERMISSION_REQUEST_CODE = 123;
    private LinearLayout profilesContainer;
    private TextView statusText;
    private View statusIndicator;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        statusText = findViewById(R.id.statusText);
        statusIndicator = findViewById(R.id.statusIndicator);
        profilesContainer = findViewById(R.id.profilesContainer);
        Button settingsButton = findViewById(R.id.settingsButton);
        Button testButton = findViewById(R.id.testButton);

        settingsButton.setOnClickListener(v -> {
            startActivity(new Intent(this, SettingsActivity.class));
        });

        testButton.setOnClickListener(v -> {
            Intent serviceIntent = new Intent(this, AlertService.class);
            serviceIntent.putExtra("test_notification", true);
            startService(serviceIntent);
        });

        checkPermissions();
    }

    @Override
    protected void onResume() {
        super.onResume();
        updateUI();
    }

    private void updateUI() {
        JSONObject config = ConfigManager.getConfig(this);
        boolean isMonitoring = config.optBoolean("isMonitoring", true);
        String lang = config.optString("lang", "he");
        
        String status = isMonitoring ? "Monitoring Active" : "Monitoring Paused";
        if (lang.equals("he")) status = isMonitoring ? "ניטור פעיל" : "ניטור מושהה";
        else if (lang.equals("ar")) status = isMonitoring ? "المراقبة نشطة" : "المراقبة متوقفة";
        else if (lang.equals("ru")) status = isMonitoring ? "Мониторинг активен" : "Мониторинг приостановлен";

        statusText.setText(status);
        statusIndicator.setBackgroundColor(isMonitoring ? Color.parseColor("#3b82f6") : Color.RED);
        if (isMonitoring) {
            statusIndicator.startAnimation(android.view.animation.AnimationUtils.loadAnimation(this, R.anim.pulse));
        } else {
            statusIndicator.clearAnimation();
        }

        // Update other labels
        TextView activeProfilesLabel = findViewById(R.id.activeProfilesLabel);
        Button testButton = findViewById(R.id.testButton);
        Button settingsButton = findViewById(R.id.settingsButton);

        TextView versionText = findViewById(R.id.versionText);
        versionText.setText("v1.4 Native");

        if (lang.equals("he")) {
            activeProfilesLabel.setText("פרופילים פעילים");
            testButton.setText("בדיקת התרעה");
            settingsButton.setText("הגדרות");
            ((TextView)findViewById(R.id.whatWorksTitle)).setText("סטטוס מערכת");
            ((TextView)findViewById(R.id.whatWorksList)).setText("• סנכרון בזמן אמת\n• מנוע רטט SOS\n• לוגיקת פרופילים\n• קישור ל-Galaxy Watch");
        } else if (lang.equals("ar")) {
            activeProfilesLabel.setText("الملفات الشخصية النشطة");
            testButton.setText("اختبار التنبيه");
            settingsButton.setText("الإعدادات");
            ((TextView)findViewById(R.id.whatWorksTitle)).setText("حالة النظام");
            ((TextView)findViewById(R.id.whatWorksList)).setText("• مزامنة في الوقت الحقيقي\n• محرك اهتزاز SOS\n• منطق الملفات الشخصية\n• الربط بـ Galaxy Watch");
        } else if (lang.equals("ru")) {
            activeProfilesLabel.setText("Активные профили");
            testButton.setText("Тестовый сигнал");
            settingsButton.setText("Настройки");
            ((TextView)findViewById(R.id.whatWorksTitle)).setText("Статус системы");
            ((TextView)findViewById(R.id.whatWorksList)).setText("• Синхронизация в реальном времени\n• Вибромотор SOS\n• Логика профилей\n• Связь с Galaxy Watch");
        } else {
            activeProfilesLabel.setText("Active Profiles");
            testButton.setText("Test Alert");
            settingsButton.setText("Settings");
            ((TextView)findViewById(R.id.whatWorksTitle)).setText("System Status");
            ((TextView)findViewById(R.id.whatWorksList)).setText("• Real-time Socket Sync\n• SOS Vibration Engine\n• Smart Profile Logic\n• Galaxy Watch Link");
        }

        profilesContainer.removeAllViews();

        // Show Global Type Filters if active
        if (config.optBoolean("filterByTypes", false)) {
            JSONArray selectedTypes = config.optJSONArray("selectedTypes");
            if (selectedTypes != null && selectedTypes.length() > 0) {
                TextView typeHeader = new TextView(this);
                String label = "Global Type Filter Active";
                if (lang.equals("he")) label = "סינון סוגי התרעות פעיל";
                else if (lang.equals("ar")) label = "تصفية أنواع التنبيهات نشطة";
                else if (lang.equals("ru")) label = "Глобальный фильтр типов активен";
                
                typeHeader.setText(label);
                typeHeader.setTextColor(Color.parseColor("#2563eb"));
                typeHeader.setTextSize(9);
                typeHeader.setPadding(20, 10, 0, 5);
                profilesContainer.addView(typeHeader);
            }
        }

        // Show Global City Filter if active
        if (config.optBoolean("filterToCity", false)) {
            String userCity = config.optString("userCity", "");
            if (!userCity.isEmpty()) {
                TextView cityHeader = new TextView(this);
                String label = "City Filter: ";
                if (lang.equals("he")) label = "סינון עיר: ";
                else if (lang.equals("ar")) label = "تصفية المدينة: ";
                else if (lang.equals("ru")) label = "Фильтр по городу: ";
                
                cityHeader.setText(label + userCity);
                cityHeader.setTextColor(Color.parseColor("#2563eb"));
                cityHeader.setTextSize(9);
                cityHeader.setPadding(20, 5, 0, 5);
                profilesContainer.addView(cityHeader);
            }
        }

        JSONArray profiles = config.optJSONArray("profiles");
        if (profiles != null && profiles.length() > 0) {
            for (int i = 0; i < profiles.length(); i++) {
                try {
                    JSONObject profile = profiles.getJSONObject(i);
                    if (!profile.optBoolean("enabled", true)) continue;

                    View itemView = getLayoutInflater().inflate(R.layout.profile_item, profilesContainer, false);
                    TextView nameView = itemView.findViewById(R.id.profileName);
                    TextView detailsView = itemView.findViewById(R.id.profileDetails);

                    nameView.setText(profile.optString("name", "Unnamed Profile"));
                    String city = profile.optString("city", "All Cities");
                    JSONArray types = profile.optJSONArray("types");
                    String typesStr = (types == null || types.length() == 0) ? "All Types" : types.length() + " Types";
                    detailsView.setText(city + " • " + typesStr);

                    profilesContainer.addView(itemView);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        } else {
            TextView emptyView = new TextView(this);
            emptyView.setText("No active profiles");
            emptyView.setTextColor(Color.GRAY);
            emptyView.setTextSize(10);
            emptyView.setPadding(20, 10, 0, 0);
            profilesContainer.addView(emptyView);
        }
    }

    private void checkPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.POST_NOTIFICATIONS}, PERMISSION_REQUEST_CODE);
            } else {
                startAlertService();
            }
        } else {
            startAlertService();
        }
    }

    private void startAlertService() {
        Intent serviceIntent = new Intent(this, AlertService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent);
        } else {
            startService(serviceIntent);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERMISSION_REQUEST_CODE) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                startAlertService();
            }
        }
    }
}
