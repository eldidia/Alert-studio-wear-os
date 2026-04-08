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
  }
};

const FALLBACK_CITIES = [
  "תל אביב - יפו", "ירושלים", "חיפה", "ראשון לציון", "פתח תקווה", "אשדוד", "נתניה", "באר שבע", 
  "בני ברק", "חולון", "רמת גן", "רחובות", "אשקלון", "בת ים", "בית שמש", "כפר סבא", "הרצליה", 
  "חדרה", "מודיעין-מכבים-רעות", "לוד", "רמלה", "רעננה", "מודיעין עילית", "רהט", "הוד השרון", 
  "גבעתיים", "קריית אתא", "נהריה", "ביתר עילית", "אום אל-פחם", "קריית גת", "אילת", "ראש העין"
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
  const [lang, setLang] = useState<Language>('he');
  const [cities, setCities] = useState<string[]>(FALLBACK_CITIES);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [showCitySelector, setShowCitySelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const t = translations[lang];

  // Sync with Android Native App
  useEffect(() => {
    if ((window as any).AndroidApp && (window as any).AndroidApp.updateFilter) {
      (window as any).AndroidApp.updateFilter(userCity || "", filterToCity, isMonitoring);
    }
  }, [userCity, filterToCity, isMonitoring]);

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
            // Deduplicate and sort with normalization
            const uniqueCities = Array.from(new Set(data.map((c: string) => c.trim().normalize('NFC')))).sort();
            setCities(uniqueCities);
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
    return name
      .trim()
      .normalize('NFC')
      .replace(/[\u05F3\u05F4'"]/g, '') // Remove quotes and geresh for comparison
      .replace(/\s-/g, '-')
      .replace(/-\s/g, '-')
      .toLowerCase();
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
        throw new Error(t.connectionError);
      }

      const data: Alert = await response.json();
      setApiWarning(data.warning || null);
      
      // Check if there's a new alert
      if (data.id !== "0" && data.id !== lastAlertId) {
        const relevantAlerts = data.data.filter(alertCity => {
          if (!filterToCity || !userCity) return true;
          const normalizedAlert = normalizeCity(alertCity);
          const normalizedUser = normalizeCity(userCity);
          return normalizedAlert.includes(normalizedUser) || normalizedUser.includes(normalizedAlert);
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
      } else if (data.id === "0") {
        setAlerts(null);
      }
      setError(null);
    } catch (err) {
      console.error("Fetch error:", err);
      if (retryCount < 2) {
        setTimeout(() => fetchAlerts(retryCount + 1), 2000);
      } else {
        setError(err instanceof Error ? err.message : t.connectionError);
      }
    }
  }, [isMonitoring, lastAlertId, notificationsEnabled, filterToCity, userCity, t]);

  // Polling mechanism
  useEffect(() => {
    const interval = setInterval(fetchAlerts, 3000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const toggleMonitoring = () => setIsMonitoring(!isMonitoring);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(lang === 'he' ? 'he-IL' : 'en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
  };

  const filteredCities = cities.filter(c => 
    c.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

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
                              key={city}
                              onClick={() => {
                                setUserCity(city);
                                setShowCitySelector(false);
                                setFilterToCity(true);
                                setSearchQuery('');
                              }}
                              className={`w-full text-left text-[10px] p-2 px-3 rounded-lg transition-all group flex items-center justify-between ${
                                userCity === city 
                                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                                  : 'bg-zinc-800/20 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                              }`}
                            >
                              <span>{city}</span>
                              {userCity === city && <div className="w-1 h-1 bg-white rounded-full" />}
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
    </div>
  );
}

