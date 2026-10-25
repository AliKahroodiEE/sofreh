import Link from "next/link";
import { ArrowRight } from "lucide-react";

/** "← Back" link shown above page titles (arrow points right in RTL). */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1.5 text-sm text-stone-500 transition hover:text-stone-800">
      <ArrowRight className="size-4" />
      {label}
    </Link>
  );
}
