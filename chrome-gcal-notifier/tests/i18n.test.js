// tests/i18n.test.js
const path = require('path');

function loadI18n() {
  delete require.cache[require.resolve('../src/i18n')];
  return require('../src/i18n');
}

describe('I18n.detectDefaultLang', () => {
  const originalNavigator = global.navigator;

  afterEach(() => {
    global.navigator = originalNavigator;
  });

  it('returns vi for Vietnamese locale', () => {
    global.navigator = { language: 'vi-VN' };
    const I18n = loadI18n();
    expect(I18n.detectDefaultLang()).toBe('vi');
  });

  it('returns en for English locale', () => {
    global.navigator = { language: 'en-US' };
    const I18n = loadI18n();
    expect(I18n.detectDefaultLang()).toBe('en');
  });

  it('falls back to vi for unsupported locale', () => {
    global.navigator = { language: 'fr-FR' };
    const I18n = loadI18n();
    expect(I18n.detectDefaultLang()).toBe('vi');
  });

  it('falls back to vi when navigator is missing', () => {
    global.navigator = undefined;
    const I18n = loadI18n();
    expect(I18n.detectDefaultLang()).toBe('vi');
  });
});

describe('I18n.init + getLang + setLang', () => {
  let I18n;

  beforeEach(() => {
    chrome.storage.local.get.mockImplementation((key, cb) => cb({}));
    chrome.storage.local.set.mockImplementation((obj, cb) => cb && cb());
    global.navigator = { language: 'vi-VN' };
    I18n = loadI18n();
  });

  it('uses detected language when no stored setting', async () => {
    global.navigator = { language: 'en-US' };
    I18n = loadI18n();
    chrome.storage.local.get.mockImplementation((key, cb) => cb({}));
    await I18n.init();
    expect(I18n.getLang()).toBe('en');
  });

  it('honors stored language over detection', async () => {
    global.navigator = { language: 'en-US' };
    I18n = loadI18n();
    chrome.storage.local.get.mockImplementation((key, cb) =>
      cb({ settings: { language: 'vi' } })
    );
    await I18n.init();
    expect(I18n.getLang()).toBe('vi');
  });

  it('ignores invalid stored language and falls back to detection', async () => {
    global.navigator = { language: 'vi-VN' };
    I18n = loadI18n();
    chrome.storage.local.get.mockImplementation((key, cb) =>
      cb({ settings: { language: 'xx' } })
    );
    await I18n.init();
    expect(I18n.getLang()).toBe('vi');
  });

  it('setLang persists supported language', async () => {
    await I18n.init();
    chrome.storage.local.get.mockImplementation((key, cb) =>
      cb({ settings: { digestEnabled: true } })
    );
    await I18n.setLang('en');
    expect(I18n.getLang()).toBe('en');
    const call = chrome.storage.local.set.mock.calls.find((c) => c[0].settings);
    expect(call[0].settings.language).toBe('en');
    expect(call[0].settings.digestEnabled).toBe(true);
  });

  it('setLang rejects unsupported language', async () => {
    await I18n.init();
    const before = I18n.getLang();
    await I18n.setLang('xx');
    expect(I18n.getLang()).toBe(before);
  });
});

describe('I18n.t', () => {
  let I18n;

  beforeEach(() => {
    chrome.storage.local.get.mockImplementation((key, cb) => cb({}));
    chrome.storage.local.set.mockImplementation((obj, cb) => cb && cb());
    global.navigator = { language: 'vi-VN' };
    I18n = loadI18n();
  });

  it('returns VI translation by default', async () => {
    await I18n.init();
    expect(I18n.t('tab.upcoming')).toBe('Sắp tới');
  });

  it('returns EN translation after setLang', async () => {
    await I18n.init();
    await I18n.setLang('en');
    expect(I18n.t('tab.upcoming')).toBe('Upcoming');
  });

  it('interpolates parameters', async () => {
    await I18n.init();
    expect(I18n.t('notif.eventStarting', { min: 5 })).toBe('Bắt đầu sau 5 phút');
    await I18n.setLang('en');
    expect(I18n.t('notif.eventStarting', { min: 5 })).toBe('Starts in 5 min');
  });

  it('returns raw key for missing translation', async () => {
    await I18n.init();
    expect(I18n.t('totally.missing.key')).toBe('totally.missing.key');
  });
});

describe('I18n.dayLabel', () => {
  let I18n;

  beforeEach(() => {
    chrome.storage.local.get.mockImplementation((key, cb) => cb({}));
    chrome.storage.local.set.mockImplementation((obj, cb) => cb && cb());
    global.navigator = { language: 'vi-VN' };
    I18n = loadI18n();
  });

  it('returns today label for a timestamp within today', async () => {
    await I18n.init();
    const now = new Date();
    now.setHours(12, 0, 0, 0);
    expect(I18n.dayLabel(now.getTime())).toBe('HÔM NAY');
    await I18n.setLang('en');
    expect(I18n.dayLabel(now.getTime())).toBe('TODAY');
  });

  it('returns tomorrow label for a timestamp within tomorrow', async () => {
    await I18n.init();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    expect(I18n.dayLabel(tomorrow.getTime())).toBe('NGÀY MAI');
  });
});

describe('I18n.applyToDOM', () => {
  let I18n;

  beforeEach(() => {
    chrome.storage.local.get.mockImplementation((key, cb) => cb({}));
    chrome.storage.local.set.mockImplementation((obj, cb) => cb && cb());
    global.navigator = { language: 'vi-VN' };
    I18n = loadI18n();
  });

  function makeElement(attrs) {
    return {
      _attrs: attrs,
      _text: '',
      _props: {},
      getAttribute(name) { return this._attrs[name]; },
      setAttribute(name, value) { this._props[name] = value; },
      set textContent(v) { this._text = v; },
      get textContent() { return this._text; },
    };
  }

  it('replaces textContent for [data-i18n] elements', async () => {
    await I18n.init();
    const el = makeElement({ 'data-i18n': 'tab.upcoming' });
    const root = {
      querySelectorAll: (sel) => {
        if (sel === '[data-i18n]') return [el];
        return [];
      },
    };
    I18n.applyToDOM(root);
    expect(el.textContent).toBe('Sắp tới');
  });

  it('sets placeholder for [data-i18n-placeholder] elements', async () => {
    await I18n.init();
    const el = makeElement({ 'data-i18n-placeholder': 'settings.notifyBeforeInput' });
    const root = {
      querySelectorAll: (sel) => {
        if (sel === '[data-i18n-placeholder]') return [el];
        return [];
      },
    };
    I18n.applyToDOM(root);
    expect(el._props.placeholder).toBe('Nhập phút');
  });

  it('is a no-op when root has no querySelectorAll', async () => {
    await I18n.init();
    expect(() => I18n.applyToDOM(null)).not.toThrow();
    expect(() => I18n.applyToDOM({})).not.toThrow();
  });
});
