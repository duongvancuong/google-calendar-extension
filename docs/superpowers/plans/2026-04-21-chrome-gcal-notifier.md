# Chrome Google Calendar Notifier — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Chrome extension (Manifest V3) that scrapes Google Calendar events and delivers desktop notifications with quick actions, toolbar badge, daily digest, and a 3-tab popup UI.

**Architecture:** Content script monitors `calendar.google.com` DOM via MutationObserver and sends parsed events to a service worker; the service worker stores events in `chrome.storage.local`, schedules `chrome.alarms` for each configured notification window, and fires `chrome.notifications` with Snooze/Open/Dismiss actions. A stub `calendar-api.js` is included for future Google Calendar API integration.

**Tech Stack:** Chrome Manifest V3, Service Worker (classic, importScripts), Vanilla JS IIFE pattern (no bundler), Jest for unit tests, `chrome.storage.local`, `chrome.alarms`, `chrome.notifications`

---

## File Map

| File | Responsibility |
|---|---|
| `manifest.json` | Extension metadata, permissions, entry points |
| `background/service-worker.js` | Alarm listener, notification dispatch, message handler, badge updater |
| `content/calendar-scraper.js` | DOM scraping + MutationObserver → sends events to service worker |
| `src/event-store.js` | `chrome.storage.local` CRUD for events and settings |
| `src/scheduler.js` | Alarm computation and scheduling logic |
| `src/notifier.js` | Notification creation + button action handling |
| `src/calendar-api.js` | Future Google Calendar API stub (disabled by default) |
| `popup/popup.html` | 3-tab shell |
| `popup/popup.js` | Tab navigation + render logic for all 3 tabs |
| `popup/popup.css` | Layout + styles |
| `icons/icon.svg` | Source SVG icon |
| `icons/icon48.png` | 48×48 PNG (generated from SVG) |
| `icons/icon128.png` | 128×128 PNG (generated from SVG) |
| `tests/setup.js` | Global `chrome` API mock for Jest |
| `tests/event-store.test.js` | Unit tests for EventStore |
| `tests/scheduler.test.js` | Unit tests for Scheduler |
| `tests/notifier.test.js` | Unit tests for Notifier |
| `package.json` | Jest dev dependency |

---

## Task 1: Project scaffolding

**Files:**
- Create: `manifest.json`
- Create: `package.json`
- Create: `jest.config.js`
- Create: `background/service-worker.js` (empty stub)
- Create: `content/calendar-scraper.js` (empty stub)
- Create: `src/event-store.js` (empty stub)
- Create: `src/scheduler.js` (empty stub)
- Create: `src/notifier.js` (empty stub)
- Create: `src/calendar-api.js` (empty stub)
- Create: `popup/popup.html` (empty stub)
- Create: `popup/popup.js` (empty stub)
- Create: `popup/popup.css` (empty stub)
- Create: `tests/setup.js` (empty stub)
- Create: `icons/` directory

- [ ] **Step 1: Create folder structure**

```bash
mkdir -p background content src popup icons tests
```

- [ ] **Step 2: Create manifest.json**

```json
{
  "manifest_version": 3,
  "name": "Google Calendar Notifier",
  "version": "1.0.0",
  "description": "Desktop notifications for Google Calendar events",
  "permissions": ["notifications", "storage", "alarms", "tabs"],
  "host_permissions": ["https://calendar.google.com/*"],
  "background": {
    "service_worker": "background/service-worker.js"
  },
  "content_scripts": [
    {
      "matches": ["https://calendar.google.com/*"],
      "js": ["content/calendar-scraper.js"],
      "run_at": "document_idle"
    }
  ],
  "action": {
    "default_popup": "popup/popup.html",
    "default_title": "Google Calendar Notifier",
    "default_icon": {
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

- [ ] **Step 3: Create package.json**

```json
{
  "name": "chrome-gcal-notifier",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "test": "jest"
  },
  "devDependencies": {
    "jest": "^29.7.0"
  }
}
```

- [ ] **Step 4: Create jest.config.js**

```js
module.exports = {
  testEnvironment: 'node',
  setupFiles: ['./tests/setup.js'],
  testMatch: ['**/tests/**/*.test.js'],
};
```

- [ ] **Step 5: Create empty stubs for all source files**

```bash
touch background/service-worker.js content/calendar-scraper.js \
      src/event-store.js src/scheduler.js src/notifier.js src/calendar-api.js \
      popup/popup.html popup/popup.js popup/popup.css tests/setup.js
```

- [ ] **Step 6: Install dependencies**

```bash
npm install
```

Expected output: `added N packages` with no errors.

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "chore: scaffold Chrome extension project structure"
```

---

