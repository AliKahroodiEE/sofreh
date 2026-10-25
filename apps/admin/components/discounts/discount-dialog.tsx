"use client";

import { useState, type FormEvent } from "react";
import type { DiscountCode, DiscountInput, DiscountType } from "@/lib/api/types";
import { formatDate, toman } from "@/lib/format";
import { endOfJalaliDayIso, toJalali, type JalaliDate } from "@/lib/jalali";
import { Button } from "@/components/ui/button";
import { Field, Input, NumberInput } from "@/components/ui/field";
import { JalaliDateInput } from "@/components/ui/jalali-date-input";
import { Modal } from "@/components/ui/modal";
import { Segmented } from "@/components/ui/segmented";
import { Switch, SwitchField } from "@/components/ui/switch";
import { describeValue } from "./discount-utils";

const CODE = /^[A-Za-z0-9_-]{3,30}$/;

interface DiscountDialogProps {
  open: boolean;
  onClose: () => void;
  /** Present when editing. */
  discount?: DiscountCode;
  onSubmit: (input: DiscountInput) => Promise<unknown>;
}

export function DiscountDialog({ open, onClose, discount, onSubmit }: DiscountDialogProps) {
  return (
    <Modal open={open} onClose={onClose} size="lg" title={discount ? "ویرایش کد تخفیف" : "کد تخفیف جدید"}>
      <DiscountForm discount={discount} onSubmit={onSubmit} onClose={onClose} />
    </Modal>
  );
}

/** A month from today: the default expiry for new codes. */
function defaultExpiry(): JalaliDate {
  return toJalali(new Date(Date.now() + 30 * 86_400_000));
}

