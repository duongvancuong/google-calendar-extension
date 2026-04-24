# GCal Notifier — Remove Debug, Add i18n (VI/EN), Guide tab, Retro Terminal theme

- **Date:** 2026-04-24
- **Target:** `chrome-gcal-notifier/` (Chrome Extension MV3)
- **Status:** Approved design, pending implementation plan

---

## 1. Goals

1. **Remove the Debug tab entirely** — reduce surface area and tidy the popup for end-use.
2. **Support runtime language switching (VI / EN)** across popup UI, notifications, and date/time labels, persisted in settings. Default: auto-detect via `navigator.language` (fallback VI).
3. **Add a "Guide" tab** at the end of the nav containing full usage documentation: setup, per-tab description, how it works, FAQ.
4. **Restyle the popup with a Terminal/CRT retro aesthetic** — phosphor green on near-black, amber accents, monospace fonts, square corners, ASCII-flavored widgets — while keeping readability and accessibility.

## 2. Non-goals

- Not adding a third language.
- Not changing scraper, scheduler, or notification delivery logic (only the text they render).
- Not switching to `chrome.i18n` built-in (cannot runtime-switch).
- Not introducing a build step, TypeScript, or a bundler.
- Not adding scanline/CRT distortion overlays that reduce readability.

## 3. Current state (summary)

- `popup/popup.html` has 4 tabs: Upcoming, Digest, Settings, **Debug**. All copy is hardcoded Vietnamese.
- `popup/popup.js` renders each tab; the Debug tab shows stored events, alarms, settings and has 3 test buttons.
- `popup/popup.css` uses blue (`#1a73e8`) accent, sans-serif, rounded corners, colored dots.
- `src/event-store.js` manages settings & events in `chrome.storage.local`; `background/service-worker.js` runs alarms + notifications; `src/notifier.js` builds notification payloads.

## 4. Approach

### 4.1 i18n approach — custom inline module (chosen)

Rejected alternatives:
- **`chrome.i18n` + `_locales/`**: reads OS locale, no runtime switch — fails requirement.
- **Separate JSON files fetched at runtime**: async load, extra complexity, overkill for two static dictionaries.

Chosen: **custom synchronous module** `src/i18n.js` exporting a frozen dictionary and helpers. Works in both popup (window) and service worker (`importScripts`) because it touches no DOM at module top-level.

### 4.2 File plan

**New files:**
- `src/i18n.js` — i18n module (dictionary + helpers).
- `tests/i18n.test.js` — unit tests for `t()`, fallback, interpolation, default-lang detection.

**Modified files:**
- `popup/popup.html` — remove `#tab-debug` section and its nav button; add `#tab-guide` section at the end of the nav; add `data-i18n` / `data-i18n-placeholder` / `data-i18n-title` attributes; add language radio group in Settings; load `src/i18n.js` before `popup.js`.
- `popup/popup.js` — remove all Debug handlers (`debug-fire-notif`, `debug-fire-sw`, `debug-refresh`, `renderDebug`); add language switcher handler (applies immediately on change); replace hardcoded `days` array and `'HÔM NAY' / 'NGÀY MAI'` logic with `I18n.dayLabel()`; call `I18n.init()` + `I18n.applyToDOM(document)` at boot and after a language change; format times via `I18n.formatTime()` where needed.
- `popup/popup.css` — full retro terminal restyle (palette, typography, borders, button/chip/dot treatments, guide styles).
- `src/event-store.js` — add `language: 'vi' | 'en'` to default settings; coerce/validate on save.
- `background/service-worker.js` — `importScripts('../src/i18n.js')` (path must match extension-root-relative URL); call `await I18n.init()` before building notifications; use `I18n.t('notif.*', {...})` for titles and bodies.
- `src/notifier.js` — any string assembly moved behind `I18n.t()`.
- `tests/notifier.test.js` — assert notification text matches dictionary per language.

**Unchanged:**
- `manifest.json` (no `_locales` needed).
- `content/calendar-scraper.js` (no user-facing strings).

### 4.3 Module shape — `src/i18n.js`

```
const TRANSLATIONS = Object.freeze({
  vi: { /* key -> string */ },
  en: { /* key -> string */ }
});

const I18n = {
  async init()                  // reads settings.language (via storage), sets current lang; fallback detectDefaultLang()
  getLang()                     // 'vi' | 'en'
  async setLang(lang)           // validates, persists via storage, updates current
  t(key, params?)               // lookup: current -> vi -> key; {token} interpolation
  applyToDOM(root)              // replaces textContent for [data-i18n], value/placeholder for [data-i18n-placeholder], title for [data-i18n-title]
  formatTime(ts)                // Intl.DateTimeFormat with locale 'vi-VN' | 'en-US', HH:mm
  formatDate(ts)                // locale-aware date string
  dayLabel(ts)                  // 'HÔM NAY' / 'TODAY' / 'NGÀY MAI' / 'TOMORROW' / '<weekday> dd/mm'
  detectDefaultLang()           // navigator.language.startsWith('vi') ? 'vi' : 'en'  (service worker: fallback 'vi')
};

if (typeof window !== 'undefined') window.I18n = I18n;
if (typeof self !== 'undefined' && typeof importScripts === 'function') self.I18n = I18n;
```

