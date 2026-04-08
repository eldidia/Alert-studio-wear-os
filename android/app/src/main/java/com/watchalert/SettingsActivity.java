package com.watchalert;

import android.app.Activity;
import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.Switch;
import android.widget.TextView;
import org.json.JSONArray;
import org.json.JSONObject;

public class SettingsActivity extends Activity {
    private Switch monitoringSwitch;
    private LinearLayout profilesContainer;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_settings);

        monitoringSwitch = findViewById(R.id.monitoringSwitch);
        profilesContainer = findViewById(R.id.settingsProfilesContainer);
        Button addProfileButton = findViewById(R.id.addProfileButton);
        Button backButton = findViewById(R.id.backButton);

        JSONObject config = ConfigManager.getConfig(this);
        monitoringSwitch.setChecked(config.optBoolean("isMonitoring", true));

        monitoringSwitch.setOnCheckedChangeListener((buttonView, isChecked) -> {
            try {
                JSONObject newConfig = ConfigManager.getConfig(this);
                newConfig.put("isMonitoring", isChecked);
                ConfigManager.saveConfig(this, newConfig);
            } catch (Exception e) {
                e.printStackTrace();
            }
        });

        addProfileButton.setOnClickListener(v -> {
            // For now, just add a default profile to show it works
            // In a full app, this would open a ProfileEditorActivity
            addDefaultProfile();
        });

        backButton.setOnClickListener(v -> finish());

        updateProfilesList();
    }

    private void addDefaultProfile() {
        try {
            JSONObject config = ConfigManager.getConfig(this);
            JSONArray profiles = config.optJSONArray("profiles");
            if (profiles == null) profiles = new JSONArray();

            JSONObject newProfile = new JSONObject();
            newProfile.put("id", String.valueOf(System.currentTimeMillis()));
            newProfile.put("name", "New Profile " + (profiles.length() + 1));
            newProfile.put("city", "");
            newProfile.put("enabled", true);
            newProfile.put("types", new JSONArray());

            profiles.put(newProfile);
            config.put("profiles", profiles);
            ConfigManager.saveConfig(this, config);
            updateProfilesList();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void updateProfilesList() {
        profilesContainer.removeAllViews();
        JSONObject config = ConfigManager.getConfig(this);
        JSONArray profiles = config.optJSONArray("profiles");

        if (profiles != null) {
            for (int i = 0; i < profiles.length(); i++) {
                try {
                    JSONObject profile = profiles.getJSONObject(i);
                    final int index = i;

                    View itemView = getLayoutInflater().inflate(R.layout.profile_item, profilesContainer, false);
                    TextView nameView = itemView.findViewById(R.id.profileName);
                    TextView detailsView = itemView.findViewById(R.id.profileDetails);

                    boolean enabled = profile.optBoolean("enabled", true);
                    nameView.setText(profile.optString("name") + (enabled ? "" : " (Disabled)"));
                    nameView.setTextColor(enabled ? Color.WHITE : Color.GRAY);
                    
                    detailsView.setText(profile.optString("city", "All Cities"));

                    itemView.setOnClickListener(v -> {
                        toggleProfile(index);
                    });

                    itemView.setOnLongClickListener(v -> {
                        deleteProfile(index);
                        return true;
                    });

                    profilesContainer.addView(itemView);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }
    }

    private void toggleProfile(int index) {
        try {
            JSONObject config = ConfigManager.getConfig(this);
            JSONArray profiles = config.getJSONArray("profiles");
            JSONObject profile = profiles.getJSONObject(index);
            profile.put("enabled", !profile.optBoolean("enabled", true));
            ConfigManager.saveConfig(this, config);
            updateProfilesList();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void deleteProfile(int index) {
        try {
            JSONObject config = ConfigManager.getConfig(this);
            JSONArray profiles = config.getJSONArray("profiles");
            JSONArray newProfiles = new JSONArray();
            for (int i = 0; i < profiles.length(); i++) {
                if (i != index) newProfiles.put(profiles.get(i));
            }
            config.put("profiles", newProfiles);
            ConfigManager.saveConfig(this, config);
            updateProfilesList();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
