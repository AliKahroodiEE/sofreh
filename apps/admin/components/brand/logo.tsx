import { cn } from "@/lib/cn";

/** Sofreh mark: a bowl on a tablecloth line with saffron steam. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("size-10", className)} aria-hidden>
      <defs>
        <linearGradient id="sofreh-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#E5485C" />
          <stop offset="1" stopColor="#B41B30" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#sofreh-mark)" />
      <path d="M14 36h36a18 18 0 0 1-36 0Z" fill="#fff" />
      <path d="M10 36h44" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
      <path
        d="M26 18c0 3 3 3 3 6s-3 3-3 6M35 16c0 3 3 3 3 6s-3 3-3 6"
        fill="none"
        stroke="#F4A300"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({ className, subtitle = "پنل مدیریت" }: { className?: string; subtitle?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <LogoMark />
      <div className="leading-tight">
        <div className="text-xl font-black tracking-tight text-stone-900">سفره</div>
        <div className="text-[11px] font-medium text-stone-500">{subtitle}</div>
      </div>
    </div>
  );
}
