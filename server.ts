import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import nodeFetch from "node-fetch";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use global fetch if available (Node 18+), otherwise use node-fetch
const fetch: any = (globalThis as any).fetch || nodeFetch;

interface CityInfo {
  name: string;
  district: string;
  time: string;
}

const FALLBACK_CITIES_HE: CityInfo[] = [
  { name: "תל אביב - יפו", district: "דן", time: "90" },
  { name: "ירושלים", district: "ירושלים", time: "90" },
  { name: "חיפה", district: "חיפה", time: "60" },
  { name: "ראשון לציון", district: "דן", time: "90" },
  { name: "פתח תקווה", district: "דן", time: "90" },
  { name: "אשדוד", district: "לכיש", time: "60" },
  { name: "נתניה", district: "שרון", time: "90" },
  { name: "באר שבע", district: "מרכז הנגב", time: "60" },
  { name: "בני ברק", district: "דן", time: "90" },
  { name: "חולון", district: "דן", time: "90" },
  { name: "רמת גן", district: "דן", time: "90" },
  { name: "רחובות", district: "שפלה", time: "90" },
  { name: "אשקלון", district: "לכיש", time: "30" },
  { name: "בת ים", district: "דן", time: "90" },
  { name: "בית שמש", district: "ירושלים", time: "90" },
  { name: "כפר סבא", district: "שרון", time: "90" },
  { name: "הרצליה", district: "שרון", time: "90" },
  { name: "חדרה", district: "שרון", time: "90" },
  { name: "מודיעין-מכבים-רעות", district: "שפלה", time: "90" },
  { name: "לוד", district: "שפלה", time: "90" },
  { name: "רמלה", district: "שפלה", time: "90" },
  { name: "רעננה", district: "שרון", time: "90" },
  { name: "מודיעין עילית", district: "שפלה", time: "90" },
  { name: "רהט", district: "מרכז הנגב", time: "60" },
  { name: "הוד השרון", district: "שרון", time: "90" },
  { name: "גבעתיים", district: "דן", time: "90" },
  { name: "קריית אתא", district: "חיפה", time: "60" },
  { name: "נהריה", district: "קו העימות", time: "0" },
  { name: "ביתר עילית", district: "ירושלים", time: "90" },
  { name: "אום אל-פחם", district: "ואדי ערה", time: "90" },
  { name: "קריית גת", district: "לכיש", time: "60" },
  { name: "אילת", district: "אילת", time: "30" },
  { name: "ראש העין", district: "שרון", time: "90" },
  { name: "נס ציונה", district: "שפלה", time: "90" },
  { name: "עכו", district: "גליל עליון", time: "30" },
  { name: "אלעד", district: "שרון", time: "90" },
  { name: "רמת השרון", district: "שרון", time: "90" },
  { name: "כרמיאל", district: "גליל עליון", time: "30" },
  { name: "יבנה", district: "שפלה", time: "60" },
  { name: "טבריה", district: "גליל תחתון", time: "60" },
  { name: "טייבה", district: "שרון", time: "90" },
  { name: "קריית מוצקין", district: "חיפה", time: "60" },
  { name: "קריית ים", district: "חיפה", time: "60" },
  { name: "קריית ביאליק", district: "חיפה", time: "60" },
  { name: "קריית שמונה", district: "קו העימות", time: "0" },
  { name: "מעלה אדומים", district: "ירושלים", time: "90" },
  { name: "אור יהודה", district: "דן", time: "90" },
  { name: "צפת", district: "גליל עליון", time: "30" },
  { name: "נתיבות", district: "עוטף עזה", time: "30" },
  { name: "דימונה", district: "דרום הנגב", time: "60" },
  { name: "שדרות", district: "עוטף עזה", time: "15" },
];

const FALLBACK_CITIES_EN: CityInfo[] = FALLBACK_CITIES_HE.map(c => ({
  ...c,
  // Simple mapping for fallback, in reality we'd fetch translated names
  name: c.name 
}));

// In-memory cache for cities to avoid repeated 403s
const citiesCache: Record<string, CityInfo[]> = {
  he: FALLBACK_CITIES_HE,
  en: FALLBACK_CITIES_EN
};

