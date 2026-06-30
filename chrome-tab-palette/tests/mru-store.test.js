const MruStore = require('../src/mru-store');

describe('MruStore.touch', () => {
  it('moves an existing id to the front without duplicating', () => {
    expect(MruStore.touch([3, 1, 2], 2)).toEqual([2, 3, 1]);
  });

  it('prepends a new id', () => {
    expect(MruStore.touch([1, 2], 9)).toEqual([9, 1, 2]);
  });

  it('does not mutate the input array', () => {
    const input = [1, 2];
    MruStore.touch(input, 3);
    expect(input).toEqual([1, 2]);
  });

  it('caps the list at MAX_MRU', () => {
    const big = Array.from({ length: MruStore.MAX_MRU }, (_, i) => i + 1);
    const out = MruStore.touch(big, 999);
    expect(out.length).toBe(MruStore.MAX_MRU);
    expect(out[0]).toBe(999);
  });
});

describe('MruStore.remove', () => {
  it('removes the id and keeps order', () => {
    expect(MruStore.remove([1, 2, 3], 2)).toEqual([1, 3]);
  });
});

describe('MruStore.sanitize', () => {
  it('returns [] for non-arrays', () => {
    expect(MruStore.sanitize(undefined)).toEqual([]);
    expect(MruStore.sanitize('nope')).toEqual([]);
  });

  it('drops non-integers and dedupes', () => {
    expect(MruStore.sanitize([1, '2', 2, -5, 3.5, 4])).toEqual([1, 2, 4]);
  });
});

describe('MruStore.orderTabs', () => {
  const tabs = [
    { id: 10, lastAccessed: 100 },
    { id: 20, lastAccessed: 300 },
    { id: 30, lastAccessed: 200 },
  ];

  it('orders tabs by MRU index, then remaining by lastAccessed desc', () => {
    const out = MruStore.orderTabs([30, 10], tabs);
    expect(out.map((t) => t.id)).toEqual([30, 10, 20]);
  });

  it('falls back entirely to lastAccessed desc when MRU is empty', () => {
    const out = MruStore.orderTabs([], tabs);
    expect(out.map((t) => t.id)).toEqual([20, 30, 10]);
  });

  it('does not mutate the input tabs array', () => {
    const copy = tabs.slice();
    MruStore.orderTabs([10], tabs);
    expect(tabs).toEqual(copy);
  });
});
