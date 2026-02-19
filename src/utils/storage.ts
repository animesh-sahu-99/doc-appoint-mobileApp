import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

// Mock storage for web (since SecureStore doesn't work on web in the same way)
const webStorage = {
  getItem: async (key: string) => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  },
  setItem: async (key: string, value: string) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  },
  deleteItem: async (key: string) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
  },
};

export const storage = {
  getToken: async () => {
    try {
      if (isWeb) return await webStorage.getItem('user_token');
      return await SecureStore.getItemAsync('user_token');
    } catch (error) {
      console.error('Error getting token', error);
      return null;
    }
  },
  setToken: async (token: string) => {
    try {
      if (isWeb) await webStorage.setItem('user_token', token);
      else await SecureStore.setItemAsync('user_token', token);
    } catch (error) {
      console.error('Error setting token', error);
    }
  },
  removeToken: async () => {
    try {
      if (isWeb) await webStorage.deleteItem('user_token');
      else await SecureStore.deleteItemAsync('user_token');
    } catch (error) {
      console.error('Error removing token', error);
    }
  },
};
