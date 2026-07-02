const ResultMerge = require('../src/result-merge');

const tabRows = [{ item: { kind: 'tab', id: 1 } }];
const bmRows = [{ item: { kind: 'bookmark', id: 'b1' } }];

describe('ResultMerge.mergeResults', () => {
  it('returns tabs only when the query is empty', () => {
    expect(ResultMerge.mergeResults('', tabRows, bmRows)).toEqual(tabRows);
  });

  it('treats a whitespace-only query as empty', () => {
    expect(ResultMerge.mergeResults('   ', tabRows, bmRows)).toEqual(tabRows);
  });

  it('puts tabs before bookmarks when the query is non-empty', () => {
    expect(ResultMerge.mergeResults('gh', tabRows, bmRows)).toEqual([...tabRows, ...bmRows]);
  });

  it('does not mutate the input arrays', () => {
    const t = [...tabRows];
    const b = [...bmRows];
    ResultMerge.mergeResults('gh', t, b);
    expect(t).toEqual(tabRows);
    expect(b).toEqual(bmRows);
  });

  it('tolerates missing arrays', () => {
    expect(ResultMerge.mergeResults('gh', undefined, undefined)).toEqual([]);
  });
});
