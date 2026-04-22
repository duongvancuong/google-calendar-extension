// tests/event-store.test.js
const EventStore = require('../src/event-store');

describe('EventStore.getEvents', () => {
  it('returns empty array when storage is empty', async () => {
    chrome.storage.local.get.mockImplementation((key, cb) => cb({}));
    const events = await EventStore.getEvents();
    expect(events).toEqual([]);
  });

  it('returns stored events', async () => {
    const stored = [{ id: 'e1', title: 'Standup', startTime: 1000 }];
    chrome.storage.local.get.mockImplementation((key, cb) => cb({ events: stored }));
    const events = await EventStore.getEvents();
    expect(events).toEqual(stored);
  });
});

describe('EventStore.saveEvents', () => {
  it('calls chrome.storage.local.set with events key', async () => {
    chrome.storage.local.set.mockImplementation((obj, cb) => cb());
    const events = [{ id: 'e1', title: 'Standup', startTime: 1000 }];
    await EventStore.saveEvents(events);
    expect(chrome.storage.local.set).toHaveBeenCalledWith({ events }, expect.any(Function));
  });
});

describe('EventStore.getSettings', () => {
  it('returns defaults when no settings stored', async () => {
    chrome.storage.local.get.mockImplementation((key, cb) => cb({}));
    const settings = await EventStore.getSettings();
    expect(settings.notifyBefore).toEqual([10, 30]);
    expect(settings.digestEnabled).toBe(true);
    expect(settings.apiEnabled).toBe(false);
  });

  it('merges stored settings with defaults', async () => {
    chrome.storage.local.get.mockImplementation((key, cb) =>
      cb({ settings: { notifyBefore: [5] } })
    );
    const settings = await EventStore.getSettings();
    expect(settings.notifyBefore).toEqual([5]);
    expect(settings.digestEnabled).toBe(true);
  });
});

describe('EventStore.markNotified', () => {
  it('appends minutesBefore to event.notifiedAt without mutating original', async () => {
    const stored = [{ id: 'e1', title: 'Meeting', startTime: 1000, notifiedAt: [] }];
    chrome.storage.local.get.mockImplementation((key, cb) => cb({ events: stored }));
    chrome.storage.local.set.mockImplementation((obj, cb) => cb());

    await EventStore.markNotified('e1', 10);

    const saved = chrome.storage.local.set.mock.calls[0][0].events;
    expect(saved[0].notifiedAt).toContain(10);
    expect(stored[0].notifiedAt).toEqual([]);  // original not mutated
  });
});
