import { create } from "zustand";
import { setToken, clearToken } from "../lib/api";

interface AuthState {
  user: any | null;
  token: string | null;
  setAuth: (user: any, token: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  setAuth: async (user, token) => {
    await setToken(token);
    set({ user, token });
  },
  logout: async () => {
    await clearToken();
    set({ user: null, token: null });
  },
}));
