package com.watchalert;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

public class ProfileEditorActivity extends Activity {
    private EditText nameInput;
    private EditText cityInput;
    private LinearLayout typesContainer;
    private LinearLayout citySuggestionsContainer;
    private LinearLayout majorCitiesContainer;
    private String profileId;
    private List<String> selectedTypes = new ArrayList<>();
    private String lang = "he";
    private List<CityManager.CityInfo> allCities = new ArrayList<>();

    private static final String[] MAJOR_CITIES = {
        "תל אביב - יפו", "ירושלים", "חיפה", "באר שבע", "אשדוד", "נתניה", "ראשון לציון", "פתח תקווה"
    };

    private static final String[][] ALERT_TYPES = {
        {"ירי רקטות וטילים", "Rockets"},
        {"חדירת כלי טיס עוין", "Aircraft"},
        {"חדירת מחבלים", "Terrorist"},
        {"רעידת אדמה", "Earthquake"},
        {"צונאמי", "Tsunami"},
        {"חומרים מסוכנים", "Hazmat"},
        {"אירוע רדיולוגי", "Radiological"}
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_profile_editor);

        nameInput = findViewById(R.id.profileNameInput);
        cityInput = findViewById(R.id.profileCityInput);
        typesContainer = findViewById(R.id.profileTypesContainer);
        citySuggestionsContainer = findViewById(R.id.citySuggestionsContainer);
        majorCitiesContainer = findViewById(R.id.majorCitiesContainer);
        Button saveButton = findViewById(R.id.saveProfileButton);
        Button deleteButton = findViewById(R.id.deleteProfileButton);
        Button cancelButton = findViewById(R.id.cancelProfileButton);
        TextView titleView = findViewById(R.id.editorTitle);

        profileId = getIntent().getStringExtra("profile_id");
        
        JSONObject config = ConfigManager.getConfig(this);
        lang = config.optString("lang", "he");

        allCities = CityManager.getCachedCities(this);
        CityManager.fetchCities(this, lang, cities -> {
            allCities = cities;
            setupMajorCities();
        });

        if (profileId != null) {
            titleView.setText("Edit Profile");
            deleteButton.setVisibility(View.VISIBLE);
            loadProfile(profileId);
        } else {
            titleView.setText("New Profile");
            deleteButton.setVisibility(View.GONE);
        }

        setupTypesList();
        setupCityAutocomplete();
        setupMajorCities();

        saveButton.setOnClickListener(v -> saveAndFinish());
        deleteButton.setOnClickListener(v -> deleteAndFinish());
        cancelButton.setOnClickListener(v -> finish());

