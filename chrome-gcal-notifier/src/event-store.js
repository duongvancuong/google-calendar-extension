// src/event-store.js
(function () {
  'use strict';

  const DEFAULT_SETTINGS = {
    notifyBefore: [10, 30],
    dailyDigestTime: '08:00',
    digestEnabled: true,
    apiEnabled: false,
  };

  function getEvents() {
    return new Promise((resolve) =>
      chrome.storage.local.get('events', (d) => resolve(d.events || []))
    );
  }

  function saveEvents(events) {
    return new Promise((resolve) =>
      chrome.storage.local.set({ events }, resolve)
    );
  }

  function getSettings() {
    return new Promise((resolve) =>
      chrome.storage.local.get('settings', (d) =>
        resolve(Object.assign({}, DEFAULT_SETTINGS, d.settings))
      )
    );
  }

  function saveSettings(settings) {
    return new Promise((resolve) =>
      chrome.storage.local.set({ settings }, resolve)
    );
  }

  async function markNotified(eventId, minutesBefore) {
    const events = await getEvents();
    const updated = events.map((e) =>
      e.id === eventId
        ? Object.assign({}, e, { notifiedAt: [...(e.notifiedAt || []), minutesBefore] })
        : e
    );
    return saveEvents(updated);
  }

  const EventStore = { DEFAULT_SETTINGS, getEvents, saveEvents, getSettings, saveSettings, markNotified };

  if (typeof module !== 'undefined') module.exports = EventStore;
  else globalThis.EventStore = EventStore;
})();
