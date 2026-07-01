// src/bulk-close.js — pure logic: which tab ids to close for "close others"
(function () {
  'use strict';

  // Ids of tabs to close when keeping only the current tab: same window as
  // current, not pinned, not the current tab itself. `current` may be null (→ []).
  function closableTabIds(otherTabs, current) {
    if (!current || !Array.isArray(otherTabs)) return [];
    return otherTabs
      .filter((t) => t.windowId === current.windowId && !t.pinned && t.id !== current.id)
      .map((t) => t.id);
  }

  const BulkClose = { closableTabIds };

  if (typeof module !== 'undefined') module.exports = BulkClose;
  else globalThis.BulkClose = BulkClose;
})();
