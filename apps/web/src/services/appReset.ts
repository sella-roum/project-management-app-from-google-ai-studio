import { storage } from "@repo/storage";

export const resetApp = async (): Promise<boolean> => {
  try {
    await storage.reset();
    return true;
  } catch (error) {
    console.error("Failed to reset app:", error);
    await storage.settings.multiRemove(["isLoggedIn", "currentUserId"]);
    return false;
  }
};
