// tests/notifier.test.js
const Notifier = require('../src/notifier');

describe('Notifier.fmtTime', () => {
  it('formats timestamp to HH:MM', () => {
    const ts = new Date('2026-04-21T14:30:00').getTime();
    expect(Notifier.fmtTime(ts)).toMatch(/14:30/);
  });
});

describe('Notifier.showEventNotification', () => {
  it('calls chrome.notifications.create with correct structure', () => {
    chrome.notifications.create.mockImplementation(() => {});
    const event = {
      id: 'e1',
      title: 'Standup',
      startTime: Date.now() + 600000,
      endTime: Date.now() + 1500000,
    };
    const id = Notifier.showEventNotification(event, 10);
    expect(chrome.notifications.create).toHaveBeenCalledTimes(1);
    const [notifId, options] = chrome.notifications.create.mock.calls[0];
    expect(notifId).toBe('event_e1_10before');
    expect(options.title).toBe('Standup');
    expect(options.message).toBe('Bắt đầu sau 10 phút');
    expect(options.buttons).toHaveLength(3);
    expect(options.buttons[0].title).toBe('Snooze 5p');
  });
});

describe('Notifier.showDailyDigest', () => {
  it('does not create notification when no events today', () => {
    chrome.notifications.create.mockImplementation(() => {});
    const yesterday = Date.now() - 24 * 60 * 60 * 1000;
    Notifier.showDailyDigest([
      { id: 'e1', title: 'Old', startTime: yesterday, endTime: yesterday + 3600000 },
    ]);
    expect(chrome.notifications.create).not.toHaveBeenCalled();
  });

  it('creates digest notification for today events', () => {
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
  });
});
