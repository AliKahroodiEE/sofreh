"use client";

import { useEffect } from "react";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

/** Route-level error boundary for the panel pages. */
export default function PanelError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card>
      <EmptyState
        icon={<TriangleAlert />}
        title="مشکلی در نمایش این صفحه پیش آمد"
        description="لطفاً دوباره تلاش کنید. اگر مشکل ادامه داشت، صفحه را تازه‌سازی کنید."
        action={
          <Button onClick={() => retry()}>
            <RefreshCw />
            تلاش دوباره
          </Button>
        }
      />
    </Card>
  );
}
