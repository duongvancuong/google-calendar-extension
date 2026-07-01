// src/bulk-discard.js — pure logic: which tab ids to end-task (discard) for "discard others"
(function () {
  'use strict';

  // Ids of tabs to discard when keeping only the current tab: same window as
  // current, not the current tab itself, and not already discarded. Pinned tabs
  // ARE included — discard only frees memory, the tab stays in the strip.
  // `current` may be null (→ []).
  function discardableTabIds(otherTabs, current) {
    if (!current || !Array.isArray(otherTabs)) return [];
    return otherTabs
      .filter((t) => t.windowId === current.windowId && t.id !== current.id && !t.discarded)
      .map((t) => t.id);
  }

  const BulkDiscard = { discardableTabIds };

  if (typeof module !== 'undefined') module.exports = BulkDiscard;
  else globalThis.BulkDiscard = BulkDiscard;
})();
