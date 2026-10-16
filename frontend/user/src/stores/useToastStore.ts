import { create } from "zustand";

export type ToastTone = "success" | "error" | "info";

export interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
}

interface ToastState {
  toasts: Toast[];
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Short notification at the top of the screen; errors stay a little longer. */
export function toast(message: string, tone: ToastTone = "info") {
  const id = nextId++;
  useToastStore.setState((s) => ({ toasts: [...s.toasts.slice(-2), { id, tone, message }] }));
  setTimeout(() => useToastStore.getState().dismiss(id), tone === "error" ? 6000 : 3800);
}

toast.success = (message: string) => toast(message, "success");
toast.error = (message: string) => toast(message, "error");
