/* eslint-env jest */

// react-native-encrypted-storage is a thin wrapper over a native module, which doesn't exist in
// the Jest environment. store.ts imports it at module load, so without this mock no test that
// touches the store can even be imported.
jest.mock('react-native-encrypted-storage', () => ({
  __esModule: true,
  default: {
    setItem: jest.fn(() => Promise.resolve()),
    getItem: jest.fn(() => Promise.resolve(null)),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
  },
}));
