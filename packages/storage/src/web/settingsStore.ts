import type { SettingsStore } from "../contracts";

export class LocalStorageSettingsStore implements SettingsStore {
  async get(key: string): Promise<string | null> {
    return localStorage.getItem(key);
  }

  async set(key: string, value: string): Promise<void> {
    localStorage.setItem(key, value);
  }

  async remove(key: string): Promise<void> {
    localStorage.removeItem(key);
  }

  async keys(prefix?: string): Promise<string[]> {
    const allKeys = Object.keys(localStorage);
    if (!prefix) return allKeys;
    return allKeys.filter((key) => key.startsWith(prefix));
  }

  async multiRemove(keys: string[]): Promise<void> {
    keys.forEach((key) => localStorage.removeItem(key));
  }
}
