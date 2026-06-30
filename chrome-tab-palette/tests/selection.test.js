const Selection = require('../src/selection');

describe('Selection.move', () => {
  it('moves down within range', () => {
    expect(Selection.move(0, 1, 3)).toBe(1);
  });

  it('wraps from last to first', () => {
    expect(Selection.move(2, 1, 3)).toBe(0);
  });

  it('wraps from first to last', () => {
    expect(Selection.move(0, -1, 3)).toBe(2);
  });

  it('returns 0 for an empty list', () => {
    expect(Selection.move(0, 1, 0)).toBe(0);
  });
});
