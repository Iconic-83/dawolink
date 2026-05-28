"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() =>
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000,
          gcTime: 24 * 60 * 60 * 1000,
          retry: (failureCount, _error: any) => {
            if (typeof navigator !== "undefined" && !navigator.onLine) return false;
            return failureCount < 2;
          },
          networkMode: "offlineFirst",
        },
        mutations: {
          networkMode: "offlineFirst",
        },
      },
    })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
