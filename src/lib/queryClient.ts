import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - reduced from 15
      gcTime: 1000 * 60 * 30, // 30 minutes - reduced from 1 hour
      refetchOnWindowFocus: false,
      refetchOnReconnect: true, // Changed to true for better data freshness
      refetchOnMount: false,
      retry: 2, // Increased from 1 for better reliability
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000), // Exponential backoff
      networkMode: 'online',
    },
    mutations: {
      retry: 2, // Increased from 1
      retryDelay: 1000,
      networkMode: 'online',
    },
  },
});
