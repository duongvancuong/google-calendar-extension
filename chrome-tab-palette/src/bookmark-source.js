// src/bookmark-source.js — thin adapter over chrome.bookmarks / chrome.tabs.create
(function () {
  'use strict';

  function parseHostname(url) {
    try {
      return new URL(url).hostname || '';
    } catch (e) {
      return '';
    }
  }

  function normalizeBookmark(node) {
    const n = node || {};
    return {
      kind: 'bookmark',
      id: n.id,
      title: n.title || n.url || '',
      url: n.url || '',
      hostname: parseHostname(n.url || ''),
    };
  }

  // Depth-first: collect every descendant that has a url (folders have no url).
  function flattenTree(nodes) {
    const out = [];
    const walk = (list) => {
      (list || []).forEach((node) => {
        if (node && node.url) out.push(normalizeBookmark(node));
        if (node && node.children) walk(node.children);
      });
    };
    walk(nodes);
    return out;
  }

  const BookmarkSource = { normalizeBookmark, flattenTree };

  if (typeof module !== 'undefined') module.exports = BookmarkSource;
  else globalThis.BookmarkSource = BookmarkSource;
})();
