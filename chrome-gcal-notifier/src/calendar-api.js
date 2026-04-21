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
