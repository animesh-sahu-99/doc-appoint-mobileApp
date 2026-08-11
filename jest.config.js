module.exports = {
  preset: 'react-native',
  setupFiles: ['<rootDir>/jest.setup.js'],
  // @reduxjs/toolkit was already listed, but its own dependencies ship ESM too and Jest was
  // choking on immer's `export {` before any test could run. redux/reselect/redux-persist are
  // included for the same reason.
  //
  // KNOWN GAP: importing '@reduxjs/toolkit/query/react' still fails under Jest — its shipped
  // .cjs bundle isn't picked up by these transform rules — so store.test.ts (and any test that
  // reaches services/api.ts) cannot run. Pre-existing; tests that avoid that entry point work.
  transformIgnorePatterns: [
    'node_modules/(?!(@react-native|react-native|@react-navigation|@reduxjs|immer|redux|redux-persist|reselect|lucide-react-native)/)',
  ],
};