## Task 2: Chrome API mock for Jest

**Files:**
- Modify: `tests/setup.js`

- [ ] **Step 1: Write chrome mock**

```js
// tests/setup.js
global.chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
    },
  },
  alarms: {
    create: jest.fn(),
    clear: jest.fn(),
    clearAll: jest.fn(),
    getAll: jest.fn(),
  },
  notifications: {
    create: jest.fn(),
    clear: jest.fn(),
  },
  tabs: {
    create: jest.fn(),
  },
  runtime: {
    sendMessage: jest.fn(),
    onMessage: { addListener: jest.fn() },
  },
  action: {
    setBadgeText: jest.fn(),
    setBadgeBackgroundColor: jest.fn(),
  },
};

beforeEach(() => {
  jest.clearAllMocks();
});
```

- [ ] **Step 2: Verify Jest can load the setup**

```bash
npx jest --listTests
```

Expected output: lists `tests/` directory (no errors loading setup.js).

- [ ] **Step 3: Commit**

```bash
git add tests/setup.js jest.config.js
git commit -m "test: add Chrome API mock setup for Jest"
```

---

## Task 3: EventStore — TDD

**Files:**
- Create: `tests/event-store.test.js`
- Modify: `src/event-store.js`

- [ ] **Step 1: Write failing tests**

```js
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
```

- [ ] **Step 2: Run tests — expect all to FAIL**

```bash
npx jest tests/event-store.test.js --verbose
```

Expected: `FAIL — Cannot read properties of undefined (reading 'getEvents')`

- [ ] **Step 3: Implement event-store.js**

```js
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
```

- [ ] **Step 4: Run tests — expect all to PASS**

```bash
npx jest tests/event-store.test.js --verbose
```

Expected: `PASS — 6 passing tests`

- [ ] **Step 5: Commit**

```bash
git add src/event-store.js tests/event-store.test.js
git commit -m "feat: implement EventStore with chrome.storage.local"
```

---

## Task 4: Scheduler — TDD

**Files:**
- Create: `tests/scheduler.test.js`
- Modify: `src/scheduler.js`

- [ ] **Step 1: Write failing tests**

```js
// tests/scheduler.test.js
const Scheduler = require('../src/scheduler');

const baseSettings = { notifyBefore: [10, 30] };

describe('Scheduler.computePendingAlarms', () => {
  it('creates alarms for each notifyBefore window', () => {
    const now = 1000000;
    const events = [{ id: 'e1', title: 'Meeting', startTime: now + 20 * 60 * 1000, notifiedAt: [] }];
    const alarms = Scheduler.computePendingAlarms(events, baseSettings, now);
    expect(alarms).toHaveLength(1); // only 10-min alarm fits (30-min is in the past)
    expect(alarms[0].name).toBe('event_e1_10before');
    expect(alarms[0].minutesBefore).toBe(10);
  });

  it('skips alarms that are already in the past', () => {
    const now = 1000000;
    const events = [{ id: 'e1', title: 'Meeting', startTime: now + 5 * 60 * 1000, notifiedAt: [] }];
    const alarms = Scheduler.computePendingAlarms(events, baseSettings, now);
    expect(alarms).toHaveLength(0);
  });

  it('skips alarms already notified', () => {
    const now = 1000000;
    const events = [{
      id: 'e1', title: 'Meeting',
      startTime: now + 20 * 60 * 1000,
      notifiedAt: [10],
    }];
    const alarms = Scheduler.computePendingAlarms(events, baseSettings, now);
    expect(alarms).toHaveLength(0);
  });
});

describe('Scheduler.parseAlarmName', () => {
  it('parses valid alarm name', () => {
    expect(Scheduler.parseAlarmName('event_e1_10before')).toEqual({ eventId: 'e1', minutesBefore: 10 });
  });

  it('returns null for non-event alarms', () => {
    expect(Scheduler.parseAlarmName('daily_digest')).toBeNull();
  });

  it('handles event IDs with underscores', () => {
    const result = Scheduler.parseAlarmName('event_abc_xyz_30before');
    expect(result).toEqual({ eventId: 'abc_xyz', minutesBefore: 30 });
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npx jest tests/scheduler.test.js --verbose
```

Expected: `FAIL — Cannot read properties of undefined`

- [ ] **Step 3: Implement scheduler.js**

