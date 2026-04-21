// popup/popup.js
(function () {
  'use strict';

  // ── Tab navigation ───────────────────────────────────────────────
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
    });
  });

  // ── Helpers ──────────────────────────────────────────────────────
  function pad(n) { return String(n).padStart(2, '0'); }

  function fmtTime(ts) {
    const d = new Date(ts);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function dayLabel(ts) {
    const d = new Date(ts);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (d >= today && d < tomorrow) return 'HÔM NAY';
    if (d >= tomorrow && d < new Date(tomorrow.getTime() + 86400000)) return 'NGÀY MAI';
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return `${days[d.getDay()]} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
  }

  function isToday(ts) {
    const d = new Date(ts);
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ── Upcoming tab ─────────────────────────────────────────────────
  async function renderUpcoming() {
    const events = await EventStore.getEvents();
    const now = Date.now();
    const endOfTomorrow = new Date();
    endOfTomorrow.setDate(endOfTomorrow.getDate() + 1);
    endOfTomorrow.setHours(23, 59, 59, 999);
    const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
    const upcoming = events
      .filter((e) => e.endTime >= startOfToday.getTime() && e.startTime <= endOfTomorrow.getTime())
      .sort((a, b) => a.startTime - b.startTime);

    const container = document.getElementById('events-list');
    if (upcoming.length === 0) {
      container.innerHTML = '<p class="empty-state">Không có sự kiện sắp tới.<br>Mở Google Calendar để tải dữ liệu.</p>';
      return;
    }

    let lastGroup = null;
    let html = '';
    for (const event of upcoming) {
      const group = dayLabel(event.startTime);
      if (group !== lastGroup) {
        html += `<div class="event-group-header">${group}</div>`;
        lastGroup = group;
      }
      const dotClass = isToday(event.startTime) ? '' : 'future';
      const meetHtml = event.meetLink && event.meetLink.startsWith('https://meet.google.com/')
        ? `<a class="event-link" href="${escapeHtml(event.meetLink)}" target="_blank">Meet</a>`
        : '';
      html += `
        <div class="event-item">
          <div class="event-dot ${dotClass}"></div>
          <div class="event-info">
            <div class="event-title">${escapeHtml(event.title)}</div>
            <div class="event-time">${fmtTime(event.startTime)} – ${fmtTime(event.endTime)}</div>
          </div>
          ${meetHtml}
        </div>`;
    }
    container.innerHTML = html;
  }

  document.getElementById('open-calendar').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://calendar.google.com' });
  });

  // ── Digest tab ───────────────────────────────────────────────────
  async function renderDigest() {
    const events = await EventStore.getEvents();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const todayEvents = events
      .filter((e) => e.startTime >= startOfDay.getTime() && e.startTime < endOfDay.getTime())
      .sort((a, b) => a.startTime - b.startTime);

    const container = document.getElementById('digest-content');
    if (todayEvents.length === 0) {
      container.innerHTML = '<p class="empty-state">Không có sự kiện hôm nay.</p>';
      return;
    }

    const rows = todayEvents.map(
      (e) => `<div class="event-item">
        <div class="event-dot"></div>
        <div class="event-info">
          <div class="event-title">${escapeHtml(e.title)}</div>
          <div class="event-time">${fmtTime(e.startTime)} – ${fmtTime(e.endTime)}</div>
        </div>
      </div>`
    );
    container.innerHTML = rows.join('');
  }

  document.getElementById('send-digest-now').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'SEND_DIGEST_NOW' });
  });

  // ── Settings tab ─────────────────────────────────────────────────
  async function renderSettings() {
    const settings = await EventStore.getSettings();

    renderNotifyChips(settings.notifyBefore);
    document.getElementById('digest-enabled').checked = settings.digestEnabled;
    document.getElementById('digest-time').value = settings.dailyDigestTime;
    document.querySelector(`input[name="source"][value="${settings.apiEnabled ? 'api' : 'scrape'}"]`).checked = true;
    document.getElementById('api-credentials').classList.toggle('hidden', !settings.apiEnabled);
  }

  function renderNotifyChips(minutes) {
    const container = document.getElementById('notify-chips');
    container.innerHTML = minutes
      .sort((a, b) => a - b)
      .map(
        (m) => `<span class="chip">${m}p
          <button class="chip-remove" data-minutes="${m}" title="Xóa">×</button>
        </span>`
      )
      .join('');

    container.querySelectorAll('.chip-remove').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const settings = await EventStore.getSettings();
        const updated = Object.assign({}, settings, {
          notifyBefore: settings.notifyBefore.filter((m) => m !== Number(btn.dataset.minutes)),
        });
        await EventStore.saveSettings(updated);
        renderNotifyChips(updated.notifyBefore);
      });
    });
  }

  document.getElementById('add-minutes').addEventListener('click', async () => {
    const input = document.getElementById('new-minutes');
    const val = parseInt(input.value, 10);
    if (!val || val < 1 || val > 120) return;
    const settings = await EventStore.getSettings();
    if (settings.notifyBefore.includes(val)) { input.value = ''; return; }
    const updated = Object.assign({}, settings, {
      notifyBefore: [...settings.notifyBefore, val].sort((a, b) => a - b),
    });
    await EventStore.saveSettings(updated);
    renderNotifyChips(updated.notifyBefore);
    input.value = '';
  });

  document.querySelectorAll('input[name="source"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      document.getElementById('api-credentials').classList.toggle('hidden', radio.value !== 'api');
    });
  });

  document.getElementById('save-settings').addEventListener('click', async () => {
    const settings = await EventStore.getSettings();
    const updated = Object.assign({}, settings, {
      digestEnabled: document.getElementById('digest-enabled').checked,
      dailyDigestTime: document.getElementById('digest-time').value,
      apiEnabled: document.querySelector('input[name="source"]:checked').value === 'api',
    });
    await EventStore.saveSettings(updated);
    const btn = document.getElementById('save-settings');
    btn.textContent = 'Đã lưu ✓';
    setTimeout(() => { btn.textContent = 'Lưu Settings'; }, 1500);
  });

  // ── Init ─────────────────────────────────────────────────────────
  renderUpcoming();
  renderDigest();
  renderSettings();
})();
