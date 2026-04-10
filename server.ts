import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import nodeFetch from "node-fetch";
import { io } from "socket.io-client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use global fetch if available (Node 18+), otherwise use node-fetch
const fetch: any = (globalThis as any).fetch || nodeFetch;

interface CityInfo {
  name: string;
  district: string;
  time: string;
  lat?: number;
  lng?: number;
}

const FALLBACK_CITIES_HE: CityInfo[] = [
  { name: "תל אביב - יפו", district: "דן", time: "90", lat: 32.0853, lng: 34.7818 },
  { name: "ירושלים", district: "ירושלים", time: "90", lat: 31.7683, lng: 35.2137 },
  { name: "חיפה", district: "חיפה", time: "60", lat: 32.7940, lng: 34.9896 },
  { name: "ראשון לציון", district: "דן", time: "90", lat: 31.9730, lng: 34.7925 },
  { name: "פתח תקווה", district: "דן", time: "90", lat: 32.0840, lng: 34.8878 },
  { name: "אשדוד", district: "לכיש", time: "60", lat: 31.8044, lng: 34.6553 },
  { name: "נתניה", district: "שרון", time: "90", lat: 32.3215, lng: 34.8532 },
  { name: "באר שבע", district: "מרכז הנגב", time: "60", lat: 31.2518, lng: 34.7913 },
  { name: "אשקלון", district: "לכיש", time: "30", lat: 31.6688, lng: 34.5743 },
  { name: "אילת", district: "אילת", time: "30", lat: 29.5577, lng: 34.9519 },
  { name: "בני ברק", district: "דן", time: "90", lat: 32.0833, lng: 34.8333 },
  { name: "חולון", district: "דן", time: "90", lat: 32.0167, lng: 34.7667 },
  { name: "רמת גן", district: "דן", time: "90", lat: 32.0667, lng: 34.8167 },
  { name: "רחובות", district: "שפלה", time: "90", lat: 31.8947, lng: 34.8092 },
  { name: "בת ים", district: "דן", time: "90", lat: 32.0167, lng: 34.75 },
  { name: "בית שמש", district: "ירושלים", time: "90", lat: 31.7472, lng: 34.9881 },
  { name: "כפר סבא", district: "שרון", time: "90", lat: 32.175, lng: 34.9069 },
  { name: "הרצליה", district: "שרון", time: "90", lat: 32.1653, lng: 34.8458 },
  { name: "חדרה", district: "שרון", time: "90", lat: 32.435, lng: 34.9139 },
  { name: "מודיעין-מכבים-רעות", district: "שפלה", time: "90", lat: 31.8958, lng: 35.0103 },
  { name: "לוד", district: "שפלה", time: "90", lat: 31.9511, lng: 34.8936 },
  { name: "רמלה", district: "שפלה", time: "90", lat: 31.9275, lng: 34.8625 },
  { name: "רעננה", district: "שרון", time: "90", lat: 32.1833, lng: 34.8667 },
  { name: "מודיעין עילית", district: "שפלה", time: "90", lat: 31.9333, lng: 35.0333 },
  { name: "רהט", district: "מרכז הנגב", time: "60", lat: 31.3917, lng: 34.7542 },
  { name: "הוד השרון", district: "שרון", time: "90", lat: 32.15, lng: 34.8833 },
  { name: "גבעתיים", district: "דן", time: "90", lat: 32.0722, lng: 34.8125 },
  { name: "קריית אתא", district: "חיפה", time: "60", lat: 32.8, lng: 35.1 },
  { name: "נהריה", district: "קו העימות", time: "0", lat: 33.0033, lng: 35.0914 },
  { name: "ביתר עילית", district: "ירושלים", time: "90", lat: 31.7042, lng: 35.1167 },
  { name: "אום אל-פחם", district: "ואדי ערה", time: "90", lat: 32.5167, lng: 35.15 },
  { name: "קריית גת", district: "לכיש", time: "60", lat: 31.6083, lng: 34.7639 },
  { name: "ראש העין", district: "שרון", time: "90", lat: 32.0956, lng: 34.9567 },
  { name: "נס ציונה", district: "שפלה", time: "90", lat: 31.9289, lng: 34.7983 },
  { name: "עכו", district: "גליל עליון", time: "30", lat: 32.9278, lng: 35.0817 },
  { name: "אלעד", district: "שרון", time: "90", lat: 32.05, lng: 34.95 },
  { name: "רמת השרון", district: "שרון", time: "90", lat: 32.1389, lng: 34.8389 },
  { name: "כרמיאל", district: "גליל עליון", time: "30", lat: 32.9136, lng: 35.2961 },
  { name: "יבנה", district: "שפלה", time: "60", lat: 31.8778, lng: 34.7394 },
  { name: "טבריה", district: "גליל תחתון", time: "60", lat: 32.7944, lng: 35.5333 },
  { name: "טייבה", district: "שרון", time: "90", lat: 32.2667, lng: 35.0167 },
  { name: "קריית מוצקין", district: "חיפה", time: "60", lat: 32.8333, lng: 35.0667 },
  { name: "קריית ים", district: "חיפה", time: "60", lat: 32.8667, lng: 35.0667 },
  { name: "קריית ביאליק", district: "חיפה", time: "60", lat: 32.8333, lng: 35.0833 },
  { name: "קריית שמונה", district: "קו העימות", time: "0", lat: 33.2075, lng: 35.57 },
  { name: "מעלה אדומים", district: "ירושלים", time: "90", lat: 31.7775, lng: 35.3008 },
  { name: "אור יהודה", district: "דן", time: "90", lat: 32.0333, lng: 34.85 },
  { name: "צפת", district: "גליל עליון", time: "30", lat: 32.9658, lng: 35.4983 },
  { name: "נתיבות", district: "עוטף עזה", time: "30", lat: 31.4167, lng: 34.5833 },
  { name: "דימונה", district: "דרום הנגב", time: "60", lat: 31.0667, lng: 35.0333 },
  { name: "שדרות", district: "עוטף עזה", time: "15", lat: 31.525, lng: 34.5967 },
  { name: "אופקים", district: "עוטף עזה", time: "45", lat: 31.3167, lng: 34.6167 },
  { name: "שלומי", district: "קו העימות", time: "0", lat: 33.075, lng: 35.1417 },
  { name: "מעלות תרשיחא", district: "קו העימות", time: "0", lat: 33.0167, lng: 35.2667 },
  { name: "קריית מלאכי", district: "לכיש", time: "60", lat: 31.7333, lng: 34.75 },
  { name: "מגדל העמק", district: "עמקים", time: "60", lat: 32.675, lng: 35.2417 },
  { name: "נשר", district: "חיפה", time: "60", lat: 32.7667, lng: 35.0333 },
  { name: "טירת כרמל", district: "חיפה", time: "60", lat: 32.7667, lng: 34.9667 },
  { name: "ערד", district: "דרום הנגב", time: "60", lat: 31.2589, lng: 35.2131 },
  { name: "קריית ארבע", district: "יהודה", time: "90", lat: 31.5286, lng: 35.1111 },
  { name: "אריאל", district: "שומרון", time: "90", lat: 32.105, lng: 35.1742 },
  { name: "מעלה אפרים", district: "בקעת הירדן", time: "90", lat: 32.025, lng: 35.425 },
  { name: "קצרין", district: "גולן", time: "0", lat: 32.9917, lng: 35.6917 },
  { name: "מצפה רמון", district: "דרום הנגב", time: "60", lat: 30.6083, lng: 34.8028 },
  { name: "ירוחם", district: "מרכז הנגב", time: "60", lat: 31.0833, lng: 34.9167 },
  { name: "נתיב העשרה", district: "עוטף עזה", time: "0", lat: 31.575, lng: 34.4917 },
  { name: "זיקים", district: "עוטף עזה", time: "0", lat: 31.6083, lng: 34.5083 },
  { name: "כרמיה", district: "עוטף עזה", time: "0", lat: 31.6167, lng: 34.5167 },
  { name: "יד מרדכי", district: "עוטף עזה", time: "0", lat: 31.5833, lng: 34.5583 },
  { name: "ארז", district: "עוטף עזה", time: "0", lat: 31.5583, lng: 34.5667 },
  { name: "ניר עם", district: "עוטף עזה", time: "0", lat: 31.5167, lng: 34.5833 },
  { name: "מפלסים", district: "עוטף עזה", time: "0", lat: 31.4917, lng: 34.5667 },
  { name: "כפר עזה", district: "עוטף עזה", time: "0", lat: 31.45, lng: 34.5333 },
  { name: "נחל עוז", district: "עוטף עזה", time: "0", lat: 31.4667, lng: 34.5 },
  { name: "עלומים", district: "עוטף עזה", time: "0", lat: 31.45, lng: 34.5167 },
  { name: "בארי", district: "עוטף עזה", time: "0", lat: 31.4167, lng: 34.4917 },
  { name: "רעים", district: "עוטף עזה", time: "0", lat: 31.3833, lng: 34.4583 },
  { name: "כיסופים", district: "עוטף עזה", time: "0", lat: 31.3667, lng: 34.4 },
  { name: "עין השלושה", district: "עוטף עזה", time: "0", lat: 31.35, lng: 34.3917 },
  { name: "נירים", district: "עוטף עזה", time: "0", lat: 31.3333, lng: 34.4 },
  { name: "ניר עוז", district: "עוטף עזה", time: "0", lat: 31.3167, lng: 34.3917 },
  { name: "מגן", district: "עוטף עזה", time: "0", lat: 31.3, lng: 34.4333 },
  { name: "עין הבשור", district: "עוטף עזה", time: "0", lat: 31.2833, lng: 34.4667 },
  { name: "ניר יצחק", district: "עוטף עזה", time: "0", lat: 31.2333, lng: 34.3583 },
  { name: "סופה", district: "עוטף עזה", time: "0", lat: 31.2333, lng: 34.3333 },
  { name: "חולית", district: "עוטף עזה", time: "0", lat: 31.2167, lng: 34.3167 },
  { name: "כרם שלום", district: "עוטף עזה", time: "0", lat: 31.2167, lng: 34.2833 },
  { name: "פרי גן", district: "עוטף עזה", time: "0", lat: 31.2167, lng: 34.35 },
  { name: "תלמי יוסף", district: "עוטף עזה", time: "0", lat: 31.2167, lng: 34.3667 },
  { name: "יתד", district: "עוטף עזה", time: "0", lat: 31.2167, lng: 34.3833 },
  { name: "דקל", district: "עוטף עזה", time: "0", lat: 31.2, lng: 34.3833 },
  { name: "מבטחים", district: "עוטף עזה", time: "0", lat: 31.25, lng: 34.4167 },
  { name: "עמיעוז", district: "עוטף עזה", time: "0", lat: 31.25, lng: 34.4333 },
  { name: "ישע", district: "עוטף עזה", time: "0", lat: 31.25, lng: 34.45 },
  { name: "בני נצרים", district: "עוטף עזה", time: "0", lat: 31.15, lng: 34.3167 },
  { name: "נווה", district: "עוטף עזה", time: "0", lat: 31.1667, lng: 34.3333 },
  { name: "שלומית", district: "עוטף עזה", time: "0", lat: 31.1833, lng: 34.35 },
  { name: "אבשלום", district: "עוטף עזה", time: "0", lat: 31.2, lng: 34.3667 },
  { name: "מרכז צוחר", district: "עוטף עזה", time: "0", lat: 31.2333, lng: 34.4167 },
  { name: "אוהד", district: "עוטף עזה", time: "0", lat: 31.2333, lng: 34.4333 },
  { name: "שדה ניצן", district: "עוטף עזה", time: "0", lat: 31.25, lng: 34.4667 },
  { name: "תלמי אליהו", district: "עוטף עזה", time: "0", lat: 31.2333, lng: 34.4667 },
  { name: "גבולות", district: "עוטף עזה", time: "0", lat: 31.2, lng: 34.4667 },
  { name: "צאלים", district: "עוטף עזה", time: "0", lat: 31.2, lng: 34.5333 },
  { name: "אורים", district: "עוטף עזה", time: "0", lat: 31.3, lng: 34.5167 },
  { name: "רביבים", district: "מרכז הנגב", time: "60", lat: 31.05, lng: 34.7167 },
  { name: "משאבי שדה", district: "מרכז הנגב", time: "60", lat: 31.0, lng: 34.7833 },
  { name: "טללים", district: "מרכז הנגב", time: "60", lat: 30.95, lng: 34.7833 },
  { name: "שדה בוקר", district: "מרכז הנגב", time: "60", lat: 30.85, lng: 34.7833 },
  { name: "מדרשת בן גוריון", district: "מרכז הנגב", time: "60", lat: 30.85, lng: 34.7833 },
  { name: "עבדת", district: "מרכז הנגב", time: "60", lat: 30.8, lng: 34.7667 },
  { name: "מצפה רמון", district: "דרום הנגב", time: "60", lat: 30.6083, lng: 34.8028 },
  { name: "נאות סמדר", district: "דרום הנגב", time: "60", lat: 30.05, lng: 35.0333 },
  { name: "שיזפון", district: "דרום הנגב", time: "60", lat: 30.05, lng: 35.0333 },
  { name: "נווה חריף", district: "דרום הנגב", time: "60", lat: 30.0333, lng: 35.05 },
  { name: "קטורה", district: "דרום הנגב", time: "60", lat: 29.9667, lng: 35.0667 },
  { name: "גרופית", district: "דרום הנגב", time: "60", lat: 29.9333, lng: 35.0667 },
  { name: "יהל", district: "דרום הנגב", time: "60", lat: 30.0833, lng: 35.1333 },
  { name: "לוטן", district: "דרום הנגב", time: "60", lat: 29.9833, lng: 35.0833 },
  { name: "אליפז", district: "דרום הנגב", time: "60", lat: 29.8, lng: 34.9833 },
  { name: "באר אורה", district: "אילת", time: "30", lat: 29.7167, lng: 35.0167 },
  { name: "אילת", district: "אילת", time: "30", lat: 29.5577, lng: 34.9519 },
  { name: "עוטף עזה", district: "עוטף עזה", time: "0", lat: 31.4, lng: 34.5 },
  { name: "גליל עליון", district: "גליל עליון", time: "30", lat: 33.0, lng: 35.5 },
  { name: "גליל תחתון", district: "גליל תחתון", time: "60", lat: 32.8, lng: 35.4 },
  { name: "מרכז הנגב", district: "מרכז הנגב", time: "60", lat: 31.1, lng: 34.8 },
  { name: "דרום הנגב", district: "דרום הנגב", time: "60", lat: 30.5, lng: 35.0 },
  { name: "ערבה", district: "ערבה", time: "60", lat: 30.7, lng: 35.2 },
  { name: "בקעת הירדן", district: "בקעת הירדן", time: "90", lat: 32.1, lng: 35.5 },
  { name: "יהודה", district: "יהודה", time: "90", lat: 31.6, lng: 35.1 },
  { name: "שומרון", district: "שומרון", time: "90", lat: 32.2, lng: 35.2 },
  { name: "דן", district: "דן", time: "90", lat: 32.05, lng: 34.8 },
  { name: "עמק הירדן", district: "גליל תחתון", time: "60", lat: 32.7, lng: 35.6 },
  { name: "עמק המעיינות", district: "עמקים", time: "60", lat: 32.5, lng: 35.5 },
  { name: "עמק יזרעאל", district: "עמקים", time: "60", lat: 32.6, lng: 35.2 },
  { name: "מנשה", district: "ואדי ערה", time: "90", lat: 32.5, lng: 35.0 },
  { name: "חוף הכרמל", district: "חיפה", time: "60", lat: 32.7, lng: 34.9 },
  { name: "זבולון", district: "חיפה", time: "60", lat: 32.8, lng: 35.1 },
  { name: "מטה אשר", district: "קו העימות", time: "0", lat: 33.0, lng: 35.1 },
  { name: "מעלה יוסף", district: "קו העימות", time: "0", lat: 33.0, lng: 35.3 },
  { name: "מרום הגליל", district: "גליל עליון", time: "30", lat: 32.9, lng: 35.4 },
  { name: "הגליל העליון", district: "גליל עליון", time: "30", lat: 33.1, lng: 35.6 },
  { name: "מבואות החרמון", district: "קו העימות", time: "0", lat: 33.2, lng: 35.6 },
];

