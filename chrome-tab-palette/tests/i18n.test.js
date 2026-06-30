function loadI18n() {
  delete require.cache[require.resolve('../src/i18n')];
  return require('../src/i18n');
}

describe('I18n', () => {
  it('returns the VI string by default and EN after setLang', async () => {
    const I18n = loadI18n();
    chrome.storage.local.set.mockImplementation((obj, cb) => cb && cb());
    expect(I18n.SUPPORTED).toEqual(['vi', 'en']);

    I18n._setLangSync('vi');
    expect(I18n.t('search.placeholder')).toMatch(/tìm|Tìm/);

    await I18n.setLang('en');
    expect(I18n.getLang()).toBe('en');
    expect(I18n.t('search.placeholder')).toMatch(/search|Search/i);
  });

  it('returns the key itself for an unknown translation', () => {
    const I18n = loadI18n();
    expect(I18n.t('does.not.exist')).toBe('does.not.exist');
  });

  it('detectDefaultLang returns vi when navigator.language starts with vi', () => {
    const I18n = loadI18n();
    const origNavigator = global.navigator;
    Object.defineProperty(global, 'navigator', {
      value: { language: 'vi-VN' },
      configurable: true,
      writable: true,
    });
    expect(I18n.detectDefaultLang()).toBe('vi');
    Object.defineProperty(global, 'navigator', {
      value: origNavigator,
      configurable: true,
      writable: true,
    });
  });

  it('detectDefaultLang returns en for non-vi navigator language', () => {
    const I18n = loadI18n();
    const origNavigator = global.navigator;
    Object.defineProperty(global, 'navigator', {
      value: { language: 'en-US' },
      configurable: true,
      writable: true,
    });
    expect(I18n.detectDefaultLang()).toBe('en');
    Object.defineProperty(global, 'navigator', {
      value: origNavigator,
      configurable: true,
      writable: true,
    });
  });

  it('init reads lang from chrome.storage.local and applies it', async () => {
    const I18n = loadI18n();
    chrome.storage.local.get.mockImplementation((key, cb) => cb({ lang: 'en' }));
    await I18n.init();
    expect(I18n.getLang()).toBe('en');
  });

  it('init falls back to detectDefaultLang when storage returns no lang', async () => {
    const I18n = loadI18n();
    chrome.storage.local.get.mockImplementation((key, cb) => cb({}));
    await I18n.init();
    // detectDefaultLang returns 'en' in node (no navigator.language starting with vi)
    expect(I18n.getLang()).toBe('en');
  });

  it('applyToDOM sets textContent for data-i18n elements', () => {
    const I18n = loadI18n();
    I18n._setLangSync('en');
    const elements = [
      { getAttribute: () => 'hint.nav', textContent: '' },
      { getAttribute: () => 'hint.jump', textContent: '' },
    ];
    const placeholderEls = [
      { getAttribute: () => 'search.placeholder', setAttribute: jest.fn() },
    ];
    const root = {
      querySelectorAll: jest.fn((selector) => {
        if (selector === '[data-i18n]') return elements;
        if (selector === '[data-i18n-placeholder]') return placeholderEls;
        return [];
      }),
    };
    I18n.applyToDOM(root);
    expect(elements[0].textContent).toBe('↑↓ move');
    expect(elements[1].textContent).toBe('⏎ switch');
    expect(placeholderEls[0].setAttribute).toHaveBeenCalledWith('placeholder', 'Search tabs…');
  });

  it('applyToDOM does nothing when scope is null', () => {
    const I18n = loadI18n();
    // Pass null — should not throw
    expect(() => I18n.applyToDOM(null)).not.toThrow();
  });
});
