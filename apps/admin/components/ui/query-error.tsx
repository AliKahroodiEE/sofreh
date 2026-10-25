"use client";

import { RefreshCw, WifiOff } from "lucide-react";
import { errorMessage } from "@/lib/api/client";
import { Button } from "./button";
import { EmptyState } from "./empty-state";

/** Inline error state for a failed query, with a retry button. */
export function QueryError({ error, onRetry, className }: { error: unknown; onRetry: () => void; className?: string }) {
  return (
    <EmptyState
      className={className}
      icon={<WifiOff />}
      title="دریافت اطلاعات ناموفق بود"
      description={errorMessage(error)}
      action={
        <Button variant="secondary" onClick={onRetry}>
          <RefreshCw />
          تلاش دوباره
        </Button>
      }
    />
  );
}
