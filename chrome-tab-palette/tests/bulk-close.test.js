const BulkClose = require('../src/bulk-close');

const cur = { id: 1, windowId: 10 };

describe('BulkClose.closableTabIds', () => {
  it('returns non-pinned tabs in the current window', () => {
    const tabs = [
      { id: 2, windowId: 10, pinned: false },
      { id: 3, windowId: 10, pinned: false },
    ];
    expect(BulkClose.closableTabIds(tabs, cur)).toEqual([2, 3]);
  });

  it('excludes tabs from other windows', () => {
    const tabs = [
      { id: 2, windowId: 10, pinned: false },
      { id: 3, windowId: 99, pinned: false },
    ];
    expect(BulkClose.closableTabIds(tabs, cur)).toEqual([2]);
  });

  it('excludes pinned tabs', () => {
    const tabs = [
      { id: 2, windowId: 10, pinned: true },
      { id: 3, windowId: 10, pinned: false },
    ];
    expect(BulkClose.closableTabIds(tabs, cur)).toEqual([3]);
  });

  it('defensively excludes the current tab id', () => {
    const tabs = [
      { id: 1, windowId: 10, pinned: false },
      { id: 2, windowId: 10, pinned: false },
    ];
    expect(BulkClose.closableTabIds(tabs, cur)).toEqual([2]);
  });

  it('returns [] when current is null', () => {
    expect(BulkClose.closableTabIds([{ id: 2, windowId: 10 }], null)).toEqual([]);
  });

  it('returns [] for an empty list', () => {
    expect(BulkClose.closableTabIds([], cur)).toEqual([]);
  });
});
