package com.watchalert;

import java.text.Normalizer;

public class CityUtils {
    public static String normalize(String city) {
        if (city == null) return "";
        
        // Normalize Hebrew characters (NFC)
        String normalized = Normalizer.normalize(city, Normalizer.Form.NFC);
        
        // Remove quotes, geresh, and special characters used in city names
        normalized = normalized.replace("\"", "")
                               .replace("'", "")
                               .replace("׳", "")
                               .replace("״", "");
        
        // Replace hyphens and slashes with spaces for easier matching
        normalized = normalized.replace("-", " ")
                               .replace("/", " ");
        
        // Remove extra spaces and convert to lowercase (for English names)
        return normalized.trim().toLowerCase().replaceAll("\\s+", " ");
    }

    public static boolean isMatch(String alertCity, String userCity) {
        if (alertCity == null || userCity == null) return false;
        
        String normAlert = normalize(alertCity);
        String normUser = normalize(userCity);
        
        if (normAlert.isEmpty() || normUser.isEmpty()) return false;
        
        // Exact match after normalization
        if (normAlert.equals(normUser)) return true;
        
        // Hierarchical match: if user selected "Ashdod", it matches "Ashdod Area A"
        // We check if the user city is a prefix of the alert city (word-boundary aware)
        if (normAlert.startsWith(normUser + " ") || normAlert.startsWith(normUser + " -")) {
            return true;
        }
        
        // Also check if alert city is a prefix of user city (just in case)
        if (normUser.startsWith(normAlert + " ") || normUser.startsWith(normAlert + " -")) {
            return true;
        }

        // General "contains" as a fallback for fuzzy matching
        return normAlert.contains(normUser) || normUser.contains(normAlert);
    }
}
