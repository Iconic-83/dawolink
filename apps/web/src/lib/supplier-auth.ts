import axios from "axios";

const TOKEN_KEY = "supplier_token";

export const supplierApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4001/api",
});

supplierApi.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function getSupplierToken() {
  return typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
}
export function setSupplierToken(token: string) { localStorage.setItem(TOKEN_KEY, token); }
export function clearSupplierToken() { localStorage.removeItem(TOKEN_KEY); }
