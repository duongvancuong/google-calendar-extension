const TabSource = require('../src/tab-source');

describe('TabSource.normalizeTab', () => {
  it('extracts hostname from the url', () => {
    const n = TabSource.normalizeTab({ id: 1, windowId: 2, title: 'X', url: 'https://github.com/a/b' });
    expect(n.hostname).toBe('github.com');
  });

  it('falls back to empty hostname for an unparseable url', () => {
    const n = TabSource.normalizeTab({ id: 1, url: 'not a url' });
    expect(n.hostname).toBe('');
    expect(n.title).toBe('');
  });
});

describe('TabSource.queryTabs', () => {
  it('maps chrome.tabs.query results through normalizeTab', async () => {
    chrome.tabs.query.mockResolvedValue([
      { id: 1, windowId: 9, title: 'GitHub', url: 'https://github.com/', lastAccessed: 5 },
    ]);
    const tabs = await TabSource.queryTabs();
    expect(chrome.tabs.query).toHaveBeenCalledWith({});
    expect(tabs[0]).toMatchObject({ id: 1, windowId: 9, hostname: 'github.com', lastAccessed: 5 });
  });
});

describe('TabSource.activateTab', () => {
  it('activates the tab and focuses its window', async () => {
    await TabSource.activateTab({ id: 7, windowId: 3 });
    expect(chrome.tabs.update).toHaveBeenCalledWith(7, { active: true });
    expect(chrome.windows.update).toHaveBeenCalledWith(3, { focused: true });
  });
});

describe('TabSource.closeTab', () => {
  it('removes the tab by id', async () => {
    await TabSource.closeTab(4);
    expect(chrome.tabs.remove).toHaveBeenCalledWith(4);
  });
});

describe('TabSource.discardTab', () => {
  it('discards the tab by id', async () => {
    await TabSource.discardTab(8);
    expect(chrome.tabs.discard).toHaveBeenCalledWith(8);
  });
});

describe('TabSource.normalizeTab discarded', () => {
  it('maps discarded true', () => {
    expect(TabSource.normalizeTab({ id: 1, discarded: true }).discarded).toBe(true);
  });

  it('defaults discarded to false when missing', () => {
    expect(TabSource.normalizeTab({ id: 1 }).discarded).toBe(false);
  });
});

describe('TabSource.normalizeTab pinned', () => {
  it('maps pinned true', () => {
    expect(TabSource.normalizeTab({ id: 1, pinned: true }).pinned).toBe(true);
  });

  it('defaults pinned to false when missing', () => {
    expect(TabSource.normalizeTab({ id: 1 }).pinned).toBe(false);
  });
});

describe('TabSource.closeTabs', () => {
  it('removes multiple tabs by id array', async () => {
    await TabSource.closeTabs([2, 3, 4]);
    expect(chrome.tabs.remove).toHaveBeenCalledWith([2, 3, 4]);
  });

  it('is a no-op for an empty array', async () => {
    await TabSource.closeTabs([]);
    expect(chrome.tabs.remove).not.toHaveBeenCalled();
  });
});