```js
// src/scheduler.js
(function () {
  'use strict';

  function computePendingAlarms(events, settings, now) {
    const result = [];
    for (const event of events) {
      for (const minutes of settings.notifyBefore) {
        const when = event.startTime - minutes * 60 * 1000;
        if (when > now && !(event.notifiedAt || []).includes(minutes)) {
          result.push({
            name: `event_${event.id}_${minutes}before`,
            when,
            event,
            minutesBefore: minutes,
          });
        }
      }
    }
    return result;
  }

  async function scheduleAlarms(events, settings) {
    const now = Date.now();
    const pending = computePendingAlarms(events, settings, now);
    const existing = await new Promise((r) => chrome.alarms.getAll(r));
    const existingNames = new Set(existing.map((a) => a.name));
    for (const alarm of pending) {
      if (!existingNames.has(alarm.name)) {
        chrome.alarms.create(alarm.name, { when: alarm.when });
      }
    }
  }

  function scheduleDailyDigest(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    const next = new Date();
    next.setHours(h, m, 0, 0);
    if (next.getTime() <= Date.now()) next.setDate(next.getDate() + 1);
    chrome.alarms.create('daily_digest', { when: next.getTime(), periodInMinutes: 1440 });
  }

  function parseAlarmName(name) {
    const match = name.match(/^event_(.+)_(\d+)before$/);
    if (!match) return null;
    return { eventId: match[1], minutesBefore: parseInt(match[2], 10) };
  }

  const Scheduler = { computePendingAlarms, scheduleAlarms, scheduleDailyDigest, parseAlarmName };

  if (typeof module !== 'undefined') module.exports = Scheduler;
  else globalThis.Scheduler = Scheduler;
})();
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npx jest tests/scheduler.test.js --verbose
```

Expected: `PASS — 5 passing tests`

- [ ] **Step 5: Commit**

```bash
git add src/scheduler.js tests/scheduler.test.js
git commit -m "feat: implement Scheduler with alarm computation"
```

---

## Task 5: Notifier — TDD

**Files:**
- Create: `tests/notifier.test.js`
- Modify: `src/notifier.js`

- [ ] **Step 1: Write failing tests**

```js
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
    const event = { id: 'e1', title: 'Standup', startTime: Date.now() + 600000, endTime: Date.now() + 1500000 };
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
    Notifier.showDailyDigest([{ id: 'e1', title: 'Old', startTime: yesterday, endTime: yesterday + 3600000 }]);
    expect(chrome.notifications.create).not.toHaveBeenCalled();
  });

  it('creates digest notification for today events', () => {
    chrome.notifications.create.mockImplementation(() => {});
    const noon = new Date();
    noon.setHours(12, 0, 0, 0);
    Notifier.showDailyDigest([{ id: 'e1', title: 'Lunch', startTime: noon.getTime(), endTime: noon.getTime() + 3600000 }]);
    expect(chrome.notifications.create).toHaveBeenCalledWith(
      'daily_digest',
      expect.objectContaining({ message: expect.stringContaining('Lunch') })
    );
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npx jest tests/notifier.test.js --verbose
```

Expected: `FAIL — Cannot read properties of undefined`

- [ ] **Step 3: Implement notifier.js**

```js
// src/notifier.js
(function () {
  'use strict';

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function fmtTime(ts) {
    const d = new Date(ts);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function fmtDate(d) {
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return `${days[d.getDay()]} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
  }

  function showEventNotification(event, minutesBefore) {
    const notifId = `event_${event.id}_${minutesBefore}before`;
    chrome.notifications.create(notifId, {
      type: 'basic',
      iconUrl: '../icons/icon48.png',
      title: event.title,
      message: `Bắt đầu sau ${minutesBefore} phút`,
      contextMessage: `${fmtTime(event.startTime)} – ${fmtTime(event.endTime)}`,
      buttons: [
        { title: 'Snooze 5p' },
        { title: 'Mở Calendar' },
        { title: 'Đã biết' },
      ],
      requireInteraction: true,
    });
    return notifId;
  }

  function showDailyDigest(events) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const todayEvents = events
      .filter((e) => e.startTime >= startOfDay.getTime() && e.startTime < endOfDay.getTime())
      .sort((a, b) => a.startTime - b.startTime);

    if (todayEvents.length === 0) return;

    const message = todayEvents.map((e) => `• ${fmtTime(e.startTime)} ${e.title}`).join('\n');
    chrome.notifications.create('daily_digest', {
      type: 'basic',
      iconUrl: '../icons/icon48.png',
      title: `Lịch hôm nay — ${fmtDate(new Date())}`,
      message,
      buttons: [{ title: 'Xem chi tiết' }],
    });
  }

  const Notifier = { showEventNotification, showDailyDigest, fmtTime, fmtDate };

  if (typeof module !== 'undefined') module.exports = Notifier;
  else globalThis.Notifier = Notifier;
})();
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npx jest tests/notifier.test.js --verbose
```

Expected: `PASS — 4 passing tests`

- [ ] **Step 5: Run all tests together**

```bash
npx jest --verbose
```

Expected: `PASS — all 15 tests passing`

- [ ] **Step 6: Commit**

```bash
git add src/notifier.js tests/notifier.test.js
git commit -m "feat: implement Notifier with event and digest notifications"
```

---

## Task 6: Calendar API stub

**Files:**
- Modify: `src/calendar-api.js`

- [ ] **Step 1: Write stub**

```js
// src/calendar-api.js
(function () {
  'use strict';

  // Stub for future Google Calendar API integration.
  // Enable by setting settings.apiEnabled = true and providing OAuth credentials
  // via chrome.identity.getAuthToken after setting up a Google Cloud project.

  async function fetchEvents() {
    throw new Error('Calendar API not yet configured. Set apiEnabled=false to use scraping.');
  }

  const CalendarAPI = { fetchEvents };

  if (typeof module !== 'undefined') module.exports = CalendarAPI;
  else globalThis.CalendarAPI = CalendarAPI;
})();
```

- [ ] **Step 2: Commit**

```bash
git add src/calendar-api.js
git commit -m "feat: add Calendar API stub for future integration"
```

---

## Task 7: Service Worker

**Files:**
- Modify: `background/service-worker.js`

- [ ] **Step 1: Implement service-worker.js**

```js
// background/service-worker.js
importScripts(
  '../src/event-store.js',
  '../src/scheduler.js',
  '../src/notifier.js'
);

