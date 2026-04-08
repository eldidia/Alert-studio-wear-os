import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import nodeFetch from "node-fetch";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use global fetch if available (Node 18+), otherwise use node-fetch
const fetch: any = (globalThis as any).fetch || nodeFetch;

const FALLBACK_CITIES_HE = [
  "תל אביב - יפו", "ירושלים", "חיפה", "ראשון לציון", "פתח תקווה", "אשדוד", "נתניה", "באר שבע", 
  "בני ברק", "חולון", "רמת גן", "רחובות", "אשקלון", "בת ים", "בית שמש", "כפר סבא", "הרצליה", 
  "חדרה", "מודיעין-מכבים-רעות", "לוד", "רמלה", "רעננה", "מודיעין עילית", "רהט", "הוד השרון", 
  "גבעתיים", "קריית אתא", "נהריה", "ביתר עילית", "אום אל-פחם", "קריית גת", "אילת", "ראש העין",
  "נס ציונה", "עכו", "אלעד", "רמת השרון", "כרמיאל", "יבנה", "טבריה", "טייבה", "קריית מוצקין",
  "קריית ים", "קריית ביאליק", "קריית שמונה", "מעלה אדומים", "אור יהודה", "צפת", "נתיבות",
  "דימונה", "טמרה", "סח'נין", "יהוד-מונוסון", "באקה אל-גרבייה", "אופקים", "גבעת שמואל",
  "טירה", "ערד", "מגדל העמק", "קריית מלאכי", "שפרעם", "נשר", "קריית אונו", "מעלות-תרשיחא",
  "טירת כרמל", "שדרות", "בית שאן", "כפר קאסם", "קלנסווה", "נצרת", "עפולה", "מגדל", "קצרין",
  "קריית ארבע", "אריאל", "מעלה אפרים", "שלומי", "חצור הגלילית", "ראש פינה",
  "מטולה", "יסוד המעלה", "קריית טבעון", "רמת ישי", "זכרון יעקב", "בנימינה-גבעת עדה", "פרדס חנה-כרכור",
  "ג'סר א-זרקא", "פוריידיס", "אור עקיבא", "קיסריה", "חריש", "ג'ת", "זמר",
  "כפר קרע", "ערערה", "מעלה עירון", "פרדסיה", "כפר יונה",
  "קדימה-צורן", "תל מונד", "אבן יהודה", "כפר שמריהו", "כוכב יאיר-צור יגאל", "אלפי מנשה", "קרני שומרון", 
  "קדומים", "עמנואל", "אורנית", "אלקנה", "שוהם", "בית דגן", "אזור", "גני תקווה",
  "סביון", "בני עייש", "גן יבנה", "מזכרת בתיה", "קריית עקרון",
  "גדרה", "באר יעקב", "ירוחם", "מצפה רמון", "חבל אילות", "ערבה תיכונה", "תמר", "רמת נגב", "אשכול", 
  "שער הנגב", "שדות נגב", "חוף אשקלון", "לכיש", "יואב", "שפיר", "באר טוביה", "חבל יבנה", "נחל שורק", "ברנר",
  "גדרות", "עמק לוד", "גזר", "מטה יהודה", "מטה בנימין", "שומרון", "בקעת הירדן", "גוש עציון",
  "הר חברון", "מגילות ים המלח", "ערבות הירדן", "עמק המעיינות", "גלבוע", "עמק יזרעאל",
  "מגידו", "אלונה", "מנשה", "חוף הכרמל", "זבולון", "עמק חפר", "דרום השרון", "לב השרון",
  "חבל מודיעין", "מרחבים", "בני שמעון", "אל קסום", "נווה מדבר", "מבשרת ציון", "קריית יערים", "אבו גוש",
  "צור הדסה", "כוכב יעקב", "פסגות", "בית אל", "עפרה", "שילה", "עלי", "טלמון", "דולב", "נילי", "נעלה",
  "חשמונאים", "כפר האורנים", "לפיד", "שילת", "מכבים", "רעות", "נוף איילון", "שעלבים", "יסודות", "יד בנימין",
  "חפץ חיים", "גני טל", "קטיף", "כרמי צור", "נוקדים", "תקוע", "אלעזר", "ראש צורים", "כפר עציון", "מגדל עוז",
  "אפרת", "ביתר עילית", "צור יצחק", "צור נתן", "סלעית", "צור משה", "פרדסיה", "בת חפר", "יד חנה", "ניצני עוז"
];

const FALLBACK_CITIES_EN = [
  "Tel Aviv - Yafo", "Jerusalem", "Haifa", "Rishon LeZion", "Petah Tikva", "Ashdod", "Netanya", "Beersheba",
  "Bnei Brak", "Holon", "Ramat Gan", "Rehovot", "Ashkelon", "Bat Yam", "Beit Shemesh", "Kfar Saba", "Herzliya",
  "Hadera", "Modiin", "Lod", "Ramla", "Ra'anana", "Modiin Illit", "Rahat", "Hod HaSharon",
  "Givatayim", "Kiryat Ata", "Nahariya", "Beitar Illit", "Umm al-Fahm", "Kiryat Gat", "Eilat", "Rosh Haayin",
  "Nes Ziona", "Acre", "El'ad", "Ramat HaSharon", "Karmiel", "Yavne", "Tiberias", "Tayibe", "Kiryat Motzkin",
  "Kiryat Yam", "Kiryat Bialik", "Kiryat Shmona", "Ma'ale Adumim", "Or Yehuda", "Safed", "Netivot",
  "Dimona", "Tamra", "Sakhnin", "Yehud-Monosson", "Baqa al-Gharbiyye", "Ofakim", "Givat Shmuel",
  "Tira", "Arad", "Migdal HaEmek", "Kiryat Malakhi", "Shefa-'Amr", "Nesher", "Kiryat Ono", "Ma'alot-Tarshiha",
  "Tirat Carmel", "Sderot", "Beit She'an", "Kafr Qasim", "Qalansawe", "Nazareth", "Afula", "Katzrin", "Ariel",
  "Ma'ale Efrayim", "Mitzpe Ramon", "Yeruham", "Netivot", "Sderot", "Ofakim", "Beit She'an", "Kiryat Shmona"
];

// In-memory cache for cities to avoid repeated 403s
const citiesCache: Record<string, string[]> = {
  he: FALLBACK_CITIES_HE,
  en: FALLBACK_CITIES_EN
};

function processCities(jsonData: any, lang: string | any): string[] {
  let cityNames: string[] = [];
  if (Array.isArray(jsonData)) {
    cityNames = jsonData.map(item => {
      let name = "";
      if (typeof item === 'string') name = item;
      else name = item.v || item.n || item.value || item.label || "";
      return name.trim().normalize('NFC');
    }).filter(Boolean);
    cityNames = Array.from(new Set(cityNames)).sort((a, b) => a.localeCompare(b, lang === 'he' ? 'he' : 'en'));
  }
  return cityNames;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  console.log("Starting server...");

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString(), nodeVersion: process.version });
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
      id: Date.now().toString(),
      title: "התרעה לבדיקה",
      data: ["תל אביב - יפו", "ירושלים", "חיפה"],
      desc: "זוהי התרעת בדיקה בלבד",
      warning: "TEST ALERT"
    };
    res.json(testAlert);
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
