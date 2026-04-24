// tests/notifier.test.js
const I18n = require('../src/i18n');

function loadNotifier() {
  delete require.cache[require.resolve('../src/notifier')];
  return require('../src/notifier');
}

describe('Notifier.fmtTime', () => {
  it('formats timestamp to HH:MM', () => {
    const Notifier = loadNotifier();
    const ts = new Date('2026-04-21T14:30:00').getTime();
    expect(Notifier.fmtTime(ts)).toMatch(/14:30/);
  });
});

describe('Notifier.showEventNotification', () => {
  beforeEach(() => {
    chrome.storage.local.get.mockImplementation((key, cb) => cb({}));
    chrome.storage.local.set.mockImplementation((obj, cb) => cb && cb());
  });

  it('uses VI strings when language is vi', async () => {
    global.navigator = { language: 'vi-VN' };
    delete require.cache[require.resolve('../src/i18n')];
    const I18nVi = require('../src/i18n');
    await I18nVi.init();
    await I18nVi.setLang('vi');

    chrome.notifications.create.mockImplementation(() => {});
    const Notifier = loadNotifier();

    const event = {
      id: 'e1',
      title: 'Standup',
      startTime: Date.now() + 600000,
      endTime: Date.now() + 1500000,
    };
    const id = Notifier.showEventNotification(event, 10);
    expect(id).toBe('event_e1_10before');
    const options = chrome.notifications.create.mock.calls[0][1];
    expect(options.title).toBe('Standup');
    expect(options.message).toBe('Bắt đầu sau 10 phút');
    expect(options.buttons).toHaveLength(2);
    expect(options.buttons[0].title).toBe('Hoãn 5p');
    expect(options.buttons[1].title).toBe('Mở Calendar');
  });

  it('uses EN strings when language is en', async () => {
    global.navigator = { language: 'en-US' };
    delete require.cache[require.resolve('../src/i18n')];
    const I18nEn = require('../src/i18n');
    await I18nEn.init();
    await I18nEn.setLang('en');

    chrome.notifications.create.mockImplementation(() => {});
    const Notifier = loadNotifier();

    const event = {
      id: 'e2',
      title: 'Standup',
      startTime: Date.now() + 600000,
      endTime: Date.now() + 1500000,
    };
    Notifier.showEventNotification(event, 5);
    const options = chrome.notifications.create.mock.calls[0][1];
    expect(options.message).toBe('Starts in 5 min');
    expect(options.buttons[0].title).toBe('Snooze 5m');
    expect(options.buttons[1].title).toBe('Open Calendar');
  });
});

describe('Notifier.showDailyDigest', () => {
  beforeEach(async () => {
    chrome.storage.local.get.mockImplementation((key, cb) => cb({}));
    chrome.storage.local.set.mockImplementation((obj, cb) => cb && cb());
    global.navigator = { language: 'vi-VN' };
    delete require.cache[require.resolve('../src/i18n')];
    const I18nVi = require('../src/i18n');
    await I18nVi.init();
    await I18nVi.setLang('vi');
  });

  it('does not create notification when no events today', () => {
    const Notifier = loadNotifier();
    chrome.notifications.create.mockImplementation(() => {});
    const yesterday = Date.now() - 24 * 60 * 60 * 1000;
    Notifier.showDailyDigest([
      { id: 'e1', title: 'Old', startTime: yesterday, endTime: yesterday + 3600000 },
    ]);
    expect(chrome.notifications.create).not.toHaveBeenCalled();
  });

  it('creates digest notification for today events', () => {
    const Notifier = loadNotifier();
    chrome.notifications.create.mockImplementation(() => {});
    const noon = new Date();
    noon.setHours(12, 0, 0, 0);
    Notifier.showDailyDigest([
      { id: 'e1', title: 'Lunch', startTime: noon.getTime(), endTime: noon.getTime() + 3600000 },
    ]);
    expect(chrome.notifications.create).toHaveBeenCalledWith(
      'daily_digest',
      expect.objectContaining({ message: expect.stringContaining('Lunch') })
    );
    const options = chrome.notifications.create.mock.calls[0][1];
    expect(options.title).toContain('Lịch hôm nay');
    expect(options.buttons[0].title).toBe('Xem chi tiết');
  });
});
