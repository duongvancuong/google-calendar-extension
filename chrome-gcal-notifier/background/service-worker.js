// background/service-worker.js
importScripts(
  '../src/event-store.js',
  '../src/scheduler.js',
  '../src/notifier.js'
);

// Merge incoming scraped events with stored events, deduplicating by id.
// Preserves notifiedAt from stored version to avoid re-notifying on rescrape.
async function mergeAndSaveEvents(incoming) {
  const stored = await EventStore.getEvents();
  const storedById = {};
  for (const e of stored) storedById[e.id] = e;
  for (const e of incoming) {
    if (storedById[e.id]) {
      e.notifiedAt = storedById[e.id].notifiedAt;
    }
    storedById[e.id] = e;
  }
  const merged = Object.values(storedById);
  await EventStore.saveEvents(merged);
  return merged;
}

async function updateBadge(events) {
  const now = Date.now();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const remaining = events.filter(
    (e) => e.startTime >= now && e.startTime < endOfDay.getTime()
  );
  const count = remaining.length;
  chrome.action.setBadgeText({ text: count > 0 ? String(count) : '' });
  chrome.action.setBadgeBackgroundColor({ color: '#1a73e8' });
}

// Listen for events from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'EVENTS_SCRAPED') {
    (async () => {
      const merged = await mergeAndSaveEvents(message.events);
      const settings = await EventStore.getSettings();
      await Scheduler.scheduleAlarms(merged, settings);
      if (settings.digestEnabled) Scheduler.scheduleDailyDigest(settings.dailyDigestTime);
      await updateBadge(merged);
      sendResponse({ ok: true });
    })();
    return true; // keep message channel open for async response
  }
});

// Fire notification when alarm triggers
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'daily_digest') {
    const events = await EventStore.getEvents();
    Notifier.showDailyDigest(events);
    return;
  }

  const parsed = Scheduler.parseAlarmName(alarm.name);
  if (!parsed) return;

  const events = await EventStore.getEvents();
  const event = events.find((e) => e.id === parsed.eventId);
  if (!event) return;

  Notifier.showEventNotification(event, parsed.minutesBefore);
  await EventStore.markNotified(event.id, parsed.minutesBefore);
});

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener(async (notifId, buttonIndex) => {
  if (notifId === 'daily_digest') {
    if (buttonIndex === 0) chrome.tabs.create({ url: 'https://calendar.google.com' });
    chrome.notifications.clear(notifId);
    return;
  }

  const parsed = Scheduler.parseAlarmName(notifId);
  if (!parsed) return;

  if (buttonIndex === 0) {
    // Snooze: re-notify after 5 minutes, store snooze metadata
    const events = await EventStore.getEvents();
    const event = events.find((e) => e.id === parsed.eventId);
    if (event) {
      const snoozedData = await new Promise((r) => chrome.storage.local.get('snoozed', r));
      const snoozedList = snoozedData.snoozed || [];
      const snoozeTs = Date.now();
      snoozedList.push({ eventId: parsed.eventId, minutesBefore: parsed.minutesBefore, at: snoozeTs });
      chrome.storage.local.set({ snoozed: snoozedList });
      chrome.alarms.create(`snooze_${parsed.eventId}_${snoozeTs}`, {
        when: Date.now() + 5 * 60 * 1000,
      });
    }
  } else if (buttonIndex === 1) {
    chrome.tabs.create({ url: 'https://calendar.google.com' });
  }
  chrome.notifications.clear(notifId);
});

// Handle snooze alarms
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (!alarm.name.startsWith('snooze_')) return;
  // alarm name format: snooze_<eventId>_<timestamp>
  const parts = alarm.name.split('_');
  const ts = parts[parts.length - 1];
  const eventId = parts.slice(1, -1).join('_');

  const snoozedData = await new Promise((r) => chrome.storage.local.get('snoozed', r));
  const entry = (snoozedData.snoozed || []).find(
    (s) => s.eventId === eventId && String(s.at) === ts
  );
  if (!entry) return;

  const events = await EventStore.getEvents();
  const event = events.find((e) => e.id === eventId);
  if (event) Notifier.showEventNotification(event, entry.minutesBefore);

  const updated = (snoozedData.snoozed || []).filter(
    (s) => !(s.eventId === eventId && String(s.at) === ts)
  );
  chrome.storage.local.set({ snoozed: updated });
});
