import { useEffect, useState } from "react";
import axios from "axios";

const TOKEN_KEY = "customer_token";

export const customerApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4001/api",
});

customerApi.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function getCustomerToken() {
  return typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
}

export function setCustomerToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearCustomerToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export interface CustomerUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
  city?: string;
}

export function useCustomerAuth() {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getCustomerToken();
    if (!token) { setLoading(false); return; }

    customerApi.get("/v1/marketplace/auth/me")
      .then(r => setUser(r.data))
      .catch(() => clearCustomerToken())
      .finally(() => setLoading(false));
  }, []);

  function logout() {
    clearCustomerToken();
    setUser(null);
  }

  return { user, loading, logout, setUser };
}
