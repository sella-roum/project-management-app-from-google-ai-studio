
import { db } from './mockData';

export const resetApp = async () => {
  try {
    // 1. Explicitly close the connection first to avoid 'DatabaseClosedError' in active queries
    db.close();
    
    // 2. Delete the database
    await db.delete();
    
    // 3. Clear application keys from localStorage
    const keysToRemove = [
      'isLoggedIn', 
      'currentUserId', 
      'hasSetup', 
      'appInitialized'
    ];
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // NOTE: Do NOT call db.open() here. 
    // The app should reload immediately after this function returns.
    // Opening it here might cause race conditions with the dying React tree.
    
    return true;
  } catch (error) {
    console.error('Failed to reset app:', error);
    
    // Fallback: Clear storage anyway so at least the login state is reset
    const keysToRemove = ['isLoggedIn', 'currentUserId', 'hasSetup', 'appInitialized'];
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    return true; // Return true to trigger reload in the UI
  }
};
