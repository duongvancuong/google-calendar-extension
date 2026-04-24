# Privacy Policy — GCal Notifier

**Last updated:** 2026-04-24
**Developer contact:** vancuong279dn@gmail.com

This Chrome extension ("GCal Notifier", "the extension") is designed with a
privacy-first posture. The summary is simple:

> All data the extension reads from Google Calendar stays on your own device.
> Nothing is sent to the developer or to any third party. The extension has
> no servers.

## 1. What the extension reads

When a `https://calendar.google.com/*` tab is open, a content script embedded
in the extension inspects the page's DOM to extract the events that Google
Calendar is already showing you. Specifically it reads:

- Event title
- Start and end time
- Meet link (if visible in the event details you opened)
- A stable identifier so the same event is not notified twice

No other page content is read. The extension does not access other websites.

## 2. What the extension stores

The extension stores data locally on your device via the standard Chrome
[`chrome.storage.local`](https://developer.chrome.com/docs/extensions/reference/api/storage)
API. Stored items include:

- Cached events (so the popup can render without Google Calendar being open)
- Your settings: reminder minutes, digest time, language preference, and
  notification tracking to avoid duplicate alerts
- Meet links keyed by event id
- Snooze state (when you use the "Snooze 5m" button on a notification)

All of this data lives on your computer, inside your own Chrome profile,
and is deleted when you uninstall the extension.

## 3. What the extension does NOT do

- The extension **does not transmit any data** to the developer, to Google,
  or to any other third party.
- The extension **does not use analytics, telemetry, or crash reporting**.
- The extension **does not contain advertising or tracking scripts**.
- The extension **does not read cookies, passwords, or any authentication
  tokens**.
- The extension **does not call the Google Calendar API** in the current
  version — it only reads the DOM of the Calendar page you are already logged
  into. There is no OAuth flow and no API credential collected.

## 4. Permissions and why they are needed

- `notifications` — to show desktop reminders before your events.
- `storage` — to cache events and save your settings on your device.
- `alarms` — to trigger reminders at the exact minute offsets you configure.
- `tabs` — to open `https://calendar.google.com/` and Meet links when you
  click an event in the popup.
- `host_permissions: https://calendar.google.com/*` — so the content script
  can read events from the Calendar page you have open.

## 5. Limited Use compliance

GCal Notifier complies with the
[Chrome Web Store Limited Use requirements](https://developer.chrome.com/docs/webstore/program-policies/limited-use):

- User data is used solely to provide the in-extension features described
  above (notifications, digests, the popup list).
- User data is **not** transferred to any third party.
- User data is **not** used for advertising, profiling, or creditworthiness.
- No human reads the user's data; the extension has no backend and the
  developer has no mechanism to access your device storage.

## 6. Data retention and deletion

- You can clear all extension data at any time by removing the extension via
  `chrome://extensions` or by using "Clear data" in the extension details.
- Cached events that ended more than a day ago are pruned automatically on
  the next sync.

## 7. Children

The extension is a utility over Google Calendar and is not directed at
children under 13. No age-restricted data is collected because no data leaves
your device.

## 8. Changes to this policy

Updates will be published in this file and the "Last updated" date at the top
will change. For material changes, a notice will also be added to the
extension's Chrome Web Store listing.

## 9. Contact

Questions or requests about this policy can be sent to
**vancuong279dn@gmail.com**.
