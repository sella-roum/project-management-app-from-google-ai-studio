export interface SavedFilter {
  id: string;
  name: string;
  query: string;
  isJqlMode: boolean;
  ownerId: string;
  isFavorite: boolean;
}

export interface ViewHistory {
  id: string;
  userId: string;
  issueId: string;
  viewedAt: string;
}
