global.chrome = {
  tabs: {
    query: jest.fn(() => Promise.resolve([])),
    update: jest.fn(() => Promise.resolve()),
    remove: jest.fn(() => Promise.resolve()),
    onActivated: { addListener: jest.fn() },
    onRemoved: { addListener: jest.fn() },
  },
  windows: {
    update: jest.fn(() => Promise.resolve()),
  },
  storage: {
    session: {
      get: jest.fn(() => Promise.resolve({})),
      set: jest.fn(() => Promise.resolve()),
    },
    local: {
      get: jest.fn((key, cb) => cb({})),
      set: jest.fn((obj, cb) => cb && cb()),
    },
  },
  commands: { onCommand: { addListener: jest.fn() } },
  runtime: { getURL: jest.fn((p) => `chrome-extension://test-id/${p}`) },
};

beforeEach(() => {
  jest.clearAllMocks();
});
