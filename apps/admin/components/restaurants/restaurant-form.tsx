"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ImageIcon, Info, Truck } from "lucide-react";
import { catalogApi } from "@/lib/api/endpoints";
import type { AdminRestaurantDetail, RestaurantInput } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { faNumber, toman } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input, NumberInput, Textarea } from "@/components/ui/field";
import { ImageUpload } from "@/components/ui/image-upload";
import { Skeleton } from "@/components/ui/skeleton";
import { SwitchField } from "@/components/ui/switch";
import { CuisineIcon } from "./cuisine-icon";

export interface RestaurantFormValues {
  name: string;
  slug: string;
  description: string;
  address: string;
  deliveryFee: number | null;
  minOrder: number | null;
  deliveryTimeMin: number | null;
  deliveryTimeMax: number | null;
  cuisineIds: number[];
  isOpen: boolean;
  isActive: boolean;
  logo: string | null;
  cover: string | null;
}

export const EMPTY_RESTAURANT: RestaurantFormValues = {
  name: "",
  slug: "",
  description: "",
  address: "",
  deliveryFee: 25000,
  minOrder: 150000,
  deliveryTimeMin: 30,
  deliveryTimeMax: 45,
  cuisineIds: [],
  isOpen: true,
  isActive: true,
  logo: null,
  cover: null,
};

