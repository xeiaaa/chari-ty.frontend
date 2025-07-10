"use client";

import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import { useEffect } from "react";
import { API_BASE_URL, ensureProtocol } from "../utils";

// Create axios instance with default config
export const api = axios.create({
  baseURL: ensureProtocol(API_BASE_URL),
  withCredentials: true,
});

export function useApi() {
  const { getToken } = useAuth();

  useEffect(() => {
    // Add auth token to requests
    const interceptor = api.interceptors.request.use(async (config) => {
      try {
        const token = await getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error("Error getting auth token:", error);
      }
      return config;
    });

    // Remove interceptor on cleanup
    return () => {
      api.interceptors.request.eject(interceptor);
    };
  }, [getToken]);

  return api;
}