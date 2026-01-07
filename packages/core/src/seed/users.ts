import type { User } from "../types";

export const getSeedUsers = (): User[] => [
  {
    id: "u1",
    name: "Alice Engineer",
    email: "alice@example.com",
    avatarUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
  },
  {
    id: "u2",
    name: "Bob Manager",
    email: "bob@example.com",
    avatarUrl:
      "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150",
  },
  {
    id: "u3",
    name: "Charlie Designer",
    email: "charlie@example.com",
    avatarUrl:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
  },
];
