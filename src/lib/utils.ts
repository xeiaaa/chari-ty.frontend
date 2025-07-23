import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import axios from "axios";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

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

export const formatCategory = (category: string) => {
  return category.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

export const formatCurrency = (amount: string, currency: string) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(parseFloat(amount));
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
export function getDateParts(dateString: string) {
  const date = new Date(dateString);
  return {
    month: date.toLocaleString("en-US", { month: "short" }),
    day: date.getDate(),
    year: date.getFullYear(),
  };
}

export function formatAchievedTime(dateString: string) {
  return new Date(dateString).toLocaleString("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
}
