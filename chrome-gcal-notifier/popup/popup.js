// popup/popup.js
(function () {
  'use strict';

  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
    });
  });

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

  function eventGlyph(event, now) {
    if (event.endTime < now) return '░';
    if (isToday(event.startTime)) return '▓';
    return '▒';
  }

  async function renderUpcoming() {
    const [events, mlData] = await Promise.all([
      EventStore.getEvents(),
      new Promise((r) => chrome.storage.local.get('meetLinks', r)),
    ]);
    const meetLinks = mlData.meetLinks || {};
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
      container.innerHTML = `<p class="empty-state"><span class="terminal-prompt">&gt; ${escapeHtml(I18n.t('upcoming.empty'))}</span><span class="blink">_</span></p>`;
      return;
    }

    let lastGroup = null;
    let html = '';
    for (const event of upcoming) {
      const group = I18n.dayLabel(event.startTime);
      if (group !== lastGroup) {
        html += `<div class="event-group-header">${escapeHtml(group)}</div>`;
        lastGroup = group;
      }
      const isPast = event.endTime < now;
      const glyph = eventGlyph(event, now);
      const resolvedMeetLink = meetLinks[event.id] || event.meetLink;
      const meetHtml = resolvedMeetLink && resolvedMeetLink.startsWith('https://meet.google.com/')
        ? `<button class="event-link" data-url="${escapeHtml(resolvedMeetLink)}">${escapeHtml(I18n.t('upcoming.meet'))}</button>`
        : '';
      html += `
        <div class="event-item${isPast ? ' past' : ''}" data-url="https://calendar.google.com" role="button" tabindex="0">
          <span class="event-glyph">${glyph}</span>
          <div class="event-info">
            <div class="event-title">${escapeHtml(event.title)}</div>
            <div class="event-time">${I18n.formatTime(event.startTime)} – ${I18n.formatTime(event.endTime)}</div>
          </div>
          ${meetHtml}
        </div>`;
    }
    container.innerHTML = html;

    container.querySelectorAll('.event-item[data-url]').forEach((item) => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.event-link')) return;
        chrome.tabs.create({ url: item.dataset.url });
      });
    });

    container.querySelectorAll('.event-link[data-url]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        chrome.tabs.create({ url: btn.dataset.url });
      });
    });
  }

  document.getElementById('open-calendar').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://calendar.google.com' });
  });

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
      container.innerHTML = `<p class="empty-state"><span class="terminal-prompt">&gt; ${escapeHtml(I18n.t('digest.empty'))}</span><span class="blink">_</span></p>`;
      return;
    }

    const rows = todayEvents.map(
      (e) => `<div class="event-item">
        <span class="event-glyph">▓</span>
        <div class="event-info">
          <div class="event-title">${escapeHtml(e.title)}</div>
          <div class="event-time">${I18n.formatTime(e.startTime)} – ${I18n.formatTime(e.endTime)}</div>
        </div>
      </div>`
    );
    container.innerHTML = rows.join('');
  }

  document.getElementById('send-digest-now').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'SEND_DIGEST_NOW' });
  });

  async function renderSettings() {
    const settings = await EventStore.getSettings();

    renderNotifyChips(settings.notifyBefore);
    document.getElementById('digest-enabled').checked = settings.digestEnabled;
    document.getElementById('digest-time').value = settings.dailyDigestTime;
    document.querySelector(`input[name="source"][value="${settings.apiEnabled ? 'api' : 'scrape'}"]`).checked = true;
    document.getElementById('api-credentials').classList.toggle('hidden', !settings.apiEnabled);

    const currentLang = I18n.getLang();
    const langRadio = document.querySelector(`input[name="language"][value="${currentLang}"]`);
    if (langRadio) langRadio.checked = true;
  }

  function renderNotifyChips(minutes) {
    const container = document.getElementById('notify-chips');
    container.innerHTML = minutes
      .sort((a, b) => a - b)
      .map(
        (m) => `<span class="chip">${m}p
          <button class="chip-remove" data-minutes="${m}" data-i18n-title="common.remove" title="Remove">×</button>
        </span>`
      )
      .join('');

    I18n.applyToDOM(container);

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

  document.querySelectorAll('input[name="language"]').forEach((radio) => {
    radio.addEventListener('change', async () => {
      if (!radio.checked) return;
      await I18n.setLang(radio.value);
      I18n.applyToDOM(document);
      await renderUpcoming();
      await renderDigest();
    });
  });

  document.getElementById('save-settings').addEventListener('click', async () => {
    const settings = await EventStore.getSettings();
    const updated = Object.assign({}, settings, {
      digestEnabled: document.getElementById('digest-enabled').checked,
      dailyDigestTime: document.getElementById('digest-time').value,
      apiEnabled: document.querySelector('input[name="source"]:checked').value === 'api',
      language: I18n.getLang(),
    });
    await EventStore.saveSettings(updated);
    const btn = document.getElementById('save-settings');
    const original = I18n.t('common.save');
    btn.textContent = I18n.t('common.saved');
    setTimeout(() => { btn.textContent = original; }, 1500);
  });

  (async function init() {
    await I18n.init();
    I18n.applyToDOM(document);
    await renderUpcoming();
    await renderDigest();
    await renderSettings();
  })();
})();
