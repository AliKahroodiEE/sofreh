import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Providers } from "./providers";
import "./globals.css";

/** Vazirmatn (SIL Open Font License, see app/fonts/Vazirmatn-OFL.txt), self-hosted. */
const vazirmatn = localFont({
  src: "./fonts/Vazirmatn-Variable.woff2",
  variable: "--font-vazirmatn",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "پنل مدیریت سفره", template: "%s | پنل مدیریت سفره" },
  description: "پنل مدیریت سفره: سفارش‌های لحظه‌ای، رستوران‌ها، منو، کدهای تخفیف و کاربران.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#D7263D",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fa" dir="rtl" className={`${vazirmatn.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
