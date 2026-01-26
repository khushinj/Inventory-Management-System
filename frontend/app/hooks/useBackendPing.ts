import { useEffect } from 'react';

export function useBackendPing() {
  useEffect(() => {
    const pingBackend = async () => {
      try {
        // Use the proxied API endpoint to avoid CORS and localhost issues in dev containers
        // The Next.js rewrites will forward this to the backend
        const response = await fetch('/api/shop', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          console.log('✓ Backend ping successful at', new Date().toLocaleTimeString());
        } else {
          console.warn('⚠ Backend ping returned status:', response.status);
        }
      } catch (error) {
        console.error('✗ Backend ping failed:', error);
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