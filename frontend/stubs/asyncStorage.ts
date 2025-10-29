// Stub for @react-native-async-storage/async-storage
// Required by @metamask/sdk when used in browser context

const asyncStorage = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
  clear: async () => {},
  getAllKeys: async () => [],
  multiGet: async () => [],
  multiSet: async () => {},
  multiRemove: async () => {},
};

export default asyncStorage;
