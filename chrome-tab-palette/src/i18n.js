// src/i18n.js — minimal VI/EN i18n for the tab palette
(function () {
  'use strict';

  const SUPPORTED = ['vi', 'en'];

  const TRANSLATIONS = Object.freeze({
    vi: Object.freeze({
      'search.placeholder': 'Tìm tab…',
      'empty.noTabs': 'Không có tab nào khác.',
      'empty.noMatch': 'Không khớp tab nào.',
      'hint.nav': '↑↓ di chuyển',
      'hint.jump': '⏎ chuyển tab',
      'hint.close': 'Ctrl+⌫ đóng tab',
      'hint.esc': 'Esc thoát',
      'lang.toggle': 'EN',
    }),
    en: Object.freeze({
      'search.placeholder': 'Search tabs…',
      'empty.noTabs': 'No other tabs.',
      'empty.noMatch': 'No matching tabs.',
      'hint.nav': '↑↓ move',
      'hint.jump': '⏎ switch',
      'hint.close': 'Ctrl+⌫ close tab',
      'hint.esc': 'Esc dismiss',
      'lang.toggle': 'VI',
    }),
  });

  let lang = 'vi';

  function detectDefaultLang() {
    const nav = (typeof navigator !== 'undefined' && navigator.language) || 'en';
    return nav.toLowerCase().startsWith('vi') ? 'vi' : 'en';
  }

  function getLang() {
    return lang;
  }

  function _setLangSync(next) {
    if (SUPPORTED.includes(next)) lang = next;
  }

  function setLang(next) {
    _setLangSync(next);
    return new Promise((resolve) => chrome.storage.local.set({ lang }, resolve));
  }

  function init() {
    return new Promise((resolve) => {
      chrome.storage.local.get('lang', (res) => {
        _setLangSync((res && res.lang) || detectDefaultLang());
        resolve();
      });
    });
  }

  function t(key) {
    const table = TRANSLATIONS[lang] || {};
    return Object.prototype.hasOwnProperty.call(table, key) ? table[key] : key;
  }

  function applyToDOM(root) {
    const scope = root || (typeof document !== 'undefined' ? document : null);
    if (!scope) return;
    scope.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    scope.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
    });
  }

  const I18n = {
    SUPPORTED, t, getLang, setLang, _setLangSync, init, detectDefaultLang, applyToDOM,
  };

  if (typeof module !== 'undefined') module.exports = I18n;
  else globalThis.I18n = I18n;
})();
