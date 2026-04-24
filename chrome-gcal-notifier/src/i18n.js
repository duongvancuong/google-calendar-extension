// src/i18n.js
(function () {
  'use strict';

  const TRANSLATIONS = Object.freeze({
    vi: Object.freeze({
      'tab.upcoming': 'Sắp tới',
      'tab.digest': 'Digest',
      'tab.settings': 'Cài đặt',
      'tab.guide': 'Hướng dẫn',

      'common.save': 'Lưu cài đặt',
      'common.saved': 'Đã lưu ✓',
      'common.add': '+ Thêm',
      'common.remove': 'Xoá',
      'common.openCalendar': 'Mở Google Calendar',

      'upcoming.empty': 'Không có sự kiện sắp tới. Mở Google Calendar để tải dữ liệu.',
      'upcoming.loading': 'Đang tải sự kiện...',
      'upcoming.meet': 'Meet',

      'digest.empty': 'Không có sự kiện hôm nay.',
      'digest.sendNow': 'Gửi digest ngay',

      'settings.notifyBefore': 'Thông báo trước (phút)',
      'settings.notifyBeforeInput': 'Nhập phút',
      'settings.digestHeading': 'Digest hàng ngày',
      'settings.digestEnable': 'Bật digest hàng ngày',
      'settings.digestTime': 'Giờ nhận',
      'settings.source': 'Nguồn dữ liệu',
      'settings.sourceScrape': 'Scraping (hiện tại)',
      'settings.sourceApi': 'Google Calendar API',
      'settings.apiKeyPlaceholder': 'Nhập OAuth Client ID khi sẵn sàng',
      'settings.language': 'Ngôn ngữ',
      'settings.languageVi': 'Tiếng Việt',
      'settings.languageEn': 'English',

      'day.today': 'HÔM NAY',
      'day.tomorrow': 'NGÀY MAI',
      'day.weekday.0': 'CN',
      'day.weekday.1': 'T2',
      'day.weekday.2': 'T3',
      'day.weekday.3': 'T4',
      'day.weekday.4': 'T5',
      'day.weekday.5': 'T6',
      'day.weekday.6': 'T7',

      'notif.eventStarting': 'Bắt đầu sau {min} phút',
      'notif.snooze5': 'Hoãn 5p',
      'notif.openCalendar': 'Mở Calendar',
      'notif.digestTitle': 'Lịch hôm nay — {date}',
      'notif.digestDetails': 'Xem chi tiết',

      'guide.setup.heading': 'Cài đặt ban đầu',
      'guide.setup.step1': 'Mở Google Calendar và đăng nhập tài khoản của bạn.',
      'guide.setup.step2': 'Cho phép Chrome hiện thông báo desktop khi được hỏi.',
      'guide.setup.step3': 'Giữ tab Google Calendar mở hoặc mở lại định kỳ để extension đồng bộ sự kiện.',

      'guide.tabs.heading': 'Các tab',
      'guide.tabs.upcoming': 'Danh sách sự kiện hôm nay và ngày mai. Nhấn vào để mở Google Calendar, nhấn nút Meet để vào phòng họp.',
      'guide.tabs.digest': 'Tổng hợp lịch trong ngày. Có thể bấm nút để gửi thông báo digest ngay lập tức.',
      'guide.tabs.settings': 'Cấu hình thời gian nhắc trước, digest hàng ngày, nguồn dữ liệu và ngôn ngữ.',

      'guide.howItWorks.heading': 'Cách hoạt động',
      'guide.howItWorks.scraper': 'Content script đọc sự kiện trực tiếp từ giao diện Google Calendar khi tab đang mở.',
      'guide.howItWorks.alarms': 'Service worker đặt chrome.alarms để kích hoạt thông báo đúng mốc thời gian bạn cấu hình.',
      'guide.howItWorks.digest': 'Digest chạy hàng ngày vào giờ đã chọn trong Settings và tổng hợp sự kiện của ngày.',

      'guide.faq.heading': 'FAQ',
      'guide.faq.q1': 'Không nhận được thông báo?',
      'guide.faq.a1': 'Kiểm tra quyền notification của Chrome và macOS/Windows cho Chrome; mở lại tab Google Calendar để extension đồng bộ lại dữ liệu.',
      'guide.faq.q2': 'Meet link không hiện?',
      'guide.faq.a2': 'Scraper chỉ lấy được Meet link khi bạn mở chi tiết sự kiện trong Google Calendar ít nhất một lần.',
      'guide.faq.q3': 'Digest không gửi đúng giờ?',
      'guide.faq.a3': 'Service worker có thể bị Chrome tạm ngủ. Mở popup hoặc tab Calendar sẽ kích hoạt lại và đặt alarm.',
    }),
    en: Object.freeze({
      'tab.upcoming': 'Upcoming',
      'tab.digest': 'Digest',
      'tab.settings': 'Settings',
      'tab.guide': 'Guide',

      'common.save': 'Save settings',
      'common.saved': 'Saved ✓',
      'common.add': '+ Add',
      'common.remove': 'Remove',
      'common.openCalendar': 'Open Google Calendar',

      'upcoming.empty': 'No upcoming events. Open Google Calendar to sync data.',
      'upcoming.loading': 'Loading events...',
      'upcoming.meet': 'Meet',

      'digest.empty': 'No events today.',
      'digest.sendNow': 'Send digest now',

      'settings.notifyBefore': 'Notify before (minutes)',
      'settings.notifyBeforeInput': 'Minutes',
      'settings.digestHeading': 'Daily digest',
      'settings.digestEnable': 'Enable daily digest',
      'settings.digestTime': 'Delivery time',
      'settings.source': 'Data source',
      'settings.sourceScrape': 'Scraping (current)',
      'settings.sourceApi': 'Google Calendar API',
      'settings.apiKeyPlaceholder': 'Paste OAuth Client ID when ready',
      'settings.language': 'Language',
      'settings.languageVi': 'Tiếng Việt',
      'settings.languageEn': 'English',

      'day.today': 'TODAY',
      'day.tomorrow': 'TOMORROW',
      'day.weekday.0': 'Sun',
      'day.weekday.1': 'Mon',
      'day.weekday.2': 'Tue',
      'day.weekday.3': 'Wed',
      'day.weekday.4': 'Thu',
      'day.weekday.5': 'Fri',
      'day.weekday.6': 'Sat',

      'notif.eventStarting': 'Starts in {min} min',
      'notif.snooze5': 'Snooze 5m',
      'notif.openCalendar': 'Open Calendar',
      'notif.digestTitle': "Today's schedule — {date}",
      'notif.digestDetails': 'View details',

      'guide.setup.heading': 'Initial setup',
      'guide.setup.step1': 'Open Google Calendar and sign in to your account.',
      'guide.setup.step2': 'Allow Chrome to show desktop notifications when prompted.',
      'guide.setup.step3': 'Keep the Calendar tab open or reopen it periodically so the extension can sync events.',

      'guide.tabs.heading': 'Tabs',
      'guide.tabs.upcoming': 'List of events for today and tomorrow. Click an item to open Calendar; press Meet to join the call.',
      'guide.tabs.digest': "Summary of today's schedule. You can trigger a digest notification immediately.",
      'guide.tabs.settings': 'Configure reminder minutes, daily digest, data source, and language.',

      'guide.howItWorks.heading': 'How it works',
      'guide.howItWorks.scraper': 'A content script reads events directly from the Google Calendar UI while the tab is open.',
      'guide.howItWorks.alarms': 'The service worker sets chrome.alarms to fire notifications at the minute offsets you configure.',
      'guide.howItWorks.digest': 'The digest runs once a day at the chosen time and summarizes the day ahead.',

      'guide.faq.heading': 'FAQ',
      'guide.faq.q1': "Not receiving notifications?",
      'guide.faq.a1': "Check Chrome's notification permission and your OS notification settings for Chrome; reopen Google Calendar so the extension can re-sync.",
      'guide.faq.q2': 'Meet link missing?',
      'guide.faq.a2': 'The scraper only captures a Meet link after you have opened the event details in Google Calendar at least once.',
      'guide.faq.q3': 'Digest not firing on time?',
      'guide.faq.a3': 'Chrome can suspend the service worker. Opening the popup or the Calendar tab wakes it up and reschedules the alarm.',
    }),
  });

  const STORAGE_KEY = 'settings';
  const SUPPORTED = ['vi', 'en'];
  const DEFAULT_FALLBACK = 'vi';

  let currentLang = DEFAULT_FALLBACK;

  function detectDefaultLang() {
    const nav = typeof navigator !== 'undefined' ? navigator : null;
    const raw = nav && typeof nav.language === 'string' ? nav.language : '';
    if (raw.toLowerCase().startsWith('vi')) return 'vi';
    if (raw.toLowerCase().startsWith('en')) return 'en';
    return DEFAULT_FALLBACK;
  }

  function normalize(lang) {
    return SUPPORTED.includes(lang) ? lang : null;
  }

  function readStoredLang() {
    return new Promise((resolve) => {
      if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
        resolve(null);
        return;
      }
      chrome.storage.local.get(STORAGE_KEY, (data) => {
        const settings = (data && data.settings) || {};
        resolve(normalize(settings.language));
      });
    });
  }

  function writeStoredLang(lang) {
    return new Promise((resolve) => {
      if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
        resolve();
        return;
      }
      chrome.storage.local.get(STORAGE_KEY, (data) => {
        const next = Object.assign({}, (data && data.settings) || {}, { language: lang });
        chrome.storage.local.set({ [STORAGE_KEY]: next }, resolve);
      });
    });
  }

  async function init() {
    const stored = await readStoredLang();
    currentLang = stored || detectDefaultLang();
    return currentLang;
  }

  function getLang() {
    return currentLang;
  }

  async function setLang(lang) {
    const valid = normalize(lang);
    if (!valid) return currentLang;
    currentLang = valid;
    await writeStoredLang(valid);
    return currentLang;
  }

  function interpolate(str, params) {
    if (!params) return str;
    return str.replace(/\{(\w+)\}/g, (match, key) =>
      Object.prototype.hasOwnProperty.call(params, key) ? String(params[key]) : match
    );
  }

  function t(key, params) {
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS[DEFAULT_FALLBACK];
    const fallbackDict = TRANSLATIONS[DEFAULT_FALLBACK];
    const value =
      (dict && Object.prototype.hasOwnProperty.call(dict, key) && dict[key]) ||
      (fallbackDict && Object.prototype.hasOwnProperty.call(fallbackDict, key) && fallbackDict[key]) ||
      key;
    return interpolate(value, params);
  }

  function applyToDOM(root) {
    if (!root || typeof root.querySelectorAll !== 'function') return;
    root.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
    });
    root.querySelectorAll('[data-i18n-title]').forEach((el) => {
      el.setAttribute('title', t(el.getAttribute('data-i18n-title')));
    });
  }

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function formatTime(ts) {
    const d = new Date(ts);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function dayLabel(ts) {
    const d = new Date(ts);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);
    if (d >= today && d < tomorrow) return t('day.today');
    if (d >= tomorrow && d < dayAfter) return t('day.tomorrow');
    const weekday = t(`day.weekday.${d.getDay()}`);
    return `${weekday} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
  }

  function formatShortDate(date) {
    const d = date instanceof Date ? date : new Date(date);
    const weekday = t(`day.weekday.${d.getDay()}`);
    return `${weekday} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
  }

  const I18n = {
    SUPPORTED,
    init,
    getLang,
    setLang,
    t,
    applyToDOM,
    formatTime,
    dayLabel,
    formatShortDate,
    detectDefaultLang,
  };

  if (typeof module !== 'undefined') module.exports = I18n;
  else if (typeof globalThis !== 'undefined') globalThis.I18n = I18n;
})();
