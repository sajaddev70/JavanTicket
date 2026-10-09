import { create } from "zustand";

interface CityState {
  /** Selected city in the header; null means all cities. */
  cityId: number | null;
  setCityId: (cityId: number | null) => void;
}

const STORAGE_KEY = "selected_city_id";

function readStored(): number | null {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    return raw ? Number(raw) : null;
  } catch {
    return null;
  }
}

export const useCityStore = create<CityState>((set) => ({
  cityId: null,
  setCityId: (cityId) => {
    try {
      if (cityId === null) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, String(cityId));
    } catch {
      // Storage may be unavailable (private mode); the selection still works for this visit.
    }
    set({ cityId });
  },
}));

/** Restores the viewer's last city choice; called once from the app providers. */
export function restoreCity() {
  const stored = readStored();
  if (stored !== null) useCityStore.setState({ cityId: stored });
}
