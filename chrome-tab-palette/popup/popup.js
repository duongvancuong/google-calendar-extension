// popup/popup.js — wires the palette UI to the pure logic modules
(function () {
  'use strict';

  const els = {
    search: document.getElementById('search'),
    results: document.getElementById('results'),
    empty: document.getElementById('empty'),
    langToggle: document.getElementById('lang-toggle'),
  };

  const state = { tabs: [], bookmarks: [], rows: [], selected: 0, query: '', current: null };

  function computeRows() {
    const tabRows = Fuzzy.rank(state.query, state.tabs);
    const bookmarkRows = Fuzzy.rank(state.query, state.bookmarks);
    state.rows = ResultMerge.mergeResults(state.query, tabRows, bookmarkRows);
    if (state.selected >= state.rows.length) state.selected = 0;
  }

  function render() {
    computeRows();
    els.results.innerHTML = '';

    if (state.rows.length === 0) {
      els.empty.hidden = false;
      els.empty.textContent = I18n.t(state.query.trim() === '' ? 'empty.noTabs' : 'empty.noMatch');
      return;
    }
    els.empty.hidden = true;

    const frag = document.createDocumentFragment();
    state.rows.forEach((row, i) => {
      const isBookmark = row.item.kind === 'bookmark';
      const li = document.createElement('li');
      li.className =
        'row' +
        (i === state.selected ? ' selected' : '') +
        (isBookmark ? ' bookmark' : '') +
        (row.item.discarded ? ' discarded' : '');
      li.dataset.index = String(i);
      li.setAttribute('role', 'option');

      const title = document.createElement('div');
      title.className = 'row-title';
      if (isBookmark) {
        const badge = document.createElement('span');
        badge.className = 'row-badge';
        badge.textContent = '★';
        title.appendChild(badge);
      }
      const titleText = document.createElement('span');
      titleText.innerHTML = Fuzzy.highlight(row.item.title || row.item.url, row.titleRanges);
      title.appendChild(titleText);

      const host = document.createElement('div');
      host.className = 'row-host';
      host.innerHTML = Fuzzy.highlight(row.item.hostname, row.hostnameRanges);

      li.appendChild(title);
      li.appendChild(host);
      frag.appendChild(li);
    });
    els.results.appendChild(frag);

    const selectedEl = els.results.querySelector('.row.selected');
    if (selectedEl) selectedEl.scrollIntoView({ block: 'nearest' });
  }

  async function jump() {
    const row = state.rows[state.selected];
    if (!row) return;
    try {
      if (row.item.kind === 'bookmark') {
        await BookmarkSource.openBookmark(row.item.url);
      } else {
        await TabSource.activateTab(row.item);
      }
      window.close();
    } catch (e) {
      console.error('[tab-palette] open failed', e);
      await reload();
    }
  }

  async function closeSelected() {
    const row = state.rows[state.selected];
    if (!row) return;
    if (row.item.kind !== 'tab') return; // close applies to tabs only
    try {
      await TabSource.closeTab(row.item.id);
      state.tabs = MruStore.remove(state.tabs.map((t) => t.id), row.item.id)
        .map((id) => state.tabs.find((t) => t.id === id));
      render();
      els.search.focus();
    } catch (e) {
      console.error('[tab-palette] close failed', e);
      await reload();
    }
  }

  async function discardSelected() {
    const row = state.rows[state.selected];
    if (!row) return;
    if (row.item.kind !== 'tab') return; // discard applies to tabs only
    if (row.item.active || row.item.discarded) return; // active tabs can't be discarded; already-discarded is a no-op
    try {
      await TabSource.discardTab(row.item.id);
      state.tabs = state.tabs.map((t) =>
        t.id === row.item.id ? { ...t, discarded: true } : t
      );
      render();
      els.search.focus();
    } catch (e) {
      console.error('[tab-palette] discard failed', e);
      await reload();
    }
  }

  async function discardOthers() {
    const ids = BulkDiscard.discardableTabIds(state.tabs, state.current);
    if (ids.length === 0) return; // nothing to end task
    try {
      await TabSource.discardTabs(ids);
    } catch (e) {
      console.error('[tab-palette] discard others failed', e);
    }
    await reload(); // reflect the freshly-discarded state (glyph on each row)
    els.search.focus();
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown' || (e.ctrlKey && e.key === 'n')) {
      e.preventDefault();
      state.selected = Selection.move(state.selected, 1, state.rows.length);
      render();
    } else if (e.key === 'ArrowUp' || (e.ctrlKey && e.key === 'p')) {
      e.preventDefault();
      state.selected = Selection.move(state.selected, -1, state.rows.length);
      render();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      jump();
    } else if (e.ctrlKey && e.shiftKey && e.key === 'Backspace') {
      e.preventDefault();
      discardSelected();
    } else if (e.ctrlKey && e.shiftKey && (e.key === 'd' || e.key === 'D')) {
      e.preventDefault();
      discardOthers();
    } else if (e.ctrlKey && e.key === 'Backspace') {
      e.preventDefault();
      closeSelected();
    } else if (e.key === 'Delete' && els.search.value === '') {
      e.preventDefault();
      closeSelected();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      window.close();
    }
  }

  function onInput() {
    state.query = els.search.value;
    state.selected = 0;
    render();
  }

  async function onToggleLang() {
    const next = I18n.getLang() === 'vi' ? 'en' : 'vi';
    await I18n.setLang(next);
    I18n.applyToDOM();
    render();
  }

  els.results.addEventListener('click', (e) => {
    const li = e.target.closest('.row');
    if (!li) return;
    state.selected = Number(li.dataset.index);
    jump();
  });

  async function reload() {
    const [current, all, mru, bookmarks] = await Promise.all([
      TabSource.getCurrentTab(),
      TabSource.queryTabs(),
      SessionStore.loadMru(),
      BookmarkSource.queryBookmarks().catch((e) => {
        console.error('[tab-palette] bookmarks load failed', e);
        return [];
      }),
    ]);
    const others = all.filter((t) => !current || t.id !== current.id);
    state.current = current;
    state.tabs = MruStore.orderTabs(mru, others);
    state.bookmarks = bookmarks;
    render();
  }

  async function init() {
    await I18n.init();
    I18n.applyToDOM();
    els.search.addEventListener('input', onInput);
    els.search.addEventListener('keydown', onKeyDown);
    els.langToggle.addEventListener('click', onToggleLang);
    await reload();
    els.search.focus();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
