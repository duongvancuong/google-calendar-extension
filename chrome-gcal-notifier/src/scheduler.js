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
    const existingMap = new Map(existing.map((a) => [a.name, a]));
    for (const alarm of pending) {
      const existingAlarm = existingMap.get(alarm.name);
      if (existingAlarm) {
        // Alarm đã đúng giờ — bỏ qua
        if (Math.abs(existingAlarm.scheduledTime - alarm.when) <= 60000) continue;
        // startTime của event đã thay đổi — xóa alarm cũ rồi tạo lại
        await new Promise((r) => chrome.alarms.clear(alarm.name, r));
      }
      chrome.alarms.create(alarm.name, { when: alarm.when });
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

  // Returns notifications that should fire immediately:
  // alarm time has passed but event hasn't started yet and not already notified.
  function computeImmediateNotifications(events, settings, now) {
    const result = [];
    for (const event of events) {
      if (event.startTime <= now) continue;
      for (const minutes of settings.notifyBefore) {
        const when = event.startTime - minutes * 60 * 1000;
        if (when <= now && !(event.notifiedAt || []).includes(minutes)) {
          result.push({ event, minutesBefore: minutes });
        }
      }
    }
    return result;
  }

  const Scheduler = { computePendingAlarms, computeImmediateNotifications, scheduleAlarms, scheduleDailyDigest, parseAlarmName };

  if (typeof module !== 'undefined') module.exports = Scheduler;
  else globalThis.Scheduler = Scheduler;
})();
