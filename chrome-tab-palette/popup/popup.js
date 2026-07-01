// popup/popup.js — wires the palette UI to the pure logic modules
(function () {
  'use strict';

  const els = {
    search: document.getElementById('search'),
    results: document.getElementById('results'),
    empty: document.getElementById('empty'),
    confirmBar: document.getElementById('confirm-bar'),
    langToggle: document.getElementById('lang-toggle'),
  };

  const state = { tabs: [], rows: [], selected: 0, query: '', current: null, confirmClose: false, pendingCount: 0 };

  function computeRows() {
    state.rows = Fuzzy.rank(state.query, state.tabs);
    if (state.selected >= state.rows.length) state.selected = 0;
  }

  function render() {
    computeRows();
    els.confirmBar.hidden = !state.confirmClose;
    if (state.confirmClose) {
      els.confirmBar.textContent = I18n.t('confirm.closeOthers').replace('%d', String(state.pendingCount));
    }
    els.results.innerHTML = '';

    if (state.rows.length === 0) {
      els.empty.hidden = false;
      els.empty.textContent = I18n.t(state.tabs.length === 0 ? 'empty.noTabs' : 'empty.noMatch');
      return;
    }
    els.empty.hidden = true;

    const frag = document.createDocumentFragment();
    state.rows.forEach((row, i) => {
      const li = document.createElement('li');
      li.className =
        'row' +
        (i === state.selected ? ' selected' : '') +
        (row.item.discarded ? ' discarded' : '');
      li.dataset.index = String(i);
      li.setAttribute('role', 'option');

      const title = document.createElement('div');
      title.className = 'row-title';
      title.innerHTML = Fuzzy.highlight(row.item.title || row.item.url, row.titleRanges);

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
      await TabSource.activateTab(row.item);
      window.close();
    } catch (e) {
      console.error('[tab-palette] activate failed', e);
      await reload();
    }
  }

  async function closeSelected() {
    const row = state.rows[state.selected];
    if (!row) return;
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

  function disarmCloseOthers() {
    state.confirmClose = false;
    state.pendingCount = 0;
  }

  function closeOthers() {
    const ids = BulkClose.closableTabIds(state.tabs, state.current);
    if (ids.length === 0) {
      disarmCloseOthers();
      render();
      return;
    }
    if (!state.confirmClose) {
      state.confirmClose = true;
      state.pendingCount = ids.length;
      render();
      els.search.focus();
      return;
    }
    executeCloseOthers(ids);
  }

  async function executeCloseOthers(ids) {
    disarmCloseOthers();
    try {
      await TabSource.closeTabs(ids);
    } catch (e) {
      console.error('[tab-palette] close others failed', e);
    }
    await reload();
    els.search.focus();
  }

  function onKeyDown(e) {
    if (state.confirmClose) {
      if ((e.ctrlKey && e.altKey && e.key === 'Backspace') || e.key === 'Enter') {
        e.preventDefault();
        closeOthers();
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        disarmCloseOthers();
        render();
        els.search.focus();
        return;
      }
      // any other key cancels the armed state, then falls through to normal handling
      disarmCloseOthers();
      render();
    }

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
    } else if (e.ctrlKey && e.altKey && e.key === 'Backspace') {
      e.preventDefault();
      closeOthers();
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
    const [current, all, mru] = await Promise.all([
      TabSource.getCurrentTab(),
      TabSource.queryTabs(),
      SessionStore.loadMru(),
    ]);
    const others = all.filter((t) => !current || t.id !== current.id);
    state.current = current;
    state.tabs = MruStore.orderTabs(mru, others);
    disarmCloseOthers();
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