Key contracts:
- **Pure, synchronous `t()`** — callable from any context including notification builders.
- **Fallback chain:** current lang → `vi` (always complete) → raw key (highlights missing translations in dev).
- **Immutability:** dictionaries frozen; `setLang` does not mutate dictionary; storage writes through `EventStore.saveSettings`.
- **No DOM access at top level** — `applyToDOM` is the only DOM-touching function; service worker never calls it.

### 4.4 Dictionary keys (shape)

Grouped by namespace. Both languages define every key (no gaps).

```
tab.upcoming | tab.digest | tab.settings | tab.guide

common.save | common.saved | common.add | common.remove | common.openCalendar

upcoming.empty | upcoming.meet

digest.empty | digest.sendNow | digest.heading

settings.notifyBefore | settings.notifyBeforeInput
settings.digestHeading | settings.digestEnable | settings.digestTime
settings.source | settings.sourceScrape | settings.sourceApi | settings.apiKeyPlaceholder
settings.language | settings.languageVi | settings.languageEn

day.today | day.tomorrow
day.weekday.0 .. day.weekday.6   (CN/T2..T7  vs  Sun/Mon..Sat)

notif.eventStarting   // "{title} bắt đầu sau {min} phút" / "{title} starts in {min} min"
notif.eventNow        // "{title} đang bắt đầu" / "{title} is starting now"
notif.digestTitle     // "Lịch hôm nay" / "Today's schedule"
notif.digestBody      // "{count} sự kiện hôm nay" / "{count} events today"

guide.setup.heading | guide.setup.step1 | guide.setup.step2 | guide.setup.step3
guide.tabs.heading
  // values for tab.upcoming / tab.digest / tab.settings re-used as <dt>
guide.tabs.upcoming | guide.tabs.digest | guide.tabs.settings
guide.howItWorks.heading
guide.howItWorks.scraper | guide.howItWorks.alarms | guide.howItWorks.digest
guide.faq.heading
guide.faq.q1 | guide.faq.a1   // no notifications
guide.faq.q2 | guide.faq.a2   // missing Meet link
guide.faq.q3 | guide.faq.a3   // digest not firing on time
```

### 4.5 Data flow

**Popup boot:**
1. `popup.js` IIFE starts → `await I18n.init()` (reads `settings.language` from `EventStore`, falls back to `detectDefaultLang()`).
2. `I18n.applyToDOM(document)` replaces all marked text.
3. `renderUpcoming()` / `renderDigest()` / `renderSettings()` render dynamic content using `I18n.t()` and `I18n.dayLabel()`.

**Language change:**
1. User clicks a radio in `input[name="language"]`.
2. Handler: `await I18n.setLang(value)` → persist → `I18n.applyToDOM(document)` → re-run dynamic renderers (so day labels, event times, empty states update).

**Service worker notification:**
1. Alarm fires → worker loads settings → `await I18n.init()`.
2. Build title/body via `I18n.t('notif.eventStarting', { title, min })`.
3. `chrome.notifications.create(...)` with translated text.

### 4.6 Settings storage

Extend default settings in `src/event-store.js`:

```
{
  notifyBefore: [5, 15],
  digestEnabled: true,
  dailyDigestTime: '08:00',
  apiEnabled: false,
  apiKey: '',
  language: undefined   // set lazily to detected default on first init
}
```

`saveSettings` validates `language` ∈ `{'vi', 'en'}` and drops invalid values to `undefined` (triggers re-detect).

### 4.7 Guide tab content (structure)

`<section id="tab-guide">` with four `.guide-section` blocks: Setup (ordered list, 3 steps), Tabs (dl with 3 dt/dd pairs), How it works (ul, 3 items), FAQ (dl with 3 q/a pairs). All text via `data-i18n`. Full copy is defined in dictionary — see keys in §4.4.

### 4.8 Language switcher UI (in Settings)

Added as the first `.settings-group` inside `#tab-settings`:

```html
<div class="settings-group">
  <label class="settings-label" data-i18n="settings.language"></label>
  <label class="radio-label">
    <input type="radio" name="language" value="vi" />
    <span data-i18n="settings.languageVi"></span>
  </label>
  <label class="radio-label">
    <input type="radio" name="language" value="en" />
    <span data-i18n="settings.languageEn"></span>
  </label>
</div>
```

Applies immediately on `change` (no need to press Save). Persists via `EventStore.saveSettings`.

