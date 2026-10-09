import { api, apiGet } from "./api";

export interface AdminMenuItem {
  id: number;
  key: string;
  title: string;
  description?: string | null;
  path: string;
  icon: string;
  implemented: boolean;
}

export interface AdminMenuSection {
  id: number;
  title: string;
  description?: string | null;
  tile_url?: string | null;
  tone: string;
  tall: boolean;
  items: AdminMenuItem[];
}

export interface AdminMenu {
  sidebar: AdminMenuItem[][];
  sections: AdminMenuSection[];
}

export interface AdminProfile {
  id: number;
  mobile: string;
  fullName?: string | null;
  email?: string | null;
  roles: { name: string; title: string }[];
  permissions: string[];
}

export const adminApi = {
  me: () => apiGet<AdminProfile>("/admin/me"),
  menu: () => apiGet<AdminMenu>("/admin/menu"),
  upload: async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    const envelope = (await api.post("/admin/uploads", form, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60_000,
    })) as unknown as { data: { url: string } };
    return envelope.data.url;
  },
};