        updateLabels();
    }

    private void setupCityAutocomplete() {
        cityInput.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                updateCitySuggestions(s.toString());
                setupMajorCities();
            }

            @Override
            public void afterTextChanged(Editable s) {}
        });
    }

    private void setupMajorCities() {
        majorCitiesContainer.removeAllViews();
        String currentCity = cityInput.getText().toString();
        String normCurrent = CityUtils.normalize(currentCity);

        List<String> majorNames = Arrays.asList(MAJOR_CITIES);
        
        // Use a set to keep track of added names to avoid duplicates if multiple regions match
        java.util.Set<String> addedNames = new java.util.HashSet<>();

        for (CityManager.CityInfo city : allCities) {
            if (!majorNames.contains(city.name) || addedNames.contains(city.name)) continue;
            
            addedNames.add(city.name);
            Button cityBtn = new Button(this);
            cityBtn.setText(city.name);
            cityBtn.setTextSize(10);
            
            boolean isSelected = CityUtils.normalize(city.name).equals(normCurrent);

            cityBtn.setBackgroundTintList(android.content.res.ColorStateList.valueOf(
                isSelected ? Color.parseColor("#2563eb") : Color.parseColor("#222222")
            ));
            cityBtn.setTextColor(Color.WHITE);

            cityBtn.setOnClickListener(v -> {
                cityInput.setText(isSelected ? "" : city.name);
                cityInput.setSelection(cityInput.getText().length());
                setupMajorCities();
            });

            majorCitiesContainer.addView(cityBtn);
        }
    }

    private void updateCitySuggestions(String query) {
        citySuggestionsContainer.removeAllViews();
        String trimmedQuery = query.trim();
        if (trimmedQuery.length() < 2) {
            citySuggestionsContainer.setVisibility(View.GONE);
            return;
        }

        final String normQuery = CityUtils.normalize(trimmedQuery);

        List<CityManager.CityInfo> matches = allCities.stream()
                .filter(city -> {
                    String normName = CityUtils.normalize(city.name);
                    return normName.contains(normQuery);
                })
                .sorted((a, b) -> {
                    String normA = CityUtils.normalize(a.name);
                    String normB = CityUtils.normalize(b.name);
                    
                    // Prioritize exact matches
                    if (normA.equals(normQuery)) return -1;
                    if (normB.equals(normQuery)) return 1;
                    
                    // Prioritize prefix matches
                    boolean aStarts = normA.startsWith(normQuery);
                    boolean bStarts = normB.startsWith(normQuery);
                    if (aStarts && !bStarts) return -1;
                    if (!aStarts && bStarts) return 1;
                    
                    // Then alphabetical
                    return normA.compareTo(normB);
                })
                .limit(10)
                .collect(Collectors.toList());

        if (matches.isEmpty()) {
            citySuggestionsContainer.setVisibility(View.GONE);
            return;
        }

        citySuggestionsContainer.setVisibility(View.VISIBLE);
        for (CityManager.CityInfo city : matches) {
            View suggestionView = getLayoutInflater().inflate(android.R.layout.simple_list_item_2, null);
            TextView text1 = suggestionView.findViewById(android.R.id.text1);
            TextView text2 = suggestionView.findViewById(android.R.id.text2);
            
            text1.setText(city.name);
            text1.setTextColor(Color.WHITE);
            text1.setTextSize(14);
            
            String defenseTime = city.time.isEmpty() ? "" : " (" + city.time + "s)";
            text2.setText(city.district + defenseTime);
            text2.setTextColor(Color.GRAY);
            text2.setTextSize(11);

            suggestionView.setPadding(16, 16, 16, 16);
            suggestionView.setOnClickListener(v -> {
                cityInput.setText(city.name);
                cityInput.setSelection(city.name.length());
                citySuggestionsContainer.setVisibility(View.GONE);
                setupMajorCities();
            });

            citySuggestionsContainer.addView(suggestionView);
        }
    }

    private void updateLabels() {
        TextView title = findViewById(R.id.editorTitle);
        TextView nameLabel = findViewById(R.id.nameLabel);
        TextView cityLabel = findViewById(R.id.cityLabel);
        TextView typesLabel = findViewById(R.id.typesLabel);
        Button saveButton = findViewById(R.id.saveProfileButton);
        Button deleteButton = findViewById(R.id.deleteProfileButton);
        Button cancelButton = findViewById(R.id.cancelProfileButton);

        if (lang.equals("he")) {
            title.setText(profileId != null ? "עריכת פרופיל" : "פרופיל חדש");
            nameLabel.setText("שם הפרופיל");
            cityLabel.setText("עיר (בעברית)");
            typesLabel.setText("סוגי התרעות");
            saveButton.setText("שמור פרופיל");
            deleteButton.setText("מחק פרופיל");
            cancelButton.setText("ביטול");
            nameInput.setHint("בית, עבודה וכו'");
            cityInput.setHint("למשל: תל אביב - יפו");
        } else if (lang.equals("ar")) {
            title.setText(profileId != null ? "تعديل الملف الشخصي" : "ملف شخصي جديد");
            nameLabel.setText("اسم الملف الشخصي");
            cityLabel.setText("المدينة (بالعبرية)");
            typesLabel.setText("أنواع التنبيهات");
            saveButton.setText("حفظ الملف الشخصي");
            deleteButton.setText("حذف الملف الشخصي");
            cancelButton.setText("إلغاء");
            nameInput.setHint("المنزل، العمل، إلخ.");
            cityInput.setHint("مثال: تل أبيب - يافا");
        } else if (lang.equals("ru")) {
            title.setText(profileId != null ? "Редактировать профиль" : "Новый профиль");
            nameLabel.setText("Название профиля");
            cityLabel.setText("Город (на иврите)");
            typesLabel.setText("Типы сигналов");
            saveButton.setText("Сохранить");
            deleteButton.setText("Удалить");
            cancelButton.setText("Отмена");
            nameInput.setHint("Дом, работа и т.д.");
            cityInput.setHint("например: Тель-Авив");
        } else {
            title.setText(profileId != null ? "Edit Profile" : "New Profile");
            nameLabel.setText("Profile Name");
            cityLabel.setText("City (Hebrew)");
            typesLabel.setText("Alert Types");
            saveButton.setText("Save Profile");
            deleteButton.setText("Delete Profile");
            cancelButton.setText("Cancel");
        }
    }

    private void loadProfile(String id) {
        try {
            JSONObject config = ConfigManager.getConfig(this);
            JSONArray profiles = config.optJSONArray("profiles");
            if (profiles != null) {
                for (int i = 0; i < profiles.length(); i++) {
                    JSONObject p = profiles.getJSONObject(i);
                    if (p.optString("id").equals(id)) {
                        nameInput.setText(p.optString("name"));
                        cityInput.setText(p.optString("city"));
                        JSONArray types = p.optJSONArray("types");
                        if (types != null) {
                            for (int j = 0; j < types.length(); j++) {
                                selectedTypes.add(types.getString(j));
                            }
                        }
                        break;
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void setupTypesList() {
        typesContainer.removeAllViews();
        for (String[] type : ALERT_TYPES) {
            final String heName = type[0];
            final String enName = type[1];

            Button typeBtn = new Button(this);
            typeBtn.setText(lang.equals("he") ? heName : enName);
            typeBtn.setTextSize(10);
            typeBtn.setAllCaps(true);

            boolean isSelected = selectedTypes.contains(heName);

            typeBtn.setBackgroundTintList(android.content.res.ColorStateList.valueOf(
                isSelected ? Color.parseColor("#2563eb") : Color.parseColor("#222222")
            ));
            typeBtn.setTextColor(Color.WHITE);

            typeBtn.setOnClickListener(v -> {
                if (selectedTypes.contains(heName)) {
                    selectedTypes.remove(heName);
                } else {
                    selectedTypes.add(heName);
                }
                setupTypesList();
            });

            typesContainer.addView(typeBtn);
        }
    }

    private void saveAndFinish() {
        String name = nameInput.getText().toString().trim();
        if (name.isEmpty()) {
            name = "Unnamed Profile";
        }
        String city = cityInput.getText().toString().trim();

        try {
            JSONObject config = ConfigManager.getConfig(this);
            JSONArray profiles = config.optJSONArray("profiles");
            if (profiles == null) profiles = new JSONArray();

            JSONObject profile = null;
            int index = -1;

            if (profileId != null) {
                for (int i = 0; i < profiles.length(); i++) {
                    if (profiles.getJSONObject(i).optString("id").equals(profileId)) {
                        profile = profiles.getJSONObject(i);
                        index = i;
                        break;
                    }
                }
            }

            if (profile == null) {
                profile = new JSONObject();
                profile.put("id", String.valueOf(System.currentTimeMillis()));
                profile.put("enabled", true);
            }

            profile.put("name", name);
            profile.put("city", city);
            
            JSONArray typesArray = new JSONArray();
            for (String type : selectedTypes) {
                typesArray.put(type);
            }
            profile.put("types", typesArray);

            if (index != -1) {
                profiles.put(index, profile);
            } else {
                profiles.put(profile);
            }

            config.put("profiles", profiles);
            ConfigManager.saveConfig(this, config);
            finish();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void deleteAndFinish() {
        if (profileId == null) return;
        try {
            JSONObject config = ConfigManager.getConfig(this);
            JSONArray profiles = config.optJSONArray("profiles");
            if (profiles != null) {
                JSONArray newList = new JSONArray();
                for (int i = 0; i < profiles.length(); i++) {
                    if (!profiles.getJSONObject(i).optString("id").equals(profileId)) {
                        newList.put(profiles.get(i));
                    }
                }
                config.put("profiles", newList);
                ConfigManager.saveConfig(this, config);
            }
            finish();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
