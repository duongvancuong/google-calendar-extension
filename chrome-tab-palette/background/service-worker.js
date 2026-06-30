// background/service-worker.js — track tab-activation order into storage.session
importScripts('../src/mru-store.js', '../src/session-store.js');

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const list = await SessionStore.loadMru();
    await SessionStore.saveMru(MruStore.touch(list, tabId));
  } catch (e) {
    console.error('[tab-palette] onActivated failed', e);
  }
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  try {
    const list = await SessionStore.loadMru();
    await SessionStore.saveMru(MruStore.remove(list, tabId));
  } catch (e) {
    console.error('[tab-palette] onRemoved failed', e);
  }
});
