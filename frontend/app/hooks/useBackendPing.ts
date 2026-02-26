import { useEffect } from "react";
import { api } from "../../lib/api";

export function useBackendPing() {
  useEffect(() => {
    const pingBackend = async () => {
      try {
        // Use lightweight health endpoint instead of /shop
        // This is specifically designed for keep-alive pings and doesn't query the database
        const response = await api.get("/health");

        if (response.status >= 200 && response.status < 300) {
          console.log("✓ Backend health check successful at", new Date().toLocaleTimeString());
        } else {
          console.warn("⚠ Backend health check returned status:", response.status);
        }
      } catch (error) {
        console.error("✗ Backend health check failed:", error);
      }
    };

    // Initial ping on mount
    pingBackend();

    // Set up interval to ping every 12 minutes (720000 ms)
    // This keeps the backend awake on Render's Starter plan ($7/month)
    // which has no spin-down like the free tier
    const pingInterval = setInterval(pingBackend, 12 * 60 * 1000);

    // Cleanup interval on unmount
    return () => clearInterval(pingInterval);
  }, []);
}