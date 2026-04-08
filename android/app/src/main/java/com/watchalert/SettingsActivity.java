package com.watchalert;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.Switch;
import android.widget.TextView;
import android.widget.EditText;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

public class SettingsActivity extends Activity {
    private Switch monitoringSwitch;
    private Switch typeFilterSwitch;
    private Switch cityFilterSwitch;
    private EditText citySearchInput;
    private LinearLayout typesContainer;
    private LinearLayout citiesContainer;
    private LinearLayout citySuggestionsContainer;
    private LinearLayout profilesContainer;
    private Button langHe, langEn, langAr, langRu;
    private List<CityManager.CityInfo> allCities = new ArrayList<>();

    private static final String[] ALL_CITIES = {
        "תל אביב - יפו", "ירושלים", "חיפה", "באר שבע", "אשדוד", "נתניה", "ראשון לציון", "פתח תקווה",
        "חולון", "בני ברק", "רמת גן", "רחובות", "אשקלון", "בת ים", "בית שמש", "כפר סבא", "הרצליה",
        "חדרה", "מודיעין-מכבים-רעות", "רמלה", "רעננה", "מודיעין עילית", "רהט", "הוד השרון", "גבעתיים",
        "קריית אתא", "נהריה", "ביתר עילית", "אום אל-פחם", "קריית גת", "אילת", "ראש העין", "עפולה",
        "נס ציונה", "עכו", "אלעד", "רמת השרון", "כרמיאל", "יבנה", "טבריה", "טייבה", "קריית מוצקין",
        "שפרעם", "נוף הגליל", "קריית ים", "קריית ביאליק", "קריית אונו", "מעלה אדומים", "אור יהודה",
        "צפת", "נתיבות", "דימונה", "טמרה", "סח'נין", "יהוד-מונוסון", "באקה אל-גרבייה", "אופקים",
        "גבעת שמואל", "טירה", "ערד", "מגדל העמק", "קריית מלאכי", "כפר קאסם", "קריית שמונה", "נשר",
        "מעלות-תרשיחא", "טירת כרמל", "שדרות", "בית שאן", "עראבה", "קלנסווה", "כפר יונה", "אריאל",
        "אור עקיבא", "קריית גת", "קריית ארבע", "מבשרת ציון", "גן יבנה", "כפר מנדא", "מג'ד אל-כרום",
        "יפיע", "כפר כנא", "ג'דיידה-מכר", "ריינה", "כסייפה", "ערערה", "תל שבע", "חריש"
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
        citySearchInput = findViewById(R.id.citySearchInput);
        typesContainer = findViewById(R.id.typesContainer);
        citiesContainer = findViewById(R.id.citiesContainer);
        citySuggestionsContainer = findViewById(R.id.citySuggestionsContainer);
        profilesContainer = findViewById(R.id.settingsProfilesContainer);
        Button addProfileButton = findViewById(R.id.addProfileButton);
        Button backButton = findViewById(R.id.backButton);
        
        langHe = findViewById(R.id.langHe);
        langEn = findViewById(R.id.langEn);
        langAr = findViewById(R.id.langAr);
        langRu = findViewById(R.id.langRu);

        JSONObject config = ConfigManager.getConfig(this);
        monitoringSwitch.setChecked(config.optBoolean("isMonitoring", true));
        typeFilterSwitch.setChecked(config.optBoolean("filterByTypes", false));
        cityFilterSwitch.setChecked(config.optBoolean("filterToCity", false));
        
        updateLangButtons(config.optString("lang", "he"));

        langHe.setOnClickListener(v -> setLanguage("he"));
        langEn.setOnClickListener(v -> setLanguage("en"));
        langAr.setOnClickListener(v -> setLanguage("ar"));
        langRu.setOnClickListener(v -> setLanguage("ru"));

        typesContainer.setVisibility(typeFilterSwitch.isChecked() ? View.VISIBLE : View.GONE);
        citiesContainer.setVisibility(cityFilterSwitch.isChecked() ? View.VISIBLE : View.GONE);
        citySearchInput.setVisibility(cityFilterSwitch.isChecked() ? View.VISIBLE : View.GONE);

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
            citySearchInput.setVisibility(isChecked ? View.VISIBLE : View.GONE);
            if (!isChecked) citySuggestionsContainer.setVisibility(View.GONE);
        });

        citySearchInput.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                updateCitySuggestions(s.toString());
            }

            @Override
            public void afterTextChanged(Editable s) {}
        });

        addProfileButton.setOnClickListener(v -> {
            startActivity(new Intent(this, ProfileEditorActivity.class));
        });

        backButton.setOnClickListener(v -> finish());

        String lang = config.optString("lang", "he");
        allCities = CityManager.getCachedCities(this);
        CityManager.fetchCities(this, lang, cities -> {
            allCities = cities;
            setupCitiesList(lang);
        });

        updateProfilesList(lang);
        setupTypesList(lang);
        setupCitiesList(lang);
    }

    @Override
    protected void onResume() {
        super.onResume();
        JSONObject config = ConfigManager.getConfig(this);
        String lang = config.optString("lang", "he");
        updateProfilesList(lang);
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

    private void setLanguage(String lang) {
        updateConfig("lang", lang);
        updateLangButtons(lang);
        setupTypesList(lang);
        setupCitiesList(lang);
        updateProfilesList(lang);
    }

    private void updateLangButtons(String currentLang) {
        langHe.setBackgroundTintList(android.content.res.ColorStateList.valueOf(currentLang.equals("he") ? Color.parseColor("#2563eb") : Color.parseColor("#222222")));
        langEn.setBackgroundTintList(android.content.res.ColorStateList.valueOf(currentLang.equals("en") ? Color.parseColor("#2563eb") : Color.parseColor("#222222")));
        langAr.setBackgroundTintList(android.content.res.ColorStateList.valueOf(currentLang.equals("ar") ? Color.parseColor("#2563eb") : Color.parseColor("#222222")));
        langRu.setBackgroundTintList(android.content.res.ColorStateList.valueOf(currentLang.equals("ru") ? Color.parseColor("#2563eb") : Color.parseColor("#222222")));

        // Update other labels
        TextView title = findViewById(R.id.settingsTitle);
        TextView langLabel = findViewById(R.id.langLabel);
        TextView profilesLabel = findViewById(R.id.profilesLabel);
        Button addProfileButton = findViewById(R.id.addProfileButton);
        Button backButton = findViewById(R.id.backButton);

        if (currentLang.equals("he")) {
            title.setText("הגדרות");
            langLabel.setText("שפה");
            monitoringSwitch.setText("ניטור");
            typeFilterSwitch.setText("סינון לפי סוג");
            cityFilterSwitch.setText("סינון לפי עיר");
            citySearchInput.setHint("חפש עיר...");
            profilesLabel.setText("פרופילים");
            addProfileButton.setText("+ הוסף פרופיל");
            backButton.setText("סיום");
        } else if (currentLang.equals("ar")) {
            title.setText("الإعدادات");
            langLabel.setText("اللغة");
            monitoringSwitch.setText("المراقبة");
            typeFilterSwitch.setText("تصفية حسب النوع");
            cityFilterSwitch.setText("تصفية حسب المدينة");
            citySearchInput.setHint("ابحث عن مدينة...");
            profilesLabel.setText("الملفات الشخصية");
            addProfileButton.setText("+ إضافة ملف شخصي");
            backButton.setText("تم");
        } else if (currentLang.equals("ru")) {
            title.setText("Настройки");
            langLabel.setText("Язык");
            monitoringSwitch.setText("Мониторинг");
            typeFilterSwitch.setText("Фильтр по типу");
            cityFilterSwitch.setText("Фильтр по городу");
            citySearchInput.setHint("Поиск города...");
            profilesLabel.setText("Профили");
            addProfileButton.setText("+ Добавить профиль");
            backButton.setText("Готово");
        } else {
            title.setText("Settings");
            langLabel.setText("Language");
            monitoringSwitch.setText("Monitoring");
            typeFilterSwitch.setText("Filter by Type");
            cityFilterSwitch.setText("Filter by City");
            citySearchInput.setHint("Search city...");
            profilesLabel.setText("Profiles");
            addProfileButton.setText("+ Add Profile");
            backButton.setText("Done");
        }
    }

    private void updateCitySuggestions(String query) {
        citySuggestionsContainer.removeAllViews();
        if (query.length() < 2) {
            citySuggestionsContainer.setVisibility(View.GONE);
            return;
        }

        List<CityManager.CityInfo> matches = allCities.stream()
                .filter(city -> city.name.contains(query))
                .limit(8)
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
                updateConfig("userCity", city.name);
                citySearchInput.setText("");
                citySuggestionsContainer.setVisibility(View.GONE);
                setupCitiesList(ConfigManager.getConfig(this).optString("lang", "he"));
            });

            citySuggestionsContainer.addView(suggestionView);
        }
    }

    private void setupTypesList(String lang) {
        typesContainer.removeAllViews();
        JSONObject config = ConfigManager.getConfig(this);
        JSONArray selectedTypes = config.optJSONArray("selectedTypes");
        if (selectedTypes == null) selectedTypes = new JSONArray();

        for (String[] type : ALERT_TYPES) {
            final String heName = type[0];
            final String enName = type[1];
            
            Button typeBtn = new Button(this);
            typeBtn.setText(lang.equals("he") ? heName : enName);
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
                setupTypesList(lang);
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

    private void setupCitiesList(String lang) {
        citiesContainer.removeAllViews();
        JSONObject config = ConfigManager.getConfig(this);
        String currentCity = config.optString("userCity", "");

        List<String> majorNames = Arrays.asList("תל אביב - יפו", "ירושלים", "חיפה", "באר שבע", "אשדוד");

        for (CityManager.CityInfo city : allCities) {
            if (!majorNames.contains(city.name)) continue;
            
            Button cityBtn = new Button(this);
            cityBtn.setText(city.name);
            cityBtn.setTextSize(10);
            
            boolean isSelected = city.name.equals(currentCity);

            cityBtn.setBackgroundTintList(android.content.res.ColorStateList.valueOf(
                isSelected ? Color.parseColor("#2563eb") : Color.parseColor("#222222")
            ));
            cityBtn.setTextColor(Color.WHITE);

            cityBtn.setOnClickListener(v -> {
                updateConfig("userCity", isSelected ? "" : city.name);
                setupCitiesList(lang);
            });

            citiesContainer.addView(cityBtn);
        }
    }

    private void updateProfilesList(String lang) {
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
                    String disabledText = lang.equals("he") ? " (מושבת)" : 
                                        lang.equals("ar") ? " (معطل)" : 
                                        lang.equals("ru") ? " (Отключено)" : " (Disabled)";
                    
                    nameView.setText(profile.optString("name") + (enabled ? "" : disabledText));
                    nameView.setTextColor(enabled ? Color.WHITE : Color.GRAY);
                    
                    detailsView.setText(profile.optString("city", lang.equals("he") ? "כל הערים" : "All Cities"));

                    itemView.setOnClickListener(v -> {
                        Intent intent = new Intent(this, ProfileEditorActivity.class);
                        intent.putExtra("profile_id", profile.optString("id"));
                        startActivity(intent);
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
