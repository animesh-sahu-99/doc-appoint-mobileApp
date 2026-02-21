import EncryptedStorage from 'react-native-encrypted-storage';
import { Platform } from 'react-native';

// Simple abstraction for storage
export const storage = {
  getToken: async () => {
    try {
      const token = await EncryptedStorage.getItem('user_token');
      return token;
    } catch (error) {
      console.error('Error getting token', error);
      return null;
    }
  },
  setToken: async (token: string) => {
    try {
      await EncryptedStorage.setItem('user_token', token);
    } catch (error) {
      console.error('Error setting token', error);
    }
  },
  removeToken: async () => {
    try {
      await EncryptedStorage.removeItem('user_token');
    } catch (error) {
      console.error('Error removing token', error);
    }
  },
  // Clear all data (logout)
  clear: async () => {
    try {
      await EncryptedStorage.clear();
    } catch (error) {
      console.error('Error clearing storage', error);
    }
  }
};
