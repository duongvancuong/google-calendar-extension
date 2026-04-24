# GCal Notifier v1.0.0

First public release.

## Install

See [README install guide](./README.md#install). Summary:

1. Download `gcal-notifier-v1.0.0.zip` from the Assets below.
2. Unzip to a permanent location.
3. `chrome://extensions` → Developer mode → **Load unpacked** → select the
   unzipped folder.

## What's included

- **Pre-event reminders** at any minute offset (5, 10, 30, custom — stack
  as many as you want).
- **Daily digest** with today's schedule at a time you choose.
- **Quick Meet button** on each event — join in one click.
- **5-minute snooze** on every reminder.
- **Bilingual UI** — switch VI ↔ EN instantly in Settings.
- **Retro terminal theme** — phosphor green, monospace, box-drawing headings.
- **100% local** — no servers, no analytics.

## Permissions

- `notifications`, `storage`, `alarms`, `tabs`
- `host_permissions: https://calendar.google.com/*`

See [`PRIVACY.md`](./PRIVACY.md) for full details.

## Requirements

- Chromium-based browser (Chrome, Edge, Brave, Arc, Opera, etc.).
- Google Calendar tab open at least once so the scraper can extract events.

## Known limitations

- No auto-update — re-download when a new release ships.
- Scraper reads Google Calendar DOM; if Google changes Calendar's markup
  significantly, events may stop appearing until a patched release.
- Meet link only appears after you open the event details in Google Calendar
  at least once.

## Checksums

To verify the download, run after downloading:

```bash
shasum -a 256 gcal-notifier-v1.0.0.zip
```

Expected SHA-256:

```
8601c3e07dac5a232898b4482acc0c1ae36f2a973f053799fb702135a8cf5b6a  gcal-notifier-v1.0.0.zip
```
