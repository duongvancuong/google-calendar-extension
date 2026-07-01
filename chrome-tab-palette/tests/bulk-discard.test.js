const BulkDiscard = require('../src/bulk-discard');

const cur = { id: 1, windowId: 10 };

describe('BulkDiscard.discardableTabIds', () => {
  it('returns tabs in the current window, including pinned', () => {
    const tabs = [
      { id: 2, windowId: 10, pinned: false, discarded: false },
      { id: 3, windowId: 10, pinned: true, discarded: false },
    ];
    expect(BulkDiscard.discardableTabIds(tabs, cur)).toEqual([2, 3]);
  });

  it('excludes tabs from other windows', () => {
    const tabs = [
      { id: 2, windowId: 10, discarded: false },
      { id: 3, windowId: 99, discarded: false },
    ];
    expect(BulkDiscard.discardableTabIds(tabs, cur)).toEqual([2]);
  });

  it('excludes already-discarded tabs', () => {
    const tabs = [
      { id: 2, windowId: 10, discarded: true },
      { id: 3, windowId: 10, discarded: false },
    ];
    expect(BulkDiscard.discardableTabIds(tabs, cur)).toEqual([3]);
  });

  it('defensively excludes the current tab id', () => {
    const tabs = [
      { id: 1, windowId: 10, discarded: false },
      { id: 2, windowId: 10, discarded: false },
    ];
    expect(BulkDiscard.discardableTabIds(tabs, cur)).toEqual([2]);
  });

  it('returns [] when current is null', () => {
    expect(BulkDiscard.discardableTabIds([{ id: 2, windowId: 10 }], null)).toEqual([]);
  });

  it('returns [] for an empty list', () => {
    expect(BulkDiscard.discardableTabIds([], cur)).toEqual([]);
  });
});
