# Chrome Web Store Listing — GCal Notifier

This file is a copy-paste source for every field in the Chrome Web Store
Developer Dashboard. Keep it updated when you change the extension.

---

## Metadata

| Field                  | Value                                                             |
|------------------------|-------------------------------------------------------------------|
| Item name              | `GCal Notifier`                                                   |
| Short name (fallback)  | `GCal Notifier`                                                   |
| Category               | Productivity                                                      |
| Language               | English + Vietnamese                                              |
| Default locale         | `en`                                                              |
| Pricing                | Free                                                              |
| Distribution           | Public                                                            |
| Countries              | All regions                                                       |

---

## Summary (≤132 characters)

### English
> Retro terminal-style desktop reminders for your calendar. Daily digest, quick Meet access, VI/EN.

### Tiếng Việt
> Nhắc lịch dạng terminal retro. Digest hàng ngày, truy cập Meet nhanh, hỗ trợ VI/EN.

---

## Detailed description

### English

**GCal Notifier turns your calendar into a focused phosphor-green terminal.**
It watches Google Calendar in the background and pings you with a desktop
notification at the minute offsets you choose — so meetings never sneak up on
you.

### Features

- **Pre-event reminders** at any minute offset you configure (5, 10, 30,
  custom — as many as you want).
- **Daily digest** notification with a one-glance summary of today's
  schedule at a time you pick.
- **Quick Meet button** right on each event in the popup — join the call in
  one click.
- **Snooze 5 min** button on every reminder for when you need a moment more.
- **Bilingual UI** — switch between English and Tiếng Việt instantly, no
  reload required.
- **Retro terminal theme** — phosphor green on near-black, monospace,
  box-drawing headings, no noisy animations.
- **Tiny and local-only** — no accounts, no servers, no tracking.

### How it works

GCal Notifier reads the events that Google Calendar is already displaying on
your screen. It does this entirely in your browser using a small content
script on `calendar.google.com`. Reminders are scheduled with Chrome's native
alarms API and delivered via the native notifications API. Your calendar
data never leaves your device.

### Privacy

- All state (cached events, settings, Meet links) is stored locally on your
  computer.
- Nothing is transmitted to the developer or any third party.
- No analytics. No ads. No tracking.

Full policy: see the "Privacy policy" link in this listing.

### Permissions

- **`notifications`** — to show desktop reminders before your events.
- **`storage`** — to cache events and save your settings.
- **`alarms`** — to fire reminders exactly on time.
- **`tabs`** — to open Google Calendar or a Meet link when you click an event.
- **`host_permissions: https://calendar.google.com/*`** — so the content
  script can read events from the Calendar page you have open.

No OAuth. No API keys. No account required.

---

### Tiếng Việt

**GCal Notifier biến lịch của bạn thành một màn hình terminal phosphor xanh
tập trung.** Extension quan sát Google Calendar ở background và gửi thông
báo desktop đúng mốc phút bạn chọn — để không còn bị meeting ập đến bất ngờ.

### Tính năng

- **Nhắc trước sự kiện** ở bất kỳ mốc phút nào bạn cấu hình (5, 10, 30,
  custom — thêm bao nhiêu cũng được).
- **Digest hàng ngày** tóm tắt lịch trong ngày vào giờ bạn chọn.
- **Nút Meet nhanh** ngay trên từng sự kiện trong popup — vào phòng họp một
  click.
- **Hoãn 5 phút** trên mỗi thông báo khi bạn cần thêm chút thời gian.
- **Song ngữ** — chuyển đổi giữa Tiếng Việt và English ngay lập tức, không
  cần reload.
- **Theme terminal retro** — phosphor xanh trên nền đen, font monospace, viền
  box-drawing, không có hoạt ảnh gây rối.
- **Nhẹ và chỉ chạy local** — không tài khoản, không server, không tracking.

### Cách hoạt động

GCal Notifier đọc sự kiện mà Google Calendar đã hiển thị trên màn hình của
bạn. Mọi thứ diễn ra trong browser qua một content script nhỏ trên
`calendar.google.com`. Reminder được đặt qua Chrome alarms API và phát qua
notifications API. Dữ liệu lịch của bạn không bao giờ rời khỏi máy.

