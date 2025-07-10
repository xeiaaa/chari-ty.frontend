import axios from "axios";
import { useAuth } from "@clerk/nextjs";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export function useApi() {
  const { getToken } = useAuth();

  // Add auth token to requests
  api.interceptors.request.use(async (config) => {
    try {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Failed to get auth token:", error);
    }
    return config;
  });

  // Handle response errors
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (axios.isAxiosError(error)) {
        // Handle specific error cases
        if (error.response?.status === 401) {
          // Handle unauthorized error
          console.error("Unauthorized request:", error);
        }

        // Extract error message from response
        const message = error.response?.data?.message || "An error occurred";
        return Promise.reject(new Error(message));
      }
      return Promise.reject(error);
    }
  );

  return api;
}

// Type for API error responses
export type ApiError = {
  message: string;
  statusCode?: number;
};

// Helper function to extract error message
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (error.response?.data as ApiError)?.message || error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
}