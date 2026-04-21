// content/calendar-scraper.js

// Selectors target [data-eventid] which is stable.
// Recurring events: start time decoded from base64 data-eventid (contains UTC datetime).
// Single events: date parsed from own textContent "DD tháng MM, YYYY" (avoids gridcell concat bug).
// End time + title parsed from Vietnamese textContent: "Từ 9AM đến 9:15AM, Title, ..."

(function () {
  'use strict';

  // Recurring event: data-eventid is base64 "{eventUid}_{YYYYMMDDTHHMMSSZ} {calendarId}"
  function decodeStartTime(base64Id) {
    try {
      const decoded = atob(base64Id);
      const match = decoded.match(/_(\d{8}T\d{6}Z)/);
      if (!match) return null;
      const dt = match[1];
      return new Date(
        `${dt.slice(0,4)}-${dt.slice(4,6)}-${dt.slice(6,8)}T${dt.slice(9,11)}:${dt.slice(11,13)}:${dt.slice(13,15)}Z`
      ).getTime();
    } catch (e) {
      return null;
    }
  }

  // Parse "9AM" or "9:15AM" or "10:30PM" → timestamp on same day as refDate
  function parseLocalTime(timeStr, refDate) {
    const match = timeStr.match(/^(\d{1,2})(?::(\d{2}))?([AP]M)$/i);
    if (!match) return null;
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2] || '0', 10);
    const meridiem = match[3].toUpperCase();
    if (meridiem === 'PM' && h !== 12) h += 12;
    if (meridiem === 'AM' && h === 12) h = 0;
    const d = new Date(refDate);
    d.setHours(h, m, 0, 0);
    return d.getTime();
  }

  // Single event: textContent always contains "DD tháng MM, YYYY" (with year, unambiguous)
  // e.g. "4:35PMdraftTừ ... Không có vị trí, 21 tháng 4, 2026"
  function parseDateFromEventText(text) {
    const match = text.match(/(\d{1,2})\s+tháng\s+(\d{1,2}),\s*(\d{4})/i);
    if (!match) return null;
    return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
  }

  // Single event: parse start time from event textContent
  // Format: "9AMTitleTừ 9AM đến..." → leading time before "Từ"
  function parseStartTimeFromText(text, refDate) {
    const match = text.match(/^(\d{1,2}(?::\d{2})?[AP]M)/i);
    return match ? parseLocalTime(match[1], refDate) : null;
  }

  // Vietnamese textContent: "9AM[Villa] BE DailyTừ 9AM đến 9:15AM, [Villa] BE Daily, ..."
  function parseFromText(text, startTime) {
    const endMatch = text.match(/đến\s+(\d{1,2}(?::\d{2})?[AP]M)/i);
    const endTime = endMatch
      ? parseLocalTime(endMatch[1], new Date(startTime)) || (startTime + 3600000)
      : startTime + 3600000;

    let title = null;
    if (endMatch) {
      const after = text.slice(text.indexOf(endMatch[0]) + endMatch[0].length);
      const titleMatch = after.match(/^[,\s]+([^,]+)/);
      title = titleMatch ? titleMatch[1].trim() : null;
    }

    return { endTime, title };
  }

  function extractMeetLink(el) {
    const links = el.querySelectorAll('a[href*="meet.google.com"]');
    return links.length > 0 ? links[0].href : null;
  }

  function scrapeEvents() {
    const elements = document.querySelectorAll('[data-eventid]');
    const events = [];
    const seenIds = new Set();
    const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);

    for (const el of elements) {
      const base64Id = el.getAttribute('data-eventid');
      if (!base64Id) continue;

      // Try recurring event format first (has datetime in base64)
      let startTime = decodeStartTime(base64Id);

      // Fallback: single event — extract date from own textContent ("DD tháng MM, YYYY")
      if (!startTime) {
        const text = el.textContent || '';
        const refDate = parseDateFromEventText(text);
        if (!refDate) continue;
        startTime = parseStartTimeFromText(text, refDate);
        if (!startTime) continue;
      }

      const text = el.textContent || '';
      const { endTime, title } = parseFromText(text, startTime);
      if (!title) continue;

      // Skip events that ended before today
      if (endTime < startOfToday.getTime()) continue;

      const id = `gcal_${base64Id.slice(0, 24)}`;
      if (seenIds.has(id)) continue;
      seenIds.add(id);

      const meetLink = extractMeetLink(el);
      events.push({
        id,
        title,
        startTime,
        endTime,
        location: null,
        meetLink: meetLink && meetLink.startsWith('https://meet.google.com/') ? meetLink : null,
        calendarName: 'Google Calendar',
        notifiedAt: [],
        source: 'scrape',
      });
    }
    return events;
  }

  function sendEvents(events) {
    if (events.length === 0) return;
    chrome.runtime.sendMessage({ type: 'EVENTS_SCRAPED', events }, () => {
      void chrome.runtime.lastError;
    });
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
