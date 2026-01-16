import axios from "axios";

/**
 * Axios instance for backend communication.
 * Uses NEXT_PUBLIC_API_URL if provided, else proxies via Next (`/api`).
 */
const baseURL = process.env.NEXT_PUBLIC_API_URL || "/api";

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});
