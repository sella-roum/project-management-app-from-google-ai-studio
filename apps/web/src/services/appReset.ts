import { db } from "./mockData";

export const resetApp = async (): Promise<boolean> => {
  try {
    // Attempt to delete DB first
    try {
      db.close();
      await db.delete();
    } catch (dbError) {
      console.warn(
        "DB deletion failed, attempting to clear tables instead:",
        dbError,
      );
      // Fallback: Re-open and clear
      if (!db.isOpen()) await db.open();
      await db.transaction("rw", db.tables, async () => {
        await Promise.all(db.tables.map((table) => table.clear()));
      });
    }

    // Clear storage
    const keysToRemove = [
      "isLoggedIn",
      "currentUserId",
      "hasSetup",
      "appInitialized",
      "notificationsEnabled",
    ];
    // Also clear dashboard gadgets patterns
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("dashboard_gadgets_")) keysToRemove.push(key);
    });

    keysToRemove.forEach((key) => localStorage.removeItem(key));

    return true;
  } catch (error) {
    console.error("Failed to reset app:", error);
    // Force clear critical keys anyway
    ["isLoggedIn", "currentUserId"].forEach((k) => localStorage.removeItem(k));
    return false;
  }
};