// Merge incoming scraped events with stored events, deduplicating by id
async function mergeAndSaveEvents(incoming) {
  const stored = await EventStore.getEvents();
  const storedById = {};
  for (const e of stored) storedById[e.id] = e;
  for (const e of incoming) {
    // Preserve notifiedAt from stored version to avoid re-notifying
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
    return true; // async response
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
    // Snooze 5 minutes
    chrome.alarms.create(`snooze_${parsed.eventId}_${Date.now()}`, {
      when: Date.now() + 5 * 60 * 1000,
    });
    // Store snooze metadata so the alarm handler can re-notify
    const events = await EventStore.getEvents();
    const event = events.find((e) => e.id === parsed.eventId);
    if (event) {
      // We create a temporary alarm name that the handler won't parse as a regular event alarm
      // Instead, store the snooze in a separate key
      const snoozed = await new Promise((r) => chrome.storage.local.get('snoozed', r));
      const snoozedList = snoozed.snoozed || [];
      snoozedList.push({ eventId: parsed.eventId, minutesBefore: parsed.minutesBefore, at: Date.now() });
      chrome.storage.local.set({ snoozed: snoozedList });
    }
  } else if (buttonIndex === 1) {
    chrome.tabs.create({ url: 'https://calendar.google.com' });
  }
  // buttonIndex 2 = "Đã biết" — just close (already handled by marking notified)
  chrome.notifications.clear(notifId);
});

// Handle snooze alarms
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (!alarm.name.startsWith('snooze_')) return;
  // Extract eventId from snooze alarm name: snooze_<eventId>_<timestamp>
  const parts = alarm.name.split('_');
  const ts = parts[parts.length - 1];
  const eventId = parts.slice(1, -1).join('_');

  const snoozed = await new Promise((r) => chrome.storage.local.get('snoozed', r));
  const entry = (snoozed.snoozed || []).find(
    (s) => s.eventId === eventId && String(s.at) === ts
  );
  if (!entry) return;

  const events = await EventStore.getEvents();
  const event = events.find((e) => e.id === eventId);
  if (event) Notifier.showEventNotification(event, entry.minutesBefore);

  // Remove from snoozed list
  const updated = (snoozed.snoozed || []).filter((s) => !(s.eventId === eventId && String(s.at) === ts));
  chrome.storage.local.set({ snoozed: updated });
});
```

- [ ] **Step 2: Commit**

```bash
git add background/service-worker.js
git commit -m "feat: implement service worker with alarm/notification/message handling"
```

---

## Task 8: Content Script Scraper

**Files:**
- Modify: `content/calendar-scraper.js`

- [ ] **Step 1: Implement calendar-scraper.js**

```js
// content/calendar-scraper.js

// NOTE: Google Calendar's DOM uses obfuscated class names that may change.
// The selectors below target stable attributes (data-eventid, aria-label).
// If scraping stops working, inspect calendar.google.com and update selectors.

