// src/notifier.js
(function () {
  'use strict';

  const i18n = typeof module !== 'undefined'
    ? require('./i18n')
    : (typeof globalThis !== 'undefined' ? globalThis.I18n : null);

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function fmtTime(ts) {
    const d = new Date(ts);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function fmtDate(d) {
    return i18n && typeof i18n.formatShortDate === 'function'
      ? i18n.formatShortDate(d)
      : `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
  }

  function translate(key, params) {
    return i18n && typeof i18n.t === 'function' ? i18n.t(key, params) : key;
  }

  function showEventNotification(event, minutesBefore) {
    const notifId = `event_${event.id}_${minutesBefore}before`;
    chrome.notifications.create(notifId, {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon48.png'),
      title: event.title,
      message: translate('notif.eventStarting', { min: minutesBefore }),
      contextMessage: `${fmtTime(event.startTime)} – ${fmtTime(event.endTime)}`,
      buttons: [
        { title: translate('notif.snooze5') },
        { title: translate('notif.openCalendar') },
      ],
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
      iconUrl: chrome.runtime.getURL('icons/icon48.png'),
      title: translate('notif.digestTitle', { date: fmtDate(new Date()) }),
      message,
      buttons: [{ title: translate('notif.digestDetails') }],
    });
  }

  const Notifier = { showEventNotification, showDailyDigest, fmtTime, fmtDate };

  if (typeof module !== 'undefined') module.exports = Notifier;
  else globalThis.Notifier = Notifier;
})();
