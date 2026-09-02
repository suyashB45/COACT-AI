module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['./jest.setup.js'],
  resolver: require.resolve('react-native-worklets/jest/resolver.js'),
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-reanimated|react-native-worklets|react-native-screens|react-native-safe-area-context|react-native-gesture-handler|react-native-vector-icons)/)',
  ],
};
