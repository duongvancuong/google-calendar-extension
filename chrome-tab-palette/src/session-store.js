// src/session-store.js — persist the MRU tab-id list in chrome.storage.session
(function () {
  'use strict';

  const MruStore = (typeof require !== 'undefined')
    ? require('./mru-store')
    : globalThis.MruStore;

  const MRU_KEY = 'mru';

  async function loadMru() {
    const result = await chrome.storage.session.get(MRU_KEY);
    return MruStore.sanitize(result ? result[MRU_KEY] : []);
  }

  async function saveMru(list) {
    await chrome.storage.session.set({ [MRU_KEY]: MruStore.sanitize(list) });
  }

  const SessionStore = { MRU_KEY, loadMru, saveMru };

  if (typeof module !== 'undefined') module.exports = SessionStore;
  else globalThis.SessionStore = SessionStore;
})();
