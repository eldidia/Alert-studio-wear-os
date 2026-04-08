import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, BellOff, ShieldAlert, Settings, MapPin, Clock, Info, AlertTriangle, Globe, ChevronDown, ChevronUp, Search, Activity, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Alert {
  id: string;
  title: string;
  data: string[];
  desc?: string;
  warning?: string;
}

type Language = 'he' | 'en' | 'ar' | 'ru';

const translations = {
  he: {
    monitoring: 'ניטור פעיל',
    paused: 'מושהה',
    alertActive: 'התרעה פעילה',
    everythingClear: 'הכל שקט',
    settings: 'הגדרות',
    notifications: 'התראות',
    filterByCity: 'סינון לפי עיר',
    detecting: 'מזהה...',
    about: 'אודות',
    done: 'סיום',
    selectCity: 'בחר עיר',
    language: 'שפה',
    version: 'גרסה 1.2. ניטור בזמן אמת של פיקוד העורף.',
    noAlerts: 'אין התרעות',
    connectionError: 'שגיאת חיבור',
    accessDenied: 'גישה נדחתה (403)',
    allCities: 'כל הארץ',
    testAlert: 'התרעת בדיקה',
    testNotification: 'בדיקת התראה',
    iframeWarning: 'התראות עשויות להיחסם בתצוגה המקדימה. מומלץ לפתוח בדף חדש.',
    vibration: 'רטט',
    alertTypes: 'סוגי התרעות',
    profiles: 'פרופילי התרעה',
    addProfile: 'הוסף פרופיל',
    profileName: 'שם הפרופיל',
    allTypes: 'כל הסוגים',
    rockets: 'ירי רקטות וטילים',
    aircraft: 'חדירת כלי טיס עוין',
    terrorist: 'חדירת מחבלים',
    earthquake: 'רעידת אדמה',
    tsunami: 'צונאמי',
    hazmat: 'חומרים מסוכנים',
    radiological: 'אירוע רדיולוגי',
    alertLog: 'יומן התרעות',
    simulation: 'סימולציה',
    simulateAlert: 'שלח התרעה מדמה',
    noHistory: 'אין היסטוריית התרעות',
    simulated: 'מדמה',
  },
  en: {
    monitoring: 'Monitoring Active',
    paused: 'Paused',
    alertActive: 'Alert Active',
    everythingClear: 'Everything Clear',
    settings: 'Settings',
    notifications: 'Notifications',
    filterByCity: 'Filter by My City',
    detecting: 'Detecting...',
    about: 'About',
    done: 'Done',
    selectCity: 'Select City',
    language: 'Language',
    version: 'v1.2. Real-time Home Front Command alerts.',
    noAlerts: 'No Alerts',
    connectionError: 'Connection Error',
    accessDenied: 'Access Denied (403)',
    allCities: 'All Areas',
    testAlert: 'Test Alert',
    testNotification: 'Test Notification',
    iframeWarning: 'Notifications may be blocked in preview. Open in a new tab.',
    vibration: 'Vibration',
    alertTypes: 'Alert Types',
    profiles: 'Alert Profiles',
    addProfile: 'Add Profile',
    profileName: 'Profile Name',
    allTypes: 'All Types',
    rockets: 'Rockets & Missiles',
    aircraft: 'Hostile Aircraft',
    terrorist: 'Terrorist Infiltration',
    earthquake: 'Earthquake',
    tsunami: 'Tsunami',
    hazmat: 'Hazardous Materials',
    radiological: 'Radiological Event',
    alertLog: 'Alert Log',
    simulation: 'Simulation',
    simulateAlert: 'Send Simulated Alert',
    noHistory: 'No Alert History',
    simulated: 'Simulated',
  },
  ar: {
    monitoring: 'المراقبة نشطة',
    paused: 'متوقف مؤقتا',
    alertActive: 'تنبيه نشط',
    everythingClear: 'كل شيء هادئ',
    settings: 'إعدادات',
    notifications: 'إشعارات',
    filterByCity: 'تصفية حسب مدينتي',
    detecting: 'جاري الكشف...',
    about: 'حول',
    done: 'تم',
    selectCity: 'اختر مدينة',
    language: 'لغة',
    version: 'الإصدار 1.2. تنبيهات الجبهة الداخلية في الوقت الحقيقي.',
    noAlerts: 'لا توجد تنبيهات',
    connectionError: 'خطأ في الاتصال',
    accessDenied: 'تم رفض الوصول (403)',
    allCities: 'جميع المناطق',
    testAlert: 'تنبيه تجريبي',
    testNotification: 'إشعار تجريبي',
    iframeWarning: 'قد يتم حظر الإشعارات في المعاينة. افتح في علامة تبويب جديدة.',
    vibration: 'اهتزاز',
    alertTypes: 'أنواع التنبيهات',
    profiles: 'ملفات التنبيه',
    addProfile: 'إضافة ملف',
    profileName: 'اسم الملف',
    allTypes: 'جميع الأنواع',
    rockets: 'إطلاق صواريخ وقذائف',
    aircraft: 'تسلל طائرة معادية',
    terrorist: 'تسلל مسلحين',
    earthquake: 'زلزال',
    tsunami: 'تسونامي',
    hazmat: 'مواد خطرة',
    radiological: 'حدث إشعاعي',
    alertLog: 'سجل التنبيهات',
    simulation: 'محاكاة',
    simulateAlert: 'إرسال تنبيه محاكى',
    noHistory: 'لا يوجد سجل تنبيهات',
    simulated: 'محاكى',
  },
  ru: {
    monitoring: 'Мониторинг активен',
    paused: 'Приостановлено',
    alertActive: 'Активная тревога',
    everythingClear: 'Все спокойно',
    settings: 'Настройки',
    notifications: 'Уведомления',
    filterByCity: 'Фильтр по городу',
    detecting: 'Определение...',
    about: 'О приложении',
    done: 'Готово',
    selectCity: 'Выбрать город',
    language: 'Язык',
    version: 'v1.2. Оповещения Службы тыла в реальном времени.',
    noAlerts: 'Нет оповещений',
    connectionError: 'Ошибка подключения',
    accessDenied: 'Доступ запрещен (403)',
    allCities: 'Все районы',
    testAlert: 'Тестовая тревога',
    testNotification: 'Тестовое уведомление',
    iframeWarning: 'Уведомления могут быть заблокированы в предпросмотре. Откройте в новой вкладке.',
    vibration: 'Вибрация',
    alertTypes: 'Типы оповещений',
    profiles: 'Профили оповещений',
    addProfile: 'Добавить профиль',
    profileName: 'Имя профиля',
    allTypes: 'Все типы',
    rockets: 'Ракетный обстрел',
    aircraft: 'Вражеский БПЛА',
    terrorist: 'Проникновение террористов',
    earthquake: 'Землетрясение',
    tsunami: 'Цунами',
    hazmat: 'Опасные вещества',
    radiological: 'Радиационная угроза',
    alertLog: 'Журнал оповещений',
    simulation: 'Симуляция',
    simulateAlert: 'Отправить симуляцию',
    noHistory: 'История пуста',
    simulated: 'Симуляция',
  }
};

