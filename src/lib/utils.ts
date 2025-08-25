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

export function formatAchievedDateTime(dateString: string) {
  const achievedDate = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - achievedDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // If within a month (30 days), show "X days ago"
  if (diffDays <= 30) {
    if (diffDays === 1) {
      return "1 day ago";
    } else if (diffDays === 0) {
      return "Today";
    } else {
      return `${diffDays} days ago`;
    }
  }

  // If more than a month, show the full date
  return achievedDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