const FALLBACK_CITIES_EN: CityInfo[] = FALLBACK_CITIES_HE.map(c => ({
  ...c,
  // Simple mapping for fallback, in reality we'd fetch translated names
  name: c.name 
}));

// In-memory cache for cities to avoid repeated 403s
const citiesCache: Record<string, CityInfo[]> = {
  he: processCities(FALLBACK_CITIES_HE, 'he'),
  en: processCities(FALLBACK_CITIES_EN, 'en')
};

// Alert History and Simulation
interface AlertLogEntry {
  id: string;
  title: string;
  data: string[];
  timestamp: string;
  isSimulated?: boolean;
  lat?: number;
  lng?: number;
}

let alertHistory: AlertLogEntry[] = [];
let simulatedAlert: AlertLogEntry | null = null;
let isSystemActive = true;
let lastPollStatus = "Never polled";
let lastPollTime = "";
let lastPollError = "";
let orefCookie = "";
let socketStatus = "Disconnected";
let redAlertMeStatus = "Never polled";

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
        // Oref format: { v: "City", l: "Label", i: "ID" } or { n: "Name", d: "District", t: "Time" }
        name = item.v || item.n || item.name || item.value || item.label || item.text || "";
        district = item.d || item.district || item.area || "";
        time = item.t || item.time || item.countdown || "";
        const lat = parseFloat(item.lat || item.latitude || item.y);
        const lng = parseFloat(item.lng || item.longitude || item.x || item.altitude);
        
        return {
          name: name.trim().normalize('NFC'),
          district: district.trim(),
          time: time.trim(),
          lat: isNaN(lat) ? undefined : lat,
          lng: isNaN(lng) ? undefined : lng
        };
      }
      
      return {
        name: name.trim().normalize('NFC'),
        district: district.trim(),
        time: time.trim()
      };
    }).filter(c => c.name);
    
    // De-duplicate by name and district (matching the frontend key)
    const seen = new Set();
    cities = cities.filter(c => {
      const key = `${c.name}-${c.district}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort by name
    cities.sort((a, b) => a.name.localeCompare(b.name, lang === 'he' ? 'he' : 'en'));
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
      socketStatus,
      redAlertMeStatus,
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

    console.log(`Received notification from Android: ${title} - ${newAlert.data.join(", ")}`);
    alertHistory.unshift(newAlert);
    if (alertHistory.length > 100) alertHistory.pop();

    res.json({ status: "logged", id: newAlert.id });
  });

  // API Proxy for Home Front Command (Pikud HaOref)
  // The official API is CORS-restricted and requires specific headers
  app.get("/api/alerts", async (req, res) => {
    // Check history first for very recent alerts (within last 30 seconds)
    const now = new Date();
    const recentAlert = alertHistory.find(a => (now.getTime() - new Date(a.timestamp).getTime()) < 30000);
    
    if (recentAlert) {
      return res.json({
        id: recentAlert.id,
        title: recentAlert.title,
        data: recentAlert.data,
        timestamp: recentAlert.timestamp,
        warning: "From Real-time Cache"
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      const headers: any = {
        "Host": "www.oref.org.il",
        "Referer": "https://www.oref.org.il/",
        "X-Requested-With": "XMLHttpRequest",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
        "Accept": "*/*",
        "Accept-Language": "he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7",
        "Connection": "keep-alive",
        "Cache-Control": "no-cache",
      };

      if (orefCookie) {
        headers["Cookie"] = orefCookie;
      }

      const response = await nodeFetch("https://www.oref.org.il/WarningMessages/alert/alerts.json", {
        signal: controller.signal,
        headers
      });

      if (!response.ok) {
        // If Oref fails, return the latest alert from history if it's still relatively fresh (2 mins)
        const freshAlert = alertHistory.find(a => (now.getTime() - new Date(a.timestamp).getTime()) < 120000);
        if (freshAlert) {
          return res.json({
            id: freshAlert.id,
            title: freshAlert.title,
            data: freshAlert.data,
            warning: "Fallback to History"
          });
        }

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
      const headers: any = {
        "Host": "www.oref.org.il",
        "Referer": "https://www.oref.org.il/",
        "X-Requested-With": "XMLHttpRequest",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
        "Accept": "*/*",
        "Accept-Language": "he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7",
        "Connection": "keep-alive",
        "Cache-Control": "no-cache",
      };

      if (orefCookie) {
        headers["Cookie"] = orefCookie;
      }

      const response = await nodeFetch(url, {
        signal: controller.signal,
        headers
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
      const headers: any = {
        "Host": "www.oref.org.il",
        "Referer": `https://www.oref.org.il/${lang}/Alerts/AlertsHistory`,
        "X-Requested-With": "XMLHttpRequest",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7",
        "Connection": "keep-alive",
        "Cache-Control": "no-cache",
      };

      if (orefCookie) {
        headers["Cookie"] = orefCookie;
      }

      const response = await nodeFetch(url, {
        signal: controller.signal,
        headers
      });

      if (!response.ok) {
        // If 403, try one more time with even simpler headers
        if (response.status === 403) {
          const retryResponse = await nodeFetch(url, {
            signal: controller.signal,
            headers: {
              "Referer": "https://www.oref.org.il/",
              "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
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

  app.delete("/api/history", (req, res) => {
    alertHistory = [];
    res.json({ status: "cleared" });
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
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      lastPollTime = new Date().toISOString();
      
      // 1. Try to refresh cookie if missing
      if (!orefCookie) {
        try {
          const homeRes = await fetch("https://www.oref.org.il/", {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
            }
          });
          const cookies = homeRes.headers.get("set-cookie");
          if (cookies) {
            orefCookie = cookies.split(";")[0];
            console.log("Obtained new Oref cookie");
          }
        } catch (e) {}
      }

      const headers: any = {
        "Host": "www.oref.org.il",
        "Referer": "https://www.oref.org.il/",
        "X-Requested-With": "XMLHttpRequest",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7",
        "Connection": "keep-alive",
        "Cache-Control": "no-cache",
      };

      if (orefCookie) {
        headers["Cookie"] = orefCookie;
      }

      const response = await nodeFetch("https://www.oref.org.il/WarningMessages/alert/alerts.json", {
        signal: controller.signal,
        headers
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
              
              // Try to find coordinates for the first city
              let lat, lng;
              if (jsonData.data && jsonData.data.length > 0) {
                const city = citiesCache['he']?.find(c => jsonData.data[0].includes(c.name));
                if (city) {
                  lat = city.lat;
                  lng = city.lng;
                }
              }

              alertHistory.unshift({
                ...jsonData,
                timestamp: new Date().toISOString(),
                lat,
                lng
              });
              if (alertHistory.length > 100) alertHistory.pop();
            }
          }
        }
      } else {
        lastPollStatus = `Error ${response.status}`;
        lastPollError = response.statusText;
        
        // If 403, clear cookie and try history fallback
        if (response.status === 403) {
          orefCookie = "";
          console.error("Background Polling: 403 Forbidden. Trying history fallback...");
          
          try {
            const historyRes = await nodeFetch("https://www.oref.org.il/WarningMessages/History/AlertsHistory.json", {
              signal: controller.signal,
              headers
            });
            if (historyRes.ok) {
              const historyData: any = await historyRes.json();
              if (Array.isArray(historyData) && historyData.length > 0) {
                lastPollStatus = "Success (History Fallback)";
                // Process the most recent alert from history
                const latest = historyData[0];
                const alreadyLogged = alertHistory.find(a => a.id === latest.id || (a.title === latest.title && a.data[0] === latest.data));
                if (!alreadyLogged) {
                  console.log(`New alert detected from history: ${latest.title}`);
                  alertHistory.unshift({
                    id: latest.id || "hist-" + Date.now(),
                    title: latest.title,
                    data: [latest.data],
                    timestamp: new Date().toISOString()
                  });
                  if (alertHistory.length > 100) alertHistory.pop();
                }
                return;
              }
            }
          } catch (e) {}
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

  // Background polling for redalert.me (Very reliable fallback)
  const pollRedAlertMe = async () => {
    if (!isSystemActive) return;
    try {
      const response = await nodeFetch("https://api.redalert.me/alerts", {
        headers: {
          "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1"
        }
      });
      if (response.ok) {
        redAlertMeStatus = "Success";
        const data: any = await response.json();
        if (Array.isArray(data)) {
          data.forEach((alert: any) => {
            const alertTime = new Date(alert.date * 1000);
            const now = new Date();
            
            if (now.getTime() - alertTime.getTime() < 120000) {
              const alreadyLogged = alertHistory.find(a => 
                (a.id === String(alert.id)) || 
                (a.title === alert.threat && a.data.includes(alert.area))
              );

              if (!alreadyLogged) {
                // Map threat types to Hebrew titles
                let title = alert.threat;
                if (title === "missiles") title = "ירי רקטות וטילים";
                else if (title === "hostileAircraftIntrusion") title = "חדירת כלי טיס עוין";
                else if (title === "radiologicalEvent") title = "אירוע רדיולוגי";
                else if (title === "earthquake") title = "רעידת אדמה";
                else if (title === "tsunami") title = "צונאמי";
                else if (title === "nonConventionalMissiles") title = "ירי טילים בלתי קונבנציונליים";
                else if (title === "terroristInfiltration") title = "חדירת מחבלים";
                else if (title === "hazardousMaterials") title = "אירוע חומרים מסוכנים";

                console.log(`[Alert] New alert from redalert.me: ${alert.area} - ${title}`);
                
                // Try to find coordinates
                let lat, lng;
                const city = citiesCache['he']?.find(c => alert.area.includes(c.name));
                if (city) {
                  lat = city.lat;
                  lng = city.lng;
                }

                alertHistory.unshift({
                  id: String(alert.id),
                  title: title,
                  data: [alert.area],
                  timestamp: alertTime.toISOString(),
                  lat,
                  lng
                });
                if (alertHistory.length > 100) alertHistory.pop();
              }
            }
          });
        }
      } else {
        redAlertMeStatus = `Error ${response.status}`;
        console.error(`[RedAlert.me] API Error: ${response.status}`);
      }
    } catch (error: any) {
      redAlertMeStatus = `Failed: ${error.message}`;
      console.error(`[RedAlert.me] Fetch Failed: ${error.message}`);
    }
  };

  // Start background polling
  console.log("Background alert polling started");
  setInterval(pollOref, 10000); // Oref fallback (10s)
  setInterval(pollRedAlertMe, 5000); // RedAlert.me (5s)

  // Socket.io connection to RedAlert service
  const REDALERT_URL = "https://redalert.orielhaim.com";
  const socket = io(REDALERT_URL, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
    transports: ['websocket'], // Force websocket to avoid some proxy issues
    auth: {
      apiKey: "public"
    }
  });

  socket.on("connect", () => {
    socketStatus = "Connected";
    console.log("[Socket] Connected to RedAlert service");
  });

  socket.on("disconnect", (reason) => {
    socketStatus = `Disconnected: ${reason}`;
    console.log(`[Socket] Disconnected: ${reason}`);
  });

  socket.on("connect_error", (error) => {
    socketStatus = `Error: ${error.message}`;
    console.error("[Socket] Connection error:", error.message);
  });

  socket.on("alert", (alerts: any[]) => {
    if (!isSystemActive) return;
    
    console.log(`[Socket] Received ${alerts.length} alert(s)`);
    alerts.forEach((alert) => {
      const alreadyLogged = alertHistory.find(a => 
        (a.id === alert.id) || 
        (a.title === alert.title && JSON.stringify(a.data) === JSON.stringify(alert.cities))
      );
      
      if (!alreadyLogged) {
        const newAlert: AlertLogEntry = {
          id: alert.id || "soc-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
          title: alert.title,
          data: alert.cities || [],
          timestamp: new Date().toISOString()
        };
        
        console.log(`[Socket] Logging new alert: ${newAlert.title}`);
        alertHistory.unshift(newAlert);
        if (alertHistory.length > 100) alertHistory.pop();
      }
    });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
