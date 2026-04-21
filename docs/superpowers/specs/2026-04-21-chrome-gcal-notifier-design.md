# Chrome Google Calendar Notifier — Design Spec

**Date:** 2026-04-21  
**Status:** Approved  
**Scope:** Chrome extension cá nhân, load unpacked trực tiếp vào Chrome

---

## Tổng quan

Chrome extension hiển thị desktop notification, badge trên toolbar, và popup đầy đủ cho sự kiện Google Calendar. Bắt đầu bằng content script scraping từ `calendar.google.com`, thiết kế sẵn chỗ để tích hợp Google Calendar API sau khi có Google Cloud credentials.

---

## Kiến trúc

```
chrome-gcal-notifier/
├── manifest.json
├── background/
│   └── service-worker.js
├── content/
│   └── calendar-scraper.js
├── popup/
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
└── src/
    ├── calendar-api.js
    ├── event-store.js
    ├── notifier.js
    └── scheduler.js
```

### Data Flow

1. Content script scrape events từ DOM → message đến service worker
2. Service worker lưu vào `chrome.storage.local`
3. `chrome.alarms` trigger đúng thời điểm (X phút trước event)
4. Service worker dispatch desktop notification với quick actions
5. Popup đọc từ storage để hiển thị danh sách + settings

---

## Data Model

### Event

```js
{
  id: "gcal_<hash>",         // hash từ title + startTime để dedup
  title: string,
  startTime: number,         // Unix timestamp ms
  endTime: number,
  location: string | null,
  meetLink: string | null,
  calendarName: string,
  notifiedAt: number[],      // danh sách phút đã notify (vd: [5, 15])
  source: "scrape" | "api"
}
```

### Storage Schema (`chrome.storage.local`)

```js
{
  events: Event[],           // events từ hôm nay đến 7 ngày tới
  settings: {
    notifyBefore: number[],  // phút trước — user tự cài (vd: [10, 30])
    dailyDigestTime: string, // "HH:MM" (vd: "08:00")
    digestEnabled: boolean,
    apiEnabled: boolean      // bật khi có Google Cloud credentials
  },
  lastScrapedAt: number      // Unix timestamp ms
}
```

---

## Scraping

**Target:** `calendar.google.com/*`

**Cơ chế:**
- Content script inject vào tất cả URL của Google Calendar
- Dùng `MutationObserver` theo dõi DOM thay đổi (Calendar là SPA)
- Mỗi khi phát hiện thay đổi, parse lại events và gửi về service worker qua `chrome.runtime.sendMessage`
- Scrape events từ hôm nay đến 7 ngày tới

**Hạn chế đã biết:**
- Chỉ hoạt động khi tab `calendar.google.com` đang mở
- Dễ bị break nếu Google thay đổi DOM — sẽ được thay thế bằng Calendar API sau

---

## Notification & Quick Actions

### Event Notification

```
┌─────────────────────────────────────────┐
│ 🗓 Google Calendar                       │
│ <title> — bắt đầu sau <X> phút         │
│ <startTime> - <endTime> | <location>    │
│ [Snooze 5p]  [Mở Calendar]  [Đã biết]  │
└─────────────────────────────────────────┘
```

**Quick Actions:**
- **Snooze 5p** — tạo lại alarm sau 5 phút
- **Mở Calendar** — `chrome.tabs.create` mở `calendar.google.com`
- **Đã biết** — đóng, đánh dấu `notifiedAt` để không lặp lại

### Daily Digest

Trigger mỗi sáng theo `settings.dailyDigestTime`:

```
┌─────────────────────────────────────────┐
│ 🗓 Lịch hôm nay — <Thứ DD/MM>          │
│ • HH:MM  <title> (<duration>)           │
│ • ...                                   │
│ [Xem chi tiết]                          │
└─────────────────────────────────────────┘
```

---

## Alarm Scheduling (`scheduler.js`)

- Khi có events mới → tính tất cả thời điểm cần notify: `startTime - X*60000` với mỗi X trong `settings.notifyBefore`
- Tạo `chrome.alarms` với tên: `event_<id>_<minutes>before`
- Service worker lắng nghe `chrome.alarms.onAlarm` → dispatch notification
- Alarm cho daily digest: `daily_digest`

---

## Popup UI

3 tab:

### Tab "Upcoming Events"
- Danh sách events hôm nay và các ngày tới (nhóm theo ngày)
- Badge `●` cho events hôm nay, `○` cho ngày khác
- Link Meet/location nếu có
- Nút "Mở Google Calendar"

### Tab "Digest"
- Hiển thị digest hôm nay
- Nút "Gửi digest ngay" để preview

### Tab "Settings"
- **Thông báo trước:** danh sách phút tùy chỉnh, có thể thêm/xóa
- **Daily digest:** toggle + giờ nhận
- **Nguồn dữ liệu:** Scraping (mặc định) hoặc Calendar API
- **Calendar API credentials:** field ẩn, hiển thị khi chọn Calendar API

**Badge trên icon extension:** số events còn lại hôm nay.

---

## Tech Stack

| Thành phần | Công nghệ |
|---|---|
| Extension | Chrome Manifest V3 |
| Background | Service Worker |
| Popup UI | HTML + CSS + Vanilla JS |
| Storage | `chrome.storage.local` |
| Notifications | `chrome.notifications` API |
| Scheduling | `chrome.alarms` API |
| Scraping | Content Script + MutationObserver |
| API (tương lai) | Google Calendar REST API v3 + `chrome.identity` |

---

## Phạm vi không bao gồm (v1)

- Sync hai chiều (tạo/sửa/xóa event từ extension)
- Hỗ trợ nhiều Google account
- Notifications cho nhiều loại calendar khác (Outlook, iCal)
- Chrome Web Store publishing

---

## Hướng phát triển sau

1. **Tích hợp Google Calendar API** — khi có Google Cloud project, bật `apiEnabled`, dùng `chrome.identity.getAuthToken` để lấy OAuth token
2. **Fallback logic** — nếu API lỗi, tự động dùng scraping
3. **Meet link detection** — parse conference data từ API response (chính xác hơn scraping)
