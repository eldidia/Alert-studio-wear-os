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
    private Switch typeFilterSwitch;
    private Switch cityFilterSwitch;
    private LinearLayout typesContainer;
    private LinearLayout citiesContainer;
    private LinearLayout profilesContainer;

    private static final String[][] ALERT_TYPES = {
        {"ירי רקטות וטילים", "Rockets"},
        {"חדירת כלי טיס עוין", "Aircraft"},
        {"חדירת מחבלים", "Terrorist"},
        {"רעידת אדמה", "Earthquake"},
        {"צונאמי", "Tsunami"},
        {"חומרים מסוכנים", "Hazmat"},
        {"אירוע רדיולוגי", "Radiological"}
    };

    private static final String[] MAJOR_CITIES = {
        "תל אביב - יפו", "ירושלים", "חיפה", "באר שבע", "אשדוד", "נתניה", "ראשון לציון", "פתח תקווה"
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_settings);

        monitoringSwitch = findViewById(R.id.monitoringSwitch);
        typeFilterSwitch = findViewById(R.id.typeFilterSwitch);
        cityFilterSwitch = findViewById(R.id.cityFilterSwitch);
        typesContainer = findViewById(R.id.typesContainer);
        citiesContainer = findViewById(R.id.citiesContainer);
        profilesContainer = findViewById(R.id.settingsProfilesContainer);
        Button addProfileButton = findViewById(R.id.addProfileButton);
        Button backButton = findViewById(R.id.backButton);

        JSONObject config = ConfigManager.getConfig(this);
        monitoringSwitch.setChecked(config.optBoolean("isMonitoring", true));
        typeFilterSwitch.setChecked(config.optBoolean("filterByTypes", false));
        cityFilterSwitch.setChecked(config.optBoolean("filterToCity", false));
        
        typesContainer.setVisibility(typeFilterSwitch.isChecked() ? View.VISIBLE : View.GONE);
        citiesContainer.setVisibility(cityFilterSwitch.isChecked() ? View.VISIBLE : View.GONE);

        monitoringSwitch.setOnCheckedChangeListener((buttonView, isChecked) -> {
            updateConfig("isMonitoring", isChecked);
        });

        typeFilterSwitch.setOnCheckedChangeListener((buttonView, isChecked) -> {
            updateConfig("filterByTypes", isChecked);
            typesContainer.setVisibility(isChecked ? View.VISIBLE : View.GONE);
        });

        cityFilterSwitch.setOnCheckedChangeListener((buttonView, isChecked) -> {
            updateConfig("filterToCity", isChecked);
            citiesContainer.setVisibility(isChecked ? View.VISIBLE : View.GONE);
        });

        addProfileButton.setOnClickListener(v -> {
            addDefaultProfile();
        });

        backButton.setOnClickListener(v -> finish());

        updateProfilesList();
        setupTypesList();
        setupCitiesList();
    }

    private void updateConfig(String key, Object value) {
        try {
            JSONObject config = ConfigManager.getConfig(this);
            config.put(key, value);
            ConfigManager.saveConfig(this, config);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void setupTypesList() {
        typesContainer.removeAllViews();
        JSONObject config = ConfigManager.getConfig(this);
        JSONArray selectedTypes = config.optJSONArray("selectedTypes");
        if (selectedTypes == null) selectedTypes = new JSONArray();

        for (String[] type : ALERT_TYPES) {
            final String heName = type[0];
            final String enName = type[1];
            
            Button typeBtn = new Button(this);
            typeBtn.setText(enName);
            typeBtn.setTextSize(10);
            typeBtn.setAllCaps(true);
            
            boolean isSelected = false;
            for (int i = 0; i < selectedTypes.length(); i++) {
                if (selectedTypes.optString(i).equals(heName)) {
                    isSelected = true;
                    break;
                }
            }

            typeBtn.setBackgroundTintList(android.content.res.ColorStateList.valueOf(
                isSelected ? Color.parseColor("#2563eb") : Color.parseColor("#222222")
            ));
            typeBtn.setTextColor(Color.WHITE);

            typeBtn.setOnClickListener(v -> {
                toggleSelectedType(heName);
                setupTypesList();
            });

            typesContainer.addView(typeBtn);
        }
    }

    private void toggleSelectedType(String typeName) {
        try {
            JSONObject config = ConfigManager.getConfig(this);
            JSONArray selectedTypes = config.optJSONArray("selectedTypes");
            if (selectedTypes == null) selectedTypes = new JSONArray();

            boolean found = false;
            JSONArray newList = new JSONArray();
            for (int i = 0; i < selectedTypes.length(); i++) {
                if (selectedTypes.getString(i).equals(typeName)) {
                    found = true;
                } else {
                    newList.put(selectedTypes.get(i));
                }
            }

            if (!found) {
                newList.put(typeName);
            }

            config.put("selectedTypes", newList);
            ConfigManager.saveConfig(this, config);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void setupCitiesList() {
        citiesContainer.removeAllViews();
        JSONObject config = ConfigManager.getConfig(this);
        String currentCity = config.optString("userCity", "");

        for (String city : MAJOR_CITIES) {
            Button cityBtn = new Button(this);
            cityBtn.setText(city);
            cityBtn.setTextSize(10);
            
            boolean isSelected = city.equals(currentCity);

            cityBtn.setBackgroundTintList(android.content.res.ColorStateList.valueOf(
                isSelected ? Color.parseColor("#2563eb") : Color.parseColor("#222222")
            ));
            cityBtn.setTextColor(Color.WHITE);

            cityBtn.setOnClickListener(v -> {
                updateConfig("userCity", isSelected ? "" : city);
                setupCitiesList();
            });

            citiesContainer.addView(cityBtn);
        }
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
