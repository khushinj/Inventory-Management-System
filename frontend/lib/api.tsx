import axios from "axios";

/**
 * Axios instance for backend communication.
 * Uses NEXT_PUBLIC_API_URL when provided; falls back to relative /api for dev proxy.
 * Ensures the base URL always targets the backend /api path to avoid 404s in prod.
 */
const rawBase = process.env.NEXT_PUBLIC_API_URL || "/api";
const baseURL = rawBase.endsWith("/api") ? rawBase : `${rawBase.replace(/\/$/, "")}/api`;

// console.log("API Base URL:", baseURL);

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 60000, // Increased to 60s for inventory calculations
});