## 5. Styling — Retro Terminal / CRT

### 5.1 Palette

| Token            | Value      | Usage                               |
|------------------|------------|-------------------------------------|
| `--bg-main`      | `#0a0e0a`  | Body background                     |
| `--bg-panel`     | `#121812`  | Tab panel, input background         |
| `--phosphor`     | `#00ff66`  | Primary text                        |
| `--phosphor-dim` | `#4a9e6a`  | Secondary text, times, muted states |
| `--amber`        | `#ffb000`  | Active tab, links, hover accent     |
| `--red`          | `#ff5555`  | Past/errored events                 |
| `--border`       | `#2a3a2a`  | Panel dividers                      |
| `--border-bright`| `#4a9e6a`  | Focus, active underline             |

Contrast: phosphor on bg ≈ 14:1 (AAA). Amber on bg ≈ 11:1 (AAA).

### 5.2 Typography

- Stack: `'IBM Plex Mono', 'SF Mono', Consolas, 'Courier New', monospace` (system only — no webfonts; CSP-safe without `content_security_policy` changes).
- Body: 12px, `line-height: 1.5`.
- Headings & tabs: UPPERCASE, `letter-spacing: 1px`.

### 5.3 Visual treatments

- **Border radius:** `0` throughout.
- **Buttons:** bracket style `[ LABEL ]` in content, 1px phosphor border; hover = inverted (phosphor bg, `--bg-main` text); no shadows.
- **Active tab:** amber text, dashed amber underline, `"> "` prefix rendered via CSS `::before`.
- **Event dots:** replace colored circles with ASCII glyphs rendered as text — `▓` today/current, `▒` future, `░` past.
- **Empty state:** `> no events_` with blinking underscore (`@keyframes blink`, 1s steps).
- **Inputs:** dark bg, 1px dim phosphor border, amber border on `:focus`, no glow.
- **Scrollbar:** custom `::-webkit-scrollbar` — 6px, thumb `--phosphor-dim`.
- **Guide section headings:** rendered with box-drawing prefix/suffix via CSS `::before` / `::after` content `"═══ "` / `" ═══"` — keeps markup clean.
- **Past events:** red phosphor color + existing strikethrough.

### 5.4 Explicitly not doing

- No scanline overlay, no CRT curvature, no flicker animations, no webfont downloads, no glow shadows (or at most a 0–4px subtle shadow on amber only if needed for accent — off by default).

## 6. Testing

### 6.1 Unit (`tests/i18n.test.js`)

- `t('known.key')` returns current-lang value.
- `t('known.key', {name: 'X'})` interpolates tokens.
- `t('missing.in.en')` falls back to `vi`.
- `t('totally.missing')` returns the raw key.
- `detectDefaultLang()` with mocked `navigator.language`: `'vi-VN'` → `'vi'`, `'en-US'` → `'en'`, `'fr-FR'` → `'en'`.
- `setLang('xx')` rejects or coerces; `setLang('en')` persists and flips `getLang()`.

### 6.2 Notifier (`tests/notifier.test.js`)

- With `settings.language = 'vi'`, notification title/body match VI dictionary.
- With `settings.language = 'en'`, same data produces EN strings.

### 6.3 Manual verification (after implementation)

- Load unpacked extension, open popup: nav shows `UPCOMING / DIGEST / SETTINGS / GUIDE` (no Debug).
- In Settings, switch VI ↔ EN; all tabs including day labels and empty states update without reopening popup.
- Past event appears in red with strikethrough; upcoming event shows `▓` or `▒` glyph.
- Trigger a notification (let an alarm fire, or manually via calendar test event) and verify language matches selected setting.
- Guide tab renders four sections with bordered headings; content re-translates on language switch.

## 7. Risks & mitigations

| Risk                                                    | Mitigation                                                    |
|---------------------------------------------------------|---------------------------------------------------------------|
| Service worker loses `i18n` state between wake-ups      | `I18n.init()` is idempotent and called at the top of each handler that builds notifications. |
| Missing translation causes blank UI                     | Fallback chain (`vi` always complete) + raw-key fallback surfaces gaps visibly. |
| Monospace fonts vary across OS                          | Stack starts with IBM Plex Mono/SF Mono (common on macOS/modern Chrome) and falls back to Courier New universally. |
| Past-event red phosphor looks "errored" rather than muted | Pair red with strikethrough and `--phosphor-dim` time color — visual convention already signals "past". |
| CSS variables not universally supported in MV3 popup    | Chromium popup is full Chrome rendering engine — CSS custom properties are fine. |

## 8. Out-of-scope follow-ups (noted, not in this spec)

- Additional languages beyond VI/EN.
- Dark/light toggle (current design is dark-only by virtue of being retro).
- A third "Events by week" view in Guide.
- Keyboard shortcut cheatsheet in Guide.
