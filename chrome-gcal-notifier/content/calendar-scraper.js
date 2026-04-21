// content/calendar-scraper.js

// Selectors target [data-eventid] which is stable.
// Start time decoded from base64 data-eventid (contains UTC datetime).
// End time + title parsed from Vietnamese textContent: "Từ 9AM đến 9:15AM, Title, ..."
// If scraping breaks, check data-eventid format and textContent pattern on calendar.google.com.

(function () {
  'use strict';

  // data-eventid is base64: "{eventUid}_{YYYYMMDDTHHMMSSZ} {calendarId}"
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

  // Vietnamese textContent: "9AM[Villa] BE DailyTừ 9AM đến 9:15AM, [Villa] BE Daily, ..."
  function parseFromText(text, startTime) {
    // End time: "đến {time}"
    const endMatch = text.match(/đến\s+(\d{1,2}(?::\d{2})?[AP]M)/i);
    const endTime = endMatch
      ? parseLocalTime(endMatch[1], new Date(startTime)) || (startTime + 3600000)
      : startTime + 3600000;

    // Title: segment after "đến {time}," and before next comma
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

    for (const el of elements) {
      const base64Id = el.getAttribute('data-eventid');
      if (!base64Id) continue;

      const startTime = decodeStartTime(base64Id);
      if (!startTime) continue;

      // Skip events ended more than 1 hour ago
      if (startTime < Date.now() - 3600000) continue;

      const text = el.textContent || '';
      const { endTime, title } = parseFromText(text, startTime);
      if (!title) continue;

      // Use first 24 chars of base64 as stable ID (contains event UID)
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
