import axios from "axios";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

const BASE_URL = Constants.expoConfig?.extra?.apiUrl ?? "http://localhost:4001/api";

export const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("customer_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err),
);

export async function getToken() {
  return SecureStore.getItemAsync("customer_token");
}
export async function setToken(token: string) {
  return SecureStore.setItemAsync("customer_token", token);
}
export async function clearToken() {
  return SecureStore.deleteItemAsync("customer_token");
}
