// src/mru-store.js — pure operations on the MRU (most-recently-used) tab-id list
(function () {
  'use strict';

  const MAX_MRU = 50;

  function touch(list, tabId) {
    const without = (Array.isArray(list) ? list : []).filter((id) => id !== tabId);
    return [tabId, ...without].slice(0, MAX_MRU);
  }

  function remove(list, tabId) {
    return (Array.isArray(list) ? list : []).filter((id) => id !== tabId);
  }

  function sanitize(raw) {
    if (!Array.isArray(raw)) return [];
    const seen = new Set();
    const out = [];
    for (const v of raw) {
      if (Number.isInteger(v) && v >= 0 && !seen.has(v)) {
        seen.add(v);
        out.push(v);
      }
    }
    return out.slice(0, MAX_MRU);
  }

  function orderTabs(mruIds, tabs) {
    const ids = Array.isArray(mruIds) ? mruIds : [];
    const pos = new Map(ids.map((id, i) => [id, i]));
    const list = Array.isArray(tabs) ? tabs.slice() : [];
    const inMru = list
      .filter((t) => pos.has(t.id))
      .sort((a, b) => pos.get(a.id) - pos.get(b.id));
    const rest = list
      .filter((t) => !pos.has(t.id))
      .sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0));
    return [...inMru, ...rest];
  }

  const MruStore = { MAX_MRU, touch, remove, sanitize, orderTabs };

  if (typeof module !== 'undefined') module.exports = MruStore;
  else globalThis.MruStore = MruStore;
})();
