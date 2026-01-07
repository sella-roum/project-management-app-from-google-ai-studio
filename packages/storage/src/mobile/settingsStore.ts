import AsyncStorage from "@react-native-async-storage/async-storage";

import type { SettingsStore } from "../contracts";

export class AsyncStorageSettingsStore implements SettingsStore {
  async get(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  }

  async set(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  }

  async remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }

  async keys(prefix?: string): Promise<string[]> {
    const allKeys = await AsyncStorage.getAllKeys();
    if (!prefix) return [...allKeys];
    return allKeys.filter((key) => key.startsWith(prefix));
  }

  async multiRemove(keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    await AsyncStorage.multiRemove(keys);
  }
}
