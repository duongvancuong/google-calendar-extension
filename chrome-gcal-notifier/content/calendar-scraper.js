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
