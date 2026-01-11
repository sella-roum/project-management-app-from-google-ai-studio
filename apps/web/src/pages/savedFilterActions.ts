import { getCurrentUserId, saveFilter, updateSavedFilter, deleteSavedFilter } from "@repo/storage";

type SaveFilterParams = {
  filterName: string;
  query: string;
  isJqlMode: boolean;
  activeFilter: string | null;
};

type SavedFilterQueryParams = Pick<
  SaveFilterParams,
  "query" | "isJqlMode" | "activeFilter"
>;

export const buildSavedFilterQuery = ({
  query,
  isJqlMode,
  activeFilter,
}: SavedFilterQueryParams) => {
  if (!isJqlMode && activeFilter) {
    const uid = getCurrentUserId();
    return activeFilter === "assigned"
      ? `assigneeId = ${uid}`
      : `reporterId = ${uid}`;
  }

  return query;
};

export const saveCurrentFilter = async ({
  filterName,
  query,
  isJqlMode,
  activeFilter,
}: SaveFilterParams) => {
  if (!filterName) return;

  const finalQuery = buildSavedFilterQuery({
    query,
    isJqlMode,
    activeFilter,
  });
  await saveFilter(filterName, finalQuery, undefined, isJqlMode);
};

export const toggleSavedFilterFavorite = async (
  id: string,
  isFavorite: boolean,
) => {
  await updateSavedFilter(id, { isFavorite: !isFavorite });
};

export const removeSavedFilter = async (id: string) => {
  await deleteSavedFilter(id);
};
