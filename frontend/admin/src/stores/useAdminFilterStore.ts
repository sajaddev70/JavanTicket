import { create } from "zustand";

interface AdminFilterState {
  /** City selected in the header; null means all cities. */
  cityId: number | null;
  setCityId: (cityId: number | null) => void;
}

export const useAdminFilterStore = create<AdminFilterState>((set) => ({
  cityId: null,
  setCityId: (cityId) => set({ cityId }),
}));