function DiscountForm({ discount, onSubmit, onClose }: Omit<DiscountDialogProps, "open">) {
  const initialExpiry = discount?.expiresAt ? toJalali(new Date(discount.expiresAt)) : null;
  const [values, setValues] = useState({
    code: discount?.code ?? "",
    description: discount?.description ?? "",
    type: discount?.type ?? ("PERCENT" as DiscountType),
    value: discount?.value ?? (null as number | null),
    maxDiscount: discount?.maxDiscount ?? (null as number | null),
    minOrder: discount?.minOrder ?? (0 as number | null),
    usageLimit: discount?.usageLimit ?? (null as number | null),
    hasExpiry: !!discount?.expiresAt,
    expiry: initialExpiry ?? defaultExpiry(),
    isActive: discount?.isActive ?? true,
  });
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [thisYear] = useState(() => toJalali(new Date()).year);

  const set = <K extends keyof typeof values>(key: K, value: (typeof values)[K]) => setValues((v) => ({ ...v, [key]: value }));

  const errors = {
    code: CODE.test(values.code) ? null : "کد تخفیف ۳ تا ۳۰ حرف انگلیسی یا عدد باشد.",
    value:
      values.value === null || values.value < 1
        ? "مقدار تخفیف را وارد کنید."
        : values.type === "PERCENT" && values.value > 100
          ? "درصد تخفیف نمی‌تواند بیش از ۱۰۰ باشد."
          : null,
    usageLimit: values.usageLimit !== null && values.usageLimit < 1 ? "حداقل ۱ بار، یا خالی برای نامحدود." : null,
    description: values.description.length > 120 ? "توضیحات حداکثر ۱۲۰ حرف باشد." : null,
  };
  const hasErrors = Object.values(errors).some(Boolean);
  const shown = submitted ? errors : ({} as Partial<typeof errors>);

  function expiresAtIso(): string | null {
    if (!values.hasExpiry) return null;
    const unchanged =
      discount?.expiresAt &&
      initialExpiry &&
      initialExpiry.year === values.expiry.year &&
      initialExpiry.month === values.expiry.month &&
      initialExpiry.day === values.expiry.day;
    // Keep the exact stored instant when the day was not changed.
    return unchanged ? discount.expiresAt : endOfJalaliDayIso(values.expiry);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (hasErrors) return;
    setSaving(true);
    try {
      await onSubmit({
        code: values.code.toUpperCase(),
        description: values.description.trim(),
        type: values.type,
        value: values.value!,
        maxDiscount: values.type === "PERCENT" ? values.maxDiscount : null,
        minOrder: values.minOrder ?? 0,
        usageLimit: values.usageLimit,
        expiresAt: expiresAtIso(),
        isActive: values.isActive,
      });
      onClose();
    } catch {
      // Error toast comes from the mutation.
    } finally {
      setSaving(false);
    }
  }

  const expiryIso = values.hasExpiry ? endOfJalaliDayIso(values.expiry) : null;

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="کد" required error={shown.code} hint="حروف انگلیسی، عدد، - و _ (با حروف بزرگ ذخیره می‌شود)">
          {(id) => (
            <Input
              id={id}
              dir="ltr"
              value={values.code}
              onChange={(e) => set("code", e.target.value.toUpperCase().replace(/\s/g, ""))}
              maxLength={30}
              placeholder="WELCOME"
              className="text-left font-mono tracking-wider uppercase"
              aria-invalid={!!shown.code || undefined}
            />
          )}
        </Field>
        <Field label="توضیحات" error={shown.description} hint="به مشتری نمایش داده می‌شود">
          {(id) => (
            <Input
              id={id}
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              maxLength={120}
              placeholder="۲۰٪ تخفیف اولین سفارش"
            />
          )}
        </Field>
      </div>

      <div className="rounded-2xl border border-stone-200 p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[13px] font-medium text-stone-700">نوع تخفیف</span>
          <Segmented
            ariaLabel="نوع تخفیف"
            value={values.type}
            onChange={(type) => set("type", type)}
            options={[
              { value: "PERCENT", label: "درصدی" },
              { value: "FIXED", label: "مبلغ ثابت" },
            ]}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={values.type === "PERCENT" ? "درصد تخفیف" : "مبلغ تخفیف"} required error={shown.value}>
            {(id) => (
              <NumberInput
                id={id}
                value={values.value}
                onValueChange={(v) => set("value", v)}
                suffix={values.type === "PERCENT" ? "٪" : "تومان"}
                aria-invalid={!!shown.value || undefined}
              />
            )}
          </Field>
          {values.type === "PERCENT" ? (
            <Field label="سقف تخفیف" hint="خالی یعنی بدون سقف">
              {(id) => <NumberInput id={id} value={values.maxDiscount} onValueChange={(v) => set("maxDiscount", v)} suffix="تومان" />}
            </Field>
          ) : (
            <div className="hidden sm:block" />
          )}
          <Field label="حداقل مبلغ سفارش" hint="مبلغ غذاها بعد از تخفیف آن‌ها، بدون هزینه‌ی ارسال">
            {(id) => <NumberInput id={id} value={values.minOrder} onValueChange={(v) => set("minOrder", v)} suffix="تومان" />}
          </Field>
          <Field label="سقف دفعات استفاده" error={shown.usageLimit} hint="خالی یعنی نامحدود">
            {(id) => <NumberInput id={id} value={values.usageLimit} onValueChange={(v) => set("usageLimit", v)} suffix="بار" />}
          </Field>
        </div>
        {values.value !== null && !errors.value && (
          <p className="mt-4 rounded-xl bg-brand-50 px-3 py-2 text-xs text-brand-800">
            خلاصه: {describeValue({ type: values.type, value: values.value, maxDiscount: values.maxDiscount })}
            {values.minOrder ? ` برای سفارش‌های بالای ${toman(values.minOrder)}` : ""}
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-stone-200 p-4">
        <label className="flex cursor-pointer items-center justify-between gap-3">
          <span>
            <span className="block text-sm font-medium text-stone-800">تاریخ انقضا</span>
            <span className="text-xs text-stone-500">کد تا پایان روز انتخاب‌شده (به وقت تهران) معتبر است.</span>
          </span>
          <Switch checked={values.hasExpiry} onCheckedChange={(v) => set("hasExpiry", v)} label="تاریخ انقضا دارد" />
        </label>
        {values.hasExpiry && (
          <div className="mt-4 space-y-2">
            <JalaliDateInput value={values.expiry} onChange={(v) => set("expiry", v)} minYear={thisYear} />
            {expiryIso && <p className="text-xs text-stone-500">معتبر تا پایان {formatDate(expiryIso)}</p>}
          </div>
        )}
      </div>

      <SwitchField
        title="فعال"
        description="کد غیرفعال در سبد خرید پذیرفته نمی‌شود."
        checked={values.isActive}
        onCheckedChange={(v) => set("isActive", v)}
      />

      <div className="flex justify-end gap-2 border-t border-stone-100 pt-4">
        <Button variant="secondary" onClick={onClose}>
          انصراف
        </Button>
        <Button type="submit" loading={saving}>
          {discount ? "ذخیره‌ی تغییرات" : "ایجاد کد"}
        </Button>
      </div>
    </form>
  );
}
