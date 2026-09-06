import { create } from "zustand";
import api from "../api/axios";

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // true until the initial /me check resolves
  error: null,

  // Called once on app load. The JWT lives in an httpOnly cookie (not
  // readable by JS), so the only way to know if a session is valid is
  // to ask the backend.
  checkAuth: async () => {
    try {
      const res = await api.get("/auth/me");
      set({ user: res.data.user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  register: async ({ name, email, password, role }) => {
    set({ error: null });
    try {
      const res = await api.post("/auth/register", { name, email, password, role });
      set({ user: res.data.user, isAuthenticated: true });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || "Registration failed";
      set({ error: message });
      return { success: false, message };
    }
  },

  login: async ({ email, password }) => {
    set({ error: null });
    try {
      const res = await api.post("/auth/login", { email, password });
      set({ user: res.data.user, isAuthenticated: true });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || "Login failed";
      set({ error: message });
      return { success: false, message };
    }
  },

  logout: async () => {
    await api.post("/auth/logout");
    set({ user: null, isAuthenticated: false });
  },
}));

export default useAuthStore;