// Alert History and Simulation
interface AlertLogEntry {
  id: string;
  title: string;
  data: string[];
  timestamp: string;
  isSimulated?: boolean;
}

let alertHistory: AlertLogEntry[] = [];
let simulatedAlert: AlertLogEntry | null = null;
let isSystemActive = true;
let lastPollStatus = "Never polled";
let lastPollTime = "";
let lastPollError = "";

function processCities(jsonData: any, lang: string | any): CityInfo[] {
  let cities: CityInfo[] = [];
  if (Array.isArray(jsonData)) {
    cities = jsonData.map(item => {
      let name = "";
      let district = "";
      let time = "";
      
      if (typeof item === 'string') {
        name = item;
      } else {
        name = item.v || item.n || item.value || item.label || "";
        district = item.d || item.district || "";
        time = item.t || item.time || "";
      }
      
      return {
        name: name.trim().normalize('NFC'),
        district: district.trim(),
        time: time.trim()
      };
    }).filter(c => c.name);
    
    // Sort by name
    cities.sort((a, b) => a.name.localeCompare(b.name, lang === 'he' ? 'he' : 'en'));
    
    // De-duplicate
    const seen = new Set();
    cities = cities.filter(c => {
      const key = `${c.name}-${c.district}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  return cities;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  console.log("Starting server...");

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      active: isSystemActive, 
      time: new Date().toISOString(),
      lastPoll: {
        status: lastPollStatus,
        time: lastPollTime,
        error: lastPollError
      }
    });
  });

  app.post("/api/system/status", (req, res) => {
    const { active } = req.body;
    if (typeof active === 'boolean') {
      isSystemActive = active;
      res.json({ status: "updated", active: isSystemActive });
    } else {
      res.status(400).json({ error: "Invalid status" });
    }
  });

  app.post("/api/notifications", (req, res) => {
    const { title, data, desc, warning } = req.body;
    if (!title || !data) {
      return res.status(400).json({ error: "Missing title or data" });
    }

    const newAlert: AlertLogEntry = {
      id: "ext-" + Date.now(),
      title,
      data: Array.isArray(data) ? data : [data],
      timestamp: new Date().toISOString()
    };

    alertHistory.unshift(newAlert);
    if (alertHistory.length > 100) alertHistory.pop();

    res.json({ status: "logged", id: newAlert.id });
  });

  // API Proxy for Home Front Command (Pikud HaOref)
  // The official API is CORS-restricted and requires specific headers
  app.get("/api/alerts", async (req, res) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      const response = await fetch("https://www.oref.org.il/WarningMessages/alert/alerts.json", {
        signal: controller.signal,
        headers: {
          "Host": "www.oref.org.il",
          "Referer": "https://www.oref.org.il/",
          "X-Requested-With": "XMLHttpRequest",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Accept": "*/*",
          "Accept-Language": "he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7",
          "Connection": "keep-alive",
          "Cache-Control": "no-cache",
          "Sec-Ch-Ua": '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
          "Sec-Ch-Ua-Mobile": "?0",
          "Sec-Ch-Ua-Platform": '"Windows"',
          "Sec-Fetch-Dest": "empty",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Site": "same-origin",
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          return res.json({ id: "0", title: "API Blocked", data: [], warning: "Access Denied (403)" });
        }
        throw new Error(`Oref API responded with ${response.status}`);
      }

      const buffer = await response.arrayBuffer();
      const decoder = new TextDecoder("utf-8");
      let data = decoder.decode(buffer);
      
      // Strip BOM if present
      if (data.charCodeAt(0) === 0xFEFF) {
        data = data.substring(1);
      }

      if (!data || data.trim() === "") {
        return res.json({ id: "0", title: "No Alerts", data: [] });
      }

      try {
        const jsonData = JSON.parse(data);
        
        // Log the alert if it's new
        if (jsonData.id !== "0") {
          const alreadyLogged = alertHistory.find(a => a.id === jsonData.id);
          if (!alreadyLogged) {
            alertHistory.unshift({
              ...jsonData,
              timestamp: new Date().toISOString()
            });
            if (alertHistory.length > 100) alertHistory.pop();
          }
        }

        // Inject simulated alert if active
        if (simulatedAlert) {
          // If there are real alerts, we merge them or prioritize simulation for testing
          if (jsonData.id === "0") {
            return res.json(simulatedAlert);
          }
        }

        res.json(jsonData);
      } catch (e) {
        res.status(500).json({ error: "Malformed JSON", raw: data.substring(0, 100) });
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error("Alerts API timeout");
        return res.json({ id: "0", title: "Timeout", data: [], warning: "Connection Timeout" });
      }
      console.error("Error fetching alerts:", error);
      res.status(500).json({ error: "Failed to fetch alerts" });
    } finally {
      clearTimeout(timeoutId);
    }
  });

  // Location API Proxy
  app.get("/api/location", async (req, res) => {
    const { lat, lng } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: "Missing lat/lng" });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const url = `https://www.oref.org.il/Shared/Ajax/GetCityByLocation.aspx?lat=${lat}&lng=${lng}&lang=he`;
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "Host": "www.oref.org.il",
          "Referer": "https://www.oref.org.il/",
          "X-Requested-With": "XMLHttpRequest",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Accept": "*/*",
          "Accept-Language": "he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7",
          "Connection": "keep-alive",
          "Cache-Control": "no-cache",
          "Sec-Ch-Ua": '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
          "Sec-Ch-Ua-Mobile": "?0",
          "Sec-Ch-Ua-Platform": '"Windows"',
          "Sec-Fetch-Dest": "empty",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Site": "same-origin",
        }
      });
      
      if (!response.ok) {
        if (response.status === 403) {
          return res.json({ city: "", warning: "Access Denied (403)" });
        }
        throw new Error(`Location API responded with ${response.status}`);
      }

      const city = await response.text();
      res.json({ city: city.trim() });
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return res.json({ city: "", warning: "Timeout" });
      }
      console.error("Error fetching location:", error);
      res.status(500).json({ error: "Failed to fetch location" });
    } finally {
      clearTimeout(timeoutId);
    }
  });

  // Cities List Proxy
  app.get("/api/cities", async (req, res) => {
    const lang = (req.query.lang as string) || "he";
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      // Pikud HaOref official cities list endpoint
      const url = `https://www.oref.org.il/Shared/Ajax/GetCities.aspx?lang=${lang}`;
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "Host": "www.oref.org.il",
          "Referer": `https://www.oref.org.il/${lang}/Alerts/AlertsHistory`,
          "X-Requested-With": "XMLHttpRequest",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Accept": "application/json, text/javascript, */*; q=0.01",
          "Accept-Language": "he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7",
          "Connection": "keep-alive",
          "Cache-Control": "no-cache",
          "Sec-Ch-Ua": '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
          "Sec-Ch-Ua-Mobile": "?0",
          "Sec-Ch-Ua-Platform": '"Windows"',
          "Sec-Fetch-Dest": "empty",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Site": "same-origin",
          "Pragma": "no-cache",
        }
      });

      if (!response.ok) {
        // If 403, try one more time with even simpler headers
        if (response.status === 403) {
          const retryResponse = await fetch(url, {
            signal: controller.signal,
            headers: {
              "Referer": "https://www.oref.org.il/",
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
              "X-Requested-With": "XMLHttpRequest",
            }
          });
          if (retryResponse.ok) {
            const buffer = await retryResponse.arrayBuffer();
            const decoder = new TextDecoder("utf-8");
            let data = decoder.decode(buffer);
            if (data.charCodeAt(0) === 0xFEFF) data = data.substring(1);
            if (data && data.trim() !== "" && data.trim() !== "[]") {
              try {
                const jsonData = JSON.parse(data);
                const processed = processCities(jsonData, lang);
                if (processed.length > 0) {
                  citiesCache[lang] = processed;
                  return res.json(processed);
                }
              } catch (e) {}
            }
          }
        }
        // Silent fallback - no console.warn to avoid cluttering logs with expected 403s
        return res.json(citiesCache[lang] || (lang === 'he' ? FALLBACK_CITIES_HE : FALLBACK_CITIES_EN));
      }

      const buffer = await response.arrayBuffer();
      const decoder = new TextDecoder("utf-8");
      let data = decoder.decode(buffer);
      
      if (data.charCodeAt(0) === 0xFEFF) data = data.substring(1);

      if (!data || data.trim() === "" || data.trim() === "[]") {
        return res.json(citiesCache[lang] || (lang === 'he' ? FALLBACK_CITIES_HE : FALLBACK_CITIES_EN));
      }

      try {
        const jsonData = JSON.parse(data);
        const cityNames = processCities(jsonData, lang);
        if (cityNames.length > 0) {
          citiesCache[lang] = cityNames;
        }
        res.json(cityNames.length > 0 ? cityNames : (citiesCache[lang] || (lang === 'he' ? FALLBACK_CITIES_HE : FALLBACK_CITIES_EN)));
      } catch (e) {
        res.json(citiesCache[lang] || (lang === 'he' ? FALLBACK_CITIES_HE : FALLBACK_CITIES_EN));
      }
    } catch (error: any) {
      res.json(citiesCache[lang] || (lang === 'he' ? FALLBACK_CITIES_HE : FALLBACK_CITIES_EN));
    } finally {
      clearTimeout(timeoutId);
    }
  });

  // Test Alert API
  app.get("/api/test-alert", (req, res) => {
    const testAlert = {
      id: "test-" + Date.now(),
      title: "התרעה לבדיקה",
      data: ["תל אביב - יפו", "ירושלים", "חיפה"],
      desc: "זוהי התרעת בדיקה בלבד",
      warning: "TEST ALERT"
    };
    res.json(testAlert);
  });

  // Simulation API
  app.post("/api/simulate", (req, res) => {
    const { title, data } = req.body;
    simulatedAlert = {
      id: "sim-" + Date.now(),
      title: title || "התרעה מדמה",
      data: data || ["אשדוד - ח, ט, י, יא, יב, טו, יז, מרינה, סיטי, רובע מיוחד", "חיפה - מערב"],
      timestamp: new Date().toISOString(),
      isSimulated: true
    };
    
    // Auto-clear simulation after 30 seconds
    setTimeout(() => {
      simulatedAlert = null;
    }, 30000);

    res.json({ status: "Simulation active for 30s", alert: simulatedAlert });
  });

  // History API
  app.get("/api/history", (req, res) => {
    res.json(alertHistory);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Background polling for alerts
  const pollOref = async () => {
    if (!isSystemActive) return;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      lastPollTime = new Date().toISOString();
      const response = await fetch("https://www.oref.org.il/WarningMessages/alert/alerts.json", {
        signal: controller.signal,
        headers: {
          "Host": "www.oref.org.il",
          "Referer": "https://www.oref.org.il/",
          "X-Requested-With": "XMLHttpRequest",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Accept": "*/*",
          "Accept-Language": "he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7",
          "Connection": "keep-alive",
          "Cache-Control": "no-cache",
          "Sec-Ch-Ua": '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
          "Sec-Ch-Ua-Mobile": "?0",
          "Sec-Ch-Ua-Platform": '"Windows"',
          "Sec-Fetch-Dest": "empty",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Site": "same-origin",
        },
      });

      if (response.ok) {
        lastPollStatus = "Success";
        lastPollError = "";
        const buffer = await response.arrayBuffer();
        const decoder = new TextDecoder("utf-8");
        let data = decoder.decode(buffer);
        if (data.charCodeAt(0) === 0xFEFF) data = data.substring(1);

        if (data && data.trim() !== "") {
          const jsonData = JSON.parse(data);
          if (jsonData.id && jsonData.id !== "0") {
            const alreadyLogged = alertHistory.find(a => a.id === jsonData.id);
            if (!alreadyLogged) {
              console.log(`New alert detected: ${jsonData.title} - ${jsonData.data.join(", ")}`);
              alertHistory.unshift({
                ...jsonData,
                timestamp: new Date().toISOString()
              });
              if (alertHistory.length > 100) alertHistory.pop();
            }
          }
        }
      } else {
        lastPollStatus = `Error ${response.status}`;
        lastPollError = response.statusText;
        if (response.status === 403) {
          console.error("Background Polling: 403 Forbidden. Server might be blocked.");
        }
      }
    } catch (error: any) {
      lastPollStatus = "Failed";
      lastPollError = error.message || String(error);
      console.error("Background Polling Error:", error.message);
    } finally {
      clearTimeout(timeoutId);
    }
  };

  // Start background polling every 2 seconds
  console.log("Background alert polling started (2s interval)");
  setInterval(pollOref, 2000);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
