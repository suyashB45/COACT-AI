/**
 * Jest setup for CoAct.AI Mobile.
 * Mocks React Native native modules that are not available in the Jest (jsdom-less) environment.
 */

jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');

jest.mock('react-native-audio-recorder-player', () => {
  return {
    __esModule: true,
    default: class {
      startRecorder = jest.fn();
      stopRecorder = jest.fn();
      stopPlayer = jest.fn();
      startPlayer = jest.fn();
      addRecordBackListener = jest.fn();
      removeRecordBackListener = jest.fn();
    },
  };
});

jest.mock('react-native-sound', () => {
  return {
    __esModule: true,
    default: class {
      static setCategory = jest.fn();
      constructor() {}
      play = jest.fn();
      stop = jest.fn();
      release = jest.fn();
    },
  };
});

jest.mock('react-native-fs', () => {
  return {
    __esModule: true,
    default: {
      DocumentDirectoryPath: '/tmp',
      writeFile: jest.fn(async () => {}),
      unlink: jest.fn(async () => {}),
    },
  };
});

jest.mock('@react-native-async-storage/async-storage', () => {
  const mock = require('@react-native-async-storage/async-storage/jest/async-storage-mock');
  return { __esModule: true, default: mock };
});
