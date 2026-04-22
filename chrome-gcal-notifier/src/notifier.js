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
      iconUrl: chrome.runtime.getURL('icons/icon48.png'),
      title: event.title,
      message: `Bắt đầu sau ${minutesBefore} phút`,
      contextMessage: `${fmtTime(event.startTime)} – ${fmtTime(event.endTime)}`,
      buttons: [
        { title: 'Snooze 5p' },
        { title: 'Mở Calendar' },
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
      title: `Lịch hôm nay — ${fmtDate(new Date())}`,
      message,
      buttons: [{ title: 'Xem chi tiết' }],
    });
  }

  const Notifier = { showEventNotification, showDailyDigest, fmtTime, fmtDate };

  if (typeof module !== 'undefined') module.exports = Notifier;
  else globalThis.Notifier = Notifier;
})();
