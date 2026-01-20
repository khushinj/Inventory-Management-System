import axios from "axios";

/**
 * Axios instance for backend communication.
 * Uses Next.js API rewrites proxy to route to backend.
 * In production or when NEXT_PUBLIC_API_URL is set, uses that URL.
 * Otherwise uses relative /api path which Next.js will proxy to localhost:5000/api
 */
const baseURL = process.env.NEXT_PUBLIC_API_URL || "/api";

console.log("API Base URL:", baseURL);

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});
