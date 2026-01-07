import { SQLiteStorageAdapter } from "./sqliteStorageAdapter";

export { SQLiteStorageAdapter };

export const createMobileStorage = () => new SQLiteStorageAdapter();
