const BookmarkSource = require('../src/bookmark-source');

describe('BookmarkSource.flattenTree', () => {
  const tree = [
    {
      id: '0',
      children: [
        {
          id: '1',
          title: 'Bar',
          children: [
            { id: '2', title: 'GitHub', url: 'https://github.com/a/b' },
            { id: '3', title: '', url: 'https://example.org/x' },
            { id: '4', title: 'EmptyFolder', children: [] },
          ],
        },
        { id: '5', title: 'Docs', url: 'https://docs.dev/' },
      ],
    },
  ];

  it('collects only nodes that have a url, across nested folders', () => {
    const items = BookmarkSource.flattenTree(tree);
    expect(items.map((i) => i.id)).toEqual(['2', '3', '5']);
  });

  it('tags every item with kind "bookmark"', () => {
    const items = BookmarkSource.flattenTree(tree);
    expect(items.every((i) => i.kind === 'bookmark')).toBe(true);
  });

  it('falls back to the url when the title is empty', () => {
    const items = BookmarkSource.flattenTree(tree);
    const noTitle = items.find((i) => i.id === '3');
    expect(noTitle.title).toBe('https://example.org/x');
  });

  it('parses the hostname from the url', () => {
    const items = BookmarkSource.flattenTree(tree);
    expect(items.find((i) => i.id === '2').hostname).toBe('github.com');
  });

  it('yields an empty hostname for an unparseable url', () => {
    const items = BookmarkSource.flattenTree([{ id: '9', title: 'X', url: 'not a url' }]);
    expect(items[0].hostname).toBe('');
  });

  it('returns [] for empty or undefined input', () => {
    expect(BookmarkSource.flattenTree([])).toEqual([]);
    expect(BookmarkSource.flattenTree(undefined)).toEqual([]);
  });
});