(function () {
  'use strict';

  function hashString(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  function parseTimeFromAriaLabel(label) {
    // aria-label examples (Google Calendar):
    // "Standup, Monday April 21, 9:00 AM – 9:15 AM"
    // "Meeting, 2:00 PM – 3:00 PM"
    const timePattern = /(\d{1,2}:\d{2}\s*[AP]M)\s*[–\-]\s*(\d{1,2}:\d{2}\s*[AP]M)/i;
    const datePattern = /(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+([A-Z][a-z]+ \d{1,2}(?:,\s*\d{4})?)/i;

    const timeMatch = label.match(timePattern);
    if (!timeMatch) return null;

    const now = new Date();
    const dateMatch = label.match(datePattern);
    let dateStr = dateMatch
      ? dateMatch[1] + (dateMatch[1].includes(',') ? '' : `, ${now.getFullYear()}`)
      : `${now.toLocaleString('en-US', { month: 'long' })} ${now.getDate()}, ${now.getFullYear()}`;

    const startTime = new Date(`${dateStr} ${timeMatch[1]}`).getTime();
    const endTime = new Date(`${dateStr} ${timeMatch[2]}`).getTime();

    if (isNaN(startTime) || isNaN(endTime)) return null;
    return { startTime, endTime };
  }

  function extractMeetLink(el) {
    const links = el.querySelectorAll('a[href*="meet.google.com"]');
    return links.length > 0 ? links[0].href : null;
  }

  function scrapeEvents() {
    // Target event chip elements — try multiple selectors for resilience
    const candidates = [
      ...document.querySelectorAll('[data-eventid]'),
      ...document.querySelectorAll('[data-eventchip-views]'),
    ];

    // Dedup by element reference
    const seen = new Set();
    const unique = candidates.filter((el) => {
      if (seen.has(el)) return false;
      seen.add(el);
      return true;
    });

    const events = [];
    for (const el of unique) {
      const ariaLabel = el.getAttribute('aria-label') || '';
      if (!ariaLabel) continue;

      const times = parseTimeFromAriaLabel(ariaLabel);
      if (!times) continue;

      // Title: first comma-separated segment of aria-label
      const title = ariaLabel.split(',')[0].trim();
      if (!title) continue;

      const id = `gcal_${hashString(title + times.startTime)}`;
      events.push({
        id,
        title,
        startTime: times.startTime,
        endTime: times.endTime,
        location: null,
        meetLink: extractMeetLink(el),
        calendarName: 'Google Calendar',
        notifiedAt: [],
        source: 'scrape',
      });
    }
    return events;
  }

  function sendEvents(events) {
    if (events.length === 0) return;
    chrome.runtime.sendMessage({ type: 'EVENTS_SCRAPED', events });
  }

  // Initial scrape after page load
  setTimeout(() => sendEvents(scrapeEvents()), 2000);

  // Watch for SPA navigation — Calendar re-renders on week/month change
  let debounceTimer = null;
  const observer = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => sendEvents(scrapeEvents()), 1500);
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
```

- [ ] **Step 2: Commit**

```bash
git add content/calendar-scraper.js
git commit -m "feat: implement calendar DOM scraper with MutationObserver"
```

---

## Task 9: Icons

**Files:**
- Create: `icons/icon.svg`

- [ ] **Step 1: Create SVG icon**

```svg
<!-- icons/icon.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
  <rect x="4" y="8" width="40" height="36" rx="4" fill="#1a73e8"/>
  <rect x="4" y="8" width="40" height="12" rx="4" fill="#1557b0"/>
  <rect x="12" y="4" width="4" height="8" rx="2" fill="#fff"/>
  <rect x="32" y="4" width="4" height="8" rx="2" fill="#fff"/>
  <text x="24" y="36" font-family="Arial" font-size="16" font-weight="bold"
        fill="white" text-anchor="middle">GC</text>
</svg>
```

- [ ] **Step 2: Generate PNG icons**

Open `icons/icon.svg` in a browser, then use the browser's DevTools console to export as PNG, OR use any online SVG-to-PNG converter to create:
- `icons/icon48.png` at 48×48
- `icons/icon128.png` at 128×128

Alternatively, run this if you have `rsvg-convert` installed:
```bash
rsvg-convert -w 48 -h 48 icons/icon.svg > icons/icon48.png
rsvg-convert -w 128 -h 128 icons/icon.svg > icons/icon128.png
```

Or with `inkscape`:
```bash
inkscape --export-png=icons/icon48.png --export-width=48 icons/icon.svg
inkscape --export-png=icons/icon128.png --export-width=128 icons/icon.svg
```

- [ ] **Step 3: Commit**

```bash
git add icons/
git commit -m "feat: add extension icons"
```

---

## Task 10: Popup — HTML + CSS shell

**Files:**
- Modify: `popup/popup.html`
- Modify: `popup/popup.css`

- [ ] **Step 1: Write popup.html**

```html
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>GCal Notifier</title>
  <link rel="stylesheet" href="popup.css" />
</head>
<body>
  <div class="container">
    <nav class="tabs" role="tablist">
      <button class="tab active" data-tab="upcoming" role="tab">Upcoming</button>
      <button class="tab" data-tab="digest" role="tab">Digest</button>
      <button class="tab" data-tab="settings" role="tab">Settings</button>
    </nav>

    <section id="tab-upcoming" class="tab-panel active">
      <div id="events-list">
        <p class="empty-state">Đang tải sự kiện...</p>
      </div>
      <button id="open-calendar" class="btn-primary">Mở Google Calendar</button>
    </section>

    <section id="tab-digest" class="tab-panel">
      <div id="digest-content">
        <p class="empty-state">Chưa có digest hôm nay.</p>
      </div>
      <button id="send-digest-now" class="btn-secondary">Gửi digest ngay</button>
    </section>

    <section id="tab-settings" class="tab-panel">
      <div class="settings-group">
        <label class="settings-label">Thông báo trước (phút)</label>
        <div id="notify-chips" class="chip-list"></div>
        <div class="add-chip-row">
          <input id="new-minutes" type="number" min="1" max="120" placeholder="Nhập phút" />
          <button id="add-minutes" class="btn-secondary">+ Thêm</button>
        </div>
      </div>
      <div class="settings-group">
        <label class="settings-label">Daily Digest</label>
        <div class="settings-row">
          <label class="toggle-label">
            <input id="digest-enabled" type="checkbox" />
            Bật digest hàng ngày
          </label>
        </div>
        <div class="settings-row">
          <label>Giờ nhận: </label>
          <input id="digest-time" type="time" value="08:00" />
        </div>
      </div>
      <div class="settings-group">
        <label class="settings-label">Nguồn dữ liệu</label>
        <label class="radio-label">
          <input type="radio" name="source" value="scrape" checked /> Scraping (hiện tại)
        </label>
        <label class="radio-label">
          <input type="radio" name="source" value="api" /> Google Calendar API
        </label>
        <div id="api-credentials" class="hidden">
          <input id="api-key" type="password" placeholder="Nhập OAuth Client ID khi sẵn sàng" />
        </div>
      </div>
      <button id="save-settings" class="btn-primary">Lưu Settings</button>
    </section>
  </div>

  <script src="../src/event-store.js"></script>
  <script src="../src/notifier.js"></script>
  <script src="popup.js"></script>
</body>
</html>
```

- [ ] **Step 2: Write popup.css**

```css
/* popup/popup.css */
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Segoe UI', Arial, sans-serif;
  font-size: 13px;
  width: 340px;
  min-height: 300px;
  background: #fff;
  color: #202124;
}

.container { display: flex; flex-direction: column; height: 100%; }

.tabs {
  display: flex;
  border-bottom: 2px solid #e8eaed;
  background: #f8f9fa;
}

.tab {
  flex: 1;
  padding: 10px 0;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  color: #5f6368;
  transition: color 0.15s, border-bottom 0.15s;
}

.tab.active {
  color: #1a73e8;
  border-bottom: 2px solid #1a73e8;
  margin-bottom: -2px;
}

.tab-panel { display: none; padding: 12px; flex-direction: column; gap: 8px; }
.tab-panel.active { display: flex; }

.event-group-header {
  font-size: 11px;
  font-weight: 600;
  color: #5f6368;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 8px 0 4px;
}

.event-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 4px;
  border-radius: 4px;
  transition: background 0.1s;
}

.event-item:hover { background: #f1f3f4; }

.event-dot { width: 8px; height: 8px; border-radius: 50%; background: #1a73e8; flex-shrink: 0; }
.event-dot.future { background: #dadce0; }

.event-info { flex: 1; min-width: 0; }
.event-title { font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.event-time { font-size: 11px; color: #5f6368; }

.event-link {
  font-size: 11px;
  color: #1a73e8;
  text-decoration: none;
  flex-shrink: 0;
}

.empty-state { color: #5f6368; text-align: center; padding: 20px 0; }

.btn-primary {
  background: #1a73e8;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 13px;
  margin-top: 8px;
  width: 100%;
}

.btn-primary:hover { background: #1557b0; }

.btn-secondary {
  background: #fff;
  color: #1a73e8;
  border: 1px solid #dadce0;
  border-radius: 4px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 12px;
}

.settings-group { margin-bottom: 16px; }
.settings-label { font-weight: 600; font-size: 12px; color: #5f6368; display: block; margin-bottom: 6px; }
.settings-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }

.chip-list { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 6px; }

.chip {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #e8f0fe;
  color: #1a73e8;
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 12px;
}

.chip-remove { background: none; border: none; cursor: pointer; color: #1a73e8; font-size: 14px; padding: 0; }

.add-chip-row { display: flex; gap: 6px; }
#new-minutes { width: 80px; padding: 4px 8px; border: 1px solid #dadce0; border-radius: 4px; }

.radio-label, .toggle-label { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }

#api-credentials { margin-top: 6px; }
#api-key { width: 100%; padding: 6px 8px; border: 1px solid #dadce0; border-radius: 4px; font-size: 12px; }

.hidden { display: none !important; }
```

- [ ] **Step 3: Commit**

```bash
git add popup/popup.html popup/popup.css
git commit -m "feat: add popup HTML shell and CSS styles"
```

---

## Task 11: Popup JavaScript

**Files:**
- Modify: `popup/popup.js`

- [ ] **Step 1: Implement popup.js**

```js
// popup/popup.js
(function () {
  'use strict';

  // ── Tab navigation ───────────────────────────────────────────────
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
    });
  });

  // ── Helpers ──────────────────────────────────────────────────────
  function pad(n) { return String(n).padStart(2, '0'); }

  function fmtTime(ts) {
    const d = new Date(ts);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function dayLabel(ts) {
    const d = new Date(ts);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (d >= today && d < tomorrow) return 'HÔM NAY';
    if (d >= tomorrow && d < new Date(tomorrow.getTime() + 86400000)) return 'NGÀY MAI';
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return `${days[d.getDay()]} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
  }

  function isToday(ts) {
    const d = new Date(ts);
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  }

  // ── Upcoming tab ─────────────────────────────────────────────────
  async function renderUpcoming() {
    const events = await EventStore.getEvents();
    const now = Date.now();
    const upcoming = events
      .filter((e) => e.endTime >= now)
      .sort((a, b) => a.startTime - b.startTime)
      .slice(0, 20);

    const container = document.getElementById('events-list');
    if (upcoming.length === 0) {
      container.innerHTML = '<p class="empty-state">Không có sự kiện sắp tới.<br>Mở Google Calendar để tải dữ liệu.</p>';
      return;
    }

    let lastGroup = null;
    let html = '';
    for (const event of upcoming) {
      const group = dayLabel(event.startTime);
      if (group !== lastGroup) {
        html += `<div class="event-group-header">${group}</div>`;
        lastGroup = group;
      }
      const dotClass = isToday(event.startTime) ? '' : 'future';
      const meetHtml = event.meetLink
        ? `<a class="event-link" href="${event.meetLink}" target="_blank">Meet</a>`
        : '';
      html += `
        <div class="event-item">
          <div class="event-dot ${dotClass}"></div>
          <div class="event-info">
            <div class="event-title">${escapeHtml(event.title)}</div>
            <div class="event-time">${fmtTime(event.startTime)} – ${fmtTime(event.endTime)}</div>
          </div>
          ${meetHtml}
        </div>`;
    }
    container.innerHTML = html;
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  document.getElementById('open-calendar').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://calendar.google.com' });
  });

  // ── Digest tab ───────────────────────────────────────────────────
  async function renderDigest() {
    const events = await EventStore.getEvents();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const todayEvents = events
      .filter((e) => e.startTime >= startOfDay.getTime() && e.startTime < endOfDay.getTime())
      .sort((a, b) => a.startTime - b.startTime);

    const container = document.getElementById('digest-content');
    if (todayEvents.length === 0) {
      container.innerHTML = '<p class="empty-state">Không có sự kiện hôm nay.</p>';
      return;
    }

    const rows = todayEvents.map(
      (e) => `<div class="event-item">
        <div class="event-dot"></div>
        <div class="event-info">
          <div class="event-title">${escapeHtml(e.title)}</div>
          <div class="event-time">${fmtTime(e.startTime)} – ${fmtTime(e.endTime)}</div>
        </div>
      </div>`
    );
    container.innerHTML = rows.join('');
  }

  document.getElementById('send-digest-now').addEventListener('click', async () => {
    const events = await EventStore.getEvents();
    Notifier.showDailyDigest(events);
  });

  // ── Settings tab ─────────────────────────────────────────────────
  async function renderSettings() {
    const settings = await EventStore.getSettings();

    renderNotifyChips(settings.notifyBefore);
    document.getElementById('digest-enabled').checked = settings.digestEnabled;
    document.getElementById('digest-time').value = settings.dailyDigestTime;
    document.querySelector(`input[name="source"][value="${settings.apiEnabled ? 'api' : 'scrape'}"]`).checked = true;
    document.getElementById('api-credentials').classList.toggle('hidden', !settings.apiEnabled);
  }

  function renderNotifyChips(minutes) {
    const container = document.getElementById('notify-chips');
    container.innerHTML = minutes
      .sort((a, b) => a - b)
      .map(
        (m) => `<span class="chip">${m}p
          <button class="chip-remove" data-minutes="${m}" title="Xóa">×</button>
        </span>`
      )
      .join('');

    container.querySelectorAll('.chip-remove').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const settings = await EventStore.getSettings();
        const updated = Object.assign({}, settings, {
          notifyBefore: settings.notifyBefore.filter((m) => m !== Number(btn.dataset.minutes)),
        });
        await EventStore.saveSettings(updated);
        renderNotifyChips(updated.notifyBefore);
      });
    });
  }

  document.getElementById('add-minutes').addEventListener('click', async () => {
    const input = document.getElementById('new-minutes');
    const val = parseInt(input.value, 10);
    if (!val || val < 1 || val > 120) return;
    const settings = await EventStore.getSettings();
    if (settings.notifyBefore.includes(val)) { input.value = ''; return; }
    const updated = Object.assign({}, settings, {
      notifyBefore: [...settings.notifyBefore, val].sort((a, b) => a - b),
    });
    await EventStore.saveSettings(updated);
    renderNotifyChips(updated.notifyBefore);
    input.value = '';
  });

  document.querySelectorAll('input[name="source"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      document.getElementById('api-credentials').classList.toggle('hidden', radio.value !== 'api');
    });
  });

  document.getElementById('save-settings').addEventListener('click', async () => {
    const settings = await EventStore.getSettings();
    const updated = Object.assign({}, settings, {
      digestEnabled: document.getElementById('digest-enabled').checked,
      dailyDigestTime: document.getElementById('digest-time').value,
      apiEnabled: document.querySelector('input[name="source"]:checked').value === 'api',
    });
    await EventStore.saveSettings(updated);
    const btn = document.getElementById('save-settings');
    btn.textContent = 'Đã lưu ✓';
    setTimeout(() => { btn.textContent = 'Lưu Settings'; }, 1500);
  });

  // ── Init ─────────────────────────────────────────────────────────
  renderUpcoming();
  renderDigest();
  renderSettings();
})();
```

- [ ] **Step 2: Commit**

```bash
git add popup/popup.js
git commit -m "feat: implement popup with 3-tab UI (upcoming, digest, settings)"
```

---

## Task 12: Load extension in Chrome & verify

- [ ] **Step 1: Run all unit tests**

```bash
npx jest --verbose
```

Expected: `PASS` on all test files, 15+ tests passing.

- [ ] **Step 2: Open Chrome and load extension**

1. Navigate to `chrome://extensions`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `chrome-gcal-notifier/` folder

Expected: Extension icon appears in Chrome toolbar. No errors in the Extensions page.

- [ ] **Step 3: Verify popup opens**

Click the extension icon. Expected: popup opens showing "Upcoming" tab with "Đang tải sự kiện..." or empty state.

- [ ] **Step 4: Verify scraping**

1. Open `https://calendar.google.com` in a new tab
2. Wait 3 seconds for the scraper to run
3. Click the extension icon again

Expected: Events from your calendar appear in the "Upcoming" tab. If no events show, open Chrome DevTools on the Calendar tab → Console → check for errors from `calendar-scraper.js`.

- [ ] **Step 5: Verify notification (manual)**

In the Chrome DevTools on the Extensions background page (`chrome://extensions` → "service worker" link):
```js
// Paste in the service worker DevTools console
importScripts('../src/event-store.js', '../src/notifier.js');
Notifier.showEventNotification(
  { id: 'test1', title: 'Test Event', startTime: Date.now() + 60000, endTime: Date.now() + 3660000 },
  1
);
```

Expected: A desktop notification appears with "Test Event", "Bắt đầu sau 1 phút", and 3 action buttons.

- [ ] **Step 6: Verify Settings tab**

1. Click extension icon → Settings tab
2. Add a new notification time (e.g., 15 minutes)
3. Click "Lưu Settings"
4. Expected: "Đã lưu ✓" appears, chip list updates

- [ ] **Step 7: Final commit**

```bash
git add .
git commit -m "chore: verify extension loads and functions correctly in Chrome"
```

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| No events appear in popup | Open `calendar.google.com`, wait 3s, reopen popup. Check scraper console for selector errors. |
| Scraper stops working | Google changed their DOM — open DevTools on calendar.google.com, find event elements, update selectors in `calendar-scraper.js`. |
| Notifications don't appear | Check `chrome://settings/content/notifications` — ensure Chrome is allowed. |
| Service worker errors | Go to `chrome://extensions` → extension → "service worker" → inspect DevTools console. |
| `importScripts` fails | Paths in `importScripts` in `service-worker.js` are relative to the extension root, not the `background/` folder. Use `../src/...`. |
