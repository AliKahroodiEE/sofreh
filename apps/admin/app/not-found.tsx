import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { buttonClass } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center p-6">
      <div className="text-center">
        <LogoMark className="mx-auto mb-6 size-14" />
        <p className="text-6xl font-black text-brand-600">۴۰۴</p>
        <h1 className="mt-3 text-xl font-bold text-stone-900">صفحه‌ای که دنبالش بودید پیدا نشد</h1>
        <p className="mt-2 text-sm text-stone-500">ممکن است آدرس اشتباه باشد یا این صفحه حذف شده باشد.</p>
        <Link href="/" className={buttonClass("primary", "md", "mt-6")}>
          بازگشت به داشبورد
        </Link>
      </div>
    </div>
  );
}
