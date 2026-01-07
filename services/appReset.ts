
import { db } from './mockData';

export const resetApp = async () => {
  try {
    // 1. Delete the database to ensure a fresh start
    await db.delete();
    
    // 2. Clear specific application keys from localStorage
    // We avoid localStorage.clear() to play nice with other apps on same domain if any
    const keysToRemove = [
      'isLoggedIn', 
      'currentUserId', 
      'hasSetup', 
      'appInitialized'
    ];
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // 3. Re-open DB (Dexie will auto-create tables on next access)
    // This step is optional as the next app load will open it, but good for consistency
    await db.open();
    
    return true;
  } catch (error) {
    console.error('Failed to reset app:', error);
    return false;
  }
};
