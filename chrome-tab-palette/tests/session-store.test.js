const SessionStore = require('../src/session-store');

describe('SessionStore.loadMru', () => {
  it('returns a sanitized array from storage.session', async () => {
    chrome.storage.session.get.mockResolvedValue({ mru: [1, '2', 2, 3] });
    const out = await SessionStore.loadMru();
    expect(out).toEqual([1, 2, 3]); // '2' dropped
  });

  it('returns [] when nothing is stored', async () => {
    chrome.storage.session.get.mockResolvedValue({});
    expect(await SessionStore.loadMru()).toEqual([]);
  });
});

describe('SessionStore.saveMru', () => {
  it('writes a sanitized list to the mru key', async () => {
    chrome.storage.session.set.mockResolvedValue();
    await SessionStore.saveMru([5, 5, -1, 7]);
    expect(chrome.storage.session.set).toHaveBeenCalledWith({ mru: [5, 7] });
  });
});
