import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Updates = Record<string, string | number | null | undefined>;

/**
 * Read and update query-string state (filters, page, open drawer) so views
 * are linkable and survive reloads. `null`/empty removes a key.
 * Components using this must sit inside a <Suspense> boundary.
 */
export function useUrlState() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const set = useCallback(
    (updates: Updates) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === undefined || value === "") next.delete(key);
        else next.set(key, String(value));
      }
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  return [params, set] as const;
}
