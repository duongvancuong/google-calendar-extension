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
});
