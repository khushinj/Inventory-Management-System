import { useEffect } from 'react';

export function useBackendPing() {
  useEffect(() => {
    const pingBackend = async () => {
      try {
        // Get base backend URL (not the /api path, just the host)
        const apiURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const backendURL = apiURL.replace('/api', '') || 'http://localhost:5000';
        
        const response = await fetch(`${backendURL}/`, {
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