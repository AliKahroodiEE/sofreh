"use client";

import { useState, type ReactNode } from "react";
import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster, toast } from "sonner";
import { ApiError, errorMessage } from "@/lib/api/client";
import { ConfirmProvider } from "@/components/ui/confirm";

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: {
      /** Skip the global error toast (the component shows the error itself). */
      silent?: boolean;
    };
  }
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // Client errors (4xx) will not fix themselves; retry network/5xx once.
        retry: (failureCount, error) =>
          !(error instanceof ApiError && error.status >= 400 && error.status < 500) && failureCount < 1,
      },
    },
    // Every failed mutation shows the API's Persian message as a toast.
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        if (!mutation.meta?.silent) toast.error(errorMessage(error));
      },
    }),
  });
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <ConfirmProvider>{children}</ConfirmProvider>
      <Toaster
        dir="rtl"
        position="top-left"
        richColors
        closeButton
        toastOptions={{ style: { fontFamily: "var(--font-vazirmatn), sans-serif" } }}
      />
    </QueryClientProvider>
  );
}