export function restaurantToForm(r: AdminRestaurantDetail): RestaurantFormValues {
  return {
    name: r.name,
    slug: r.slug,
    description: r.description ?? "",
    address: r.address,
    deliveryFee: r.deliveryFee,
    minOrder: r.minOrder,
    deliveryTimeMin: r.deliveryTimeMin,
    deliveryTimeMax: r.deliveryTimeMax,
    cuisineIds: r.cuisines.map((c) => c.id),
    isOpen: r.isOpen,
    isActive: r.isActive,
    logo: r.logo,
    cover: r.cover,
  };
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_CUISINES = 5;

type Errors = Partial<Record<keyof RestaurantFormValues, string>>;

/** Client-side checks mirroring the API's validation (same Persian messages where possible). */
function validate(v: RestaurantFormValues): Errors {
  const errors: Errors = {};
  const name = v.name.trim();
  if (name.length < 2 || name.length > 60) errors.name = "نام رستوران باید ۲ تا ۶۰ حرف باشد.";
  if (!SLUG.test(v.slug) || v.slug.length > 60) errors.slug = "نامک فقط می‌تواند حروف کوچک انگلیسی، عدد و خط تیره باشد.";
  if (v.description.length > 400) errors.description = "توضیحات حداکثر ۴۰۰ حرف باشد.";
  const address = v.address.trim();
  if (address.length < 5 || address.length > 200) errors.address = "آدرس باید ۵ تا ۲۰۰ حرف باشد.";
  if (v.deliveryFee === null) errors.deliveryFee = "هزینه‌ی ارسال را وارد کنید.";
  if (v.minOrder === null) errors.minOrder = "حداقل سفارش را وارد کنید.";
  if (v.deliveryTimeMin === null || v.deliveryTimeMin < 5 || v.deliveryTimeMin > 180)
    errors.deliveryTimeMin = "بین ۵ تا ۱۸۰ دقیقه.";
  if (v.deliveryTimeMax === null || v.deliveryTimeMax < 5 || v.deliveryTimeMax > 240)
    errors.deliveryTimeMax = "بین ۵ تا ۲۴۰ دقیقه.";
  if (!errors.deliveryTimeMin && !errors.deliveryTimeMax && v.deliveryTimeMin! > v.deliveryTimeMax!)
    errors.deliveryTimeMax = "حداقل زمان ارسال نباید از حداکثر بیشتر باشد.";
  return errors;
}

function toInput(v: RestaurantFormValues): RestaurantInput {
  return {
    name: v.name.trim(),
    slug: v.slug,
    description: v.description.trim(),
    address: v.address.trim(),
    deliveryFee: v.deliveryFee!,
    minOrder: v.minOrder!,
    deliveryTimeMin: v.deliveryTimeMin!,
    deliveryTimeMax: v.deliveryTimeMax!,
    cuisineIds: v.cuisineIds,
    isOpen: v.isOpen,
    isActive: v.isActive,
    logo: v.logo,
    cover: v.cover,
  };
}

interface RestaurantFormProps {
  initial: RestaurantFormValues;
  submitLabel: string;
  /** Resolve to true when saved; the "new" form then resets itself. */
  onSubmit: (input: RestaurantInput) => Promise<boolean>;
  resetOnSuccess?: boolean;
  extraActions?: ReactNode;
}

export function RestaurantForm({ initial, submitLabel, onSubmit, resetOnSuccess, extraActions }: RestaurantFormProps) {
  const [values, setValues] = useState(initial);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const errors = submitted ? validate(values) : {};

  const cuisines = useQuery({ queryKey: queryKeys.cuisines, queryFn: catalogApi.cuisines, staleTime: Infinity });

  const set = <K extends keyof RestaurantFormValues>(key: K, value: RestaurantFormValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  function toggleCuisine(id: number) {
    setValues((current) => {
      const has = current.cuisineIds.includes(id);
      if (!has && current.cuisineIds.length >= MAX_CUISINES) return current;
      return { ...current, cuisineIds: has ? current.cuisineIds.filter((c) => c !== id) : [...current.cuisineIds, id] };
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (Object.keys(validate(values)).length > 0) return;
    setSaving(true);
    try {
      const ok = await onSubmit(toInput(values));
      // Pages stay mounted in the background (<Activity>), so clear the "new" form explicitly.
      if (ok && resetOnSuccess) {
        setValues(initial);
        setSubmitted(false);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-6 pb-24 xl:grid-cols-3">
      <div className="space-y-6 xl:col-span-2">
        <Card>
          <CardHeader icon={<Info />} title="اطلاعات پایه" description="این اطلاعات در اپ مشتری نمایش داده می‌شود." />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="نام رستوران" required error={errors.name}>
              {(id) => (
                <Input
                  id={id}
                  value={values.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="مثلاً پیتزا ناپل‌نو"
                  maxLength={60}
                  aria-invalid={!!errors.name || undefined}
                />
              )}
            </Field>
            <Field
              label="نامک (آدرس اینترنتی)"
              required
              error={errors.slug}
              hint="حروف کوچک انگلیسی، عدد و خط تیره؛ مثل napoli-no"
            >
              {(id) => (
                <Input
                  id={id}
                  dir="ltr"
                  value={values.slug}
                  onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                  placeholder="napoli-no"
                  maxLength={60}
                  className="text-left font-mono"
                  aria-invalid={!!errors.slug || undefined}
                />
              )}
            </Field>
            <Field label="توضیحات" error={errors.description} hint={`${faNumber(values.description.length)} از ۴۰۰ حرف`} className="sm:col-span-2">
              {(id) => (
                <Textarea
                  id={id}
                  value={values.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="معرفی کوتاه رستوران و غذاهای ویژه‌اش"
                  maxLength={400}
                  rows={3}
                />
              )}
            </Field>
            <Field label="آدرس" required error={errors.address} className="sm:col-span-2">
              {(id) => (
                <Input
                  id={id}
                  value={values.address}
                  onChange={(e) => set("address", e.target.value)}
                  placeholder="تهران، سعادت‌آباد، میدان کاج"
                  maxLength={200}
                  aria-invalid={!!errors.address || undefined}
                />
              )}
            </Field>
          </div>

          <div className="border-t border-stone-100 p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[13px] font-medium text-stone-700">دسته‌بندی غذا</span>
              <span className="tabular text-xs text-stone-400">
                {faNumber(values.cuisineIds.length)} از {faNumber(MAX_CUISINES)} انتخاب
              </span>
            </div>
            {cuisines.data ? (
              <div className="flex flex-wrap gap-2" role="group" aria-label="دسته‌بندی غذا">
                {cuisines.data.map((cuisine) => {
                  const selected = values.cuisineIds.includes(cuisine.id);
                  const full = !selected && values.cuisineIds.length >= MAX_CUISINES;
                  return (
                    <button
                      key={cuisine.id}
                      type="button"
                      aria-pressed={selected}
                      disabled={full}
                      onClick={() => toggleCuisine(cuisine.id)}
                      className={cn(
                        "flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-40",
                        selected
                          ? "border-brand-200 bg-brand-50 font-medium text-brand-700"
                          : "border-stone-200 bg-white text-stone-600 hover:border-stone-300",
                      )}
                    >
                      {selected ? <Check className="size-4" /> : <CuisineIcon icon={cuisine.icon} className="size-4 text-stone-400" />}
                      {cuisine.name}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 8 }, (_, i) => (
                  <Skeleton key={i} className="h-9 w-24 rounded-full" />
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader icon={<Truck />} title="ارسال و سفارش" description="مبالغ به تومان و زمان‌ها به دقیقه است." />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="هزینه‌ی ارسال" required error={errors.deliveryFee} hint={values.deliveryFee === 0 ? "ارسال رایگان" : undefined}>
              {(id) => <NumberInput id={id} value={values.deliveryFee} onValueChange={(v) => set("deliveryFee", v)} suffix="تومان" />}
            </Field>
            <Field label="حداقل مبلغ سفارش" required error={errors.minOrder}>
              {(id) => <NumberInput id={id} value={values.minOrder} onValueChange={(v) => set("minOrder", v)} suffix="تومان" />}
            </Field>
            <Field label="حداقل زمان ارسال" required error={errors.deliveryTimeMin}>
              {(id) => <NumberInput id={id} value={values.deliveryTimeMin} onValueChange={(v) => set("deliveryTimeMin", v)} suffix="دقیقه" />}
            </Field>
            <Field label="حداکثر زمان ارسال" required error={errors.deliveryTimeMax}>
              {(id) => <NumberInput id={id} value={values.deliveryTimeMax} onValueChange={(v) => set("deliveryTimeMax", v)} suffix="دقیقه" />}
            </Field>
          </div>
          {values.deliveryTimeMin !== null && values.deliveryTimeMax !== null && values.deliveryFee !== null && (
            <p className="tabular border-t border-stone-100 px-5 py-3 text-xs text-stone-500">
              در اپ: ارسال در {faNumber(values.deliveryTimeMin)} تا {faNumber(values.deliveryTimeMax)} دقیقه ·{" "}
              {values.deliveryFee ? `هزینه‌ی پیک ${toman(values.deliveryFee)}` : "ارسال رایگان"}
            </p>
          )}
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader icon={<ImageIcon />} title="تصاویر" description="تصویر به‌صورت WebP بهینه و ذخیره می‌شود (حداکثر ۸ مگابایت)." />
          <div className="space-y-4 p-5">
            <div>
              <p className="mb-2 text-[13px] font-medium text-stone-700">تصویر کاور</p>
              <ImageUpload value={values.cover} onChange={(v) => set("cover", v)} shape="wide" label="تصویر کاور" />
            </div>
            <div>
              <p className="mb-2 text-[13px] font-medium text-stone-700">لوگو</p>
              <ImageUpload value={values.logo} onChange={(v) => set("logo", v)} label="لوگو" className="w-32" />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="وضعیت" />
          <div className="space-y-3 p-5">
            <SwitchField
              title="رستوران باز است"
              description="رستوران بسته در اپ نمایش داده می‌شود ولی سفارش نمی‌گیرد."
              checked={values.isOpen}
              onCheckedChange={(v) => set("isOpen", v)}
            />
            <SwitchField
              title="فعال (نمایش در اپ)"
              description="رستوران غیرفعال از اپ مشتری پنهان می‌شود."
              checked={values.isActive}
              onCheckedChange={(v) => set("isActive", v)}
            />
          </div>
        </Card>
      </div>

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200/80 bg-white/90 backdrop-blur-md lg:pr-68">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">{extraActions}</div>
          <Button type="submit" loading={saving} className="min-w-36">
            {submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
