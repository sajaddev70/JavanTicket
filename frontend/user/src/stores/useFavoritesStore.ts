import { create } from "zustand";

const KEY = "favorite_event_ids";

function read(): number[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

interface FavoritesState {
  ids: number[];
  loaded: boolean;
  load: () => void;
  toggle: (id: number) => void;
}

/** Per-viewer wishlist kept in this browser only. */
export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  ids: [],
  loaded: false,
  load: () => set({ ids: read(), loaded: true }),
  toggle: (id) => {
    const ids = get().ids.includes(id) ? get().ids.filter((x) => x !== id) : [...get().ids, id];
    try {
      localStorage.setItem(KEY, JSON.stringify(ids));
    } catch {
      // ignore unavailable storage
    }
    set({ ids });
  },
}));
