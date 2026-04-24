# GCal Notifier

Retro terminal-style desktop reminders for Google Calendar. Daily digest,
quick Meet access, bilingual UI (VI / EN). Local-only — no servers, no
tracking, no account.

![tabs](docs/screenshots/upcoming.png)

---

## Install

GCal Notifier is distributed via **GitHub Releases** using Chrome's
"Load unpacked" mode. You don't need a Chrome Web Store account; the trade-off
is that auto-update is manual — re-download when a new release ships.

### 1. Download the latest release

Go to the
[**Releases page**](https://github.com/duongvancuong/google-calendar-extension/releases/latest)
and download `gcal-notifier-v<version>.zip` from the Assets section.

### 2. Unzip

Extract the zip to a permanent location on your machine (e.g.
`~/Applications/gcal-notifier/`). **Do not delete or move this folder** after
installing — Chrome reads the extension from it every time it starts.

### 3. Load it into Chrome

1. Open `chrome://extensions` in Chrome (or Edge, Brave, Arc — any
   Chromium-based browser).
2. Enable the **Developer mode** toggle in the top-right corner.
3. Click **Load unpacked**.
4. Select the unzipped `gcal-notifier-v<version>` folder.
5. GCal Notifier appears in your toolbar. Pin it if you like.

### 4. First use

1. Open [`calendar.google.com`](https://calendar.google.com) and keep it open.
2. Click the GCal Notifier icon in the toolbar → the popup shows upcoming
   events.
3. Open the **Guide** tab for a quick tour.
4. Switch language (VI ↔ EN) in **Settings** if needed.

### Updating to a new version

1. Download the newer zip from Releases.
2. Unzip it over the existing folder (or into a new folder and repoint
   Chrome via `chrome://extensions` → **Remove** the old, **Load unpacked**
   the new).
3. Click the circular refresh icon on the extension card in
   `chrome://extensions` if Chrome does not pick up the change.

---

## Cài đặt (Tiếng Việt)

GCal Notifier được phân phối qua **GitHub Releases** với chế độ "Load
unpacked" của Chrome. Bạn không cần tài khoản Chrome Web Store; đánh đổi là
không tự động cập nhật — khi có bản mới bạn tải lại.

### 1. Tải bản mới nhất

Vào
[**trang Releases**](https://github.com/duongvancuong/google-calendar-extension/releases/latest)
và tải `gcal-notifier-v<version>.zip` ở mục Assets.

### 2. Giải nén

Giải nén zip ra một thư mục cố định trên máy (ví dụ
`~/Applications/gcal-notifier/`). **Không xóa hoặc di chuyển** thư mục này
sau khi cài — Chrome đọc extension từ đây mỗi lần khởi động.

### 3. Load vào Chrome

1. Mở `chrome://extensions` trong Chrome (hoặc Edge, Brave, Arc — bất kỳ
   trình duyệt Chromium nào).
2. Bật toggle **Developer mode** ở góc phải trên.
3. Bấm **Load unpacked**.
4. Chọn thư mục `gcal-notifier-v<version>` vừa giải nén.
5. GCal Notifier hiện trong toolbar. Ghim lại nếu muốn.

### 4. Sử dụng lần đầu

1. Mở [`calendar.google.com`](https://calendar.google.com) và giữ tab đó mở.
2. Bấm icon GCal Notifier → popup hiển thị sự kiện sắp tới.
3. Mở tab **Guide** để xem hướng dẫn nhanh.
4. Đổi ngôn ngữ (VI ↔ EN) trong **Settings** nếu cần.

### Cập nhật bản mới

1. Tải zip mới từ Releases.
2. Giải nén đè lên thư mục cũ (hoặc giải nén vào thư mục mới rồi
   `chrome://extensions` → **Remove** bản cũ, **Load unpacked** bản mới).
3. Bấm nút refresh hình tròn trên card extension ở `chrome://extensions`
   nếu Chrome chưa nhận thay đổi.

---

## Features

- Pre-event desktop reminders at any minute offset you configure.
- Daily digest notification with today's schedule at a chosen time.
- Quick Meet button on each event row in the popup.
- 5-minute snooze on every reminder.
- Bilingual UI with instant VI / EN switching.
- Retro phosphor-green terminal theme.
- 100% local: no servers, no analytics, no tracking.

## Privacy

See [`PRIVACY.md`](./PRIVACY.md). Short version: nothing leaves your browser.

## Development

```bash
# Install dev deps
npm install

# Run tests
npm test

# Package a release-ready zip into ./dist/
./scripts/package.sh
```

Design docs (specs, plans) live locally under `docs/` at the repo root and
are intentionally untracked.

## License

Personal project — contact the author before redistribution.

## Author

Cuong Duong — duong.van.cuong@sun-asterisk.com
