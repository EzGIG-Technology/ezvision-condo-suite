import { create } from 'zustand';

export type ToastTone = 'success' | 'info' | 'warning' | 'error';
export interface Toast {
  id: number;
  title: string;
  body?: string;
  tone: ToastTone;
}

interface ToastState {
  toasts: Toast[];
  push: (t: Omit<Toast, 'id'>) => void;
  dismiss: (id: number) => void;
}

let n = 0;
export const useToasts = create<ToastState>((set, get) => ({
  toasts: [],
  push: (t) => {
    const id = ++n;
    set({ toasts: [...get().toasts.slice(-3), { ...t, id }] });
    window.setTimeout(() => get().dismiss(id), 4200);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

export const toast = {
  success: (title: string, body?: string) => useToasts.getState().push({ title, body, tone: 'success' }),
  info: (title: string, body?: string) => useToasts.getState().push({ title, body, tone: 'info' }),
  warning: (title: string, body?: string) => useToasts.getState().push({ title, body, tone: 'warning' }),
  error: (title: string, body?: string) => useToasts.getState().push({ title, body, tone: 'error' }),
};
