import { useEffect } from "react";
import { api } from "../../lib/api";

export function useBackendPing() {
  useEffect(() => {
    const pingBackend = async () => {
      try {
        const response = await api.get("/shop");

        if (response.status >= 200 && response.status < 300) {
          console.log("✓ Backend ping successful at", new Date().toLocaleTimeString());
        } else {
          console.warn("⚠ Backend ping returned status:", response.status);
        }
      } catch (error) {
        console.error("✗ Backend ping failed:", error);
      }
    };

    // Initial ping on mount
    pingBackend();

    // Set up interval to ping every 12 minutes (720000 ms)
    const pingInterval = setInterval(pingBackend, 12 * 60 * 1000);

    // Cleanup interval on unmount
    return () => clearInterval(pingInterval);
  }, []);
}