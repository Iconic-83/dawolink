import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser } from "@dawolink/types";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  setAuth: (user: AuthUser, token: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        localStorage.setItem("dawolink_token", token);
        set({ user, token });
      },
      logout: () => {
        localStorage.removeItem("dawolink_token");
        set({ user: null, token: null });
      },
      isAuthenticated: () => !!get().token,
    }),
    { name: "dawolink-auth", partialize: (s) => ({ user: s.user, token: s.token }) },
  ),
);
