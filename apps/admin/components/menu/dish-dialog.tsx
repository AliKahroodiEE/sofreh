"use client";

import { useState, type FormEvent } from "react";
import type { MenuItem, MenuItemInput, MenuSection } from "@/lib/api/types";
import { toman } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Field, Input, NumberInput, Select, Textarea } from "@/components/ui/field";
import { ImageUpload } from "@/components/ui/image-upload";
import { Modal } from "@/components/ui/modal";
import { SwitchField } from "@/components/ui/switch";

/** Price the customer pays (same rounding as the API). */
export function finalPrice(price: number, discountPercent: number) {
  return Math.round((price * (100 - discountPercent)) / 100);
}

interface DishDialogProps {
  open: boolean;
  onClose: () => void;
  sections: MenuSection[];
  /** Section to preselect for a new dish. */
  sectionId: number;
  /** Present when editing. */
  dish?: MenuItem;
  onSubmit: (input: MenuItemInput) => Promise<unknown>;
}

export function DishDialog({ open, onClose, dish, ...rest }: DishDialogProps) {
  return (
    <Modal open={open} onClose={onClose} size="lg" title={dish ? "ویرایش غذا" : "غذای جدید"} description={dish?.name}>
      <DishForm dish={dish} onClose={onClose} {...rest} />
    </Modal>
  );
}

function DishForm({ sections, sectionId, dish, onSubmit, onClose }: Omit<DishDialogProps, "open">) {
  const [values, setValues] = useState({
    sectionId: dish?.sectionId ?? sectionId,
    name: dish?.name ?? "",
    description: dish?.description ?? "",
    price: dish?.price ?? (null as number | null),
    discountPercent: dish?.discountPercent ?? (0 as number | null),
    image: dish?.image ?? null,
    isAvailable: dish?.isAvailable ?? true,
  });
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof typeof values>(key: K, value: (typeof values)[K]) => setValues((v) => ({ ...v, [key]: value }));

  const errors = {
    name: values.name.trim().length < 1 || values.name.trim().length > 80 ? "نام غذا باید ۱ تا ۸۰ حرف باشد." : null,
    price: values.price === null || values.price > 1_000_000_000 ? "قیمت را وارد کنید." : null,
    discountPercent:
      values.discountPercent !== null && values.discountPercent > 90 ? "تخفیف حداکثر ۹۰ درصد است." : null,
    description: values.description.length > 300 ? "توضیحات حداکثر ۳۰۰ حرف باشد." : null,
  };
  const hasErrors = Object.values(errors).some(Boolean);
  const shown = submitted ? errors : { name: null, price: null, discountPercent: null, description: null };
  const discount = values.discountPercent ?? 0;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (hasErrors) return;
    setSaving(true);
    try {
      await onSubmit({
        sectionId: values.sectionId,
        name: values.name.trim(),
        description: values.description.trim() || null,
        price: values.price!,
        discountPercent: discount,
        image: values.image,
        isAvailable: values.isAvailable,
      });
      onClose();
    } catch {
      // Error toast comes from the mutation.
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-5 sm:grid-cols-[10rem_minmax(0,1fr)]">
      <div>
        <p className="mb-2 text-[13px] font-medium text-stone-700">تصویر غذا</p>
        <ImageUpload value={values.image} onChange={(v) => set("image", v)} label="تصویر غذا" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="نام غذا" required error={shown.name} className="sm:col-span-2">
          {(id) => <Input id={id} value={values.name} onChange={(e) => set("name", e.target.value)} maxLength={80} placeholder="پیتزا مارگاریتا" />}
        </Field>
        <Field label="توضیحات" error={shown.description} className="sm:col-span-2">
          {(id) => (
            <Textarea
              id={id}
              rows={2}
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              maxLength={300}
              placeholder="مواد اصلی و توضیح کوتاه"
            />
          )}
        </Field>
        <Field label="قیمت" required error={shown.price}>
          {(id) => <NumberInput id={id} value={values.price} onValueChange={(v) => set("price", v)} suffix="تومان" />}
        </Field>
        <Field label="درصد تخفیف" error={shown.discountPercent} hint="۰ یعنی بدون تخفیف">
          {(id) => <NumberInput id={id} value={values.discountPercent} onValueChange={(v) => set("discountPercent", v)} suffix="٪" maxLength={2} />}
        </Field>
        {values.price !== null && discount > 0 && discount <= 90 && (
          <p className="tabular -mt-1 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-800 sm:col-span-2">
            قیمت برای مشتری: <span className="font-bold">{toman(finalPrice(values.price, discount))}</span>{" "}
            <span className="text-emerald-700/70 line-through">{toman(values.price)}</span>
          </p>
        )}
        <Field label="بخش منو" className="sm:col-span-2">
          {(id) => (
            <Select id={id} value={values.sectionId} onChange={(e) => set("sectionId", Number(e.target.value))}>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <SwitchField
          className="sm:col-span-2"
          title="موجود است"
          description="غذای ناموجود در منو دیده می‌شود ولی قابل سفارش نیست."
          checked={values.isAvailable}
          onCheckedChange={(v) => set("isAvailable", v)}
        />
      </div>

      <div className="flex justify-end gap-2 border-t border-stone-100 pt-4 sm:col-span-2">
        <Button variant="secondary" onClick={onClose}>
          انصراف
        </Button>
        <Button type="submit" loading={saving}>
          {dish ? "ذخیره‌ی تغییرات" : "افزودن غذا"}
        </Button>
      </div>
    </form>
  );
}
