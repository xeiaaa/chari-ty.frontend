import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import axios from "axios";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

export function ensureProtocol(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `http://${url}`;
}

// Create axios instance with default config
export const api = axios.create({
  baseURL: ensureProtocol(API_BASE_URL),
  withCredentials: true,
});

export async function fetchUserData() {
  const response = await api.get("/auth/me");
  return response.data;
}