### Quyền riêng tư

- Toàn bộ trạng thái (cache event, settings, Meet link) lưu trên máy bạn.
- Không gửi bất kỳ dữ liệu nào tới developer hoặc bên thứ ba.
- Không analytics. Không quảng cáo. Không tracking.

Xem đầy đủ trong "Privacy policy" ở trang này.

### Các quyền

- **`notifications`** — hiển thị thông báo desktop trước sự kiện.
- **`storage`** — cache sự kiện và lưu settings.
- **`alarms`** — trigger thông báo đúng mốc thời gian.
- **`tabs`** — mở Google Calendar hoặc Meet link khi bạn click.
- **`host_permissions: https://calendar.google.com/*`** — để content script
  đọc sự kiện từ trang Calendar đang mở.

Không OAuth. Không API key. Không cần tài khoản.

---

## Single-purpose statement

> GCal Notifier has a single purpose: deliver desktop reminders and a daily
> digest for events that the user has on Google Calendar.

---

## Permission justifications (per-field)

Copy-paste into the "Privacy practices" tab when prompted. Keep each under
~1000 characters.

### `notifications`
Used to surface reminders on the user's desktop via `chrome.notifications.create`
before calendar events and once a day as a digest summary. This is the
extension's primary feature.

### `storage`
Used with `chrome.storage.local` to cache scraped events (so the popup can
render without reopening Google Calendar), persist the user's settings
(reminder minutes, digest time, language, data source toggle), and record
which reminders have already fired to avoid duplicates. All data stays on
the user's device.

### `alarms`
Used with `chrome.alarms.create` to wake the service worker at exact minute
offsets before each event and once per day for the digest. Chrome's native
alarm scheduler is the only reliable way to fire notifications at a precise
future time from a Manifest V3 service worker.

### `tabs`
Used with `chrome.tabs.create` to open `https://calendar.google.com` when
the user clicks an event row in the popup, and to open the Meet URL when
the user clicks the "MEET" button. No tab content is read via this
permission.

### `host_permissions: https://calendar.google.com/*`
Required by the content script that reads event data directly from the
Google Calendar page the user is already viewing. The content script runs
only on this origin, reads only event metadata visible in the DOM (title,
time, Meet link), and sends the extracted events to the extension's service
worker via `chrome.runtime.sendMessage`. No data leaves the browser.

### Remote code use
**None.** All JavaScript is bundled with the extension. No `eval`, no
runtime script download, no remote CDN.

---

## Privacy policy URL

Host `PRIVACY.md` (in the repo root) publicly and paste its URL here.

Recommended options:

- **GitHub Pages** (free): enable Pages on the extension's repo, point to
  the default branch; the raw markdown will render at
  `https://<user>.github.io/<repo>/PRIVACY.html` (convert with any static
  tool) or use a `.md` viewer. Easiest: make a separate repo
  `gcal-notifier-privacy` with just `index.html` containing the policy.
- **Gist**: paste `PRIVACY.md` into a public Gist and use the Gist URL.
- **Your own domain**: any public HTML page works.

---

## Screenshots plan (1280×800 PNG)

Minimum 1, recommended 3–5. Capture these after enabling the extension:

1. **Hero shot** — Popup on the `UPCOMING` tab with 4–5 realistic events,
   one with a MEET button visible, showing phosphor theme.
2. **Digest tab** — Popup on `DIGEST` with today's 3–4 events.
3. **Settings tab** — Popup on `SETTINGS` showing language radio + notify
   chips + digest section.
4. **Guide tab** — Popup on `GUIDE` showing the box-drawing headings and FAQ.
5. **Desktop notification** — OS-level notification firing with phosphor
   icon visible.

### How to capture

- Open the popup detached (Puppeteer, or via a temporary
  `chrome.action.openPopup()` from DevTools).
- Use `Cmd+Shift+4` on macOS, then crop to 1280×800 in Preview.
- Keep a dark desktop background so the dark popup does not look floating.

---

## Promotional images (optional)

| Size        | Use                           |
|-------------|-------------------------------|
| 440×280     | Small promo tile (homepage)   |
| 920×680     | Large promo tile              |
| 1400×560    | Marquee (for featured slots)  |

These are optional. Submitting without them is fine.
