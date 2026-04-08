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
        
        statusText.setText(isMonitoring ? "Monitoring Active" : "Monitoring Paused");
        statusIndicator.setBackgroundColor(isMonitoring ? Color.GREEN : Color.RED);

        profilesContainer.removeAllViews();
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
