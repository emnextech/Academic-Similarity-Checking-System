import { api, TOKEN_KEY } from "./api";
import { LoginResponse, User } from "../types";

export async function login(email: string, password: string) {
  const response = await api.post<LoginResponse>("/auth/login", { email, password });
  localStorage.setItem(TOKEN_KEY, response.data.token);
  return response.data;
}

export async function fetchMe() {
  const response = await api.get<{ user: User }>("/auth/me");
  return response.data.user;
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}
