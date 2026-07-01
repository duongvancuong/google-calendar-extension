// src/tab-source.js — thin adapter over chrome.tabs / chrome.windows
(function () {
  'use strict';

  function parseHostname(url) {
    try {
      return new URL(url).hostname || '';
    } catch (e) {
      return '';
    }
  }

  function normalizeTab(raw) {
    const r = raw || {};
    return {
      id: r.id,
      windowId: r.windowId,
      title: r.title || '',
      url: r.url || '',
      hostname: parseHostname(r.url || ''),
      favIconUrl: r.favIconUrl || '',
      lastAccessed: r.lastAccessed || 0,
      active: Boolean(r.active),
      discarded: Boolean(r.discarded),
      pinned: Boolean(r.pinned),
    };
  }

  async function queryTabs() {
    const tabs = await chrome.tabs.query({});
    return (tabs || []).map(normalizeTab);
  }

  async function getCurrentTab() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs && tabs[0] ? normalizeTab(tabs[0]) : null;
  }

  async function activateTab(tab) {
    await chrome.tabs.update(tab.id, { active: true });
    await chrome.windows.update(tab.windowId, { focused: true });
  }

  async function closeTab(id) {
    await chrome.tabs.remove(id);
  }

  async function closeTabs(ids) {
    if (!ids || ids.length === 0) return;
    await chrome.tabs.remove(ids);
  }

  async function discardTab(id) {
    await chrome.tabs.discard(id);
  }

  const TabSource = { normalizeTab, queryTabs, getCurrentTab, activateTab, closeTab, closeTabs, discardTab };

  if (typeof module !== 'undefined') module.exports = TabSource;
  else globalThis.TabSource = TabSource;
})();
