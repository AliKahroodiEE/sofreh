import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginView } from "@/components/auth/login-view";

export const metadata: Metadata = { title: "ورود" };

export default function LoginPage() {
  return (
    // LoginView reads ?next= with useSearchParams, which needs a Suspense boundary.
    <Suspense>
      <LoginView />
    </Suspense>
  );
}