interface CityInfo {
  name: string;
  district: string;
  time: string;
}

const FALLBACK_CITIES: CityInfo[] = [
  { name: "תל אביב - יפו", district: "דן", time: "90" },
  { name: "ירושלים", district: "ירושלים", time: "90" },
  { name: "חיפה", district: "חיפה", time: "60" },
  { name: "אשדוד", district: "לכיש", time: "60" },
  { name: "באר שבע", district: "מרכז הנגב", time: "60" },
];

interface AlertProfile {
  id: string;
  name: string;
  city: string | null;
  types: string[]; // Empty means all
  enabled: boolean;
}

const ALERT_TYPES = [
  { id: 'rockets', he: 'ירי רקטות וטילים', en: 'Rockets & Missiles' },
  { id: 'aircraft', he: 'חדירת כלי טיס עוין', en: 'Hostile Aircraft' },
  { id: 'terrorist', he: 'חדירת מחבלים', en: 'Terrorist Infiltration' },
  { id: 'earthquake', he: 'רעידת אדמה', en: 'Earthquake' },
  { id: 'tsunami', he: 'צונאמי', en: 'Tsunami' },
  { id: 'hazmat', he: 'חומרים מסוכנים', en: 'Hazardous Materials' },
  { id: 'radiological', he: 'אירוע רדיולוגי', en: 'Radiological Event' },
];

