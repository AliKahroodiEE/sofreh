"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, BarChart3, CircleAlert, KeyRound, Radio, Smartphone, Sparkles, Store } from "lucide-react";
import { authApi } from "@/lib/api/endpoints";
import { errorMessage } from "@/lib/api/client";
import { startSession, useHydrated, useSession } from "@/lib/auth/session";
import { faDigits, formatPhone, toLatinDigits } from "@/lib/format";
import { useNow } from "@/lib/hooks/use-now";
import { Logo, LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { controlClass } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { OtpInput } from "./otp-input";

const CODE_LENGTH = 5;
const RESEND_SECONDS = 60;
const DEMO_ADMIN_PHONE = "09120000000";

/** Accepts 0912…, 912…, +98912…, 0098912… with Persian or Latin digits. */
function normalizePhone(input: string): string | null {
  let phone = toLatinDigits(input).replace(/[\s\-()]/g, "");
  if (phone.startsWith("+98")) phone = `0${phone.slice(3)}`;
  else if (phone.startsWith("0098")) phone = `0${phone.slice(4)}`;
  else if (phone.startsWith("98") && phone.length === 12) phone = `0${phone.slice(2)}`;
  else if (phone.startsWith("9") && phone.length === 10) phone = `0${phone}`;
  return /^09\d{9}$/.test(phone) ? phone : null;
}

/** Only allow same-origin relative redirects after login. */
function safeNext(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export function LoginView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const session = useSession();
  const hydrated = useHydrated();

  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phoneInput, setPhoneInput] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resendAt, setResendAt] = useState(0);
  const now = useNow(1000);
  const secondsLeft = Math.min(RESEND_SECONDS, Math.max(0, Math.ceil((resendAt - now) / 1000)));

  // Already signed in (e.g. in another tab): go straight to the panel.
  useEffect(() => {
    if (hydrated && session) router.replace(next);
  }, [hydrated, session, next, router]);

  async function requestCode(target: string) {
    setBusy(true);
    setError(null);
    try {
      const response = await authApi.requestOtp(target);
      setPhone(response.phone);
      setDevCode(response.devCode ?? null);
      setCode("");
      setStep("code");
      setResendAt(Date.now() + RESEND_SECONDS * 1000);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function onSubmitPhone(event: FormEvent) {
    event.preventDefault();
    const normalized = normalizePhone(phoneInput);
    if (!normalized) {
      setError("شماره موبایل معتبر نیست؛ مثال: ۰۹۱۲۳۴۵۶۷۸۹");
      return;
    }
    void requestCode(normalized);
  }

  async function verify(value: string) {
    if (value.length !== CODE_LENGTH || busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await authApi.verifyOtp(phone, value);
      if (result.user.role !== "ADMIN") {
        // Revoke the refresh token we just received; this panel is admins-only.
        await authApi.logout(result.refreshToken).catch(() => undefined);
        setStep("phone");
        setCode("");
        setDevCode(null);
        setError("این شماره دسترسی مدیریت ندارد. فقط مدیران سامانه می‌توانند وارد پنل شوند.");
        return;
      }
      startSession({ accessToken: result.accessToken, refreshToken: result.refreshToken, user: result.user });
      router.replace(next);
    } catch (err) {
      setError(errorMessage(err));
      setCode("");
    } finally {
      setBusy(false);
    }
  }

  function onCodeChange(value: string) {
    setCode(value);
    if (error) setError(null);
    if (value.length === CODE_LENGTH) void verify(value);
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Form column (right side in RTL) */}
      <div className="flex flex-col px-5 py-8 sm:px-10">
        <Logo />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          {step === "phone" ? (
            <form onSubmit={onSubmitPhone} noValidate className="animate-fade-in">
              <h1 className="text-2xl font-extrabold text-stone-900">ورود به پنل مدیریت</h1>
              <p className="mt-2 text-sm leading-6 text-stone-500">شماره موبایل مدیر را وارد کنید تا کد تأیید برایتان ارسال شود.</p>

              <label htmlFor="phone" className="mt-8 mb-1.5 block text-[13px] font-medium text-stone-700">
                شماره موبایل
              </label>
              <div className="relative">
                <Smartphone className="pointer-events-none absolute inset-y-0 right-3.5 my-auto size-4 text-stone-400" />
                <input
                  id="phone"
                  value={phoneInput}
                  onChange={(event) => {
                    setPhoneInput(event.target.value);
                    setError(null);
                  }}
                  inputMode="tel"
                  autoComplete="tel"
                  autoFocus
                  dir="ltr"
                  placeholder="۰۹۱۲ ۰۰۰ ۰۰۰۰"
                  aria-invalid={!!error || undefined}
                  className={cn(controlClass, "tabular h-12 pr-10 text-left text-base tracking-wider")}
                />
              </div>

              {error && <ErrorBox message={error} />}

              <Button type="submit" size="lg" loading={busy} className="mt-5 w-full">
                دریافت کد تأیید
              </Button>

              <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-dashed border-saffron-300 bg-saffron-50/70 p-3.5">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="size-4 shrink-0 text-saffron-600" />
                  <p className="text-xs leading-5 text-stone-700">
                    حساب آزمایشی مدیر:{" "}
                    <span className="tabular font-bold" dir="ltr">
                      {formatPhone(DEMO_ADMIN_PHONE)}
                    </span>
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setPhoneInput(faDigits(DEMO_ADMIN_PHONE));
                    setError(null);
                  }}
                >
                  استفاده
                </Button>
              </div>
            </form>
          ) : (
            <form
              className="animate-fade-in"
              onSubmit={(event) => {
                event.preventDefault();
                void verify(code);
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setError(null);
                }}
                className="mb-6 inline-flex cursor-pointer items-center gap-1.5 text-sm text-stone-500 transition hover:text-stone-800"
              >
                <ArrowRight className="size-4" />
                ویرایش شماره
              </button>
              <h1 className="text-2xl font-extrabold text-stone-900">کد تأیید را وارد کنید</h1>
              <p className="mt-2 text-sm leading-6 text-stone-500">
                کد {faDigits(CODE_LENGTH)} رقمی به شماره‌ی{" "}
                <span className="tabular font-semibold text-stone-700" dir="ltr">
                  {formatPhone(phone)}
                </span>{" "}
                ارسال شد.
              </p>

              <div className="mt-8">
                <OtpInput value={code} onChange={onCodeChange} length={CODE_LENGTH} disabled={busy} invalid={!!error} />
              </div>

              {devCode && (
                <button
                  type="button"
                  onClick={() => onCodeChange(devCode)}
                  className="group mt-5 flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border border-dashed border-saffron-300 bg-saffron-50/70 p-3.5 text-right transition hover:bg-saffron-50"
                >
                  <span className="flex items-center gap-2.5 text-xs text-stone-700">
                    <KeyRound className="size-4 text-saffron-600" />
                    کد آزمایشی:{" "}
                    <span className="tabular text-sm font-bold tracking-widest text-stone-900" dir="ltr">
                      {faDigits(devCode)}
                    </span>
                  </span>
                  <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-stone-700 shadow-card group-hover:text-brand-700">
                    وارد کردن خودکار
                  </span>
                </button>
              )}

              {error && <ErrorBox message={error} />}

              <Button type="submit" size="lg" loading={busy} disabled={code.length !== CODE_LENGTH} className="mt-5 w-full">
                ورود به پنل
              </Button>

              <div className="mt-5 text-center text-sm">
                {secondsLeft > 0 ? (
                  <span className="tabular text-stone-500">
                    ارسال مجدد کد تا {faDigits(`${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`)}
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void requestCode(phone)}
                    className="cursor-pointer font-medium text-brand-700 hover:text-brand-800 disabled:opacity-50"
                  >
                    ارسال مجدد کد
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
        <p className="text-center text-xs text-stone-400">سفره · نسخه‌ی نمایشی سامانه‌ی سفارش آنلاین غذا</p>
      </div>

      <BrandPanel />
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div role="alert" className="animate-fade-in mt-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700">
      <CircleAlert className="mt-0.5 size-4 shrink-0" />
      {message}
    </div>
  );
}

/** Decorative brand column with a peek at the product. */
function BrandPanel() {
  const features = [
    { icon: Radio, title: "سفارش‌های لحظه‌ای", text: "سفارش جدید بدون رفرش، همراه با اعلان روی صفحه." },
    { icon: Store, title: "رستوران و منو", text: "مدیریت رستوران‌ها، بخش‌های منو، قیمت و موجودی غذاها." },
    { icon: BarChart3, title: "گزارش فروش", text: "درآمد و تعداد سفارش‌ها به تفکیک روز و رستوران." },
  ];
  return (
    <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 lg:block">
      <div className="bg-dots absolute inset-0" aria-hidden />
      <div className="absolute -top-24 -left-24 size-96 rounded-full bg-saffron-400/25 blur-3xl" aria-hidden />
      <div className="absolute -right-32 -bottom-32 size-[28rem] rounded-full bg-brand-400/30 blur-3xl" aria-hidden />

      <div className="relative flex h-full flex-col justify-center px-14 py-16 text-white xl:px-20">
        <LogoMark className="size-14 rounded-2xl ring-4 ring-white/15" />
        <h2 className="mt-8 text-4xl leading-tight font-black">
          سفره را از یک‌جا
          <br />
          <span className="text-saffron-300">ساده و لحظه‌ای</span> مدیریت کنید
        </h2>
        <p className="mt-4 max-w-md text-base leading-8 text-white/75">
          پنل مدیریت سفارش آنلاین غذا؛ از تأیید سفارش تا تحویل به مشتری.
        </p>

        <ul className="mt-10 grid max-w-md gap-4">
          {features.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex items-start gap-3.5 rounded-2xl bg-white/[0.07] p-4 ring-1 ring-white/10 backdrop-blur-sm">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/12 text-saffron-300">
                <Icon className="size-5" />
              </span>
              <span>
                <span className="block font-bold">{title}</span>
                <span className="mt-0.5 block text-sm leading-6 text-white/70">{text}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
