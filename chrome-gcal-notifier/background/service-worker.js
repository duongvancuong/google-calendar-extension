// background/service-worker.js
importScripts(
  '../src/event-store.js',
  '../src/scheduler.js',
  '../src/notifier.js'
);

// Merge incoming scraped events with stored events, deduplicating by id.
// Preserves notifiedAt from stored version to avoid re-notifying on rescrape.
// Prunes events that ended more than 1 hour ago to keep storage clean.
async function mergeAndSaveEvents(incoming) {
  const [stored, allAlarms] = await Promise.all([
    EventStore.getEvents(),
    new Promise((r) => chrome.alarms.getAll(r)),
  ]);

  // Events with pending alarms must never be pruned even if endTime looks wrong.
  const alarmedIds = new Set(
    allAlarms.map((a) => Scheduler.parseAlarmName(a.name)?.eventId).filter(Boolean)
  );

  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
  const cutoff = startOfToday.getTime();
  const storedById = {};
  for (const e of stored) {
    if (e.endTime >= cutoff || alarmedIds.has(e.id)) storedById[e.id] = e;
  }
  for (const e of incoming) {
    storedById[e.id] = storedById[e.id]
      ? Object.assign({}, e, { notifiedAt: storedById[e.id].notifiedAt })
      : Object.assign({}, e);
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

// Listen for events from content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'DEBUG_NOTIFY') {
    chrome.notifications.create('debug_test_sw', {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon48.png'),
      title: 'Test (service worker)',
      message: 'Gọi từ service worker context.',
    }, (id) => {
      console.log('[gcal] debug notify created, id=', id, 'lastError=', chrome.runtime.lastError);
    });
    return;
  }

  if (message.type === 'SEND_DIGEST_NOW') {
    (async () => {
      const events = await EventStore.getEvents();
      Notifier.showDailyDigest(events);
    })();
    return;
  }

  if (message.type === 'UPDATE_MEET_LINK') {
    (async () => {
      const data = await new Promise((r) => chrome.storage.local.get('meetLinks', r));
      const meetLinks = Object.assign({}, data.meetLinks, { [message.eventId]: message.meetLink });
      await new Promise((r) => chrome.storage.local.set({ meetLinks }, r));
    })();
    return;
  }

  if (message.type === 'EVENTS_SCRAPED') {
    (async () => {
      const merged = await mergeAndSaveEvents(message.events);
      const settings = await EventStore.getSettings();
      await Scheduler.scheduleAlarms(merged, settings);

      // Fire notifications immediately for events whose alarm time just passed
      const immediate = Scheduler.computeImmediateNotifications(merged, settings, Date.now());
      for (const { event, minutesBefore } of immediate) {
        Notifier.showEventNotification(event, minutesBefore);
        await EventStore.markNotified(event.id, minutesBefore);
      }
      if (settings.digestEnabled) {
        chrome.alarms.get('daily_digest', (existing) => {
          if (!existing) Scheduler.scheduleDailyDigest(settings.dailyDigestTime);
        });
      }
      await updateBadge(merged);
      sendResponse({ ok: true });
    })();
    return true; // keep message channel open for async response
  }
});

// Fire notification when alarm triggers (single consolidated listener)
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'daily_digest') {
    const events = await EventStore.getEvents();
    Notifier.showDailyDigest(events);
    return;
  }

  if (alarm.name.startsWith('snooze_')) {
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
    return;
  }

  const parsed = Scheduler.parseAlarmName(alarm.name);
  console.log('[gcal] alarm fired', alarm.name, 'parsed:', parsed);
  if (!parsed) return;

  const events = await EventStore.getEvents();
  const event = events.find((e) => e.id === parsed.eventId);
  console.log('[gcal] event found:', event?.title ?? 'NOT FOUND');
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
        when: snoozeTs + 5 * 60 * 1000,
      });
    }
  } else if (buttonIndex === 1) {
    chrome.tabs.create({ url: 'https://calendar.google.com' });
  }
  chrome.notifications.clear(notifId);
});

