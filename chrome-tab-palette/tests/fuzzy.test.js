const Fuzzy = require('../src/fuzzy');

describe('Fuzzy.match', () => {
  it('returns null when characters are not a subsequence', () => {
    expect(Fuzzy.match('xyz', 'github')).toBeNull();
  });

  it('matches a subsequence case-insensitively with ranges', () => {
    const r = Fuzzy.match('gh', 'GitHub');
    expect(r).not.toBeNull();
    expect(r.ranges).toEqual([[0, 1], [3, 4]]); // 'G' at 0, 'H' at 3
  });

  it('merges consecutive matched indices into one range', () => {
    const r = Fuzzy.match('git', 'github');
    expect(r.ranges).toEqual([[0, 3]]);
  });

  it('scores a start/contiguous match higher than a scattered one', () => {
    const start = Fuzzy.match('ab', 'abc').score;
    const scattered = Fuzzy.match('ab', 'xaxb').score;
    expect(start).toBeGreaterThan(scattered);
  });

  it('treats empty query as a trivial match', () => {
    expect(Fuzzy.match('', 'anything')).toEqual({ score: 0, ranges: [] });
  });
});

describe('Fuzzy.rank', () => {
  const items = [
    { id: 1, title: 'GitHub - PR #42', hostname: 'github.com' },
    { id: 2, title: 'Google Docs', hostname: 'docs.google.com' },
    { id: 3, title: 'Random blog', hostname: 'example.com' },
  ];

  it('returns all items in input order for an empty query', () => {
    const out = Fuzzy.rank('   ', items);
    expect(out.map((r) => r.item.id)).toEqual([1, 2, 3]);
    expect(out[0].titleRanges).toEqual([]);
  });

  it('filters out non-matching items', () => {
    const out = Fuzzy.rank('git', items);
    expect(out.map((r) => r.item.id)).toEqual([1]);
  });

  it('ranks a title match above a hostname-only match', () => {
    const out = Fuzzy.rank('doc', items);
    expect(out[0].item.id).toBe(2); // title "Google Docs" beats nothing else
  });
});

describe('Fuzzy.highlight', () => {
  it('wraps matched ranges in <mark> and escapes HTML', () => {
    const html = Fuzzy.highlight('a<b>', [[0, 1]]);
    expect(html).toBe('<mark>a</mark>&lt;b&gt;');
  });

  it('returns escaped text unchanged when there are no ranges', () => {
    expect(Fuzzy.highlight('x & y', [])).toBe('x &amp; y');
  });
});
