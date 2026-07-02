// src/result-merge.js — pure rule for combining tab + bookmark result rows
(function () {
  'use strict';

  // Empty query → tabs only (preserves the Alt-Tab flow).
  // Non-empty query → tabs first, then bookmarks.
  function mergeResults(query, tabRows, bookmarkRows) {
    const tabs = tabRows || [];
    const hasQuery = String(query || '').trim() !== '';
    if (!hasQuery) return [...tabs];
    return [...tabs, ...(bookmarkRows || [])];
  }

  const ResultMerge = { mergeResults };

  if (typeof module !== 'undefined') module.exports = ResultMerge;
  else globalThis.ResultMerge = ResultMerge;
})();