export default function App() {
  const [alerts, setAlerts] = useState<Alert | null>(null);
  const [lastAlertId, setLastAlertId] = useState<string>("0");
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiWarning, setApiWarning] = useState<string | null>(null);
  const [userCity, setUserCity] = useState<string | null>(null);
  const [filterToCity, setFilterToCity] = useState(false);
  const [filterByTypes, setFilterByTypes] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('watchAlertLang');
    if (saved && ['he', 'en', 'ar', 'ru'].includes(saved)) return saved as Language;
    return 'he';
  });
  const [cities, setCities] = useState<CityInfo[]>(FALLBACK_CITIES);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [showCitySelector, setShowCitySelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profiles, setProfiles] = useState<AlertProfile[]>([]);
  const [showProfileEditor, setShowProfileEditor] = useState<string | null>(null); // profile id or 'new'
  const [editingProfile, setEditingProfile] = useState<AlertProfile | null>(null);
  const [showLog, setShowLog] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  const t: any = (translations as any)[lang];

  useEffect(() => {
    localStorage.setItem('watchAlertLang', lang);
  }, [lang]);

  // Sync with Android Native App
  useEffect(() => {
    if ((window as any).AndroidApp && (window as any).AndroidApp.updateConfig) {
      const config = {
        isMonitoring,
        profiles,
        userCity,
        filterToCity,
        filterByTypes,
        selectedTypes,
        lang
      };
      (window as any).AndroidApp.updateConfig(JSON.stringify(config));
    }
  }, [userCity, filterToCity, isMonitoring, profiles, lang, selectedTypes, filterByTypes]);

  // Get user location and cities list
  useEffect(() => {
    const init = async () => {
      // Fetch cities list for current language
      setIsLoadingCities(true);
      try {
        const res = await fetch(`/api/cities?lang=${lang}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setCities(data);
          }
        }
      } catch (e) {
        console.error("Cities fetch error:", e);
      } finally {
        setIsLoadingCities(false);
      }
    };
    init();
  }, [lang]); // Re-fetch when language changes

  useEffect(() => {
    const detectLocation = async () => {
      // Geolocation
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(`/api/location?lat=${latitude}&lng=${longitude}`);
            const data = await res.json();
            if (data.city) setUserCity(data.city);
            if (data.warning) setApiWarning(data.warning);
          } catch (e) {
            console.error("Location fetch error:", e);
          }
        }, (err) => {
          console.warn("Geolocation denied or failed", err);
        });
      }
    };
    detectLocation();
  }, []);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Request notification permissions
  const requestPermissions = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
      if (permission === 'granted') {
        new Notification(t.monitoring, { body: t.version, icon: "/favicon.ico" });
        triggerVibration();
      }
    }
  };

  const triggerVibration = useCallback(() => {
    if (vibrationEnabled && 'vibrate' in navigator) {
      // SOS pattern: 3 short, 3 long, 3 short
      navigator.vibrate([200, 100, 200, 100, 200, 300, 400, 100, 400, 100, 400, 300, 200, 100, 200, 100, 200]);
    }
  }, [vibrationEnabled]);

  const normalizeCity = (name: string) => {
    if (!name) return "";
    return name
      .trim()
      .normalize('NFC')
      .replace(/[\u05F3\u05F4'"]/g, '') // Remove quotes and geresh
      .replace(/[׳״]/g, '')
      .replace(/[-/]/g, ' ') // Replace hyphens and slashes with spaces
      .toLowerCase()
      .replace(/\s+/g, ' '); // Collapse spaces
  };

  const isCityMatch = (alertCity: string, userCity: string) => {
    const normAlert = normalizeCity(alertCity);
    const normUser = normalizeCity(userCity);
    
    if (!normAlert || !normUser) return false;
    
    if (normAlert === normUser) return true;
    
    // Hierarchical match: user selected "Ashdod", matches "Ashdod Area A"
    if (normAlert.startsWith(normUser + " ") || normAlert.startsWith(normUser + " -")) {
      return true;
    }

    // Reverse hierarchical (just in case)
    if (normUser.startsWith(normAlert + " ") || normUser.startsWith(normAlert + " -")) {
      return true;
    }

    return normAlert.includes(normUser) || normUser.includes(normAlert);
  };

  const testNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(t.testNotification, { 
        body: "WatchAlert: " + t.monitoring,
        icon: "/favicon.ico"
      });
      triggerVibration();
    } else {
      requestPermissions();
    }
  };

  const testAlert = async () => {
    try {
      const response = await fetch('/api/test-alert');
      const data: Alert = await response.json();
      setAlerts(data);
      triggerVibration();
      if (notificationsEnabled) {
        new Notification(t.testAlert, {
          body: data.data.join(", "),
          icon: "/favicon.ico",
          requireInteraction: true
        });
      }
    } catch (e) {
      console.error("Test alert error:", e);
    }
  };

  const fetchAlerts = useCallback(async (retryCount = 0) => {
    if (!isMonitoring) return;
    try {
      const response = await fetch('/api/alerts');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || t.connectionError);
      }

      const data: Alert = await response.json();
      setApiWarning(data.warning || null);
      
      // Check if there's a new alert
      if (data.id !== "0" && data.id !== lastAlertId) {
        // Global Type Filter
        const typeMatch = !filterByTypes || selectedTypes.length === 0 || selectedTypes.some(type => data.title.includes(type));
        
        if (typeMatch) {
          const relevantAlerts = data.data.filter(alertCity => {
            if (!filterToCity || !userCity) return true;
            return isCityMatch(alertCity, userCity);
          });

          if (relevantAlerts.length > 0) {
            setAlerts({ ...data, data: relevantAlerts });
            setLastAlertId(data.id);
            triggerVibration();
            
            if (notificationsEnabled) {
              new Notification(t.alertActive, {
                body: relevantAlerts.join(", "),
                icon: "/favicon.ico",
                tag: "oref-alert",
                requireInteraction: true
              });
            }
          }
        }
      } else if (data.id === "0") {
        setAlerts(null);
      }
      setError(null);
    } catch (err) {
      console.error("Fetch error:", err);
      const message = err instanceof Error ? err.message : String(err);
      
      if (message === "Failed to fetch") {
        setError("Server Connection Lost. Retrying...");
      } else {
        setError(message);
      }

      if (retryCount < 3) {
        setTimeout(() => fetchAlerts(retryCount + 1), 3000);
      }
    }
  }, [isMonitoring, lastAlertId, notificationsEnabled, filterToCity, userCity, t, triggerVibration, normalizeCity]);

  // Polling mechanism
  useEffect(() => {
    const interval = setInterval(fetchAlerts, 3000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  // Fetch history
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/history');
        if (res.ok) {
          const data = await res.json();
          setHistory(data);
        }
      } catch (e) {
        console.error("History fetch error:", e);
      }
    };
    fetchHistory();
    const interval = setInterval(fetchHistory, 5000);
    return () => clearInterval(interval);
  }, []);

  const triggerSimulation = async () => {
    try {
      await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: lang === 'he' ? "ירי רקטות וטילים" : "Rockets & Missiles",
          data: ["אשדוד - ח, ט, י, יא, יב, טו, יז, מרינה, סיטי, רובע מיוחד", "חיפה - מערב", "תל אביב - עבר הירקון"]
        })
      });
    } catch (e) {
      console.error("Simulation error:", e);
    }
  };

  const toggleMonitoring = () => setIsMonitoring(!isMonitoring);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(lang === 'he' ? 'he-IL' : 'en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
  };

  const filteredCities = cities.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const toggleProfile = (id: string) => {
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p));
  };

  const deleteProfile = (id: string) => {
    setProfiles(prev => prev.filter(p => p.id !== id));
  };

  const saveProfile = () => {
    if (!editingProfile) return;
    if (showProfileEditor === 'new') {
      setProfiles(prev => [...prev, { ...editingProfile, id: Date.now().toString() }]);
    } else {
      setProfiles(prev => prev.map(p => p.id === showProfileEditor ? editingProfile : p));
    }
    setShowProfileEditor(null);
    setEditingProfile(null);
  };

  const startNewProfile = () => {
    setEditingProfile({
      id: 'new',
      name: '',
      city: null,
      types: [],
      enabled: true
    });
    setShowProfileEditor('new');
  };

  const startEditProfile = (p: AlertProfile) => {
    setEditingProfile({ ...p });
    setShowProfileEditor(p.id);
  };

  return (
    <div className={`watch-container ${lang === 'he' || lang === 'ar' ? 'rtl' : 'ltr'}`} dir={lang === 'he' || lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className={`watch-face ${alerts ? 'alert-active' : ''}`}>
        {alerts && <div className="alert-bg-anim" />}
        <div className="watch-inner relative z-10">
          <AnimatePresence mode="wait">
            {!showSettings ? (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full h-full flex flex-col items-center justify-between py-4"
              >
                {/* Top: Time and Status */}
                <div className="flex flex-col items-center gap-1">
                  <span className="text-3xl font-mono font-bold tracking-tighter">
                    {formatTime(currentTime)}
                  </span>
                  <div className="flex items-center gap-2">
                    {isMonitoring ? (
                      <span className="flex items-center gap-1 text-[10px] text-green-500 font-bold uppercase tracking-widest">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        {t.monitoring}
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                        {t.paused}
                      </span>
                    )}
                  </div>
                </div>

                {/* Center: Alert Status */}
                <div className="flex-1 flex flex-col items-center justify-center w-full">
                  {alerts ? (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex flex-col items-center gap-2 w-full"
                    >
                      <AlertTriangle className="w-12 h-12 text-red-500 pulsate-icon" />
                      <h2 className="text-xl font-bold text-red-500 uppercase tracking-tight leading-none">
                        {t.alertActive}
                      </h2>
                      <div className="scrolling-text-container mt-1">
                        <p className="text-sm font-bold text-white scrolling-text">
                          {alerts.data.join(" • ")}
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 opacity-40">
                      <ShieldAlert className="w-12 h-12 text-zinc-400" />
                      <span className="text-xs font-medium text-zinc-400">{t.everythingClear}</span>
                    </div>
                  )}
                </div>

                {/* Bottom: Controls */}
                <div className="flex items-center justify-center gap-6 pb-2">
                  <button
                    onClick={() => setShowLog(true)}
                    className="p-3 rounded-full bg-zinc-800 text-white"
                  >
                    <Clock size={18} />
                  </button>
                  <button
                    onClick={toggleMonitoring}
                    className={`p-3 rounded-full transition-colors ${
                      isMonitoring ? 'bg-zinc-800 text-white' : 'bg-green-600 text-white'
                    }`}
                  >
                    {isMonitoring ? <BellOff size={18} /> : <Bell size={18} />}
                  </button>
                  <button
                    onClick={() => setShowSettings(true)}
                    className="p-3 rounded-full bg-zinc-800 text-white"
                  >
                    <Settings size={18} />
                  </button>
                </div>
              </motion.div>
            ) : showLog ? (
              <motion.div
                key="log"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                className="w-full h-full flex flex-col items-center py-6 px-6"
              >
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">{t.alertLog}</h3>
                
                <div className="flex-1 w-full flex flex-col gap-2 overflow-y-auto scrollbar-hide">
                  {history.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-30">
                      <Clock className="w-8 h-8 mb-2" />
                      <span className="text-[10px]">{t.noHistory}</span>
                    </div>
                  ) : (
                    history.map(entry => (
                      <div key={entry.id} className="bg-zinc-800/40 p-2 rounded-xl border border-zinc-800/50 flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold text-blue-400 uppercase tracking-tighter">
                            {entry.title}
                          </span>
                          <span className="text-[8px] text-zinc-500">
                            {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-300 leading-tight">
                          {entry.data.join(", ")}
                        </p>
                        {entry.isSimulated && (
                          <span className="text-[8px] bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded-md self-start font-bold uppercase">
                            {t.simulated}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <button
                  onClick={() => setShowLog(false)}
                  className="mt-4 px-6 py-2 rounded-full bg-white text-black text-xs font-bold uppercase tracking-widest"
                >
                  {t.done}
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="w-full h-full flex flex-col items-center py-6 px-6"
              >
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">{t.settings}</h3>
                
                <div className="flex-1 w-full flex flex-col gap-3 overflow-y-auto scrollbar-hide">
                  {/* Language Selector */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest px-1">{t.language}</span>
                    <div className="flex gap-1">
                      {(['he', 'en', 'ar', 'ru'] as Language[]).map(l => (
                        <button
                          key={l}
                          onClick={() => setLang(l)}
                          className={`flex-1 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors ${
                            lang === l ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={requestPermissions}
                      className={`flex items-center justify-between w-full p-3 rounded-xl ${
                        notificationsEnabled ? 'bg-green-600/20 text-green-400' : 'bg-blue-600/20 text-blue-400'
                      }`}
                    >
                      <span className="text-xs font-medium">{t.notifications}</span>
                      {notificationsEnabled ? <Bell size={14} /> : <BellOff size={14} />}
                    </button>
                    
                    {notificationsEnabled && (
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={triggerSimulation}
                          className="flex items-center justify-between w-full p-3 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/20"
                        >
                          <span className="text-xs font-bold uppercase tracking-tight">{t.simulateAlert}</span>
                          <Activity size={14} className="animate-pulse" />
                        </button>

                        <button
                          onClick={() => setVibrationEnabled(!vibrationEnabled)}
                          className={`flex items-center justify-between w-full p-3 rounded-xl ${
                            vibrationEnabled ? 'bg-blue-600/20 text-blue-400' : 'bg-zinc-800/50'
                          }`}
                        >
                          <span className="text-xs font-medium">{t.vibration}</span>
                          <Activity size={14} className={vibrationEnabled ? "text-blue-400" : "text-zinc-500"} />
                        </button>

                        <div className="flex gap-2">
                          <button
                            onClick={testNotification}
                            className="flex-1 p-2 rounded-lg bg-zinc-800/30 text-[10px] text-zinc-400 hover:bg-zinc-800"
                          >
                            {t.testNotification}
                          </button>
                          <button
                            onClick={testAlert}
                            className="flex-1 p-2 rounded-lg bg-zinc-800/30 text-[10px] text-zinc-400 hover:bg-zinc-800"
                          >
                            {t.testAlert}
                          </button>
                        </div>
                      </div>
                    )}

                    {window.self !== window.top && (
                      <p className="text-[9px] text-amber-500/70 px-1 leading-tight">
                        {t.iframeWarning}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setFilterToCity(!filterToCity)}
                      className={`flex items-center justify-between w-full p-3 rounded-xl ${
                        filterToCity ? 'bg-blue-600/20 text-blue-400' : 'bg-zinc-800/50'
                      }`}
                    >
                      <div className="flex flex-col items-start">
                        <span className="text-xs font-medium">{t.filterByCity}</span>
                        <span className="text-[10px] opacity-60">{userCity || t.detecting}</span>
                      </div>
                      <MapPin size={14} className={filterToCity ? "text-blue-400" : "text-zinc-500"} />
                    </button>
                    
                    {/* Manual City Selector */}
                    <button
                      onClick={() => setShowCitySelector(!showCitySelector)}
                      className="flex items-center justify-between w-full p-2 px-3 rounded-xl bg-zinc-800/30 text-zinc-400"
                    >
                      <span className="text-[10px]">{t.selectCity}</span>
                      {showCitySelector ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                    {showCitySelector && (
                      <div className="flex flex-col gap-1 max-h-56 overflow-y-auto scrollbar-hide bg-zinc-900 rounded-xl p-2 border border-zinc-800 shadow-2xl">
                        <div className="sticky top-0 bg-zinc-900 z-10 pb-2">
                          <div className="relative">
                            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                            <input
                              type="text"
                              placeholder={t.selectCity + "..."}
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full bg-zinc-800/80 rounded-lg py-2 pl-8 pr-8 text-[11px] outline-none border border-zinc-700/50 focus:border-blue-500/50 transition-all placeholder:text-zinc-600"
                            />
                            {searchQuery && (
                              <button 
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-white hover:bg-zinc-700 rounded-md transition-colors"
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {isLoadingCities && (
                          <div className="text-[10px] text-zinc-500 p-3 text-center animate-pulse flex items-center justify-center gap-2">
                            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" />
                            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                            {t.detecting}
                          </div>
                        )}

                        <button
                          onClick={() => {
                            setUserCity(null);
                            setShowCitySelector(false);
                            setFilterToCity(false);
                            setSearchQuery('');
                          }}
                          className={`flex items-center gap-2 text-left text-[10px] p-2.5 px-3 rounded-lg transition-all mb-1 ${
                            !userCity ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20' : 'bg-zinc-800/40 text-zinc-300 hover:bg-zinc-800'
                          }`}
                        >
                          <Globe size={10} />
                          <span className="font-semibold uppercase tracking-wider">{t.allCities}</span>
                        </button>

                        <div className="h-px bg-zinc-800/50 my-1 mx-1" />

                        {!isLoadingCities && filteredCities.length === 0 && (
                          <div className="text-[10px] text-zinc-600 p-4 text-center italic">
                            {t.noAlerts}
                          </div>
                        )}

                        <div className="space-y-0.5">
                          {filteredCities.slice(0, 100).map(city => (
                            <button
                              key={`${city.name}-${city.district}`}
                              onClick={() => {
                                setUserCity(city.name);
                                setShowCitySelector(false);
                                setFilterToCity(true);
                                setSearchQuery('');
                              }}
                              className={`w-full text-left text-[10px] p-2 px-3 rounded-lg transition-all group flex items-center justify-between ${
                                userCity === city.name 
                                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                                  : 'bg-zinc-800/20 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                              }`}
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">{city.name}</span>
                                <span className="text-[8px] opacity-60">
                                  {city.district}{city.time && ` • ${city.time}s`}
                                </span>
                              </div>
                              {userCity === city.name && <div className="w-1 h-1 bg-white rounded-full" />}
                            </button>
                          ))}
                          {filteredCities.length > 100 && (
                            <div className="text-[9px] text-zinc-600 text-center py-2 border-t border-zinc-800/30 mt-1">
                              {t.language === 'he' ? 'מוצגות 100 תוצאות ראשונות' : 'Showing first 100 results'}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Alert Type Filter */}
                    <div className="flex flex-col gap-2 mt-2">
                      <button
                        onClick={() => setFilterByTypes(!filterByTypes)}
                        className={`flex items-center justify-between w-full p-3 rounded-xl ${
                          filterByTypes ? 'bg-blue-600/20 text-blue-400' : 'bg-zinc-800/50'
                        }`}
                      >
                        <div className="flex flex-col items-start">
                          <span className="text-xs font-medium">{t.alertTypes}</span>
                          <span className="text-[10px] opacity-60">
                            {selectedTypes.length === 0 ? t.allTypes : `${selectedTypes.length} ${t.alertTypes}`}
                          </span>
                        </div>
                        <ShieldAlert size={14} className={filterByTypes ? "text-blue-400" : "text-zinc-500"} />
                      </button>

                      {filterByTypes && (
                        <div className="grid grid-cols-1 gap-1 bg-zinc-900/50 p-2 rounded-xl border border-zinc-800/50">
                          {ALERT_TYPES.map(type => (
                            <button
                              key={type.id}
                              onClick={() => {
                                const types = selectedTypes.includes(type.he)
                                  ? selectedTypes.filter(t => t !== type.he)
                                  : [...selectedTypes, type.he];
                                setSelectedTypes(types);
                              }}
                              className={`flex items-center justify-between p-2 px-3 rounded-lg text-[10px] transition-all ${
                                selectedTypes.includes(type.he) ? 'bg-blue-600/20 text-blue-400' : 'text-zinc-500 hover:bg-zinc-800/50'
                              }`}
                            >
                              <span>{lang === 'he' ? type.he : type.en}</span>
                              {selectedTypes.includes(type.he) && <div className="w-1 h-1 bg-blue-400 rounded-full" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 mt-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest">{t.profiles}</span>
                      <button 
                        onClick={startNewProfile}
                        className="text-[10px] text-blue-400 font-bold hover:underline"
                      >
                        +{t.addProfile}
                      </button>
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                      {profiles.map(p => (
                        <div key={p.id} className="flex items-center gap-2 bg-zinc-800/40 p-2 rounded-xl border border-zinc-800/50">
                          <button 
                            onClick={() => toggleProfile(p.id)}
                            className={`w-4 h-4 rounded-full border ${p.enabled ? 'bg-blue-500 border-blue-500' : 'border-zinc-600'}`}
                          />
                          <div className="flex-1 flex flex-col items-start overflow-hidden" onClick={() => startEditProfile(p)}>
                            <span className="text-[11px] font-bold text-zinc-200 truncate w-full">{p.name}</span>
                            <span className="text-[9px] text-zinc-500 truncate w-full">
                              {p.city || t.allCities} • {p.types.length > 0 ? p.types.length : t.allTypes}
                            </span>
                          </div>
                          <button onClick={() => deleteProfile(p.id)} className="p-1 text-zinc-600 hover:text-red-400">
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-800/50 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">{t.about}</span>
                      <Info size={14} className="text-zinc-500" />
                    </div>
                    <p className="text-[10px] text-zinc-500 text-left">
                      {t.version}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowSettings(false)}
                  className="mt-4 px-6 py-2 rounded-full bg-white text-black text-xs font-bold uppercase tracking-widest"
                >
                  {t.done}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Decorative Watch Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-2 bg-zinc-700 rounded-b-full" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-2 bg-zinc-700 rounded-t-full" />
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-1 bg-zinc-700 rounded-r-full" />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-1 bg-zinc-700 rounded-l-full" />
      </div>

      {/* Background Info */}
      <div className="absolute bottom-8 text-center opacity-30 pointer-events-none">
        <p className="text-[10px] uppercase tracking-[0.3em] font-bold">Pikud HaOref Companion</p>
      </div>

      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-900/80 text-white text-[10px] px-3 py-1 rounded-full backdrop-blur-sm">
          {error}
        </div>
      )}

      {apiWarning && !error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-amber-900/80 text-white text-[10px] px-3 py-1 rounded-full backdrop-blur-sm">
          {apiWarning}
        </div>
      )}
      {/* Profile Editor Modal */}
      <AnimatePresence>
        {showProfileEditor && editingProfile && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 z-[100] bg-black/95 flex flex-col p-6 overflow-y-auto scrollbar-hide"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                {showProfileEditor === 'new' ? t.addProfile : editingProfile.name}
              </h3>
              <button onClick={() => setShowProfileEditor(null)} className="p-1 text-zinc-500">
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-500 uppercase px-1">{t.profileName}</label>
                <input 
                  type="text"
                  value={editingProfile.name}
                  onChange={e => setEditingProfile({ ...editingProfile, name: e.target.value })}
                  className="bg-zinc-800 rounded-xl p-3 text-xs outline-none border border-zinc-700 focus:border-blue-500"
                  placeholder="e.g. Home"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-500 uppercase px-1">{t.selectCity}</label>
                <select 
                  value={editingProfile.city || ''}
                  onChange={e => setEditingProfile({ ...editingProfile, city: e.target.value || null })}
                  className="bg-zinc-800 rounded-xl p-3 text-xs outline-none border border-zinc-700 appearance-none"
                >
                  <option value="">{t.allCities}</option>
                  {cities.map(c => (
                    <option key={`${c.name}-${c.district}`} value={c.name}>
                      {c.name} ({c.district})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-500 uppercase px-1">{t.alertTypes}</label>
                <div className="grid grid-cols-1 gap-1">
                  {ALERT_TYPES.map(type => (
                    <button
                      key={type.id}
                      onClick={() => {
                        const types = editingProfile.types.includes(type.he)
                          ? editingProfile.types.filter(t => t !== type.he)
                          : [...editingProfile.types, type.he];
                        setEditingProfile({ ...editingProfile, types });
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-xl text-[10px] transition-colors ${
                        editingProfile.types.includes(type.he) ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-zinc-800/40 text-zinc-500 border border-transparent'
                      }`}
                    >
                      <span>{lang === 'he' ? type.he : type.en}</span>
                      {editingProfile.types.includes(type.he) && <Activity size={10} />}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={saveProfile}
                disabled={!editingProfile.name}
                className="mt-4 w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-lg shadow-blue-900/20 disabled:opacity-50"
              >
                {t.done}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

